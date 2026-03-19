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
  FilePlus,
  FileText,
  Loader2,
  PenTool,
  Send,
  SquarePen,
} from 'lucide-react'
import { DocumentSigningModalSimple } from '@/components/shared/DocumentSigningModalSimple'
import { JSONSchemaForm } from '@/components/forms/JSONSchemaForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { getFullApiUrl } from '@/lib/api-config'

interface DocumentTemplate {
  id: string
  name: string
  documentType?: string
  inputSchema?: {
    type?: 'object'
    properties?: Record<string, any>
    required?: string[]
    citizenFields?: string[]
  } | null
  requiresSignature?: boolean
}

interface GeneratedDocument {
  id: string
  templateId?: string
  name?: string
  fileName?: string
  fileUrl?: string
  filePath?: string
  documentType?: string
  createdAt?: string
  generatedAt?: string
  isSigned?: boolean
  status?: 'PENDING_SIGNATURE' | 'SIGNED' | 'PUBLISHED' | 'SUPERSEDED' | string
  signedAt?: string
  signedBy?: string | null
  publishedToCitizen?: boolean
  publishedAt?: string | null
  revisionNumber?: number
  sourceStageName?: string | null
  inputData?: Record<string, any>
}

interface ProtocolDocumentsManagerProps {
  protocolId: string
  serviceId?: string
  generatedDocuments: GeneratedDocument[]
  onRefresh: () => void
}

function normalizeSchema(template: DocumentTemplate | null) {
  const rawSchema = template?.inputSchema
  if (!rawSchema || typeof rawSchema !== 'object' || !rawSchema.properties) {
    return null
  }

  return {
    type: 'object' as const,
    properties: rawSchema.properties || {},
    required: Array.isArray(rawSchema.required) ? rawSchema.required : [],
    citizenFields: Array.isArray(rawSchema.citizenFields) ? rawSchema.citizenFields : [],
  }
}

function getStatusBadge(document: GeneratedDocument) {
  switch (document.status) {
    case 'PUBLISHED':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Publicado</Badge>
    case 'SIGNED':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Assinado</Badge>
    case 'SUPERSEDED':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Substituído</Badge>
    default:
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pendente assinatura</Badge>
  }
}

export function ProtocolDocumentsManager({
  protocolId,
  generatedDocuments,
  onRefresh
}: ProtocolDocumentsManagerProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [templateInputData, setTemplateInputData] = useState<Record<string, any>>({})
  const [notes, setNotes] = useState('')
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<any>(null)
  const [showSigningModal, setShowSigningModal] = useState(false)
  const [revisionSourceDocument, setRevisionSourceDocument] = useState<GeneratedDocument | null>(null)
  const [publishingDocumentId, setPublishingDocumentId] = useState<string | null>(null)

  const sortedDocuments = useMemo(() => {
    return [...generatedDocuments].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [generatedDocuments])

  const pendingSignatureDocuments = sortedDocuments.filter(doc => doc.status === 'PENDING_SIGNATURE' || !doc.isSigned)
  const signedDocuments = sortedDocuments.filter(doc => doc.status === 'SIGNED')
  const publishedDocuments = sortedDocuments.filter(doc => doc.status === 'PUBLISHED')
  const supersededDocuments = sortedDocuments.filter(doc => doc.status === 'SUPERSEDED')

  const selectedTemplate = templates.find(template => template.id === selectedTemplateId) || null
  const selectedTemplateSchema = normalizeSchema(selectedTemplate)

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true)
        const response = await apiRequest(`/protocols/${protocolId}/document-templates`)
        const data = response.data || []
        setTemplates(data)

        if (!selectedTemplateId && data.length > 0) {
          setSelectedTemplateId(data[0].id)
        }
      } catch (error) {
        toast({
          title: 'Erro ao carregar templates',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    loadTemplates()
  }, [apiRequest, protocolId, selectedTemplateId, toast])

  useEffect(() => {
    if (!revisionSourceDocument && !selectedTemplateId) {
      setTemplateInputData({})
      setNotes('')
    }
  }, [revisionSourceDocument, selectedTemplateId])

  const resetGenerationForm = () => {
    setRevisionSourceDocument(null)
    setTemplateInputData({})
    setNotes('')
  }

  const openSigningModalForDocument = (doc: GeneratedDocument) => {
    setGeneratedDocument({
      id: doc.id,
      fileName: doc.fileName || doc.name || doc.documentType || 'Documento Gerado',
      fileUrl: getFullApiUrl(`/generated-documents/${doc.id}/download?inline=true`),
      fileSize: undefined,
    })
    setShowSigningModal(true)
  }

  const handleGenerate = async () => {
    if (!selectedTemplateId && !revisionSourceDocument) {
      toast({
        title: 'Selecione um template',
        description: 'Escolha um template antes de gerar o documento',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsGenerating(true)

      const additionalData = {
        ...templateInputData,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }

      const fallbackEndpoint = revisionSourceDocument
        ? `/generated-documents/${revisionSourceDocument.id}/revise`
        : `/protocols/${protocolId}/generate-document`

      const body = revisionSourceDocument
        ? { additionalData }
        : { templateId: selectedTemplateId, additionalData }

      const result = await apiRequest(fallbackEndpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const createdDocument = result.data || result.document || result

      setGeneratedDocument({
        id: createdDocument.id,
        fileName: createdDocument.fileName || selectedTemplate?.name || 'Documento Gerado',
        fileUrl: getFullApiUrl(`/generated-documents/${createdDocument.id}/download?inline=true`),
        fileSize: createdDocument.fileSize,
      })
      setShowSigningModal(true)

      toast({
        title: revisionSourceDocument ? 'Revisão gerada' : 'Documento gerado',
        description: 'Defina a área de assinatura e assine o documento para poder publicá-lo ao cidadão',
      })

      resetGenerationForm()
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao gerar documento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartRevision = (document: GeneratedDocument) => {
    setRevisionSourceDocument(document)
    const revisionTemplateId = document.templateId || selectedTemplateId
    if (revisionTemplateId) {
      setSelectedTemplateId(revisionTemplateId)
    }
    const nextInputData = { ...(document.inputData || {}) }
    delete nextInputData.notes
    setTemplateInputData(nextInputData)
    setNotes(typeof document.inputData?.notes === 'string' ? document.inputData.notes : '')
  }

  const handlePublish = async (documentId: string) => {
    try {
      setPublishingDocumentId(documentId)
      const result = await apiRequest(`/generated-documents/${documentId}/publish`, {
        method: 'POST',
      })

      toast({
        title: 'Documento publicado',
        description: result.message || 'O documento agora está disponível para o cidadão',
      })
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao publicar documento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setPublishingDocumentId(null)
    }
  }

  const renderDocumentCard = (document: GeneratedDocument, options: {
    canSign?: boolean
    canPublish?: boolean
    canRevise?: boolean
  }) => (
    <div
      key={document.id}
      className="rounded-lg border bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-4 w-4 text-slate-600" />
            <p className="text-sm font-semibold text-slate-900">
              {document.name || document.fileName || document.documentType || 'Documento gerado'}
            </p>
            {getStatusBadge(document)}
            {document.revisionNumber ? (
              <Badge variant="outline">Rev. {document.revisionNumber}</Badge>
            ) : null}
          </div>

          <div className="space-y-1 text-xs text-slate-600">
            {document.createdAt ? (
              <p className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Gerado em {format(new Date(document.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            ) : null}
            {document.signedAt ? (
              <p className="text-blue-700">
                Assinado em {format(new Date(document.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                {document.signedBy ? ` por ${document.signedBy}` : ''}
              </p>
            ) : null}
            {document.publishedAt ? (
              <p className="text-green-700">
                Publicado ao cidadão em {format(new Date(document.publishedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            ) : null}
            {document.sourceStageName ? (
              <p>Etapa: {document.sourceStageName}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {options.canSign ? (
            <Button size="sm" onClick={() => openSigningModalForDocument(document)}>
              <PenTool className="mr-2 h-4 w-4" />
              Assinar
            </Button>
          ) : null}

          {options.canPublish ? (
            <Button
              size="sm"
              variant="outline"
              disabled={publishingDocumentId === document.id}
              onClick={() => handlePublish(document.id)}
            >
              {publishingDocumentId === document.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publicar
            </Button>
          ) : null}

          {options.canRevise ? (
            <Button size="sm" variant="outline" onClick={() => handleStartRevision(document)}>
              <SquarePen className="mr-2 h-4 w-4" />
              Revisar
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(getFullApiUrl(`/generated-documents/${document.id}/download?inline=true`), '_blank')}
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(getFullApiUrl(`/generated-documents/${document.id}/download`), '_blank')}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Gerenciamento de Documentos do Protocolo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="generate">Gerar / Revisar</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-6">
              {sortedDocuments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum documento foi gerado para este protocolo ainda.
                  </AlertDescription>
                </Alert>
              ) : null}

              {pendingSignatureDocuments.length > 0 ? (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold">Pendentes de assinatura</h3>
                  </div>
                  {pendingSignatureDocuments.map(document =>
                    renderDocumentCard(document, { canSign: true, canRevise: true })
                  )}
                </section>
              ) : null}

              {signedDocuments.length > 0 ? (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold">Assinados e aguardando publicação</h3>
                  </div>
                  {signedDocuments.map(document =>
                    renderDocumentCard(document, { canPublish: true, canRevise: true })
                  )}
                </section>
              ) : null}

              {publishedDocuments.length > 0 ? (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-semibold">Publicados ao cidadão</h3>
                  </div>
                  {publishedDocuments.map(document =>
                    renderDocumentCard(document, { canRevise: true })
                  )}
                </section>
              ) : null}

              {supersededDocuments.length > 0 ? (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold">Revisões substituídas</h3>
                  </div>
                  {supersededDocuments.map(document =>
                    renderDocumentCard(document, {})
                  )}
                </section>
              ) : null}
            </TabsContent>

            <TabsContent value="generate" className="space-y-6">
              {revisionSourceDocument ? (
                <Alert className="border-blue-200 bg-blue-50">
                  <SquarePen className="h-4 w-4 text-blue-700" />
                  <AlertDescription className="text-blue-900">
                    Você está criando uma nova revisão de{' '}
                    <strong>{revisionSourceDocument.name || revisionSourceDocument.fileName || 'documento'}</strong>.
                    O documento anterior será substituído e a nova versão precisará ser assinada novamente.
                    <Button
                      variant="link"
                      className="h-auto px-2 text-blue-800"
                      onClick={resetGenerationForm}
                    >
                      Cancelar revisão
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="template-select">Template</Label>
                <select
                  id="template-select"
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  disabled={isLoadingTemplates || Boolean(revisionSourceDocument)}
                >
                  {templates.length === 0 ? (
                    <option value="">Nenhum template disponível para a etapa atual</option>
                  ) : (
                    templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}{template.documentType ? ` (${template.documentType})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedTemplateSchema ? (
                <JSONSchemaForm
                  schema={selectedTemplateSchema}
                  formData={templateInputData}
                  onChange={(fieldId, value) => setTemplateInputData((current) => ({ ...current, [fieldId]: value }))}
                />
              ) : (
                <Alert>
                  <FilePlus className="h-4 w-4" />
                  <AlertDescription>
                    Este template não exige dados adicionais além do conteúdo padrão do protocolo.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="generation-notes">Observações complementares</Label>
                <Textarea
                  id="generation-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Use este campo para observações ou informações complementares da emissão"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || isLoadingTemplates || (!selectedTemplateId && !revisionSourceDocument)}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando documento...
                  </>
                ) : (
                  <>
                    <FilePlus className="mr-2 h-4 w-4" />
                    {revisionSourceDocument ? 'Gerar nova revisão' : 'Gerar documento'}
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showSigningModal && generatedDocument ? (
        <DocumentSigningModalSimple
          document={generatedDocument}
          userType="admin"
          documentType="generated"
          onClose={() => {
            setShowSigningModal(false)
            setGeneratedDocument(null)
            onRefresh()
          }}
          onSuccess={() => {
            setShowSigningModal(false)
            setGeneratedDocument(null)
            onRefresh()
          }}
        />
      ) : null}
    </>
  )
}
