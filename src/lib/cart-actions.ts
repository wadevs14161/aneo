'use server'
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CartItem {
  id: string;
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
  status: string;
  payment_method: string;
  created_at: string;
  completed_at?: string;
}

export async function addToCart(courseId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return { success: false, error: 'Course not found' };
    }

    // Check if user already owns this course
    const { data: access, error: accessError } = await supabase
      .from('course_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (access) {
      return { success: false, error: 'You already own this course' };
    }

    // Add to cart
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
    return { success: false, error: 'Failed to add to cart' };
  }
}

export async function removeFromCart(courseId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

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
    return { success: false, error: 'Failed to remove from cart' };
  }
}

export async function getCartItems(userId?: string): Promise<CartItem[]> {
  try {
    const supabase = await createClient();
    
    let currentUserId = userId;
    
    if (!currentUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return [];
      }
      currentUserId = user.id;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        course_id,
        added_at,
        courses (
          title,
          price,
          thumbnail_url,
          instructor_name
        )
      `)
      .eq('user_id', currentUserId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      course_id: item.course_id,
      title: Array.isArray(item.courses) ? item.courses[0]?.title : item.courses?.title,
      price: Array.isArray(item.courses) ? item.courses[0]?.price : item.courses?.price,
      thumbnail_url: Array.isArray(item.courses) ? item.courses[0]?.thumbnail_url : item.courses?.thumbnail_url,
      instructor_name: Array.isArray(item.courses) ? item.courses[0]?.instructor_name : item.courses?.instructor_name,
      added_at: item.added_at
    }));
    
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
}

export async function createOrder(cartItems: CartItem[]) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
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
    return { success: false, error: 'Failed to create order' };
  }
}

export async function processPayment(orderId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get order with items
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
    const accessResult = await grantCourseAccess(user.id, courseIds);

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
    return { success: false, error: 'Payment processing failed' };
  }
}

export async function grantCourseAccess(userId: string, courseIds: string[]) {
  try {
    const supabase = await createClient();

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
        status: 'completed'
      }));

      await supabase
        .from('purchases')
        .insert(purchaseRecords);
    }

    return { success: true };
    
  } catch (error) {
    console.error('Error granting course access:', error);
    return { success: false, error: 'Failed to grant access' };
  }
}

export async function clearCart() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

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
    return { success: false, error: 'Failed to clear cart' };
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get order with items
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

    return { success: true, data: order };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return { success: false, error: 'Failed to fetch order details' };
  }
}

export async function getUserOrders() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get all orders for the user with items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          course_id,
          price,
          course_title
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
    return { success: false, error: 'Failed to fetch orders' };
  }
}