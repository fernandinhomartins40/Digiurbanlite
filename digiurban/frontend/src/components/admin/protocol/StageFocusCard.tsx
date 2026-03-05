'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Target,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  FormInput,
  Building2,
  UserRound,
  Shield
} from 'lucide-react'
import type { ProtocolStageMetadata } from '@/types/protocol-enhancements'

interface StageFocusCardProps {
  currentStage: {
    id: string
    stageName: string
    stageOrder: number
    status: string
    metadata?: ProtocolStageMetadata
    dueDate?: Date | string
  }
  totalStages: number
  validation?: {
    canProgress: boolean
    blockers: string[]
    missingDocuments: string[]
    missingFormFields: string[]
  }
  documents?: any[]
  pendings?: any[]
}

export function StageFocusCard({
  currentStage,
  totalStages,
  validation,
  documents = [],
  pendings = []
}: StageFocusCardProps) {
  const requiredDocs = currentStage.metadata?.requiredDocumentTypes || []
  const requiredFields = currentStage.metadata?.requiredInputFieldIds || []
  const allowedActions = currentStage.metadata?.allowedActions || []
  const supportAssignments = currentStage.metadata?.stageSupportAssignments || []
  const requiredExecutionAssignments = supportAssignments.filter(assignment => assignment.mode === 'REQUIRED_EXECUTION')
  const suggestedAssignments = supportAssignments.filter(assignment => assignment.mode === 'SUGGEST_ASSIGNMENT')
  const referenceAssignments = supportAssignments.filter(assignment => assignment.mode === 'REFERENCE_ONLY')

  // Calcular documentos pendentes
  const approvedDocs = documents.filter(d =>
    requiredDocs.includes(d.documentType) && d.status === 'APPROVED'
  ).length
  const pendingDocs = requiredDocs.length - approvedDocs

  // Pendências abertas
  const openPendings = pendings.filter(p =>
    p.status === 'OPEN' || p.status === 'IN_PROGRESS'
  ).length

  // Calcular prazo restante
  const getDaysRemaining = () => {
    if (!currentStage.dueDate) return null

    const due = typeof currentStage.dueDate === 'string'
      ? new Date(currentStage.dueDate)
      : currentStage.dueDate

    const now = new Date()
    const diff = due.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    return days
  }

  const daysRemaining = getDaysRemaining()

  // Determinar ação necessária
  const getRequiredAction = () => {
    if (validation && !validation.canProgress) {
      if (validation.missingDocuments.length > 0) {
        return `Verificar ${validation.missingDocuments.length} documento(s)`
      }
      if (validation.missingFormFields.length > 0) {
        return `Preencher ${validation.missingFormFields.length} campo(s)`
      }
      if (validation.blockers.length > 0) {
        return validation.blockers[0]
      }
    }

    if (allowedActions.includes('APPROVE')) {
      return 'Revisar e aprovar etapa'
    }

    return 'Processar solicitação'
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Target className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-blue-900">
                    Você está em: "{currentStage.stageName}"
                  </h3>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
                    Etapa {currentStage.stageOrder}/{totalStages}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Informações da Etapa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Ação Necessária */}
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-blue-600 font-medium">Ação Necessária</p>
                <p className="text-sm text-blue-900 font-semibold truncate">
                  {getRequiredAction()}
                </p>
              </div>
            </div>

            {/* Prazo */}
            {daysRemaining !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-blue-600 font-medium">Prazo desta Etapa</p>
                  <p className={`text-sm font-semibold ${
                    daysRemaining < 0 ? 'text-red-600' :
                    daysRemaining <= 1 ? 'text-orange-600' : 'text-blue-900'
                  }`}>
                    {daysRemaining < 0 ? `${Math.abs(daysRemaining)} dia(s) atrasado` :
                     daysRemaining === 0 ? 'Vence hoje' :
                     daysRemaining === 1 ? '1 dia restante' :
                     `${daysRemaining} dias restantes`}
                  </p>
                </div>
              </div>
            )}

            {/* Documentos */}
            {requiredDocs.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-blue-600 font-medium">Documentos</p>
                  <p className="text-sm text-blue-900 font-semibold">
                    {approvedDocs}/{requiredDocs.length} aprovados
                    {pendingDocs > 0 && (
                      <span className="text-orange-600"> ({pendingDocs} pendente{pendingDocs > 1 ? 's' : ''})</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Pendências */}
            {openPendings > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-orange-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-orange-600 font-medium">Pendências Ativas</p>
                  <p className="text-sm text-orange-900 font-semibold">
                    {openPendings} pendência{openPendings > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Status OK */}
            {validation?.canProgress && openPendings === 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-green-600 font-medium">Status</p>
                  <p className="text-sm text-green-900 font-semibold">
                    Pronto para aprovar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Alertas de Bloqueio */}
          {validation && validation.blockers.length > 0 && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Impedimento:</span>{' '}
                {validation.blockers[0]}
                {validation.blockers.length > 1 && (
                  <span className="text-xs ml-2">
                    (+{validation.blockers.length - 1} outro{validation.blockers.length > 2 ? 's' : ''})
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Campos Obrigatórios desta Etapa */}
          {(requiredDocs.length > 0 || requiredFields.length > 0) && (
            <div className="pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-2">
                Requisitos desta etapa:
              </p>
              <div className="flex flex-wrap gap-2">
                {requiredDocs.slice(0, 5).map((doc, i) => {
                  const isApproved = documents.some(d =>
                    d.documentType === doc && d.status === 'APPROVED'
                  )
                  return (
                    <Badge
                      key={i}
                      variant="outline"
                      className={`text-xs ${
                        isApproved
                          ? 'bg-green-50 text-green-700 border-green-300'
                          : 'bg-orange-50 text-orange-700 border-orange-300'
                      }`}
                    >
                      {isApproved ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                      {doc}
                    </Badge>
                  )
                })}
                {requiredDocs.length > 5 && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    +{requiredDocs.length - 5} doc{requiredDocs.length - 5 > 1 ? 's' : ''}
                  </Badge>
                )}
                {requiredFields.slice(0, 3).map((field, i) => (
                  <Badge
                    key={`field-${i}`}
                    variant="outline"
                    className="text-xs bg-purple-50 text-purple-700 border-purple-300"
                  >
                    <FormInput className="h-3 w-3 mr-1" />
                    {field}
                  </Badge>
                ))}
                {requiredFields.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                    +{requiredFields.length - 3} campo{requiredFields.length - 3 > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {supportAssignments.length > 0 && (
            <div className="pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-700 font-medium mb-2">
                Execução e referências da etapa:
              </p>
              <div className="flex flex-wrap gap-2">
                {requiredExecutionAssignments.map((assignment, index) => (
                  <Badge
                    key={assignment.id || `${assignment.targetType}-${assignment.userId || assignment.departmentId || assignment.organizationalUnitId || index}`}
                    variant="outline"
                    className="text-xs bg-red-50 text-red-700 border-red-300"
                  >
                    {assignment.targetType === 'USER' ? (
                      <UserRound className="h-3 w-3 mr-1" />
                    ) : assignment.targetType === 'DEPARTMENT' ? (
                      <Shield className="h-3 w-3 mr-1" />
                    ) : (
                      <Building2 className="h-3 w-3 mr-1" />
                    )}
                    Obrigatório: {assignment.userName || assignment.departmentName || assignment.organizationalUnitName}
                  </Badge>
                ))}
                {suggestedAssignments.map((assignment, index) => (
                  <Badge
                    key={assignment.id || `${assignment.targetType}-${assignment.userId || assignment.departmentId || assignment.organizationalUnitId || index}-suggested`}
                    variant="outline"
                    className="text-xs bg-amber-50 text-amber-700 border-amber-300"
                  >
                    {assignment.targetType === 'USER' ? (
                      <UserRound className="h-3 w-3 mr-1" />
                    ) : assignment.targetType === 'DEPARTMENT' ? (
                      <Shield className="h-3 w-3 mr-1" />
                    ) : (
                      <Building2 className="h-3 w-3 mr-1" />
                    )}
                    Sugestão: {assignment.userName || assignment.departmentName || assignment.organizationalUnitName}
                  </Badge>
                ))}
                {referenceAssignments.map((assignment, index) => (
                  <Badge
                    key={assignment.id || `${assignment.targetType}-${assignment.userId || assignment.departmentId || assignment.organizationalUnitId || index}-reference`}
                    variant="outline"
                    className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300"
                  >
                    {assignment.targetType === 'USER' ? (
                      <UserRound className="h-3 w-3 mr-1" />
                    ) : assignment.targetType === 'DEPARTMENT' ? (
                      <Shield className="h-3 w-3 mr-1" />
                    ) : (
                      <Building2 className="h-3 w-3 mr-1" />
                    )}
                    Referência: {assignment.userName || assignment.departmentName || assignment.organizationalUnitName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
