-- Verify that the live database matches the messaging contract expected by the app.
-- Run this in the Supabase SQL editor after applying migrations.

-- Required columns introduced by the rebuilt messaging flow.
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'conversations' AND column_name IN ('id', 'pairing_id', 'updated_at'))
    OR (table_name = 'conversation_members' AND column_name IN ('conversation_id', 'clerk_user_id', 'profile_id', 'profile_role', 'last_read_at'))
    OR (table_name = 'messages' AND column_name IN ('conversation_id', 'sender_clerk_user_id', 'sender_name', 'content', 'message_type', 'meeting_id', 'created_at'))
    OR (table_name = 'meetings' AND column_name IN ('pairing_id', 'mentor_id', 'mentee_id', 'created_by', 'status', 'responded_at', 'responded_by', 'scheduled_at'))
  )
ORDER BY table_name, column_name;

-- Required RPCs and helper functions.
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_conversation_participant',
    'can_send_conversation_message',
    'is_meeting_participant',
    'ensure_pairing_conversation',
    'get_my_conversations',
    'mark_conversation_read',
    'request_pairing_meeting',
    'respond_to_meeting_request'
  )
ORDER BY p.proname;

-- Required RLS policies.
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'conversation_members', 'messages', 'meetings')
ORDER BY tablename, policyname;

-- Helpful indexes for the canonical pairing-owned inbox.
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'conversation_members', 'messages', 'meetings')
ORDER BY tablename, indexname;
