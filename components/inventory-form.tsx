'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/image-upload'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface InventoryFormProps {
  userId: string
}

export function InventoryForm({ userId }: InventoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<{ url: string; isPrimary: boolean }[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (images.length === 0) {
      toast.error('Adicione pelo menos uma imagem')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .insert({ owner_id: userId, title, description })
        .select()
        .single()

      if (itemError) throw itemError

      const imageInserts = images.map((img) => ({
        item_id: item.id,
        url: img.url,
        is_primary: img.isPrimary,
      }))

      const { error: imagesError } = await supabase
        .from('inventory_images')
        .insert(imageInserts)

      if (imagesError) throw imagesError

      toast.success('Item adicionado ao inventário!')
      router.push('/dashboard/inventario')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao adicionar item. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Imagens do Item</CardTitle>
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
          <CardTitle>Informações do Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Notebook Dell i5"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o item: estado de conservação, especificações..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Adicionar ao Inventário'
          )}
        </Button>
      </div>
    </form>
  )
}