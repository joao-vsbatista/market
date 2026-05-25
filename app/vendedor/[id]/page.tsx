import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, User, Package, Gavel, Tag, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { PRODUCT_CONDITIONS } from '@/lib/types'
import { Breadcrumb } from '@/components/breadcrumb'
import { ProductCard } from '@/components/product-card'
import { ReviewStars } from '@/components/review-stars'
import Image from 'next/image'
import Link from 'next/link'

export default async function VendedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const { data: auctionProducts } = await supabase
    .from('products')
    .select(`*, images:product_images(id, url, is_primary)`)
    .eq('seller_id', id)
    .eq('status', 'active')
    .eq('type', 'auction')
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: saleProducts } = await supabase
    .from('products')
    .select(`*, images:product_images(id, url, is_primary)`)
    .eq('seller_id', id)
    .eq('status', 'active')
    .eq('type', 'sale')
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviews_reviewer_id_fkey(name)')
    .eq('reviewed_id', id)
    .order('created_at', { ascending: false })

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', id)

  const auctionsWithBids = await Promise.all(
    (auctionProducts || []).map(async (product) => {
      const { count } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id)
        .eq('status', 'pending')
      return { ...product, bids_count: count || 0 }
    })
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ label: 'Vendedor', href: '#' }, { label: profile.name || 'Perfil' }]} />

          {/* Header do perfil */}
          <div className="mb-8 rounded-xl border border-border p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name || 'Vendedor'}
                    width={96}
                    height={96}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-foreground">{profile.name || 'Vendedor'}</h1>
                {profile.city && (
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                    <MapPin className="h-4 w-4" />
                    {profile.city}, {profile.state}
                  </p>
                )}

                {/* ✅ AVALIAÇÃO ADICIONADA AQUI */}
                {reviews && reviews.length > 0 && (
                  <div className="mt-2">
                    <ReviewStars rating={avgRating} count={reviews.length} size="md" />
                  </div>
                )}

                {profile.bio && (
                  <p className="mt-3 text-sm text-muted-foreground max-w-xl">{profile.bio}</p>
                )}

                <div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
                  <div className="flex flex-col items-center rounded-lg bg-muted px-4 py-2 sm:items-start">
                    <span className="text-xl font-bold text-foreground">{totalProducts || 0}</span>
                    <span className="text-xs text-muted-foreground">Produtos anunciados</span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg bg-muted px-4 py-2 sm:items-start">
                    <span className="text-xl font-bold text-foreground">{(auctionProducts?.length || 0) + (saleProducts?.length || 0)}</span>
                    <span className="text-xs text-muted-foreground">Ativos agora</span>
                  </div>
                  {reviews && reviews.length > 0 && (
                    <div className="flex flex-col items-center rounded-lg bg-muted px-4 py-2 sm:items-start">
                      <span className="text-xl font-bold text-foreground">{reviews.length}</span>
                      <span className="text-xs text-muted-foreground">Avaliações</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Leilões ativos */}
          {auctionsWithBids.length > 0 && (
            <section className="mb-10">
              <div className="mb-6 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Leilões ativos</h2>
                <Badge variant="secondary">{auctionsWithBids.length}</Badge>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {auctionsWithBids.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Produtos à venda */}
          {saleProducts && saleProducts.length > 0 && (
            <section className="mb-10">
              <div className="mb-6 flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Produtos à venda</h2>
                <Badge variant="secondary">{saleProducts.length}</Badge>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {saleProducts.map((product: any) => {
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
                            sizes="(max-width: 640px) 100vw, 33vw"
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
            </section>
          )}

          {/* ✅ SEÇÃO DE AVALIAÇÕES ADICIONADA AQUI */}
          {reviews && reviews.length > 0 && (
            <section className="mb-10">
              <div className="mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <h2 className="text-xl font-bold text-foreground">Avaliações</h2>
                <Badge variant="secondary">{reviews.length}</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm">{review.reviewer?.name}</p>
                        <ReviewStars rating={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Sem produtos */}
          {auctionsWithBids.length === 0 && (!saleProducts || saleProducts.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
              <Package className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum produto ativo</h3>
              <p className="mt-2 text-sm text-muted-foreground">Este vendedor não possui produtos disponíveis no momento</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}