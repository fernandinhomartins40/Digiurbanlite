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
  Lightbulb,
  MapPin,
  Zap,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Activity,
  Wrench,
  Calendar,
  Phone,
  Settings,
  BarChart3,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react'
import { useState } from 'react'

const problemasIluminacao = [
  {
    id: 1,
    protocolo: 'IL-2024-0001',
    endereco: 'Rua das Flores, 123',
    bairro: 'Centro',
    tipoProblema: 'lampada-queimada',
    descricao: 'Lâmpada LED queimada há 3 dias',
    solicitante: 'Maria Silva Santos',
    telefone: '(11) 99999-0001',
    dataAbertura: '2024-01-20',
    prioridade: 'media',
    status: 'em-andamento',
    equipe: 'Equipe A - Elétrica'
  },
  {
    id: 2,
    protocolo: 'IL-2024-0002',
    endereco: 'Av. Principal, 456',
    bairro: 'Jardim das Flores',
    tipoProblema: 'poste-danificado',
    descricao: 'Poste inclinado após chuva forte',
    solicitante: 'João Carlos Lima',
    telefone: '(11) 99999-0002',
    dataAbertura: '2024-01-18',
    prioridade: 'alta',
    status: 'concluido',
    equipe: 'Equipe B - Manutenção'
  },
  {
    id: 3,
    protocolo: 'IL-2024-0003',
    endereco: 'Rua Nova, 789',
    bairro: 'Vila Nova',
    tipoProblema: 'falta-iluminacao',
    descricao: 'Trecho sem iluminação, necessário novo poste',
    solicitante: 'Ana Costa Oliveira',
    telefone: '(11) 99999-0003',
    dataAbertura: '2024-01-22',
    prioridade: 'alta',
    status: 'agendado',
    equipe: 'Equipe C - Instalação'
  }
]

const equipesIluminacao = [
  {
    id: 1,
    nome: 'Equipe A - Elétrica',
    especialidade: 'Manutenção e Reparo',
    membros: 3,
    lider: 'Carlos Silva',
    veiculo: 'Van EL-001',
    equipamentos: ['Escada telescópica', 'Multímetro', 'Ferramentas básicas'],
    status: 'em-campo',
    localizacao: 'Rua das Flores'
  },
  {
    id: 2,
    nome: 'Equipe B - Manutenção',
    especialidade: 'Postes e Estruturas',
    membros: 4,
    lider: 'Pedro Santos',
    veiculo: 'Caminhão CP-002',
    equipamentos: ['Guindaste', 'Solda', 'Ferramentas pesadas'],
    status: 'disponivel',
    localizacao: 'Depósito Central'
  },
  {
    id: 3,
    nome: 'Equipe C - Instalação',
    especialidade: 'Novos Pontos',
    membros: 5,
    lider: 'Ana Oliveira',
    veiculo: 'Caminhão IN-003',
    equipamentos: ['Perfuratriz', 'Guindaste', 'Material elétrico'],
    status: 'disponivel',
    localizacao: 'Base Operacional'
  }
]

const estatisticasIluminacao = {
  pontosLuz: 2847,
  funcionando: 2734,
  problemas: 113,
  eficiencia: 96,
  consumoMensal: 45800,
  economiaLed: 18,
  manutencoesMes: 42
}

const tiposProblemas = [
  {
    tipo: 'lampada-queimada',
    nome: 'Lâmpada Queimada',
    count: 35,
    tempoMedio: '2 dias',
    icon: Lightbulb
  },
  {
    tipo: 'poste-danificado',
    nome: 'Poste Danificado',
    count: 8,
    tempoMedio: '5 dias',
    icon: AlertTriangle
  },
  {
    tipo: 'falta-iluminacao',
    nome: 'Falta de Iluminação',
    count: 12,
    tempoMedio: '10 dias',
    icon: Zap
  },
  {
    tipo: 'fiacao-exposta',
    nome: 'Fiação Exposta',
    count: 6,
    tempoMedio: '1 dia',
    icon: Settings
  }
]

const servicosGerados = [
  'Reparo de Iluminação Pública',
  'Instalação de Novo Poste',
  'Troca de Lâmpada',
  'Manutenção Preventiva',
  'Religação de Energia',
  'Poda de Árvore em Fiação',
  'Vistoria Técnica'
]

export default function IluminacaoPublicaPage() {
  const { user } = useAdminAuth()
  const [novoProblema, setNovoProblema] = useState({
    endereco: '',
    bairro: '',
    tipoProblema: '',
    descricao: '',
    solicitante: '',
    telefone: '',
    prioridade: 'media'
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendado':
        return <Badge className="bg-blue-500 text-white">Agendado</Badge>
      case 'em-andamento':
        return <Badge className="bg-yellow-500 text-white">Em Andamento</Badge>
      case 'concluido':
        return <Badge className="bg-green-500 text-white">Concluído</Badge>
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>
      case 'disponivel':
        return <Badge className="bg-green-500 text-white">Disponível</Badge>
      case 'em-campo':
        return <Badge className="bg-blue-500 text-white">Em Campo</Badge>
      case 'manutencao':
        return <Badge className="bg-yellow-500 text-white">Manutenção</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return <Badge variant="destructive">Alta</Badge>
      case 'media':
        return <Badge className="bg-yellow-500 text-white">Média</Badge>
      case 'baixa':
        return <Badge variant="secondary">Baixa</Badge>
      default:
        return <Badge variant="outline">{prioridade}</Badge>
    }
  }

  const getEficienciaColor = (eficiencia: number) => {
    if (eficiencia >= 95) return 'text-green-600'
    if (eficiencia >= 90) return 'text-yellow-600'
    return 'text-red-600'
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
            <Lightbulb className="h-8 w-8 text-blue-600 mr-3" />
            Iluminação Pública
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema de manutenção, instalação e monitoramento da iluminação urbana
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          Infraestrutura Elétrica
        </Badge>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos de Luz</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticasIluminacao.pontosLuz.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Na cidade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionando</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEficienciaColor(estatisticasIluminacao.eficiencia)}`}>
              {estatisticasIluminacao.funcionando.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {estatisticasIluminacao.eficiencia}% de eficiência
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problemas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estatisticasIluminacao.problemas}</div>
            <p className="text-xs text-muted-foreground">
              Reportados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipes Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Especializadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Novo Problema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Reportar Problema
            </CardTitle>
            <CardDescription>
              Registrar problema de iluminação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Local do problema"
                value={novoProblema.endereco}
                onChange={(e) => setNovoProblema(prev => ({ ...prev, endereco: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                placeholder="Nome do bairro"
                value={novoProblema.bairro}
                onChange={(e) => setNovoProblema(prev => ({ ...prev, bairro: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="tipoProblema">Tipo de Problema</Label>
              <Select value={novoProblema.tipoProblema} onValueChange={(value) => setNovoProblema(prev => ({ ...prev, tipoProblema: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposProblemas.map((tipo) => (
                    <SelectItem key={tipo.tipo} value={tipo.tipo}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o problema detalhadamente"
                value={novoProblema.descricao}
                onChange={(e) => setNovoProblema(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="solicitante">Solicitante</Label>
              <Input
                id="solicitante"
                placeholder="Nome completo"
                value={novoProblema.solicitante}
                onChange={(e) => setNovoProblema(prev => ({ ...prev, solicitante: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                value={novoProblema.telefone}
                onChange={(e) => setNovoProblema(prev => ({ ...prev, telefone: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={novoProblema.prioridade} onValueChange={(value) => setNovoProblema(prev => ({ ...prev, prioridade: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reportar Problema
            </Button>
          </CardContent>
        </Card>

        {/* Problemas de Iluminação */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Problemas de Iluminação</CardTitle>
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
              {problemasIluminacao.map((problema) => (
                <div key={problema.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{problema.endereco}</h4>
                      <p className="text-sm text-gray-600">{problema.protocolo} - {problema.bairro}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPrioridadeBadge(problema.prioridade)}
                      {getStatusBadge(problema.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <p className="font-medium">{tiposProblemas.find(t => t.tipo === problema.tipoProblema)?.nome}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Abertura:</span>
                      <p className="font-medium">{formatarData(problema.dataAbertura)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Solicitante:</span>
                      <p className="font-medium">{problema.solicitante}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Equipe:</span>
                      <p className="font-medium">{problema.equipe}</p>
                    </div>
                  </div>

                  <div className="text-sm mb-3">
                    <span className="text-gray-500">Descrição:</span>
                    <p className="text-gray-700">{problema.descricao}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <MapPin className="h-4 w-4 mr-2" />
                      Localizar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Contatar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Wrench className="h-4 w-4 mr-2" />
                      Atribuir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipos de Problemas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Tipos de Problemas
            </CardTitle>
            <CardDescription>
              Estatísticas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tiposProblemas.map((tipo) => (
                <div key={tipo.tipo} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <tipo.icon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">{tipo.nome}</h4>
                      <p className="text-sm text-gray-600">Tempo médio: {tipo.tempoMedio}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-blue-600">{tipo.count}</p>
                    <p className="text-xs text-gray-500">casos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equipes de Iluminação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Equipes de Iluminação
            </CardTitle>
            <CardDescription>
              Status das equipes especializadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {equipesIluminacao.map((equipe) => (
                <div key={equipe.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{equipe.nome}</h4>
                      <p className="text-sm text-gray-600">{equipe.especialidade}</p>
                    </div>
                    {getStatusBadge(equipe.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                    <div>
                      <span className="text-gray-500">Líder:</span>
                      <p className="font-medium">{equipe.lider}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Membros:</span>
                      <p className="font-medium">{equipe.membros} pessoas</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Veículo:</span>
                      <p className="font-medium">{equipe.veiculo}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Local:</span>
                      <p className="font-medium">{equipe.localizacao}</p>
                    </div>
                  </div>

                  <div className="text-sm mb-3">
                    <span className="text-gray-500">Equipamentos:</span>
                    <p className="font-medium">{equipe.equipamentos.join(', ')}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <MapPin className="h-4 w-4 mr-2" />
                      Localizar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Indicadores de Performance
          </CardTitle>
          <CardDescription>
            Métricas da iluminação pública municipal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Consumo Mensal</h4>
              <p className="text-2xl font-bold text-blue-600">{estatisticasIluminacao.consumoMensal.toLocaleString()}</p>
              <p className="text-sm text-gray-600">kWh</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Economia LED</h4>
              <p className="text-2xl font-bold text-green-600">{estatisticasIluminacao.economiaLed}%</p>
              <p className="text-sm text-gray-600">Redução de consumo</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold text-lg">Manutenções/Mês</h4>
              <p className="text-2xl font-bold text-orange-600">{estatisticasIluminacao.manutencoesMes}</p>
              <p className="text-sm text-gray-600">Intervenções</p>
            </div>
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
                <Lightbulb className="h-4 w-4 text-blue-600 mr-3" />
                <span className="text-sm">{servico}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}