/**
 * ============================================================================
 * TENANT SERVICE (Fase 1 do plano Multi-Tenant)
 * ============================================================================
 * Fonte de leitura para dados do tenant, com cache em memória (TTL curto).
 *
 * Compatibilidade com o legado single-tenant:
 * - Enquanto rotas legadas (super-admin, municipality-config) ainda escrevem em
 *   `municipio_config`, este serviço faz sync unidirecional lazy:
 *   se `municipio_config.updatedAt` > `tenants.updatedAt` do tenant default,
 *   os campos legados são copiados para o tenant na próxima leitura.
 * - Se a tabela `tenants` ainda não existir (migration não aplicada), a leitura
 *   cai para `municipio_config` mapeado no shape de Tenant (id transitório).
 *
 * A escrita direta em Tenant (painel de plataforma) chega na Fase 5.
 */

import { prisma } from '../lib/prisma';
import { logger } from '../config/logger.config';
import { DEFAULT_TENANT_ID, DEFAULT_TENANT_SLUG } from '../lib/tenant-context';

export { DEFAULT_TENANT_ID, DEFAULT_TENANT_SLUG };

export interface TenantRecord {
  id: string;
  slug: string;
  customDomain?: string | null;
  nome: string;
  cnpj: string;
  codigoIbge: string | null;
  nomeMunicipio: string;
  ufMunicipio: string;
  status: string; // enum TenantStatus: ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED | CANCELLED
  suspensionReason: string | null;
  paymentStatus: string;
  plan: string;
  planEndsAt: Date | null;
  maxUsers: number;
  maxCitizens: number;
  features: unknown;
  branding: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface CacheEntry {
  value: TenantRecord;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): TenantRecord | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function cacheSet(keys: string[], value: TenantRecord): void {
  const entry: CacheEntry = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  for (const key of keys) cache.set(key, entry);
}

/** Tabela tenants pode não existir antes da migration — detectar e degradar. */
function isMissingTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /tenants.*does not exist|P2021/i.test(message) || (error as any)?.code === 'P2021';
}

/** Coluna customDomain pode não existir antes da migration da Fase 4. */
function isMissingColumnError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /customDomain.*does not exist|P2022/i.test(message) || (error as any)?.code === 'P2022';
}

function mapMunicipioConfigToTenant(config: {
  nome: string;
  cnpj: string;
  codigoIbge: string | null;
  nomeMunicipio: string;
  ufMunicipio: string;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  paymentStatus: string;
  subscriptionPlan: string;
  subscriptionEnds: Date | null;
  maxUsers: number;
  maxCitizens: number;
  features: unknown;
  createdAt: Date;
  updatedAt: Date;
}): TenantRecord {
  return {
    id: DEFAULT_TENANT_ID,
    slug: DEFAULT_TENANT_SLUG,
    nome: config.nome,
    cnpj: config.cnpj,
    codigoIbge: config.codigoIbge,
    nomeMunicipio: config.nomeMunicipio,
    ufMunicipio: config.ufMunicipio,
    status: config.isSuspended ? 'SUSPENDED' : config.isActive ? 'ACTIVE' : 'INACTIVE',
    suspensionReason: config.suspensionReason,
    paymentStatus: config.paymentStatus,
    plan: config.subscriptionPlan,
    planEndsAt: config.subscriptionEnds,
    maxUsers: config.maxUsers,
    maxCitizens: config.maxCitizens,
    features: config.features,
    branding: null,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

export class TenantService {
  /**
   * Tenant default (único tenant existente até a Fase 4).
   * Retorna null apenas se nem tenants nem municipio_config estiverem populados.
   */
  static async getDefault(): Promise<TenantRecord | null> {
    const cached = cacheGet(`id:${DEFAULT_TENANT_ID}`);
    if (cached) return cached;

    let tenant: TenantRecord | null = null;

    try {
      tenant = (await prisma.tenant.findUnique({
        where: { id: DEFAULT_TENANT_ID },
      })) as TenantRecord | null;

      if (tenant) {
        tenant = await TenantService.syncFromLegacyIfNewer(tenant);
      }
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
      logger.warn('Tabela tenants ainda não existe — usando municipio_config (modo compat Fase 1)');
    }

    if (!tenant) {
      const legacy = await prisma.municipioConfig.findFirst();
      if (!legacy) return null;
      tenant = mapMunicipioConfigToTenant(legacy);
    }

    cacheSet([`id:${tenant.id}`, `slug:${tenant.slug}`], tenant);
    return tenant;
  }

  static async getById(id: string): Promise<TenantRecord | null> {
    const cached = cacheGet(`id:${id}`);
    if (cached) return cached;

    if (id === DEFAULT_TENANT_ID) return TenantService.getDefault();

    const tenant = (await prisma.tenant.findUnique({ where: { id } })) as TenantRecord | null;
    if (tenant) cacheSet([`id:${tenant.id}`, `slug:${tenant.slug}`], tenant);
    return tenant;
  }

  static async getBySlug(slug: string): Promise<TenantRecord | null> {
    const cached = cacheGet(`slug:${slug}`);
    if (cached) return cached;

    if (slug === DEFAULT_TENANT_SLUG) return TenantService.getDefault();

    const tenant = (await prisma.tenant.findUnique({ where: { slug } })) as TenantRecord | null;
    if (tenant) cacheSet([`id:${tenant.id}`, `slug:${tenant.slug}`], tenant);
    return tenant;
  }

  /**
   * Resolução por host (Fase 4), em ordem de precedência:
   *   1. Domínio custom do tenant (tenants.customDomain, match exato)
   *   2. Subdomínio {slug}.TENANT_BASE_DOMAIN (env, ex.: digiurban.com.br)
   *   3. Fallback: tenant default (TRANSIÇÃO — hosts do modo single-tenant,
   *      localhost e IPs; vira fail-closed/404 quando o onboarding da Fase 8
   *      passar a cadastrar todos os domínios).
   * Resultado cacheado por host (mesmo TTL das demais chaves).
   */
  static async getByHost(host: string): Promise<TenantRecord | null> {
    const normalized = (host || '').toLowerCase().split(':')[0];
    if (!normalized) return TenantService.getDefault();

    const cached = cacheGet(`host:${normalized}`);
    if (cached) return cached;

    let tenant: TenantRecord | null = null;

    // 1) Domínio custom
    try {
      tenant = (await prisma.tenant.findUnique({
        where: { customDomain: normalized },
      })) as TenantRecord | null;
    } catch (error) {
      if (!isMissingTableError(error) && !isMissingColumnError(error)) throw error;
    }

    // 2) Subdomínio do domínio base
    if (!tenant) {
      const baseDomain = (process.env.TENANT_BASE_DOMAIN || '').toLowerCase();
      if (baseDomain && normalized.endsWith(`.${baseDomain}`)) {
        const slug = normalized.slice(0, -(baseDomain.length + 1));
        // subdomínios reservados nunca resolvem tenant por slug
        if (slug && !slug.includes('.') && !['www', 'api', 'admin', 'platform', 'mail', 'smtp'].includes(slug)) {
          tenant = await TenantService.getBySlug(slug);
        }
      }
    }

    // 3) Fallback de transição
    if (!tenant) {
      tenant = await TenantService.getDefault();
    }

    if (tenant) {
      cacheSet([`host:${normalized}`, `id:${tenant.id}`, `slug:${tenant.slug}`], tenant);
    }
    return tenant;
  }

  static invalidate(tenant?: { id: string; slug: string }): void {
    if (tenant) {
      cache.delete(`id:${tenant.id}`);
      cache.delete(`slug:${tenant.slug}`);
    } else {
      cache.clear();
    }
  }

  /**
   * Sync unidirecional legado → tenant: absorve escritas feitas pelas rotas
   * que ainda atualizam municipio_config (super-admin, municipality-config).
   */
  private static async syncFromLegacyIfNewer(tenant: TenantRecord): Promise<TenantRecord> {
    const legacy = await prisma.municipioConfig.findFirst();
    if (!legacy || legacy.updatedAt <= tenant.updatedAt) return tenant;

    logger.info('TenantService: sincronizando alterações de municipio_config → tenants', {
      tenantId: tenant.id,
    });

    const mapped = mapMunicipioConfigToTenant(legacy);
    const updated = (await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        nome: mapped.nome,
        cnpj: mapped.cnpj,
        codigoIbge: mapped.codigoIbge,
        nomeMunicipio: mapped.nomeMunicipio,
        ufMunicipio: mapped.ufMunicipio,
        status: mapped.status as any,
        suspensionReason: mapped.suspensionReason,
        paymentStatus: mapped.paymentStatus,
        plan: mapped.plan,
        planEndsAt: mapped.planEndsAt,
        maxUsers: mapped.maxUsers,
        maxCitizens: mapped.maxCitizens,
        features: mapped.features as any,
      },
    })) as TenantRecord;

    return updated;
  }
}
