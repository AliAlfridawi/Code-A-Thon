-- =====================================================
-- Academic Pairing Hub — Full Schema + Seed Data
-- Run this in Supabase SQL Editor
-- =====================================================

-- =============== TABLES ===============

-- Mentors
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  dept TEXT NOT NULL,
  avatar_url TEXT,
  tags TEXT[] DEFAULT '{}',
  bio TEXT,
  email TEXT,
  office TEXT,
  research_interests TEXT[] DEFAULT '{}',
  publications JSONB DEFAULT '[]',
  availability JSONB DEFAULT '[]',
  joined_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mentees
CREATE TABLE IF NOT EXISTS mentees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  program TEXT NOT NULL,
  major TEXT NOT NULL,
  avatar_url TEXT,
  interests TEXT[] DEFAULT '{}',
  bio TEXT,
  email TEXT,
  office TEXT,
  research_interests TEXT[] DEFAULT '{}',
  publications JSONB DEFAULT '[]',
  availability JSONB DEFAULT '[]',
  joined_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pairings
CREATE TABLE IF NOT EXISTS pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  mentee_id UUID REFERENCES mentees(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation Members
CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_avatar TEXT,
  member_role TEXT DEFAULT 'member',
  is_online BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, member_name)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_type TEXT DEFAULT 'other' CHECK (sender_type IN ('self', 'other')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  detail TEXT,
  type TEXT DEFAULT 'update' CHECK (type IN ('pairing', 'registration', 'update', 'meeting')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email_notifs BOOLEAN DEFAULT true,
  push_notifs BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  match_alerts BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  compact_view BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============== INDEXES ===============

CREATE INDEX IF NOT EXISTS idx_pairings_mentor ON pairings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_pairings_mentee ON pairings(mentee_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_members_convo ON conversation_members(conversation_id);

-- =============== ENABLE RLS ===============

ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- =============== RLS POLICIES ===============
-- For initial development, allow all authenticated reads and writes.
-- Tighten these as needed in production.

-- Mentors: public read, authenticated write
CREATE POLICY "Allow public read mentors" ON mentors FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert mentors" ON mentors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update mentors" ON mentors FOR UPDATE USING (true);

-- Mentees: public read, authenticated write
CREATE POLICY "Allow public read mentees" ON mentees FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert mentees" ON mentees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update mentees" ON mentees FOR UPDATE USING (true);

-- Pairings: public read, authenticated write
CREATE POLICY "Allow public read pairings" ON pairings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert pairings" ON pairings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update pairings" ON pairings FOR UPDATE USING (true);

-- Conversations: public read
CREATE POLICY "Allow public read conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert conversations" ON conversations FOR INSERT WITH CHECK (true);

-- Conversation Members: public read
CREATE POLICY "Allow public read conversation_members" ON conversation_members FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert conversation_members" ON conversation_members FOR INSERT WITH CHECK (true);

-- Messages: public read, authenticated write
CREATE POLICY "Allow public read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert messages" ON messages FOR INSERT WITH CHECK (true);

-- Activity Log: public read, authenticated write
CREATE POLICY "Allow public read activity_log" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert activity_log" ON activity_log FOR INSERT WITH CHECK (true);

-- User Settings: public CRUD (scoped in app logic)
CREATE POLICY "Allow public read user_settings" ON user_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert user_settings" ON user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update user_settings" ON user_settings FOR UPDATE USING (true);

-- =============== ENABLE REALTIME ===============

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE messages';
  END IF;
END $$;

-- Seed data has been removed due to schema constraints from later migrations.
