-- =====================================================
-- Migration 013: Canonical pairing-owned messaging
-- =====================================================

-- Keep the conversation activity timestamp aligned with the latest message.
CREATE OR REPLACE FUNCTION touch_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET updated_at = GREATEST(updated_at, NEW.created_at)
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_conversation_updated_at ON messages;
CREATE TRIGGER trg_touch_conversation_updated_at
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION touch_conversation_updated_at();

-- Refresh existing conversation timestamps from their latest message.
WITH latest_messages AS (
  SELECT
    conversation_id,
    MAX(created_at) AS last_message_at
  FROM messages
  GROUP BY conversation_id
)
UPDATE conversations c
SET updated_at = GREATEST(c.updated_at, latest_messages.last_message_at)
FROM latest_messages
WHERE latest_messages.conversation_id = c.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_pairing_unique
  ON conversations(pairing_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_clerk
  ON conversation_members(conversation_id, clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_desc
  ON messages(conversation_id, created_at DESC);

-- Pairings are the source of truth for who can access a conversation.
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversations c
    JOIN pairings p ON p.id = c.pairing_id
    JOIN mentors mentor ON mentor.id = p.mentor_id
    JOIN mentees mentee ON mentee.id = p.mentee_id
    WHERE c.id = p_conversation_id
      AND auth.jwt()->>'sub' IN (mentor.clerk_user_id, mentee.clerk_user_id)
  );
$$;

CREATE OR REPLACE FUNCTION can_send_conversation_message(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversations c
    JOIN pairings p ON p.id = c.pairing_id
    JOIN mentors mentor ON mentor.id = p.mentor_id
    JOIN mentees mentee ON mentee.id = p.mentee_id
    WHERE c.id = p_conversation_id
      AND p.status IN ('pending', 'active')
      AND auth.jwt()->>'sub' IN (mentor.clerk_user_id, mentee.clerk_user_id)
  );
$$;

-- Remove stale member rows that do not belong to the pairing participants.
DELETE FROM conversation_members cm
USING conversations c
JOIN pairings p ON p.id = c.pairing_id
JOIN mentors mentor ON mentor.id = p.mentor_id
JOIN mentees mentee ON mentee.id = p.mentee_id
WHERE cm.conversation_id = c.id
  AND cm.clerk_user_id NOT IN (mentor.clerk_user_id, mentee.clerk_user_id);

-- Best-effort history preservation: ensure every pairing conversation has the
-- correct mentor and mentee membership rows with current profile metadata.
INSERT INTO conversation_members (
  conversation_id,
  clerk_user_id,
  profile_id,
  profile_role,
  display_name,
  avatar_url,
  last_read_at
)
SELECT
  c.id,
  mentor.clerk_user_id,
  mentor.id,
  'mentor',
  mentor.name,
  mentor.avatar_url,
  NULL
FROM conversations c
JOIN pairings p ON p.id = c.pairing_id
JOIN mentors mentor ON mentor.id = p.mentor_id
WHERE mentor.clerk_user_id IS NOT NULL
ON CONFLICT (conversation_id, clerk_user_id) DO UPDATE
SET
  profile_id = EXCLUDED.profile_id,
  profile_role = EXCLUDED.profile_role,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url;

INSERT INTO conversation_members (
  conversation_id,
  clerk_user_id,
  profile_id,
  profile_role,
  display_name,
  avatar_url,
  last_read_at
)
SELECT
  c.id,
  mentee.clerk_user_id,
  mentee.id,
  'mentee',
  mentee.name,
  mentee.avatar_url,
  NULL
FROM conversations c
JOIN pairings p ON p.id = c.pairing_id
JOIN mentees mentee ON mentee.id = p.mentee_id
WHERE mentee.clerk_user_id IS NOT NULL
ON CONFLICT (conversation_id, clerk_user_id) DO UPDATE
SET
  profile_id = EXCLUDED.profile_id,
  profile_role = EXCLUDED.profile_role,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url;

DROP POLICY IF EXISTS "Auth read conversations" ON conversations;
DROP POLICY IF EXISTS "Auth insert conversations" ON conversations;
DROP POLICY IF EXISTS "Auth update conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can read conversations" ON conversations;

CREATE POLICY "Participants can read conversations"
  ON conversations FOR SELECT
  USING (is_conversation_participant(id));

DROP POLICY IF EXISTS "Auth read conversation_members" ON conversation_members;
DROP POLICY IF EXISTS "Auth insert conversation_members" ON conversation_members;
DROP POLICY IF EXISTS "Participants can read conversation members" ON conversation_members;
DROP POLICY IF EXISTS "Participants can update own read state" ON conversation_members;

CREATE POLICY "Participants can read conversation members"
  ON conversation_members FOR SELECT
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "Participants can update own read state"
  ON conversation_members FOR UPDATE
  USING (
    clerk_user_id = auth.jwt()->>'sub'
    AND is_conversation_participant(conversation_id)
  )
  WITH CHECK (
    clerk_user_id = auth.jwt()->>'sub'
    AND is_conversation_participant(conversation_id)
  );

DROP POLICY IF EXISTS "Auth read messages" ON messages;
DROP POLICY IF EXISTS "Auth insert messages" ON messages;
DROP POLICY IF EXISTS "Auth update messages" ON messages;
DROP POLICY IF EXISTS "Participants can read messages" ON messages;
DROP POLICY IF EXISTS "Participants can send messages in active chats" ON messages;

CREATE POLICY "Participants can read messages"
  ON messages FOR SELECT
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "Participants can send messages in active chats"
  ON messages FOR INSERT
  WITH CHECK (
    sender_clerk_user_id = auth.jwt()->>'sub'
    AND can_send_conversation_message(conversation_id)
  );

CREATE OR REPLACE FUNCTION ensure_pairing_conversation(pairing_id UUID)
RETURNS TABLE (
  conversation_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_pairing_id ALIAS FOR $1;
  v_user_id TEXT := auth.jwt()->>'sub';
  v_conversation conversations;
  v_pairing RECORD;
  v_current_role TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT
    p.id,
    p.status,
    mentor.id AS mentor_profile_id,
    mentor.clerk_user_id AS mentor_clerk_user_id,
    mentor.name AS mentor_name,
    mentor.avatar_url AS mentor_avatar_url,
    mentee.id AS mentee_profile_id,
    mentee.clerk_user_id AS mentee_clerk_user_id,
    mentee.name AS mentee_name,
    mentee.avatar_url AS mentee_avatar_url
  INTO v_pairing
  FROM pairings p
  JOIN mentors mentor ON mentor.id = p.mentor_id
  JOIN mentees mentee ON mentee.id = p.mentee_id
  WHERE p.id = p_pairing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pairing not found';
  END IF;

  IF v_pairing.mentor_clerk_user_id IS NULL OR v_pairing.mentee_clerk_user_id IS NULL THEN
    RAISE EXCEPTION 'Pairing participants must complete onboarding before messaging is available';
  END IF;

  IF v_user_id = v_pairing.mentor_clerk_user_id THEN
    v_current_role := 'mentor';
  ELSIF v_user_id = v_pairing.mentee_clerk_user_id THEN
    v_current_role := 'mentee';
  ELSE
    RAISE EXCEPTION 'Not allowed to access this pairing conversation';
  END IF;

  SELECT c.*
  INTO v_conversation
  FROM conversations c
  WHERE c.pairing_id = p_pairing_id;

  IF NOT FOUND THEN
    IF v_pairing.status NOT IN ('pending', 'active') THEN
      RAISE EXCEPTION 'Completed pairing has no existing conversation';
    END IF;

    INSERT INTO conversations (pairing_id, title)
    VALUES (p_pairing_id, NULL)
    ON CONFLICT (pairing_id) DO UPDATE
    SET title = conversations.title
    RETURNING *
    INTO v_conversation;
  END IF;

  INSERT INTO conversation_members (
    conversation_id,
    clerk_user_id,
    profile_id,
    profile_role,
    display_name,
    avatar_url,
    last_read_at
  )
  VALUES (
    v_conversation.id,
    v_pairing.mentor_clerk_user_id,
    v_pairing.mentor_profile_id,
    'mentor',
    v_pairing.mentor_name,
    v_pairing.mentor_avatar_url,
    CASE WHEN v_current_role = 'mentor' THEN now() ELSE NULL END
  )
  ON CONFLICT (conversation_id, clerk_user_id) DO UPDATE
  SET
    profile_id = EXCLUDED.profile_id,
    profile_role = EXCLUDED.profile_role,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    last_read_at = COALESCE(conversation_members.last_read_at, EXCLUDED.last_read_at);

  INSERT INTO conversation_members (
    conversation_id,
    clerk_user_id,
    profile_id,
    profile_role,
    display_name,
    avatar_url,
    last_read_at
  )
  VALUES (
    v_conversation.id,
    v_pairing.mentee_clerk_user_id,
    v_pairing.mentee_profile_id,
    'mentee',
    v_pairing.mentee_name,
    v_pairing.mentee_avatar_url,
    CASE WHEN v_current_role = 'mentee' THEN now() ELSE NULL END
  )
  ON CONFLICT (conversation_id, clerk_user_id) DO UPDATE
  SET
    profile_id = EXCLUDED.profile_id,
    profile_role = EXCLUDED.profile_role,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    last_read_at = COALESCE(conversation_members.last_read_at, EXCLUDED.last_read_at);

  RETURN QUERY SELECT v_conversation.id;
END;
$$;

CREATE OR REPLACE FUNCTION get_my_conversations()
RETURNS TABLE (
  conversation_id UUID,
  pairing_id UUID,
  pairing_status TEXT,
  conversation_updated_at TIMESTAMPTZ,
  counterpart_clerk_user_id TEXT,
  counterpart_profile_id UUID,
  counterpart_role TEXT,
  counterpart_display_name TEXT,
  counterpart_avatar_url TEXT,
  my_last_read_at TIMESTAMPTZ,
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  last_message_sender_clerk_user_id TEXT,
  last_message_sender_name TEXT,
  unread_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_memberships AS (
    SELECT
      cm.conversation_id,
      cm.last_read_at,
      cm.profile_role
    FROM conversation_members cm
    WHERE cm.clerk_user_id = auth.jwt()->>'sub'
  ),
  last_messages AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.content,
      m.created_at,
      m.sender_clerk_user_id,
      m.sender_name
    FROM messages m
    ORDER BY m.conversation_id, m.created_at DESC
  ),
  unread_messages AS (
    SELECT
      m.conversation_id,
      COUNT(*)::INTEGER AS unread_count
    FROM messages m
    JOIN my_memberships mm ON mm.conversation_id = m.conversation_id
    WHERE m.sender_clerk_user_id <> auth.jwt()->>'sub'
      AND m.created_at > COALESCE(mm.last_read_at, to_timestamp(0))
    GROUP BY m.conversation_id
  )
  SELECT
    c.id AS conversation_id,
    c.pairing_id,
    p.status AS pairing_status,
    c.updated_at AS conversation_updated_at,
    CASE
      WHEN mm.profile_role = 'mentor' THEN mentee.clerk_user_id
      ELSE mentor.clerk_user_id
    END AS counterpart_clerk_user_id,
    CASE
      WHEN mm.profile_role = 'mentor' THEN mentee.id
      ELSE mentor.id
    END AS counterpart_profile_id,
    CASE
      WHEN mm.profile_role = 'mentor' THEN 'mentee'
      ELSE 'mentor'
    END AS counterpart_role,
    CASE
      WHEN mm.profile_role = 'mentor' THEN mentee.name
      ELSE mentor.name
    END AS counterpart_display_name,
    CASE
      WHEN mm.profile_role = 'mentor' THEN mentee.avatar_url
      ELSE mentor.avatar_url
    END AS counterpart_avatar_url,
    mm.last_read_at AS my_last_read_at,
    lm.content AS last_message_content,
    lm.created_at AS last_message_created_at,
    lm.sender_clerk_user_id AS last_message_sender_clerk_user_id,
    lm.sender_name AS last_message_sender_name,
    COALESCE(um.unread_count, 0) AS unread_count
  FROM my_memberships mm
  JOIN conversations c ON c.id = mm.conversation_id
  JOIN pairings p ON p.id = c.pairing_id
  JOIN mentors mentor ON mentor.id = p.mentor_id
  JOIN mentees mentee ON mentee.id = p.mentee_id
  LEFT JOIN last_messages lm ON lm.conversation_id = c.id
  LEFT JOIN unread_messages um ON um.conversation_id = c.id
  ORDER BY COALESCE(lm.created_at, c.updated_at) DESC;
$$;

CREATE OR REPLACE FUNCTION mark_conversation_read(conversation_id UUID)
RETURNS TABLE (
  read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p_conversation_id ALIAS FOR $1;
  v_user_id TEXT := auth.jwt()->>'sub';
  v_read_at TIMESTAMPTZ := now();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT is_conversation_participant(p_conversation_id) THEN
    RAISE EXCEPTION 'Not allowed to access this conversation';
  END IF;

  UPDATE conversation_members
  SET last_read_at = GREATEST(COALESCE(last_read_at, to_timestamp(0)), v_read_at)
  WHERE conversation_members.conversation_id = p_conversation_id
    AND clerk_user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation membership missing';
  END IF;

  RETURN QUERY SELECT v_read_at;
END;
$$;

REVOKE ALL ON FUNCTION ensure_pairing_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_pairing_conversation(UUID) TO authenticated;

REVOKE ALL ON FUNCTION get_my_conversations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_my_conversations() TO authenticated;

REVOKE ALL ON FUNCTION mark_conversation_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_conversation_read(UUID) TO authenticated;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE messages;
  EXCEPTION
    WHEN undefined_object THEN NULL;
    WHEN invalid_parameter_value THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
