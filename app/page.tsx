import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Gavel, Shield, MapPin } from 'lucide-react'
import type { Product } from '@/lib/types'

async function getRecentProducts(): Promise<Product[]> {
  const supabase = await createClient()
  
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey(id, name, city, state),
      images:product_images(id, url, is_primary)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8)
    console.log('products:', products)
    console.log('error:', error)
  
  if (!products) return []
  
  // Get bids count for each product
  const productsWithBids = await Promise.all(
    products.map(async (product) => {
      const { count } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id)
        .eq('status', 'pending')
      
      return {
        ...product,
        bids_count: count || 0
      }
    })
  )
  
  return productsWithBids
}

export default async function HomePage() {
  const products = await getRecentProducts()
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Compre e venda com{' '}
                <span className="text-primary">lances inteligentes</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty">
                O marketplace onde vendedores recebem ofertas e escolhem o melhor negócio. 
                Sem preço fixo, sem complicação.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/produtos">
                    Ver Produtos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/auth/sign-up">
                    Começar a Vender
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features */}
        <section className="border-y border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Gavel className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Sistema de Lances</h3>
                <p className="text-sm text-muted-foreground">
                  Faça ofertas e negocie diretamente com vendedores
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Negociação Segura</h3>
                <p className="text-sm text-muted-foreground">
                  Contato liberado apenas após aceite do lance
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Perto de Você</h3>
                <p className="text-sm text-muted-foreground">
                  Encontre produtos na sua cidade ou região
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Recent Products */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                  Produtos Recentes
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Confira os últimos anúncios publicados
                </p>
              </div>
              <Button asChild variant="ghost">
                <Link href="/produtos">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            {products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum produto disponível no momento.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/produtos/novo">
                    Seja o primeiro a anunciar
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
        
        {/* CTA */}
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
              Tem algo para vender?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
              Cadastre seu produto gratuitamente e receba ofertas de compradores interessados.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link href="/produtos/novo">
                Anunciar Agora
              </Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
