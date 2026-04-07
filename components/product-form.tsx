'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/image-upload'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS, BRAZILIAN_STATES } from '@/lib/types'
import type { ProductCondition } from '@/lib/types'

interface ProductFormProps {
  userId: string
  userCity?: string
  userState?: string
}

export function ProductForm({ userId, userCity, userState }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<{ url: string; isPrimary: boolean }[]>([])
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState<ProductCondition | ''>('')
  const [minPrice, setMinPrice] = useState('')
  const [city, setCity] = useState(userCity || '')
  const [state, setState] = useState(userState || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!category || !condition) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (images.length === 0) {
      toast.error('Adicione pelo menos uma imagem')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          seller_id: userId,
          title,
          description,
          category,
          condition,
          min_price: parseFloat(minPrice),
          city,
          state,
        })
        .select()
        .single()

      if (productError) throw productError

      // Add images
      const imageInserts = images.map((img) => ({
        product_id: product.id,
        url: img.url,
        is_primary: img.isPrimary,
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts)

      if (imagesError) throw imagesError

      toast.success('Produto publicado com sucesso!')
      router.push(`/produtos/${product.id}`)
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Erro ao publicar produto. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Imagens do Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            images={images}
            onChange={setImages}
            userId={userId}
            maxImages={5}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título do anúncio *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: iPhone 12 Pro Max 128GB"
              required
              maxLength={100}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o produto em detalhes: estado de conservação, tempo de uso, acessórios inclusos..."
              required
              rows={5}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Condição *</Label>
              <Select 
                value={condition} 
                onValueChange={(v) => setCondition(v as ProductCondition)} 
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRODUCT_CONDITIONS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="minPrice">Preço mínimo (R$) *</Label>
            <Input
              id="minPrice"
              type="number"
              step="0.01"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0,00"
              required
            />
            <p className="text-sm text-muted-foreground">
              Você receberá lances a partir deste valor
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Localização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Sua cidade"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Estado *</Label>
              <Select value={state} onValueChange={setState} required>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publicando...
            </>
          ) : (
            'Publicar Anúncio'
          )}
        </Button>
      </div>
    </form>
  )
}
