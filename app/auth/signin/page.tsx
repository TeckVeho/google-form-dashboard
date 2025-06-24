'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth/auth-context'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Starting sign in process...')
      const result = await signIn(email, password)
      console.log('Sign in result:', result)
      
      if (result.success) {
        console.log('Sign in successful, waiting for auth state update...')
        // 認証状態が更新されるまで待機
        let attempts = 0
        const maxAttempts = 10
        
        const checkAuthState = () => {
          attempts++
          console.log(`Checking auth state (attempt ${attempts})...`)
          
          // 認証コンテキストから現在の状態を取得
          const { user: currentUser } = result
          
          if (currentUser || attempts >= maxAttempts) {
            console.log('Auth state confirmed, redirecting...')
            window.location.replace('/')
          } else {
            setTimeout(checkAuthState, 200)
          }
        }
        
        // 初回チェックを開始
        setTimeout(checkAuthState, 300)
      } else {
        console.error('Sign in failed:', result.error)
        setError(result.error || 'ログインに失敗しました')
        setLoading(false)
      }
    } catch (error) {
      console.error('Sign in form error:', error)
      setError('ログイン処理中にエラーが発生しました')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            ログイン
          </CardTitle>
          <CardDescription className="text-center">
            従業員満足度調査ダッシュボードにアクセス
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                パスワードを忘れた方
              </Link>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ログイン
            </Button>
            
            <div className="text-center text-sm">
              アカウントをお持ちでない方は{' '}
              <Link
                href="/auth/signup"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                新規登録
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}