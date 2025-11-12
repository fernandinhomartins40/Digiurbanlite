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
  const { toast } = useToast()

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
        label: 'Em Análise',
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
      // Simulação de upload - implementar integração real
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
      // Implementar chamada à API
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
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da rejeição',
        variant: 'destructive',
      })
      return
    }

    try {
      // Implementar chamada à API
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
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            Documentos {pendingCount > 0 && `(${pendingCount} pendentes)`}
          </h3>
        </div>
      </div>

      {/* Documentos Obrigatórios */}
      {requiredDocs.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Documentos Obrigatórios
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
                          Obrigatório
                        </Badge>
                      </div>

                      {/* Informações do documento */}
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
                            {format(new Date(doc.uploadedAt), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                        {doc.validatedAt && (
                          <p>
                            <strong>Validado em:</strong>{' '}
                            {format(new Date(doc.validatedAt), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                        {doc.rejectionReason && (
                          <p className="text-red-600">
                            <strong>Motivo da rejeição:</strong> {doc.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 ml-4">
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
                          <Button size="sm" variant="outline" onClick={() => handleApprove(doc.id)}>
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
                                  Informe o motivo da rejeição do documento
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Motivo da Rejeição</Label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Ex: Documento ilegível, data expirada..."
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleReject(doc.id)}
                                >
                                  Confirmar Rejeição
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {doc.fileUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </a>
                        </Button>
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
                        <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                      )}
                    </div>
                    {doc.fileUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </a>
                      </Button>
                    )}
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
    </div>
  )
}
