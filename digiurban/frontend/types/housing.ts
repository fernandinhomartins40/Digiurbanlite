// Tipos para o módulo de habitação
export interface HousingUnit {
  id: number
  codigo: string
  endereco: string
  tipo: string
  programa: string
  area_util: string
  quartos: number
  banheiros: number
  valor_avaliacao: string
  status: string
  data_entrega: string | null
  morador_atual: string | null
  cpf_morador: string | null
  telefone_morador: string | null
  vencimento_contrato: string | null
  ultima_manutencao: string | null
  condicao: string
  observacoes: string
}

export interface MaintenanceRecord {
  id: number
  unidade_codigo: string
  tipo: string
  descricao: string
  data_solicitacao: string
  data_execucao: string | null
  responsavel: string
  valor: string
  status: string
  prioridade: string
}

export interface TransferRecord {
  id: number
  unidade_origem: string
  unidade_destino: string
  morador: string
  motivo: string
  data_solicitacao: string
  status: string
  data_efetivacao: string | null
}

export interface CreateHousingUnitData {
  codigo: string
  endereco: string
  tipo: string
  programa: string
  area_util: string
  quartos: string
  banheiros: string
  valor_avaliacao: string
}

export interface CreateMaintenanceData {
  unidade_codigo: string
  tipo: string
  descricao: string
  responsavel: string
  valor: string
  prioridade: string
}

export interface CreateTransferData {
  unidade_origem: string
  unidade_destino: string
  morador: string
  motivo: string
}