'use server'
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/database/utils';
import type { Order, OrderWithItems, CartItem, DatabaseActionResult } from '@/lib/database/schema';

/**
 * Create a new order from cart items
 */
export async function createOrder(cartItems: CartItem[]): DatabaseActionResult<Order> {
  try {
    const user = await getAuthenticatedUser();

    if (cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);

    // Create order
    const supabase = await getSupabaseClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        currency: 'gbp',
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      return { success: false, error: orderError.message };
    }

    // Create order items
    const orderItems = cartItems.map((item: CartItem) => ({
      order_id: order.id,
      course_id: item.course_id,
      price: item.price,
      course_title: item.title
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id);
      return { success: false, error: itemsError.message };
    }

    return { success: true, data: order };
    
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create order' };
  }
}

/**
 * Process payment for an order
 */
export async function processPayment(orderId: string): DatabaseActionResult<Order> {
  try {
    const user = await getAuthenticatedUser();

    // Get order with items
    const supabase = await getSupabaseClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          course_id,
          price,
          course_title
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'pending') {
      return { success: false, error: 'Order already processed' };
    }

    // Mock payment processing (always succeeds for now)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment delay

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Grant course access
    const courseIds = order.order_items.map((item: any) => item.course_id);
    const accessResult = await grantCourseAccessForOrder(user.id, courseIds);

    if (!accessResult.success) {
      console.error('Failed to grant access, but payment succeeded');
    }

    // Clear cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .in('course_id', courseIds);

    revalidatePath('/cart');
    revalidatePath('/orders');

    return { success: true, data: order };
    
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment processing failed' };
  }
}

/**
 * Get order details by ID
 */
export async function getOrderDetails(orderId: string): DatabaseActionResult<OrderWithItems> {
  try {
    const user = await getAuthenticatedUser();

    // Get order with items
    const supabase = await getSupabaseClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          course_id,
          price,
          course_title,
          created_at
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Order not found' };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch order details' };
  }
}

/**
 * Get all orders for the current user
 */
export async function getUserOrders(): DatabaseActionResult<OrderWithItems[]> {
  try {
    const user = await getAuthenticatedUser();

    // Get all orders for the user with items
    const supabase = await getSupabaseClient();
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          course_id,
          price,
          course_title,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      return { success: false, error: ordersError.message };
    }

    return { success: true, data: orders || [] };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch orders' };
  }
}

/**
 * Cancel a pending order
 */
export async function cancelOrder(orderId: string): DatabaseActionResult {
  try {
    const user = await getAuthenticatedUser();

    const supabase = await getSupabaseClient();
    
    // First check if order belongs to user and is pending
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'pending') {
      return { success: false, error: 'Only pending orders can be cancelled' };
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/orders');
    return { success: true };
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel order' };
  }
}

/**
 * Grant course access for completed orders
 * Internal function used by processPayment
 */
async function grantCourseAccessForOrder(userId: string, courseIds: string[]): DatabaseActionResult {
  try {
    const supabase = await getSupabaseClient();

    // Create access records
    const accessRecords = courseIds.map((courseId: string) => ({
      user_id: userId,
      course_id: courseId,
      access_type: 'purchased'
    }));

    const { error: accessError } = await supabase
      .from('course_access')
      .insert(accessRecords);

    if (accessError) {
      console.error('Error granting access:', accessError);
      return { success: false, error: accessError.message };
    }

    // Also create purchase records for completeness
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, price, title')
      .in('id', courseIds);

    if (!coursesError && courses) {
      const purchaseRecords = courses.map((course: any) => ({
        user_id: userId,
        course_id: course.id,
        amount_paid: course.price,
        currency: 'gbp',
        status: 'completed'
      }));

      await supabase
        .from('purchases')
        .insert(purchaseRecords);
    }

    return { success: true };
    
  } catch (error) {
    console.error('Error granting course access:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to grant access' };
  }
}