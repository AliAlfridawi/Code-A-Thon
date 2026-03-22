-- Audit pairings that cannot participate in canonical messaging yet.
-- Run this after onboarding or before investigating "Conversation unavailable" reports.

SELECT
  p.id AS pairing_id,
  p.status,
  mentor.id AS mentor_profile_id,
  mentor.name AS mentor_name,
  mentor.clerk_user_id AS mentor_clerk_user_id,
  mentee.id AS mentee_profile_id,
  mentee.name AS mentee_name,
  mentee.clerk_user_id AS mentee_clerk_user_id,
  CASE
    WHEN mentor.clerk_user_id IS NULL OR mentee.clerk_user_id IS NULL THEN 'blocked'
    ELSE 'ready'
  END AS messaging_readiness
FROM pairings p
JOIN mentors mentor ON mentor.id = p.mentor_id
JOIN mentees mentee ON mentee.id = p.mentee_id
WHERE p.status IN ('pending', 'active', 'completed')
ORDER BY
  CASE
    WHEN mentor.clerk_user_id IS NULL OR mentee.clerk_user_id IS NULL THEN 0
    ELSE 1
  END,
  p.created_at DESC;

-- Conversations whose membership rows drifted away from pairing ownership.
SELECT
  c.id AS conversation_id,
  c.pairing_id,
  cm.clerk_user_id AS unexpected_member_clerk_user_id
FROM conversations c
JOIN pairings p ON p.id = c.pairing_id
JOIN mentors mentor ON mentor.id = p.mentor_id
JOIN mentees mentee ON mentee.id = p.mentee_id
JOIN conversation_members cm ON cm.conversation_id = c.id
WHERE cm.clerk_user_id NOT IN (mentor.clerk_user_id, mentee.clerk_user_id)
ORDER BY c.created_at DESC;
