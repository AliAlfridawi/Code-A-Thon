-- =====================================================
-- Migration 007: Rebuild messaging around pairing-backed
-- direct conversations and stable Clerk identity
-- =====================================================

-- Reset legacy messaging data and schema. Existing demo chat data is disposable.
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_members CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Conversations: exactly one direct conversation per pairing
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID NOT NULL UNIQUE REFERENCES pairings(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation members use stable identity instead of display names
CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  profile_id UUID NOT NULL,
  profile_role TEXT NOT NULL CHECK (profile_role IN ('mentor', 'mentee')),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, clerk_user_id)
);

-- Messages store sender Clerk identity directly
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_clerk_user_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(btrim(content)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_pairing ON conversations(pairing_id);
CREATE INDEX idx_conversation_members_clerk_user_id ON conversation_members(clerk_user_id);
CREATE INDEX idx_conversation_members_conversation_id ON conversation_members(conversation_id);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Keep conversation activity ordered by the most recent message.
CREATE OR REPLACE FUNCTION touch_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_conversation_updated_at ON messages;
CREATE TRIGGER trg_touch_conversation_updated_at
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION touch_conversation_updated_at();

-- Helper used by policies to avoid recursive RLS checks on conversation_members.
CREATE OR REPLACE FUNCTION is_conversation_participant(p_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_members cm
    WHERE cm.conversation_id = p_conversation_id
      AND cm.clerk_user_id = auth.jwt()->>'sub'
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
    JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE c.id = p_conversation_id
      AND cm.clerk_user_id = auth.jwt()->>'sub'
      AND p.status IN ('pending', 'active')
  );
$$;

DROP POLICY IF EXISTS "Auth read conversations" ON conversations;
DROP POLICY IF EXISTS "Auth insert conversations" ON conversations;
DROP POLICY IF EXISTS "Auth update conversations" ON conversations;

CREATE POLICY "Participants can read conversations"
  ON conversations FOR SELECT
  USING (is_conversation_participant(id));

DROP POLICY IF EXISTS "Auth read conversation_members" ON conversation_members;
DROP POLICY IF EXISTS "Auth insert conversation_members" ON conversation_members;

CREATE POLICY "Participants can read conversation members"
  ON conversation_members FOR SELECT
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "Participants can update own read state"
  ON conversation_members FOR UPDATE
  USING (clerk_user_id = auth.jwt()->>'sub')
  WITH CHECK (clerk_user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Auth read messages" ON messages;
DROP POLICY IF EXISTS "Auth insert messages" ON messages;
DROP POLICY IF EXISTS "Auth update messages" ON messages;

CREATE POLICY "Participants can read messages"
  ON messages FOR SELECT
  USING (is_conversation_participant(conversation_id));

CREATE POLICY "Participants can send messages in active chats"
  ON messages FOR INSERT
  WITH CHECK (
    sender_clerk_user_id = auth.jwt()->>'sub'
    AND can_send_conversation_message(conversation_id)
  );

-- Create or fetch the direct conversation for a pairing the caller belongs to.
CREATE OR REPLACE FUNCTION ensure_pairing_conversation(pairing_id UUID)
RETURNS conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.jwt()->>'sub';
  v_conversation conversations;
  v_pairing RECORD;
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
  WHERE p.id = pairing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pairing not found';
  END IF;

  IF v_user_id NOT IN (v_pairing.mentor_clerk_user_id, v_pairing.mentee_clerk_user_id) THEN
    RAISE EXCEPTION 'Not allowed to access this pairing conversation';
  END IF;

  SELECT *
  INTO v_conversation
  FROM conversations
  WHERE conversations.pairing_id = ensure_pairing_conversation.pairing_id;

  IF FOUND THEN
    RETURN v_conversation;
  END IF;

  IF v_pairing.status NOT IN ('pending', 'active') THEN
    RAISE EXCEPTION 'Cannot create a conversation for a completed pairing';
  END IF;

  INSERT INTO conversations (pairing_id, title)
  VALUES (pairing_id, NULL)
  ON CONFLICT (pairing_id) DO UPDATE
  SET title = conversations.title
  RETURNING *
  INTO v_conversation;

  INSERT INTO conversation_members (
    conversation_id,
    clerk_user_id,
    profile_id,
    profile_role,
    display_name,
    avatar_url,
    last_read_at
  )
  VALUES
    (
      v_conversation.id,
      v_pairing.mentor_clerk_user_id,
      v_pairing.mentor_profile_id,
      'mentor',
      v_pairing.mentor_name,
      v_pairing.mentor_avatar_url,
      CASE WHEN v_user_id = v_pairing.mentor_clerk_user_id THEN now() ELSE NULL END
    ),
    (
      v_conversation.id,
      v_pairing.mentee_clerk_user_id,
      v_pairing.mentee_profile_id,
      'mentee',
      v_pairing.mentee_name,
      v_pairing.mentee_avatar_url,
      CASE WHEN v_user_id = v_pairing.mentee_clerk_user_id THEN now() ELSE NULL END
    )
  ON CONFLICT (conversation_id, clerk_user_id) DO UPDATE
  SET
    profile_id = EXCLUDED.profile_id,
    profile_role = EXCLUDED.profile_role,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url;

  RETURN v_conversation;
END;
$$;

-- Inbox summary tailored to the authenticated participant.
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
      cm.last_read_at
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
    counterpart.clerk_user_id AS counterpart_clerk_user_id,
    counterpart.profile_id AS counterpart_profile_id,
    counterpart.profile_role AS counterpart_role,
    counterpart.display_name AS counterpart_display_name,
    counterpart.avatar_url AS counterpart_avatar_url,
    mm.last_read_at AS my_last_read_at,
    lm.content AS last_message_content,
    lm.created_at AS last_message_created_at,
    lm.sender_clerk_user_id AS last_message_sender_clerk_user_id,
    lm.sender_name AS last_message_sender_name,
    COALESCE(um.unread_count, 0) AS unread_count
  FROM my_memberships mm
  JOIN conversations c ON c.id = mm.conversation_id
  JOIN pairings p ON p.id = c.pairing_id
  JOIN conversation_members counterpart
    ON counterpart.conversation_id = c.id
   AND counterpart.clerk_user_id <> auth.jwt()->>'sub'
  LEFT JOIN last_messages lm ON lm.conversation_id = c.id
  LEFT JOIN unread_messages um ON um.conversation_id = c.id
  ORDER BY COALESCE(lm.created_at, c.updated_at) DESC;
$$;

REVOKE ALL ON FUNCTION ensure_pairing_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_pairing_conversation(UUID) TO authenticated;

REVOKE ALL ON FUNCTION get_my_conversations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_my_conversations() TO authenticated;

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
