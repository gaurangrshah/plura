'use client'
import {
  useEffect,
  useState,
} from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Funnel } from '@prisma/client';

import Stripe from 'stripe';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  saveActivityLogsNotification,
  updateFunnelProducts,
} from '@/lib/queries';

import { toast } from 'sonner';

interface FunnelProductsTableProps {
  defaultData: Funnel
  products: Stripe.Product[]
}

export function FunnelProductsTable({
  products,
  defaultData,
}: FunnelProductsTableProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // a collection of products that are live on the funnel
  const [liveProducts, setLiveProducts] = useState<
    { productId: string; recurring: boolean }[] | []
  >(JSON.parse(defaultData.liveProducts || '[]'))

  /**
   * Handles the saving of products to the funnel.
   *
   * @returns {Promise<void>} A promise that resolves when the products are saved.
   */
  const handleSaveProducts = async () => {
    setIsLoading(true)
    // save the products to the funnel
    const response = await updateFunnelProducts(
      JSON.stringify(liveProducts),
      defaultData.id
    )

    if (response) {
      toast.success('Products saved successfully')
    } else {
      toast.error('Failed to save products')
    }
    await saveActivityLogsNotification({
      agencyId: undefined,
      description: `Update funnel products | ${response.name}`,
      subaccountId: defaultData.subAccountId,
    })
    setIsLoading(false)
    router.refresh()
  }

  /**
   * Handles the addition of a product to the live products list.
   *
   * @param product - The product to be added.
   */
  const handleAddProduct = async (product: Stripe.Product) => {
    const productIdExists = liveProducts.find(
      //@ts-ignore
      (prod) => prod.productId === product.default_price.id
    )

    productIdExists
      ? setLiveProducts(
        liveProducts.filter(
          (prod) =>
            prod.productId !==
            //@ts-ignore
            product.default_price?.id
        )
      )
      : //@ts-ignore
      setLiveProducts([
        ...liveProducts,
        {
          //@ts-ignore
          productId: product.default_price.id as string,
          //@ts-ignore
          recurring: !!product.default_price.recurring,
        },
      ])
  }

  useEffect(() => console.log(liveProducts), [liveProducts])
  return (
    <>
      <Table className="bg-card border-[1px] border-border rounded-md">
        <TableHeader className="rounded-md">
          <TableRow>
            <TableHead>Live</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Interval</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium truncate">
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Input
                  defaultChecked={
                    !!liveProducts.find(
                      //@ts-ignore
                      (prod) => prod.productId === product.default_price.id
                    )
                  }
                  onChange={() => handleAddProduct(product)}
                  type="checkbox"
                  className="w-4 h-4 border border-red-500"
                />
              </TableCell>
              <TableCell>
                <Image
                  alt="product Image"
                  height={60}
                  width={60}
                  src={product.images[0]}
                />
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                {
                  //@ts-ignore
                  product.default_price?.recurring ? 'Recurring' : 'One Time'
                }
              </TableCell>
              <TableCell className="text-right">
                $
                {
                  //@ts-ignore
                  product.default_price?.unit_amount / 100
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        disabled={isLoading}
        onClick={handleSaveProducts}
        className="mt-4"
      >
        Save Products
      </Button>
    </>
  )
}
