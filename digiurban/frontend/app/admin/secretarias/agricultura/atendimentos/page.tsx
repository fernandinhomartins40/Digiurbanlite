'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Plus, Search, Filter, Download, Eye, Edit, MessageSquare, Users, Wheat, Tractor, Leaf, TreePine, Droplets, Calendar as CalendarIcon, MapPin, FileText, CheckCircle } from 'lucide-react'

interface AtendimentoRural {
  id: string
  protocolo: string
  produtor: {
    nome: string
    cpf: string
    telefone: string
    email: string
    endereco: string
    propriedade: string
    area_total: number
    area_produtiva: number
  }
  tipo_solicitacao: 'orientacao_tecnica' | 'informacoes_agropecuarias' | 'apoio_produtor' | 'extensao_rural' | 'credito_rural' | 'seguro_agricola' | 'certificacao' | 'comercializacao'
  categoria: 'assistencia_tecnica' | 'extensao_rural' | 'credito' | 'comercializacao' | 'capacitacao' | 'certificacao'
  culturas_interesse: string[]
  atividade_principal: 'agricultura' | 'pecuaria' | 'aquicultura' | 'apicultura' | 'silvicultura' | 'agroecologia' | 'agricultura_familiar'
  assunto: string
  descricao: string
  urgencia: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'aguardando' | 'em_analise' | 'visita_agendada' | 'em_atendimento' | 'orientacao_fornecida' | 'concluido' | 'cancelado'
  data_abertura: string
  data_prevista: string
  data_conclusao?: string
  tecnico_responsavel?: string
  visita_tecnica?: {
    data: string
    tecnico: string
    observacoes: string
    recomendacoes: string[]
    fotos: string[]
    proxima_visita?: string
  }
  documentos_anexos: string[]
  observacoes: string
  problemas_identificados: string[]
  solucoes_propostas: string[]
  resultados_esperados: string[]
  area_afetada?: number
  valor_estimado_projeto?: number
  necessidades_insumos: string[]
}

interface ServicoGerado {
  id: string
  nome: string
  descricao: string
  tipo: 'orientacao_tecnica_rural' | 'informacoes_agropecuarias' | 'apoio_produtor' | 'extensao_rural'
  categoria: 'orientacao' | 'informacao' | 'apoio' | 'extensao'
  protocolo_base: string
  ativo: boolean
}

export default function AtendimentosAgricultura() {
  const { user } = useAdminAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroUrgencia, setFiltroUrgencia] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [novoAtendimento, setNovoAtendimento] = useState<Partial<AtendimentoRural>>({})
  const [showNovoAtendimento, setShowNovoAtendimento] = useState(false)

  const atendimentos: AtendimentoRural[] = [
    {
      id: '1',
      protocolo: 'AG-2024-001',
      produtor: {
        nome: 'João Silva',
        cpf: '123.456.789-00',
        telefone: '(11) 99999-9999',
        email: 'joao@rural.com',
        endereco: 'Sítio Boa Vista, Estrada Rural, Km 15',
        propriedade: 'Sítio Boa Vista',
        area_total: 25,
        area_produtiva: 20
      },
      tipo_solicitacao: 'orientacao_tecnica',
      categoria: 'assistencia_tecnica',
      culturas_interesse: ['Milho', 'Soja', 'Feijão'],
      atividade_principal: 'agricultura',
      assunto: 'Manejo de pragas na cultura do milho',
      descricao: 'Propriedade apresentando ataque de lagarta-do-cartucho no milho. Solicita orientação para controle integrado',
      urgencia: 'alta',
      status: 'em_atendimento',
      data_abertura: '2024-01-10',
      data_prevista: '2024-01-15',
      tecnico_responsavel: 'Dr. Carlos Agrônomo',
      visita_tecnica: {
        data: '2024-01-12',
        tecnico: 'Dr. Carlos Agrônomo',
        observacoes: 'Confirmado ataque severo de Spodoptera frugiperda em 15% da área',
        recomendacoes: [
          'Aplicação de Bacillus thuringiensis',
          'Rotação de culturas na próxima safra',
          'Monitoramento semanal da área'
        ],
        fotos: ['campo_milho_1.jpg', 'praga_identificada.jpg'],
        proxima_visita: '2024-01-26'
      },
      documentos_anexos: ['analise_solo.pdf', 'croqui_propriedade.pdf'],
      observacoes: 'Produtor interessado em migrar para manejo orgânico',
      problemas_identificados: ['Ataque de lagarta-do-cartucho', 'Solo com baixo teor de matéria orgânica'],
      solucoes_propostas: ['Controle biológico', 'Adubação verde', 'Rotação de culturas'],
      resultados_esperados: ['Redução de 80% na incidência de pragas', 'Melhoria da fertilidade do solo'],
      area_afetada: 3,
      valor_estimado_projeto: 5000,
      necessidades_insumos: ['Bioinseticida', 'Sementes de adubação verde', 'Calcário']
    },
    {
      id: '2',
      protocolo: 'AG-2024-002',
      produtor: {
        nome: 'Maria Santos',
        cpf: '987.654.321-00',
        telefone: '(11) 88888-8888',
        email: 'maria@fazenda.com',
        endereco: 'Fazenda São José, Zona Rural',
        propriedade: 'Fazenda São José',
        area_total: 50,
        area_produtiva: 40
      },
      tipo_solicitacao: 'apoio_produtor',
      categoria: 'credito',
      culturas_interesse: ['Café', 'Banana'],
      atividade_principal: 'agricultura_familiar',
      assunto: 'Financiamento para irrigação por gotejamento',
      descricao: 'Solicita orientação para acessar linhas de crédito rural para implantação de sistema de irrigação',
      urgencia: 'media',
      status: 'orientacao_fornecida',
      data_abertura: '2024-01-15',
      data_prevista: '2024-01-20',
      data_conclusao: '2024-01-18',
      tecnico_responsavel: 'Eng. Ana Rural',
      documentos_anexos: ['projeto_irrigacao.pdf', 'orcamento_equipamentos.pdf'],
      observacoes: 'Produtor elegível para PRONAF',
      problemas_identificados: ['Dependência de chuvas', 'Baixa produtividade na seca'],
      solucoes_propostas: ['Sistema de irrigação por gotejamento', 'Mulching orgânico'],
      resultados_esperados: ['Aumento de 40% na produtividade', 'Redução de perdas por estiagem'],
      area_afetada: 15,
      valor_estimado_projeto: 35000,
      necessidades_insumos: ['Kit irrigação', 'Bomba d\'água', 'Reservatório']
    },
    {
      id: '3',
      protocolo: 'AG-2024-003',
      produtor: {
        nome: 'Pedro Oliveira',
        cpf: '456.789.123-00',
        telefone: '(11) 77777-7777',
        email: 'pedro@sitio.com',
        endereco: 'Sítio Esperança, Estrada Velha, s/n',
        propriedade: 'Sítio Esperança',
        area_total: 12,
        area_produtiva: 10
      },
      tipo_solicitacao: 'extensao_rural',
      categoria: 'capacitacao',
      culturas_interesse: ['Hortifrúti', 'Plantas medicinais'],
      atividade_principal: 'agroecologia',
      assunto: 'Transição para agricultura orgânica',
      descricao: 'Proprietário deseja converter a produção convencional para sistema orgânico certificado',
      urgencia: 'baixa',
      status: 'visita_agendada',
      data_abertura: '2024-01-18',
      data_prevista: '2024-01-25',
      tecnico_responsavel: 'Esp. Rosa Orgânica',
      documentos_anexos: ['historico_cultivos.pdf'],
      observacoes: 'Propriedade já utiliza poucos agroquímicos',
      problemas_identificados: ['Falta de conhecimento em manejo orgânico', 'Ausência de compostagem'],
      solucoes_propostas: ['Curso de agricultura orgânica', 'Implantação de composteira', 'Certificação orgânica'],
      resultados_esperados: ['Certificação orgânica em 24 meses', 'Agregação de valor aos produtos'],
      area_afetada: 8,
      valor_estimado_projeto: 15000,
      necessidades_insumos: ['Mudas certificadas', 'Materiais para compostagem', 'Defensivos biológicos']
    }
  ]

  const servicosGerados: ServicoGerado[] = [
    {
      id: '1',
      nome: 'Orientação Técnica Rural',
      descricao: 'Assistência técnica especializada para atividades agropecuárias',
      tipo: 'orientacao_tecnica_rural',
      categoria: 'orientacao',
      protocolo_base: 'Solicitação → Orientação → Visita técnica → Acompanhamento',
      ativo: true
    },
    {
      id: '2',
      nome: 'Informações Agropecuárias',
      descricao: 'Base de conhecimento sobre técnicas e tecnologias rurais',
      tipo: 'informacoes_agropecuarias',
      categoria: 'informacao',
      protocolo_base: 'Solicitação → Orientação → Visita técnica → Acompanhamento',
      ativo: true
    },
    {
      id: '3',
      nome: 'Apoio ao Produtor',
      descricao: 'Suporte técnico e financeiro para produtores rurais',
      tipo: 'apoio_produtor',
      categoria: 'apoio',
      protocolo_base: 'Solicitação → Orientação → Visita técnica → Acompanhamento',
      ativo: true
    },
    {
      id: '4',
      nome: 'Extensão Rural',
      descricao: 'Programas de capacitação e desenvolvimento rural',
      tipo: 'extensao_rural',
      categoria: 'extensao',
      protocolo_base: 'Solicitação → Orientação → Visita técnica → Acompanhamento',
      ativo: true
    }
  ]

  const dadosAtendimentosPorMes = [
    { mes: 'Jul', orientacao: 35, apoio: 25, extensao: 15, informacao: 28 },
    { mes: 'Ago', orientacao: 42, apoio: 28, extensao: 18, informacao: 32 },
    { mes: 'Set', orientacao: 38, apoio: 32, extensao: 22, informacao: 35 },
    { mes: 'Out', orientacao: 45, apoio: 35, extensao: 25, informacao: 38 },
    { mes: 'Nov', orientacao: 48, apoio: 38, extensao: 28, informacao: 42 },
    { mes: 'Dez', orientacao: 52, apoio: 42, extensao: 32, informacao: 45 }
  ]

  const dadosAtividadePrincipal = [
    { atividade: 'Agricultura', quantidade: 85, cor: '#8884d8' },
    { atividade: 'Pecuária', quantidade: 65, cor: '#82ca9d' },
    { atividade: 'Agricultura Familiar', quantidade: 45, cor: '#ffc658' },
    { atividade: 'Agroecologia', quantidade: 25, cor: '#ff7300' },
    { atividade: 'Aquicultura', quantidade: 15, cor: '#00C49F' },
    { atividade: 'Apicultura', quantidade: 12, cor: '#FFBB28' }
  ]

  const dadosStatusAtendimentos = [
    { status: 'Aguardando', quantidade: 18 },
    { status: 'Em Análise', quantidade: 25 },
    { status: 'Visita Agendada', quantidade: 15 },
    { status: 'Em Atendimento', quantidade: 22 },
    { status: 'Orientação Fornecida', quantidade: 35 },
    { status: 'Concluído', quantidade: 68 }
  ]

  const getStatusBadge = (status: string) => {
    const variants = {
      'aguardando': 'bg-yellow-100 text-yellow-800',
      'em_analise': 'bg-blue-100 text-blue-800',
      'visita_agendada': 'bg-purple-100 text-purple-800',
      'em_atendimento': 'bg-indigo-100 text-indigo-800',
      'orientacao_fornecida': 'bg-green-100 text-green-800',
      'concluido': 'bg-gray-100 text-gray-800',
      'cancelado': 'bg-red-100 text-red-800'
    }
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  const getUrgenciaBadge = (urgencia: string) => {
    const variants = {
      'baixa': 'bg-green-100 text-green-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-orange-100 text-orange-800',
      'critica': 'bg-red-100 text-red-800'
    }
    return variants[urgencia as keyof typeof variants] || 'bg-gray-100 text-gray-800'
  }

  const filtrarAtendimentos = atendimentos.filter(atendimento => {
    const matchStatus = filtroStatus === 'todos' || atendimento.status === filtroStatus
    const matchTipo = filtroTipo === 'todos' || atendimento.tipo_solicitacao === filtroTipo
    const matchUrgencia = filtroUrgencia === 'todos' || atendimento.urgencia === filtroUrgencia
    const matchBusca = busca === '' ||
      atendimento.produtor.nome.toLowerCase().includes(busca.toLowerCase()) ||
      atendimento.protocolo.toLowerCase().includes(busca.toLowerCase()) ||
      atendimento.assunto.toLowerCase().includes(busca.toLowerCase())

    return matchStatus && matchTipo && matchUrgencia && matchBusca
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Atendimentos Rurais</h1>
          <p className="text-gray-600 mt-1">PDV especializado para assistência técnica rural e programas agrícolas</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showNovoAtendimento} onOpenChange={setShowNovoAtendimento}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Novo Atendimento Rural</DialogTitle>
                <DialogDescription>
                  Registrar nova solicitação de assistência técnica ou extensão rural
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome do Produtor</label>
                  <Input placeholder="Nome completo" />
                </div>
                <div>
                  <label className="text-sm font-medium">CPF</label>
                  <Input placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-sm font-medium">Propriedade</label>
                  <Input placeholder="Nome da propriedade" />
                </div>
                <div>
                  <label className="text-sm font-medium">Área Total (ha)</label>
                  <Input type="number" placeholder="Área em hectares" />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de Solicitação</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orientacao_tecnica">Orientação Técnica Rural</SelectItem>
                      <SelectItem value="apoio_produtor">Apoio ao Produtor</SelectItem>
                      <SelectItem value="extensao_rural">Extensão Rural</SelectItem>
                      <SelectItem value="informacoes_agropecuarias">Informações Agropecuárias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Atividade Principal</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar atividade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agricultura">Agricultura</SelectItem>
                      <SelectItem value="pecuaria">Pecuária</SelectItem>
                      <SelectItem value="agricultura_familiar">Agricultura Familiar</SelectItem>
                      <SelectItem value="agroecologia">Agroecologia</SelectItem>
                      <SelectItem value="aquicultura">Aquicultura</SelectItem>
                      <SelectItem value="apicultura">Apicultura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Assunto</label>
                  <Input placeholder="Breve descrição do assunto" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea placeholder="Descrição detalhada da solicitação" />
                </div>
                <div>
                  <label className="text-sm font-medium">Urgência</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Culturas de Interesse</label>
                  <Input placeholder="Ex: Milho, Soja, Feijão" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button className="flex-1">Criar Atendimento</Button>
                <Button variant="outline" onClick={() => setShowNovoAtendimento(false)}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      <Tabs defaultValue="atendimentos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="atendimentos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Lista de Atendimentos Rurais</CardTitle>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por produtor, protocolo ou assunto..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="aguardando">Aguardando</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="orientacao_tecnica">Orientação Técnica</SelectItem>
                      <SelectItem value="apoio_produtor">Apoio ao Produtor</SelectItem>
                      <SelectItem value="extensao_rural">Extensão Rural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtrarAtendimentos.map((atendimento) => (
                  <Card key={atendimento.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-lg">{atendimento.assunto}</h3>
                            <Badge className="text-xs">{atendimento.protocolo}</Badge>
                          </div>
                          <p className="text-gray-600 mb-1">{atendimento.produtor.nome} - {atendimento.produtor.propriedade}</p>
                          <p className="text-sm text-gray-500 mb-3">{atendimento.descricao}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusBadge(atendimento.status)}>
                            {atendimento.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getUrgenciaBadge(atendimento.urgencia)}>
                            {atendimento.urgencia}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Atividade:</span>
                          <p className="font-medium capitalize">{atendimento.atividade_principal.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Área Total:</span>
                          <p className="font-medium">{atendimento.produtor.area_total} ha</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Data Abertura:</span>
                          <p className="font-medium">{new Date(atendimento.data_abertura).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Técnico:</span>
                          <p className="font-medium">{atendimento.tecnico_responsavel || 'Não atribuído'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="h-4 w-4" />
                        {atendimento.produtor.endereco}
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Culturas de Interesse:</p>
                        <div className="flex flex-wrap gap-2">
                          {atendimento.culturas_interesse.map((cultura, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Wheat className="h-3 w-3 mr-1" />
                              {cultura}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {atendimento.problemas_identificados.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Problemas Identificados:</p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {atendimento.problemas_identificados.map((problema, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                {problema}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {atendimento.solucoes_propostas.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Soluções Propostas:</p>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {atendimento.solucoes_propostas.map((solucao, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {solucao}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {atendimento.visita_tecnica && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-sm text-blue-900 mb-2">Visita Técnica Realizada</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                              <span className="text-blue-700">Data:</span>
                              <p className="font-medium">{new Date(atendimento.visita_tecnica.data).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                              <span className="text-blue-700">Técnico:</span>
                              <p className="font-medium">{atendimento.visita_tecnica.tecnico}</p>
                            </div>
                          </div>
                          <div className="mb-2">
                            <span className="text-blue-700 text-sm">Observações:</span>
                            <p className="text-sm">{atendimento.visita_tecnica.observacoes}</p>
                          </div>
                          {atendimento.visita_tecnica.recomendacoes.length > 0 && (
                            <div>
                              <span className="text-blue-700 text-sm">Recomendações:</span>
                              <ul className="text-sm mt-1 space-y-1">
                                {atendimento.visita_tecnica.recomendacoes.map((rec, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <Tractor className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {atendimento.valor_estimado_projeto && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-sm text-green-900 mb-2">Informações do Projeto</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-green-700">Valor Estimado:</span>
                              <p className="font-medium">R$ {atendimento.valor_estimado_projeto.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-green-700">Área Afetada:</span>
                              <p className="font-medium">{atendimento.area_afetada} ha</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="capitalize">
                            {atendimento.categoria.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {atendimento.tipo_solicitacao.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-600">{atendimento.observacoes}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Agendar Visita
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Atendimentos</CardTitle>
                <Tractor className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">183</div>
                <p className="text-xs text-muted-foreground">+18% desde o mês passado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">23% do total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">125</div>
                <p className="text-xs text-muted-foreground">68% do total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <CalendarIcon className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7.8 dias</div>
                <p className="text-xs text-muted-foreground">-1.5 dias desde o mês passado</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosAtendimentosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orientacao" name="Orientação" fill="#8884d8" />
                    <Bar dataKey="apoio" name="Apoio" fill="#82ca9d" />
                    <Bar dataKey="extensao" name="Extensão" fill="#ffc658" />
                    <Bar dataKey="informacao" name="Informação" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosAtividadePrincipal}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.atividade}: ${entry.quantidade}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="quantidade"
                    >
                      {dadosAtividadePrincipal.map((entry: any, index: number) => (
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
                <CardTitle>Status dos Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosStatusAtendimentos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosAtendimentosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orientacao" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="apoio" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tractor className="h-5 w-5 text-green-600" />
                Serviços Gerados Automaticamente
              </CardTitle>
              <CardDescription>
                Serviços do catálogo público gerados pelas funcionalidades internas dos atendimentos rurais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servicosGerados.map((servico) => (
                  <Card key={servico.id} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{servico.nome}</CardTitle>
                        <Badge className={servico.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {servico.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-3">{servico.descricao}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Categoria:</span>
                          <Badge variant="outline" className="capitalize">
                            {servico.categoria}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Protocolo:</span>
                          <p className="text-xs mt-1 text-gray-500">{servico.protocolo_base}</p>
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
                Como os atendimentos rurais geram automaticamente serviços para o catálogo público
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-green-900 mb-2">Atendimentos Rurais → Serviços Públicos</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>Orientação Técnica Rural:</strong> Assistência especializada para atividades agropecuárias</li>
                    <li>• <strong>Informações Agropecuárias:</strong> Base de conhecimento sobre técnicas rurais</li>
                    <li>• <strong>Apoio ao Produtor:</strong> Suporte técnico e financeiro para produtores</li>
                    <li>• <strong>Extensão Rural:</strong> Programas de capacitação e desenvolvimento rural</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-medium text-blue-900 mb-2">Fluxo de Protocolos</h4>
                  <p className="text-sm text-blue-800">
                    Produtor solicita "Orientação Técnica Rural" → Protocolo criado → Análise da solicitação →
                    Visita técnica → Orientação fornecida → Acompanhamento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Relatório de Atendimentos</CardTitle>
                <CardDescription>Dados consolidados dos atendimentos rurais</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Relatório de Produtores</CardTitle>
                <CardDescription>Perfil dos produtores atendidos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Relatório de Eficiência</CardTitle>
                <CardDescription>Métricas de tempo e resolução</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}