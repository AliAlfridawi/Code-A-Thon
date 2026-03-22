-- =====================================================
-- Migration 018: Fix meetings RLS infinite recursion
-- =====================================================

-- Drop the recursive policy and function
DROP POLICY IF EXISTS "Participants can read meetings" ON meetings;
DROP FUNCTION IF EXISTS is_meeting_participant(UUID);

-- Recreate the policy with non-recursive inline subqueries
CREATE POLICY "Participants can read meetings"
  ON meetings FOR SELECT
  USING (
    mentor_id IN (SELECT id FROM mentors WHERE clerk_user_id = auth.jwt()->>'sub')
    OR
    mentee_id IN (SELECT id FROM mentees WHERE clerk_user_id = auth.jwt()->>'sub')
  );
