"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, BarChart3, Users, TrendingUp, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RequireAuth } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth/auth-context"
import { Progress } from "@/components/ui/progress"

function HomePage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedYear, setSelectedYear] = useState("2024年")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const router = useRouter()
  const { user } = useAuth()

  // 年度選択のオプション
  const availableYears = ["2022年", "2023年", "2024年", "2025年"]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleAuthCheck = async () => {
    try {
      const response = await fetch('/api/auth-status')
      const result = await response.json()

      console.log('🔍 認証状態チェック結果:', result)
      setUploadSuccess(`認証状態: ${JSON.stringify(result, null, 2)}`)

    } catch (error) {
      console.error('Auth check error:', error)
      setUploadError(error instanceof Error ? error.message : '認証状態の確認に失敗しました')
    }
  }

  const handleSupabaseDebug = async () => {
    try {
      setUploadError(null)
      setUploadSuccess('Supabase診断を実行中...')

      const response = await fetch('/api/supabase-debug')
      const result = await response.json()

      console.log('🔍 Supabase詳細診断結果:', result)

      // 結果をより読みやすい形式で表示
      let message = '=== Supabase詳細診断結果 ===\n\n'

      if (result.success) {
        message += '✅ 環境設定:\n'
        message += `  - URL設定: ${result.environment.hasUrl ? '✓' : '✗'}\n`
        message += `  - APIキー設定: ${result.environment.hasKey ? '✓' : '✗'}\n`
        message += `  - URL形式: ${result.environment.urlFormat ? '✓' : '✗'}\n`
        message += `  - キー形式: ${result.environment.keyFormat ? '✓' : '✗'}\n\n`

        message += '🔗 接続状況:\n'
        message += `  - データベース: ${result.connection.database.connected ? '✓ 接続OK' : '✗ 接続NG'}\n`
        message += `  - ストレージ: ${result.connection.storage.connected ? '✓ 接続OK' : '✗ 接続NG'}\n`
        message += `  - セッション: ${result.connection.session.exists ? '✓ 存在' : '✗ なし'}\n`
        message += `  - ユーザー: ${result.connection.user.exists ? '✓ 認証済み' : '✗ 未認証'}\n\n`

        if (result.connection.session.error) {
          message += `❌ セッションエラー: ${result.connection.session.error}\n`
        }
        if (result.connection.user.error) {
          message += `❌ ユーザーエラー: ${result.connection.user.error}\n`
        }

        if (result.recommendations && result.recommendations.length > 0) {
          message += '\n💡 推奨事項:\n'
          result.recommendations.forEach((rec: string, index: number) => {
            message += `  ${index + 1}. ${rec}\n`
          })
        }
      } else {
        message += `❌ エラー: ${result.error}\n`
        if (result.details) {
          message += `詳細: ${JSON.stringify(result.details, null, 2)}\n`
        }
      }

      setUploadSuccess(message)

    } catch (error) {
      console.error('Supabase debug error:', error)
      setUploadError(error instanceof Error ? error.message : 'Supabase診断に失敗しました')
    }
  }

  const handleLocalUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('year', selectedYear)

      // プログレスのシミュレーション
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/local-upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ローカル保存版アップロードに失敗しました')
      }

      setUploadSuccess('ローカル保存版アップロードと解析が完了しました！分析結果が保存されました。')

      // 3秒後に結果を表示
      setTimeout(() => {
        alert(`アップロード完了!\nファイル: ${result.data.filename}\n回答数: ${result.data.total_responses}\nアップロードID: ${result.data.id}\n\n分析結果は tmp/uploads/ フォルダに保存されました。`)
      }, 2000)

    } catch (error) {
      console.error('Local upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'ローカル保存版アップロードに失敗しました')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleBypassUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('year', selectedYear)

      // プログレスのシミュレーション
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/bypass-auth-upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '認証バイパス版アップロードに失敗しました')
      }

      setUploadSuccess('認証バイパス版アップロードと解析が完了しました！')

      // 3秒後に結果を表示（実際のIDの代わりにmock IDを使用）
      setTimeout(() => {
        alert(`アップロード完了!\nファイル: ${result.data.filename}\n回答数: ${result.data.total_responses}`)
      }, 2000)

    } catch (error) {
      console.error('Bypass upload error:', error)
      setUploadError(error instanceof Error ? error.message : '認証バイパス版アップロードに失敗しました')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const handleManualLogin = async () => {
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      // クライアントサイドで直接Supabase認証を試行
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      console.log('🔐 手動ログイン試行: test@example.com')

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123456'
      })

      if (error) {
        console.error('手動ログインエラー:', error)
        throw new Error(`ログインに失敗しました: ${error.message}`)
      }

      console.log('✅ 手動ログイン成功:', {
        user: data.user?.id,
        session: !!data.session
      })

      setUploadSuccess(`手動ログイン成功！\nユーザーID: ${data.user?.id}\nメール: ${data.user?.email}`)

      // 認証状態を更新するためにページを再読み込み
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('Manual login error:', error)
      setUploadError(error instanceof Error ? error.message : '手動ログインに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const handleDevLogin = async () => {
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const response = await fetch('/api/dev-login', {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'テストログインに失敗しました')
      }

      setUploadSuccess(result.message || 'テストログインが完了しました')

      // ページを再読み込みして認証状態を更新
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Dev login error:', error)
      setUploadError(error instanceof Error ? error.message : 'テストログインに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const handleDebugUpload = async () => {
    if (!file || !user) return

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('year', selectedYear)

      const response = await fetch('/api/test-upload-debug', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'デバッグチェックに失敗しました')
      }

      console.log('🔍 デバッグ結果:', result)
      setUploadSuccess(`デバッグ完了: ${JSON.stringify(result.debug, null, 2)}`)

    } catch (error) {
      console.error('Debug error:', error)
      setUploadError(error instanceof Error ? error.message : 'デバッグに失敗しました')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('year', selectedYear)

      // プログレスのシミュレーション
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'アップロードに失敗しました')
      }

      setUploadSuccess('Excelファイルのアップロードと解析が完了しました！')

      // 3秒後に分析ページに移動
      setTimeout(() => {
        router.push(`/analysis?id=${result.upload.id}`)
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      // より詳細なエラーメッセージを表示
      let errorMessage = 'アップロードに失敗しました'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      console.error('詳細なエラー情報:', {
        errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: typeof error,
        errorObject: error
      })
      setUploadError(errorMessage)
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* ヘッダーセクション */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">従業員満足度調査ダッシュボード</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          従業員満足度調査の結果をExcelでアップロードし、 美しいグラフと統計で分析結果を可視化します
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* CSVアップロードセクション */}
        <Card className="col-span-full md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Excelファイルアップロード</span>
            </CardTitle>
            <CardDescription>GoogleフォームからエクスポートしたExcelファイルをアップロードしてください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Excelファイルを選択</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-select">調査年度</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="年度を選択" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {file && (
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  選択されたファイル: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  <br />
                  調査年度: {selectedYear}
                </AlertDescription>
              </Alert>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>アップロード中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {uploadSuccess && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{uploadSuccess}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
                {uploading ? "アップロード中..." : "アップロード開始"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 機能紹介セクション */}
        <Card>
          <CardHeader>
            <CardTitle>主な機能</CardTitle>
            <CardDescription>このダッシュボードで利用できる分析機能</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">グラフ可視化</h4>
                <p className="text-sm text-muted-foreground">従業員満足度を視覚的に表示</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">基本統計</h4>
                <p className="text-sm text-muted-foreground">回答者数、参加率、満足度スコアなどの統計情報</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">フィルタ機能</h4>
                <p className="text-sm text-muted-foreground">満足度項目別の絞り込みと検索機能</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 使い方ガイド */}
      <Card>
        <CardHeader>
          <CardTitle>使い方ガイド</CardTitle>
          <CardDescription>3つの簡単なステップでアンケート結果を分析できます</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-medium">Excelアップロード</h4>
              <p className="text-sm text-muted-foreground">
                GoogleフォームからエクスポートしたExcelファイルをアップロード
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-medium">分析ページで確認</h4>
              <p className="text-sm text-muted-foreground">従業員満足度を視覚的に分析</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-medium">データエクスポート</h4>
              <p className="text-sm text-muted-foreground">分析結果をExcelやPDFでエクスポート</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Page() {
  return (
    <RequireAuth>
      <HomePage />
    </RequireAuth>
  )
}
