import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: rawUser, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !rawUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    const user = {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      role: rawUser.role,
      company: rawUser.company_id,
      lastLogin: rawUser.last_login,
      is_active: rawUser.status === 'active',
      createdAt: rawUser.created_at,
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, role, company, is_active } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: '名前は必須です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ユーザー存在チェック
    const { data: existingUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // ユーザー更新
    const { data: updatedUserRaw, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        name,
        role,
        company_id: company,
        status: is_active ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('User update error:', updateError)
      return NextResponse.json(
        { error: 'ユーザーの更新に失敗しました' },
        { status: 500 }
      )
    }

    const updatedUser = {
      id: updatedUserRaw.id,
      name: updatedUserRaw.name,
      email: updatedUserRaw.email,
      role: updatedUserRaw.role,
      company: updatedUserRaw.company_id,
      lastLogin: updatedUserRaw.last_login,
      is_active: updatedUserRaw.status === 'active',
      createdAt: updatedUserRaw.created_at,
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'ユーザー情報が更新されました'
    })

  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'ユーザー更新処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // ユーザー存在チェック
    const { data: existingUserDel, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingUserDel) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 関連データの確認（アップロード履歴など）
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('id')
      .eq('created_by', params.id)
      .limit(1)

    if (uploadsError) {
      console.error('Related data check error:', uploadsError)
      return NextResponse.json(
        { error: '関連データの確認に失敗しました' },
        { status: 500 }
      )
    }

    // 関連データがある場合はソフト削除（非アクティブ化）
    if (uploads && uploads.length > 0) {
      const { data: deactivatedUserRaw, error: deactivateError } = await supabase
        .from('user_profiles')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select()
        .single()

      if (deactivateError) {
        console.error('User deactivation error:', deactivateError)
        return NextResponse.json(
          { error: 'ユーザーの非アクティブ化に失敗しました' },
          { status: 500 }
        )
      }

      const deactivatedUser = {
        id: deactivatedUserRaw.id,
        name: deactivatedUserRaw.name,
        email: deactivatedUserRaw.email,
        role: deactivatedUserRaw.role,
        company: deactivatedUserRaw.company_id,
        lastLogin: deactivatedUserRaw.last_login,
        is_active: false,
        createdAt: deactivatedUserRaw.created_at,
      }

      return NextResponse.json({
        user: deactivatedUser,
        message: '関連データが存在するため、ユーザーを非アクティブにしました'
      })
    }

    // 関連データがない場合は物理削除
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('User deletion error:', deleteError)
      return NextResponse.json(
        { error: 'ユーザーの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ユーザーが削除されました'
    })

  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json(
      { error: 'ユーザー削除処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}