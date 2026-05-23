import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartItems } from '@/components/cart-items'
import { ShoppingCart } from 'lucide-react'

export default async function CarrinhoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: items } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(
        id, title, min_price, status,
        images:product_images(url, is_primary)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const total = items?.reduce((sum, item) => sum + (item.product?.min_price || 0) * item.quantity, 0) || 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Carrinho</h1>
              <p className="text-muted-foreground">{items?.length || 0} item(s)</p>
            </div>
          </div>

          <CartItems items={items || []} total={total} userId={user.id} />
        </div>
      </main>
      <Footer />
    </div>
  )
}