-- Fix RLS policies for orders and order_items
-- Run this in Supabase SQL Editor if you've already run the initial setup

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "System can manage orders" ON orders;
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "System can manage order items" ON order_items;

-- Create updated policies for orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- Create updated policies for order_items
CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage order items" ON order_items
  FOR ALL USING (auth.role() = 'service_role');

-- Fix course_access policies too
ALTER TABLE course_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own course access" ON course_access;
DROP POLICY IF EXISTS "System can manage course access" ON course_access;
DROP POLICY IF EXISTS "Users can be granted course access" ON course_access;

CREATE POLICY "Users can view their own course access" ON course_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage course access" ON course_access
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can be granted course access" ON course_access
  FOR INSERT WITH CHECK (true);