'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function BidActions({ bidId, productId }: { bidId: string; productId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<'accept' | 'reject' | null>(null)

  const handleAction = async (action: 'accept' | 'reject') => {
    setIsLoading(action)
    try {
      const formData = new FormData()
      formData.append('bidId', bidId)
      formData.append('productId', productId)

      await fetch(`/api/bids/${action}`, {
        method: 'POST',
        body: formData,
      })

      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="flex-1"
        disabled={!!isLoading}
        onClick={() => handleAction('accept')}
      >
        {isLoading === 'accept' ? 'Aceitando...' : 'Aceitar'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        disabled={!!isLoading}
        onClick={() => handleAction('reject')}
      >
        {isLoading === 'reject' ? 'Rejeitando...' : 'Rejeitar'}
      </Button>
    </div>
  )
}