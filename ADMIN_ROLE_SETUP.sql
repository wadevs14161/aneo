-- Admin Role Setup for Aneo Dashboard
-- Execute this in Supabase SQL Editor

-- 1. Create user role enum
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');

-- 2. Add role column to profiles table
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';

-- 3. Create your first admin user (replace with your actual user ID)
-- You can get your user ID from Supabase Dashboard -> Authentication -> Users
-- UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id-here';

-- 4. Add RLS policies for admin access

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Allow admins to update user roles (only superadmins can promote to admin)
CREATE POLICY "Admins can manage user roles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Allow admins to view all courses
CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Create admin activity log table
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
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Only system can insert activity logs
CREATE POLICY "System can insert activity logs" ON admin_activity_log
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE admin_activity_log IS 'Log of admin actions for audit trail';
COMMENT ON COLUMN admin_activity_log.action_type IS 'Type of action: CREATE, UPDATE, DELETE, VIEW';
COMMENT ON COLUMN admin_activity_log.resource_type IS 'Type of resource: COURSE, USER, ORDER, etc.';
COMMENT ON COLUMN admin_activity_log.details IS 'Additional details about the action in JSON format';