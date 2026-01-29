// ============================================================================
// TIPOS COMPARTILHADOS - APPS DE SAÚDE
// ============================================================================

// Tipos base para dados clínicos
export interface SinaisVitais {
  pressaoArterial?: string
  pressaoArterialSistolica?: number
  pressaoArterialDiastolica?: number
  temperatura?: number
  frequenciaCardiaca?: number
  frequenciaRespiratoria?: number
  saturacaoO2?: number
}

export interface Antropometria {
  peso?: number
  altura?: number
  imc?: number
  circunferenciaAbdominal?: number
  circunferenciaBraco?: number
}

// Consulta Médica SOAP
export interface ConsultaSOAP {
  // S - SUBJETIVO
  motivoConsulta?: string
  historiaAtual?: string
  historiaPregressa?: string
  historiaFamiliar?: string
  historiaSocial?: string

  // O - OBJETIVO
  sinaisVitais?: SinaisVitais
  exameFisicoGeral?: string
  exameFisicoSistemas?: Record<string, any>
  antropometria?: Antropometria

  // A - AVALIAÇÃO
  hipoteseDiagnostica?: string
  diagnosticoPrincipal?: string
  diagnosticosSecund?: string[]

  // P - PLANO
  condutaTerapeutica?: string
  orientacoes?: string
  retornoNecessario?: boolean
  prazoRetornoDias?: number
  observacoes?: string
}

// Problemas e Condições
export type TipoClassificacao = 'CIAP2' | 'CID10'
export type StatusProblema = 'ATIVO' | 'LATENTE' | 'RESOLVIDO'
export type GravidadeProblema = 'LEVE' | 'MODERADO' | 'GRAVE'

export interface ProblemaCondicao {
  id: string
  tipo: TipoClassificacao
  codigo: string
  descricao: string
  status: StatusProblema
  gravidade?: GravidadeProblema
  prioridade: number
  dataInicio: Date
  dataResolucao?: Date
  observacoes?: string
}

// Alergias e Reações
export type TipoAlergia = 'MEDICAMENTO' | 'ALIMENTO' | 'AMBIENTAL' | 'CONTATO' | 'LATEX' | 'OUTRA'
export type GravidadeAlergia = 'LEVE' | 'MODERADA' | 'GRAVE' | 'ANAFILAXIA'

export interface AlergiaReacao {
  id: string
  tipo: TipoAlergia
  substancia: string
  reacao: string
  gravidade: GravidadeAlergia
  dataIdentificacao: Date
  ativo: boolean
  observacoes?: string
}

// Odontologia
export type CondicaoDente = 'HIGIDO' | 'CARIADO' | 'OBTURADO' | 'AUSENTE' | 'PROTESE' | 'IMPLANTE'
export type FaceDente = 'Oclusal' | 'Mesial' | 'Distal' | 'Vestibular' | 'Lingual/Palatina'

export interface Odontograma {
  [dente: string]: {
    condicao?: CondicaoDente
    procedimentos?: string[]
  }
}

export interface ProcedimentoOdonto {
  id: string
  codigoSIGTAP: string
  descricao: string
  dente?: string
  face?: FaceDente
  quantidade: number
}

export interface AtendimentoOdontologico {
  odontograma: Odontograma
  queixaPrincipal?: string
  exameBucal?: string
  diagnostico?: string
  planoTratamento?: string
  procedimentos: ProcedimentoOdonto[]
  orientacoes?: string
  observacoes?: string
}

// Pré-Natal
export type RiscoGestacional = 'HABITUAL' | 'ALTO_RISCO'
export type StatusPreNatal = 'EM_ANDAMENTO' | 'FINALIZADO' | 'INTERROMPIDO'
export type TipoDesfecho = 'PARTO_NORMAL' | 'CESAREA' | 'ABORTO' | 'INTERRUPCAO'

export interface PreNatal {
  id: string
  dum: Date
  dpp: Date
  idadeGestacional: string
  gravidez: number
  partos: number
  abortos: number
  cesarianas: number
  nascidosVivos?: number
  nascidosMortos?: number
  riscoGestacional: RiscoGestacional
  status: StatusPreNatal
  grupoSanguineo?: string
  fatorRh?: string
  pesoInicial?: number
  alturaInicial?: number
  imcInicial?: number
  fatoresRisco?: string[]
}

export interface ConsultaPreNatal {
  id: string
  dataConsulta: Date
  idadeGestacional: string
  peso?: number
  pressaoArterial?: string
  alturaUterina?: number
  bcf?: number
  movimentosFetais?: boolean
  edema?: string
  apresentacaoFetal?: string
  queixas?: string
  orientacoes?: string
  proximaConsulta?: Date
}

// Visita Domiciliar
export type TurnoVisita = 'MANHA' | 'TARDE' | 'NOITE'
export type TipoVisita = 'CADASTRAMENTO' | 'ACOMPANHAMENTO' | 'BUSCA_ATIVA' | 'CONTROLE_AMBIENTAL' | 'EDUCACAO_SAUDE' | 'CONVOCACAO'

export interface VisitaDomiciliar {
  id: string
  dataVisita: Date
  turno?: TurnoVisita
  tipoVisita: TipoVisita
  motivoVisita: string
  atividadesRealizadas: string[]
  acompanhamentosRealizados?: Record<string, boolean>
  encaminhamentoUBS: boolean
  motivoEncaminhamento?: string
  desfecho?: string
  observacoes?: string
  latitude?: number
  longitude?: number
}

// Atividade Coletiva
export type TipoAtividadeColetiva =
  | 'REUNIAO_EQUIPE'
  | 'GRUPO_EDUCACAO_SAUDE'
  | 'GRUPO_HIPERTENSOS'
  | 'GRUPO_DIABETICOS'
  | 'GRUPO_GESTANTES'
  | 'GRUPO_TABAGISMO'
  | 'GRUPO_SAUDE_MENTAL'
  | 'GRUPO_IDOSOS'
  | 'ATIVIDADE_FISICA'
  | 'AVALIACAO_ALTERADA'
  | 'PALESTRA'
  | 'OFICINA'
  | 'OUTRO'

export interface ParticipanteAtividade {
  id: string
  citizenId?: string
  nome?: string
  cpf?: string
  avaliacaoAlterada: boolean
  pesoAferido?: number
  alturaAferida?: number
  pressaoArterial?: string
  glicemia?: number
  observacoes?: string
}

export interface AtividadeColetiva {
  id: string
  titulo: string
  tipo: TipoAtividadeColetiva
  tema?: string
  publicoAlvo?: string
  dataRealizacao: Date
  horaInicio: string
  horaFim?: string
  localRealizacao?: string
  numParticipantes: number
  participantes: ParticipanteAtividade[]
  atividadesRealizadas?: string[]
  temas?: string[]
  avaliacaoPratica?: string
  observacoes?: string
}

// Integração e-SUS
export type TipoIntegracaoESUS = 'API_REST' | 'LEDI_THRIFT' | 'LEDI_XML' | 'NENHUMA'
export type FormatoLEDI = 'THRIFT' | 'XML'
export type TipoFichaESUS =
  | 'CADASTRO_INDIVIDUAL'
  | 'CADASTRO_DOMICILIAR'
  | 'ATENDIMENTO_INDIVIDUAL'
  | 'ATENDIMENTO_ODONTOLOGICO'
  | 'ATENDIMENTO_DOMICILIAR'
  | 'VISITA_DOMICILIAR'
  | 'ATIVIDADE_COLETIVA'
  | 'PROCEDIMENTOS'
  | 'VACINACAO'

export type StatusTransmissao =
  | 'PENDENTE'
  | 'ENVIANDO'
  | 'SUCESSO'
  | 'ERRO_VALIDACAO'
  | 'ERRO_CONEXAO'
  | 'ERRO_AUTENTICACAO'
  | 'AGUARDANDO_RETRY'
  | 'CANCELADO'

export interface ConfiguracaoESUS {
  id?: string
  integracaoAtiva: boolean
  tipoIntegracao: TipoIntegracaoESUS

  // API REST
  urlPEC?: string
  usuarioAPI?: string
  senhaAPI?: string

  // LEDI
  formatoLEDI?: FormatoLEDI
  versaoLEDI?: string
  diretorioExportacao?: string

  // Mapeamentos
  cnesUnidadePrincipal?: string

  // Sincronização
  sincronizacaoAutomatica: boolean
  intervaloSincMinutos: number
  ultimaSincronizacao?: string

  // Logs
  logTransmissoes: boolean
  retentarEnviosFalhos: boolean
  maxTentativas: number

  observacoes?: string
}

export interface TransmissaoESUS {
  id: string
  tipo: TipoFichaESUS
  formato?: FormatoLEDI
  fichaId: string
  entidadeOrigem?: string
  nomeArquivo?: string
  status: StatusTransmissao
  dataEnvio: Date
  dataConfirmacao?: Date
  codigoResposta?: number
  mensagemResposta?: string
  erros?: any
  tentativas: number
  proximaTentativa?: Date
}

// ============================================================================
// FLUXO DE ATENDIMENTO PEC e-SUS
// ============================================================================

// === EQUIPES E TERRITORIALIZAÇÃO ===
export type TipoEquipe = 'eAP' | 'eSF' | 'eAB' | 'NASF' | 'eCR' | 'eAD'

export interface EquipeSaude {
  id: string
  ine: string // Identificação Nacional de Equipes
  nome: string
  tipo: TipoEquipe
  unidadeId: string
  ativo: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Microarea {
  id: string
  numero: string
  descricao?: string
  equipeId: string
  acsId?: string
  ativo: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface ProfissionalEquipe {
  id: string
  profissionalId: string
  equipeId: string
  cbo: string
  funcao?: string
  dataInicio: Date
  dataFim?: Date
  ativo: boolean
}

// === FILA DE ATENDIMENTO ===
export type TipoAtendimentoFila =
  | 'AGENDADO'
  | 'DEMANDA_ESPONTANEA'
  | 'URGENCIA'
  | 'RETORNO'
  | 'RENOVACAO_RECEITA'
  | 'VACINACAO'
  | 'PROCEDIMENTO'

export type StatusFila =
  | 'AGUARDANDO'
  | 'EM_ESCUTA_INICIAL'
  | 'EM_TRIAGEM'
  | 'AGUARDANDO_MEDICO'
  | 'EM_CONSULTA'
  | 'EM_PROCEDIMENTO'
  | 'EM_VACINACAO'
  | 'FINALIZADO'
  | 'NAO_AGUARDOU'
  | 'RETORNOU'

export type PrioridadeFila = 'NORMAL' | 'URGENTE' | 'MUITO_URGENTE' | 'EMERGENCIA'

export interface FilaAtendimento {
  id: string
  citizenId: string
  citizen?: {
    id: string
    name: string
    cpf: string
    birthDate?: Date
  }
  profissionalId: string
  profissional?: {
    id: string
    name: string
  }
  equipeId?: string
  equipe?: EquipeSaude
  tipoAtendimento: TipoAtendimentoFila
  motivoBusca: string
  status: StatusFila
  prioridade: PrioridadeFila
  dataHoraChegada: Date
  dataHoraInicio?: Date
  dataHoraFim?: Date
  vacinacao: boolean
  observacoes?: string
  unidadeId: string
  createdAt?: Date
  updatedAt?: Date
}

// === ESCUTA INICIAL / ACOLHIMENTO ===
export type RiscoEsperado =
  | 'EMERGENCIA'       // 🔴 Atendimento imediato
  | 'MUITO_URGENTE'    // 🟠
  | 'URGENTE'          // 🟡
  | 'POUCO_URGENTE'    // 🟢
  | 'NAO_URGENTE'      // ⚪

export type VulnerabilidadeSocial = 'ALTA' | 'MEDIA' | 'BAIXA'

export type CondutaEscutaInicial =
  | 'RESOLVIDO_NA_ESCUTA'
  | 'ENCAMINHADO_ATENDIMENTO_DIA'
  | 'PROCEDIMENTO_UBS'
  | 'AGENDAMENTO_CONSULTA'
  | 'ENCAMINHAMENTO_EXTERNO'

export interface EscutaInicial {
  id: string
  filaAtendimentoId: string
  profissionalId: string
  profissional?: {
    id: string
    name: string
  }
  equipeId?: string

  // Subjetivo
  motivoBusca: string
  historiaBreve?: string
  tempoEvolucao?: string
  tentativasAnteriores?: string

  // Objetivo (opcional)
  pressaoArterial?: string
  temperatura?: number
  frequenciaCardiaca?: number
  observacoesVisuais?: string

  // Classificação
  riscoEsperado: RiscoEsperado
  vulnerabilidadeSocial: VulnerabilidadeSocial

  // Conduta
  condutaDefinida: CondutaEscutaInicial
  profissionalEncaminhadoId?: string
  profissionalEncaminhado?: {
    id: string
    name: string
  }
  dataAgendamento?: Date
  orientacoes?: string

  unidadeId: string
  createdAt?: Date
  updatedAt?: Date
}

// === TRIAGEM DE ENFERMAGEM ===
export type MomentoGlicemia = 'JEJUM' | 'POS_PRANDIAL' | 'ALEATORIA'

export type ClassificacaoManchester =
  | 'EMERGENCIA'        // 🔴 Imediato (0min)
  | 'MUITO_URGENTE'     // 🟠 10 minutos
  | 'URGENTE'           // 🟡 60 minutos
  | 'POUCO_URGENTE'     // 🟢 120 minutos
  | 'NAO_URGENTE'       // 🔵 240 minutos

export interface TriagemEnfermagem {
  id: string
  filaAtendimentoId: string
  enfermeiroId: string
  enfermeiro?: {
    id: string
    name: string
  }

  // Sinais Vitais
  pressaoArterial?: string
  temperatura?: number
  frequenciaCardiaca?: number
  frequenciaRespiratoria?: number
  saturacaoO2?: number
  dor?: number

  // Antropometria
  peso?: number
  altura?: number
  imc?: number
  perimetroCefalico?: number
  circunferenciaAbdominal?: number

  // Glicemia
  glicemiaCapilar?: number
  momentoGlicemia?: MomentoGlicemia

  // Avaliação
  queixaPrincipal: string
  historiaDoencaAtual?: string
  alergiasConhecidas?: string
  medicamentosUso?: string
  comorbidades?: string

  // Classificação Manchester
  classificacaoRisco: ClassificacaoManchester
  discriminadorUtilizado?: string

  // Encaminhamento
  profissionalEncaminhadoId?: string
  profissionalEncaminhado?: {
    id: string
    name: string
  }
  observacoes?: string

  unidadeId: string
  createdAt?: Date
  updatedAt?: Date
}

// === ATIVIDADE COLETIVA (ATUALIZADO) ===
export type TipoAtividadeColetivaPEC =
  | 'GRUPO_HIPERTENSOS'
  | 'GRUPO_DIABETICOS'
  | 'GRUPO_GESTANTES'
  | 'GRUPO_IDOSOS'
  | 'GRUPO_CRIANCAS'
  | 'GRUPO_SAUDE_MENTAL'
  | 'EDUCACAO_SAUDE'
  | 'PRATICAS_CORPORAIS'
  | 'PLANEJAMENTO_FAMILIAR'
  | 'GRUPO_TABAGISMO'
  | 'OUTRO'

export type StatusAtividade = 'PLANEJADA' | 'REALIZADA' | 'CANCELADA'

export interface AtividadeColetivaPEC {
  id: string
  tipo: TipoAtividadeColetivaPEC
  tema: string
  descricao?: string
  dataHora: Date
  duracao?: number
  local: string
  unidadeId: string
  publicoAlvo?: string
  faixaEtariaInicio?: number
  faixaEtariaFim?: number
  numeroParticipantes: number
  praticasSaude: string[]
  status: StatusAtividade
  avaliacoesRealizadas: boolean
  observacoes?: string
  createdAt?: Date
  updatedAt?: Date
  profissionais?: ProfissionalAtividadePEC[]
  participantes?: ParticipanteAtividadePEC[]
}

export interface ProfissionalAtividadePEC {
  id: string
  atividadeId: string
  profissionalId: string
  profissional?: {
    id: string
    name: string
  }
  funcao?: string
  createdAt?: Date
}

export interface ParticipanteAtividadePEC {
  id: string
  atividadeId: string
  citizenId: string
  citizen?: {
    id: string
    name: string
    cpf: string
  }
  pressaoArterial?: string
  glicemia?: number
  peso?: number
  avaliacaoAlterada: boolean
  observacoes?: string
  createdAt?: Date
}

// === AGENDA E CONFIGURAÇÃO ===
export type TurnoAgenda = 'MANHA' | 'TARDE' | 'NOITE'

export interface ConfiguracaoAgenda {
  id: string
  profissionalId: string
  profissional?: {
    id: string
    name: string
  }
  unidadeId: string
  diaSemana: number // 0-6
  turno: TurnoAgenda
  horaInicio: string
  horaFim: string
  duracaoConsulta: number
  tiposAceitos: TipoAtendimentoFila[]
  vagasTotais: number
  vagasDisponiveis?: number
  permiteOnline: boolean
  ativo: boolean
  createdAt?: Date
  updatedAt?: Date
}

export type TipoIndisponibilidadeProfissional =
  | 'FERIAS'
  | 'LICENCA'
  | 'ATESTADO'
  | 'TREINAMENTO'
  | 'REUNIAO'
  | 'OUTRO'

export interface IndisponibilidadeProfissional {
  id: string
  profissionalId: string
  tipo: TipoIndisponibilidadeProfissional
  dataInicio: Date
  dataFim: Date
  motivo?: string
  createdAt?: Date
  updatedAt?: Date
}

// === CORES E ÍCONES DO PEC e-SUS ===
export const CORES_STATUS_FILA: Record<StatusFila, string> = {
  AGUARDANDO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  EM_ESCUTA_INICIAL: 'bg-blue-100 text-blue-800 border-blue-300',
  EM_TRIAGEM: 'bg-purple-100 text-purple-800 border-purple-300',
  AGUARDANDO_MEDICO: 'bg-orange-100 text-orange-800 border-orange-300',
  EM_CONSULTA: 'bg-green-100 text-green-800 border-green-300',
  EM_PROCEDIMENTO: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  EM_VACINACAO: 'bg-pink-100 text-pink-800 border-pink-300',
  FINALIZADO: 'bg-gray-100 text-gray-800 border-gray-300',
  NAO_AGUARDOU: 'bg-red-100 text-red-800 border-red-300',
  RETORNOU: 'bg-teal-100 text-teal-800 border-teal-300',
}

export const CORES_PRIORIDADE: Record<PrioridadeFila, string> = {
  NORMAL: 'bg-gray-100 text-gray-800 border-gray-300',
  URGENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  MUITO_URGENTE: 'bg-orange-100 text-orange-800 border-orange-300',
  EMERGENCIA: 'bg-red-100 text-red-800 border-red-300',
}

export const CORES_MANCHESTER: Record<ClassificacaoManchester, string> = {
  EMERGENCIA: 'bg-red-500 text-white border-red-700',
  MUITO_URGENTE: 'bg-orange-500 text-white border-orange-700',
  URGENTE: 'bg-yellow-500 text-black border-yellow-700',
  POUCO_URGENTE: 'bg-green-500 text-white border-green-700',
  NAO_URGENTE: 'bg-blue-500 text-white border-blue-700',
}

export const CORES_RISCO_ESPERADO: Record<RiscoEsperado, string> = {
  EMERGENCIA: 'bg-red-500 text-white border-red-700',
  MUITO_URGENTE: 'bg-orange-500 text-white border-orange-700',
  URGENTE: 'bg-yellow-500 text-black border-yellow-700',
  POUCO_URGENTE: 'bg-green-500 text-white border-green-700',
  NAO_URGENTE: 'bg-gray-500 text-white border-gray-700',
}
