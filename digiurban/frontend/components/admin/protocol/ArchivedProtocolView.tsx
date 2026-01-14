'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Archive,
  Clock,
  FileText,
  FilePlus,
  MessageSquare,
  Users,
  RotateCcw,
  Download,
  XCircle,
  Calendar,
  TrendingUp,
  Eye
} from 'lucide-react'
import { ProtocolTimeline } from './ProtocolTimeline'
import { DocumentViewerModal } from './DocumentViewerModal'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'

interface ArchivedProtocolViewProps {
  protocol: {
    id: string
    protocolNumber: string
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    completedAt?: Date | string
    cancelledAt?: Date | string
    citizen?: {
      id: string
      name: string
      email?: string
      cpf: string
    }
    service?: {
      id: string
      name: string
      department?: {
        id: string
        name: string
      }
    }
  }
  stages: any[]
  documents: any[]
  generatedDocuments?: any[]
  pendings: any[]
  interactions: any[]
  citizenLinks: any[]
  onReopen?: () => void
}

export function ArchivedProtocolView({
  protocol,
  stages,
  documents,
  generatedDocuments = [],
  pendings,
  interactions,
  citizenLinks,
  onReopen
}: ArchivedProtocolViewProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'generated' | 'communication' | 'involved'>('timeline')
  const [isReopening, setIsReopening] = useState(false)
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean
    documentUrl: string
    documentName: string
    documentType?: string
    downloadUrl?: string
  }>({
    isOpen: false,
    documentUrl: '',
    documentName: '',
    documentType: undefined,
    downloadUrl: undefined
  })

  const isCancelled = protocol.status === 'CANCELADO'
  const isCompleted = protocol.status === 'CONCLUIDO'

  // Estatísticas
  const totalDays = protocol.completedAt || protocol.cancelledAt
    ? Math.ceil(
        (new Date(protocol.completedAt || protocol.cancelledAt!).getTime() -
          new Date(protocol.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  const completedStages = stages.filter(s => s.status === 'COMPLETED').length
  const approvedDocs = documents.filter(d => d.status === 'APPROVED').length
  const rejectedDocs = documents.filter(d => d.status === 'REJECTED').length
  const generatedDocsCount = generatedDocuments.length
  const totalInteractions = interactions.length
  const citizenMessages = interactions.filter(i => i.isFromCitizen).length

  // Documentos recebidos (todos os documentos são recebidos, não há mais flag isGenerated)
  const receivedDocuments = documents

  // Pessoas envolvidas (servidores únicos + cidadão principal + vínculos)
  const involvedPeople = (() => {
    const people = new Map<string, any>()

    // Cidadão principal
    if (protocol.citizen) {
      people.set(protocol.citizen.id, {
        id: protocol.citizen.id,
        name: protocol.citizen.name,
        role: 'Cidadão Principal',
        email: protocol.citizen.email
      })
    }

    // Cidadãos vinculados
    citizenLinks.forEach(link => {
      if (link.linkedCitizen) {
        people.set(link.linkedCitizen.id, {
          id: link.linkedCitizen.id,
          name: link.linkedCitizen.name,
          role: link.relationshipType,
          email: link.linkedCitizen.email
        })
      }
    })

    // Servidores que atuaram nas etapas
    stages.forEach(stage => {
      if (stage.assignedTo) {
        people.set(stage.assignedTo.id, {
          id: stage.assignedTo.id,
          name: stage.assignedTo.name,
          role: 'Servidor',
          stages: [...(people.get(stage.assignedTo.id)?.stages || []), stage.stageName]
        })
      }
    })

    // Servidores que revisaram documentos
    documents.forEach(doc => {
      if (doc.reviewedBy) {
        people.set(doc.reviewedBy.id, {
          id: doc.reviewedBy.id,
          name: doc.reviewedBy.name,
          role: 'Servidor',
          actions: [...(people.get(doc.reviewedBy.id)?.actions || []), `Revisou documento: ${doc.documentType}`]
        })
      }
    })

    return Array.from(people.values())
  })()

  const handleReopen = async () => {
    if (!onReopen) return

    setIsReopening(true)
    try {
      const result = await apiRequest(`/protocols/${protocol.id}/reopen`, {
        method: 'POST'
      })

      if (result.success) {
        toast({
          title: 'Protocolo reaberto',
          description: 'O protocolo foi reaberto com sucesso'
        })
        onReopen()
      } else {
        throw new Error(result.error || 'Erro ao reabrir')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao reabrir',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsReopening(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const reportUrl = `${apiUrl}/protocols/${protocol.id}/report?format=json`

      // Fazer requisição autenticada
      const response = await fetch(reportUrl, {
        credentials: 'include' // Incluir cookies de autenticação
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório')
      }

      // Obter o blob do arquivo
      const blob = await response.blob()

      // Criar URL temporária e fazer download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `protocolo_${protocol.protocolNumber || protocol.id}_relatorio.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Relatório gerado',
        description: 'O relatório completo foi baixado com sucesso'
      })
    } catch (error: any) {
      console.error('Erro ao baixar relatório:', error)
      toast({
        title: 'Erro ao gerar relatório',
        description: error.message || 'Não foi possível gerar o relatório',
        variant: 'destructive'
      })
    }
  }

  const handleViewDocument = (doc: any, isGenerated: boolean = false) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
    const viewUrl = isGenerated
      ? `${apiUrl}/generated-documents/${doc.id}/download?inline=true`
      : `${apiUrl}/protocols/${protocol.id}/documents/${doc.id}/download?inline=true`

    const downloadUrl = isGenerated
      ? `${apiUrl}/generated-documents/${doc.id}/download`
      : `${apiUrl}/protocols/${protocol.id}/documents/${doc.id}/download`

    setViewerState({
      isOpen: true,
      documentUrl: viewUrl,
      documentName: doc.fileName || doc.documentType || 'Documento',
      documentType: doc.mimeType,
      downloadUrl: downloadUrl
    })
  }

  const handleCloseViewer = () => {
    setViewerState({
      isOpen: false,
      documentUrl: '',
      documentName: '',
      documentType: undefined,
      downloadUrl: undefined
    })
  }

  const handleDownloadDocument = () => {
    if (viewerState.downloadUrl) {
      window.open(viewerState.downloadUrl, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Arquivado */}
      <Card className={`border-2 ${isCancelled ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
              isCancelled ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              {isCancelled ? (
                <XCircle className="h-6 w-6 text-red-600" />
              ) : (
                <Archive className="h-6 w-6 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className={`text-xl font-semibold ${
                  isCancelled ? 'text-red-900' : 'text-gray-900'
                }`}>
                  Protocolo {isCancelled ? 'Cancelado' : 'Concluído'}
                </h2>
                <Badge variant={isCancelled ? 'destructive' : 'outline'} className="text-xs">
                  Arquivado
                </Badge>
              </div>
              <p className={`text-sm ${isCancelled ? 'text-red-700' : 'text-gray-700'}`}>
                Este protocolo foi {isCancelled ? 'cancelado' : 'concluído'} em{' '}
                {format(
                  new Date(protocol.completedAt || protocol.cancelledAt || protocol.updatedAt),
                  "dd/MM/yyyy 'às' HH:mm",
                  { locale: ptBR }
                )}
              </p>
            </div>
            {onReopen && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReopen}
                disabled={isReopening}
              >
                {isReopening ? (
                  <>Reabrindo...</>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reabrir
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Estatísticas do Protocolo
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Relatório Completo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{totalDays}</p>
              <p className="text-xs text-gray-600 mt-1">Dias Totais</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{completedStages}</p>
              <p className="text-xs text-gray-600 mt-1">Etapas</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <p className="text-2xl font-bold text-emerald-700">{approvedDocs}</p>
              <p className="text-xs text-gray-600 mt-1">Docs Aprovados</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-700">{generatedDocsCount}</p>
              <p className="text-xs text-gray-600 mt-1">Docs Gerados</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-700">{totalInteractions}</p>
              <p className="text-xs text-gray-600 mt-1">Interações</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-700">{involvedPeople.length}</p>
              <p className="text-xs text-gray-600 mt-1">Envolvidos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Visualização Histórica */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm mb-4">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Docs Recebidos</span>
            <Badge variant="outline" className="ml-auto text-xs">{receivedDocuments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="generated" className="flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Docs Gerados</span>
            <Badge variant="outline" className="ml-auto text-xs">{generatedDocuments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Comunicação</span>
            <Badge variant="outline" className="ml-auto text-xs">{totalInteractions}</Badge>
          </TabsTrigger>
          <TabsTrigger value="involved" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Envolvidos</span>
            <Badge variant="outline" className="ml-auto text-xs">{involvedPeople.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Timeline */}
        <TabsContent value="timeline">
          <ProtocolTimeline
            protocol={protocol}
            stages={stages}
            documents={documents}
            pendings={pendings}
            interactions={interactions}
            citizenLinks={citizenLinks}
            exportable={true}
          />
        </TabsContent>

        {/* Tab: Documentos Recebidos */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos Recebidos do Cidadão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {receivedDocuments.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">
                  Nenhum documento foi recebido
                </p>
              ) : (
                <div className="space-y-3">
                  {receivedDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-lg border ${
                        doc.status === 'APPROVED'
                          ? 'bg-green-50 border-green-200'
                          : doc.status === 'REJECTED'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <p className="text-sm font-medium text-gray-900">
                              {doc.documentType}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                doc.status === 'APPROVED'
                                  ? 'bg-green-100 text-green-700'
                                  : doc.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {doc.status === 'APPROVED' ? 'Aprovado' : doc.status === 'REJECTED' ? 'Rejeitado' : doc.status}
                            </Badge>
                          </div>
                          {doc.uploadedAt && (
                            <p className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                              <Calendar className="h-3 w-3" />
                              Enviado em: {format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          )}
                          {doc.rejectionReason && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertDescription className="text-xs">
                                Motivo da rejeição: {doc.rejectionReason}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        {doc.fileUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(doc, false)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos Gerados */}
        <TabsContent value="generated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FilePlus className="h-4 w-4" />
                Documentos Gerados pelo Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedDocuments.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">
                  Nenhum documento foi gerado
                </p>
              ) : (
                <div className="space-y-3">
                  {generatedDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-lg border bg-purple-50 border-purple-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FilePlus className="h-4 w-4 text-purple-600" />
                            <p className="text-sm font-medium text-gray-900">
                              {doc.documentType}
                            </p>
                            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                              Gerado
                            </Badge>
                          </div>
                          {doc.createdAt && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Gerado em: {format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {(doc.fileUrl || doc.filePath) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDocument(doc, true)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
                                  const downloadUrl = `${apiUrl}/generated-documents/${doc.id}/download`
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Comunicação */}
        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Histórico de Comunicação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">
                  Nenhuma comunicação registrada
                </p>
              ) : (
                <div className="space-y-3">
                  {interactions
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(interaction => (
                      <div
                        key={interaction.id}
                        className={`p-4 rounded-lg border ${
                          interaction.isFromCitizen
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <MessageSquare className={`h-5 w-5 shrink-0 ${
                            interaction.isFromCitizen ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900">
                                {interaction.sender?.name || (interaction.isFromCitizen ? 'Cidadão' : 'Sistema')}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {interaction.isFromCitizen ? 'Cidadão' : 'Servidor'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                              {interaction.message}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(interaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pessoas Envolvidas */}
        <TabsContent value="involved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pessoas Envolvidas no Protocolo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {involvedPeople.map(person => (
                  <div
                    key={person.id}
                    className="p-4 rounded-lg border bg-gray-50 border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-gray-300 shrink-0">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {person.name}
                        </p>
                        <Badge variant="outline" className="text-xs mb-2">
                          {person.role}
                        </Badge>
                        {person.email && (
                          <p className="text-xs text-gray-600 mb-1">
                            E-mail: {person.email}
                          </p>
                        )}
                        {person.stages && person.stages.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">Etapas atendidas:</p>
                            <div className="flex flex-wrap gap-1">
                              {person.stages.map((stage: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  {stage}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização de Documentos */}
      <DocumentViewerModal
        isOpen={viewerState.isOpen}
        onClose={handleCloseViewer}
        documentUrl={viewerState.documentUrl}
        documentName={viewerState.documentName}
        documentType={viewerState.documentType}
        onDownload={viewerState.downloadUrl ? handleDownloadDocument : undefined}
      />
    </div>
  )
}
