'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { apiRequest } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Users, UserPlus, Trash2, UserCircle, AlertCircle, Search } from 'lucide-react'

interface FamilyMember {
  id: string
  relationship: string
  isDependent: boolean
  createdAt: string
  member: {
    id: string
    name: string
    cpf: string
    email?: string
    phone?: string
    birthDate?: string
  }
}

interface CitizenOption {
  id: string
  name: string
  cpf: string
  email?: string
}

interface CitizenFamilyCompositionProps {
  citizenId: string
  citizenName: string
  canEdit?: boolean
}

const RELATIONSHIPS = [
  { value: 'SPOUSE', label: 'Cônjuge' },
  { value: 'SON', label: 'Filho(a)' },
  { value: 'PARENT', label: 'Pai/Mãe' },
  { value: 'SIBLING', label: 'Irmão(ã)' },
  { value: 'GRANDPARENT', label: 'Avô/Avó' },
  { value: 'GRANDCHILD', label: 'Neto(a)' },
  { value: 'OTHER', label: 'Outro' },
]

export function CitizenFamilyComposition({ citizenId, citizenName, canEdit = true }: CitizenFamilyCompositionProps) {
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)

  // Search citizens
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CitizenOption[]>([])
  const [searching, setSearching] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    memberId: '',
    relationship: '',
    isDependent: false,
  })

  const { toast } = useToast()

  useEffect(() => {
    loadFamily()
  }, [citizenId])

  const loadFamily = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/admin/citizens/${citizenId}/family`)

      if (response.success) {
        setFamily(response.data.family)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar a composição familiar',
      })
    } finally {
      setLoading(false)
    }
  }

  const searchCitizens = async (term: string) => {
    if (!term || term.length < 3) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      // Assumindo que existe um endpoint de busca de cidadãos
      const response = await apiRequest(`/admin/citizens/search?q=${encodeURIComponent(term)}`)

      if (response.success) {
        // Filtrar cidadãos que já estão na família
        const familyMemberIds = family.map(f => f.member.id)
        const filtered = response.data.citizens.filter(
          (c: CitizenOption) => c.id !== citizenId && !familyMemberIds.includes(c.id)
        )
        setSearchResults(filtered)
      }
    } catch (error) {
      // Silenciar erro de busca
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const calculateAge = (birthDate: string | undefined): string => {
    if (!birthDate) return '-'
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return `${age} anos`
  }

  const getRelationshipLabel = (relationship: string): string => {
    return RELATIONSHIPS.find(r => r.value === relationship)?.label || relationship
  }

  const handleAddMember = async () => {
    if (!formData.memberId || !formData.relationship) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Selecione um cidadão e o relacionamento',
      })
      return
    }

    try {
      const response = await apiRequest(`/admin/citizens/${citizenId}/family`, {
        method: 'POST',
        body: JSON.stringify({
          memberId: formData.memberId,
          relationship: formData.relationship,
          isDependent: formData.isDependent,
        }),
      })

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Membro adicionado à família',
        })

        setShowAddDialog(false)
        setFormData({
          memberId: '',
          relationship: '',
          isDependent: false,
        })
        setSearchTerm('')
        setSearchResults([])

        await loadFamily()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar o membro',
      })
    }
  }

  const handleDeleteMember = async () => {
    if (!selectedMember) return

    try {
      const response = await apiRequest(`/admin/citizens/${citizenId}/family/${selectedMember.id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Membro removido da família',
        })

        setShowDeleteDialog(false)
        setSelectedMember(null)
        await loadFamily()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível remover o membro',
      })
    }
  }

  const selectCitizen = (citizen: CitizenOption) => {
    setFormData({ ...formData, memberId: citizen.id })
    setSearchTerm(`${citizen.name} - ${citizen.cpf}`)
    setSearchResults([])
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Composição Familiar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Composição Familiar
            </CardTitle>
            {canEdit && (
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Chefe da Família */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <UserCircle className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{citizenName}</div>
                <div className="text-sm text-gray-500">Chefe da Família</div>
              </div>
              <Badge variant="default">Responsável</Badge>
            </div>
          </div>

          {/* Membros da Família */}
          {family.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum membro cadastrado</p>
              {canEdit && (
                <p className="text-sm mt-1">Clique em "Adicionar Membro" para começar</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {family.map((member) => (
                <div
                  key={member.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {member.member.name}
                        </span>
                        <Badge variant="outline">{getRelationshipLabel(member.relationship)}</Badge>
                        {member.isDependent && (
                          <Badge variant="secondary">Dependente</Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-500 space-y-1">
                        <div>CPF: {member.member.cpf}</div>
                        {member.member.birthDate && (
                          <div>Idade: {calculateAge(member.member.birthDate)}</div>
                        )}
                        {member.member.phone && (
                          <div>Telefone: {member.member.phone}</div>
                        )}
                      </div>
                    </div>

                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member)
                          setShowDeleteDialog(true)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estatísticas */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{family.length + 1}</div>
                <div className="text-sm text-gray-500">Total de Membros</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {family.filter(m => m.isDependent).length}
                </div>
                <div className="text-sm text-gray-500">Dependentes</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Membro */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro da Família</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="searchCitizen">Buscar Cidadão *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="searchCitizen"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    searchCitizens(e.target.value)
                  }}
                  placeholder="Digite nome ou CPF (mínimo 3 caracteres)"
                  className="pl-10"
                />
              </div>
              {searching && (
                <p className="text-sm text-gray-500 mt-1">Buscando...</p>
              )}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((citizen) => (
                    <button
                      key={citizen.id}
                      onClick={() => selectCitizen(citizen)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{citizen.name}</div>
                      <div className="text-xs text-gray-500">{citizen.cpf}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="relationship">Relacionamento *</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => setFormData({ ...formData, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o relacionamento" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDependent"
                checked={formData.isDependent}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDependent: checked as boolean })
                }
              />
              <Label htmlFor="isDependent" className="cursor-pointer">
                É dependente financeiro
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Remoção */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar Remoção
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700">
              Tem certeza que deseja remover{' '}
              <strong>{selectedMember?.member.name}</strong>{' '}
              da composição familiar?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta ação não poderá ser desfeita.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
