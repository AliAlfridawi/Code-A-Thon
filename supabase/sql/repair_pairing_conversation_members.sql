-- Repair canonical conversation membership after backfilling clerk_user_id values.
-- This is idempotent and mirrors the pairing-owned membership repair in migration 013.

DELETE FROM conversation_members cm
USING conversations c
JOIN pairings p ON p.id = c.pairing_id
JOIN mentors mentor ON mentor.id = p.mentor_id
JOIN mentees mentee ON mentee.id = p.mentee_id
WHERE cm.conversation_id = c.id
  AND cm.clerk_user_id NOT IN (mentor.clerk_user_id, mentee.clerk_user_id);

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
