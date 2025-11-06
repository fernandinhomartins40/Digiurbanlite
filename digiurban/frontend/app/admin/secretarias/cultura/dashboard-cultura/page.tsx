'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { CalendarDays, Users, Building2, Calendar as CalendarIcon, FileText, TrendingUp, Eye, Download, Filter, Search, BarChart3, PieChart as PieChartIcon, Activity, MapPin, Star, Clock } from 'lucide-react'

interface IndicadorCultural {
  id: string
  nome: string
  valor: number
  variacao: number
  icone: any
  cor: string
  categoria: 'espacos' | 'eventos' | 'participantes' | 'projetos'
}

interface EventoCultural {
  id: string
  nome: string
  data: string
  local: string
  participantes: number
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado'
  categoria: 'teatro' | 'musica' | 'danca' | 'literatura' | 'arte_visual' | 'cinema' | 'feira_cultural' | 'workshop'
  publico_alvo: 'criancas' | 'adolescentes' | 'adultos' | 'idosos' | 'familia' | 'geral'
}

interface EspacoCultural {
  id: string
  nome: string
  tipo: 'teatro' | 'biblioteca' | 'centro_cultural' | 'museu' | 'galeria' | 'auditorio' | 'praca' | 'casa_cultura'
  capacidade: number
  status: 'ativo' | 'manutencao' | 'reservado' | 'fechado'
  ocupacao_mensal: number
  proximos_eventos: number
}

interface ProjetoCultural {
  id: string
  nome: string
  responsavel: string
  orcamento: number
  inicio: string
  fim: string
  status: 'planejamento' | 'aprovado' | 'em_andamento' | 'concluido' | 'suspenso'
  categoria: 'edital' | 'lei_incentivo' | 'recursos_proprios' | 'parceria' | 'patrocinio'
  beneficiados: number
}

interface ParticipanteCultural {
  id: string
  nome: string
  cpf: string
  idade: number
  bairro: string
  atividades_participadas: number
  ultima_participacao: string
  categoria_preferida: string
  status: 'ativo' | 'inativo'
}

interface ServicoGerado {
  id: string
  nome: string
  descricao: string
  categoria: 'consulta' | 'relatorio' | 'certificado' | 'agenda'
  automatico: boolean
  ativo: boolean
}

export default function DashboardCultura() {
  const { user } = useAdminAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [filtroEvento, setFiltroEvento] = useState<string>('todos')
  const [filtroEspaco, setFiltroEspaco] = useState<string>('todos')
  const [filtroProjeto, setFiltroProjeto] = useState<string>('todos')
  const [buscaParticipante, setBuscaParticipante] = useState('')

  const indicadores: IndicadorCultural[] = [
    { id: '1', nome: 'Espaços Culturais Ativos', valor: 24, variacao: 12, icone: Building2, cor: 'text-blue-600', categoria: 'espacos' },
    { id: '2', nome: 'Eventos Este Mês', valor: 67, variacao: 8, icone: CalendarDays, cor: 'text-purple-600', categoria: 'eventos' },
    { id: '3', nome: 'Participantes Ativos', valor: 3247, variacao: 15, icone: Users, cor: 'text-green-600', categoria: 'participantes' },
    { id: '4', nome: 'Projetos em Andamento', valor: 18, variacao: -3, icone: FileText, cor: 'text-orange-600', categoria: 'projetos' }
  ]

  const eventosRecentes: EventoCultural[] = [
    { id: '1', nome: 'Festival de Música Popular', data: '2024-01-15', local: 'Theatro Municipal', participantes: 450, status: 'concluido', categoria: 'musica', publico_alvo: 'geral' },
    { id: '2', nome: 'Oficina de Teatro Infantil', data: '2024-01-20', local: 'Centro Cultural', participantes: 35, status: 'em_andamento', categoria: 'teatro', publico_alvo: 'criancas' },
    { id: '3', nome: 'Exposição Arte Contemporânea', data: '2024-01-25', local: 'Galeria de Arte', participantes: 120, status: 'agendado', categoria: 'arte_visual', publico_alvo: 'adultos' },
    { id: '4', nome: 'Sarau Literário', data: '2024-01-28', local: 'Biblioteca Central', participantes: 80, status: 'agendado', categoria: 'literatura', publico_alvo: 'geral' }
  ]

  const espacosCulturais: EspacoCultural[] = [
    { id: '1', nome: 'Theatro Municipal', tipo: 'teatro', capacidade: 800, status: 'ativo', ocupacao_mensal: 85, proximos_eventos: 12 },
    { id: '2', nome: 'Centro Cultural', tipo: 'centro_cultural', capacidade: 300, status: 'ativo', ocupacao_mensal: 92, proximos_eventos: 8 },
    { id: '3', nome: 'Biblioteca Central', tipo: 'biblioteca', capacidade: 150, status: 'ativo', ocupacao_mensal: 78, proximos_eventos: 5 },
    { id: '4', nome: 'Galeria de Arte', tipo: 'galeria', capacidade: 100, status: 'manutencao', ocupacao_mensal: 0, proximos_eventos: 0 }
  ]

  const projetosCulturais: ProjetoCultural[] = [
    { id: '1', nome: 'Programa Cultura nas Escolas', responsavel: 'Maria Silva', orcamento: 50000, inicio: '2024-01-01', fim: '2024-12-31', status: 'em_andamento', categoria: 'recursos_proprios', beneficiados: 1200 },
    { id: '2', nome: 'Festival de Inverno 2024', responsavel: 'João Santos', orcamento: 80000, inicio: '2024-06-01', fim: '2024-07-31', status: 'planejamento', categoria: 'edital', beneficiados: 800 },
    { id: '3', nome: 'Restauração do Museu Histórico', responsavel: 'Ana Costa', orcamento: 120000, inicio: '2024-02-01', fim: '2024-11-30', status: 'aprovado', categoria: 'lei_incentivo', beneficiados: 500 }
  ]

  const participantesCulturais: ParticipanteCultural[] = [
    { id: '1', nome: 'Carlos Oliveira', cpf: '123.456.789-00', idade: 34, bairro: 'Centro', atividades_participadas: 12, ultima_participacao: '2024-01-10', categoria_preferida: 'Música', status: 'ativo' },
    { id: '2', nome: 'Mariana Souza', cpf: '987.654.321-00', idade: 28, bairro: 'Vila Nova', atividades_participadas: 8, ultima_participacao: '2024-01-08', categoria_preferida: 'Teatro', status: 'ativo' },
    { id: '3', nome: 'Pedro Lima', cpf: '456.789.123-00', idade: 45, bairro: 'São José', atividades_participadas: 15, ultima_participacao: '2023-12-20', categoria_preferida: 'Literatura', status: 'inativo' }
  ]

  const servicosGerados: ServicoGerado[] = [
    { id: '1', nome: 'Agenda Cultural', descricao: 'Consulta de eventos culturais municipais', categoria: 'agenda', automatico: true, ativo: true },
    { id: '2', nome: 'Relatório de Participação', descricao: 'Histórico de participação em atividades culturais', categoria: 'relatorio', automatico: true, ativo: true },
    { id: '3', nome: 'Histórico Cultural do Cidadão', descricao: 'Comprovante de participação em eventos e projetos', categoria: 'certificado', automatico: true, ativo: true },
    { id: '4', nome: 'Programação Mensal', descricao: 'Calendário completo de atividades culturais', categoria: 'agenda', automatico: true, ativo: true },
    { id: '5', nome: 'Certificado de Participação Cultural', descricao: 'Documento oficial de participação em atividades', categoria: 'certificado', automatico: false, ativo: true }
  ]

  const dadosOcupacaoMensal = [
    { mes: 'Jul', eventos: 45, participantes: 2800 },
    { mes: 'Ago', eventos: 52, participantes: 3100 },
    { mes: 'Set', eventos: 48, participantes: 2950 },
    { mes: 'Out', eventos: 61, participantes: 3400 },
    { mes: 'Nov', eventos: 58, participantes: 3200 },
    { mes: 'Dez', eventos: 67, participantes: 3247 }
  ]

  const dadosCategoriasEventos = [
    { categoria: 'Música', quantidade: 25, cor: '#8884d8' },
    { categoria: 'Teatro', quantidade: 18, cor: '#82ca9d' },
    { categoria: 'Arte Visual', quantidade: 12, cor: '#ffc658' },
    { categoria: 'Literatura', quantidade: 8, cor: '#ff7300' },
    { categoria: 'Dança', quantidade: 15, cor: '#00C49F' },
    { categoria: 'Cinema', quantidade: 6, cor: '#FFBB28' }
  ]

  const dadosPublicoAlvo = [
    { faixa: 'Crianças (0-12)', participantes: 680 },
    { faixa: 'Adolescentes (13-17)', participantes: 520 },
    { faixa: 'Adultos (18-59)', participantes: 1850 },
    { faixa: 'Idosos (60+)', participantes: 197 }
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      'ativo': 'bg-green-100 text-green-800',
      'em_andamento': 'bg-blue-100 text-blue-800',
      'agendado': 'bg-yellow-100 text-yellow-800',
      'concluido': 'bg-gray-100 text-gray-800',
      'planejamento': 'bg-purple-100 text-purple-800',
      'aprovado': 'bg-emerald-100 text-emerald-800',
      'manutencao': 'bg-orange-100 text-orange-800',
      'suspenso': 'bg-red-100 text-red-800'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  const filtrarEventos = eventosRecentes.filter(evento =>
    filtroEvento === 'todos' || evento.categoria === filtroEvento
  )

  const filtrarEspacos = espacosCulturais.filter(espaco =>
    filtroEspaco === 'todos' || espaco.tipo === filtroEspaco
  )

  const filtrarProjetos = projetosCulturais.filter(projeto =>
    filtroProjeto === 'todos' || projeto.categoria === filtroProjeto
  )

  const filtrarParticipantes = participantesCulturais.filter(participante =>
    participante.nome.toLowerCase().includes(buscaParticipante.toLowerCase()) ||
    participante.cpf.includes(buscaParticipante)
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Cultura</h1>
          <p className="text-gray-600 mt-1">Painel de controle com métricas culturais municipais</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {indicadores.map((indicador) => (
          <Card key={indicador.id} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{indicador.nome}</CardTitle>
              <indicador.icone className={`h-4 w-4 ${indicador.cor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicador.valor.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className={`h-3 w-3 mr-1 ${indicador.variacao > 0 ? 'text-green-500' : 'text-red-500'}`} />
                {indicador.variacao > 0 ? '+' : ''}{indicador.variacao}% desde o mês passado
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="espacos">Espaços</TabsTrigger>
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Eventos e Participantes por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dadosOcupacaoMensal}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area yAxisId="left" type="monotone" dataKey="eventos" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area yAxisId="right" type="monotone" dataKey="participantes" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                  Eventos por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosCategoriasEventos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.categoria}: ${entry.quantidade}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="quantidade"
                    >
                      {dadosCategoriasEventos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Participantes por Faixa Etária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosPublicoAlvo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="faixa" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="participantes" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Ocupação dos Espaços Culturais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {espacosCulturais.map((espaco) => (
                    <div key={espaco.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{espaco.nome}</p>
                        <p className="text-sm text-gray-600">{espaco.capacidade} pessoas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{espaco.ocupacao_mensal}%</p>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${espaco.ocupacao_mensal}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Eventos Culturais</CardTitle>
                <Select value={filtroEvento} onValueChange={setFiltroEvento}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as categorias</SelectItem>
                    <SelectItem value="musica">Música</SelectItem>
                    <SelectItem value="teatro">Teatro</SelectItem>
                    <SelectItem value="arte_visual">Arte Visual</SelectItem>
                    <SelectItem value="literatura">Literatura</SelectItem>
                    <SelectItem value="danca">Dança</SelectItem>
                    <SelectItem value="cinema">Cinema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtrarEventos.map((evento) => (
                  <Card key={evento.id} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{evento.nome}</CardTitle>
                        <Badge className={getStatusBadge(evento.status)}>
                          {evento.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          {new Date(evento.data).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {evento.local}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          {evento.participantes} participantes
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="espacos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Espaços Culturais</CardTitle>
                <Select value={filtroEspaco} onValueChange={setFiltroEspaco}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="teatro">Teatro</SelectItem>
                    <SelectItem value="biblioteca">Biblioteca</SelectItem>
                    <SelectItem value="centro_cultural">Centro Cultural</SelectItem>
                    <SelectItem value="galeria">Galeria</SelectItem>
                    <SelectItem value="museu">Museu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtrarEspacos.map((espaco) => (
                  <Card key={espaco.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{espaco.nome}</CardTitle>
                        <Badge className={getStatusBadge(espaco.status)}>
                          {espaco.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Capacidade</span>
                          <span className="font-medium">{espaco.capacidade} pessoas</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Ocupação Mensal</span>
                          <span className="font-medium">{espaco.ocupacao_mensal}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${espaco.ocupacao_mensal}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Próximos Eventos</span>
                          <span className="font-medium">{espaco.proximos_eventos}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projetos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Projetos Culturais</CardTitle>
                <Select value={filtroProjeto} onValueChange={setFiltroProjeto}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as categorias</SelectItem>
                    <SelectItem value="edital">Edital</SelectItem>
                    <SelectItem value="lei_incentivo">Lei de Incentivo</SelectItem>
                    <SelectItem value="recursos_proprios">Recursos Próprios</SelectItem>
                    <SelectItem value="parceria">Parceria</SelectItem>
                    <SelectItem value="patrocinio">Patrocínio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtrarProjetos.map((projeto) => (
                  <Card key={projeto.id} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{projeto.nome}</CardTitle>
                          <CardDescription>{projeto.responsavel}</CardDescription>
                        </div>
                        <Badge className={getStatusBadge(projeto.status)}>
                          {projeto.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Orçamento</p>
                          <p className="font-medium">R$ {projeto.orcamento.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Início</p>
                          <p className="font-medium">{new Date(projeto.inicio).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Término</p>
                          <p className="font-medium">{new Date(projeto.fim).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Beneficiados</p>
                          <p className="font-medium">{projeto.beneficiados} pessoas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participantes" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Participantes Culturais</CardTitle>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nome ou CPF..."
                      value={buscaParticipante}
                      onChange={(e) => setBuscaParticipante(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtrarParticipantes.map((participante) => (
                  <Card key={participante.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{participante.nome}</h3>
                            <Badge className={getStatusBadge(participante.status)}>
                              {participante.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">CPF:</span>
                              <p className="font-medium">{participante.cpf}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Idade:</span>
                              <p className="font-medium">{participante.idade} anos</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Bairro:</span>
                              <p className="font-medium">{participante.bairro}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Atividades:</span>
                              <p className="font-medium">{participante.atividades_participadas}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">Categoria preferida:</span>
                            <span className="ml-2 font-medium">{participante.categoria_preferida}</span>
                            <span className="ml-4 text-gray-600">Última participação:</span>
                            <span className="ml-2">{new Date(participante.ultima_participacao).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Serviços Gerados Automaticamente
              </CardTitle>
              <CardDescription>
                Serviços do catálogo público gerados pelas funcionalidades internas da gestão cultural
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servicosGerados.map((servico) => (
                  <Card key={servico.id} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{servico.nome}</CardTitle>
                        <div className="flex gap-2">
                          {servico.automatico && (
                            <Badge variant="secondary" className="text-xs">
                              Automático
                            </Badge>
                          )}
                          <Badge className={servico.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {servico.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-3">{servico.descricao}</p>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="capitalize">
                          {servico.categoria.replace('_', ' ')}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Dados
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integração Bidirecional</CardTitle>
              <CardDescription>
                Como as funcionalidades internas geram automaticamente serviços para o catálogo público
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-medium text-purple-900 mb-2">Dashboard Cultura → Serviços Públicos</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• <strong>Agenda Cultural:</strong> Compilação automática de eventos e programação cultural</li>
                    <li>• <strong>Relatório de Participação:</strong> Histórico individual de participação em atividades</li>
                    <li>• <strong>Histórico Cultural do Cidadão:</strong> Comprovantes e certificados de participação</li>
                    <li>• <strong>Programação Mensal:</strong> Calendário consolidado de atividades culturais</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-medium text-blue-900 mb-2">Fluxo de Protocolos</h4>
                  <p className="text-sm text-blue-800">
                    Cidadão solicita "Agenda Cultural" → Protocolo criado → Dashboard compila dados de eventos, espaços e projetos →
                    Gera agenda personalizada → Disponibiliza para o cidadão
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}