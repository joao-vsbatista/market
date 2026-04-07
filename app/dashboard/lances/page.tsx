import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone } from 'lucide-react'
import { formatCurrency, formatRelativeTime } from '@/lib/formatters'
import { BID_STATUS_LABELS } from '@/lib/types'
import type { Bid, Product, Profile } from '@/lib/types'

interface BidWithProduct extends Bid {
  product: Product & {
    seller: Profile
    images: { id: string; url: string; is_primary: boolean }[]
  }
}

async function getUserBids(userId: string): Promise<BidWithProduct[]> {
  const supabase = await createClient()
  
  const { data: bids } = await supabase
    .from('bids')
    .select(`
      *,
      product:products!bids_product_id_fkey(
        *,
        seller:profiles!products_seller_id_fkey(id, name, phone, city, state),
        images:product_images(id, url, is_primary)
      )
    `)
    .eq('bidder_id', userId)
    .order('created_at', { ascending: false })
  
  return (bids as BidWithProduct[]) || []
}

function getBidStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'accepted':
      return 'default'
    case 'rejected':
      return 'destructive'
    case 'cancelled':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default async function MyBidsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const bids = await getUserBids(user.id)
  
  const pendingBids = bids.filter(b => b.status === 'pending')
  const acceptedBids = bids.filter(b => b.status === 'accepted')
  const otherBids = bids.filter(b => b.status !== 'pending' && b.status !== 'accepted')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meus Lances</h1>
        <p className="text-muted-foreground">
          Acompanhe os lances que você fez
        </p>
      </div>

      {bids.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <p className="text-muted-foreground">
              Você ainda não fez nenhum lance
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Accepted Bids */}
          {acceptedBids.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Badge className="bg-success text-success-foreground">
                  Aceitos
                </Badge>
                <span>{acceptedBids.length}</span>
              </h2>
              <div className="grid gap-4">
                {acceptedBids.map((bid) => (
                  <BidCard key={bid.id} bid={bid} showContact />
                ))}
              </div>
            </div>
          )}

          {/* Pending Bids */}
          {pendingBids.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Badge variant="outline">Pendentes</Badge>
                <span>{pendingBids.length}</span>
              </h2>
              <div className="grid gap-4">
                {pendingBids.map((bid) => (
                  <BidCard key={bid.id} bid={bid} />
                ))}
              </div>
            </div>
          )}

          {/* Other Bids */}
          {otherBids.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Histórico</h2>
              <div className="grid gap-4">
                {otherBids.map((bid) => (
                  <BidCard key={bid.id} bid={bid} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BidCard({ bid, showContact }: { bid: BidWithProduct; showContact?: boolean }) {
  const primaryImage = bid.product.images?.find(img => img.is_primary) || bid.product.images?.[0]
  
  return (
    <Card className={bid.status === 'accepted' ? 'border-success' : undefined}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <Link 
            href={`/produtos/${bid.product.id}`}
            className="relative h-32 w-full sm:h-auto sm:w-40"
          >
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={bid.product.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 160px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-3xl">📦</span>
              </div>
            )}
          </Link>
          
          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Link 
                  href={`/produtos/${bid.product.id}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {bid.product.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {bid.product.city}, {bid.product.state}
                </p>
              </div>
              <Badge variant={getBidStatusVariant(bid.status)}>
                {BID_STATUS_LABELS[bid.status]}
              </Badge>
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(bid.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(bid.created_at)}
                </p>
              </div>
            </div>
            
            {showContact && bid.product.seller && (
              <div className="mt-4 rounded-lg bg-success/10 p-3">
                <p className="text-sm font-medium text-foreground">
                  Contato do vendedor:
                </p>
                <p className="text-sm text-muted-foreground">
                  {bid.product.seller.name}
                </p>
                {bid.product.seller.phone && (
                  <p className="mt-1 flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3" />
                    {bid.product.seller.phone}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
