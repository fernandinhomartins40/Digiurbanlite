/**
 * Sistema de Inteligência para Dados Consolidados
 * Detecta automaticamente o melhor modo de visualização baseado no tipo de serviço
 */

export type ConsolidatedMode =
  | 'CADASTRO'           // Cadastros de cidadãos, produtores, empresas, atletas
  | 'INSCRICOES'         // Inscrições em cursos, capacitações, eventos
  | 'DENUNCIA'           // Denúncias, fiscalizações, vistorias
  | 'LICENCA'            // Licenças, alvarás, autorizações
  | 'AGENDAMENTO'        // Agendamentos, consultas, reservas
  | 'GENERICO';          // Fallback para outros tipos

export type VisualizationView =
  | 'CARDS_WITH_SEARCH'       // Cards pesquisáveis (cadastros)
  | 'TABLE_WITH_STATUS'       // Tabela com status (inscrições)
  | 'MAP_WITH_FILTERS'        // Mapa interativo (denúncias)
  | 'TIMELINE_WITH_EXPIRY'    // Timeline com validade (licenças)
  | 'CALENDAR_WITH_SLOTS'     // Calendário com horários (agendamentos)
  | 'TABLE_WITH_SEARCH';      // Tabela pesquisável (genérico)

export interface ConsolidatedModeConfig {
  mode: ConsolidatedMode;
  title: string;
  icon: string;
  description: string;
  view: VisualizationView;
  keyField: string;
  secondaryFields: string[];
  actions: ConsolidatedAction[];
  filters: ConsolidatedFilter[];
}

export interface ConsolidatedAction {
  id: string;
  label: string;
  icon: string;
  type: 'single' | 'bulk' | 'global';
  handler: string; // Nome da função handler
}

export interface ConsolidatedFilter {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'text';
  options?: { value: string; label: string }[];
}

export interface ConsolidatedRecord {
  id: string;                           // ID do protocolo
  protocolNumber: string;               // #2025-001
  approvedAt: Date;                     // Data de conclusão
  citizenName: string;                  // Nome do cidadão
  citizenCpf?: string;                  // CPF do cidadão
  data: Record<string, any>;            // customData do protocolo
  status: 'ATIVO' | 'INATIVO' | 'VENCIDO' | 'APROVADO' | 'AGUARDANDO';
  metadata?: {
    hasPhoto?: boolean;
    hasDocuments?: boolean;
    expiryDate?: Date;
    latitude?: number;
    longitude?: number;
  };
}

/**
 * Detecta o modo consolidado baseado no tipo de serviço
 */
export function detectConsolidatedMode(service: any): ConsolidatedModeConfig {
  const moduleType = service?.moduleType || '';
  const schema = service?.formSchema;

  // MODO 1: CADASTROS (Cidadãos, Produtores, Empresas, Atletas)
  if (/CADASTRO|REGISTRO/.test(moduleType)) {
    return {
      mode: 'CADASTRO',
      title: detectCadastroTitle(moduleType),
      icon: '📋',
      description: 'Cadastros aprovados e ativos no sistema',
      view: 'CARDS_WITH_SEARCH',
      keyField: detectKeyField(schema, ['nome', 'razao_social', 'nome_completo']),
      secondaryFields: detectSecondaryFields(schema, ['cpf', 'cnpj', 'email', 'telefone', 'endereco']),
      actions: [
        { id: 'view_protocol', label: 'Ver Protocolo', icon: 'FileText', type: 'single', handler: 'handleViewProtocol' },
        { id: 'export_card', label: 'Exportar Ficha', icon: 'Download', type: 'single', handler: 'handleExportCard' },
        { id: 'export_all', label: 'Exportar Todos', icon: 'FileSpreadsheet', type: 'global', handler: 'handleExportAll' },
      ],
      filters: [
        { id: 'status', label: 'Status', type: 'select', options: [
          { value: 'ATIVO', label: 'Ativos' },
          { value: 'INATIVO', label: 'Inativos' },
        ]},
        { id: 'search', label: 'Buscar', type: 'text' },
      ],
    };
  }

  // MODO 2: INSCRIÇÕES (Cursos, Capacitações, Eventos)
  if (/CURSO|CAPACITACAO|EVENTO|INSCRICAO/.test(moduleType)) {
    return {
      mode: 'INSCRICOES',
      title: 'Lista de Inscritos',
      icon: '🎓',
      description: 'Todos os inscritos e seu status de aprovação',
      view: 'TABLE_WITH_STATUS',
      keyField: 'nome',
      secondaryFields: ['cpf', 'email', 'telefone', 'data_inscricao'],
      actions: [
        { id: 'export_attendance', label: 'Exportar Lista de Presença', icon: 'FileText', type: 'global', handler: 'handleExportAttendance' },
        { id: 'send_email', label: 'Enviar Email em Massa', icon: 'Mail', type: 'bulk', handler: 'handleSendBulkEmail' },
        { id: 'generate_certificates', label: 'Gerar Certificados', icon: 'Award', type: 'bulk', handler: 'handleGenerateCertificates' },
      ],
      filters: [
        { id: 'status', label: 'Status', type: 'select', options: [
          { value: 'APROVADO', label: 'Aprovados' },
          { value: 'AGUARDANDO', label: 'Aguardando' },
        ]},
      ],
    };
  }

  // MODO 3: DENÚNCIAS (Denúncias, Fiscalizações, Vistorias)
  if (/DENUNCIA|FISCALIZACAO|VISTORIA/.test(moduleType)) {
    return {
      mode: 'DENUNCIA',
      title: 'Denúncias Registradas',
      icon: '🗺️',
      description: 'Visualização geográfica das denúncias',
      view: 'MAP_WITH_FILTERS',
      keyField: 'descricao',
      secondaryFields: ['endereco', 'latitude', 'longitude', 'status', 'tipo'],
      actions: [
        { id: 'filter_status', label: 'Filtrar por Status', icon: 'Filter', type: 'global', handler: 'handleFilterStatus' },
        { id: 'export_map', label: 'Exportar Mapa', icon: 'Map', type: 'global', handler: 'handleExportMap' },
        { id: 'generate_report', label: 'Gerar Relatório', icon: 'FileText', type: 'global', handler: 'handleGenerateReport' },
      ],
      filters: [
        { id: 'status', label: 'Status', type: 'select', options: [
          { value: 'ATIVO', label: 'Pendentes' },
          { value: 'EM_ANALISE', label: 'Em Análise' },
          { value: 'INATIVO', label: 'Resolvidas' },
        ]},
        { id: 'region', label: 'Região', type: 'text' },
      ],
    };
  }

  // MODO 4: LICENÇAS (Licenças, Alvarás, Autorizações)
  if (/LICENC|ALVARA|AUTORIZACAO/.test(moduleType)) {
    return {
      mode: 'LICENCA',
      title: 'Licenças Ativas',
      icon: '📜',
      description: 'Controle de licenças e datas de validade',
      view: 'TIMELINE_WITH_EXPIRY',
      keyField: 'numero_licenca',
      secondaryFields: ['titular', 'validade', 'tipo', 'status'],
      actions: [
        { id: 'filter_expiry', label: 'Filtrar por Validade', icon: 'Calendar', type: 'global', handler: 'handleFilterExpiry' },
        { id: 'send_notification', label: 'Notificar Vencimento', icon: 'Bell', type: 'bulk', handler: 'handleSendExpiryNotification' },
        { id: 'renew', label: 'Renovar Licença', icon: 'RefreshCw', type: 'single', handler: 'handleRenewLicense' },
      ],
      filters: [
        { id: 'expiry', label: 'Validade', type: 'select', options: [
          { value: 'ATIVO', label: 'Ativas' },
          { value: 'VENCIDO', label: 'Vencidas' },
          { value: 'VENCENDO', label: 'Próximas ao Vencimento' },
        ]},
      ],
    };
  }

  // MODO 5: AGENDAMENTOS (Consultas, Reservas)
  if (/AGENDAMENTO|CONSULTA|RESERVA/.test(moduleType)) {
    return {
      mode: 'AGENDAMENTO',
      title: 'Agendamentos Confirmados',
      icon: '📅',
      description: 'Visualização em calendário dos agendamentos',
      view: 'CALENDAR_WITH_SLOTS',
      keyField: 'data',
      secondaryFields: ['horario', 'cidadao', 'tipo', 'status'],
      actions: [
        { id: 'export_calendar', label: 'Exportar Agenda', icon: 'Calendar', type: 'global', handler: 'handleExportCalendar' },
        { id: 'send_reminder', label: 'Enviar Lembrete', icon: 'Bell', type: 'bulk', handler: 'handleSendReminder' },
      ],
      filters: [
        { id: 'date_range', label: 'Período', type: 'date' },
        { id: 'status', label: 'Status', type: 'select', options: [
          { value: 'APROVADO', label: 'Confirmados' },
          { value: 'AGUARDANDO', label: 'Aguardando' },
        ]},
      ],
    };
  }

  // MODO GENÉRICO: Fallback
  return {
    mode: 'GENERICO',
    title: 'Dados Registrados',
    icon: '📊',
    description: 'Visualização dos dados coletados',
    view: 'TABLE_WITH_SEARCH',
    keyField: detectKeyField(schema, Object.keys(schema?.properties || {})),
    secondaryFields: Object.keys(schema?.properties || {}).slice(0, 5),
    actions: [
      { id: 'export', label: 'Exportar', icon: 'Download', type: 'global', handler: 'handleExport' },
    ],
    filters: [
      { id: 'search', label: 'Buscar', type: 'text' },
    ],
  };
}

/**
 * Detecta o título específico para cadastros
 */
function detectCadastroTitle(moduleType: string): string {
  if (/PRODUTOR/.test(moduleType)) return 'Produtores Cadastrados';
  if (/ATLETA/.test(moduleType)) return 'Atletas Cadastrados';
  if (/EMPRESA/.test(moduleType)) return 'Empresas Cadastradas';
  if (/PROFISSIONAL/.test(moduleType)) return 'Profissionais Cadastrados';
  return 'Cadastros Aprovados';
}

/**
 * Detecta o campo principal (chave) do schema
 */
function detectKeyField(schema: any, candidates: string[]): string {
  if (!schema?.properties) return 'id';

  const properties = Object.keys(schema.properties);

  for (const candidate of candidates) {
    if (properties.some(p => p.toLowerCase().includes(candidate.toLowerCase()))) {
      return properties.find(p => p.toLowerCase().includes(candidate.toLowerCase())) || 'id';
    }
  }

  return properties[0] || 'id';
}

/**
 * Detecta campos secundários importantes
 */
function detectSecondaryFields(schema: any, candidates: string[]): string[] {
  if (!schema?.properties) return [];

  const properties = Object.keys(schema.properties);
  const found: string[] = [];

  for (const candidate of candidates) {
    const field = properties.find(p => p.toLowerCase().includes(candidate.toLowerCase()));
    if (field) found.push(field);
  }

  return found.slice(0, 4); // Max 4 campos secundários
}

/**
 * Converte protocolo CONCLUÍDO em registro consolidado
 */
export function protocolToConsolidatedRecord(protocol: any, config: ConsolidatedModeConfig): ConsolidatedRecord {
  const data = protocol.customData || {};

  // Calcular status baseado no modo
  let status: ConsolidatedRecord['status'] = 'ATIVO';

  if (config.mode === 'LICENCA') {
    // Verificar validade para licenças
    const validadeField = config.secondaryFields.find(f => /validade|vencimento/.test(f));
    if (validadeField && data[validadeField]) {
      const validade = new Date(data[validadeField]);
      const now = new Date();
      const daysToExpiry = Math.ceil((validade.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysToExpiry < 0) status = 'VENCIDO';
      else if (daysToExpiry <= 30) status = 'ATIVO'; // Próximo ao vencimento
      else status = 'ATIVO';
    }
  } else if (config.mode === 'INSCRICOES') {
    // Status de inscrição
    status = protocol.status === 'CONCLUIDO' ? 'APROVADO' : 'AGUARDANDO';
  }

  return {
    id: protocol.id,
    protocolNumber: protocol.number,
    approvedAt: new Date(protocol.updatedAt || protocol.createdAt),
    citizenName: protocol.citizen?.nome || 'Não informado',
    citizenCpf: protocol.citizen?.cpf,
    data,
    status,
    metadata: {
      hasPhoto: !!data.foto || !!data.imagem,
      hasDocuments: protocol.requiresDocuments,
      expiryDate: detectExpiryDate(data, config),
      latitude: data.latitude || protocol.latitude,
      longitude: data.longitude || protocol.longitude,
    },
  };
}

/**
 * Detecta data de validade nos dados
 */
function detectExpiryDate(data: any, config: ConsolidatedModeConfig): Date | undefined {
  const validadeFields = ['validade', 'vencimento', 'expiracao', 'data_vencimento'];

  for (const field of validadeFields) {
    const found = config.secondaryFields.find(f => f.toLowerCase().includes(field));
    if (found && data[found]) {
      return new Date(data[found]);
    }
  }

  return undefined;
}

/**
 * Calcula estatísticas dos registros consolidados
 */
export function calculateConsolidatedStats(records: ConsolidatedRecord[]) {
  const total = records.length;
  const ativos = records.filter(r => r.status === 'ATIVO').length;
  const inativos = records.filter(r => r.status === 'INATIVO').length;
  const vencidos = records.filter(r => r.status === 'VENCIDO').length;
  const aprovados = records.filter(r => r.status === 'APROVADO').length;
  const aguardando = records.filter(r => r.status === 'AGUARDANDO').length;

  return {
    total,
    ativos,
    inativos,
    vencidos,
    aprovados,
    aguardando,
    taxaAprovacao: total > 0 ? Math.round((aprovados / total) * 100) : 0,
  };
}
