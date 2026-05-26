import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, QrCode, CreditCard, FileText, MapPin, Truck, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import Link from 'next/link'

const paymentLabels: Record<string, { label: string; icon: any }> = {
  pix: { label: 'PIX', icon: QrCode },
  credit_card: { label: 'Cartão de Crédito', icon: CreditCard },
  boleto: { label: 'Boleto', icon: FileText },
}

const deliveryLabels: Record<string, { label: string; icon: any }> = {
  pickup: { label: 'Retirada no local', icon: MapPin },
  delivery: { label: 'Entrega pelo vendedor', icon: Truck },
  correios: { label: 'Correios', icon: Package },
}

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('buyer_id', user.id)
    .single()

  if (!order) redirect('/dashboard')

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*, product:products(title, min_price)')
    .eq('order_id', id)

  const payment = paymentLabels[order.payment_method] || paymentLabels.pix
  const delivery = deliveryLabels[order.delivery_method] || deliveryLabels.pickup
  const PaymentIcon = payment.icon
  const DeliveryIcon = delivery.icon

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Pedido realizado!</h1>
            <p className="mt-2 text-muted-foreground">
              Seu pedido foi confirmado com sucesso.
            </p>
            <Badge className="mt-3">#{id.slice(0, 8).toUpperCase()}</Badge>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold">Itens do pedido</h2>
                {orderItems?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.product?.title}</span>
                    <span className="font-medium">{formatCurrency(item.price)}</span>
                  </div>
                ))}
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="font-medium">{formatCurrency(order.shipping_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(order.total)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <PaymentIcon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pagamento</p>
                    <p className="text-sm font-medium">{payment.label}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <DeliveryIcon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Entrega</p>
                    <p className="text-sm font-medium">{delivery.label}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {order.delivery_method === 'pickup' && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-primary mb-1">📍 Retirada no local</p>
                  <p className="text-sm text-muted-foreground">
                    Entre em contato com o vendedor via chat para combinar a retirada do produto.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button asChild className="w-full">
                <Link href="/dashboard">Ir para o Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/vendas">Continuar comprando</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}