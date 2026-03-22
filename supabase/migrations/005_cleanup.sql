-- =====================================================
-- Cleanup: Remove all user data for fresh demo
-- Run this in Supabase SQL Editor before the demo
-- =====================================================

-- Order matters due to foreign key constraints
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversation_members CASCADE;
TRUNCATE TABLE conversations CASCADE;
TRUNCATE TABLE meetings CASCADE;
TRUNCATE TABLE pairings CASCADE;
TRUNCATE TABLE activity_log CASCADE;
TRUNCATE TABLE user_profiles CASCADE;
TRUNCATE TABLE mentees CASCADE;
TRUNCATE TABLE mentors CASCADE;
TRUNCATE TABLE user_settings CASCADE;
