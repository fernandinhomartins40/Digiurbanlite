'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Phone,
  Search,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  FileText,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/services/api'
import Link from 'next/link'

interface AdminTicket {
  id: string
  number: string
  title: string
  description: string
  status: 'PENDING' | 'ACCEPTED' | 'PROTOCOL_CREATED' | 'REJECTED' | 'CANCELLED'
  priority: number
  createdAt: string
  updatedAt: string
  acceptedAt?: string
  rejectedAt?: string
  protocolCreatedAt?: string
  rejectionReason?: string
  acceptedBy?: string
  rejectedBy?: string
  citizen: {
    id: string
    name: string
    cpf: string
    email: string
    phone: string
  }
  service: {
    id: string
    name: string
    category: string
  }
  department: {
    id: string
    name: string
    code: string
  }
  assignedUser?: {
    id: string
    name: string
    email: string
    role: string
  }
  requestedBy: {
    id: string
    name: string
    email: string
    role: string
  }
  protocol?: {
    id: string
    number: string
    status: string
    createdAt: string
    assignedUser?: {
      name: string
    }
  }
}

interface TicketsData {
  tickets: AdminTicket[]
  stats: {
    total: number
    byStatus: Record<string, number>
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ListaChamadosPage() {
  const router = useRouter()
  const [data, setData] = useState<TicketsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const loadTickets = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await api.get(`/admin/chamados?${params.toString()}`)

      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar chamados:', error)
      toast.error('Erro ao carregar chamados')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [statusFilter])

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-300',
    PROTOCOL_CREATED: 'bg-green-100 text-green-800 border-green-300',
    REJECTED: 'bg-red-100 text-red-800 border-red-300',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'Aguardando Secretaria',
    ACCEPTED: 'Aceito',
    PROTOCOL_CREATED: 'Protocolo Criado',
    REJECTED: 'Recusado',
    CANCELLED: 'Cancelado'
  }

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    ACCEPTED: CheckCircle,
    PROTOCOL_CREATED: FileText,
    REJECTED: XCircle,
    CANCELLED: Ban
  }

  const priorityColors: Record<number, string> = {
    5: 'bg-red-600 text-white',
    4: 'bg-orange-600 text-white',
    3: 'bg-yellow-600 text-white',
    2: 'bg-blue-600 text-white',
    1: 'bg-gray-600 text-white'
  }

  const priorityLabels: Record<number, string> = {
    5: 'Crítica',
    4: 'Urgente',
    3: 'Alta',
    2: 'Média',
    1: 'Baixa'
  }

  const getDaysAgo = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    return `${days} dias atrás`
  }

  const filteredTickets = data?.tickets.filter(ticket => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      ticket.number.toLowerCase().includes(search) ||
      ticket.title.toLowerCase().includes(search) ||
      ticket.citizen.name.toLowerCase().includes(search) ||
      ticket.department.name.toLowerCase().includes(search)
    )
  }) || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/chamados')}
                className="self-start"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
                Meus Chamados
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Acompanhe o status dos chamados criados
            </p>
          </div>
          <Button onClick={loadTickets} disabled={isLoading} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{data.stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-yellow-600">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{data.stats.byStatus.PENDING || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-600">Com Protocolo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{data.stats.byStatus.PROTOCOL_CREATED || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-red-600">Recusados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{data.stats.byStatus.REJECTED || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Cancelados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{data.stats.byStatus.CANCELLED || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número, título, cidadão ou secretaria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Aguardando Secretaria</SelectItem>
                <SelectItem value="PROTOCOL_CREATED">Com Protocolo Criado</SelectItem>
                <SelectItem value="REJECTED">Recusados</SelectItem>
                <SelectItem value="CANCELLED">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Chamados ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Lista completa de chamados administrativos criados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Phone className="h-16 w-16 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900 mb-1">Nenhum chamado encontrado</p>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Crie seu primeiro chamado administrativo'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => {
                const StatusIcon = statusIcons[ticket.status]
                return (
                  <div
                    key={ticket.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="font-mono text-xs sm:text-sm font-semibold text-blue-600">
                            {ticket.number}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${statusColors[ticket.status]} text-xs`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">{statusLabels[ticket.status]}</span>
                            <span className="sm:hidden">{statusLabels[ticket.status].split(' ')[0]}</span>
                          </Badge>
                          {ticket.priority >= 4 && (
                            <Badge className={`${priorityColors[ticket.priority]} text-xs`}>
                              {priorityLabels[ticket.priority]}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {getDaysAgo(ticket.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-2">
                          {ticket.title}
                        </h3>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600 mb-3">
                          <div className="truncate">
                            <strong>Cidadão:</strong> {ticket.citizen.name}
                          </div>
                          <div className="truncate">
                            <strong>Serviço:</strong> {ticket.service.name}
                          </div>
                          <div className="truncate">
                            <strong>Secretaria:</strong> {ticket.department.name}
                          </div>
                          {ticket.assignedUser && (
                            <div className="truncate">
                              <strong>Servidor:</strong> {ticket.assignedUser.name}
                            </div>
                          )}
                        </div>

                        {/* Protocol Info (if created) */}
                        {ticket.protocol && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="font-medium text-xs sm:text-sm text-green-900">Protocolo Criado</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-green-800">
                              <div className="break-all">
                                <strong>Número:</strong>{' '}
                                <Link
                                  href={`/admin/protocolos?search=${ticket.protocol.number}`}
                                  className="text-green-600 hover:underline font-mono"
                                >
                                  {ticket.protocol.number}
                                </Link>
                              </div>
                              <div>
                                <strong>Status:</strong> {ticket.protocol.status}
                              </div>
                              {ticket.protocol.assignedUser && (
                                <div className="sm:col-span-2 break-words">
                                  <strong>Responsável:</strong> {ticket.protocol.assignedUser.name}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Rejection Info (if rejected) */}
                        {ticket.status === 'REJECTED' && ticket.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                              <span className="font-medium text-xs sm:text-sm text-red-900">Motivo da Recusa</span>
                            </div>
                            <p className="text-xs sm:text-sm text-red-800 break-words">{ticket.rejectionReason}</p>
                            {ticket.rejectedBy && (
                              <p className="text-xs text-red-600 mt-1 break-words">
                                Recusado por: {ticket.rejectedBy}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
