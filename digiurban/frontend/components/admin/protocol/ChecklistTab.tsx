'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  Circle,
  FileText,
  FormInput,
  AlertCircle,
  Loader2,
  Eye,
  AlertTriangle,
  Send,
  Upload
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { StageStatus } from '@/types/protocol-enhancements'
import { getProtocolDocuments, getDocumentDownloadUrl, uploadDocument, type ProtocolDocument } from '@/services/protocol-documents.service'
import { createPending, createPendingsBatch, getProtocolPendings, resolvePending, type ProtocolPending } from '@/services/protocol-pendings.service'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'

interface ChecklistTabProps {
  protocolId: string
  currentStage: {
    id: string
    stageName: string
    status: string
    metadata?: any
  } | null
  onNavigateToDocuments: () => void
}

interface StageValidation {
  canProgress: boolean
  blockers: string[]
  warnings: string[]
  missingDocuments: string[]
  missingFormFields: string[]
}

export function ChecklistTab({
  protocolId,
  currentStage,
  onNavigateToDocuments
}: ChecklistTabProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [validation, setValidation] = useState<StageValidation | null>(null)
  const [documents, setDocuments] = useState<ProtocolDocument[]>([])
  const [formData, setFormData] = useState<any>(null)
  const [pendings, setPendings] = useState<ProtocolPending[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Estado para interações
  const [interactionText, setInteractionText] = useState('')
  const [isSendingInteraction, setIsSendingInteraction] = useState(false)

  // Estado para modal de pendência
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingType, setPendingType] = useState<'document' | 'field' | null>(null)
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [pendingDescription, setPendingDescription] = useState('')
  const [isCreatingPending, setIsCreatingPending] = useState(false)

  // Estado para resolver pendência inline
  const [resolvingPendingId, setResolvingPendingId] = useState<string | null>(null)
  const [pendingResolutions, setPendingResolutions] = useState<Record<string, string>>({})
  const [editingFieldValues, setEditingFieldValues] = useState<Record<string, string>>({})

  // Estado para upload de documentos
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})

  useEffect(() => {
    if (currentStage?.id) {
      loadChecklistData()
    }
  }, [currentStage?.id])

  const loadChecklistData = async () => {
    if (!currentStage) return

    try {
      setIsLoading(true)

      // Carregar validação
      const validationResponse = await apiRequest(
        `/protocols/${protocolId}/stages/${currentStage.id}/validate`
      )
      if (validationResponse.success) {
        setValidation(validationResponse.data.validation)
      }

      // Carregar documentos
      const docs = await getProtocolDocuments(protocolId)
      setDocuments(docs)

      // Carregar dados do formulário do protocolo
      const protocolResponse = await apiRequest(`/protocols/${protocolId}`)
      if (protocolResponse.success && protocolResponse.data.customData) {
        setFormData(protocolResponse.data.customData)
      }

      // Carregar pendências
      const pendingsData = await getProtocolPendings(protocolId)
      setPendings(pendingsData)

    } catch (error) {
      console.error('Erro ao carregar dados do checklist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendInteraction = async () => {
    if (!interactionText.trim()) return

    try {
      setIsSendingInteraction(true)

      const response = await apiRequest(`/protocols/${protocolId}/interactions`, {
        method: 'POST',
        body: JSON.stringify({
          message: interactionText,
          type: 'COMMENT'
        })
      })

      if (response.success) {
        toast({
          title: 'Interação adicionada',
          description: 'Seu comentário foi registrado com sucesso.'
        })
        setInteractionText('')
      }
    } catch (error) {
      toast({
        title: 'Erro ao enviar interação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSendingInteraction(false)
    }
  }

  const handleOpenPendingModal = (type: 'document' | 'field', item: string) => {
    setPendingType(type)
    setSelectedItem(item)
    setPendingDescription('')
    setShowPendingModal(true)
  }

  const handleCreatePending = async () => {
    if (!pendingDescription.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Por favor, descreva a pendência',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsCreatingPending(true)

      const pendingData = {
        type: pendingType === 'document' ? 'DOCUMENT' : 'INFORMATION',
        title: pendingType === 'document'
          ? `Documento pendente: ${selectedItem}`
          : `Informação pendente: ${selectedItem}`,
        description: pendingDescription,
        priority: 2,
        blocksProgress: true,
        metadata: {
          [pendingType === 'document' ? 'documentType' : 'fieldId']: selectedItem,
          stageId: currentStage?.id,
          stageName: currentStage?.stageName
        }
      }

      await createPending(protocolId, pendingData)

      toast({
        title: 'Pendência criada',
        description: 'A pendência foi registrada com sucesso.'
      })

      setShowPendingModal(false)
      loadChecklistData() // Recarregar dados

    } catch (error) {
      toast({
        title: 'Erro ao criar pendência',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingPending(false)
    }
  }

  const handleViewDocument = (documentId: string) => {
    const url = getDocumentDownloadUrl(protocolId, documentId)
    window.open(url, '_blank')
  }

  const handleCreateBatchPendings = async () => {
    if (!currentStage || !validation) return

    const pendingsToCreate: any[] = []

    // Adicionar pendências de documentos faltantes
    validation.missingDocuments.forEach((docType) => {
      pendingsToCreate.push({
        type: 'DOCUMENT',
        title: `Documento obrigatório faltando: ${docType}`,
        description: `É necessário enviar o documento "${docType}" para prosseguir com a etapa "${currentStage.stageName}".`,
        priority: 2,
        blocksProgress: true,
        metadata: {
          documentType: docType,
          stageId: currentStage.id,
          stageName: currentStage.stageName
        }
      })
    })

    // Adicionar pendências de campos faltantes
    validation.missingFormFields.forEach((field) => {
      pendingsToCreate.push({
        type: 'INFORMATION',
        title: `Informação obrigatória faltando: ${field}`,
        description: `É necessário preencher o campo "${field}" para prosseguir com a etapa "${currentStage.stageName}".`,
        priority: 2,
        blocksProgress: true,
        metadata: {
          fieldId: field,
          stageId: currentStage.id,
          stageName: currentStage.stageName
        }
      })
    })

    if (pendingsToCreate.length === 0) {
      toast({
        title: 'Nenhuma pendência para criar',
        description: 'Não há itens faltantes no momento.'
      })
      return
    }

    try {
      setIsCreatingPending(true)

      await createPendingsBatch(protocolId, pendingsToCreate)

      toast({
        title: `${pendingsToCreate.length} pendências criadas`,
        description: 'Todas as pendências foram registradas com sucesso.'
      })

      loadChecklistData()
    } catch (error) {
      toast({
        title: 'Erro ao criar pendências',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingPending(false)
    }
  }

  // Helper para obter pendências de um documento ou campo específico
  const getPendingsFor = (type: 'document' | 'field', identifier: string) => {
    return pendings.filter(p => {
      if (p.status !== 'PENDING') return false
      if (type === 'document') {
        return p.pendingType === 'DOCUMENT' && p.metadata?.documentType === identifier
      } else {
        return p.pendingType === 'INFORMATION' && p.metadata?.fieldId === identifier
      }
    })
  }

  // Resolver pendência inline
  const handleResolvePending = async (pendingId: string, resolution: string) => {
    try {
      setResolvingPendingId(pendingId)
      await resolvePending(protocolId, pendingId, resolution)

      toast({
        title: 'Pendência resolvida',
        description: 'A pendência foi marcada como resolvida com sucesso.'
      })

      // Limpar o campo de resolução
      setPendingResolutions(prev => {
        const newState = { ...prev }
        delete newState[pendingId]
        return newState
      })

      // Recarregar dados
      loadChecklistData()
    } catch (error) {
      toast({
        title: 'Erro ao resolver pendência',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setResolvingPendingId(null)
    }
  }

  // Atualizar valor de campo e resolver pendência associada
  const handleUpdateFieldValue = async (fieldId: string, value: string) => {
    try {
      // Atualizar customData do protocolo
      const updatedData = {
        ...formData,
        [fieldId]: value
      }

      const response = await apiRequest(`/protocols/${protocolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customData: updatedData })
      })

      if (!response.success) {
        throw new Error(response.error || 'Erro ao atualizar campo')
      }

      // Resolver pendências associadas a este campo
      const fieldPendings = getPendingsFor('field', fieldId)
      for (const pending of fieldPendings) {
        await resolvePending(protocolId, pending.id, `Campo "${fieldId}" preenchido com: ${value}`)
      }

      toast({
        title: 'Campo atualizado',
        description: fieldPendings.length > 0
          ? `Campo atualizado e ${fieldPendings.length} pendência(s) resolvida(s)`
          : 'Campo atualizado com sucesso'
      })

      // Limpar campo de edição
      setEditingFieldValues(prev => {
        const newState = { ...prev }
        delete newState[fieldId]
        return newState
      })

      // Recarregar dados
      loadChecklistData()
    } catch (error) {
      toast({
        title: 'Erro ao atualizar campo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  // Upload de documento para resolver pendência
  const handleUploadDocument = async (documentType: string, pendingId: string) => {
    const file = selectedFiles[documentType]
    if (!file) return

    try {
      setUploadingDocType(documentType)

      // 1. Fazer upload do documento
      const uploadedDoc = await uploadDocument(protocolId, file, documentType)

      // 2. Resolver a pendência
      await resolvePending(
        protocolId,
        pendingId,
        `Documento "${file.name}" enviado presencialmente pelo servidor`
      )

      toast({
        title: 'Documento enviado',
        description: `Documento enviado e pendência resolvida com sucesso`
      })

      // Limpar arquivo selecionado
      setSelectedFiles(prev => {
        const newState = { ...prev }
        delete newState[documentType]
        return newState
      })

      // Recarregar dados
      loadChecklistData()
    } catch (error) {
      toast({
        title: 'Erro ao enviar documento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setUploadingDocType(null)
    }
  }

  if (!currentStage || currentStage.status !== StageStatus.IN_PROGRESS) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma etapa em andamento no momento</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2">Carregando checklist...</span>
        </CardContent>
      </Card>
    )
  }

  if (!validation) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Erro ao carregar checklist</p>
        </CardContent>
      </Card>
    )
  }

  const requiredDocs = currentStage.metadata?.requiredDocumentTypes || []
  const requiredFields = currentStage.metadata?.requiredFormFieldIds || []

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card className={validation.canProgress ? 'border-green-300' : 'border-amber-300'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {validation.canProgress ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-900">Tudo Pronto!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-900">Checklist da Etapa</span>
                </>
              )}
            </CardTitle>
            {validation.canProgress && (
              <Badge className="bg-green-600">Aprovável</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {validation.canProgress ? (
            <p className="text-sm text-muted-foreground">
              Todos os requisitos foram atendidos. A etapa está pronta para ser aprovada.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Complete os itens abaixo para poder aprovar esta etapa.
              </p>
              {(validation.missingDocuments.length > 0 || validation.missingFormFields.length > 0) && (
                <Button
                  onClick={handleCreateBatchPendings}
                  disabled={isCreatingPending}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {isCreatingPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando pendências...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Criar {validation.missingDocuments.length + validation.missingFormFields.length} Pendência(s) em Lote
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Documentos Obrigatórios */}
      {requiredDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Documentos Obrigatórios ({requiredDocs.length - validation.missingDocuments.length}/{requiredDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requiredDocs.map((docType: string, index: number) => {
                // Buscar TODOS os documentos deste tipo
                const allDocsOfType = documents.filter(d => d.documentType === docType)

                // Prioridade: VALIDATED/APPROVED > PENDING > REJECTED
                const approvedDoc = allDocsOfType.find(d => d.status === 'VALIDATED' || d.status === 'APPROVED')
                const pendingDoc = allDocsOfType.find(d => d.status === 'PENDING')
                const rejectedDoc = allDocsOfType.find(d => d.status === 'REJECTED')

                // Documento para exibir (prioriza aprovado)
                const displayDoc = approvedDoc || pendingDoc || rejectedDoc

                // Estados
                const isApproved = !!approvedDoc
                const isPending = !approvedDoc && !!pendingDoc
                const isRejected = !approvedDoc && !pendingDoc && !!rejectedDoc
                const isMissing = !displayDoc

                // Buscar pendências deste documento
                const docPendings = getPendingsFor('document', docType)
                const hasPending = docPendings.length > 0

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      hasPending
                        ? 'bg-purple-50 border-purple-400'
                        : isApproved
                        ? 'bg-green-50 border-green-300'
                        : isPending
                        ? 'bg-blue-50 border-blue-300'
                        : isRejected
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {hasPending ? (
                          <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        ) : isApproved ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : isPending ? (
                          <Circle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        ) : isRejected ? (
                          <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-sm font-semibold ${
                              hasPending ? 'text-purple-900' : isApproved ? 'text-green-900' : isPending ? 'text-blue-900' : isRejected ? 'text-orange-900' : 'text-red-900'
                            }`}>
                              {docType}
                            </span>
                            {hasPending && (
                              <Badge className="text-xs bg-purple-600 text-white">
                                🔔 {docPendings.length} Pendência{docPendings.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {isApproved && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                                ✓ Aprovado
                              </Badge>
                            )}
                            {isPending && (
                              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                ⏳ Aguardando Análise
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                                ✗ Rejeitado
                              </Badge>
                            )}
                            {isMissing && (
                              <Badge variant="destructive" className="text-xs">
                                ⚠ Faltando
                              </Badge>
                            )}
                          </div>

                          {/* Exibir pendências */}
                          {hasPending && (
                            <div className="mt-3 space-y-2">
                              {docPendings.map((pending) => (
                                <div key={pending.id} className="p-3 bg-white border border-purple-200 rounded-lg">
                                  <p className="text-xs font-medium text-purple-900 mb-1">
                                    📋 {pending.metadata?.title || 'Pendência'}
                                  </p>
                                  <p className="text-xs text-gray-700 mb-2">{pending.description}</p>
                                  {pending.dueDate && (
                                    <p className="text-xs text-gray-500 mb-2">
                                      Prazo: {new Date(pending.dueDate).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}

                                  {/* Área de resolução inline com upload */}
                                  <div className="mt-2 pt-2 border-t border-purple-100 space-y-2">
                                    <p className="text-xs font-medium text-gray-700">Resolver presencialmente:</p>

                                    {/* Upload de arquivo */}
                                    <div className="space-y-2">
                                      <label className="block">
                                        <div className="flex items-center justify-center w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 bg-gray-50 hover:bg-purple-50 transition-colors">
                                          <div className="text-center">
                                            <Upload className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                                            <p className="text-xs text-gray-600">
                                              {selectedFiles[docType]?.name || 'Anexar documento/imagem'}
                                            </p>
                                          </div>
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (file) {
                                                setSelectedFiles(prev => ({
                                                  ...prev,
                                                  [docType]: file
                                                }))
                                              }
                                            }}
                                          />
                                        </div>
                                      </label>

                                      {selectedFiles[docType] && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleUploadDocument(docType, pending.id)}
                                          disabled={uploadingDocType === docType}
                                          className="w-full bg-purple-600 hover:bg-purple-700"
                                        >
                                          {uploadingDocType === docType ? (
                                            <>
                                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                              Enviando...
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="h-3 w-3 mr-1" />
                                              Enviar Documento
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>

                                    {/* OU resolver com texto */}
                                    <div className="relative">
                                      <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200" />
                                      </div>
                                      <div className="relative flex justify-center text-xs">
                                        <span className="bg-white px-2 text-gray-500">ou</span>
                                      </div>
                                    </div>

                                    <Textarea
                                      placeholder="Ex: Cidadão trouxe o documento presencialmente..."
                                      value={pendingResolutions[pending.id] || ''}
                                      onChange={(e) => setPendingResolutions(prev => ({
                                        ...prev,
                                        [pending.id]: e.target.value
                                      }))}
                                      rows={2}
                                      className="text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleResolvePending(pending.id, pendingResolutions[pending.id] || '')}
                                      disabled={!pendingResolutions[pending.id]?.trim() || resolvingPendingId === pending.id}
                                      className="w-full"
                                      variant="outline"
                                    >
                                      {resolvingPendingId === pending.id ? (
                                        <>
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          Resolvendo...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Marcar como Resolvida (Sem Upload)
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {displayDoc && (
                            <div className="text-xs text-muted-foreground space-y-1 mt-2">
                              <p className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {displayDoc.fileName}
                              </p>
                              <p>📏 {(displayDoc.fileSize / 1024).toFixed(2)} KB</p>
                              <p className="text-xs opacity-75">
                                Enviado em {new Date(displayDoc.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                              {isRejected && rejectedDoc?.rejectionReason && (
                                <p className="text-orange-700 font-medium mt-1">
                                  Motivo: {rejectedDoc.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {displayDoc && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(displayDoc.id)}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={isMissing || isRejected ? 'default' : 'outline'}
                          onClick={() => handleOpenPendingModal('document', docType)}
                          className="w-full"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Pendência
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campos Obrigatórios */}
      {requiredFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FormInput className="h-4 w-4" />
              Campos do Formulário ({requiredFields.length - validation.missingFormFields.length}/{requiredFields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requiredFields.map((fieldId: string, index: number) => {
                const fieldValue = formData?.[fieldId]
                const isFilled = fieldValue !== undefined && fieldValue !== null && fieldValue !== ''

                // Buscar pendências deste campo
                const fieldPendings = getPendingsFor('field', fieldId)
                const hasPending = fieldPendings.length > 0

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      hasPending
                        ? 'bg-purple-50 border-purple-400'
                        : isFilled
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {hasPending ? (
                          <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        ) : isFilled ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-sm font-semibold ${
                              hasPending ? 'text-purple-900' : isFilled ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {fieldId}
                            </span>
                            {hasPending && (
                              <Badge className="text-xs bg-purple-600 text-white">
                                🔔 {fieldPendings.length} Pendência{fieldPendings.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {isFilled ? (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                                Preenchido
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                Vazio
                              </Badge>
                            )}
                          </div>

                          {/* Exibir pendências */}
                          {hasPending && (
                            <div className="mt-3 space-y-2">
                              {fieldPendings.map((pending) => (
                                <div key={pending.id} className="p-3 bg-white border border-purple-200 rounded-lg">
                                  <p className="text-xs font-medium text-purple-900 mb-1">
                                    📋 {pending.metadata?.title || 'Pendência'}
                                  </p>
                                  <p className="text-xs text-gray-700 mb-2">{pending.description}</p>
                                  {pending.dueDate && (
                                    <p className="text-xs text-gray-500 mb-2">
                                      Prazo: {new Date(pending.dueDate).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}

                                  {/* Área de edição inline */}
                                  <div className="mt-2 pt-2 border-t border-purple-100 space-y-2">
                                    <p className="text-xs font-medium text-gray-700">Preencher campo presencialmente:</p>
                                    <Input
                                      placeholder="Digite o valor do campo..."
                                      value={editingFieldValues[fieldId] || ''}
                                      onChange={(e) => setEditingFieldValues(prev => ({
                                        ...prev,
                                        [fieldId]: e.target.value
                                      }))}
                                      className="text-sm"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateFieldValue(fieldId, editingFieldValues[fieldId] || '')}
                                      disabled={!editingFieldValues[fieldId]?.trim() || resolvingPendingId === pending.id}
                                      className="w-full"
                                    >
                                      {resolvingPendingId === pending.id ? (
                                        <>
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          Salvando...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Salvar e Resolver Pendência
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {isFilled && (
                            <div className="mt-2 p-2 bg-white rounded border border-green-200">
                              <p className="text-sm text-gray-700 font-mono">
                                {typeof fieldValue === 'object' ? JSON.stringify(fieldValue, null, 2) : String(fieldValue)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPendingModal('field', fieldId)}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Pendência
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {validation.missingFormFields.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900">
                  ℹ️ Os campos do formulário são preenchidos quando o cidadão cria o protocolo.
                  Entre em contato com o cidadão se houver informações faltantes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Área de Interações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />
            Adicionar Comentário ou Interação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="interaction">Mensagem</Label>
            <Textarea
              id="interaction"
              value={interactionText}
              onChange={(e) => setInteractionText(e.target.value)}
              placeholder="Digite seu comentário, observação ou instrução sobre esta etapa..."
              rows={4}
            />
          </div>
          <Button
            onClick={handleSendInteraction}
            disabled={!interactionText.trim() || isSendingInteraction}
            className="w-full"
          >
            {isSendingInteraction ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Interação
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Modal de Criar Pendência */}
      <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Pendência</DialogTitle>
            <DialogDescription>
              Registre uma pendência relacionada a {pendingType === 'document' ? 'este documento' : 'este campo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Item Relacionado</Label>
              <div className="p-3 bg-muted rounded-lg mt-1">
                <p className="text-sm font-medium">{selectedItem}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingType === 'document' ? 'Documento' : 'Campo do Formulário'}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="pending-description">Descrição da Pendência *</Label>
              <Textarea
                id="pending-description"
                value={pendingDescription}
                onChange={(e) => setPendingDescription(e.target.value)}
                placeholder="Descreva o problema ou o que está faltando..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPendingModal(false)}
              disabled={isCreatingPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePending}
              disabled={!pendingDescription.trim() || isCreatingPending}
            >
              {isCreatingPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Pendência'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
