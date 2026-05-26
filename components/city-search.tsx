'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MapPin } from 'lucide-react'

interface City {
  id: number
  nome: string
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string
      }
    }
  }
}

interface CitySearchProps {
  city: string
  state: string
  onCityChange: (city: string) => void
  onStateChange: (state: string) => void
}

export function CitySearch({ city, state, onCityChange, onStateChange }: CitySearchProps) {
  const [query, setQuery] = useState(city)
  const [results, setResults] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(city)
  }, [city])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchCities = async (value: string) => {
    if (value.length < 3) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome`
      )
      const data: City[] = await res.json()
      const filtered = data
        .filter((c) => c.nome.toLowerCase().startsWith(value.toLowerCase()))
        .slice(0, 8)
      setResults(filtered)
      setIsOpen(filtered.length > 0)
    } catch (error) {
      console.error('Erro ao buscar cidades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (value: string) => {
    setQuery(value)
    onCityChange(value)
    onStateChange('')

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchCities(value)
    }, 400)
  }

  const handleSelect = (selectedCity: City) => {
    const cityName = selectedCity.nome
    const stateSigla = selectedCity.microrregiao.mesorregiao.UF.sigla
    setQuery(cityName)
    onCityChange(cityName)
    onStateChange(stateSigla)
    setIsOpen(false)
    setResults([])
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2" ref={containerRef}>
        <Label htmlFor="city">Cidade *</Label>
        <div className="relative">
          <Input
            id="city"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Digite sua cidade..."
            required
            autoComplete="off"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {isOpen && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                  onClick={() => handleSelect(c)}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>{c.nome}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {c.microrregiao.mesorregiao.UF.sigla}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="state">Estado *</Label>
        <Input
          id="state"
          value={state}
          readOnly
          placeholder="Preenchido automaticamente"
          className="bg-muted cursor-not-allowed"
        />
      </div>
    </div>
  )
}