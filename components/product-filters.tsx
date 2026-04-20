'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS, BRAZILIAN_STATES } from '@/lib/types'

const ALL_VALUE = 'all'

export function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('categoria') || ALL_VALUE)
  const [condition, setCondition] = useState(searchParams.get('condicao') || ALL_VALUE)
  const [state, setState] = useState(searchParams.get('estado') || ALL_VALUE)
  const [minPrice, setMinPrice] = useState(searchParams.get('preco_min') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('preco_max') || '')

  const createQueryString = useCallback((params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== ALL_VALUE) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    return newParams.toString()
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = createQueryString({ q: search })
    router.push(`/produtos?${query}`)
  }

  const applyFilters = () => {
    const query = createQueryString({
      q: search,
      categoria: category,
      condicao: condition,
      estado: state,
      preco_min: minPrice,
      preco_max: maxPrice,
    })
    router.push(`/produtos?${query}`)
    setOpen(false)
  }

  const clearFilters = () => {
    setSearch('')
    setCategory(ALL_VALUE)
    setCondition(ALL_VALUE)
    setState(ALL_VALUE)
    setMinPrice('')
    setMaxPrice('')
    router.push('/produtos')
    setOpen(false)
  }

  const hasActiveFilters =
    (category && category !== ALL_VALUE) ||
    (condition && condition !== ALL_VALUE) ||
    (state && state !== ALL_VALUE) ||
    minPrice ||
    maxPrice

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={handleSearch} className="flex flex-1 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                !
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-4"
          align="end"
        >
          <div className="flex flex-col gap-4">
            <p className="font-semibold text-sm">Filtros</p>

            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Condição</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer condição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Qualquer</SelectItem>
                  {Object.entries(PRODUCT_CONDITIONS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                  {BRAZILIAN_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Faixa de preço</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Máx"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={applyFilters}>Aplicar Filtros</Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}