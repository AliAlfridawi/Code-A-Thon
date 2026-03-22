-- =====================================================
-- Migration 008: Allow pending pairing deletion
-- so requests can be denied from the dashboard.
-- =====================================================

DROP POLICY IF EXISTS "Auth delete pending pairings" ON pairings;

CREATE POLICY "Auth delete pending pairings"
  ON pairings FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND status = 'pending'
  );
