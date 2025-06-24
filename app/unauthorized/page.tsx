'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth/auth-context'
import { ShieldX, Home, LogOut } from 'lucide-react'

export default function UnauthorizedPage() {
  const { user, profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/signin'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <ShieldX className="h-16 w-16 text-red-500 mx-auto" />
          <CardTitle className="text-2xl font-bold text-red-700">
            アクセス権限がありません
          </CardTitle>
          <CardDescription>
            このページにアクセスする権限がありません
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!user ? (
            <Alert>
              <AlertDescription>
                このページを表示するにはログインが必要です。
              </AlertDescription>
            </Alert>
          ) : profile?.is_active === false ? (
            <Alert variant="destructive">
              <AlertDescription>
                アカウントが無効化されています。管理者にお問い合わせください。
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                管理者権限が必要なページです。アクセス権限の付与については管理者にお問い合わせください。
              </AlertDescription>
            </Alert>
          )}
          
          {user && (
            <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
              <p><strong>ユーザー:</strong> {profile?.name || user.email}</p>
              <p><strong>メール:</strong> {user.email}</p>
              <p><strong>権限:</strong> {profile?.role || '未設定'}</p>
              <p><strong>状態:</strong> {profile?.is_active ? 'アクティブ' : '無効'}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          {user ? (
            <>
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  ダッシュボードに戻る
                </Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                ログインページへ
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}