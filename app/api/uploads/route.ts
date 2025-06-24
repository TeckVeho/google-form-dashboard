import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const year = searchParams.get('year')
    const search = searchParams.get('search')

    const supabase = await createClient()

    let query = supabase
      .from('uploads')
      .select('*')
      .order('created_at', { ascending: false })

    // 年度フィルター
    if (year) {
      query = query.eq('year', parseInt(year))
    }

    // 検索フィルター
    if (search) {
      query = query.ilike('filename', `%${search}%`)
    }

    // ページネーション
    const from = (page - 1) * limit
    const to = from + limit - 1

    // カウント取得
    const { count } = await supabase
      .from('uploads')
      .select('*', { count: 'exact', head: true })

    // データ取得
    const { data: uploads, error } = await query
      .range(from, to)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'データの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      uploads: uploads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Uploads fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // アップロード情報を取得
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('file_path')
      .eq('id', id)
      .single()

    if (fetchError || !upload) {
      return NextResponse.json(
        { error: 'アップロードが見つかりません' },
        { status: 404 }
      )
    }

    // ストレージからファイルを削除
    const { error: storageError } = await supabase.storage
      .from('survey-files')
      .remove([upload.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // ストレージの削除に失敗してもDBからは削除する
    }

    // データベースから削除
    const { error: dbError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json(
        { error: 'データベースからの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'アップロードが削除されました'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: '削除処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}