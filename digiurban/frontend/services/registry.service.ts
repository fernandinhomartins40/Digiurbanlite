/**
 * ============================================================================
 * REGISTRY SERVICE (F6 — cliente do editor no-code)
 * ============================================================================
 * Cliente das rotas /api/registry/*. Permite a um wizard/tela de admin:
 *   - listar tipos de entidade e seu schema de campos;
 *   - CRIAR/EDITAR um tipo e seus campos (a definição que dirige busca,
 *     filtros, facets e dashboards) — SEM deploy;
 *   - consultar registros (busca genérica), dashboard e relações.
 *
 * Auth por cookie httpOnly (credentials: 'include'), padrão do produto.
 * ============================================================================
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type RegistryDataType =
  | 'TEXT' | 'NUMBER' | 'DATE' | 'BOOL' | 'ENUM'
  | 'ARRAY' | 'GEO' | 'CPF' | 'CNPJ' | 'REFERENCE';

export type EntityKind = 'PERSON_ROLE' | 'PROPERTY' | 'ORG' | 'EVENT';

export interface FieldDefinition {
  key: string;
  label: string;
  dataType: RegistryDataType;
  required?: boolean;
  validation?: unknown;
  indexable?: boolean;
  filterable?: boolean;
  facetable?: boolean;
  searchable?: boolean;
  isMetric?: boolean;
  aggregation?: string | null;
  isPII?: boolean;
  displayInTable?: boolean;
  displayInCard?: boolean;
  order?: number;
}

export interface EntityType {
  code: string;
  name: string;
  kind?: EntityKind;
  department?: string | null;
  icon?: string | null;
  color?: string | null;
  materializesFrom?: string[];
  active?: boolean;
  fields?: FieldDefinition[];
}

export interface QueryFilter {
  field: string;
  op: string;
  value?: unknown;
}

export interface RegistryQueryInput {
  entityType: string;
  filters?: QueryFilter[];
  search?: string;
  facets?: string[];
  sort?: Array<{ field: string; dir?: 'asc' | 'desc' }>;
  page?: number;
  pageSize?: number;
}

// ── Helper ───────────────────────────────────────────────────────────────────

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/registry${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || `Erro ${res.status} em ${path}`);
  }
  return body as T;
}

// ── Leitura ──────────────────────────────────────────────────────────────────

export function listEntityTypes() {
  return api<{ entityTypes: Array<EntityType & { _count?: { records: number; fields: number } }> }>('/entity-types');
}

export function getEntityTypeSchema(code: string) {
  return api<EntityType>(`/entity-types/${encodeURIComponent(code)}/schema`);
}

export function getDashboard(code: string, params?: { dateFrom?: string; dateTo?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return api<{ kpis: unknown[]; charts: unknown[]; trends: unknown[] }>(
    `/entity-types/${encodeURIComponent(code)}/dashboard${qs ? `?${qs}` : ''}`
  );
}

export function queryRecords(input: RegistryQueryInput) {
  return api<{ total: number; records: unknown[]; facets: Record<string, Array<{ value: string; count: number }>> }>(
    '/query',
    { method: 'POST', body: JSON.stringify(input) }
  );
}

export function getRecordRelations(recordId: string) {
  return api<{ recordId: string; outgoing: unknown[]; incoming: unknown[] }>(
    `/records/${encodeURIComponent(recordId)}/relations`
  );
}

// ── Registros (cadastro/edição/aprovação — módulo Dados UI-3) ────────────────

export interface RegistryRecord {
  id: string;
  entityType: string;
  entityTypeName?: string;
  status: string;
  data: Record<string, unknown>;
  sourceProtocolId?: string | null;
  citizenId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function listRecords(code: string, params?: { status?: string; page?: number; pageSize?: number }) {
  const qs = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
  ).toString();
  return api<{ total: number; page: number; pageSize: number; records: Array<{ id: string; data: Record<string, unknown>; status: string; createdAt: string }> }>(
    `/entity-types/${encodeURIComponent(code)}/records${qs ? `?${qs}` : ''}`
  );
}

export function getRecord(id: string) {
  return api<RegistryRecord>(`/records/${encodeURIComponent(id)}`);
}

export function createRecord(code: string, data: Record<string, unknown>, status?: string) {
  return api<RegistryRecord>(`/entity-types/${encodeURIComponent(code)}/records`, {
    method: 'POST',
    body: JSON.stringify({ data, status }),
  });
}

export function updateRecord(id: string, data: Record<string, unknown>) {
  return api<RegistryRecord>(`/records/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
}

export function approveRecord(id: string) {
  return api<RegistryRecord>(`/records/${encodeURIComponent(id)}/approve`, { method: 'POST' });
}

export function rejectRecord(id: string) {
  return api<RegistryRecord>(`/records/${encodeURIComponent(id)}/reject`, { method: 'POST' });
}

// ── Widgets do workspace (W0/W1) ─────────────────────────────────────────────

export type WidgetType =
  | 'TABLE' | 'CARDS' | 'DETAIL' | 'FILTER' | 'STATS' | 'CHART'
  | 'MAP' | 'AGENDA' | 'TIMELINE' | 'ENROLLMENT' | 'APPROVAL' | 'RELATIONS' | 'SAVED_QUERY';

export interface DataWidget {
  id?: string;
  entityTypeId?: string;
  scope?: 'SHARED' | 'PERSONAL';
  ownerUserId?: string | null;
  type: WidgetType;
  title: string;
  config?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  order: number;
  suggested?: boolean;
}

export interface Workspace {
  entityType: string;
  entityTypeName: string;
  widgets: DataWidget[];
  source: 'saved' | 'suggested';
}

export function getWorkspace(code: string) {
  return api<Workspace>(`/entity-types/${encodeURIComponent(code)}/workspace`);
}

export function getSuggestedWidgets(code: string) {
  return api<{ widgets: DataWidget[] }>(`/entity-types/${encodeURIComponent(code)}/suggested-widgets`);
}

export function adoptLayout(code: string) {
  return api<Workspace>(`/entity-types/${encodeURIComponent(code)}/adopt-layout`, { method: 'POST' });
}

export function createWidget(input: { entityTypeId: string; scope?: 'SHARED' | 'PERSONAL'; type: WidgetType; title: string; config?: unknown; order?: number }) {
  return api<DataWidget>('/widgets', { method: 'POST', body: JSON.stringify(input) });
}

export function updateWidget(id: string, patch: Partial<DataWidget> & { active?: boolean }) {
  return api<DataWidget>(`/widgets/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(patch) });
}

export function deleteWidget(id: string) {
  return api<{ deleted: boolean }>(`/widgets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── Editor no-code (CRUD) ────────────────────────────────────────────────────

export function createEntityType(input: EntityType) {
  return api<EntityType>('/entity-types', { method: 'POST', body: JSON.stringify(input) });
}

export function updateEntityType(code: string, input: EntityType) {
  return api<EntityType>(`/entity-types/${encodeURIComponent(code)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function deleteEntityType(code: string, hard = false) {
  return api<{ deleted?: boolean; deactivated?: boolean }>(
    `/entity-types/${encodeURIComponent(code)}${hard ? '?hard=true' : ''}`,
    { method: 'DELETE' }
  );
}

export function reindexEntityType(code: string) {
  return api<{ records: number; indexed: number }>(
    `/entity-types/${encodeURIComponent(code)}/reindex`,
    { method: 'POST' }
  );
}

/**
 * Metadados para a UI do editor: tipos de dado disponíveis e o que cada flag
 * faz — para o wizard renderizar os controles sem hardcode.
 */
export const REGISTRY_FIELD_HELP: Record<string, string> = {
  indexable: 'Permite filtrar e ordenar por este campo com rapidez (recomendado para campos usados em busca).',
  filterable: 'Aparece na barra de filtros da listagem.',
  facetable: 'Serve para agrupar/segmentar — vira gráfico no painel.',
  searchable: 'Entra na busca por texto livre.',
  isMetric: 'É um número que vira indicador (soma/média) no painel.',
  isPII: 'Dado pessoal sensível — recebe tratamento de privacidade (LGPD).',
};

export const REGISTRY_DATATYPES: Array<{ value: RegistryDataType; label: string }> = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'DATE', label: 'Data' },
  { value: 'BOOL', label: 'Sim/Não' },
  { value: 'ENUM', label: 'Lista de opções' },
  { value: 'ARRAY', label: 'Múltipla escolha' },
  { value: 'GEO', label: 'Localização' },
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'REFERENCE', label: 'Vínculo com outra entidade' },
];

export const REGISTRY_KINDS: Array<{ value: EntityKind; label: string; hint: string }> = [
  { value: 'PERSON_ROLE', label: 'Perfil do cidadão', hint: 'Ex.: Produtor Rural, Ambulante — vira uma característica da pessoa.' },
  { value: 'PROPERTY', label: 'Imóvel/Bem', hint: 'Ex.: Imóvel urbano, propriedade rural.' },
  { value: 'ORG', label: 'Empresa/Organização', hint: 'Ex.: Empresa, cooperativa.' },
  { value: 'EVENT', label: 'Registro/Evento', hint: 'Ex.: Atendimento, ocorrência.' },
];
