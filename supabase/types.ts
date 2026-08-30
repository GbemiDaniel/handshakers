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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
      }
      time_logs: {
        Row: {
          id: string
          user_id: string
          account_id: string
          start_time_seconds: number
          stop_time_seconds: number
          is_end_of_day: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          start_time_seconds: number
          stop_time_seconds: number
          is_end_of_day?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          start_time_seconds?: number
          stop_time_seconds?: number
          is_end_of_day?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
