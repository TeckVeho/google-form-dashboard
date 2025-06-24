import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザープロファイルを取得
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, name, email, role, company_id, status, preferences, created_at, updated_at')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'プロファイルが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { name, company } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: '名前は必須です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 現在のユーザーを取得
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // プロファイル更新
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        name,
        company_id: company,
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'プロファイルの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: 'プロファイルが更新されました'
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'プロファイル更新処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}