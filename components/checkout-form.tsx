'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'
import { Loader2, QrCode, CreditCard, FileText, MapPin, Truck, Package } from 'lucide-react'
import Image from 'next/image'

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    title: string
    min_price: number
    shipping_cost: number
    delivery_methods: string[]
    images: { url: string; is_primary: boolean }[]
  }
}

interface CheckoutFormProps {
  items: CartItem[]
  userId: string
}

const PAYMENT_METHODS = [
  { id: 'pix', label: 'PIX', icon: QrCode, description: 'Aprovação imediata' },
  { id: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard, description: 'Até 12x sem juros' },
  { id: 'boleto', label: 'Boleto', icon: FileText, description: 'Vence em 3 dias úteis' },
]

const DELIVERY_METHODS = [
  { id: 'pickup', label: 'Retirada no local', icon: MapPin, description: 'Combine com o vendedor via chat', cost: 0 },
  { id: 'delivery', label: 'Entrega pelo vendedor', icon: Truck, description: 'O vendedor entrega no seu endereço', cost: null },
  { id: 'correios', label: 'Correios', icon: Package, description: 'Entrega em todo o Brasil', cost: null },
]

function PixPayment({ total, onConfirm, isLoading }: { total: number; onConfirm: () => void; isLoading: boolean }) {
  const [timeLeft, setTimeLeft] = useState(300)
  const pixCode = '00020126580014BR.GOV.BCB.PIX0136' + Math.random().toString(36).substring(2, 15)

  useState(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  })

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="rounded-xl border border-border p-4 bg-white">
        <div className="h-48 w-48 bg-[repeating-linear-gradient(45deg,#000_0,#000_2px,transparent_0,transparent_50%)] bg-[length:8px_8px] rounded-lg opacity-80" />
      </div>
      <Badge variant="secondary" className="text-sm">
        ⏱ Expira em {minutes}:{seconds.toString().padStart(2, '0')}
      </Badge>
      <div className="w-full rounded-lg border border-border p-3 bg-muted">
        <p className="text-xs text-muted-foreground mb-1">Código PIX copia e cola:</p>
        <p className="text-xs font-mono break-all">{pixCode}</p>
      </div>
      <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
      <Button onClick={onConfirm} disabled={isLoading} className="w-full" size="lg">
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Confirmando...</> : 'Confirmar Pagamento PIX'}
      </Button>
    </div>
  )
}

function CreditCardPayment({ total, onConfirm, isLoading }: { total: number; onConfirm: () => void; isLoading: boolean }) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)
  }

  const formatExpiry = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground">
        <p className="text-lg font-mono tracking-widest">{cardNumber || '•••• •••• •••• ••••'}</p>
        <div className="mt-4 flex justify-between">
          <p className="text-sm">{cardName || 'NOME NO CARTÃO'}</p>
          <p className="text-sm">{expiry || 'MM/AA'}</p>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label>Número do cartão</Label>
          <Input placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} />
        </div>
        <div className="grid gap-2">
          <Label>Nome no cartão</Label>
          <Input placeholder="Como está no cartão" value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Validade</Label>
            <Input placeholder="MM/AA" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} maxLength={5} />
          </div>
          <div className="grid gap-2">
            <Label>CVV</Label>
            <Input placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} maxLength={3} />
          </div>
        </div>
      </div>
      <p className="text-2xl font-bold text-primary text-center">{formatCurrency(total)}</p>
      <Button onClick={onConfirm} disabled={isLoading || !cardNumber || !cardName || !expiry || !cvv} className="w-full" size="lg">
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processando...</> : 'Pagar com Cartão'}
      </Button>
    </div>
  )
}

function BoletoPayment({ total, onConfirm, isLoading }: { total: number; onConfirm: () => void; isLoading: boolean }) {
  const boletoCode = '34191.75124 34567.861230 12345.678901 1 00010000' + Math.floor(total * 100).toString().padStart(10, '0')

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border p-4 bg-muted space-y-2">
        <p className="text-sm font-medium">Código do boleto:</p>
        <p className="text-xs font-mono break-all">{boletoCode}</p>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>• Vencimento em <strong className="text-foreground">3 dias úteis</strong></p>
        <p>• Pague em qualquer banco, lotérica ou app</p>
        <p>• Compensação em até 2 dias úteis</p>
      </div>
      <p className="text-2xl font-bold text-primary text-center">{formatCurrency(total)}</p>
      <Button onClick={onConfirm} disabled={isLoading} className="w-full" size="lg">
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando boleto...</> : 'Gerar Boleto'}
      </Button>
    </div>
  )
}

export function CheckoutForm({ items, userId }: CheckoutFormProps) {
  const [step, setStep] = useState<'delivery' | 'payment' | 'processing'>('delivery')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [deliveryMethod, setDeliveryMethod] = useState('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const subtotal = items.reduce((sum, item) => sum + item.product.min_price * item.quantity, 0)
  const shippingCost = deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'correios' ? 25.90 : 15.00
  const total = subtotal + shippingCost

  const handleConfirmPayment = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: userId,
          total,
          status: 'paid',
          payment_method: paymentMethod,
          payment_status: 'paid',
          delivery_method: deliveryMethod,
          delivery_address: deliveryAddress || null,
          shipping_cost: shippingCost,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        price: item.product.min_price,
        quantity: item.quantity,
      }))

      await supabase.from('order_items').insert(orderItems)

      await Promise.all(
        items.map((item) =>
          supabase.from('products').update({ status: 'sold' }).eq('id', item.product_id)
        )
      )

      await supabase.from('cart_items').delete().eq('user_id', userId)

      toast.success('Pedido realizado com sucesso!')
      router.push(`/pedido/${order.id}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao finalizar pedido.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Formulário */}
      <div className="lg:col-span-2 space-y-6">

        {/* Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Método de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DELIVERY_METHODS.map((method) => {
              const Icon = method.icon
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setDeliveryMethod(method.id)}
                  className={`flex w-full items-center gap-4 rounded-lg border-2 p-4 transition-colors text-left ${
                    deliveryMethod === method.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary shrink-0">
                    {method.id === 'pickup' ? 'Grátis' : method.id === 'correios' ? formatCurrency(25.90) : formatCurrency(15.00)}
                  </p>
                </button>
              )
            })}

            {deliveryMethod !== 'pickup' && (
              <div className="grid gap-2 pt-2">
                <Label>Endereço de entrega</Label>
                <Input
                  placeholder="Rua, número, bairro, cidade - Estado"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Método de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                      paymentMethod === method.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="text-xs font-medium text-center">{method.label}</p>
                  </button>
                )
              })}
            </div>

            <Separator />

            {paymentMethod === 'pix' && (
              <PixPayment total={total} onConfirm={handleConfirmPayment} isLoading={isLoading} />
            )}
            {paymentMethod === 'credit_card' && (
              <CreditCardPayment total={total} onConfirm={handleConfirmPayment} isLoading={isLoading} />
            )}
            {paymentMethod === 'boleto' && (
              <BoletoPayment total={total} onConfirm={handleConfirmPayment} isLoading={isLoading} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo */}
      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="text-base">Resumo do pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => {
              const img = item.product.images?.find((i) => i.is_primary) || item.product.images?.[0]
              return (
                <div key={item.id} className="flex gap-3">
                  {img && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image src={img.url} alt={item.product.title} fill className="object-cover" sizes="48px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.title}</p>
                    <p className="text-sm text-primary font-semibold">{formatCurrency(item.product.min_price)}</p>
                  </div>
                </div>
              )
            })}

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className={shippingCost === 0 ? 'text-primary font-medium' : ''}>
                  {shippingCost === 0 ? 'Grátis' : formatCurrency(shippingCost)}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}