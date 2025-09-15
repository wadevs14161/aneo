-- Add missing Stripe columns to orders table
-- Run this in your Supabase SQL Editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_charge_id text,
ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_customer ON orders(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_charge ON orders(stripe_charge_id);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name LIKE 'stripe_%'
ORDER BY column_name;