'use client'

import { useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  Map, MapPin, Building2, Calendar, Wrench, Activity, TrendingUp,
  FileText, AlertTriangle, CheckCircle, Clock, Target, Users,
  Camera, Star, MessageSquare, Download, Filter, Search, Eye,
  Navigation, Layers, Route, Zap, Construction
} from 'lucide-react'

interface ObraMapa {
  id: string
  nome: string
  endereco: string
  latitude: number
  longitude: number
  tipo: string
  status: 'planejada' | 'em_andamento' | 'parada' | 'concluida'
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  percentualConcluido: number
  dataInicio: string
  previsaoTermino: string
  orcamento: number
  secretaria: string
  bairro: string
  impactoTransito: 'baixo' | 'medio' | 'alto'
  populacaoBeneficiada: number
  observacoes: string
}

interface PontoInteresse {
  id: string
  nome: string
  tipo: 'escola' | 'hospital' | 'posto_saude' | 'parque' | 'estacao' | 'comercio'
  latitude: number
  longitude: number
  endereco: string
}

interface CamadaMapa {
  id: string
  nome: string
  ativa: boolean
  cor: string
  icone: string
}

export default function MapaObrasPage() {
  useAdminAuth()

  const [obras, setObras] = useState<ObraMapa[]>([
    {
      id: '1',
      nome: 'Pavimentação Avenida Central',
      endereco: 'Avenida Central, Centro',
      latitude: -23.550520,
      longitude: -46.633308,
      tipo: 'Pavimentação',
      status: 'em_andamento',
      prioridade: 'alta',
      percentualConcluido: 75,
      dataInicio: '2024-01-15',
      previsaoTermino: '2024-06-30',
      orcamento: 2500000,
      secretaria: 'Obras Públicas',
      bairro: 'Centro',
      impactoTransito: 'alto',
      populacaoBeneficiada: 15000,
      observacoes: 'Obra estratégica do centro'
    },
    {
      id: '2',
      nome: 'Construção Praça da Vila',
      endereco: 'Rua das Flores, Vila Nova',
      latitude: -23.555520,
      longitude: -46.638308,
      tipo: 'Urbanização',
      status: 'planejada',
      prioridade: 'media',
      percentualConcluido: 0,
      dataInicio: '2024-07-01',
      previsaoTermino: '2024-12-15',
      orcamento: 800000,
      secretaria: 'Obras Públicas',
      bairro: 'Vila Nova',
      impactoTransito: 'baixo',
      populacaoBeneficiada: 5000,
      observacoes: 'Revitalização urbana'
    }
  ])

  const [pontosInteresse, setPontosInteresse] = useState<PontoInteresse[]>([
    {
      id: '1',
      nome: 'Hospital Municipal',
      tipo: 'hospital',
      latitude: -23.548520,
      longitude: -46.635308,
      endereco: 'Rua da Saúde, 100'
    },
    {
      id: '2',
      nome: 'Escola Estadual Central',
      tipo: 'escola',
      latitude: -23.552520,
      longitude: -46.631308,
      endereco: 'Av. Educação, 500'
    }
  ])

  const [camadas, setCamadas] = useState<CamadaMapa[]>([
    { id: '1', nome: 'Obras em Andamento', ativa: true, cor: '#3B82F6', icone: 'construction' },
    { id: '2', nome: 'Obras Planejadas', ativa: true, cor: '#EAB308', icone: 'clock' },
    { id: '3', nome: 'Obras Concluídas', ativa: false, cor: '#10B981', icone: 'check' },
    { id: '4', nome: 'Pontos de Interesse', ativa: true, cor: '#8B5CF6', icone: 'map-pin' }
  ])

  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroBairro, setFiltroBairro] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [busca, setBusca] = useState('')
  const [obraSelecionada, setObraSelecionada] = useState<ObraMapa | null>(null)

  const obrasFiltradas = obras.filter(obra => {
    const matchStatus = !filtroStatus || obra.status === filtroStatus
    const matchBairro = !filtroBairro || obra.bairro === filtroBairro
    const matchTipo = !filtroTipo || obra.tipo === filtroTipo
    const matchBusca = !busca ||
      obra.nome.toLowerCase().includes(busca.toLowerCase()) ||
      obra.endereco.toLowerCase().includes(busca.toLowerCase())

    return matchStatus && matchBairro && matchTipo && matchBusca
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'planejada': { variant: 'secondary', label: 'Planejada' },
      'em_andamento': { variant: 'default', label: 'Em Andamento' },
      'parada': { variant: 'destructive', label: 'Parada' },
      'concluida': { variant: 'success', label: 'Concluída' }
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

  const getImpactoBadge = (impacto: string) => {
    const variants: Record<string, any> = {
      'baixo': { variant: 'success', label: 'Baixo' },
      'medio': { variant: 'default', label: 'Médio' },
      'alto': { variant: 'destructive', label: 'Alto' }
    }
    const config = variants[impacto] || { variant: 'default', label: impacto }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const statusData = [
    { name: 'Planejadas', value: obras.filter(o => o.status === 'planejada').length },
    { name: 'Em Andamento', value: obras.filter(o => o.status === 'em_andamento').length },
    { name: 'Paradas', value: obras.filter(o => o.status === 'parada').length },
    { name: 'Concluídas', value: obras.filter(o => o.status === 'concluida').length }
  ]

  const bairros = [...new Set(obras.map(obra => obra.bairro))]
  const tipos = [...new Set(obras.map(obra => obra.tipo))]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mapa de Obras</h1>
          <p className="text-muted-foreground">
            Visualização territorial de obras públicas municipais
          </p>
        </div>
      </div>

      <Tabs defaultValue="mapa" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mapa">Mapa Interativo</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="obras">Lista de Obras</TabsTrigger>
          <TabsTrigger value="camadas">Configurar Camadas</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nome ou endereço..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="planejada">Planejada</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="parada">Parada</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Bairro</Label>
                    <Select value={filtroBairro} onValueChange={setFiltroBairro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {bairros.map(bairro => (
                          <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo</Label>
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        {tipos.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Camadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {camadas.map((camada) => (
                      <div key={camada.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={camada.ativa}
                          onChange={(e) => {
                            setCamadas(prev => prev.map(c =>
                              c.id === camada.id ? { ...c, ativa: e.target.checked } : c
                            ))
                          }}
                          className="rounded"
                        />
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: camada.cor }}
                        />
                        <span className="text-sm">{camada.nome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Mapa de Obras Públicas
                  </CardTitle>
                  <CardDescription>
                    Visualização geográfica das obras municipais em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-8 min-h-[500px] flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Map className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">Mapa Interativo</h3>
                        <p className="text-muted-foreground">
                          Integração com Google Maps / OpenStreetMap
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Obras em Andamento ({obras.filter(o => o.status === 'em_andamento').length})</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span>Obras Planejadas ({obras.filter(o => o.status === 'planejada').length})</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Obras Concluídas ({obras.filter(o => o.status === 'concluida').length})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {obraSelecionada && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {obraSelecionada.nome}
                </CardTitle>
                <CardDescription>
                  {obraSelecionada.endereco} - {obraSelecionada.bairro}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Status e Progresso</Label>
                    <div className="space-y-2 mt-1">
                      {getStatusBadge(obraSelecionada.status)}
                      <Progress value={obraSelecionada.percentualConcluido} className="h-2" />
                      <span className="text-sm text-muted-foreground">
                        {obraSelecionada.percentualConcluido}% concluído
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Impacto</Label>
                    <div className="space-y-1 mt-1">
                      {getPrioridadeBadge(obraSelecionada.prioridade)}
                      {getImpactoBadge(obraSelecionada.impactoTransito)}
                      <div className="text-sm text-muted-foreground">
                        {obraSelecionada.populacaoBeneficiada.toLocaleString()} pessoas beneficiadas
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Orçamento</Label>
                    <div className="text-lg font-bold mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                        .format(obraSelecionada.orcamento)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Previsão: {new Date(obraSelecionada.previsaoTermino).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{obras.length}</div>
                <p className="text-xs text-muted-foreground">no mapa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                <Construction className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {obras.filter(o => o.status === 'em_andamento').length}
                </div>
                <p className="text-xs text-muted-foreground">obras ativas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">População Beneficiada</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {obras.reduce((acc, obra) => acc + obra.populacaoBeneficiada, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">pessoas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0
                  }).format(obras.reduce((acc, obra) => acc + obra.orcamento, 0))}
                </div>
                <p className="text-xs text-muted-foreground">orçamento total</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status das Obras</CardTitle>
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
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="obras" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Obras no Mapa</CardTitle>
              <CardDescription>Lista detalhada de todas as obras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {obrasFiltradas.map((obra) => (
                  <Card key={obra.id} className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setObraSelecionada(obra)}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            {obra.nome}
                          </CardTitle>
                          <CardDescription>
                            {obra.endereco} - {obra.bairro}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(obra.status)}
                          {getPrioridadeBadge(obra.prioridade)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <Label className="text-sm font-medium">Progresso</Label>
                          <Progress value={obra.percentualConcluido} className="mt-1" />
                          <span className="text-sm text-muted-foreground">
                            {obra.percentualConcluido}%
                          </span>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Orçamento</Label>
                          <div className="text-sm font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0
                            }).format(obra.orcamento)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Impacto Trânsito</Label>
                          <div className="mt-1">
                            {getImpactoBadge(obra.impactoTransito)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Beneficiados</Label>
                          <div className="text-sm font-medium">
                            {obra.populacaoBeneficiada.toLocaleString()} pessoas
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camadas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Camadas</CardTitle>
              <CardDescription>Personalize a visualização do mapa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {camadas.map((camada) => (
                  <Card key={camada.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={camada.ativa}
                            onChange={(e) => {
                              setCamadas(prev => prev.map(c =>
                                c.id === camada.id ? { ...c, ativa: e.target.checked } : c
                              ))
                            }}
                            className="rounded"
                          />
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: camada.cor }}
                          />
                          <div>
                            <div className="font-medium">{camada.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              Cor: {camada.cor} | Ícone: {camada.icone}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Layers className="h-4 w-4 mr-2" />
                          Configurar
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
              <CardTitle>Serviços Gerados Automaticamente</CardTitle>
              <CardDescription>
                Serviços disponibilizados no catálogo público a partir do mapa de obras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Map className="h-5 w-5 text-blue-500" />
                      Consulta Geográfica de Obras
                    </CardTitle>
                    <CardDescription>
                      Visualização pública de obras por localização
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Mapa interativo público</li>
                      <li>• Busca por endereço/bairro</li>
                      <li>• Filtros por tipo e status</li>
                      <li>• Informações de progresso</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Navigation className="h-5 w-5 text-green-500" />
                      Rotas Alternativas
                    </CardTitle>
                    <CardDescription>
                      Sugestões de rotas devido a obras em andamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Integração com apps de navegação</li>
                      <li>• Alertas de impacto no trânsito</li>
                      <li>• Rotas alternativas</li>
                      <li>• Horários de maior impacto</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Alertas de Proximidade
                    </CardTitle>
                    <CardDescription>
                      Notificações sobre obras próximas ao cidadão
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Notificações por geolocalização</li>
                      <li>• Cadastro de endereços de interesse</li>
                      <li>• Cronograma de execução</li>
                      <li>• Impactos esperados</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-purple-500" />
                      Acompanhamento Regional
                    </CardTitle>
                    <CardDescription>
                      Monitoramento de obras por região
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Visão por bairro/região</li>
                      <li>• Estatísticas locais</li>
                      <li>• População beneficiada</li>
                      <li>• Investimentos por área</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Map className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">Integração Territorial</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      O mapa de obras oferece visualização completa e em tempo real de todos os projetos
                      municipais, permitindo aos cidadãos acompanhar o desenvolvimento urbano de forma
                      transparente e interativa.
                    </p>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <strong>Geolocalização:</strong> Precisão GPS
                      </div>
                      <div>
                        <strong>Atualizações:</strong> Tempo real
                      </div>
                      <div>
                        <strong>Interatividade:</strong> Total
                      </div>
                      <div>
                        <strong>Integração:</strong> Apps externos
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