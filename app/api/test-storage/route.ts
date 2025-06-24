import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET() {
  try {
    console.log('🔄 ストレージ設定確認を開始...')
    
    // 1. バケット一覧の確認
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ バケット一覧取得エラー:', bucketsError.message)
      return NextResponse.json({
        success: false,
        error: 'バケット一覧取得エラー',
        details: bucketsError.message,
        suggestions: [
          'Supabaseプロジェクトでストレージが有効化されているか確認してください',
          'storage-setup.sql を実行してください'
        ]
      }, { status: 500 })
    }
    
    // 2. excel-filesバケットの存在確認
    const excelFilesBucket = buckets?.find(bucket => bucket.name === 'excel-files')
    
    if (!excelFilesBucket) {
      console.warn('⚠️ excel-filesバケットが見つかりません')
      return NextResponse.json({
        success: false,
        error: 'excel-filesバケットが見つかりません',
        details: 'ストレージバケットが作成されていません',
        availableBuckets: buckets?.map(b => b.name) || [],
        nextSteps: [
          'Supabaseダッシュボード → Storage でバケットを確認',
          'tmp/storage-setup.sql を実行してバケットを作成'
        ]
      }, { status: 404 })
    }
    
    // 3. バケット設定の確認
    const bucketConfig = {
      name: excelFilesBucket.name,
      public: excelFilesBucket.public,
      fileSizeLimit: excelFilesBucket.file_size_limit,
      allowedMimeTypes: excelFilesBucket.allowed_mime_types
    }
    
    // 4. ストレージポリシーの確認（簡易テスト）
    let policiesStatus = 'unknown'
    try {
      // 認証なしでのアクセステスト（失敗するはず）
      const { error: unauthorizedError } = await supabase.storage
        .from('excel-files')
        .list()
      
      if (unauthorizedError && (
        unauthorizedError.message.includes('row-level security') ||
        unauthorizedError.message.includes('permission') ||
        unauthorizedError.message.includes('policy')
      )) {
        policiesStatus = 'enabled'
      } else {
        policiesStatus = 'disabled_or_misconfigured'
      }
    } catch (error) {
      policiesStatus = 'test_failed'
    }
    
    // 5. 結果評価
    const isConfiguredCorrectly = (
      excelFilesBucket.public === false && // 非公開
      excelFilesBucket.file_size_limit === 10485760 && // 10MB
      policiesStatus === 'enabled'
    )
    
    console.log(isConfiguredCorrectly ? '✅ ストレージ設定確認成功！' : '⚠️ ストレージ設定に問題があります')
    
    return NextResponse.json({
      success: isConfiguredCorrectly,
      message: isConfiguredCorrectly 
        ? 'ストレージが正常に設定されています！' 
        : 'ストレージ設定を完了してください',
      details: {
        bucketExists: !!excelFilesBucket,
        bucketConfig,
        policiesStatus,
        totalBuckets: buckets?.length || 0,
        recommendations: isConfiguredCorrectly ? [
          'Phase 2-5: Excel解析エンジン開発の準備完了',
          'ファイルアップロード機能の実装準備完了'
        ] : [
          'tmp/storage-setup.sql をSupabase SQLエディタで実行してください',
          'バケット設定とポリシーを確認してください'
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
        'Supabaseプロジェクトの状態を確認してください',
        'ストレージ機能が有効化されているか確認してください'
      ]
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log('🔄 ストレージアップロードテストを開始...')
    
    // テスト用の小さなファイルを作成
    const testContent = 'test,data\n1,sample'
    const testFile = new Blob([testContent], { type: 'text/csv' })
    const testFileName = `test_${Date.now()}.csv`
    const testPath = `test/${testFileName}`
    
    // 1. アップロードテスト
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('excel-files')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('❌ アップロードテストエラー:', uploadError.message)
      return NextResponse.json({
        success: false,
        error: 'アップロードテストに失敗しました',
        details: uploadError.message,
        testType: 'upload'
      }, { status: 500 })
    }
    
    // 2. ダウンロードテスト
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('excel-files')
      .download(uploadData.path)
    
    if (downloadError) {
      console.error('❌ ダウンロードテストエラー:', downloadError.message)
      return NextResponse.json({
        success: false,
        error: 'ダウンロードテストに失敗しました',
        details: downloadError.message,
        testType: 'download'
      }, { status: 500 })
    }
    
    // 3. 削除テスト
    const { error: deleteError } = await supabase.storage
      .from('excel-files')
      .remove([uploadData.path])
    
    if (deleteError) {
      console.warn('⚠️ 削除テストエラー:', deleteError.message)
    }
    
    console.log('✅ ストレージ機能テスト成功！')
    
    return NextResponse.json({
      success: true,
      message: 'ストレージ機能が正常に動作しています！',
      testResults: {
        upload: '成功',
        download: '成功',
        delete: deleteError ? '失敗（但し重要ではない）' : '成功',
        filePath: uploadData.path,
        fileSize: downloadData?.size || 'unknown'
      }
    })
    
  } catch (error) {
    console.error('❌ 予期しないテストエラー:', error)
    return NextResponse.json({
      success: false,
      error: '予期しないエラーが発生しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 })
  }
}