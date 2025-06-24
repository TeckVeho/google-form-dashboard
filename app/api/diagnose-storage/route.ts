import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('🔄 ストレージ診断を開始...')
    
    // 環境変数チェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: '環境変数が不足しています',
        envCheck: {
          NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anonKey,
          SUPABASE_SERVICE_ROLE_KEY: !!serviceKey
        }
      }, { status: 400 })
    }
    
    // 複数の方法でストレージにアクセスしてみる
    const results: any = {
      envCheck: {
        NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anonKey,
        SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
        projectUrl: supabaseUrl
      },
      tests: {}
    }
    
    // 1. Anonymous keyでのテスト
    const anonClient = createClient(supabaseUrl, anonKey)
    try {
      const { data: anonBuckets, error: anonError } = await anonClient.storage.listBuckets()
      results.tests.anonymousAccess = {
        success: !anonError,
        bucketCount: anonBuckets?.length || 0,
        buckets: anonBuckets?.map(b => b.name) || [],
        error: anonError?.message
      }
    } catch (error) {
      results.tests.anonymousAccess = {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      }
    }
    
    // 2. Service role keyでのテスト
    if (serviceKey) {
      const serviceClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      
      try {
        const { data: serviceBuckets, error: serviceError } = await serviceClient.storage.listBuckets()
        results.tests.serviceRoleAccess = {
          success: !serviceError,
          bucketCount: serviceBuckets?.length || 0,
          buckets: serviceBuckets?.map(b => ({
            name: b.name,
            public: b.public,
            created_at: b.created_at
          })) || [],
          error: serviceError?.message
        }
      } catch (error) {
        results.tests.serviceRoleAccess = {
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー'
        }
      }
    } else {
      results.tests.serviceRoleAccess = {
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY が設定されていません'
      }
    }
    
    // 3. REST APIでの直接確認
    try {
      const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        }
      })
      
      if (response.ok) {
        const buckets = await response.json()
        results.tests.restApiAccess = {
          success: true,
          bucketCount: buckets?.length || 0,
          buckets: buckets?.map((b: any) => b.name) || [],
          status: response.status
        }
      } else {
        const errorText = await response.text()
        results.tests.restApiAccess = {
          success: false,
          status: response.status,
          error: errorText
        }
      }
    } catch (error) {
      results.tests.restApiAccess = {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      }
    }
    
    // 4. 診断結果の評価
    const hasAnyBuckets = (
      results.tests.anonymousAccess?.bucketCount > 0 ||
      results.tests.serviceRoleAccess?.bucketCount > 0 ||
      results.tests.restApiAccess?.bucketCount > 0
    )
    
    const hasExcelFilesBucket = [
      ...(results.tests.anonymousAccess?.buckets || []),
      ...(results.tests.serviceRoleAccess?.buckets?.map((b: any) => b.name) || []),
      ...(results.tests.restApiAccess?.buckets || [])
    ].includes('excel-files')
    
    // 5. 推奨アクション
    let recommendations: string[] = []
    
    if (!hasAnyBuckets) {
      recommendations = [
        '🔧 Supabaseプロジェクトでストレージ機能が有効化されているか確認',
        '🔧 プロジェクト設定 → Storage → Enable storage',
        '🔧 tmp/storage-setup.sql をSQL Editorで実行',
        '🔧 ブラウザでSupabaseダッシュボード → Storage → Buckets を直接確認'
      ]
    } else if (!hasExcelFilesBucket) {
      recommendations = [
        '🔧 excel-filesバケットを手動作成: Dashboard → Storage → New bucket',
        '🔧 または tmp/storage-setup.sql を実行してバケット作成',
        '🔧 バケット名は正確に "excel-files" とする'
      ]
    } else {
      recommendations = [
        '✅ ストレージとバケットは正常に設定されています',
        '✅ Phase 2-5: Excel解析エンジン開発の準備完了'
      ]
    }
    
    return NextResponse.json({
      success: hasExcelFilesBucket,
      message: hasExcelFilesBucket 
        ? 'ストレージとexcel-filesバケットが正常に確認できました！'
        : hasAnyBuckets 
          ? 'ストレージは有効ですが、excel-filesバケットが見つかりません'
          : 'ストレージ機能が有効化されていない可能性があります',
      results,
      summary: {
        storageEnabled: hasAnyBuckets,
        excelFilesBucket: hasExcelFilesBucket,
        totalTests: Object.keys(results.tests).length,
        successfulTests: Object.values(results.tests).filter((t: any) => t.success).length
      },
      recommendations
    })
    
  } catch (error) {
    console.error('❌ 診断エラー:', error)
    return NextResponse.json({
      success: false,
      error: '診断中に予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 })
  }
}