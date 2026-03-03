'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, AlertCircle, Loader2, FileText, FormInput } from 'lucide-react'

interface StageValidation {
  canProgress: boolean
  blockers: string[]
  warnings: string[]
  missingDocuments: string[]
  missingFormFields: string[]
}

interface StageExecutionAccess {
  canExecute: boolean
  blockers: string[]
}

interface ProtocolStageActionsProps {
  protocolId: string
  stageId: string
  stageName: string
  stageStatus: string
  metadata?: any
  onActionComplete: () => void
}

export function ProtocolStageActions({
  protocolId,
  stageId,
  stageName,
  stageStatus,
  metadata,
  onActionComplete
}: ProtocolStageActionsProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [validation, setValidation] = useState<StageValidation | null>(null)
  const [executionAccess, setExecutionAccess] = useState<StageExecutionAccess | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar validação
  const loadValidation = async () => {
    try {
      setIsValidating(true)
      const response = await apiRequest(`/protocols/${protocolId}/stages/${stageId}/validate`)

      if (response.success) {
        setValidation(response.data.validation)
        setExecutionAccess(response.data.executionAccess || null)
      }
    } catch (error) {
      console.error('Erro ao validar etapa:', error)
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    loadValidation()
  }, [protocolId, stageId])

  // Aprovar etapa
  const handleApprove = async () => {
    try {
      setIsSubmitting(true)

      const response = await apiRequest(`/protocols/${protocolId}/stages/${stageId}/complete`, {
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

  // Rejeitar etapa
  const handleReject = async () => {
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

      const response = await apiRequest(`/protocols/${protocolId}/stages/${stageId}/complete`, {
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

  // Só mostrar ações se a etapa estiver em progresso
  if (stageStatus !== 'IN_PROGRESS') {
    return null
  }

  const allowedActions = metadata?.allowedActions || []
  const isExecutionBlocked = executionAccess ? !executionAccess.canExecute : false

  return (
    <>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg break-words">Ações da Etapa: {stageName}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Aprove, rejeite ou crie pendências para esta etapa do workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validação */}
          {!validation && (
            <Button
              onClick={loadValidation}
              variant="outline"
              className="w-full"
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                'Verificar Critérios de Aprovação'
              )}
            </Button>
          )}

          {/* Resultados da validação */}
          {validation && (
            <div className="space-y-3">
              {isExecutionBlocked && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="font-medium text-red-900 mb-2">Execução restrita nesta etapa:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                    {executionAccess?.blockers.map((blocker, i) => (
                      <li key={i}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2">
                {validation.canProgress ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {validation.canProgress
                    ? 'Todos os critérios foram atendidos'
                    : 'Existem pendências para aprovar esta etapa'}
                </span>
              </div>

              {/* Bloqueios */}
              {validation.blockers.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="font-medium text-red-900 mb-2">Impedimentos:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                    {validation.blockers.map((blocker, i) => (
                      <li key={i}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Documentos faltantes */}
              {validation.missingDocuments.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-amber-700" />
                    <p className="font-medium text-amber-900">Documentos Pendentes:</p>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                    {validation.missingDocuments.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Campos faltantes */}
              {validation.missingFormFields.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <FormInput className="h-4 w-4 text-amber-700" />
                    <p className="font-medium text-amber-900">Campos Não Preenchidos:</p>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                    {validation.missingFormFields.map((field, i) => (
                      <li key={i}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="space-y-2 pt-2">
            {allowedActions.includes('APPROVE') && (
                <Button
                  onClick={() => {
                    loadValidation().then(() => setShowApproveModal(true))
                  }}
                  className="w-full"
                  disabled={isValidating || isExecutionBlocked}
                >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar e Avançar
              </Button>
            )}

            {allowedActions.includes('REJECT') && (
              <Button
                onClick={() => setShowRejectModal(true)}
                variant="destructive"
                className="w-full"
                disabled={isExecutionBlocked}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar Etapa
              </Button>
            )}

            {allowedActions.includes('CREATE_PENDING') && (
              <Button
                variant="outline"
                className="w-full"
                disabled={isExecutionBlocked}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Criar Pendência
              </Button>
            )}
          </div>

          {/* Requisitos da etapa */}
          {metadata?.requiredDocumentTypes?.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs sm:text-sm font-medium mb-2">Documentos Exigidos:</p>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {metadata.requiredDocumentTypes.map((doc: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs break-words">
                    {doc}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Aprovação */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Etapa: {stageName}</DialogTitle>
            <DialogDescription>
              {validation?.canProgress
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
                'Confirmar Aprovação'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Rejeição */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Etapa: {stageName}</DialogTitle>
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
    </>
  )
}
