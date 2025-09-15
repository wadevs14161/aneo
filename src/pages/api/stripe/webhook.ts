import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Replace this endpoint secret with your endpoint's unique secret
// If you are testing with the CLI, find the secret by running 'stripe listen'
// If you are using an endpoint defined with the API or dashboard, look in your webhook settings
// at https://dashboard.stripe.com/webhooks
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // await handlePaymentIntentSucceeded(paymentIntent);
      break;
    case 'payment_intent.created':
      const createdPaymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${createdPaymentIntent.id} was created for ${createdPaymentIntent.amount}.`);
      // Handle payment intent creation
      break;
    case 'charge.succeeded':
      const charge = event.data.object as Stripe.Charge;
      console.log(`Charge ${charge.id} for ${charge.amount} was successful!`);
      // Handle successful charge
      break;
    case 'charge.updated':
      const updatedCharge = event.data.object as Stripe.Charge;
      console.log(`Charge ${updatedCharge.id} was updated.`);
      // Handle charge updates
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      console.log(`PaymentMethod ${paymentMethod.id} was attached.`);
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // await handlePaymentMethodAttached(paymentMethod);
      break;
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Checkout session ${session.id} was completed.`);
      // Handle successful checkout session
      // await handleCheckoutSessionCompleted(session);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}

// Disable body parsing for webhooks - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};