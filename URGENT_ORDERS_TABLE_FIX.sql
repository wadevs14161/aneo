-- URGENT FIX: Add missing columns to fix database errors
-- Run this FIRST in your Supabase SQL Editor to fix the immediate database errors

-- 1. Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing orders to have updated_at timestamp
UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;

-- Add auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger to avoid conflicts
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Add missing columns to courses table (prevents database errors)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing courses
UPDATE courses SET updated_at = created_at WHERE updated_at IS NULL;

-- Drop and recreate trigger for courses table
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();