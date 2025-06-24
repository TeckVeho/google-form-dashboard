import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Supabase詳細デバッグ開始')
    
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔧 環境変数詳細:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl?.substring(0, 30) + '...',
      keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
      urlLength: supabaseUrl?.length,
      keyLength: supabaseAnonKey?.length
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: '環境変数が設定されていません',
        details: {
          NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey
        }
      }, { status: 500 })
    }

    // Supabaseクライアント作成テスト
    console.log('🔗 Supabaseクライアント作成テスト')
    const supabase = await createClient()
    
    // 基本的な接続テスト
    console.log('🌐 Supabase接続テスト開始')
    
    try {
      // 1. セッション取得テスト
      console.log('📋 セッション取得テスト')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('📊 セッション結果:', {
        hasSession: !!session,
        sessionError: sessionError?.message,
        sessionExpiry: session?.expires_at
      })

      // 2. ユーザー取得テスト
      console.log('👤 ユーザー取得テスト')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      console.log('👤 ユーザー結果:', {
        hasUser: !!user,
        userError: userError?.message,
        userId: user?.id,
        userEmail: user?.email
      })

      // 3. 基本的なデータベースクエリテスト（テーブルなしでも実行可能）
      console.log('🗄️ データベース接続テスト')
      const { data: dbTest, error: dbError } = await supabase
        .from('nonexistent_table')
        .select('*')
        .limit(1)
      
      console.log('🗄️ データベース結果:', {
        dbError: dbError?.message,
        dbErrorCode: dbError?.code,
        // 404 Not Found や relation does not exist は正常（テーブルが存在しないため）
        isConnectionOk: dbError?.code === 'PGRST116' || dbError?.message?.includes('relation') || dbError?.code === '42P01'
      })

      // 4. ストレージ接続テスト
      console.log('📦 ストレージ接続テスト')
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
      
      console.log('📦 ストレージ結果:', {
        bucketsCount: buckets?.length || 0,
        storageError: storageError?.message,
        bucketNames: buckets?.map(b => b.name) || []
      })

      // 5. Auth設定確認
      console.log('🔐 Auth設定確認')
      const { data: authSettings, error: authError } = await supabase.auth.getUser()
      
      return NextResponse.json({
        success: true,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          urlFormat: supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co'),
          keyFormat: supabaseAnonKey?.startsWith('eyJ') // JWTトークンの開始
        },
        connection: {
          session: {
            exists: !!session,
            error: sessionError?.message
          },
          user: {
            exists: !!user,
            error: userError?.message,
            id: user?.id
          },
          database: {
            connected: dbError?.code === 'PGRST116' || dbError?.message?.includes('relation') || dbError?.code === '42P01',
            error: dbError?.message,
            code: dbError?.code
          },
          storage: {
            connected: !storageError,
            bucketsCount: buckets?.length || 0,
            error: storageError?.message
          }
        },
        recommendations: [
          !supabaseUrl?.startsWith('https://') ? 'URLがhttps://で始まることを確認してください' : null,
          !supabaseUrl?.includes('.supabase.co') ? 'URLが正しいSupabaseドメインであることを確認してください' : null,
          !supabaseAnonKey?.startsWith('eyJ') ? 'Anon Keyが正しいJWTトークン形式であることを確認してください' : null,
          userError?.message?.includes('session missing') ? 'Supabaseプロジェクトでユーザー認証が有効になっているか確認してください' : null
        ].filter(Boolean),
        timestamp: new Date().toISOString()
      })

    } catch (connectionError) {
      console.error('❌ Supabase接続エラー:', connectionError)
      
      return NextResponse.json({
        success: false,
        error: '接続テスト中にエラーが発生しました',
        details: {
          message: connectionError instanceof Error ? connectionError.message : 'Unknown error',
          type: typeof connectionError
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Supabaseデバッグエラー:', error)
    
    return NextResponse.json({
      success: false,
      error: 'デバッグ処理中にエラーが発生しました',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 })
  }
} 