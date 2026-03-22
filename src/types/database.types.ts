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
        Insert: Omit<Database['public']['Tables']['mentors']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
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
        Insert: Omit<Database['public']['Tables']['mentees']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
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
        Insert: Omit<Database['public']['Tables']['pairings']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['pairings']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          pairing_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          clerk_user_id: string
          profile_id: string
          profile_role: 'mentor' | 'mentee'
          display_name: string
          avatar_url: string | null
          last_read_at: string | null
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversation_members']['Row'], 'id' | 'joined_at'> & {
          id?: string
          joined_at?: string
        }
        Update: Partial<Database['public']['Tables']['conversation_members']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_clerk_user_id: string
          sender_name: string
          content: string
          message_type: 'text' | 'meeting_request' | 'meeting_response'
          meeting_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      meetings: {
        Row: {
          id: string
          pairing_id: string | null
          mentor_id: string | null
          mentee_id: string | null
          title: string
          meeting_link: string | null
          scheduled_at: string
          duration_minutes: number
          notes: string | null
          created_by: string | null
          status: 'pending' | 'accepted' | 'rejected'
          responded_at: string | null
          responded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['meetings']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['meetings']['Insert']>
      }
      activity_log: {
        Row: {
          id: string
          action: string
          detail: string | null
          type: 'pairing' | 'registration' | 'update' | 'meeting'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_log']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
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
        Insert: Omit<Database['public']['Tables']['user_settings']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>
      }
      user_profiles: {
        Row: {
          id: string
          clerk_user_id: string
          role: 'mentor' | 'mentee'
          onboarding_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
    }
    Functions: {
      ensure_pairing_conversation: {
        Args: {
          pairing_id: string
        }
        Returns: {
          conversation_id: string
        }[]
      }
      get_my_conversations: {
        Args: Record<string, never>
        Returns: {
          conversation_id: string
          pairing_id: string
          pairing_status: 'pending' | 'active' | 'completed'
          conversation_updated_at: string
          counterpart_clerk_user_id: string | null
          counterpart_profile_id: string
          counterpart_role: 'mentor' | 'mentee'
          counterpart_display_name: string
          counterpart_avatar_url: string | null
          my_last_read_at: string | null
          last_message_content: string | null
          last_message_created_at: string | null
          last_message_sender_clerk_user_id: string | null
          last_message_sender_name: string | null
          unread_count: number
        }[]
      }
      mark_conversation_read: {
        Args: {
          conversation_id: string
        }
        Returns: {
          read_at: string
        }[]
      }
      request_pairing_meeting: {
        Args: {
          pairing_id: string
          title: string
          scheduled_at: string
          duration_minutes?: number
          meeting_link?: string | null
          notes?: string | null
        }
        Returns: {
          meeting_id: string
          conversation_id: string
          message_id: string
        }[]
      }
      respond_to_meeting_request: {
        Args: {
          meeting_id: string
          decision: string
        }
        Returns: {
          meeting_id: string
          status: 'accepted' | 'rejected'
          conversation_id: string
          message_id: string
        }[]
      }
    }
  }
}
