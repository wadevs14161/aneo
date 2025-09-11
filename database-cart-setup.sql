-- Shopping Cart and Order System Setup
-- Run this in Supabase SQL Editor

-- 1. Shopping cart table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  added_at timestamp DEFAULT now(),
  UNIQUE(user_id, course_id) -- Prevent duplicate items
);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Users can manage their own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- 2. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  total_amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method text DEFAULT 'card',
  created_at timestamp DEFAULT now(),
  completed_at timestamp
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Order policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can manage orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  price decimal(10,2) NOT NULL,
  course_title text NOT NULL -- Store title at time of purchase
);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order items policies
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

-- 4. Course access policies (if table exists)
-- Enable RLS on course_access if it exists
ALTER TABLE course_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own course access" ON course_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage course access" ON course_access
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can be granted course access" ON course_access
  FOR INSERT WITH CHECK (true); -- Allow any authenticated user to be granted access

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_course_access_user_id ON course_access(user_id);