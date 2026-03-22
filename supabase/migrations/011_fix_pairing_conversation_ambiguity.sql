-- =====================================================
-- Migration 011: Remove PL/pgSQL identifier ambiguity
-- from the pairing conversation RPC.
-- =====================================================

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
      RAISE EXCEPTION 'Cannot create a conversation for a completed pairing';
    END IF;

    INSERT INTO conversations (pairing_id, title)
    VALUES (p_pairing_id, NULL)
    ON CONFLICT (pairing_id) DO UPDATE
    SET title = conversations.title
    RETURNING *
    INTO v_conversation;
  END IF;

  IF v_current_role = 'mentor' THEN
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
      avatar_url = EXCLUDED.avatar_url,
      last_read_at = COALESCE(EXCLUDED.last_read_at, conversation_members.last_read_at);

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
        avatar_url = EXCLUDED.avatar_url,
        last_read_at = COALESCE(EXCLUDED.last_read_at, conversation_members.last_read_at);
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
      avatar_url = EXCLUDED.avatar_url,
      last_read_at = COALESCE(EXCLUDED.last_read_at, conversation_members.last_read_at);

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
        avatar_url = EXCLUDED.avatar_url,
        last_read_at = COALESCE(EXCLUDED.last_read_at, conversation_members.last_read_at);
    END IF;
  END IF;

  RETURN QUERY SELECT v_conversation.id;
END;
$$;

REVOKE ALL ON FUNCTION ensure_pairing_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_pairing_conversation(UUID) TO authenticated;
