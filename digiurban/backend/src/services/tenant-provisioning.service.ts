/**
 * ============================================================================
 * TENANT PROVISIONING (Fase 8 Multi-Tenant)
 * ============================================================================
 * Lógica reutilizável de:
 *   - checagem de limites de uso por tenant (maxUsers / maxCitizens)
 *   - seed inicial de departamentos padrão ao criar um município
 *
 * Extraído das rotas para manter o padrão Router → Service (achado P1) e para
 * reuso pelo onboarding self-service futuro.
 */

import { Prisma } from '@prisma/client';
import { runAsPlatform } from '../lib/tenant-context';

/** Secretarias mínimas que todo município recebe ao ser provisionado. */
export const DEFAULT_DEPARTMENTS: Array<{ name: string; code: string }> = [
  { name: 'Gabinete do Prefeito', code: 'GABINETE' },
  { name: 'Secretaria de Administração', code: 'ADMIN' },
  { name: 'Secretaria de Saúde', code: 'SAUDE' },
  { name: 'Secretaria de Educação', code: 'EDUCACAO' },
  { name: 'Secretaria de Assistência Social', code: 'ASSISTENCIA' },
  { name: 'Secretaria de Obras', code: 'OBRAS' },
  { name: 'Secretaria de Meio Ambiente', code: 'AMBIENTE' },
  { name: 'Ouvidoria', code: 'OUVIDORIA' },
];

/**
 * Serviços iniciais (SEM_DADOS: geram protocolo de acompanhamento) — o portal
 * do cidadão do município novo nasce com um catálogo mínimo utilizável.
 * A chave é o code da secretaria criada por seedDefaultDepartments.
 */
export const DEFAULT_SERVICES: Array<{ name: string; description: string; deptCode: string }> = [
  { name: 'Solicitação Geral', description: 'Abertura de solicitação geral ao município', deptCode: 'ADMIN' },
  { name: 'Ouvidoria — Reclamação', description: 'Registrar reclamação junto à Ouvidoria', deptCode: 'OUVIDORIA' },
  { name: 'Ouvidoria — Denúncia', description: 'Registrar denúncia junto à Ouvidoria', deptCode: 'OUVIDORIA' },
  { name: 'Ouvidoria — Elogio ou Sugestão', description: 'Enviar elogio ou sugestão', deptCode: 'OUVIDORIA' },
  { name: 'Solicitação de Serviço de Obras', description: 'Tapa-buraco, iluminação, calçadas e afins', deptCode: 'OBRAS' },
  { name: 'Solicitação — Meio Ambiente', description: 'Poda de árvore, denúncia ambiental e afins', deptCode: 'AMBIENTE' },
  { name: 'Atendimento — Assistência Social', description: 'Solicitar atendimento da Assistência Social', deptCode: 'ASSISTENCIA' },
];

/**
 * Cria os serviços iniciais do tenant, vinculados às secretarias padrão.
 * Retorna quantos foram criados (idempotente por [tenant, nome+dept]).
 */
export async function seedDefaultServices(
  tx: Prisma.TransactionClient | any,
  tenantId: string
): Promise<number> {
  const departments: Array<{ id: string; code: string | null }> = await tx.department.findMany({
    where: { tenantId },
    select: { id: true, code: true },
  });
  const byCode = new Map(departments.map((d) => [d.code, d.id]));

  let created = 0;
  for (const svc of DEFAULT_SERVICES) {
    const departmentId = byCode.get(svc.deptCode);
    if (!departmentId) continue; // secretaria não existe neste tenant — pular
    const exists = await tx.serviceSimplified.findFirst({
      where: { tenantId, name: svc.name, departmentId },
      select: { id: true },
    });
    if (exists) continue;
    await tx.serviceSimplified.create({
      data: {
        tenantId,
        name: svc.name,
        description: svc.description,
        departmentId,
        serviceType: 'SEM_DADOS',
        isActive: true,
      },
    });
    created++;
  }
  return created;
}

export interface UsageLimitResult {
  allowed: boolean;
  code?: 'USER_LIMIT_REACHED' | 'CITIZEN_LIMIT_REACHED';
  current?: number;
  limit?: number;
}

/**
 * Verifica se o tenant ainda pode criar um usuário/cidadão dentro do plano.
 * Executa dentro do escopo do próprio tenant (não de plataforma) — a contagem
 * já vem filtrada pela extension.
 */
export async function checkTenantUsageLimit(
  tx: Prisma.TransactionClient | any,
  kind: 'user' | 'citizen',
  limits: { maxUsers: number; maxCitizens: number }
): Promise<UsageLimitResult> {
  if (kind === 'user') {
    const current = await tx.user.count({ where: { isActive: true } });
    if (current >= limits.maxUsers) {
      return { allowed: false, code: 'USER_LIMIT_REACHED', current, limit: limits.maxUsers };
    }
  } else {
    const current = await tx.citizen.count({ where: { isActive: true } });
    if (current >= limits.maxCitizens) {
      return { allowed: false, code: 'CITIZEN_LIMIT_REACHED', current, limit: limits.maxCitizens };
    }
  }
  return { allowed: true };
}

/**
 * Cria as secretarias padrão para um tenant recém-provisionado.
 * `tx` deve já estar carimbando tenantId (via extension no contexto do tenant)
 * OU receber tenantId explícito — aqui passamos explícito por segurança, já que
 * o provisionamento roda em runAsPlatform.
 */
export async function seedDefaultDepartments(
  tx: Prisma.TransactionClient | any,
  tenantId: string
): Promise<number> {
  const result = await tx.department.createMany({
    data: DEFAULT_DEPARTMENTS.map((d) => ({
      name: d.name,
      code: d.code,
      tenantId,
      isActive: true,
    })),
    // Com a unique composta [tenantId, name] (migration 20260708120000), o
    // skipDuplicates é idempotência POR TENANT — nomes iguais em outros
    // municípios não colidem mais. (Antes da conversão, o unique global fazia
    // este seed pular silenciosamente secretarias já existentes no default.)
    skipDuplicates: true,
  });
  return result.count;
}

/** Conveniência: totais de uso de um tenant (para painel de plataforma). */
export async function getTenantUsage(tenantId: string): Promise<{ users: number; citizens: number }> {
  return runAsPlatform(async () => {
    const { prisma } = await import('../lib/prisma');
    const [users, citizens] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.citizen.count({ where: { tenantId } }),
    ]);
    return { users, citizens };
  });
}

// ============================================================================
// FASE C MULTI-TENANT: gestão de tenants extraída das rotas
// ============================================================================
// Compartilhada entre /api/platform (PlatformUser, caminho novo) e
// /api/super-admin (dupla aceitação — corta na Fase D/H). Router → Service.

export const RESERVED_SLUGS = ['default', 'www', 'api', 'admin', 'platform', 'mail', 'smtp'];

export interface ProvisionTenantInput {
  slug: string;
  nome: string;
  cnpj: string;
  nomeMunicipio: string;
  ufMunicipio: string;
  codigoIbge?: string;
  customDomain?: string;
  plan?: string;
  maxUsers?: number;
  maxCitizens?: number;
  features?: unknown;
  branding?: unknown;
  adminName: string;
  adminEmail: string;
}

/** Lista todos os tenants com contadores de uso (visão de plataforma). */
export async function listTenantsWithUsage(): Promise<unknown[]> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () => {
    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } });
    return Promise.all(
      tenants.map(async (t: any) => ({
        ...t,
        _counts: {
          users: await prisma.user.count({ where: { tenantId: t.id } }),
          citizens: await prisma.citizen.count({ where: { tenantId: t.id } }),
          protocols: await prisma.protocolSimplified.count({ where: { tenantId: t.id } }),
        },
      }))
    );
  });
}

export interface ProvisionResult {
  tenant: any;
  admin: { id: string; email: string; name: string };
  departmentsCreated: number;
  servicesCreated: number;
  /** Entregue UMA única vez; o admin troca no primeiro login */
  temporaryPassword: string;
}

/**
 * Provisiona município completo em transação atômica:
 * tenant + ADMIN inicial (senha temporária, mustChangePassword) + secretarias
 * e serviços padrão. Lança ReservedSlugError/P2002 para as rotas traduzirem.
 */
export async function provisionTenant(input: ProvisionTenantInput): Promise<ProvisionResult> {
  if (RESERVED_SLUGS.includes(input.slug)) {
    const err = new Error(`Slug reservado: ${input.slug}`) as Error & { code?: string };
    err.code = 'RESERVED_SLUG';
    throw err;
  }

  const crypto = await import('crypto');
  const bcrypt = await import('bcryptjs');
  const { prisma } = await import('../lib/prisma');

  const tempPassword = crypto.randomBytes(9).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const result = await runAsPlatform(async () =>
    prisma.$transaction(async (tx: any) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: input.slug,
          nome: input.nome,
          cnpj: input.cnpj,
          codigoIbge: input.codigoIbge,
          nomeMunicipio: input.nomeMunicipio,
          ufMunicipio: input.ufMunicipio,
          customDomain: input.customDomain,
          plan: input.plan ?? 'basic',
          maxUsers: input.maxUsers ?? 10,
          maxCitizens: input.maxCitizens ?? 10000,
          features: (input.features as any) ?? undefined,
          branding: (input.branding as any) ?? undefined,
        },
      });

      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.adminName,
          email: input.adminEmail,
          password: passwordHash,
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: true,
        },
      });

      // Secretarias e serviços padrão (Fase 8) — município nasce operável
      const departmentsCreated = await seedDefaultDepartments(tx, tenant.id);
      const servicesCreated = await seedDefaultServices(tx, tenant.id);

      return { tenant, admin, departmentsCreated, servicesCreated };
    })
  );

  const { TenantService } = await import('./tenant.service');
  TenantService.invalidate();

  return {
    tenant: result.tenant,
    admin: { id: result.admin.id, email: result.admin.email, name: result.admin.name },
    departmentsCreated: result.departmentsCreated,
    servicesCreated: result.servicesCreated,
    temporaryPassword: tempPassword,
  };
}

/** Atualiza/suspende/reativa um tenant (visão de plataforma). */
export async function updateTenant(id: string, data: Record<string, unknown>): Promise<any> {
  if (typeof data.slug === 'string' && RESERVED_SLUGS.includes(data.slug)) {
    const err = new Error(`Slug reservado: ${data.slug}`) as Error & { code?: string };
    err.code = 'RESERVED_SLUG';
    throw err;
  }

  const { prisma } = await import('../lib/prisma');
  const tenant = await runAsPlatform(async () =>
    await prisma.tenant.update({ where: { id }, data: data as any })
  );

  const { TenantService } = await import('./tenant.service');
  TenantService.invalidate();

  return tenant;
}
