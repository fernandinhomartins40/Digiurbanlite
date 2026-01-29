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
