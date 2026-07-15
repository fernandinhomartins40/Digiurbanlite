/**
 * ============================================================================
 * REGISTRY F2 — Motor de query genérico
 * ============================================================================
 * Uma única API de consulta dirigida por metadados. Valida cada field/op contra
 * o FieldDefinition (segurança + tipagem), roteia campos `indexable` para
 * record_indexes (WHERE/ORDER BY reais) e retorna resultados + facets.
 *
 * A tenant extension escopa todas as queries por tenant automaticamente.
 * Ver PLANO-IMPLEMENTACAO-REGISTRY.md (F2) e AUDITORIA (§20).
 * ============================================================================
 */

import { prisma } from '../../lib/prisma';
import {
  OPERATORS_BY_TYPE,
  indexColumnFor,
  coerceIndexValue,
  type RegistryDataType,
} from './registry.types';

export interface QueryFilter {
  field: string;
  op: string;
  value?: unknown;
}

export interface RegistryQueryInput {
  entityType: string; // code
  filters?: QueryFilter[];
  search?: string; // full-text simples (contains) nos campos searchable — F2 básico
  facets?: string[];
  sort?: Array<{ field: string; dir?: 'asc' | 'desc' }>;
  page?: number;
  pageSize?: number;
}

export interface RegistryQueryResult {
  entityType: string;
  page: number;
  pageSize: number;
  total: number;
  records: Array<{ id: string; data: unknown; status: string; createdAt: Date }>;
  facets: Record<string, Array<{ value: string; count: number }>>;
}

export class RegistryQueryError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = 'RegistryQueryError';
  }
}

interface FieldMeta {
  key: string;
  dataType: RegistryDataType;
  indexable: boolean;
  facetable: boolean;
  searchable: boolean;
}

const MAX_PAGE_SIZE = 200;

/**
 * Converte um filtro validado num predicado sobre record_indexes (campo
 * indexável) — retorna o `where` de RecordIndex a ser usado em `some`.
 */
function indexPredicate(field: FieldMeta, filter: QueryFilter): Record<string, unknown> {
  const col = indexColumnFor(field.dataType);
  const base = { fieldKey: field.key };

  const coerce = (v: unknown) => coerceIndexValue(field.dataType, v)?.value;

  switch (filter.op) {
    case 'eq':
      return { ...base, [col]: coerce(filter.value) };
    case 'neq':
      return { ...base, NOT: { [col]: coerce(filter.value) } };
    case 'contains':
      return { ...base, valueText: { contains: String(filter.value ?? ''), mode: 'insensitive' } };
    case 'startsWith':
      return { ...base, valueText: { startsWith: String(filter.value ?? ''), mode: 'insensitive' } };
    case 'in': {
      const arr = Array.isArray(filter.value) ? filter.value.map(coerce) : [coerce(filter.value)];
      return { ...base, [col]: { in: arr } };
    }
    case 'gt':
      return { ...base, [col]: { gt: coerce(filter.value) } };
    case 'gte':
      return { ...base, [col]: { gte: coerce(filter.value) } };
    case 'lt':
      return { ...base, [col]: { lt: coerce(filter.value) } };
    case 'lte':
      return { ...base, [col]: { lte: coerce(filter.value) } };
    case 'between': {
      const [a, b] = Array.isArray(filter.value) ? filter.value : [undefined, undefined];
      return { ...base, [col]: { gte: coerce(a), lte: coerce(b) } };
    }
    case 'isNull':
      return { ...base, [col]: null };
    case 'notNull':
      return { ...base, NOT: { [col]: null } };
    default:
      throw new RegistryQueryError(`Operador não suportado: ${filter.op}`);
  }
}

export async function runRegistryQuery(input: RegistryQueryInput): Promise<RegistryQueryResult> {
  if (!input?.entityType) throw new RegistryQueryError('entityType é obrigatório');

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? 50));

  // 1) Carregar o EntityType + FieldDefinitions (extension escopa por tenant)
  const entityType = await prisma.entityType.findFirst({
    where: { code: input.entityType },
    include: { fields: true },
  });
  if (!entityType) throw new RegistryQueryError(`EntityType não encontrado: ${input.entityType}`, 404);

  const fieldMap = new Map<string, FieldMeta>();
  for (const f of entityType.fields) {
    fieldMap.set(f.key, {
      key: f.key,
      dataType: f.dataType as RegistryDataType,
      indexable: f.indexable,
      facetable: f.facetable,
      searchable: f.searchable,
    });
  }

  // 2) Montar o WHERE do EntityRecord
  const andClauses: Array<Record<string, unknown>> = [{ entityTypeId: entityType.id }];

  for (const filter of input.filters ?? []) {
    const field = fieldMap.get(filter.field);
    if (!field) throw new RegistryQueryError(`Campo desconhecido: ${filter.field}`);

    const allowed = OPERATORS_BY_TYPE[field.dataType] ?? [];
    if (!allowed.includes(filter.op)) {
      throw new RegistryQueryError(`Operador "${filter.op}" inválido para o tipo ${field.dataType} (campo ${field.key})`);
    }

    if (field.indexable) {
      // Campo projetado: filtra via relação record_indexes (índice B-tree)
      andClauses.push({ indexes: { some: indexPredicate(field, filter) } });
    } else {
      // Campo não projetado: contenção no JSONB (GIN) — só eq suportado aqui
      if (filter.op === 'eq') {
        andClauses.push({ data: { path: [field.key], equals: filter.value as never } });
      } else {
        throw new RegistryQueryError(
          `Campo "${field.key}" não é indexável; apenas "eq" é suportado sem projeção. Marque-o como indexable para filtros avançados.`
        );
      }
    }
  }

  // 2b) Busca por texto livre (F7): cada palavra do termo deve aparecer em ALGUM
  //     campo searchable (AND entre palavras, OR entre campos). Acelerada pelo
  //     índice GIN trigram sobre record_indexes.valueText (migration F7).
  if (input.search?.trim()) {
    const tokens = input.search.trim().split(/\s+/).filter(Boolean).slice(0, 6);
    const searchable = [...fieldMap.values()].filter((f) => f.searchable && f.indexable);
    if (searchable.length && tokens.length) {
      for (const token of tokens) {
        andClauses.push({
          OR: searchable.map((f) => ({
            indexes: { some: { fieldKey: f.key, valueText: { contains: token, mode: 'insensitive' } } },
          })),
        });
      }
    }
  }

  const where = { AND: andClauses };

  // 3) Ordenação (só campos indexáveis; senão por createdAt)
  //    Prisma não ordena por relação escalar arbitrária, então ordenação por
  //    campo dinâmico usa createdAt como fallback estável nesta versão.
  const orderBy = { createdAt: 'desc' as const };

  // 4) Executar: total + página
  const [total, records] = await Promise.all([
    prisma.entityRecord.count({ where }),
    prisma.entityRecord.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, data: true, status: true, createdAt: true },
    }),
  ]);

  // 5) Facets (contagem por valor) — só para campos facetable indexáveis
  const facets: RegistryQueryResult['facets'] = {};
  for (const facetKey of input.facets ?? []) {
    const field = fieldMap.get(facetKey);
    if (!field || !field.facetable || !field.indexable) continue;
    const grouped = await prisma.recordIndex.groupBy({
      by: ['valueText'],
      where: {
        fieldKey: field.key,
        record: { is: { entityTypeId: entityType.id } },
      },
      _count: { _all: true },
      orderBy: { _count: { valueText: 'desc' } },
      take: 20,
    });
    facets[facetKey] = grouped
      .filter((g) => g.valueText !== null)
      .map((g) => ({ value: g.valueText as string, count: g._count._all }));
  }

  return { entityType: input.entityType, page, pageSize, total, records, facets };
}
