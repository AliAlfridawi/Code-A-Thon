-- =====================================================
-- Migration 009: Make pairing conversations resilient
-- to self-pairings and partially linked profile records.
-- =====================================================

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

  IF NOT FOUND THEN
    IF v_pairing.status NOT IN ('pending', 'active') THEN
      RAISE EXCEPTION 'Cannot create a conversation for a completed pairing';
    END IF;

    INSERT INTO conversations (pairing_id, title)
    VALUES (pairing_id, NULL)
    ON CONFLICT (pairing_id) DO UPDATE
    SET title = conversations.title
    RETURNING *
    INTO v_conversation;
  END IF;

  IF v_user_id = v_pairing.mentor_clerk_user_id THEN
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
      now()
    )
    ON CONFLICT (conversation_id, clerk_user_id) DO UPDATE
    SET
      profile_id = EXCLUDED.profile_id,
      profile_role = EXCLUDED.profile_role,
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url;

    IF v_pairing.mentee_clerk_user_id IS NOT NULL
       AND v_pairing.mentee_clerk_user_id <> v_pairing.mentor_clerk_user_id THEN
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
        NULL
      )
      ON CONFLICT (conversation_id, clerk_user_id) DO UPDATE
      SET
        profile_id = EXCLUDED.profile_id,
        profile_role = EXCLUDED.profile_role,
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url;
    END IF;
  ELSE
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
      now()
    )
    ON CONFLICT (conversation_id, clerk_user_id) DO UPDATE
    SET
      profile_id = EXCLUDED.profile_id,
      profile_role = EXCLUDED.profile_role,
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url;

    IF v_pairing.mentor_clerk_user_id IS NOT NULL
       AND v_pairing.mentor_clerk_user_id <> v_pairing.mentee_clerk_user_id THEN
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
        NULL
      )
      ON CONFLICT (conversation_id, clerk_user_id) DO UPDATE
      SET
        profile_id = EXCLUDED.profile_id,
        profile_role = EXCLUDED.profile_role,
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url;
    END IF;
  END IF;

  RETURN v_conversation;
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
      WHEN mm.profile_role = 'mentor' THEN COALESCE(mentee.clerk_user_id, mentor.clerk_user_id)
      ELSE COALESCE(mentor.clerk_user_id, mentee.clerk_user_id)
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
