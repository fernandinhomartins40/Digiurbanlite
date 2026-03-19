'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Download, Eye, FilePlus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getFullApiUrl } from '@/lib/api-config'

interface GeneratedDocument {
  id: string
  name?: string
  documentType?: string
  fileUrl?: string
  filePath?: string
  createdAt?: string
  status?: string
  isSigned?: boolean
  publishedAt?: string
}

interface ProtocolGeneratedDocumentsTabProps {
  generatedDocuments: GeneratedDocument[]
}

export function ProtocolGeneratedDocumentsTab({
  generatedDocuments
}: ProtocolGeneratedDocumentsTabProps) {
  return (
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
                        {doc.name || doc.documentType || 'Documento gerado'}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          doc.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : doc.status === 'SIGNED'
                              ? 'bg-blue-100 text-blue-700'
                              : doc.status === 'SUPERSEDED'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {doc.status === 'PUBLISHED'
                          ? 'Publicado'
                          : doc.status === 'SIGNED'
                            ? 'Assinado'
                            : doc.status === 'SUPERSEDED'
                              ? 'Substituído'
                              : 'Pendente assinatura'}
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
      </CardContent>
    </Card>
  )
}
