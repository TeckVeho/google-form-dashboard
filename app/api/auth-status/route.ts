import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // セッション情報を取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      success: true,
      session: {
        exists: !!session,
        user_id: session?.user?.id,
        expires_at: session?.expires_at
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        email_confirmed: user?.email_confirmed_at ? true : false
      },
      errors: {
        sessionError: sessionError?.message,
        userError: userError?.message
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 