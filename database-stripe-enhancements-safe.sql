-- Stripe Integration Database Schema Enhancements (Safe Version)
-- This version safely handles existing policies and objects

-- 1. Enhance purchases table with comprehensive Stripe data
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
ADD COLUMN IF NOT EXISTS stripe_charge_id text,
ADD COLUMN IF NOT EXISTS payment_method_type text, -- card, bank_transfer, etc.
ADD COLUMN IF NOT EXISTS payment_method_last4 text, -- last 4 digits of card
ADD COLUMN IF NOT EXISTS payment_method_brand text, -- visa, mastercard, etc.
ADD COLUMN IF NOT EXISTS payment_method_country text, -- issuing country
ADD COLUMN IF NOT EXISTS billing_address jsonb, -- full billing address
ADD COLUMN IF NOT EXISTS receipt_url text, -- Stripe receipt URL
ADD COLUMN IF NOT EXISTS receipt_number text, -- Stripe receipt number
ADD COLUMN IF NOT EXISTS refunded_amount decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS dispute_status text, -- won, lost, warning_needs_response, etc.
ADD COLUMN IF NOT EXISTS failure_code text, -- card_declined, insufficient_funds, etc.
ADD COLUMN IF NOT EXISTS failure_message text,
ADD COLUMN IF NOT EXISTS metadata jsonb; -- custom metadata from Stripe

-- Add useful indexes for purchase queries (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchases_stripe_customer_id') THEN
        CREATE INDEX idx_purchases_stripe_customer_id ON purchases(stripe_customer_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchases_stripe_charge_id') THEN
        CREATE INDEX idx_purchases_stripe_charge_id ON purchases(stripe_charge_id);
    END IF;
END
$$;

-- 2. Create stripe_customers table for tracking Stripe customer records
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  name text,
  phone text,
  address jsonb, -- full address object from Stripe
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS and create policies only if table was created successfully
DO $$
BEGIN
  -- Check if table exists and has the user_id column
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_customers') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_customers' AND column_name = 'user_id') THEN
    
    ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own stripe customer data" ON stripe_customers;
    CREATE POLICY "Users can view own stripe customer data" ON stripe_customers
      FOR SELECT USING (auth.uid() = user_id);
      
    RAISE NOTICE 'Successfully created RLS policy for stripe_customers';
  ELSE
    RAISE NOTICE 'stripe_customers table or user_id column does not exist, skipping policy creation';
  END IF;
END
$$;

-- 3. Create stripe_payment_methods table
CREATE TABLE IF NOT EXISTS stripe_payment_methods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type text NOT NULL, -- card, bank_account, etc.
  card_brand text, -- visa, mastercard, etc.
  card_last4 text, -- last 4 digits
  card_exp_month integer, -- expiration month
  card_exp_year integer, -- expiration year
  card_country text, -- issuing country
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS and create policies
DO $$
BEGIN
  -- Check if table exists and has the user_id column
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_payment_methods') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_payment_methods' AND column_name = 'user_id') THEN
    
    ALTER TABLE stripe_payment_methods ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view own payment methods" ON stripe_payment_methods;
    CREATE POLICY "Users can view own payment methods" ON stripe_payment_methods
      FOR SELECT USING (auth.uid() = user_id);
      
    RAISE NOTICE 'Successfully created RLS policy for stripe_payment_methods';
  ELSE
    RAISE NOTICE 'stripe_payment_methods table or user_id column does not exist, skipping policy creation';
  END IF;
END
$$;

-- 4. Create stripe_refunds table for tracking refund status
CREATE TABLE IF NOT EXISTS stripe_refunds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_refund_id text UNIQUE NOT NULL,
  stripe_charge_id text NOT NULL,
  amount decimal(10,2) NOT NULL, -- refund amount
  currency text NOT NULL DEFAULT 'gbp',
  status text NOT NULL, -- pending, succeeded, failed, canceled
  reason text, -- duplicate, fraudulent, requested_by_customer
  description text,
  receipt_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS and create policies
DO $$
BEGIN
  -- Check if table exists and has the user_id column
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_refunds') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stripe_refunds' AND column_name = 'user_id') THEN
    
    ALTER TABLE stripe_refunds ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view refunds for own purchases" ON stripe_refunds;
    CREATE POLICY "Users can view refunds for own purchases" ON stripe_refunds
      FOR SELECT USING (auth.uid() = user_id);
      
    RAISE NOTICE 'Successfully created RLS policy for stripe_refunds';
  ELSE
    RAISE NOTICE 'stripe_refunds table or user_id column does not exist, skipping policy creation';
  END IF;
END
$$;

-- Add useful indexes for refunds (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_refunds_purchase_id') THEN
        CREATE INDEX idx_refunds_purchase_id ON stripe_refunds(purchase_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_refunds_stripe_charge_id') THEN
        CREATE INDEX idx_refunds_stripe_charge_id ON stripe_refunds(stripe_charge_id);
    END IF;
END
$$;

-- 5. Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to update timestamps (safe to run multiple times)
DO $$
BEGIN
  -- Create triggers only if tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_customers') THEN
    DROP TRIGGER IF EXISTS update_stripe_customers_updated_at ON stripe_customers;
    CREATE TRIGGER update_stripe_customers_updated_at
        BEFORE UPDATE ON stripe_customers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger for stripe_customers';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_payment_methods') THEN
    DROP TRIGGER IF EXISTS update_stripe_payment_methods_updated_at ON stripe_payment_methods;
    CREATE TRIGGER update_stripe_payment_methods_updated_at
        BEFORE UPDATE ON stripe_payment_methods
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger for stripe_payment_methods';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_refunds') THEN
    DROP TRIGGER IF EXISTS update_stripe_refunds_updated_at ON stripe_refunds;
    CREATE TRIGGER update_stripe_refunds_updated_at
        BEFORE UPDATE ON stripe_refunds
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Created trigger for stripe_refunds';
  END IF;
END
$$;

-- Final verification queries (these won't modify anything, just check)
SELECT 'Stripe enhancements completed successfully!' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('purchases', 'stripe_customers', 'stripe_payment_methods', 'stripe_refunds')
ORDER BY table_name, ordinal_position;