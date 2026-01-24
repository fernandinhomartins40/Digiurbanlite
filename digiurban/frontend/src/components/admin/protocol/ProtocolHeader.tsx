'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Download
} from 'lucide-react'

interface StageValidation {
  canProgress: boolean
  blockers: string[]
  warnings: string[]
  missingDocuments: string[]
  missingFormFields: string[]
}

interface ProtocolHeaderProps {
  protocolId: string
  protocolNumber: string
  serviceName: string
  status: string
  citizenName?: string
  currentStage?: {
    id: string
    stageName: string
    status: string
    metadata?: any
  }
  onActionComplete: () => void
  onBack: () => void
}

export function ProtocolHeader({
  protocolId,
  protocolNumber,
  serviceName,
  status,
  citizenName,
  currentStage,
  onActionComplete,
  onBack
}: ProtocolHeaderProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [validation, setValidation] = useState<StageValidation | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const stageType = currentStage?.metadata?.stageType
  const approveActionLabel = currentStage?.metadata?.actionLabels?.APPROVE || 'Aprovar'
  const isConclusionStage = stageType === 'CONCLUSION'

  // Validar etapa atual
  const loadValidation = async () => {
    if (!currentStage) return

    try {
      setIsValidating(true)
      const response = await apiRequest(`/protocols/${protocolId}/stages/${currentStage.id}/validate`)

      if (response.success) {
        setValidation(response.data.validation)
      }
    } catch (error) {
      console.error('Erro ao validar etapa:', error)
    } finally {
      setIsValidating(false)
    }
  }

  // Aprovar etapa
  const handleApprove = async () => {
    if (!currentStage) return

    if (isConclusionStage) {
      await handleCompleteProtocol()
      return
    }

    try {
      setIsSubmitting(true)

      const response = await apiRequest(`/protocols/${protocolId}/stages/${currentStage.id}/complete`, {
        method: 'PUT',
        body: JSON.stringify({
          result: 'APPROVED',
          notes
        })
      })

      if (response.success) {
        toast({
          title: 'Etapa aprovada',
          description: 'A etapa foi aprovada e o protocolo avançou para a próxima etapa.'
        })
        setShowApproveModal(false)
        setNotes('')
        onActionComplete()
      }
    } catch (error) {
      toast({
        title: 'Erro ao aprovar etapa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteProtocol = async () => {
    if (!currentStage) return

    try {
      setIsSubmitting(true)

      const response = await apiRequest(`/protocols/${protocolId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          finalNotes: notes
        })
      })

      if (response.success) {
        toast({
          title: 'Protocolo concluído',
          description: 'O protocolo foi concluído com sucesso.'
        })
        setShowApproveModal(false)
        setNotes('')
        onActionComplete()
      }
    } catch (error) {
      toast({
        title: 'Erro ao concluir protocolo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Rejeitar etapa
  const handleReject = async () => {
    if (!currentStage) return

    if (!notes.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Por favor, informe o motivo da rejeição',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await apiRequest(`/protocols/${protocolId}/stages/${currentStage.id}/complete`, {
        method: 'PUT',
        body: JSON.stringify({
          result: 'REJECTED',
          notes
        })
      })

      if (response.success) {
        toast({
          title: 'Etapa rejeitada',
          description: 'A etapa foi rejeitada e o protocolo foi movido para pendências.'
        })
        setShowRejectModal(false)
        setNotes('')
        onActionComplete()
      }
    } catch (error) {
      toast({
        title: 'Erro ao rejeitar etapa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enviar mensagem ao cidadão
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: 'Mensagem obrigatória',
        description: 'Por favor, escreva uma mensagem',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await apiRequest(`/protocols/${protocolId}/interactions`, {
        method: 'POST',
        body: JSON.stringify({
          interactionType: 'MESSAGE',
          message,
          visibility: 'PUBLIC'
        })
      })

      if (response.success) {
        toast({
          title: 'Mensagem enviada',
          description: 'A mensagem foi enviada ao cidadão com sucesso.'
        })
        setShowMessageModal(false)
        setMessage('')
        onActionComplete()
      }
    } catch (error) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Exportar protocolo
  const handleExport = () => {
    toast({
      title: 'Exportação em desenvolvimento',
      description: 'Funcionalidade de exportação será implementada em breve.'
    })
  }

  // Determinar badge de status
  const getStatusBadge = () => {
    switch (status) {
      case 'VINCULADO':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Vinculado</Badge>
      case 'PROGRESSO':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Em Progresso</Badge>
      case 'CONCLUIDO':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Concluído</Badge>
      case 'PENDENCIA':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Pendente</Badge>
      case 'CANCELADO':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const allowedActions = currentStage?.metadata?.allowedActions || []
  const showActions = currentStage?.status === 'IN_PROGRESS' && allowedActions.length > 0

  return (
    <>
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          {/* Linha 1: Voltar + Título + Status */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="shrink-0 mt-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {protocolNumber}
                </h1>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {serviceName}
                </p>
                {citizenName && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    Cidadão: {citizenName}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {getStatusBadge()}
            </div>
          </div>

          {/* Linha 2: Etapa Atual */}
          {currentStage && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-900 truncate">
                    Etapa Atual: {currentStage.stageName}
                  </p>
                </div>
                {currentStage.status === 'IN_PROGRESS' && (
                  <Badge variant="default" className="bg-blue-600 shrink-0">
                    Em Andamento
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Linha 3: Ações Primárias */}
          <div className="flex flex-wrap gap-2">
            {/* Ações de Workflow (apenas se etapa em progresso) */}
            {showActions && (
              <>
                {allowedActions.includes('APPROVE') && (
                  <Button
                    size="sm"
                    onClick={() => {
                      loadValidation().then(() => setShowApproveModal(true))
                    }}
                    disabled={isValidating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {approveActionLabel}
                  </Button>
                )}

                {allowedActions.includes('REJECT') && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowRejectModal(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                )}

                {allowedActions.includes('CREATE_PENDING') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: 'Criar pendência',
                        description: 'Acesse a aba "Pendências" para criar uma nova pendência.'
                      })
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Criar Pendência
                  </Button>
                )}
              </>
            )}

            {/* Ações Gerais (sempre disponíveis) */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMessageModal(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Mensagem
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Aprovação */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approveActionLabel}: {currentStage?.stageName}</DialogTitle>
            <DialogDescription>
              {isConclusionStage
                ? 'Confirme a conclusão do protocolo.'
                : validation?.canProgress
                ? 'Todos os critérios foram atendidos. Confirme a aprovação para avançar.'
                : 'Atenção: Existem pendências. Tem certeza que deseja aprovar?'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="approve-notes">Observações (opcional)</Label>
              <Textarea
                id="approve-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre a aprovação..."
                rows={3}
              />
            </div>

            {validation && !validation.canProgress && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-900 font-medium mb-1">Impedimentos pendentes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
                  {validation.blockers.map((blocker, i) => (
                    <li key={i}>{blocker}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aprovando...
                </>
              ) : (
                `Confirmar ${approveActionLabel}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Rejeição */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Etapa: {currentStage?.stageName}</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O protocolo será movido para pendências.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="reject-notes">Motivo da Rejeição *</Label>
              <Textarea
                id="reject-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting || !notes.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                'Confirmar Rejeição'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Mensagem */}
      <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensagem ao Cidadão</DialogTitle>
            <DialogDescription>
              A mensagem será visível para o cidadão no portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva a mensagem..."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageModal(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSendMessage} disabled={isSubmitting || !message.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Mensagem'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
