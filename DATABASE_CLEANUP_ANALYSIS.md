# Database Schema Analysis & Cleanup Recommendations

## 📊 **Currently Used Tables** (Found in Code)

### ✅ **Core Application Tables** (KEEP)
- `profiles` - User profiles and authentication
- `courses` - Course catalog and details
- `course_access` - User access permissions to courses
- `cart_items` - Shopping cart functionality
- `orders` - Order management
- `order_items` - Items within orders
- `purchases` - Purchase history

### ✅ **Stripe Integration Tables** (KEEP)
- `stripe_customers` - Stripe customer records
- `stripe_payment_methods` - Saved payment methods  
- `stripe_webhooks_log` - Webhook event logging

## 🗂️ **Tables in Schema but NOT Found in Code** (CANDIDATES FOR REMOVAL)

Based on your schema image, these tables might be deprecated:

### 🤔 **Potentially Unused Tables:**
- `stripe_refunds` - No references found in code
- `stripe_invoices` - No references found in code  
- `user_sessions` - May be handled by Supabase Auth
- `notifications` - No references found
- `user_preferences` - No references found
- `audit_logs` - No references found
- `email_templates` - No references found
- `system_settings` - No references found

## 🔍 **Detailed Code Usage Analysis**

### **Most Used Tables:**
1. **`profiles`** (12 references) - User management (user-actions.ts, database/utils.ts, testProfiles.ts)
2. **`orders`** (8 references) - Payment processing (stripe-actions.ts, order-actions.ts)
3. **`course_access`** (8 references) - Core access control (course-actions.ts, order-actions.ts, database/utils.ts, profile page)
4. **`cart_items`** (6 references) - Shopping functionality (cart-actions.ts, order-actions.ts)
5. **`courses`** (4 references) - Course catalog (course-actions.ts, order-actions.ts, database/utils.ts)
6. **`purchases`** (4 references) - Purchase tracking (stripe-actions.ts, course-actions.ts)
7. **`stripe_customers`** (4 references) - Stripe integration (stripe-actions.ts, webhook.ts)

### **Moderately Used:**
- `order_items` (1 reference) - Order details
- `stripe_payment_methods` (1 reference) - Payment methods
- `stripe_webhooks_log` (1 reference) - Webhook logging

## 🧹 **Cleanup Recommendations**

### **Phase 1: Safe to Remove** (No code references)
```sql
-- Check these tables for data first, then drop if unused:
DROP TABLE IF EXISTS stripe_refunds;
DROP TABLE IF EXISTS user_sessions; -- If using Supabase Auth
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS system_settings;
```

### **Phase 2: Column Cleanup**
Some tables might have unused columns. Let me check specific tables:

#### **`purchases` table columns:**
Current usage shows these columns are used:
- `user_id`, `course_id`, `amount_paid`, `currency`, `status`
- `stripe_payment_intent_id`, `stripe_charge_id` (Stripe integration)

#### **`orders` table columns:**
Currently used:
- `id`, `user_id`, `total_amount`, `currency`, `status`
- `stripe_payment_intent_id`, `stripe_customer_id`, `stripe_charge_id`

### **Phase 3: Verify Before Deletion**
Before removing any table, run these checks:

```sql
-- Check if tables have any data
SELECT 'stripe_refunds' as table_name, count(*) as row_count FROM stripe_refunds
UNION ALL
SELECT 'user_sessions', count(*) FROM user_sessions  
UNION ALL
SELECT 'notifications', count(*) FROM notifications;

-- Check table dependencies
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('stripe_refunds', 'user_sessions', 'notifications');
```

## 🎯 **Action Plan**

### **Step 1: Verify Usage** 
```bash
# Search your entire codebase for table references
grep -r "stripe_refunds\|user_sessions\|notifications" src/
```

### **Step 2: Check Data**
Log into Supabase Dashboard and check if these "unused" tables have any important data.

### **Step 3: Safe Removal**
Create a backup first, then remove confirmed unused tables.

### **Step 4: Performance Optimization**
After cleanup, consider adding missing indexes on frequently queried columns.

## 💡 **Would you like me to:**
1. Generate the exact DROP statements for specific tables?
2. Check for unused columns in the active tables?
3. Recommend performance indexes for your core tables?
4. Create a migration script for the cleanup?