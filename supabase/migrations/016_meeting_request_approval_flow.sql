-- =====================================================
-- Migration 016: Meeting request approval flow in chat
-- =====================================================

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responded_by TEXT;

UPDATE meetings
SET status = 'accepted'
WHERE status IS NULL;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'meeting_request', 'meeting_response')),
  ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_meeting_id
  ON messages(meeting_id)
  WHERE meeting_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meetings_mentor_status_scheduled
  ON meetings(mentor_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_mentee_status_scheduled
  ON meetings(mentee_id, status, scheduled_at);

CREATE OR REPLACE FUNCTION is_meeting_participant(p_meeting_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM meetings m
    LEFT JOIN mentors mentor ON mentor.id = m.mentor_id
    LEFT JOIN mentees mentee ON mentee.id = m.mentee_id
    WHERE m.id = p_meeting_id
      AND auth.jwt()->>'sub' IN (mentor.clerk_user_id, mentee.clerk_user_id)
  );
$$;

DROP POLICY IF EXISTS "Allow public read meetings" ON meetings;
DROP POLICY IF EXISTS "Allow authenticated insert meetings" ON meetings;
DROP POLICY IF EXISTS "Allow authenticated update meetings" ON meetings;
DROP POLICY IF EXISTS "Allow authenticated delete meetings" ON meetings;
DROP POLICY IF EXISTS "Participants can read meetings" ON meetings;

CREATE POLICY "Participants can read meetings"
  ON meetings FOR SELECT
  USING (is_meeting_participant(id));

DROP FUNCTION IF EXISTS request_pairing_meeting(UUID, TEXT, TIMESTAMPTZ, INTEGER, TEXT, TEXT);
CREATE OR REPLACE FUNCTION request_pairing_meeting(
  pairing_id UUID,
  title TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,
  meeting_link TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  meeting_id UUID,
  conversation_id UUID,
  message_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.jwt()->>'sub';
  v_conversation_id UUID;
  v_pairing RECORD;
  v_meeting meetings;
  v_message messages;
  v_requester_name TEXT;
  v_clean_title TEXT := btrim(title);
  v_duration_minutes INTEGER := GREATEST(COALESCE(duration_minutes, 30), 1);
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_clean_title IS NULL OR char_length(v_clean_title) = 0 THEN
    RAISE EXCEPTION 'Meeting title is required';
  END IF;

  SELECT
    p.id,
    p.status,
    p.mentor_id,
    p.mentee_id,
    mentor.clerk_user_id AS mentor_clerk_user_id,
    mentor.name AS mentor_name,
    mentee.clerk_user_id AS mentee_clerk_user_id,
    mentee.name AS mentee_name
  INTO v_pairing
  FROM pairings p
  JOIN mentors mentor ON mentor.id = p.mentor_id
  JOIN mentees mentee ON mentee.id = p.mentee_id
  WHERE p.id = request_pairing_meeting.pairing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pairing not found';
  END IF;

  IF v_pairing.status NOT IN ('pending', 'active') THEN
    RAISE EXCEPTION 'Completed pairing cannot schedule meetings';
  END IF;

  IF v_user_id = v_pairing.mentor_clerk_user_id THEN
    v_requester_name := v_pairing.mentor_name;
  ELSIF v_user_id = v_pairing.mentee_clerk_user_id THEN
    v_requester_name := v_pairing.mentee_name;
  ELSE
    RAISE EXCEPTION 'Not allowed to access this pairing conversation';
  END IF;

  SELECT ensured.conversation_id
  INTO v_conversation_id
  FROM ensure_pairing_conversation(request_pairing_meeting.pairing_id) AS ensured;

  INSERT INTO meetings (
    pairing_id,
    mentor_id,
    mentee_id,
    title,
    meeting_link,
    scheduled_at,
    duration_minutes,
    notes,
    created_by,
    status
  )
  VALUES (
    v_pairing.id,
    v_pairing.mentor_id,
    v_pairing.mentee_id,
    v_clean_title,
    NULLIF(btrim(meeting_link), ''),
    request_pairing_meeting.scheduled_at,
    v_duration_minutes,
    NULLIF(btrim(notes), ''),
    v_user_id,
    'pending'
  )
  RETURNING *
  INTO v_meeting;

  INSERT INTO messages (
    conversation_id,
    sender_clerk_user_id,
    sender_name,
    content,
    message_type,
    meeting_id
  )
  VALUES (
    v_conversation_id,
    v_user_id,
    v_requester_name,
    format(
      'Meeting request: %s on %s',
      v_meeting.title,
      to_char(v_meeting.scheduled_at AT TIME ZONE 'UTC', 'Mon DD, YYYY HH24:MI "UTC"')
    ),
    'meeting_request',
    v_meeting.id
  )
  RETURNING *
  INTO v_message;

  RETURN QUERY
  SELECT v_meeting.id, v_conversation_id, v_message.id;
END;
$$;

DROP FUNCTION IF EXISTS respond_to_meeting_request(UUID, TEXT);
CREATE OR REPLACE FUNCTION respond_to_meeting_request(
  p_meeting_id UUID,
  p_decision TEXT
)
RETURNS TABLE (
  meeting_id UUID,
  status TEXT,
  conversation_id UUID,
  message_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.jwt()->>'sub';
  v_normalized_decision TEXT := lower(btrim(p_decision));
  v_meeting meetings;
  v_pairing RECORD;
  v_conversation_id UUID;
  v_message messages;
  v_responder_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF v_normalized_decision NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Meeting decision must be accepted or rejected';
  END IF;

  SELECT *
  INTO v_meeting
  FROM meetings
  WHERE meetings.id = p_meeting_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;

  IF v_meeting.status <> 'pending' THEN
    RAISE EXCEPTION 'Meeting request already responded to';
  END IF;

  SELECT
    p.id,
    p.status,
    mentor.clerk_user_id AS mentor_clerk_user_id,
    mentor.name AS mentor_name,
    mentee.clerk_user_id AS mentee_clerk_user_id,
    mentee.name AS mentee_name
  INTO v_pairing
  FROM pairings p
  JOIN mentors mentor ON mentor.id = p.mentor_id
  JOIN mentees mentee ON mentee.id = p.mentee_id
  WHERE p.id = v_meeting.pairing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pairing not found';
  END IF;

  IF v_pairing.status NOT IN ('pending', 'active') THEN
    RAISE EXCEPTION 'Completed pairing cannot respond to meetings';
  END IF;

  IF v_user_id = v_meeting.created_by THEN
    RAISE EXCEPTION 'Meeting requester cannot respond to their own request';
  END IF;

  IF v_user_id = v_pairing.mentor_clerk_user_id THEN
    v_responder_name := v_pairing.mentor_name;
  ELSIF v_user_id = v_pairing.mentee_clerk_user_id THEN
    v_responder_name := v_pairing.mentee_name;
  ELSE
    RAISE EXCEPTION 'Not allowed to access this pairing conversation';
  END IF;

  UPDATE meetings
  SET
    status = v_normalized_decision,
    responded_at = now(),
    responded_by = v_user_id
  WHERE meetings.id = v_meeting.id
    AND meetings.status = 'pending'
  RETURNING *
  INTO v_meeting;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meeting request already responded to';
  END IF;

  SELECT c.id
  INTO v_conversation_id
  FROM conversations c
  WHERE c.pairing_id = v_meeting.pairing_id;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found for meeting request';
  END IF;

  INSERT INTO messages (
    conversation_id,
    sender_clerk_user_id,
    sender_name,
    content,
    message_type,
    meeting_id
  )
  VALUES (
    v_conversation_id,
    v_user_id,
    v_responder_name,
    format(
      'Meeting request %s: %s on %s',
      v_normalized_decision,
      v_meeting.title,
      to_char(v_meeting.scheduled_at AT TIME ZONE 'UTC', 'Mon DD, YYYY HH24:MI "UTC"')
    ),
    'meeting_response',
    v_meeting.id
  )
  RETURNING *
  INTO v_message;

  RETURN QUERY
  SELECT v_meeting.id, v_meeting.status, v_conversation_id, v_message.id;
END;
$$;

REVOKE ALL ON FUNCTION request_pairing_meeting(UUID, TEXT, TIMESTAMPTZ, INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION request_pairing_meeting(UUID, TEXT, TIMESTAMPTZ, INTEGER, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION respond_to_meeting_request(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION respond_to_meeting_request(UUID, TEXT) TO authenticated;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE meetings;
  EXCEPTION
    WHEN undefined_object THEN NULL;
    WHEN invalid_parameter_value THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
