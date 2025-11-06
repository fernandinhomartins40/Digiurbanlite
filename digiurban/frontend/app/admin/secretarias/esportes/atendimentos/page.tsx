'use client';

import { ModulePageTemplate } from '@/components/admin/modules/ModulePageTemplate';
import { PendingProtocolsList } from '@/components/admin/modules/PendingProtocolsList';
import { sportsAttendanceConfig } from '@/lib/module-configs/esportes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AtendimentosEsportesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Atendimentos Esportivos</h1>
        <p className="text-muted-foreground">
          Gestão de atendimentos gerais da Secretaria de Esportes
        </p>
      </div>

      <Tabs defaultValue="cadastrados" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cadastrados">Atendimentos Cadastrados</TabsTrigger>
          <TabsTrigger value="pendentes">Aguardando Aprovação</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastrados" className="mt-6">
          <ModulePageTemplate
            config={sportsAttendanceConfig}
            departmentType="esportes"
          />
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          <PendingProtocolsList
            moduleType="ATENDIMENTOS_ESPORTES"
            moduleName="Atendimentos Esportivos"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========== CÓDIGO LEGADO ABAIXO (DELETAR FUTURAMENTE) ==========
/*
interface AtendimentoEsporte {
  id: string
  protocolo: string
  tipoAtendimento: 'Inscrição de Atleta' | 'Reserva de Espaço Esportivo' | 'Apoio a Eventos' | 'Informações Esportivas' | 'Filiação de Equipe' | 'Solicitação de Material' | 'Apoio Técnico'
  solicitante: {
    nome: string
    cpf?: string
    telefone: string
    email?: string
    endereco: string
    bairro: string
    idade?: number
    categoria?: string
  }
  detalhes: {
    modalidade?: string
    categoria?: string
    nivel?: 'Iniciante' | 'Intermediário' | 'Avançado' | 'Competitivo'
    objetivo?: string
    observacoes?: string
    equipamento?: string
    dataEvento?: string
    localDesejado?: string
  }
  status: 'Recebido' | 'Em Análise' | 'Aprovado' | 'Agendado' | 'Concluído' | 'Cancelado'
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente'
  agendamento?: {
    data: string
    hora: string
    local: string
    responsavel: string
    duracao?: string
  }
  documentos?: {
    required: string[]
    submitted: string[]
    pending: string[]
  }
  pagamento?: {
    valor: number
    status: 'Isento' | 'Pendente' | 'Pago' | 'Vencido'
    vencimento?: string
  }
  responsavel: string
  dataRegistro: string
  dataUltimaAtualizacao: string
  observacoes?: string
  avaliacaoSatisfacao?: number
}

const mockAtendimentos: AtendimentoEsporte[] = [
  {
    id: '1',
    protocolo: 'ESP-ATD-2024-001',
    tipoAtendimento: 'Inscrição de Atleta',
    solicitante: {
      nome: 'Carlos Silva Santos',
      cpf: '123.456.789-00',
      telefone: '(11) 98765-4321',
      email: 'carlos.silva@email.com',
      endereco: 'Rua das Flores, 123',
      bairro: 'Centro',
      idade: 25,
      categoria: 'Adulto'
    },
    detalhes: {
      modalidade: 'Futebol',
      categoria: 'Adulto Masculino',
      nivel: 'Competitivo',
      objetivo: 'Integrar equipe municipal de futebol para competições regionais',
      observacoes: 'Experiência anterior em times amadores'
    },
    status: 'Aprovado',
    prioridade: 'Média',
    agendamento: {
      data: '2024-01-18',
      hora: '15:00',
      local: 'Campo Municipal 1',
      responsavel: 'Prof. João Técnico',
      duracao: '2 horas'
    },
    documentos: {
      required: ['CPF', 'RG', 'Atestado Médico', 'Foto 3x4'],
      submitted: ['CPF', 'RG', 'Foto 3x4'],
      pending: ['Atestado Médico']
    },
    pagamento: {
      valor: 50,
      status: 'Pendente',
      vencimento: '2024-01-20'
    },
    responsavel: 'Coordenador de Esportes - Ana Costa',
    dataRegistro: '2024-01-15',
    dataUltimaAtualizacao: '2024-01-16',
    observacoes: 'Candidato com bom perfil para equipe principal'
  },
  {
    id: '2',
    protocolo: 'ESP-ATD-2024-002',
    tipoAtendimento: 'Reserva de Espaço Esportivo',
    solicitante: {
      nome: 'Associação de Moradores Vila Nova',
      telefone: '(11) 91234-5678',
      email: 'contato@amvn.org.br',
      endereco: 'Av. Principal, 456',
      bairro: 'Vila Nova'
    },
    detalhes: {
      modalidade: 'Voleibol',
      objetivo: 'Organizar torneio interno da associação de moradores',
      dataEvento: '2024-01-25',
      localDesejado: 'Quadra Poliesportiva Municipal',
      observacoes: 'Evento beneficente com participação de 8 equipes'
    },
    status: 'Concluído',
    prioridade: 'Alta',
    agendamento: {
      data: '2024-01-25',
      hora: '08:00',
      local: 'Quadra Poliesportiva Municipal',
      responsavel: 'Gestor de Equipamentos - Pedro Lima',
      duracao: '8 horas'
    },
    documentos: {
      required: ['CNPJ', 'Projeto do Evento', 'Seguro'],
      submitted: ['CNPJ', 'Projeto do Evento', 'Seguro'],
      pending: []
    },
    pagamento: {
      valor: 0,
      status: 'Isento'
    },
    responsavel: 'Coordenador de Equipamentos - Maria Santos',
    dataRegistro: '2024-01-10',
    dataUltimaAtualizacao: '2024-01-25',
    observacoes: 'Evento realizado com sucesso, 120 participantes',
    avaliacaoSatisfacao: 5
  }
]

export default function AtendimentosEsportesPage() {
  const { user } = useAdminAuth()
  const [atendimentos, setAtendimentos] = useState<AtendimentoEsporte[]>(mockAtendimentos)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('all')
  const [showNewAtendimentoModal, setShowNewAtendimentoModal] = useState(false)

  const filteredAtendimentos = atendimentos.filter(atendimento => {
    const matchesSearch = atendimento.solicitante.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atendimento.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         atendimento.tipoAtendimento.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || atendimento.status === statusFilter
    const matchesTipo = tipoFilter === 'all' || atendimento.tipoAtendimento === tipoFilter
    const matchesPrioridade = prioridadeFilter === 'all' || atendimento.prioridade === prioridadeFilter
    return matchesSearch && matchesStatus && matchesTipo && matchesPrioridade
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Recebido': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Em Análise': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Aprovado': return 'bg-green-100 text-green-800 border-green-200'
      case 'Agendado': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Concluído': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'Baixa': return 'bg-green-100 text-green-800 border-green-200'
      case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Urgente': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPagamentoColor = (status: string) => {
    switch (status) {
      case 'Isento': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Pago': return 'bg-green-100 text-green-800 border-green-200'
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Vencido': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const stats = {
    totalAtendimentos: atendimentos.length,
    emAndamento: atendimentos.filter(a => ['Recebido', 'Em Análise', 'Aprovado', 'Agendado'].includes(a.status)).length,
    concluidos: atendimentos.filter(a => a.status === 'Concluído').length,
    urgentes: atendimentos.filter(a => a.prioridade === 'Urgente').length
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-8 w-8 text-blue-600" />
            Atendimentos - Esportes
          </h1>
          <p className="text-gray-600 mt-1">
            Central de atendimentos para inscrições, reservas e serviços esportivos
          </p>
        </div>
        <Button onClick={() => setShowNewAtendimentoModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Atendimento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAtendimentos}</div>
            <p className="text-xs text-muted-foreground">este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.emAndamento}</div>
            <p className="text-xs text-muted-foreground">processando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.concluidos}</div>
            <p className="text-xs text-muted-foreground">finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgentes}</div>
            <p className="text-xs text-muted-foreground">alta prioridade</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por solicitante, protocolo ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Recebido">Recebido</SelectItem>
                <SelectItem value="Em Análise">Em Análise</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Inscrição de Atleta">Inscrição de Atleta</SelectItem>
                <SelectItem value="Reserva de Espaço Esportivo">Reserva de Espaço</SelectItem>
                <SelectItem value="Apoio a Eventos">Apoio a Eventos</SelectItem>
                <SelectItem value="Informações Esportivas">Informações</SelectItem>
                <SelectItem value="Filiação de Equipe">Filiação de Equipe</SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredAtendimentos.map((atendimento) => (
          <Card key={atendimento.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{atendimento.protocolo}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    {atendimento.solicitante.nome}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPrioridadeColor(atendimento.prioridade)}>
                    {atendimento.prioridade}
                  </Badge>
                  <Badge className={getStatusColor(atendimento.status)}>
                    {atendimento.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Solicitante
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Nome:</strong> {atendimento.solicitante.nome}</p>
                      {atendimento.solicitante.cpf && (
                        <p><strong>CPF:</strong> {atendimento.solicitante.cpf}</p>
                      )}
                      <p><strong>Telefone:</strong> {atendimento.solicitante.telefone}</p>
                      {atendimento.solicitante.email && (
                        <p><strong>Email:</strong> {atendimento.solicitante.email}</p>
                      )}
                      <p><strong>Endereço:</strong> {atendimento.solicitante.endereco}</p>
                      <p><strong>Bairro:</strong> {atendimento.solicitante.bairro}</p>
                      {atendimento.solicitante.idade && (
                        <p><strong>Idade:</strong> {atendimento.solicitante.idade} anos</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Detalhes do Atendimento
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Tipo:</strong> {atendimento.tipoAtendimento}</p>
                      {atendimento.detalhes.modalidade && (
                        <p><strong>Modalidade:</strong> {atendimento.detalhes.modalidade}</p>
                      )}
                      {atendimento.detalhes.categoria && (
                        <p><strong>Categoria:</strong> {atendimento.detalhes.categoria}</p>
                      )}
                      {atendimento.detalhes.nivel && (
                        <p><strong>Nível:</strong> {atendimento.detalhes.nivel}</p>
                      )}
                      {atendimento.detalhes.objetivo && (
                        <p><strong>Objetivo:</strong> {atendimento.detalhes.objetivo}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {atendimento.agendamento && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Agendamento
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Data:</strong> {new Date(atendimento.agendamento.data).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Hora:</strong> {atendimento.agendamento.hora}</p>
                        <p><strong>Local:</strong> {atendimento.agendamento.local}</p>
                        <p><strong>Responsável:</strong> {atendimento.agendamento.responsavel}</p>
                        {atendimento.agendamento.duracao && (
                          <p><strong>Duração:</strong> {atendimento.agendamento.duracao}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {atendimento.documentos && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-2">
                        Documentos
                      </h4>
                      <div className="space-y-2">
                        {atendimento.documentos.submitted.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-1">Entregues:</p>
                            <div className="flex flex-wrap gap-1">
                              {atendimento.documentos.submitted.map((doc, index) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  {doc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {atendimento.documentos.pending.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">Pendentes:</p>
                            <div className="flex flex-wrap gap-1">
                              {atendimento.documentos.pending.map((doc, index) => (
                                <Badge key={index} variant="secondary" className="text-xs bg-red-100 text-red-800">
                                  {doc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {atendimento.pagamento && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-2">
                        Pagamento
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between items-center">
                          <span>Valor:</span>
                          <span className="font-bold">
                            {atendimento.pagamento.valor === 0 ? 'Gratuito' : `R$ ${atendimento.pagamento.valor.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Status:</span>
                          <Badge className={getPagamentoColor(atendimento.pagamento.status)}>
                            {atendimento.pagamento.status}
                          </Badge>
                        </div>
                        {atendimento.pagamento.vencimento && (
                          <p><strong>Vencimento:</strong> {new Date(atendimento.pagamento.vencimento).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">
                      Informações do Processo
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Responsável:</strong> {atendimento.responsavel}</p>
                      <p><strong>Registro:</strong> {new Date(atendimento.dataRegistro).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Atualização:</strong> {new Date(atendimento.dataUltimaAtualizacao).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {atendimento.avaliacaoSatisfacao && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-2">
                        Avaliação
                      </h4>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${star <= atendimento.avaliacaoSatisfacao! ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          ({atendimento.avaliacaoSatisfacao}/5)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(atendimento.detalhes.observacoes || atendimento.observacoes) && (
                <div className="mt-6 pt-4 border-t">
                  {atendimento.detalhes.observacoes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">Observações do Solicitante</h4>
                      <p className="text-sm text-gray-600">{atendimento.detalhes.observacoes}</p>
                    </div>
                  )}
                  {atendimento.observacoes && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-2">Observações da Equipe</h4>
                      <p className="text-sm text-gray-600">{atendimento.observacoes}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  Contatar
                </Button>
                {atendimento.agendamento && (
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    Ver Local
                  </Button>
                )}
                {atendimento.status !== 'Concluído' && atendimento.status !== 'Cancelado' && (
                  <Button size="sm">
                    <Trophy className="h-4 w-4 mr-1" />
                    Gerenciar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Serviços Gerados Automaticamente
          </CardTitle>
          <CardDescription>
            Esta página gera automaticamente os seguintes serviços para o catálogo público:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-700 mb-2">Inscrição de Atleta</h4>
              <p className="text-sm text-gray-600">
                Permite que cidadãos se inscrevam em modalidades esportivas oferecidas pelo município para diferentes categorias e níveis.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-700 mb-2">Reserva de Espaço Esportivo</h4>
              <p className="text-sm text-gray-600">
                Sistema de reserva online de quadras, campos e espaços esportivos municipais para eventos e atividades.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-700 mb-2">Apoio a Eventos</h4>
              <p className="text-sm text-gray-600">
                Solicitação de apoio municipal para organização de eventos esportivos, incluindo infraestrutura e pessoal técnico.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-green-700 mb-2">Informações Esportivas</h4>
              <p className="text-sm text-gray-600">
                Central de informações sobre modalidades, horários, locais e programas esportivos disponíveis no município.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
*/