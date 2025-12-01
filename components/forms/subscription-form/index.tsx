'use client'

import { useState } from 'react';

import type { Plan } from '@/lib/types';

import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type SubscriptionFormProps = {
  selectedPriceId: string | Plan
}

export function SubscriptionForm({ selectedPriceId }: SubscriptionFormProps) {
  const { toast } = useToast()
  const elements = useElements()
  const stripeHook = useStripe()
  const [priceError, setPriceError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!selectedPriceId) {
      setPriceError('Please select a subscription plan.')
      return
    }
    setPriceError('')
    event.preventDefault()
    if (!stripeHook || !elements) return

    try {
      // confirm payment triggers the webhook to create a subscription
      const { error } = await stripeHook.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_URL}/agency`,
        },
      })
      if (error) {
        throw new Error()
      }
      toast({
        title: 'Payment successful',
        description: 'Your payment has been successfully processed. ',
      })
    } catch (error) {
      console.log(error)
      toast({
        variant: 'destructive',
        title: 'Payment failed',
        description:
          'We couldn\'t process your payment. Please try a different card',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <small className="text-destructive">{priceError}</small>
      <PaymentElement />
      <Button
        disabled={!stripeHook}
        className="mt-4 w-full"
      >
        Submit
      </Button>
    </form>
  )
}
