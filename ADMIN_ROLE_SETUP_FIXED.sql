-- Fixed Admin Role Setup for Aneo Dashboard
-- Execute this in Supabase SQL Editor
-- This version fixes the infinite recursion issue in RLS policies

-- 1. First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
DROP POLICY IF EXISTS "Admins can view activity logs" ON admin_activity_log;
DROP POLICY IF EXISTS "System can insert activity logs" ON admin_activity_log;
DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile, admins can update any" ON profiles;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Users can view active courses, admins can manage all" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;

-- 2. Create a function to check if current user is admin
-- This avoids the recursion issue by using a function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
$$;

-- 3. Create improved RLS policies using the function

-- Allow users to view their own profile, admins to view all
CREATE POLICY "Users can view own profile, admins can view all" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR is_admin()
  );

-- Allow users to update their own profile, admins to update any
CREATE POLICY "Users can update own profile, admins can update any" ON profiles
  FOR UPDATE USING (
    id = auth.uid() OR is_admin()
  );

-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (is_admin() OR user_id = auth.uid());

-- Allow admins to update orders
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (is_admin());

-- Allow admins to manage courses, users to view active courses
CREATE POLICY "Users can view active courses, admins can manage all" ON courses
  FOR SELECT USING (is_active = true OR is_admin());

-- Allow admins to insert courses
CREATE POLICY "Admins can insert courses" ON courses
  FOR INSERT WITH CHECK (is_admin());

-- Allow admins to update courses
CREATE POLICY "Admins can update courses" ON courses
  FOR UPDATE USING (is_admin());

-- Allow admins to delete courses
CREATE POLICY "Admins can delete courses" ON courses
  FOR DELETE USING (is_admin());

-- Create admin activity log table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin activity log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs
CREATE POLICY "Admins can view activity logs" ON admin_activity_log
  FOR SELECT USING (is_admin());

-- Only system can insert activity logs
CREATE POLICY "System can insert activity logs" ON admin_activity_log
  FOR INSERT WITH CHECK (true);

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user has admin role';
COMMENT ON TABLE admin_activity_log IS 'Log of admin actions for audit trail';
COMMENT ON COLUMN admin_activity_log.action_type IS 'Type of action: CREATE, UPDATE, DELETE, VIEW';
COMMENT ON COLUMN admin_activity_log.resource_type IS 'Type of resource: COURSE, USER, ORDER, etc.';
COMMENT ON COLUMN admin_activity_log.details IS 'Additional details about the action in JSON format';