-- Quick fix for course_access table RLS policies
-- Run this immediately in Supabase SQL Editor

-- Enable RLS on course_access
ALTER TABLE course_access ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own course access" ON course_access;
DROP POLICY IF EXISTS "System can manage course access" ON course_access;
DROP POLICY IF EXISTS "Users can be granted course access" ON course_access;

-- Create new policies
CREATE POLICY "Users can view their own course access" ON course_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage course access" ON course_access
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can be granted course access" ON course_access
  FOR INSERT WITH CHECK (true);

-- Also add an index for performance
CREATE INDEX IF NOT EXISTS idx_course_access_user_id ON course_access(user_id);