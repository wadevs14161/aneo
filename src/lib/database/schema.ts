/**
 * Database Schema Types and Interfaces
 * Central location for all database-related TypeScript types
 */

// ========================================
// Core Entity Interfaces
// ========================================

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string;
  video_url?: string;
  instructor_name: string;
  instructor_id?: string;
  duration?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  price: number;
  thumbnail_url: string;
  instructor_name: string;
  added_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  payment_method?: string;
  created_at: string;
  completed_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  course_id: string;
  price: number;
  course_title: string;
  created_at: string;
}

export interface CourseAccess {
  id: string;
  user_id: string;
  course_id: string;
  access_type: 'purchased' | 'gifted' | 'admin_granted';
  granted_at: string;
  expires_at?: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  course_id: string;
  amount_paid: number;
  currency: string;
  status: 'completed' | 'refunded' | 'cancelled';
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  updated_at?: string;
}

// ========================================
// Response Types
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ========================================
// Extended Types with Relations
// ========================================

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface CartItemDetailed extends CartItem {
  course: Course;
}

// ========================================
// Database Table Relationships Overview
// ========================================

/**
 * TABLE RELATIONSHIPS:
 * 
 * users (Supabase Auth)
 * ├── profiles (1:1) - User profile information
 * ├── cart_items (1:N) - User's shopping cart
 * ├── orders (1:N) - User's order history
 * ├── course_access (1:N) - Courses user has access to
 * └── purchases (1:N) - User's purchase history
 * 
 * courses
 * ├── cart_items (1:N) - Which carts contain this course
 * ├── order_items (1:N) - Which orders contain this course
 * ├── course_access (1:N) - Which users have access
 * └── purchases (1:N) - Purchase records for this course
 * 
 * orders
 * └── order_items (1:N) - Items in the order
 * 
 * BUSINESS RULES:
 * - Users can only add courses to cart if they don't already own them
 * - Course access is granted when payment is completed
 * - Cart is cleared after successful purchase
 * - Orders track the complete purchase transaction
 * - Purchases provide detailed payment history
 */

// ========================================
// Database Actions Return Types
// ========================================

export type DatabaseActionResult<T = any> = Promise<ApiResponse<T>>;