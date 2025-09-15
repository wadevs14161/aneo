'use server'
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser, ensureUserProfile, checkCourseOwnership, getCourseById, getSupabaseClient } from '@/lib/database/utils';
import type { CartItem, DatabaseActionResult } from '@/lib/database/schema';

/**
 * Add a course to the user's cart
 */
export async function addToCart(courseId: string): DatabaseActionResult<CartItem> {
  try {
    const user = await getAuthenticatedUser();
    await ensureUserProfile(user.id);
    
    // Check if course exists
    const course = await getCourseById(courseId);

    // Check if user already owns this course
    const ownsAlready = await checkCourseOwnership(user.id, courseId);
    if (ownsAlready) {
      return { success: false, error: 'You already own this course' };
    }

    // Add to cart
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        course_id: courseId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Course already in cart' };
      }
      return { success: false, error: error.message };
    }

    revalidatePath('/cart');
    return { success: true, data };
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add to cart' };
  }
}

/**
 * Remove a course from the user's cart
 */
export async function removeFromCart(courseId: string): DatabaseActionResult {
  try {
    const user = await getAuthenticatedUser();
    
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', courseId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/cart');
    return { success: true };
    
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to remove from cart' };
  }
}

/**
 * Get all items in the user's cart with course details
 */
export async function getCartItems(): DatabaseActionResult<CartItem[]> {
  try {
    const user = await getAuthenticatedUser();
    
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        courses (
          id,
          title,
          price,
          thumbnail_url,
          instructor_name
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Transform the data to match CartItem interface
    const cartItems: CartItem[] = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      course_id: item.course_id,
      title: item.courses.title,
      price: item.courses.price,
      thumbnail_url: item.courses.thumbnail_url,
      instructor_name: item.courses.instructor_name,
      added_at: item.created_at
    }));

    return { success: true, data: cartItems };
    
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch cart items' };
  }
}

/**
 * Clear all items from the user's cart
 */
export async function clearCart(): DatabaseActionResult {
  try {
    const user = await getAuthenticatedUser();
    
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/cart');
    return { success: true };
    
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to clear cart' };
  }
}

/**
 * Get the total number of items in the user's cart
 */
export async function getCartItemCount(): DatabaseActionResult<number> {
  try {
    const user = await getAuthenticatedUser();
    
    const supabase = await getSupabaseClient();
    const { count, error } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: count || 0 };
    
  } catch (error) {
    console.error('Error getting cart count:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get cart count' };
  }
}