-- Tabela de produtos/materiais
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('novo', 'seminovo', 'usado', 'para_pecas')),
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'unidade',
  min_price DECIMAL(10,2),
  location_city TEXT,
  location_state TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para products
-- Qualquer um pode ver produtos ativos
CREATE POLICY "products_select_active" ON public.products 
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

-- Apenas o dono pode inserir
CREATE POLICY "products_insert_own" ON public.products 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Apenas o dono pode atualizar
CREATE POLICY "products_update_own" ON public.products 
  FOR UPDATE USING (auth.uid() = user_id);

-- Apenas o dono pode deletar
CREATE POLICY "products_delete_own" ON public.products 
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
