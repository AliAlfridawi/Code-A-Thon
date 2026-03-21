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

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Mentors
INSERT INTO mentors (id, name, dept, avatar_url, tags, bio, email, office, research_interests, publications, availability, joined_date) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'Dr. Julian Sterling',
  'Dept. of Theoretical Physics',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
  ARRAY['Quantum Mechanics', 'Ethics'],
  'Dr. Julian Sterling is a renowned theoretical physicist specializing in quantum mechanics and quantum information theory. With over 15 years of academic experience, he has mentored dozens of PhD candidates and published extensively in top-tier journals.',
  'j.sterling@university.edu',
  'Physics Building, Room 312',
  ARRAY['Quantum Mechanics', 'Quantum Computing', 'Ethics in Physics', 'Particle Theory', 'String Theory'],
  '[{"title": "Quantum Entanglement in Multi-Particle Systems", "journal": "Physical Review Letters", "year": 2024}, {"title": "Error Correction Protocols for Quantum Computing", "journal": "Nature Physics", "year": 2023}, {"title": "Ethical Implications of Quantum Supremacy", "journal": "Science & Ethics Review", "year": 2022}]'::jsonb,
  '[{"day": "Monday", "hours": "10:00 AM – 2:00 PM"}, {"day": "Wednesday", "hours": "1:00 PM – 4:00 PM"}, {"day": "Friday", "hours": "9:00 AM – 12:00 PM"}]'::jsonb,
  'Sep 2019'
),
(
  '00000000-0000-0000-0000-000000000002',
  'Prof. Elena Vance',
  'Molecular Biology Faculty',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150',
  ARRAY['Genomics', 'Lab Mgmt'],
  'Prof. Elena Vance leads the Molecular Biology Faculty with expertise in genomics and laboratory management. Her research focuses on gene expression patterns and their implications for personalized medicine.',
  'e.vance@university.edu',
  'Life Sciences Center, Room 208',
  ARRAY['Genomics', 'CRISPR Technology', 'Lab Management', 'Personalized Medicine', 'Bioinformatics'],
  '[{"title": "CRISPR Applications in Gene Therapy: A Comprehensive Review", "journal": "Nature Biotechnology", "year": 2024}, {"title": "Genomic Markers for Early Cancer Detection", "journal": "Cell", "year": 2023}, {"title": "Lab Management Best Practices for Research Teams", "journal": "Academic Leadership Journal", "year": 2021}]'::jsonb,
  '[{"day": "Tuesday", "hours": "9:00 AM – 1:00 PM"}, {"day": "Thursday", "hours": "2:00 PM – 5:00 PM"}]'::jsonb,
  'Jan 2020'
),
(
  '00000000-0000-0000-0000-000000000003',
  'Dr. Marcus Thorne',
  'Ancient History Chair',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150',
  ARRAY['Latin', 'Archiving'],
  'Dr. Marcus Thorne chairs the Ancient History department with specializations in Latin epigraphy and archival sciences. He has led numerous archaeological expeditions and curated collections across Europe.',
  'm.thorne@university.edu',
  'Humanities Hall, Room 105',
  ARRAY['Latin', 'Archiving', 'Roman History', 'Epigraphy', 'Digital Humanities'],
  '[{"title": "Deciphering Late Roman Inscriptions in Gaul", "journal": "Journal of Roman Studies", "year": 2024}, {"title": "Digital Archiving Methods for Ancient Manuscripts", "journal": "Digital Humanities Quarterly", "year": 2023}, {"title": "Latin Pedagogy in the Modern University", "journal": "Classical World", "year": 2022}]'::jsonb,
  '[{"day": "Monday", "hours": "2:00 PM – 5:00 PM"}, {"day": "Wednesday", "hours": "10:00 AM – 12:00 PM"}, {"day": "Thursday", "hours": "9:00 AM – 11:00 AM"}]'::jsonb,
  'Mar 2018'
);

-- Mentees
INSERT INTO mentees (id, name, program, major, avatar_url, interests, bio, email, office, research_interests, publications, availability, joined_date) VALUES
(
  '00000000-0000-0000-0000-000000000011',
  'Liam Carter',
  'PhD Candidate',
  'Physics',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
  ARRAY['Quantum Mechanics', 'Astrophysics'],
  'Liam Carter is a PhD candidate in Physics focusing on quantum state dynamics. He joined the program after completing his Masters at MIT with distinction.',
  'l.carter@university.edu',
  'Graduate Research Lab, Desk 14',
  ARRAY['Quantum Mechanics', 'Algorithm Design', 'Computational Physics', 'Machine Learning'],
  '[{"title": "Simulation of Quantum Walk Algorithms", "journal": "Conference Proceedings — QIP 2024", "year": 2024}]'::jsonb,
  '[{"day": "Monday", "hours": "9:00 AM – 5:00 PM"}, {"day": "Tuesday", "hours": "9:00 AM – 5:00 PM"}, {"day": "Wednesday", "hours": "9:00 AM – 5:00 PM"}]'::jsonb,
  'Aug 2024'
),
(
  '00000000-0000-0000-0000-000000000012',
  'Sarah Jenkins',
  'Masters',
  'Biology',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
  ARRAY['Genomics', 'Ecology'],
  'Sarah Jenkins is a Masters student in Biology with a focus on molecular genetics. She is passionate about combining genomics with computational approaches to understand disease mechanisms.',
  's.jenkins@university.edu',
  'Bio Lab Annex, Bench 7',
  ARRAY['Molecular Biology', 'Genomics', 'Data Analysis', 'Computational Biology'],
  '[]'::jsonb,
  '[{"day": "Tuesday", "hours": "10:00 AM – 4:00 PM"}, {"day": "Thursday", "hours": "10:00 AM – 4:00 PM"}, {"day": "Friday", "hours": "1:00 PM – 5:00 PM"}]'::jsonb,
  'Jan 2025'
),
(
  '00000000-0000-0000-0000-000000000013',
  'David Chen',
  'PhD Candidate',
  'History',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
  ARRAY['Latin', 'Ancient Civilizations'],
  'David Chen is a PhD candidate in History researching the cultural impact of Roman expansion in East Asia trade routes. He brings a unique cross-cultural perspective to ancient history studies.',
  'd.chen@university.edu',
  'Humanities Hall, Room 204B',
  ARRAY['Ancient History', 'Trade Networks', 'Cross-Cultural Studies', 'Latin', 'Archiving'],
  '[{"title": "Silk Road Trade Networks: A Re-evaluation of Roman Sources", "journal": "Journal of World History", "year": 2025}]'::jsonb,
  '[{"day": "Monday", "hours": "1:00 PM – 4:00 PM"}, {"day": "Wednesday", "hours": "9:00 AM – 1:00 PM"}, {"day": "Friday", "hours": "10:00 AM – 3:00 PM"}]'::jsonb,
  'Sep 2024'
);

-- Conversations + Members + Messages
INSERT INTO conversations (id, title) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Dr. Julian Sterling'),
  ('00000000-0000-0000-0000-000000000102', 'Sarah Jenkins'),
  ('00000000-0000-0000-0000-000000000103', 'Prof. Elena Vance'),
  ('00000000-0000-0000-0000-000000000104', 'Liam Carter'),
  ('00000000-0000-0000-0000-000000000105', 'Dr. Marcus Thorne');

INSERT INTO conversation_members (conversation_id, member_name, member_avatar, is_online) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Dr. Julian Sterling', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150', true),
  ('00000000-0000-0000-0000-000000000102', 'Sarah Jenkins', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150', true),
  ('00000000-0000-0000-0000-000000000103', 'Prof. Elena Vance', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150', false),
  ('00000000-0000-0000-0000-000000000104', 'Liam Carter', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150', false),
  ('00000000-0000-0000-0000-000000000105', 'Dr. Marcus Thorne', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150', false);

-- Messages for conversation 1 (Dr. Julian Sterling)
INSERT INTO messages (conversation_id, sender_name, sender_type, content, created_at) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Dr. Julian Sterling', 'other', 'Hello! I''ve reviewed the latest research paper you recommended.', now() - interval '30 minutes'),
  ('00000000-0000-0000-0000-000000000101', 'You', 'self', 'Great! What did you think of the methodology section?', now() - interval '28 minutes'),
  ('00000000-0000-0000-0000-000000000101', 'Dr. Julian Sterling', 'other', 'It was thorough. I particularly liked the approach to quantum state measurement.', now() - interval '25 minutes'),
  ('00000000-0000-0000-0000-000000000101', 'You', 'self', 'I agree. The error correction technique they proposed is novel.', now() - interval '22 minutes'),
  ('00000000-0000-0000-0000-000000000101', 'Dr. Julian Sterling', 'other', 'I''d love to discuss the quantum entanglement research proposal.', now() - interval '2 minutes');

-- Messages for conversation 2 (Sarah Jenkins)
INSERT INTO messages (conversation_id, sender_name, sender_type, content, created_at) VALUES
  ('00000000-0000-0000-0000-000000000102', 'Sarah Jenkins', 'other', 'Hi! I wanted to update you on my thesis progress.', now() - interval '3 hours'),
  ('00000000-0000-0000-0000-000000000102', 'You', 'self', 'Of course! How is the literature review going?', now() - interval '2 hours 55 minutes'),
  ('00000000-0000-0000-0000-000000000102', 'Sarah Jenkins', 'other', 'I''ve covered 40 papers so far. The genomics section is almost complete.', now() - interval '2 hours 50 minutes'),
  ('00000000-0000-0000-0000-000000000102', 'Sarah Jenkins', 'other', 'Thank you for the mentorship guidance!', now() - interval '1 hour');

-- Messages for conversation 3 (Prof. Elena Vance)
INSERT INTO messages (conversation_id, sender_name, sender_type, content, created_at) VALUES
  ('00000000-0000-0000-0000-000000000103', 'Prof. Elena Vance', 'other', 'The new batch of cell cultures is ready for analysis.', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000103', 'You', 'self', 'Excellent. Let''s run the sequencing protocol tomorrow.', now() - interval '23 hours'),
  ('00000000-0000-0000-0000-000000000103', 'Prof. Elena Vance', 'other', 'The lab results are quite promising.', now() - interval '3 hours');

-- Activity Log
INSERT INTO activity_log (action, detail, type, created_at) VALUES
  ('New pairing created', 'Dr. Julian Sterling ↔ Liam Carter', 'pairing', now() - interval '2 hours'),
  ('Mentee registered', 'Sarah Jenkins joined as a Masters student', 'registration', now() - interval '5 hours'),
  ('Profile updated', 'Prof. Elena Vance added new expertise tags', 'update', now() - interval '1 day'),
  ('Meeting scheduled', 'Dr. Marcus Thorne & David Chen — Initial consultation', 'meeting', now() - interval '2 days'),
  ('Pairing completed', 'Prof. Elena Vance ↔ Sarah Jenkins — 6-month program', 'pairing', now() - interval '3 days');
