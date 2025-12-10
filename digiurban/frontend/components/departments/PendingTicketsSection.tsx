'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Phone,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/services/api'

interface AdminTicket {
  id: string
  number: string
  title: string
  description: string
  status: string
  priority: number
  createdAt: string
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
    estimatedDays: number
  }
  requestedBy: {
    id: string
    name: string
    role: string
  }
  protocol?: {
    id: string
    number: string
    status: string
  }
}

interface TicketsData {
  tickets: AdminTicket[]
  stats: {
    total: number
    byStatus: Record<string, number>
  }
}

export function PendingTicketsSection() {
  const [data, setData] = useState<TicketsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null)
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null)
  const [observations, setObservations] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadTickets = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/departments/tickets?status=PENDING')

      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar chamados pendentes:', error)
      toast.error('Erro ao carregar chamados pendentes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleAccept = async () => {
    if (!selectedTicket) return

    try {
      setIsSubmitting(true)
      const response = await api.post(`/departments/tickets/${selectedTicket.id}/accept`, {
        observations
      })

      if (response.data.success) {
        toast.success('Chamado aceito com sucesso!', {
          description: `Protocolo ${response.data.data.protocol.number} criado`
        })
        closeDialog()
        loadTickets()
      }
    } catch (error: any) {
      console.error('Erro ao aceitar chamado:', error)
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Erro ao aceitar chamado'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedTicket || !rejectionReason) {
      toast.error('Informe o motivo da recusa')
      return
    }

    if (rejectionReason.length < 10) {
      toast.error('O motivo deve ter pelo menos 10 caracteres')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await api.post(`/departments/tickets/${selectedTicket.id}/reject`, {
        reason: rejectionReason
      })

      if (response.data.success) {
        toast.success('Chamado recusado', {
          description: 'O prefeito será notificado'
        })
        closeDialog()
        loadTickets()
      }
    } catch (error: any) {
      console.error('Erro ao recusar chamado:', error)
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Erro ao recusar chamado'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeDialog = () => {
    setSelectedTicket(null)
    setActionType(null)
    setObservations('')
    setRejectionReason('')
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

  const pendingTickets = data?.tickets.filter(t => t.status === 'PENDING') || []

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Phone className="h-6 w-6 text-orange-600" />
                Chamados do Prefeito
              </CardTitle>
              <CardDescription>
                Chamados aguardando análise - {data?.stats.byStatus.PENDING || 0} pendente(s)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadTickets} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : pendingTickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900 mb-1">Nenhum chamado pendente</p>
              <p className="text-sm text-gray-500">
                Todos os chamados foram processados
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border border-orange-200 rounded-lg p-4 bg-orange-50/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-orange-600">
                          {ticket.number}
                        </span>
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          <Clock className="h-3 w-3 mr-1" />
                          Aguardando Análise
                        </Badge>
                        {ticket.priority >= 4 && (
                          <Badge className={priorityColors[ticket.priority]}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {priorityLabels[ticket.priority]}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {getDaysAgo(ticket.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-medium text-gray-900 mb-3">
                        {ticket.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
                        <div>
                          <strong>Cidadão:</strong> {ticket.citizen.name}
                        </div>
                        <div>
                          <strong>CPF:</strong> {ticket.citizen.cpf}
                        </div>
                        <div>
                          <strong>Serviço:</strong> {ticket.service.name}
                        </div>
                        <div>
                          <strong>Solicitado por:</strong> {ticket.requestedBy.name}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setActionType('accept')
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aceitar e Criar Protocolo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setActionType('reject')
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept Dialog */}
      <Dialog open={actionType === 'accept'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Aceitar Chamado
            </DialogTitle>
            <DialogDescription>
              Ao aceitar, um protocolo será criado automaticamente para o cidadão
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div><strong>Chamado:</strong> {selectedTicket.number}</div>
                <div><strong>Cidadão:</strong> {selectedTicket.citizen.name}</div>
                <div><strong>Serviço:</strong> {selectedTicket.service.name}</div>
                <div><strong>Título:</strong> {selectedTicket.title}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações (opcional)</Label>
                <Textarea
                  id="observations"
                  placeholder="Adicione observações sobre o atendimento..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAccept}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar e Criar Protocolo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionType === 'reject'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Recusar Chamado
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa. O prefeito será notificado.
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div><strong>Chamado:</strong> {selectedTicket.number}</div>
                <div><strong>Cidadão:</strong> {selectedTicket.citizen.name}</div>
                <div><strong>Título:</strong> {selectedTicket.title}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Motivo da Recusa *</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explique o motivo da recusa (mínimo 10 caracteres)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className={
                    rejectionReason.length > 0 && rejectionReason.length < 10
                      ? 'border-red-500'
                      : rejectionReason.length >= 10
                      ? 'border-green-500'
                      : ''
                  }
                  required
                />
                {rejectionReason.length > 0 && rejectionReason.length < 10 && (
                  <p className="text-xs text-red-500">
                    Faltam {10 - rejectionReason.length} caracteres
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || rejectionReason.length < 10}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirmar Recusa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
