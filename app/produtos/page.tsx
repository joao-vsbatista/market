import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { ProductFilters } from '@/components/product-filters'
import { Package } from 'lucide-react'
import type { Product, ProductCondition } from '@/lib/types'

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string
    categoria?: string
    condicao?: ProductCondition
    estado?: string
    preco_min?: string
    preco_max?: string
    page?: string
  }>
}

async function getProducts(params: Awaited<ProductsPageProps['searchParams']>): Promise<Product[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('products')
    .select(`
      *,
      seller:profiles!products_seller_id_fkey(id, name, city, state),
      images:product_images(id, url, is_primary)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  }
  
  if (params.categoria) {
    query = query.eq('category', params.categoria)
  }
  
  if (params.condicao) {
    query = query.eq('condition', params.condicao)
  }
  
  if (params.estado) {
    query = query.eq('state', params.estado)
  }
  
  if (params.preco_min) {
    query = query.gte('min_price', parseFloat(params.preco_min))
  }
  
  if (params.preco_max) {
    query = query.lte('min_price', parseFloat(params.preco_max))
  }
  
  const { data: products } = await query.limit(50)
  
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

function ProductsLoading() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/3] rounded-lg bg-muted" />
          <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

async function ProductsList({ params }: { params: Awaited<ProductsPageProps['searchParams']> }) {
  const products = await getProducts(params)
  
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <Package className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Nenhum produto encontrado
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente ajustar os filtros ou fazer uma nova busca
        </p>
      </div>
    )
  }
  
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  
  const hasFilters = params.q || params.categoria || params.condicao || params.estado || params.preco_min || params.preco_max

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
            <p className="mt-2 text-muted-foreground">
              Encontre materiais usados com preços acessíveis
            </p>
          </div>
          
          <div className="mb-8">
            <ProductFilters />
          </div>
          
          {hasFilters && (
            <p className="mb-4 text-sm text-muted-foreground">
              Exibindo resultados para sua busca
            </p>
          )}
          
          <Suspense fallback={<ProductsLoading />}>
            <ProductsList params={params} />
          </Suspense>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
