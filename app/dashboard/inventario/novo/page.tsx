import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InventoryForm } from '@/components/inventory-form'

export default async function NovoItemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Adicionar Item ao Inventário</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione um produto para usar como lance em negociações
        </p>
      </div>
      <InventoryForm userId={user.id} />
    </div>
  )
}