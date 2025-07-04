"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
} from "recharts"
import { Users, ChevronDown, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { RequireAuth } from "@/components/auth-guard"

function AnalysisPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const analysisId = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [summaryData, setSummaryData] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const currentYear = new Date().getFullYear();
  const years = ["2022年", "2023年", "2024年", "2025年"]
  const [selectedAnalysisYear, setSelectedAnalysisYear] = useState(`${currentYear}年`)
  const [year, setYear] = useState<string | null>(null)

  // 設問データの定義（fallback用）
  const defaultQuestions = [
    // 回答者属性
    {
      id: "company_name",
      title: "会社名",
      category: "回答者属性",
      categoryColor: "bg-gray-100 text-gray-800 border-gray-200",
      responseType: "5段階",
      analysisTypes: ["multipleChoice"],
    },
    {
      id: "job_type",
      title: "職種",
      category: "回答者属性",
      categoryColor: "bg-gray-100 text-gray-800 border-gray-200",
      responseType: "5段階",
      analysisTypes: ["multipleChoice"],
    },
    {
      id: "gender",
      title: "性別",
      category: "回答者属性",
      categoryColor: "bg-gray-100 text-gray-800 border-gray-200",
      responseType: "5段階",
      analysisTypes: ["multipleChoice"],
    },
    {
      id: "age",
      title: "年齢",
      category: "回答者属性",
      categoryColor: "bg-gray-100 text-gray-800 border-gray-200",
      responseType: "5段階",
      analysisTypes: ["multipleChoice"],
    },
    {
      id: "tenure",
      title: "勤続年数",
      category: "回答者属性",
      categoryColor: "bg-gray-100 text-gray-800 border-gray-200",
      responseType: "5段階",
      analysisTypes: ["multipleChoice"],
    },

    // 企業評価スコア
    {
      id: "salary_satisfaction",
      title: "給与や労働時間に満足している",
      category: "企業評価スコア",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "job_satisfaction",
      title: "仕事内容に達成感があり満足を感じられる",
      category: "企業評価スコア",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "communication_ease",
      title: "自分の意見を率直に言いやすい組織だ",
      category: "企業評価スコア",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "organizational_culture",
      title: "社員を尊重し仕事を任せ、周囲がそれを支援する組織風土がある",
      category: "企業評価スコア",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "youth_education",
      title: "若手の社員教育を十分におこなっていると思う",
      category: "企業評価スコア",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "continuous_education",
      title: "適切な社員教育が実施されており、長く勤められる組織だと思う",
      category: "企業評価スコア",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "compliance_education",
      title: "法令を遵守するための管理や教育を徹底していると思う",
      category: "企業評価スコア",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "fair_evaluation",
      title: "公平で納得性の高い人事評価を受けていると感じる",
      category: "企業評価スコア",
      categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },

    // 職場環境・上司・人事評価・給与について
    {
      id: "work_environment",
      title: "業務に集中できる職場環境がある",
      category: "職場環境・上司・人事評価・給与について",
      categoryColor: "bg-green-100 text-green-800 border-green-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "equipment_support",
      title: "仕事で使う車両や機材、備品等に不具合がある場合は、直ちに対応してもらえる安心感がある",
      category: "職場環境・上司・人事評価・給与について",
      categoryColor: "bg-green-100 text-green-800 border-green-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "team_communication",
      title: "上司や同僚と業務に必要な連携やコミュニケーションができている",
      category: "職場環境・上司・人事評価・給与について",
      categoryColor: "bg-green-100 text-green-800 border-green-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "supervisor_guidance",
      title: "上司の指示や指導は適切であると感じられる",
      category: "職場環境・上司・人事評価・給与について",
      categoryColor: "bg-green-100 text-green-800 border-green-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "salary_appropriateness",
      title: "給与は業務内容や質に相応しいと感じる",
      category: "職場環境・上司・人事評価・給与について",
      categoryColor: "bg-green-100 text-green-800 border-green-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "overtime_balance",
      title: "残業時間は負担にならない範囲に収まっている",
      category: "職場環境・上司・人事評価・給与について",
      categoryColor: "bg-green-100 text-green-800 border-green-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "workplace_improvement",
      title: "会社は労働環境の整備や改善に取り組んでいると思う",
      category: "職場環境・上司・人事評価・給与について",
      categoryColor: "bg-green-100 text-green-800 border-green-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },

    // 業務負担・休暇・健康・コンプライアンスについて
    {
      id: "workload_distribution",
      title: "業務分担が適切にされていると感じる",
      category: "業務負担・休暇・健康・コンプライアンスについて",
      categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "vacation_flexibility",
      title: "希望の日程や日数で休暇が取れている",
      category: "業務負担・休暇・健康・コンプライアンスについて",
      categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "physical_health",
      title: "現在の業務は身体的な健康に悪影響を与えない",
      category: "業務負担・休暇・健康・コンプライアンスについて",
      categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "mental_health",
      title: "健康面で特に心配なことや自覚症状はない",
      category: "業務負担・休暇・健康・コンプライアンスについて",
      categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "harassment_prevention",
      title: "ハラスメント対策が行われており、健全な組織運営ができていると思う",
      category: "業務負担・休暇・健康・コンプライアンスについて",
      categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },

    // 経営・今後のキャリアについて
    {
      id: "company_growth",
      title: "これからも成長していく会社だと思う",
      category: "経営・今後のキャリアについて",
      categoryColor: "bg-orange-100 text-orange-800 border-orange-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "employee_focused_management",
      title: "Crew（従業員）のことを考えた経営が行われていると思う",
      category: "経営・今後のキャリアについて",
      categoryColor: "bg-orange-100 text-orange-800 border-orange-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "goal_achievement",
      title: "目標の実現に対して、前向きに行動できている",
      category: "経営・今後のキャリアについて",
      categoryColor: "bg-orange-100 text-orange-800 border-orange-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "job_continuity",
      title: "今の職業が気に入っており、今後も同じ職種で働き続けたい",
      category: "経営・今後のキャリアについて",
      categoryColor: "bg-orange-100 text-orange-800 border-orange-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "company_pride",
      title: "この会社で働いていることを家族や友人に自信をもって話せる",
      category: "経営・今後のキャリアについて",
      categoryColor: "bg-orange-100 text-orange-800 border-orange-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },
    {
      id: "future_commitment",
      title: "5年後もこの会社で働いていると思う",
      category: "経営・今後のキャリアについて",
      categoryColor: "bg-orange-100 text-orange-800 border-orange-200",
      responseType: "5段階",
      analysisTypes: ["distribution", "jobType", "demographic", "trend"],
    },

    // ダイセーグループについて
    {
      id: "group_companies_known",
      title: "ダイセーグループの他の会社を何社ご存じですか？",
      category: "ダイセーグループについて",
      categoryColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      responseType: "選択式",
      analysisTypes: ["multipleChoice"],
    },
    {
      id: "group_interaction",
      title: "ダイセーグループの他の会社のCrew（従業員）と交流がありますか？",
      category: "ダイセーグループについて",
      categoryColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      responseType: "選択式",
      analysisTypes: ["multipleChoice"],
    },
    {
      id: "holding_company_awareness",
      title: "ダイセーグループの方針などを作る「ダイセーホールディングス」という会社があることをご存じですか？",
      category: "ダイセーグループについて",
      categoryColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      responseType: "選択式",
      analysisTypes: ["multipleChoice"],
    },
    {
      id: "hiring_reason",
      title: "入社のきっかけを教えてください（複数回答可）",
      category: "ダイセーグループについて",
      categoryColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      responseType: "複数選択可",
      analysisTypes: ["multipleChoice"],
    },
    {
      id: "magazine_feedback",
      title: "グループマガジンについてお答えください（複数回答可）",
      category: "ダイセーグループについて",
      categoryColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      responseType: "複数選択可",
      analysisTypes: ["multipleChoice"],
    },

    // 自由回答
    {
      id: "concerns",
      title: "困っていることがあれば教えてください（自由回答）",
      category: "自由回答",
      categoryColor: "bg-slate-100 text-slate-800 border-slate-200",
      responseType: "自由回答",
      analysisTypes: ["textAnalysis"],
    },
    {
      id: "harassment_experience",
      title:
        "職場でハラスメントを受けた、または受けている人を見たことはありますか？差し支えない範囲で、内容を教えてください（自由回答）",
      category: "自由回答",
      categoryColor: "bg-slate-100 text-slate-800 border-slate-200",
      responseType: "自由回答",
      analysisTypes: ["textAnalysis"],
    },
    {
      id: "positive_aspects",
      title: "職場の良いところ、自社の取り組みでもっと広まって欲しいことを教えてください（自由回答）",
      category: "自由回答",
      categoryColor: "bg-slate-100 text-slate-800 border-slate-200",
      responseType: "自由回答",
      analysisTypes: ["textAnalysis"],
    },
    {
      id: "improvement_suggestions",
      title: "どうすればより良い職場になると思いますか？改善したいところを教えてください（自由回答）",
      category: "自由回答",
      categoryColor: "bg-slate-100 text-slate-800 border-slate-200",
      responseType: "自由回答",
      analysisTypes: ["textAnalysis"],
    },
    {
      id: "one_on_one_meetings",
      title:
        "社内で、1on1ミーティング（上司との面談）は実施されていますか？またその内容や頻度について教えてください。（自由回答）",
      category: "自由回答",
      categoryColor: "bg-slate-100 text-slate-800 border-slate-200",
      responseType: "自由回答",
      analysisTypes: ["textAnalysis"],
    },
  ]

  // Khi người dùng chọn năm mới, set `year` để kích hoạt useEffect
  const handleYearChange = (newYear: string) => {
    setSelectedAnalysisYear(newYear)
    setYear(newYear)
  }
  // Khi `year` thay đổi → gọi API và chuyển hướng
  useEffect(() => {
    if (year || !analysisId) {
      const fetchUploadByYear = async () => {
        try {
          const res = await fetch('/api/upload?year=' + (year || selectedAnalysisYear))
          const data = await res.json()
          console.log('upload: ', data)

          if (data.upload?.id) {
            router.push(`/analysis?id=${data.upload.id}`)
          } else {
            setError('分析IDが指定されていません')
            setLoading(false)
          }
        } catch (err) {
          console.error('Upload fetch error:', err)
          setError('データ取得に失敗しました')
        }
      }
      fetchUploadByYear()
    }
  }, [year, router, analysisId])
  // API経由でデータを取得
  useEffect(() => {
    if (analysisId) {
      fetchAnalysisData()
    }
  }, [analysisId])

  const fetchAnalysisData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 分析データ、サマリー、質問一覧を並行取得
      const [analysisRes, summaryRes, questionsRes] = await Promise.all([
        fetch(`/api/analysis/${analysisId}`),
        fetch(`/api/analysis/summary/${analysisId}`),
        fetch(`/api/analysis/questions/${analysisId}`)
      ])

      if (!analysisRes.ok) {
        throw new Error('分析データの取得に失敗しました')
      }
      if (!summaryRes.ok) {
        throw new Error('サマリーデータの取得に失敗しました')
      }
      if (!questionsRes.ok) {
        throw new Error('質問データの取得に失敗しました')
      }

      const [analysis, summary, questionsList] = await Promise.all([
        analysisRes.json(),
        summaryRes.json(),
        questionsRes.json()
      ])

      setAnalysisData(analysis.data)
      setSummaryData(summary.data)
      setQuestions(questionsList.data || defaultQuestions)

    } catch (error) {
      console.error('Analysis fetch error:', error)
      setError(error instanceof Error ? error.message : '分析データの取得に失敗しました')
      // エラー時はデフォルトデータを使用
      setQuestions(defaultQuestions)
    } finally {
      setLoading(false)
    }
  }

  const questionDataByYear = analysisData || {
    "2024年": {
      // 回答者属性のデータを追加
      company_name: {
        multipleChoiceData: [
          { name: "ダイセーホールディングス", value: 45, color: "#8884d8" },
          { name: "ダイセー運輸", value: 25, color: "#82ca9d" },
          { name: "ダイセーロジスティクス", value: 15, color: "#ffc658" },
          { name: "ダイセー建設", value: 10, color: "#ff7c7c" },
          { name: "その他", value: 5, color: "#8dd1e1" },
        ],
      },
      job_type: {
        multipleChoiceData: [
          { name: "事務職", value: 30, color: "#8884d8" },
          { name: "営業職", value: 25, color: "#82ca9d" },
          { name: "技術職", value: 20, color: "#ffc658" },
          { name: "管理職", value: 15, color: "#ff7c7c" },
          { name: "役員", value: 10, color: "#8dd1e1" },
        ],
      },
      gender: {
        multipleChoiceData: [
          { name: "男性", value: 65, color: "#8884d8" },
          { name: "女性", value: 35, color: "#82ca9d" },
        ],
      },
      age: {
        multipleChoiceData: [
          { name: "20代", value: 25, color: "#8884d8" },
          { name: "30代", value: 35, color: "#82ca9d" },
          { name: "40代", value: 25, color: "#ffc658" },
          { name: "50代以上", value: 15, color: "#ff7c7c" },
        ],
      },
      tenure: {
        multipleChoiceData: [
          { name: "1年未満", value: 15, color: "#8884d8" },
          { name: "1年～2年", value: 20, color: "#82ca9d" },
          { name: "2年～5年", value: 30, color: "#ffc658" },
          { name: "5年～10年", value: 20, color: "#ff7c7c" },
          { name: "10年以上", value: 15, color: "#8dd1e1" },
        ],
      },
      salary_satisfaction: {
        distribution: [
          { name: "非常に不満(1)", value: 5 },
          { name: "不満(2)", value: 10 },
          { name: "普通(3)", value: 25 },
          { name: "満足(4)", value: 40 },
          { name: "非常に満足(5)", value: 20 },
        ],
        jobTypeScores: [
          { jobType: "事務職", score: 3.4 },
          { jobType: "営業職", score: 3.8 },
          { jobType: "技術職", score: 3.5 },
          { jobType: "管理職", score: 4.1 },
          { jobType: "役員", score: 4.5 },
        ],
        demographicData: [
          { name: "20代", score: 3.2 },
          { name: "30代", score: 3.6 },
          { name: "40代", score: 3.8 },
          { name: "50代以上", score: 4.0 },
        ],
        trendData: [
          { year: "2022年", score: 3.2 },
          { year: "2023年", score: 3.4 },
          { year: "2024年", score: 3.6 },
        ],
        averageScore: 3.6,
        satisfiedPercentage: 60,
        neutralPercentage: 25,
        dissatisfiedPercentage: 15,
      },
      job_satisfaction: {
        distribution: [
          { name: "非常に不満(1)", value: 3 },
          { name: "不満(2)", value: 7 },
          { name: "普通(3)", value: 20 },
          { name: "満足(4)", value: 45 },
          { name: "非常に満足(5)", value: 25 },
        ],
        jobTypeScores: [
          { jobType: "事務職", score: 3.7 },
          { jobType: "営業職", score: 4.1 },
          { jobType: "技術職", score: 3.9 },
          { jobType: "管理職", score: 4.3 },
          { jobType: "役員", score: 4.6 },
        ],
        demographicData: [
          { name: "20代", score: 3.5 },
          { name: "30代", score: 3.9 },
          { name: "40代", score: 4.1 },
          { name: "50代以上", score: 4.2 },
        ],
        trendData: [
          { year: "2022年", score: 3.5 },
          { year: "2023年", score: 3.7 },
          { year: "2024年", score: 3.9 },
        ],
        averageScore: 3.9,
        satisfiedPercentage: 70,
        neutralPercentage: 20,
        dissatisfiedPercentage: 10,
      },
      hiring_reason: {
        multipleChoiceData: [
          { name: "知人からの紹介", value: 35, color: "#8884d8" },
          { name: "求人サイト", value: 25, color: "#82ca9d" },
          { name: "転職エージェント", value: 20, color: "#ffc658" },
          { name: "企業HP", value: 15, color: "#ff7c7c" },
          { name: "その他", value: 5, color: "#8dd1e1" },
        ],
      },
      group_companies_known: {
        multipleChoiceData: [
          { name: "20社以上", value: 15, color: "#8884d8" },
          { name: "10社程度", value: 25, color: "#82ca9d" },
          { name: "5社程度", value: 35, color: "#ffc658" },
          { name: "2-3社程度", value: 20, color: "#ff7c7c" },
          { name: "知らない", value: 5, color: "#8dd1e1" },
        ],
      },
      concerns: {
        aiCategoryData: [
          { name: "改善提案", value: 35, color: "#8884d8" },
          { name: "ポジティブ意見", value: 28, color: "#82ca9d" },
          { name: "制度・環境", value: 20, color: "#ffc658" },
          { name: "人間関係", value: 12, color: "#ff7c7c" },
          { name: "ネガティブ意見", value: 8, color: "#ff4444" },
          { name: "その他", value: 5, color: "#cccccc" },
        ],
        representativeAnswers: [
          {
            category: "改善提案",
            count: 35,
            example: "コミュニケーションツールをもっと使いやすくしてほしい。",
          },
          {
            category: "制度・環境",
            count: 20,
            example: "研修制度をもう少し充実させてほしいです。",
          },
        ],
      },
    },
  }

  const [selectedCompany, setSelectedCompany] = useState("全社")
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  // ローディング表示
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>分析データを読み込み中...</span>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // エラー表示
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/')}>
          ホームに戻る
        </Button>
      </div>
    )
  }

  // 選択された設問のデータを取得
  const getCurrentQuestionData = (questionId: string) => {
    return (questionDataByYear as any)[selectedAnalysisYear]?.[questionId] || {}
  }

  // 設問をクリックした時の処理
  const handleQuestionClick = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId)
  }

  // 分析タイプに応じたグラフコンポーネントを返す
  const renderAnalysisChart = (questionId: string, analysisType: string) => {
    const data = getCurrentQuestionData(questionId)

    switch (analysisType) {
      case "distribution":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.distribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "jobType":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.jobTypeScores} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jobType" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="score" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "demographic":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.demographicData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="score" fill="#ffc658" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "trend":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )

      case "multipleChoice":
        return (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.multipleChoiceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.multipleChoiceData?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )

      case "textAnalysis":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.aiCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.aiCategoryData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">代表的な回答例</h4>
              {data.representativeAnswers?.map((item: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-sm">{item.category}</span>
                    <span className="text-xs text-muted-foreground">({item.count}件)</span>
                  </div>
                  <blockquote className="text-sm text-muted-foreground italic">"{item.example}"</blockquote>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return <div>データがありません</div>
    }
  }

  // 分析タイプの表示名を取得
  const getAnalysisTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      distribution: "回答分布",
      jobType: "職種別分析",
      demographic: "年代別分析",
      trend: "経年変化",
      multipleChoice: "選択肢分析",
      textAnalysis: "テキスト分析",
    }
    return names[type] || type
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">従業員満足度分析</h1>
          <p className="text-muted-foreground">アップロードされた従業員満足度調査の詳細分析結果</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="会社を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="全社">全社</SelectItem>
              <SelectItem value="ダイセーホールディングス">ダイセーホールディングス</SelectItem>
              <SelectItem value="ダイセー運輸">ダイセー運輸</SelectItem>
              <SelectItem value="ダイセーロジスティクス">ダイセーロジスティクス</SelectItem>
              <SelectItem value="ダイセー建設">ダイセー建設</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedAnalysisYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="年度を選択" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総回答者数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.totalResponses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summaryData?.previousComparison || '前回調査との比較データなし'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 設問別分析 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">設問別分析</h2>

        {questions.map((question) => (
          <Card key={question.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto text-left"
                onClick={() => handleQuestionClick(question.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`text-xs ${question.categoryColor}`}>
                      {question.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {question.responseType}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{question.title}</CardTitle>
                </div>
                {expandedQuestion === question.id ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
            </CardHeader>

            {expandedQuestion === question.id && (
              <CardContent className="pt-0">
                <Tabs defaultValue={question.analysisTypes[0]} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    {question.analysisTypes.map((type: string) => (
                      <TabsTrigger key={type} value={type} className="text-xs">
                        {getAnalysisTypeName(type)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {question.analysisTypes.map((type: string) => (
                    <TabsContent key={type} value={type} className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">{getAnalysisTypeName(type)}</CardTitle>
                          <CardDescription>
                            {question.title}の{getAnalysisTypeName(type).toLowerCase()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>{renderAnalysisChart(question.id, type)}</CardContent>
                      </Card>

                      {/* 統計情報（満足度系の設問のみ） */}
                      {type === "distribution" && getCurrentQuestionData(question.id).averageScore && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">統計サマリー</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4 md:grid-cols-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                  {getCurrentQuestionData(question.id).averageScore}
                                </div>
                                <p className="text-sm text-muted-foreground">平均スコア</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {getCurrentQuestionData(question.id).satisfiedPercentage}%
                                </div>
                                <p className="text-sm text-muted-foreground">満足以上</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                  {getCurrentQuestionData(question.id).neutralPercentage}%
                                </div>
                                <p className="text-sm text-muted-foreground">普通</p>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                  {getCurrentQuestionData(question.id).dissatisfiedPercentage}%
                                </div>
                                <p className="text-sm text-muted-foreground">不満以下</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <RequireAuth>
      <AnalysisPage />
    </RequireAuth>
  )
}
