'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, Clock, FileText, Plus, RotateCcw, SearchCheck, XCircle } from 'lucide-react'
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
  // Uma ação aberta por vez, com o texto escrito no próprio cartão
  // (antes cancelar e reabrir usavam a caixinha do navegador)
  const [action, setAction] = useState<{ pendingId: string; kind: 'resolve' | 'cancel' | 'reopen' } | null>(null)
  const [actionText, setActionText] = useState('')
  const [sending, setSending] = useState(false)

  const openAction = (pendingId: string, kind: 'resolve' | 'cancel' | 'reopen') => {
    setAction({ pendingId, kind })
    setActionText('')
  }
  const closeAction = () => {
    setAction(null)
    setActionText('')
  }

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

  const sendAction = async (
    pendingId: string,
    kind: 'resolve' | 'cancel' | 'reopen',
    text: string
  ) => {
    const endpoint = kind === 'resolve' ? 'resolve' : kind === 'cancel' ? 'cancel' : 'reopen'
    const body = kind === 'resolve' ? { resolution: text } : { reason: text }

    setSending(true)
    try {
      const response = await fetch(getFullApiUrl(`/protocols/${protocolId}/pendings/${pendingId}/${endpoint}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || 'Não foi possível concluir a ação.')
      }

      toast({
        title:
          kind === 'resolve' ? 'Pendência resolvida'
          : kind === 'cancel' ? 'Pendência cancelada'
          : 'Novo ajuste pedido',
        description:
          kind === 'resolve' ? 'A pendência foi concluída e o protocolo pode seguir.'
          : kind === 'cancel' ? 'A pendência foi cancelada e o protocolo voltou a andar.'
          : 'O cidadão foi avisado para enviar um novo ajuste.',
      })
      closeAction()
      onRefresh()
    } catch (error) {
      toast({
        title: 'Não deu certo',
        description: error instanceof Error ? error.message : 'Não foi possível concluir a ação.',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  const confirmAction = (pending: ProtocolPending) => {
    if (!action) return
    const text = actionText.trim()
    if (!text) {
      toast({
        title: action.kind === 'resolve' ? 'Escreva o parecer' : 'Escreva o motivo',
        description: action.kind === 'resolve'
          ? 'Conte em poucas palavras como a pendência foi resolvida.'
          : 'O cidadão vai ver esse motivo.',
        variant: 'destructive',
      })
      return
    }
    sendAction(pending.id, action.kind, text)
  }

  // Arquivos que o cidadão mandou como resposta (para analisar sem trocar de aba)
  const getSubmittedDocuments = (pending: ProtocolPending) => {
    const metadata = ((pending as any).metadata || {}) as Record<string, any>
    const items = Array.isArray(metadata.submittedDocuments) ? metadata.submittedDocuments : []
    return items.filter((item: any) => item && typeof item.id === 'string') as Array<{
      id: string
      documentType?: string
      fileName?: string
    }>
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

            {mode === 'review' && getSubmittedDocuments(pending).length > 0 && (
              <div className="rounded-md border bg-white/80 p-3 text-sm">
                <p className="font-medium text-foreground">Arquivos enviados pelo cidadão</p>
                <ul className="mt-2 space-y-1">
                  {getSubmittedDocuments(pending).map((document) => (
                    <li key={document.id}>
                      <a
                        href={getFullApiUrl(`/protocols/${protocolId}/documents/${document.id}/download?inline=true`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-700 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {document.documentType || document.fileName || 'Documento'}
                      </a>
                    </li>
                  ))}
                </ul>
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
            {action?.pendingId === pending.id ? (
              <>
                <p className="text-sm font-medium">
                  {action.kind === 'resolve'
                    ? mode === 'review'
                      ? getSubmittedDocuments(pending).length > 0
                        ? 'Aprovar a resposta (os arquivos enviados serão aprovados)'
                        : 'Aprovar a resposta'
                      : 'Resolver pendência'
                    : action.kind === 'cancel'
                      ? 'Cancelar pendência'
                      : 'Pedir novo ajuste ao cidadão'}
                </p>
                <Textarea
                  autoFocus
                  placeholder={
                    action.kind === 'resolve'
                      ? 'Escreva o parecer...'
                      : action.kind === 'cancel'
                        ? 'Por que a pendência não é mais necessária?'
                        : 'O que o cidadão precisa corrigir ou enviar de novo?'
                  }
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={sending} onClick={() => confirmAction(pending)}>
                    {sending ? 'Enviando...' : 'Confirmar'}
                  </Button>
                  <Button size="sm" variant="outline" disabled={sending} onClick={closeAction}>Voltar</Button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {(mode === 'open' || mode === 'review') && (
                  <Button size="sm" variant="outline" onClick={() => openAction(pending.id, 'resolve')}>
                    {mode === 'review' ? 'Aprovar resposta' : 'Resolver'}
                  </Button>
                )}
                {mode === 'review' && (
                  <Button size="sm" variant="outline" onClick={() => openAction(pending.id, 'reopen')}>
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Pedir novo ajuste
                  </Button>
                )}
                {(mode === 'open' || mode === 'review') && (
                  <Button size="sm" variant="ghost" onClick={() => openAction(pending.id, 'cancel')}>
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
            Pendências ({openPendings.length + underReviewPendings.length} ativas)
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