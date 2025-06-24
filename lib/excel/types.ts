// Excel解析エンジン用の型定義

export interface ExcelParseOptions {
  sheetName?: string
  headerRow?: number
  skipEmptyRows?: boolean
  maxRows?: number
}

export interface ExcelParseResult {
  success: boolean
  data?: SurveyResponse[]
  metadata?: ExcelMetadata
  errors?: string[]
  warnings?: string[]
}

export interface ExcelMetadata {
  fileName: string
  sheetName: string
  totalRows: number
  totalColumns: number
  headerRow: number
  dataRows: number
  processedAt: string
  columns: ColumnInfo[]
}

export interface ColumnInfo {
  index: number
  header: string
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'mixed'
  sampleValues: string[]
  nullCount: number
  questionId?: string // マッピングされた設問ID
}

export interface SurveyResponse {
  rowNumber: number
  responseId?: string
  timestamp?: string
  answers: { [questionId: string]: any }
  metadata: {
    isEmpty: boolean
    hasErrors: boolean
    errorMessages: string[]
  }
}

// レガシーフォーマット用のレスポンス
export interface LegacySurveyResponse {
  timestamp: string;
  companyName: string;
  jobType: string;
  gender: string;
  age: string;
  yearsOfService: string;
  workEnvironment: string;
  workLifeBalance: string;
  improvementSuggestions: string;
  concerns: string;
}

// ダイセーグループ従業員調査データ型定義
export interface EmployeeSurveyData {
  // 基本情報
  timestamp: Date;
  company_name: string;
  position: string; // 役職
  job_type: string;
  gender: string;
  age_group: string; // 年齢
  tenure: string;

  // 満足度評価（5段階評価 - 26項目）
  salary_satisfaction: number;
  job_satisfaction: number;
  opinion_expression: number;
  supportive_culture: number;
  junior_education: number;
  long_term_education: number;
  compliance_management: number;
  fair_evaluation: number;
  work_environment: number;
  equipment_support: number;
  communication: number;
  supervision_quality: number;
  compensation_fairness: number;
  overtime_balance: number;
  environment_improvement: number;
  workload_distribution: number;
  vacation_flexibility: number;
  physical_health: number;
  mental_health: number;
  harassment_prevention: number;
  company_growth: number;
  employee_focused_management: number;
  goal_achievement: number;
  career_satisfaction: number;
  company_pride: number;
  five_year_commitment: number;

  // グループ関連（選択肢項目）
  group_companies_known: string;
  group_employee_interaction: boolean;
  holdings_awareness: boolean;

  // 複数選択項目
  hiring_reasons: string[];
  magazine_feedback: string[];

  // 自由記述項目
  concerns: string;
  harassment_witness: string;
  harassment_details: string;
  workplace_positives: string;
  improvement_suggestions: string;
  dx_opportunities: string;
}

// 旧フォーマット互換性のため（従来の形式）
export interface GoogleFormsColumnMapping {
  timestamp: string // "タイムスタンプ"
  companyName: string // "会社名"
  jobType: string // "職種"
  gender: string // "性別"
  age: string // "年代"
  yearsOfService: string // "勤続年数"
  // 満足度項目
  workEnvironment: string // "職場環境への満足度"
  workLifeBalance: string // "ワークライフバランス"
  // 自由記述
  improvementSuggestions: string // "改善提案・要望"
  concerns: string // "不安・懸念事項"
}

// 分析データ型
export interface AnalysisData {
  questionId: string
  analysisType: 'distribution' | 'jobType' | 'demographic' | 'trend' | 'multipleChoice' | 'textAnalysis'
  data: any
  metadata: {
    totalResponses: number
    validResponses: number
    processedAt: string
  }
}

// 回答分布データ
export interface DistributionData {
  distribution: {
    name: string
    value: number
    color: string
  }[]
  totalResponses: number
  averageScore?: number
  satisfactionRate?: number
}

// 選択肢分析データ
export interface MultipleChoiceData {
  multipleChoiceData: {
    name: string
    value: number
    color: string
  }[]
  totalResponses: number
}

// テキスト分析データ
export interface TextAnalysisData {
  aiCategoryData: {
    name: string
    value: number
    color: string
  }[]
  representativeAnswers: {
    category: string
    count: number
    example: string
  }[]
  totalResponses: number
}

// データ検証結果
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: string[]
}

export interface ValidationError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  message: string
  affectedRows: number[]
  suggestion?: string
}

// カテゴリデータ定義
export const POSITION_CATEGORIES = [
  '役員（取締役以上）',
  '管理職',
  'チームリーダー',
  '一般社員',
  'その他'
] as const;

export const AGE_CATEGORIES = [
  '20代',
  '30代', 
  '40代',
  '50代',
  '60代以上'
] as const;

export const GROUP_KNOWLEDGE_CATEGORIES = [
  '1-5社',
  '6-10社',
  '11-20社',
  '20社以上'
] as const;

export const GENDER_CATEGORIES = [
  '男性',
  '女性',
  'その他',
  '回答しない'
] as const;

export const JOB_TYPE_CATEGORIES = [
  'デスクワーク系',
  '技術・専門職',
  'サービス業',
  '営業職',
  '管理職',
  'その他'
] as const;

export const TENURE_CATEGORIES = [
  '1年未満',
  '1-3年',
  '3-5年',
  '5-10年',
  '10年以上'
] as const;

// バリデーションルール
export const VALIDATION_RULES = {
  // 満足度スコア（1-5の範囲チェック）
  satisfactionRange: { min: 1, max: 5 },
  
  // 必須フィールド拡張
  requiredFields: ['timestamp', 'company_name', 'position', 'job_type'],
  
  // 複数選択項目の処理
  multiSelectSeparator: ', ',
  
  // ブール値の文字列変換
  booleanMapping: {
    'はい': true,
    'いいえ': false,
    'Yes': true,
    'No': false
  } as const
};

// 新フォーマットのヘッダーマッピング
export const NEW_FORMAT_HEADERS = {
  timestamp: 'タイムスタンプ',
  company_name: '会社名',
  position: '役職',
  job_type: '職種',
  gender: '性別',
  age_group: '年齢',
  tenure: '勤続年数',
  salary_satisfaction: '給与や労働時間に満足している',
  job_satisfaction: '仕事内容に達成感があり満足を感じられる',
  opinion_expression: '自分の意見を率直に言いやすい組織だ',
  supportive_culture: '社員を尊重し仕事を任せ、周囲がそれを支援する組織風土がある',
  junior_education: '若手の社員教育を十分におこなっていると思う',
  long_term_education: '適切な社員教育が実施されており、長く勤められる組織だと思う',
  compliance_management: '法令を遵守するための管理や教育を徹底していると思う',
  fair_evaluation: '公平で納得性の高い人事評価を受けていると感じる',
  work_environment: '業務に集中できる職場環境がある',
  equipment_support: '仕事で使う車両や機材、備品等に不具合がある場合は、直ちに対応してもらえる安心感がある',
  communication: '上司や同僚と業務に必要な連携やコミュニケーションができている',
  supervision_quality: '上司の指示や指導は適切であると感じられる',
  compensation_fairness: '給与は業務内容や質に相応しいと感じる',
  overtime_balance: '残業時間は負担にならない範囲に収まっている',
  environment_improvement: '会社は労働環境の整備や改善に取り組んでいると思う',
  workload_distribution: '業務分担が適切にされていると感じる',
  vacation_flexibility: '希望の日程や日数で休暇が取れている',
  physical_health: '現在の業務は身体的な健康に悪影響を与えない',
  mental_health: '健康面で特に心配なことや自覚症状はない',
  harassment_prevention: 'ハラスメント対策が行われており、健全な組織運営ができていると思う',
  company_growth: 'これからも成長していく会社だと思う',
  employee_focused_management: 'Crew（従業員）のことを考えた経営が行われていると思う',
  goal_achievement: '目標の実現に対して、前向きに行動できている',
  career_satisfaction: '今の職業が気に入っており、今後も同じ職種で働き続けたい',
  company_pride: 'この会社で働いていることを家族や友人に自信をもって話せる',
  five_year_commitment: '5年後もこの会社で働いていると思う',
  group_companies_known: 'ダイセーグループの他の会社を何社ご存じですか？',
  group_employee_interaction: 'ダイセーグループの他の会社のCrew（従業員）と交流がありますか？',
  holdings_awareness: 'ダイセーグループの方針などを作る「ダイセーホールディングス」という会社があることをご存じですか？',
  hiring_reasons: '入社のきっかけを教えてください（複数回答可）',
  magazine_feedback: 'グループマガジンについてお答えください（複数回答可）',
  concerns: '困っていることがあれば教えてください（自由回答）',
  harassment_witness: '職場でハラスメントを受けた、または受けている人を見たことはありますか？',
  harassment_details: '差し支えない範囲で、内容を教えてください（自由回答）',
  workplace_positives: '職場の良いところ、自社の取り組みでもっと広まって欲しいことを教えてください（自由回答）',
  improvement_suggestions: 'どうすればより良い職場になると思いますか？改善したいところを教えてください（自由回答）',
  dx_opportunities: 'デジタル技術を活用して業務の効率を上げることをDXと言いますが、DXで時間短縮や省人化ができると思う作業があれば教えてください（自由回答）'
} as const;

// 分析用インターフェース
export interface PositionAnalysis {
  byPosition: {
    position: string;
    count: number;
    averageScores: { [key: string]: number };
  }[];
  totalResponses: number;
}

export interface GroupAwarenessAnalysis {
  knowledgeDistribution: {
    category: string;
    count: number;
    percentage: number;
  }[];
  interactionRate: number;
  holdingsAwarenessRate: number;
  totalResponses: number;
}

export interface HarassmentAnalysis {
  witnessRate: number;
  reportingRate: number;
  categories: {
    type: string;
    count: number;
  }[];
  totalResponses: number;
}

export interface DXAnalysis {
  opportunityCategories: {
    category: string;
    count: number;
    examples: string[];
  }[];
  responseRate: number;
  totalResponses: number;
}

// フォーマット判定結果
export interface FormatDetectionResult {
  format: 'new' | 'legacy' | 'unknown';
  confidence: number;
  detectedHeaders: string[];
  missingHeaders: string[];
  extraHeaders: string[];
}