'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, Loader2, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'

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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Citizen[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // ⚡ Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  // ⚡ Função de busca com debounce (500ms)
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([])
      setShowResults(false)
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
      setShowResults(true)
    } catch (error) {
      console.error('Erro ao buscar cidadão:', error)
      setResults([])
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // ⚡ Handler com debounce
  const handleInputChange = (value: string) => {
    setQuery(value)

    // Limpar timeout anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Criar novo timeout
    if (value.length >= 3) {
      debounceTimeout.current = setTimeout(() => {
        handleSearch(value)
      }, 500) // ⚡ 500ms de debounce
    } else {
      setResults([])
      setShowResults(false)
    }
  }

  const handleSelectCitizen = (citizenId: string) => {
    setShowResults(false)
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
    <div ref={searchRef} className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
      <Input
        placeholder="Buscar cidadão por nome ou CPF..."
        className="pl-12 h-14 text-lg border-2 border-gray-300 focus:border-blue-500 transition-colors text-gray-900 placeholder:text-gray-400"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (query.length >= 3 && results.length > 0) {
            setShowResults(true)
          }
        }}
      />
      {loading && (
        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gray-400 z-10" />
      )}

      {/* Dropdown de Resultados */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto z-50 shadow-lg border-2 border-gray-200">
          {query.length < 3 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Digite pelo menos 3 caracteres para buscar
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Nenhum cidadão encontrado
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                {results.length} resultado(s) encontrado(s)
              </div>
              <div className="divide-y divide-gray-100">
                {results.map((citizen) => {
                  const badge = getVerificationBadge(citizen.verificationStatus)
                  return (
                    <div
                      key={citizen.id}
                      onClick={() => handleSelectCitizen(citizen.id)}
                      className="p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
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
                        <Badge variant={badge.variant} className="flex-shrink-0">
                          {badge.icon} {badge.label}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
