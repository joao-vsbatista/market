import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Eye, Gavel, MoreVertical, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatRelativeTime } from '@/lib/formatters'
import { PRODUCT_CONDITIONS } from '@/lib/types'
import type { Product } from '@/lib/types'

async function getUserProducts(userId: string): Promise<(Product & { bids_count: number })[]> {
  const supabase = await createClient()
  
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(id, url, is_primary)
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })
  
  if (!products) return []
  
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

export default async function MyProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const products = await getUserProducts(user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seus anúncios
          </p>
        </div>
        <Button asChild>
          <Link href="/produtos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Anúncio
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Você ainda não tem produtos anunciados
            </p>
            <Button asChild>
              <Link href="/produtos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro anúncio
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0]
            
            return (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative h-40 w-full sm:h-auto sm:w-48">
                      {primaryImage ? (
                        <Image
                          src={primaryImage.url}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 192px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <span className="text-4xl">📦</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              variant={product.status === 'active' ? 'default' : 'secondary'}
                            >
                              {product.status === 'active' ? 'Ativo' : 
                               product.status === 'sold' ? 'Vendido' : 'Cancelado'}
                            </Badge>
                            <Badge variant="outline">
                              {PRODUCT_CONDITIONS[product.condition]}
                            </Badge>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/produtos/${product.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver anúncio
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <Link 
                          href={`/produtos/${product.id}`}
                          className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {product.title}
                        </Link>
                        
                        <p className="mt-1 text-lg font-bold text-primary">
                          {formatCurrency(product.min_price)}
                        </p>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatRelativeTime(product.created_at)}</span>
                        
                        {product.bids_count > 0 && (
                          <Link 
                            href={`/produtos/${product.id}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Gavel className="h-4 w-4" />
                            {product.bids_count} lance(s) pendente(s)
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
