'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  FilePlus,
  Loader2,
  Calendar,
  Download,
  Eye,
  FileText,
  PenTool,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getFullApiUrl } from '@/lib/api-config'
import { DocumentSigningModalSimple } from '@/components/shared/DocumentSigningModalSimple'

interface DocumentTemplate {
  id: string
  name: string
  documentType?: string
  isActive?: boolean
}

interface GeneratedDocument {
  id: string
  documentType?: string
  fileUrl?: string
  filePath?: string
  createdAt?: string
  isSigned?: boolean
  signedAt?: string
  signedBy?: string
}

interface ProtocolDocumentsManagerProps {
  protocolId: string
  serviceId?: string
  generatedDocuments: GeneratedDocument[]
  onRefresh: () => void
}

export function ProtocolDocumentsManager({
  protocolId,
  serviceId,
  generatedDocuments,
  onRefresh
}: ProtocolDocumentsManagerProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  // Estados para geração
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Estados para assinatura
  const [generatedDocument, setGeneratedDocument] = useState<any>(null)
  const [showSigningModal, setShowSigningModal] = useState(false)
  const [signingDocumentId, setSigningDocumentId] = useState<string | null>(null)

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true)
        const query = serviceId ? `?serviceId=${serviceId}&isActive=true` : '?isActive=true'
        const response = await apiRequest(`/document-templates${query}`)
        if (response.success) {
          const data = response.data || []
          setTemplates(data)
          if (!selectedTemplateId && data.length > 0) {
            setSelectedTemplateId(data[0].id)
          }
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
  }, [apiRequest, serviceId, selectedTemplateId, toast])

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      toast({
        title: 'Selecione um template',
        description: 'Escolha um template para gerar o documento',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsGenerating(true)
      const result = await apiRequest(`/protocols/${protocolId}/generate-document`, {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplateId,
          additionalData: {
            notes: notes.trim()
          }
        })
      })

      if (result.success) {
        toast({
          title: 'Documento gerado com sucesso',
          description: 'Agora você pode assinar o documento'
        })
        setNotes('')

        // Armazenar documento gerado e abrir modal de assinatura
        setGeneratedDocument(result.document)
        setShowSigningModal(true)
      } else {
        // Verificar se é erro de certificado
        if (result.error === 'CERTIFICATE_REQUIRED' || result.error === 'CERTIFICATE_PENDING') {
          const data = result.data || {}

          if (data.requestCreated) {
            toast({
              title: 'Certificado Digital Necessário',
              description: 'Uma solicitação de certificado foi criada. Aguarde a aprovação do prefeito ou secretário para gerar documentos.',
              variant: 'default',
              duration: 8000
            })
          } else if (data.hasPendingRequest) {
            toast({
              title: 'Certificado Pendente',
              description: 'Sua solicitação de certificado está aguardando aprovação.',
              variant: 'default',
              duration: 6000
            })
          }
          return
        }

        throw new Error(result.message || result.error || 'Erro ao gerar documento')
      }
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

  const handleSignDocument = async (doc: GeneratedDocument) => {
    setGeneratedDocument(doc)
    setSigningDocumentId(doc.id)
    setShowSigningModal(true)
  }

  const handleSigningComplete = () => {
    setShowSigningModal(false)
    setGeneratedDocument(null)
    setSigningDocumentId(null)
    onRefresh()
  }

  const handleCloseSigningModal = () => {
    setShowSigningModal(false)
    setGeneratedDocument(null)
    setSigningDocumentId(null)
    onRefresh()
  }

  const signedDocuments = generatedDocuments.filter(doc => doc.isSigned)
  const unsignedDocuments = generatedDocuments.filter(doc => !doc.isSigned)

  return (
    <>
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Gerenciamento de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos ({generatedDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <FilePlus className="h-4 w-4" />
                Gerar Novo
              </TabsTrigger>
            </TabsList>

            {/* Tab: Lista de Documentos */}
            <TabsContent value="list" className="mt-0 space-y-4">
              {generatedDocuments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum documento foi gerado ainda. Use a aba "Gerar Novo" para criar documentos.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {/* Documentos não assinados */}
                  {unsignedDocuments.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                          Aguardando Assinatura ({unsignedDocuments.length})
                        </h3>
                      </div>
                      {unsignedDocuments.map(doc => (
                        <div
                          key={doc.id}
                          className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50 hover:border-amber-300 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-amber-600" />
                                <p className="text-sm font-semibold text-gray-900">
                                  {doc.documentType || 'Documento gerado'}
                                </p>
                                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pendente Assinatura
                                </Badge>
                              </div>
                              {doc.createdAt && (
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Gerado em: {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => handleSignDocument(doc)}
                              >
                                <PenTool className="h-4 w-4 mr-2" />
                                Assinar
                              </Button>
                              {(doc.fileUrl || doc.filePath) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const downloadUrl = getFullApiUrl(`/generated-documents/${doc.id}/download?inline=true`)
                                      window.open(downloadUrl, '_blank')
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const downloadUrl = getFullApiUrl(`/generated-documents/${doc.id}/download`)
                                      window.open(downloadUrl, '_blank')
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documentos assinados */}
                  {signedDocuments.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <h3 className="text-sm font-semibold text-gray-900">
                          Assinados ({signedDocuments.length})
                        </h3>
                      </div>
                      {signedDocuments.map(doc => (
                        <div
                          key={doc.id}
                          className="p-4 rounded-lg border bg-green-50 border-green-200 hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                <p className="text-sm font-semibold text-gray-900">
                                  {doc.documentType || 'Documento gerado'}
                                </p>
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Assinado
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                {doc.createdAt && (
                                  <p className="text-xs text-gray-600 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Gerado em: {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                  </p>
                                )}
                                {doc.signedAt && (
                                  <p className="text-xs text-green-700 flex items-center gap-1 font-medium">
                                    <PenTool className="h-3 w-3" />
                                    Assinado em: {format(new Date(doc.signedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    {doc.signedBy && ` por ${doc.signedBy}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {(doc.fileUrl || doc.filePath) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const downloadUrl = getFullApiUrl(`/generated-documents/${doc.id}/download?inline=true`)
                                      window.open(downloadUrl, '_blank')
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const downloadUrl = getFullApiUrl(`/generated-documents/${doc.id}/download`)
                                      window.open(downloadUrl, '_blank')
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Tab: Gerar Documento */}
            <TabsContent value="generate" className="mt-0">
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <FilePlus className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Selecione um template e gere um novo documento. Após a geração, você poderá assiná-lo imediatamente.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="template-select" className="text-sm font-semibold">
                    Template do Documento
                  </Label>
                  <select
                    id="template-select"
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={selectedTemplateId}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                    disabled={isLoadingTemplates}
                  >
                    {templates.length === 0 ? (
                      <option value="">Nenhum template disponível</option>
                    ) : (
                      templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}{template.documentType ? ` (${template.documentType})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="generation-notes" className="text-sm font-semibold">
                    Observações (opcional)
                  </Label>
                  <Textarea
                    id="generation-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Inclua observações adicionais para o documento..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || isLoadingTemplates || !selectedTemplateId}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando documento...
                    </>
                  ) : (
                    <>
                      <FilePlus className="h-4 w-4 mr-2" />
                      Gerar Documento
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de assinatura */}
      {showSigningModal && generatedDocument && (
        <DocumentSigningModalSimple
          document={generatedDocument}
          userType="admin"
          documentType="generated"
          onClose={handleCloseSigningModal}
          onSuccess={handleSigningComplete}
        />
      )}
    </>
  )
}
