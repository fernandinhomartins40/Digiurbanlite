/**
 * ============================================================================
 * REGISTRY — Importador de metadados (F1)
 * ============================================================================
 * Traduz o conhecimento HOJE hardcoded em código (MANAGEMENT_CONFIGS) e nos
 * serviços (ServiceSimplified.formSchema / formFieldsConfig) para linhas de
 * EntityType/FieldDefinition no banco — a fonte única de verdade do Registry.
 *
 * Lógica PURA de fusão aqui (sem Prisma); a orquestração por tenant e a escrita
 * ficam em scripts/registry/import-configs.ts. Ver PLANO-IMPLEMENTACAO-REGISTRY.md (F1).
 * ============================================================================
 */

import {
  MANAGEMENT_CONFIGS,
  type ManagementModuleConfig,
  type FieldConfig,
} from '../../routes/management-configs';
import { normalizeDataType, type RegistryDataType, type EntityKind } from './registry.types';

// ── Modelos de saída (o que o script grava) ─────────────────────────────────

export interface ImportedField {
  key: string;
  label: string;
  dataType: RegistryDataType;
  required: boolean;
  indexable: boolean;
  filterable: boolean;
  facetable: boolean;
  searchable: boolean;
  isMetric: boolean;
  aggregation: string | null;
  isPII: boolean;
  displayInTable: boolean;
  displayInCard: boolean;
  order: number;
}

export interface ImportedEntityType {
  code: string; // = moduleType
  name: string;
  kind: EntityKind;
  department: string | null;
  materializesFrom: string[];
  fields: ImportedField[];
}

// Campo cru vindo de ServiceSimplified.formFieldsConfig (shape tolerante).
interface RawFormField {
  id?: string;
  key?: string;
  name?: string;
  label?: string;
  type?: string;
  required?: boolean;
  enabled?: boolean;
  category?: string;
  isPII?: boolean;
  sensitive?: boolean;
}

const PII_KEYS = new Set([
  'cpf',
  'rg',
  'cnpj',
  'email',
  'telefone',
  'phone',
  'celular',
  'nome',
  'nomecompleto',
  'datanascimento',
  'cartaosus',
  'endereco',
]);

const METRIC_KEY_HINTS = ['hectares', 'area', 'renda', 'valor', 'quantidade', 'total', 'idade'];

/** Heurística: um campo numérico com nome que sugere medida vira métrica. */
function guessMetric(key: string, dataType: RegistryDataType): { isMetric: boolean; aggregation: string | null } {
  if (dataType !== 'NUMBER') return { isMetric: false, aggregation: null };
  const k = key.toLowerCase();
  const hit = METRIC_KEY_HINTS.some((h) => k.includes(h));
  if (!hit) return { isMetric: false, aggregation: null };
  return { isMetric: true, aggregation: k.includes('idade') ? 'AVG' : 'SUM' };
}

function isPII(key: string, raw?: RawFormField, cfg?: FieldConfig): boolean {
  if (raw?.isPII || raw?.sensitive) return true;
  const k = key.toLowerCase();
  return PII_KEYS.has(k) || k.includes('cpf') || k.includes('rg');
}

/**
 * Funde a fonte de EXIBIÇÃO (ManagementModuleConfig.fields) com a fonte de
 * ENTRADA (formFieldsConfig do serviço). A chave é `key`. Campos presentes só
 * numa das fontes também entram. Determinístico → idempotente.
 */
export function mergeFields(
  managementFields: FieldConfig[],
  formFields: RawFormField[]
): ImportedField[] {
  const byKey = new Map<string, ImportedField>();

  const upsert = (key: string): ImportedField => {
    const existing = byKey.get(key);
    if (existing) return existing;
    const created: ImportedField = {
      key,
      label: key,
      dataType: 'TEXT',
      required: false,
      indexable: false,
      filterable: false,
      facetable: false,
      searchable: false,
      isMetric: false,
      aggregation: null,
      isPII: false,
      displayInTable: false,
      displayInCard: false,
      order: byKey.size,
    };
    byKey.set(key, created);
    return created;
  };

  // 1) Fonte de exibição (rica em flags)
  managementFields.forEach((f, idx) => {
    if (!f?.key) return;
    const field = upsert(f.key);
    field.label = f.label || field.label;
    field.dataType = normalizeDataType(f.type);
    field.filterable = Boolean(f.filterable) || field.filterable;
    field.searchable = Boolean(f.searchable) || field.searchable;
    field.facetable = field.facetable || field.dataType === 'ENUM' || field.dataType === 'ARRAY';
    field.displayInTable = Boolean(f.displayInTable) || field.displayInTable;
    field.displayInCard = Boolean(f.displayInCard) || field.displayInCard;
    // indexável: se é usado em filtro, ordenação ou busca → projeta
    field.indexable = field.indexable || Boolean(f.filterable) || Boolean(f.sortable) || Boolean(f.searchable);
    const metric = guessMetric(f.key, field.dataType);
    field.isMetric = field.isMetric || metric.isMetric;
    field.aggregation = field.aggregation ?? metric.aggregation;
    field.isPII = field.isPII || isPII(f.key, undefined, f);
    if (field.order === 0 && idx > 0) field.order = idx;
  });

  // 2) Fonte de entrada (garante required e campos ausentes na exibição)
  formFields.forEach((f) => {
    const key = (f.id ?? f.key ?? f.name ?? '').toString().trim();
    if (!key) return;
    const field = upsert(key);
    if (f.label) field.label = f.label;
    if (f.type) field.dataType = normalizeDataType(f.type);
    field.required = field.required || Boolean(f.required);
    field.facetable = field.facetable || field.dataType === 'ENUM' || field.dataType === 'ARRAY';
    field.isPII = field.isPII || isPII(key, f);
    const metric = guessMetric(key, field.dataType);
    field.isMetric = field.isMetric || metric.isMetric;
    field.aggregation = field.aggregation ?? metric.aggregation;
  });

  return Array.from(byKey.values());
}

/** Extrai o array de formFieldsConfig de um serviço (tolerante a string/JSON). */
export function parseFormFields(formFieldsConfig: unknown): RawFormField[] {
  let arr: unknown = formFieldsConfig;
  if (typeof formFieldsConfig === 'string') {
    try {
      arr = JSON.parse(formFieldsConfig);
    } catch {
      return [];
    }
  }
  return Array.isArray(arr) ? (arr as RawFormField[]) : [];
}

/**
 * Extrai campos do `formSchema` no formato JSON Schema usado pelos serviços dos
 * seeds: `{ properties: { chave: { type, title, enum, widget, format } }, required: [...] }`.
 * Ignora `citizenFields` (são dados do cidadão, não do formulário do serviço).
 */
export function parseFormSchema(formSchema: unknown): RawFormField[] {
  let schema: Record<string, unknown> | null = null;
  if (typeof formSchema === 'string') {
    try { schema = JSON.parse(formSchema); } catch { return []; }
  } else if (formSchema && typeof formSchema === 'object') {
    schema = formSchema as Record<string, unknown>;
  }
  if (!schema) return [];

  const properties = schema.properties;
  if (!properties || typeof properties !== 'object') return [];
  const required = new Set(Array.isArray(schema.required) ? (schema.required as string[]) : []);

  const out: RawFormField[] = [];
  for (const [key, raw] of Object.entries(properties as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const prop = raw as Record<string, unknown>;

    // Mapear JSON Schema type/format/widget/enum → o `type` que normalizeDataType entende
    let type = String(prop.type ?? 'string');
    if (Array.isArray(prop.enum) && prop.enum.length) type = 'enum';
    else if (prop.type === 'array') type = 'array';
    else if (prop.type === 'boolean') type = 'boolean';
    else if (prop.type === 'number' || prop.type === 'integer') type = 'number';
    else if (prop.format === 'date' || prop.format === 'date-time' || prop.widget === 'date') type = 'date';
    else if (prop.format === 'geo' || prop.widget === 'map' || prop.widget === 'location') type = 'geo';
    else if (key.toLowerCase().includes('cpf')) type = 'cpf';
    else if (key.toLowerCase().includes('cnpj')) type = 'cnpj';

    out.push({
      key,
      label: (prop.title as string) || key,
      type,
      required: required.has(key),
      // opções do enum para o FieldDefinition.validation
      // (guardadas em _options; mergeFields não usa, mas o import pode enriquecer depois)
    });
  }
  return out;
}

/**
 * Constrói um ImportedEntityType a partir de um moduleType, do config de gestão
 * (se existir) e dos serviços daquele moduleType (para pegar formFieldsConfig).
 * `categoryKind` vem da reconciliação com CitizenCategory.triggerServices.
 */
export function buildEntityType(
  moduleType: string,
  managementConfig: ManagementModuleConfig | null,
  services: Array<{ name?: string; departmentId?: string; formFieldsConfig?: unknown; formSchema?: unknown }>,
  categoryKind: EntityKind | null
): ImportedEntityType {
  // Campos vêm de 3 fontes: formFieldsConfig (array) + formSchema (JSON Schema,
  // usado pela maioria dos serviços dos seeds) + o ManagementConfig (exibição).
  const formFields = [
    ...services.flatMap((s) => parseFormFields(s.formFieldsConfig)),
    ...services.flatMap((s) => parseFormSchema(s.formSchema)),
  ];
  const managementFields = managementConfig?.fields ?? [];
  const fields = mergeFields(managementFields, formFields);

  return {
    code: moduleType,
    name: managementConfig?.title || services[0]?.name || moduleType,
    kind: categoryKind ?? 'EVENT',
    department: services[0]?.departmentId ?? null,
    materializesFrom: [moduleType],
    fields,
  };
}

/** Conveniência: todos os moduleTypes com config de gestão hardcoded. */
export function knownManagementModuleTypes(): string[] {
  return Object.keys(MANAGEMENT_CONFIGS);
}
