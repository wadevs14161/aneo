# Stripe Integration Setup Guide

## 1. Install Stripe Dependencies

First, install the required Stripe packages:

```bash
npm install stripe @stripe/stripe-js
npm install --save-dev @types/stripe
```

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Your domain for redirects
NEXT_PUBLIC_DOMAIN=http://localhost:3000
```

## 3. Required API Routes

You'll need to create these API routes:

### `/pages/api/stripe/create-checkout-session.ts`
- Creates Stripe Checkout Session for course purchases
- Handles success/cancel URLs
- Stores session data in database

### `/pages/api/stripe/webhooks.ts`
- Handles Stripe webhook events
- Processes payment confirmations
- Updates database records

### `/pages/api/stripe/create-customer.ts`
- Creates Stripe customers
- Links to your user profiles

## 4. Client-Side Components

You'll need:

### Checkout Button Component
- Redirects to Stripe Checkout
- Handles loading states

### Payment Success Page
- Confirms successful payments
- Grants course access

## 5. Stripe Configuration

In your Stripe Dashboard (test mode):
- Set up webhook endpoints
- Configure checkout settings
- Add your domain to allowed redirect URLs

## Current Status

✅ Database schema is ready
❌ Stripe packages need to be installed
❌ Environment variables need to be configured
❌ API routes need to be created
❌ Client components need to be built

Would you like me to help you implement any of these components?