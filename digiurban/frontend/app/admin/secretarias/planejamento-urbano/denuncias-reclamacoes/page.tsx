'use client'

import { useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import {
  AlertTriangle, MapPin, Camera, Search, Plus, Edit, Download, Clock, User,
  CheckCircle, AlertCircle, XCircle, Eye, Calendar, Phone, Mail,
  Target, Flag, Award, TrendingUp, Activity, Users, Building, Shield
} from 'lucide-react'

export default function DenunciasReclamacoesPage() {
  useAdminAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingDenuncia, setEditingDenuncia] = useState<any>(null)

  const [denuncias] = useState([
    {
      id: 1,
      protocolo: 'DEN-2024-001',
      tipo: 'construcao_irregular',
      titulo: 'Construção sem alvará - Rua das Flores',
      denunciante: 'Maria Silva (anônimo)',
      telefone: '(11) 98765-4321',
      email: 'maria.silva@email.com',
      endereco: 'Rua das Flores, 456 - Centro',
      descricao: 'Construção de muro e ampliação da casa sem alvará de construção. Obra em andamento há 2 meses.',
      status: 'em_investigacao',
      prioridade: 'alta',
      dataAbertura: '2024-06-18',
      prazoVistoria: '2024-06-25',
      fiscal: 'Pedro Lima',
      observacoes: 'Agendada vistoria para verificação da irregularidade. Proprietário será notificado.',
      categoria: 'fiscalizacao',
      localizacao: 'Centro',
      fotos: ['foto1.jpg', 'foto2.jpg'],
      multa: 0,
      notificacoes: []
    },
    {
      id: 2,
      protocolo: 'DEN-2024-002',
      tipo: 'reclamacao_vizinhanca',
      titulo: 'Reclamação sobre altura de muro',
      denunciante: 'João Santos',
      telefone: '(11) 99876-5432',
      email: 'joao.santos@email.com',
      endereco: 'Av. Principal, 123 - Jardim',
      descricao: 'Vizinho construiu muro com altura superior ao permitido (2,5m), bloqueando ventilação e iluminação.',
      status: 'resolvido',
      prioridade: 'media',
      dataAbertura: '2024-06-15',
      prazoVistoria: '2024-06-22',
      fiscal: 'Ana Costa',
      observacoes: 'Vistoria realizada. Proprietário adequou altura do muro para 2,0m conforme legislação.',
      categoria: 'vizinhanca',
      localizacao: 'Jardim',
      fotos: ['foto3.jpg'],
      multa: 0,
      notificacoes: ['Notificação de adequação', 'Termo de compromisso']
    },
    {
      id: 3,
      protocolo: 'DEN-2024-003',
      tipo: 'uso_irregular',
      titulo: 'Funcionamento irregular de comércio',
      denunciante: 'Anônimo',
      telefone: 'Não informado',
      email: 'anonimo@denuncia.com',
      endereco: 'Rua dos Esportes, 789 - Vila Nova',
      descricao: 'Estabelecimento funcionando como oficina mecânica em área residencial sem licença de funcionamento.',
      status: 'autuado',
      prioridade: 'alta',
      dataAbertura: '2024-06-20',
      prazoVistoria: '2024-06-27',
      fiscal: 'Carlos Silva',
      observacoes: 'Irregularidade confirmada. Estabelecimento autuado e multado. Prazo para adequação: 30 dias.',
      categoria: 'fiscalizacao',
      localizacao: 'Vila Nova',
      fotos: ['foto4.jpg', 'foto5.jpg', 'foto6.jpg'],
      multa: 2500,
      notificacoes: ['Auto de infração', 'Multa aplicada', 'Notificação para adequação']
    }
  ])

  const [novaDenuncia, setNovaDenuncia] = useState({
    tipo: '',
    titulo: '',
    denunciante: '',
    telefone: '',
    email: '',
    endereco: '',
    descricao: '',
    prioridade: '',
    categoria: '',
    localizacao: ''
  })

  const estatisticasDenuncias = [
    { tipo: 'Construção Irregular', abertas: 45, resolvidas: 32, multas: 8 },
    { tipo: 'Reclamação Vizinhança', abertas: 38, resolvidas: 35, multas: 0 },
    { tipo: 'Uso Irregular', abertas: 28, resolvidas: 20, multas: 15 },
    { tipo: 'Fiscalização Urbana', abertas: 22, resolvidas: 18, multas: 12 },
    { tipo: 'Perturbação Sossego', abertas: 15, resolvidas: 14, multas: 2 },
    { tipo: 'Outros', abertas: 12, resolvidas: 10, multas: 3 }
  ]

  const statusDistribuicao = [
    { name: 'Em Investigação', value: 48, color: '#3B82F6' },
    { name: 'Resolvidas', value: 129, color: '#22C55E' },
    { name: 'Autuadas', value: 40, color: '#EF4444' },
    { name: 'Arquivadas', value: 18, color: '#6B7280' }
  ]

  const denunciasMensais = [
    { mes: 'Jan', denuncias: 18, resolvidas: 15 },
    { mes: 'Fev', denuncias: 22, resolvidas: 20 },
    { mes: 'Mar', denuncias: 28, resolvidas: 24 },
    { mes: 'Abr', denuncias: 25, resolvidas: 22 },
    { mes: 'Mai', denuncias: 32, resolvidas: 28 },
    { mes: 'Jun', denuncias: 35, resolvidas: 30 }
  ]

  const filteredDenuncias = denuncias.filter(denuncia => {
    const matchesSearch = denuncia.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         denuncia.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         denuncia.denunciante.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || denuncia.status === statusFilter
    const matchesTipo = tipoFilter === 'todos' || denuncia.tipo === tipoFilter
    return matchesSearch && matchesStatus && matchesTipo
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowForm(false)
    setNovaDenuncia({
      tipo: '',
      titulo: '',
      denunciante: '',
      telefone: '',
      email: '',
      endereco: '',
      descricao: '',
      prioridade: '',
      categoria: '',
      localizacao: ''
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_investigacao':
        return <Badge className="bg-blue-100 text-blue-800">Em Investigação</Badge>
      case 'resolvido':
        return <Badge className="bg-green-100 text-green-800">Resolvido</Badge>
      case 'autuado':
        return <Badge className="bg-red-100 text-red-800">Autuado</Badge>
      case 'arquivado':
        return <Badge className="bg-gray-100 text-gray-800">Arquivado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Alta</Badge>
      case 'media':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Média</Badge>
      case 'baixa':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Baixa</Badge>
      default:
        return <Badge>{prioridade}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'construcao_irregular':
        return <Badge className="bg-red-100 text-red-800"><Building className="w-3 h-3 mr-1" />Construção Irregular</Badge>
      case 'reclamacao_vizinhanca':
        return <Badge className="bg-yellow-100 text-yellow-800"><Users className="w-3 h-3 mr-1" />Reclamação Vizinhança</Badge>
      case 'uso_irregular':
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Uso Irregular</Badge>
      case 'fiscalizacao_urbana':
        return <Badge className="bg-blue-100 text-blue-800"><Flag className="w-3 h-3 mr-1" />Fiscalização Urbana</Badge>
      default:
        return <Badge>{tipo}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Denúncias e Reclamações</h1>
          <p className="text-gray-600">Canal para irregularidades urbanísticas e fiscalização municipal</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Denúncia
        </Button>
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="denuncias">Denúncias</TabsTrigger>
          <TabsTrigger value="fiscalizacao">Fiscalização</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Denúncias</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">235</div>
                <p className="text-xs text-muted-foreground">+35 este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">129</div>
                <p className="text-xs text-muted-foreground">55% do total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Investigação</CardTitle>
                <Eye className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">48</div>
                <p className="text-xs text-muted-foreground">20% do total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Multas Aplicadas</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">40</div>
                <p className="text-xs text-muted-foreground">R$ 158k arrecadados</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Denúncias por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={estatisticasDenuncias}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="abertas" fill="#3B82F6" name="Abertas" />
                    <Bar dataKey="resolvidas" fill="#22C55E" name="Resolvidas" />
                    <Bar dataKey="multas" fill="#EF4444" name="Multadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribuicao}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribuicao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal de Denúncias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={denunciasMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="denuncias" stroke="#EF4444" name="Denúncias" />
                  <Line type="monotone" dataKey="resolvidas" stroke="#22C55E" name="Resolvidas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="denuncias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar denúncias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="em_investigacao">Em Investigação</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                    <SelectItem value="autuado">Autuado</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Tipos</SelectItem>
                    <SelectItem value="construcao_irregular">Construção Irregular</SelectItem>
                    <SelectItem value="reclamacao_vizinhanca">Reclamação Vizinhança</SelectItem>
                    <SelectItem value="uso_irregular">Uso Irregular</SelectItem>
                    <SelectItem value="fiscalizacao_urbana">Fiscalização Urbana</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {filteredDenuncias.map((denuncia) => (
              <Card key={denuncia.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">{denuncia.protocolo}</h3>
                          {getStatusBadge(denuncia.status)}
                          {getPrioridadeBadge(denuncia.prioridade)}
                          {getTipoBadge(denuncia.tipo)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{denuncia.titulo}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{denuncia.denunciante}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{denuncia.endereco}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Aberta em {denuncia.dataAbertura}</span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p><strong>Descrição:</strong> {denuncia.descricao}</p>
                          <p><strong>Fiscal Responsável:</strong> {denuncia.fiscal}</p>
                          <p><strong>Localização:</strong> {denuncia.localizacao}</p>
                          {denuncia.observacoes && (
                            <p><strong>Observações:</strong> {denuncia.observacoes}</p>
                          )}
                        </div>
                        {denuncia.notificacoes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-blue-600">Notificações Emitidas:</h4>
                            <ul className="text-sm text-blue-600 list-disc list-inside">
                              {denuncia.notificacoes.map((notificacao, index) => (
                                <li key={index}>{notificacao}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Categoria: {denuncia.categoria}
                          </Badge>
                          <Badge variant="outline">
                            Fotos: {denuncia.fotos.length}
                          </Badge>
                          {denuncia.multa > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              Multa: R$ {denuncia.multa.toLocaleString()}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            Prazo Vistoria: {denuncia.prazoVistoria}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingDenuncia(denuncia)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fiscalizacao" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fiscais em Campo</CardTitle>
                <CardDescription>Equipe de fiscalização ativa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Pedro Lima</h4>
                      <p className="text-sm text-gray-600">Região Centro - 8 casos ativos</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Disponível</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Ana Costa</h4>
                      <p className="text-sm text-gray-600">Região Jardim - 6 casos ativos</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Em Vistoria</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Carlos Silva</h4>
                      <p className="text-sm text-gray-600">Região Vila Nova - 12 casos ativos</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Relatório</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Fiscalização</CardTitle>
                <CardDescription>Performance da equipe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Vistorias Realizadas (Mês)</span>
                    <Badge className="bg-blue-100 text-blue-800">87</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Resolução</span>
                    <Badge className="bg-green-100 text-green-800">55%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Multas Aplicadas</span>
                    <Badge className="bg-red-100 text-red-800">40</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tempo Médio Resposta</span>
                    <Badge className="bg-purple-100 text-purple-800">5 dias</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Arrecadação (Multas)</span>
                    <Badge className="bg-green-100 text-green-800">R$ 158.400</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas - Fiscalização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <AlertTriangle className="w-6 h-6" />
                  <span className="text-sm">Nova Denúncia</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm">Agendar Vistoria</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Flag className="w-6 h-6" />
                  <span className="text-sm">Emitir Notificação</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <XCircle className="w-6 h-6" />
                  <span className="text-sm">Aplicar Multa</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Casos Prioritários</CardTitle>
              <CardDescription>Denúncias que requerem atenção imediata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50">
                  <div>
                    <h4 className="font-medium">Construção Irregular - Centro</h4>
                    <p className="text-sm text-gray-600">Obra em área de preservação - Protocolo: DEN-2024-004</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">Alta Prioridade</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border-l-4 border-orange-500 bg-orange-50">
                  <div>
                    <h4 className="font-medium">Funcionamento Irregular - Jardim</h4>
                    <p className="text-sm text-gray-600">Estabelecimento sem licença - Protocolo: DEN-2024-005</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">Média Prioridade</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border-l-4 border-yellow-500 bg-yellow-50">
                  <div>
                    <h4 className="font-medium">Reclamação Vizinhança - Vila Nova</h4>
                    <p className="text-sm text-gray-600">Altura de muro irregular - Protocolo: DEN-2024-006</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Média Prioridade</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Gerados Automaticamente</CardTitle>
              <CardDescription>
                Baseado nas funcionalidades internas desta página, os seguintes serviços são gerados automaticamente para o catálogo público
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h4 className="font-medium">Denúncia de Construção Irregular</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Canal para denunciar construções sem alvará ou em desacordo com as normas municipais
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Denúncia anônima ou identificada
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Upload de fotos e evidências
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Acompanhamento do processo
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-medium">Reclamação de Vizinhança</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Mediação de conflitos entre vizinhos relacionados a construções e uso do solo
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Mediação municipal
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Vistoria técnica
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Orientação legal
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Flag className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium">Fiscalização Urbana</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Solicitação de fiscalização para verificação de conformidade urbana
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Agendamento de vistoria
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Relatório técnico
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Notificação de irregularidades
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-5 h-5 text-purple-500" />
                      <h4 className="font-medium">Notificação de Infração</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Processo para contestação e regularização de infrações urbanísticas
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Defesa e recursos
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Parcelamento de multas
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Termo de ajustamento
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Integração Bidirecional</h4>
                <p className="text-sm text-blue-700">
                  Todos os serviços acima são automaticamente sincronizados com esta página administrativa.
                  Novas denúncias realizadas através do catálogo público aparecem aqui para investigação e fiscalização,
                  enquanto resultados das vistorias são comunicados instantaneamente aos denunciantes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Nova Denúncia</CardTitle>
              <CardDescription>Registre uma nova denúncia para investigação</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Denúncia *</Label>
                    <Select value={novaDenuncia.tipo} onValueChange={(value) => setNovaDenuncia({...novaDenuncia, tipo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construcao_irregular">Construção Irregular</SelectItem>
                        <SelectItem value="reclamacao_vizinhanca">Reclamação de Vizinhança</SelectItem>
                        <SelectItem value="uso_irregular">Uso Irregular do Solo</SelectItem>
                        <SelectItem value="fiscalizacao_urbana">Fiscalização Urbana</SelectItem>
                        <SelectItem value="perturbacao_sossego">Perturbação do Sossego</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prioridade">Prioridade *</Label>
                    <Select value={novaDenuncia.prioridade} onValueChange={(value) => setNovaDenuncia({...novaDenuncia, prioridade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="denunciante">Denunciante</Label>
                    <Input
                      id="denunciante"
                      value={novaDenuncia.denunciante}
                      onChange={(e) => setNovaDenuncia({...novaDenuncia, denunciante: e.target.value})}
                      placeholder="Nome (pode ser anônimo)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={novaDenuncia.telefone}
                      onChange={(e) => setNovaDenuncia({...novaDenuncia, telefone: e.target.value})}
                      placeholder="Telefone para contato"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={novaDenuncia.email}
                      onChange={(e) => setNovaDenuncia({...novaDenuncia, email: e.target.value})}
                      placeholder="Email para acompanhamento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="localizacao">Região *</Label>
                    <Select value={novaDenuncia.localizacao} onValueChange={(value) => setNovaDenuncia({...novaDenuncia, localizacao: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Centro">Centro</SelectItem>
                        <SelectItem value="Jardim">Jardim</SelectItem>
                        <SelectItem value="Vila Nova">Vila Nova</SelectItem>
                        <SelectItem value="Periferia">Periferia</SelectItem>
                        <SelectItem value="Rural">Zona Rural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="titulo">Título da Denúncia *</Label>
                  <Input
                    id="titulo"
                    value={novaDenuncia.titulo}
                    onChange={(e) => setNovaDenuncia({...novaDenuncia, titulo: e.target.value})}
                    placeholder="Resumo da denúncia em uma linha"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço da Irregularidade *</Label>
                  <Input
                    id="endereco"
                    value={novaDenuncia.endereco}
                    onChange={(e) => setNovaDenuncia({...novaDenuncia, endereco: e.target.value})}
                    placeholder="Endereço completo onde ocorre a irregularidade"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição Detalhada *</Label>
                  <Textarea
                    id="descricao"
                    value={novaDenuncia.descricao}
                    onChange={(e) => setNovaDenuncia({...novaDenuncia, descricao: e.target.value})}
                    rows={4}
                    placeholder="Descreva detalhadamente a irregularidade observada"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Denúncia</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}