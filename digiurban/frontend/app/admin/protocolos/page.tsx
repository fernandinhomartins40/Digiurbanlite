'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ServiceSelectorModal } from '@/components/admin/ServiceSelectorModal'
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  UserPlus,
  UserCheck,
  ArrowRightLeft,
  Users
} from 'lucide-react'
import { getPriorityLabel, getPriorityBadgeClass } from '@/lib/protocol-helpers'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { AssignProtocolDialog } from '@/components/protocols/AssignProtocolDialog'
import { DelegateProtocolDialog } from '@/components/protocols/DelegateProtocolDialog'
import { ForwardProtocolDialog } from '@/components/protocols/ForwardProtocolDialog'
import { AssignTeamDialog } from '@/components/protocols/AssignTeamDialog'

interface Protocol {
  id: string
  number: string
  title: string
  description?: string
  status: string
  priority: number // ✅ INT (1-5)
  createdAt: string
  updatedAt: string
  dueDate?: string
  concludedAt?: string
  citizen?: {
    id: string
    name: string
    cpf?: string
    email?: string
  }
  service?: {
    id: string
    name: string
    category?: string
  }
  department?: {
    id: string
    name: string
    code?: string
  }
  assignedUser?: {
    id: string
    name: string
    email?: string
    role?: string
  }
  createdBy?: {
    id: string
    name?: string
    role?: string
  }
  _count?: {
    history: number
  }
}

const statusLabels = {
  VINCULADO: 'Vinculado',
  PROGRESSO: 'Em Progresso',
  ATUALIZACAO: 'Atualização',
  CONCLUIDO: 'Concluído',
  PENDENCIA: 'Pendência'
}

const statusColors = {
  VINCULADO: 'bg-blue-100 text-blue-800',
  PROGRESSO: 'bg-yellow-100 text-yellow-800',
  ATUALIZACAO: 'bg-orange-100 text-orange-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  PENDENCIA: 'bg-red-100 text-red-800'
}


export default function ProtocolsPage() {
  const router = useRouter()
  const { user, apiRequest, loading: authLoading } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [assignComment, setAssignComment] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [showServiceSelectorModal, setShowServiceSelectorModal] = useState(false)

  // Estados para os novos diálogos de atribuição
  const [showAssignServerDialog, setShowAssignServerDialog] = useState(false)
  const [showDelegateDialog, setShowDelegateDialog] = useState(false)
  const [showForwardDialog, setShowForwardDialog] = useState(false)
  const [showAssignTeamDialog, setShowAssignTeamDialog] = useState(false)
  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(null)

  // Carregar protocolos
  const loadProtocols = async () => {
    try {
      setDataLoading(true)
      const params = new URLSearchParams()

      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await apiRequest(`/api/protocols?${params.toString()}`)
      // Extrair protocolos de forma consistente (pode vir em data.protocols ou response.protocols)
      const protocolsData = response.protocols || []
      setProtocols(protocolsData)
    } catch (error) {
      console.error('Erro ao carregar protocolos:', error)
      setProtocols([])
    } finally {
      setDataLoading(false)
    }
  }

  // Carregar membros da equipe para atribuição
  const loadTeamMembers = async () => {
    try {
      const response = await apiRequest('/api/admin/team')
      const teamData = response.teamMembers || response.data?.teamMembers || []
      setTeamMembers(teamData)
    } catch (error) {
      console.error('Erro ao carregar equipe:', error)
    }
  }

  // Atribuir protocolo
  const assignProtocol = async () => {
    if (!selectedProtocol || !selectedAssignee) return

    try {
      await apiRequest(`/api/protocols/${selectedProtocol.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignedUserId: selectedAssignee,
          comment: assignComment
        })
      })

      setShowAssignDialog(false)
      setSelectedAssignee('')
      setAssignComment('')
      await loadProtocols()
    } catch (error) {
      console.error('Erro ao atribuir protocolo:', error)
    }
  }

  // Atualizar status do protocolo
  const updateStatus = async (protocolId: string, newStatus: string) => {
    try {
      await apiRequest(`/api/protocols/${protocolId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          comment: `Status alterado para ${statusLabels[newStatus as keyof typeof statusLabels]}`
        })
      })

      await loadProtocols()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }


  // Carregar dados iniciais quando autenticação completa
  useEffect(() => {
    if (!authLoading && user) {
      loadProtocols()
      if (hasPermission('protocols:assign')) {
        loadTeamMembers()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (!authLoading && user) {
      loadProtocols()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, priorityFilter])

  // Guard: aguardar autenticação
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = protocol.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         protocol.citizen?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciador de Protocolos</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {user?.role === 'USER' ? 'Seus protocolos atribuídos' :
             user?.role === 'ADMIN' ? 'Todos os protocolos municipais' :
             'Protocolos do seu setor'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission('protocols:create') && (
            <Button onClick={() => setShowServiceSelectorModal(true)}>
              <AlertCircle className="h-4 w-4 mr-2" />
              Novo Protocolo
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, título ou cidadão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="VINCULADO">Vinculado</SelectItem>
                <SelectItem value="PROGRESSO">Em Progresso</SelectItem>
                <SelectItem value="ATUALIZACAO">Atualização</SelectItem>
                <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                <SelectItem value="PENDENCIA">Pendência</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="1">Muito Baixa</SelectItem>
                <SelectItem value="2">Baixa</SelectItem>
                <SelectItem value="3">Normal</SelectItem>
                <SelectItem value="4">Alta</SelectItem>
                <SelectItem value="5">Crítica</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Mais Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Protocolos */}
      {dataLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredProtocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold">#{protocol.number}</h3>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${statusColors[protocol.status as keyof typeof statusColors]}`}
                      >
                        {statusLabels[protocol.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`border text-xs ${getPriorityBadgeClass(protocol.priority)}`}
                      >
                        {getPriorityLabel(protocol.priority)}
                      </Badge>
                    </div>

                    <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 line-clamp-1">{protocol.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{protocol.description || 'Sem descrição'}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Cidadão:</span> {protocol.citizen?.name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Serviço:</span> {protocol.service?.name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Departamento:</span> {protocol.department?.name || 'N/A'}
                      </div>
                    </div>

                    {protocol.assignedUser && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Atribuído a:</span> {protocol.assignedUser.name}
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-400">
                        <span className="whitespace-nowrap">Criado em {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}</span>
                        {protocol.dueDate && (
                          <span className="flex items-center whitespace-nowrap">
                            <Calendar className="h-3 w-3 mr-1" />
                            Prazo: {new Date(protocol.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <span className="flex items-center whitespace-nowrap">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {protocol._count?.history || 0} interações
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row gap-2 w-full sm:w-auto shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/protocolos/${protocol.id}`)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="text-xs sm:text-sm">Detalhes</span>
                    </Button>

                    {hasPermission('protocols:assign') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveProtocolId(protocol.id)
                              setShowAssignServerDialog(true)
                            }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Atribuir Servidor</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveProtocolId(protocol.id)
                              setShowDelegateDialog(true)
                            }}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            <span>Delegar Temporário</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveProtocolId(protocol.id)
                              setShowForwardDialog(true)
                            }}
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            <span>Encaminhar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveProtocolId(protocol.id)
                              setShowAssignTeamDialog(true)
                            }}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            <span>Atribuir Equipe</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredProtocols.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">Nenhum protocolo encontrado com os filtros aplicados.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialog de Atribuição */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Protocolo</DialogTitle>
            <DialogDescription>
              Selecione um membro da equipe para atribuir este protocolo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="assignee">Membro da Equipe</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comment">Comentário (opcional)</Label>
              <Textarea
                id="comment"
                placeholder="Adicione instruções ou comentários..."
                value={assignComment}
                onChange={(e) => setAssignComment(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={assignProtocol} disabled={!selectedAssignee} className="w-full sm:w-auto">
                Atribuir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Seleção de Serviços */}
      <ServiceSelectorModal
        open={showServiceSelectorModal}
        onOpenChange={setShowServiceSelectorModal}
      />

      {/* Diálogos de Atribuição de Protocolos */}
      {activeProtocolId && (
        <>
          <AssignProtocolDialog
            open={showAssignServerDialog}
            onOpenChange={setShowAssignServerDialog}
            protocolId={activeProtocolId}
            departmentId={protocols.find(p => p.id === activeProtocolId)?.department?.id || ''}
            onSuccess={() => {
              setShowAssignServerDialog(false)
              setActiveProtocolId(null)
              loadProtocols()
            }}
          />

          <DelegateProtocolDialog
            open={showDelegateDialog}
            onOpenChange={setShowDelegateDialog}
            protocolId={activeProtocolId}
            onSuccess={() => {
              setShowDelegateDialog(false)
              setActiveProtocolId(null)
              loadProtocols()
            }}
          />

          <ForwardProtocolDialog
            open={showForwardDialog}
            onOpenChange={setShowForwardDialog}
            protocolId={activeProtocolId}
            onSuccess={() => {
              setShowForwardDialog(false)
              setActiveProtocolId(null)
              loadProtocols()
            }}
          />

          <AssignTeamDialog
            open={showAssignTeamDialog}
            onOpenChange={setShowAssignTeamDialog}
            protocolId={activeProtocolId}
            onSuccess={() => {
              setShowAssignTeamDialog(false)
              setActiveProtocolId(null)
              loadProtocols()
            }}
          />
        </>
      )}

      {/* Dialog de Visualização */}
      <Dialog open={!!selectedProtocol && !showAssignDialog} onOpenChange={(open) => !open && setSelectedProtocol(null)}>
        <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-3xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col mx-3 sm:mx-0">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Detalhes do Protocolo #{selectedProtocol?.number}</DialogTitle>
            <DialogDescription>
              Informações completas do protocolo
            </DialogDescription>
          </DialogHeader>

          {selectedProtocol && (
            <div className="space-y-6 overflow-y-auto flex-1">
              {/* Status e Prioridade */}
              <div className="flex items-center gap-4">
                <Badge
                  variant="secondary"
                  className={statusColors[selectedProtocol.status as keyof typeof statusColors]}
                >
                  {statusLabels[selectedProtocol.status as keyof typeof statusLabels]}
                </Badge>
                <Badge
                  variant="outline"
                  className={`border ${getPriorityBadgeClass(selectedProtocol.priority)}`}
                >
                  {getPriorityLabel(selectedProtocol.priority)}
                </Badge>
              </div>

              {/* Título e Descrição */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedProtocol.title}</h3>
                <p className="text-gray-600">{selectedProtocol.description || 'Sem descrição'}</p>
              </div>

              {/* Informações do Cidadão */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Cidadão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm sm:text-base">
                  <div>
                    <span className="font-medium">Nome:</span> {selectedProtocol.citizen?.name || 'N/A'}
                  </div>
                  {selectedProtocol.citizen?.cpf && (
                    <div>
                      <span className="font-medium">CPF:</span> {selectedProtocol.citizen.cpf}
                    </div>
                  )}
                  {selectedProtocol.citizen?.email && (
                    <div className="break-all">
                      <span className="font-medium">Email:</span> {selectedProtocol.citizen.email}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações do Serviço e Departamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">Serviço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base">{selectedProtocol.service?.name || 'N/A'}</p>
                    {selectedProtocol.service?.category && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">{selectedProtocol.service.category}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">Departamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base">{selectedProtocol.department?.name || 'N/A'}</p>
                    {selectedProtocol.department?.code && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Código: {selectedProtocol.department.code}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Atribuição */}
              {selectedProtocol.assignedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">Atribuído a</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm sm:text-base">
                    <div>
                      <span className="font-medium">Nome:</span> {selectedProtocol.assignedUser.name}
                    </div>
                    {selectedProtocol.assignedUser.email && (
                      <div className="break-all">
                        <span className="font-medium">Email:</span> {selectedProtocol.assignedUser.email}
                      </div>
                    )}
                    {selectedProtocol.assignedUser.role && (
                      <div>
                        <span className="font-medium">Cargo:</span> {selectedProtocol.assignedUser.role}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Datas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Cronologia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm gap-1 sm:gap-0">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                      <span className="font-medium">Criado em:</span>
                    </div>
                    <span className="sm:ml-2">{new Date(selectedProtocol.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  {selectedProtocol.updatedAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm gap-1 sm:gap-0">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                        <span className="font-medium">Atualizado em:</span>
                      </div>
                      <span className="sm:ml-2">{new Date(selectedProtocol.updatedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {selectedProtocol.dueDate && (
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm gap-1 sm:gap-0">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                        <span className="font-medium">Prazo:</span>
                      </div>
                      <span className="sm:ml-2">{new Date(selectedProtocol.dueDate).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {selectedProtocol.concludedAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm gap-1 sm:gap-0">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 shrink-0" />
                        <span className="font-medium">Concluído em:</span>
                      </div>
                      <span className="sm:ml-2">{new Date(selectedProtocol.concludedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico */}
              {selectedProtocol._count && selectedProtocol._count.history > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base">Interações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-xs sm:text-sm">
                      <MessageSquare className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                      <span>{selectedProtocol._count.history} interações registradas</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-end flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setSelectedProtocol(null)} className="w-full sm:w-auto">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}