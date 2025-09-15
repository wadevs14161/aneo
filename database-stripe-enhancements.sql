-- Stripe Integration Database Schema Enhancements
-- Add these modifications to your existing database schema

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

-- Update status check constraint to include more Stripe statuses
ALTER TABLE purchases 
DROP CONSTRAINT IF EXISTS purchases_status_check,
ADD CONSTRAINT purchases_status_check 
CHECK (status IN ('pending', 'processing', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'succeeded', 'canceled', 'failed', 'refunded', 'partially_refunded', 'disputed'));

-- 2. Create stripe_customers table for customer management
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text,
  name text,
  phone text,
  default_payment_method text, -- Stripe payment method ID
  invoice_prefix text,
  tax_ids jsonb, -- array of tax ID objects
  shipping_address jsonb,
  billing_address jsonb,
  balance integer DEFAULT 0, -- account balance in cents
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(user_id)
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stripe customer data" ON stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Create stripe_payment_methods table
CREATE TABLE IF NOT EXISTS stripe_payment_methods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type text NOT NULL, -- card, bank_account, etc.
  card_brand text, -- visa, mastercard, etc.
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  card_country text,
  is_default boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

ALTER TABLE stripe_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods" ON stripe_payment_methods
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Create stripe_webhooks_log table for webhook tracking
CREATE TABLE IF NOT EXISTS stripe_webhooks_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamp,
  error_message text,
  attempts integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- 5. Create stripe_refunds table for refund tracking
CREATE TABLE IF NOT EXISTS stripe_refunds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  stripe_refund_id text UNIQUE NOT NULL,
  stripe_charge_id text,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'gbp',
  reason text, -- requested_by_customer, fraudulent, duplicate
  status text, -- pending, succeeded, failed, canceled
  failure_reason text,
  receipt_number text,
  created_at timestamp DEFAULT now()
);

ALTER TABLE stripe_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view refunds for own purchases" ON stripe_refunds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchases p 
      WHERE p.id = stripe_refunds.purchase_id 
      AND p.user_id = auth.uid()
    )
  );

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_customer_id ON purchases(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session_id ON purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent_id ON purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_methods_user_id ON stripe_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_type ON stripe_webhooks_log(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON stripe_webhooks_log(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_refunds_purchase_id ON stripe_refunds(purchase_id);

-- 8. Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();