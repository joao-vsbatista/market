import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Gavel, Shield, MapPin, Tag, ShoppingCart, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { PRODUCT_CONDITIONS } from '@/lib/types'
import Image from 'next/image'
import type { Product } from '@/lib/types'

async function getRecentAuctions(): Promise<Product[]> {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey(id, name, city, state),
      images:product_images(id, url, is_primary)
    `)
    .eq('status', 'active')
    .eq('type', 'auction')
    .order('created_at', { ascending: false })
    .limit(4)

  if (!products) return []

  const productsWithBids = await Promise.all(
    products.map(async (product) => {
      const { count } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id)
        .eq('status', 'pending')
      return { ...product, bids_count: count || 0 }
    })
  )

  return productsWithBids
}

async function getRecentSales() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey(id, name, city, state),
      images:product_images(id, url, is_primary)
    `)
    .eq('status', 'active')
    .eq('type', 'sale')
    .order('created_at', { ascending: false })
    .limit(4)

  return data || []
}

export default async function HomePage() {
  const [auctions, sales] = await Promise.all([getRecentAuctions(), getRecentSales()])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Compre, venda e{' '}
                <span className="text-primary">negocie</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty">
                O marketplace completo — produtos com preço fixo para compra imediata
                ou leilões onde você negocia o melhor valor.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/leiloes">
                    <Gavel className="mr-2 h-4 w-4" />
                    Ver Leilões
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/vendas">
                    <Tag className="mr-2 h-4 w-4" />
                    Ver Vendas
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border bg-muted/30 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Gavel className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Sistema de Lances</h3>
                <p className="text-sm text-muted-foreground">Faça ofertas e negocie diretamente com vendedores</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Compra Imediata</h3>
                <p className="text-sm text-muted-foreground">Produtos com preço fixo para compra direta pelo carrinho</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Negociação Segura</h3>
                <p className="text-sm text-muted-foreground">Contato liberado apenas após aceite do lance</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Perto de Você</h3>
                <p className="text-sm text-muted-foreground">Encontre produtos na sua cidade ou região</p>
              </div>
            </div>
          </div>
        </section>

        {/* Leilões recentes */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gavel className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Leilões Recentes</h2>
                </div>
                <p className="text-muted-foreground">Dê lances e negocie o melhor preço</p>
              </div>
              <Button asChild variant="ghost">
                <Link href="/leiloes">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {auctions.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {auctions.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">Nenhum leilão disponível no momento.</p>
                <Button asChild className="mt-4">
                  <Link href="/produtos/novo">Criar leilão</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Vendas recentes */}
        <section className="border-t border-border py-16 sm:py-20 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Vendas Recentes</h2>
                </div>
                <p className="text-muted-foreground">Produtos com preço fixo para compra imediata</p>
              </div>
              <Button asChild variant="ghost">
                <Link href="/vendas">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {sales.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {sales.map((product: any) => {
                  const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0]
                  return (
                    <Card key={product.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={product.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, 25vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-2 text-xs">
                          {PRODUCT_CONDITIONS[product.condition as keyof typeof PRODUCT_CONDITIONS]}
                        </Badge>
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{product.title}</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-primary">{formatCurrency(product.min_price)}</p>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/vendas/${product.id}`}>Ver</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground">Nenhum produto à venda no momento.</p>
                <Button asChild className="mt-4">
                  <Link href="/produtos/novo">Anunciar produto</Link>
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
              Cadastre seu produto gratuitamente — escolha entre venda direta ou leilão.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link href="/produtos/novo">Anunciar Agora</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}