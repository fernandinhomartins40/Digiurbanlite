'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  FormInput,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { StageStatus } from '@/types/protocol-enhancements'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { completeStage } from '@/services/protocol-stages.service'
import { useToast } from '@/hooks/use-toast'

interface CurrentStageHighlightProps {
  protocolId: string
  currentStage: {
    id: string
    stageName: string
    stageOrder: number
    status: string
    metadata?: any
  }
  totalStages: number
  onNavigateToDocuments: () => void
  onNavigateToChecklist: () => void
}

interface StageValidation {
  canProgress: boolean
  blockers: string[]
  warnings: string[]
  missingDocuments: string[]
  missingFormFields: string[]
}

export function CurrentStageHighlight({
  protocolId,
  currentStage,
  totalStages,
  onNavigateToDocuments,
  onNavigateToChecklist
}: CurrentStageHighlightProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [validation, setValidation] = useState<StageValidation | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const progressPercentage = ((currentStage.stageOrder - 1) / (totalStages - 1)) * 100

  useEffect(() => {
    loadValidation()
  }, [currentStage.id])

  const loadValidation = async () => {
    try {
      setIsValidating(true)
      const response = await apiRequest(`/protocols/${protocolId}/stages/${currentStage.id}/validate`)

      if (response.success) {
        setValidation(response.data.validation)
      }
    } catch (error) {
      console.error('Erro ao carregar validação:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleApproveAndAdvance = async () => {
    try {
      setIsCompleting(true)

      await completeStage(protocolId, currentStage.id, {
        notes: 'Etapa aprovada e avançada automaticamente'
      })

      toast({
        title: 'Etapa aprovada!',
        description: `A etapa "${currentStage.stageName}" foi aprovada com sucesso.`
      })

      // Recarregar a página para mostrar a próxima etapa
      window.location.reload()
    } catch (error) {
      console.error('Erro ao aprovar etapa:', error)
      toast({
        title: 'Erro ao aprovar etapa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const hasPendings = validation && (
    validation.missingDocuments.length > 0 ||
    validation.missingFormFields.length > 0 ||
    validation.blockers.length > 0
  )

  return (
    <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-xl">🎯 Etapa Atual</CardTitle>
              <Badge variant="default" className="bg-blue-600">
                {currentStage.stageOrder} de {totalStages}
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-blue-900">{currentStage.stageName}</h3>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progresso do Workflow</span>
            <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status de Validação */}
        {isValidating ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-muted-foreground">Verificando pendências...</span>
          </div>
        ) : validation ? (
          <>
            {/* Status Geral */}
            <div className={`p-4 rounded-lg border-2 ${
              validation.canProgress
                ? 'bg-green-50 border-green-300'
                : 'bg-amber-50 border-amber-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {validation.canProgress ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">
                      Pronto para aprovar esta etapa!
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-amber-900">
                      Pendências que precisam ser resolvidas:
                    </span>
                  </>
                )}
              </div>

              {!validation.canProgress && (
                <div className="mt-3 space-y-3">
                  {/* Documentos Faltantes */}
                  {validation.missingDocuments.length > 0 && (
                    <div className="p-3 bg-white rounded border border-amber-200">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-amber-700 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-amber-900 mb-1">
                            {validation.missingDocuments.length} documento(s) faltando:
                          </p>
                          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                            {validation.missingDocuments.map((doc, i) => (
                              <li key={i}>{doc}</li>
                            ))}
                          </ul>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-2 text-blue-600"
                            onClick={onNavigateToDocuments}
                          >
                            Ir para Documentos <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campos Faltantes */}
                  {validation.missingFormFields.length > 0 && (
                    <div className="p-3 bg-white rounded border border-amber-200">
                      <div className="flex items-start gap-2">
                        <FormInput className="h-4 w-4 text-amber-700 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-amber-900 mb-1">
                            {validation.missingFormFields.length} campo(s) não preenchido(s):
                          </p>
                          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                            {validation.missingFormFields.map((field, i) => (
                              <li key={i}>{field}</li>
                            ))}
                          </ul>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-2 text-blue-600"
                            onClick={onNavigateToChecklist}
                          >
                            Ver Checklist <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Outros Bloqueios */}
                  {validation.blockers.filter(b =>
                    !b.includes('Documentos') && !b.includes('Campos')
                  ).map((blocker, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-amber-200">
                      <p className="text-sm text-amber-900">{blocker}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            {validation.canProgress && currentStage.status === StageStatus.IN_PROGRESS && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                  onClick={handleApproveAndAdvance}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aprovando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Aprovar e Avançar
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Mensagem quando stage está concluída */}
            {currentStage.status === StageStatus.COMPLETED && (
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">
                    Esta etapa já foi concluída!
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-6 text-muted-foreground">
            <p>Carregue a validação para ver as pendências</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
