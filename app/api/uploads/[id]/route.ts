import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !upload) {
      return NextResponse.json(
        { error: 'アップロードが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ upload })

  } catch (error) {
    console.error('Upload fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params
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
