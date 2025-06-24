'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { authService, type AuthUser } from '@/lib/supabase/auth'

interface AuthContextType {
  user: User | null
  profile: AuthUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, name: string, company?: string) => Promise<any>
  signOut: () => Promise<any>
  resetPassword: (email: string) => Promise<any>
  updatePassword: (newPassword: string) => Promise<any>
  isAdmin: boolean
  isActive: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初期認証状態を取得（簡略化版）
    const getInitialAuth = async () => {
      try {
        console.log('🔄 認証状態の初期化を開始')
        
        // タイムアウトを設定（10秒でタイムアウト）
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('認証チェックがタイムアウトしました')), 10000)
        })

        const authPromise = authService.getCurrentUser()
        
        const { user, profile, session } = await Promise.race([authPromise, timeoutPromise]) as any
        
        console.log('✅ 認証状態取得完了:', {
          hasUser: !!user,
          hasProfile: !!profile,
          hasSession: !!session
        })
        
        setUser(user)
        setProfile(profile)
        setSession(session)
      } catch (error) {
        console.error('❌ 認証初期化エラー:', error)
        // エラーが発生しても認証なしで継続
        setUser(null)
        setProfile(null)
        setSession(null)
      } finally {
        console.log('🏁 認証初期化完了')
        setLoading(false)
      }
    }

    getInitialAuth()

    // 認証状態変更を監視（簡略化）
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session)
        
        if (session) {
          setSession(session)
          setUser(session.user)
          // デフォルトプロファイルを設定
          setProfile({
            id: session.user.id,
            email: session.user.email || '',
            name: 'User',
            role: 'admin',
            is_active: true
          })
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await authService.signIn({ email, password })
      
      if (result.success) {
        // 認証状態を即座に更新
        setUser(result.user || null)
        setSession(result.session || null)
        setProfile(result.profile || null)
        
        // sessionStorageに認証状態を保存（画面遷移時の状態同期用）
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('auth_pending', JSON.stringify({
            user: result.user,
            profile: result.profile,
            timestamp: Date.now()
          }))
        }
        
        // DOM更新を確実にするため、次のイベントループで完了を通知
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('Auth context state updated:', {
          user: result.user?.id,
          profile: result.profile?.role,
          session: !!result.session
        })
      }
      
      return result
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string, company?: string) => {
    setLoading(true)
    try {
      const result = await authService.signUp({ email, password, name, company })
      return result
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const result = await authService.signOut()
      
      if (result.success) {
        setUser(null)
        setSession(null)
        setProfile(null)
      }
      
      return result
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  const updatePassword = async (newPassword: string) => {
    return await authService.updatePassword(newPassword)
  }

  const isAdmin = profile?.role === 'admin'
  const isActive = profile?.is_active === true

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isAdmin,
    isActive
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useRequireAuth() {
  const auth = useAuth()
  
  useEffect(() => {
    if (!auth.loading && !auth.user) {
      // ログインページにリダイレクト
      window.location.href = '/auth/signin'
    }
  }, [auth.loading, auth.user])

  return auth
}

export function useRequireAdmin() {
  const auth = useRequireAuth()
  
  useEffect(() => {
    if (!auth.loading && auth.user && !auth.isAdmin) {
      // 権限エラーページにリダイレクト
      window.location.href = '/unauthorized'
    }
  }, [auth.loading, auth.user, auth.isAdmin])

  return auth
}