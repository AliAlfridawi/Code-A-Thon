import type { Database } from './types/database.types';

// Export convenience types based on the Supabase schema
export type MentorRow = Database['public']['Tables']['mentors']['Row'];
export type MenteeRow = Database['public']['Tables']['mentees']['Row'];
export type PairingRow = Database['public']['Tables']['pairings']['Row'];
export type ConversationRow = Database['public']['Tables']['conversations']['Row'];
export type ConversationMemberRow = Database['public']['Tables']['conversation_members']['Row'];
export type MessageRow = Database['public']['Tables']['messages']['Row'];
export type ActivityLogRow = Database['public']['Tables']['activity_log']['Row'];
export type UserSettingsRow = Database['public']['Tables']['user_settings']['Row'];

/**
 * Standard Mentor interface adapted from DB row
 */
export interface Mentor {
  id: string;
  name: string;
  dept: string;
  avatar: string; // mapped from avatar_url
  tags: string[];
}

/**
 * Standard Mentee interface adapted from DB row
 */
export interface Mentee {
  id: string;
  name: string;
  program: string;
  major: string;
  avatar: string; // mapped from avatar_url
  interests: string[];
}

export interface ExtendedProfile {
  bio: string;
  email: string;
  office: string;
  researchInterests: string[];
  publications: Array<{ title: string; journal: string; year: number }>;
  availability: Array<{ day: string; hours: string }>;
  joinedDate: string;
}
