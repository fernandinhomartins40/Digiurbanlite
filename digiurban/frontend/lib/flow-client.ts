/**
 * Client para o módulo DigiUrban Flow (Processos Internos)
 * Todas as chamadas passam pelo proxy do backend: /api/flow/*
 */
import api from './api'

// ============================================================================
// TIPOS
// ============================================================================

export interface ProcessType {
  id: string
  name: string
  prefix: string
  description?: string
  defaultSlaHours: number
  sigiloDefault: string
  isActive: boolean
  _count?: { processes: number }
}

export interface InternalProcess {
  id: string
  number: string
  typeId: string
  type: { name: string; prefix: string }
  subject: string
  description?: string
  sigilo: string
  status: string
  priority: number
  originSectorId: string
  originSectorName: string
  currentSectorId: string
  currentSectorName: string
  createdById: string
  createdByName: string
  currentUserId?: string
  currentUserName?: string
  citizenProtocolId?: string
  dueAt?: string
  concludedAt?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  _count?: { dispatches: number; documents: number; history: number }
}

export interface ProcessDetail extends InternalProcess {
  history: ProcessHistoryItem[]
  dispatches: DispatchItem[]
  documents: ProcessDocument[]
  workflowInstance?: WorkflowInstanceDetail
}

export interface ProcessHistoryItem {
  id: string
  action: string
  description: string
  note?: string
  fromSectorName?: string
  toSectorName?: string
  userName: string
  createdAt: string
}

export interface DispatchItem {
  id: string
  action: string
  fromSectorName: string
  toSectorName: string
  fromUserName: string
  toUserName?: string
  note?: string
  isRead: boolean
  createdAt: string
}

export interface ProcessDocument {
  id: string
  documentType: string
  name: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  isGenerated: boolean
  templateUsed?: string
  createdAt: string
}

export interface WorkflowInstanceDetail {
  id: string
  currentStepId: string
  currentStepName: string
  status: string
  template: {
    name: string
    steps: unknown[]
    transitions: unknown[]
  }
  stepHistory: {
    id: string
    stepName: string
    action: string
    note?: string
    userName: string
    enteredAt: string
    completedAt?: string
  }[]
}

export interface ProcessListResponse {
  data: InternalProcess[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DashboardData {
  resumo: {
    abertos: number
    emTramitacao: number
    pendentes: number
    concluidos: number
    cancelados: number
    arquivados: number
    ativos: number
    urgentes: number
    vencidos: number
  }
  ultimos30Dias: {
    criados: number
    concluidos: number
  }
  porTipo: { tipoId: string; tipoNome: string; count: number }[]
  porSetor: { setorId: string; setorNome: string; count: number }[]
}

export interface InboxCount {
  total: number
  abertos: number
  emTramitacao: number
  pendentes: number
  naoLidos: number
}

export interface CreateProcessInput {
  typeId: string
  subject: string
  description?: string
  sigilo?: string
  priority?: number
  originSectorId: string
  originSectorName: string
  currentUserId?: string
  currentUserName?: string
  citizenProtocolId?: string
  dueAt?: string
  tags?: string[]
}

export interface DispatchInput {
  toSectorId: string
  toSectorName: string
  toUserId?: string
  toUserName?: string
  note?: string
  action?: string
}

// ============================================================================
// CLIENT
// ============================================================================

class FlowClient {
  private readonly baseUrl = '/api/flow'

  // ─── Processos ───

  async createProcess(input: CreateProcessInput): Promise<InternalProcess> {
    const { data } = await api.post<InternalProcess>(`${this.baseUrl}/processes`, input)
    if (!data) throw new Error('Erro ao criar processo')
    return data
  }

  async listProcesses(params?: Record<string, string | number | undefined>): Promise<ProcessListResponse> {
    const { data } = await api.get<ProcessListResponse>(`${this.baseUrl}/processes`, params)
    if (!data) throw new Error('Erro ao listar processos')
    return data
  }

  async getProcess(id: string): Promise<ProcessDetail> {
    const { data } = await api.get<ProcessDetail>(`${this.baseUrl}/processes/${id}`)
    if (!data) throw new Error('Processo não encontrado')
    return data
  }

  async updateProcess(id: string, input: Partial<CreateProcessInput>): Promise<InternalProcess> {
    const { data } = await api.patch<InternalProcess>(`${this.baseUrl}/processes/${id}`, input)
    if (!data) throw new Error('Erro ao atualizar processo')
    return data
  }

  async cancelProcess(id: string, reason: string): Promise<InternalProcess> {
    const { data } = await api.delete<InternalProcess>(`${this.baseUrl}/processes/${id}`)
    if (!data) throw new Error('Erro ao cancelar processo')
    return data
  }

  // ─── Tramitação ───

  async dispatchProcess(id: string, input: DispatchInput): Promise<unknown> {
    const { data } = await api.post(`${this.baseUrl}/processes/${id}/dispatch`, input)
    return data
  }

  async returnProcess(id: string, note: string): Promise<unknown> {
    const { data } = await api.post(`${this.baseUrl}/processes/${id}/return`, { note })
    return data
  }

  async reassignProcess(id: string, toUserId: string, toUserName: string, note?: string): Promise<unknown> {
    const { data } = await api.post(`${this.baseUrl}/processes/${id}/reassign`, { toUserId, toUserName, note })
    return data
  }

  async concludeProcess(id: string, note?: string): Promise<unknown> {
    const { data } = await api.post(`${this.baseUrl}/processes/${id}/conclude`, { note })
    return data
  }

  async archiveProcess(id: string): Promise<unknown> {
    const { data } = await api.post(`${this.baseUrl}/processes/${id}/archive`, {})
    return data
  }

  // ─── Documentos ───

  async generateDocument(processId: string, templateName: string, additionalData?: Record<string, unknown>): Promise<ProcessDocument> {
    const { data } = await api.post<ProcessDocument>(`${this.baseUrl}/processes/${processId}/documents/generate`, {
      templateName,
      additionalData,
    })
    if (!data) throw new Error('Erro ao gerar documento')
    return data
  }

  async listDocuments(processId: string): Promise<ProcessDocument[]> {
    const { data } = await api.get<ProcessDocument[]>(`${this.baseUrl}/processes/${processId}/documents`)
    return data || []
  }

  // ─── Caixa de Entrada ───

  async getInbox(sectorId: string, userId?: string): Promise<InternalProcess[]> {
    const { data } = await api.get<InternalProcess[]>(`${this.baseUrl}/inbox`, { sectorId, userId })
    return data || []
  }

  async getInboxCount(sectorId: string, userId?: string): Promise<InboxCount> {
    const { data } = await api.get<InboxCount>(`${this.baseUrl}/inbox/count`, { sectorId, userId })
    return data || { total: 0, abertos: 0, emTramitacao: 0, pendentes: 0, naoLidos: 0 }
  }

  // ─── Tipos de Processo ───

  async listProcessTypes(): Promise<ProcessType[]> {
    const { data } = await api.get<ProcessType[]>(`${this.baseUrl}/process-types`)
    return data || []
  }

  async createProcessType(input: Partial<ProcessType>): Promise<ProcessType> {
    const { data } = await api.post<ProcessType>(`${this.baseUrl}/process-types`, input)
    if (!data) throw new Error('Erro ao criar tipo de processo')
    return data
  }

  // ─── Analytics ───

  async getDashboard(): Promise<DashboardData> {
    const { data } = await api.get<DashboardData>(`${this.baseUrl}/analytics/dashboard`)
    if (!data) throw new Error('Erro ao carregar dashboard')
    return data
  }

  async getOverdueProcesses(): Promise<InternalProcess[]> {
    const { data } = await api.get<InternalProcess[]>(`${this.baseUrl}/analytics/sla`)
    return data || []
  }

  async getBottlenecks(): Promise<{ sectorId: string; sectorName: string; count: number; oldestDays: number }[]> {
    const { data } = await api.get<{ sectorId: string; sectorName: string; count: number; oldestDays: number }[]>(`${this.baseUrl}/analytics/bottlenecks`)
    return data || []
  }
}

export const flowClient = new FlowClient()
