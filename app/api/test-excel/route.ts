import { NextRequest, NextResponse } from 'next/server'
import { GoogleFormsAnalyzer } from '@/lib/excel'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Excel解析テストを開始...')

    // FormDataからファイルを取得
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'ファイルが指定されていません'
      }, { status: 400 })
    }

    // ファイル形式チェック
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `サポートされていないファイル形式です: ${file.type}`,
        allowedTypes: ['.xlsx', '.xls', '.csv']
      }, { status: 400 })
    }

    // ファイルサイズチェック（10MB制限）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: `ファイルサイズが大きすぎます: ${Math.round(file.size / 1024 / 1024)}MB（最大: 10MB）`
      }, { status: 400 })
    }

    console.log('📄 ファイル情報:', {
      name: file.name,
      type: file.type,
      size: `${Math.round(file.size / 1024)}KB`
    })

    // Excel解析実行
    const analyzer = new GoogleFormsAnalyzer()
    const result = await analyzer.processFile(file, {
      skipEmptyRows: true,
      headerRow: 0
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Excel解析に失敗しました',
        details: result.error,
        parseResult: result.parseResult
      }, { status: 500 })
    }

    // 分析結果のサマリー生成
    const summary = analyzer.generateSummary()
    const validation = analyzer.validateData()

    // レスポンス用にデータを整形
    const responseData = {
      metadata: result.parseResult?.metadata,
      basicStats: result.basicStats,
      summary,
      validation,
      analysisResults: {
        total: result.analysisData?.length || 0,
        byType: {
          distribution: result.analysisData?.filter(a => a.analysisType === 'distribution').length || 0,
          multipleChoice: result.analysisData?.filter(a => a.analysisType === 'multipleChoice').length || 0,
          textAnalysis: result.analysisData?.filter(a => a.analysisType === 'textAnalysis').length || 0
        }
      },
      sampleAnalysis: {
        // サンプルとして最初の3つの分析結果を含める
        data: result.analysisData?.slice(0, 3) || []
      }
    }

    console.log('✅ Excel解析テスト完了:', {
      totalResponses: result.basicStats?.totalResponses,
      analysisResults: result.analysisData?.length,
      dataQuality: summary.overview.dataQuality
    })

    return NextResponse.json({
      success: true,
      message: 'Excel解析が正常に完了しました！',
      data: responseData
    })

  } catch (error) {
    console.error('❌ Excel解析テストエラー:', error)
    return NextResponse.json({
      success: false,
      error: '予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // サンプルデータでのテスト
    console.log('🔄 Excel解析エンジンの基本テストを実行...')

    // サンプルCSVデータを作成
    const sampleCsvData = `タイムスタンプ,会社名,職種,性別,年代,勤続年数,職場環境への満足度,ワークライフバランス,総合満足度,改善提案・要望
2024-12-19 10:00:00,ダイセーホールディングス,営業,男性,30代,5-10年,満足,どちらでもない,満足,特になし
2024-12-19 10:05:00,ダイセー運輸,ドライバー,男性,40代,10-15年,どちらでもない,不満,どちらでもない,労働時間の改善
2024-12-19 10:10:00,ダイセーロジスティクス,事務,女性,20代,1-3年,満足,満足,満足,研修制度の充実
2024-12-19 10:15:00,ダイセーホールディングス,管理,男性,50代,15年以上,非常に満足,満足,非常に満足,現状で満足
2024-12-19 10:20:00,ダイセー運輸,整備,男性,30代,3-5年,不満,どちらでもない,不満,設備の改善が必要`

    const blob = new Blob([sampleCsvData], { type: 'text/csv' })
    const file = new File([blob], 'sample-survey.csv', { type: 'text/csv' })

    // 解析実行
    const analyzer = new GoogleFormsAnalyzer()
    const result = await analyzer.processFile(file)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'サンプルデータの解析に失敗しました',
        details: result.error
      }, { status: 500 })
    }

    const summary = analyzer.generateSummary()
    const validation = analyzer.validateData()

    console.log('✅ Excel解析エンジンの基本テスト完了')

    return NextResponse.json({
      success: true,
      message: 'Excel解析エンジンが正常に動作しています！',
      testResults: {
        sampleDataProcessed: true,
        totalResponses: result.basicStats?.totalResponses || 0,
        analysisTypes: result.analysisData?.map(a => a.analysisType) || [],
        dataQuality: summary.overview.dataQuality,
        validation: validation.isValid
      },
      capabilities: [
        'Excelファイル解析（.xlsx, .xls）',
        'CSVファイル解析',
        '5段階評価の分布分析',
        '選択肢の集計分析',
        'テキストのカテゴリ分析',
        '職種別・年代別分析',
        'データ品質チェック',
        '統計サマリー生成'
      ]
    })

  } catch (error) {
    console.error('❌ Excel解析エンジンテストエラー:', error)
    return NextResponse.json({
      success: false,
      error: '予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 })
  }
}