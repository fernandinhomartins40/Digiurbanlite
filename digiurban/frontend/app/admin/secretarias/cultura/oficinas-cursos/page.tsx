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
  GraduationCap, Users, Calendar, Clock, DollarSign, Star, Award, BookOpen,
  User, MapPin, FileText, CheckCircle, AlertTriangle, Music, Palette,
  Camera, Mic, Theater, Plus, Edit, Eye, Search, Filter, Download
} from 'lucide-react'

interface OficinaCurso {
  id: string
  codigo: string
  nome: string
  categoria: 'musica' | 'artes_visuais' | 'teatro' | 'danca' | 'literatura' | 'artesanato' | 'fotografia' | 'audiovisual' | 'cultura_popular' | 'multimidia'
  modalidade: 'presencial' | 'online' | 'hibrida'
  nivel: 'iniciante' | 'intermediario' | 'avancado' | 'livre'
  instrutor: string
  curriculo_instrutor: string
  carga_horaria: number
  duracao_semanas: number
  vagas_totais: number
  vagas_ocupadas: number
  idade_minima: number
  idade_maxima?: number
  valor: number
  gratuita: boolean
  local: string
  endereco: string
  data_inicio: string
  data_fim: string
  dias_semana: string[]
  horario_inicio: string
  horario_fim: string
  descricao: string
  objetivos: string
  conteudo_programatico: string[]
  materiais_inclusos: string[]
  materiais_aluno: string[]
  pre_requisitos: string[]
  certificacao: boolean
  tipo_certificado: string
  status: 'planejamento' | 'inscricoes_abertas' | 'em_andamento' | 'concluida' | 'cancelada'
  observacoes: string
}

interface InscricaoOficina {
  id: string
  oficinaId: string
  participante: string
  data_nascimento: string
  responsavel?: string
  email: string
  telefone: string
  endereco: string
  experiencia_previa: string
  motivacao: string
  data_inscricao: string
  status: 'inscrito' | 'confirmado' | 'lista_espera' | 'desistente' | 'concluido'
  frequencia: number
  nota_final?: number
  certificado_emitido: boolean
  avaliacao_curso?: number
  comentarios?: string
}

interface Instrutor {
  id: string
  nome: string
  especialidades: string[]
  formacao: string
  experiencia_anos: number
  curriculo: string
  contato: string
  email: string
  valor_hora: number
  disponibilidade: string[]
  avaliacao_media: number
  cursos_ministrados: number
  status: 'ativo' | 'inativo'
}

export default function OficinasCursosPage() {
  const { user } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()

  if (!['admin', 'cultura'].some(permission => hasPermission(permission))) {
    return <div className="p-6">Acesso negado. Você não tem permissão para acessar esta página.</div>
  }

  const [oficinas, setOficinas] = useState<OficinaCurso[]>([
    {
      id: '1',
      codigo: 'OF-2024-001',
      nome: 'Iniciação Musical - Violão',
      categoria: 'musica',
      modalidade: 'presencial',
      nivel: 'iniciante',
      instrutor: 'João Santos',
      curriculo_instrutor: 'Músico formado pela EMESP, 15 anos de experiência',
      carga_horaria: 40,
      duracao_semanas: 10,
      vagas_totais: 20,
      vagas_ocupadas: 18,
      idade_minima: 12,
      idade_maxima: 65,
      valor: 200,
      gratuita: true,
      local: 'Centro Cultural Municipal',
      endereco: 'Av. das Artes, 500',
      data_inicio: '2024-07-01',
      data_fim: '2024-09-09',
      dias_semana: ['Segunda', 'Quarta'],
      horario_inicio: '19:00',
      horario_fim: '21:00',
      descricao: 'Curso básico de violão popular para iniciantes',
      objetivos: 'Aprender os fundamentos básicos do violão e tocar músicas simples',
      conteudo_programatico: [
        'Postura e empunhadura',
        'Acordes básicos',
        'Ritmos simples',
        'Repertório popular'
      ],
      materiais_inclusos: ['Apostila', 'Partituras'],
      materiais_aluno: ['Violão', 'Palheta'],
      pre_requisitos: ['Nenhum'],
      certificacao: true,
      tipo_certificado: 'Certificado de Participação',
      status: 'inscricoes_abertas',
      observacoes: 'Curso muito procurado'
    },
    {
      id: '2',
      codigo: 'OF-2024-002',
      nome: 'Pintura em Tela - Técnicas Básicas',
      categoria: 'artes_visuais',
      modalidade: 'presencial',
      nivel: 'iniciante',
      instrutor: 'Maria Silva',
      curriculo_instrutor: 'Artista plástica formada pela USP, expõe desde 2010',
      carga_horaria: 30,
      duracao_semanas: 8,
      vagas_totais: 15,
      vagas_ocupadas: 12,
      idade_minima: 16,
      valor: 350,
      gratuita: false,
      local: 'Ateliê Municipal',
      endereco: 'Rua das Artes, 150',
      data_inicio: '2024-06-15',
      data_fim: '2024-08-10',
      dias_semana: ['Sábado'],
      horario_inicio: '14:00',
      horario_fim: '17:45',
      descricao: 'Curso de pintura em tela com técnicas tradicionais',
      objetivos: 'Desenvolver habilidades básicas de pintura em diferentes técnicas',
      conteudo_programatico: [
        'Materiais e ferramentas',
        'Teoria das cores',
        'Técnicas de pincelada',
        'Composição'
      ],
      materiais_inclusos: ['Telas', 'Tintas', 'Pincéis'],
      materiais_aluno: ['Avental', 'Pano para limpeza'],
      pre_requisitos: ['Interesse em artes visuais'],
      certificacao: true,
      tipo_certificado: 'Certificado de Conclusão',
      status: 'em_andamento',
      observacoes: 'Material incluso no valor'
    }
  ])

  const [inscricoes, setInscricoes] = useState<InscricaoOficina[]>([
    {
      id: '1',
      oficinaId: '1',
      participante: 'Ana Costa',
      data_nascimento: '1995-05-15',
      email: 'ana@email.com',
      telefone: '(11) 99999-9999',
      endereco: 'Rua A, 123',
      experiencia_previa: 'Nenhuma',
      motivacao: 'Sempre quis aprender música',
      data_inscricao: '2024-06-01',
      status: 'confirmado',
      frequencia: 85,
      certificado_emitido: false
    }
  ])

  const [instrutores, setInstrutores] = useState<Instrutor[]>([
    {
      id: '1',
      nome: 'João Santos',
      especialidades: ['Violão', 'Guitarra', 'Música Popular'],
      formacao: 'Bacharel em Música - EMESP',
      experiencia_anos: 15,
      curriculo: 'Músico profissional, professor há 10 anos',
      contato: '(11) 98888-8888',
      email: 'joao@email.com',
      valor_hora: 80,
      disponibilidade: ['Segunda', 'Quarta', 'Sexta'],
      avaliacao_media: 4.8,
      cursos_ministrados: 12,
      status: 'ativo'
    }
  ])

  const [novaOficina, setNovaOficina] = useState<Partial<OficinaCurso>>({
    categoria: 'musica',
    modalidade: 'presencial',
    nivel: 'iniciante',
    gratuita: true,
    status: 'planejamento',
    certificacao: true,
    conteudo_programatico: [],
    materiais_inclusos: [],
    materiais_aluno: [],
    pre_requisitos: [],
    dias_semana: []
  })

  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroModalidade, setFiltroModalidade] = useState('')
  const [busca, setBusca] = useState('')
  const [showOficinaDialog, setShowOficinaDialog] = useState(false)

  const oficinasFiltradas = oficinas.filter(oficina => {
    const matchStatus = !filtroStatus || oficina.status === filtroStatus
    const matchCategoria = !filtroCategoria || oficina.categoria === filtroCategoria
    const matchModalidade = !filtroModalidade || oficina.modalidade === filtroModalidade
    const matchBusca = !busca ||
      oficina.nome.toLowerCase().includes(busca.toLowerCase()) ||
      oficina.instrutor.toLowerCase().includes(busca.toLowerCase()) ||
      oficina.codigo.toLowerCase().includes(busca.toLowerCase())

    return matchStatus && matchCategoria && matchModalidade && matchBusca
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'planejamento': { variant: 'secondary', label: 'Planejamento' },
      'inscricoes_abertas': { variant: 'success', label: 'Inscrições Abertas' },
      'em_andamento': { variant: 'default', label: 'Em Andamento' },
      'concluida': { variant: 'success', label: 'Concluída' },
      'cancelada': { variant: 'destructive', label: 'Cancelada' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getNivelBadge = (nivel: string) => {
    const variants: Record<string, any> = {
      'iniciante': { variant: 'secondary', label: 'Iniciante' },
      'intermediario': { variant: 'default', label: 'Intermediário' },
      'avancado': { variant: 'destructive', label: 'Avançado' },
      'livre': { variant: 'outline', label: 'Livre' }
    }
    const config = variants[nivel] || { variant: 'default', label: nivel }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'musica': 'Música',
      'artes_visuais': 'Artes Visuais',
      'teatro': 'Teatro',
      'danca': 'Dança',
      'literatura': 'Literatura',
      'artesanato': 'Artesanato',
      'fotografia': 'Fotografia',
      'audiovisual': 'Audiovisual',
      'cultura_popular': 'Cultura Popular',
      'multimidia': 'Multimídia'
    }
    return labels[categoria] || categoria
  }

  const getPercentualOcupacao = (oficina: OficinaCurso) => {
    return Math.round((oficina.vagas_ocupadas / oficina.vagas_totais) * 100)
  }

  const demandaData = [
    { name: 'Jan', inscricoes: 45, concluidos: 38 },
    { name: 'Fev', inscricoes: 52, concluidos: 44 },
    { name: 'Mar', inscricoes: 48, concluidos: 41 },
    { name: 'Abr', inscricoes: 61, concluidos: 52 },
    { name: 'Mai', inscricoes: 55, concluidos: 48 }
  ]

  const categoriaData = [
    { name: 'Música', value: 35, color: '#8B5CF6' },
    { name: 'Artes Visuais', value: 28, color: '#06B6D4' },
    { name: 'Teatro', value: 18, color: '#84CC16' },
    { name: 'Dança', value: 12, color: '#F97316' },
    { name: 'Outros', value: 7, color: '#6B7280' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Oficinas e Cursos</h1>
          <p className="text-muted-foreground">
            Gestão educacional de atividades culturais municipais
          </p>
        </div>
        <Dialog open={showOficinaDialog} onOpenChange={setShowOficinaDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Oficina
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Oficina/Curso</DialogTitle>
              <DialogDescription>
                Cadastre uma nova atividade cultural educativa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Oficina/Curso</Label>
                <Input
                  value={novaOficina.nome || ''}
                  onChange={(e) => setNovaOficina({...novaOficina, nome: e.target.value})}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={novaOficina.categoria} onValueChange={(value) => setNovaOficina({...novaOficina, categoria: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="musica">Música</SelectItem>
                      <SelectItem value="artes_visuais">Artes Visuais</SelectItem>
                      <SelectItem value="teatro">Teatro</SelectItem>
                      <SelectItem value="danca">Dança</SelectItem>
                      <SelectItem value="literatura">Literatura</SelectItem>
                      <SelectItem value="artesanato">Artesanato</SelectItem>
                      <SelectItem value="fotografia">Fotografia</SelectItem>
                      <SelectItem value="audiovisual">Audiovisual</SelectItem>
                      <SelectItem value="cultura_popular">Cultura Popular</SelectItem>
                      <SelectItem value="multimidia">Multimídia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modalidade</Label>
                  <Select value={novaOficina.modalidade} onValueChange={(value) => setNovaOficina({...novaOficina, modalidade: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="hibrida">Híbrida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nível</Label>
                  <Select value={novaOficina.nivel} onValueChange={(value) => setNovaOficina({...novaOficina, nivel: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                      <SelectItem value="livre">Livre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Instrutor</Label>
                  <Select value={novaOficina.instrutor} onValueChange={(value) => setNovaOficina({...novaOficina, instrutor: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o instrutor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instrutores.map(instrutor => (
                        <SelectItem key={instrutor.id} value={instrutor.nome}>{instrutor.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Local</Label>
                  <Input
                    value={novaOficina.local || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, local: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>Carga Horária</Label>
                  <Input
                    type="number"
                    value={novaOficina.carga_horaria || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, carga_horaria: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Duração (semanas)</Label>
                  <Input
                    type="number"
                    value={novaOficina.duracao_semanas || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, duracao_semanas: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Vagas Totais</Label>
                  <Input
                    type="number"
                    value={novaOficina.vagas_totais || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, vagas_totais: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    value={novaOficina.valor || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, valor: parseFloat(e.target.value)})}
                    disabled={novaOficina.gratuita}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Idade Mínima</Label>
                  <Input
                    type="number"
                    value={novaOficina.idade_minima || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, idade_minima: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Idade Máxima</Label>
                  <Input
                    type="number"
                    value={novaOficina.idade_maxima || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, idade_maxima: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    checked={novaOficina.gratuita}
                    onChange={(e) => setNovaOficina({...novaOficina, gratuita: e.target.checked, valor: e.target.checked ? 0 : novaOficina.valor})}
                  />
                  <Label>Gratuita</Label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={novaOficina.data_inicio || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, data_inicio: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={novaOficina.data_fim || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, data_fim: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Horário Início</Label>
                  <Input
                    type="time"
                    value={novaOficina.horario_inicio || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, horario_inicio: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Horário Fim</Label>
                  <Input
                    type="time"
                    value={novaOficina.horario_fim || ''}
                    onChange={(e) => setNovaOficina({...novaOficina, horario_fim: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={novaOficina.descricao || ''}
                  onChange={(e) => setNovaOficina({...novaOficina, descricao: e.target.value})}
                />
              </div>

              <div>
                <Label>Objetivos</Label>
                <Textarea
                  value={novaOficina.objetivos || ''}
                  onChange={(e) => setNovaOficina({...novaOficina, objetivos: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={novaOficina.certificacao}
                  onChange={(e) => setNovaOficina({...novaOficina, certificacao: e.target.checked})}
                />
                <Label>Emite certificado</Label>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowOficinaDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar Oficina</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="oficinas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="oficinas">Oficinas e Cursos</TabsTrigger>
          <TabsTrigger value="inscricoes">Inscrições</TabsTrigger>
          <TabsTrigger value="instrutores">Instrutores</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="oficinas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
              <CardDescription>Filtre e pesquise oficinas e cursos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, código ou instrutor..."
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
                    <SelectItem value="inscricoes_abertas">Inscrições Abertas</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="planejamento">Planejamento</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="musica">Música</SelectItem>
                    <SelectItem value="artes_visuais">Artes Visuais</SelectItem>
                    <SelectItem value="teatro">Teatro</SelectItem>
                    <SelectItem value="danca">Dança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {oficinasFiltradas.map((oficina) => (
              <Card key={oficina.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        {oficina.codigo} - {oficina.nome}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {oficina.instrutor}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {oficina.local}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {oficina.carga_horaria}h
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(oficina.status)}
                      <Badge variant="outline">{getCategoriaLabel(oficina.categoria)}</Badge>
                      {getNivelBadge(oficina.nivel)}
                      {oficina.gratuita && <Badge variant="default">Gratuita</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Descrição</Label>
                    <p className="text-sm">{oficina.descricao}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium">Período</Label>
                      <p className="text-sm">
                        {new Date(oficina.data_inicio).toLocaleDateString('pt-BR')} a{' '}
                        {new Date(oficina.data_fim).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {oficina.duracao_semanas} semanas - {oficina.dias_semana.join(', ')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Horário</Label>
                      <p className="text-sm">{oficina.horario_inicio} às {oficina.horario_fim}</p>
                      <p className="text-xs text-muted-foreground">Modalidade: {oficina.modalidade}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Vagas</Label>
                      <Progress value={getPercentualOcupacao(oficina)} className="mt-1" />
                      <span className="text-sm">{oficina.vagas_ocupadas}/{oficina.vagas_totais} ocupadas</span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium">Faixa Etária</Label>
                      <p className="text-sm">
                        {oficina.idade_minima}+ anos
                        {oficina.idade_maxima && ` até ${oficina.idade_maxima}`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Valor</Label>
                      <p className="text-sm font-bold">
                        {oficina.gratuita ? 'Gratuita' :
                          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                            .format(oficina.valor)
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Certificação</Label>
                      <div className="flex items-center gap-2">
                        {oficina.certificacao ? (
                          <Badge variant="default">Emite certificado</Badge>
                        ) : (
                          <Badge variant="secondary">Sem certificado</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Objetivos</Label>
                    <p className="text-sm">{oficina.objetivos}</p>
                  </div>

                  {oficina.conteudo_programatico.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Conteúdo Programático</Label>
                      <ul className="text-sm list-disc list-inside mt-1">
                        {oficina.conteudo_programatico.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {oficina.materiais_inclusos.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Materiais Inclusos</Label>
                      <p className="text-sm text-muted-foreground">
                        {oficina.materiais_inclusos.join(', ')}
                      </p>
                    </div>
                  )}

                  {oficina.materiais_aluno.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Material do Aluno</Label>
                      <p className="text-sm text-muted-foreground">
                        {oficina.materiais_aluno.join(', ')}
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
                      Inscrições
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Certificados
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inscricoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Inscrições</CardTitle>
              <CardDescription>Controle de participantes nas oficinas e cursos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inscricoes.map((inscricao) => {
                  const oficina = oficinas.find(o => o.id === inscricao.oficinaId)
                  return (
                    <Card key={inscricao.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{inscricao.participante}</CardTitle>
                            <CardDescription>
                              {oficina?.nome} - {inscricao.email}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={inscricao.status === 'confirmado' ? 'default' : 'secondary'}>
                              {inscricao.status}
                            </Badge>
                            {inscricao.certificado_emitido && (
                              <Badge variant="default">Certificado Emitido</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div>
                            <Label className="text-sm font-medium">Contato</Label>
                            <p className="text-sm">{inscricao.telefone}</p>
                            <p className="text-xs text-muted-foreground">{inscricao.endereco}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Inscrição</Label>
                            <p className="text-sm">{new Date(inscricao.data_inscricao).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Frequência</Label>
                            <p className="text-sm">{inscricao.frequencia}%</p>
                            <Progress value={inscricao.frequencia} className="h-2 mt-1" />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Nota Final</Label>
                            <p className="text-sm">{inscricao.nota_final || 'Pendente'}</p>
                          </div>
                        </div>
                        {inscricao.motivacao && (
                          <div className="mt-4">
                            <Label className="text-sm font-medium">Motivação</Label>
                            <p className="text-sm text-muted-foreground">{inscricao.motivacao}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instrutores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instrutores</CardTitle>
              <CardDescription>Cadastro e gestão de instrutores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {instrutores.map((instrutor) => (
                  <Card key={instrutor.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{instrutor.nome}</CardTitle>
                          <CardDescription>
                            {instrutor.formacao} - {instrutor.experiencia_anos} anos de experiência
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={instrutor.status === 'ativo' ? 'default' : 'secondary'}>
                            {instrutor.status}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm">{instrutor.avaliacao_media}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label className="text-sm font-medium">Especialidades</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {instrutor.especialidades.map((esp, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {esp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Contato</Label>
                          <p className="text-sm">{instrutor.contato}</p>
                          <p className="text-xs text-muted-foreground">{instrutor.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Valor/hora</Label>
                          <p className="text-sm font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                              .format(instrutor.valor_hora)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {instrutor.cursos_ministrados} cursos ministrados
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label className="text-sm font-medium">Disponibilidade</Label>
                        <p className="text-sm">{instrutor.disponibilidade.join(', ')}</p>
                      </div>
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
                <CardTitle className="text-sm font-medium">Oficinas Ativas</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {oficinas.filter(o => ['inscricoes_abertas', 'em_andamento'].includes(o.status)).length}
                </div>
                <p className="text-xs text-muted-foreground">em funcionamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vagas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {oficinas.reduce((acc, o) => acc + o.vagas_totais, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {oficinas.reduce((acc, o) => acc + o.vagas_ocupadas, 0)} ocupadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instrutores Ativos</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {instrutores.filter(i => i.status === 'ativo').length}
                </div>
                <p className="text-xs text-muted-foreground">cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    oficinas.reduce((acc, o) => acc + getPercentualOcupacao(o), 0) / oficinas.length
                  )}%
                </div>
                <p className="text-xs text-muted-foreground">média geral</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demanda por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={demandaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="inscricoes" stroke="#8884d8" name="Inscrições" />
                    <Line type="monotone" dataKey="concluidos" stroke="#82ca9d" name="Concluídos" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Oficinas por Categoria</CardTitle>
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
                Serviços disponibilizados no catálogo público a partir das oficinas e cursos culturais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      Inscrição em Oficina Cultural
                    </CardTitle>
                    <CardDescription>
                      Portal de inscrições para atividades educativas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Catálogo de oficinas disponíveis</li>
                      <li>• Inscrição online</li>
                      <li>• Verificação de pré-requisitos</li>
                      <li>• Confirmação automática</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-500" />
                      Curso de Arte
                    </CardTitle>
                    <CardDescription>
                      Formação estruturada em diversas linguagens artísticas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Cursos de diferentes níveis</li>
                      <li>• Material didático incluso</li>
                      <li>• Acompanhamento pedagógico</li>
                      <li>• Avaliação contínua</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-500" />
                      Workshop Cultural
                    </CardTitle>
                    <CardDescription>
                      Atividades intensivas e especializadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Workshops temáticos</li>
                      <li>• Instrutores especialistas</li>
                      <li>• Formato intensivo</li>
                      <li>• Aplicação prática</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Certificado de Participação
                    </CardTitle>
                    <CardDescription>
                      Validação oficial de participação em atividades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Certificado digital</li>
                      <li>• Validação municipal</li>
                      <li>• Histórico de formação</li>
                      <li>• Portfólio cultural</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">Formação Cultural Continuada</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      O sistema de oficinas e cursos alimenta automaticamente o catálogo público
                      com oportunidades de formação cultural para todas as idades e níveis,
                      democratizando o acesso ao conhecimento artístico municipal.
                    </p>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <strong>Acesso:</strong> Democratizado
                      </div>
                      <div>
                        <strong>Formação:</strong> Estruturada
                      </div>
                      <div>
                        <strong>Certificação:</strong> Reconhecida
                      </div>
                      <div>
                        <strong>Progressão:</strong> Contínua
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