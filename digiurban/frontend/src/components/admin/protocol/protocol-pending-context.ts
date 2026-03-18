export interface StageValidationContext {
  canProgress?: boolean
  blockers?: string[]
  warnings?: string[]
  missingDocuments?: string[]
  awaitingReviewDocuments?: string[]
  rejectedDocuments?: string[]
  missingFormFields?: string[]
}

export interface PendingCreationContext {
  sourceAction?: 'MANUAL' | 'CREATE_PENDING' | 'REQUEST_INFO'
  stageId?: string
  stageName?: string
  stageMetadata?: {
    actionLabels?: Record<string, string>
    requiredDocumentTypes?: string[]
    requiredInputFieldIds?: string[]
    requiredStageOutputs?: string[]
    [key: string]: any
  }
  validation?: StageValidationContext | null
}

export function encodePendingCreationContext(context?: PendingCreationContext | null): string {
  if (!context) return ''
  return encodeURIComponent(JSON.stringify(context))
}

export function decodePendingCreationContext(encoded?: string | null): PendingCreationContext | null {
  if (!encoded) return null

  try {
    return JSON.parse(decodeURIComponent(encoded)) as PendingCreationContext
  } catch {
    return null
  }
}

export function buildPendingCreationHref(
  protocolId: string,
  context?: PendingCreationContext | null
): string {
  const params = new URLSearchParams()
  const encodedContext = encodePendingCreationContext(context)

  if (encodedContext) {
    params.set('context', encodedContext)
  }

  const query = params.toString()
  return `/admin/protocolos/${protocolId}/pendencias/nova${query ? `?${query}` : ''}`
}
