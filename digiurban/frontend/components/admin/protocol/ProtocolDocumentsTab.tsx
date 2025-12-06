'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
} from 'lucide-react'
import {
  ProtocolDocument,
  DocumentStatus,
} from '@/types/protocol-enhancements'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getFullApiUrl } from '@/lib/api-config'
import { buildAbsoluteFromRelative, isImageDoc, isPdfDoc, resolvePreviewUrl } from '@/lib/document-preview'

interface ProtocolDocumentsTabProps {
  protocolId: string
  documents: ProtocolDocument[]
  onRefresh: () => void
}

export function ProtocolDocumentsTab({
  protocolId,
  documents,
  onRefresh,
}: ProtocolDocumentsTabProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewingDoc, setViewingDoc] = useState<ProtocolDocument | null>(null)
  const { toast } = useToast()

  const resolveDirectFileUrl = (doc: ProtocolDocument) => {
    if (!doc.fileUrl) return null
    if (doc.fileUrl.startsWith('http')) return doc.fileUrl
    if (doc.fileUrl.startsWith('/uploads') || doc.fileUrl.startsWith('uploads/')) {
      return buildAbsoluteFromRelative(doc.fileUrl)
    }
    return null
  }

  // FunÃ§Ã£o para gerar URL de download correta
  const getDownloadUrl = (doc: ProtocolDocument, inline = false) => {
    const directUrl = resolveDirectFileUrl(doc)
    if (directUrl) return directUrl
    // Usar helper centralizado para consistência entre dev e produção
    const baseUrl = getFullApiUrl(`/protocols/${protocolId}/documents/${doc.id}/download`)
    const url = inline ? `${baseUrl}?inline=true` : baseUrl

    console.log('[ProtocolDocumentsTab] Download URL:', {
      docId: doc.id,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      mimeType: doc.mimeType,
      inline,
      generatedUrl: url
    })

    return url
  }

  const getPreviewUrl = (doc: ProtocolDocument) => {
    return resolvePreviewUrl(doc, (d) => getDownloadUrl(d, true))
  }

  const getStatusBadge = (status: DocumentStatus) => {
    const statusConfig = {
      [DocumentStatus.PENDING]: {
        icon: Clock,
        label: 'Pendente',
        className: 'bg-gray-100 text-gray-700 border-gray-200',
      },
      [DocumentStatus.UPLOADED]: {
        icon: Upload,
        label: 'Enviado',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      },
      [DocumentStatus.UNDER_REVIEW]: {
        icon: Eye,
        label: 'Em AnÃ¡lise',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      [DocumentStatus.APPROVED]: {
        icon: CheckCircle2,
        label: 'Aprovado',
        className: 'bg-green-100 text-green-700 border-green-200',
      },
      [DocumentStatus.REJECTED]: {
        icon: XCircle,
        label: 'Rejeitado',
        className: 'bg-red-100 text-red-700 border-red-200',
      },
      [DocumentStatus.EXPIRED]: {
        icon: AlertCircle,
        label: 'Expirado',
        className: 'bg-orange-100 text-orange-700 border-orange-200',
      },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setSelectedDocId(docId)
    }
  }

  const handleUpload = async (documentId: string) => {
    if (!selectedFile) return

    try {
      setIsUploading(true)
      // SimulaÃ§Ã£o de upload - implementar integraÃ§Ã£o real
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: 'Documento enviado',
        description: 'O documento foi enviado com sucesso',
      })

      setSelectedFile(null)
      setSelectedDocId(null)
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao enviar documento',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleApprove = async (documentId: string) => {
    try {
      const url = getFullApiUrl(`/protocols/${protocolId}/documents/${documentId}/approve`)
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao aprovar documento')
      }

      toast({
        title: 'Documento aprovado',
        description: 'O documento foi aprovado com sucesso',
      })
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao aprovar documento',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (documentId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Motivo obrigatÃ³rio',
        description: 'Informe o motivo da rejeiÃ§Ã£o',
        variant: 'destructive',
      })
      return
    }

    try {
      const url = getFullApiUrl(`/protocols/${protocolId}/documents/${documentId}/reject`)
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason }),
      })

      if (!response.ok) {
        throw new Error('Erro ao rejeitar documento')
      }

      toast({
        title: 'Documento rejeitado',
        description: 'O documento foi rejeitado',
      })
      setRejectionReason('')
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao rejeitar documento',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    }
  }

  const requiredDocs = documents.filter((d) => d.isRequired)
  const optionalDocs = documents.filter((d) => !d.isRequired)
  const pendingCount = documents.filter(
    (d) => d.status === DocumentStatus.PENDING || d.status === DocumentStatus.UPLOADED
  ).length

  return (
    <div className="space-y-4">
      {/* CabeÃ§alho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            Documentos {pendingCount > 0 && `(${pendingCount} pendentes)`}
          </h3>
        </div>
      </div>

      {/* Documentos ObrigatÃ³rios */}
      {requiredDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Documentos ObrigatÃ³rios
          </h4>
          <div className="space-y-3">
            {requiredDocs.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h5 className="font-medium">{doc.documentType}</h5>
                        {getStatusBadge(doc.status)}
                        <Badge variant="destructive" className="text-xs">
                          ObrigatÃ³rio
                        </Badge>
                      </div>

                      {/* InformaÃ§Ãµes do documento */}
                      <div className="text-sm text-muted-foreground space-y-1">
                        {doc.fileName && (
                          <p>
                            <strong>Arquivo:</strong> {doc.fileName} (
                            {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : ''})
                          </p>
                        )}
                        {doc.uploadedAt && (
                          <p>
                            <strong>Enviado em:</strong>{' '}
                            {format(new Date(doc.uploadedAt), "dd/MM/yyyy 'Ã s' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                        {doc.validatedAt && (
                          <p>
                            <strong>Validado em:</strong>{' '}
                            {format(new Date(doc.validatedAt), "dd/MM/yyyy 'Ã s' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                        {doc.rejectionReason && (
                          <p className="text-red-600">
                            <strong>Motivo da rejeiÃ§Ã£o:</strong> {doc.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* AÃ§Ãµes */}
                    <div className="flex flex-col gap-2 ml-4">
                      {doc.fileUrl && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingDoc(doc)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={getDownloadUrl(doc)}
                              download={doc.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </a>
                          </Button>
                        </div>
                      )}

                      {doc.status === DocumentStatus.PENDING && (
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            onChange={(e) => handleFileSelect(e, doc.id)}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpload(doc.id)}
                            disabled={isUploading || !selectedFile || selectedDocId !== doc.id}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar
                          </Button>
                        </div>
                      )}

                      {doc.status === DocumentStatus.UPLOADED && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => handleApprove(doc.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rejeitar Documento</DialogTitle>
                                <DialogDescription>
                                  Informe o motivo da rejeiÃ§Ã£o do documento
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Motivo da RejeiÃ§Ã£o</Label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Ex: Documento ilegÃ­vel, data expirada..."
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(doc.id)}
                                >
                                  Confirmar RejeiÃ§Ã£o
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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

      {/* Documentos Opcionais */}
      {optionalDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Documentos Opcionais</h4>
          <div className="space-y-3">
            {optionalDocs.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h5 className="font-medium">{doc.documentType}</h5>
                        {getStatusBadge(doc.status)}
                      </div>
                      {doc.fileName && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Arquivo:</strong> {doc.fileName} (
                          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : ''})
                        </p>
                      )}
                      {doc.uploadedAt && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Enviado em:</strong>{' '}
                          {format(new Date(doc.uploadedAt), "dd/MM/yyyy 'Ã s' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      )}
                    </div>

                    {/* AÃ§Ãµes */}
                    <div className="flex flex-col gap-2 ml-4">
                      {doc.fileUrl && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingDoc(doc)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={getDownloadUrl(doc)}
                              download={doc.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </a>
                          </Button>
                        </div>
                      )}

                      {doc.status === DocumentStatus.PENDING && (
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            onChange={(e) => handleFileSelect(e, doc.id)}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpload(doc.id)}
                            disabled={isUploading || !selectedFile || selectedDocId !== doc.id}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar
                          </Button>
                        </div>
                      )}

                      {doc.status === DocumentStatus.UPLOADED && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => handleApprove(doc.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rejeitar Documento</DialogTitle>
                                <DialogDescription>
                                  Informe o motivo da rejeiÃ§Ã£o do documento
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Motivo da RejeiÃ§Ã£o</Label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Ex: Documento ilegÃ­vel, data expirada..."
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(doc.id)}
                                >
                                  Confirmar RejeiÃ§Ã£o
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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

      {documents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum documento requerido para este protocolo</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de VisualizaÃ§Ã£o */}
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {viewingDoc?.documentType}
            </DialogTitle>
            <DialogDescription>
              {viewingDoc?.fileName} â€¢ {getStatusBadge(viewingDoc?.status || DocumentStatus.PENDING)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview do documento */}
            <div className="border rounded-lg p-4 bg-muted/30 min-h-[400px] flex items-center justify-center">
              {isImageDoc(viewingDoc) ? (
                <img
                  src={getPreviewUrl(viewingDoc!)}
                  alt={viewingDoc?.fileName || 'Documento'}
                  className="max-w-full max-h-[500px] object-contain"
                  onError={(e) => {
                    const fallbackUrl = viewingDoc ? getDownloadUrl(viewingDoc, true) : ''
                    if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl
                      return
                    }
                    console.error('[ProtocolDocumentsTab] Erro ao carregar imagem:', {
                      src: e.currentTarget.src,
                      doc: viewingDoc
                    })
                  }}
                  onLoad={() => {
                    console.log('[ProtocolDocumentsTab] Imagem carregada com sucesso:', viewingDoc.fileName)
                  }}
                />
              ) : isPdfDoc(viewingDoc) ? (
                <iframe
                  src={getPreviewUrl(viewingDoc!)}
                  className="w-full h-[500px] rounded"
                  title={viewingDoc.fileName}
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>PrÃ©-visualizaÃ§Ã£o nÃ£o disponÃ­vel para este tipo de arquivo</p>
                  <p className="text-sm mt-2">{viewingDoc?.mimeType}</p>
                </div>
              )}
            </div>

            {/* InformaÃ§Ãµes */}
            {viewingDoc && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tamanho</p>
                  <p className="font-medium">
                    {viewingDoc.fileSize ? `${(viewingDoc.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipo</p>
                  <p className="font-medium">{viewingDoc.mimeType || 'N/A'}</p>
                </div>
                {viewingDoc.uploadedAt && (
                  <div>
                    <p className="text-muted-foreground">Enviado em</p>
                    <p className="font-medium">
                      {format(new Date(viewingDoc.uploadedAt), "dd/MM/yyyy 'Ã s' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {viewingDoc.validatedAt && (
                  <div>
                    <p className="text-muted-foreground">Validado em</p>
                    <p className="font-medium">
                      {format(new Date(viewingDoc.validatedAt), "dd/MM/yyyy 'Ã s' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {viewingDoc?.status === DocumentStatus.UPLOADED && viewingDoc && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    if (viewingDoc) {
                      handleApprove(viewingDoc.id)
                      setViewingDoc(null)
                    }
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar Documento
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rejeitar Documento</DialogTitle>
                      <DialogDescription>
                        Informe o motivo da rejeiÃ§Ã£o
                      </DialogDescription>
                    </DialogHeader>
                    <div>
                      <Label>Motivo da RejeiÃ§Ã£o</Label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Ex: Documento ilegÃ­vel, data expirada..."
                        rows={3}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (viewingDoc) {
                            handleReject(viewingDoc.id)
                            setViewingDoc(null)
                          }
                        }}
                      >
                        Confirmar RejeiÃ§Ã£o
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            {viewingDoc && (
              <Button
                variant="outline"
                asChild
              >
                <a
                  href={getDownloadUrl(viewingDoc)}
                  download={viewingDoc.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}





