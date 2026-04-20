import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Package } from 'lucide-react'
import Image from 'next/image'

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Disponível', variant: 'default' },
  reserved: { label: 'Reservado', variant: 'secondary' },
  traded: { label: 'Trocado', variant: 'outline' },
}

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: items } = await supabase
    .from('inventory_items')
    .select(`*, images:inventory_images(id, url, is_primary)`)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Inventário</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Produtos disponíveis para trocar em lances
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/inventario/novo">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Link>
        </Button>
      </div>

      {!items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Package className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Nenhum item no inventário
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Adicione produtos para usar como lance em negociações
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/inventario/novo">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const primaryImage = item.images?.find((img: any) => img.is_primary) || item.images?.[0]
            const status = statusLabel[item.status] || statusLabel.available

            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  {primaryImage && (
                    <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={primaryImage.url}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="300px"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground">{item.title}</h3>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}