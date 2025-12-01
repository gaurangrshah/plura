import { NextResponse } from 'next/server';

import { stripe } from '@/lib/stripe';
import { StripeCustomerType } from '@/lib/types';

export async function POST(req: Request) {
  const { address, email, name, shipping }: StripeCustomerType =
    await req.json();

  if (!email || !address || !name || !shipping) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Missing data', { email, address, name, shipping });
    }
    return new NextResponse('Missing data', {
      status: 400,
    });
  }

  // If Stripe is not configured (stub key), return a mock customer ID
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  if (stripeKey.includes('stub') || !stripeKey.startsWith('sk_')) {
    console.log('Stripe not configured, using mock customer ID');
    return Response.json({ customerId: `mock_cus_${Date.now()}` });
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      address,
      shipping,
    });
    return Response.json({ customerId: customer.id });
  } catch (error) {
    console.log('🔴 Error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
