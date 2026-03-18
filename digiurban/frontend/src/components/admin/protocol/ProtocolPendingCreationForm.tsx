'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { getFullApiUrl } from '@/lib/api-config'
import { normalizeRequiredDocuments } from '@/lib/normalize-documents'
import { extractFieldsFromSchema } from '@/lib/schema-field-extractor'
import { PendingType } from '@/types/protocol-enhancements'
import { PendingCreationContext } from './protocol-pending-context'

interface ProtocolDocumentOption {
  key: string
  id?: string
  documentType: string
  label: string
  fileName?: string | null
  status?: string
  required: boolean
  source: 'protocol' | 'service'
  suggested?: boolean
}

interface ProtocolDataFieldOption {
  key: string
  id?: string
  fieldKey: string
  fieldLabel: string
  fieldType?: string | null
  status?: string
  required: boolean
  source: 'protocol' | 'service'
  suggested?: boolean
  description?: string
  placeholder?: string
  options?: string[]
}

interface PendingDraft {
  type: PendingType
  title: string
  description: string
  dueDate: string
  blocksProgress: boolean
  documentKeys: string[]
  fieldKeys: string[]
  requiresReview: boolean
}

interface ProtocolPendingCreationFormProps {
  protocolId: string
  service?: any
  creationContext?: PendingCreationContext | null
  onCreated?: () => void
  onCancel?: () => void
}

function normalizeText(value?: string | null) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function parseJsonIfString<T = any>(value: unknown): T | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  if (typeof value === 'object') {
    return value as T
  }
  return null
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
  if (missingDocuments.length > 0) descriptionParts.push(`Documentos faltantes: ${missingDocuments.join(', ')}`)
  if (missingFields.length > 0) descriptionParts.push(`Informações faltantes: ${missingFields.join(', ')}`)
  if ((context?.validation?.blockers || []).length > 0) descriptionParts.push(`Motivo: ${context?.validation?.blockers?.join(' | ')}`)

  return {
    type,
    title,
    description: descriptionParts.join('\n') || `Pendência criada na etapa ${stageName}.`,
    dueDate: '',
    blocksProgress: true,
    documentKeys: [],
    fieldKeys: [],
    requiresReview: true,
  }
}

function buildServiceDocumentOptions(service: any): ProtocolDocumentOption[] {
  const requiredDocuments = normalizeRequiredDocuments(service?.requiredDocuments)
  return requiredDocuments.map((document: any, index) => {
    const label = String(document?.name || document?.documentType || document?.label || document?.id || `Documento ${index + 1}`)
    const documentId = String(document?.id || document?.documentId || label)
    return {
      key: `service:${normalizeText(documentId || label)}`,
      documentType: label,
      label,
      required: document?.required !== false,
      source: 'service' as const,
    }
  })
}

function buildServiceFieldOptions(service: any): ProtocolDataFieldOption[] {
  const formSchema =
    parseJsonIfString(service?.formSchema) ||
    parseJsonIfString(service?.formFieldsConfig) ||
    service?.formSchema ||
    service?.formFieldsConfig
  const fields = extractFieldsFromSchema(formSchema)

  return fields.map((field) => ({
    key: `service:${normalizeText(field.id || field.label)}`,
    fieldKey: String(field.id || field.label),
    fieldLabel: String(field.label || field.id),
    fieldType: field.type || 'text',
    required: field.required !== false,
    source: 'service' as const,
    description: field.description,
    placeholder: field.placeholder,
    options: Array.isArray(field.options) ? field.options : undefined,
  }))
}

function mergeDocumentOptions(
  protocolDocuments: Array<{ id?: string; documentType?: string; fileName?: string | null; status?: string; isRequired?: boolean }>,
  serviceDocuments: ProtocolDocumentOption[],
  context?: PendingCreationContext | null
): ProtocolDocumentOption[] {
  const requiredTypes = context?.stageMetadata?.requiredDocumentTypes || []
  const missingDocuments = context?.validation?.missingDocuments || []
  const merged = new Map<string, ProtocolDocumentOption>()

  for (const document of serviceDocuments) {
    merged.set(normalizeText(document.label || document.documentType), { ...document })
  }

  for (const document of protocolDocuments) {
    const label = String(document.documentType || document.fileName || 'Documento do protocolo')
    const key = normalizeText(label)
    const existing = merged.get(key)
    merged.set(key, {
      key: existing?.key || `protocol:${document.id || key}`,
      id: document.id,
      documentType: label,
      label,
      fileName: document.fileName,
      status: document.status,
      required: document.isRequired ?? existing?.required ?? true,
      source: 'protocol',
    })
  }

  return Array.from(merged.values())
    .map((document) => ({
      ...document,
      suggested:
        missingDocuments.some((item) => normalizeText(item) === normalizeText(document.label) || normalizeText(item) === normalizeText(document.documentType)) ||
        requiredTypes.some((item) => normalizeText(item) === normalizeText(document.label) || normalizeText(item) === normalizeText(document.documentType)),
    }))
    .sort((a, b) => Number(b.suggested) - Number(a.suggested) || Number(b.required) - Number(a.required) || a.label.localeCompare(b.label))
}

function mergeFieldOptions(
  protocolFields: Array<{ id?: string; fieldKey?: string; fieldLabel?: string; fieldType?: string | null; status?: string }>,
  serviceFields: ProtocolDataFieldOption[],
  context?: PendingCreationContext | null
): ProtocolDataFieldOption[] {
  const requiredFieldIds = context?.stageMetadata?.requiredInputFieldIds || []
  const missingFields = context?.validation?.missingFormFields || []
  const merged = new Map<string, ProtocolDataFieldOption>()

  for (const field of serviceFields) {
    merged.set(normalizeText(field.fieldKey || field.fieldLabel), { ...field })
  }

  for (const field of protocolFields) {
    const fieldKey = String(field.fieldKey || field.fieldLabel || field.id || 'campo')
    const fieldLabel = String(field.fieldLabel || field.fieldKey || field.id || 'Campo')
    const key = normalizeText(fieldKey || fieldLabel)
    const existing = merged.get(key)
    merged.set(key, {
      key: existing?.key || `protocol:${field.id || key}`,
      id: field.id,
      fieldKey,
      fieldLabel,
      fieldType: field.fieldType || existing?.fieldType || 'text',
      status: field.status,
      required: existing?.required ?? true,
      source: existing?.source || 'protocol',
      description: existing?.description,
      placeholder: existing?.placeholder,
      options: existing?.options,
    })
  }

  return Array.from(merged.values())
    .map((field) => ({
      ...field,
      suggested:
        missingFields.some((item) => normalizeText(item) === normalizeText(field.fieldLabel) || normalizeText(item) === normalizeText(field.fieldKey)) ||
        requiredFieldIds.some((item) => normalizeText(item) === normalizeText(field.fieldKey) || normalizeText(item) === normalizeText(field.fieldLabel)),
    }))
    .sort((a, b) => Number(b.suggested) - Number(a.suggested) || Number(b.required) - Number(a.required) || a.fieldLabel.localeCompare(b.fieldLabel))
}

export function ProtocolPendingCreationForm({
  protocolId,
  service,
  creationContext,
  onCreated,
  onCancel,
}: ProtocolPendingCreationFormProps) {
  const [draft, setDraft] = useState(() => buildDefaultDraft(creationContext))
  const [documents, setDocuments] = useState<ProtocolDocumentOption[]>([])
  const [dataFields, setDataFields] = useState<ProtocolDataFieldOption[]>([])
  const [loadingContext, setLoadingContext] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setDraft(buildDefaultDraft(creationContext))
  }, [creationContext])

  useEffect(() => {
    const loadContext = async () => {
      try {
        setLoadingContext(true)
        const [documentsResponse, fieldsResponse] = await Promise.all([
          fetch(getFullApiUrl(`/protocols/${protocolId}/documents`), { credentials: 'include' }),
          fetch(getFullApiUrl(`/protocols/${protocolId}/data-fields`), { credentials: 'include' }),
        ])

        const documentsPayload = documentsResponse.ok ? await documentsResponse.json() : null
        const fieldsPayload = fieldsResponse.ok ? await fieldsResponse.json() : null

        const nextDocuments = Array.isArray(documentsPayload?.documents)
          ? documentsPayload.documents
          : Array.isArray(documentsPayload?.data)
            ? documentsPayload.data
            : []
        const nextFields = Array.isArray(fieldsPayload?.data?.fields) ? fieldsPayload.data.fields : []

        setDocuments(mergeDocumentOptions(nextDocuments, buildServiceDocumentOptions(service), creationContext))
        setDataFields(mergeFieldOptions(nextFields, buildServiceFieldOptions(service), creationContext))
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
  }, [protocolId, service, creationContext, toast])

  useEffect(() => {
    setDraft((prev) => {
      if (prev.documentKeys.length > 0 || prev.fieldKeys.length > 0) return prev

      const suggestedDocumentKeys =
        prev.type === PendingType.DOCUMENT
          ? documents.filter((document) => document.suggested).map((document) => document.key)
          : []
      const suggestedFieldKeys =
        [PendingType.INFORMATION, PendingType.CORRECTION, PendingType.VALIDATION].includes(prev.type)
          ? dataFields.filter((field) => field.suggested).map((field) => field.key)
          : []

      if (!suggestedDocumentKeys.length && !suggestedFieldKeys.length) return prev

      return {
        ...prev,
        documentKeys: suggestedDocumentKeys,
        fieldKeys: suggestedFieldKeys,
      }
    })
  }, [documents, dataFields])

  const canSelectDocument = draft.type === PendingType.DOCUMENT
  const canSelectField = [PendingType.INFORMATION, PendingType.CORRECTION, PendingType.VALIDATION].includes(draft.type)

  const toggleDocument = (documentKey: string) => {
    setDraft((prev) => ({
      ...prev,
      documentKeys: prev.documentKeys.includes(documentKey)
        ? prev.documentKeys.filter((key) => key !== documentKey)
        : [...prev.documentKeys, documentKey],
    }))
  }

  const toggleField = (fieldKey: string) => {
    setDraft((prev) => ({
      ...prev,
      fieldKeys: prev.fieldKeys.includes(fieldKey)
        ? prev.fieldKeys.filter((key) => key !== fieldKey)
        : [...prev.fieldKeys, fieldKey],
    }))
  }

  const buildPendingPayload = () => {
    const selectedDocuments = documents.filter((document) => draft.documentKeys.includes(document.key))
    const selectedFields = dataFields.filter((field) => draft.fieldKeys.includes(field.key))
    const payload: Record<string, any> = {
      type: draft.type,
      title: draft.title.trim(),
      description: draft.description.trim(),
      dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : undefined,
      blocksProgress: draft.blocksProgress,
      stageId: creationContext?.stageId,
      requiresReview: draft.requiresReview,
    }

    const baseMetadata: Record<string, any> = {
      requiresCitizenAction: true,
      stageName: creationContext?.stageName,
      sourceAction: creationContext?.sourceAction || 'MANUAL',
    }

    if (draft.type === PendingType.DOCUMENT && selectedDocuments.length > 0) {
      const documentRequests = selectedDocuments.map((document) => ({
        id: document.id || document.key,
        documentId: document.id,
        documentType: document.documentType,
        label: document.label,
        required: document.required !== false,
        source: document.source,
      }))
      const firstDocument = documentRequests[0]
      payload.sourceType = 'DOCUMENT'
      payload.sourceEntityType = 'DOCUMENT'
      payload.sourceEntityId = firstDocument.documentId || firstDocument.id
      payload.dedupeKey = `${protocolId}:${creationContext?.stageId || 'no-stage'}:DOCUMENT:${documentRequests.map((document) => document.id).sort().join('|')}`
      payload.metadata = {
        ...baseMetadata,
        documentId: documentRequests.length === 1 ? firstDocument.documentId || firstDocument.id : undefined,
        documentType: documentRequests.length === 1 ? firstDocument.documentType : undefined,
        documentLabel: documentRequests.length === 1 ? firstDocument.label : undefined,
        documentRequests,
      }
    } else if ([PendingType.INFORMATION, PendingType.CORRECTION, PendingType.VALIDATION].includes(draft.type) && selectedFields.length > 0) {
      const fields = selectedFields.map((field) => ({
        id: field.id || field.key,
        key: field.fieldKey,
        label: field.fieldLabel,
        type: field.fieldType || 'text',
        required: field.required !== false,
        description: field.description || draft.description.trim(),
        placeholder: field.placeholder,
        options: field.options,
        source: field.source,
      }))
      const firstField = fields[0]
      payload.sourceType = 'DATA_FIELD'
      payload.sourceEntityType = 'DATA_FIELD'
      payload.sourceEntityId = firstField.id
      payload.dedupeKey = `${protocolId}:${creationContext?.stageId || 'no-stage'}:${draft.type}:${fields.map((field) => field.id).sort().join('|')}`
      payload.metadata = {
        ...baseMetadata,
        fieldId: fields.length === 1 ? firstField.id : undefined,
        fieldKey: fields.length === 1 ? firstField.key : undefined,
        fieldLabel: fields.length === 1 ? firstField.label : undefined,
        fieldType: fields.length === 1 ? firstField.type : undefined,
        fields,
      }
    } else {
      payload.metadata = baseMetadata
      payload.sourceType = creationContext?.sourceAction || 'MANUAL'
    }

    return payload
  }

  const handleCreate = async () => {
    if (!draft.title.trim() || !draft.description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o título e a descrição da pendência.',
        variant: 'destructive',
      })
      return
    }

    if (canSelectDocument && draft.documentKeys.length === 0) {
      toast({
        title: 'Selecione os documentos',
        description: 'Escolha pelo menos um documento exigido pelo serviço para esta pendência.',
        variant: 'destructive',
      })
      return
    }

    if (canSelectField && draft.fieldKeys.length === 0) {
      toast({
        title: 'Selecione os dados',
        description: 'Escolha pelo menos um campo ou dado exigido pelo serviço para esta pendência.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
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
      onCreated?.()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar pendência',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {creationContext?.stageName && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-blue-700" />
            <div className="space-y-1">
              <p className="font-medium text-blue-950">Pendência vinculada à etapa</p>
              <p className="text-sm text-blue-800">{creationContext.stageName}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={draft.type}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, type: value as PendingType, documentKeys: [], fieldKeys: [] }))}
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

        <div className="space-y-2">
          <Label>Prazo</Label>
          <Input type="date" value={draft.dueDate} onChange={(e) => setDraft((prev) => ({ ...prev, dueDate: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Título</Label>
        <Input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} rows={5} />
      </div>

      {canSelectDocument && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Documentos exigidos pelo serviço</Label>
            <span className="text-xs text-muted-foreground">{draft.documentKeys.length} selecionado(s)</span>
          </div>
          <ScrollArea className="h-72 rounded-md border">
            <div className="space-y-2 p-3">
              {documents.map((document) => (
                <label key={document.key} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
                  <Checkbox checked={draft.documentKeys.includes(document.key)} onCheckedChange={() => toggleDocument(document.key)} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{document.label}</span>
                      {document.required && <Badge variant="outline" className="text-[11px]">Obrigatório</Badge>}
                      {document.suggested && <Badge className="bg-blue-100 text-blue-700 text-[11px]">Sugerido</Badge>}
                      <Badge variant="outline" className="text-[11px]">{document.source === 'protocol' ? 'Já no protocolo' : 'Do serviço'}</Badge>
                      {document.status && <Badge variant="outline" className="text-[11px]">{document.status}</Badge>}
                    </div>
                    {document.fileName && <p className="text-xs text-muted-foreground">Arquivo atual: {document.fileName}</p>}
                  </div>
                </label>
              ))}
              {!loadingContext && documents.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum documento disponível para seleção.</p>
              )}
              {loadingContext && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando documentos...
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {canSelectField && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Dados ou campos exigidos pelo serviço</Label>
            <span className="text-xs text-muted-foreground">{draft.fieldKeys.length} selecionado(s)</span>
          </div>
          <ScrollArea className="h-80 rounded-md border">
            <div className="space-y-2 p-3">
              {dataFields.map((field) => (
                <label key={field.key} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
                  <Checkbox checked={draft.fieldKeys.includes(field.key)} onCheckedChange={() => toggleField(field.key)} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{field.fieldLabel}</span>
                      <Badge variant="outline" className="text-[11px]">{field.fieldType || 'text'}</Badge>
                      {field.required && <Badge variant="outline" className="text-[11px]">Obrigatório</Badge>}
                      {field.suggested && <Badge className="bg-blue-100 text-blue-700 text-[11px]">Sugerido</Badge>}
                      <Badge variant="outline" className="text-[11px]">{field.source === 'protocol' ? 'Já no protocolo' : 'Do serviço'}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Chave: {field.fieldKey}</p>
                    {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                  </div>
                </label>
              ))}
              {!loadingContext && dataFields.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum campo disponível para seleção.</p>
              )}
              {loadingContext && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando campos do serviço...
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border px-3 py-3">
          <div>
            <p className="text-sm font-medium">Bloquear avanço do protocolo</p>
            <p className="text-xs text-muted-foreground">Use quando a pendência impedir a etapa de continuar.</p>
          </div>
          <Button
            type="button"
            variant={draft.blocksProgress ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDraft((prev) => ({ ...prev, blocksProgress: !prev.blocksProgress }))}
          >
            {draft.blocksProgress ? 'Bloqueando' : 'Sem bloqueio'}
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3 py-3">
          <div>
            <p className="text-sm font-medium">Exigir revisão da equipe</p>
            <p className="text-xs text-muted-foreground">A resposta do cidadão ficará em análise antes da baixa final.</p>
          </div>
          <Button
            type="button"
            variant={draft.requiresReview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDraft((prev) => ({ ...prev, requiresReview: !prev.requiresReview }))}
          >
            {draft.requiresReview ? 'Com revisão' : 'Sem revisão'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button type="button" onClick={handleCreate} disabled={submitting || loadingContext}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar pendência
        </Button>
      </div>
    </div>
  )
}