'use client'

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Recycle,
  Smartphone,
  Pill,
  Droplets,
  Home,
  TreePine,
  Trash2,
  Calendar,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Truck,
  Package,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react'
import { useState } from 'react'

const tiposColetaEspecial = [
  {
    tipo: 'eletronicos',
    nome: 'Eletrônicos',
    icon: Smartphone,
    descricao: 'Celulares, computadores, TVs, eletrodomésticos',
    agendamentos: 28,
    proximaColeta: '2024-01-25',
    cor: 'text-blue-600'
  },
  {
    tipo: 'medicamentos',
    nome: 'Medicamentos',
    icon: Pill,
    descricao: 'Remédios vencidos ou não utilizados',
    agendamentos: 15,
    proximaColeta: '2024-01-24',
    cor: 'text-red-600'
  },
  {
    tipo: 'oleo-cozinha',
    nome: 'Óleo de Cozinha',
    icon: Droplets,
    descricao: 'Óleo usado de fritura e preparo de alimentos',
    agendamentos: 42,
    proximaColeta: '2024-01-26',
    cor: 'text-yellow-600'
  },
  {
    tipo: 'entulho',
    nome: 'Entulho',
    icon: Home,
    descricao: 'Restos de construção, reformas e demolição',
    agendamentos: 18,
    proximaColeta: '2024-01-27',
    cor: 'text-gray-600'
  },
  {
    tipo: 'moveis-velhos',
    nome: 'Móveis Velhos',
    icon: Package,
    descricao: 'Móveis em desuso, sofás, camas, guarda-roupas',
    agendamentos: 22,
    proximaColeta: '2024-01-28',
    cor: 'text-purple-600'
  },
  {
    tipo: 'podas-jardim',
    nome: 'Podas de Jardim',
    icon: TreePine,
    descricao: 'Galhos, folhas, grama cortada e restos vegetais',
    agendamentos: 35,
    proximaColeta: '2024-01-29',
    cor: 'text-green-600'
  }
]

const agendamentosColeta = [
  {
    id: 1,
    protocolo: 'CE-2024-0001',
    tipo: 'eletronicos',
    solicitante: 'Maria Silva Santos',
    telefone: '(11) 99999-0001',
    endereco: 'Rua das Flores, 123',
    bairro: 'Centro',
    descricao: '2 celulares velhos, 1 TV de tubo',
    dataAgendamento: '2024-01-25',
    horario: '14:00',
    status: 'agendado',
    observacoes: 'Portão azul, interfone 12'
  },
  {
    id: 2,
    protocolo: 'CE-2024-0002',
    tipo: 'medicamentos',
    solicitante: 'João Carlos Lima',
    telefone: '(11) 99999-0002',
    endereco: 'Av. Principal, 456',
    bairro: 'Jardim das Flores',
    descricao: 'Caixa com remédios vencidos',
    dataAgendamento: '2024-01-24',
    horario: '09:30',
    status: 'coletado',
    observacoes: 'Coleta realizada com sucesso'
  },
  {
    id: 3,
    protocolo: 'CE-2024-0003',
    tipo: 'entulho',
    solicitante: 'Ana Costa Oliveira',
    telefone: '(11) 99999-0003',
    endereco: 'Rua Nova, 789',
    bairro: 'Vila Nova',
    descricao: 'Restos de reforma do banheiro',
    dataAgendamento: '2024-01-27',
    horario: '08:00',
    status: 'pendente',
    observacoes: 'Aguardando vistoria'
  }
]

const rotasColeta = [
  {
    id: 1,
    nome: 'Rota Eletrônicos - Norte',
    veiculo: 'Caminhão CE-001',
    motorista: 'Carlos Silva',
    ajudantes: 2,
    pontos: 8,
    status: 'em-andamento',
    inicioRota: '08:00',
    previsaoTermino: '16:00',
    localAtual: 'Jardim das Flores'
  },
  {
    id: 2,
    nome: 'Rota Medicamentos - Centro',
    veiculo: 'Van CE-002',
    motorista: 'Pedro Santos',
    ajudantes: 1,
    pontos: 12,
    status: 'concluida',
    inicioRota: '07:00',
    previsaoTermino: '15:00',
    localAtual: 'Base'
  },
  {
    id: 3,
    nome: 'Rota Entulho - Sul',
    veiculo: 'Caminhão CE-003',
    motorista: 'João Costa',
    ajudantes: 3,
    pontos: 5,
    status: 'agendada',
    inicioRota: '06:00',
    previsaoTermino: '14:00',
    localAtual: 'Garagem'
  }
]

const destinosFinais = [
  {
    tipo: 'eletronicos',
    destino: 'Cooperativa de Reciclagem TecnoVerde',
    endereco: 'Distrito Industrial, Lote 15',
    certificacao: 'ISO 14001'
  },
  {
    tipo: 'medicamentos',
    destino: 'Incinerador Hospital das Clínicas',
    endereco: 'Av. Hospitalar, 200',
    certificacao: 'ANVISA 2023'
  },
  {
    tipo: 'oleo-cozinha',
    destino: 'Biocombustível EcoÓleo Ltda',
    endereco: 'Zona Rural, Km 12',
    certificacao: 'IBAMA 2024'
  },
  {
    tipo: 'entulho',
    destino: 'Aterro Sanitário Municipal',
    endereco: 'Estrada da Represa, s/n',
    certificacao: 'CETESB 2023'
  }
]

const servicosGerados = [
  'Coleta de Eletrônicos',
  'Descarte de Medicamentos',
  'Coleta de Óleo',
  'Remoção de Entulho',
  'Coleta de Móveis Velhos',
  'Poda de Jardim',
  'Agendamento de Coleta'
]

export default function ColetaEspecialPage() {
  const { user } = useAdminAuth()
  const [novoAgendamento, setNovoAgendamento] = useState({
    tipo: '',
    solicitante: '',
    telefone: '',
    endereco: '',
    bairro: '',
    descricao: '',
    dataAgendamento: '',
    horario: '',
    observacoes: ''
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendado':
        return <Badge className="bg-blue-500 text-white">Agendado</Badge>
      case 'em-andamento':
        return <Badge className="bg-yellow-500 text-white">Em Andamento</Badge>
      case 'coletado':
        return <Badge className="bg-green-500 text-white">Coletado</Badge>
      case 'pendente':
        return <Badge className="bg-gray-500 text-white">Pendente</Badge>
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>
      case 'concluida':
        return <Badge className="bg-green-500 text-white">Concluída</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoIcon = (tipo: string) => {
    const tipoColeta = tiposColetaEspecial.find(t => t.tipo === tipo)
    if (tipoColeta) {
      const IconComponent = tipoColeta.icon
      return <IconComponent className={`h-4 w-4 ${tipoColeta.cor}`} />
    }
    return <Trash2 className="h-4 w-4 text-gray-600" />
  }

  const formatarData = (data: string) => {
    const date = new Date(data)
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Recycle className="h-8 w-8 text-blue-600 mr-3" />
            Coleta Especial
          </h1>
          <p className="text-gray-600 mt-1">
            Gestão de resíduos especiais, agendamento, destinação e certificados
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          Resíduos Especiais
        </Badge>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              6 tipos diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coletas Realizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">89</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rotas Ativas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Especializadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Reciclado</CardTitle>
            <Recycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2.8t</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Novo Agendamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Agendar Coleta
            </CardTitle>
            <CardDescription>
              Solicitar coleta de material especial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tipo">Tipo de Material</Label>
              <Select value={novoAgendamento.tipo} onValueChange={(value) => setNovoAgendamento(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposColetaEspecial.map((tipo) => (
                    <SelectItem key={tipo.tipo} value={tipo.tipo}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="solicitante">Nome do Solicitante</Label>
              <Input
                id="solicitante"
                placeholder="Nome completo"
                value={novoAgendamento.solicitante}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, solicitante: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                value={novoAgendamento.telefone}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, telefone: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Local da coleta"
                value={novoAgendamento.endereco}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, endereco: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                placeholder="Nome do bairro"
                value={novoAgendamento.bairro}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, bairro: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição do Material</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o material a ser coletado"
                value={novoAgendamento.descricao}
                onChange={(e) => setNovoAgendamento(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="dataAgendamento">Data</Label>
                <Input
                  id="dataAgendamento"
                  type="date"
                  value={novoAgendamento.dataAgendamento}
                  onChange={(e) => setNovoAgendamento(prev => ({ ...prev, dataAgendamento: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="horario">Horário</Label>
                <Input
                  id="horario"
                  type="time"
                  value={novoAgendamento.horario}
                  onChange={(e) => setNovoAgendamento(prev => ({ ...prev, horario: e.target.value }))}
                />
              </div>
            </div>

            <Button className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Agendar Coleta
            </Button>
          </CardContent>
        </Card>

        {/* Tipos de Coleta */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tipos de Coleta Especial</CardTitle>
            <CardDescription>
              Categorias e próximas coletas programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiposColetaEspecial.map((tipo) => (
                <div key={tipo.tipo} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <tipo.icon className={`h-5 w-5 ${tipo.cor}`} />
                      <h4 className="font-semibold">{tipo.nome}</h4>
                    </div>
                    <Badge variant="outline">{tipo.agendamentos}</Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{tipo.descricao}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Próxima coleta:</span>
                    <span className="font-medium">{formatarData(tipo.proximaColeta)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agendamentos de Coleta */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Agendamentos Recentes</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agendamentosColeta.map((agendamento) => (
                <div key={agendamento.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getTipoIcon(agendamento.tipo)}
                      <div>
                        <h4 className="font-semibold">{agendamento.solicitante}</h4>
                        <p className="text-sm text-gray-600">{agendamento.protocolo}</p>
                      </div>
                    </div>
                    {getStatusBadge(agendamento.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                    <div>
                      <span className="text-gray-500">Endereço:</span>
                      <p className="font-medium">{agendamento.endereco}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Data:</span>
                      <p className="font-medium">{formatarData(agendamento.dataAgendamento)} às {agendamento.horario}</p>
                    </div>
                  </div>

                  <div className="text-sm mb-2">
                    <span className="text-gray-500">Material:</span>
                    <p className="font-medium">{agendamento.descricao}</p>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{agendamento.observacoes}</p>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <MapPin className="h-4 w-4 mr-2" />
                      Localizar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Contatar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rotas de Coleta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Rotas de Coleta
            </CardTitle>
            <CardDescription>
              Status das rotas especializadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rotasColeta.map((rota) => (
                <div key={rota.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{rota.nome}</h4>
                      <p className="text-sm text-gray-600">{rota.veiculo} - {rota.motorista}</p>
                    </div>
                    {getStatusBadge(rota.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                    <div>
                      <span className="text-gray-500">Pontos:</span>
                      <p className="font-medium">{rota.pontos} agendamentos</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Ajudantes:</span>
                      <p className="font-medium">{rota.ajudantes} pessoas</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Início:</span>
                      <p className="font-medium">{rota.inicioRota}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Previsão:</span>
                      <p className="font-medium">{rota.previsaoTermino}</p>
                    </div>
                  </div>

                  <div className="text-sm mb-3">
                    <span className="text-gray-500">Local atual:</span>
                    <p className="font-medium">{rota.localAtual}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <MapPin className="h-4 w-4 mr-2" />
                      Rastrear
                    </Button>
                    <Button size="sm" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Equipe
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Destinos Finais */}
      <Card>
        <CardHeader>
          <CardTitle>Destinos Finais e Certificações</CardTitle>
          <CardDescription>
            Locais licenciados para destinação adequada dos resíduos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {destinosFinais.map((destino, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getTipoIcon(destino.tipo)}
                    <h4 className="font-semibold">
                      {tiposColetaEspecial.find(t => t.tipo === destino.tipo)?.nome}
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Certificado
                  </Badge>
                </div>

                <div className="text-sm mb-2">
                  <span className="text-gray-500">Empresa:</span>
                  <p className="font-medium">{destino.destino}</p>
                </div>

                <div className="text-sm mb-2">
                  <span className="text-gray-500">Endereço:</span>
                  <p className="font-medium">{destino.endereco}</p>
                </div>

                <div className="text-sm">
                  <span className="text-gray-500">Certificação:</span>
                  <p className="font-medium text-green-600">{destino.certificacao}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Serviços Gerados Automaticamente */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Gerados Automaticamente</CardTitle>
          <CardDescription>
            Funcionalidades desta página que se tornam serviços no catálogo público
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {servicosGerados.map((servico, index) => (
              <div key={index} className="flex items-center p-3 border rounded-lg">
                <Recycle className="h-4 w-4 text-blue-600 mr-3" />
                <span className="text-sm">{servico}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}