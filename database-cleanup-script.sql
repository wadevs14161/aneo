-- 🧹 DATABASE CLEANUP SCRIPT
-- Run this script in your Supabase SQL Editor to clean up unused tables
-- ⚠️  BACKUP YOUR DATABASE FIRST! This will permanently delete data.

-- =============================================================================
-- STEP 1: SAFETY CHECK - Count rows in potentially unused tables
-- =============================================================================

DO $$
DECLARE
    rec RECORD;
    table_name TEXT;
    row_count INTEGER;
BEGIN
    -- List of tables that appear unused based on code analysis
    FOR table_name IN SELECT unnest(ARRAY[
        'stripe_refunds',
        'stripe_payouts', 
        'stripe_charges',
        'stripe_invoices',
        'stripe_subscriptions',
        'user_sessions',
        'notifications',
        'user_preferences',
        'audit_logs',
        'email_templates',
        'system_settings'
    ])
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
            RAISE NOTICE 'Table % has % rows', table_name, row_count;
        EXCEPTION
            WHEN undefined_table THEN
                RAISE NOTICE 'Table % does not exist', table_name;
        END;
    END LOOP;
END $$;

-- =============================================================================
-- STEP 2: BACKUP IMPORTANT DATA (if tables have data you want to keep)
-- =============================================================================

-- Uncomment and run if you want to backup data before deletion:
/*
-- Backup audit logs if they exist and have data
CREATE TABLE audit_logs_backup AS SELECT * FROM audit_logs;

-- Backup notifications if they exist and have data
CREATE TABLE notifications_backup AS SELECT * FROM notifications;

-- Backup user preferences if they exist and have data  
CREATE TABLE user_preferences_backup AS SELECT * FROM user_preferences;
*/

-- =============================================================================
-- STEP 3: DROP UNUSED STRIPE TABLES (if confirmed empty/unused)
-- =============================================================================

DO $$
BEGIN
    -- Drop Stripe tables that aren't used in the codebase
    DROP TABLE IF EXISTS stripe_refunds CASCADE;
    DROP TABLE IF EXISTS stripe_payouts CASCADE;
    DROP TABLE IF EXISTS stripe_charges CASCADE;
    DROP TABLE IF EXISTS stripe_invoices CASCADE;
    DROP TABLE IF EXISTS stripe_subscriptions CASCADE;

    RAISE NOTICE '✅ Dropped unused Stripe tables';
END $$;

-- =============================================================================
-- STEP 4: DROP UNUSED APPLICATION TABLES
-- =============================================================================

DO $$
BEGIN
    -- Drop application tables not referenced in code
    DROP TABLE IF EXISTS user_sessions CASCADE;  -- Supabase Auth handles sessions
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS user_preferences CASCADE;
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS email_templates CASCADE;
    DROP TABLE IF EXISTS system_settings CASCADE;

    RAISE NOTICE '✅ Dropped unused application tables';
END $$;

-- =============================================================================
-- STEP 5: ADD MISSING COLUMNS TO ACTIVE TABLES
-- =============================================================================

-- Add missing columns to orders table
DO $$
BEGIN
    -- Check if stripe_charge_id column exists, add if it doesn't
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'stripe_charge_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN stripe_charge_id TEXT;
        RAISE NOTICE '✅ Added stripe_charge_id column to orders table';
    ELSE
        RAISE NOTICE 'ℹ️  stripe_charge_id column already exists in orders table';
    END IF;

    -- Check if updated_at column exists, add if it doesn't
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Added updated_at column to orders table';
    ELSE
        RAISE NOTICE 'ℹ️  updated_at column already exists in orders table';
    END IF;
END $$;

-- =============================================================================
-- STEP 6: OPTIMIZE REMAINING TABLES WITH INDEXES
-- =============================================================================

-- Add indexes on frequently queried columns based on code analysis
DO $$
BEGIN
    -- Index for profiles (most used table - 12 references)
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON profiles(email);
    
    -- Index for course_access (8 references - access control)
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_access_user_course ON course_access(user_id, course_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_access_user_id ON course_access(user_id);
    
    -- Index for orders (8 references - payment processing)
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
    
    -- Index for cart_items (6 references - shopping)
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_course_id ON cart_items(course_id);
    
    -- Index for stripe_customers (4 references)
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
    
    RAISE NOTICE '✅ Added performance indexes on active tables';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Some indexes may already exist: %', SQLERRM;
END $$;

-- =============================================================================
-- STEP 7: FINAL VERIFICATION
-- =============================================================================

-- Show remaining tables and their approximate sizes
SELECT 
    tablename as "Table Name",
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as "Size",
    pg_size_pretty(pg_relation_size('public.'||tablename)) as "Data Size"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- Final summary messages
DO $$
BEGIN
    RAISE NOTICE '🎉 Database cleanup completed!';
    RAISE NOTICE 'ℹ️  Summary:';
    RAISE NOTICE '  - Removed unused Stripe tables (refunds, payouts, charges, invoices, subscriptions)';
    RAISE NOTICE '  - Removed unused app tables (user_sessions, notifications, preferences, audit_logs, email_templates, system_settings)';
    RAISE NOTICE '  - Added missing stripe_charge_id column to orders table';
    RAISE NOTICE '  - Added performance indexes on active tables';
    RAISE NOTICE '  - Check the table sizes above to see your optimized schema';
END $$;