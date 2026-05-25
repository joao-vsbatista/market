'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReviewFormProps {
  productId: string
  reviewedId: string
  reviewerId: string
  reviewedName: string
}

export function ReviewForm({ productId, reviewedId, reviewerId, reviewedName }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Selecione uma avaliação de 1 a 5 estrelas')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from('reviews').insert({
        reviewer_id: reviewerId,
        reviewed_id: reviewedId,
        product_id: productId,
        rating,
        comment: comment.trim() || null,
      })

      if (error) throw error

      toast.success('Avaliação enviada com sucesso!')
      router.refresh()
    } catch (error: any) {
      if (error?.code === '23505') {
        toast.error('Você já avaliou esta negociação.')
      } else {
        toast.error('Erro ao enviar avaliação.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base">Avaliar {reviewedName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][rating]}
              </span>
            )}
          </div>

          <Textarea
            placeholder="Deixe um comentário sobre a negociação (opcional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />

          <Button type="submit" disabled={isLoading || rating === 0}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Avaliação'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}