'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { apiRequest } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Users, UserPlus, Trash2, UserCircle, AlertCircle, Search, Edit2, Mail, Clock, CheckCircle, XCircle } from 'lucide-react'
import { RELATIONSHIP_OPTIONS, getRelationshipLabel, getRelationshipEmoji } from '@/shared/constants/family.constants'
import { api } from '@/lib/services/api'

interface FamilyMember {
  id: string
  relationship: string
  isDependent: boolean
  monthlyIncome?: number | null
  occupation?: string | null
  education?: string | null
  hasDisability?: boolean | null
  status?: string
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

interface FamilyInvite {
  id: string
  email: string
  name?: string
  relationship: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'
  createdAt: string
  expiresAt: string
}

interface CitizenOption {
  id: string
  name: string
  cpf: string
  email?: string
}

interface CitizenFamilyCompositionEnhancedProps {
  citizenId: string
  citizenName: string
  canEdit?: boolean
}

const NO_EDUCATION_VALUE = '__NO_EDUCATION__'

export function CitizenFamilyCompositionEnhanced({
  citizenId,
  citizenName,
  canEdit = true
}: CitizenFamilyCompositionEnhancedProps) {
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [invites, setInvites] = useState<FamilyInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)

  // Search citizens
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<CitizenOption[]>([])
  const [searching, setSearching] = useState(false)

  // Ref para debounce
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    memberId: '',
    relationship: '',
    isDependent: false,
    monthlyIncome: '',
    occupation: '',
    education: '',
    hasDisability: false,
  })

  const { toast } = useToast()

  useEffect(() => {
    loadFamily()
    loadInvites()
  }, [citizenId])

  const loadFamily = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/admin/citizens/${citizenId}/family`)

      if (response.success) {
        setFamily(response.data.family || [])
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

  const loadInvites = async () => {
    try {
      // Admin endpoint para ver convites de um cidadão
      const response = await apiRequest(`/admin/citizens/${citizenId}/family/invites`)

      if (response.success) {
        setInvites(response.data.invites || [])
      }
    } catch (error) {
      // Silenciar erro se endpoint não existir ainda
      console.log('Convites não disponíveis')
    }
  }

  const searchCitizens = useCallback(async (term: string) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    try {
      const response = await api.get(`/admin/citizens/search?q=${encodeURIComponent(term.trim())}`)

      if (response.data.success && response.data.data) {
        const results = Array.isArray(response.data.data)
          ? response.data.data
          : (response.data.data.citizens || [])

        // Filtrar membros que já fazem parte da família
        const familyMemberIds = family.map(f => f.member.id)
        const filtered = results.filter(
          (c: CitizenOption) => c.id !== citizenId && !familyMemberIds.includes(c.id)
        )
        setSearchResults(filtered)
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
  }, [citizenId, family, toast])

  const debouncedSearch = useCallback((term: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    searchTimerRef.current = setTimeout(() => {
      searchCitizens(term)
    }, 400)
  }, [searchCitizens])

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
          monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
          occupation: formData.occupation || undefined,
          education: formData.education || undefined,
          hasDisability: formData.hasDisability,
        }),
      })

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Membro adicionado à família',
        })

        setShowAddDialog(false)
        resetForm()
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

  const handleEditMember = async () => {
    if (!selectedMember) return

    try {
      const response = await apiRequest(`/admin/citizens/${citizenId}/family/${selectedMember.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isDependent: formData.isDependent,
          monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
          occupation: formData.occupation || undefined,
          education: formData.education || undefined,
          hasDisability: formData.hasDisability,
        }),
      })

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Informações atualizadas',
        })

        setShowEditDialog(false)
        setSelectedMember(null)
        resetForm()
        await loadFamily()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar',
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

  const openEditDialog = (member: FamilyMember) => {
    setSelectedMember(member)
    setFormData({
      memberId: member.member.id,
      relationship: member.relationship,
      isDependent: member.isDependent,
      monthlyIncome: member.monthlyIncome?.toString() || '',
      occupation: member.occupation || '',
      education: member.education || '',
      hasDisability: member.hasDisability || false,
    })
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setFormData({
      memberId: '',
      relationship: '',
      isDependent: false,
      monthlyIncome: '',
      occupation: '',
      education: '',
      hasDisability: false,
    })
    setSearchTerm('')
    setSearchResults([])
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, any> = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { label: 'Rejeitado', className: 'bg-red-100 text-red-800', icon: XCircle },
    }

    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
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
          <Tabs defaultValue="members" className="space-y-4">
            <TabsList>
              <TabsTrigger value="members">
                Membros ({family.length})
              </TabsTrigger>
              <TabsTrigger value="invites">
                Convites ({invites.length})
              </TabsTrigger>
            </TabsList>

            {/* Aba Membros */}
            <TabsContent value="members">
              {/* Chefe da Família */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                            <span className="text-lg">{getRelationshipEmoji(member.relationship)}</span>
                            <span className="font-medium text-gray-900">
                              {member.member.name}
                            </span>
                            <Badge variant="outline">{getRelationshipLabel(member.relationship)}</Badge>
                            {member.isDependent && (
                              <Badge variant="secondary">Dependente</Badge>
                            )}
                            {member.hasDisability && (
                              <Badge className="bg-purple-100 text-purple-800">PCD</Badge>
                            )}
                            {member.status && member.status !== 'ACTIVE' && getStatusBadge(member.status)}
                          </div>

                          <div className="text-sm text-gray-500 space-y-1">
                            <div>CPF: {member.member.cpf}</div>
                            {member.member.birthDate && (
                              <div>Idade: {calculateAge(member.member.birthDate)}</div>
                            )}
                            {member.occupation && <div>Ocupação: {member.occupation}</div>}
                            {member.monthlyIncome && (
                              <div>Renda: R$ {member.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            )}
                          </div>
                        </div>

                        {canEdit && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(member)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
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
                          </div>
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
            </TabsContent>

            {/* Aba Convites */}
            <TabsContent value="invites">
              {invites.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum convite enviado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {invite.name || invite.email}
                            </span>
                            {getStatusBadge(invite.status)}
                          </div>
                          <div className="text-sm text-gray-500">
                            <div>Email: {invite.email}</div>
                            <div>Relacionamento: {getRelationshipLabel(invite.relationship)}</div>
                            <div>Enviado em: {formatDate(invite.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Membro (mantém o código original) */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Membro da Família</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Buscar Cidadão */}
            <div>
              <Label htmlFor="searchCitizen">Buscar Cidadão *</Label>
              <div className="relative">
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

            {/* Relacionamento */}
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
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.emoji} {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dependente */}
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

            {/* Informações Adicionais */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Informações Adicionais (Opcional)</h3>

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
                  />
                </div>

                <div>
                  <Label htmlFor="occupation">Ocupação</Label>
                  <Input
                    id="occupation"
                    placeholder="Ex: Estudante, Aposentado, etc."
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="education">Escolaridade</Label>
                  <Select
                    value={formData.education}
                    onValueChange={(value) => setFormData({ ...formData, education: value })}
                  >
                    <SelectTrigger>
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
                  />
                  <Label htmlFor="hasDisability" className="cursor-pointer">
                    Possui deficiência
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Membro */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Informações do Membro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedMember && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="font-medium">{selectedMember.member.name}</p>
                <p className="text-sm text-gray-500">{selectedMember.member.cpf}</p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="editIsDependent"
                checked={formData.isDependent}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDependent: checked as boolean })
                }
              />
              <Label htmlFor="editIsDependent" className="cursor-pointer">
                É dependente financeiro
              </Label>
            </div>

            <div>
              <Label htmlFor="editMonthlyIncome">Renda Mensal (R$)</Label>
              <Input
                id="editMonthlyIncome"
                type="number"
                step="0.01"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="editOccupation">Ocupação</Label>
              <Input
                id="editOccupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="editEducation">Escolaridade</Label>
              <Select
                value={formData.education || NO_EDUCATION_VALUE}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    education: value === NO_EDUCATION_VALUE ? '' : value
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escolaridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_EDUCATION_VALUE}>Não informado</SelectItem>
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
                id="editHasDisability"
                checked={formData.hasDisability}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasDisability: checked as boolean })
                }
              />
              <Label htmlFor="editHasDisability" className="cursor-pointer">
                Possui deficiência
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedMember(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleEditMember}>Salvar Alterações</Button>
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
