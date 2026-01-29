// ============================================================================
// TYPES E DTOs - APP-SAUDE-01: Sistema Integrado de Atendimento
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export enum FilaStatus {
  AGUARDANDO = 'AGUARDANDO',
  CHAMADO = 'CHAMADO',
  EM_ATENDIMENTO = 'EM_ATENDIMENTO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum TipoIndisponibilidade {
  FERIAS = 'FERIAS',
  LICENCA = 'LICENCA',
  TREINAMENTO = 'TREINAMENTO',
  REUNIAO = 'REUNIAO',
  OUTRO = 'OUTRO',
}

export enum GravidadeAlergia {
  LEVE = 'LEVE',
  MODERADA = 'MODERADA',
  GRAVE = 'GRAVE',
}

export enum TipoDocumentoAnexo {
  EXAME = 'EXAME',
  LAUDO = 'LAUDO',
  RECEITA = 'RECEITA',
  ATESTADO = 'ATESTADO',
  ENCAMINHAMENTO = 'ENCAMINHAMENTO',
  IMAGEM = 'IMAGEM',
  OUTRO = 'OUTRO',
}

export enum TipoAtendimento {
  CONSULTA = 'CONSULTA',
  RETORNO = 'RETORNO',
  PROCEDIMENTO = 'PROCEDIMENTO',
  URGENCIA = 'URGENCIA',
  EMERGENCIA = 'EMERGENCIA',
}

export enum StatusAtendimento {
  AGUARDANDO = 'AGUARDANDO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum ClassificacaoRisco {
  AZUL = 'AZUL',
  VERDE = 'VERDE',
  AMARELO = 'AMARELO',
  LARANJA = 'LARANJA',
  VERMELHO = 'VERMELHO',
}

export enum StatusPrescricao {
  ATIVA = 'ATIVA',
  DISPENSADA = 'DISPENSADA',
  CANCELADA = 'CANCELADA',
  EXPIRADA = 'EXPIRADA',
}

export enum StatusExame {
  SOLICITADO = 'SOLICITADO',
  COLETADO = 'COLETADO',
  EM_ANALISE = 'EM_ANALISE',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}

export enum TipoEncaminhamento {
  ESPECIALISTA = 'ESPECIALISTA',
  EXAME = 'EXAME',
  PROCEDIMENTO = 'PROCEDIMENTO',
  INTERNACAO = 'INTERNACAO',
  OUTRO = 'OUTRO',
}

// ============================================================================
// DTOs - FILA DE ATENDIMENTO
// ============================================================================

export interface CreateFilaAtendimentoDTO {
  unidadeId: string;
  consultaId: string;
  prioridade?: number;
  consultorio?: string;
  observacoes?: string;
}

export interface UpdateFilaAtendimentoDTO {
  status?: FilaStatus;
  consultorio?: string;
  observacoes?: string;
}

export interface ChamarPacienteDTO {
  filaId: string;
  consultorio: string;
  mensagem?: string;
}

// ============================================================================
// DTOs - INDISPONIBILIDADE DE AGENDA
// ============================================================================

export interface CreateIndisponibilidadeDTO {
  agendaId: string;
  profissionalId: string;
  dataInicio: Date;
  dataFim: Date;
  motivo: string;
  tipoIndisponibilidade: TipoIndisponibilidade;
}

export interface UpdateIndisponibilidadeDTO {
  dataInicio?: Date;
  dataFim?: Date;
  motivo?: string;
  tipoIndisponibilidade?: TipoIndisponibilidade;
}

// ============================================================================
// DTOs - ALERGIAS DO CIDADÃO
// ============================================================================

export interface CreateAlergiaCidadaoDTO {
  citizenId: string;
  alergia: string;
  gravidade: GravidadeAlergia;
  observacoes?: string;
  usuarioRegistro: string;
}

export interface UpdateAlergiaCidadaoDTO {
  alergia?: string;
  gravidade?: GravidadeAlergia;
  observacoes?: string;
}

// ============================================================================
// DTOs - COMORBIDADES DO CIDADÃO
// ============================================================================

export interface CreateComorbidadeCidadaoDTO {
  citizenId: string;
  cid10: string;
  descricao: string;
  dataInicio?: Date;
  dataFim?: Date;
  ativo?: boolean;
  observacoes?: string;
  usuarioRegistro: string;
}

export interface UpdateComorbidadeCidadaoDTO {
  cid10?: string;
  descricao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  ativo?: boolean;
  observacoes?: string;
}

// ============================================================================
// DTOs - ANEXOS DE PRONTUÁRIO
// ============================================================================

export interface CreateAnexoProntuarioDTO {
  citizenId: string;
  atendimentoId?: string;
  tipoDocumento: TipoDocumentoAnexo;
  nomeArquivo: string;
  caminhoArquivo: string;
  tamanho: number;
  mimeType: string;
  descricao?: string;
  usuarioUpload: string;
}

export interface UpdateAnexoProntuarioDTO {
  descricao?: string;
}

// ============================================================================
// DTOs - IMUNIZAÇÕES DO CIDADÃO
// ============================================================================

export interface CreateImunizacaoCidadaoDTO {
  citizenId: string;
  vacina: string;
  dose: string;
  lote?: string;
  dataAplicacao: Date;
  unidadeId?: string;
  profissionalId?: string;
  observacoes?: string;
}

export interface UpdateImunizacaoCidadaoDTO {
  vacina?: string;
  dose?: string;
  lote?: string;
  dataAplicacao?: Date;
  unidadeId?: string;
  profissionalId?: string;
  observacoes?: string;
}

// ============================================================================
// DTOs - BUSCA E FILTROS
// ============================================================================

export interface BuscarDisponibilidadeDTO {
  profissionalId?: string;
  unidadeId?: string;
  especialidade?: string;
  dataInicio: Date;
  dataFim: Date;
}

export interface FilaUnidadeDTO {
  unidadeId: string;
  status?: FilaStatus;
}

export interface ProntuarioCidadaoDTO {
  citizenId: string;
  incluirAlergias?: boolean;
  incluirComorbidades?: boolean;
  incluirImunizacoes?: boolean;
  incluirAnexos?: boolean;
  dataInicio?: Date;
  dataFim?: Date;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export interface FilaAtendimentoResponse {
  id: string;
  unidadeId: string;
  consultaId: string;
  ordem: number;
  prioridade: number;
  status: FilaStatus;
  chamadaEm?: Date;
  atendidoEm?: Date;
  consultorio?: string;
  observacoes?: string;
  createdAt: Date;
  // Relacionamentos
  unidade?: {
    id: string;
    nome: string;
    tipo: string;
  };
  consulta?: {
    id: string;
    citizenId: string;
    dataHora: Date;
  };
}

export interface ProntuarioCompletoResponse {
  citizen: {
    id: string;
    name: string;
    cpf: string;
    birthDate?: Date;
  };
  alergias: Array<{
    id: string;
    alergia: string;
    gravidade: GravidadeAlergia;
    observacoes?: string;
    dataRegistro: Date;
  }>;
  comorbidades: Array<{
    id: string;
    cid10: string;
    descricao: string;
    dataInicio?: Date;
    dataFim?: Date;
    ativo: boolean;
    observacoes?: string;
  }>;
  imunizacoes: Array<{
    id: string;
    vacina: string;
    dose: string;
    lote?: string;
    dataAplicacao: Date;
    unidade?: string;
    profissional?: string;
  }>;
  anexos: Array<{
    id: string;
    tipoDocumento: TipoDocumentoAnexo;
    nomeArquivo: string;
    descricao?: string;
    dataUpload: Date;
  }>;
  historico: Array<{
    id: string;
    dataAtendimento: Date;
    tipo: string;
    unidade: string;
    profissional?: string;
    diagnostico?: string;
  }>;
}

export interface DisponibilidadeResponse {
  profissionalId: string;
  profissionalNome: string;
  especialidade?: string;
  unidadeId: string;
  unidadeNome: string;
  datasDisponiveis: Array<{
    data: Date;
    horariosDisponiveis: Array<{
      hora: string;
      agendaId: string;
      vagas: number;
    }>;
  }>;
}

// ============================================================================
// DTOs - TRIAGEM
// ============================================================================

export interface CreateTriagemDTO {
  atendimentoId: string;
  profissionalId: string;
  pressaoArterial?: string;
  frequenciaCardiaca?: number;
  frequenciaRespiratoria?: number;
  temperatura?: number;
  saturacaoO2?: number;
  peso?: number;
  altura?: number;
  glicemia?: number;
  dor?: number;
  classificacaoRisco: ClassificacaoRisco;
  queixaPrincipal: string;
  observacoes?: string;
}

export interface UpdateTriagemDTO {
  pressaoArterial?: string;
  frequenciaCardiaca?: number;
  frequenciaRespiratoria?: number;
  temperatura?: number;
  saturacaoO2?: number;
  peso?: number;
  altura?: number;
  glicemia?: number;
  dor?: number;
  classificacaoRisco?: ClassificacaoRisco;
  queixaPrincipal?: string;
  observacoes?: string;
}

// ============================================================================
// DTOs - CONSULTA MÉDICA
// ============================================================================

export interface CreateConsultaMedicaDTO {
  atendimentoId: string;
  profissionalId: string;
  anamnese: string;
  exameClinico?: string;
  diagnosticoPrincipal: string;
  cid10Principal: string;
  diagnosticosSecundarios?: Array<{
    descricao: string;
    cid10: string;
  }>;
  conduta: string;
  observacoes?: string;
}

export interface UpdateConsultaMedicaDTO {
  anamnese?: string;
  exameClinico?: string;
  diagnosticoPrincipal?: string;
  cid10Principal?: string;
  diagnosticosSecundarios?: Array<{
    descricao: string;
    cid10: string;
  }>;
  conduta?: string;
  observacoes?: string;
}

// ============================================================================
// DTOs - ATENDIMENTO MÉDICO
// ============================================================================

export interface CreateAtendimentoDTO {
  citizenId: string;
  unidadeId: string;
  profissionalId: string;
  tipoAtendimento: TipoAtendimento;
  consultaId?: string;
  observacoes?: string;
}

export interface UpdateAtendimentoDTO {
  status?: StatusAtendimento;
  observacoes?: string;
  dataFinalizacao?: Date;
}

export interface AtendimentoCompletoResponse {
  id: string;
  citizenId: string;
  unidadeId: string;
  profissionalId: string;
  tipoAtendimento: TipoAtendimento;
  status: StatusAtendimento;
  dataAtendimento: Date;
  dataFinalizacao?: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relacionamentos
  citizen?: {
    id: string;
    name: string;
    cpf: string;
    birthDate?: Date;
  };
  unidade?: {
    id: string;
    nome: string;
    tipo: string;
  };
  profissional?: {
    id: string;
    name: string;
    especialidade?: string;
  };
  consulta?: {
    id: string;
    dataHora: Date;
  };
  triagens?: Array<{
    id: string;
    classificacaoRisco: ClassificacaoRisco;
    queixaPrincipal: string;
    createdAt: Date;
  }>;
  consultasMedicas?: Array<{
    id: string;
    diagnosticoPrincipal: string;
    cid10Principal: string;
    createdAt: Date;
  }>;
  prescricoes?: Array<{
    id: string;
    status: StatusPrescricao;
    createdAt: Date;
  }>;
  exames?: Array<{
    id: string;
    nomeExame: string;
    status: StatusExame;
    createdAt: Date;
  }>;
}

// ============================================================================
// DTOs - PRESCRIÇÃO
// ============================================================================

export interface CreatePrescricaoDTO {
  atendimentoId: string;
  profissionalId: string;
  observacoes?: string;
  itens: Array<{
    medicamentoId: string;
    quantidade: number;
    posologia: string;
    duracao?: string;
    observacoes?: string;
  }>;
}

export interface UpdatePrescricaoDTO {
  status?: StatusPrescricao;
  observacoes?: string;
}

export interface PrescricaoCompletoResponse {
  id: string;
  atendimentoId: string;
  profissionalId: string;
  status: StatusPrescricao;
  dataEmissao: Date;
  validadeAte: Date;
  observacoes?: string;
  createdAt: Date;

  // Relacionamentos
  atendimento?: {
    id: string;
    citizenId: string;
    dataAtendimento: Date;
  };
  profissional?: {
    id: string;
    name: string;
    crm?: string;
    especialidade?: string;
  };
  itens: Array<{
    id: string;
    medicamentoId: string;
    quantidade: number;
    posologia: string;
    duracao?: string;
    observacoes?: string;
    medicamento?: {
      id: string;
      nome: string;
      principioAtivo?: string;
      concentracao?: string;
    };
  }>;
}

// ============================================================================
// DTOs - EXAMES
// ============================================================================

export interface SolicitarExameDTO {
  atendimentoId: string;
  profissionalId: string;
  exames: Array<{
    nomeExame: string;
    codigo?: string;
    justificativa?: string;
    observacoes?: string;
  }>;
}

export interface RegistrarResultadoDTO {
  exameSolicitadoId: string;
  profissionalId: string;
  resultado: string;
  valorReferencia?: string;
  unidadeMedida?: string;
  observacoes?: string;
  arquivoResultado?: string;
}

export interface UpdateExameDTO {
  status?: StatusExame;
  dataColeta?: Date;
  observacoes?: string;
}

export interface ExameCompletoResponse {
  id: string;
  atendimentoId: string;
  profissionalSolicitante: string;
  nomeExame: string;
  codigo?: string;
  status: StatusExame;
  justificativa?: string;
  dataSolicitacao: Date;
  dataColeta?: Date;
  dataResultado?: Date;
  observacoes?: string;

  // Relacionamentos
  atendimento?: {
    id: string;
    citizenId: string;
    dataAtendimento: Date;
  };
  profissional?: {
    id: string;
    name: string;
    especialidade?: string;
  };
  resultados?: Array<{
    id: string;
    resultado: string;
    valorReferencia?: string;
    unidadeMedida?: string;
    dataRegistro: Date;
  }>;
}

// ============================================================================
// DTOs - ATESTADO
// ============================================================================

export interface CreateAtestadoDTO {
  atendimentoId: string;
  profissionalId: string;
  cid10: string;
  diasAfastamento: number;
  dataInicio: Date;
  observacoes?: string;
}

export interface UpdateAtestadoDTO {
  cid10?: string;
  diasAfastamento?: number;
  dataInicio?: Date;
  observacoes?: string;
}

export interface AtestadoResponse {
  id: string;
  atendimentoId: string;
  profissionalId: string;
  cid10: string;
  diasAfastamento: number;
  dataInicio: Date;
  dataFim: Date;
  observacoes?: string;
  createdAt: Date;

  // Relacionamentos
  atendimento?: {
    id: string;
    citizenId: string;
    citizen?: {
      id: string;
      name: string;
      cpf: string;
    };
  };
  profissional?: {
    id: string;
    name: string;
    crm?: string;
    especialidade?: string;
  };
}

// ============================================================================
// DTOs - ENCAMINHAMENTO
// ============================================================================

export interface CreateEncaminhamentoDTO {
  atendimentoId: string;
  profissionalId: string;
  especialidadeDestino: string;
  tipoEncaminhamento: TipoEncaminhamento;
  prioridade: number;
  diagnostico: string;
  cid10?: string;
  justificativa: string;
  observacoes?: string;
}

export interface UpdateEncaminhamentoDTO {
  especialidadeDestino?: string;
  tipoEncaminhamento?: TipoEncaminhamento;
  prioridade?: number;
  diagnostico?: string;
  cid10?: string;
  justificativa?: string;
  observacoes?: string;
  profissionalDestinoId?: string;
  dataAgendamento?: Date;
}

export interface EncaminhamentoResponse {
  id: string;
  atendimentoId: string;
  profissionalId: string;
  especialidadeDestino: string;
  tipoEncaminhamento: TipoEncaminhamento;
  prioridade: number;
  diagnostico: string;
  cid10?: string;
  justificativa: string;
  profissionalDestinoId?: string;
  dataAgendamento?: Date;
  observacoes?: string;
  createdAt: Date;

  // Relacionamentos
  atendimento?: {
    id: string;
    citizenId: string;
    citizen?: {
      id: string;
      name: string;
      cpf: string;
    };
  };
  profissionalOrigem?: {
    id: string;
    name: string;
    especialidade?: string;
  };
  profissionalDestino?: {
    id: string;
    name: string;
    especialidade?: string;
  };
}

// ============================================================================
// TIPOS ADICIONAIS PARA SERVICES
// ============================================================================

export interface AtestadoCompletoResponse extends AtestadoResponse {
  // Adiciona campos completos do atendimento
}

export enum TipoAtestado {
  MEDICO = 'MEDICO',
  COMPARECIMENTO = 'COMPARECIMENTO',
  ACOMPANHANTE = 'ACOMPANHANTE',
}

export interface EncaminhamentoCompletoResponse extends EncaminhamentoResponse {
  // Adiciona campos completos
}

export enum StatusEncaminhamento {
  PENDENTE = 'PENDENTE',
  AGENDADO = 'AGENDADO',
  REALIZADO = 'REALIZADO',
  CANCELADO = 'CANCELADO',
}

export interface CreateExameSolicitadoDTO {
  atendimentoId: string;
  consultaId: string;
  tipoExame: string;
  nomeExame: string;
  justificativa?: string;
  prioridade: string;
}

export interface UpdateExameSolicitadoDTO {
  tipoExame?: string;
  nomeExame?: string;
  justificativa?: string;
  prioridade?: string;
  status?: string;
}

export interface CreateResultadoExameDTO {
  exameSolicitadoId: string;
  exameId: string;
  resultado: string;
  valor?: string;
  observacoes?: string;
}

export interface UpdateResultadoExameDTO {
  resultado?: string;
  valor?: string;
  observacoes?: string;
}

export interface CreateItemPrescricaoDTO {
  prescricaoId: string;
  medicamentoId: string;
  quantidade: number;
  posologia: string;
  duracao?: string;
  observacoes?: string;
}

export interface UpdateItemPrescricaoDTO {
  quantidade?: number;
  posologia?: string;
  duracao?: string;
  observacoes?: string;
}
