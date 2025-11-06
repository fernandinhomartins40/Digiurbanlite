'use client'

import { useState } from 'react'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
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
  Briefcase, Calendar, DollarSign, FileText, Users, Target, Clock,
  CheckCircle, AlertTriangle, TrendingUp, Award, Star, Edit, Eye,
  Plus, Search, Filter, Download, Upload, Palette, Music, Theater
} from 'lucide-react'

interface ProjetoCultural {
  id: string
  codigo: string
  nome: string
  categoria: 'musica' | 'teatro' | 'danca' | 'artes_visuais' | 'literatura' | 'audiovisual' | 'cultura_popular' | 'patrimonio' | 'formacao' | 'inclusao'
  tipo: 'edital' | 'fomento_direto' | 'parceria' | 'interno' | 'federal' | 'estadual'
  proponente: string
  responsavel_projeto: string
  responsavel_municipal: string
  data_inicio: string
  data_fim: string
  duracao_meses: number
  orcamento_total: number
  orcamento_municipal: number
  orcamento_externo?: number
  fonte_recurso: string
  status: 'em_elaboracao' | 'submetido' | 'aprovado' | 'em_execucao' | 'concluido' | 'cancelado' | 'suspenso'
  percentual_execucao: number
  publico_alvo: string
  publico_estimado: number
  objetivos: string
  justificativa: string
  metodologia: string
  cronograma: EtapaProjeto[]
  resultados_esperados: string
  indicadores: string
  prestacao_contas?: string
  observacoes: string
  anexos: string[]
}

interface EtapaProjeto {
  id: string
  nome: string
  descricao: string
  data_inicio: string
  data_fim: string
  responsavel: string
  status: 'nao_iniciada' | 'em_andamento' | 'concluida' | 'atrasada'
  entregaveis: string[]
}

interface Edital {
  id: string
  nome: string
  categoria: string
  valor_total: number
  valor_projeto_min: number
  valor_projeto_max: number
  data_abertura: string
  data_fechamento: string
  data_resultado: string
  status: 'em_elaboracao' | 'aberto' | 'fechado' | 'avaliacao' | 'finalizado'
  criterios: string[]
  documentos_necessarios: string[]
  projetos_inscritos: number
  projetos_aprovados?: number
}

export default function ProjetosCulturaisPage() {
  const { user } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()

  if (!['admin', 'cultura'].some(permission => hasPermission(permission))) {
    return <div className="p-6">Acesso negado. Você não tem permissão para acessar esta página.</div>
  }

  const [projetos, setProjetos] = useState<ProjetoCultural[]>([
    {
      id: '1',
      codigo: 'PROJ-2024-001',
      nome: 'Festival de Música Popular Brasileira',
      categoria: 'musica',
      tipo: 'fomento_direto',
      proponente: 'Associação Musical Melodia',
      responsavel_projeto: 'Carlos Silva',
      responsavel_municipal: 'Ana Costa',
      data_inicio: '2024-07-01',
      data_fim: '2024-12-31',
      duracao_meses: 6,
      orcamento_total: 150000,
      orcamento_municipal: 100000,
      orcamento_externo: 50000,
      fonte_recurso: 'Municipal + Patrocínio',
      status: 'em_execucao',
      percentual_execucao: 45,
      publico_alvo: 'Público geral, jovens e adultos',
      publico_estimado: 5000,
      objetivos: 'Promover a música popular brasileira e valorizar artistas locais',
      justificativa: 'Necessidade de fortalecimento da cena musical local',
      metodologia: 'Shows mensais, oficinas e workshops',
      cronograma: [
        {
          id: '1',
          nome: 'Pré-produção',
          descricao: 'Seleção de artistas e planejamento',
          data_inicio: '2024-07-01',
          data_fim: '2024-07-31',
          responsavel: 'Carlos Silva',
          status: 'concluida',
          entregaveis: ['Lista de artistas', 'Cronograma detalhado']
        },
        {
          id: '2',
          nome: 'Execução dos shows',
          descricao: 'Realização dos eventos musicais',
          data_inicio: '2024-08-01',
          data_fim: '2024-11-30',
          responsavel: 'Equipe produção',
          status: 'em_andamento',
          entregaveis: ['Shows realizados', 'Relatórios de público']
        }
      ],
      resultados_esperados: 'Fortalecimento da cena musical, formação de público',
      indicadores: 'Público atingido, número de artistas envolvidos, satisfação',
      observacoes: 'Projeto em andamento conforme cronograma',
      anexos: ['projeto_completo.pdf', 'orcamento_detalhado.xlsx']
    },
    {
      id: '2',
      codigo: 'PROJ-2024-002',
      nome: 'Oficinas de Teatro para Jovens',
      categoria: 'teatro',
      tipo: 'interno',
      proponente: 'Secretaria de Cultura',
      responsavel_projeto: 'Maria Santos',
      responsavel_municipal: 'João Costa',
      data_inicio: '2024-06-01',
      data_fim: '2024-11-30',
      duracao_meses: 6,
      orcamento_total: 80000,
      orcamento_municipal: 80000,
      fonte_recurso: 'Municipal',
      status: 'aprovado',
      percentual_execucao: 25,
      publico_alvo: 'Jovens de 14 a 18 anos',
      publico_estimado: 60,
      objetivos: 'Formar jovens em artes cênicas e promover inclusão social',
      justificativa: 'Carência de atividades culturais para jovens',
      metodologia: 'Oficinas semanais, montagem de espetáculos',
      cronograma: [],
      resultados_esperados: 'Jovens capacitados, espetáculos produzidos',
      indicadores: 'Número de participantes, espetáculos montados',
      observacoes: 'Aguardando início das atividades',
      anexos: ['projeto_pedagogico.pdf']
    }
  ])

  const [editais, setEditais] = useState<Edital[]>([
    {
      id: '1',
      nome: 'Edital de Fomento à Cultura Popular 2024',
      categoria: 'cultura_popular',
      valor_total: 300000,
      valor_projeto_min: 10000,
      valor_projeto_max: 50000,
      data_abertura: '2024-06-01',
      data_fechamento: '2024-07-31',
      data_resultado: '2024-08-30',
      status: 'aberto',
      criterios: ['Relevância cultural', 'Viabilidade técnica', 'Contrapartida social'],
      documentos_necessarios: ['Projeto detalhado', 'Orçamento', 'Cronograma', 'Currículo'],
      projetos_inscritos: 15
    },
    {
      id: '2',
      nome: 'Prêmio Jovem Artista 2024',
      categoria: 'formacao',
      valor_total: 100000,
      valor_projeto_min: 5000,
      valor_projeto_max: 20000,
      data_abertura: '2024-05-01',
      data_fechamento: '2024-06-30',
      data_resultado: '2024-07-30',
      status: 'avaliacao',
      criterios: ['Originalidade', 'Potencial artístico', 'Impacto social'],
      documentos_necessarios: ['Portfolio', 'Projeto artístico', 'Declaração de idade'],
      projetos_inscritos: 25,
      projetos_aprovados: 8
    }
  ])

  const [novoProjeto, setNovoProjeto] = useState<Partial<ProjetoCultural>>({
    categoria: 'musica',
    tipo: 'fomento_direto',
    status: 'em_elaboracao',
    percentual_execucao: 0
  })

  const [novoEdital, setNovoEdital] = useState<Partial<Edital>>({
    status: 'em_elaboracao',
    criterios: [],
    documentos_necessarios: []
  })

  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [busca, setBusca] = useState('')
  const [showProjetoDialog, setShowProjetoDialog] = useState(false)
  const [showEditalDialog, setShowEditalDialog] = useState(false)

  const projetosFiltrados = projetos.filter(projeto => {
    const matchStatus = !filtroStatus || projeto.status === filtroStatus
    const matchCategoria = !filtroCategoria || projeto.categoria === filtroCategoria
    const matchTipo = !filtroTipo || projeto.tipo === filtroTipo
    const matchBusca = !busca ||
      projeto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      projeto.proponente.toLowerCase().includes(busca.toLowerCase()) ||
      projeto.codigo.toLowerCase().includes(busca.toLowerCase())

    return matchStatus && matchCategoria && matchTipo && matchBusca
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'em_elaboracao': { variant: 'secondary', label: 'Em Elaboração' },
      'submetido': { variant: 'default', label: 'Submetido' },
      'aprovado': { variant: 'success', label: 'Aprovado' },
      'em_execucao': { variant: 'default', label: 'Em Execução' },
      'concluido': { variant: 'success', label: 'Concluído' },
      'cancelado': { variant: 'destructive', label: 'Cancelado' },
      'suspenso': { variant: 'destructive', label: 'Suspenso' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getEditalStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'em_elaboracao': { variant: 'secondary', label: 'Em Elaboração' },
      'aberto': { variant: 'success', label: 'Aberto' },
      'fechado': { variant: 'default', label: 'Fechado' },
      'avaliacao': { variant: 'default', label: 'Em Avaliação' },
      'finalizado': { variant: 'success', label: 'Finalizado' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'musica': 'Música',
      'teatro': 'Teatro',
      'danca': 'Dança',
      'artes_visuais': 'Artes Visuais',
      'literatura': 'Literatura',
      'audiovisual': 'Audiovisual',
      'cultura_popular': 'Cultura Popular',
      'patrimonio': 'Patrimônio',
      'formacao': 'Formação',
      'inclusao': 'Inclusão'
    }
    return labels[categoria] || categoria
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'edital': 'Edital',
      'fomento_direto': 'Fomento Direto',
      'parceria': 'Parceria',
      'interno': 'Interno',
      'federal': 'Federal',
      'estadual': 'Estadual'
    }
    return labels[tipo] || tipo
  }

  const execucaoData = [
    { name: 'Jan', projetos: 8, orcamento: 450000 },
    { name: 'Fev', projetos: 12, orcamento: 680000 },
    { name: 'Mar', projetos: 15, orcamento: 720000 },
    { name: 'Abr', projetos: 18, orcamento: 850000 },
    { name: 'Mai', projetos: 22, orcamento: 920000 }
  ]

  const categoriaData = [
    { name: 'Música', value: 8, color: '#8B5CF6' },
    { name: 'Teatro', value: 6, color: '#06B6D4' },
    { name: 'Artes Visuais', value: 4, color: '#84CC16' },
    { name: 'Cultura Popular', value: 5, color: '#F97316' },
    { name: 'Outros', value: 3, color: '#6B7280' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projetos Culturais</h1>
          <p className="text-muted-foreground">
            Gestão de projetos de médio/longo prazo e editais culturais
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showEditalDialog} onOpenChange={setShowEditalDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Award className="h-4 w-4 mr-2" />
                Novo Edital
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Edital Cultural</DialogTitle>
                <DialogDescription>
                  Configure um novo edital de fomento à cultura
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Edital</Label>
                  <Input
                    value={novoEdital.nome || ''}
                    onChange={(e) => setNovoEdital({...novoEdital, nome: e.target.value})}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Categoria</Label>
                    <Input
                      value={novoEdital.categoria || ''}
                      onChange={(e) => setNovoEdital({...novoEdital, categoria: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Valor Total (R$)</Label>
                    <Input
                      type="number"
                      value={novoEdital.valor_total || ''}
                      onChange={(e) => setNovoEdital({...novoEdital, valor_total: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Valor Mínimo por Projeto (R$)</Label>
                    <Input
                      type="number"
                      value={novoEdital.valor_projeto_min || ''}
                      onChange={(e) => setNovoEdital({...novoEdital, valor_projeto_min: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Valor Máximo por Projeto (R$)</Label>
                    <Input
                      type="number"
                      value={novoEdital.valor_projeto_max || ''}
                      onChange={(e) => setNovoEdital({...novoEdital, valor_projeto_max: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Data Abertura</Label>
                    <Input
                      type="date"
                      value={novoEdital.data_abertura || ''}
                      onChange={(e) => setNovoEdital({...novoEdital, data_abertura: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Data Fechamento</Label>
                    <Input
                      type="date"
                      value={novoEdital.data_fechamento || ''}
                      onChange={(e) => setNovoEdital({...novoEdital, data_fechamento: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Data Resultado</Label>
                    <Input
                      type="date"
                      value={novoEdital.data_resultado || ''}
                      onChange={(e) => setNovoEdital({...novoEdital, data_resultado: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowEditalDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Edital</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showProjetoDialog} onOpenChange={setShowProjetoDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Projeto Cultural</DialogTitle>
                <DialogDescription>
                  Registre um novo projeto cultural
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Projeto</Label>
                  <Input
                    value={novoProjeto.nome || ''}
                    onChange={(e) => setNovoProjeto({...novoProjeto, nome: e.target.value})}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={novoProjeto.categoria} onValueChange={(value) => setNovoProjeto({...novoProjeto, categoria: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="musica">Música</SelectItem>
                        <SelectItem value="teatro">Teatro</SelectItem>
                        <SelectItem value="danca">Dança</SelectItem>
                        <SelectItem value="artes_visuais">Artes Visuais</SelectItem>
                        <SelectItem value="literatura">Literatura</SelectItem>
                        <SelectItem value="audiovisual">Audiovisual</SelectItem>
                        <SelectItem value="cultura_popular">Cultura Popular</SelectItem>
                        <SelectItem value="patrimonio">Patrimônio</SelectItem>
                        <SelectItem value="formacao">Formação</SelectItem>
                        <SelectItem value="inclusao">Inclusão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select value={novoProjeto.tipo} onValueChange={(value) => setNovoProjeto({...novoProjeto, tipo: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="edital">Edital</SelectItem>
                        <SelectItem value="fomento_direto">Fomento Direto</SelectItem>
                        <SelectItem value="parceria">Parceria</SelectItem>
                        <SelectItem value="interno">Interno</SelectItem>
                        <SelectItem value="federal">Federal</SelectItem>
                        <SelectItem value="estadual">Estadual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Proponente</Label>
                    <Input
                      value={novoProjeto.proponente || ''}
                      onChange={(e) => setNovoProjeto({...novoProjeto, proponente: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Responsável Municipal</Label>
                    <Input
                      value={novoProjeto.responsavel_municipal || ''}
                      onChange={(e) => setNovoProjeto({...novoProjeto, responsavel_municipal: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={novoProjeto.data_inicio || ''}
                      onChange={(e) => setNovoProjeto({...novoProjeto, data_inicio: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={novoProjeto.data_fim || ''}
                      onChange={(e) => setNovoProjeto({...novoProjeto, data_fim: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Orçamento Total (R$)</Label>
                    <Input
                      type="number"
                      value={novoProjeto.orcamento_total || ''}
                      onChange={(e) => setNovoProjeto({...novoProjeto, orcamento_total: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Orçamento Municipal (R$)</Label>
                    <Input
                      type="number"
                      value={novoProjeto.orcamento_municipal || ''}
                      onChange={(e) => setNovoProjeto({...novoProjeto, orcamento_municipal: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Objetivos</Label>
                  <Textarea
                    value={novoProjeto.objetivos || ''}
                    onChange={(e) => setNovoProjeto({...novoProjeto, objetivos: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Público Estimado</Label>
                  <Input
                    type="number"
                    value={novoProjeto.publico_estimado || ''}
                    onChange={(e) => setNovoProjeto({...novoProjeto, publico_estimado: parseInt(e.target.value)})}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowProjetoDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Projeto</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="projetos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          <TabsTrigger value="editais">Editais</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="projetos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
              <CardDescription>Filtre e pesquise projetos culturais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, código ou proponente..."
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
                    <SelectItem value="em_elaboracao">Em Elaboração</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="em_execucao">Em Execução</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="musica">Música</SelectItem>
                    <SelectItem value="teatro">Teatro</SelectItem>
                    <SelectItem value="danca">Dança</SelectItem>
                    <SelectItem value="cultura_popular">Cultura Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {projetosFiltrados.map((projeto) => (
              <Card key={projeto.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        {projeto.codigo} - {projeto.nome}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {projeto.proponente}
                        </span>
                        <span className="flex items-center gap-1">
                          <Palette className="h-4 w-4" />
                          {getCategoriaLabel(projeto.categoria)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(projeto.status)}
                      <Badge variant="outline">{getTipoLabel(projeto.tipo)}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium">Execução</Label>
                      <Progress value={projeto.percentual_execucao} className="mt-1" />
                      <span className="text-sm text-muted-foreground">{projeto.percentual_execucao}% concluído</span>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Orçamento Total</Label>
                      <p className="text-lg font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                          .format(projeto.orcamento_total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Municipal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                          .format(projeto.orcamento_municipal)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Período</Label>
                      <p className="text-sm">
                        {new Date(projeto.data_inicio).toLocaleDateString('pt-BR')} a{' '}
                        {new Date(projeto.data_fim).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">{projeto.duracao_meses} meses</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Objetivos</Label>
                    <p className="text-sm">{projeto.objetivos}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Público-alvo</Label>
                      <p className="text-sm">{projeto.publico_alvo}</p>
                      <p className="text-xs text-muted-foreground">{projeto.publico_estimado.toLocaleString()} pessoas estimadas</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Responsáveis</Label>
                      <p className="text-sm"><strong>Projeto:</strong> {projeto.responsavel_projeto}</p>
                      <p className="text-sm"><strong>Municipal:</strong> {projeto.responsavel_municipal}</p>
                    </div>
                  </div>

                  {projeto.anexos.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Anexos</Label>
                      <div className="flex gap-2 mt-1">
                        {projeto.anexos.map((anexo, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {anexo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Cronograma
                    </Button>
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Financeiro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editais" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editais Culturais</CardTitle>
              <CardDescription>Gestão de editais de fomento à cultura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editais.map((edital) => (
                  <Card key={edital.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{edital.nome}</CardTitle>
                          <CardDescription>
                            {edital.categoria} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                              .format(edital.valor_total)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getEditalStatusBadge(edital.status)}
                          <Badge variant="outline">{edital.projetos_inscritos} inscritos</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label className="text-sm font-medium">Cronograma</Label>
                          <p className="text-sm">Abertura: {new Date(edital.data_abertura).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm">Fechamento: {new Date(edital.data_fechamento).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm">Resultado: {new Date(edital.data_resultado).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Valores por Projeto</Label>
                          <p className="text-sm">
                            Mín: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                              .format(edital.valor_projeto_min)}
                          </p>
                          <p className="text-sm">
                            Máx: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                              .format(edital.valor_projeto_max)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Resultado</Label>
                          <p className="text-sm">{edital.projetos_inscritos} projetos inscritos</p>
                          {edital.projetos_aprovados && (
                            <p className="text-sm text-green-600">{edital.projetos_aprovados} aprovados</p>
                          )}
                        </div>
                      </div>

                      {edital.criterios.length > 0 && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Critérios de Avaliação</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {edital.criterios.map((criterio, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {criterio}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projetos.filter(p => ['aprovado', 'em_execucao'].includes(p.status)).length}
                </div>
                <p className="text-xs text-muted-foreground">em andamento</p>
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
                  }).format(projetos.reduce((acc, p) => acc + p.orcamento_total, 0))}
                </div>
                <p className="text-xs text-muted-foreground">investimento em cultura</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Editais Abertos</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {editais.filter(e => e.status === 'aberto').length}
                </div>
                <p className="text-xs text-muted-foreground">recebendo inscrições</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Público Impactado</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projetos.reduce((acc, p) => acc + p.publico_estimado, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">pessoas beneficiadas</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Projetos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={execucaoData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="projetos" stroke="#8884d8" name="Nº Projetos" />
                    <Line type="monotone" dataKey="orcamento" stroke="#82ca9d" name="Orçamento (R$)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projetos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoriaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoriaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Gerados Automaticamente</CardTitle>
              <CardDescription>
                Serviços disponibilizados no catálogo público a partir da gestão de projetos culturais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Upload className="h-5 w-5 text-blue-500" />
                      Submissão de Projeto Cultural
                    </CardTitle>
                    <CardDescription>
                      Portal para envio de propostas culturais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Formulário de projeto</li>
                      <li>• Upload de documentos</li>
                      <li>• Acompanhamento de análise</li>
                      <li>• Feedback técnico</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-500" />
                      Edital de Cultura
                    </CardTitle>
                    <CardDescription>
                      Participação em editais municipais de fomento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Editais disponíveis</li>
                      <li>• Cronograma e critérios</li>
                      <li>• Inscrição online</li>
                      <li>• Resultados transparentes</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Apoio a Projetos
                    </CardTitle>
                    <CardDescription>
                      Suporte municipal para iniciativas culturais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Orientação técnica</li>
                      <li>• Apoio financeiro</li>
                      <li>• Parcerias institucionais</li>
                      <li>• Acompanhamento executivo</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Patrocínio Cultural
                    </CardTitle>
                    <CardDescription>
                      Programa de patrocínio a eventos e projetos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Solicitação de patrocínio</li>
                      <li>• Análise de viabilidade</li>
                      <li>• Contrapartidas sociais</li>
                      <li>• Divulgação institucional</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">Ecossistema Cultural Integrado</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      A gestão de projetos culturais alimenta automaticamente o catálogo público
                      com oportunidades de fomento, editais e programas de apoio, criando um
                      ecossistema cultural municipal transparente e acessível.
                    </p>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <strong>Transparência:</strong> Total nos processos
                      </div>
                      <div>
                        <strong>Acompanhamento:</strong> Em tempo real
                      </div>
                      <div>
                        <strong>Participação:</strong> Digital e presencial
                      </div>
                      <div>
                        <strong>Fomento:</strong> Democratizado
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