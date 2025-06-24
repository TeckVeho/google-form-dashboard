import { supabase } from './client'
import { createClient } from './server'
import type { Database } from '@/lib/types/database'

// ファイルアップロード用の型定義
export interface FileUploadOptions {
  userId: string
  year: string
  file: File
  onProgress?: (progress: number) => void
}

export interface FileUploadResult {
  success: boolean
  filePath?: string
  fileUrl?: string
  error?: string
  uploadRecord?: Database['public']['Tables']['uploads']['Row']
}

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  maxSizeMB: number
  allowedTypes: string[]
}

/**
 * ファイルバリデーション
 */
export function validateFile(file: File): FileValidationResult {
  const errors: string[] = []
  const maxSizeMB = 10
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  // ファイルサイズチェック
  if (file.size > maxSizeBytes) {
    errors.push(`ファイルサイズが${maxSizeMB}MBを超えています（現在: ${(file.size / 1024 / 1024).toFixed(1)}MB）`)
  }

  // ファイルタイプチェック
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ]

  if (!allowedTypes.includes(file.type)) {
    errors.push('許可されていないファイル形式です（.xlsx, .xls, .csv のみ許可）')
  }

  // ファイル名の検証
  if (file.name.length > 255) {
    errors.push('ファイル名が長すぎます（255文字以内）')
  }

  return {
    isValid: errors.length === 0,
    errors,
    maxSizeMB,
    allowedTypes
  }
}

/**
 * ファイルパス生成
 */
export function generateFilePath(userId: string, year: string, originalFilename: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const extension = originalFilename.split('.').pop()
  const baseName = originalFilename
    .split('.')[0]
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100) // ファイル名を100文字に制限

  return `${userId}/${year}/${baseName}_${timestamp}.${extension}`
}

/**
 * ファイルアップロード（クライアントサイド）
 */
export async function uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
  const { userId, year, file, onProgress } = options

  try {
    // 1. ファイルバリデーション
    const validation = validateFile(file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      }
    }

    // 2. ファイルパス生成
    const filePath = generateFilePath(userId, year, file.name)

    // 3. Supabase Storageにアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('excel-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('ストレージアップロードエラー:', uploadError)
      return {
        success: false,
        error: `ファイルアップロードに失敗しました: ${uploadError.message}`
      }
    }

    // 4. アップロード記録をデータベースに保存
    const { data: uploadRecord, error: dbError } = await supabase
      .from('uploads')
      .insert({
        file_name: file.name,
        file_size: file.size,
        file_path: uploadData.path,
        year: year,
        status: 'processing',
        user_id: userId
      })
      .select()
      .single()

    if (dbError) {
      console.error('データベース記録エラー:', dbError)
      // ファイルは削除する
      await supabase.storage.from('excel-files').remove([uploadData.path])
      return {
        success: false,
        error: `アップロード記録の保存に失敗しました: ${dbError.message}`
      }
    }

    // 5. ファイルURLを取得
    const { data: urlData } = supabase.storage
      .from('excel-files')
      .getPublicUrl(uploadData.path)

    return {
      success: true,
      filePath: uploadData.path,
      fileUrl: urlData.publicUrl,
      uploadRecord
    }

  } catch (error) {
    console.error('予期しないアップロードエラー:', error)
    return {
      success: false,
      error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    }
  }
}

/**
 * ファイル削除
 */
export async function deleteFile(filePath: string, uploadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. ストレージからファイル削除
    const { error: storageError } = await supabase.storage
      .from('excel-files')
      .remove([filePath])

    if (storageError) {
      console.error('ストレージ削除エラー:', storageError)
      return {
        success: false,
        error: `ファイル削除に失敗しました: ${storageError.message}`
      }
    }

    // 2. データベース記録削除
    const { error: dbError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', uploadId)

    if (dbError) {
      console.error('データベース削除エラー:', dbError)
      return {
        success: false,
        error: `アップロード記録の削除に失敗しました: ${dbError.message}`
      }
    }

    return { success: true }

  } catch (error) {
    console.error('予期しない削除エラー:', error)
    return {
      success: false,
      error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    }
  }
}

/**
 * ファイルダウンロードURL取得
 */
export async function getFileDownloadUrl(filePath: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('excel-files')
      .createSignedUrl(filePath, 3600) // 1時間有効

    if (error) {
      return {
        success: false,
        error: `ダウンロードURL生成に失敗しました: ${error.message}`
      }
    }

    return {
      success: true,
      url: data.signedUrl
    }

  } catch (error) {
    return {
      success: false,
      error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    }
  }
}

/**
 * アップロード一覧取得
 */
export async function getUserUploads(userId?: string): Promise<{
  success: boolean
  uploads?: Database['public']['Tables']['uploads']['Row'][]
  error?: string
}> {
  try {
    let query = supabase
      .from('uploads')
      .select('*')
      .order('upload_date', { ascending: false })

    // ユーザーIDが指定されている場合はフィルタ
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        error: `アップロード一覧の取得に失敗しました: ${error.message}`
      }
    }

    return {
      success: true,
      uploads: data
    }

  } catch (error) {
    return {
      success: false,
      error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    }
  }
}

/**
 * アップロードステータス更新
 */
export async function updateUploadStatus(
  uploadId: string, 
  status: 'processing' | 'completed' | 'failed',
  errorMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status,
      processed_at: new Date().toISOString()
    }

    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { error } = await supabase
      .from('uploads')
      .update(updateData)
      .eq('id', uploadId)

    if (error) {
      return {
        success: false,
        error: `ステータス更新に失敗しました: ${error.message}`
      }
    }

    return { success: true }

  } catch (error) {
    return {
      success: false,
      error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
    }
  }
}