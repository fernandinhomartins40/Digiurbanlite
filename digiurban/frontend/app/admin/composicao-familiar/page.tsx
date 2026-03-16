'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Search, Users, Loader2, UserCircle } from 'lucide-react'
import { CitizenFamilyCompositionEnhanced } from '@/components/admin/CitizenFamilyCompositionEnhanced'
import { api } from '@/lib/services/api'

interface CitizenSearchResult {
  id: string
  name: string
  cpf: string
  email?: string
}

export default function ComposicaoFamiliarPage() {
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<CitizenSearchResult[]>([])
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenSearchResult | null>(null)

  // Ref para debounce
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearchCitizen = useCallback(async (searchValue: string) => {
    if (searchValue.trim().length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    try {
      const response = await api.get(`/admin/citizens/search?q=${encodeURIComponent(searchValue.trim())}`)

      if (response.data.success && response.data.data) {
        const results = Array.isArray(response.data.data)
          ? response.data.data
          : (response.data.data.citizens || [])
        setSearchResults(results)

        if (results.length === 0) {
          toast({
            title: 'Nenhum resultado',
            description: 'Nenhum cidadão encontrado com esse critério'
          })
        }
      } else {
        setSearchResults([])
      }
    } catch (error: any) {
      console.error('Erro ao buscar cidadão:', error)
      setSearchResults([])
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar',
        description: error.message || 'Não foi possível buscar cidadãos'
      })
    } finally {
      setSearching(false)
    }
  }, [toast])

  const debouncedSearch = useCallback((searchValue: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    searchTimerRef.current = setTimeout(() => {
      handleSearchCitizen(searchValue)
    }, 400)
  }, [handleSearchCitizen])

  const handleSearch = () => {
    if (!searchTerm || searchTerm.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Digite pelo menos 2 caracteres',
        description: 'Informe nome ou CPF para buscar'
      })
      return
    }

    handleSearchCitizen(searchTerm)
  }

  const handleSelectCitizen = (citizen: CitizenSearchResult) => {
    setSelectedCitizen(citizen)
    setSearchResults([])
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-7 w-7" />
          Composição Familiar
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie a composição familiar dos cidadãos
        </p>
      </div>

      {/* Busca de Cidadão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Cidadão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Digite nome ou CPF do cidadão (mínimo 2 caracteres)"
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchTerm(value)
                    debouncedSearch(value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searching || searchTerm.length < 2}
              >
                {searching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            {/* Resultados da Busca */}
            {searchResults.length > 0 && (
              <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                {searchResults.map((citizen) => (
                  <button
                    key={citizen.id}
                    onClick={() => handleSelectCitizen(citizen)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-8 w-8 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{citizen.name}</div>
                        <div className="text-sm text-gray-500">
                          CPF: {citizen.cpf}
                          {citizen.email && ` • ${citizen.email}`}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cidadão Selecionado - Composição Familiar */}
      {selectedCitizen && (
        <div className="space-y-4">
          {/* Info do Cidadão Selecionado */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-10 w-10 text-blue-600" />
                  <div>
                    <div className="font-semibold text-blue-900">{selectedCitizen.name}</div>
                    <div className="text-sm text-blue-700">CPF: {selectedCitizen.cpf}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCitizen(null)}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Limpar Seleção
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Componente de Composição Familiar */}
          <CitizenFamilyCompositionEnhanced
            citizenId={selectedCitizen.id}
            citizenName={selectedCitizen.name}
            canEdit={true}
          />
        </div>
      )}

      {/* Estado Vazio */}
      {!selectedCitizen && searchResults.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum cidadão selecionado
            </h3>
            <p className="text-gray-500 mb-6">
              Use a busca acima para encontrar um cidadão e gerenciar sua composição familiar
            </p>
            <div className="text-sm text-gray-400">
              <p>Dica: Você pode buscar por nome ou CPF</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
