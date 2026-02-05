'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { getRelationshipLabel, getRelationshipEmoji } from '@/shared/constants/family.constants'

interface FamilyInvite {
  id: string
  email: string
  name?: string
  relationship: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'
  createdAt: string
  expiresAt: string
  message?: string
}

interface FamilyInvitesListProps {
  invites: FamilyInvite[]
  onUpdate: () => void
  apiRequest: (url: string, options?: any) => Promise<any>
}

export function FamilyInvitesList({
  invites,
  onUpdate,
  apiRequest
}: FamilyInvitesListProps) {
  const { toast } = useToast()
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState<FamilyInvite | null>(null)

  // Formatar data
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Calcular dias restantes
  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  // Verificar se expirou
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  // Status badge
  const getStatusBadge = (status: string, expiresAt: string) => {
    const expired = isExpired(expiresAt)

    if (expired && status === 'PENDING') {
      return (
        <Badge variant="secondary" className="bg-gray-200 text-gray-700">
          <Clock className="h-3 w-3 mr-1" />
          Expirado
        </Badge>
      )
    }

    const statusConfig: Record<string, { label: string; variant: any; icon: any; className?: string }> = {
      PENDING: {
        label: 'Pendente',
        variant: 'secondary',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800'
      },
      ACCEPTED: {
        label: 'Aceito',
        variant: 'default',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800'
      },
      REJECTED: {
        label: 'Rejeitado',
        variant: 'destructive',
        icon: XCircle,
        className: 'bg-red-100 text-red-800'
      },
      EXPIRED: {
        label: 'Expirado',
        variant: 'secondary',
        icon: AlertCircle,
        className: 'bg-gray-200 text-gray-700'
      },
      CANCELLED: {
        label: 'Cancelado',
        variant: 'secondary',
        icon: XCircle,
        className: 'bg-gray-200 text-gray-700'
      }
    }

    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  // Abrir dialog de cancelamento
  const openCancelDialog = (invite: FamilyInvite) => {
    setSelectedInvite(invite)
    setShowCancelDialog(true)
  }

  // Cancelar convite
  const handleCancelInvite = async () => {
    if (!selectedInvite) return

    try {
      setCancelling(selectedInvite.id)
      const response = await apiRequest(`/citizen/family/invites/${selectedInvite.id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        toast({
          title: 'Convite cancelado',
          description: 'O convite foi cancelado com sucesso'
        })
        setShowCancelDialog(false)
        setSelectedInvite(null)
        onUpdate()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível cancelar o convite'
      })
    } finally {
      setCancelling(null)
    }
  }

  if (invites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convites Enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum convite enviado ainda</p>
            <p className="text-sm text-gray-400 mt-1">
              Use o botão "Convidar por Email" para enviar convites
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Convites Enviados
            </CardTitle>
            <Badge variant="secondary">
              {invites.length} {invites.length === 1 ? 'convite' : 'convites'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {invites.map((invite) => {
            const daysRemaining = getDaysRemaining(invite.expiresAt)
            const isPending = invite.status === 'PENDING' && !isExpired(invite.expiresAt)

            return (
              <div
                key={invite.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {invite.name || invite.email}
                        </p>
                        {invite.name && (
                          <p className="text-sm text-gray-500">{invite.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="text-lg">{getRelationshipEmoji(invite.relationship)}</span>
                      <span>
                        Relacionamento: <strong>{getRelationshipLabel(invite.relationship)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Enviado em {formatDate(invite.createdAt)}</span>
                      {isPending && daysRemaining > 0 && (
                        <span className={daysRemaining <= 3 ? 'text-orange-600 font-medium' : ''}>
                          Expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                        </span>
                      )}
                    </div>

                    {invite.message && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600 italic">
                        "{invite.message}"
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(invite.status, invite.expiresAt)}

                    {isPending && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openCancelDialog(invite)}
                        disabled={cancelling !== null}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Dialog de Cancelamento */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Cancelar Convite
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja cancelar o convite enviado para{' '}
              <strong>{selectedInvite?.name || selectedInvite?.email}</strong>?
            </p>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Esta ação não poderá ser desfeita. O link do convite ficará inválido.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false)
                setSelectedInvite(null)
              }}
              disabled={cancelling !== null}
            >
              Não, manter convite
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelInvite}
              disabled={cancelling !== null}
            >
              {cancelling === selectedInvite?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sim, cancelar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
