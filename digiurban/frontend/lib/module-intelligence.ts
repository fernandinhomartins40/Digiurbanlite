/**
 * ============================================================================
 * MÓDULO DE INTELIGÊNCIA - Detecção Automática de Capacidades e Recursos
 * ============================================================================
 *
 * Analisa o serviço e seus dados para detectar:
 * - Recursos disponíveis (mapa, agenda, galeria, etc)
 * - Modo de operação (cadastro, agendamento, licenciamento, etc)
 * - Campos especiais (sensíveis, obrigatórios, chave)
 * - Visualização recomendada
 */

export type ModuleMode =
  | 'CADASTRO'        // Cadastros de pessoas/entidades
  | 'AGENDAMENTO'     // Agendamentos/consultas
  | 'VINCULACAO'      // Matrículas/inscrições com vínculos
  | 'SOLICITACAO'     // Solicitações de recursos/serviços
  | 'LICENCIAMENTO'   // Licenças/autorizações
  | 'GENERICO';       // Outros

export type VisualizationType =
  | 'CARDS'           // Cards com perfis/resumos
  | 'CALENDAR'        // Calendário/agenda
  | 'MAP'             // Mapa geográfico
  | 'TREE'            // Árvore de relacionamentos
  | 'TIMELINE'        // Linha do tempo
  | 'GALLERY'         // Galeria de imagens
  | 'TABLE';          // Tabela tradicional

export interface ModuleCapabilities {
  // Recursos detectados
  hasGeolocation: boolean;
  hasScheduling: boolean;
  hasImages: boolean;
  hasLinkedCitizens: boolean;
  hasDocuments: boolean;
  hasNumericData: boolean;

  // Modo de operação
  mode: ModuleMode;

  // Campos especiais
  keyFields: string[];          // Campos principais (nome, CPF, etc)
  sensitiveFields: string[];    // Campos sensíveis (dados pessoais)
  requiredFields: string[];     // Campos obrigatórios
  dateFields: string[];         // Campos de data
  locationFields: string[];     // Campos de localização
  imageFields: string[];        // Campos de imagem

  // Visualizações recomendadas
  recommendedVisualization: VisualizationType;
  supportedVisualizations: VisualizationType[];

  // Estatísticas de schema
  totalFields: number;
  citizenFieldsCount: number;
  customFieldsCount: number;
}

/**
 * Verifica se o schema possui campos específicos
 */
function hasFields(schema: any, fieldPatterns: string[]): boolean {
  if (!schema?.properties) return false;

  const allFields = Object.keys(schema.properties).join(' ').toLowerCase();

  return fieldPatterns.some(pattern =>
    allFields.includes(pattern.toLowerCase())
  );
}

/**
 * Extrai campos que correspondem a padrões
 */
function extractFieldsByPattern(schema: any, patterns: string[]): string[] {
  if (!schema?.properties) return [];

  const fields: string[] = [];

  Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
    const keyLower = key.toLowerCase();
    const titleLower = (value.title || '').toLowerCase();

    if (patterns.some(pattern =>
      keyLower.includes(pattern.toLowerCase()) ||
      titleLower.includes(pattern.toLowerCase())
    )) {
      fields.push(key);
    }
  });

  return fields;
}

/**
 * Detecta o modo de operação baseado no moduleType
 */
export function detectModuleMode(moduleType: string): ModuleMode {
  const type = moduleType?.toUpperCase() || '';

  // Cadastros
  if (/CADASTRO|REGISTRO|INSCRICAO_(?!.*EVENTO)/.test(type)) {
    return 'CADASTRO';
  }

  // Agendamentos
  if (/AGENDAMENTO|CONSULTA|MARCACAO|RESERVA/.test(type)) {
    return 'AGENDAMENTO';
  }

  // Vinculações (matrículas, inscrições com dependentes)
  if (/MATRICULA|VINCULACAO|INSCRICAO_.*(?:ALUNO|CRIANCA|DEPENDENTE)/.test(type)) {
    return 'VINCULACAO';
  }

  // Solicitações
  if (/SOLICITACAO|PEDIDO|REQUISICAO/.test(type)) {
    return 'SOLICITACAO';
  }

  // Licenciamentos
  if (/LICENC|AUTORIZACAO|ALVARA|PERMISSAO/.test(type)) {
    return 'LICENCIAMENTO';
  }

  return 'GENERICO';
}

/**
 * Extrai campos-chave (identificadores principais)
 */
function extractKeyFields(schema: any): string[] {
  const keyPatterns = [
    'nome', 'name', 'cpf', 'rg', 'email', 'telefone', 'phone',
    'matricula', 'numero', 'codigo', 'identificador'
  ];

  return extractFieldsByPattern(schema, keyPatterns);
}

/**
 * Extrai campos sensíveis (dados pessoais)
 */
function extractSensitiveFields(schema: any): string[] {
  const sensitivePatterns = [
    'cpf', 'rg', 'senha', 'password', 'cartao', 'conta',
    'renda', 'income', 'salario', 'beneficio'
  ];

  return extractFieldsByPattern(schema, sensitivePatterns);
}

/**
 * Extrai campos de data
 */
function extractDateFields(schema: any): string[] {
  if (!schema?.properties) return [];

  const dateFields: string[] = [];

  Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
    if (
      value.type === 'string' &&
      (value.format === 'date' || value.format === 'date-time')
    ) {
      dateFields.push(key);
    }

    const keyLower = key.toLowerCase();
    if (keyLower.includes('data') || keyLower.includes('date') ||
        keyLower.includes('nascimento') || keyLower.includes('birth')) {
      dateFields.push(key);
    }
  });

  return [...new Set(dateFields)];
}

/**
 * Extrai campos de localização
 */
function extractLocationFields(schema: any): string[] {
  const locationPatterns = [
    'latitude', 'longitude', 'lat', 'lng', 'coordenada',
    'endereco', 'address', 'cep', 'zipcode', 'bairro', 'cidade'
  ];

  return extractFieldsByPattern(schema, locationPatterns);
}

/**
 * Extrai campos de imagem
 */
function extractImageFields(schema: any): string[] {
  const imagePatterns = [
    'foto', 'photo', 'imagem', 'image', 'anexo', 'arquivo',
    'documento', 'comprovante'
  ];

  return extractFieldsByPattern(schema, imagePatterns);
}

/**
 * Extrai campos obrigatórios
 */
function extractRequiredFields(schema: any): string[] {
  return schema?.required || [];
}

/**
 * Recomenda visualização baseada no modo e dados
 */
function recommendVisualization(
  mode: ModuleMode,
  capabilities: Partial<ModuleCapabilities>
): VisualizationType {
  // Prioridade 1: Recursos especiais
  if (capabilities.hasLinkedCitizens) return 'TREE';
  if (capabilities.hasScheduling) return 'CALENDAR';
  if (capabilities.hasGeolocation) return 'MAP';
  if (capabilities.hasImages) return 'GALLERY';

  // Prioridade 2: Modo de operação
  switch (mode) {
    case 'CADASTRO':
      return 'CARDS';
    case 'AGENDAMENTO':
      return 'CALENDAR';
    case 'VINCULACAO':
      return 'TREE';
    case 'LICENCIAMENTO':
      return 'TIMELINE';
    default:
      return 'TABLE';
  }
}

/**
 * Determina visualizações suportadas
 */
function getSupportedVisualizations(capabilities: Partial<ModuleCapabilities>): VisualizationType[] {
  const supported: VisualizationType[] = ['TABLE']; // Sempre suporta tabela

  if (capabilities.hasGeolocation) supported.push('MAP');
  if (capabilities.hasScheduling) supported.push('CALENDAR');
  if (capabilities.hasImages) supported.push('GALLERY');
  if (capabilities.hasLinkedCitizens) supported.push('TREE');

  // Sempre adiciona CARDS se tiver dados suficientes
  if ((capabilities.totalFields || 0) >= 3) {
    supported.push('CARDS');
  }

  return supported;
}

/**
 * 🎯 FUNÇÃO PRINCIPAL - Detecta todas as capacidades do módulo
 */
export function detectModuleCapabilities(service: any): ModuleCapabilities {
  const schema = service?.formSchema;
  const moduleType = service?.moduleType || '';

  // Detectar recursos
  const hasGeolocation = hasFields(schema, ['latitude', 'longitude', 'coordenada']) ||
                         extractLocationFields(schema).length >= 2;

  const hasScheduling = hasFields(schema, [
    'data', 'horario', 'agendamento', 'dataDesejada', 'dataPreferida',
    'schedule', 'appointment', 'booking'
  ]);

  const hasImages = hasFields(schema, [
    'foto', 'imagem', 'anexo', 'arquivo', 'photo', 'image'
  ]);

  const hasLinkedCitizens = !!service?.linkedCitizensConfig;

  const hasDocuments = service?.requiresDocuments === true;

  const hasNumericData = schema?.properties &&
    Object.values(schema.properties).some((prop: any) =>
      prop.type === 'number' || prop.type === 'integer'
    );

  // Detectar modo
  const mode = detectModuleMode(moduleType);

  // Extrair campos
  const keyFields = extractKeyFields(schema);
  const sensitiveFields = extractSensitiveFields(schema);
  const requiredFields = extractRequiredFields(schema);
  const dateFields = extractDateFields(schema);
  const locationFields = extractLocationFields(schema);
  const imageFields = extractImageFields(schema);

  // Estatísticas
  const totalFields = schema?.properties ? Object.keys(schema.properties).length : 0;
  const citizenFieldsCount = schema?.citizenFields?.length || 0;
  const customFieldsCount = totalFields - citizenFieldsCount;

  // Montar capabilities parcial para recomendação
  const partialCapabilities: Partial<ModuleCapabilities> = {
    hasGeolocation,
    hasScheduling,
    hasImages,
    hasLinkedCitizens,
    totalFields,
  };

  // Recomendar visualização
  const recommendedVisualization = recommendVisualization(mode, partialCapabilities);
  const supportedVisualizations = getSupportedVisualizations(partialCapabilities);

  return {
    // Recursos
    hasGeolocation,
    hasScheduling,
    hasImages,
    hasLinkedCitizens,
    hasDocuments,
    hasNumericData,

    // Modo
    mode,

    // Campos
    keyFields,
    sensitiveFields,
    requiredFields,
    dateFields,
    locationFields,
    imageFields,

    // Visualizações
    recommendedVisualization,
    supportedVisualizations,

    // Estatísticas
    totalFields,
    citizenFieldsCount,
    customFieldsCount,
  };
}

/**
 * Helper para verificar se deve mostrar aba de mapa
 */
export function shouldShowMapTab(capabilities: ModuleCapabilities): boolean {
  return capabilities.hasGeolocation && capabilities.locationFields.length >= 2;
}

/**
 * Helper para verificar se deve mostrar aba de agenda
 */
export function shouldShowCalendarTab(capabilities: ModuleCapabilities): boolean {
  return capabilities.hasScheduling && capabilities.dateFields.length >= 1;
}

/**
 * Helper para verificar se deve mostrar aba de galeria
 */
export function shouldShowGalleryTab(capabilities: ModuleCapabilities): boolean {
  return capabilities.hasImages && capabilities.imageFields.length >= 1;
}

/**
 * Helper para verificar se deve mostrar aba de vínculos
 */
export function shouldShowLinkedCitizensTab(capabilities: ModuleCapabilities): boolean {
  return capabilities.hasLinkedCitizens;
}

/**
 * Determina label amigável para o modo
 */
export function getModeModeLabel(mode: ModuleMode): string {
  const labels: Record<ModuleMode, string> = {
    CADASTRO: 'Cadastro',
    AGENDAMENTO: 'Agendamento',
    VINCULACAO: 'Vinculação',
    SOLICITACAO: 'Solicitação',
    LICENCIAMENTO: 'Licenciamento',
    GENERICO: 'Geral',
  };

  return labels[mode];
}

/**
 * Determina ícone recomendado para visualização
 */
export function getVisualizationIcon(type: VisualizationType): string {
  const icons: Record<VisualizationType, string> = {
    CARDS: 'LayoutGrid',
    CALENDAR: 'Calendar',
    MAP: 'Map',
    TREE: 'Network',
    TIMELINE: 'GitBranch',
    GALLERY: 'Images',
    TABLE: 'Table',
  };

  return icons[type];
}
