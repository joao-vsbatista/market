'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Upload, X, Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  images: { url: string; isPrimary: boolean }[]
  onChange: (images: { url: string; isPrimary: boolean }[]) => void
  userId: string
  maxImages?: number
}

export function ImageUpload({ images, onChange, userId, maxImages = 5 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    if (images.length + files.length > maxImages) {
      toast.error(`Você pode enviar no máximo ${maxImages} imagens`)
      return
    }

    setIsUploading(true)
    const supabase = createClient()
    const newImages: { url: string; isPrimary: boolean }[] = []

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error('Apenas imagens são permitidas')
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error('Imagem muito grande (máx. 5MB)')
          continue
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error('Erro ao enviar imagem')
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        newImages.push({
          url: publicUrl,
          isPrimary: images.length === 0 && newImages.length === 0
        })
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages])
        toast.success(`${newImages.length} imagem(ns) enviada(s)`)
      }
    } catch (error) {
      console.error('Error uploading:', error)
      toast.error('Erro ao enviar imagens')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }, [images, onChange, userId, maxImages])

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    // If removed image was primary, make first image primary
    if (images[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true
    }
    onChange(newImages)
  }

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }))
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {images.map((image, index) => (
          <div
            key={image.url}
            className={cn(
              'relative aspect-square overflow-hidden rounded-lg border-2',
              image.isPrimary ? 'border-primary' : 'border-border'
            )}
          >
            <Image
              src={image.url}
              alt={`Imagem ${index + 1}`}
              fill
              className="object-cover"
              sizes="150px"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <div className="flex h-full items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleSetPrimary(index)}
                  title="Definir como principal"
                >
                  <Star className={cn('h-4 w-4', image.isPrimary && 'fill-primary text-primary')} />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(index)}
                  title="Remover"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {image.isPrimary && (
              <div className="absolute bottom-0 left-0 right-0 bg-primary px-2 py-1 text-center text-xs text-primary-foreground">
                Principal
              </div>
            )}
          </div>
        ))}
        
        {images.length < maxImages && (
          <label
            className={cn(
              'flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary hover:bg-muted',
              isUploading && 'pointer-events-none opacity-50'
            )}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="mt-2 text-xs text-muted-foreground">Adicionar</span>
              </>
            )}
          </label>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        {images.length}/{maxImages} imagens. Clique na estrela para definir a imagem principal.
      </p>
    </div>
  )
}
