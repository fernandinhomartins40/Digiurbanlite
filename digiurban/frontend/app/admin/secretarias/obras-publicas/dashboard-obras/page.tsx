'use client'

import { useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  Building2, Calendar, MapPin, Wrench, Activity, TrendingUp, TrendingDown,
  FileText, AlertTriangle, CheckCircle, Clock, Target, Users, DollarSign,
  Camera, Star, MessageSquare, Download, Filter, Search, BarChart3,
  PieChart as PieChartIcon, Map, Construction, Zap, Settings
} from 'lucide-react'

interface DashboardData {
  obras_totais: number
  obras_andamento: number
  obras_concluidas: number
  obras_atrasadas: number
  orcamento_total: number
  valor_executado: number
  populacao_beneficiada: number
  vistorias_mes: number
  reclamacoes_mes: number
  empresas_ativas: number
}

interface ObraExecutiva {
  id: string
  nome: string
  status: string
  percentual: number
  orcamento: number
  prazo: string
  prioridade: string
  responsavel: string
}

export default function DashboardObrasPage() {
  useAdminAuth()

  const [dashboardData] = useState<DashboardData>({
    obras_totais: 24,
    obras_andamento: 8,
    obras_concluidas: 12,
    obras_atrasadas: 3,
    orcamento_total: 45000000,
    valor_executado: 32000000,
    populacao_beneficiada: 185000,
    vistorias_mes: 42,
    reclamacoes_mes: 7,
    empresas_ativas: 15
  })

  const [obrasExecutivas] = useState<ObraExecutiva[]>([
    {
      id: '1',
      nome: 'Pavimentação Avenida Central',
      status: 'em_andamento',
      percentual: 75,
      orcamento: 2500000,
      prazo: '2024-06-30',
      prioridade: 'alta',
      responsavel: 'Construtora Alpha'
    },
    {
      id: '2',
      nome: 'Construção Viaduto Sul',
      status: 'em_andamento',
      percentual: 45,
      orcamento: 8500000,
      prazo: '2024-12-15',
      prioridade: 'urgente',
      responsavel: 'Engenharia Beta'
    },
    {
      id: '3',
      nome: 'Revitalização Centro Histórico',
      status: 'atrasada',
      percentual: 30,
      orcamento: 3200000,
      prazo: '2024-08-20',
      prioridade: 'media',
      responsavel: 'Construtora Gamma'
    }
  ])

  const statusData = [
    { name: 'Em Andamento', value: dashboardData.obras_andamento, color: '#3B82F6' },
    { name: 'Concluídas', value: dashboardData.obras_concluidas, color: '#10B981' },
    { name: 'Atrasadas', value: dashboardData.obras_atrasadas, color: '#EF4444' },
    { name: 'Planejadas', value: dashboardData.obras_totais - dashboardData.obras_andamento - dashboardData.obras_concluidas - dashboardData.obras_atrasadas, color: '#F59E0B' }
  ]

  const orcamentoData = [
    { name: 'Jan', planejado: 2800000, executado: 2400000 },
    { name: 'Fev', planejado: 3200000, executado: 2900000 },
    { name: 'Mar', planejado: 4100000, executado: 3800000 },
    { name: 'Abr', planejado: 3800000, executado: 3500000 },
    { name: 'Mai', planejado: 4500000, executado: 4200000 },
    { name: 'Jun', planejado: 5200000, executado: 4800000 }
  ]

  const tipoObrasData = [
    { name: 'Pavimentação', value: 8, color: '#8B5CF6' },
    { name: 'Urbanização', value: 6, color: '#06B6D4' },
    { name: 'Infraestrutura', value: 4, color: '#84CC16' },
    { name: 'Equipamentos', value: 3, color: '#F97316' },
    { name: 'Outros', value: 3, color: '#6B7280' }
  ]

  const qualidadeData = [
    { month: 'Jan', vistorias: 35, aprovadas: 32, problemas: 3 },
    { month: 'Fev', vistorias: 42, aprovadas: 38, problemas: 4 },
    { month: 'Mar', vistorias: 38, aprovadas: 35, problemas: 3 },
    { month: 'Abr', vistorias: 45, aprovadas: 41, problemas: 4 },
    { month: 'Mai', vistorias: 42, aprovadas: 39, problemas: 3 },
    { month: 'Jun', vistorias: 48, aprovadas: 44, problemas: 4 }
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'em_andamento': { variant: 'default', label: 'Em Andamento' },
      'atrasada': { variant: 'destructive', label: 'Atrasada' },
      'concluida': { variant: 'success', label: 'Concluída' },
      'planejada': { variant: 'secondary', label: 'Planejada' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPrioridadeBadge = (prioridade: string) => {
    const variants: Record<string, any> = {
      'baixa': { variant: 'secondary', label: 'Baixa' },
      'media': { variant: 'default', label: 'Média' },
      'alta': { variant: 'destructive', label: 'Alta' },
      'urgente': { variant: 'destructive', label: 'Urgente' }
    }
    const config = variants[prioridade] || { variant: 'default', label: prioridade }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const percentualExecucao = (dashboardData.valor_executado / dashboardData.orcamento_total) * 100

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Obras Públicas</h1>
          <p className="text-muted-foreground">
            Painel executivo da Secretaria de Obras Públicas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="obras">Obras Críticas</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.obras_totais}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.obras_andamento} em andamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0
                  }).format(dashboardData.orcamento_total)}
                </div>
                <div className="text-xs text-muted-foreground">
                  <Progress value={percentualExecucao} className="h-1 mt-1" />
                  {percentualExecucao.toFixed(1)}% executado
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">População Beneficiada</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.populacao_beneficiada.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">pessoas impactadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vistorias/Mês</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.vistorias_mes}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.reclamacoes_mes} reclamações
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Status das Obras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Tipos de Obras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tipoObrasData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tipoObrasData.map((entry, index) => (
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
              <CardTitle>Execução Orçamentária</CardTitle>
              <CardDescription>Planejado vs Executado (últimos 6 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={orcamentoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                  } />
                  <Legend />
                  <Area type="monotone" dataKey="planejado" stackId="1" stroke="#8884d8" fill="#8884d8" name="Planejado" />
                  <Area type="monotone" dataKey="executado" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Executado" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obras" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Obras Prioritárias</CardTitle>
              <CardDescription>Acompanhamento das principais obras em execução</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {obrasExecutivas.map((obra) => (
                  <Card key={obra.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{obra.nome}</CardTitle>
                          <CardDescription>
                            Responsável: {obra.responsavel}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(obra.status)}
                          {getPrioridadeBadge(obra.prioridade)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="text-sm font-medium mb-2">Progresso</div>
                          <Progress value={obra.percentual} className="h-3" />
                          <div className="text-sm text-muted-foreground mt-1">
                            {obra.percentual}% concluído
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">Orçamento</div>
                          <div className="text-lg font-bold">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            }).format(obra.orcamento)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">Prazo</div>
                          <div className="text-sm">
                            {new Date(obra.prazo).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(obra.prazo) < new Date() ? 'Atrasada' :
                             Math.ceil((new Date(obra.prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Obras Atrasadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">
                  {dashboardData.obras_atrasadas}
                </div>
                <p className="text-sm text-muted-foreground">
                  Requerem atenção imediata
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Construction className="h-5 w-5 text-blue-500" />
                  Em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">
                  {dashboardData.obras_andamento}
                </div>
                <p className="text-sm text-muted-foreground">
                  Obras ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Concluídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  {dashboardData.obras_concluidas}
                </div>
                <p className="text-sm text-muted-foreground">
                  Entregas realizadas
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Execução Financeira</CardTitle>
                <CardDescription>Análise de orçamento vs execução</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Orçamento Total</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.orcamento_total)}</span>
                    </div>
                    <Progress value={100} className="h-2 mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Valor Executado</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.valor_executado)}</span>
                    </div>
                    <Progress value={percentualExecucao} className="h-2 mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Disponível</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.orcamento_total - dashboardData.valor_executado)}</span>
                    </div>
                    <Progress value={100 - percentualExecucao} className="h-2 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores Financeiros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taxa de Execução</span>
                    <Badge variant="default">{percentualExecucao.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Empresas Ativas</span>
                    <Badge variant="default">{dashboardData.empresas_ativas}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Custo/Beneficiado</span>
                    <Badge variant="outline">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                        .format(dashboardData.orcamento_total / dashboardData.populacao_beneficiada)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={orcamentoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) =>
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                  } />
                  <Legend />
                  <Line type="monotone" dataKey="planejado" stroke="#8884d8" name="Planejado" />
                  <Line type="monotone" dataKey="executado" stroke="#82ca9d" name="Executado" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qualidade" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taxa de Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">92%</div>
                <p className="text-sm text-muted-foreground">das vistorias aprovadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tempo Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">7 dias</div>
                <p className="text-sm text-muted-foreground">para resolução de problemas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Satisfação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">4.2/5</div>
                <p className="text-sm text-muted-foreground">avaliação dos cidadãos</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Evolução da Qualidade</CardTitle>
              <CardDescription>Vistorias e aprovações ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={qualidadeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="vistorias" stroke="#8884d8" name="Total Vistorias" />
                  <Line type="monotone" dataKey="aprovadas" stroke="#82ca9d" name="Aprovadas" />
                  <Line type="monotone" dataKey="problemas" stroke="#ffc658" name="Com Problemas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Gerados Automaticamente</CardTitle>
              <CardDescription>
                Integração completa com o catálogo público de serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      Portal de Obras Públicas
                    </CardTitle>
                    <CardDescription>
                      Acesso público a informações de obras
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Dashboard público em tempo real</li>
                      <li>• Busca por localização</li>
                      <li>• Histórico de execução</li>
                      <li>• Download de documentos</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      Canal de Participação
                    </CardTitle>
                    <CardDescription>
                      Interação direta com os cidadãos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Formulário de sugestões</li>
                      <li>• Reclamações e elogios</li>
                      <li>• Acompanhamento de respostas</li>
                      <li>• Avaliação de qualidade</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Map className="h-5 w-5 text-yellow-500" />
                      Transparência Territorial
                    </CardTitle>
                    <CardDescription>
                      Visualização geográfica dos investimentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Mapa interativo público</li>
                      <li>• Filtros por região e tipo</li>
                      <li>• Investimento por bairro</li>
                      <li>• População beneficiada</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-500" />
                      Prestação de Contas
                    </CardTitle>
                    <CardDescription>
                      Relatórios executivos automatizados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Relatórios mensais automáticos</li>
                      <li>• Indicadores de performance</li>
                      <li>• Comparativos históricos</li>
                      <li>• Dados abertos (API)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">Integração Inteligente</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      O dashboard de obras públicas alimenta automaticamente todos os serviços
                      do catálogo público, garantindo transparência total e participação cidadã
                      em todos os aspectos do desenvolvimento urbano municipal.
                    </p>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div>
                        <strong>Transparência:</strong> 100% pública
                      </div>
                      <div>
                        <strong>Atualizações:</strong> Tempo real
                      </div>
                      <div>
                        <strong>Participação:</strong> Ativa
                      </div>
                      <div>
                        <strong>Prestação de Contas:</strong> Automática
                      </div>
                      <div>
                        <strong>Dados Abertos:</strong> API pública
                      </div>
                      <div>
                        <strong>Relatórios:</strong> Automáticos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}