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
import { AlertCircle, CheckCircle2, Clock, XCircle, Plus } from 'lucide-react'
import { ProtocolPending, PendingStatus, PendingType } from '@/types/protocol-enhancements'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProtocolPendingsTabProps {
  protocolId: string
  pendings: ProtocolPending[]
  onRefresh: () => void
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api'

export function ProtocolPendingsTab({ protocolId, pendings, onRefresh }: ProtocolPendingsTabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPending, setNewPending] = useState({
    type: PendingType.DOCUMENT,
    title: '',
    description: '',
    dueDate: '',
    blocksProgress: true,
    documentId: '',
    fieldId: '',
  })
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
  const closedPendings = useMemo(
    () => pendings.filter((pending) => ![PendingStatus.OPEN, PendingStatus.IN_PROGRESS].includes(pending.status)),
    [pendings]
  )

  useEffect(() => {
    if (!isOpen) return

    const loadContext = async () => {
      try {
        setLoadingContext(true)
        const [documentsResponse, fieldsResponse] = await Promise.all([
          fetch(getFullApiUrl(`/protocols/${protocolId}/documents`), { credentials: 'include' }),
          fetch(getFullApiUrl(`/protocols/${protocolId}/data-fields`), { credentials: 'include' }),
        ])

        const documentsPayload = documentsResponse.ok ? await documentsResponse.json() : null
        const fieldsPayload = fieldsResponse.ok ? await fieldsResponse.json() : null

        setDocuments(Array.isArray(documentsPayload?.documents) ? documentsPayload.documents : [])
        setDataFields(Array.isArray(fieldsPayload?.data?.fields) ? fieldsPayload.data.fields : [])
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
  }, [isOpen, protocolId, toast])

  const getStatusBadge = (status: PendingStatus) => {
    const config = {
      [PendingStatus.OPEN]: { icon: AlertCircle, label: 'Aberta', className: 'bg-red-100 text-red-700' },
      [PendingStatus.IN_PROGRESS]: { icon: Clock, label: 'Em resolução', className: 'bg-yellow-100 text-yellow-700' },
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
    setNewPending({
      type: PendingType.DOCUMENT,
      title: '',
      description: '',
      dueDate: '',
      blocksProgress: true,
      documentId: '',
      fieldId: '',
    })
  }

  const buildPendingPayload = () => {
    const payload: Record<string, any> = {
      type: newPending.type,
      title: newPending.title.trim(),
      description: newPending.description.trim(),
      dueDate: newPending.dueDate ? new Date(newPending.dueDate).toISOString() : undefined,
      blocksProgress: newPending.blocksProgress,
    }

    if (newPending.type === PendingType.DOCUMENT && newPending.documentId) {
      const selectedDocument = documents.find((doc) => doc.id === newPending.documentId)
      payload.metadata = {
        documentId: selectedDocument?.id,
        documentType: selectedDocument?.documentType,
        documentLabel: selectedDocument?.documentType,
        requiresCitizenAction: true,
      }
    }

    if ([PendingType.INFORMATION, PendingType.CORRECTION, PendingType.VALIDATION].includes(newPending.type) && newPending.fieldId) {
      const selectedField = dataFields.find((field) => field.id === newPending.fieldId)
      if (selectedField) {
        payload.metadata = {
          fieldId: selectedField.id,
          fieldKey: selectedField.fieldKey,
          fieldLabel: selectedField.fieldLabel,
          fieldType: selectedField.fieldType || 'text',
          requiresCitizenAction: true,
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
      }
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
      setIsOpen(false)
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
        description: 'Descreva como a pendência foi resolvida.',
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
        description: 'A pendência foi resolvida com sucesso.',
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <AlertCircle className="h-5 w-5" />
          Pendências ({openPendings.length} ativas)
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
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
                  <Select value={newPending.type} onValueChange={(value) => setNewPending((prev) => ({ ...prev, type: value as PendingType, documentId: '', fieldId: '' }))}>
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

              {newPending.type === PendingType.DOCUMENT && (
                <div>
                  <Label>Documento relacionado</Label>
                  <Select value={newPending.documentId} onValueChange={(value) => setNewPending((prev) => ({ ...prev, documentId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingContext ? 'Carregando documentos...' : 'Selecione um documento do protocolo'} />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.map((document) => (
                        <SelectItem key={document.id} value={document.id}>
                          {document.documentType}{document.fileName ? ` • ${document.fileName}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {[PendingType.INFORMATION, PendingType.CORRECTION, PendingType.VALIDATION].includes(newPending.type) && (
                <div>
                  <Label>Campo relacionado</Label>
                  <Select value={newPending.fieldId} onValueChange={(value) => setNewPending((prev) => ({ ...prev, fieldId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingContext ? 'Carregando campos...' : 'Selecione um campo do protocolo'} />
                    </SelectTrigger>
                    <SelectContent>
                      {dataFields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.fieldLabel}{field.fieldKey ? ` • ${field.fieldKey}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

              <Button onClick={handleCreate} className="w-full">
                Criar Pendência
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {openPendings.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium">Ativas</h4>
          <div className="space-y-3">
            {openPendings.map((pending) => (
              <Card key={pending.id} className={pending.blocksProgress ? 'border-red-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h5 className="font-medium">{pending.title}</h5>
                        {getStatusBadge(pending.status)}
                        {pending.blocksProgress && (
                          <Badge variant="destructive" className="text-xs">Bloqueia progresso</Badge>
                        )}
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">{pending.description}</p>
                      {pending.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Prazo: {format(new Date(pending.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex min-w-[280px] flex-col gap-2">
                      {resolvingPending === pending.id ? (
                        <>
                          <Textarea
                            placeholder="Descreva como a pendência foi resolvida..."
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
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setResolvingPending(pending.id)}>Resolver</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCancelPending(pending.id)}>Cancelar</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {closedPendings.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium">Histórico ({closedPendings.length})</h4>
          <div className="space-y-2">
            {closedPendings.map((pending) => (
              <Card key={pending.id} className="opacity-70">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{pending.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {pending.resolvedAt ? format(new Date(pending.resolvedAt), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
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
