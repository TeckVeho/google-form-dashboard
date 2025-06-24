import { NextResponse } from 'next/server'
import { ExcelParser } from '@/lib/excel/parser'

export async function GET() {
  try {
    console.log('🔄 Excel解析エンジンのデバッグテストを実行...')

    // より詳細なサンプルCSVデータを作成
    const sampleCsvData = [
      'タイムスタンプ,会社名,職種,性別,年代,勤続年数,職場環境への満足度,ワークライフバランス,総合満足度,改善提案・要望',
      '2024-12-19 10:00:00,ダイセーホールディングス,営業,男性,30代,5-10年,4,3,4,特になし',
      '2024-12-19 10:05:00,ダイセー運輸,ドライバー,男性,40代,10-15年,3,2,3,労働時間の改善',
      '2024-12-19 10:10:00,ダイセーロジスティクス,事務,女性,20代,1-3年,4,4,4,研修制度の充実',
      '2024-12-19 10:15:00,ダイセーホールディングス,管理,男性,50代,15年以上,5,4,5,現状で満足',
      '2024-12-19 10:20:00,ダイセー運輸,整備,男性,30代,3-5年,2,3,2,設備の改善が必要'
    ].join('\n')

    const blob = new Blob([sampleCsvData], { type: 'text/csv' })
    const buffer = await blob.arrayBuffer()

    console.log('📄 サンプルCSVデータ:')
    console.log(sampleCsvData)

    // 解析実行
    const parser = new ExcelParser()
    const parseResult = await parser.parseFile(Buffer.from(buffer), {
      skipEmptyRows: true,
      headerRow: 0
    })

    console.log('📊 解析結果:', {
      success: parseResult.success,
      dataLength: parseResult.data?.length || 0,
      errors: parseResult.errors,
      warnings: parseResult.warnings
    })

    // メタデータの詳細確認
    if (parseResult.metadata) {
      console.log('📋 メタデータ:', {
        fileName: parseResult.metadata.fileName,
        totalRows: parseResult.metadata.totalRows,
        dataRows: parseResult.metadata.dataRows,
        totalColumns: parseResult.metadata.totalColumns,
        columns: parseResult.metadata.columns.map(c => ({
          header: c.header,
          questionId: c.questionId,
          dataType: c.dataType
        }))
      })
    }

    // 個別の回答データを確認
    if (parseResult.data && parseResult.data.length > 0) {
      console.log('📝 最初の回答データ:', parseResult.data[0])
    }

    return NextResponse.json({
      success: parseResult.success,
      message: 'デバッグテスト完了',
      debugInfo: {
        parseResult: {
          success: parseResult.success,
          dataCount: parseResult.data?.length || 0,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
          metadata: parseResult.metadata,
          sampleData: parseResult.data?.slice(0, 2) || []
        },
        csvInput: {
          size: buffer.byteLength,
          lines: sampleCsvData.split('\n').length,
          headers: sampleCsvData.split('\n')[0]
        }
      }
    })

  } catch (error) {
    console.error('❌ デバッグテストエラー:', error)
    return NextResponse.json({
      success: false,
      error: '予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : '不明なエラー',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}