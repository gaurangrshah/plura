import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  addOnProducts,
  pricingCards,
} from '@/lib/constants';
import db from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { cn } from '@/lib/utils';

import { PricingCard } from './_components/pricing-card';
import { SubscriptionHelper } from './_components/subscription-helper';

type AgencyBillingPageProps = {
  params: { agencyId: string }
}

export default async function AgencyBillingPage({ params }: AgencyBillingPageProps) {
  // challenge: Create the add on products
  const addOns = await stripe.products.list({
    ids: addOnProducts.map((product) => product.id),
    expand: ['data.default_price'],
  })

  const agencySubscription = await db.agency.findUnique({
    where: {
      id: params.agencyId,
    },
    select: {
      customerId: true,
      Subscription: true,
    },
  })

  const prices = await stripe.prices.list({
    product: process.env.NEXT_PUBLIC_PRODUCT_ID || "",
    // includes only active products
    active: true,
  })

  const currentPlanDetails = pricingCards.find(
    (c) => c.priceId === agencySubscription?.Subscription?.priceId
  )


  // customer specific charges
  const defaultCharges = { data: [] };
  const charges = await stripe.charges.list({
    limit: 50,
    customer: agencySubscription?.customerId,
  });

  const refunds = await stripe.refunds.list({ limit: 50 })

  const allTransactionsSorted = [...charges.data, ...refunds.data].sort((a, b) => b.created - a.created)

  const allTransactions = allTransactionsSorted.map((transaction) => ({
    description: transaction.description ?? transaction.object,
    id: transaction.id,
    date: `${new Date(transaction.created * 1000).toLocaleTimeString()} ${new Date(
      transaction.created * 1000
    ).toLocaleDateString()}`,
    status: transaction.object === 'charge' ? 'Paid' : 'Refunded',
    amount: `$${transaction.amount / 100}`,
  }));


  return (
    <>
      <SubscriptionHelper
        prices={prices.data}
        customerId={agencySubscription?.customerId || ''}
        planExists={agencySubscription?.Subscription?.active === true}
      />
      <h1 className="text-4xl p-4">Billing</h1>
      <Separator className=" mb-6" />
      <h2 className="text-2xl p-4">Current Plan</h2>
      <div className="flex flex-col lg:!flex-row justify-between gap-8">
        <PricingCard
          planExists={agencySubscription?.Subscription?.active === true}
          prices={prices.data}
          customerId={agencySubscription?.customerId || ''}
          amt={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.price || '$0'
              : '$0'
          }
          buttonCta={
            agencySubscription?.Subscription?.active === true
              ? 'Change Plan'
              : 'Get Started'
          }
          highlightDescription="Want to modify your plan? You can do this here. If you have
          further question contact support@plura-app.com"
          highlightTitle="Plan Options"
          description={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.description || 'Lets get started'
              : 'Lets get started! Pick a plan that works best for you.'
          }
          duration="/ month"
          features={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.features || []
              : currentPlanDetails?.features ||
              pricingCards.find((pricing) => pricing.title === 'Starter')
                ?.features ||
              []
          }
          title={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.title || 'Starter'
              : 'Starter'
          }
        />
        {addOns.data.map((addOn) => (
          <PricingCard
            planExists={agencySubscription?.Subscription?.active === true}
            prices={prices.data}
            customerId={agencySubscription?.customerId || ''}
            key={addOn.id}
            amt={
              //@ts-ignore
              addOn.default_price?.unit_amount
                ? //@ts-ignore
                `$${addOn.default_price.unit_amount / 100}`
                : '$0'
            }
            buttonCta="Subscribe"
            description="Dedicated support line & teams channel for support"
            duration="/ month"
            features={[]}
            title={'24/7 priority support'}
            highlightTitle="Get support now!"
            highlightDescription="Get priority support and skip the long long with the click of a button."
          />
        ))}
      </div>
      <h2 className="text-2xl p-4">Payment History</h2>
      <Table className="bg-card border-[1px] border-border rounded-md">
        <TableHeader className="rounded-md">
          <TableRow>
            <TableHead className="w-[200px]">Description</TableHead>
            <TableHead className="w-[200px]">Invoice Id</TableHead>
            <TableHead className="w-[300px]">Date</TableHead>
            <TableHead className="w-[200px]">Paid</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium truncate">
          {allTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.description}</TableCell>
              <TableCell className="text-muted-foreground">
                {transaction.id}
              </TableCell>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>
                <p
                  className={cn('', transaction.status.toLowerCase() === 'paid' && 'text-emerald-500', transaction.status.toLowerCase() === 'pending' && 'text-orange-600', transaction.status.toLowerCase() === 'failed' && 'text-red-600', transaction.status.toLowerCase() === 'refunded' && "text-gray-300")}
                >
                  {transaction.status.toUpperCase()}
                </p>
              </TableCell>
              <TableCell className="text-right">{transaction.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
