export interface StageValidationContext {
  canProgress?: boolean
  blockers?: string[]
  warnings?: string[]
  missingDocuments?: string[]
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
