-- =====================================================
-- Migration 019: Restore meetings.created_by compatibility
-- for normalized meeting RPC contract.
-- =====================================================

ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS created_by TEXT;

WITH request_messages AS (
	SELECT
		m.id AS meeting_id,
		(
			SELECT msg.sender_clerk_user_id
			FROM public.messages AS msg
			WHERE msg.meeting_id = m.id
				AND msg.message_type = 'meeting_request'
			ORDER BY msg.created_at ASC, msg.id ASC
			LIMIT 1
		) AS requester_clerk_user_id
	FROM public.meetings AS m
	WHERE m.created_by IS NULL
)
UPDATE public.meetings AS m
SET created_by = request_messages.requester_clerk_user_id
FROM request_messages
WHERE m.id = request_messages.meeting_id
	AND request_messages.requester_clerk_user_id IS NOT NULL
	AND m.created_by IS NULL;

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
	p_pairing_id ALIAS FOR $1;
	p_title ALIAS FOR $2;
	p_scheduled_at ALIAS FOR $3;
	p_duration_minutes ALIAS FOR $4;
	p_meeting_link ALIAS FOR $5;
	p_notes ALIAS FOR $6;
	v_user_id TEXT := auth.jwt()->>'sub';
	v_conversation_id UUID;
	v_pairing RECORD;
	v_meeting meetings;
	v_message messages;
	v_requester_name TEXT;
	v_clean_title TEXT := btrim(p_title);
	v_duration_minutes INTEGER := GREATEST(COALESCE(p_duration_minutes, 30), 1);
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
	WHERE p.id = p_pairing_id;

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
	FROM ensure_pairing_conversation(p_pairing_id) AS ensured;

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
		NULLIF(btrim(p_meeting_link), ''),
		p_scheduled_at,
		v_duration_minutes,
		NULLIF(btrim(p_notes), ''),
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

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE n.nspname = 'public'
			AND t.typname = 'meeting_request_response_result'
	) THEN
		CREATE TYPE public.meeting_request_response_result AS (
			meeting_id UUID,
			status TEXT,
			conversation_id UUID,
			message_id UUID
		);
	END IF;
END $$;

DROP FUNCTION IF EXISTS respond_to_meeting_request(UUID, TEXT);
CREATE OR REPLACE FUNCTION respond_to_meeting_request(
	meeting_id UUID,
	decision TEXT
)
RETURNS SETOF public.meeting_request_response_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	p_meeting_id ALIAS FOR $1;
	p_decision ALIAS FOR $2;
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

	IF v_meeting.created_by IS NOT NULL AND v_user_id = v_meeting.created_by THEN
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
	SELECT
		v_meeting.id,
		v_meeting.status,
		v_conversation_id,
		v_message.id;
END;
$$;

REVOKE ALL ON FUNCTION request_pairing_meeting(UUID, TEXT, TIMESTAMPTZ, INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION request_pairing_meeting(UUID, TEXT, TIMESTAMPTZ, INTEGER, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION respond_to_meeting_request(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION respond_to_meeting_request(UUID, TEXT) TO authenticated;
