-- =====================================================
-- Meetings table for scheduling via chat
-- =====================================================

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID REFERENCES pairings(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES mentors(id),
  mentee_id UUID REFERENCES mentees(id),
  title TEXT NOT NULL,
  meeting_link TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  created_by TEXT, -- clerk_user_id of creator
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_mentor ON meetings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_mentee ON meetings(mentee_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings(scheduled_at);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read meetings" ON meetings;
CREATE POLICY "Allow public read meetings" ON meetings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert meetings" ON meetings;
CREATE POLICY "Allow authenticated insert meetings" ON meetings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update meetings" ON meetings;
CREATE POLICY "Allow authenticated update meetings" ON meetings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete meetings" ON meetings;
CREATE POLICY "Allow authenticated delete meetings" ON meetings FOR DELETE USING (true);
