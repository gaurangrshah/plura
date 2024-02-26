import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const {
    subAccountConnectAccId,
    prices,
    subaccountId,
  }: {
    subAccountConnectAccId: string;
    prices: { recurring: boolean; productId: string }[];
    subaccountId: string;
  } = await req.json();

  const origin = req.headers.get('origin');
  if (!subAccountConnectAccId || !prices.length)
    return new NextResponse('Stripe Account Id or price id is missing', {
      status: 400,
    });
  if (
    !process.env.NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_PERCENT ||
    !process.env.NEXT_PUBLIC_PLATFORM_ONETIME_FEE ||
    !process.env.NEXT_PUBLIC_PLATFORM_AGENT_PERCENT
  ) {
    console.log("VALUES DON'T EXIST");
    return NextResponse.json({ error: 'Fees do not exist' });
  }

  // Not needed unless we want to send payments to this account.
  //CHALLENGE Transfer money to a connected
  // const agencyIdConnectedAccountId = await db.subAccount.findUnique({
  //   where: { id: subaccountId },
  //   include: { Agency: true },
  // })

  const subscriptionPriceExists = prices.find((price) => price.recurring);
  // if (!agencyIdConnectedAccountId?.Agency.connectAccountId) {
  //   console.log('Agency is not connected')
  //   return NextResponse.json({ error: 'Agency account is not connected' })
  // }

  try {
    // stripe embedded checkout
    const session = await stripe.checkout.sessions.create(
      {
        // all one-time payment products
        line_items: prices.map((price) => ({
          price: price.productId,
          quantity: 1,
        })),

        // all subscription (repeating charges) products
        ...(subscriptionPriceExists && {
          subscription_data: {
            // metadata is used to identify the connected account
            // and configured to send payments to the connected account
            metadata: { connectAccountSubscriptions: 'true' },
            application_fee_percent: Number(
              process.env.NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_PERCENT
            ),
          },
        }),

        ...(!subscriptionPriceExists && {
          payment_intent_data: {
            metadata: { connectAccountPayments: 'true' },
            application_fee_amount:
              Number(process.env.NEXT_PUBLIC_PLATFORM_ONETIME_FEE) * 100,
          },
        }),

        mode: subscriptionPriceExists ? 'subscription' : 'payment', // set mode based on the product type
        ui_mode: 'embedded',
        // we will handle the redirect for the embedded checkout
        redirect_on_completion: 'never',
      },
      { stripeAccount: subAccountConnectAccId }
    );

    return NextResponse.json(
      {
        clientSecret: session.client_secret,
      },
      {
        headers: {
          // allow the origin to access the response
          // allows this endpoint to be called publicly from any origin
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.log('🔴 Error', error);
    //@ts-ignore
    return NextResponse.json({ error: error.message });
  }
}

// This is needed to allow the frontend to access the response
// this avoids any CORS issues
export async function OPTIONS(request: Request) {
  const allowedOrigin = request.headers.get('origin');
  const response = new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
      'Access-Control-Max-Age': '86400',
    },
  });

  return response;
}
