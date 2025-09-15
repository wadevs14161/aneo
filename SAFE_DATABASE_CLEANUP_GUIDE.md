# 🧹 Safe Database Cleanup Guide

## ⚠️ **CRITICAL: Backup First!**

Before running any cleanup, **backup your database**:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Database
2. Click "Create Backup" or export your schema/data

## 📊 **Step 1: Check What You Actually Have**

Run this in Supabase SQL Editor to see your current tables and data:

```sql
-- See all your tables and their sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size,
    (SELECT COUNT(*) FROM pg_stat_user_tables WHERE relname = tablename) as has_stats
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;
```

## 📈 **Step 2: Check for Data in "Unused" Tables**

```sql
-- Check if potentially unused tables have any data
DO $$
DECLARE
    table_name TEXT;
    row_count INTEGER;
    sql_text TEXT;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY[
        'stripe_refunds', 'stripe_payouts', 'stripe_charges', 'stripe_invoices', 
        'stripe_subscriptions', 'user_sessions', 'notifications', 
        'user_preferences', 'audit_logs', 'email_templates', 'system_settings'
    ])
    LOOP
        BEGIN
            sql_text := format('SELECT COUNT(*) FROM %I', table_name);
            EXECUTE sql_text INTO row_count;
            RAISE NOTICE 'Table "%" has % rows', table_name, row_count;
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'Table "%" does not exist (already cleaned up)', table_name;
        END;
    END LOOP;
END $$;
```

## 🗑️ **Step 3: Safe Cleanup (Run One at a Time)**

### **3a. Remove Empty Stripe Tables** (if count = 0 from step 2)

```sql
-- Only run these if the tables showed 0 rows in step 2
DROP TABLE IF EXISTS stripe_refunds CASCADE;
DROP TABLE IF EXISTS stripe_payouts CASCADE; 
DROP TABLE IF EXISTS stripe_charges CASCADE;
DROP TABLE IF EXISTS stripe_invoices CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
```

### **3b. Remove Empty Application Tables** (if count = 0 from step 2)

```sql
-- Only run these if the tables showed 0 rows in step 2
DROP TABLE IF EXISTS user_sessions CASCADE;  -- Supabase Auth handles this
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
```

## ➕ **Step 4: Add Missing Columns**

```sql
-- Add missing column for complete Stripe integration
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;
```

## 🚀 **Step 5: Optimize Performance**

Add indexes on your most-used tables:

```sql
-- Profiles (12 code references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Course Access (8 code references) 
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_access_user_course ON course_access(user_id, course_id);

-- Orders (8 code references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);

-- Cart Items (6 code references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Stripe Customers (4 code references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
```

## ✅ **Step 6: Verify Results**

```sql
-- See your cleaned up schema
SELECT 
    tablename as "Table Name",
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as "Size"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## 🎯 **Expected Results**

After cleanup, you should have **only these tables**:
- ✅ `cart_items` (6 code references)
- ✅ `course_access` (8 code references) 
- ✅ `courses` (4 code references)
- ✅ `order_items` (1 code reference)
- ✅ `orders` (8 code references) + new `stripe_charge_id` column
- ✅ `profiles` (12 code references)
- ✅ `purchases` (4 code references)
- ✅ `stripe_customers` (4 code references)
- ✅ `stripe_payment_methods` (1 code reference)
- ✅ `stripe_webhooks_log` (1 code reference)

**Total: 10 optimized tables** instead of your current ~20 tables.

## 🆘 **If Something Goes Wrong**

1. **Restore from backup** (you made one in Step 0, right? 😅)
2. **Recreate a table** if you accidentally dropped one with data:
   ```sql
   -- Example: Restore notifications table
   CREATE TABLE notifications (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       -- add your columns here
   );
   ```

## 📋 **Cleanup Checklist**

- [ ] ✅ Database backed up
- [ ] ✅ Checked table data counts  
- [ ] ✅ Removed empty Stripe tables
- [ ] ✅ Removed empty application tables
- [ ] ✅ Added missing `stripe_charge_id` column
- [ ] ✅ Added performance indexes
- [ ] ✅ Verified final schema
- [ ] ✅ Tested application still works

**🎉 Congratulations! Your database is now optimized and will perform better!**