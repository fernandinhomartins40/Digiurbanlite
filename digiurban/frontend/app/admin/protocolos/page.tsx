'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CitizenAutocomplete } from '@/components/admin/CitizenAutocomplete'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  Filter,
  Eye,
  UserPlus,
  MessageSquare,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpDown
} from 'lucide-react'
import { getPriorityLabel, getPriorityBadgeClass } from '@/lib/protocol-helpers'

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

interface Service {
  id: string
  name: string
  description?: string
  category?: string
  departmentId?: string
  department?: {
    id: string
    name: string
  }
  isActive: boolean
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
  const { toast } = useToast()
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [assignComment, setAssignComment] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [showNewProtocolDialog, setShowNewProtocolDialog] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [departments, setDepartments] = useState([])
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null)
  const [newProtocol, setNewProtocol] = useState({
    serviceId: '',
    departmentId: '',
    description: '',
    priority: 3 // Normal = 3
  })

  // Carregar protocolos
  const loadProtocols = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  // Carregar membros da equipe para atribuição
  const loadTeamMembers = async () => {
    try {
      const response = await apiRequest('/admin/management/team')
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

  // Carregar serviços ativos
  const loadServices = async () => {
    try {
      const data = await apiRequest('/api/services?isActive=true')
      // Filtrar apenas serviços ativos
      const activeServices = (data.data || []).filter((service: any) => service.isActive)
      setServices(activeServices)
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  // Carregar departamentos
  const loadDepartments = async () => {
    try {
      const response = await apiRequest('/admin/management/departments')
      const departmentsData = response.departments || response.data?.departments || []
      setDepartments(departmentsData)
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    }
  }

  // Criar novo protocolo
  const createProtocol = async () => {
    // Validação dos campos obrigatórios
    if (!selectedCitizen || !newProtocol.serviceId || !newProtocol.departmentId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, selecione o cidadão, serviço e departamento.',
        variant: 'destructive',
      })
      return
    }

    try {
      await apiRequest('/api/protocols', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: newProtocol.serviceId,
          citizenData: {
            cpf: selectedCitizen.cpf,
            name: selectedCitizen.name,
            email: selectedCitizen.email,
            phone: selectedCitizen.phone
          },
          formData: {
            description: newProtocol.description,
            priority: newProtocol.priority,
          }
        })
      })

      toast({
        title: 'Protocolo criado',
        description: 'O protocolo foi criado com sucesso.',
      })

      setShowNewProtocolDialog(false)
      setSelectedCitizen(null)
      setNewProtocol({
        serviceId: '',
        departmentId: '',
        description: '',
        priority: 3
      })
      await loadProtocols()
    } catch (error) {
      console.error('Erro ao criar protocolo:', error)
      toast({
        title: 'Erro ao criar protocolo',
        description: 'Ocorreu um erro ao criar o protocolo. Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    // Só carregar dados quando autenticação estiver completa e usuário existir
    if (authLoading || !user) {
      return
    }

    // Token agora vem via httpOnly cookie, não precisa verificar localStorage
    loadProtocols()
    if (hasPermission('protocols:assign')) {
      loadTeamMembers()
    }
    if (hasPermission('protocols:create')) {
      loadServices()
      loadDepartments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, searchTerm, statusFilter, priorityFilter])

  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = protocol.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         protocol.citizen?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciador de Protocolos</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'USER' ? 'Seus protocolos atribuídos' :
             user?.role === 'ADMIN' ? 'Todos os protocolos municipais' :
             'Protocolos do seu setor'}
          </p>
        </div>
        <div className="flex space-x-2">
          {hasPermission('protocols:create') && (
            <Dialog open={showNewProtocolDialog} onOpenChange={setShowNewProtocolDialog}>
              <DialogTrigger asChild>
                <Button>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Novo Protocolo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[calc(100vh-4rem)] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Criar Novo Protocolo</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo protocolo em nome de um cidadão
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 overflow-y-auto flex-1">
                  <CitizenAutocomplete
                    value={selectedCitizen}
                    onChange={setSelectedCitizen}
                    label="Cidadão"
                    placeholder="Digite o nome do cidadão..."
                    required
                  />

                  <div className="space-y-2">
                    <Label htmlFor="serviceId">Serviço *</Label>
                    <Select
                      value={newProtocol.serviceId}
                      onValueChange={(value) => {
                        // Encontrar o serviço selecionado
                        const selectedService = services.find((s: any) => s.id === value)
                        // Auto-preencher o departamento com o departamento do serviço
                        const deptId = selectedService?.department?.id || selectedService?.departmentId
                        setNewProtocol({
                          ...newProtocol,
                          serviceId: value,
                          departmentId: deptId || newProtocol.departmentId
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={services.length === 0 ? "Nenhum serviço disponível" : "Selecione um serviço"} />
                      </SelectTrigger>
                      <SelectContent>
                        {services.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500 text-center">
                            Nenhum serviço cadastrado. Vá para Catálogo de Serviços para adicionar.
                          </div>
                        ) : (
                          services.map((service: any) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {services.length > 0 && (
                      <p className="text-xs text-gray-500">{services.length} serviços ativos disponíveis</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Departamento *</Label>
                    <Select
                      value={newProtocol.departmentId}
                      onValueChange={(value) => setNewProtocol({ ...newProtocol, departmentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={String(newProtocol.priority)}
                      onValueChange={(value) => setNewProtocol({ ...newProtocol, priority: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Muito Baixa</SelectItem>
                        <SelectItem value="2">Baixa</SelectItem>
                        <SelectItem value="3">Normal</SelectItem>
                        <SelectItem value="4">Alta</SelectItem>
                        <SelectItem value="5">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva a solicitação do cidadão..."
                      value={newProtocol.description}
                      onChange={(e) => setNewProtocol({ ...newProtocol, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 flex-shrink-0 border-t pt-4">
                  <Button variant="outline" onClick={() => setShowNewProtocolDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createProtocol}>
                    Criar Protocolo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProtocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold">#{protocol.number}</h3>
                      <Badge
                        variant="secondary"
                        className={statusColors[protocol.status as keyof typeof statusColors]}
                      >
                        {statusLabels[protocol.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`border ${getPriorityBadgeClass(protocol.priority)}`}
                      >
                        {getPriorityLabel(protocol.priority)}
                      </Badge>
                    </div>

                    <h4 className="font-medium text-gray-900 mb-1">{protocol.title}</h4>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{protocol.description || 'Sem descrição'}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
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

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>Criado em {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}</span>
                        {protocol.dueDate && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Prazo: {new Date(protocol.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <span className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {protocol._count?.history || 0} interações
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/protocolos/${protocol.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>

                    {hasPermission('protocols:assign') && !protocol.assignedUser && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedProtocol(protocol)
                          setShowAssignDialog(true)
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Atribuir
                      </Button>
                    )}

                    {hasPermission('protocols:update') && protocol.status !== 'CONCLUIDO' && (
                      <Select onValueChange={(value) => updateStatus(protocol.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Alterar Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROGRESSO">Em Progresso</SelectItem>
                          <SelectItem value="ATUALIZACAO">Atualização</SelectItem>
                          <SelectItem value="CONCLUIDO">Concluir</SelectItem>
                          <SelectItem value="PENDENCIA">Pendência</SelectItem>
                        </SelectContent>
                      </Select>
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

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={assignProtocol} disabled={!selectedAssignee}>
                Atribuir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={!!selectedProtocol && !showAssignDialog} onOpenChange={(open) => !open && setSelectedProtocol(null)}>
        <DialogContent className="max-w-3xl max-h-[calc(100vh-4rem)] flex flex-col">
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
                  <CardTitle className="text-base">Cidadão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Nome:</span> {selectedProtocol.citizen?.name || 'N/A'}
                  </div>
                  {selectedProtocol.citizen?.cpf && (
                    <div>
                      <span className="font-medium">CPF:</span> {selectedProtocol.citizen.cpf}
                    </div>
                  )}
                  {selectedProtocol.citizen?.email && (
                    <div>
                      <span className="font-medium">Email:</span> {selectedProtocol.citizen.email}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informações do Serviço e Departamento */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Serviço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{selectedProtocol.service?.name || 'N/A'}</p>
                    {selectedProtocol.service?.category && (
                      <p className="text-sm text-gray-500 mt-1">{selectedProtocol.service.category}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Departamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{selectedProtocol.department?.name || 'N/A'}</p>
                    {selectedProtocol.department?.code && (
                      <p className="text-sm text-gray-500 mt-1">Código: {selectedProtocol.department.code}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Atribuição */}
              {selectedProtocol.assignedUser && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Atribuído a</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-medium">Nome:</span> {selectedProtocol.assignedUser.name}
                    </div>
                    {selectedProtocol.assignedUser.email && (
                      <div>
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
                  <CardTitle className="text-base">Cronologia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">Criado em:</span>
                    <span className="ml-2">{new Date(selectedProtocol.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  {selectedProtocol.updatedAt && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">Atualizado em:</span>
                      <span className="ml-2">{new Date(selectedProtocol.updatedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {selectedProtocol.dueDate && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">Prazo:</span>
                      <span className="ml-2">{new Date(selectedProtocol.dueDate).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                  {selectedProtocol.concludedAt && (
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      <span className="font-medium">Concluído em:</span>
                      <span className="ml-2">{new Date(selectedProtocol.concludedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico */}
              {selectedProtocol._count && selectedProtocol._count.history > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Interações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm">
                      <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedProtocol._count.history} interações registradas</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-end flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setSelectedProtocol(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}