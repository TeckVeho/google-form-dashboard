import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 アップロードデバッグ開始')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const year = formData.get('year') as string

    console.log('📋 フォームデータ:', {
      fileExists: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      year
    })

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    if (!year) {
      return NextResponse.json(
        { error: '年度が選択されていません' },
        { status: 400 }
      )
    }

    // Supabaseクライアントテスト
    console.log('🔗 Supabaseクライアント作成中...')
    const supabase = await createClient()
    console.log('✅ Supabaseクライアント作成完了')

    // 環境変数チェック
    console.log('🔧 環境変数チェック:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
    })

    // ユーザー認証チェック
    console.log('👤 ユーザー認証チェック中...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('👤 ユーザー情報:', {
      isAuthenticated: !!user,
      userId: user?.id,
      authError: authError?.message
    })

    if (authError) {
      return NextResponse.json(
        { error: '認証エラー: ' + authError.message },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが認証されていません' },
        { status: 401 }
      )
    }

    // ストレージバケット存在チェック
    console.log('📦 ストレージバケットチェック中...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    console.log('📦 バケット情報:', {
      bucketsCount: buckets?.length || 0,
      hasSurveyFiles: buckets?.some(b => b.name === 'survey-files'),
      bucketsError: bucketsError?.message,
      bucketNames: buckets?.map(b => b.name)
    })

    // テーブル存在チェック
    console.log('🗄️ テーブルチェック中...')
    const { data: tableTest, error: tableError } = await supabase
      .from('uploads')
      .select('count', { count: 'exact', head: true })
    
    console.log('🗄️ テーブル情報:', {
      tableExists: !tableError,
      tableError: tableError?.message,
      recordCount: tableTest
    })

    return NextResponse.json({
      success: true,
      debug: {
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        year,
        supabase: {
          connected: true,
          user: !!user,
          bucketsAvailable: buckets?.length || 0,
          hasSurveyFilesBucket: buckets?.some(b => b.name === 'survey-files'),
          uploadsTableExists: !tableError
        }
      },
      message: 'デバッグ情報の取得が完了しました'
    })

  } catch (error) {
    console.error('❌ デバッグエラー:', error)
    console.error('詳細エラー情報:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      errorObject: error
    })
    
    return NextResponse.json(
      { 
        error: 'デバッグ処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 