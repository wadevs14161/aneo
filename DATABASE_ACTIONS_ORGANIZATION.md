# Database Actions Organization

This document describes the new organized structure for database actions in the Aneo project.

## New File Structure

```
src/lib/
├── database/
│   ├── utils.ts           # Shared database utilities
│   └── schema.ts          # TypeScript interfaces & documentation
└── actions/
    ├── cart-actions.ts    # Shopping cart operations
    ├── order-actions.ts   # Order processing & payment
    └── course-actions.ts  # Course access & management
```

## File Contents

### `/lib/database/utils.ts`
**Shared utility functions used across all database actions:**
- `getAuthenticatedUser()` - Get current user or throw error
- `ensureUserProfile()` - Verify user profile exists
- `getSupabaseClient()` - Get Supabase client instance
- `checkCourseOwnership()` - Check if user owns a course
- `getCourseById()` - Get course details by ID

### `/lib/database/schema.ts`
**Central location for all TypeScript interfaces and database documentation:**
- All database table interfaces (User, Course, Order, etc.)
- API response types
- Extended types with relations
- Complete database relationships overview
- Business rules documentation

### `/lib/actions/cart-actions.ts`
**Shopping cart operations:**
- `addToCart()` - Add course to user's cart
- `removeFromCart()` - Remove course from cart
- `getCartItems()` - Get all cart items with details
- `clearCart()` - Empty user's cart
- `getCartItemCount()` - Get total items in cart

### `/lib/actions/order-actions.ts`
**Order processing and payment:**
- `createOrder()` - Create order from cart items
- `processPayment()` - Process payment and complete order
- `getOrderDetails()` - Get specific order details
- `getUserOrders()` - Get all user orders
- `cancelOrder()` - Cancel a pending order
- `grantCourseAccessForOrder()` - Internal function for granting access

### `/lib/actions/course-actions.ts`
**Course management and access:**
- `grantCourseAccess()` - Grant access to specific course (admin)
- `checkUserCourseAccess()` - Check if user has access
- `getUserCourses()` - Get all courses user has access to
- `getAllCourses()` - Get all available courses
- `getCourseDetails()` - Get specific course details
- `getUserPurchases()` - Get user's purchase history
- `revokeCourseAccess()` - Remove access (admin)

## Benefits of This Organization

### ✅ **Single Responsibility**
Each file handles one specific domain of functionality.

### ✅ **Reduced Duplication**
Common operations like authentication are centralized in utils.

### ✅ **Better Type Safety**
All interfaces are centrally defined and consistently used.

### ✅ **Easier Maintenance**
Related functions are grouped together, making changes easier.

### ✅ **Scalable Architecture**
Easy to add new domains without bloating existing files.

### ✅ **Clear Dependencies**
Dependencies between modules are explicit and documented.

## Updated Component Imports

Components now import from the appropriate action files:

```typescript
// Cart operations
import { addToCart, removeFromCart } from '@/lib/actions/cart-actions';

// Order operations  
import { createOrder, processPayment } from '@/lib/actions/order-actions';

// Course operations
import { getUserCourses, getCourseDetails } from '@/lib/actions/course-actions';

// Types
import { CartItem, Order, Course } from '@/lib/database/schema';
```

## Database Relationships Overview

The schema file documents all table relationships:

- **users** → profiles, cart_items, orders, course_access, purchases
- **courses** → cart_items, order_items, course_access, purchases  
- **orders** → order_items
- **Business Rules** documented for each relationship

This organization provides a clear overview of all database operations while maintaining clean separation of concerns and good code organization practices.