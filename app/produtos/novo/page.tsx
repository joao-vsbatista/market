import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductForm } from '@/components/product-form'

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile for default city/state
  const { data: profile } = await supabase
    .from('profiles')
    .select('city, state')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Novo Anúncio</h1>
            <p className="mt-2 text-muted-foreground">
              Preencha as informações do produto que deseja vender
            </p>
          </div>
          
          <ProductForm 
            userId={user.id} 
            userCity={profile?.city || undefined}
            userState={profile?.state || undefined}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
