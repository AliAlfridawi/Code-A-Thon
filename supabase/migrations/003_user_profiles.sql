-- =====================================================
-- Migration 003: User Profiles & Onboarding State
-- Tracks role selection and onboarding completion,
-- plus icebreaker quiz answers.
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'mentee')),
  onboarding_complete BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by clerk_user_id
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);

-- =============== ENABLE RLS ===============
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (
    clerk_user_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (
    clerk_user_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')
  );

-- Allow service role / anon to check if any user_profiles row exists (for onboarding guard)
-- This is a broader read policy so the guard can check existence
CREATE POLICY "Allow authenticated read user_profiles"
  ON user_profiles FOR SELECT
  USING (true);
