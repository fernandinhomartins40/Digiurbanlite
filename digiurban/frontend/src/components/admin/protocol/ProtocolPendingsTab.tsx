'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Clock, Plus, RotateCcw, SearchCheck, XCircle } from 'lucide-react'
import { ProtocolPending, PendingStatus, PendingType } from '@/types/protocol-enhancements'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PendingCreationContext } from './protocol-pending-context'

interface ProtocolPendingsTabProps {
  protocolId: string
  pendings: ProtocolPending[]
  onRefresh: () => void
  creationContext?: PendingCreationContext | null
  pendingDialogOpen?: boolean
  onPendingDialogOpenChange?: (open: boolean) => void
}

interface ProtocolDocumentOption {
  id: string
  documentType: string
  fileName?: string | null
  status?: string
}

interface ProtocolDataFieldOption {
  id: string
  fieldKey: string
  fieldLabel: string
  fieldType?: string | null
  status?: string
}

interface PendingDraft {
  type: PendingType
  title: string
  description: string
  dueDate: string
  blocksProgress: boolean
  documentId: string
  fieldId: string
  requiresReview: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api'

function normalizeText(value?: string | null) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function buildDefaultDraft(context?: PendingCreationContext | null): PendingDraft {
  const missingDocuments = context?.validation?.missingDocuments || []
  const missingFields = context?.validation?.missingFormFields || []
  const sourceAction = context?.sourceAction || 'MANUAL'
  const stageName = context?.stageName || 'etapa atual'

  let type = PendingType.DOCUMENT
  if (sourceAction === 'REQUEST_INFO') {
    type = PendingType.INFORMATION
  } else if (missingDocuments.length === 0 && missingFields.length > 0) {
    type = PendingType.INFORMATION
  }

  const title =
    sourceAction === 'REQUEST_INFO'
      ? `Solicitar informações adicionais - ${stageName}`
      : type === PendingType.DOCUMENT
        ? `Regularizar documentos - ${stageName}`
        : missingFields.length > 0
          ? `Complementar dados - ${stageName}`
          : `Pendência da etapa - ${stageName}`

  const descriptionParts = []
  if (missingDocuments.length > 0) {
    descriptionParts.push(`Documentos faltantes: ${missingDocuments.join(', ')}`)
  }
  if (missingFields.length > 0) {
    descriptionParts.push(`Informações faltantes: ${missingFields.join(', ')}`)
  }
  if ((context?.validation?.blockers || []).length > 0) {
    descriptionParts.push(`Motivo: ${context?.validation?.blockers?.join(' | ')}`)
  }

  return {
    type,
    title,
    description: descriptionParts.join('\n') || `Pendência criada na etapa ${stageName}.`,
    dueDate: '',
    blocksProgress: true,
    documentId: '',
    fieldId: '',
    requiresReview: true,
  }
}

export function ProtocolPendingsTab({
  protocolId,
  pendings,
  onRefresh,
  creationContext,
  pendingDialogOpen,
  onPendingDialogOpenChange,
}: ProtocolPendingsTabProps) {
  const [internalDialogOpen, setInternalDialogOpen] = useState(false)
  const dialogOpen = pendingDialogOpen ?? internalDialogOpen
  const setDialogOpen = onPendingDialogOpenChange ?? setInternalDialogOpen

  const [newPending, setNewPending] = useState(() => buildDefaultDraft(creationContext))
  const [documents, setDocuments] = useState<ProtocolDocumentOption[]>([])
  const [dataFields, setDataFields] = useState<ProtocolDataFieldOption[]>([])
  const [resolvingPending, setResolvingPending] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')
  const [loadingContext, setLoadingContext] = useState(false)
  const { toast } = useToast()

  const getFullApiUrl = (path: string) => `${API_URL}${path}`

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

  useEffect(() => {
    if (!dialogOpen) return
    setNewPending((prev) => ({
      ...buildDefaultDraft(creationContext),
      dueDate: prev.dueDate || '',
    }))
  }, [dialogOpen, creationContext])

  useEffect(() => {
    if (!dialogOpen) return

    const loadContext = async () => {
      try {
        setLoadingContext(true)
        const [documentsResponse, fieldsResponse] = await Promise.all([
          fetch(getFullApiUrl(`/protocols/${protocolId}/documents`), { credentials: 'include' }),
          fetch(getFullApiUrl(`/protocols/${protocolId}/data-fields`), { credentials: 'include' }),
        ])

        const documentsPayload = documentsResponse.ok ? await documentsResponse.json() : null
        const fieldsPayload = fieldsResponse.ok ? await fieldsResponse.json() : null

        const nextDocuments = Array.isArray(documentsPayload?.documents) ? documentsPayload.documents : []
        const nextFields = Array.isArray(fieldsPayload?.data?.fields) ? fieldsPayload.data.fields : []

        setDocuments(nextDocuments)
        setDataFields(nextFields)
      } catch (error) {
        console.error('Erro ao carregar contexto de pendências:', error)
        toast({
          title: 'Erro ao carregar contexto',
          description: 'Não foi possível carregar documentos e dados do protocolo.',
          variant: 'destructive',
        })
      } finally {
        setLoadingContext(false)
      }
    }

    loadContext()
  }, [dialogOpen, protocolId, toast])

  useEffect(() => {
    if (!dialogOpen) return

    setNewPending((prev) => {
      if (prev.documentId || prev.fieldId) return prev

      const missingDocuments = creationContext?.validation?.missingDocuments || []
      const missingFields = creationContext?.validation?.missingFormFields || []

      const matchedDocument =
        prev.type === PendingType.DOCUMENT
          ? documents.find((document) => missingDocuments.some((item) => normalizeText(item) === normalizeText(document.documentType)))
          : undefined

      const matchedField =
        [PendingType.INFORMATION, PendingType.CORRECTION, PendingType.VALIDATION].includes(prev.type)
          ? dataFields.find((field) =>
              missingFields.some((item) => normalizeText(item) === normalizeText(field.fieldLabel) || normalizeText(item) === normalizeText(field.fieldKey))
            )
          : undefined

      if (!matchedDocument && !matchedField) return prev

      return {
        ...prev,
        documentId: matchedDocument?.id || prev.documentId,
        fieldId: matchedField?.id || prev.fieldId,
      }
    })
  }, [dialogOpen, creationContext, documents, dataFields])

  const getStatusBadge = (status: PendingStatus) => {
    const config = {
      [PendingStatus.OPEN]: { icon: AlertCircle, label: 'Aberta', className: 'bg-red-100 text-red-700' },
      [PendingStatus.IN_PROGRESS]: { icon: Clock, label: 'Em resolução', className: 'bg-yellow-100 text-yellow-700' },
      [PendingStatus.UNDER_REVIEW]: { icon: SearchCheck, label: 'Em análise', className: 'bg-blue-100 text-blue-700' },
      [PendingStatus.RESOLVED]: { icon: CheckCircle2, label: 'Resolvida', className: 'bg-green-100 text-green-700' },
      [PendingStatus.EXPIRED]: { icon: XCircle, label: 'Expirada', className: 'bg-gray-100 text-gray-700' },
      [PendingStatus.CANCELLED]: { icon: XCircle, label: 'Cancelada', className: 'bg-gray-100 text-gray-700' },
    }
    const Icon = config[status].icon
    return (
      <Badge variant="outline" className={config[status].className}>
        <Icon className="mr-1 h-3 w-3" />
        {config[status].label}
      </Badge>
    )
  }

  const resetForm = () => {
    setNewPending(buildDefaultDraft(creationContext))
  }

  const buildPendingPayload = () => {
    const selectedDocument = documents.find((doc) => doc.id === newPending.documentId)
    const selectedField = dataFields.find((field) => field.id === newPending.fieldId)
    const payload: Record<string, any> = {
      type: newPending.type,
      title: newPending.title.trim(),
      description: newPending.description.trim(),
      dueDate: newPending.dueDate ? new Date(newPending.dueDate).toISOString() : undefined,
      blocksProgress: newPending.blocksProgress,
      stageId: creationContext?.stageId,
      requiresReview: newPending.requiresReview,
    }

    const baseMetadata: Record<string, any> = {
      requiresCitizenAction: true,
      stageName: creationContext?.stageName,
      sourceAction: creationContext?.sourceAction || 'MANUAL',
    }

    if (newPending.type === PendingType.DOCUMENT && selectedDocument) {
      payload.sourceType = 'DOCUMENT'
      payload.sourceEntityType = 'DOCUMENT'
      payload.sourceEntityId = selectedDocument.id
      payload.dedupeKey = `${protocolId}:${creationContext?.stageId || 'no-stage'}:DOCUMENT:${selectedDocument.id}`
      payload.metadata = {
        ...baseMetadata,
        documentId: selectedDocument.id,
        documentType: selectedDocument.documentType,
        documentLabel: selectedDocument.documentType,
      }
    } else if ([PendingType.INFORMATION, PendingType.CORRECTION, PendingType.VALIDATION].includes(newPending.type) && selectedField) {
      payload.sourceType = 'DATA_FIELD'
      payload.sourceEntityType = 'DATA_FIELD'
      payload.sourceEntityId = selectedField.id
      payload.dedupeKey = `${protocolId}:${creationContext?.stageId || 'no-stage'}:${newPending.type}:${selectedField.id}`
      payload.metadata = {
        ...baseMetadata,
        fieldId: selectedField.id,
        fieldKey: selectedField.fieldKey,
        fieldLabel: selectedField.fieldLabel,
        fieldType: selectedField.fieldType || 'text',
        fields: [
          {
            id: selectedField.id,
            key: selectedField.fieldKey,
            label: selectedField.fieldLabel,
            type: selectedField.fieldType || 'text',
            required: true,
            description: newPending.description.trim(),
          },
        ],
      }
    } else {
      payload.metadata = baseMetadata
      payload.sourceType = creationContext?.sourceAction || 'MANUAL'
    }

    return payload
  }

  const handleCreate = async () => {
    if (!newPending.title.trim() || !newPending.description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o título e a descrição da pendência.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(getFullApiUrl(`/protocols/${protocolId}/pendings`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPendingPayload()),
      })

      const payload = await response.json()
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || 'Erro ao criar pendência')
      }

      toast({
        title: 'Pendência criada',
        description: 'A pendência foi criada com sucesso.',
      })
      setDialogOpen(false)
      resetForm()
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar pendência',
        variant: 'destructive',
      })
    }
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h5 className="font-medium">{pending.title}</h5>
              {getStatusBadge(pending.status)}
              {pending.blocksProgress && (
                <Badge variant="destructive" className="text-xs">Bloqueia progresso</Badge>
              )}
              {pending.stageId && (
                <Badge variant="outline" className="text-xs">
                  Etapa vinculada
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{pending.description}</p>

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

          <div className="ml-4 flex min-w-[260px] flex-col gap-2">
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
              <div className="flex flex-wrap gap-2">
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

  const canSelectDocument = newPending.type === PendingType.DOCUMENT
  const canSelectField = [PendingType.INFORMATION, PendingType.CORRECTION, PendingType.VALIDATION].includes(newPending.type)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5" />
            Pendências ({openPendings.length} ativas)
          </h3>
          {creationContext?.stageName && (
            <p className="text-sm text-muted-foreground">
              Criando pendência a partir da etapa: <span className="font-medium text-foreground">{creationContext.stageName}</span>
            </p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pendência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Pendência</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={newPending.type}
                    onValueChange={(value) => setNewPending((prev) => ({ ...prev, type: value as PendingType, documentId: '', fieldId: '' }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PendingType.DOCUMENT}>Documento</SelectItem>
                      <SelectItem value={PendingType.INFORMATION}>Informação</SelectItem>
                      <SelectItem value={PendingType.CORRECTION}>Correção</SelectItem>
                      <SelectItem value={PendingType.VALIDATION}>Validação</SelectItem>
                      <SelectItem value={PendingType.PAYMENT}>Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prazo</Label>
                  <Input type="date" value={newPending.dueDate} onChange={(e) => setNewPending((prev) => ({ ...prev, dueDate: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label>Título</Label>
                <Input value={newPending.title} onChange={(e) => setNewPending((prev) => ({ ...prev, title: e.target.value }))} />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea value={newPending.description} onChange={(e) => setNewPending((prev) => ({ ...prev, description: e.target.value }))} rows={4} />
              </div>

              {canSelectDocument && (
                <div>
                  <Label>Documento relacionado</Label>
                  <Select value={newPending.documentId || 'none'} onValueChange={(value) => setNewPending((prev) => ({ ...prev, documentId: value === 'none' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingContext ? 'Carregando documentos...' : 'Selecione um documento do protocolo'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem vínculo específico</SelectItem>
                      {documents.map((document) => (
                        <SelectItem key={document.id} value={document.id}>
                          {document.documentType}{document.fileName ? ` • ${document.fileName}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {canSelectField && (
                <div>
                  <Label>Campo relacionado</Label>
                  <Select value={newPending.fieldId || 'none'} onValueChange={(value) => setNewPending((prev) => ({ ...prev, fieldId: value === 'none' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingContext ? 'Carregando campos...' : 'Selecione um campo do protocolo'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem vínculo específico</SelectItem>
                      {dataFields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.fieldLabel}{field.fieldKey ? ` • ${field.fieldKey}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Bloquear avanço do protocolo</p>
                    <p className="text-xs text-muted-foreground">Use quando a pendência impedir a etapa de continuar.</p>
                  </div>
                  <Button
                    type="button"
                    variant={newPending.blocksProgress ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewPending((prev) => ({ ...prev, blocksProgress: !prev.blocksProgress }))}
                  >
                    {newPending.blocksProgress ? 'Bloqueando' : 'Sem bloqueio'}
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Exigir revisão da equipe</p>
                    <p className="text-xs text-muted-foreground">A resposta do cidadão ficará em análise antes da baixa final.</p>
                  </div>
                  <Button
                    type="button"
                    variant={newPending.requiresReview ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewPending((prev) => ({ ...prev, requiresReview: !prev.requiresReview }))}
                  >
                    {newPending.requiresReview ? 'Com revisão' : 'Sem revisão'}
                  </Button>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full">
                Criar Pendência
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
