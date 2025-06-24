import { ExcelParser } from './parser'
import { SurveyAnalyzer } from './analyzer'
import type { 
  ExcelParseOptions, 
  ExcelParseResult, 
  AnalysisData,
  SurveyResponse,
  ExcelMetadata
} from './types'

export * from './types'
export { ExcelParser } from './parser'
export { SurveyAnalyzer } from './analyzer'

/**
 * Excel解析とデータ分析の統合クラス
 */
export class GoogleFormsAnalyzer {
  private parser: ExcelParser
  private analyzer: SurveyAnalyzer | null = null
  private responses: SurveyResponse[] = []
  private metadata: ExcelMetadata | null = null

  constructor() {
    this.parser = new ExcelParser()
  }

  /**
   * Excelファイルの解析と分析の実行
   */
  async processFile(
    file: File | Buffer, 
    options: ExcelParseOptions = {}
  ): Promise<{
    success: boolean
    parseResult?: ExcelParseResult
    analysisData?: AnalysisData[]
    basicStats?: any
    error?: string
  }> {
    try {
      console.log('🔄 GoogleフォームExcel解析開始')

      // 1. Excel解析
      const parseResult = await this.parser.parseFile(file, options)

      if (!parseResult.success) {
        return {
          success: false,
          parseResult,
          error: 'Excelファイルの解析に失敗しました'
        }
      }

      this.responses = parseResult.data || []
      this.metadata = parseResult.metadata || null

      // 2. データ分析
      this.analyzer = new SurveyAnalyzer(this.responses)
      const analysisData = this.analyzer.generateAllAnalysis()
      const basicStats = this.analyzer.getBasicStats()

      console.log('✅ GoogleフォームExcel解析完了:', {
        totalResponses: this.responses.length,
        analysisResults: analysisData.length,
        basicStats
      })

      return {
        success: true,
        parseResult,
        analysisData,
        basicStats
      }

    } catch (error) {
      console.error('❌ Googleフォーム解析エラー:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      }
    }
  }

  /**
   * 特定の設問の分析結果を取得
   */
  getQuestionAnalysis(questionId: string, analysisType: string): any {
    if (!this.analyzer) {
      throw new Error('ファイルが解析されていません')
    }

    switch (analysisType) {
      case 'distribution':
        return this.analyzer.analyzeDistribution(questionId)
      case 'multipleChoice':
        return this.analyzer.analyzeMultipleChoice(questionId)
      case 'textAnalysis':
        return this.analyzer.analyzeText(questionId)
      case 'jobType':
        return this.analyzer.analyzeByJobType(questionId)
      case 'demographic':
        return this.analyzer.analyzeByAge(questionId)
      default:
        throw new Error(`未対応の分析タイプ: ${analysisType}`)
    }
  }

  /**
   * 基本統計情報の取得
   */
  getBasicStats(): any {
    if (!this.analyzer) {
      throw new Error('ファイルが解析されていません')
    }
    return this.analyzer.getBasicStats()
  }

  /**
   * メタデータの取得
   */
  getMetadata(): ExcelMetadata | null {
    return this.metadata
  }

  /**
   * 生データの取得
   */
  getResponses(): SurveyResponse[] {
    return this.responses
  }

  /**
   * データの妥当性チェック
   */
  validateData(): {
    isValid: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []

    if (this.responses.length === 0) {
      issues.push('データが存在しません')
      recommendations.push('Excelファイルにデータが含まれているか確認してください')
      return { isValid: false, issues, recommendations }
    }

    // 必須項目のチェック
    const missingCompany = this.responses.filter(r => !r.answers.company_name)
    if (missingCompany.length > 0) {
      issues.push(`${missingCompany.length}件の回答で会社名が不足しています`)
      recommendations.push('会社名は必須項目です。データを確認してください')
    }

    // データ品質のチェック
    if (this.responses.length < 10) {
      issues.push('回答数が少ないです（10件未満）')
      recommendations.push('統計的に有意な分析のため、より多くの回答データを収集することを推奨します')
    }

    // 満足度データの存在確認
    const hasSatisfactionData = this.responses.some(r => 
      Object.keys(r.answers).some(key => 
        ['work_environment', 'overall_satisfaction'].includes(key)
      )
    )

    if (!hasSatisfactionData) {
      issues.push('満足度データが見つかりません')
      recommendations.push('満足度に関する設問データが含まれているか確認してください')
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
  }

  /**
   * 分析結果のサマリーを生成
   */
  generateSummary(): {
    overview: {
      totalResponses: number
      validResponses: number
      completionRate: number
      dataQuality: 'excellent' | 'good' | 'fair' | 'poor'
    }
    highlights: {
      highestSatisfaction: { question: string; score: number } | null
      lowestSatisfaction: { question: string; score: number } | null
      topConcerns: string[]
      topSuggestions: string[]
    }
    demographics: any
  } {
    if (!this.analyzer) {
      throw new Error('ファイルが解析されていません')
    }

    const basicStats = this.analyzer.getBasicStats()
    
    // データ品質評価
    let dataQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor'
    if (basicStats.totalResponses >= 100) dataQuality = 'excellent'
    else if (basicStats.totalResponses >= 50) dataQuality = 'good'
    else if (basicStats.totalResponses >= 20) dataQuality = 'fair'

    // 満足度分析
    const satisfactionQuestions = [
      'work_environment', 'work_life_balance', 'job_satisfaction',
      'overall_satisfaction', 'compensation', 'management_trust'
    ]

    const satisfactionScores = satisfactionQuestions
      .map(questionId => {
        const analysis = this.analyzer!.analyzeDistribution(questionId)
        return {
          question: questionId,
          score: analysis.averageScore || 0
        }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)

    return {
      overview: {
        totalResponses: basicStats.totalResponses,
        validResponses: basicStats.validResponses,
        completionRate: basicStats.completionRate,
        dataQuality
      },
      highlights: {
        highestSatisfaction: satisfactionScores[0] || null,
        lowestSatisfaction: satisfactionScores[satisfactionScores.length - 1] || null,
        topConcerns: [], // テキスト分析から抽出（簡略版では空）
        topSuggestions: [] // テキスト分析から抽出（簡略版では空）
      },
      demographics: basicStats.demographics
    }
  }
}

/**
 * ファイルから分析結果を生成するヘルパー関数
 */
export async function analyzeGoogleFormsExcel(
  file: File | Buffer,
  options: ExcelParseOptions = {}
): Promise<{
  success: boolean
  data?: {
    parseResult: ExcelParseResult
    analysisData: AnalysisData[]
    basicStats: any
    summary: any
  }
  error?: string
}> {
  const analyzer = new GoogleFormsAnalyzer()
  
  const result = await analyzer.processFile(file, options)
  
  if (!result.success) {
    return { success: false, error: result.error }
  }

  const summary = analyzer.generateSummary()

  return {
    success: true,
    data: {
      parseResult: result.parseResult!,
      analysisData: result.analysisData!,
      basicStats: result.basicStats!,
      summary
    }
  }
}