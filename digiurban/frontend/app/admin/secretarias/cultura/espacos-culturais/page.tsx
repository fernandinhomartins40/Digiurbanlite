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
  Building2, Theater, Music, Palette, Calendar, MapPin, Users, Clock,
  Settings, CheckCircle, AlertTriangle, Camera, Star, Plus, Edit, Eye,
  FileText, Search, Filter, Download, Wrench, Activity, Target
} from 'lucide-react'

interface EspacoCultural {
  id: string
  nome: string
  tipo: 'teatro' | 'auditorio' | 'centro_cultural' | 'biblioteca' | 'museu' | 'galeria' | 'oficina' | 'estudio'
  endereco: string
  capacidade: number
  area_m2: number
  recursos: string[]
  equipamentos: string[]
  status: 'ativo' | 'manutencao' | 'reforma' | 'inativo'
  responsavel: string
  contato: string
  horario_funcionamento: string
  taxa_utilizacao?: number
  valor_hora?: number
  observacoes: string
}

interface ReservaEspaco {
  id: string
  espacoId: string
  solicitante: string
  evento: string
  data_inicio: string
  data_fim: string
  horario_inicio: string
  horario_fim: string
  tipo_evento: string
  publico_estimado: number
  equipamentos_solicitados: string[]
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada' | 'realizada'
  valor_total?: number
  observacoes: string
}

export default function EspacosCulturaisPage() {
  const { user } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()

  if (!['admin', 'cultura'].some(permission => hasPermission(permission))) {
    return <div className="p-6">Acesso negado.</div>
  }

  const [espacos, setEspacos] = useState<EspacoCultural[]>([
    {
      id: '1',
      nome: 'Teatro Municipal José de Alencar',
      tipo: 'teatro',
      endereco: 'Rua Cultural, 100 - Centro',
      capacidade: 300,
      area_m2: 800,
      recursos: ['Som', 'Iluminação', 'Projeção', 'Climatização', 'Camarim'],
      equipamentos: ['Sistema de som profissional', 'Mesa de luz', 'Projetor 4K', 'Ar condicionado', 'Cortinas motorizadas'],
      status: 'ativo',
      responsavel: 'Maria Santos',
      contato: '(11) 98888-8888',
      horario_funcionamento: '08:00 às 22:00',
      taxa_utilizacao: 85,
      valor_hora: 250,
      observacoes: 'Espaço principal para espetáculos teatrais'
    },
    {
      id: '2',
      nome: 'Centro Cultural Cora Coralina',
      tipo: 'centro_cultural',
      endereco: 'Av. das Artes, 500 - Vila Cultural',
      capacidade: 150,
      area_m2: 400,
      recursos: ['Som', 'Projeção', 'Cozinha', 'WiFi', 'Estacionamento'],
      equipamentos: ['Sistema de som básico', 'Projetor', 'Cozinha industrial', 'Internet fibra'],
      status: 'ativo',
      responsavel: 'João Costa',
      contato: '(11) 97777-7777',
      horario_funcionamento: '09:00 às 18:00',
      taxa_utilizacao: 70,
      valor_hora: 150,
      observacoes: 'Espaço multiuso para eventos culturais diversos'
    },
    {
      id: '3',
      nome: 'Galeria de Arte Municipal',
      tipo: 'galeria',
      endereco: 'Rua dos Artistas, 250 - Centro Histórico',
      capacidade: 80,
      area_m2: 200,
      recursos: ['Iluminação especial', 'Climatização', 'Segurança', 'WiFi'],
      equipamentos: ['Iluminação museológica', 'Sistema de alarme', 'Câmeras de segurança'],
      status: 'manutencao',
      responsavel: 'Ana Silva',
      contato: '(11) 96666-6666',
      horario_funcionamento: '10:00 às 17:00',
      taxa_utilizacao: 60,
      valor_hora: 100,
      observacoes: 'Em manutenção - reforma da iluminação'
    }
  ])

  const [reservas, setReservas] = useState<ReservaEspaco[]>([
    {
      id: '1',
      espacoId: '1',
      solicitante: 'Grupo Teatral Esperança',
      evento: 'Peça: O Auto da Compadecida',
      data_inicio: '2024-06-15',
      data_fim: '2024-06-15',
      horario_inicio: '19:00',
      horario_fim: '21:00',
      tipo_evento: 'Teatro',
      publico_estimado: 280,
      equipamentos_solicitados: ['Som profissional', 'Iluminação completa'],
      status: 'aprovada',
      valor_total: 500,
      observacoes: 'Evento beneficente'
    },
    {
      id: '2',
      espacoId: '2',
      solicitante: 'Associação Cultural Local',
      evento: 'Festival de Música Popular',
      data_inicio: '2024-06-20',
      data_fim: '2024-06-22',
      horario_inicio: '18:00',
      horario_fim: '22:00',
      tipo_evento: 'Festival',
      publico_estimado: 120,
      equipamentos_solicitados: ['Som', 'Projeção'],
      status: 'pendente',
      observacoes: 'Aguardando documentação'
    }
  ])

  const [novoEspaco, setNovoEspaco] = useState<Partial<EspacoCultural>>({
    tipo: 'centro_cultural',
    status: 'ativo',
    recursos: [],
    equipamentos: []
  })

  const [novaReserva, setNovaReserva] = useState<Partial<ReservaEspaco>>({
    status: 'pendente',
    equipamentos_solicitados: []
  })

  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [busca, setBusca] = useState('')
  const [showEspacoDialog, setShowEspacoDialog] = useState(false)
  const [showReservaDialog, setShowReservaDialog] = useState(false)

  const espacosFiltrados = espacos.filter(espaco => {
    const matchStatus = !filtroStatus || espaco.status === filtroStatus
    const matchTipo = !filtroTipo || espaco.tipo === filtroTipo
    const matchBusca = !busca ||
      espaco.nome.toLowerCase().includes(busca.toLowerCase()) ||
      espaco.endereco.toLowerCase().includes(busca.toLowerCase())

    return matchStatus && matchTipo && matchBusca
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'ativo': { variant: 'success', label: 'Ativo' },
      'manutencao': { variant: 'default', label: 'Manutenção' },
      'reforma': { variant: 'secondary', label: 'Reforma' },
      'inativo': { variant: 'destructive', label: 'Inativo' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getReservaStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'pendente': { variant: 'secondary', label: 'Pendente' },
      'aprovada': { variant: 'success', label: 'Aprovada' },
      'rejeitada': { variant: 'destructive', label: 'Rejeitada' },
      'cancelada': { variant: 'destructive', label: 'Cancelada' },
      'realizada': { variant: 'success', label: 'Realizada' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'teatro': 'Teatro',
      'auditorio': 'Auditório',
      'centro_cultural': 'Centro Cultural',
      'biblioteca': 'Biblioteca',
      'museu': 'Museu',
      'galeria': 'Galeria',
      'oficina': 'Oficina',
      'estudio': 'Estúdio'
    }
    return labels[tipo] || tipo
  }

  const utilizacaoData = [
    { name: 'Jan', utilizacao: 75, eventos: 12 },
    { name: 'Fev', utilizacao: 68, eventos: 15 },
    { name: 'Mar', utilizacao: 82, eventos: 18 },
    { name: 'Abr', utilizacao: 91, eventos: 22 },
    { name: 'Mai', utilizacao: 85, eventos: 20 }
  ]

  const tipoEspacoData = [
    { name: 'Teatro', value: 2, color: '#8B5CF6' },
    { name: 'Centro Cultural', value: 3, color: '#06B6D4' },
    { name: 'Galeria', value: 2, color: '#84CC16' },
    { name: 'Auditório', value: 1, color: '#F97316' },
    { name: 'Outros', value: 2, color: '#6B7280' }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Espaços Culturais</h1>
          <p className="text-muted-foreground">
            Gestão de equipamentos culturais municipais
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showReservaDialog} onOpenChange={setShowReservaDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Nova Reserva
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Reserva de Espaço</DialogTitle>
                <DialogDescription>
                  Registre uma nova reserva de espaço cultural
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Espaço</Label>
                    <Select value={novaReserva.espacoId} onValueChange={(value) => setNovaReserva({...novaReserva, espacoId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o espaço" />
                      </SelectTrigger>
                      <SelectContent>
                        {espacos.filter(e => e.status === 'ativo').map(espaco => (
                          <SelectItem key={espaco.id} value={espaco.id}>{espaco.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Solicitante</Label>
                    <Input
                      value={novaReserva.solicitante || ''}
                      onChange={(e) => setNovaReserva({...novaReserva, solicitante: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Nome do Evento</Label>
                  <Input
                    value={novaReserva.evento || ''}
                    onChange={(e) => setNovaReserva({...novaReserva, evento: e.target.value})}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={novaReserva.data_inicio || ''}
                      onChange={(e) => setNovaReserva({...novaReserva, data_inicio: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={novaReserva.data_fim || ''}
                      onChange={(e) => setNovaReserva({...novaReserva, data_fim: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Horário Início</Label>
                    <Input
                      type="time"
                      value={novaReserva.horario_inicio || ''}
                      onChange={(e) => setNovaReserva({...novaReserva, horario_inicio: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Horário Fim</Label>
                    <Input
                      type="time"
                      value={novaReserva.horario_fim || ''}
                      onChange={(e) => setNovaReserva({...novaReserva, horario_fim: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Tipo de Evento</Label>
                    <Input
                      value={novaReserva.tipo_evento || ''}
                      onChange={(e) => setNovaReserva({...novaReserva, tipo_evento: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Público Estimado</Label>
                    <Input
                      type="number"
                      value={novaReserva.publico_estimado || ''}
                      onChange={(e) => setNovaReserva({...novaReserva, publico_estimado: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={novaReserva.observacoes || ''}
                    onChange={(e) => setNovaReserva({...novaReserva, observacoes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowReservaDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Reserva</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showEspacoDialog} onOpenChange={setShowEspacoDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Espaço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Espaço Cultural</DialogTitle>
                <DialogDescription>
                  Cadastre um novo equipamento cultural
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Espaço</Label>
                  <Input
                    value={novoEspaco.nome || ''}
                    onChange={(e) => setNovoEspaco({...novoEspaco, nome: e.target.value})}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={novoEspaco.tipo} onValueChange={(value) => setNovoEspaco({...novoEspaco, tipo: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teatro">Teatro</SelectItem>
                        <SelectItem value="auditorio">Auditório</SelectItem>
                        <SelectItem value="centro_cultural">Centro Cultural</SelectItem>
                        <SelectItem value="biblioteca">Biblioteca</SelectItem>
                        <SelectItem value="museu">Museu</SelectItem>
                        <SelectItem value="galeria">Galeria</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="estudio">Estúdio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={novoEspaco.status} onValueChange={(value) => setNovoEspaco({...novoEspaco, status: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="reforma">Reforma</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Endereço</Label>
                  <Input
                    value={novoEspaco.endereco || ''}
                    onChange={(e) => setNovoEspaco({...novoEspaco, endereco: e.target.value})}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Capacidade (pessoas)</Label>
                    <Input
                      type="number"
                      value={novoEspaco.capacidade || ''}
                      onChange={(e) => setNovoEspaco({...novoEspaco, capacidade: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Área (m²)</Label>
                    <Input
                      type="number"
                      value={novoEspaco.area_m2 || ''}
                      onChange={(e) => setNovoEspaco({...novoEspaco, area_m2: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Responsável</Label>
                    <Input
                      value={novoEspaco.responsavel || ''}
                      onChange={(e) => setNovoEspaco({...novoEspaco, responsavel: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Contato</Label>
                    <Input
                      value={novoEspaco.contato || ''}
                      onChange={(e) => setNovoEspaco({...novoEspaco, contato: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Horário de Funcionamento</Label>
                  <Input
                    value={novoEspaco.horario_funcionamento || ''}
                    onChange={(e) => setNovoEspaco({...novoEspaco, horario_funcionamento: e.target.value})}
                    placeholder="Ex: 08:00 às 22:00"
                  />
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={novoEspaco.observacoes || ''}
                    onChange={(e) => setNovoEspaco({...novoEspaco, observacoes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowEspacoDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Cadastrar Espaço</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="espacos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="espacos">Espaços Culturais</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="espacos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
              <CardDescription>Filtre e pesquise espaços culturais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou endereço..."
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
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="reforma">Reforma</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="teatro">Teatro</SelectItem>
                    <SelectItem value="centro_cultural">Centro Cultural</SelectItem>
                    <SelectItem value="galeria">Galeria</SelectItem>
                    <SelectItem value="auditorio">Auditório</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {espacosFiltrados.map((espaco) => (
              <Card key={espaco.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {espaco.nome}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {espaco.endereco}
                        </span>
                        <span className="flex items-center gap-1">
                          <Theater className="h-4 w-4" />
                          {getTipoLabel(espaco.tipo)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(espaco.status)}
                      <Badge variant="outline">{espaco.capacidade} pessoas</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium">Capacidade</Label>
                      <p className="text-sm">{espaco.capacidade} pessoas</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Área</Label>
                      <p className="text-sm">{espaco.area_m2} m²</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Taxa de Utilização</Label>
                      <p className="text-sm">{espaco.taxa_utilizacao || 0}%</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Responsável</Label>
                      <p className="text-sm">{espaco.responsavel}</p>
                      <p className="text-xs text-muted-foreground">{espaco.contato}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Funcionamento</Label>
                      <p className="text-sm">{espaco.horario_funcionamento}</p>
                      {espaco.valor_hora && (
                        <p className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                            .format(espaco.valor_hora)}/hora
                        </p>
                      )}
                    </div>
                  </div>

                  {espaco.recursos.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Recursos Disponíveis</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {espaco.recursos.map((recurso, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {recurso}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {espaco.equipamentos.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Equipamentos</Label>
                      <div className="text-sm text-muted-foreground">
                        {espaco.equipamentos.join(', ')}
                      </div>
                    </div>
                  )}

                  {espaco.observacoes && (
                    <div>
                      <Label className="text-sm font-medium">Observações</Label>
                      <p className="text-sm text-muted-foreground">{espaco.observacoes}</p>
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
                      Agenda
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reservas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reservas de Espaços</CardTitle>
              <CardDescription>Gestão de reservas e agendamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reservas.map((reserva) => {
                  const espaco = espacos.find(e => e.id === reserva.espacoId)
                  return (
                    <Card key={reserva.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{reserva.evento}</CardTitle>
                            <CardDescription>
                              {espaco?.nome} - {reserva.solicitante}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {getReservaStatusBadge(reserva.status)}
                            <Badge variant="outline">{reserva.tipo_evento}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                          <div>
                            <Label className="text-sm font-medium">Data</Label>
                            <p className="text-sm">
                              {new Date(reserva.data_inicio).toLocaleDateString('pt-BR')}
                              {reserva.data_fim !== reserva.data_inicio &&
                                ` a ${new Date(reserva.data_fim).toLocaleDateString('pt-BR')}`
                              }
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Horário</Label>
                            <p className="text-sm">{reserva.horario_inicio} às {reserva.horario_fim}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Público</Label>
                            <p className="text-sm">{reserva.publico_estimado} pessoas</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Valor</Label>
                            <p className="text-sm">
                              {reserva.valor_total ?
                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                                  .format(reserva.valor_total) :
                                'Gratuito'
                              }
                            </p>
                          </div>
                        </div>
                        {reserva.observacoes && (
                          <div className="mt-4">
                            <Label className="text-sm font-medium">Observações</Label>
                            <p className="text-sm text-muted-foreground">{reserva.observacoes}</p>
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

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Espaços</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{espacos.length}</div>
                <p className="text-xs text-muted-foreground">equipamentos culturais</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Espaços Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {espacos.filter(e => e.status === 'ativo').length}
                </div>
                <p className="text-xs text-muted-foreground">disponíveis para uso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reservas Mês</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reservas.length}</div>
                <p className="text-xs text-muted-foreground">agendamentos realizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Média Utilização</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(espacos.reduce((acc, e) => acc + (e.taxa_utilizacao || 0), 0) / espacos.length)}%
                </div>
                <p className="text-xs text-muted-foreground">dos espaços ativos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Utilização dos Espaços</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={utilizacaoData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="utilizacao" stroke="#8884d8" name="Taxa Utilização %" />
                    <Line type="monotone" dataKey="eventos" stroke="#82ca9d" name="Nº Eventos" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Espaços</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tipoEspacoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tipoEspacoData.map((entry, index) => (
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
                Serviços disponibilizados no catálogo público a partir da gestão de espaços culturais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      Reserva de Espaço Cultural
                    </CardTitle>
                    <CardDescription>
                      Agendamento de equipamentos culturais municipais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Consulta de disponibilidade</li>
                      <li>• Formulário de reserva</li>
                      <li>• Aprovação automática/manual</li>
                      <li>• Confirmação de agendamento</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Theater className="h-5 w-5 text-purple-500" />
                      Uso de Teatro Municipal
                    </CardTitle>
                    <CardDescription>
                      Solicitação específica para uso do teatro municipal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Análise de projeto artístico</li>
                      <li>• Checklist técnico</li>
                      <li>• Agendamento de ensaios</li>
                      <li>• Suporte técnico incluído</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5 text-green-500" />
                      Empréstimo de Equipamentos
                    </CardTitle>
                    <CardDescription>
                      Cessão de equipamentos culturais municipais
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Catálogo de equipamentos</li>
                      <li>• Termo de responsabilidade</li>
                      <li>• Agendamento de retirada</li>
                      <li>• Controle de devolução</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-yellow-500" />
                      Visita Guiada
                    </CardTitle>
                    <CardDescription>
                      Agendamento de visitas técnicas e educativas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      <li>• Agendamento de grupos</li>
                      <li>• Roteiro personalizado</li>
                      <li>• Guia especializado</li>
                      <li>• Material educativo</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold mb-2">Gestão Integrada de Espaços</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      A gestão de espaços culturais alimenta automaticamente o catálogo público
                      com disponibilidade em tempo real, permitindo aos cidadãos reservar
                      equipamentos culturais de forma transparente e eficiente.
                    </p>
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <strong>Disponibilidade:</strong> Tempo real
                      </div>
                      <div>
                        <strong>Reservas:</strong> Online/Presencial
                      </div>
                      <div>
                        <strong>Gestão:</strong> Centralizada
                      </div>
                      <div>
                        <strong>Transparência:</strong> Total
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