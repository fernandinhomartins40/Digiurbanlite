/**
 * MAPEAMENTO COMPLETO DE M\u00d3DULOS
 *
 * Este arquivo mapeia todos os 108 servi\u00e7os para seus respectivos m\u00f3dulos de banco de dados
 *
 * Estrutura:
 * - Chave: Nome do tipo de m\u00f3dulo (ex: ATENDIMENTOS_SAUDE)
 * - Valor: Nome da entidade Prisma correspondente (ex: HealthAttendance)
 * - null: Para servi\u00e7os INFORMATIVOS que n\u00e3o geram dados estruturados
 */

export const MODULE_MAPPING: Record<string, string | null> = {
  // ========================================
  // SECRETARIA DE SA\u00daDE (11 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_SAUDE: 'HealthAttendance',
  AGENDAMENTOS_MEDICOS: 'HealthAppointment',
  CONTROLE_MEDICAMENTOS: 'MedicationDispense',
  CAMPANHAS_SAUDE: 'HealthCampaign',
  PROGRAMAS_SAUDE: 'HealthProgram',
  ENCAMINHAMENTOS_TFD: 'HealthTransport',
  EXAMES: 'HealthExam',
  TRANSPORTE_PACIENTES: 'HealthTransportRequest',
  VACINACAO: 'Vaccination',
  CADASTRO_PACIENTE: 'Patient',
  // GEST\u00c3O INTERNA
  GESTAO_ACS: 'CommunityHealthAgent', // Agentes Comunit\u00e1rios de Sa\u00fade

  // ========================================
  // SECRETARIA DE EDUCA\u00c7\u00c3O (11 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_EDUCACAO: 'EducationAttendance',
  MATRICULA_ALUNO: 'Student',
  TRANSPORTE_ESCOLAR: 'StudentTransport',
  REGISTRO_OCORRENCIA_ESCOLAR: 'DisciplinaryRecord',
  SOLICITACAO_DOCUMENTO_ESCOLAR: 'SchoolDocument',
  TRANSFERENCIA_ESCOLAR: 'StudentTransfer',
  CONSULTA_FREQUENCIA: 'AttendanceRecord',
  CONSULTA_NOTAS: 'GradeRecord',
  // GEST\u00c3O INTERNA
  GESTAO_ESCOLAR: 'SchoolManagement', // Administra\u00e7\u00e3o de unidades escolares
  GESTAO_MERENDA: 'SchoolMeal', // Planejamento de card\u00e1pios e estoque
  // INFORMATIVO
  CALENDARIO_ESCOLAR: null, // Servi\u00e7o informativo - n\u00e3o gera dados estruturados

  // ========================================
  // SECRETARIA DE ASSIST\u00caNCIA SOCIAL (10 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_ASSISTENCIA_SOCIAL: 'SocialAssistanceAttendance',
  CADASTRO_UNICO: 'VulnerableFamily',
  SOLICITACAO_BENEFICIO: 'BenefitRequest',
  ENTREGA_EMERGENCIAL: 'EmergencyDelivery',
  INSCRICAO_GRUPO_OFICINA: 'SocialGroupEnrollment',
  VISITAS_DOMICILIARES: 'HomeVisit',
  INSCRICAO_PROGRAMA_SOCIAL: 'SocialProgramEnrollment',
  AGENDAMENTO_ATENDIMENTO_SOCIAL: 'SocialAppointment',
  // GEST\u00c3O INTERNA
  GESTAO_CRAS_CREAS: 'SocialEquipment', // CRAS e CREAS

  // ========================================
  // SECRETARIA DE AGRICULTURA (6 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_AGRICULTURA: 'AgricultureAttendance',
  CADASTRO_PRODUTOR: 'RuralProducer',
  ASSISTENCIA_TECNICA: 'TechnicalAssistance',
  INSCRICAO_CURSO_RURAL: 'RuralTrainingEnrollment',
  INSCRICAO_PROGRAMA_RURAL: 'RuralProgramEnrollment',
  CADASTRO_PROPRIEDADE_RURAL: 'RuralProperty',

  // ========================================
  // SECRETARIA DE CULTURA (9 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_CULTURA: 'CulturalAttendance',
  RESERVA_ESPACO_CULTURAL: 'CulturalSpaceReservation',
  INSCRICAO_OFICINA_CULTURAL: 'CulturalWorkshopEnrollment',
  CADASTRO_GRUPO_ARTISTICO: 'ArtisticGroup',
  PROJETO_CULTURAL: 'CulturalProject',
  SUBMISSAO_PROJETO_CULTURAL: 'CulturalProjectSubmission',
  CADASTRO_EVENTO_CULTURAL: 'CulturalEvent',
  REGISTRO_MANIFESTACAO_CULTURAL: 'CulturalManifestation',
  // INFORMATIVO
  AGENDA_EVENTOS_CULTURAIS: null, // Servi\u00e7o informativo - calend\u00e1rio cultural

  // ========================================
  // SECRETARIA DE ESPORTES (9 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_ESPORTES: 'SportsAttendance',
  INSCRICAO_ESCOLINHA: 'SportsSchoolEnrollment',
  CADASTRO_ATLETA: 'Athlete',
  RESERVA_ESPACO_ESPORTIVO: 'SportsInfrastructureReservation',
  INSCRICAO_COMPETICAO: 'CompetitionEnrollment',
  CADASTRO_EQUIPE_ESPORTIVA: 'SportsTeam',
  INSCRICAO_TORNEIO: 'TournamentEnrollment',
  CADASTRO_MODALIDADE: 'SportsModality',
  // INFORMATIVO
  AGENDA_EVENTOS_ESPORTIVOS: null, // Servi\u00e7o informativo - calend\u00e1rio esportivo

  // ========================================
  // SECRETARIA DE HABITA\u00c7\u00c3O (7 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_HABITACAO: 'HousingAttendance',
  INSCRICAO_PROGRAMA_HABITACIONAL: 'HousingApplication',
  REGULARIZACAO_FUNDIARIA: 'LandRegularization',
  SOLICITACAO_AUXILIO_ALUGUEL: 'RentAssistance',
  CADASTRO_UNIDADE_HABITACIONAL: 'HousingUnit',
  INSCRICAO_FILA_HABITACAO: 'HousingRegistration',
  // INFORMATIVO
  CONSULTA_PROGRAMAS_HABITACIONAIS: null, // Servi\u00e7o informativo

  // ========================================
  // SECRETARIA DE MEIO AMBIENTE (7 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_MEIO_AMBIENTE: 'EnvironmentalAttendance',
  LICENCA_AMBIENTAL: 'EnvironmentalLicense',
  DENUNCIA_AMBIENTAL: 'EnvironmentalComplaint',
  PROGRAMA_AMBIENTAL: 'EnvironmentalProgram',
  AUTORIZACAO_PODA_CORTE: 'TreeCuttingAuthorization',
  VISTORIA_AMBIENTAL: 'EnvironmentalInspection',
  // GEST\u00c3O INTERNA
  GESTAO_AREAS_PROTEGIDAS: 'ProtectedArea', // APPs e reservas

  // ========================================
  // SECRETARIA DE OBRAS P\u00daBLICAS (7 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_OBRAS: 'PublicWorksAttendance',
  SOLICITACAO_REPARO_VIA: 'RoadRepairRequest',
  VISTORIA_TECNICA_OBRAS: 'TechnicalInspection',
  CADASTRO_OBRA_PUBLICA: 'PublicWork',
  INSPECAO_OBRA: 'WorkInspection',
  // INFORMATIVOS
  ACOMPANHAMENTO_OBRAS: null, // Servi\u00e7o informativo - progresso de obras
  MAPA_OBRAS: null, // Servi\u00e7o informativo - visualiza\u00e7\u00e3o geoespacial

  // ========================================
  // SECRETARIA DE PLANEJAMENTO URBANO (9 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_PLANEJAMENTO: 'UrbanPlanningAttendance',
  APROVACAO_PROJETO: 'ProjectApproval',
  ALVARA_CONSTRUCAO: 'BuildingPermit',
  ALVARA_FUNCIONAMENTO: 'BusinessLicense',
  SOLICITACAO_CERTIDAO: 'CertificateRequest',
  DENUNCIA_CONSTRUCAO_IRREGULAR: 'UrbanInfraction',
  CADASTRO_LOTEAMENTO: 'UrbanZoning',
  // INFORMATIVOS
  CONSULTAS_PUBLICAS: null, // Servi\u00e7o informativo - audi\u00eancias e plano diretor
  MAPA_URBANO: null, // Servi\u00e7o informativo - zoneamento e uso do solo

  // ========================================
  // SECRETARIA DE SEGURAN\u00c7A P\u00daBLICA (11 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_SEGURANCA: 'SecurityAttendance',
  REGISTRO_OCORRENCIA: 'SecurityOccurrence',
  SOLICITACAO_RONDA: 'PatrolRequest',
  SOLICITACAO_CAMERA_SEGURANCA: 'SecurityCameraRequest',
  DENUNCIA_ANONIMA: 'AnonymousTip',
  CADASTRO_PONTO_CRITICO: 'CriticalPoint',
  ALERTA_SEGURANCA: 'SecurityAlert',
  REGISTRO_PATRULHA: 'SecurityPatrol',
  // GEST\u00c3O INTERNA
  GESTAO_GUARDA_MUNICIPAL: 'MunicipalGuard', // Escala de servi\u00e7o e viaturas
  GESTAO_VIGILANCIA: 'SurveillanceSystem', // C\u00e2meras e central de opera\u00e7\u00f5es
  // INFORMATIVO
  ESTATISTICAS_SEGURANCA: null, // Servi\u00e7o informativo - an\u00e1lises regionais

  // ========================================
  // SECRETARIA DE SERVI\u00c7OS P\u00daBLICOS (9 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_SERVICOS_PUBLICOS: 'PublicServiceAttendance',
  ILUMINACAO_PUBLICA: 'StreetLighting',
  LIMPEZA_URBANA: 'UrbanCleaning',
  COLETA_ESPECIAL: 'SpecialCollection',
  SOLICITACAO_CAPINA: 'WeedingRequest',
  SOLICITACAO_DESOBSTRUCAO: 'DrainageRequest',
  SOLICITACAO_PODA: 'TreePruningRequest',
  // FUNCIONALIDADE TRANSVERSAL
  REGISTRO_PROBLEMA_COM_FOTO: null, // Funcionalidade transversal - usa geolocaliza\u00e7\u00e3o
  // GEST\u00c3O INTERNA
  GESTAO_EQUIPES_SERVICOS: 'ServiceTeam', // Programa\u00e7\u00e3o de equipes e rotas

  // ========================================
  // SECRETARIA DE TURISMO (9 servi\u00e7os)
  // ========================================
  ATENDIMENTOS_TURISMO: 'TourismAttendance',
  CADASTRO_ESTABELECIMENTO_TURISTICO: 'LocalBusiness',
  CADASTRO_GUIA_TURISTICO: 'TourismGuide',
  INSCRICAO_PROGRAMA_TURISTICO: 'TourismProgram',
  REGISTRO_ATRATIVO_TURISTICO: 'TouristAttraction',
  CADASTRO_ROTEIRO_TURISTICO: 'TourismRoute',
  CADASTRO_EVENTO_TURISTICO: 'TourismEvent',
  // INFORMATIVOS
  MAPA_TURISTICO: null, // Servi\u00e7o informativo - visualiza\u00e7\u00e3o de atrativos
  GUIA_TURISTICO_CIDADE: null // Servi\u00e7o informativo - informa\u00e7\u00f5es gerais
}

/**
 * Obt\u00e9m a entidade do m\u00f3dulo baseado no tipo
 *
 * @param moduleType - Tipo do m\u00f3dulo (ex: ATENDIMENTOS_SAUDE)
 * @returns Nome da entidade Prisma ou null para informativos
 */
export function getModuleEntity(moduleType: string): string | null {
  return MODULE_MAPPING[moduleType] || null
}

/**
 * Verifica se um m\u00f3dulo \u00e9 informativo (n\u00e3o gera dados estruturados)
 *
 * @param moduleType - Tipo do m\u00f3dulo
 * @returns true se for informativo, false caso contr\u00e1rio
 */
export function isInformativeModule(moduleType: string): boolean {
  return MODULE_MAPPING[moduleType] === null
}

/**
 * Lista todos os m\u00f3dulos mapeados
 *
 * @returns Array com todos os tipos de m\u00f3dulos
 */
export function getAllModuleTypes(): string[] {
  return Object.keys(MODULE_MAPPING)
}

/**
 * Agrupa m\u00f3dulos por secretaria
 */
export const MODULE_BY_DEPARTMENT = {
  SAUDE: [
    'ATENDIMENTOS_SAUDE',
    'AGENDAMENTOS_MEDICOS',
    'CONTROLE_MEDICAMENTOS',
    'CAMPANHAS_SAUDE',
    'PROGRAMAS_SAUDE',
    'ENCAMINHAMENTOS_TFD',
    'EXAMES',
    'TRANSPORTE_PACIENTES',
    'VACINACAO',
    'CADASTRO_PACIENTE',
    'GESTAO_ACS'
  ],
  EDUCACAO: [
    'ATENDIMENTOS_EDUCACAO',
    'MATRICULA_ALUNO',
    'TRANSPORTE_ESCOLAR',
    'REGISTRO_OCORRENCIA_ESCOLAR',
    'SOLICITACAO_DOCUMENTO_ESCOLAR',
    'TRANSFERENCIA_ESCOLAR',
    'CONSULTA_FREQUENCIA',
    'CONSULTA_NOTAS',
    'GESTAO_ESCOLAR',
    'GESTAO_MERENDA',
    'CALENDARIO_ESCOLAR'
  ],
  ASSISTENCIA_SOCIAL: [
    'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
    'CADASTRO_UNICO',
    'SOLICITACAO_BENEFICIO',
    'ENTREGA_EMERGENCIAL',
    'INSCRICAO_GRUPO_OFICINA',
    'VISITAS_DOMICILIARES',
    'INSCRICAO_PROGRAMA_SOCIAL',
    'AGENDAMENTO_ATENDIMENTO_SOCIAL',
    'GESTAO_CRAS_CREAS'
  ],
  AGRICULTURA: [
    'ATENDIMENTOS_AGRICULTURA',
    'CADASTRO_PRODUTOR',
    'ASSISTENCIA_TECNICA',
    'INSCRICAO_CURSO_RURAL',
    'INSCRICAO_PROGRAMA_RURAL',
    'CADASTRO_PROPRIEDADE_RURAL'
  ],
  CULTURA: [
    'ATENDIMENTOS_CULTURA',
    'RESERVA_ESPACO_CULTURAL',
    'INSCRICAO_OFICINA_CULTURAL',
    'CADASTRO_GRUPO_ARTISTICO',
    'PROJETO_CULTURAL',
    'SUBMISSAO_PROJETO_CULTURAL',
    'CADASTRO_EVENTO_CULTURAL',
    'REGISTRO_MANIFESTACAO_CULTURAL',
    'AGENDA_EVENTOS_CULTURAIS'
  ],
  ESPORTES: [
    'ATENDIMENTOS_ESPORTES',
    'INSCRICAO_ESCOLINHA',
    'CADASTRO_ATLETA',
    'RESERVA_ESPACO_ESPORTIVO',
    'INSCRICAO_COMPETICAO',
    'CADASTRO_EQUIPE_ESPORTIVA',
    'INSCRICAO_TORNEIO',
    'CADASTRO_MODALIDADE',
    'AGENDA_EVENTOS_ESPORTIVOS'
  ],
  HABITACAO: [
    'ATENDIMENTOS_HABITACAO',
    'INSCRICAO_PROGRAMA_HABITACIONAL',
    'REGULARIZACAO_FUNDIARIA',
    'SOLICITACAO_AUXILIO_ALUGUEL',
    'CADASTRO_UNIDADE_HABITACIONAL',
    'INSCRICAO_FILA_HABITACAO',
    'CONSULTA_PROGRAMAS_HABITACIONAIS'
  ],
  MEIO_AMBIENTE: [
    'ATENDIMENTOS_MEIO_AMBIENTE',
    'LICENCA_AMBIENTAL',
    'DENUNCIA_AMBIENTAL',
    'PROGRAMA_AMBIENTAL',
    'AUTORIZACAO_PODA_CORTE',
    'VISTORIA_AMBIENTAL',
    'GESTAO_AREAS_PROTEGIDAS'
  ],
  OBRAS_PUBLICAS: [
    'ATENDIMENTOS_OBRAS',
    'SOLICITACAO_REPARO_VIA',
    'VISTORIA_TECNICA_OBRAS',
    'CADASTRO_OBRA_PUBLICA',
    'INSPECAO_OBRA',
    'ACOMPANHAMENTO_OBRAS',
    'MAPA_OBRAS'
  ],
  PLANEJAMENTO_URBANO: [
    'ATENDIMENTOS_PLANEJAMENTO',
    'APROVACAO_PROJETO',
    'ALVARA_CONSTRUCAO',
    'ALVARA_FUNCIONAMENTO',
    'SOLICITACAO_CERTIDAO',
    'DENUNCIA_CONSTRUCAO_IRREGULAR',
    'CADASTRO_LOTEAMENTO',
    'CONSULTAS_PUBLICAS',
    'MAPA_URBANO'
  ],
  SEGURANCA_PUBLICA: [
    'ATENDIMENTOS_SEGURANCA',
    'REGISTRO_OCORRENCIA',
    'SOLICITACAO_RONDA',
    'SOLICITACAO_CAMERA_SEGURANCA',
    'DENUNCIA_ANONIMA',
    'CADASTRO_PONTO_CRITICO',
    'ALERTA_SEGURANCA',
    'REGISTRO_PATRULHA',
    'GESTAO_GUARDA_MUNICIPAL',
    'GESTAO_VIGILANCIA',
    'ESTATISTICAS_SEGURANCA'
  ],
  SERVICOS_PUBLICOS: [
    'ATENDIMENTOS_SERVICOS_PUBLICOS',
    'ILUMINACAO_PUBLICA',
    'LIMPEZA_URBANA',
    'COLETA_ESPECIAL',
    'SOLICITACAO_CAPINA',
    'SOLICITACAO_DESOBSTRUCAO',
    'SOLICITACAO_PODA',
    'REGISTRO_PROBLEMA_COM_FOTO',
    'GESTAO_EQUIPES_SERVICOS'
  ],
  TURISMO: [
    'ATENDIMENTOS_TURISMO',
    'CADASTRO_ESTABELECIMENTO_TURISTICO',
    'CADASTRO_GUIA_TURISTICO',
    'INSCRICAO_PROGRAMA_TURISTICO',
    'REGISTRO_ATRATIVO_TURISTICO',
    'CADASTRO_ROTEIRO_TURISTICO',
    'CADASTRO_EVENTO_TURISTICO',
    'MAPA_TURISTICO',
    'GUIA_TURISTICO_CIDADE'
  ]
}

/**
 * Estat\u00edsticas do mapeamento
 */
export const MAPPING_STATS = {
  total: 108,
  com_dados: 95,
  informativos: 12,
  gestao_interna: 8,
  secretarias: 13
}
