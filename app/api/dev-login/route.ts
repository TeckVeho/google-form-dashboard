import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 開発環境でのみ使用する一時的なログイン機能
export async function POST(request: NextRequest) {
  try {
    // 本番環境では無効化
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: '本番環境では使用できません' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    
    // 開発用のテストユーザーでサインイン
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    })

    if (error) {
      console.log('既存のテストユーザーでのログインに失敗、新規作成を試行:', error.message)
      
      // テストユーザーが存在しない場合は作成
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'test123456',
        options: {
          data: {
            name: 'Test User'
          }
        }
      })

      if (signUpError) {
        return NextResponse.json(
          { error: 'テストユーザーの作成に失敗しました: ' + signUpError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'テストユーザーを作成しました。メール確認が必要な場合があります。',
        user: signUpData.user,
        session: signUpData.session
      })
    }

    return NextResponse.json({
      success: true,
      message: 'テストユーザーでログインしました',
      user: data.user,
      session: data.session
    })

  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 