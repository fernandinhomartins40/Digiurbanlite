'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  FormInput,
  XCircle,
  Clock
} from 'lucide-react'

interface ValidationAlertProps {
  validation: {
    canProgress: boolean
    blockers: string[]
    warnings: string[]
    missingDocuments: string[]
    awaitingReviewDocuments?: string[]
    rejectedDocuments?: string[]
    missingFormFields: string[]
  }
  onNavigateToDocuments?: () => void
  onNavigateToData?: () => void
}

export function ValidationAlert({
  validation,
  onNavigateToDocuments,
  onNavigateToData
}: ValidationAlertProps) {
  const hasBlockers = validation.blockers.length > 0
  const hasMissingDocuments = validation.missingDocuments.length > 0
  const hasAwaitingReviewDocuments = (validation.awaitingReviewDocuments?.length || 0) > 0
  const hasRejectedDocuments = (validation.rejectedDocuments?.length || 0) > 0
  const hasMissingFields = validation.missingFormFields.length > 0
  const hasWarnings = validation.warnings.length > 0

  // Se tudo OK
  if (validation.canProgress && !hasWarnings) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">Pronto para Avançar</AlertTitle>
        <AlertDescription className="text-green-800">
          Todos os critérios foram atendidos. Esta etapa está pronta para ser aprovada.
        </AlertDescription>
      </Alert>
    )
  }

  // Se tem bloqueios
  if (hasBlockers || hasMissingDocuments || hasAwaitingReviewDocuments || hasRejectedDocuments || hasMissingFields) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Impedimentos para Aprovação</AlertTitle>
        <AlertDescription>
          <div className="space-y-3 mt-2">
            {/* Bloqueios Gerais */}
            {hasBlockers && (
              <div>
                <p className="font-medium mb-1">Impedimentos:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validation.blockers.map((blocker, i) => (
                    <li key={i}>{blocker}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documentos Faltantes */}
            {hasMissingDocuments && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-700" />
                    <p className="font-medium text-amber-900">
                      Documentos Pendentes ({validation.missingDocuments.length})
                    </p>
                  </div>
                  {onNavigateToDocuments && (
                    <button
                      onClick={onNavigateToDocuments}
                      className="text-xs text-amber-700 underline hover:text-amber-800"
                    >
                      Ver Documentos
                    </button>
                  )}
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-800">
                  {validation.missingDocuments.slice(0, 3).map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                  {validation.missingDocuments.length > 3 && (
                    <li>+ {validation.missingDocuments.length - 3} documento(s)</li>
                  )}
                </ul>
              </div>
            )}

            {hasAwaitingReviewDocuments && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-700" />
                    <p className="font-medium text-blue-900">
                      Documentos em Análise ({validation.awaitingReviewDocuments?.length || 0})
                    </p>
                  </div>
                  {onNavigateToDocuments && (
                    <button
                      onClick={onNavigateToDocuments}
                      className="text-xs text-blue-700 underline hover:text-blue-800"
                    >
                      Ver Documentos
                    </button>
                  )}
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-800">
                  {(validation.awaitingReviewDocuments || []).slice(0, 3).map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                  {(validation.awaitingReviewDocuments?.length || 0) > 3 && (
                    <li>+ {(validation.awaitingReviewDocuments?.length || 0) - 3} documento(s)</li>
                  )}
                </ul>
              </div>
            )}

            {hasRejectedDocuments && (
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-700" />
                    <p className="font-medium text-red-900">
                      Documentos Rejeitados ({validation.rejectedDocuments?.length || 0})
                    </p>
                  </div>
                  {onNavigateToDocuments && (
                    <button
                      onClick={onNavigateToDocuments}
                      className="text-xs text-red-700 underline hover:text-red-800"
                    >
                      Ver Documentos
                    </button>
                  )}
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-red-800">
                  {(validation.rejectedDocuments || []).slice(0, 3).map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                  {(validation.rejectedDocuments?.length || 0) > 3 && (
                    <li>+ {(validation.rejectedDocuments?.length || 0) - 3} documento(s)</li>
                  )}
                </ul>
              </div>
            )}

            {/* Campos Faltantes */}
            {hasMissingFields && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <FormInput className="h-4 w-4 text-amber-700" />
                    <p className="font-medium text-amber-900">
                      Campos Não Preenchidos ({validation.missingFormFields.length})
                    </p>
                  </div>
                  {onNavigateToData && (
                    <button
                      onClick={onNavigateToData}
                      className="text-xs text-amber-700 underline hover:text-amber-800"
                    >
                      Ver Dados
                    </button>
                  )}
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-800">
                  {validation.missingFormFields.slice(0, 3).map((field, i) => (
                    <li key={i}>{field}</li>
                  ))}
                  {validation.missingFormFields.length > 3 && (
                    <li>+ {validation.missingFormFields.length - 3} campo(s)</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Se tem apenas avisos
  if (hasWarnings) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900">Avisos</AlertTitle>
        <AlertDescription className="text-yellow-800">
          <ul className="list-disc list-inside space-y-1 text-sm mt-1">
            {validation.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
