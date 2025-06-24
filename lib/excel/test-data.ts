// テストデータ生成とエッジケース対応

import type { EmployeeSurveyData } from './types'

/**
 * 新フォーマット用のサンプルテストデータ
 */
export const sampleNewFormatData: EmployeeSurveyData[] = [
  {
    timestamp: new Date('2024-06-01T09:00:00Z'),
    company_name: 'ダイセー株式会社',
    position: '管理職',
    job_type: '技術・専門職',
    gender: '男性',
    age_group: '40代',
    tenure: '5-10年',
    
    // 満足度評価（26項目）
    salary_satisfaction: 4,
    job_satisfaction: 5,
    opinion_expression: 3,
    supportive_culture: 4,
    junior_education: 3,
    long_term_education: 4,
    compliance_management: 5,
    fair_evaluation: 3,
    work_environment: 4,
    equipment_support: 4,
    communication: 5,
    supervision_quality: 4,
    compensation_fairness: 3,
    overtime_balance: 2,
    environment_improvement: 4,
    workload_distribution: 3,
    vacation_flexibility: 4,
    physical_health: 5,
    mental_health: 4,
    harassment_prevention: 5,
    company_growth: 4,
    employee_focused_management: 4,
    goal_achievement: 5,
    career_satisfaction: 4,
    company_pride: 5,
    five_year_commitment: 4,
    
    // グループ関連
    group_companies_known: '6-10社',
    group_employee_interaction: true,
    holdings_awareness: true,
    
    // 複数選択項目
    hiring_reasons: ['給与・待遇が良い', '会社の将来性', '職場環境が良い'],
    magazine_feedback: ['読んでいる', '役に立つ', '写真が良い'],
    
    // 自由記述項目
    concerns: '残業時間がやや多いと感じています',
    harassment_witness: 'いいえ',
    harassment_details: '',
    workplace_positives: 'チームワークが良く、お互いを支援する文化がある',
    improvement_suggestions: 'デジタル化を進めて業務効率を上げてほしい',
    dx_opportunities: 'Excel作業の自動化、会議のペーパーレス化'
  },
  {
    timestamp: new Date('2024-06-01T10:30:00Z'),
    company_name: 'ダイセーロジスティクス',
    position: '一般社員',
    job_type: 'サービス業',
    gender: '女性',
    age_group: '30代',
    tenure: '3-5年',
    
    // 満足度評価（26項目）
    salary_satisfaction: 3,
    job_satisfaction: 4,
    opinion_expression: 2,
    supportive_culture: 3,
    junior_education: 4,
    long_term_education: 3,
    compliance_management: 4,
    fair_evaluation: 2,
    work_environment: 3,
    equipment_support: 3,
    communication: 3,
    supervision_quality: 2,
    compensation_fairness: 2,
    overtime_balance: 4,
    environment_improvement: 3,
    workload_distribution: 2,
    vacation_flexibility: 5,
    physical_health: 4,
    mental_health: 3,
    harassment_prevention: 4,
    company_growth: 3,
    employee_focused_management: 3,
    goal_achievement: 4,
    career_satisfaction: 3,
    company_pride: 3,
    five_year_commitment: 3,
    
    // グループ関連
    group_companies_known: '1-5社',
    group_employee_interaction: false,
    holdings_awareness: false,
    
    // 複数選択項目
    hiring_reasons: ['家から近い', '勤務時間が良い'],
    magazine_feedback: ['読んでいない'],
    
    // 自由記述項目
    concerns: '人手不足で業務量が多いです',
    harassment_witness: 'はい',
    harassment_details: '上司からの過度な叱責を見たことがあります',
    workplace_positives: '有給休暇が取りやすい環境です',
    improvement_suggestions: '人員の増員とコミュニケーション改善',
    dx_opportunities: '配送ルートの最適化システム、在庫管理のデジタル化'
  }
]

/**
 * エッジケースのテストデータ
 */
export const edgeCaseTestData = {
  // 空のデータ
  emptyRow: new Array(37).fill(''),
  
  // 部分的に欠損したデータ
  partialData: [
    new Date().toISOString(),
    'テスト会社',
    '', // position missing
    'その他',
    '男性',
    '50代',
    '10年以上',
    // 満足度項目は一部のみ
    3, 4, '', 2, '', '', 5, '', 4, '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ],
  
  // 不正な満足度スコア
  invalidSatisfactionScores: [
    new Date().toISOString(),
    'テスト会社',
    '一般社員',
    'デスクワーク系',
    '女性',
    '20代',
    '1年未満',
    // 範囲外の値
    0, 6, -1, 10, 'とても満足', '不満', '', null, undefined,
    1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1,
    '1-5社', true, false,
    ['理由1', '理由2'], ['読んでいる'],
    'テスト懸念', 'いいえ', '', 'テスト良い点', 'テスト改善案', 'テストDX機会'
  ],
  
  // 複数選択項目のテスト
  multiSelectVariations: [
    // カンマ区切り
    '給与・待遇が良い, 会社の将来性, 職場環境が良い',
    // セミコロン区切り
    '読んでいる; 役に立つ; 写真が良い',
    // 改行区切り
    '理由1\n理由2\n理由3',
    // 単一選択
    '給与・待遇が良い',
    // 空文字
    '',
    // 重複あり
    '理由1, 理由1, 理由2'
  ],
  
  // ブール値のバリエーション
  booleanVariations: [
    'はい', 'いいえ', 'Yes', 'No', 'true', 'false', '1', '0', '', null, undefined,
    'ハイ', 'イイエ', 'はい ', ' いいえ', 'YES', 'NO'
  ],
  
  // 日本語特有のテキスト
  japaneseTextCases: [
    '満足度が高く、働きやすい環境です。',
    '改善点：①残業時間の短縮②コミュニケーション向上③設備の充実',
    'DX推進により、Excel→システム化、ペーパーレス会議、AI活用等',
    '上司とのコミュニケーション不足が課題です。',
    '', // 空文字
    '特になし', // よくある回答
    '。。。', // 記号のみ
    'あいうえおかきくけこ'.repeat(50) // 長文テスト
  ]
}

/**
 * レガシーフォーマットのテストデータ
 */
export const legacyFormatTestData = [
  {
    timestamp: '2024-06-01 09:00:00',
    companyName: 'ダイセー株式会社',
    jobType: '技術・専門職',
    gender: '男性',
    age: '40代',
    yearsOfService: '5-10年',
    workEnvironment: '4',
    workLifeBalance: '3',
    improvementSuggestions: 'デジタル化の推進',
    concerns: '残業時間の問題'
  },
  {
    timestamp: '2024-06-01 10:30:00',
    companyName: 'ダイセーロジスティクス',
    jobType: 'サービス業',
    gender: '女性',
    age: '30代',
    yearsOfService: '3-5年',
    workEnvironment: '3',
    workLifeBalance: '4',
    improvementSuggestions: '人員増員',
    concerns: '業務量の多さ'
  }
]

/**
 * Excelヘッダーのテストパターン
 */
export const headerTestPatterns = {
  // 完全な新フォーマット
  completeNewFormat: [
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
  ],
  
  // 完全なレガシーフォーマット
  completeLegacyFormat: [
    'タイムスタンプ', '会社名', '職種', '性別', '年代', '勤続年数',
    '職場環境への満足度', 'ワークライフバランス', '改善提案・要望', '不安・懸念事項'
  ],
  
  // 部分的な新フォーマット
  partialNewFormat: [
    'タイムスタンプ', '会社名', '役職', '職種', '性別', '年齢',
    '給与や労働時間に満足している', '仕事内容に達成感があり満足を感じられる',
    '困っていることがあれば教えてください（自由回答）'
  ],
  
  // 混在フォーマット（新旧混在）
  mixedFormat: [
    'タイムスタンプ', '会社名', '職種', '性別', '年代', // レガシー形式
    '給与や労働時間に満足している', '仕事内容に達成感があり満足を感じられる', // 新形式
    '職場環境への満足度' // レガシー形式
  ],
  
  // 不明なフォーマット
  unknownFormat: [
    'Date', 'Company', 'Position', 'Type', 'Gender', 'Age',
    'Satisfaction1', 'Satisfaction2', 'Comments'
  ]
}

/**
 * テストデータの生成ユーティリティ
 */
export class TestDataGenerator {
  /**
   * 指定した件数のランダムなテストデータを生成
   */
  static generateRandomData(count: number): EmployeeSurveyData[] {
    const companies = ['ダイセー株式会社', 'ダイセーロジスティクス', 'ダイセー建設', 'ダイセーサービス']
    const positions = ['役員（取締役以上）', '管理職', 'チームリーダー', '一般社員', 'その他']
    const jobTypes = ['デスクワーク系', '技術・専門職', 'サービス業', '営業職', '管理職', 'その他']
    const genders = ['男性', '女性', 'その他']
    const ageGroups = ['20代', '30代', '40代', '50代', '60代以上']
    const tenures = ['1年未満', '1-3年', '3-5年', '5-10年', '10年以上']
    const groupKnowledge = ['1-5社', '6-10社', '11-20社', '20社以上']

    return Array.from({ length: count }, (_, index) => ({
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 過去30日以内
      company_name: companies[Math.floor(Math.random() * companies.length)],
      position: positions[Math.floor(Math.random() * positions.length)],
      job_type: jobTypes[Math.floor(Math.random() * jobTypes.length)],
      gender: genders[Math.floor(Math.random() * genders.length)],
      age_group: ageGroups[Math.floor(Math.random() * ageGroups.length)],
      tenure: tenures[Math.floor(Math.random() * tenures.length)],
      
      // 満足度項目（1-5のランダム値）
      salary_satisfaction: Math.floor(Math.random() * 5) + 1,
      job_satisfaction: Math.floor(Math.random() * 5) + 1,
      opinion_expression: Math.floor(Math.random() * 5) + 1,
      supportive_culture: Math.floor(Math.random() * 5) + 1,
      junior_education: Math.floor(Math.random() * 5) + 1,
      long_term_education: Math.floor(Math.random() * 5) + 1,
      compliance_management: Math.floor(Math.random() * 5) + 1,
      fair_evaluation: Math.floor(Math.random() * 5) + 1,
      work_environment: Math.floor(Math.random() * 5) + 1,
      equipment_support: Math.floor(Math.random() * 5) + 1,
      communication: Math.floor(Math.random() * 5) + 1,
      supervision_quality: Math.floor(Math.random() * 5) + 1,
      compensation_fairness: Math.floor(Math.random() * 5) + 1,
      overtime_balance: Math.floor(Math.random() * 5) + 1,
      environment_improvement: Math.floor(Math.random() * 5) + 1,
      workload_distribution: Math.floor(Math.random() * 5) + 1,
      vacation_flexibility: Math.floor(Math.random() * 5) + 1,
      physical_health: Math.floor(Math.random() * 5) + 1,
      mental_health: Math.floor(Math.random() * 5) + 1,
      harassment_prevention: Math.floor(Math.random() * 5) + 1,
      company_growth: Math.floor(Math.random() * 5) + 1,
      employee_focused_management: Math.floor(Math.random() * 5) + 1,
      goal_achievement: Math.floor(Math.random() * 5) + 1,
      career_satisfaction: Math.floor(Math.random() * 5) + 1,
      company_pride: Math.floor(Math.random() * 5) + 1,
      five_year_commitment: Math.floor(Math.random() * 5) + 1,
      
      // グループ関連
      group_companies_known: groupKnowledge[Math.floor(Math.random() * groupKnowledge.length)],
      group_employee_interaction: Math.random() > 0.5,
      holdings_awareness: Math.random() > 0.3,
      
      // 複数選択項目
      hiring_reasons: this.getRandomHiringReasons(),
      magazine_feedback: this.getRandomMagazineFeedback(),
      
      // 自由記述項目
      concerns: this.getRandomConcern(),
      harassment_witness: Math.random() > 0.9 ? 'はい' : 'いいえ',
      harassment_details: Math.random() > 0.95 ? 'パワハラを見たことがある' : '',
      workplace_positives: this.getRandomPositive(),
      improvement_suggestions: this.getRandomImprovement(),
      dx_opportunities: this.getRandomDXOpportunity()
    }))
  }

  private static getRandomHiringReasons(): string[] {
    const reasons = [
      '給与・待遇が良い', '会社の将来性', '職場環境が良い', '家から近い',
      '勤務時間が良い', '福利厚生が充実', '成長できる環境', 'やりがいのある仕事'
    ]
    const count = Math.floor(Math.random() * 3) + 1
    return this.getRandomItems(reasons, count)
  }

  private static getRandomMagazineFeedback(): string[] {
    const feedback = ['読んでいる', '読んでいない', '役に立つ', '写真が良い', '内容が充実']
    const count = Math.floor(Math.random() * 2) + 1
    return this.getRandomItems(feedback, count)
  }

  private static getRandomConcern(): string {
    const concerns = [
      '残業時間が多い', '人手不足', '設備が古い', 'コミュニケーション不足',
      '昇進の機会が少ない', '研修制度が不十分', '特になし'
    ]
    return concerns[Math.floor(Math.random() * concerns.length)]
  }

  private static getRandomPositive(): string {
    const positives = [
      'チームワークが良い', '風通しが良い', '休暇が取りやすい', '成長機会がある',
      '上司が親切', '設備が良い', '福利厚生が充実', '安定している'
    ]
    return positives[Math.floor(Math.random() * positives.length)]
  }

  private static getRandomImprovement(): string {
    const improvements = [
      'デジタル化の推進', '人員増員', 'コミュニケーション改善', '設備更新',
      '研修制度の充実', '評価制度の改善', '労働時間の短縮', '職場環境改善'
    ]
    return improvements[Math.floor(Math.random() * improvements.length)]
  }

  private static getRandomDXOpportunity(): string {
    const opportunities = [
      'Excel作業の自動化', 'ペーパーレス会議', '在庫管理システム', 'スケジュール管理アプリ',
      'データ分析ツール', 'コミュニケーションツール', '業務フロー改善', 'AI活用'
    ]
    return opportunities[Math.floor(Math.random() * opportunities.length)]
  }

  private static getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, array.length))
  }
}