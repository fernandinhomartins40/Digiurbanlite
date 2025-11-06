'use client'

import { useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import {
  FileText, Building2, ShieldCheck, Search, Plus, Edit, Download, Clock, User,
  CheckCircle, AlertCircle, XCircle, Eye, Calendar, Phone, Mail, DollarSign,
  Target, Star, Award, TrendingUp, Activity, Users, Hammer, Home
} from 'lucide-react'

export default function EmissaoAlvarasPage() {
  useAdminAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingAlvara, setEditingAlvara] = useState<any>(null)

  const [alvaras] = useState([
    {
      id: 1,
      numero: 'ALV-CONS-2024-001',
      tipo: 'construcao',
      solicitante: 'João Silva Santos',
      cpf: '123.456.789-01',
      telefone: '(11) 98765-4321',
      email: 'joao.silva@email.com',
      endereco: 'Rua das Flores, 123 - Centro',
      obra: 'Construção de residência unifamiliar',
      area: '180 m²',
      valor: 350000,
      status: 'ativo',
      dataEmissao: '2024-06-15',
      dataVencimento: '2024-12-15',
      dataVistoria: '2024-06-10',
      responsavelTecnico: 'Arq. Maria Santos',
      crea: 'SP123456',
      observacoes: 'Alvará emitido conforme projeto aprovado. Válido até 15/12/2024.',
      condicoes: ['Seguir projeto aprovado', 'Não exceder área autorizada', 'Manter recuos obrigatórios'],
      taxas: 1250.50,
      protocolo: 'PROJ-2024-001'
    },
    {
      id: 2,
      numero: 'ALV-FUNC-2024-045',
      tipo: 'funcionamento',
      solicitante: 'Comércio ABC Ltda',
      cpf: '12.345.678/0001-90',
      telefone: '(11) 99876-5432',
      email: 'licenca@comercioabc.com',
      endereco: 'Av. Principal, 456 - Centro',
      obra: 'Funcionamento de loja de roupas',
      area: '85 m²',
      valor: 0,
      status: 'ativo',
      dataEmissao: '2024-06-18',
      dataVencimento: '2024-06-18',
      dataVistoria: '2024-06-16',
      responsavelTecnico: 'Não se aplica',
      crea: 'Não se aplica',
      observacoes: 'Licença de funcionamento comercial. Renovação anual obrigatória.',
      condicoes: ['Manter atividade conforme declarado', 'Não alterar uso sem autorização', 'Renovar anualmente'],
      taxas: 285.00,
      protocolo: 'FUNC-2024-045'
    },
    {
      id: 3,
      numero: 'ALV-HABIT-2024-012',
      tipo: 'habite_se',
      solicitante: 'Maria Oliveira Costa',
      cpf: '987.654.321-09',
      telefone: '(11) 97654-3210',
      email: 'maria.costa@email.com',
      endereco: 'Rua Nova, 789 - Jardim',
      obra: 'Habite-se de casa unifamiliar',
      area: '220 m²',
      valor: 420000,
      status: 'pendente',
      dataEmissao: null,
      dataVencimento: null,
      dataVistoria: '2024-06-20',
      responsavelTecnico: 'Eng. Carlos Lima',
      crea: 'SP654321',
      observacoes: 'Aguardando correção de pendências na vistoria final.',
      condicoes: [],
      taxas: 680.75,
      protocolo: 'HABIT-2024-012'
    }
  ])

  const [novoAlvara, setNovoAlvara] = useState({
    tipo: '',
    solicitante: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: '',
    obra: '',
    area: '',
    valor: '',
    responsavelTecnico: '',
    crea: '',
    observacoes: ''
  })

  const estatisticasAlvaras = [
    { tipo: 'Construção', emitidos: 45, ativos: 38, vencidos: 7 },
    { tipo: 'Funcionamento', emitidos: 128, ativos: 115, vencidos: 13 },
    { tipo: 'Habite-se', emitidos: 32, ativos: 28, vencidos: 4 },
    { tipo: 'Demolição', emitidos: 8, ativos: 6, vencidos: 2 },
    { tipo: 'Reforma', emitidos: 22, ativos: 18, vencidos: 4 },
    { tipo: 'Ocupação', emitidos: 15, ativos: 12, vencidos: 3 }
  ]

  const statusDistribuicao = [
    { name: 'Ativos', value: 217, color: '#22C55E' },
    { name: 'Pendentes', value: 18, color: '#F59E0B' },
    { name: 'Vencidos', value: 33, color: '#EF4444' },
    { name: 'Cancelados', value: 12, color: '#6B7280' }
  ]

  const emissaoMensal = [
    { mes: 'Jan', emitidos: 22, renovados: 15 },
    { mes: 'Fev', emitidos: 28, renovados: 18 },
    { mes: 'Mar', emitidos: 35, renovados: 22 },
    { mes: 'Abr', emitidos: 30, renovados: 20 },
    { mes: 'Mai', emitidos: 42, renovados: 28 },
    { mes: 'Jun', emitidos: 38, renovados: 25 }
  ]

  const filteredAlvaras = alvaras.filter(alvara => {
    const matchesSearch = alvara.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alvara.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alvara.obra.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || alvara.status === statusFilter
    const matchesTipo = tipoFilter === 'todos' || alvara.tipo === tipoFilter
    return matchesSearch && matchesStatus && matchesTipo
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowForm(false)
    setNovoAlvara({
      tipo: '',
      solicitante: '',
      cpf: '',
      telefone: '',
      email: '',
      endereco: '',
      obra: '',
      area: '',
      valor: '',
      responsavelTecnico: '',
      crea: '',
      observacoes: ''
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'vencido':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>
      case 'cancelado':
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'construcao':
        return <Badge className="bg-blue-100 text-blue-800"><Hammer className="w-3 h-3 mr-1" />Construção</Badge>
      case 'funcionamento':
        return <Badge className="bg-green-100 text-green-800"><Building2 className="w-3 h-3 mr-1" />Funcionamento</Badge>
      case 'habite_se':
        return <Badge className="bg-purple-100 text-purple-800"><Home className="w-3 h-3 mr-1" />Habite-se</Badge>
      case 'demolicao':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Demolição</Badge>
      case 'reforma':
        return <Badge className="bg-orange-100 text-orange-800"><Target className="w-3 h-3 mr-1" />Reforma</Badge>
      case 'ocupacao':
        return <Badge className="bg-cyan-100 text-cyan-800"><ShieldCheck className="w-3 h-3 mr-1" />Ocupação</Badge>
      default:
        return <Badge>{tipo}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Emissão de Alvarás</h1>
          <p className="text-gray-600">Gestão completa de licenças de construção, funcionamento e ocupação</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Alvará
        </Button>
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="alvaras">Alvarás</TabsTrigger>
          <TabsTrigger value="gestao">Gestão</TabsTrigger>
          <TabsTrigger value="servicos">Serviços Gerados</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Alvarás</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">280</div>
                <p className="text-xs text-muted-foreground">+38 este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">217</div>
                <p className="text-xs text-muted-foreground">77% do total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">18</div>
                <p className="text-xs text-muted-foreground">6% do total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">R$ 32k</div>
                <p className="text-xs text-muted-foreground">Em taxas e licenças</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alvarás por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={estatisticasAlvaras}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="emitidos" fill="#E5E7EB" name="Emitidos" />
                    <Bar dataKey="ativos" fill="#22C55E" name="Ativos" />
                    <Bar dataKey="vencidos" fill="#EF4444" name="Vencidos" />
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
                      data={statusDistribuicao}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribuicao.map((entry, index) => (
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
              <CardTitle>Emissões e Renovações Mensais</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emissaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="emitidos" stroke="#3B82F6" name="Novos Alvarás" />
                  <Line type="monotone" dataKey="renovados" stroke="#10B981" name="Renovações" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alvaras" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar alvarás..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Tipos</SelectItem>
                    <SelectItem value="construcao">Construção</SelectItem>
                    <SelectItem value="funcionamento">Funcionamento</SelectItem>
                    <SelectItem value="habite_se">Habite-se</SelectItem>
                    <SelectItem value="demolicao">Demolição</SelectItem>
                    <SelectItem value="reforma">Reforma</SelectItem>
                    <SelectItem value="ocupacao">Ocupação</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {filteredAlvaras.map((alvara) => (
              <Card key={alvara.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold">{alvara.numero}</h3>
                          {getStatusBadge(alvara.status)}
                          {getTipoBadge(alvara.tipo)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{alvara.solicitante}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{alvara.telefone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4" />
                            <span>{alvara.obra}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {alvara.dataEmissao ? `Emitido em ${alvara.dataEmissao}` : 'Não emitido'}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p><strong>Endereço:</strong> {alvara.endereco}</p>
                          <p><strong>Área:</strong> {alvara.area} | <strong>Valor:</strong> R$ {alvara.valor.toLocaleString()}</p>
                          {alvara.responsavelTecnico !== 'Não se aplica' && (
                            <p><strong>Responsável Técnico:</strong> {alvara.responsavelTecnico} - CREA: {alvara.crea}</p>
                          )}
                          {alvara.observacoes && (
                            <p><strong>Observações:</strong> {alvara.observacoes}</p>
                          )}
                        </div>
                        {alvara.condicoes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-blue-600">Condições do Alvará:</h4>
                            <ul className="text-sm text-blue-600 list-disc list-inside">
                              {alvara.condicoes.map((condicao, index) => (
                                <li key={index}>{condicao}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Taxa: R$ {alvara.taxas.toFixed(2)}
                          </Badge>
                          <Badge variant="outline">
                            Protocolo: {alvara.protocolo}
                          </Badge>
                          {alvara.dataVencimento && (
                            <Badge variant="outline">
                              Válido até: {alvara.dataVencimento}
                            </Badge>
                          )}
                          {alvara.dataVistoria && (
                            <Badge variant="outline">
                              Vistoria: {alvara.dataVistoria}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingAlvara(alvara)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gestao" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alvarás por Vencer</CardTitle>
                <CardDescription>Próximos 30 dias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Alvarás de Construção</h4>
                      <p className="text-sm text-gray-600">8 vencem este mês</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">8</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Licenças de Funcionamento</h4>
                      <p className="text-sm text-gray-600">23 vencem este mês</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">23</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Outros Alvarás</h4>
                      <p className="text-sm text-gray-600">5 vencem este mês</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">5</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Gestão</CardTitle>
                <CardDescription>Performance do setor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tempo Médio de Emissão</span>
                    <Badge className="bg-blue-100 text-blue-800">7 dias</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Taxa de Aprovação</span>
                    <Badge className="bg-green-100 text-green-800">88%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Renovações no Prazo</span>
                    <Badge className="bg-purple-100 text-purple-800">75%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Arrecadação Mensal</span>
                    <Badge className="bg-green-100 text-green-800">R$ 32.450</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Solicitações Pendentes</span>
                    <Badge className="bg-yellow-100 text-yellow-800">18</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas - Gestão de Alvarás</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm">Emitir Alvará</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm">Agendar Vistoria</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-sm">Renovar Licença</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                  <AlertCircle className="w-6 h-6" />
                  <span className="text-sm">Notificar Vencimento</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Serviços Gerados Automaticamente</CardTitle>
              <CardDescription>
                Baseado nas funcionalidades internas desta página, os seguintes serviços são gerados automaticamente para o catálogo público
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hammer className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium">Alvará de Construção</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Licença para execução de obras de construção, ampliação e reforma
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Análise de projeto aprovado
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Vistoria prévia
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Emissão da licença
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="w-5 h-5 text-green-500" />
                      <h4 className="font-medium">Alvará de Funcionamento</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Licença para funcionamento de estabelecimentos comerciais e de serviços
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Análise de conformidade
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Vistoria do local
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Renovação anual
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Home className="w-5 h-5 text-purple-500" />
                      <h4 className="font-medium">Habite-se</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Certificado de conclusão de obra para habitação
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Vistoria final da obra
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Verificação de conformidade
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Emissão do certificado
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <h4 className="font-medium">Alvará de Demolição</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Autorização para demolição de edificações
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Análise de segurança
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Plano de demolição
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Autorização de execução
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <ShieldCheck className="w-5 h-5 text-cyan-500" />
                      <h4 className="font-medium">Licença de Ocupação</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Autorização temporária para ocupação de espaços públicos
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Análise da solicitação
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Definição de condições
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Emissão temporária
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-5 h-5 text-orange-500" />
                      <h4 className="font-medium">Renovação de Alvarás</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Renovação de licenças vencidas ou próximas do vencimento
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Verificação de validade
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Atualização de dados
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        Nova emissão
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Integração Bidirecional</h4>
                <p className="text-sm text-blue-700">
                  Todos os serviços acima são automaticamente sincronizados com esta página administrativa.
                  Novas solicitações realizadas através do catálogo público aparecem aqui para análise e emissão,
                  enquanto alvarás emitidos são disponibilizados instantaneamente nos serviços públicos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Novo Alvará</CardTitle>
              <CardDescription>Registre um novo alvará para emissão</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Alvará *</Label>
                    <Select value={novoAlvara.tipo} onValueChange={(value) => setNovoAlvara({...novoAlvara, tipo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construcao">Construção</SelectItem>
                        <SelectItem value="funcionamento">Funcionamento</SelectItem>
                        <SelectItem value="habite_se">Habite-se</SelectItem>
                        <SelectItem value="demolicao">Demolição</SelectItem>
                        <SelectItem value="reforma">Reforma</SelectItem>
                        <SelectItem value="ocupacao">Licença de Ocupação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="solicitante">Solicitante *</Label>
                    <Input
                      id="solicitante"
                      value={novoAlvara.solicitante}
                      onChange={(e) => setNovoAlvara({...novoAlvara, solicitante: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF/CNPJ *</Label>
                    <Input
                      id="cpf"
                      value={novoAlvara.cpf}
                      onChange={(e) => setNovoAlvara({...novoAlvara, cpf: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={novoAlvara.telefone}
                      onChange={(e) => setNovoAlvara({...novoAlvara, telefone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={novoAlvara.email}
                      onChange={(e) => setNovoAlvara({...novoAlvara, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="responsavelTecnico">Responsável Técnico</Label>
                    <Input
                      id="responsavelTecnico"
                      value={novoAlvara.responsavelTecnico}
                      onChange={(e) => setNovoAlvara({...novoAlvara, responsavelTecnico: e.target.value})}
                      placeholder="Arquiteto ou Engenheiro responsável"
                    />
                  </div>
                  <div>
                    <Label htmlFor="crea">CREA/CAU</Label>
                    <Input
                      id="crea"
                      value={novoAlvara.crea}
                      onChange={(e) => setNovoAlvara({...novoAlvara, crea: e.target.value})}
                      placeholder="Número do registro profissional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="area">Área</Label>
                    <Input
                      id="area"
                      value={novoAlvara.area}
                      onChange={(e) => setNovoAlvara({...novoAlvara, area: e.target.value})}
                      placeholder="Ex: 180 m²"
                    />
                  </div>
                  <div>
                    <Label htmlFor="valor">Valor da Obra/Empreendimento</Label>
                    <Input
                      id="valor"
                      type="number"
                      value={novoAlvara.valor}
                      onChange={(e) => setNovoAlvara({...novoAlvara, valor: e.target.value})}
                      placeholder="Valor em reais"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={novoAlvara.endereco}
                    onChange={(e) => setNovoAlvara({...novoAlvara, endereco: e.target.value})}
                    placeholder="Endereço completo onde será executada a obra/atividade"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="obra">Descrição da Obra/Atividade *</Label>
                  <Input
                    id="obra"
                    value={novoAlvara.obra}
                    onChange={(e) => setNovoAlvara({...novoAlvara, obra: e.target.value})}
                    placeholder="Descreva a obra ou atividade a ser licenciada"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={novoAlvara.observacoes}
                    onChange={(e) => setNovoAlvara({...novoAlvara, observacoes: e.target.value})}
                    rows={3}
                    placeholder="Observações adicionais sobre o alvará"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Alvará</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}