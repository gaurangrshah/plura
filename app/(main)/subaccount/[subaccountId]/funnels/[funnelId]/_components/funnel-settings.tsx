import { Funnel } from '@prisma/client';

import { FunnelForm } from '@/components/forms/funnel-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import db from '@/lib/db';
import { getConnectAccountProducts } from '@/lib/stripe/actions';

import { FunnelProductsTable } from './funnel-products-table';

interface FunnelSettingsProps {
  subaccountId: string
  defaultData: Funnel
}

export async function FunnelSettings({
  subaccountId,
  defaultData,
}: FunnelSettingsProps) {
  //CHALLENGE: go connect your stripe to sell products

  const subaccountDetails = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
  })

  if (!subaccountDetails) return
  if (!subaccountDetails.connectAccountId) return
  const products = await getConnectAccountProducts(
    subaccountDetails.connectAccountId
  )

  return (
    <div className="flex gap-4 flex-col xl:!flex-row">
      <Card className="flex-1 flex-shrink">
        <CardHeader>
          <CardTitle>Funnel Products</CardTitle>
          <CardDescription>
            Select the products and services you wish to sell on this funnel.
            You can sell one time and recurring products too.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <>
            {subaccountDetails.connectAccountId ? (
              <FunnelProductsTable
                defaultData={defaultData}
                products={products}
              />
            ) : (
              'Connect your stripe account to sell products.'
            )}
          </>
        </CardContent>
      </Card>

      <FunnelForm
        subAccountId={subaccountId}
        defaultData={defaultData}
      />
    </div>
  )
}
