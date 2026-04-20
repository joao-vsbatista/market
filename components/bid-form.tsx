'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Gavel, Loader2, Package, X } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import Image from 'next/image'

interface InventoryItem {
  id: string
  title: string
  description: string | null
  status: string
  images: { url: string; is_primary: boolean }[]
}

interface BidFormProps {
  productId: string
  minPrice: number
  sellerId: string
  isAuthenticated: boolean
  userId?: string
  acceptsCash?: boolean
  acceptsTrade?: boolean
}

export function BidForm({
  productId,
  minPrice,
  sellerId,
  isAuthenticated,
  userId,
  acceptsCash = true,
  acceptsTrade = false,
}: BidFormProps) {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [includeProduct, setIncludeProduct] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const router = useRouter()

  const isOwnProduct = userId === sellerId
  const onlyTrade = !acceptsCash && acceptsTrade

  useEffect(() => {
    if (isAuthenticated && userId && acceptsTrade) {
      const supabase = createClient()
      supabase
        .from('inventory_items')
        .select('*, images:inventory_images(url, is_primary)')
        .eq('owner_id', userId)
        .eq('status', 'available')
        .then(({ data }) => {
          if (data) setInventoryItems(data)
        })
    }
  }, [isAuthenticated, userId, acceptsTrade])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    const bidAmount = parseFloat(amount)

    if (acceptsCash && !onlyTrade) {
      if (isNaN(bidAmount) || bidAmount <= 0) {
        toast.error('Digite um valor válido para o lance')
        return
      }
      if (bidAmount < minPrice) {
        toast.error(`O lance mínimo é ${formatCurrency(minPrice)}`)
        return
      }
    }

    if (onlyTrade && !selectedItem) {
      toast.error('Selecione um produto do inventário para fazer o lance')
      return
    }

    if (includeProduct && !selectedItem) {
      toast.error('Selecione um produto do inventário ou desative a opção de troca')
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
        amount: onlyTrade ? 0 : bidAmount,
        message: message || null,
        inventory_item_id: selectedItem?.id || null,
        cash_amount: onlyTrade ? 0 : bidAmount,
      })

      if (error) throw error

      if (selectedItem) {
        await supabase
          .from('inventory_items')
          .update({ status: 'reserved' })
          .eq('id', selectedItem.id)
      }

      toast.success('Lance enviado com sucesso!')
      setAmount('')
      setMessage('')
      setSelectedItem(null)
      setIncludeProduct(false)
      router.refresh()
    } catch (error) {
      console.error('Error submitting bid:', error)
      toast.error('Erro ao enviar lance. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isOwnProduct) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          Fazer um Lance
        </CardTitle>
        <CardDescription>
          {onlyTrade
            ? 'Este vendedor aceita apenas troca por produto'
            : `Preço mínimo: ${formatCurrency(minPrice)}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Campo de dinheiro — só aparece se aceitar dinheiro */}
            {acceptsCash && (
              <div className="grid gap-2">
                <Label htmlFor="amount">
                  Valor em dinheiro (R$) {onlyTrade ? '' : includeProduct ? '(opcional)' : '*'}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={minPrice}
                  placeholder={includeProduct ? '0.00 (opcional)' : minPrice.toFixed(2)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required={!includeProduct}
                />
              </div>
            )}

            {/* Toggle de incluir produto — só aparece se aceitar troca */}
            {acceptsTrade && (
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-sm">📦 Incluir produto do inventário</p>
                  <p className="text-xs text-muted-foreground">
                    {onlyTrade ? 'Obrigatório para este anúncio' : 'Adicionar um produto junto ao lance'}
                  </p>
                </div>
                <Switch
                  checked={includeProduct || onlyTrade}
                  onCheckedChange={(v) => {
                    if (!onlyTrade) {
                      setIncludeProduct(v)
                      if (!v) {
                        setSelectedItem(null)
                        setShowInventory(false)
                      }
                    }
                  }}
                  disabled={onlyTrade}
                />
              </div>
            )}

            {/* Seleção do item do inventário */}
            {(includeProduct || onlyTrade) && acceptsTrade && (
              <div className="grid gap-2">
                <Label>Produto do inventário {onlyTrade ? '*' : '(opcional)'}</Label>

                {selectedItem ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    {selectedItem.images?.[0] && (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={selectedItem.images[0].url}
                          alt={selectedItem.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedItem.title}</p>
                      {selectedItem.description && (
                        <p className="text-xs text-muted-foreground truncate">{selectedItem.description}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setSelectedItem(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setShowInventory(!showInventory)}
                  >
                    <Package className="h-4 w-4" />
                    {inventoryItems.length === 0
                      ? 'Nenhum item disponível no inventário'
                      : 'Selecionar item do inventário'}
                  </Button>
                )}

                {showInventory && !selectedItem && inventoryItems.length > 0 && (
                  <div className="rounded-lg border border-border divide-y divide-border max-h-60 overflow-y-auto">
                    {inventoryItems.map((item) => {
                      const img = item.images?.find((i) => i.is_primary) || item.images?.[0]
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-full items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                          onClick={() => {
                            setSelectedItem(item)
                            setShowInventory(false)
                          }}
                        >
                          {img && (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                              <Image
                                src={img.url}
                                alt={item.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

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