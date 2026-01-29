// ============================================================================
// TYPES E DTOs - APP-SAUDE-02: Farmácia Municipal
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export enum StatusTransferencia {
  PENDENTE = 'PENDENTE',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA',
  FINALIZADA = 'FINALIZADA',
}

export enum TipoAlertaEstoque {
  ESTOQUE_BAIXO = 'ESTOQUE_BAIXO',
  ESTOQUE_CRITICO = 'ESTOQUE_CRITICO',
  VENCIMENTO_PROXIMO = 'VENCIMENTO_PROXIMO',
  VENCIDO = 'VENCIDO',
}

// ============================================================================
// DTOs - LOTE DE MEDICAMENTO
// ============================================================================

export interface CreateLoteMedicamentoDTO {
  medicamentoId: string;
  lote: string;
  dataFabricacao: Date;
  dataValidade: Date;
  quantidade: number;
  unidadeId: string;
  fornecedor?: string;
  notaFiscal?: string;
  usuarioRegistro: string;
}

export interface UpdateLoteMedicamentoDTO {
  quantidade?: number;
  fornecedor?: string;
  notaFiscal?: string;
}

// ============================================================================
// DTOs - TRANSFERÊNCIA DE ESTOQUE
// ============================================================================

export interface CreateTransferenciaEstoqueDTO {
  medicamentoId: string;
  unidadeOrigemId: string;
  unidadeDestinoId: string;
  quantidade: number;
  motivo?: string;
  usuarioSolicitante: string;
}

export interface UpdateTransferenciaEstoqueDTO {
  status?: StatusTransferencia;
  usuarioConfirmante?: string;
}

export interface AprovarTransferenciaDTO {
  transferenciaId: string;
  usuarioConfirmante: string;
  aprovar: boolean;
  motivo?: string;
}

// ============================================================================
// DTOs - ALERTA DE ESTOQUE
// ============================================================================

export interface CreateAlertaEstoqueDTO {
  medicamentoId: string;
  unidadeId: string;
  tipoAlerta: TipoAlertaEstoque;
  mensagem: string;
  quantidadeAtual: number;
  quantidadeMinima?: number;
  dataVencimento?: Date;
}

export interface MarcarAlertaVisualizadoDTO {
  alertaId: string;
}

// ============================================================================
// DTOs - BUSCA E FILTROS
// ============================================================================

export interface BuscarEstoqueDTO {
  unidadeId?: string;
  medicamentoId?: string;
  status?: string;
  dataValidadeInicio?: Date;
  dataValidadeFim?: Date;
}

export interface BuscarTransferenciasDTO {
  unidadeOrigemId?: string;
  unidadeDestinoId?: string;
  status?: StatusTransferencia;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface BuscarAlertasDTO {
  unidadeId?: string;
  medicamentoId?: string;
  tipoAlerta?: TipoAlertaEstoque;
  visualizado?: boolean;
}

export interface RelatórioConsumoDTO {
  unidadeId?: string;
  medicamentoId?: string;
  dataInicio: Date;
  dataFim: Date;
  agruparPor?: 'medicamento' | 'unidade' | 'dia' | 'mes';
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export interface LoteMedicamentoResponse {
  id: string;
  medicamentoId: string;
  medicamentoNome: string;
  lote: string;
  dataFabricacao: Date;
  dataValidade: Date;
  quantidade: number;
  unidadeId: string;
  unidadeNome: string;
  fornecedor?: string;
  notaFiscal?: string;
  dataEntrada: Date;
  diasParaVencimento: number;
  status: 'DISPONIVEL' | 'VENCE_EM_BREVE' | 'VENCIDO';
}

export interface TransferenciaEstoqueResponse {
  id: string;
  medicamentoId: string;
  medicamentoNome: string;
  unidadeOrigemId: string;
  unidadeOrigemNome: string;
  unidadeDestinoId: string;
  unidadeDestinoNome: string;
  quantidade: number;
  motivo?: string;
  status: StatusTransferencia;
  dataSolicitacao: Date;
  dataConfirmacao?: Date;
  usuarioSolicitante: string;
  usuarioSolicitanteNome: string;
  usuarioConfirmante?: string;
  usuarioConfirmanteNome?: string;
}

export interface AlertaEstoqueResponse {
  id: string;
  medicamentoId: string;
  medicamentoNome: string;
  unidadeId: string;
  unidadeNome: string;
  tipoAlerta: TipoAlertaEstoque;
  mensagem: string;
  quantidadeAtual: number;
  quantidadeMinima?: number;
  dataVencimento?: Date;
  visualizado: boolean;
  dataGeracao: Date;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface EstoqueUnidadeResponse {
  unidadeId: string;
  unidadeNome: string;
  medicamentos: Array<{
    medicamentoId: string;
    medicamentoNome: string;
    quantidadeTotal: number;
    quantidadeMinima: number;
    status: 'DISPONIVEL' | 'CRITICO' | 'VENCIDO' | 'BLOQUEADO';
    lotes: Array<{
      loteId: string;
      lote: string;
      quantidade: number;
      dataValidade: Date;
      diasParaVencimento: number;
    }>;
    alertas: number;
  }>;
  alertasCriticos: number;
  medicamentosVencidos: number;
  medicamentosEstoqueBaixo: number;
}

export interface RelatorioConsumoResponse {
  dataInicio: Date;
  dataFim: Date;
  totalDispensacoes: number;
  medicamentosMaisDispensados: Array<{
    medicamentoId: string;
    medicamentoNome: string;
    quantidadeDispensada: number;
    numeroDispensacoes: number;
    cidadaosAtendidos: number;
  }>;
  dispensacoesPorUnidade?: Array<{
    unidadeId: string;
    unidadeNome: string;
    quantidadeDispensacoes: number;
    totalMedicamentos: number;
  }>;
  dispensacoesPorPeriodo?: Array<{
    periodo: string; // '2024-01' ou '2024-01-15'
    quantidadeDispensacoes: number;
    totalMedicamentos: number;
  }>;
}

export interface ProjecaoNecessidadeResponse {
  medicamentoId: string;
  medicamentoNome: string;
  unidadeId?: string;
  unidadeNome?: string;
  consumoMedioMensal: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  diasEstoqueRestante: number;
  quantidadeSugerida: number;
  urgencia: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';
  historico30Dias: number;
  historico60Dias: number;
  historico90Dias: number;
}

// ============================================================================
// TIPOS ADICIONAIS PARA DISPENSAÇÃO
// ============================================================================

export interface CreateDispensacaoDTO {
  prescricaoId?: string;
  medicamentoId: string;
  estoqueId?: string;
  citizenId: string;
  atendimentoId?: string;
  quantidade: number;
  dispensadoPor: string;
  observacoes?: string;
}

export interface UpdateDispensacaoDTO {
  status?: string;
  observacoes?: string;
}

export interface DispensacaoCompletoResponse {
  id: string;
  prescricaoId?: string;
  medicamentoId: string;
  estoqueId?: string;
  citizenId: string;
  atendimentoId?: string;
  quantidade: number;
  data: Date;
  dispensadoEm: Date;
  dispensadoPor: string;
  status?: string;
  observacoes?: string;

  // Relacionamentos
  medicamento?: {
    id: string;
    nome: string;
    principioAtivo: string;
  };
  citizen?: {
    id: string;
    name: string;
    cpf: string;
  };
}

// ============================================================================
// TIPOS ADICIONAIS PARA ESTOQUE
// ============================================================================

export interface UpdateAlertaEstoqueDTO {
  visualizado?: boolean;
}

export interface MovimentacaoEstoqueDTO {
  tipo: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
  medicamentoId: string;
  loteId: string;
  quantidade: number;
  unidadeId: string;
  usuarioId: string;
  observacoes?: string;
}

export interface EstoquePorUnidadeResponse {
  unidadeId: string;
  unidadeNome: string;
  medicamentos: Array<{
    medicamentoId: string;
    medicamentoNome: string;
    quantidadeTotal: number;
    lotes: Array<{
      loteId: string;
      numeroLote: string;
      quantidade: number;
      dataValidade: Date;
    }>;
  }>;
}
