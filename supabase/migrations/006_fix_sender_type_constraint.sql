-- =====================================================
-- Migration 006: Fix sender_type constraint
-- =====================================================

-- We need to store Clerk User IDs strings in sender_type instead of 'self'/'other'.
-- Drop the existing CHECK constraint from migration 001.

DO $$
DECLARE
    c_name text;
BEGIN
    SELECT conname INTO c_name
    FROM pg_constraint
    WHERE conrelid = 'messages'::regclass 
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%sender_type%';

    IF c_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE messages DROP CONSTRAINT ' || quote_ident(c_name);
    END IF;
END $$;
