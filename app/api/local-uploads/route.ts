import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 ローカルアップロード一覧取得')
    
    const uploadsDir = join(process.cwd(), 'tmp', 'uploads')
    
    try {
      const files = await readdir(uploadsDir)
      const analysisFiles = files.filter(file => file.endsWith('-analysis.json'))
      
      const uploads = await Promise.all(
        analysisFiles.map(async (file) => {
          try {
            const filePath = join(uploadsDir, file)
            const content = await readFile(filePath, 'utf-8')
            const data = JSON.parse(content)
            
            return {
              id: data.id,
              filename: data.filename,
              year: data.year,
              total_responses: data.total_responses,
              created_at: data.created_at,
              file_size: data.file_size
            }
          } catch (error) {
            console.warn('ファイル読み込みエラー:', file, error)
            return null
          }
        })
      )
      
      const validUploads = uploads.filter(upload => upload !== null)
      
      console.log('✅ ローカルアップロード一覧取得完了:', validUploads.length, '件')
      
      return NextResponse.json({
        success: true,
        data: validUploads,
        count: validUploads.length,
        message: `${validUploads.length}件のアップロードファイルが見つかりました`
      })
      
    } catch (dirError) {
      console.log('アップロードディレクトリが存在しません')
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'アップロードファイルが見つかりません'
      })
    }
    
  } catch (error) {
    console.error('❌ ローカルアップロード一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'アップロード一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
} 