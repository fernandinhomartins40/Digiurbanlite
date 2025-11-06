'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Sprout,
  Droplets,
  Bug,
  Microscope,
  Calendar,
  MapPin,
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CalendarDays,
  Activity
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

interface AssistenciaTecnica {
  id: string
  codigo_assistencia: string
  produtor: {
    nome: string
    cpf: string
    propriedade: string
    area_hectares: number
    telefone: string
    email: string
  }
  tipo_assistencia: 'manejo_pragas' | 'irrigacao' | 'fitossanidade' | 'fertilizacao' | 'analise_solo' | 'planejamento' | 'mecanizacao' | 'pos_colheita'
  categoria_problema: 'pragas' | 'doencas' | 'deficiencia_nutricional' | 'manejo_agua' | 'solo' | 'clima' | 'equipamentos' | 'comercializacao'
  cultura_afetada: string[]
  descricao_problema: string
  urgencia: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'solicitada' | 'agendada' | 'em_andamento' | 'concluida' | 'cancelada' | 'reagendada'
  tecnico_responsavel?: string
  data_solicitacao: string
  data_agendamento?: string
  data_realizacao?: string
  observacoes_tecnico: string
  diagnostico: string
  recomendacoes: {
    descricao: string
    prazo_implementacao: string
    custo_estimado?: number
    prioridade: 'baixa' | 'media' | 'alta'
  }[]
  fotos_problema: string[]
  fotos_solucao: string[]
  coordenadas_gps?: {
    latitude: number
    longitude: number
  }
  proxima_visita?: string
  materiais_utilizados: {
    item: string
    quantidade: number
    unidade: string
    valor?: number
  }[]
  resultado_analise?: {
    tipo_analise: 'solo' | 'agua' | 'planta' | 'pragas'
    laboratorio: string
    data_coleta: string
    data_resultado: string
    parametros: {
      nome: string
      valor: string
      unidade: string
      status: 'adequado' | 'inadequado' | 'critico'
    }[]
  }
  avaliacao_produtor?: {
    nota: number
    comentarios: string
    data: string
  }
  created_at: string
  updated_at: string
}

const tiposAssistencia = [
  { value: 'manejo_pragas', label: 'Manejo de Pragas', icon: Bug },
  { value: 'irrigacao', label: 'Irrigação', icon: Droplets },
  { value: 'fitossanidade', label: 'Fitossanidade', icon: Microscope },
  { value: 'fertilizacao', label: 'Fertilização', icon: Sprout },
  { value: 'analise_solo', label: 'Análise de Solo', icon: FileText },
  { value: 'planejamento', label: 'Planejamento', icon: Calendar },
  { value: 'mecanizacao', label: 'Mecanização', icon: Activity },
  { value: 'pos_colheita', label: 'Pós-Colheita', icon: TrendingUp }
]

const categoriaProblemas = [
  { value: 'pragas', label: 'Pragas', color: '#ef4444' },
  { value: 'doencas', label: 'Doenças', color: '#f97316' },
  { value: 'deficiencia_nutricional', label: 'Deficiência Nutricional', color: '#eab308' },
  { value: 'manejo_agua', label: 'Manejo de Água', color: '#3b82f6' },
  { value: 'solo', label: 'Solo', color: '#8b5cf6' },
  { value: 'clima', label: 'Clima', color: '#06b6d4' },
  { value: 'equipamentos', label: 'Equipamentos', color: '#84cc16' },
  { value: 'comercializacao', label: 'Comercialização', color: '#10b981' }
]

const statusColors = {
  solicitada: '#6b7280',
  agendada: '#3b82f6',
  em_andamento: '#f59e0b',
  concluida: '#10b981',
  cancelada: '#ef4444',
  reagendada: '#8b5cf6'
}

const urgenciaColors = {
  baixa: '#10b981',
  media: '#f59e0b',
  alta: '#f97316',
  critica: '#ef4444'
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export default function AssistenciaTecnicaPage() {
  const { user } = useAdminAuth()
  const [assistencias, setAssistencias] = useState<AssistenciaTecnica[]>([])
  const [filteredAssistencias, setFilteredAssistencias] = useState<AssistenciaTecnica[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterTipo, setFilterTipo] = useState<string>('')
  const [filterUrgencia, setFilterUrgencia] = useState<string>('')
  const [selectedAssistencia, setSelectedAssistencia] = useState<AssistenciaTecnica | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Simular dados
  useEffect(() => {
    const mockData: AssistenciaTecnica[] = [
      {
        id: '1',
        codigo_assistencia: 'AT-2024-001',
        produtor: {
          nome: 'João Silva',
          cpf: '123.456.789-00',
          propriedade: 'Sítio São José',
          area_hectares: 15.5,
          telefone: '(11) 98765-4321',
          email: 'joao.silva@email.com'
        },
        tipo_assistencia: 'manejo_pragas',
        categoria_problema: 'pragas',
        cultura_afetada: ['Milho', 'Feijão'],
        descricao_problema: 'Infestação de lagarta-do-cartucho nas plantações de milho',
        urgencia: 'alta',
        status: 'agendada',
        tecnico_responsavel: 'Eng. Agr. Carlos Santos',
        data_solicitacao: '2024-01-15',
        data_agendamento: '2024-01-18',
        observacoes_tecnico: 'Necessário vistoria urgente',
        diagnostico: '',
        recomendacoes: [],
        fotos_problema: ['foto1.jpg', 'foto2.jpg'],
        fotos_solucao: [],
        coordenadas_gps: {
          latitude: -23.5505,
          longitude: -46.6333
        },
        materiais_utilizados: [],
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-17T15:45:00Z'
      },
      {
        id: '2',
        codigo_assistencia: 'AT-2024-002',
        produtor: {
          nome: 'Maria Oliveira',
          cpf: '987.654.321-00',
          propriedade: 'Fazenda Boa Vista',
          area_hectares: 45.0,
          telefone: '(11) 91234-5678',
          email: 'maria.oliveira@email.com'
        },
        tipo_assistencia: 'irrigacao',
        categoria_problema: 'manejo_agua',
        cultura_afetada: ['Tomate', 'Pimentão'],
        descricao_problema: 'Sistema de irrigação por gotejamento com baixa eficiência',
        urgencia: 'media',
        status: 'em_andamento',
        tecnico_responsavel: 'Eng. Agr. Ana Costa',
        data_solicitacao: '2024-01-12',
        data_agendamento: '2024-01-16',
        data_realizacao: '2024-01-16',
        observacoes_tecnico: 'Análise do sistema iniciada',
        diagnostico: 'Entupimentos nos gotejadores e pressão inadequada',
        recomendacoes: [
          {
            descricao: 'Limpeza completa do sistema',
            prazo_implementacao: '5 dias',
            custo_estimado: 800,
            prioridade: 'alta'
          },
          {
            descricao: 'Instalação de filtros adicionais',
            prazo_implementacao: '15 dias',
            custo_estimado: 1200,
            prioridade: 'media'
          }
        ],
        fotos_problema: ['irrig1.jpg'],
        fotos_solucao: [],
        materiais_utilizados: [
          {
            item: 'Filtro de disco',
            quantidade: 2,
            unidade: 'pç',
            valor: 150
          }
        ],
        created_at: '2024-01-12T08:15:00Z',
        updated_at: '2024-01-16T14:20:00Z'
      },
      {
        id: '3',
        codigo_assistencia: 'AT-2024-003',
        produtor: {
          nome: 'Pedro Santos',
          cpf: '456.789.123-00',
          propriedade: 'Chácara Verde',
          area_hectares: 8.2,
          telefone: '(11) 95555-6666',
          email: 'pedro.santos@email.com'
        },
        tipo_assistencia: 'analise_solo',
        categoria_problema: 'solo',
        cultura_afetada: ['Alface', 'Rúcula', 'Agrião'],
        descricao_problema: 'Baixa produtividade das hortaliças',
        urgencia: 'media',
        status: 'concluida',
        tecnico_responsavel: 'Eng. Agr. Roberto Lima',
        data_solicitacao: '2024-01-08',
        data_agendamento: '2024-01-10',
        data_realizacao: '2024-01-10',
        observacoes_tecnico: 'Coleta realizada com sucesso',
        diagnostico: 'Deficiência de fósforo e pH inadequado',
        recomendacoes: [
          {
            descricao: 'Calagem para correção do pH',
            prazo_implementacao: '30 dias',
            custo_estimado: 500,
            prioridade: 'alta'
          },
          {
            descricao: 'Aplicação de adubo fosfatado',
            prazo_implementacao: '15 dias',
            custo_estimado: 300,
            prioridade: 'alta'
          }
        ],
        fotos_problema: [],
        fotos_solucao: ['resultado1.jpg'],
        resultado_analise: {
          tipo_analise: 'solo',
          laboratorio: 'Lab. Solo UNESP',
          data_coleta: '2024-01-10',
          data_resultado: '2024-01-14',
          parametros: [
            { nome: 'pH', valor: '5.2', unidade: '', status: 'inadequado' },
            { nome: 'Fósforo', valor: '8', unidade: 'ppm', status: 'inadequado' },
            { nome: 'Potássio', valor: '120', unidade: 'ppm', status: 'adequado' },
            { nome: 'Matéria Orgânica', valor: '2.8', unidade: '%', status: 'adequado' }
          ]
        },
        proxima_visita: '2024-02-10',
        avaliacao_produtor: {
          nota: 9,
          comentarios: 'Excelente atendimento, muito detalhado',
          data: '2024-01-15'
        },
        materiais_utilizados: [],
        created_at: '2024-01-08T09:00:00Z',
        updated_at: '2024-01-15T16:30:00Z'
      }
    ]

    setAssistencias(mockData)
    setFilteredAssistencias(mockData)
    setLoading(false)
  }, [])

  // Filtros
  useEffect(() => {
    let filtered = assistencias

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.produtor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo_assistencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cultura_afetada.some(cultura => cultura.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterStatus) {
      filtered = filtered.filter(item => item.status === filterStatus)
    }

    if (filterTipo) {
      filtered = filtered.filter(item => item.tipo_assistencia === filterTipo)
    }

    if (filterUrgencia) {
      filtered = filtered.filter(item => item.urgencia === filterUrgencia)
    }

    setFilteredAssistencias(filtered)
  }, [searchTerm, filterStatus, filterTipo, filterUrgencia, assistencias])

  // Estatísticas
  const stats = {
    total: assistencias.length,
    solicitadas: assistencias.filter(a => a.status === 'solicitada').length,
    agendadas: assistencias.filter(a => a.status === 'agendada').length,
    em_andamento: assistencias.filter(a => a.status === 'em_andamento').length,
    concluidas: assistencias.filter(a => a.status === 'concluida').length,
    media_avaliacao: assistencias
      .filter(a => a.avaliacao_produtor)
      .reduce((acc, a) => acc + (a.avaliacao_produtor?.nota || 0), 0) /
      assistencias.filter(a => a.avaliacao_produtor).length || 0
  }

  // Dados para gráficos
  const tipoAssistenciaChart = tiposAssistencia.map(tipo => ({
    name: tipo.label,
    value: assistencias.filter(a => a.tipo_assistencia === tipo.value).length,
    color: COLORS[tiposAssistencia.indexOf(tipo)]
  }))

  const statusChart = Object.entries(statusColors).map(([status, color]) => ({
    name: status.replace('_', ' '),
    value: assistencias.filter(a => a.status === status).length,
    color
  }))

  const urgenciaChart = Object.entries(urgenciaColors).map(([urgencia, color]) => ({
    name: urgencia,
    value: assistencias.filter(a => a.urgencia === urgencia).length,
    color
  }))

  const atendimentosMensais = [
    { mes: 'Jan', solicitadas: 12, concluidas: 8 },
    { mes: 'Fev', solicitadas: 15, concluidas: 12 },
    { mes: 'Mar', solicitadas: 10, concluidas: 14 },
    { mes: 'Abr', solicitadas: 18, concluidas: 10 },
    { mes: 'Mai', solicitadas: 14, concluidas: 16 },
    { mes: 'Jun', solicitadas: 16, concluidas: 15 }
  ]

  const handleNovaAssistencia = () => {
    setSelectedAssistencia(null)
    setIsModalOpen(true)
  }

  const handleEditAssistencia = (assistencia: AssistenciaTecnica) => {
    setSelectedAssistencia(assistencia)
    setIsModalOpen(true)
  }

  const handleViewDetails = (assistencia: AssistenciaTecnica) => {
    setSelectedAssistencia(assistencia)
    // Implementar modal de detalhes
  }

  const ServicosGerados = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Serviços Gerados Automaticamente
        </CardTitle>
        <CardDescription>
          Serviços disponíveis no catálogo público baseados nas funcionalidades desta página
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-green-700">Assistência Técnica Rural</h4>
            <p className="text-sm text-gray-600 mt-1">
              Solicitação de visita técnica para orientação agrícola
            </p>
            <Badge variant="outline" className="mt-2">Protocolo Automático</Badge>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-blue-700">Consultoria de Pragas</h4>
            <p className="text-sm text-gray-600 mt-1">
              Diagnóstico e controle de pragas nas culturas
            </p>
            <Badge variant="outline" className="mt-2">Protocolo Automático</Badge>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-cyan-700">Orientação de Irrigação</h4>
            <p className="text-sm text-gray-600 mt-1">
              Análise e otimização de sistemas de irrigação
            </p>
            <Badge variant="outline" className="mt-2">Protocolo Automático</Badge>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-purple-700">Análise de Solo</h4>
            <p className="text-sm text-gray-600 mt-1">
              Coleta e interpretação de análises de solo
            </p>
            <Badge variant="outline" className="mt-2">Protocolo Automático</Badge>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-orange-700">Plano de Manejo</h4>
            <p className="text-sm text-gray-600 mt-1">
              Elaboração de planos técnicos de manejo cultural
            </p>
            <Badge variant="outline" className="mt-2">Protocolo Automático</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assistência Técnica Rural</h1>
          <p className="text-muted-foreground">
            Gestão de atividades técnicas, manejo, irrigação e fitossanidade
          </p>
        </div>
        <Button onClick={handleNovaAssistencia} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Assistência
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="assistencias">Assistências</TabsTrigger>
          <TabsTrigger value="agenda">Agenda Técnica</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Assistências</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.solicitadas} aguardando atendimento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.em_andamento + stats.agendadas}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.agendadas} agendadas para esta semana
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.concluidas}</div>
                <p className="text-xs text-muted-foreground">
                  Taxa de resolução: 87%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.media_avaliacao.toFixed(1)}/10</div>
                <p className="text-xs text-muted-foreground">
                  Baseado em {assistencias.filter(a => a.avaliacao_produtor).length} avaliações
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Assistência Técnica</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tipoAssistenciaChart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                    >
                      {tipoAssistenciaChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das Assistências</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Urgência das Solicitações</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={urgenciaChart}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry: any) => `${entry.name}: ${entry.value}`}
                    >
                      {urgenciaChart.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atendimentos por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={atendimentosMensais}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="solicitadas" stroke="#f59e0b" strokeWidth={2} name="Solicitadas" />
                    <Line type="monotone" dataKey="concluidas" stroke="#10b981" strokeWidth={2} name="Concluídas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <ServicosGerados />
        </TabsContent>

        <TabsContent value="assistencias" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por produtor, código ou cultura..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="solicitada">Solicitada</SelectItem>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tipo de Assistência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    {tiposAssistencia.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterUrgencia} onValueChange={setFilterUrgencia}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Urgência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as urgências</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Assistências */}
          <div className="grid grid-cols-1 gap-4">
            {filteredAssistencias.map((assistencia) => (
              <Card key={assistencia.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{assistencia.codigo_assistencia}</h3>
                        <Badge
                          variant="outline"
                          style={{ borderColor: statusColors[assistencia.status] }}
                        >
                          {assistencia.status.replace('_', ' ')}
                        </Badge>
                        <Badge
                          variant="outline"
                          style={{ borderColor: urgenciaColors[assistencia.urgencia] }}
                        >
                          {assistencia.urgencia}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Produtor:</strong> {assistencia.produtor.nome}</p>
                        <p><strong>Propriedade:</strong> {assistencia.produtor.propriedade}</p>
                        <p><strong>Culturas:</strong> {assistencia.cultura_afetada.join(', ')}</p>
                        <p><strong>Tipo:</strong> {tiposAssistencia.find(t => t.value === assistencia.tipo_assistencia)?.label}</p>
                        {assistencia.tecnico_responsavel && (
                          <p><strong>Técnico:</strong> {assistencia.tecnico_responsavel}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(assistencia)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAssistencia(assistencia)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="mb-2"><strong>Problema:</strong> {assistencia.descricao_problema}</p>

                    {assistencia.data_agendamento && (
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                        <span>Agendado para: {new Date(assistencia.data_agendamento).toLocaleDateString()}</span>
                      </div>
                    )}

                    {assistencia.coordenadas_gps && (
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <span>
                          GPS: {assistencia.coordenadas_gps.latitude}, {assistencia.coordenadas_gps.longitude}
                        </span>
                      </div>
                    )}

                    {assistencia.diagnostico && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <strong>Diagnóstico:</strong> {assistencia.diagnostico}
                      </div>
                    )}

                    {assistencia.recomendacoes.length > 0 && (
                      <div className="mt-2">
                        <strong>Recomendações:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {assistencia.recomendacoes.map((rec, index) => (
                            <li key={index} className="text-sm">
                              {rec.descricao}
                              {rec.custo_estimado && ` (R$ ${rec.custo_estimado.toFixed(2)})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {assistencia.avaliacao_produtor && (
                      <div className="flex items-center gap-2 mt-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>Avaliação: {assistencia.avaliacao_produtor.nota}/10</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agenda Técnica Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assistencias
                  .filter(a => a.data_agendamento || a.status === 'agendada')
                  .map(assistencia => (
                    <div key={assistencia.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-20 text-center">
                        <div className="text-sm font-semibold">
                          {assistencia.data_agendamento ?
                            new Date(assistencia.data_agendamento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                            : 'A agendar'
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assistencia.data_agendamento ?
                            new Date(assistencia.data_agendamento).toLocaleDateString('pt-BR', { weekday: 'short' })
                            : ''
                          }
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{assistencia.produtor.nome}</h4>
                        <p className="text-sm text-muted-foreground">{assistencia.produtor.propriedade}</p>
                        <p className="text-sm">{tiposAssistencia.find(t => t.value === assistencia.tipo_assistencia)?.label}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          style={{ borderColor: urgenciaColors[assistencia.urgencia] }}
                        >
                          {assistencia.urgencia}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {assistencia.tecnico_responsavel || 'Sem técnico'}
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Produtividade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Assistências por Técnico</span>
                    <span className="font-semibold">Média: 2.3/dia</span>
                  </div>
                  <Progress value={75} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    Meta mensal: 65 assistências (78% atingida)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Qualidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Satisfação do Produtor</span>
                    <span className="font-semibold">{stats.media_avaliacao.toFixed(1)}/10</span>
                  </div>
                  <Progress value={stats.media_avaliacao * 10} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    {assistencias.filter(a => a.avaliacao_produtor && a.avaliacao_produtor.nota >= 8).length} avaliações excelentes
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análise de Problemas Recorrentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoriaProblemas.map(categoria => {
                  const count = assistencias.filter(a => a.categoria_problema === categoria.value).length
                  const percentage = assistencias.length > 0 ? (count / assistencias.length) * 100 : 0
                  return (
                    <div key={categoria.value} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold" style={{ color: categoria.color }}>
                          {categoria.label}
                        </h4>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                      <Progress value={percentage} className="w-full" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {percentage.toFixed(1)}% do total
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}