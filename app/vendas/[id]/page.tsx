import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, User, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { PRODUCT_CONDITIONS } from '@/lib/types'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { ProductMessageForm } from '@/components/product-message-form'
import { Breadcrumb } from '@/components/breadcrumb'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function VendaProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey(id, name, city, state, phone),
      images:product_images(id, url, is_primary)
    `)
    .eq('id', id)
    .eq('type', 'sale')
    .single()

  if (!product) notFound()

  const images = product.images || []
  const primaryImage = images.find((img: any) => img.is_primary) || images[0]
  const isOwner = user?.id === product.seller_id

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb items={[
          { label: 'Vendas', href: '/vendas' },
          { label: product.title }
]} />
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Imagens */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Tag className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(0, 4).map((img: any) => (
                    <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      <Image src={img.url} alt={product.title} fill className="object-cover" sizes="100px" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline">{product.category}</Badge>
                  <Badge variant="secondary">
                    {PRODUCT_CONDITIONS[product.condition as keyof typeof PRODUCT_CONDITIONS]}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-foreground">{product.title}</h1>
                {product.seller?.city && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {product.seller.city}, {product.seller.state}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-border p-6">
                <p className="text-4xl font-bold text-primary">{formatCurrency(product.min_price)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Preço fixo</p>

                {!isOwner && product.status === 'active' && (
                  <div className="mt-4">
                    <AddToCartButton productId={product.id} userId={user?.id} />
                  </div>
                )}

                {isOwner && (
                  <p className="mt-4 text-sm text-muted-foreground">Este é o seu produto.</p>
                )}

                {product.status !== 'active' && (
                  <Badge variant="secondary" className="mt-4">Produto vendido</Badge>
                )}
              </div>

              {product.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{product.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
  <CardHeader>
    <CardTitle className="text-base">Vendedor</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div>
        <Link
          href={`/vendedor/${product.seller_id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {product.seller?.name || 'Vendedor'}
        </Link>
        {product.seller?.city && (
          <p className="text-sm text-muted-foreground">{product.seller.city}, {product.seller.state}</p>
        )}
      </div>
    </div>
    <Button asChild variant="outline" size="sm" className="mt-3 w-full">
      <Link href={`/vendedor/${product.seller_id}`}>
        Ver perfil do vendedor
      </Link>
    </Button>
  </CardContent>
</Card>

              <ProductMessageForm
                productId={product.id}
                sellerId={product.seller_id}
                userId={user?.id}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}