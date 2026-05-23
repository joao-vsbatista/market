'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AddToCartButtonProps {
  productId: string
  userId?: string
}

export function AddToCartButton({ productId, userId }: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAddToCart = async () => {
    if (!userId) {
      router.push('/auth/login')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: userId,
          product_id: productId,
          quantity: 1,
        })

      if (error) throw error

      toast.success('Produto adicionado ao carrinho!')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao adicionar ao carrinho.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleAddToCart} disabled={isLoading} className="w-full" size="lg">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adicionando...
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Adicionar ao Carrinho
        </>
      )}
    </Button>
  )
}