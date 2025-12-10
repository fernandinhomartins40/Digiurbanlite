'use client'

import { useState } from 'react'
import { Search, Loader2, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface Citizen {
  id: string
  name: string
  cpf: string
  email: string
  phone?: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'GOLD' | 'REJECTED'
}

export function CitizenSearchBar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Citizen[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/citizens/search?q=${encodeURIComponent(searchQuery)}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      setResults(data.data || [])
    } catch (error) {
      console.error('Erro ao buscar cidadão:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCitizen = (citizenId: string) => {
    setOpen(false)
    setQuery('')
    router.push(`/admin/gabinete/painel-prefeito/cidadao/${citizenId}`)
  }

  const getVerificationBadge = (status: Citizen['verificationStatus']) => {
    switch (status) {
      case 'GOLD':
        return { label: 'Ouro', variant: 'default' as const, icon: '⭐' }
      case 'VERIFIED':
        return { label: 'Prata', variant: 'secondary' as const, icon: '🥈' }
      case 'PENDING':
        return { label: 'Bronze', variant: 'outline' as const, icon: '🥉' }
      case 'REJECTED':
        return { label: 'Rejeitado', variant: 'destructive' as const, icon: '❌' }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar cidadão por nome ou CPF..."
            className="pl-12 h-14 text-lg border-2 border-gray-300 focus:border-blue-500 transition-colors"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              handleSearch(e.target.value)
              if (e.target.value.length >= 3) {
                setOpen(true)
              }
            }}
            onFocus={() => {
              if (query.length >= 3) {
                setOpen(true)
              }
            }}
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>
              {query.length < 3
                ? 'Digite pelo menos 3 caracteres para buscar'
                : 'Nenhum cidadão encontrado'}
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading={`${results.length} resultado(s) encontrado(s)`}>
                {results.map((citizen) => {
                  const badge = getVerificationBadge(citizen.verificationStatus)
                  return (
                    <CommandItem
                      key={citizen.id}
                      onSelect={() => handleSelectCitizen(citizen.id)}
                      className="cursor-pointer py-3"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{citizen.name}</p>
                            <p className="text-sm text-gray-500">
                              CPF: {citizen.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                            </p>
                            {citizen.email && (
                              <p className="text-xs text-gray-400">{citizen.email}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant={badge.variant}>
                          {badge.icon} {badge.label}
                        </Badge>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
