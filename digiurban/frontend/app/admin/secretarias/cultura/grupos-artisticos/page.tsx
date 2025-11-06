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
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  Users, Music, Theater, Palette, Camera, Mic, Calendar, MapPin,
  Star, Award, Clock, Phone, Mail, FileText, Plus, Edit, Eye,
  Search, Filter, Download, Upload, User, Crown, Activity
} from 'lucide-react'

interface GrupoArtistico {
  id: string
  nome: string
  categoria: 'musica' | 'teatro' | 'danca' | 'artes_visuais' | 'literatura' | 'audiovisual' | 'cultura_popular' | 'circo' | 'coral' | 'orquestra'
  estilo?: string
  data_fundacao: string
  responsavel: string
  contato_principal: string
  email: string
  telefone: string
  endereco_ensaio?: string
  descricao: string
  membros: MembroGrupo[]
  historico_apresentacoes: ApresentacaoGrupo[]
  conquistas: string[]
  equipamentos_proprios: string[]
  necessidades: string[]
  status: 'ativo' | 'inativo' | 'em_formacao' | 'suspenso'
  nivel: 'iniciante' | 'intermediario' | 'avancado' | 'profissional'
  orcamento_anual?: number
  apoio_municipal: boolean
  observacoes: string
  documentos: string[]
  fotos: string[]
  videos: string[]
}

interface MembroGrupo {
  id: string
  nome: string
  data_nascimento: string
  funcao: string
  instrumento?: string
  especialidade?: string
  contato?: string
  data_entrada: string
  ativo: boolean
}

interface ApresentacaoGrupo {
  id: string
  nome_evento: string
  local: string
  data: string
  duracao_minutos?: number
  publico_estimado?: number
  cache?: number
  tipo: 'apresentacao' | 'competicao' | 'workshop' | 'gravacao'
  resultado?: string
  observacoes?: string
}

interface Manifestacao {
  id: string
  nome: string
  tipo: 'festa_popular' | 'ritual' | 'artesanato' | 'culinaria' | 'musica_tradicional' | 'danca_folclorica' | 'literatura_oral' | 'conhecimento_tradicional'
  origem: string
  regiao: string
  periodicidade: 'anual' | 'semestral' | 'mensal' | 'eventual' | 'continua'
  epoca_realizacao: string
  grupos_envolvidos: string[]
  descricao: string
  historia: string
  caracteristicas: string[]
  materiais_utilizados: string[]
  transmissao_conhecimento: string
  situacao_atual: 'ativa' | 'em_risco' | 'vulneravel' | 'extinta'
  acoes_salvaguarda: string[]
  documentacao: string[]
  status_registro: 'nao_registrada' | 'em_processo' | 'registrada_municipal' | 'registrada_estadual' | 'registrada_nacional'
}

export default function GruposArtisticosPage() {
  const { user } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()

  if (!['admin', 'cultura'].some(permission => hasPermission(permission))) {
    return <div className="p-6">Acesso negado. Você não tem permissão para acessar esta página.</div>
  }

  const [grupos, setGrupos] = useState<GrupoArtistico[]>([
    {
      id: '1',
      nome: 'Orquestra Jovem Municipal',
      categoria: 'orquestra',
      estilo: 'Clássica e Popular',
      data_fundacao: '2020-03-15',
      responsavel: 'Maestro Carlos Silva',
      contato_principal: 'Carlos Silva',
      email: 'orquestra@cultura.gov.br',
      telefone: '(11) 98888-8888',
      endereco_ensaio: 'Centro Cultural Municipal',
      descricao: 'Orquestra juvenil que promove educação musical e apresentações públicas',
      membros: [
        {
          id: '1',
          nome: 'Ana Costa',
          data_nascimento: '2005-08-12',
          funcao: 'Spalla',
          instrumento: 'Violino',
          data_entrada: '2020-03-15',
          ativo: true
        },
        {
          id: '2',
          nome: 'Pedro Santos',
          data_nascimento: '2004-11-20',
          funcao: 'Músico',
          instrumento: 'Violoncelo',
          data_entrada: '2020-04-01',
          ativo: true
        }
      ],
      historico_apresentacoes: [
        {
          id: '1',
          nome_evento: 'Concerto de Natal 2023',
          local: 'Teatro Municipal',
          data: '2023-12-15',
          duracao_minutos: 90,
          publico_estimado: 300,
          tipo: 'apresentacao',
          observacoes: 'Excelente receptividade do público'
        }
      ],
      conquistas: ['1º lugar Festival Jovens Talentos 2023', 'Prêmio Cultura Viva 2022'],
      equipamentos_proprios: ['Partituras', 'Estantes'],
      necessidades: ['Instrumentos de sopro', 'Transporte para apresentações'],
      status: 'ativo',
      nivel: 'intermediario',
      orcamento_anual: 80000,
      apoio_municipal: true,
      observacoes: 'Grupo prioritário para investimento',
      documentos: ['estatuto.pdf', 'regimento_interno.pdf'],
      fotos: ['orquestra_ensaio.jpg', 'concerto_natal.jpg'],
      videos: ['concerto_2023.mp4']
    },
    {
      id: '2',
      nome: 'Grupo Teatral Esperança',
      categoria: 'teatro',
      estilo: 'Teatro Social',
      data_fundacao: '2018-06-10',
      responsavel: 'Maria Santos',
      contato_principal: 'Maria Santos',
      email: 'teatroesperanca@email.com',
      telefone: '(11) 97777-7777',
      endereco_ensaio: 'Sala de Ensaio - Rua das Artes, 200',
      descricao: 'Grupo focado em teatro social e educativo para todas as idades',
      membros: [
        {
          id: '1',
          nome: 'João Oliveira',
          data_nascimento: '1985-03-22',
          funcao: 'Ator',
          especialidade: 'Teatro infantil',
          data_entrada: '2018-06-10',
          ativo: true
        }
      ],
      historico_apresentacoes: [
        {
          id: '1',
          nome_evento: 'O Pequeno Príncipe',
          local: 'Teatro Municipal',
          data: '2024-06-22',
          duracao_minutos: 90,
          publico_estimado: 280,
          cache: 8000,
          tipo: 'apresentacao'
        }
      ],
      conquistas: ['Melhor Grupo Regional 2023'],
      equipamentos_proprios: ['Figurinos', 'Cenários móveis'],
      necessidades: ['Iluminação própria', 'Van para transporte'],
      status: 'ativo',
      nivel: 'avancado',
      apoio_municipal: true,
      observacoes: 'Grupo com forte atuação comunitária',
      documentos: ['projeto_social.pdf'],
      fotos: ['grupo_teatro.jpg'],
      videos: []
    }
  ])

  const [manifestacoes, setManifestacoes] = useState<Manifestacao[]>([
    {
      id: '1',
      nome: 'Festa de São João Municipal',
      tipo: 'festa_popular',
      origem: 'Tradição portuguesa adaptada localmente',
      regiao: 'Todo o município',
      periodicidade: 'anual',
      epoca_realizacao: 'Junho',
      grupos_envolvidos: ['Grupo de Quadrilha Unidos do São João', 'Banda de Forró Tradicional'],
      descricao: 'Festa junina tradicional com quadrilhas, fogueira, comidas típicas',
      historia: 'Tradição iniciada pelos primeiros colonos em 1950',
      caracteristicas: ['Quadrilha', 'Fogueira', 'Comidas típicas', 'Música caipira'],
      materiais_utilizados: ['Bandeirolas', 'Chapéus de palha', 'Roupas caipiras'],
      transmissao_conhecimento: 'Passada por gerações através de grupos locais',
      situacao_atual: 'ativa',
      acoes_salvaguarda: ['Oficinas anuais', 'Documentação audiovisual'],
      documentacao: ['video_festa_2023.mp4', 'entrevistas_mestres.pdf'],
      status_registro: 'registrada_municipal'
    }
  ])

  const [novoGrupo, setNovoGrupo] = useState<Partial<GrupoArtistico>>({
    categoria: 'musica',
    status: 'ativo',
    nivel: 'iniciante',
    apoio_municipal: false,
    membros: [],
    historico_apresentacoes: [],
    conquistas: [],
    equipamentos_proprios: [],
    necessidades: [],
    documentos: [],
    fotos: [],
    videos: []
  })

  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroNivel, setFiltroNivel] = useState('')
  const [busca, setBusca] = useState('')
  const [showGrupoDialog, setShowGrupoDialog] = useState(false)

  const gruposFiltrados = grupos.filter(grupo => {
    const matchStatus = !filtroStatus || grupo.status === filtroStatus
    const matchCategoria = !filtroCategoria || grupo.categoria === filtroCategoria
    const matchNivel = !filtroNivel || grupo.nivel === filtroNivel
    const matchBusca = !busca ||
      grupo.nome.toLowerCase().includes(busca.toLowerCase()) ||
      grupo.responsavel.toLowerCase().includes(busca.toLowerCase())

    return matchStatus && matchCategoria && matchNivel && matchBusca
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'ativo': { variant: 'success', label: 'Ativo' },
      'inativo': { variant: 'secondary', label: 'Inativo' },
      'em_formacao': { variant: 'default', label: 'Em Formação' },
      'suspenso': { variant: 'destructive', label: 'Suspenso' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getNivelBadge = (nivel: string) => {
    const variants: Record<string, any> = {
      'iniciante': { variant: 'secondary', label: 'Iniciante' },
      'intermediario': { variant: 'default', label: 'Intermediário' },
      'avancado': { variant: 'destructive', label: 'Avançado' },
      'profissional': { variant: 'success', label: 'Profissional' }
    }
    const config = variants[nivel] || { variant: 'default', label: nivel }
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
      'circo': 'Circo',
      'coral': 'Coral',
      'orquestra': 'Orquestra'
    }
    return labels[categoria] || categoria
  }

  const getSituacaoBadge = (situacao: string) => {
    const variants: Record<string, any> = {
      'ativa': { variant: 'success', label: 'Ativa' },
      'em_risco': { variant: 'destructive', label: 'Em Risco' },
      'vulneravel': { variant: 'secondary', label: 'Vulnerável' },
      'extinta': { variant: 'destructive', label: 'Extinta' }
    }
    const config = variants[situacao] || { variant: 'default', label: situacao }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const ativosData = [
    { name: 'Jan', grupos: 12, apresentacoes: 8 },
    { name: 'Fev', grupos: 14, apresentacoes: 12 },
    { name: 'Mar', grupos: 15, apresentacoes: 18 },
    { name: 'Abr', grupos: 16, apresentacoes: 15 },
    { name: 'Mai', grupos: 18, apresentacoes: 22 }
  ]

  const categoriaData = [
    { name: 'Música', value: 8, color: '#8B5CF6' },
    { name: 'Teatro', value: 5, color: '#06B6D4' },
    { name: 'Dança', value: 4, color: '#84CC16' },
    { name: 'Artes Visuais', value: 3, color: '#F97316' },
    { name: 'Outros', value: 4, color: '#6B7280' }
  ]

  const calcularIdadeGrupo = (dataFundacao: string) => {
    const fundacao = new Date(dataFundacao)
    const hoje = new Date()
    const anos = hoje.getFullYear() - fundacao.getFullYear()
    return anos
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Grupos Artísticos</h1>
          <p className="text-muted-foreground">
            Cadastro e gestão de grupos culturais municipais
          </p>
        </div>
        <Dialog open={showGrupoDialog} onOpenChange={setShowGrupoDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Grupo Artístico</DialogTitle>
              <DialogDescription>
                Cadastre um novo grupo cultural
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Grupo</Label>
                <Input
                  value={novoGrupo.nome || ''}
                  onChange={(e) => setNovoGrupo({...novoGrupo, nome: e.target.value})}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={novoGrupo.categoria} onValueChange={(value) => setNovoGrupo({...novoGrupo, categoria: value as any})}>
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
                      <SelectItem value="circo">Circo</SelectItem>
                      <SelectItem value="coral">Coral</SelectItem>
                      <SelectItem value="orquestra">Orquestra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nível</Label>
                  <Select value={novoGrupo.nivel} onValueChange={(value) => setNovoGrupo({...novoGrupo, nivel: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={novoGrupo.status} onValueChange={(value) => setNovoGrupo({...novoGrupo, status: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="em_formacao">Em Formação</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Responsável</Label>
                  <Input
                    value={novoGrupo.responsavel || ''}
                    onChange={(e) => setNovoGrupo({...novoGrupo, responsavel: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Data de Fundação</Label>
                  <Input
                    type="date"
                    value={novoGrupo.data_fundacao || ''}
                    onChange={(e) => setNovoGrupo({...novoGrupo, data_fundacao: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={novoGrupo.email || ''}
                    onChange={(e) => setNovoGrupo({...novoGrupo, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={novoGrupo.telefone || ''}
                    onChange={(e) => setNovoGrupo({...novoGrupo, telefone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={novoGrupo.descricao || ''}
                  onChange={(e) => setNovoGrupo({...novoGrupo, descricao: e.target.value})}
                />
              </div>

              <div>
                <Label>Local de Ensaio</Label>
                <Input
                  value={novoGrupo.endereco_ensaio || ''}
                  onChange={(e) => setNovoGrupo({...novoGrupo, endereco_ensaio: e.target.value})}
                />
              </div>

              <div>
                <Label>Estilo/Especialidade</Label>
                <Input
                  value={novoGrupo.estilo || ''}
                  onChange={(e) => setNovoGrupo({...novoGrupo, estilo: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={novoGrupo.apoio_municipal}
                  onChange={(e) => setNovoGrupo({...novoGrupo, apoio_municipal: e.target.checked})}
                />
                <Label>Recebe apoio municipal</Label>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowGrupoDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar Grupo</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="grupos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="grupos">Grupos Artísticos</TabsTrigger>
          <TabsTrigger value="manifestacoes">Manifestações Culturais</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="grupos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
              <CardDescription>Filtre e pesquise grupos artísticos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou responsável..."
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
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="em_formacao">Em Formação</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
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
                    <SelectItem value="orquestra">Orquestra</SelectItem>
                    <SelectItem value="coral">Coral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {gruposFiltrados.map((grupo) => (
              <Card key={grupo.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {grupo.nome}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {grupo.responsavel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {calcularIdadeGrupo(grupo.data_fundacao)} anos
                        </span>
                        {grupo.estilo && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {grupo.estilo}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(grupo.status)}
                      <Badge variant="outline">{getCategoriaLabel(grupo.categoria)}</Badge>
                      {getNivelBadge(grupo.nivel)}
                      {grupo.apoio_municipal && <Badge variant="default">Apoio Municipal</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Descrição</Label>
                    <p className="text-sm">{grupo.descricao}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium">Membros</Label>
                      <p className="text-sm">{grupo.membros.filter(m => m.ativo).length} ativos</p>
                      <p className="text-xs text-muted-foreground">
                        Total: {grupo.membros.length} cadastrados
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Apresentações</Label>
                      <p className="text-sm">{grupo.historico_apresentacoes.length} realizadas</p>
                      {grupo.historico_apresentacoes.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Última: {new Date(grupo.historico_apresentacoes[grupo.historico_apresentacoes.length - 1].data)
                            .toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Contato</Label>
                      <p className="text-sm">{grupo.telefone}</p>
                      <p className="text-xs text-muted-foreground">{grupo.email}</p>
                    </div>
                  </div>

                  {grupo.endereco_ensaio && (
                    <div>
                      <Label className="text-sm font-medium">Local de Ensaio</Label>
                      <p className="text-sm">{grupo.endereco_ensaio}</p>
                    </div>
                  )}

                  {grupo.conquistas.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Conquistas</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {grupo.conquistas.map((conquista, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {conquista}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {grupo.equipamentos_proprios.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Equipamentos Próprios</Label>
                      <p className="text-sm text-muted-foreground">
                        {grupo.equipamentos_proprios.join(', ')}
                      </p>
                    </div>
                  )}

                  {grupo.necessidades.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Necessidades</Label>
                      <p className="text-sm text-muted-foreground">
                        {grupo.necessidades.join(', ')}
                      </p>
                    </div>
                  )}

                  {grupo.orcamento_anual && (
                    <div>
                      <Label className="text-sm font-medium">Orçamento Anual</Label>
                      <p className="text-sm font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                          .format(grupo.orcamento_anual)}
                      </p>
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
                      <Users className="h-4 w-4 mr-1" />
                      Membros
                    </Button>
                    <Button variant="outline" size="sm">
                      <Activity className="h-4 w-4 mr-1" />
                      Histórico
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="manifestacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manifestações Culturais</CardTitle>
              <CardDescription>Patrimônio cultural imaterial municipal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {manifestacoes.map((manifestacao) => (
                  <Card key={manifestacao.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{manifestacao.nome}</CardTitle>
                          <CardDescription>
                            {manifestacao.tipo.replace('_', ' ')} - {manifestacao.regiao}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getSituacaoBadge(manifestacao.situacao_atual)}
                          <Badge variant="outline">{manifestacao.periodicidade}</Badge>
                          <Badge variant={
                            manifestacao.status_registro === 'registrada_municipal' ? 'default' :
                            manifestacao.status_registro === 'em_processo' ? 'outline' : 'secondary'
                          }>
                            {manifestacao.status_registro.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Descrição</Label>
                        <p className="text-sm">{manifestacao.descricao}</p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-sm font-medium">Origem e História</Label>
                          <p className="text-sm">{manifestacao.origem}</p>
                          <p className="text-xs text-muted-foreground mt-1">{manifestacao.historia}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Época de Realização</Label>
                          <p className="text-sm">{manifestacao.epoca_realizacao}</p>
                          <p className="text-xs text-muted-foreground">Periodicidade: {manifestacao.periodicidade}</p>
                        </div>
                      </div>

                      {manifestacao.grupos_envolvidos.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Grupos Envolvidos</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {manifestacao.grupos_envolvidos.map((grupo, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {grupo}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {manifestacao.caracteristicas.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Características</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {manifestacao.caracteristicas.map((caracteristica, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {caracteristica}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Transmissão do Conhecimento</Label>
                        <p className="text-sm">{manifestacao.transmissao_conhecimento}</p>
                      </div>

                      {manifestacao.acoes_salvaguarda.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Ações de Salvaguarda</Label>
                          <ul className="text-sm list-disc list-inside">
                            {manifestacao.acoes_salvaguarda.map((acao, index) => (
                              <li key={index}>{acao}</li>
                            ))}
                          </ul>
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
                <CardTitle className="text-sm font-medium">Grupos Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {grupos.filter(g => g.status === 'ativo').length}
                </div>
                <p className="text-xs text-muted-foreground">em atividade</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {grupos.reduce((acc, g) => acc + g.membros.filter(m => m.ativo).length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">artistas cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Apresentações</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {grupos.reduce((acc, g) => acc + g.historico_apresentacoes.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">realizadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Com Apoio Municipal</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {grupos.filter(g => g.apoio_municipal).length}
                </div>
                <p className="text-xs text-muted-foreground">grupos apoiados</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução dos Grupos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ativosData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="grupos" stroke="#8884d8" name="Grupos Ativos" />
                    <Line type="monotone" dataKey="apresentacoes" stroke="#82ca9d" name="Apresentações" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grupos por Categoria</CardTitle>
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
                Serviços disponibilizados no catálogo público a partir da gestão de grupos artísticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      Cadastro de Grupo Artístico
                    </CardTitle>
                    <CardDescription>
                      Registro oficial de grupos culturais locais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Formulário de cadastro</li>
                      <li>• Documentação necessária</li>
                      <li>• Validação municipal</li>
                      <li>• Certificado de registro</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-purple-500" />
                      Apresentação Cultural
                    </CardTitle>
                    <CardDescription>
                      Oportunidades de apresentação para grupos locais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Agenda de apresentações</li>
                      <li>• Contratação para eventos</li>
                      <li>• Apoio técnico e logístico</li>
                      <li>• Divulgação oficial</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Crown className="h-5 w-5 text-green-500" />
                      Apoio a Grupos
                    </CardTitle>
                    <CardDescription>
                      Programa de fomento a grupos artísticos locais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Solicitação de apoio</li>
                      <li>• Avaliação de projeto</li>
                      <li>• Fomento financeiro</li>
                      <li>• Acompanhamento técnico</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-yellow-500" />
                      Registro de Manifestação
                    </CardTitle>
                    <CardDescription>
                      Documentação do patrimônio cultural imaterial
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Pesquisa cultural</li>
                      <li>• Documentação audiovisual</li>
                      <li>• Registro oficial</li>
                      <li>• Ações de salvaguarda</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">Ecossistema Artístico Municipal</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      A gestão de grupos artísticos alimenta automaticamente o catálogo público
                      com oportunidades de apresentação, apoio cultural e registro de manifestações,
                      fortalecendo o ecossistema artístico local.
                    </p>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <strong>Cadastro:</strong> Simplificado e digital
                      </div>
                      <div>
                        <strong>Apoio:</strong> Técnico e financeiro
                      </div>
                      <div>
                        <strong>Oportunidades:</strong> Apresentações regulares
                      </div>
                      <div>
                        <strong>Preservação:</strong> Patrimônio cultural
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