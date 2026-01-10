/**
 * ============================================================================
 * PROTOCOL VIEW MODE - Sistema de Detecção de Modo de Visualização
 * ============================================================================
 */

import { StageStatus } from '@/types/protocol-enhancements'

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
      requiredFormFields?: string[]
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
      availableTabs: ['timeline', 'documents', 'generated', 'communication', 'involved'],
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
      requiredFormFields?: string[]
      availableTabs?: string[]
    }
  } | null,
  viewMode: ProtocolViewMode
): string[] {
  // Modo arquivado - abas especiais
  if (viewMode === ProtocolViewMode.ARCHIVED) {
    return ['timeline', 'documents', 'generated', 'communication', 'involved']
  }

  // Modo de conclusão - abas especiais
  if (viewMode === ProtocolViewMode.COMPLETING) {
    return ['summary-final', 'document-generation', 'send', 'communication']
  }

  // Modo ativo - abas contextuais
  if (!currentStage) {
    return ['resumo', 'comunicacao']
  }

  // Se a etapa define abas customizadas, usar elas
  if (currentStage.metadata?.availableTabs) {
    return currentStage.metadata.availableTabs
  }

  // Inferir abas baseado nas necessidades da etapa
  const tabs: string[] = []

  // Sempre mostrar resumo como primeira aba
  tabs.push('resumo')

  // Se requer documentos, mostrar aba de documentos
  if (currentStage.metadata?.requiredDocumentTypes &&
      currentStage.metadata.requiredDocumentTypes.length > 0) {
    tabs.push('documentos')
  }

  // Se requer campos de formulário, mostrar aba de dados
  if (currentStage.metadata?.requiredFormFields &&
      currentStage.metadata.requiredFormFields.length > 0) {
    tabs.push('dados')
  }

  // Sempre mostrar pendências (para criar se necessário)
  tabs.push('pendencias')

  // Sempre mostrar comunicação
  tabs.push('comunicacao')

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
      requiredFormFields?: string[]
      primaryTab?: string
    }
  } | null
): string {
  if (!currentStage) return 'resumo'

  // Se definido explicitamente
  if (currentStage.metadata?.primaryTab) {
    return currentStage.metadata.primaryTab
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
    return 'location' // ou 'photos' se existir
  }

  if (stageName.includes('emissão') || stageName.includes('geração')) {
    return 'document-generation'
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

  // Modo Completing
  'summary-final': { label: 'Resumo Final', icon: 'CheckCircle' },
  'document-generation': { label: 'Gerar Documento', icon: 'FileText' },
  send: { label: 'Enviar', icon: 'Send' },

  // Modo Archived
  timeline: { label: 'Linha do Tempo', icon: 'Clock' },
  documents: { label: 'Docs Recebidos', icon: 'FileText' },
  generated: { label: 'Docs Gerados', icon: 'FilePlus' },
  communication: { label: 'Histórico', icon: 'MessageSquare' },
  involved: { label: 'Envolvidos', icon: 'Users' }
}
