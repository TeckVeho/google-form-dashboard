import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const role = searchParams.get('role')

    const supabase = await createClient()

    let query = supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // 検索フィルター
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // ロールフィルター
    if (role) {
      query = query.eq('role', role)
    }

    // ページネーション
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 総件数取得（head: true を使わず RLS でのエラーを回避）
    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })

    if (countError) {
      console.warn('Count query error:', countError.message)
    }

    // データ取得
    const { data: rawUsers, error } = await query
      .range(from, to)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'ユーザーデータの取得に失敗しました' },
        { status: 500 }
      )
    }

    // フロントエンドが期待するフィールド名に変換
    const users = (rawUsers || []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      company: u.company_id, // ※会社名を取得したい場合は JOIN が必要
      lastLogin: u.last_login,
      is_active: u.status === 'active',
      createdAt: u.created_at,
    }))

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, role, company } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'メールアドレスと名前は必須です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 既存ユーザーチェック
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 409 }
      )
    }

    // 新規ユーザー作成
    const { data: newUser, error } = await supabase
      .from('user_profiles')
      .insert({
        email,
        name,
        role: role || 'user',
        company_id: company,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('User creation error:', error)
      return NextResponse.json(
        { error: 'ユーザーの作成に失敗しました' },
        { status: 500 }
      )
    }

    // 返却フィールドをフロントエンドに合わせて変換
    const formattedUser = {
      id: newUser?.id,
      name: newUser?.name,
      email: newUser?.email,
      role: newUser?.role,
      company: newUser?.company_id,
      lastLogin: newUser?.last_login,
      is_active: newUser?.status === 'active',
      createdAt: newUser?.created_at,
    }

    return NextResponse.json({
      user: formattedUser,
      message: 'ユーザーが作成されました'
    })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { error: 'ユーザー作成処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}