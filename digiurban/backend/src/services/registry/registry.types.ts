/**
 * ============================================================================
 * REGISTRY — Tipos e helpers compartilhados (F1/F2)
 * ============================================================================
 * Núcleo do motor de dados orientado a metadados. Ver:
 * PLANO-IMPLEMENTACAO-REGISTRY.md e AUDITORIA-ARQUITETURA-PROTOCOLOS-MODULOS.md
 *
 * Este módulo não importa Prisma nem faz I/O — é lógica pura, testável e
 * reusada pelo importador (F1) e pelo motor de query (F2).
 * ============================================================================
 */

// Tipos de dado suportados por um FieldDefinition.
export type RegistryDataType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'BOOL'
  | 'ENUM'
  | 'ARRAY'
  | 'GEO'
  | 'CPF'
  | 'CNPJ'
  | 'REFERENCE';

// Coluna tipada onde o valor é projetado em record_indexes.
export type IndexValueColumn = 'valueText' | 'valueNumber' | 'valueDate' | 'valueBool';

export type EntityKind = 'PERSON_ROLE' | 'PROPERTY' | 'ORG' | 'EVENT';

/**
 * Mapeia o `type` de um campo de formulário (formFieldsConfig) ou de um
 * ManagementModuleConfig.FieldConfig para o RegistryDataType canônico.
 * Aceita as strings usadas hoje no produto (pt e en).
 */
export function normalizeDataType(raw: unknown): RegistryDataType {
  const t = String(raw ?? '').trim().toLowerCase();
  switch (t) {
    case 'number':
    case 'numeric':
    case 'integer':
    case 'int':
    case 'float':
    case 'decimal':
    case 'currency':
    case 'money':
      return 'NUMBER';
    case 'date':
    case 'datetime':
    case 'date-time':
    case 'datetime-local':
      return 'DATE';
    case 'boolean':
    case 'bool':
    case 'checkbox':
    case 'switch':
    case 'toggle':
      return 'BOOL';
    case 'enum':
    case 'select':
    case 'radio':
    case 'dropdown':
      return 'ENUM';
    case 'array':
    case 'multiselect':
    case 'multi-select':
    case 'checkboxes':
    case 'tags':
      return 'ARRAY';
    case 'geo':
    case 'location':
    case 'coordinates':
    case 'map':
      return 'GEO';
    case 'cpf':
      return 'CPF';
    case 'cnpj':
      return 'CNPJ';
    case 'reference':
    case 'ref':
    case 'relation':
      return 'REFERENCE';
    default:
      return 'TEXT';
  }
}

/** Coluna de record_indexes correspondente ao dataType. */
export function indexColumnFor(dataType: RegistryDataType): IndexValueColumn {
  switch (dataType) {
    case 'NUMBER':
      return 'valueNumber';
    case 'DATE':
      return 'valueDate';
    case 'BOOL':
      return 'valueBool';
    default:
      // TEXT, ENUM, CPF, CNPJ, REFERENCE e (representação escalar de) ARRAY/GEO
      return 'valueText';
  }
}

/**
 * Converte um valor bruto (vindo do customData/formData) para o valor tipado
 * que será gravado na coluna de índice. Retorna undefined quando o valor é
 * vazio/incoerente (o campo simplesmente não é projetado).
 */
export function coerceIndexValue(
  dataType: RegistryDataType,
  raw: unknown
): { column: IndexValueColumn; value: string | number | Date | boolean } | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;

  switch (dataType) {
    case 'NUMBER': {
      const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
      return Number.isFinite(n) ? { column: 'valueNumber', value: n } : undefined;
    }
    case 'DATE': {
      const d = raw instanceof Date ? raw : new Date(String(raw));
      return Number.isNaN(d.getTime()) ? undefined : { column: 'valueDate', value: d };
    }
    case 'BOOL': {
      if (typeof raw === 'boolean') return { column: 'valueBool', value: raw };
      const s = String(raw).trim().toLowerCase();
      if (['true', '1', 'sim', 'yes'].includes(s)) return { column: 'valueBool', value: true };
      if (['false', '0', 'nao', 'não', 'no'].includes(s)) return { column: 'valueBool', value: false };
      return undefined;
    }
    default: {
      // ARRAY: junta em texto pesquisável; demais: string
      const value = Array.isArray(raw) ? raw.map((v) => String(v)).join(' | ') : String(raw);
      return value.trim() ? { column: 'valueText', value } : undefined;
    }
  }
}

/** Normaliza CPF/CNPJ para naturalKey (só dígitos). */
export function normalizeNaturalKey(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const digits = String(raw).replace(/\D+/g, '');
  return digits.length >= 11 ? digits : null;
}

/** Operadores permitidos por dataType — dirigem a validação do motor de query. */
export const OPERATORS_BY_TYPE: Record<RegistryDataType, string[]> = {
  TEXT: ['eq', 'neq', 'contains', 'startsWith', 'in', 'isNull', 'notNull'],
  ENUM: ['eq', 'neq', 'in', 'isNull', 'notNull'],
  CPF: ['eq', 'neq', 'in', 'isNull', 'notNull'],
  CNPJ: ['eq', 'neq', 'in', 'isNull', 'notNull'],
  REFERENCE: ['eq', 'neq', 'in', 'isNull', 'notNull'],
  ARRAY: ['contains', 'in', 'isNull', 'notNull'],
  GEO: ['isNull', 'notNull'],
  NUMBER: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'notNull'],
  DATE: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'isNull', 'notNull'],
  BOOL: ['eq', 'neq', 'isNull', 'notNull'],
};
