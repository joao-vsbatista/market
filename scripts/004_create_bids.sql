-- Tabela de lances
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bids
-- Usuário pode ver seus próprios lances
CREATE POLICY "bids_select_own" ON public.bids 
  FOR SELECT USING (auth.uid() = user_id);

-- Vendedor pode ver lances nos seus produtos
CREATE POLICY "bids_select_seller" ON public.bids 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = bids.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Usuário pode criar lance (mas não no próprio produto)
CREATE POLICY "bids_insert" ON public.bids 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = bids.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Usuário pode cancelar seu próprio lance (se ainda pendente)
CREATE POLICY "bids_update_own" ON public.bids 
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- Vendedor pode aceitar/rejeitar lances nos seus produtos
CREATE POLICY "bids_update_seller" ON public.bids 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = bids.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_bids_product_id ON public.bids(product_id);
CREATE INDEX IF NOT EXISTS idx_bids_user_id ON public.bids(user_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON public.bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON public.bids(created_at DESC);
