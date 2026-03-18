'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, Clock, Plus, RotateCcw, SearchCheck, XCircle } from 'lucide-react'
import { ProtocolPending, PendingStatus } from '@/types/protocol-enhancements'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { buildPendingCreationHref, PendingCreationContext } from './protocol-pending-context'

interface ProtocolPendingsTabProps {
  protocolId: string
  pendings: ProtocolPending[]
  onRefresh: () => void
  creationContext?: PendingCreationContext | null
  service?: any
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api'

export function ProtocolPendingsTab({
  protocolId,
  pendings,
  onRefresh,
  creationContext,
}: ProtocolPendingsTabProps) {
  const { toast } = useToast()
  const [resolvingPending, setResolvingPending] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  const openPendings = useMemo(
    () => pendings.filter((pending) => pending.status === PendingStatus.OPEN || pending.status === PendingStatus.IN_PROGRESS),
    [pendings]
  )
  const underReviewPendings = useMemo(
    () => pendings.filter((pending) => pending.status === PendingStatus.UNDER_REVIEW),
    [pendings]
  )
  const closedPendings = useMemo(
    () => pendings.filter((pending) => ![PendingStatus.OPEN, PendingStatus.IN_PROGRESS, PendingStatus.UNDER_REVIEW].includes(pending.status)),
    [pendings]
  )

  const getFullApiUrl = (path: string) => `${API_URL}${path}`

  const getStatusBadge = (status: PendingStatus) => {
    const config = {
      [PendingStatus.OPEN]: { icon: AlertCircle, label: 'Aberta', className: 'bg-red-100 text-red-700' },
      [PendingStatus.IN_PROGRESS]: { icon: Clock, label: 'Em resolução', className: 'bg-yellow-100 text-yellow-700' },
      [PendingStatus.UNDER_REVIEW]: { icon: SearchCheck, label: 'Em análise', className: 'bg-blue-100 text-blue-700' },
      [PendingStatus.RESOLVED]: { icon: CheckCircle2, label: 'Resolvida', className: 'bg-green-100 text-green-700' },
      [PendingStatus.EXPIRED]: { icon: XCircle, label: 'Expirada', className: 'bg-gray-100 text-gray-700' },
      [PendingStatus.CANCELLED]: { icon: XCircle, label: 'Cancelada', className: 'bg-gray-100 text-gray-700' },
    }

    const selected = config[status]
    const Icon = selected.icon

    return (
      <Badge variant="outline" className={selected.className}>
        <Icon className="mr-1 h-3 w-3" />
        {selected.label}
      </Badge>
    )
  }

  const handleResolvePending = async (pendingId: string) => {
    if (!resolution.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Descreva o parecer ou a resolução final.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(getFullApiUrl(`/protocols/${protocolId}/pendings/${pendingId}/resolve`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      })
      const payload = await response.json()

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || 'Erro ao resolver pendência')
      }

      toast({
        title: 'Pendência resolvida',
        description: 'A pendência foi concluída e o protocolo pode seguir.',
      })
      setResolvingPending(null)
      setResolution('')
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao resolver pendência',
        description: error instanceof Error ? error.message : 'Não foi possível resolver a pendência.',
        variant: 'destructive',
      })
    }
  }

  const handleCancelPending = async (pendingId: string) => {
    const reason = window.prompt('Informe o motivo do cancelamento da pendência:')?.trim()
    if (!reason) return

    try {
      const response = await fetch(getFullApiUrl(`/protocols/${protocolId}/pendings/${pendingId}/cancel`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const payload = await response.json()

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || 'Erro ao cancelar pendência')
      }

      toast({
        title: 'Pendência cancelada',
        description: 'A pendência foi cancelada com sucesso.',
      })
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao cancelar pendência',
        description: error instanceof Error ? error.message : 'Não foi possível cancelar a pendência.',
        variant: 'destructive',
      })
    }
  }

  const handleReopenPending = async (pendingId: string) => {
    const reason = window.prompt('Informe o motivo para solicitar um novo ajuste ao cidadão:')?.trim()
    if (!reason) return

    try {
      const response = await fetch(getFullApiUrl(`/protocols/${protocolId}/pendings/${pendingId}/reopen`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const payload = await response.json()

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || 'Erro ao reabrir pendência')
      }

      toast({
        title: 'Pendência reaberta',
        description: 'O cidadão foi notificado para enviar um novo ajuste.',
      })
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao reabrir pendência',
        description: error instanceof Error ? error.message : 'Não foi possível reabrir a pendência.',
        variant: 'destructive',
      })
    }
  }

  const renderPendingCard = (pending: ProtocolPending, mode: 'open' | 'review' | 'closed') => (
    <Card
      key={pending.id}
      className={
        mode === 'review'
          ? 'border-blue-200 bg-blue-50/40'
          : pending.blocksProgress
            ? 'border-red-200'
            : ''
      }
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h5 className="font-medium">{pending.title}</h5>
              {getStatusBadge(pending.status)}
              {pending.blocksProgress && (
                <Badge variant="destructive" className="text-xs">Bloqueia progresso</Badge>
              )}
              {pending.stageId && (
                <Badge variant="outline" className="text-xs">Etapa vinculada</Badge>
              )}
            </div>

            <p className="whitespace-pre-line text-sm text-muted-foreground">{pending.description}</p>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {pending.dueDate && (
                <span>Prazo: {format(new Date(pending.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
              )}
              {pending.submittedAt && (
                <span>Resposta enviada em {format(new Date(pending.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              )}
              {pending.reviewedAt && (
                <span>Última revisão em {format(new Date(pending.reviewedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              )}
            </div>

            {pending.resolution && (
              <div className="rounded-md border bg-white/80 p-3 text-sm">
                <p className="font-medium text-foreground">Última resposta registrada</p>
                <p className="mt-1 whitespace-pre-line text-muted-foreground">{pending.resolution}</p>
              </div>
            )}

            {pending.reviewNotes && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-medium text-amber-900">Observação da análise</p>
                <p className="mt-1 whitespace-pre-line text-amber-800">{pending.reviewNotes}</p>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 xl:ml-4 xl:max-w-xs">
            {resolvingPending === pending.id ? (
              <>
                <Textarea
                  placeholder={mode === 'review' ? 'Informe o parecer da análise...' : 'Descreva como a pendência foi resolvida...'}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleResolvePending(pending.id)}>Confirmar</Button>
                  <Button size="sm" variant="outline" onClick={() => { setResolvingPending(null); setResolution('') }}>Fechar</Button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {(mode === 'open' || mode === 'review') && (
                  <Button size="sm" variant="outline" onClick={() => setResolvingPending(pending.id)}>
                    {mode === 'review' ? 'Concluir análise' : 'Resolver'}
                  </Button>
                )}
                {mode === 'review' && (
                  <Button size="sm" variant="outline" onClick={() => handleReopenPending(pending.id)}>
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Reabrir
                  </Button>
                )}
                {mode === 'open' && (
                  <Button size="sm" variant="ghost" onClick={() => handleCancelPending(pending.id)}>
                    Cancelar
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5" />
            Pendências ({openPendings.length} ativas)
          </h3>
          {creationContext?.stageName && (
            <p className="text-sm text-muted-foreground">
              Nova pendência será criada para a etapa: <span className="font-medium text-foreground">{creationContext.stageName}</span>
            </p>
          )}
        </div>

        <Button asChild size="sm">
          <Link href={buildPendingCreationHref(protocolId, creationContext)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova pendência
          </Link>
        </Button>
      </div>

      {openPendings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Abertas e em resolução</h4>
          {openPendings.map((pending) => renderPendingCard(pending, 'open'))}
        </div>
      )}

      {underReviewPendings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Aguardando análise da equipe</h4>
          {underReviewPendings.map((pending) => renderPendingCard(pending, 'review'))}
        </div>
      )}

      {closedPendings.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium">Histórico ({closedPendings.length})</h4>
          <div className="space-y-2">
            {closedPendings.map((pending) => renderPendingCard(pending, 'closed'))}
          </div>
        </div>
      )}

      {pendings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-green-500 opacity-50" />
            <p>Nenhuma pendência registrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}