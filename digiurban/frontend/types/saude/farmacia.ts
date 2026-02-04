// ============================================================================
// TIPOS - FARMÁCIA MUNICIPAL
// ============================================================================

export type TipoMedicamento =
  | 'COMPRIMIDO'
  | 'CAPSULA'
  | 'SOLUCAO'
  | 'SUSPENSAO'
  | 'POMADA'
  | 'CREME'
  | 'GEL'
  | 'INJETAVEL'
  | 'XAROPE'
  | 'AEROSOL'
  | 'OUTRO';

export type UnidadeMedida =
  | 'MG'
  | 'G'
  | 'ML'
  | 'L'
  | 'UNIDADE'
  | 'FRASCO'
  | 'AMPOLA'
  | 'OUTRO';

export type StatusEstoque = 'DISPONIVEL' | 'CRITICO' | 'VENCIDO' | 'BLOQUEADO';

export type StatusDispensacao = 'AGUARDANDO' | 'DISPENSADO' | 'PENDENTE' | 'CANCELADO';

export interface MedicamentoRename {
  id: string;
  nome: string;
  principioAtivo: string;
  concentracao: string;
  tipo: TipoMedicamento;
  apresentacao: string;
  catmat: string;
  isControlado: boolean;
}

export interface Medicamento {
  id: string;
  nome: string;
  principioAtivo: string;
  apresentacao: string;
  catmat?: string;
  tipo?: TipoMedicamento;
  unidadeMedida?: UnidadeMedida;
  concentracao?: string;
  fabricante?: string;
  codigoBarras?: string;
  isControlado: boolean;
  isRename: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstoqueMedicamento {
  id: string;
  medicamentoId: string;
  medicamento?: Medicamento;
  unidadeId: string;
  quantidade: number;
  quantidadeAtual?: number;
  quantidadeMinima?: number;
  lote: string;
  validade: Date;
  dataValidade?: Date;
  estoqueMinimo: number;
  status?: StatusEstoque;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoteMedicamento {
  id: string;
  medicamentoId: string;
  medicamento?: Medicamento;
  lote: string;
  dataFabricacao: Date;
  dataValidade: Date;
  quantidade: number;
  unidadeId: string;
  fornecedor?: string;
  notaFiscal?: string;
  dataEntrada: Date;
  usuarioRegistro: string;
}

export interface DispensacaoMedicamento {
  id: string;
  prescricaoId?: string;
  medicamentoId: string;
  medicamento?: Medicamento;
  estoqueId?: string;
  citizenId: string;
  atendimentoId?: string;
  quantidade: number;
  data: Date;
  dispensadoEm: Date;
  dispensadoPor: string;
  status?: StatusDispensacao;
  observacoes?: string;
}

// DTOs para requisições

export interface CreateMedicamentoDTO {
  nome: string;
  principioAtivo: string;
  apresentacao: string;
  tipo?: TipoMedicamento;
  unidadeMedida?: UnidadeMedida;
  concentracao?: string;
  fabricante?: string;
  codigoBarras?: string;
  isControlado?: boolean;
  isRename?: boolean;
}

export interface CreateEstoqueDTO {
  medicamentoId?: string; // Se vier da RENAME
  nome?: string; // Se for manual
  principioAtivo?: string;
  concentracao?: string;
  formaFarmaceutica?: TipoMedicamento;
  fabricante?: string;
  lote: string;
  validade: string;
  quantidade: number;
  estoqueMinimo: number;
  localizacao?: string;
  observacoes?: string;
  isRename?: boolean;
}

export interface UpdateEstoqueDTO {
  quantidadeAtual?: number;
  quantidadeMinima?: number;
  status?: StatusEstoque;
}

export interface DispensarMedicamentoDTO {
  prescricaoId?: string;
  atendimentoId: string;
  citizenId: string;
  farmaceuticoId: string;
  medicamentoId: string;
  estoqueId: string;
  quantidade: number;
  observacoes?: string;
}

// Respostas de API

export interface SearchMedicamentosRenameResponse {
  data: MedicamentoRename[];
}

export interface ListMedicamentosRenameResponse {
  data: MedicamentoRename[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EstoqueStatistics {
  totalItens: number;
  estoqueCritico: number;
  estoqueBaixo: number;
  vencimentoProximo: number;
}
