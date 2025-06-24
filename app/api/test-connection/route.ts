import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { checkEnvironmentVariables, testSupabaseConnection } from '@/lib/supabase/test-connection'

export async function GET() {
  try {
    console.log('🔄 Supabase接続テストを開始...')
    
    // 1. 環境変数チェック
    console.log('1. 環境変数をチェック中...')
    const envCheck = checkEnvironmentVariables()
    
    if (!envCheck) {
      return NextResponse.json({
        success: false,
        error: '環境変数が正しく設定されていません',
        details: '必要な環境変数: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
      }, { status: 400 })
    }
    
    // 2. Supabase基本接続テスト
    console.log('2. Supabase基本接続をテスト中...')
    
    // プロジェクト情報を取得してテスト
    const { data, error } = await supabase
      .from('_supabase_migrations')  // システムテーブルで接続テスト
      .select('version')
      .limit(1)
    
    if (error) {
      // テーブルが存在しない場合でも、認証エラーでなければ接続は成功
      if (error.message.includes('does not exist') || error.message.includes('permission denied')) {
        console.log('✅ Supabase接続成功！（テーブルはまだ作成されていません）')
        return NextResponse.json({
          success: true,
          message: 'Supabase接続成功！データベースは設定準備完了状態です。',
          projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonymousKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          nextSteps: [
            'Phase 2-2: データベーススキーマの作成',
            'Phase 2-3: ストレージバケットの設定'
          ]
        })
      } else {
        console.error('❌ Supabase接続エラー:', error.message)
        return NextResponse.json({
          success: false,
          error: 'Supabase接続エラー',
          details: error.message,
          suggestions: [
            '環境変数の値が正しいか確認してください',
            'Supabaseプロジェクトが正常に作成されているか確認してください',
            'APIキーが有効期限内であることを確認してください'
          ]
        }, { status: 500 })
      }
    }
    
    // 正常にデータが取得できた場合
    console.log('✅ Supabase接続成功！システムテーブルにアクセス可能です。')
    return NextResponse.json({
      success: true,
      message: 'Supabase接続完全成功！',
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonymousKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      migrationsFound: data?.length || 0,
      status: 'ready_for_development'
    })
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
    return NextResponse.json({
      success: false,
      error: '予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 })
  }
}