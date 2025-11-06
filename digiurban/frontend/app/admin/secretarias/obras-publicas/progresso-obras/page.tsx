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
  Building2, Calendar, MapPin, Wrench, Activity, TrendingUp,
  FileText, AlertTriangle, CheckCircle, Clock, Target, Users,
  Camera, Star, MessageSquare, Download, Filter, Search
} from 'lucide-react'

interface ProgressoObra {
  id: string
  nome: string
  endereco: string
  tipo: string
  percentualConcluido: number
  prazoInicial: string
  prazoFinal: string
  orcamento: number
  valor_executado: number
  empresa: string
  engenheiro: string
  status: 'em_andamento' | 'atrasada' | 'parada' | 'concluida'
  qualidade: 'otima' | 'boa' | 'regular' | 'ruim'
  ultimaVistoria: string
  proximaVistoria: string
  observacoes: string
}

interface Vistoria {
  id: string
  obraId: string
  data: string
  responsavel: string
  percentual: number
  qualidade: 'otima' | 'boa' | 'regular' | 'ruim'
  aspectos_positivos: string
  problemas_encontrados: string
  recomendacoes: string
  fotos: string[]
  status: 'aprovada' | 'com_ressalvas' | 'reprovada'
}

interface Reclamacao {
  id: string
  obraId: string
  data: string
  cidadao: string
  contato: string
  tipo: string
  descricao: string
  status: 'aberta' | 'em_analise' | 'resolvida' | 'procedente' | 'improcedente'
  resposta: string
}

export default function ProgressoObrasPage() {
  useAdminAuth()

  const [progressos, setProgressos] = useState<ProgressoObra[]>([
    {
      id: '1',
      nome: 'Pavimentação Avenida Central',
      endereco: 'Avenida Central, Centro',
      tipo: 'Pavimentação',
      percentualConcluido: 75,
      prazoInicial: '2024-01-15',
      prazoFinal: '2024-06-30',
      orcamento: 2500000,
      valor_executado: 1875000,
      empresa: 'Construtora Alpha Ltda',
      engenheiro: 'João Silva',
      status: 'em_andamento',
      qualidade: 'boa',
      ultimaVistoria: '2024-05-20',
      proximaVistoria: '2024-06-05',
      observacoes: 'Obra dentro do cronograma'
    }
  ])

  const [vistorias, setVistorias] = useState<Vistoria[]>([
    {
      id: '1',
      obraId: '1',
      data: '2024-05-20',
      responsavel: 'Maria Santos - Eng. Fiscal',
      percentual: 75,
      qualidade: 'boa',
      aspectos_positivos: 'Qualidade dos materiais conforme especificação',
      problemas_encontrados: 'Pequeno atraso na sinalização',
      recomendacoes: 'Intensificar sinalização de segurança',
      fotos: [],
      status: 'aprovada'
    }
  ])

  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([
    {
      id: '1',
      obraId: '1',
      data: '2024-05-18',
      cidadao: 'Ana Costa',
      contato: '(11) 99999-9999',
      tipo: 'Qualidade',
      descricao: 'Qualidade do asfalto parece inferior ao esperado',
      status: 'em_analise',
      resposta: ''
    }
  ])

  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroQualidade, setFiltroQualidade] = useState('')
  const [busca, setBusca] = useState('')

  const progressosFiltrados = progressos.filter(progresso => {
    const matchStatus = !filtroStatus || progresso.status === filtroStatus
    const matchQualidade = !filtroQualidade || progresso.qualidade === filtroQualidade
    const matchBusca = !busca ||
      progresso.nome.toLowerCase().includes(busca.toLowerCase()) ||
      progresso.endereco.toLowerCase().includes(busca.toLowerCase())

    return matchStatus && matchQualidade && matchBusca
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'em_andamento': { variant: 'default', label: 'Em Andamento' },
      'atrasada': { variant: 'destructive', label: 'Atrasada' },
      'parada': { variant: 'secondary', label: 'Parada' },
      'concluida': { variant: 'success', label: 'Concluída' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getQualidadeBadge = (qualidade: string) => {
    const variants: Record<string, any> = {
      'otima': { variant: 'success', label: 'Ótima' },
      'boa': { variant: 'default', label: 'Boa' },
      'regular': { variant: 'secondary', label: 'Regular' },
      'ruim': { variant: 'destructive', label: 'Ruim' }
    }
    const config = variants[qualidade] || { variant: 'default', label: qualidade }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const statsData = [
    { name: 'Em Andamento', value: progressos.filter(p => p.status === 'em_andamento').length },
    { name: 'Atrasadas', value: progressos.filter(p => p.status === 'atrasada').length },
    { name: 'Paradas', value: progressos.filter(p => p.status === 'parada').length },
    { name: 'Concluídas', value: progressos.filter(p => p.status === 'concluida').length }
  ]

  const progressoMedio = Math.round(progressos.reduce((acc, p) => acc + p.percentualConcluido, 0) / progressos.length)

  const qualidadeData = [
    { name: 'Ótima', value: progressos.filter(p => p.qualidade === 'otima').length },
    { name: 'Boa', value: progressos.filter(p => p.qualidade === 'boa').length },
    { name: 'Regular', value: progressos.filter(p => p.qualidade === 'regular').length },
    { name: 'Ruim', value: progressos.filter(p => p.qualidade === 'ruim').length }
  ]

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Progresso de Obras</h1>
          <p className="text-muted-foreground">
            Acompanhamento da execução de obras municipais
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="progressos">Progresso Obras</TabsTrigger>
          <TabsTrigger value="vistorias">Vistorias</TabsTrigger>
          <TabsTrigger value="reclamacoes">Reclamações</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressos.length}</div>
                <p className="text-xs text-muted-foreground">obras monitoradas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{progressoMedio}%</div>
                <Progress value={progressoMedio} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vistorias Mês</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vistorias.length}</div>
                <p className="text-xs text-muted-foreground">realizadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reclamações</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reclamacoes.length}</div>
                <p className="text-xs text-muted-foreground">em análise</p>
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
                  <BarChart data={statsData}>
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
                <CardTitle>Qualidade das Obras</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={qualidadeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {qualidadeData.map((entry, index) => (
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

        <TabsContent value="progressos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
              <CardDescription>Filtre e pesquise obras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar obra..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="atrasada">Atrasada</SelectItem>
                    <SelectItem value="parada">Parada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroQualidade} onValueChange={setFiltroQualidade}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Qualidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="otima">Ótima</SelectItem>
                    <SelectItem value="boa">Boa</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {progressosFiltrados.map((progresso) => (
              <Card key={progresso.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {progresso.nome}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <MapPin className="h-4 w-4" />
                        {progresso.endereco}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(progresso.status)}
                      {getQualidadeBadge(progresso.qualidade)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Progresso</Label>
                      <div className="space-y-1">
                        <Progress value={progresso.percentualConcluido} className="h-3" />
                        <span className="text-sm text-muted-foreground">{progresso.percentualConcluido}% concluído</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Orçamento</Label>
                      <div className="text-lg font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                          .format(progresso.orcamento)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Executado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                          .format(progresso.valor_executado)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Prazos</Label>
                      <div className="text-sm">
                        <div>Início: {new Date(progresso.prazoInicial).toLocaleDateString('pt-BR')}</div>
                        <div>Fim: {new Date(progresso.prazoFinal).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Responsáveis</Label>
                      <div className="text-sm">
                        <div><strong>Empresa:</strong> {progresso.empresa}</div>
                        <div><strong>Engenheiro:</strong> {progresso.engenheiro}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Vistorias</Label>
                      <div className="text-sm">
                        <div>Última: {new Date(progresso.ultimaVistoria).toLocaleDateString('pt-BR')}</div>
                        <div>Próxima: {new Date(progresso.proximaVistoria).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  </div>

                  {progresso.observacoes && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Observações</Label>
                      <p className="text-sm text-muted-foreground">{progresso.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vistorias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vistorias Realizadas</CardTitle>
              <CardDescription>Controle de qualidade e acompanhamento técnico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vistorias.map((vistoria) => (
                  <Card key={vistoria.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Vistoria - {progressos.find(p => p.id === vistoria.obraId)?.nome}
                          </CardTitle>
                          <CardDescription>
                            {new Date(vistoria.data).toLocaleDateString('pt-BR')} - {vistoria.responsavel}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{vistoria.percentual}%</Badge>
                          {getQualidadeBadge(vistoria.qualidade)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {vistoria.aspectos_positivos && (
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Aspectos Positivos
                          </Label>
                          <p className="text-sm mt-1">{vistoria.aspectos_positivos}</p>
                        </div>
                      )}

                      {vistoria.problemas_encontrados && (
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Problemas Encontrados
                          </Label>
                          <p className="text-sm mt-1">{vistoria.problemas_encontrados}</p>
                        </div>
                      )}

                      {vistoria.recomendacoes && (
                        <div>
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Recomendações
                          </Label>
                          <p className="text-sm mt-1">{vistoria.recomendacoes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reclamacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reclamações de Qualidade</CardTitle>
              <CardDescription>Canal direto para reclamações sobre obras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reclamacoes.map((reclamacao) => (
                  <Card key={reclamacao.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {progressos.find(p => p.id === reclamacao.obraId)?.nome}
                          </CardTitle>
                          <CardDescription>
                            {reclamacao.cidadao} - {reclamacao.contato}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{reclamacao.tipo}</Badge>
                          <Badge variant={
                            reclamacao.status === 'resolvida' ? 'default' :
                            reclamacao.status === 'em_analise' ? 'default' : 'secondary'
                          }>
                            {reclamacao.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Descrição</Label>
                        <p className="text-sm">{reclamacao.descricao}</p>
                      </div>
                      {reclamacao.resposta && (
                        <div className="space-y-2 mt-4">
                          <Label className="text-sm font-medium">Resposta</Label>
                          <p className="text-sm bg-muted p-3 rounded">{reclamacao.resposta}</p>
                        </div>
                      )}
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
                Serviços disponibilizados no catálogo público a partir dos dados de progresso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Relatório de Progresso
                    </CardTitle>
                    <CardDescription>
                      Consulta pública do progresso de qualquer obra municipal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Percentual de execução em tempo real</li>
                      <li>• Cronograma atualizado</li>
                      <li>• Valor executado vs orçado</li>
                      <li>• Responsáveis pela obra</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      Vistoria de Obra
                    </CardTitle>
                    <CardDescription>
                      Solicitação de vistoria técnica em obra pública
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Agendamento de vistoria</li>
                      <li>• Relatórios de qualidade</li>
                      <li>• Acompanhamento técnico</li>
                      <li>• Histórico de vistorias</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-red-500" />
                      Reclamação de Qualidade
                    </CardTitle>
                    <CardDescription>
                      Canal para reportar problemas em obras públicas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Formulário de reclamação</li>
                      <li>• Acompanhamento da análise</li>
                      <li>• Resposta oficial</li>
                      <li>• Status da resolução</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-yellow-500" />
                      Entrega de Obra
                    </CardTitle>
                    <CardDescription>
                      Informações sobre conclusão e entrega de obras
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Comunicação de entrega</li>
                      <li>• Termo de recebimento</li>
                      <li>• Garantias e manutenção</li>
                      <li>• Documentação técnica</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">Integração com Catálogo Público</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Todos os serviços são gerados automaticamente a partir dos dados de progresso das obras,
                      garantindo informações sempre atualizadas para os cidadãos.
                    </p>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <strong>Atualizações:</strong> Tempo real
                      </div>
                      <div>
                        <strong>Disponibilidade:</strong> 24/7
                      </div>
                      <div>
                        <strong>Transparência:</strong> Total
                      </div>
                      <div>
                        <strong>Interatividade:</strong> Bidirecional
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