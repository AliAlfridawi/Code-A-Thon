-- =====================================================
-- Migration 014: Fix ensure_pairing_conversation parameter
-- ambiguity with conversations.pairing_id.
-- =====================================================

DROP FUNCTION IF EXISTS ensure_pairing_conversation(UUID);

CREATE OR REPLACE FUNCTION ensure_pairing_conversation(pairing_id UUID)
RETURNS TABLE (
  conversation_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
  WHERE p.id = ensure_pairing_conversation.pairing_id;

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
  WHERE c.pairing_id = ensure_pairing_conversation.pairing_id;

  IF NOT FOUND THEN
    IF v_pairing.status NOT IN ('pending', 'active') THEN
      RAISE EXCEPTION 'Completed pairing has no existing conversation';
    END IF;

    BEGIN
      INSERT INTO conversations (pairing_id, title)
      VALUES (ensure_pairing_conversation.pairing_id, NULL)
      RETURNING *
      INTO v_conversation;
    EXCEPTION
      WHEN unique_violation THEN
        SELECT c.*
        INTO v_conversation
        FROM conversations c
        WHERE c.pairing_id = ensure_pairing_conversation.pairing_id;
    END;
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

REVOKE ALL ON FUNCTION ensure_pairing_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ensure_pairing_conversation(UUID) TO authenticated;
