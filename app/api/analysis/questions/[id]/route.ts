import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // アップロードデータを取得
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('analysis_data')
      .eq('id', params.id)
      .single()

    if (error || !upload) {
      return NextResponse.json(
        { error: 'データが見つかりません' },
        { status: 404 }
      )
    }

    const analysisData = upload.analysis_data

    if (!analysisData || !analysisData.parseResult) {
      return NextResponse.json(
        { error: '分析データが存在しません' },
        { status: 404 }
      )
    }

    // 設問一覧を生成
    const questions = generateQuestionsList(analysisData)

    return NextResponse.json({ questions })

  } catch (error) {
    console.error('Questions fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 設問一覧を生成する関数
function generateQuestionsList(analysisData: any) {
  const questions: any[] = []

  // パースされたデータから設問を抽出
  if (analysisData.parseResult?.metadata?.headers) {
    const headers = analysisData.parseResult.metadata.headers
    
    headers.forEach((header: string, index: number) => {
      // システム項目をスキップ
      if (isSystemField(header)) {
        return
      }

      const questionId = generateQuestionId(header)
      const questionType = detectQuestionType(header, analysisData)
      
      questions.push({
        id: questionId,
        originalHeader: header,
        label: cleanQuestionLabel(header),
        type: questionType,
        hasAnalysis: hasAnalysisData(analysisData, questionId),
        analysisTypes: getAvailableAnalysisTypes(analysisData, questionId, questionType)
      })
    })
  }

  // 分析データから追加の設問情報を取得
  if (analysisData.analysisData && Array.isArray(analysisData.analysisData)) {
    const analysisQuestions = new Set<string>(
      analysisData.analysisData.map((item: any) => item.questionId as string)
    )

    analysisQuestions.forEach((questionId: string) => {
      if (!questions.find(q => q.id === questionId)) {
        questions.push({
          id: questionId,
          originalHeader: questionId,
          label: getQuestionLabel(questionId),
          type: 'unknown',
          hasAnalysis: true,
          analysisTypes: getAvailableAnalysisTypes(analysisData, questionId, 'unknown')
        })
      }
    })
  }

  return questions.sort((a, b) => a.label.localeCompare(b.label))
}

// システム項目かどうかを判定
function isSystemField(header: string): boolean {
  const systemFields = [
    'timestamp', 'タイムスタンプ', '時刻',
    'email', 'メールアドレス', 'メール',
    'name', '名前', '氏名'
  ]
  
  return systemFields.some(field => 
    header.toLowerCase().includes(field.toLowerCase())
  )
}

// 設問IDを生成
function generateQuestionId(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

// 設問タイプを検出
function detectQuestionType(header: string, analysisData: any): string {
  const headerLower = header.toLowerCase()
  
  if (headerLower.includes('満足') || headerLower.includes('評価')) {
    return 'likert'
  }
  
  if (headerLower.includes('年代') || headerLower.includes('年齢')) {
    return 'demographic'
  }
  
  if (headerLower.includes('会社') || headerLower.includes('企業')) {
    return 'categorical'
  }
  
  if (headerLower.includes('職種') || headerLower.includes('部署')) {
    return 'categorical'
  }
  
  if (headerLower.includes('コメント') || headerLower.includes('意見') || 
      headerLower.includes('感想') || headerLower.includes('要望')) {
    return 'text'
  }
  
  // 選択肢の数で判定を試行
  if (analysisData.parseResult?.data) {
    const sampleData = analysisData.parseResult.data.slice(0, 100)
    const uniqueValues = new Set(
      sampleData.map((row: any) => row.answers[generateQuestionId(header)])
        .filter((val: any) => val != null && val !== '')
    )
    
    if (uniqueValues.size <= 10) {
      return 'categorical'
    } else if (uniqueValues.size > 50) {
      return 'text'
    }
  }
  
  return 'categorical'
}

// 設問ラベルをクリーンアップ
function cleanQuestionLabel(header: string): string {
  return header
    .replace(/^\d+\.\s*/, '') // 先頭の番号を削除
    .replace(/\s*\[.*?\]\s*$/, '') // 末尾の[必須]等を削除
    .trim()
}

// 分析データが存在するかチェック
function hasAnalysisData(analysisData: any, questionId: string): boolean {
  if (!analysisData.analysisData || !Array.isArray(analysisData.analysisData)) {
    return false
  }
  
  return analysisData.analysisData.some((item: any) => item.questionId === questionId)
}

// 利用可能な分析タイプを取得
function getAvailableAnalysisTypes(analysisData: any, questionId: string, questionType: string): string[] {
  const types = []
  
  if (!analysisData.analysisData || !Array.isArray(analysisData.analysisData)) {
    return getDefaultAnalysisTypes(questionType)
  }
  
  const questionAnalyses = analysisData.analysisData.filter((item: any) => 
    item.questionId === questionId
  )
  
  if (questionAnalyses.length > 0) {
    return questionAnalyses.map((item: any) => item.type)
  }
  
  return getDefaultAnalysisTypes(questionType)
}

// デフォルトの分析タイプを取得
function getDefaultAnalysisTypes(questionType: string): string[] {
  switch (questionType) {
    case 'likert':
      return ['distribution', 'demographic', 'jobType']
    case 'categorical':
      return ['distribution', 'multipleChoice']
    case 'text':
      return ['textAnalysis']
    case 'demographic':
      return ['distribution']
    default:
      return ['distribution']
  }
}

// 設問IDをラベルに変換
function getQuestionLabel(questionId: string): string {
  const labels: { [key: string]: string } = {
    'overall_satisfaction': '全体満足度',
    'work_environment': '職場環境満足度',
    'work_life_balance': 'ワークライフバランス',
    'job_satisfaction': '仕事への満足度',
    'compensation': '給与・待遇満足度',
    'management_trust': '経営への信頼度',
    'company_name': '会社名',
    'job_type': '職種',
    'age_group': '年代',
    'experience_years': '勤続年数'
  }
  
  return labels[questionId] || questionId
}