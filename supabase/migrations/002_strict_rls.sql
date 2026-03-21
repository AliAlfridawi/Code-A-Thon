-- =====================================================
-- Phase 6: Strict RLS with Clerk JWT
-- =====================================================

-- Overview:
-- This migration drops the initial "open" authenticated policies
-- and replaces them with strict policies that verify the 
-- Clerk JWT `sub` claim against the database rows.

-- ================= DROP OLD POLICIES =================

DROP POLICY IF EXISTS "Allow public read mentors" ON mentors;
DROP POLICY IF EXISTS "Allow authenticated insert mentors" ON mentors;
DROP POLICY IF EXISTS "Allow authenticated update mentors" ON mentors;

DROP POLICY IF EXISTS "Allow public read mentees" ON mentees;
DROP POLICY IF EXISTS "Allow authenticated insert mentees" ON mentees;
DROP POLICY IF EXISTS "Allow authenticated update mentees" ON mentees;

DROP POLICY IF EXISTS "Allow public read pairings" ON pairings;
DROP POLICY IF EXISTS "Allow authenticated insert pairings" ON pairings;
DROP POLICY IF EXISTS "Allow authenticated update pairings" ON pairings;

DROP POLICY IF EXISTS "Allow public read conversations" ON conversations;
DROP POLICY IF EXISTS "Allow authenticated insert conversations" ON conversations;

DROP POLICY IF EXISTS "Allow public read conversation_members" ON conversation_members;
DROP POLICY IF EXISTS "Allow authenticated insert conversation_members" ON conversation_members;

DROP POLICY IF EXISTS "Allow public read messages" ON messages;
DROP POLICY IF EXISTS "Allow authenticated insert messages" ON messages;

DROP POLICY IF EXISTS "Allow public read activity_log" ON activity_log;
DROP POLICY IF EXISTS "Allow authenticated insert activity_log" ON activity_log;

DROP POLICY IF EXISTS "Allow public read user_settings" ON user_settings;
DROP POLICY IF EXISTS "Allow authenticated insert user_settings" ON user_settings;
DROP POLICY IF EXISTS "Allow authenticated update user_settings" ON user_settings;


-- ================= NEW STRICT POLICIES =================

-- 1. Mentors
-- Anyone can view mentor profiles
CREATE POLICY "Public read mentors" ON mentors 
  FOR SELECT USING (true);
-- Mentors can only insert/update their own profile
CREATE POLICY "Owner insert mentors" ON mentors 
  FOR INSERT WITH CHECK (auth.jwt()->>'sub' = clerk_user_id);
CREATE POLICY "Owner update mentors" ON mentors 
  FOR UPDATE USING (auth.jwt()->>'sub' = clerk_user_id);

-- 2. Mentees
-- Anyone can view mentee profiles
CREATE POLICY "Public read mentees" ON mentees 
  FOR SELECT USING (true);
-- Mentees can only insert/update their own profile
CREATE POLICY "Owner insert mentees" ON mentees 
  FOR INSERT WITH CHECK (auth.jwt()->>'sub' = clerk_user_id);
CREATE POLICY "Owner update mentees" ON mentees 
  FOR UPDATE USING (auth.jwt()->>'sub' = clerk_user_id);

-- 3. User Settings
-- Users can only read, insert, and update their own settings
CREATE POLICY "Owner read settings" ON user_settings 
  FOR SELECT USING (auth.jwt()->>'sub' = clerk_user_id);
CREATE POLICY "Owner insert settings" ON user_settings 
  FOR INSERT WITH CHECK (auth.jwt()->>'sub' = clerk_user_id);
CREATE POLICY "Owner update settings" ON user_settings 
  FOR UPDATE USING (auth.jwt()->>'sub' = clerk_user_id);

-- 4. Pairings
-- For this demo, anyone authenticated can read/insert pairings (so the auto-match UI works)
CREATE POLICY "Auth read pairings" ON pairings 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert pairings" ON pairings 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update pairings" ON pairings 
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Activity Log
-- Anyone authenticated can read/insert activity logs
CREATE POLICY "Auth read activity_log" ON activity_log 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert activity_log" ON activity_log 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Messaging System
-- For this academic hub demo, any authenticated user can read/write conversations
CREATE POLICY "Auth read conversations" ON conversations 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert conversations" ON conversations 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update conversations" ON conversations 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth read conversation_members" ON conversation_members 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert conversation_members" ON conversation_members 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth read messages" ON messages 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth insert messages" ON messages 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update messages" ON messages 
  FOR UPDATE USING (auth.role() = 'authenticated');
