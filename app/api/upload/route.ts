import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeGoogleFormsExcel } from '@/lib/excel'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    const supabase = await createClient()

    const { data: upload, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('year', year)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
      console.log(error)
      return NextResponse.json(
          { error: 'ユーザーが見つかりません' },
          { status: 404 }
      )
    }

    return NextResponse.json({
      upload: upload || [],
    })

  } catch (error) {
    console.error('Uploads fetch error:', error)
    return NextResponse.json(
        { error: 'サーバーエラーが発生しました' },
        { status: 500 }
    )
  }
}
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const year = formData.get('year') as string

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

    // ファイル形式チェック
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Excelファイル（.xlsx, .xls）のみアップロード可能です' },
        { status: 400 }
      )
    }

    // ファイルサイズチェック (10MB制限)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以下にしてください' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ユーザー認証を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // if (authError) {
    //   console.error('Auth error:', authError)
    //   return NextResponse.json(
    //     { error: '認証エラー: ' + authError.message },
    //     { status: 401 }
    //   )
    // }
    //
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'ユーザーが認証されていません。ログインしてください。' },
    //     { status: 401 }
    //   )
    // }
    //
    // console.log('Authenticated user:', user.id, user.email)

    // ファイルをBufferに変換
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Excelファイルを解析
    const analysisResult = await analyzeGoogleFormsExcel(buffer)

    if (!analysisResult.success) {
      return NextResponse.json(
        { error: analysisResult.error || 'ファイルの解析に失敗しました' },
        { status: 400 }
      )
    }

    // ファイルをSupabaseストレージにアップロード
    const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('survey-files')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'ファイルのアップロードに失敗しました' },
        { status: 500 }
      )
    }

    console.log('Final year to insert:', year, typeof year)
    // データベースにアップロード情報を保存
    const { data: dbData, error: dbError } = await supabase
      .from('uploads')
      .insert({
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        year: year,
        // total_responses: analysisResult.data?.basicStats?.totalResponses || 0,
        // analysis_data: analysisResult.data,
        // mime_type: file.type
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // ストレージからファイルを削除
      await supabase.storage.from('survey-files').remove([fileName])
      return NextResponse.json(
        { error: 'データベースへの保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      upload: dbData,
      message: 'ファイルのアップロードが完了しました'
    })

  } catch (error) {
    console.error('Upload error:', error)
    console.error('詳細エラー情報:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      errorObject: error
    })
    return NextResponse.json(
      {
        error: 'アップロード処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function sanitizeFileName(name: string): string {
  return name
      .normalize("NFKD")                       // Loại bỏ ký tự Unicode đặc biệt
      .replace(/[^\w.-]+/g, "_")               // Thay ký tự không hợp lệ bằng "_"
      .replace(/_+/g, "_")                     // Gom nhiều dấu "_" liên tiếp thành 1
      .replace(/^_+|_+$/g, "")                 // Loại bỏ "_" ở đầu và cuối
}
