'use server'

import { getSupabaseClient } from '@/lib/database/utils';
import { createClient } from '@supabase/supabase-js';
import type { DatabaseActionResult } from '@/lib/database/schema';
import Stripe from 'stripe';

/**
 * Get Supabase client with appropriate permissions for Stripe operations
 * Uses service role key if available for server-side operations, otherwise falls back to regular client
 */
async function getSupabaseForStripe() {
  // For webhook operations, we need service role to bypass RLS
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('🔑 Using Supabase Service Role for Stripe operations');
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  } else {
    console.log('⚠️  Using regular Supabase client (Service Role Key not found)');
    return await getSupabaseClient();
  }
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export interface StripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: any;
  created_at: string;
  updated_at: string;
}

export interface StripePaymentMethod {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  type: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface StripeWebhookLog {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  data: any;
  error_message?: string;
  created_at: string;
}

/**
 * Create or get existing Stripe customer
 */
export async function createStripeCustomer(
  userId: string, 
  email: string, 
  name?: string
): DatabaseActionResult<StripeCustomer> {
  try {
    const supabase = await getSupabaseForStripe();
    
    // Check if customer already exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingCustomer && !fetchError) {
      console.log('🔍 Existing Stripe Customer found:', existingCustomer.stripe_customer_id);
      return { success: true, data: existingCustomer };
    }

    // Create new Stripe customer
    console.log('🆕 Creating new Stripe customer for user:', userId);
    const stripeCustomer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId
      }
    });

    console.log('✅ Stripe customer created:', stripeCustomer.id);

    // Save to database
    const { data: dbCustomer, error: insertError } = await supabase
      .from('stripe_customers')
      .insert({
        user_id: userId,
        stripe_customer_id: stripeCustomer.id,
        email: email,
        name: name
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('💾 Stripe customer saved to database:', dbCustomer.id);
    return { success: true, data: dbCustomer };

  } catch (error) {
    console.error('❌ Error creating Stripe customer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create Stripe customer' 
    };
  }
}

/**
 * Store Stripe payment method
 */
export async function storeStripePaymentMethod(
  userId: string,
  stripeCustomerId: string,
  paymentMethod: Stripe.PaymentMethod
): DatabaseActionResult<StripePaymentMethod> {
  try {
    const supabase = await getSupabaseForStripe();

    console.log('💳 Storing payment method:', paymentMethod.id);

    const { data: dbPaymentMethod, error: insertError } = await supabase
      .from('stripe_payment_methods')
      .upsert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_method_id: paymentMethod.id,
        type: paymentMethod.type,
        card_brand: paymentMethod.card?.brand,
        card_last4: paymentMethod.card?.last4,
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        is_default: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Payment method insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('💾 Payment method saved to database:', dbPaymentMethod.id);
    return { success: true, data: dbPaymentMethod };

  } catch (error) {
    console.error('❌ Error storing payment method:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to store payment method' 
    };
  }
}

/**
 * Log Stripe webhook event
 */
export async function logStripeWebhookEvent(
  event: Stripe.Event,
  processed: boolean = true,
  errorMessage?: string
): DatabaseActionResult<StripeWebhookLog> {
  try {
    const supabase = await getSupabaseForStripe();

    console.log('📝 Logging webhook event:', event.type, event.id);

    const { data: webhookLog, error: insertError } = await supabase
      .from('stripe_webhooks_log')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed: processed,
        data: event.data,
        error_message: errorMessage,
        created_at: new Date(event.created * 1000).toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Webhook log insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('💾 Webhook event logged to database:', webhookLog.id);
    return { success: true, data: webhookLog };

  } catch (error) {
    console.error('❌ Error logging webhook event:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to log webhook event' 
    };
  }
}

/**
 * Update order with Stripe payment information
 */
export async function updateOrderWithStripeInfo(
  orderId: string,
  stripePaymentIntentId: string,
  stripeCustomerId: string,
  stripeChargeId?: string
): DatabaseActionResult<any> {
  try {
    const supabase = await getSupabaseForStripe();

    console.log('🔄 Updating order with Stripe info:', {
      orderId,
      stripePaymentIntentId,
      stripeCustomerId,
      stripeChargeId
    });

    // Try to update with all Stripe fields, but handle missing columns gracefully
    const updateData: any = {
      stripe_payment_intent_id: stripePaymentIntentId,
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString()
    };

    // First, try with stripe_charge_id
    let { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        ...updateData,
        ...(stripeChargeId && { stripe_charge_id: stripeChargeId })
      })
      .eq('id', orderId)
      .select()
      .single();

    // If stripe_charge_id column doesn't exist, try without it
    if (updateError && updateError.message.includes('stripe_charge_id')) {
      console.log('⚠️  stripe_charge_id column missing, updating without it...');
      
      const result = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();
        
      updatedOrder = result.data;
      updateError = result.error;
    }

    if (updateError) {
      console.error('❌ Order update error:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('💾 Order updated with Stripe info:', updatedOrder?.id || 'success');
    return { success: true, data: updatedOrder };

  } catch (error) {
    console.error('❌ Error updating order with Stripe info:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update order' 
    };
  }
}

/**
 * Update purchase records with Stripe information
 */
export async function updatePurchaseWithStripeInfo(
  userId: string,
  orderId: string,
  stripePaymentIntentId: string,
  stripeChargeId?: string,
  status: string = 'completed'
): DatabaseActionResult<any> {
  try {
    const supabase = await getSupabaseForStripe();

    console.log('🔄 Updating purchases with Stripe info:', {
      userId,
      orderId,
      stripePaymentIntentId,
      status
    });

    const updateData: any = {
      stripe_payment_intent_id: stripePaymentIntentId,
      status: status,
      updated_at: new Date().toISOString()
    };

    if (stripeChargeId) {
      updateData.stripe_charge_id = stripeChargeId;
    }

    // Update purchases that match this order (assuming you have a purchase_order mapping)
    const { data: updatedPurchases, error: updateError } = await supabase
      .from('purchases')
      .update(updateData)
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('❌ Purchase update error:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('💾 Purchases updated with Stripe info:', updatedPurchases?.length || 0, 'records');
    return { success: true, data: updatedPurchases };

  } catch (error) {
    console.error('❌ Error updating purchases with Stripe info:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update purchases' 
    };
  }
}