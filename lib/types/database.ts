export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      uploads: {
        Row: {
          id: string
          file_name: string
          file_size: number
          file_path: string
          upload_date: string
          year: string
          status: 'processing' | 'completed' | 'failed'
          user_id?: string
          error_message?: string
          processed_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          file_name: string
          file_size: number
          file_path: string
          upload_date?: string
          year: string
          status?: 'processing' | 'completed' | 'failed'
          user_id?: string
          error_message?: string
          processed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          file_name?: string
          file_size?: number
          file_path?: string
          upload_date?: string
          year?: string
          status?: 'processing' | 'completed' | 'failed'
          user_id?: string
          error_message?: string
          processed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          title: string
          category: string
          category_color: string
          response_type: string
          analysis_types: string[]
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          category: string
          category_color?: string
          response_type: string
          analysis_types?: string[]
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          category?: string
          category_color?: string
          response_type?: string
          analysis_types?: string[]
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      analysis_results: {
        Row: {
          id: string
          upload_id: string
          question_id: string
          company_filter: string
          analysis_type: string
          analysis_data: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          upload_id: string
          question_id: string
          company_filter?: string
          analysis_type: string
          analysis_data: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          upload_id?: string
          question_id?: string
          company_filter?: string
          analysis_type?: string
          analysis_data?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      raw_responses: {
        Row: {
          id: string
          upload_id: string
          response_data: Json
          row_number: number
          validation_status: 'valid' | 'invalid' | 'warning'
          validation_errors?: string[]
          created_at: string
        }
        Insert: {
          id?: string
          upload_id: string
          response_data: Json
          row_number: number
          validation_status?: 'valid' | 'invalid' | 'warning'
          validation_errors?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          upload_id?: string
          response_data?: Json
          row_number?: number
          validation_status?: 'valid' | 'invalid' | 'warning'
          validation_errors?: string[]
          created_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          display_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'user' | 'viewer'
          company_id?: string
          last_login?: string
          status: 'active' | 'inactive' | 'suspended'
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: 'admin' | 'user' | 'viewer'
          company_id?: string
          last_login?: string
          status?: 'active' | 'inactive' | 'suspended'
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'user' | 'viewer'
          company_id?: string
          last_login?: string
          status?: 'active' | 'inactive' | 'suspended'
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_upload: {
        Args: {
          upload_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      upload_status: 'processing' | 'completed' | 'failed'
      user_role: 'admin' | 'user' | 'viewer'
      user_status: 'active' | 'inactive' | 'suspended'
      validation_status: 'valid' | 'invalid' | 'warning'
      analysis_type: 'distribution' | 'jobType' | 'demographic' | 'trend' | 'multipleChoice' | 'textAnalysis'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}