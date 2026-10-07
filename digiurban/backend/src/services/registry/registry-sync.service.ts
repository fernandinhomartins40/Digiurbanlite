/**
 * Tipos de dados do Registry (EntityType + FieldDefinition) a partir dos
 * serviços com formulário do município. Antes só rodava por script manual
 * (scripts/registry/import-configs.ts) — e nunca tinha rodado em produção.
 * Agora roda ao aplicar o catálogo e ao criar/editar serviço com formulário.
 * Idempotente. Chamar no contexto do município (runAsTenant).
 */

import { prisma } from '../../lib/prisma';
import { buildEntityType, knownManagementModuleTypes, type ImportedEntityType } from './registry-import.service';
import { getManagementConfig } from '../../routes/management-configs';
import type { EntityKind } from './registry.types';

/**
 * Descobre os moduleTypes de um tenant: união dos configs hardcoded com os
 * moduleTypes reais dos serviços COM_DADOS. Para cada um, monta o EntityType.
 */
export async function collectRegistryTypes(): Promise<ImportedEntityType[]> {
  // Serviços COM_DADOS com moduleType (a extension já escopa por tenant).
  // Traz o CODE da secretaria (não só o id) — o EntityType.department guarda o
  // code, que é o que o frontend usa para filtrar por secretaria.
  const rawServices = await prisma.serviceSimplified.findMany({
    where: { serviceType: 'COM_DADOS', moduleType: { not: null } },
    select: {
      name: true,
      departmentId: true,
      moduleType: true,
      formFieldsConfig: true,
      formSchema: true,
      department: { select: { code: true } },
    },
  });
  const services = rawServices.map((s) => ({
    ...s,
    departmentCode: s.department?.code ?? null,
  }));

  // Categorias e seus triggerServices → mapa moduleType → kind PERSON_ROLE
  const categories = await prisma.citizenCategory.findMany({
    select: { triggerServices: true, triggerServiceIds: true },
  });
  const tagServiceIds = new Set<string>(categories.flatMap((c) => c.triggerServiceIds ?? []));
  const personRoleModules = new Set<string>();
  for (const c of categories) {
    for (const m of c.triggerServices ?? []) personRoleModules.add(m);
  }
  if (tagServiceIds.size) {
    const tagged = await prisma.serviceSimplified.findMany({
      where: { id: { in: [...tagServiceIds] }, moduleType: { not: null } },
      select: { moduleType: true },
    });
    for (const s of tagged) if (s.moduleType) personRoleModules.add(s.moduleType);
  }

  // União de moduleTypes: dos serviços + dos configs hardcoded
  const moduleTypes = new Set<string>(knownManagementModuleTypes());
  for (const s of services) if (s.moduleType) moduleTypes.add(s.moduleType);

  const result: ImportedEntityType[] = [];
  for (const moduleType of moduleTypes) {
    const config = getManagementConfig(moduleType);
    const svcs = services.filter((s) => s.moduleType === moduleType);
    // Só cria EntityType se houver alguma fonte de campos (config ou serviço).
    if (!config && svcs.length === 0) continue;
    const kind: EntityKind | null = personRoleModules.has(moduleType) ? 'PERSON_ROLE' : null;
    result.push(buildEntityType(moduleType, config, svcs, kind));
  }
  return result;
}

export async function applyRegistryTypes(types: ImportedEntityType[]): Promise<void> {
  for (const t of types) {
    // Upsert do EntityType por [tenantId, code]. A extension injeta tenantId;
    // por isso usamos findFirst + create/update (findUnique com unique composta
    // por tenant não compila — ver CLAUDE.md).
    const existing = await prisma.entityType.findFirst({ where: { code: t.code } });
    const entityType = existing
      ? await prisma.entityType.update({
          where: { id: existing.id },
          data: {
            name: t.name,
            kind: t.kind,
            department: t.department,
            materializesFrom: t.materializesFrom,
          },
        })
      : await prisma.entityType.create({
          data: {
            code: t.code,
            name: t.name,
            kind: t.kind,
            department: t.department,
            materializesFrom: t.materializesFrom,
          },
        });

    // Upsert de cada FieldDefinition por [tenantId, entityTypeId, key].
    for (const f of t.fields) {
      const existingField = await prisma.fieldDefinition.findFirst({
        where: { entityTypeId: entityType.id, key: f.key },
      });
      const data = {
        label: f.label,
        dataType: f.dataType,
        required: f.required,
        indexable: f.indexable,
        filterable: f.filterable,
        facetable: f.facetable,
        searchable: f.searchable,
        isMetric: f.isMetric,
        aggregation: f.aggregation,
        isPII: f.isPII,
        displayInTable: f.displayInTable,
        displayInCard: f.displayInCard,
        order: f.order,
      };
      if (existingField) {
        await prisma.fieldDefinition.update({ where: { id: existingField.id }, data });
      } else {
        await prisma.fieldDefinition.create({
          data: { entityTypeId: entityType.id, key: f.key, ...data },
        });
      }
    }
  }
}


/** Monta/atualiza os tipos de dados do município. Nunca falha quem chamou. */
export async function syncRegistryTypes(): Promise<number> {
  try {
    const types = await collectRegistryTypes();
    await applyRegistryTypes(types);
    return types.length;
  } catch (error) {
    console.error('[registry-sync] tipos de dados não montados (não crítico):', error instanceof Error ? error.message : error);
    return 0;
  }
}
