import * as XLSX from 'xlsx'
import type { 
  ExcelParseOptions, 
  ExcelParseResult, 
  ExcelMetadata, 
  ColumnInfo, 
  SurveyResponse,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from './types'

/**
 * GoogleフォームからエクスポートされたExcelファイルを解析
 */
export class ExcelParser {
  private workbook: XLSX.WorkBook | null = null
  private metadata: ExcelMetadata | null = null

  /**
   * Excelファイルの解析
   */
  async parseFile(file: File | Buffer, options: ExcelParseOptions = {}): Promise<ExcelParseResult> {
    try {
      console.log('🔄 Excelファイル解析開始:', file instanceof File ? file.name : 'Buffer')

      // ファイルを読み込み
      const buffer = file instanceof File ? await file.arrayBuffer() : file
      this.workbook = XLSX.read(new Uint8Array(buffer), { 
        type: 'array',
        cellText: true,
        cellDates: true,
        dateNF: 'yyyy-mm-dd hh:mm:ss',
        codepage: 65001 // UTF-8エンコーディングを強制
      })

      if (!this.workbook) {
        throw new Error('Excelファイルの読み込みに失敗しました')
      }

      // シート選択
      const sheetName = options.sheetName || this.workbook.SheetNames[0]
      const worksheet = this.workbook.Sheets[sheetName]

      if (!worksheet) {
        throw new Error(`シート '${sheetName}' が見つかりません`)
      }

      // メタデータ生成
      this.metadata = this.generateMetadata(
        file instanceof File ? file.name : 'uploaded-file.xlsx',
        sheetName,
        worksheet,
        options
      )

      // データ解析
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        range: options.headerRow || 0,
        blankrows: !options.skipEmptyRows,
        defval: null
      }) as any[][]

      if (rawData.length === 0) {
        throw new Error('データが見つかりません')
      }

      // ヘッダー行とデータ行を分離
      const headerRow = rawData[0]
      const dataRows = rawData.slice(1)

      // カラム情報を生成
      const columns = this.analyzeColumns(headerRow, dataRows)
      this.metadata.columns = columns

      // データを構造化
      const responses = this.parseResponses(headerRow, dataRows, columns)

      // バリデーション実行
      const validation = this.validateData(responses, columns)

      console.log('✅ Excel解析完了:', {
        totalRows: this.metadata.totalRows,
        dataRows: this.metadata.dataRows,
        columns: this.metadata.totalColumns,
        validResponses: responses.filter(r => !r.metadata.hasErrors).length
      })

      return {
        success: true,
        data: responses,
        metadata: this.metadata,
        errors: validation.errors.map(e => e.message),
        warnings: validation.warnings.map(w => w.message)
      }

    } catch (error) {
      console.error('❌ Excel解析エラー:', error)
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '不明なエラーが発生しました'],
        warnings: []
      }
    }
  }

  /**
   * メタデータ生成
   */
  private generateMetadata(
    fileName: string,
    sheetName: string,
    worksheet: XLSX.WorkSheet,
    options: ExcelParseOptions
  ): ExcelMetadata {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const totalRows = range.e.r + 1
    const totalColumns = range.e.c + 1
    const headerRow = options.headerRow || 0
    const dataRows = Math.max(0, totalRows - headerRow - 1)

    return {
      fileName,
      sheetName,
      totalRows,
      totalColumns,
      headerRow,
      dataRows,
      processedAt: new Date().toISOString(),
      columns: [] // 後で設定
    }
  }

  /**
   * カラム分析
   */
  private analyzeColumns(headerRow: any[], dataRows: any[][]): ColumnInfo[] {
    return headerRow.map((header, index) => {
      const columnData = dataRows.map(row => row[index]).filter(val => val != null && val !== '')
      const sampleValues = columnData.slice(0, 5).map(val => String(val))
      const nullCount = dataRows.length - columnData.length

      return {
        index,
        header: String(header || `列${index + 1}`),
        dataType: this.inferDataType(columnData),
        sampleValues,
        nullCount,
        questionId: this.mapToQuestionId(String(header || ''))
      }
    })
  }

  /**
   * データ型推論
   */
  private inferDataType(values: any[]): 'string' | 'number' | 'date' | 'boolean' | 'mixed' {
    if (values.length === 0) return 'string'

    const types = new Set()
    
    for (const value of values.slice(0, 10)) { // 最初の10個をチェック
      if (typeof value === 'number') {
        types.add('number')
      } else if (value instanceof Date) {
        types.add('date')
      } else if (typeof value === 'boolean') {
        types.add('boolean')
      } else {
        const str = String(value)
        // 数値パターンチェック
        if (/^\d+(\.\d+)?$/.test(str)) {
          types.add('number')
        }
        // 日付パターンチェック
        else if (/\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(str)) {
          types.add('date')
        }
        // 5段階評価パターン
        else if (/^[1-5]$/.test(str) || ['非常に満足', '満足', 'どちらでもない', '不満', '非常に不満'].includes(str)) {
          types.add('number')
        } else {
          types.add('string')
        }
      }
    }

    if (types.size === 1) {
      return Array.from(types)[0] as any
    } else if (types.size > 1) {
      return 'mixed'
    } else {
      return 'string'
    }
  }

  /**
   * ヘッダーから設問IDへのマッピング
   */
  private mapToQuestionId(header: string): string | undefined {
    const mapping: { [key: string]: string } = {
      'タイムスタンプ': 'timestamp',
      '会社名': 'company_name',
      '職種': 'job_type',
      '性別': 'gender',
      '年代': 'age',
      '勤続年数': 'years_of_service',
      '職場環境への満足度': 'work_environment',
      'ワークライフバランス': 'work_life_balance',
      '職場の人間関係': 'workplace_relationships',
      '設備・施設の充実度': 'equipment_facilities',
      '仕事内容への満足度': 'job_satisfaction',
      'スキル活用度': 'skill_utilization',
      '業務負荷の適正性': 'workload',
      '業務の自主性': 'autonomy',
      '成長機会の提供': 'growth_opportunities',
      'キャリア開発支援': 'career_development',
      '研修・教育制度': 'training_programs',
      '昇進・昇格の公平性': 'promotion_fairness',
      '給与・賞与への満足度': 'compensation',
      '福利厚生の充実度': 'benefits',
      '人事評価制度': 'evaluation_system',
      '雇用の安定性': 'job_security',
      '経営陣への信頼': 'management_trust',
      '社内コミュニケーション': 'communication',
      '会社の方向性への共感': 'company_direction',
      '組織文化・風土': 'organizational_culture',
      '総合満足度': 'overall_satisfaction',
      '他者への推奨度': 'recommendation',
      '改善提案・要望': 'improvement_suggestions',
      '不安・懸念事項': 'concerns'
    }

    // 完全一致
    if (mapping[header]) {
      return mapping[header]
    }

    // 部分一致
    for (const [key, value] of Object.entries(mapping)) {
      if (header.includes(key) || key.includes(header)) {
        return value
      }
    }

    return undefined
  }

  /**
   * 回答データの構造化
   */
  private parseResponses(headerRow: any[], dataRows: any[][], columns: ColumnInfo[]): SurveyResponse[] {
    return dataRows.map((row, index) => {
      const answers: { [questionId: string]: any } = {}
      const errors: string[] = []
      let isEmpty = true

      // 各カラムを処理
      row.forEach((value, colIndex) => {
        const column = columns[colIndex]
        if (!column) return

        if (value != null && value !== '') {
          isEmpty = false
          
          // questionIdがある場合はそれを使用、ない場合はヘッダー名を使用
          const key = column.questionId || column.header
          answers[key] = this.normalizeValue(value, column)
        }
      })

      // 必須フィールドのチェック（ヘッダー名でもチェック）
      if (!isEmpty && !answers.company_name && !answers['会社名']) {
        errors.push('会社名が入力されていません')
      }

      return {
        rowNumber: index + 2, // Excelの行番号（ヘッダー考慮）
        responseId: `response_${index + 1}`,
        timestamp: answers.timestamp ? new Date(answers.timestamp).toISOString() : undefined,
        answers,
        metadata: {
          isEmpty,
          hasErrors: errors.length > 0,
          errorMessages: errors
        }
      }
    })
  }

  /**
   * 値の正規化
   */
  private normalizeValue(value: any, column: ColumnInfo): any {
    if (value == null) return null

    // 5段階評価の正規化
    if (column.questionId && this.isSatisfactionQuestion(column.questionId)) {
      return this.normalizeSatisfactionValue(value)
    }

    // 日付の正規化
    if (column.dataType === 'date' || column.questionId === 'timestamp') {
      return this.normalizeDateValue(value)
    }

    // 文字列の正規化
    if (typeof value === 'string') {
      return value.trim()
    }

    return value
  }

  /**
   * 満足度設問の判定
   */
  private isSatisfactionQuestion(questionId: string): boolean {
    const satisfactionQuestions = [
      'work_environment', 'work_life_balance', 'workplace_relationships',
      'equipment_facilities', 'job_satisfaction', 'skill_utilization',
      'workload', 'autonomy', 'growth_opportunities', 'career_development',
      'training_programs', 'promotion_fairness', 'compensation', 'benefits',
      'evaluation_system', 'job_security', 'management_trust', 'communication',
      'company_direction', 'organizational_culture', 'overall_satisfaction',
      'recommendation'
    ]
    return satisfactionQuestions.includes(questionId)
  }

  /**
   * 満足度値の正規化
   */
  private normalizeSatisfactionValue(value: any): number {
    if (typeof value === 'number' && value >= 1 && value <= 5) {
      return value
    }

    const strValue = String(value).trim()
    const mapping: { [key: string]: number } = {
      '非常に満足': 5,
      '満足': 4,
      'どちらでもない': 3,
      '不満': 2,
      '非常に不満': 1,
      '5': 5,
      '4': 4,
      '3': 3,
      '2': 2,
      '1': 1
    }

    return mapping[strValue] || 3 // デフォルトは「どちらでもない」
  }

  /**
   * 日付値の正規化
   */
  private normalizeDateValue(value: any): string | null {
    try {
      if (value instanceof Date) {
        return value.toISOString()
      }
      
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
      
      return null
    } catch {
      return null
    }
  }

  /**
   * データバリデーション
   */
  private validateData(responses: SurveyResponse[], columns: ColumnInfo[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const suggestions: string[] = []

    // 空の回答チェック
    const emptyResponses = responses.filter(r => r.metadata.isEmpty)
    if (emptyResponses.length > 0) {
      warnings.push({
        message: `${emptyResponses.length}件の空の回答があります`,
        affectedRows: emptyResponses.map(r => r.rowNumber),
        suggestion: '空の行を削除することを検討してください'
      })
    }

    // 必須項目チェック
    const missingCompany = responses.filter(r => !r.metadata.isEmpty && !r.answers.company_name)
    if (missingCompany.length > 0) {
      errors.push(...missingCompany.map(r => ({
        row: r.rowNumber,
        column: '会社名',
        message: '会社名が入力されていません',
        severity: 'error' as const
      })))
    }

    // データ品質の提案
    if (responses.length < 10) {
      suggestions.push('回答数が少ないため、統計的な分析の信頼性が低い可能性があります')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * メタデータ取得
   */
  getMetadata(): ExcelMetadata | null {
    return this.metadata
  }

  /**
   * 利用可能なシート名取得
   */
  getSheetNames(): string[] {
    return this.workbook?.SheetNames || []
  }
}