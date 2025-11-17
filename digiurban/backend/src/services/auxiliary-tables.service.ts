/**
 * ============================================================================
 * AUXILIARY TABLES SERVICE
 * ============================================================================
 * Serviço centralizado para acessar tabelas auxiliares do sistema
 * (UnidadeSaude, UnidadeEducacao, EspacoPublico, etc.)
 *
 * Permite popular campos select-table dinamicamente com dados das tabelas.
 */

import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

// ========================================
// TYPES
// ========================================

export interface TableDataSource {
  /** Nome da tabela auxiliar */
  table: string;
  /** Filtros a aplicar (ex: { tipo: 'UBS', isActive: true }) */
  filters?: Record<string, any>;
  /** Campos para ordenação */
  orderBy?: string | { [key: string]: 'asc' | 'desc' };
  /** Limite de resultados */
  limit?: number;
  /** Offset para paginação */
  offset?: number;
}

export interface TableOption {
  /** Valor (geralmente o ID) */
  value: string;
  /** Label principal */
  label: string;
  /** Dados adicionais para exibição */
  metadata?: Record<string, any>;
}

export interface TableMetadata {
  /** Nome da tabela */
  table: string;
  /** Nome amigável */
  displayName: string;
  /** Descrição */
  description?: string;
  /** Campos disponíveis */
  fields: string[];
  /** Campo padrão para label */
  defaultLabelField: string;
  /** Filtros comuns */
  commonFilters?: Record<string, any>;
}

// ========================================
// TABLE MAP
// ========================================

/**
 * Mapa de todas as tabelas auxiliares disponíveis
 */
export const AUXILIARY_TABLES: Record<string, any> = {
  // Saúde
  UnidadeSaude: prisma.unidadeSaude,
  EspecialidadeMedica: prisma.especialidadeMedica,
  ProfissionalSaude: prisma.profissionalSaude,

  // Educação
  UnidadeEducacao: prisma.unidadeEducacao,
  Professor: prisma.professor,
  CursoProfissionalizante: prisma.cursoProfissionalizante,

  // Assistência Social
  UnidadeCRAS: prisma.unidadeCRAS,
  ProgramaSocial: prisma.programaSocial,

  // Esportes e Lazer
  EspacoPublico: prisma.espacoPublico,
  ModalidadeEsportiva: prisma.modalidadeEsportiva,
  ParquePraca: prisma.parquePraca,

  // Cultura
  TipoAtividadeCultural: prisma.tipoAtividadeCultural,

  // Habitação
  ConjuntoHabitacional: prisma.conjuntoHabitacional,
  ProgramaHabitacional: prisma.programaHabitacional,

  // Obras e Serviços
  TipoObraServico: prisma.tipoObraServico,

  // Segurança
  ViaturaSeguranca: prisma.viaturaSeguranca,
  TipoOcorrencia: prisma.tipoOcorrencia,

  // Meio Ambiente
  EspecieArvore: prisma.especieArvore,
  ProgramaAmbiental: prisma.programaAmbiental,

  // Agricultura
  TipoProducaoAgricola: prisma.tipoProducaoAgricola,
  MaquinaAgricola: prisma.maquinaAgricola,

  // Turismo
  EstabelecimentoTuristico: prisma.estabelecimentoTuristico,
  TipoEstabelecimentoTuristico: prisma.tipoEstabelecimentoTuristico,
  GuiaTuristico: prisma.guiaTuristico,

  // Documentos
  TipoDocumento: prisma.tipoDocumento,
};

/**
 * Metadados de cada tabela
 */
export const TABLE_METADATA: Record<string, TableMetadata> = {
  UnidadeSaude: {
    table: 'UnidadeSaude',
    displayName: 'Unidades de Saúde',
    description: 'UBS, UPA, Hospitais, Clínicas',
    fields: ['id', 'nome', 'tipo', 'endereco', 'bairro', 'telefone', 'horario', 'especialidades'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  UnidadeEducacao: {
    table: 'UnidadeEducacao',
    displayName: 'Unidades de Educação',
    description: 'Escolas, Creches, CEIs',
    fields: ['id', 'nome', 'tipo', 'endereco', 'bairro', 'telefone', 'niveisEnsino', 'turnos'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  UnidadeCRAS: {
    table: 'UnidadeCRAS',
    displayName: 'Unidades de Assistência Social',
    description: 'CRAS, CREAS',
    fields: ['id', 'nome', 'tipo', 'endereco', 'bairro', 'telefone', 'programas'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  EspacoPublico: {
    table: 'EspacoPublico',
    displayName: 'Espaços Públicos',
    description: 'Quadras, Ginásios, Teatros, Centros Culturais',
    fields: ['id', 'nome', 'tipo', 'categoria', 'endereco', 'capacidade', 'comodidades'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  ConjuntoHabitacional: {
    table: 'ConjuntoHabitacional',
    displayName: 'Conjuntos Habitacionais',
    fields: ['id', 'nome', 'bairro', 'totalUnidades', 'unidadesDisponiveis', 'programaOrigem'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  ViaturaSeguranca: {
    table: 'ViaturaSeguranca',
    displayName: 'Viaturas de Segurança',
    fields: ['id', 'codigo', 'tipo', 'placa', 'modelo', 'status', 'baseOperacional'],
    defaultLabelField: 'codigo',
    commonFilters: { isActive: true, status: 'Ativa' },
  },
  ParquePraca: {
    table: 'ParquePraca',
    displayName: 'Parques e Praças',
    fields: ['id', 'nome', 'tipo', 'bairro', 'equipamentos', 'permiteEventos'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  EstabelecimentoTuristico: {
    table: 'EstabelecimentoTuristico',
    displayName: 'Estabelecimentos Turísticos',
    fields: ['id', 'nome', 'tipo', 'endereco', 'telefone', 'categoria', 'servicos'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  ProgramaSocial: {
    table: 'ProgramaSocial',
    displayName: 'Programas Sociais',
    fields: ['id', 'nome', 'tipo', 'descricao', 'criteriosElegibilidade', 'valorBeneficio'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  ProgramaHabitacional: {
    table: 'ProgramaHabitacional',
    displayName: 'Programas Habitacionais',
    fields: ['id', 'nome', 'tipo', 'descricao', 'criteriosElegibilidade', 'rendaMaxima'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  ProgramaAmbiental: {
    table: 'ProgramaAmbiental',
    displayName: 'Programas Ambientais',
    fields: ['id', 'nome', 'tipo', 'descricao', 'objetivos', 'publicoAlvo'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  EspecialidadeMedica: {
    table: 'EspecialidadeMedica',
    displayName: 'Especialidades Médicas',
    fields: ['id', 'nome', 'area', 'descricao', 'requisitosPaciente'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  TipoObraServico: {
    table: 'TipoObraServico',
    displayName: 'Tipos de Obra e Serviço',
    fields: ['id', 'nome', 'categoria', 'descricao', 'tempoMedioExecucao'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  TipoProducaoAgricola: {
    table: 'TipoProducaoAgricola',
    displayName: 'Tipos de Produção Agrícola',
    fields: ['id', 'nome', 'categoria', 'subcategoria', 'sazonalidade'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  MaquinaAgricola: {
    table: 'MaquinaAgricola',
    displayName: 'Máquinas Agrícolas',
    fields: ['id', 'tipo', 'identificacao', 'status', 'capacidade'],
    defaultLabelField: 'identificacao',
    commonFilters: { isActive: true, status: 'Disponível' },
  },
  EspecieArvore: {
    table: 'EspecieArvore',
    displayName: 'Espécies de Árvore',
    fields: ['id', 'nomeComum', 'nomeCientifico', 'origem', 'porte', 'adequadaCalcada'],
    defaultLabelField: 'nomeComum',
    commonFilters: { isActive: true },
  },
  ModalidadeEsportiva: {
    table: 'ModalidadeEsportiva',
    displayName: 'Modalidades Esportivas',
    fields: ['id', 'nome', 'categoria', 'tipo', 'faixasEtarias'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  TipoAtividadeCultural: {
    table: 'TipoAtividadeCultural',
    displayName: 'Tipos de Atividade Cultural',
    fields: ['id', 'nome', 'categoria', 'materialNecessario', 'duracaoMedia'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  TipoOcorrencia: {
    table: 'TipoOcorrencia',
    displayName: 'Tipos de Ocorrência',
    fields: ['id', 'nome', 'categoria', 'gravidade', 'tempoRespostaPadrao'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  TipoDocumento: {
    table: 'TipoDocumento',
    displayName: 'Tipos de Documento',
    fields: ['id', 'nome', 'categoria', 'descricao', 'formatosAceitos'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  ProfissionalSaude: {
    table: 'ProfissionalSaude',
    displayName: 'Profissionais de Saúde',
    fields: ['id', 'nome', 'categoria', 'especialidade', 'registroProfissional'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true, aceitaAgendamento: true },
  },
  Professor: {
    table: 'Professor',
    displayName: 'Professores',
    fields: ['id', 'nome', 'formacao', 'especializacoes', 'areasAtuacao'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  CursoProfissionalizante: {
    table: 'CursoProfissionalizante',
    displayName: 'Cursos Profissionalizantes',
    fields: ['id', 'nome', 'categoria', 'area', 'cargaHoraria', 'vagas'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  TipoEstabelecimentoTuristico: {
    table: 'TipoEstabelecimentoTuristico',
    displayName: 'Tipos de Estabelecimento Turístico',
    fields: ['id', 'nome', 'categoria', 'requisitosLegais'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
  GuiaTuristico: {
    table: 'GuiaTuristico',
    displayName: 'Guias Turísticos',
    fields: ['id', 'nome', 'cadastur', 'idiomas', 'especialidades'],
    defaultLabelField: 'nome',
    commonFilters: { isActive: true },
  },
};

// ========================================
// SERVICE CLASS
// ========================================

export class AuxiliaryTablesService {
  /**
   * Verifica se uma tabela existe
   */
  tableExists(tableName: string): boolean {
    return tableName in AUXILIARY_TABLES;
  }

  /**
   * Obtém metadados de uma tabela
   */
  getTableMetadata(tableName: string): TableMetadata | null {
    return TABLE_METADATA[tableName] || null;
  }

  /**
   * Lista todas as tabelas disponíveis
   */
  listTables(): TableMetadata[] {
    return Object.values(TABLE_METADATA);
  }

  /**
   * Busca opções para um campo select-table
   */
  async getOptions(dataSource: TableDataSource): Promise<TableOption[]> {
    const { table, filters = {}, orderBy, limit, offset } = dataSource;

    // Validar tabela
    if (!this.tableExists(table)) {
      throw new Error(`Tabela auxiliar não encontrada: ${table}`);
    }

    const tableModel = AUXILIARY_TABLES[table];
    const metadata = TABLE_METADATA[table];

    if (!metadata) {
      throw new Error(`Metadados não encontrados para tabela: ${table}`);
    }

    // Mesclar filtros comuns
    const allFilters = {
      ...metadata.commonFilters,
      ...filters,
    };

    // Construir query
    const queryOptions: any = {
      where: allFilters,
    };

    // Ordenação
    if (orderBy) {
      if (typeof orderBy === 'string') {
        queryOptions.orderBy = { [orderBy]: 'asc' };
      } else {
        queryOptions.orderBy = orderBy;
      }
    } else {
      queryOptions.orderBy = { [metadata.defaultLabelField]: 'asc' };
    }

    // Paginação
    if (limit) {
      queryOptions.take = limit;
    }
    if (offset) {
      queryOptions.skip = offset;
    }

    // Executar query
    const items = await tableModel.findMany(queryOptions);

    // Transformar em opções
    const options: TableOption[] = items.map((item: any) => ({
      value: item.id,
      label: item[metadata.defaultLabelField] || item.nome || item.name || item.id,
      metadata: this.extractMetadata(item, metadata.fields),
    }));

    return options;
  }

  /**
   * Busca uma opção específica por ID
   */
  async getOption(tableName: string, id: string): Promise<TableOption | null> {
    if (!this.tableExists(tableName)) {
      throw new Error(`Tabela auxiliar não encontrada: ${tableName}`);
    }

    const tableModel = AUXILIARY_TABLES[tableName];
    const metadata = TABLE_METADATA[tableName];

    if (!metadata) {
      return null;
    }

    const item = await tableModel.findUnique({
      where: { id },
    });

    if (!item) {
      return null;
    }

    return {
      value: item.id,
      label: item[metadata.defaultLabelField] || item.nome || item.name || item.id,
      metadata: this.extractMetadata(item, metadata.fields),
    };
  }

  /**
   * Valida se um valor existe na tabela
   */
  async validateValue(tableName: string, id: string): Promise<boolean> {
    if (!this.tableExists(tableName)) {
      return false;
    }

    const tableModel = AUXILIARY_TABLES[tableName];

    const item = await tableModel.findUnique({
      where: { id },
      select: { id: true },
    });

    return !!item;
  }

  /**
   * Conta registros em uma tabela
   */
  async count(tableName: string, filters: Record<string, any> = {}): Promise<number> {
    if (!this.tableExists(tableName)) {
      throw new Error(`Tabela auxiliar não encontrada: ${tableName}`);
    }

    const tableModel = AUXILIARY_TABLES[tableName];
    const metadata = TABLE_METADATA[tableName];

    const allFilters = {
      ...metadata?.commonFilters,
      ...filters,
    };

    return await tableModel.count({
      where: allFilters,
    });
  }

  /**
   * Busca registros com filtros avançados
   */
  async search(
    tableName: string,
    searchTerm: string,
    searchFields: string[] = [],
    limit: number = 50
  ): Promise<TableOption[]> {
    if (!this.tableExists(tableName)) {
      throw new Error(`Tabela auxiliar não encontrada: ${tableName}`);
    }

    const tableModel = AUXILIARY_TABLES[tableName];
    const metadata = TABLE_METADATA[tableName];

    if (!metadata) {
      return [];
    }

    // Se não especificou campos, usar o default label field
    if (searchFields.length === 0) {
      searchFields = [metadata.defaultLabelField];
    }

    // Construir condições OR para busca
    const orConditions = searchFields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    }));

    const items = await tableModel.findMany({
      where: {
        AND: [
          metadata.commonFilters || {},
          { OR: orConditions },
        ],
      },
      orderBy: { [metadata.defaultLabelField]: 'asc' },
      take: limit,
    });

    return items.map((item: any) => ({
      value: item.id,
      label: item[metadata.defaultLabelField] || item.nome || item.name || item.id,
      metadata: this.extractMetadata(item, metadata.fields),
    }));
  }

  /**
   * Extrai metadados relevantes de um item
   */
  private extractMetadata(item: any, fields: string[]): Record<string, any> {
    const metadata: Record<string, any> = {};

    for (const field of fields) {
      if (item[field] !== undefined) {
        metadata[field] = item[field];
      }
    }

    return metadata;
  }
}

// Exportar instância singleton
export const auxiliaryTablesService = new AuxiliaryTablesService();
