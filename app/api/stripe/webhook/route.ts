import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import { subscriptionCreated } from '@/lib/stripe/actions';

const stripeWebhookEvents = new Set([
  'product.created',
  'product.updated',
  'price.created',
  'price.updated',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

/**
 * This webhook gets called when a subscription is created or updated see events Set above.
 * This only handles payments in production for the agency subscriptions.
 * It does not handle payments for the connected accounts.
 * @TODO: Add a webhook endpoint for handling payments for connected accounts.
 */

export async function POST(req: NextRequest) {
  let stripeEvent: Stripe.Event;
  const body = await req.text();
  const sig = headers().get('Stripe-Signature');

  // Verify the signature
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET_LIVE ?? process.env.STRIPE_WEBHOOK_SECRET;
  try {
    if (!sig || !webhookSecret) {
      console.log(
        '🔴 Error Stripe webhook secret or the signature does not exist.'
      );
      return new NextResponse('Webhook secret or signature missing', { status: 400 });
    }
    // get the stripe event
    stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error: any) {
    console.log(`🔴 Error ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    // Validate and Handle the event
    if (stripeWebhookEvents.has(stripeEvent.type)) {
      const subscription = stripeEvent.data.object as Stripe.Subscription;
      if (
        !subscription.metadata.connectAccountPayments &&
        !subscription.metadata.connectAccountSubscriptions
      ) {
        // if the subscription is not for a connected account
        switch (stripeEvent.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            if (subscription.status === 'active') {
              // persist subscription in db if it is active
              await subscriptionCreated(
                subscription,
                subscription.customer as string
              );
              console.log('CREATED FROM WEBHOOK 💳', subscription);
            } else {
              console.log(
                'SKIPPED AT CREATED FROM WEBHOOK 💳 because subscription status is not active',
                subscription
              );
              break;
            }
          }
          default:
            console.log('👉🏻 Unhandled relevant event!', stripeEvent.type);
        }
      } else {
        console.log(
          'SKIPPED FROM WEBHOOK 💳 because subscription was from a connected account not for the application',
          subscription
        );
      }
    }
  } catch (error) {
    console.log(error);
    return new NextResponse('🔴 Webhook Error', { status: 400 });
  }
  return NextResponse.json(
    {
      webhookActionReceived: true,
    },
    {
      status: 200,
    }
  );
}
