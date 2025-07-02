import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')
    const analysisType = searchParams.get('analysisType') || 'distribution'
    const filter = searchParams.get('filter') // company, age, jobType etc.

    const supabase = await createClient()

    // アップロードデータを取得
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !upload) {
      return NextResponse.json(
        { error: 'データが見つかりません' },
        { status: 404 }
      )
    }

    const { data: analysisData, error: analysisError } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('upload_id', upload.id)

    if (analysisError || !analysisData) {
      return NextResponse.json(
        { error: '分析データが存在しません' },
        { status: 404 }
      )
    }

    // 特定の設問の分析結果を取得
    if (questionId) {
      const questionAnalysis = findQuestionAnalysis(analysisData, questionId, analysisType)

      if (!questionAnalysis) {
        return NextResponse.json(
          { error: '指定された設問の分析データが見つかりません' },
          { status: 404 }
        )
      }

      // フィルターが指定されている場合
      if (filter) {
        const filteredData = applyFilter(questionAnalysis, filter)
        return NextResponse.json({ analysis: filteredData })
      }

      return NextResponse.json({ analysis: questionAnalysis })
    }

    // 全体の分析結果を返す
    return NextResponse.json({
      analysis: analysisData,
      summary: analysisData.summary || null
    })

  } catch (error) {
    console.error('Analysis fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 設問分析データを検索するヘルパー関数
function findQuestionAnalysis(analysisData: any, questionId: string, analysisType: string) {
  if (!analysisData.analysisData || !Array.isArray(analysisData.analysisData)) {
    return null
  }

  return analysisData.analysisData.find((item: any) =>
    item.questionId === questionId && item.type === analysisType
  )
}

// フィルターを適用するヘルパー関数
function applyFilter(analysis: any, filter: string) {
  // フィルター処理の実装
  // 例: 会社別、年代別、職種別のフィルタリング

  if (!analysis.data || !Array.isArray(analysis.data)) {
    return analysis
  }

  const [filterType, filterValue] = filter.split(':')

  switch (filterType) {
    case 'company':
      return {
        ...analysis,
        data: analysis.data.filter((item: any) =>
          item.company === filterValue
        )
      }
    case 'age':
      return {
        ...analysis,
        data: analysis.data.filter((item: any) =>
          item.ageGroup === filterValue
        )
      }
    case 'jobType':
      return {
        ...analysis,
        data: analysis.data.filter((item: any) =>
          item.jobType === filterValue
        )
      }
    default:
      return analysis
  }
}
