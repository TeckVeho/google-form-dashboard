'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  fallbackUrl?: string
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  fallbackUrl 
}: AuthGuardProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // 認証チェック
  useEffect(() => {
    if (loading) return

    // 認証が必要だが未ログインの場合
    if (requireAuth && !user) {
      console.log('AuthGuard: No user, redirecting to signin')
      router.replace(fallbackUrl || '/auth/signin')
      return
    }

    // 管理者権限が必要だが権限がない場合
    if (requireAdmin && user && profile && profile.role !== 'admin') {
      console.log('AuthGuard: User is not admin, redirecting to unauthorized')
      router.replace('/unauthorized')
      return
    }

    // アカウントが無効な場合
    if (user && profile && !profile.is_active) {
      console.log('AuthGuard: User is inactive, redirecting to unauthorized')
      router.replace('/unauthorized')
      return
    }

    console.log('AuthGuard: Authentication check passed', {
      user: !!user,
      profile: !!profile,
      requireAuth,
      requireAdmin
    })
  }, [user, profile, loading, requireAuth, requireAdmin, router, fallbackUrl])

  // ローディング中は表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // 認証が必要だが未ログインの場合は何も表示しない（リダイレクト処理中）
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">ログインページに移動中...</p>
        </div>
      </div>
    )
  }

  // ユーザーは存在するがプロファイルがまだ読み込まれていない場合は待機
  if (user && !profile && (requireAdmin || user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">プロファイル情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  // 管理者権限チェック
  if (requireAdmin && user && profile && profile.role !== 'admin') return null
  
  // アクティブ状態チェック
  if (user && profile && !profile.is_active) return null

  // 認証チェックを通過した場合に子コンポーネントを表示
  return <>{children}</>
}

// よく使用されるガードコンポーネント
export function RequireAuth({ children, fallbackUrl }: { 
  children: React.ReactNode
  fallbackUrl?: string 
}) {
  return (
    <AuthGuard requireAuth={true} fallbackUrl={fallbackUrl}>
      {children}
    </AuthGuard>
  )
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      {children}
    </AuthGuard>
  )
}

// ページレベルで使用するHOC
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean
    requireAdmin?: boolean
    fallbackUrl?: string
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}

export function withAdminAuth<P extends object>(Component: React.ComponentType<P>) {
  return withAuth(Component, { requireAuth: true, requireAdmin: true })
}