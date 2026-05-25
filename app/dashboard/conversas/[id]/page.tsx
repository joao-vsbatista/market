import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatWindow } from '@/components/chat-window'
import { Breadcrumb } from '@/components/breadcrumb'

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (!conversation) redirect('/dashboard/conversas')

  const isParticipant = conversation.buyer_id === user.id || conversation.seller_id === user.id
  if (!isParticipant) redirect('/dashboard/conversas')

  const otherId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id

  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', otherId)
    .single()

  const { data: product } = await supabase
    .from('products')
    .select('title')
    .eq('id', conversation.product_id)
    .single()

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, sender_id, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">

      {/* ✅ BREADCRUMB ADICIONADO AQUI */}
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Conversas', href: '/dashboard/conversas' },
        { label: product?.title || 'Conversa' }
      ]} />

      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">{product?.title}</h1>
        <p className="text-sm text-muted-foreground">
          Conversa com {otherProfile?.name}
        </p>
      </div>
      <ChatWindow
        conversationId={id}
        initialMessages={messages || []}
        currentUserId={user.id}
      />
    </div>
  )
}