import type { 
  SurveyResponse, 
  AnalysisData, 
  DistributionData, 
  MultipleChoiceData, 
  TextAnalysisData,
  EmployeeSurveyData,
  PositionAnalysis,
  GroupAwarenessAnalysis,
  HarassmentAnalysis,
  DXAnalysis,
  FormatDetectionResult,
  LegacySurveyResponse
} from './types'

/**
 * アンケート分析エンジン
 */
export class SurveyAnalyzer {
  private responses: SurveyResponse[]

  constructor(responses: SurveyResponse[]) {
    this.responses = responses.filter(r => !r.metadata.isEmpty && !r.metadata.hasErrors)
  }

  /**
   * 回答分布分析（5段階評価用）
   */
  analyzeDistribution(questionId: string): DistributionData {
    const values = this.responses
      .map(r => r.answers[questionId])
      .filter(v => v != null && typeof v === 'number' && v >= 1 && v <= 5)

    if (values.length === 0) {
      return {
        distribution: [],
        totalResponses: 0,
        averageScore: 0,
        satisfactionRate: 0
      }
    }

    // 各段階の集計
    const counts = [1, 2, 3, 4, 5].map(level => ({
      level,
      count: values.filter(v => v === level).length
    }))

    // 分布データ作成
    const distribution = counts.map(({ level, count }) => ({
      name: this.getSatisfactionLabel(level),
      value: count,
      color: this.getSatisfactionColor(level)
    }))

    // 統計計算
    const totalResponses = values.length
    const averageScore = values.reduce((sum, v) => sum + v, 0) / totalResponses
    const satisfiedCount = values.filter(v => v >= 4).length // 4以上を満足とする
    const satisfactionRate = Math.round((satisfiedCount / totalResponses) * 100)

    return {
      distribution,
      totalResponses,
      averageScore: Math.round(averageScore * 10) / 10,
      satisfactionRate
    }
  }

  /**
   * 選択肢分析（カテゴリ別集計）
   */
  analyzeMultipleChoice(questionId: string): MultipleChoiceData {
    const values = this.responses
      .map(r => r.answers[questionId])
      .filter(v => v != null && v !== '')
      .map(v => String(v))

    if (values.length === 0) {
      return {
        multipleChoiceData: [],
        totalResponses: 0
      }
    }

    // 選択肢の集計
    const counts = new Map<string, number>()
    values.forEach(value => {
      counts.set(value, (counts.get(value) || 0) + 1)
    })

    // 色の割り当て
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
    
    const multipleChoiceData = Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a) // 降順ソート
      .map(([name, count], index) => ({
        name,
        value: count,
        color: colors[index % colors.length]
      }))

    return {
      multipleChoiceData,
      totalResponses: values.length
    }
  }

  /**
   * テキスト分析（自由記述用）
   */
  analyzeText(questionId: string): TextAnalysisData {
    const texts = this.responses
      .map(r => r.answers[questionId])
      .filter(v => v != null && v !== '')
      .map(v => String(v).trim())
      .filter(text => text.length > 0)

    if (texts.length === 0) {
      return {
        aiCategoryData: [],
        representativeAnswers: [],
        totalResponses: 0
      }
    }

    // 簡易テキスト分析（キーワードベース）
    const categories = this.categorizeTexts(texts)
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    const aiCategoryData = Object.entries(categories)
      .sort(([, a], [, b]) => b.texts.length - a.texts.length)
      .map(([category, data], index) => ({
        name: category,
        value: data.texts.length,
        color: colors[index % colors.length]
      }))

    // 代表的な回答例
    const representativeAnswers = Object.entries(categories)
      .map(([category, data]) => ({
        category,
        count: data.texts.length,
        example: data.texts[0] // 最初の回答を例として使用
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // 上位5カテゴリ

    return {
      aiCategoryData,
      representativeAnswers,
      totalResponses: texts.length
    }
  }

  /**
   * 職種別分析
   */
  analyzeByJobType(questionId: string): { [jobType: string]: DistributionData } {
    const jobTypes = this.getUniqueValues('job_type')
    const result: { [jobType: string]: DistributionData } = {}

    jobTypes.forEach(jobType => {
      const filteredResponses = this.responses.filter(r => r.answers.job_type === jobType)
      const analyzer = new SurveyAnalyzer(filteredResponses)
      result[jobType] = analyzer.analyzeDistribution(questionId)
    })

    return result
  }

  /**
   * 年代別分析
   */
  analyzeByAge(questionId: string): { [age: string]: DistributionData } {
    const ages = this.getUniqueValues('age')
    const result: { [age: string]: DistributionData } = {}

    ages.forEach(age => {
      const filteredResponses = this.responses.filter(r => r.answers.age === age)
      const analyzer = new SurveyAnalyzer(filteredResponses)
      result[age] = analyzer.analyzeDistribution(questionId)
    })

    return result
  }

  /**
   * 基本統計情報の取得
   */
  getBasicStats(): {
    totalResponses: number
    validResponses: number
    completionRate: number
    companyCounts: { [company: string]: number }
    jobTypeCounts: { [jobType: string]: number }
    demographics: {
      gender: { [gender: string]: number }
      age: { [age: string]: number }
      yearsOfService: { [years: string]: number }
    }
  } {
    const validResponses = this.responses.length
    const totalResponses = this.responses.length // 空行除外済み

    return {
      totalResponses,
      validResponses,
      completionRate: totalResponses > 0 ? Math.round((validResponses / totalResponses) * 100) : 0,
      companyCounts: this.countValues('company_name'),
      jobTypeCounts: this.countValues('job_type'),
      demographics: {
        gender: this.countValues('gender'),
        age: this.countValues('age'),
        yearsOfService: this.countValues('years_of_service')
      }
    }
  }

  /**
   * 全設問の分析データ生成
   */
  generateAllAnalysis(): AnalysisData[] {
    const results: AnalysisData[] = []
    const processedAt = new Date().toISOString()

    // 満足度設問の分析
    const satisfactionQuestions = [
      'work_environment', 'work_life_balance', 'workplace_relationships',
      'equipment_facilities', 'job_satisfaction', 'skill_utilization',
      'workload', 'autonomy', 'growth_opportunities', 'career_development',
      'training_programs', 'promotion_fairness', 'compensation', 'benefits',
      'evaluation_system', 'job_security', 'management_trust', 'communication',
      'company_direction', 'organizational_culture', 'overall_satisfaction',
      'recommendation'
    ]

    satisfactionQuestions.forEach(questionId => {
      const hasData = this.responses.some(r => r.answers[questionId] != null)
      if (hasData) {
        const distributionData = this.analyzeDistribution(questionId)
        results.push({
          questionId,
          analysisType: 'distribution',
          data: distributionData,
          metadata: {
            totalResponses: distributionData.totalResponses,
            validResponses: distributionData.totalResponses,
            processedAt
          }
        })
      }
    })

    // 選択肢設問の分析
    const multipleChoiceQuestions = [
      'company_name', 'job_type', 'gender', 'age', 'years_of_service'
    ]

    multipleChoiceQuestions.forEach(questionId => {
      const hasData = this.responses.some(r => r.answers[questionId] != null)
      if (hasData) {
        const multipleChoiceData = this.analyzeMultipleChoice(questionId)
        results.push({
          questionId,
          analysisType: 'multipleChoice',
          data: multipleChoiceData,
          metadata: {
            totalResponses: multipleChoiceData.totalResponses,
            validResponses: multipleChoiceData.totalResponses,
            processedAt
          }
        })
      }
    })

    // テキスト分析
    const textQuestions = ['improvement_suggestions', 'concerns']

    textQuestions.forEach(questionId => {
      const hasData = this.responses.some(r => r.answers[questionId] != null)
      if (hasData) {
        const textData = this.analyzeText(questionId)
        results.push({
          questionId,
          analysisType: 'textAnalysis',
          data: textData,
          metadata: {
            totalResponses: textData.totalResponses,
            validResponses: textData.totalResponses,
            processedAt
          }
        })
      }
    })

    return results
  }

  // プライベートメソッド

  private getSatisfactionLabel(level: number): string {
    const labels = {
      1: '非常に不満',
      2: '不満',
      3: 'どちらでもない',
      4: '満足',
      5: '非常に満足'
    }
    return labels[level as keyof typeof labels] || 'unknown'
  }

  private getSatisfactionColor(level: number): string {
    const colors = {
      1: '#ef4444', // 赤
      2: '#f97316', // オレンジ
      3: '#eab308', // 黄
      4: '#84cc16', // 薄緑
      5: '#22c55e'  // 緑
    }
    return colors[level as keyof typeof colors] || '#6b7280'
  }

  private getUniqueValues(questionId: string): string[] {
    const values = this.responses
      .map(r => r.answers[questionId])
      .filter(v => v != null && v !== '')
      .map(v => String(v))

    return Array.from(new Set(values)).sort()
  }

  private countValues(questionId: string): { [value: string]: number } {
    const counts: { [value: string]: number } = {}
    
    this.responses.forEach(r => {
      const value = r.answers[questionId]
      if (value != null && value !== '') {
        const strValue = String(value)
        counts[strValue] = (counts[strValue] || 0) + 1
      }
    })

    return counts
  }

  private categorizeTexts(texts: string[]): { [category: string]: { texts: string[] } } {
    const categories: { [category: string]: { texts: string[] } } = {
      '労働環境・職場': { texts: [] },
      '待遇・給与': { texts: [] },
      '人間関係・コミュニケーション': { texts: [] },
      '業務内容・スキル': { texts: [] },
      '経営・組織': { texts: [] },
      'その他': { texts: [] }
    }

    const keywords = {
      '労働環境・職場': ['職場', '環境', '設備', '施設', '残業', '労働時間', 'ワークライフ', '休暇', '有給'],
      '待遇・給与': ['給与', '賞与', '昇給', '昇進', '評価', '待遇', '福利厚生', '手当'],
      '人間関係・コミュニケーション': ['人間関係', 'コミュニケーション', '上司', '同僚', '部下', 'チーム', 'コミュニケーション'],
      '業務内容・スキル': ['業務', '仕事', 'スキル', '成長', '研修', '教育', 'キャリア', '専門'],
      '経営・組織': ['経営', '組織', '会社', '方針', '戦略', 'ビジョン', '将来', '安定']
    }

    texts.forEach(text => {
      let categorized = false
      
      for (const [category, categoryKeywords] of Object.entries(keywords)) {
        if (categoryKeywords.some(keyword => text.includes(keyword))) {
          categories[category].texts.push(text)
          categorized = true
          break
        }
      }
      
      if (!categorized) {
        categories['その他'].texts.push(text)
      }
    })

    // 空のカテゴリを除外
    Object.keys(categories).forEach(category => {
      if (categories[category].texts.length === 0) {
        delete categories[category]
      }
    })

    return categories
  }

  /**
   * ハラスメントタイプの分類
   */
  private categorizeHarassmentTypes(texts: string[]): { type: string; count: number }[] {
    const types = {
      'パワーハラスメント': ['パワハラ', '威圧', '暴言', '叱責', '理不尽', '圧力'],
      'セクシャルハラスメント': ['セクハラ', '性的', '身体接触', '不適切'],
      'その他のハラスメント': ['いじめ', '無視', '嫌がらせ', '差別', '排除']
    }

    const counts = Object.keys(types).map(type => ({ type, count: 0 }))

    texts.forEach(text => {
      Object.entries(types).forEach(([type, keywords], index) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          counts[index].count++
        }
      })
    })

    return counts.filter(item => item.count > 0)
  }

  /**
   * DX機会の分類
   */
  private categorizeDXOpportunities(texts: string[]): { category: string; count: number; examples: string[] }[] {
    const categories = {
      '事務作業自動化': ['書類', '資料作成', 'Excel', '入力', '計算', '集計', '帳票'],
      'コミュニケーション効率化': ['会議', '連絡', '情報共有', 'メール', 'チャット', '報告'],
      'スケジュール・管理': ['スケジュール', '予定', '管理', '進捗', 'タスク', '計画'],
      'データ分析・活用': ['データ', '分析', '集計', 'グラフ', '可視化', '統計'],
      'その他・システム化': ['システム', 'アプリ', 'ツール', 'ソフト', 'デジタル', 'IT']
    }

    const results = Object.keys(categories).map(category => ({
      category,
      count: 0,
      examples: [] as string[]
    }))

    texts.forEach(text => {
      let categorized = false
      Object.entries(categories).forEach(([category, keywords], index) => {
        if (keywords.some(keyword => text.includes(keyword))) {
          results[index].count++
          if (results[index].examples.length < 3) {
            results[index].examples.push(text.substring(0, 100) + (text.length > 100 ? '...' : ''))
          }
          categorized = true
        }
      })

      if (!categorized) {
        const otherIndex = results.findIndex(r => r.category === 'その他・システム化')
        if (otherIndex !== -1) {
          results[otherIndex].count++
          if (results[otherIndex].examples.length < 3) {
            results[otherIndex].examples.push(text.substring(0, 100) + (text.length > 100 ? '...' : ''))
          }
        }
      }
    })

    return results.filter(item => item.count > 0).sort((a, b) => b.count - a.count)
  }
}

/**
 * フォーマット検出と変換ユーティリティ
 */
export class ExcelFormatDetector {
  /**
   * Excelフォーマットの自動検出
   */
  static detectFormat(headers: string[]): FormatDetectionResult {
    const newFormatHeaders = [
      'タイムスタンプ', '会社名', '役職', '職種', '性別', '年齢', '勤続年数',
      '給与や労働時間に満足している', '仕事内容に達成感があり満足を感じられる',
      '自分の意見を率直に言いやすい組織だ', '社員を尊重し仕事を任せ、周囲がそれを支援する組織風土がある',
      '若手の社員教育を十分におこなっていると思う', '適切な社員教育が実施されており、長く勤められる組織だと思う',
      '法令を遵守するための管理や教育を徹底していると思う', '公平で納得性の高い人事評価を受けていると感じる',
      '業務に集中できる職場環境がある', '仕事で使う車両や機材、備品等に不具合がある場合は、直ちに対応してもらえる安心感がある',
      '上司や同僚と業務に必要な連携やコミュニケーションができている', '上司の指示や指導は適切であると感じられる',
      '給与は業務内容や質に相応しいと感じる', '残業時間は負担にならない範囲に収まっている',
      '会社は労働環境の整備や改善に取り組んでいると思う', '業務分担が適切にされていると感じる',
      '希望の日程や日数で休暇が取れている', '現在の業務は身体的な健康に悪影響を与えない',
      '健康面で特に心配なことや自覚症状はない', 'ハラスメント対策が行われており、健全な組織運営ができていると思う',
      'これからも成長していく会社だと思う', 'Crew（従業員）のことを考えた経営が行われていると思う',
      '目標の実現に対して、前向きに行動できている', '今の職業が気に入っており、今後も同じ職種で働き続けたい',
      'この会社で働いていることを家族や友人に自信をもって話せる', '5年後もこの会社で働いていると思う',
      'ダイセーグループの他の会社を何社ご存じですか？', 'ダイセーグループの他の会社のCrew（従業員）と交流がありますか？',
      'ダイセーグループの方針などを作る「ダイセーホールディングス」という会社があることをご存じですか？',
      '入社のきっかけを教えてください（複数回答可）', 'グループマガジンについてお答えください（複数回答可）',
      '困っていることがあれば教えてください（自由回答）', '職場でハラスメントを受けた、または受けている人を見たことはありますか？',
      '差し支えない範囲で、内容を教えてください（自由回答）', '職場の良いところ、自社の取り組みでもっと広まって欲しいことを教えてください（自由回答）',
      'どうすればより良い職場になると思いますか？改善したいところを教えてください（自由回答）',
      'デジタル技術を活用して業務の効率を上げることをDXと言いますが、DXで時間短縮や省人化ができると思う作業があれば教えてください（自由回答）'
    ]
    const legacyHeaders = [
      'タイムスタンプ', '会社名', '職種', '性別', '年代', '勤続年数',
      '職場環境への満足度', 'ワークライフバランス', '改善提案・要望'
    ]

    // 新フォーマットの一致度チェック
    const newFormatMatches = headers.filter(h => newFormatHeaders.includes(h)).length
    const newFormatScore = newFormatMatches / newFormatHeaders.length

    // 旧フォーマットの一致度チェック  
    const legacyMatches = headers.filter(h => legacyHeaders.includes(h)).length
    const legacyScore = legacyMatches / legacyHeaders.length

    let format: 'new' | 'legacy' | 'unknown'
    let confidence: number

    if (newFormatScore > 0.8) {
      format = 'new'
      confidence = newFormatScore
    } else if (legacyScore > 0.6) {
      format = 'legacy'
      confidence = legacyScore
    } else {
      format = 'unknown'
      confidence = Math.max(newFormatScore, legacyScore)
    }

    // 検出されたヘッダーと不足ヘッダーの特定
    const targetHeaders = format === 'new' ? newFormatHeaders : legacyHeaders
    const detectedHeaders = headers.filter(h => targetHeaders.includes(h))
    const missingHeaders = targetHeaders.filter(h => !headers.includes(h))
    const extraHeaders = headers.filter(h => !targetHeaders.includes(h))

    return {
      format,
      confidence: Math.round(confidence * 100) / 100,
      detectedHeaders,
      missingHeaders,
      extraHeaders
    }
  }

  /**
   * データ行の変換（新フォーマット用）
   */
  static convertToNewFormat(row: any[], headers: string[]): any {
    if (!row || row.length === 0) return null

    const result: any = {}
    const headerMapping = {
      timestamp: 'タイムスタンプ',
      company_name: '会社名',
      position: '役職',
      job_type: '職種',
      gender: '性別',
      age_group: '年齢',
      tenure: '勤続年数'
    }

    headers.forEach((header, index) => {
      const value = row[index]
      if (value == null || value === '') return

      // ヘッダーから対応するフィールド名を取得
      const fieldName = Object.entries(headerMapping).find(
        ([, h]) => h === header
      )?.[0] as string

      if (!fieldName) return

      try {
        // データ型に応じて変換
        if (fieldName === 'timestamp') {
          result[fieldName] = new Date(value)
        } else if (this.isSatisfactionField(fieldName)) {
          // 満足度スコア（1-5）の変換
          result[fieldName] = this.convertSatisfactionScore(value)
        } else if (this.isBooleanField(fieldName)) {
          // ブール値の変換
          result[fieldName] = this.convertBoolean(value)
        } else if (this.isMultiSelectField(fieldName)) {
          // 複数選択項目の変換
          result[fieldName] = this.convertMultiSelect(value)
        } else {
          // 文字列フィールド
          result[fieldName] = String(value).trim()
        }
      } catch (error) {
        console.warn(`Failed to convert field ${String(fieldName)}:`, error)
      }
    })

    return result
  }

  /**
   * レガシーフォーマットからの変換
   */
  static convertFromLegacyFormat(legacyData: any): any {
    return {
      timestamp: new Date(legacyData.timestamp),
      company_name: legacyData.companyName,
      job_type: legacyData.jobType,
      gender: legacyData.gender,
      age_group: legacyData.age,
      tenure: legacyData.yearsOfService,
      // 旧フォーマットには役職がないので空文字
      position: '',
      // 旧フォーマットの満足度項目を新フォーマットにマッピング
      work_environment: this.convertSatisfactionScore(legacyData.workEnvironment),
      overtime_balance: this.convertSatisfactionScore(legacyData.workLifeBalance),
      // 自由記述項目
      improvement_suggestions: legacyData.improvementSuggestions,
      concerns: legacyData.concerns
    }
  }

  // プライベートメソッド
  private static isSatisfactionField(fieldName: string): boolean {
    const satisfactionFields = [
      'salary_satisfaction', 'job_satisfaction', 'opinion_expression', 'supportive_culture',
      'junior_education', 'long_term_education', 'compliance_management', 'fair_evaluation',
      'work_environment', 'equipment_support', 'communication', 'supervision_quality',
      'compensation_fairness', 'overtime_balance', 'environment_improvement', 'workload_distribution',
      'vacation_flexibility', 'physical_health', 'mental_health', 'harassment_prevention',
      'company_growth', 'employee_focused_management', 'goal_achievement', 'career_satisfaction',
      'company_pride', 'five_year_commitment'
    ]
    return satisfactionFields.includes(fieldName)
  }

  private static isBooleanField(fieldName: string): boolean {
    return ['group_employee_interaction', 'holdings_awareness'].includes(fieldName)
  }

  private static isMultiSelectField(fieldName: string): boolean {
    return ['hiring_reasons', 'magazine_feedback'].includes(fieldName)
  }

  private static convertSatisfactionScore(value: any): number {
    if (typeof value === 'number') {
      return Math.max(1, Math.min(5, Math.round(value)))
    }
    
    const str = String(value).trim()
    
    // 数値文字列の場合
    const num = parseFloat(str)
    if (!isNaN(num)) {
      return Math.max(1, Math.min(5, Math.round(num)))
    }
    
    // テキストマッピング
    const textMapping: { [key: string]: number } = {
      '非常に不満': 1, '不満': 2, 'どちらでもない': 3, '満足': 4, '非常に満足': 5,
      '全くそう思わない': 1, 'そう思わない': 2, 'そう思う': 4, '強くそう思う': 5
    }
    
    return textMapping[str] || 3 // デフォルトは中間値
  }

  private static convertBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value
    
    const str = String(value).trim().toLowerCase()
    const booleanMapping = {
      'はい': true,
      'いいえ': false,
      'Yes': true,
      'No': false
    } as const
    return booleanMapping[str as keyof typeof booleanMapping] || false
  }

  private static convertMultiSelect(value: any): string[] {
    if (Array.isArray(value)) return value.map(v => String(v).trim())
    
    const str = String(value).trim()
    if (!str) return []
    
    return str.split(', ')
      .map(item => item.trim())
      .filter(item => item.length > 0)
  }
}