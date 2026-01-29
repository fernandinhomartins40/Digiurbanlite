"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Clock,
  AlertCircle,
  Activity,
  Stethoscope,
  Syringe,
  MoreVertical,
  Eye,
  FileText,
  UserX,
  RotateCcw,
  RefreshCw,
} from 'lucide-react'
import type {
  FilaAtendimento,
  StatusFila,
  PrioridadeFila,
  CORES_STATUS_FILA,
  CORES_PRIORIDADE,
} from '@/types/saude'
import { AdicionarAtendimentoDialog } from '@/components/saude/AdicionarAtendimentoDialog'
import { EscutaInicialDialog } from '@/components/saude/EscutaInicialDialog'
import { TriagemEnfermagemDialog } from '@/components/saude/TriagemEnfermagemDialog'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CORES_STATUS: Record<StatusFila, string> = {
  AGUARDANDO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  EM_ESCUTA_INICIAL: 'bg-blue-100 text-blue-800 border-blue-300',
  EM_TRIAGEM: 'bg-purple-100 text-purple-800 border-purple-300',
  AGUARDANDO_MEDICO: 'bg-orange-100 text-orange-800 border-orange-300',
  EM_CONSULTA: 'bg-green-100 text-green-800 border-green-300',
  EM_PROCEDIMENTO: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  EM_VACINACAO: 'bg-pink-100 text-pink-800 border-pink-300',
  FINALIZADO: 'bg-gray-100 text-gray-800 border-gray-300',
  NAO_AGUARDOU: 'bg-red-100 text-red-800 border-red-300',
  RETORNOU: 'bg-teal-100 text-teal-800 border-teal-300',
}

const CORES_PRIORIDADE_MAP: Record<PrioridadeFila, string> = {
  NORMAL: 'bg-gray-100 text-gray-800 border-gray-300',
  URGENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  MUITO_URGENTE: 'bg-orange-100 text-orange-800 border-orange-300',
  EMERGENCIA: 'bg-red-100 text-red-800 border-red-300',
}

const LABELS_STATUS: Record<StatusFila, string> = {
  AGUARDANDO: 'Aguardando',
  EM_ESCUTA_INICIAL: 'Em Escuta Inicial',
  EM_TRIAGEM: 'Em Triagem',
  AGUARDANDO_MEDICO: 'Aguardando Médico',
  EM_CONSULTA: 'Em Consulta',
  EM_PROCEDIMENTO: 'Em Procedimento',
  EM_VACINACAO: 'Em Vacinação',
  FINALIZADO: 'Finalizado',
  NAO_AGUARDOU: 'Não Aguardou',
  RETORNOU: 'Retornou',
}

const LABELS_PRIORIDADE: Record<PrioridadeFila, string> = {
  NORMAL: 'Normal',
  URGENTE: 'Urgente',
  MUITO_URGENTE: 'Muito Urgente',
  EMERGENCIA: 'Emergência',
}

interface ListaAtendimentosPageProps {
  unidadeId?: string
  profissionais?: Array<{ id: string; name: string; especialidade?: string; cbo?: string }>
  currentUserId?: string
}

export function ListaAtendimentosPage({
  unidadeId = 'mock-unidade-id',
  profissionais = [],
  currentUserId = 'mock-user-id'
}: ListaAtendimentosPageProps = {}) {
  const [fila, setFila] = useState<FilaAtendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<StatusFila | 'TODOS'>('TODOS')
  const [filtroPrioridade, setFiltroPrioridade] = useState<PrioridadeFila | 'TODOS'>('TODOS')
  const [busca, setBusca] = useState('')
  const [dialogAdicionar, setDialogAdicionar] = useState(false)
  const [dialogEscuta, setDialogEscuta] = useState<FilaAtendimento | null>(null)
  const [dialogTriagem, setDialogTriagem] = useState<FilaAtendimento | null>(null)

  // Carregar fila de atendimento
  useEffect(() => {
    carregarFila()
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(carregarFila, 30000)
    return () => clearInterval(interval)
  }, [])

  const carregarFila = async () => {
    try {
      const response = await fetch('/api/saude/fila-atendimento')
      const data = await response.json()
      setFila(data)
    } catch (error) {
      console.error('Erro ao carregar fila:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handlers para os diálogos
  const handleAdicionarAtendimento = async (data: any) => {
    try {
      await fetch('/api/saude/fila-atendimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      await carregarFila()
      setDialogAdicionar(false)
    } catch (error) {
      console.error('Erro ao adicionar atendimento:', error)
      throw error
    }
  }

  const handleEscutaInicial = async (data: any) => {
    try {
      await fetch('/api/saude/escuta-inicial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      await carregarFila()
      setDialogEscuta(null)
    } catch (error) {
      console.error('Erro ao registrar escuta inicial:', error)
      throw error
    }
  }

  const handleTriagem = async (data: any) => {
    try {
      await fetch('/api/saude/triagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      await carregarFila()
      setDialogTriagem(null)
    } catch (error) {
      console.error('Erro ao registrar triagem:', error)
      throw error
    }
  }

  // Filtrar fila
  const filaFiltrada = fila.filter((item) => {
    const matchStatus = filtroStatus === 'TODOS' || item.status === filtroStatus
    const matchPrioridade = filtroPrioridade === 'TODOS' || item.prioridade === filtroPrioridade
    const matchBusca = busca === '' ||
      item.citizen?.name.toLowerCase().includes(busca.toLowerCase()) ||
      item.citizen?.cpf.includes(busca)

    return matchStatus && matchPrioridade && matchBusca
  })

  // Estatísticas
  const stats = {
    total: fila.length,
    aguardando: fila.filter(f => f.status === 'AGUARDANDO').length,
    emAtendimento: fila.filter(f =>
      f.status === 'EM_ESCUTA_INICIAL' ||
      f.status === 'EM_TRIAGEM' ||
      f.status === 'EM_CONSULTA'
    ).length,
    urgentes: fila.filter(f =>
      f.prioridade === 'URGENTE' ||
      f.prioridade === 'MUITO_URGENTE' ||
      f.prioridade === 'EMERGENCIA'
    ).length,
  }

  const handleAtender = (item: FilaAtendimento) => {
    // Lógica para iniciar atendimento
    if (item.status === 'AGUARDANDO') {
      setDialogEscuta(item)
    } else if (item.status === 'EM_ESCUTA_INICIAL') {
      setDialogTriagem(item)
    } else if (item.status === 'AGUARDANDO_MEDICO') {
      // Ir para consulta SOAP
      window.location.href = `/apps/saude/atendimento/${item.id}`
    }
  }

  const handleNaoAguardou = async (id: string) => {
    try {
      await fetch(`/api/saude/fila-atendimento/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'NAO_AGUARDOU' }),
      })
      carregarFila()
    } catch (error) {
      console.error('Erro ao marcar como não aguardou:', error)
    }
  }

  const handleRetornou = async (id: string) => {
    try {
      await fetch(`/api/saude/fila-atendimento/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RETORNOU' }),
      })
      carregarFila()
    } catch (error) {
      console.error('Erro ao marcar como retornou:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Lista de Atendimentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie a fila de atendimentos da unidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={carregarFila}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setDialogAdicionar(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar à Fila
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total na Fila</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aguardando}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atendimento</CardTitle>
            <Stethoscope className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emAtendimento}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgentes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as StatusFila | 'TODOS')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os Status</SelectItem>
                <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                <SelectItem value="EM_ESCUTA_INICIAL">Em Escuta Inicial</SelectItem>
                <SelectItem value="EM_TRIAGEM">Em Triagem</SelectItem>
                <SelectItem value="AGUARDANDO_MEDICO">Aguardando Médico</SelectItem>
                <SelectItem value="EM_CONSULTA">Em Consulta</SelectItem>
                <SelectItem value="FINALIZADO">Finalizado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroPrioridade} onValueChange={(value) => setFiltroPrioridade(value as PrioridadeFila | 'TODOS')}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas as Prioridades</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
                <SelectItem value="MUITO_URGENTE">Muito Urgente</SelectItem>
                <SelectItem value="EMERGENCIA">Emergência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Pacientes na Fila ({filaFiltrada.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prioridade</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tempo de Espera</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filaFiltrada.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge className={CORES_PRIORIDADE_MAP[item.prioridade]}>
                      {LABELS_PRIORIDADE[item.prioridade]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.citizen?.name}</div>
                      <div className="text-sm text-muted-foreground">{item.citizen?.cpf}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{item.tipoAtendimento.replace('_', ' ')}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{item.motivoBusca}</TableCell>
                  <TableCell>
                    <Badge className={CORES_STATUS[item.status]}>
                      {LABELS_STATUS[item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDistanceToNow(new Date(item.dataHoraChegada), { addSuffix: true, locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAtender(item)}>
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Atender
                        </DropdownMenuItem>
                        {item.status === 'AGUARDANDO' && (
                          <DropdownMenuItem onClick={() => setDialogEscuta(item)}>
                            <Activity className="h-4 w-4 mr-2" />
                            Escuta Inicial
                          </DropdownMenuItem>
                        )}
                        {item.vacinacao && (
                          <DropdownMenuItem>
                            <Syringe className="h-4 w-4 mr-2" />
                            Vacinar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Prontuário
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleNaoAguardou(item.id)}>
                          <UserX className="h-4 w-4 mr-2" />
                          Não Aguardou
                        </DropdownMenuItem>
                        {item.status === 'NAO_AGUARDOU' && (
                          <DropdownMenuItem onClick={() => handleRetornou(item.id)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Retornou
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AdicionarAtendimentoDialog
        open={dialogAdicionar}
        onOpenChange={setDialogAdicionar}
        onSubmit={handleAdicionarAtendimento}
        unidadeId={unidadeId}
      />

      {dialogEscuta && (
        <EscutaInicialDialog
          open={!!dialogEscuta}
          onOpenChange={(open: boolean) => !open && setDialogEscuta(null)}
          onSubmit={handleEscutaInicial}
          filaAtendimento={dialogEscuta}
          profissionais={profissionais}
          currentUserId={currentUserId}
        />
      )}

      {dialogTriagem && (
        <TriagemEnfermagemDialog
          open={!!dialogTriagem}
          onOpenChange={(open: boolean) => !open && setDialogTriagem(null)}
          onSubmit={handleTriagem}
          filaAtendimento={dialogTriagem}
          currentUserId={currentUserId}
        />
      )}
    </div>
  )
}
