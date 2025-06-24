import { supabase } from './client'

/**
 * Supabase接続テスト関数
 * 環境変数が正しく設定されているかテストします
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔄 Supabase接続テストを開始...')
    
    // Supabaseの基本接続テスト
    const { data, error } = await supabase
      .from('uploads')  // まだテーブルが存在しないため、エラーが出る可能性があります
      .select('count')
      .limit(1)
    
    if (error) {
      // テーブルが存在しない場合はOK（後で作成するため）
      if (error.message.includes('does not exist')) {
        console.log('✅ Supabase接続成功！（テーブルはまだ作成されていません）')
        return true
      }
      console.error('❌ Supabase接続エラー:', error.message)
      return false
    }
    
    console.log('✅ Supabase接続成功！')
    return true
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
    return false
  }
}

/**
 * 環境変数の存在をチェック
 */
export function checkEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    console.error('❌ 不足している環境変数:', missing.join(', '))
    console.log('💡 .env.localファイルを作成し、以下の変数を設定してください:')
    missing.forEach(varName => {
      console.log(`   ${varName}=your_value_here`)
    })
    return false
  }
  
  console.log('✅ 必要な環境変数がすべて設定されています')
  return true
}