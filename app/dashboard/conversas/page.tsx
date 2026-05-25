import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'
import { Suspense } from 'react'
import { Breadcrumb } from '@/components/breadcrumb'

async function ConversationsList({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('updated_at', { ascending: false })

  const conversationsWithDetails = await Promise.all(
    (conversations || []).map(async (conv) => {
      const otherId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id

      const [{ data: otherProfile }, { data: product }, { data: messages }] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', otherId).single(),
        supabase.from('products').select('title, images:product_images(url, is_primary)').eq('id', conv.product_id).single(),
        supabase.from('messages').select('content, created_at, sender_id').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1),
      ])

      return { ...conv, otherProfile, product, lastMessage: messages?.[0] || null, isbuyer: conv.buyer_id === userId }
    })
  )

  if (conversationsWithDetails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhuma conversa ainda</h3>
        <p className="mt-2 text-sm text-muted-foreground">As conversas são criadas automaticamente quando você dá um lance</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {conversationsWithDetails.map((conv) => {
        const primaryImage = conv.product?.images?.find((img: any) => img.is_primary) || conv.product?.images?.[0]
        return (
          <Link key={conv.id} href={`/dashboard/conversas/${conv.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {primaryImage && (
                    <img src={primaryImage.url} alt={conv.product?.title} className="h-14 w-14 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{conv.product?.title}</p>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {conv.isbuyer ? `Vendedor: ${conv.otherProfile?.name}` : `Comprador: ${conv.otherProfile?.name}`}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {conv.lastMessage.sender_id === userId ? 'Você: ' : ''}{conv.lastMessage.content}
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
  )
}

export default async function ConversasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">

      {/* ✅ BREADCRUMB ADICIONADO AQUI */}
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Conversas' }
      ]} />

      <div>
        <h1 className="text-2xl font-bold text-foreground">Conversas</h1>
        <p className="text-sm text-muted-foreground mt-1">Suas negociações em andamento</p>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      }>
        <ConversationsList userId={user.id} />
      </Suspense>
    </div>
  )
}