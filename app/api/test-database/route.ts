import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    console.log('🔄 データベーステーブル確認を開始...')
    
    // 1. テーブル一覧の確認
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .order('table_name')
    
    if (tablesError) {
      console.error('❌ テーブル一覧取得エラー:', tablesError.message)
      return NextResponse.json({
        success: false,
        error: 'テーブル一覧取得エラー',
        details: tablesError.message
      }, { status: 500 })
    }
    
    // 2. 各テーブルのレコード数確認
    const tableCounts: { [key: string]: number } = {}
    const expectedTables = ['uploads', 'questions', 'companies', 'analysis_results', 'raw_responses', 'user_profiles']
    
    for (const tableName of expectedTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.warn(`⚠️ テーブル ${tableName} のカウント取得エラー:`, error.message)
          tableCounts[tableName] = -1 // エラーを示す
        } else {
          tableCounts[tableName] = count || 0
        }
      } catch (err) {
        console.warn(`⚠️ テーブル ${tableName} のアクセスエラー:`, err)
        tableCounts[tableName] = -1
      }
    }
    
    // 3. サンプルデータの確認
    const sampleData: any = {}
    
    // 会社データの確認
    try {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('name, display_name')
        .limit(5)
      
      if (!companiesError) {
        sampleData.companies = companies
      }
    } catch (err) {
      console.warn('会社データの取得エラー:', err)
    }
    
    // 設問データの確認
    try {
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, title, category')
        .limit(5)
      
      if (!questionsError) {
        sampleData.questions = questions
      }
    } catch (err) {
      console.warn('設問データの取得エラー:', err)
    }
    
    // 4. 結果の評価
    const createdTables = tables?.map(t => t.table_name) || []
    const missingTables = expectedTables.filter(table => !createdTables.includes(table))
    const tablesWithData = Object.entries(tableCounts).filter(([, count]) => count > 0)
    
    const success = missingTables.length === 0 && tablesWithData.length >= 2
    
    console.log(success ? '✅ データベースセットアップ確認成功！' : '⚠️ データベースセットアップに問題があります')
    
    return NextResponse.json({
      success,
      message: success 
        ? 'データベースが正常にセットアップされています！' 
        : 'データベースセットアップを完了してください',
      details: {
        createdTables,
        missingTables,
        tableCounts,
        sampleData,
        recommendations: success ? [
          'Phase 2-3: ストレージ設定に進む準備完了',
          'Phase 2-5: Excel解析エンジン開発の準備完了'
        ] : [
          'Supabase SQLエディタでスキーマを実行してください',
          '詳細: tmp/database-setup-instructions.md を参照'
        ]
      }
    })
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
    return NextResponse.json({
      success: false,
      error: '予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : '不明なエラー',
      suggestions: [
        '環境変数が正しく設定されているか確認してください',
        'Supabaseプロジェクトの状態を確認してください'
      ]
    }, { status: 500 })
  }
}