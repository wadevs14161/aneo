# Getting Your Supabase Service Role Key

## Why You Need It
The **Service Role Key** is required for:
- ✅ Stripe webhook processing (bypasses Row Level Security)
- ✅ Server-side database operations 
- ✅ Creating Stripe customer records
- ✅ Logging webhook events

## How to Get It

### Option 1: Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `dwopsdsnigioybevgmnd`
3. Go to **Settings** > **API**
4. Look for **"Project API keys"** section
5. Copy the **`service_role`** key (starts with `eyJ...`)

### Option 2: Already Have It? (Check)
Sometimes the service role key is the same format as your anon key but with `"role":"service_role"`.

If you decode your current anon key:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3b3BzZHNuaWdpb3liZXZnbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1ODI2NDgsImV4cCI6MjA3MzE1ODY0OH0.58aN1wscfgQffnTm2ITfzMbzvdwLOfQj46lsKDoCuF8
```

It decodes to: `{"role":"anon"}` - so you need the service_role version.

## Add to .env.local
Once you have it, replace this line in `.env.local`:
```bash
# Replace this placeholder:
SUPABASE_SERVICE_ROLE_KEY=ADD_YOUR_SERVICE_ROLE_KEY_HERE

# With your actual key:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3b3BzZHNuaWdpb3liZXZnbW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU4MjY0OCwiZXhwIjoyMDczMTU4NjQ4fQ.YOUR_SIGNATURE_HERE
```

## Test It Works
After adding the service role key:

1. Restart your dev server:
```bash
npm run dev
```

2. Process a payment and look for these logs:
```
🔑 Using Supabase Service Role for Stripe operations
🔄 Creating/getting Stripe customer for user: 779bc442...
✅ Stripe customer ready: cus_...
💾 Stripe customer saved to database: 1
```

3. Check your Supabase dashboard - you should see records in:
   - `stripe_customers` table
   - `stripe_webhooks_log` table
   - `orders` table (with `stripe_payment_intent_id`)

## Fallback Behavior
If you don't add the service role key, the code will:
- ⚠️  Use the regular client (with user authentication)
- ⚠️  Show warning: "Using regular Supabase client (Service Role Key not found)"
- ❌ Webhook processing may fail due to RLS policies

## Security Note
🔒 **Never expose the Service Role Key to client-side code!**
- ✅ Server-side only (API routes, webhooks)
- ✅ Environment variables only
- ❌ Never in frontend components
- ❌ Never commit to version control