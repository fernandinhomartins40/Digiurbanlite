'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Document {
  id: string
  type: string
  fileName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UPLOADED'
  uploadedAt: string
  reviewedAt?: string | null
  rejectionReason?: string | null
  fileUrl?: string
  fileSize?: number | null
  mimeType?: string | null
}

interface CitizenDocumentsTabProps {
  protocolId: string
  documents: Document[]
  onUploadDocument?: (type: string) => void
  onViewDocument?: (doc: Document) => void
  onDownloadDocument?: (doc: Document) => void
}

export function CitizenDocumentsTab({
  protocolId,
  documents,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument
}: CitizenDocumentsTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        )
      case 'UPLOADED':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Enviado
          </Badge>
        )
      case 'PENDING':
      default:
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendente de Análise
          </Badge>
        )
    }
  }

  // Agrupar documentos por tipo
  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = []
    }
    acc[doc.type].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Nenhum documento enviado
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Você ainda não enviou documentos para este protocolo
          </p>
          {onUploadDocument && (
            <Button onClick={() => onUploadDocument('general')}>
              <Upload className="h-4 w-4 mr-2" />
              Enviar Documento
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedDocs).map(([type, docs]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <Badge variant="outline" className="ml-2">
                {docs.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600 shrink-0" />
                      <span className="font-medium text-gray-900 truncate">
                        {doc.fileName}
                      </span>
                      {getStatusBadge(doc.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Enviado: {format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                      {doc.reviewedAt && (
                        <span>
                          Analisado: {format(new Date(doc.reviewedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      )}
                    </div>

                    {doc.status === 'REJECTED' && doc.rejectionReason && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-900 mb-1">
                            Motivo da Rejeição:
                          </p>
                          <p className="text-sm text-red-800">{doc.rejectionReason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onViewDocument && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDocument(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onDownloadDocument && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadDocument(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {doc.status === 'REJECTED' && onUploadDocument && (
                      <Button
                        size="sm"
                        onClick={() => onUploadDocument(doc.type)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Reenviar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Botão para adicionar mais documentos */}
      {onUploadDocument && (
        <Card>
          <CardContent className="p-6 text-center">
            <Button
              onClick={() => onUploadDocument('general')}
              variant="outline"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Enviar Novo Documento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
