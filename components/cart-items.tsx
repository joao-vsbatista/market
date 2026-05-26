'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Trash2, ShoppingCart, Loader2, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'

interface CartItemsProps {
  items: any[]
  total: number
  userId: string
}

export function CartItems({ items, total, userId }: CartItemsProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const router = useRouter()

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      toast.success('Item removido do carrinho')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao remover item')
    } finally {
      setRemovingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Carrinho vazio</h3>
        <p className="mt-2 text-sm text-muted-foreground">Adicione produtos da área de vendas</p>
        <Button asChild className="mt-4">
          <Link href="/vendas">Ver produtos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Lista de itens */}
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => {
          const primaryImage = item.product?.images?.find((img: any) => img.is_primary) || item.product?.images?.[0]
          return (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={item.product?.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/vendas/${item.product_id}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                        {item.product?.title}
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                      >
                        {removingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(item.product?.min_price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Resumo */}
      <div>
        <Card className="sticky top-24">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Resumo do pedido</h2>
            <Separator />
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">{item.product?.title}</span>
                  <span className="shrink-0">{formatCurrency(item.product?.min_price)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>

            {/* ✅ ALTERAÇÃO: botão agora redireciona para o checkout */}
            <Button asChild className="w-full" size="lg">
              <Link href="/checkout">Ir para o Checkout</Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/vendas">Continuar comprando</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}