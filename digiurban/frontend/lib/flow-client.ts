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
  defaultDocumentTemplate?: string
  defaultWorkflowTemplateId?: string
  defaultWorkflowTemplate?: { id: string; name: string }
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
  bodyContent?: string
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
  archivedAt?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  _count?: { dispatches: number; documents: number; history: number; comments?: number }
}

export interface ProcessDetail extends InternalProcess {
  history: ProcessHistoryItem[]
  dispatches: DispatchItem[]
  documents: ProcessDocument[]
  comments?: ProcessComment[]
  signatures?: ProcessSignature[]
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
  fromSectorId: string
  fromSectorName: string
  toSectorId: string
  toSectorName: string
  fromUserId: string
  fromUserName: string
  toUserId?: string
  toUserName?: string
  note?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

export interface ProcessDocument {
  id: string
  documentType: string
  name: string
  description?: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  isGenerated: boolean
  templateUsed?: string
  isSigned: boolean
  signedAt?: string
  signedById?: string
  version: number
  createdAt: string
}

export interface ProcessComment {
  id: string
  processId: string
  userId: string
  userName: string
  content: string
  isInternal: boolean
  editedAt?: string
  isDeleted: boolean
  createdAt: string
}

export interface ProcessSignature {
  id: string
  processId: string
  documentId?: string
  requestedById: string
  requestedByName: string
  signerId?: string
  signerName?: string
  signerEmail?: string
  status: 'PENDENTE' | 'ASSINADO' | 'REJEITADO' | 'EXPIRADO'
  signedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  expiresAt?: string
  documentHash?: string
  createdAt: string
}

export interface WorkflowInstanceDetail {
  id: string
  templateId: string
  currentStepId: string
  currentStepName: string
  status: string
  startedAt: string
  completedAt?: string
  template: {
    id: string
    name: string
    steps: WorkflowStep[]
    transitions: WorkflowTransition[]
  }
  stepHistory: {
    id: string
    stepId: string
    stepName: string
    action: string
    note?: string
    userName: string
    enteredAt: string
    completedAt?: string
  }[]
}

export interface WorkflowStep {
  id: string
  name: string
  order: number
  sectorId?: string
  sectorName?: string
  slaHours?: number
  documentRequired?: string
  actions: string[]
}

export interface WorkflowTransition {
  fromStepId: string
  toStepId: string
  condition?: string
  label: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description?: string
  version: number
  isActive: boolean
  steps: WorkflowStep[]
  transitions: WorkflowTransition[]
  createdAt: string
  updatedAt: string
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
  bodyContent?: string
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
  private readonly baseUrl = '/flow'

  // ─── Processos ───

  async createProcess(input: CreateProcessInput): Promise<InternalProcess> {
    const res = await api.post<InternalProcess>(`${this.baseUrl}/processes`, input)
    if (!res.data) throw new Error(res.error || 'Erro ao criar processo')
    return res.data
  }

  async listProcesses(params?: Record<string, string | number | undefined>): Promise<ProcessListResponse> {
    const res = await api.get<ProcessListResponse>(`${this.baseUrl}/processes`, params)
    if (!res.data) throw new Error(res.error || 'Erro ao listar processos')
    return res.data
  }

  async getProcess(id: string): Promise<ProcessDetail> {
    const res = await api.get<ProcessDetail>(`${this.baseUrl}/processes/${id}`)
    if (!res.data) throw new Error(res.error || 'Processo não encontrado')
    return res.data
  }

  async updateProcess(id: string, input: Partial<CreateProcessInput>): Promise<InternalProcess> {
    const res = await api.patch<InternalProcess>(`${this.baseUrl}/processes/${id}`, input)
    if (!res.data) throw new Error(res.error || 'Erro ao atualizar processo')
    return res.data
  }

  async cancelProcess(id: string, reason: string): Promise<InternalProcess> {
    const res = await api.delete<InternalProcess>(`${this.baseUrl}/processes/${id}`, { reason })
    if (!res.data) throw new Error(res.error || 'Erro ao cancelar processo')
    return res.data
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

  // ─── Comentários ───

  async listComments(processId: string): Promise<ProcessComment[]> {
    const { data } = await api.get<ProcessComment[]>(`${this.baseUrl}/processes/${processId}/comments`)
    return data || []
  }

  async addComment(processId: string, content: string, isInternal = true): Promise<ProcessComment> {
    const { data } = await api.post<ProcessComment>(`${this.baseUrl}/processes/${processId}/comments`, {
      content,
      isInternal,
    })
    if (!data) throw new Error('Erro ao adicionar comentário')
    return data
  }

  async editComment(commentId: string, content: string): Promise<ProcessComment> {
    const { data } = await api.patch<ProcessComment>(`${this.baseUrl}/comments/${commentId}`, { content })
    if (!data) throw new Error('Erro ao editar comentário')
    return data
  }

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/comments/${commentId}`)
  }

  // ─── Assinaturas ───

  async listSignatures(processId: string): Promise<ProcessSignature[]> {
    const { data } = await api.get<ProcessSignature[]>(`${this.baseUrl}/processes/${processId}/signatures`)
    return data || []
  }

  async requestSignature(processId: string, input: {
    documentId?: string
    signerId?: string
    signerName?: string
    signerEmail?: string
    expiresInHours?: number
  }): Promise<ProcessSignature> {
    const { data } = await api.post<ProcessSignature>(`${this.baseUrl}/processes/${processId}/signatures`, input)
    if (!data) throw new Error('Erro ao solicitar assinatura')
    return data
  }

  async confirmSignature(signatureId: string): Promise<ProcessSignature> {
    const { data } = await api.post<ProcessSignature>(`${this.baseUrl}/signatures/${signatureId}/confirm`, {})
    if (!data) throw new Error('Erro ao confirmar assinatura')
    return data
  }

  async rejectSignature(signatureId: string, reason: string): Promise<ProcessSignature> {
    const { data } = await api.post<ProcessSignature>(`${this.baseUrl}/signatures/${signatureId}/reject`, { reason })
    if (!data) throw new Error('Erro ao rejeitar assinatura')
    return data
  }

  // ─── Leitura de despachos ───

  async markDispatchRead(dispatchId: string): Promise<void> {
    await api.post(`${this.baseUrl}/dispatches/${dispatchId}/read`, {})
  }

  async markAllDispatchesRead(sectorId: string): Promise<void> {
    await api.post(`${this.baseUrl}/inbox/read-all`, { sectorId })
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

  async updateProcessType(id: string, input: Partial<ProcessType>): Promise<ProcessType> {
    const { data } = await api.put<ProcessType>(`${this.baseUrl}/process-types/${id}`, input)
    if (!data) throw new Error('Erro ao atualizar tipo de processo')
    return data
  }

  // ─── Workflow Templates ───

  async listWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    const { data } = await api.get<WorkflowTemplate[]>(`${this.baseUrl}/workflows/templates`)
    return data || []
  }

  async getWorkflowTemplate(id: string): Promise<WorkflowTemplate> {
    const { data } = await api.get<WorkflowTemplate>(`${this.baseUrl}/workflows/templates/${id}`)
    if (!data) throw new Error('Template não encontrado')
    return data
  }

  async createWorkflowTemplate(input: {
    name: string
    description?: string
    steps: WorkflowStep[]
    transitions: WorkflowTransition[]
  }): Promise<WorkflowTemplate> {
    const { data } = await api.post<WorkflowTemplate>(`${this.baseUrl}/workflows/templates`, input)
    if (!data) throw new Error('Erro ao criar template de workflow')
    return data
  }

  async updateWorkflowTemplate(id: string, input: {
    name?: string
    description?: string
    steps?: WorkflowStep[]
    transitions?: WorkflowTransition[]
    isActive?: boolean
  }): Promise<WorkflowTemplate> {
    const { data } = await api.put<WorkflowTemplate>(`${this.baseUrl}/workflows/templates/${id}`, input)
    if (!data) throw new Error('Erro ao atualizar template de workflow')
    return data
  }

  async deleteWorkflowTemplate(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/workflows/templates/${id}`)
  }

  async instantiateWorkflow(processId: string, templateId: string): Promise<WorkflowInstanceDetail> {
    const { data } = await api.post<WorkflowInstanceDetail>(`${this.baseUrl}/workflows/instances`, { processId, templateId })
    if (!data) throw new Error('Erro ao iniciar fluxo')
    return data
  }

  async advanceWorkflow(instanceId: string, action: string, note?: string): Promise<unknown> {
    const { data } = await api.post(`${this.baseUrl}/workflows/instances/${instanceId}/advance`, { action, note })
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
    const { data } = await api.get<{ sectorId: string; sectorName: string; count: number; oldestDays: number }[]>(
      `${this.baseUrl}/analytics/bottlenecks`
    )
    return data || []
  }

  async exportCSV(params?: { status?: string; typeId?: string }): Promise<void> {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.typeId) query.set('typeId', params.typeId)

    const url = `/api${this.baseUrl}/analytics/export/csv${query.toString() ? '?' + query.toString() : ''}`
    const a = document.createElement('a')
    a.href = url
    a.download = `processos_internos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  async health(): Promise<{ status: string }> {
    const { data } = await api.get<{ status: string }>(`${this.baseUrl}/health`)
    if (!data) throw new Error('Módulo de processos indisponível')
    return data
  }
}

export const flowClient = new FlowClient()
