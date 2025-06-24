import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 一時的に認証を無効にするため、以下をコメントアウト
  /*
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ユーザーセッションを更新
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 認証が不要なパス
  const publicPaths = [
    '/auth/signin',
    '/auth/signup', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/unauthorized'
  ]

  // API認証が不要なパス
  const publicApiPaths = [
    '/api/test-connection',
    '/api/test-database',
    '/api/test-storage'
  ]

  // 認証ページに既にアクセス済みで、ログイン済みの場合はダッシュボードにリダイレクト
  if (user && publicPaths.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 認証が必要なページで未ログインの場合
  if (!user && !publicPaths.includes(pathname) && !publicApiPaths.some(path => pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // ユーザープロファイルをチェック（ログイン済みの場合）
  if (user && !publicPaths.includes(pathname)) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      // プロファイルが存在しない場合（新規ユーザー）
      if (error || !profile) {
        // プロファイル作成ページにリダイレクト（実装予定）
        console.warn('User profile not found, but allowing access:', user.id)
        // プロファイルがなくても認証済みユーザーはアクセス許可
      }

      // 非アクティブユーザーの場合
      if (profile && profile.status !== 'active') {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }

      // 管理者専用ページのアクセス制御
      const adminOnlyPaths = ['/users']
      
      if (adminOnlyPaths.some(path => pathname.startsWith(path))) {
        if (!profile || profile.role !== 'admin') {
          const url = request.nextUrl.clone()
          url.pathname = '/unauthorized'
          return NextResponse.redirect(url)
        }
      }

    } catch (error) {
      console.error('Middleware profile check error:', error)
      // エラーが発生した場合はアクセスを許可（セッション管理に委ねる）
    }
  }
  */

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}