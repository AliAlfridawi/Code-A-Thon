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
      mentors: {
        Row: {
          id: string
          clerk_user_id: string | null
          name: string
          dept: string
          avatar_url: string | null
          tags: string[]
          bio: string | null
          email: string | null
          office: string | null
          research_interests: string[]
          publications: Json
          availability: Json
          joined_date: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['mentors']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['mentors']['Insert']>
      }
      mentees: {
        Row: {
          id: string
          clerk_user_id: string | null
          name: string
          program: string
          major: string
          avatar_url: string | null
          interests: string[]
          bio: string | null
          email: string | null
          office: string | null
          research_interests: string[]
          publications: Json
          availability: Json
          joined_date: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['mentees']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['mentees']['Insert']>
      }
      pairings: {
        Row: {
          id: string
          mentor_id: string
          mentee_id: string
          score: number
          status: 'pending' | 'active' | 'completed'
          created_at: string
          confirmed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['pairings']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['pairings']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          member_name: string
          member_avatar: string | null
          member_role: string
          is_online: boolean
        }
        Insert: Omit<Database['public']['Tables']['conversation_members']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['conversation_members']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_name: string
          sender_type: 'self' | 'other'
          content: string
          created_at: string
          read_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      activity_log: {
        Row: {
          id: string
          action: string
          detail: string | null
          type: 'pairing' | 'registration' | 'update' | 'meeting'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_log']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>
      }
      user_settings: {
        Row: {
          id: string
          clerk_user_id: string
          email_notifs: boolean
          push_notifs: boolean
          weekly_digest: boolean
          match_alerts: boolean
          dark_mode: boolean
          compact_view: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_settings']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>
      }
    }
  }
}
