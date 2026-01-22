'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileCheck,
  Download,
  Eye,
  Printer,
  Calendar,
  Shield,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GeneratedDocument {
  id: string
  type: string
  name: string
  generatedAt: string
  expiresAt?: string | null
  validationCode?: string | null
  fileUrl?: string
  metadata?: Record<string, any>
}

interface CitizenGeneratedDocumentsTabProps {
  generatedDocuments: GeneratedDocument[]
  onDownload?: (doc: GeneratedDocument) => void
  onView?: (doc: GeneratedDocument) => void
  onPrint?: (doc: GeneratedDocument) => void
}

export function CitizenGeneratedDocumentsTab({
  generatedDocuments,
  onDownload,
  onView,
  onPrint
}: CitizenGeneratedDocumentsTabProps) {
  if (generatedDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileCheck className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Nenhum documento gerado
          </p>
          <p className="text-sm text-gray-500">
            Quando seu protocolo for concluído, os documentos gerados aparecerão aqui
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {generatedDocuments.map((doc) => {
        const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date()

        return (
          <Card key={doc.id} className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
                    <FileCheck className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-green-900 mb-1">
                      {doc.name}
                    </CardTitle>
                    <p className="text-sm text-green-700">
                      {doc.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                </div>
                {isExpired ? (
                  <Badge variant="destructive">Expirado</Badge>
                ) : (
                  <Badge className="bg-green-600 text-white">Válido</Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* Informações do Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600">Data de Emissão</p>
                    <p className="text-base text-gray-900">
                      {format(new Date(doc.generatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {doc.expiresAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600">Validade</p>
                      <p className={`text-base ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                        {isExpired
                          ? 'Expirado'
                          : format(new Date(doc.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                {!doc.expiresAt && (
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600">Validade</p>
                      <p className="text-base text-green-700 font-medium">Indeterminada</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Código de Validação */}
              {doc.validationCode && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Código de Validação
                      </p>
                      <p className="text-lg font-mono font-bold text-gray-900">
                        {doc.validationCode}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Use este código para validar a autenticidade do documento
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadados Adicionais - Filtrados */}
              {doc.metadata && Object.keys(doc.metadata).length > 0 && (() => {
                // Filtrar apenas campos relevantes e de valor simples
                const relevantFields = ['template', 'templateVersion', 'protocolo'];
                const filteredMetadata = Object.entries(doc.metadata)
                  .filter(([key, value]) => {
                    // Incluir apenas campos relevantes
                    if (!relevantFields.includes(key)) return false;
                    // Excluir valores complexos (arrays, objetos)
                    if (typeof value === 'object') return false;
                    return true;
                  });

                if (filteredMetadata.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Informações Adicionais</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredMetadata.map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-gray-900 font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {onDownload && (
                  <Button
                    onClick={() => onDownload(doc)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                )}
                {onView && (
                  <Button
                    variant="outline"
                    onClick={() => onView(doc)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                )}
                {onPrint && (
                  <Button
                    variant="outline"
                    onClick={() => onPrint(doc)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Informações sobre validação */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Sobre os Documentos Gerados
              </p>
              <p className="text-sm text-blue-800">
                Os documentos gerados possuem validade legal e podem ser validados através do código fornecido.
                Guarde-os em local seguro e faça cópias quando necessário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
