'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Clock, CheckCircle, XCircle, User, Loader2 } from 'lucide-react'
import { getRelationshipLabel, getRelationshipEmoji } from '@/shared/constants/family.constants'

interface PendingLink {
  id: string
  relationship: string
  head: {
    id: string
    name: string
    cpf: string
  }
}

interface PendingLinksSectionProps {
  pendingLinks: PendingLink[]
  onUpdate: () => void
  apiRequest: (url: string, options?: any) => Promise<any>
}

export function PendingLinksSection({
  pendingLinks,
  onUpdate,
  apiRequest
}: PendingLinksSectionProps) {
  const { toast } = useToast()
  const [processing, setProcessing] = useState<string | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedLink, setSelectedLink] = useState<PendingLink | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Confirmar vínculo
  const handleConfirm = async (linkId: string) => {
    try {
      setProcessing(linkId)
      const response = await apiRequest(`/citizen/family/links/${linkId}/confirm`, {
        method: 'POST'
      })

      if (response.success) {
        toast({
          title: 'Vínculo confirmado',
          description: 'O vínculo familiar foi confirmado com sucesso'
        })
        onUpdate()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível confirmar o vínculo'
      })
    } finally {
      setProcessing(null)
    }
  }

  // Abrir dialog de rejeição
  const openRejectDialog = (link: PendingLink) => {
    setSelectedLink(link)
    setShowRejectDialog(true)
    setRejectReason('')
  }

  // Rejeitar vínculo
  const handleReject = async () => {
    if (!selectedLink) return

    try {
      setProcessing(selectedLink.id)
      const response = await apiRequest(`/citizen/family/links/${selectedLink.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          reason: rejectReason || 'Não especificado'
        })
      })

      if (response.success) {
        toast({
          title: 'Vínculo rejeitado',
          description: 'O vínculo familiar foi rejeitado'
        })
        setShowRejectDialog(false)
        setSelectedLink(null)
        onUpdate()
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível rejeitar o vínculo'
      })
    } finally {
      setProcessing(null)
    }
  }

  if (pendingLinks.length === 0) {
    return null
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Vínculos Pendentes
            </CardTitle>
            <Badge variant="secondary" className="bg-orange-200 text-orange-800">
              {pendingLinks.length} {pendingLinks.length === 1 ? 'pendente' : 'pendentes'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-orange-800 mb-4">
            Você foi adicionado como membro da família das pessoas abaixo.
            Confirme ou rejeite os vínculos familiares.
          </p>

          {pendingLinks.map((link) => (
            <div
              key={link.id}
              className="p-4 bg-white border border-orange-200 rounded-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{link?.head?.name || 'Nome não disponível'}</p>
                      <p className="text-sm text-gray-500">CPF: {link?.head?.cpf || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg">{getRelationshipEmoji(link.relationship)}</span>
                    <span className="text-sm text-gray-600">
                      Você será cadastrado(a) como: <strong>{getRelationshipLabel(link.relationship)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(link.id)}
                    disabled={processing !== null}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === link.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirmar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRejectDialog(link)}
                    disabled={processing !== null}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rejeitar Vínculo Familiar
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Você está prestes a rejeitar o vínculo familiar com{' '}
              <strong>{selectedLink?.head.name}</strong>.
            </p>

            <div>
              <Label htmlFor="rejectReason">
                Motivo da Rejeição (Opcional)
              </Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                className="mt-1 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectReason.length}/500 caracteres
              </p>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Esta ação não poderá ser desfeita. O responsável pela família será notificado.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setSelectedLink(null)
                setRejectReason('')
              }}
              disabled={processing !== null}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing !== null}
            >
              {processing === selectedLink?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar Vínculo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
