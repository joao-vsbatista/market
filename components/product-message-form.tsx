'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ProductMessageFormProps {
  productId: string
  sellerId: string
  userId?: string
}

export function ProductMessageForm({ productId, sellerId, userId }: ProductMessageFormProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Falar com o vendedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Faça login para enviar uma mensagem ao vendedor.
          </p>
          <Button className="w-full" onClick={() => router.push('/auth/login')}>
            Entrar para enviar mensagem
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (userId === sellerId) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Verificar se já existe conversa para esse produto entre esses usuários
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', userId)
        .eq('seller_id', sellerId)
        .single()

      let conversationId = existing?.id

      // Se não existir, criar uma nova conversa
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            product_id: productId,
            bid_id: '00000000-0000-0000-0000-000000000000',
            buyer_id: userId,
            seller_id: sellerId,
          })
          .select('id')
          .single()

        if (convError) throw convError
        conversationId = newConv.id
      }

      // Enviar mensagem
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: message.trim(),
        })

      if (msgError) throw msgError

      toast.success('Mensagem enviada!')
      setMessage('')
      router.push(`/dashboard/conversas/${conversationId}`)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar mensagem.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Falar com o vendedor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            placeholder="Tem alguma dúvida sobre o produto? Pergunte ao vendedor..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !message.trim()} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar mensagem
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}