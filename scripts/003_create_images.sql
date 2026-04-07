-- Tabela de imagens dos produtos
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_images
-- Qualquer um pode ver imagens de produtos ativos
CREATE POLICY "product_images_select" ON public.product_images 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_images.product_id 
      AND (products.status = 'active' OR products.user_id = auth.uid())
    )
  );

-- Apenas o dono do produto pode inserir imagens
CREATE POLICY "product_images_insert" ON public.product_images 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Apenas o dono do produto pode atualizar imagens
CREATE POLICY "product_images_update" ON public.product_images 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Apenas o dono do produto pode deletar imagens
CREATE POLICY "product_images_delete" ON public.product_images 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_images.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Índice para buscar imagens por produto
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
