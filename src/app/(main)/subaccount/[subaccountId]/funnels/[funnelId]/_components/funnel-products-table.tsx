'use client'
import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Stripe from 'stripe'
import Image from 'next/image'
import {
  saveActivityLogsNotification,
  updateFunnelProducts,
} from '@/lib/queries'
import { Funnel } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface FunnelProductsTableProps {
  defaultData: Funnel
  products: Stripe.Product[]
}

const FunnelProductsTable: React.FC<FunnelProductsTableProps> = ({
  products,
  defaultData,
}) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [liveProducts, setLiveProducts] = useState<
    { productId: string; recurring: boolean }[] | []
  >(JSON.parse(defaultData.liveProducts || '[]'))

  const handleSaveProducts = async () => {
    setIsLoading(true)
    const response = await updateFunnelProducts(
      JSON.stringify(liveProducts),
      defaultData.id
    )
    await saveActivityLogsNotification({
      agencyId: undefined,
      description: `Update funnel products | ${response.name}`,
      subaccountId: defaultData.subAccountId,
    })
    setIsLoading(false)
    router.refresh()
  }

  const handleAddProduct = async (product: Stripe.Product) => {
    const defaultPrice = product.default_price as Stripe.Price | null

    if (!defaultPrice || !defaultPrice.id) {
      console.error('❌ Product missing default_price:', product)
      return
    }

    const productIdExists = liveProducts.find(
      (prod) => prod.productId === defaultPrice.id
    )

    if (productIdExists) {
      setLiveProducts(
        liveProducts.filter((prod) => prod.productId !== defaultPrice.id)
      )
    } else {
      setLiveProducts([
        ...liveProducts,
        {
          productId: defaultPrice.id,
          recurring: !!defaultPrice.recurring,
        },
      ])
    }
  }

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
          {products.map((product) => {
            const defaultPrice = product.default_price as Stripe.Price | null

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <Input
                    type="checkbox"
                    disabled={!defaultPrice}
                    defaultChecked={
                      !!defaultPrice &&
                      liveProducts.some(
                        (prod) => prod.productId === defaultPrice.id
                      )
                    }
                    onChange={() => handleAddProduct(product)}
                    className="w-4 h-4"
                  />
                </TableCell>
                <TableCell>
                  {product.images[0] ? (
                    <Image
                      alt="product Image"
                      height={60}
                      width={60}
                      src={product.images[0]}
                    />
                  ) : (
                    'No Image'
                  )}
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>
                  {defaultPrice?.recurring ? 'Recurring' : 'One Time'}
                </TableCell>
                <TableCell className="text-right">
                  {defaultPrice
                    ? `$${(defaultPrice.unit_amount || 0) / 100}`
                    : '--'}
                </TableCell>
              </TableRow>
            )
          })}
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

export default FunnelProductsTable
