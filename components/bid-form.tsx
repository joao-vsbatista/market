'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Gavel, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

interface BidFormProps {
  productId: string
  minPrice: number
  sellerId: string
  isAuthenticated: boolean
  userId?: string
}

export function BidForm({ productId, minPrice, sellerId, isAuthenticated, userId }: BidFormProps) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const isOwnProduct = userId === sellerId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const bidAmount = parseFloat(amount)
    
    if (isNaN(bidAmount) || bidAmount <= 0) {
      toast.error('Digite um valor válido para o lance')
      return
    }

    if (bidAmount < minPrice) {
      toast.error(`O lance mínimo é ${formatCurrency(minPrice)}`)
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error } = await supabase.from('bids').insert({
        product_id: productId,
        bidder_id: user.id,
        amount: bidAmount,
        message: message || null,
      })

      if (error) throw error

      toast.success('Lance enviado com sucesso!')
      setAmount('')
      setMessage('')
      router.refresh()
    } catch (error) {
      console.error('Error submitting bid:', error)
      toast.error('Erro ao enviar lance. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isOwnProduct) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          Fazer um Lance
        </CardTitle>
        <CardDescription>
          Preço mínimo: {formatCurrency(minPrice)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Seu lance (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={minPrice}
                placeholder={minPrice.toFixed(2)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="message">Mensagem (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Inclua uma mensagem para o vendedor..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
            
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Gavel className="mr-2 h-4 w-4" />
                  Enviar Lance
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Faça login para enviar um lance
            </p>
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Entrar para dar lance
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
