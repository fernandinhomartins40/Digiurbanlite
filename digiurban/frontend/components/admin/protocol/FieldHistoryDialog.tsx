'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle2, XCircle, Clock, Edit } from 'lucide-react'

interface ApprovalHistoryItem {
  id: string
  action: string
  timestamp: string
  actor: {
    id: string
    name: string
    email: string
  }
  reason?: string
  previousValue?: string
  newValue?: string
}

interface ChangeHistoryItem {
  id: string
  changeType: string
  timestamp: string
  actor: {
    id: string
    name: string
    email: string
  }
  oldValue?: string
  newValue?: string
}

interface FieldHistoryDialogProps {
  protocolId: string
  fieldKey: string
  fieldLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FieldHistoryDialog({
  protocolId,
  fieldKey,
  fieldLabel,
  open,
  onOpenChange
}: FieldHistoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [approvals, setApprovals] = useState<ApprovalHistoryItem[]>([])
  const [changes, setChanges] = useState<ChangeHistoryItem[]>([])

  useEffect(() => {
    if (open) {
      loadHistory()
    }
  }, [open, protocolId, fieldKey])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api'
      const url = `${apiUrl}/protocols/${protocolId}/fields/${fieldKey}/history`

      const response = await fetch(url, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico')
      }

      const data = await response.json()
      setApprovals(data.approvals || [])
      setChanges(data.changes || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'corrected':
        return <Edit className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      approve: 'Aprovado',
      reject: 'Rejeitado',
      corrected: 'Corrigido',
      request_correction: 'Correção Solicitada'
    }
    return labels[action] || action
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }

  // Combinar e ordenar eventos de aprovação e mudança
  const allEvents = [
    ...approvals.map(a => ({ ...a, type: 'approval' as const })),
    ...changes.map(c => ({ ...c, type: 'change' as const }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Versões</DialogTitle>
          <DialogDescription>
            Campo: <strong>{fieldLabel}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-600">Carregando histórico...</span>
          </div>
        ) : allEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum histórico disponível para este campo.
          </div>
        ) : (
          <div className="space-y-4">
            {allEvents.map((event, index) => {
              if (event.type === 'approval') {
                const approval = event as ApprovalHistoryItem & { type: 'approval' }
                return (
                  <Card key={`approval-${approval.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getActionIcon(approval.action)}</div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="outline" className="mr-2">
                                {getActionLabel(approval.action)}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                por <strong>{approval.actor.name}</strong>
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(approval.timestamp)}
                            </span>
                          </div>

                          {approval.reason && (
                            <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              <strong>Motivo:</strong> {approval.reason}
                            </div>
                          )}

                          {approval.previousValue && approval.newValue && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="p-2 bg-red-50 rounded border border-red-200">
                                <div className="text-xs text-gray-600 mb-1">Anterior</div>
                                <div className="font-mono text-sm">{approval.previousValue}</div>
                              </div>
                              <div className="p-2 bg-green-50 rounded border border-green-200">
                                <div className="text-xs text-gray-600 mb-1">Novo</div>
                                <div className="font-mono text-sm">{approval.newValue}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              } else {
                const change = event as ChangeHistoryItem & { type: 'change' }
                return (
                  <Card key={`change-${change.id}`} className="bg-gray-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <Badge variant="secondary" className="mr-2">
                                {change.changeType === 'value_changed' ? 'Valor Alterado' :
                                 change.changeType === 'status_changed' ? 'Status Alterado' :
                                 'Versão Incrementada'}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                por <strong>{change.actor.name}</strong>
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(change.timestamp)}
                            </span>
                          </div>

                          {change.oldValue && change.newValue && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="p-2 bg-white rounded border">
                                <div className="text-xs text-gray-600 mb-1">De</div>
                                <div className="font-mono text-sm">{change.oldValue}</div>
                              </div>
                              <div className="p-2 bg-white rounded border">
                                <div className="text-xs text-gray-600 mb-1">Para</div>
                                <div className="font-mono text-sm">{change.newValue}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              }
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
