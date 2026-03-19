/**
 * ============================================================================
 * PROTOCOL VIEW MODE - Sistema de Detecção de Modo de Visualização
 * ============================================================================
 */

import { StageStatus } from '@/types/protocol-enhancements'

const LEGACY_TAB_MAP: Record<string, string> = {
  generated: 'documentos-gerados',
  'document-generation': 'documentos-gerados',
  send: 'enviar',
  documents: 'documentos',
  communication: 'comunicacao',
  involved: 'envolvidos',
  location: 'dados',
  photos: 'documentos',
}

function normalizeTabId(tabId: unknown): string | null {
  if (typeof tabId !== 'string') {
    return null
  }

  const trimmed = tabId.trim()
  if (!trimmed) {
    return null
  }

  return LEGACY_TAB_MAP[trimmed] || trimmed
}

function normalizeTabs(tabIds: unknown, fallback: string[]): string[] {
  const seen = new Set<string>()
  const normalized = Array.isArray(tabIds)
    ? tabIds
        .map(normalizeTabId)
        .filter((tabId): tabId is string => Boolean(tabId))
        .filter(tabId => {
          if (seen.has(tabId)) {
            return false
          }
          seen.add(tabId)
          return true
        })
    : []

  return normalized.length > 0 ? normalized : fallback
}

export enum ProtocolViewMode {
  ACTIVE = 'ACTIVE',           // Workflow em andamento
  COMPLETING = 'COMPLETING',   // Última etapa - finalizando
  ARCHIVED = 'ARCHIVED'        // Protocolo concluído - arquivo histórico
}

export interface ProtocolViewModeResult {
  mode: ProtocolViewMode
  currentStage: {
    id: string
    stageName: string
    stageOrder: number
    status: string
    metadata?: {
      requiredDocumentTypes?: string[]
      requiredInputFieldIds?: string[]
      requiredStageOutputs?: string[]
      allowedActions?: string[]
      [key: string]: any
    }
    dueDate?: Date | string
    [key: string]: any
  } | undefined
  isLastStage: boolean
  canComplete: boolean
  availableTabs: string[]
  primaryTab: string
  message: string
}

/**
 * Determina o modo de visualização do protocolo
 */
export function getProtocolViewMode(
  protocolStatus: string,
  stages: Array<{
    id: string
    stageOrder: number
    status: string
    stageName?: string
    metadata?: any
  }>
): ProtocolViewModeResult {
  // Protocolo já foi concluído ou cancelado
  if (protocolStatus === 'CONCLUIDO' || protocolStatus === 'CANCELADO') {
    return {
      mode: ProtocolViewMode.ARCHIVED,
      currentStage: undefined,
      isLastStage: false,
      canComplete: false,
      availableTabs: ['timeline', 'documentos', 'documentos-gerados', 'comunicacao', 'envolvidos'],
      primaryTab: 'timeline',
      message: protocolStatus === 'CONCLUIDO'
        ? 'Protocolo concluído - Visualização histórica'
        : 'Protocolo cancelado - Visualização histórica'
    }
  }

  // Encontrar etapa atual
  const currentStage = stages.find(s => s.status === StageStatus.IN_PROGRESS)

  if (!currentStage) {
    // Nenhuma etapa em progresso - protocolo estranho
    return {
      mode: ProtocolViewMode.ACTIVE,
      currentStage: undefined,
      isLastStage: false,
      canComplete: false,
      availableTabs: ['resumo', 'comunicacao'],
      primaryTab: 'resumo',
      message: 'Nenhuma etapa em andamento'
    }
  }

  // Determinar se é a última etapa
  const maxStageOrder = Math.max(...stages.map(s => s.stageOrder))
  const isLastStage = currentStage.stageOrder === maxStageOrder

  // Gerar abas contextuais
  const availableTabs = getContextualTabs(currentStage as any,
    isLastStage ? ProtocolViewMode.COMPLETING : ProtocolViewMode.ACTIVE)
  const primaryTab = getPrimaryTab(currentStage as any)

  // Está na última etapa
  if (isLastStage) {
    return {
      mode: ProtocolViewMode.COMPLETING,
      currentStage: currentStage as any,
      isLastStage: true,
      canComplete: true,
      availableTabs,
      primaryTab,
      message: 'Última etapa - Pronto para concluir protocolo'
    }
  }

  // Workflow em andamento normal
  return {
    mode: ProtocolViewMode.ACTIVE,
    currentStage: currentStage as any,
    isLastStage: false,
    canComplete: false,
    availableTabs,
    primaryTab,
    message: `Etapa ${currentStage.stageOrder} de ${maxStageOrder}`
  }
}

/**
 * Determina quais abas devem ser visíveis baseado na etapa atual
 */
export function getContextualTabs(
  currentStage: {
    stageName: string
    metadata?: {
      requiredDocumentTypes?: string[]
      requiredInputFieldIds?: string[]
      requiredStageOutputs?: string[]
      availableTabs?: string[]
      allowedActions?: string[]
    }
  } | null,
  viewMode: ProtocolViewMode
): string[] {
  // Modo arquivado - abas especiais
  if (viewMode === ProtocolViewMode.ARCHIVED) {
    return ['timeline', 'documentos', 'documentos-gerados', 'comunicacao', 'envolvidos']
  }

  // Modo de conclusão - usar abas definidas no stage metadata
  if (viewMode === ProtocolViewMode.COMPLETING) {
    // Priorizar abas definidas no metadata do stage
    if (currentStage?.metadata?.availableTabs) {
      const tabs = normalizeTabs(currentStage.metadata.availableTabs, ['resumo-final', 'documentos-gerados', 'enviar', 'comunicacao'])
      const allowedActions = currentStage?.metadata?.allowedActions || []
      if ((allowedActions.includes('CREATE_PENDING') || allowedActions.includes('REQUEST_INFO')) && !tabs.includes('pendencias')) {
        tabs.push('pendencias')
      }
      return tabs
    }
    // Fallback para abas padrão de conclusão
    return ['resumo-final', 'documentos-gerados', 'enviar', 'comunicacao']
  }

  // Modo ativo - abas contextuais
  if (!currentStage) {
    return ['resumo', 'comunicacao']
  }

  // Se a etapa define abas customizadas, usar elas
  if (currentStage.metadata?.availableTabs) {
    const tabs = normalizeTabs(currentStage.metadata.availableTabs, ['resumo', 'comunicacao'])
    const allowedActions = currentStage.metadata?.allowedActions || []
    if ((allowedActions.includes('CREATE_PENDING') || allowedActions.includes('REQUEST_INFO')) && !tabs.includes('pendencias')) {
      tabs.push('pendencias')
    }
    return tabs
  }

  // Inferir abas baseado nas necessidades da etapa
  const tabs: string[] = []
  const stageName = currentStage.stageName?.toLowerCase() || ''

  // Sempre mostrar resumo como primeira aba
  tabs.push('resumo')

  // Se requer documentos, mostrar aba de documentos
  if (currentStage.metadata?.requiredDocumentTypes &&
      currentStage.metadata.requiredDocumentTypes.length > 0) {
    tabs.push('documentos')
  }

  // Se requer campos de formulário, mostrar aba de dados
  const requiredInputFieldIds =
    currentStage.metadata?.requiredInputFieldIds ||
    []
  if (requiredInputFieldIds.length > 0) {
    tabs.push('dados')
  }

  // Se o stage é de emissão/geração de documentos, mostrar aba de documentos gerados E enviar
  if (stageName.includes('emissão') ||
      stageName.includes('emissao') ||
      stageName.includes('geração') ||
      stageName.includes('geracao') ||
      stageName.includes('documento') ||
      stageName.includes('certidão') ||
      stageName.includes('certidao') ||
      stageName.includes('alvará') ||
      stageName.includes('alvara')) {
    tabs.push('documentos-gerados')
    tabs.push('enviar')  // Adicionar aba de envio para stages de emissão
  }

  // Sempre mostrar pendências (para criar se necessário)
  tabs.push('pendencias')

  // Sempre mostrar comunicação
  tabs.push('comunicacao')

  // Sempre mostrar histórico de atribuições
  tabs.push('atribuicoes')

  return tabs
}

/**
 * Retorna a aba principal (destacada) para a etapa atual
 */
export function getPrimaryTab(
  currentStage: {
    stageName: string
    metadata?: {
      requiredDocumentTypes?: string[]
      requiredInputFieldIds?: string[]
      requiredStageOutputs?: string[]
      primaryTab?: string
      allowedActions?: string[]
    }
  } | null
): string {
  if (!currentStage) return 'resumo'

  // Se definido explicitamente
  if (currentStage.metadata?.primaryTab) {
    return normalizeTabId(currentStage.metadata.primaryTab) || 'resumo'
  }

  // Inferir baseado no nome da etapa
  const stageName = currentStage.stageName.toLowerCase()

  if (stageName.includes('document') || stageName.includes('análise')) {
    return 'documentos'
  }

  if (stageName.includes('dados') || stageName.includes('formulário')) {
    return 'dados'
  }

  if (stageName.includes('vistoria') || stageName.includes('inspeção')) {
    return 'dados'
  }

  if (stageName.includes('emissão') || stageName.includes('geração')) {
    return 'documentos-gerados'
  }

  // Padrão: documentos se requeridos, senão resumo
  if (currentStage.metadata?.requiredDocumentTypes &&
      currentStage.metadata.requiredDocumentTypes.length > 0) {
    return 'documentos'
  }

  return 'resumo'
}

/**
 * Mapeia IDs de tabs para labels amigáveis
 */
export const TAB_LABELS: Record<string, { label: string; icon: string }> = {
  resumo: { label: 'Resumo', icon: 'FileText' },
  documentos: { label: 'Documentos', icon: 'FileText' },
  dados: { label: 'Dados', icon: 'FormInput' },
  pendencias: { label: 'Pendências', icon: 'AlertCircle' },
  comunicacao: { label: 'Comunicação', icon: 'MessageSquare' },
  atribuicoes: { label: 'Atribuições', icon: 'Users' },
  payment: { label: 'Pagamento', icon: 'CreditCard' },

  // Modo Completing
  'resumo-final': { label: 'Resumo Final', icon: 'CheckCircle' },
  'documentos-gerados': { label: 'Documentos Gerados', icon: 'FileText' },
  enviar: { label: 'Enviar', icon: 'Send' },

  // Modo Archived
  timeline: { label: 'Linha do Tempo', icon: 'Clock' },
  envolvidos: { label: 'Envolvidos', icon: 'Users' }
  // Nota: 'documentos', 'documentos-gerados' e 'comunicacao' são compartilhados entre modos
}
