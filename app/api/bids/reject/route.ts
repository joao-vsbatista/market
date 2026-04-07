import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
  const formData = await request.formData()
  const bidId = formData.get('bidId') as string
  const productId = formData.get('productId') as string

  if (!bidId || !productId) {
    redirect(`/produtos/${productId}?error=invalid`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verify the user owns the product
  const { data: product } = await supabase
    .from('products')
    .select('seller_id')
    .eq('id', productId)
    .single()

  if (!product || product.seller_id !== user.id) {
    redirect(`/produtos/${productId}?error=unauthorized`)
  }

  // Reject the bid
  const { error } = await supabase
    .from('bids')
    .update({ status: 'rejected' })
    .eq('id', bidId)

  if (error) {
    redirect(`/produtos/${productId}?error=failed`)
  }

  redirect(`/produtos/${productId}?success=rejected`)
}
