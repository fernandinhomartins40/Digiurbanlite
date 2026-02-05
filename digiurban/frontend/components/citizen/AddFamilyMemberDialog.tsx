'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Search, Loader2, AlertTriangle } from 'lucide-react'
import { RELATIONSHIP_OPTIONS } from '@/shared/constants/family.constants'
import { api } from '@/lib/services/api'

interface CitizenOption {
  id: string
  name: string
  cpf: string
  email?: string
  birthDate?: string
}

interface ValidationWarning {
  type: 'age_mismatch' | 'relationship_suggestion'
  message: string
  suggestion?: string
}

interface AddFamilyMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  apiRequest: (url: string, options?: any) => Promise<any>
  headBirthDate?: string
}

export function AddFamilyMemberDialog({
  open,
  onOpenChange,
  onSuccess,
  apiRequest,
  headBirthDate
}: AddFamilyMemberDialogProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CitizenOption[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenOption | null>(null)
  const [warnings, setWarnings] = useState<ValidationWarning[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Ref para debounce
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [formData, setFormData] = useState({
    memberId: '',
    relationship: '',
    isDependent: false,
    monthlyIncome: '',
    occupation: '',
    education: '',
    hasDisability: false
  })

  // Resetar form ao abrir/fechar
  useEffect(() => {
    if (!open) {
      setFormData({
        memberId: '',
        relationship: '',
        isDependent: false,
        monthlyIncome: '',
        occupation: '',
        education: '',
        hasDisability: false
      })
      setSelectedCitizen(null)
      setSearchTerm('')
      setSearchResults([])
      setWarnings([])
    }
  }, [open])

  // Buscar cidadãos
  const searchCitizens = useCallback(async (term: string) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    try {
      const response = await api.get(`/citizen/family/search?q=${encodeURIComponent(term.trim())}`)

      if (response.data.success && response.data.data) {
        const results = Array.isArray(response.data.data)
          ? response.data.data
          : (response.data.data.citizens || [])
        setSearchResults(results)
      } else {
        setSearchResults([])
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar cidadãos:', error)
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

  const debouncedSearch = useCallback((term: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    searchTimerRef.current = setTimeout(() => {
      searchCitizens(term)
    }, 400)
  }, [searchCitizens])

  // Selecionar cidadão
  const selectCitizen = (citizen: CitizenOption) => {
    setSelectedCitizen(citizen)
    setFormData({ ...formData, memberId: citizen.id })
    setSearchTerm(`${citizen.name} - ${citizen.cpf}`)
    setSearchResults([])

    // Limpar warnings ao selecionar novo cidadão
    setWarnings([])
  }

  // Validar relacionamento por idade
  const validateRelationship = () => {
    if (!selectedCitizen?.birthDate || !headBirthDate || !formData.relationship) {
      return
    }

    const headAge = calculateAge(headBirthDate)
    const memberAge = calculateAge(selectedCitizen.birthDate)
    const newWarnings: ValidationWarning[] = []

    const relationship = formData.relationship

    // Validações baseadas em idade
    if (relationship === 'SON' || relationship === 'DAUGHTER') {
      if (memberAge >= headAge) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Idade incompatível: filho(a) não pode ser mais velho que o responsável`
        })
      } else if (headAge - memberAge < 15) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Diferença de idade pequena (${headAge - memberAge} anos). Normalmente esperado pelo menos 15 anos.`
        })
      }
    } else if (relationship === 'FATHER' || relationship === 'MOTHER') {
      if (memberAge <= headAge) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Idade incompatível: pai/mãe não pode ser mais novo que o responsável`
        })
      } else if (memberAge - headAge < 15) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Diferença de idade pequena (${memberAge - headAge} anos). Normalmente esperado pelo menos 15 anos.`
        })
      }
    } else if (relationship === 'SPOUSE') {
      const ageDiff = Math.abs(headAge - memberAge)
      if (ageDiff > 30) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Diferença de idade significativa (${ageDiff} anos) para cônjuge. Verifique se está correto.`
        })
      }
    } else if (relationship === 'BROTHER' || relationship === 'SISTER') {
      const ageDiff = Math.abs(headAge - memberAge)
      if (ageDiff > 30) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Diferença de idade grande (${ageDiff} anos) para irmão(ã). Verifique se está correto.`
        })
      }
    } else if (relationship === 'GRANDSON' || relationship === 'GRANDDAUGHTER') {
      if (memberAge >= headAge) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Idade incompatível: neto(a) não pode ser mais velho que o responsável`
        })
      } else if (headAge - memberAge < 35) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Diferença de idade pequena (${headAge - memberAge} anos). Normalmente esperado pelo menos 35 anos para neto(a).`
        })
      }
    } else if (relationship === 'GRANDFATHER' || relationship === 'GRANDMOTHER') {
      if (memberAge <= headAge) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Idade incompatível: avô/avó não pode ser mais novo que o responsável`
        })
      } else if (memberAge - headAge < 35) {
        newWarnings.push({
          type: 'age_mismatch',
          message: `Diferença de idade pequena (${memberAge - headAge} anos). Normalmente esperado pelo menos 35 anos para avô/avó.`
        })
      }
    }

    setWarnings(newWarnings)
  }

  // Calcular idade
  const calculateAge = (birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  // Validar relacionamento quando mudar
  useEffect(() => {
    if (formData.relationship && selectedCitizen) {
      validateRelationship()
    }
  }, [formData.relationship, selectedCitizen])

  // Submeter formulário
  const handleSubmit = async () => {
    if (!formData.memberId || !formData.relationship) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Selecione um cidadão e o relacionamento'
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await apiRequest('/citizen/family/members', {
        method: 'POST',
        body: JSON.stringify({
          memberId: formData.memberId,
          relationship: formData.relationship,
          isDependent: formData.isDependent,
          monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
          occupation: formData.occupation || undefined,
          education: formData.education || undefined,
          hasDisability: formData.hasDisability
        })
      })

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Membro adicionado à família. Aguardando confirmação do membro.'
        })
        onSuccess()
        onOpenChange(false)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar o membro'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Membro da Família</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Buscar Cidadão */}
          <div>
            <Label htmlFor="searchCitizen">Buscar Cidadão *</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="searchCitizen"
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value
                  setSearchTerm(value)
                  debouncedSearch(value)
                }}
                placeholder="Digite nome ou CPF (mínimo 2 caracteres)"
                className="pl-10"
                disabled={submitting}
              />
            </div>
            {searching && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Buscando...
              </p>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {searchResults.map((citizen) => (
                  <button
                    key={citizen.id}
                    onClick={() => selectCitizen(citizen)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-sm">{citizen.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{citizen.cpf}</span>
                      {citizen.birthDate && (
                        <span>• {calculateAge(citizen.birthDate)} anos</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedCitizen && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-blue-900">{selectedCitizen.name}</p>
                    <p className="text-xs text-blue-700">{selectedCitizen.cpf}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCitizen(null)
                      setSearchTerm('')
                      setFormData({ ...formData, memberId: '' })
                      setWarnings([])
                    }}
                    disabled={submitting}
                  >
                    Alterar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Relacionamento */}
          <div>
            <Label htmlFor="relationship">Relacionamento *</Label>
            <Select
              value={formData.relationship}
              onValueChange={(value) => setFormData({ ...formData, relationship: value })}
              disabled={submitting}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o relacionamento" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map((rel) => (
                  <SelectItem key={rel.value} value={rel.value}>
                    {rel.emoji} {rel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warnings de validação */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning, idx) => (
                <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800">{warning.message}</p>
                      {warning.suggestion && (
                        <p className="text-xs text-yellow-700 mt-1">
                          Sugestão: {warning.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dependente */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDependent"
              checked={formData.isDependent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isDependent: checked as boolean })
              }
              disabled={submitting}
            />
            <Label htmlFor="isDependent" className="cursor-pointer">
              É dependente financeiro
            </Label>
          </div>

          {/* Informações Adicionais */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Informações Adicionais (Opcional)
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="monthlyIncome">Renda Mensal (R$)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1500.00"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                  disabled={submitting}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="occupation">Ocupação</Label>
                <Input
                  id="occupation"
                  placeholder="Ex: Estudante, Aposentado, etc."
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  disabled={submitting}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="education">Escolaridade</Label>
                <Select
                  value={formData.education}
                  onValueChange={(value) => setFormData({ ...formData, education: value })}
                  disabled={submitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a escolaridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sem escolaridade">Sem escolaridade</SelectItem>
                    <SelectItem value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</SelectItem>
                    <SelectItem value="Ensino Fundamental Completo">Ensino Fundamental Completo</SelectItem>
                    <SelectItem value="Ensino Médio Incompleto">Ensino Médio Incompleto</SelectItem>
                    <SelectItem value="Ensino Médio Completo">Ensino Médio Completo</SelectItem>
                    <SelectItem value="Ensino Superior Incompleto">Ensino Superior Incompleto</SelectItem>
                    <SelectItem value="Ensino Superior Completo">Ensino Superior Completo</SelectItem>
                    <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasDisability"
                  checked={formData.hasDisability}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, hasDisability: checked as boolean })
                  }
                  disabled={submitting}
                />
                <Label htmlFor="hasDisability" className="cursor-pointer">
                  Possui deficiência (PCD)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !formData.memberId || !formData.relationship}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              'Adicionar Membro'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
