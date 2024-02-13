import { NextResponse } from 'next/server';

import db from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const { customerId, priceId } = await req.json();
  if (!customerId || !priceId) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'customerId or priceId is missing from request body::',
        customerId,
        'priceId:',
        priceId
      );
    }
    return new NextResponse('Customer Id or price id is missing', {
      status: 400,
    });
  }

  const subscriptionExists = await db.agency.findFirst({
    where: { customerId },
    include: { Subscription: true },
  });
  console.log('🚀 | subscriptionExists:', subscriptionExists);

  try {
    if (
      // subscription exists and is active
      subscriptionExists?.Subscription?.subscriptionId &&
      subscriptionExists.Subscription.active
    ) {
      //update the subscription instead of creating one.
      console.log('Updating the subscription');

      // get the current subscription details
      const currentSubscriptionDetails = await stripe.subscriptions.retrieve(
        subscriptionExists.Subscription.subscriptionId
      );

      // update the subscription with the new price and remove the old one while keeping the same subscription id and ensure we return the latest invoice payment intent and client secret
      const subscription = await stripe.subscriptions.update(
        subscriptionExists.Subscription.subscriptionId,
        {
          items: [
            {
              id: currentSubscriptionDetails.items.data[0].id,
              deleted: true,
            },
            { price: priceId }, // represents the subscription plan they've chosen
          ],
          expand: ['latest_invoice.payment_intent'],
        }
      );
      return NextResponse.json({
        subscriptionId: subscription.id,
        //@ts-ignore
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });
    } else {
      // Create a new subscription when no active subscriptions exist
      console.log('Creating a new subscription');
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId, // represents the subscription plan they've chosen
          },
        ],
        payment_behavior: 'default_incomplete', // allows user to add a payment method
        payment_settings: { save_default_payment_method: 'on_subscription' }, // save payment prefs
        expand: ['latest_invoice.payment_intent'],
      });
      console.log('🚀 | subscription:', subscription);
      return NextResponse.json({
        subscriptionId: subscription.id,
        //@ts-ignore
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });
    }
  } catch (error) {
    console.log('🔴 Error', error);
    return new NextResponse('Internal Server Error', {
      status: 500,
    });
  }
}
