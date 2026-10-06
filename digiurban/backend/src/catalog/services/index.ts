/**
 * Catálogo de serviços da plataforma (21 secretarias, ~400 serviços).
 *
 * Fica dentro de src/ (vai no build): o município novo é semeado no próprio
 * processo do servidor. Antes vivia em prisma/seeds/ e rodava num processo à
 * parte com limite de 2 minutos — se falhasse, o município ficava só com os
 * serviços genéricos e ninguém sabia.
 */

import { createHash } from 'crypto';
import { effectiveDestination } from '../../config/app-catalog';
import { ServiceDefinition } from './types';
import { healthServices } from './health.seed';
import { educationServices } from './education.seed';
import { socialServices } from './social.seed';
import { agricultureServices } from './agriculture.seed';
import { cultureServices } from './culture.seed';
import { sportsServices } from './sports.seed';
import { housingServices } from './housing.seed';
import { environmentServices } from './environment.seed';
import { publicWorksServices } from './public-works.seed';
import { urbanPlanningServices } from './urban-planning.seed';
import { publicSafetyServices } from './public-safety.seed';
import { publicServices } from './public-services.seed';
import { tourismServices } from './tourism.seed';
import { financeServices } from './finance.seed';
import { administrationServices } from './administration.seed';
import { civilDefenseServices } from './civil-defense.seed';
import { womenPoliciesServices } from './women-policies.seed';
import { technologyInnovationServices } from './technology-innovation.seed';
import { transportTransitServices } from './transport-transit.seed';
import { economicDevelopmentServices } from './economic-development.seed';
import { urbanMobilityServices } from './urban-mobility.seed';

export type { ServiceDefinition } from './types';

export const allServices: ServiceDefinition[] = [
  ...healthServices,
  ...educationServices,
  ...socialServices,
  ...agricultureServices,
  ...cultureServices,
  ...sportsServices,
  ...housingServices,
  ...environmentServices,
  ...publicWorksServices,
  ...urbanPlanningServices,
  ...publicSafetyServices,
  ...publicServices,
  ...tourismServices,
  ...financeServices,
  ...administrationServices,
  ...civilDefenseServices,
  ...womenPoliciesServices,
  ...technologyInnovationServices,
  ...transportTransitServices,
  ...economicDevelopmentServices,
  ...urbanMobilityServices,
];

const slug = (value: string) =>
  String(value || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

/** Chave estável do item do catálogo (o código técnico, ou secretaria + nome) */
export function catalogKeyOf(def: ServiceDefinition): string {
  return def.moduleType ? def.moduleType : `${def.departmentCode}:${slug(def.name)}`;
}

/** Campos que o catálogo controla (o resto é do município: ativo, nível, destino...) */
export function catalogFields(def: ServiceDefinition) {
  return {
    name: def.name,
    description: def.description,
    serviceType: def.serviceType,
    serviceSubtype: def.serviceSubtype || null,
    formSchema: (def.formSchema as any) ?? null,
    requiresDocuments: Boolean(def.requiresDocuments),
    requiredDocuments: def.requiredDocuments ?? null,
    estimatedDays: def.estimatedDays ?? null,
    priority: def.priority ?? 3,
    category: def.category ?? null,
    icon: def.icon ?? null,
    color: def.color ?? null,
    allowMultipleActiveProtocols: def.allowMultipleActiveProtocols !== undefined ? def.allowMultipleActiveProtocols : true,
    uniquenessScope: def.uniquenessScope || null,
    uniquenessRules: (def.uniquenessRules as any) ?? null,
  };
}

/** Ordena as chaves para a impressão não mudar por ordem de campos no JSON */
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.keys(value as object)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: stable((value as any)[key]) }), {});
  }
  return value;
}

/** Impressão do conteúdo controlado pelo catálogo (para saber se o município editou) */
export function catalogHashOf(fields: Record<string, unknown>): string {
  let requiredDocuments: unknown = fields.requiredDocuments ?? null;
  if (typeof requiredDocuments === 'string') {
    try {
      requiredDocuments = JSON.parse(requiredDocuments);
    } catch {
      // mantém o texto
    }
  }
  const comparable = {
    name: fields.name ?? null,
    description: fields.description ?? null,
    serviceType: fields.serviceType ?? null,
    serviceSubtype: fields.serviceSubtype ?? null,
    formSchema: fields.formSchema ?? null,
    requiresDocuments: Boolean(fields.requiresDocuments),
    requiredDocuments,
    estimatedDays: fields.estimatedDays ?? null,
    priority: fields.priority ?? null,
    category: fields.category ?? null,
    icon: fields.icon ?? null,
    color: fields.color ?? null,
    allowMultipleActiveProtocols: fields.allowMultipleActiveProtocols ?? true,
    uniquenessScope: fields.uniquenessScope ?? null,
    uniquenessRules: fields.uniquenessRules ?? null,
  };
  return createHash('sha256').update(JSON.stringify(stable(comparable))).digest('hex').slice(0, 32);
}

export interface CatalogApplyResult {
  created: number;
  updated: number;
  keptEdited: number;
  skippedNoDepartment: number;
}

/**
 * Aplica o catálogo num município. Regra "só acrescenta":
 *  - serviço que não existe → criado (ativo);
 *  - serviço que o município NÃO editou desde a última aplicação → recebe a melhoria;
 *  - serviço editado pelo município → fica como está (nem reativa, nem sobrescreve).
 * Antes cada nova execução sobrescrevia tudo e religava serviços desligados.
 *
 * `db` = prisma no contexto do município (ou transação); `tenantId` explícito.
 */
export async function applyServiceCatalog(db: any, tenantId: string, options: { log?: boolean } = {}): Promise<CatalogApplyResult> {
  const log = options.log ? console.log : () => undefined;
  const result: CatalogApplyResult = { created: 0, updated: 0, keptEdited: 0, skippedNoDepartment: 0 };

  const departments: Array<{ id: string; code: string | null }> = await db.department.findMany({
    where: { tenantId },
    select: { id: true, code: true },
  });
  const departmentByCode = new Map(departments.map((department) => [department.code, department.id]));

  const existing: any[] = await db.serviceSimplified.findMany({ where: { tenantId } });
  const byKey = new Map(existing.filter((service) => service.catalogKey).map((service) => [service.catalogKey, service]));
  const byModuleType = new Map(existing.filter((service) => service.moduleType).map((service) => [service.moduleType, service]));
  const byName = new Map(existing.map((service) => [`${service.departmentId}|${String(service.name).trim().toLowerCase()}`, service]));

  for (const def of allServices) {
    const departmentId = departmentByCode.get(def.departmentCode);
    if (!departmentId) {
      result.skippedNoDepartment++;
      continue;
    }
    const key = catalogKeyOf(def);
    const fields = catalogFields(def);
    const newHash = catalogHashOf(fields);
    const current =
      byKey.get(key) ||
      (def.moduleType ? byModuleType.get(def.moduleType) : undefined) ||
      byName.get(`${departmentId}|${def.name.trim().toLowerCase()}`);

    try {
      if (!current) {
        // destino gravado já na criação (fila ou app da secretaria, pelo catálogo de apps)
        const route = effectiveDestination({ moduleType: def.moduleType || null });
        await db.serviceSimplified.create({
          data: {
            tenantId,
            departmentId,
            moduleType: def.moduleType || null,
            isActive: true,
            destination: route.destination,
            appAction: route.appAction,
            catalogKey: key,
            catalogHash: newHash,
            ...fields,
            requiredDocuments: fields.requiredDocuments ?? undefined,
            formSchema: fields.formSchema ?? undefined,
            uniquenessRules: fields.uniquenessRules ?? undefined,
          },
        });
        result.created++;
        log(`   + ${def.name}`);
        continue;
      }

      const currentHash = catalogHashOf(current);
      const untouched = current.catalogHash ? current.catalogHash === currentHash : false;

      if (!current.catalogHash) {
        // serviço antigo, de antes desta regra: adota o conteúdo de hoje como base
        // (sem mexer). Melhorias futuras chegam se o município não editar depois.
        await db.serviceSimplified.update({ where: { id: current.id }, data: { catalogKey: key, catalogHash: currentHash } });
        continue;
      }

      if (!untouched) {
        if (current.catalogKey !== key) {
          await db.serviceSimplified.update({ where: { id: current.id }, data: { catalogKey: key } });
        }
        result.keptEdited++;
        continue;
      }

      if (currentHash !== newHash) {
        await db.serviceSimplified.update({
          where: { id: current.id },
          data: {
            ...fields,
            requiredDocuments: fields.requiredDocuments ?? undefined,
            formSchema: fields.formSchema ?? undefined,
            uniquenessRules: fields.uniquenessRules ?? undefined,
            catalogKey: key,
            catalogHash: newHash,
          },
        });
        result.updated++;
        log(`   ~ ${def.name}`);
      }
    } catch (error: any) {
      console.error(`   ❌ catálogo: ${def.name}: ${error?.message || error}`);
    }
  }

  return result;
}
