// Mapeamento de moduleType para MS slug
export const MS_TYPE_TO_SLUG: Record<string, string> = {
  // Saúde
  'CONSULTAS_ESPECIALIZADAS': 'consultas-especializadas',
  'AGENDA_MEDICA': 'agenda-medica',
  'AGENDAMENTO_CONSULTAS': 'agenda-medica',
  'EXAMES_LABORATORIAIS': 'exames',
  'SOLICITACAO_EXAMES': 'exames',
  'DISTRIBUICAO_MEDICAMENTOS': 'medicamentos',
  'FARMACIA_MUNICIPAL': 'medicamentos',
  'CAMPANHA_VACINACAO': 'vacinas',
  'VACINAS': 'vacinas',
  'ENCAMINHAMENTOS_TFD': 'tfd',
  'TFD': 'tfd',

  // Educação
  'TRANSPORTE_ESCOLAR': 'transporte-escolar',
  'MATRICULA_ALUNO': 'matriculas',
  'MATRICULAS': 'matriculas',
  'MERENDA_ESCOLAR': 'merenda',
  'MATERIAL_ESCOLAR': 'material-escolar',
  'UNIFORME_ESCOLAR': 'uniforme',
  'ATIVIDADES_EXTRACURRICULARES': 'atividades-extras',

  // Assistência Social
  'AUXILIO_EMERGENCIAL': 'auxilio-emergencial',
  'CESTA_BASICA': 'cesta-basica',
  'CRAS': 'cras',
  'CREAS': 'creas',
  'BOLSA_FAMILIA': 'bolsa-familia',
  'CADASTRO_UNICO': 'cadastro-unico',
  'CADUNICO': 'cadastro-unico',

  // Agricultura
  'INSUMOS_AGRICOLAS': 'insumos-agricolas',
  'COMERCIALIZACAO_PRODUTOS': 'comercializacao',
  'CADASTRO_PRODUTOR_RURAL': 'cadastro-produtor',
  'ASSISTENCIA_TECNICA_RURAL': 'assistencia-tecnica',
  'CREDITO_AGRICOLA': 'credito-agricola',
  'DISTRIBUICAO_SEMENTES': 'distribuicao-sementes',

  // Cultura
  'PROJETOS_CULTURAIS': 'projetos-culturais',
  'LEI_INCENTIVO_CULTURA': 'lei-incentivo',
  'ESPACOS_CULTURAIS': 'espacos-culturais',
  'EVENTOS_CULTURAIS': 'eventos-culturais',
  'CADASTRO_ARTISTAS': 'artistas-cadastro',
  'PATRIMONIO_CULTURAL': 'patrimonio',

  // Esportes
  'ESCOLINHAS_ESPORTIVAS': 'escolinhas',
  'PROJETOS_ESPORTIVOS': 'projetos-esportivos',
  'EVENTOS_ESPORTIVOS': 'eventos-esportivos',
  'QUADRAS_GINASIOS': 'quadras',
  'CADASTRO_ATLETAS': 'atletas-cadastro',
  'COMPETICOES_ESPORTIVAS': 'competicoes',

  // Habitação
  'CASA_POPULAR': 'casa-popular',
  'REGULARIZACAO_FUNDIARIA': 'regularizacao-fundiaria',
  'MELHORIAS_HABITACIONAIS': 'melhorias-habitacionais',
  'ALUGUEL_SOCIAL': 'aluguel-social',
  'LOTES_URBANIZADOS': 'lotes-urbanizados',
  'CADASTRO_HABITACIONAL': 'cadastro-habitacional',

  // Meio Ambiente
  'LICENCIAMENTO_AMBIENTAL': 'licenciamento',
  'PODA_ARVORES': 'poda-arvores',
  'COLETA_SELETIVA': 'coleta-seletiva',
  'DENUNCIA_AMBIENTAL': 'denuncia-ambiental',
  'EDUCACAO_AMBIENTAL': 'educacao-ambiental',
  'AREAS_VERDES': 'areas-verdes',

  // Obras
  'TAPA_BURACOS': 'tapa-buracos',
  'ILUMINACAO_PUBLICA': 'iluminacao-publica',
  'DRENAGEM': 'drenagem',
  'CALCAMENTO': 'calcamento',
  'SINALIZACAO_VIARIA': 'sinalizacao',
  'PAVIMENTACAO': 'pavimentacao',

  // Planejamento
  'ALVARA_CONSTRUCAO': 'alvara-construcao',
  'FISCALIZACAO_OBRAS': 'fiscalizacao-obras',
  'HABITE_SE': 'habite-se',
  'PARCELAMENTO_SOLO': 'parcelamento-solo',
  'ZONEAMENTO': 'zoneamento',
  'CERTIDOES': 'certidoes',

  // Turismo
  'CADASTRO_TURISTICO': 'cadastro-turistico',
  'EVENTOS_TURISTICOS': 'eventos-turisticos',
  'GUIAS_TURISMO': 'guias-turismo',
  'HOSPEDAGEM': 'hospedagem',
  'INFORMACOES_TURISTICAS': 'informacoes-turisticas',
  'ROTEIROS_TURISTICOS': 'roteiros-turisticos',

  // Serviços Gerais
  'CANIL_MUNICIPAL': 'canil-municipal',
  'CEMITERIO': 'cemiterio',
  'CONTROLE_ZOONOSES': 'controle-zoonoses',
  'DEFESA_CIVIL': 'defesa-civil',
  'FEIRA_LIVRE': 'feira-livre',
  'LIMPEZA_PUBLICA': 'limpeza-publica',

  // Segurança
  'RONDA_ESCOLAR': 'ronda-escolar',
  'TRANSPORTE_PUBLICO': 'transporte-publico',
  'VIDEOMONITORAMENTO': 'videomonitoramento',
  'GUARDA_MUNICIPAL': 'guarda-municipal',
  'ILUMINACAO_SEGURANCA': 'iluminacao-seguranca',
  'PROTECAO_COMUNITARIA': 'protecao-comunitaria',
};

/**
 * Detecta se um serviço é um Micro Sistema
 */
export function isMicroSystem(moduleType: string | null | undefined): boolean {
  if (!moduleType) return false;

  // Verifica se começa com MS_
  if (moduleType.startsWith('MS_')) return true;

  // Verifica se está no mapeamento
  return moduleType in MS_TYPE_TO_SLUG;
}

/**
 * Retorna o slug do MS baseado no moduleType
 */
export function getMSSlug(moduleType: string | null | undefined, fallbackSlug?: string): string | null {
  if (!moduleType) return fallbackSlug || null;

  // Se começa com MS_, remove o prefixo e converte para kebab-case
  if (moduleType.startsWith('MS_')) {
    return moduleType
      .replace('MS_', '')
      .toLowerCase()
      .replace(/_/g, '-');
  }

  // Busca no mapeamento
  return MS_TYPE_TO_SLUG[moduleType] || fallbackSlug || null;
}

/**
 * Retorna a rota correta para um serviço (MS ou serviço normal)
 */
export function getServiceRoute(
  moduleType: string | null | undefined,
  slug: string,
  department: string
): string {
  if (isMicroSystem(moduleType)) {
    const msSlug = getMSSlug(moduleType, slug);
    return `/admin/ms/${msSlug}`;
  }

  return `/admin/secretarias/${department}/${slug}`;
}
