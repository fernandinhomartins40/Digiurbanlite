'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FilePlus2,
  FileText,
  ListChecks,
  Loader2,
  Paperclip,
  Upload,
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { getFullApiUrl } from '@/lib/api-config'
import type { ProtocolPending, ProtocolStage, ProtocolStageArtifact } from '@/types/protocol-enhancements'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ProtocolStageHistorySectionProps {
  protocolId: string
  serviceId?: string
  stages: ProtocolStage[]
  pendings: ProtocolPending[]
  onRefresh: () => Promise<void> | void
}

interface DocumentTemplateOption {
  id: string
  name: string
  documentType?: string
}

interface StageDraftState {
  templateId: string
  generatedTitle: string
  generatedDescription: string
  generatedParecer: string
  uploadTitle: string
  uploadDescription: string
  uploadParecer: string
  uploadFiles: File[]
}

const EMPTY_DRAFT: StageDraftState = {
  templateId: '',
  generatedTitle: '',
  generatedDescription: '',
  generatedParecer: '',
  uploadTitle: '',
  uploadDescription: '',
  uploadParecer: '',
  uploadFiles: [],
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return 'Não registrado'
  try {
    return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return 'Data inválida'
  }
}

function getStageStatusLabel(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'Concluída'
    case 'IN_PROGRESS':
      return 'Em andamento'
    case 'PAUSED':
      return 'Pausada'
    case 'FAILED':
      return 'Falhou'
    case 'SKIPPED':
      return 'Pulada'
    default:
      return 'Pendente'
  }
}

function getStageStatusClass(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'PAUSED':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'FAILED':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'SKIPPED':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function ProtocolStageHistorySection({
  protocolId,
  serviceId,
  stages,
  pendings,
  onRefresh,
}: ProtocolStageHistorySectionProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [artifacts, setArtifacts] = useState<ProtocolStageArtifact[]>([])
  const [templates, setTemplates] = useState<DocumentTemplateOption[]>([])
  const [drafts, setDrafts] = useState<Record<string, StageDraftState>>({})
  const [parecerDrafts, setParecerDrafts] = useState<Record<string, string>>({})
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const currentStage = useMemo(() => {
    return stages.find((stage) => stage.status === 'IN_PROGRESS' || stage.status === 'PAUSED')
      || [...stages].sort((a, b) => b.stageOrder - a.stageOrder)[0]
      || null
  }, [stages])

  const visibleStages = useMemo(() => {
    const limit = currentStage?.stageOrder ?? Math.max(0, ...stages.map((stage) => stage.stageOrder))
    return [...stages]
      .filter((stage) => stage.stageOrder <= limit)
      .sort((a, b) => a.stageOrder - b.stageOrder)
  }, [currentStage, stages])

  const artifactsByStage = useMemo(() => {
    return artifacts.reduce<Record<string, ProtocolStageArtifact[]>>((acc, artifact) => {
      acc[artifact.stageId] = acc[artifact.stageId] || []
      acc[artifact.stageId].push(artifact)
      return acc
    }, {})
  }, [artifacts])

  useEffect(() => {
    void loadArtifacts()
  }, [protocolId])

  useEffect(() => {
    if (!serviceId) return
    void loadTemplates()
  }, [serviceId])

  useEffect(() => {
    setParecerDrafts((current) => {
      const next = { ...current }
      for (const artifact of artifacts) {
        if (!(artifact.id in next)) {
          next[artifact.id] = artifact.parecer || ''
        }
      }
      return next
    })
  }, [artifacts])

  const ensureDraft = (stageId: string) => drafts[stageId] || EMPTY_DRAFT

  const updateDraft = (stageId: string, patch: Partial<StageDraftState>) => {
    setDrafts((current) => ({
      ...current,
      [stageId]: {
        ...EMPTY_DRAFT,
        ...(current[stageId] || {}),
        ...patch,
      },
    }))
  }

  const resetDraft = (stageId: string) => {
    setDrafts((current) => ({
      ...current,
      [stageId]: { ...EMPTY_DRAFT },
    }))
  }

  async function loadArtifacts() {
    try {
      setLoading(true)
      const response = await apiRequest(`/protocols/${protocolId}/stage-artifacts`)
      setArtifacts(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      toast({
        title: 'Erro ao carregar histórico por etapa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
      setArtifacts([])
    } finally {
      setLoading(false)
    }
  }

  async function loadTemplates() {
    try {
      const response = await apiRequest(`/document-templates?serviceId=${serviceId}&isActive=true`)
      setTemplates(Array.isArray(response.data) ? response.data : [])
    } catch {
      setTemplates([])
    }
  }

  async function refreshAll() {
    await loadArtifacts()
    await onRefresh()
  }

  async function handleGenerate(stage: ProtocolStage) {
    const draft = ensureDraft(stage.id)
    if (!draft.templateId) {
      toast({
        title: 'Selecione um template',
        description: 'Escolha o template antes de gerar o documento da etapa.',
        variant: 'destructive',
      })
      return
    }

    try {
      setBusyKey(`generate:${stage.id}`)
      const generatedResponse = await apiRequest(`/protocols/${protocolId}/generate-document`, {
        method: 'POST',
        body: JSON.stringify({
          templateId: draft.templateId,
          additionalData: {
            notes: draft.generatedDescription || undefined,
            stageId: stage.id,
            stageName: stage.stageName,
            stageOrder: stage.stageOrder,
          },
        }),
      })

      const generatedDocumentId = generatedResponse?.data?.id
      if (!generatedDocumentId) {
        throw new Error('Documento gerado sem identificador retornado')
      }

      await apiRequest(`/protocols/${protocolId}/stages/${stage.id}/artifacts/link-generated`, {
        method: 'POST',
        body: JSON.stringify({
          generatedDocumentId,
          title: draft.generatedTitle || undefined,
          description: draft.generatedDescription || undefined,
          parecer: draft.generatedParecer || undefined,
        }),
      })

      toast({
        title: 'Documento gerado',
        description: `O documento foi registrado no histórico da etapa ${stage.stageName}.`,
      })
      resetDraft(stage.id)
      await refreshAll()
    } catch (error) {
      toast({
        title: 'Erro ao gerar documento da etapa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleUpload(stage: ProtocolStage) {
    const draft = ensureDraft(stage.id)
    if (draft.uploadFiles.length === 0) {
      toast({
        title: 'Selecione um arquivo',
        description: 'Envie ao menos um arquivo para o histórico da etapa.',
        variant: 'destructive',
      })
      return
    }

    try {
      setBusyKey(`upload:${stage.id}`)
      const formData = new FormData()
      for (const file of draft.uploadFiles) {
        formData.append(`stageFile_${stage.id}`, file)
      }
      if (draft.uploadTitle) formData.append('title', draft.uploadTitle)
      if (draft.uploadDescription) formData.append('description', draft.uploadDescription)
      if (draft.uploadParecer) formData.append('parecer', draft.uploadParecer)

      await apiRequest(`/protocols/${protocolId}/stages/${stage.id}/artifacts/upload`, {
        method: 'POST',
        body: formData,
      })

      toast({
        title: 'Documento anexado',
        description: `O arquivo foi anexado ao histórico da etapa ${stage.stageName}.`,
      })
      resetDraft(stage.id)
      await refreshAll()
    } catch (error) {
      toast({
        title: 'Erro ao anexar documento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleSaveParecer(stageId: string, artifactId: string) {
    try {
      setBusyKey(`parecer:${artifactId}`)
      await apiRequest(`/protocols/${protocolId}/stages/${stageId}/artifacts/${artifactId}`, {
        method: 'PUT',
        body: JSON.stringify({
          parecer: parecerDrafts[artifactId] || '',
        }),
      })

      toast({
        title: 'Parecer salvo',
        description: 'O parecer foi atualizado no histórico da etapa.',
      })
      await loadArtifacts()
    } catch (error) {
      toast({
        title: 'Erro ao salvar parecer',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setBusyKey(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-orange-600" />
          <span className="text-sm text-muted-foreground">Carregando histórico das etapas...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {visibleStages.map((stage) => {
        const stageArtifacts = artifactsByStage[stage.id] || []
        const stagePendings = pendings.filter((pending) => pending.stageId === stage.id)
        const draft = ensureDraft(stage.id)
        const requiredDocuments = Array.isArray(stage.metadata?.requiredDocumentTypes) ? stage.metadata.requiredDocumentTypes : []
        const requiredInputs = Array.isArray(stage.metadata?.requiredInputFieldIds) ? stage.metadata.requiredInputFieldIds : []

        return (
          <Card key={stage.id} className="border-slate-200 shadow-sm">
            <CardHeader className="gap-4 border-b bg-slate-50/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                      Etapa {stage.stageOrder}
                    </Badge>
                    <Badge variant="outline" className={getStageStatusClass(stage.status)}>
                      {getStageStatusLabel(stage.status)}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{stage.stageName}</CardTitle>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Início: {formatDateTime(stage.startedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Conclusão: {formatDateTime(stage.completedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Prazo: {formatDateTime(stage.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <div className="text-xs text-muted-foreground">Pendências</div>
                    <div className="font-semibold">{stagePendings.length}</div>
                  </div>
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <div className="text-xs text-muted-foreground">Documentos</div>
                    <div className="font-semibold">{stageArtifacts.length}</div>
                  </div>
                  <div className="rounded-lg border bg-white px-3 py-2">
                    <div className="text-xs text-muted-foreground">Resultado</div>
                    <div className="font-semibold">{stage.result || '—'}</div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold text-slate-900">Resumo do que aconteceu nesta etapa</h4>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>{stage.startedAt ? `A etapa foi iniciada em ${formatDateTime(stage.startedAt)}.` : 'A etapa ainda não possui início registrado.'}</p>
                  {stage.completedAt && <p>{`A etapa foi finalizada em ${formatDateTime(stage.completedAt)}.`}</p>}
                  {stage.result && <p>{`Resultado registrado: ${stage.result}.`}</p>}
                  {stage.notes && <p>{`Observações: ${stage.notes}.`}</p>}
                  {stagePendings.length > 0 && <p>{`${stagePendings.length} pendência(s) estão vinculadas a esta etapa.`}</p>}
                  {stageArtifacts.length > 0 && <p>{`${stageArtifacts.length} documento(s) fazem parte do histórico desta etapa.`}</p>}
                </div>

                {(requiredDocuments.length > 0 || requiredInputs.length > 0) && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {requiredDocuments.length > 0 && (
                      <div className="rounded-lg border bg-white p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Documentos previstos</p>
                        <div className="flex flex-wrap gap-2">
                          {requiredDocuments.map((documentType) => (
                            <Badge key={`${stage.id}-${documentType}`} variant="outline" className="bg-slate-50">
                              {documentType}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {requiredInputs.length > 0 && (
                      <div className="rounded-lg border bg-white p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Dados previstos</p>
                        <div className="flex flex-wrap gap-2">
                          {requiredInputs.map((fieldKey) => (
                            <Badge key={`${stage.id}-${fieldKey}`} variant="outline" className="bg-slate-50">
                              {fieldKey}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {stagePendings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <AlertCircle className="h-4 w-4" />
                      Pendências vinculadas à etapa
                    </div>
                    <div className="space-y-2">
                      {stagePendings.map((pending) => (
                        <div key={pending.id} className="rounded-md border border-amber-200 bg-white p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-900">{pending.title}</span>
                            <Badge variant="outline" className="bg-white">{pending.status}</Badge>
                          </div>
                          <p className="mt-1 text-slate-700">{pending.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold text-slate-900">Documentos e pareceres da etapa</h4>
                </div>

                {stageArtifacts.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Nenhum documento foi registrado no histórico desta etapa ainda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stageArtifacts.map((artifact) => (
                      <div key={artifact.id} className="rounded-xl border bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900">{artifact.title}</span>
                              <Badge variant="outline" className="bg-slate-50">
                                {artifact.sourceType === 'GENERATED' ? 'Gerado' : 'Anexado'}
                              </Badge>
                            </div>
                            {artifact.description && <p className="text-sm text-slate-700">{artifact.description}</p>}
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDateTime(artifact.createdAt)}
                              </span>
                              {artifact.fileName && (
                                <span className="inline-flex items-center gap-1">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  {artifact.fileName}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getFullApiUrl(`/protocols/${protocolId}/stages/${stage.id}/artifacts/${artifact.id}/download?inline=true`), '_blank')}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getFullApiUrl(`/protocols/${protocolId}/stages/${stage.id}/artifacts/${artifact.id}/download`), '_blank')}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Baixar
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 rounded-lg border bg-slate-50 p-3">
                          <Label htmlFor={`parecer-${artifact.id}`}>Parecer do documento</Label>
                          <Textarea
                            id={`parecer-${artifact.id}`}
                            value={parecerDrafts[artifact.id] || ''}
                            onChange={(event) => setParecerDrafts((current) => ({ ...current, [artifact.id]: event.target.value }))}
                            placeholder="Registre o parecer do documento desta etapa."
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleSaveParecer(stage.id, artifact.id)}
                              disabled={busyKey === `parecer:${artifact.id}`}
                            >
                              {busyKey === `parecer:${artifact.id}` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Salvar parecer
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4 rounded-xl border border-orange-100 bg-orange-50/40 p-4">
                <div className="flex items-center gap-2">
                  <FilePlus2 className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold text-slate-900">Adicionar documento ao histórico da etapa</h4>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-xl border bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FilePlus2 className="h-4 w-4 text-orange-600" />
                      <h5 className="font-medium">Gerar novo documento</h5>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Template</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={draft.templateId}
                          onChange={(event) => updateDraft(stage.id, { templateId: event.target.value })}
                        >
                          <option value="">Selecione um template</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}{template.documentType ? ` (${template.documentType})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Título no histórico</Label>
                        <Input
                          value={draft.generatedTitle}
                          onChange={(event) => updateDraft(stage.id, { generatedTitle: event.target.value })}
                          placeholder="Opcional. Se vazio, usa o tipo do template."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição e contexto</Label>
                        <Textarea
                          value={draft.generatedDescription}
                          onChange={(event) => updateDraft(stage.id, { generatedDescription: event.target.value })}
                          placeholder="Contexto do documento gerado nesta etapa."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Parecer inicial</Label>
                        <Textarea
                          value={draft.generatedParecer}
                          onChange={(event) => updateDraft(stage.id, { generatedParecer: event.target.value })}
                          placeholder="Parecer associado ao documento gerado."
                          rows={3}
                        />
                      </div>
                      <Button className="w-full" onClick={() => handleGenerate(stage)} disabled={busyKey === `generate:${stage.id}`}>
                        {busyKey === `generate:${stage.id}` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gerar e registrar
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Upload className="h-4 w-4 text-orange-600" />
                      <h5 className="font-medium">Anexar arquivo externo</h5>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={draft.uploadTitle}
                          onChange={(event) => updateDraft(stage.id, { uploadTitle: event.target.value })}
                          placeholder="Ex.: Parecer técnico assinado"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={draft.uploadDescription}
                          onChange={(event) => updateDraft(stage.id, { uploadDescription: event.target.value })}
                          placeholder="Contexto do anexo desta etapa."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Parecer</Label>
                        <Textarea
                          value={draft.uploadParecer}
                          onChange={(event) => updateDraft(stage.id, { uploadParecer: event.target.value })}
                          placeholder="Parecer associado ao documento anexado."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Arquivo</Label>
                        <Input
                          type="file"
                          multiple
                          onChange={(event) => updateDraft(stage.id, { uploadFiles: Array.from(event.target.files || []) })}
                        />
                        {draft.uploadFiles.length > 0 && (
                          <div className="rounded-md border bg-slate-50 p-2 text-xs text-slate-600">
                            {draft.uploadFiles.map((file) => file.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => handleUpload(stage)} disabled={busyKey === `upload:${stage.id}`}>
                        {busyKey === `upload:${stage.id}` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Anexar ao histórico
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>
        )
      })}

      {visibleStages.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma etapa disponível para histórico resumido.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
