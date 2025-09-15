# Stripe URL Configuration Fix

## Problem
The Stripe payment processing was failing with error:
```
Invalid URL: An explicit scheme (such as https) must be provided
```

This occurred because the `return_url` parameter in `stripe.paymentIntents.confirm()` was constructed using `process.env.NEXT_PUBLIC_BASE_URL` which was either:
1. **Undefined** - resulting in `undefined/order/success`
2. **Missing protocol** - like `example.com/order/success` instead of `https://example.com/order/success`

## Solution
Created a robust URL utility system that:

### 1. **URL Utility Functions** (`/src/lib/utils/url.ts`)
- `getBaseURL()` - Intelligently determines base URL from environment
- `buildAbsoluteURL(path)` - Constructs valid absolute URLs with proper schemes
- `isValidAbsoluteURL(url)` - Validates URL format

### 2. **Smart Fallback Logic**
- **Production**: Uses `NEXT_PUBLIC_BASE_URL` or Vercel environment variables
- **Development**: Falls back to `http://localhost:3000`
- **Auto-scheme**: Adds `https://` in production, `http://` in development if missing

### 3. **Runtime Validation**
- Validates URLs before sending to Stripe
- Logs helpful debugging information in development
- Throws descriptive errors if URL generation fails

## Environment Variable Setup

### Required (Production)
```bash
# Set this in your production environment (.env.production or deployment platform)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Optional (Automatic Detection)
The utility will automatically detect these Vercel environment variables:
- `VERCEL_PROJECT_PRODUCTION_URL`
- `VERCEL_URL`
- `VERCEL_ENV`

### Development
No configuration needed - automatically uses `http://localhost:3000` (or custom PORT)

## Examples

### ✅ Valid Configurations
```bash
# Full URL with protocol (recommended)
NEXT_PUBLIC_BASE_URL=https://myapp.vercel.app

# Domain only (will auto-add https:// in production)
NEXT_PUBLIC_BASE_URL=myapp.vercel.app

# Custom port in development
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### ❌ What Caused the Error
```bash
# Missing or undefined
NEXT_PUBLIC_BASE_URL=

# Relative path (not absolute)
NEXT_PUBLIC_BASE_URL=/some/path
```

## Usage in Code

```typescript
import { buildAbsoluteURL } from '@/lib/utils/url';

// ✅ Always produces valid absolute URLs
const successUrl = buildAbsoluteURL('/order/success');
const cancelUrl = buildAbsoluteURL('/order/cancel');

// Results:
// Development: http://localhost:3000/order/success
// Production: https://yourdomain.com/order/success
```

## Testing the Fix

### 1. **Local Development**
```bash
# Should work without any environment variables
npm run dev
# Try processing a payment - should use http://localhost:3000/order/success
```

### 2. **Production Environment**
```bash
# Set your domain
export NEXT_PUBLIC_BASE_URL=https://yourdomain.com
npm run build && npm start
```

### 3. **Verify in Logs**
In development, you'll see:
```
🔗 Using return_url: http://localhost:3000/order/success
```

## Files Changed
- ✅ `/src/lib/utils/url.ts` - New URL utility functions
- ✅ `/src/lib/actions/order-actions.ts` - Updated to use safe URL construction

## Next Steps
Consider applying this pattern to other parts of the app that construct URLs:
- Email templates with callback URLs
- OAuth redirect URIs  
- Webhook endpoints
- API callback URLs