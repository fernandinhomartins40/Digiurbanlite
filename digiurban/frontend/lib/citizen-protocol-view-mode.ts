/**
 * ============================================================================
 * CITIZEN PROTOCOL VIEW MODE - Sistema de DetecÃ§Ã£o de Modo para CidadÃ£os
 * ============================================================================
 * Determina como o protocolo deve ser exibido para o CIDADÃƒO baseado em:
 * - Status do protocolo
 * - PendÃªncias que requerem aÃ§Ã£o do cidadÃ£o
 * - Etapa atual do workflow
 */

export enum CitizenProtocolViewMode {
  ACTIVE = 'ACTIVE',           // Protocolo em andamento (aguardando servidor)
  WAITING = 'WAITING',         // Aguardando aÃ§Ã£o do cidadÃ£o (tem pendÃªncias)
  COMPLETING = 'COMPLETING',   // Ãšltima etapa - quase pronto
  ARCHIVED = 'ARCHIVED'        // ConcluÃ­do/Cancelado
}

export interface CitizenProtocolViewModeResult {
  mode: CitizenProtocolViewMode
  currentStage?: {
    id: string
    stageName: string
    stageOrder: number
    status: string
    metadata?: any
  }
  isLastStage: boolean
  availableTabs: string[]
  primaryTab: string
  message: string
  actionRequired: boolean
  actionMessage?: string
}

/**
 * Determina o modo de visualizaÃ§Ã£o para o cidadÃ£o
 */
export function getCitizenProtocolViewMode(
  protocolStatus: string,
  stages: Array<{
    id: string
    stageOrder: number
    status: string
    stageName: string
    metadata?: any
  }>,
  citizenPendings: Array<{
    id: string
    status: string
    requiresCitizenAction?: boolean
  }>
): CitizenProtocolViewModeResult {
  // 1. Protocolo concluÃ­do ou cancelado â†’ ARCHIVED
  if (protocolStatus === 'CONCLUIDO' || protocolStatus === 'CANCELADO') {
    return {
      mode: CitizenProtocolViewMode.ARCHIVED,
      currentStage: undefined,
      isLastStage: false,
      availableTabs: ['resumo', 'generated', 'documents', 'messages', 'timeline'],
      primaryTab: 'resumo',
      message: protocolStatus === 'CONCLUIDO'
        ? 'Protocolo concluÃ­do - Seu documento estÃ¡ disponÃ­vel'
        : 'Protocolo cancelado',
      actionRequired: false
    }
  }

  // Encontrar etapa atual
  const currentStage = stages.find(s => s.status === 'IN_PROGRESS')

  // 2. Tem pendÃªncias aguardando o cidadÃ£o? â†’ WAITING (PRIORIDADE!)
  const openCitizenPendings = citizenPendings.filter(
    p => ['OPEN', 'IN_PROGRESS'].includes(p.status) && p.requiresCitizenAction === true
  )
  const pendingUnderReview = citizenPendings.filter(
    p => p.status === 'UNDER_REVIEW' && p.requiresCitizenAction === true
  )

  const hasDocumentOnlyPendings = openCitizenPendings.every(
    (pending: any) => (pending.type || pending.pendingType) === 'DOCUMENT'
  )

  if (openCitizenPendings.length > 0) {
    return {
      mode: CitizenProtocolViewMode.WAITING,
      currentStage: currentStage as any,
      isLastStage: false,
      availableTabs: ['pendings', 'resumo', 'documents', 'messages'],
      primaryTab: 'pendings',
      message: `VocÃª precisa resolver ${openCitizenPendings.length} pendÃªncia(s)`,
      actionRequired: true,
      actionMessage: openCitizenPendings.length === 1
        ? (hasDocumentOnlyPendings ? 'Envie o documento solicitado' : 'Responda Ã  pendÃªncia solicitada')
        : (hasDocumentOnlyPendings
          ? `Envie ${openCitizenPendings.length} documentos solicitados`
          : `Resolva ${openCitizenPendings.length} pendÃªncias para continuar`)
    }
  }

  if (pendingUnderReview.length > 0) {
    return {
      mode: CitizenProtocolViewMode.ACTIVE,
      currentStage: currentStage as any,
      isLastStage: false,
      availableTabs: ['pendings', 'resumo', 'documents', 'messages'],
      primaryTab: 'pendings',
      message: `Há ${pendingUnderReview.length} resposta(s) enviada(s) aguardando análise da equipe`,
      actionRequired: false,
      actionMessage: 'Sua resposta foi recebida e está em análise'
    }
  }

  // 3. Determinar se Ã© a Ãºltima etapa
  if (currentStage && stages.length > 0) {
    const maxStageOrder = Math.max(...stages.map(s => s.stageOrder))
    const isLastStage = currentStage.stageOrder === maxStageOrder

    // EstÃ¡ na Ãºltima etapa â†’ COMPLETING
    if (isLastStage) {
      return {
        mode: CitizenProtocolViewMode.COMPLETING,
        currentStage: currentStage as any,
        isLastStage: true,
        availableTabs: ['resumo', 'documents', 'messages', 'timeline'],
        primaryTab: 'resumo',
        message: 'Seu protocolo estÃ¡ em fase final!',
        actionRequired: false
      }
    }
  }

  // 4. Protocolo em andamento normal â†’ ACTIVE
  return {
    mode: CitizenProtocolViewMode.ACTIVE,
    currentStage: currentStage as any,
    isLastStage: false,
    availableTabs: ['resumo', 'documents', 'messages', 'timeline'],
    primaryTab: 'resumo',
    message: currentStage
      ? `Aguardando anÃ¡lise: ${currentStage.stageName}`
      : 'Protocolo em andamento',
    actionRequired: false
  }
}

/**
 * Mapeia IDs de tabs para labels amigÃ¡veis (versÃ£o cidadÃ£o)
 */
export const CITIZEN_TAB_LABELS: Record<string, { label: string; icon: string }> = {
  resumo: { label: 'Resumo', icon: 'FileText' },
  pendings: { label: 'PendÃªncias', icon: 'AlertCircle' },
  documents: { label: 'Meus Documentos', icon: 'Upload' },
  generated: { label: 'Documentos Gerados', icon: 'FileCheck' },
  messages: { label: 'Mensagens', icon: 'MessageSquare' },
  timeline: { label: 'HistÃ³rico', icon: 'Clock' }
}
