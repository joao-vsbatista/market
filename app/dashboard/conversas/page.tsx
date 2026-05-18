import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default async function ConversasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      product:products(id, title, images:product_images(url, is_primary)),
      buyer:profiles!conversations_buyer_id_fkey(id, name),
      seller:profiles!conversations_seller_id_fkey(id, name),
      messages(content, created_at, sender_id)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Conversas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suas negociações em andamento
        </p>
      </div>

      {!conversations || conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Nenhuma conversa ainda
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            As conversas são criadas automaticamente quando você dá um lance
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {conversations.map((conv) => {
            const isbuyer = conv.buyer_id === user.id
            const otherPerson = isbuyer ? conv.seller : conv.buyer
            const lastMessage = conv.messages?.sort((a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
            const primaryImage = conv.product?.images?.find((img: any) => img.is_primary) || conv.product?.images?.[0]

            return (
              <Link key={conv.id} href={`/dashboard/conversas/${conv.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {primaryImage && (
                        <img
                          src={primaryImage.url}
                          alt={conv.product?.title}
                          className="h-14 w-14 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{conv.product?.title}</p>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isbuyer ? `Vendedor: ${otherPerson?.name}` : `Comprador: ${otherPerson?.name}`}
                        </p>
                        {lastMessage && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {lastMessage.sender_id === user.id ? 'Você: ' : ''}{lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}