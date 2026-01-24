'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Circle,
  FileText,
  FormInput,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { StageStatus } from '@/types/protocol-enhancements'

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
  const [validation, setValidation] = useState<StageValidation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentStage?.id) {
      loadValidation()
    }
  }, [currentStage?.id])

  const loadValidation = async () => {
    if (!currentStage) return

    try {
      setIsLoading(true)
      const response = await apiRequest(
        `/protocols/${protocolId}/stages/${currentStage.id}/validate`
      )

      if (response.success) {
        setValidation(response.data.validation)
      }
    } catch (error) {
      console.error('Erro ao carregar validação:', error)
    } finally {
      setIsLoading(false)
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
        <CardContent>
          {validation.canProgress ? (
            <p className="text-sm text-muted-foreground">
              Todos os requisitos foram atendidos. A etapa está pronta para ser aprovada.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete os itens abaixo para poder aprovar esta etapa.
            </p>
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
            <div className="space-y-2">
              {requiredDocs.map((docType: string, index: number) => {
                const isMissing = validation.missingDocuments.includes(docType)
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isMissing
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isMissing ? (
                        <Circle className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        isMissing ? 'text-red-900' : 'text-green-900'
                      }`}>
                        {docType}
                      </span>
                    </div>
                    {isMissing && (
                      <Badge variant="destructive" className="text-xs">
                        Faltando
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>

            {validation.missingDocuments.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={onNavigateToDocuments}
              >
                Ir para Documentos <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Campos Obrigatórios */}
      {requiredFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FormInput className="h-4 w-4" />
              Campos Obrigatórios ({requiredFields.length - validation.missingFormFields.length}/{requiredFields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {requiredFields.map((fieldId: string, index: number) => {
                const isMissing = validation.missingFormFields.some(f =>
                  f.toLowerCase().includes(fieldId.toLowerCase())
                )
                const fieldLabel = validation.missingFormFields.find(f =>
                  f.toLowerCase().includes(fieldId.toLowerCase())
                ) || fieldId

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isMissing
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isMissing ? (
                        <Circle className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        isMissing ? 'text-red-900' : 'text-green-900'
                      }`}>
                        {isMissing ? fieldLabel : fieldId}
                      </span>
                    </div>
                    {isMissing && (
                      <Badge variant="destructive" className="text-xs">
                        Não preenchido
                      </Badge>
                    )}
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

      {/* Outros Bloqueios */}
      {validation.blockers.filter(b =>
        !b.includes('Documentos') && !b.includes('Campos')
      ).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-700">
              <AlertCircle className="h-4 w-4" />
              Outros Impedimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validation.blockers
                .filter(b => !b.includes('Documentos') && !b.includes('Campos'))
                .map((blocker, i) => (
                  <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-900">{blocker}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
