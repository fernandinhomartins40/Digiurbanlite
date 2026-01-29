// ============================================================================
// TYPES E DTOs - APP-SAUDE-03: TFD - Tratamento Fora do Domicílio
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export enum TipoDocumentoTFD {
  LAUDO_MEDICO = 'LAUDO_MEDICO',
  PEDIDO_MEDICO = 'PEDIDO_MEDICO',
  EXAMES = 'EXAMES',
  RG = 'RG',
  CPF = 'CPF',
  CARTAO_SUS = 'CARTAO_SUS',
  COMPROVANTE_RESIDENCIA = 'COMPROVANTE_RESIDENCIA',
  OUTRO = 'OUTRO',
}

export enum StatusParecer {
  APROVADO = 'APROVADO',
  REPROVADO = 'REPROVADO',
  PENDENTE_DOCUMENTACAO = 'PENDENTE_DOCUMENTACAO',
}

export enum DecisaoGestao {
  APROVADO = 'APROVADO',
  REPROVADO = 'REPROVADO',
  APROVADO_PARCIAL = 'APROVADO_PARCIAL',
}

export enum StatusEmbarque {
  AGUARDANDO = 'AGUARDANDO',
  EMBARCADO = 'EMBARCADO',
  AUSENTE = 'AUSENTE',
  CANCELADO = 'CANCELADO',
}

export enum StatusPrestacao {
  PENDENTE = 'PENDENTE',
  EM_ANALISE = 'EM_ANALISE',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA',
}

// Enums do Schema do Prisma
export enum StatusSolicitacaoTFD {
  AGUARDANDO_ANALISE_DOCUMENTAL = 'AGUARDANDO_ANALISE_DOCUMENTAL',
  DOCUMENTACAO_PENDENTE = 'DOCUMENTACAO_PENDENTE',
  AGUARDANDO_REGULACAO_MEDICA = 'AGUARDANDO_REGULACAO_MEDICA',
  AGUARDANDO_COMPLEMENTACAO = 'AGUARDANDO_COMPLEMENTACAO',
  INDEFERIDO = 'INDEFERIDO',
  APROVADO_REGULACAO = 'APROVADO_REGULACAO',
  AGUARDANDO_APROVACAO_GESTAO = 'AGUARDANDO_APROVACAO_GESTAO',
  SUSPENSO = 'SUSPENSO',
  APROVADO_PARA_AGENDAMENTO = 'APROVADO_PARA_AGENDAMENTO',
  AGENDANDO = 'AGENDANDO',
  AGENDADO = 'AGENDADO',
  AGUARDANDO_VIAGEM = 'AGUARDANDO_VIAGEM',
  EM_VIAGEM = 'EM_VIAGEM',
  REALIZADO = 'REALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum StatusViagemTFD {
  PLANEJADA = 'PLANEJADA',
  CONFIRMADA = 'CONFIRMADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

export enum StatusAgendamentoExterno {
  AGENDADO = 'AGENDADO',
  CONFIRMADO = 'CONFIRMADO',
  REALIZADO = 'REALIZADO',
  FALTOU = 'FALTOU',
  CANCELADO = 'CANCELADO',
}

export enum StatusPrestacaoContas {
  PENDENTE = 'PENDENTE',
  EM_ANALISE = 'EM_ANALISE',
  APROVADA = 'APROVADA',
  REPROVADA = 'REPROVADA',
}

export enum PrioridadeTFD {
  EMERGENCIA = 'EMERGENCIA',
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  ROTINA = 'ROTINA',
}

export enum TipoViagemTFD {
  IDA = 'IDA',
  RETORNO = 'RETORNO',
  IDA_E_VOLTA = 'IDA_E_VOLTA',
}

// ============================================================================
// DTOs - DOCUMENTO TFD
// ============================================================================

export interface CreateDocumentoTFDDTO {
  solicitacaoId: string;
  tipo: TipoDocumentoTFD;
  nomeArquivo: string;
  urlArquivo: string;
  descricao?: string;
}

export interface UpdateDocumentoTFDDTO {
  tipo?: TipoDocumentoTFD;
  nomeArquivo?: string;
  urlArquivo?: string;
  descricao?: string;
}

// ============================================================================
// DTOs - SOLICITAÇÃO TFD
// ============================================================================

export interface CreateSolicitacaoTFDDTO {
  citizenId: string;
  acompanhanteId?: string;
  especialidade: string;
  procedimento: string;
  cid10?: string;
  justificativa: string;
  encaminhamentoMedicoUrl: string;
  examesUrls?: string[];
  prioridade: PrioridadeTFD;
  cidadeDestino: string;
  estadoDestino: string;
  hospitalDestino?: string;
  urgente?: boolean;
  observacoes?: string;
  profissionalSolicitanteId?: string;
  unidadeOrigemId?: string;
}

export interface UpdateSolicitacaoTFDDTO {
  especialidade?: string;
  procedimento?: string;
  cid10?: string;
  justificativa?: string;
  prioridade?: PrioridadeTFD;
  cidadeDestino?: string;
  estadoDestino?: string;
  hospitalDestino?: string;
  observacoes?: string;
}

export interface SolicitacaoTFDCompletoResponse {
  id: string;
  citizenId: string;
  especialidade: string;
  procedimento: string;
  cid10?: string;
  justificativa: string;
  prioridade: PrioridadeTFD;
  cidadeDestino: string;
  estadoDestino: string;
  hospitalDestino?: string;
  status: StatusSolicitacaoTFD;
  createdAt: Date;
  updatedAt: Date;
  citizen?: any;
  documentos?: any[];
  pareceres?: any[];
  aprovacoesGestao?: any[];
  agendamentosExternos?: any[];
  viagens?: any[];
}

// ============================================================================
// DTOs - PARECER DE REGULAÇÃO
// ============================================================================

export interface CreateParecerRegulacaoDTO {
  solicitacaoId: string;
  reguladorId: string;
  aprovado: boolean;
  prioridade: PrioridadeTFD;
  observacoes?: string;
  justificativa?: string;
  sugestaoEspecialista?: string;
  sugestaoLocal?: string;
}

export interface UpdateParecerRegulacaoDTO {
  aprovado?: boolean;
  prioridade?: PrioridadeTFD;
  observacoes?: string;
  justificativa?: string;
  sugestaoEspecialista?: string;
  sugestaoLocal?: string;
}

// ============================================================================
// DTOs - APROVAÇÃO DE GESTÃO
// ============================================================================

export interface CreateAprovacaoGestaoDTO {
  solicitacaoId: string;
  aprovadoPorId: string;
  aprovado: boolean;
  valorAprovado?: number;
  observacoes?: string;
  justificativa?: string;
}

export interface UpdateAprovacaoGestaoDTO {
  aprovado?: boolean;
  valorAprovado?: number;
  observacoes?: string;
  justificativa?: string;
}

// ============================================================================
// DTOs - AGENDAMENTO EXTERNO
// ============================================================================

export interface CreateAgendamentoExternoDTO {
  solicitacaoId: string;
  dataAgendamento: Date;
  horaAgendamento: string;
  nomeEspecialista?: string;
  especialidade: string;
  localAtendimento: string;
  enderecoCompleto?: string;
  cidade: string;
  estado: string;
  telefoneContato?: string;
  observacoes?: string;
}

export interface UpdateAgendamentoExternoDTO {
  dataAgendamento?: Date;
  horaAgendamento?: string;
  nomeEspecialista?: string;
  especialidade?: string;
  localAtendimento?: string;
  enderecoCompleto?: string;
  cidade?: string;
  estado?: string;
  telefoneContato?: string;
  observacoes?: string;
}

// ============================================================================
// DTOs - PASSAGEIRO DE VIAGEM
// ============================================================================

export interface CreatePassageiroViagemDTO {
  viagemId: string;
  solicitacaoId: string;
  acompanhanteId?: string;
  tipoPassageiro?: string;
  observacoes?: string;
}

export interface UpdatePassageiroViagemDTO {
  statusEmbarque?: StatusEmbarque;
  observacoes?: string;
}

export interface CheckInPassageiroDTO {
  passageiroId: string;
  presente: boolean;
  observacoes?: string;
}

// ============================================================================
// DTOs - PRESTAÇÃO DE CONTAS
// ============================================================================

export interface CreatePrestacaoContasDTO {
  viagemId: string;
  kmInicial: number;
  kmFinal: number;
  combustivelGasto?: number;
  valorCombustivel?: number;
  pedagios?: number;
  alimentacao?: number;
  hospedagem?: number;
  outrosGastos?: number;
  observacoes?: string;
}

export interface UpdatePrestacaoContasDTO {
  kmInicial?: number;
  kmFinal?: number;
  totalKm?: number;
  combustivelGasto?: number;
  valorCombustivel?: number;
  pedagios?: number;
  alimentacao?: number;
  hospedagem?: number;
  outrosGastos?: number;
  totalGasto?: number;
  observacoes?: string;
}

export interface AprovarPrestacaoContasDTO {
  prestacaoId: string;
  usuarioAprovacao: string;
  aprovar: boolean;
  observacoes?: string;
}

// ============================================================================
// DTOs - PLANEJAMENTO DE VIAGENS
// ============================================================================

export interface AgruparPassageirosDTO {
  dataViagem: Date;
  cidadeDestino: string;
  estadoDestino: string;
  solicitacaoIds: string[];
}

export interface SugestaoVeiculoDTO {
  numeroPassageiros: number;
  precisaAcessibilidade: boolean;
  distanciaKm?: number;
}

export interface CreateViagemTFDDTO {
  solicitacaoId: string;
  veiculoId: string;
  motoristaId: string;
  dataIda: Date;
  horaIda: string;
  dataVolta?: Date;
  horaVolta?: string;
  pontoEncontro?: string;
  observacoes?: string;
}

export interface UpdateViagemTFDDTO {
  veiculoId?: string;
  motoristaId?: string;
  dataIda?: Date;
  horaIda?: string;
  dataVolta?: Date;
  horaVolta?: string;
  pontoEncontro?: string;
  observacoes?: string;
  status?: StatusViagemTFD;
}

export interface ViagemTFDCompletoResponse {
  id: string;
  solicitacaoTFDId: string;
  veiculoId?: string;
  motoristaId?: string;
  dataIda: Date;
  horaIda: string;
  dataVolta?: Date;
  horaVolta?: string;
  status: StatusViagemTFD;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  solicitacao?: any;
  veiculo?: any;
  motorista?: any;
  passageiros?: any[];
  prestacaoContas?: any;
}

// ============================================================================
// DTOs - BUSCA E FILTROS
// ============================================================================

export interface BuscarSolicitacoesTFDDTO {
  status?: string;
  prioridade?: string;
  cidadeDestino?: string;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface BuscarViagensDTO {
  status?: string;
  dataInicio?: Date;
  dataFim?: Date;
  veiculoId?: string;
  motoristaId?: string;
}

export interface BuscarPrestacoesContasDTO {
  status?: StatusPrestacao;
  dataInicio?: Date;
  dataFim?: Date;
  viagemId?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export interface DocumentoTFDResponse {
  id: string;
  solicitacaoId: string;
  tipoDocumento: TipoDocumentoTFD;
  nomeArquivo: string;
  caminhoArquivo: string;
  tamanho: number;
  mimeType: string;
  dataUpload: Date;
  usuarioUpload: string;
  usuarioUploadNome: string;
}

export interface ParecerRegulacaoResponse {
  id: string;
  solicitacaoId: string;
  medicoReguladorId: string;
  medicoReguladorNome: string;
  parecer: string;
  status: StatusParecer;
  observacoes?: string;
  dataParecer: Date;
}

export interface AprovacaoGestaoResponse {
  id: string;
  solicitacaoId: string;
  gestorId: string;
  gestorNome: string;
  decisao: DecisaoGestao;
  justificativa?: string;
  recursosAprovados?: Record<string, boolean>;
  dataAprovacao: Date;
}

export interface AgendamentoExternoResponse {
  id: string;
  solicitacaoId: string;
  hospitalDestino: string;
  especialidade: string;
  dataHoraConsulta: Date;
  endereco?: string;
  telefoneContato?: string;
  confirmado: boolean;
  observacoes?: string;
  dataAgendamento: Date;
}

export interface PassageiroViagemResponse {
  id: string;
  viagemId: string;
  solicitacaoId: string;
  citizenId: string;
  citizenNome: string;
  citizenCpf: string;
  acompanhante: boolean;
  nomeAcompanhante?: string;
  cpfAcompanhante?: string;
  statusEmbarque: StatusEmbarque;
  observacoes?: string;
}

export interface PrestacaoContasResponse {
  id: string;
  viagemId: string;
  combustivelLitros: number;
  combustivelValor: number;
  pedagioQuantidade: number;
  pedagioValor: number;
  alimentacaoValor?: number;
  hospedagemDiarias?: number;
  hospedagemValor?: number;
  outrosCustos?: Record<string, number>;
  valorTotal: number;
  comprovantesAnexados?: string[];
  status: StatusPrestacao;
  observacoes?: string;
  dataPrestacao: Date;
  usuarioPrestacao: string;
  usuarioPrestacaoNome: string;
  dataAprovacao?: Date;
  usuarioAprovacao?: string;
  usuarioAprovacaoNome?: string;
}

export interface ViagemComPassageirosResponse {
  id: string;
  dataViagem: Date;
  horarioSaida: string;
  horarioChegada?: string;
  veiculoId: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  motoristaId: string;
  motoristaNome: string;
  destino: {
    cidade: string;
    estado: string;
    hospital?: string;
  };
  passageiros: PassageiroViagemResponse[];
  status: string;
  kmTotal?: number;
  prestacaoContas?: PrestacaoContasResponse;
}

export interface SugestaoVeiculoResponse {
  veiculoId: string;
  placa: string;
  modelo: string;
  capacidade: number;
  acessibilidade: boolean;
  status: string;
  adequado: boolean;
  motivo?: string;
}

export interface AgrupaPassageirosResponse {
  dataViagem: Date;
  destino: {
    cidade: string;
    estado: string;
  };
  solicitacoes: Array<{
    id: string;
    citizenId: string;
    citizenNome: string;
    especialidade: string;
    prioridade: string;
    temAcompanhante: boolean;
  }>;
  totalPassageiros: number;
  veiculosSugeridos: SugestaoVeiculoResponse[];
}

export interface RelatorioPrestacaoContasResponse {
  periodo: {
    dataInicio: Date;
    dataFim: Date;
  };
  totalViagens: number;
  totalGasto: number;
  gastosPorCategoria: {
    combustivel: number;
    pedagio: number;
    alimentacao: number;
    hospedagem: number;
    outros: number;
  };
  viagensPorDestino: Array<{
    destino: string;
    totalViagens: number;
    totalGasto: number;
    mediaPorViagem: number;
  }>;
  viagensPorStatus: {
    pendente: number;
    emAnalise: number;
    aprovada: number;
    rejeitada: number;
  };
}
