// Tipos centralizados para Atendimentos Culturais
export interface AtendimentoCultural {
  id: string
  protocolo: string
  data: string
  cidadao: string
  contato: string
  tipo: CulturalAttendanceType
  status: CulturalAttendanceStatus
  descricao: string
  observacoes: string
  responsavel?: string
  anexos?: string[]
  createdAt: string
  updatedAt: string

  // Propriedades específicas de eventos culturais
  categoria?: string
  local_solicitado?: string
  data_evento?: string
  publico_estimado?: number
  orcamento_solicitado?: number
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente'
}

export type CulturalAttendanceType =
  | 'autorizacao_evento'
  | 'cadastro_artista'
  | 'inscricao_edital'
  | 'uso_espaco_cultural'
  | 'apoio_projeto'
  | 'apoio_artistico'
  | 'informacao'
  | 'informacoes_gerais'
  | 'outros'

export type CulturalAttendanceStatus =
  | 'pendente'
  | 'em_analise'
  | 'aprovado'
  | 'recusado'
  | 'concluido'
  | 'cancelado'
  | 'aberto'

export interface CreateCulturalAttendanceData {
  cidadao: string
  contato: string
  tipo: CulturalAttendanceType
  descricao: string
  observacoes?: string
}

export interface UpdateCulturalAttendanceData extends Partial<CreateCulturalAttendanceData> {
  status?: CulturalAttendanceStatus
}

export interface CulturalAttendanceFilters {
  tipo?: CulturalAttendanceType
  status?: CulturalAttendanceStatus
  dateFrom?: string
  dateTo?: string
  cidadao?: string
}