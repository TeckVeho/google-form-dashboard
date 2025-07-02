import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params
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

    if (!analysisData) {
      return NextResponse.json(
        { error: '分析データが存在しません' },
        { status: 404 }
      )
    }

    // サマリー情報を生成
    const summary = {
      upload: {
        id: id,
        filename: upload.filename,
        year: upload.year,
        totalResponses: upload.total_responses,
        uploadedAt: upload.created_at
      },
      overview: analysisData.summary?.overview || {
        totalResponses: upload.total_responses,
        validResponses: upload.total_responses,
        completionRate: 100,
        dataQuality: 'good'
      },
      highlights: analysisData.summary?.highlights || {
        highestSatisfaction: null,
        lowestSatisfaction: null,
        topConcerns: [],
        topSuggestions: []
      },
      demographics: analysisData.summary?.demographics || {},
      keyMetrics: generateKeyMetrics(analysisData),
      chartData: generateChartData(analysisData)
    }

    return NextResponse.json({ summary })

  } catch (error) {
    console.error('Summary fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 主要指標を生成
function generateKeyMetrics(analysisData: any) {
  if (!analysisData.analysisData || !Array.isArray(analysisData.analysisData)) {
    return []
  }

  const metrics = []

  // 全体満足度
  const overallSatisfaction = analysisData.analysisData.find((item: any) =>
    item.questionId === 'overall_satisfaction' && item.type === 'distribution'
  )

  if (overallSatisfaction) {
    metrics.push({
      key: 'overall_satisfaction',
      label: '全体満足度',
      value: overallSatisfaction.averageScore || 0,
      unit: '点',
      trend: 'stable', // 前回との比較があれば算出
      color: overallSatisfaction.averageScore >= 3.5 ? 'green' :
             overallSatisfaction.averageScore >= 2.5 ? 'yellow' : 'red'
    })
  }

  // 職場環境満足度
  const workEnvironment = analysisData.analysisData.find((item: any) =>
    item.questionId === 'work_environment' && item.type === 'distribution'
  )

  if (workEnvironment) {
    metrics.push({
      key: 'work_environment',
      label: '職場環境満足度',
      value: workEnvironment.averageScore || 0,
      unit: '点',
      trend: 'stable',
      color: workEnvironment.averageScore >= 3.5 ? 'green' :
             workEnvironment.averageScore >= 2.5 ? 'yellow' : 'red'
    })
  }

  // ワークライフバランス
  const workLifeBalance = analysisData.analysisData.find((item: any) =>
    item.questionId === 'work_life_balance' && item.type === 'distribution'
  )

  if (workLifeBalance) {
    metrics.push({
      key: 'work_life_balance',
      label: 'ワークライフバランス',
      value: workLifeBalance.averageScore || 0,
      unit: '点',
      trend: 'stable',
      color: workLifeBalance.averageScore >= 3.5 ? 'green' :
             workLifeBalance.averageScore >= 2.5 ? 'yellow' : 'red'
    })
  }

  return metrics
}

// チャート用データを生成
function generateChartData(analysisData: any) {
  if (!analysisData.analysisData || !Array.isArray(analysisData.analysisData)) {
    return {}
  }

  const chartData: any = {
    satisfactionTrend: [],
    demographicBreakdown: [],
    topConcerns: []
  }

  // 満足度トレンド（主要項目）
  const satisfactionQuestions = [
    'overall_satisfaction',
    'work_environment',
    'work_life_balance',
    'job_satisfaction',
    'compensation',
    'management_trust'
  ]

  satisfactionQuestions.forEach(questionId => {
    const analysis = analysisData.analysisData.find((item: any) =>
      item.questionId === questionId && item.type === 'distribution'
    )

    if (analysis && analysis.averageScore) {
      chartData.satisfactionTrend.push({
        question: getQuestionLabel(questionId),
        score: analysis.averageScore,
        questionId
      })
    }
  })

  // 年代別内訳
  const ageAnalysis = analysisData.analysisData.find((item: any) =>
    item.type === 'demographic' && item.questionId === 'age'
  )

  if (ageAnalysis && ageAnalysis.distribution) {
    chartData.demographicBreakdown = Object.entries(ageAnalysis.distribution).map(([age, count]) => ({
      category: age,
      count: count as number,
      percentage: Math.round((count as number) / ageAnalysis.total * 100)
    }))
  }

  return chartData
}

// 設問IDをラベルに変換
function getQuestionLabel(questionId: string): string {
  const labels: { [key: string]: string } = {
    'overall_satisfaction': '全体満足度',
    'work_environment': '職場環境',
    'work_life_balance': 'ワークライフバランス',
    'job_satisfaction': '仕事への満足度',
    'compensation': '給与・待遇',
    'management_trust': '経営への信頼'
  }

  return labels[questionId] || questionId
}
