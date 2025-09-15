import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { 
  logStripeWebhookEvent, 
  storeStripePaymentMethod,
  updatePurchaseWithStripeInfo 
} from '@/lib/actions/stripe-actions';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Replace this endpoint secret with your endpoint's unique secret
// If you are testing with the CLI, find the secret by running 'stripe listen'
// If you are using an endpoint defined with the API or dashboard, look in your webhook settings
// at https://dashboard.stripe.com/webhooks
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize Supabase client for webhook processing
// Webhooks need service role to bypass RLS policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const buf = await buffer(req);
  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, signature, endpointSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, (err as Error).message);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  // Log webhook event using dedicated action
  const logResult = await logStripeWebhookEvent(event);
  if (!logResult.success) {
    console.error('Failed to log webhook event:', logResult.error);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`🎉 PaymentIntent for ${paymentIntent.amount} was successful!`);
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      case 'payment_intent.created':
        const createdPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`💳 PaymentIntent ${createdPaymentIntent.id} was created for ${createdPaymentIntent.amount}.`);
        break;
      case 'charge.succeeded':
        const charge = event.data.object as Stripe.Charge;
        console.log(`💰 Charge ${charge.id} for ${charge.amount} was successful!`);
        break;
      case 'charge.updated':
        const updatedCharge = event.data.object as Stripe.Charge;
        console.log(`🔄 Charge ${updatedCharge.id} was updated.`);
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log(`💳 PaymentMethod ${paymentMethod.id} was attached.`);
        await handlePaymentMethodAttached(paymentMethod);
        break;
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`✅ Checkout session ${session.id} was completed.`);
        break;
      default:
        console.log(`❓ Unhandled event type ${event.type}.`);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    // Log the error but still return 200 to prevent retries
    await logStripeWebhookEvent(event, false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}

// Removed - now using logStripeWebhookEvent from stripe-actions.ts

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    const userId = paymentIntent.metadata?.userId;

    if (!orderId || !userId) {
      console.error('❌ Missing orderId or userId in payment intent metadata');
      return;
    }

    console.log('🔄 Processing successful payment intent:', {
      paymentIntentId: paymentIntent.id,
      orderId,
      userId,
      amount: paymentIntent.amount
    });

    // Update purchases using dedicated action
    const purchaseUpdateResult = await updatePurchaseWithStripeInfo(
      userId,
      orderId,
      paymentIntent.id,
      paymentIntent.latest_charge as string,
      'completed'
    );

    if (!purchaseUpdateResult.success) {
      console.error('❌ Failed to update purchases:', purchaseUpdateResult.error);
    } else {
      console.log('✅ Successfully processed payment intent:', paymentIntent.id);
    }
  } catch (error) {
    console.error('❌ Failed to handle payment intent succeeded:', error);
    throw error; // Re-throw to be caught by the main handler
  }
}

/**
 * Handle payment method attachment
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  try {
    if (!paymentMethod.customer) {
      console.log('⚠️ Payment method has no customer attached');
      return;
    }

    console.log('💳 Processing payment method attachment:', {
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      type: paymentMethod.type
    });

    // Find user by Stripe customer ID  
    const { data: stripeCustomer } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', paymentMethod.customer as string)
      .single();

    if (!stripeCustomer) {
      console.error('❌ Stripe customer not found:', paymentMethod.customer);
      return;
    }

    // Store payment method using dedicated action
    const paymentMethodResult = await storeStripePaymentMethod(
      stripeCustomer.user_id,
      paymentMethod.customer as string,
      paymentMethod
    );

    if (!paymentMethodResult.success) {
      console.error('❌ Failed to store payment method:', paymentMethodResult.error);
    } else {
      console.log('✅ Payment method stored successfully:', paymentMethod.id);
    }
  } catch (error) {
    console.error('❌ Failed to handle payment method attached:', error);
    throw error; // Re-throw to be caught by the main handler
  }
}

// Disable body parsing for webhooks - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};