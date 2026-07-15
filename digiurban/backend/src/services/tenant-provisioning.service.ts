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
import { runAsPlatform, runAsTenant } from '../lib/tenant-context';
import {
  programasSociaisData,
  tiposObraServicoData,
  especialidadesMedicasData,
  tiposProducaoAgricolaData,
  especiesArvoreData,
  tiposEstabelecimentoTuristicoData,
  modalidadesEsportivasData,
  tiposAtividadeCulturalData,
  tiposOcorrenciaData,
} from '../data/default-catalogs.data';

/**
 * Secretarias que todo município recebe ao ser provisionado.
 * Reflete as secretarias REAIS da aplicação (app/admin/secretarias/*) — o
 * município nasce completo. O que a prefeitura não usar pode ser desabilitado
 * no wizard/detalhe (toggle de módulos por feature = slug abaixo).
 * `code` = SLUG da secretaria (alinhado com AVAILABLE_MODULES e requireFeature).
 */
export const DEFAULT_DEPARTMENTS: Array<{ name: string; code: string }> = [
  { name: 'Gabinete do Prefeito', code: 'gabinete' },
  { name: 'Secretaria Municipal de Administração', code: 'administracao' },
  { name: 'Secretaria Municipal de Agricultura', code: 'agricultura' },
  { name: 'Secretaria Municipal de Assistência Social', code: 'assistencia-social' },
  { name: 'Secretaria Municipal de Cultura', code: 'cultura' },
  { name: 'Coordenadoria de Defesa Civil', code: 'defesa-civil' },
  { name: 'Secretaria Municipal de Desenvolvimento Econômico', code: 'desenvolvimento-economico' },
  { name: 'Secretaria Municipal de Educação', code: 'educacao' },
  { name: 'Secretaria Municipal de Esportes', code: 'esportes' },
  { name: 'Secretaria Municipal de Finanças', code: 'financas' },
  { name: 'Secretaria Municipal de Habitação', code: 'habitacao' },
  { name: 'Secretaria Municipal de Meio Ambiente', code: 'meio-ambiente' },
  { name: 'Secretaria Municipal de Mobilidade Urbana', code: 'mobilidade-urbana' },
  { name: 'Secretaria Municipal de Obras Públicas', code: 'obras-publicas' },
  { name: 'Secretaria Municipal de Planejamento Urbano', code: 'planejamento-urbano' },
  { name: 'Secretaria Municipal de Políticas para Mulheres', code: 'politicas-mulheres' },
  { name: 'Secretaria Municipal de Saúde', code: 'saude' },
  { name: 'Secretaria Municipal de Segurança Pública', code: 'seguranca-publica' },
  { name: 'Secretaria Municipal de Serviços Públicos', code: 'servicos-publicos' },
  { name: 'Secretaria Municipal de Tecnologia e Inovação', code: 'tecnologia-inovacao' },
  { name: 'Secretaria Municipal de Transportes e Trânsito', code: 'transportes-transito' },
  { name: 'Secretaria Municipal de Turismo', code: 'turismo' },
  { name: 'Ouvidoria', code: 'ouvidoria' },
];

/**
 * Serviços iniciais (SEM_DADOS: geram protocolo de acompanhamento) — o portal
 * do cidadão do município novo nasce com um catálogo utilizável, cobrindo as
 * principais secretarias de atendimento ao cidadão.
 * `deptCode` = code da secretaria criada por seedDefaultDepartments.
 */
export const DEFAULT_SERVICES: Array<{ name: string; description: string; deptCode: string }> = [
  { name: 'Solicitação Geral', description: 'Abertura de solicitação geral ao município', deptCode: 'administracao' },
  { name: 'Ouvidoria — Reclamação', description: 'Registrar reclamação junto à Ouvidoria', deptCode: 'ouvidoria' },
  { name: 'Ouvidoria — Denúncia', description: 'Registrar denúncia junto à Ouvidoria', deptCode: 'ouvidoria' },
  { name: 'Ouvidoria — Elogio ou Sugestão', description: 'Enviar elogio ou sugestão', deptCode: 'ouvidoria' },
  { name: 'Atendimento — Saúde', description: 'Solicitar atendimento ou informação de saúde', deptCode: 'saude' },
  { name: 'Matrícula e Atendimento — Educação', description: 'Solicitações da rede municipal de ensino', deptCode: 'educacao' },
  { name: 'Atendimento — Assistência Social', description: 'Solicitar atendimento da Assistência Social', deptCode: 'assistencia-social' },
  { name: 'Solicitação de Obras', description: 'Tapa-buraco, iluminação, calçadas e afins', deptCode: 'obras-publicas' },
  { name: 'Serviços Públicos', description: 'Coleta, limpeza urbana, poda e afins', deptCode: 'servicos-publicos' },
  { name: 'Meio Ambiente', description: 'Poda de árvore, denúncia ambiental e afins', deptCode: 'meio-ambiente' },
  { name: 'Habitação', description: 'Programas e solicitações habitacionais', deptCode: 'habitacao' },
  { name: 'Agricultura', description: 'Atendimento ao produtor rural', deptCode: 'agricultura' },
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
  // -1 = ilimitado (plano sem teto): pula a checagem.
  if (kind === 'user') {
    if (limits.maxUsers === -1) return { allowed: true };
    const current = await tx.user.count({ where: { isActive: true } });
    if (current >= limits.maxUsers) {
      return { allowed: false, code: 'USER_LIMIT_REACHED', current, limit: limits.maxUsers };
    }
  } else {
    if (limits.maxCitizens === -1) return { allowed: true };
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
  planEndsAt?: string | Date | null;
  maxUsers?: number;
  maxCitizens?: number;
  features?: unknown;
  branding?: unknown;
  adminName: string;
  adminEmail: string;
}

/**
 * Catálogo de secretarias/módulos ativáveis por município.
 * slug = pasta em app/admin/secretarias/ = feature do requireFeature/
 * useTenantFeature. Fonte única para o wizard e o toggle de módulos.
 * Contrato: ausência da chave = habilitado; só `false` explícito desabilita.
 *
 * ⚠️ Manter em sincronia com as secretarias reais da aplicação
 * (digiurban/frontend/app/admin/secretarias/*).
 */
export const AVAILABLE_MODULES: Array<{ slug: string; label: string }> = [
  { slug: 'administracao', label: 'Administração' },
  { slug: 'agricultura', label: 'Agricultura' },
  { slug: 'assistencia-social', label: 'Assistência Social' },
  { slug: 'cultura', label: 'Cultura' },
  { slug: 'defesa-civil', label: 'Defesa Civil' },
  { slug: 'desenvolvimento-economico', label: 'Desenvolvimento Econômico' },
  { slug: 'educacao', label: 'Educação' },
  { slug: 'esportes', label: 'Esportes' },
  { slug: 'financas', label: 'Finanças' },
  { slug: 'habitacao', label: 'Habitação' },
  { slug: 'meio-ambiente', label: 'Meio Ambiente' },
  { slug: 'mobilidade-urbana', label: 'Mobilidade Urbana' },
  { slug: 'obras-publicas', label: 'Obras Públicas' },
  { slug: 'planejamento-urbano', label: 'Planejamento Urbano' },
  { slug: 'politicas-mulheres', label: 'Políticas para Mulheres' },
  { slug: 'saude', label: 'Saúde' },
  { slug: 'seguranca-publica', label: 'Segurança Pública' },
  { slug: 'servicos-publicos', label: 'Serviços Públicos' },
  { slug: 'tecnologia-inovacao', label: 'Tecnologia e Inovação' },
  { slug: 'transportes-transito', label: 'Transportes e Trânsito' },
  { slug: 'turismo', label: 'Turismo' },
];

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
 * Herança de limites/features do catálogo de planos (PlanConfig).
 * Dado um `plan` (code) e o que o chamador informou explicitamente, devolve os
 * valores efetivos: campos NÃO informados herdam do plano; campos informados
 * são OVERRIDE por município. Se o plano não existe no catálogo, mantém o que
 * veio (ou os defaults do caller). `-1` no plano = ilimitado (mantido como -1).
 */
export async function resolvePlanLimits(
  plan: string | undefined,
  explicit: { maxUsers?: number; maxCitizens?: number; features?: unknown }
): Promise<{ maxUsers?: number; maxCitizens?: number; features?: unknown }> {
  if (!plan) return explicit;
  const { getPlanByCode } = await import('./plan-config.service');
  const cfg = await getPlanByCode(plan);
  if (!cfg) return explicit;

  return {
    maxUsers: explicit.maxUsers ?? cfg.maxUsers,
    maxCitizens: explicit.maxCitizens ?? cfg.maxCitizens,
    features: explicit.features ?? (cfg.features ?? undefined),
  };
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

  const plan = input.plan ?? 'basic';
  // Herança do catálogo: limites/features não informados vêm do plano escolhido.
  const limits = await resolvePlanLimits(plan, {
    maxUsers: input.maxUsers,
    maxCitizens: input.maxCitizens,
    features: input.features,
  });

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
          customDomain: input.customDomain || undefined,
          plan,
          planEndsAt: input.planEndsAt ? new Date(input.planEndsAt) : undefined,
          maxUsers: limits.maxUsers ?? 10,
          maxCitizens: limits.maxCitizens ?? 10000,
          features: (limits.features as any) ?? undefined,
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

  // Catálogo COMPLETO de serviços (400+, com formSchema/moduleType) — sem isto o
  // município novo nasce só com os 12 serviços genéricos SEM_DADOS e o módulo de
  // Dados fica vazio. Best-effort pós-commit (é volumoso; não deve travar nem
  // desfazer o provisionamento). Escopado por tenant.
  let fullServicesCreated = 0;
  try {
    const { seedServices } = await import('../../prisma/seeds/services/index');
    const { runAsTenant } = await import('../lib/tenant-context');
    fullServicesCreated = await runAsTenant(result.tenant.id, async () =>
      seedServices(prisma, result.tenant.id)
    );
  } catch (servicesError) {
    console.error(`[PROVISION] Falha ao semear catálogo completo do tenant ${result.tenant.slug}:`, servicesError);
  }

  // Catálogos de referência da onda 8 (plano 2026-07-13): sem isto o município
  // novo nasce com dropdowns vazios (especialidades médicas, tipos de obra,
  // modalidades etc.). Best-effort pós-commit — falha não desfaz o tenant.
  try {
    await seedDefaultCatalogs(result.tenant.id);
  } catch (catalogError) {
    console.error(`[PROVISION] Falha ao semear catálogos do tenant ${result.tenant.slug}:`, catalogError);
  }

  const { TenantService } = await import('./tenant.service');
  TenantService.invalidate();

  return {
    tenant: result.tenant,
    admin: { id: result.admin.id, email: result.admin.email, name: result.admin.name },
    departmentsCreated: result.departmentsCreated,
    servicesCreated: result.servicesCreated + fullServicesCreated,
    temporaryPassword: tempPassword,
  };
}

/**
 * Catálogos de referência (onda 8 — plano 2026-07-13) que todo município NOVO
 * recebe no provisionamento: especialidades médicas, tipos de obra/serviço,
 * modalidades esportivas etc. Sem isto os dropdowns nascem vazios.
 *
 * Idempotente: uniques compostas [tenantId, x] + skipDuplicates. Ativos
 * físicos e programas específicos (máquinas, viaturas, cursos, programas
 * habitacionais/ambientais) NÃO são semeados — são dados do município.
 */
export async function seedDefaultCatalogs(tenantId: string): Promise<void> {
  const { prisma } = await import('../lib/prisma');
  const withTenant = <T extends object>(rows: T[]) =>
    rows.map((r) => ({ ...r, tenantId })) as any[];

  await runAsTenant(tenantId, async () => {
    await prisma.tipoObraServico.createMany({ data: withTenant(tiposObraServicoData), skipDuplicates: true });
    await prisma.especialidadeMedica.createMany({ data: withTenant(especialidadesMedicasData), skipDuplicates: true });
    await prisma.tipoProducaoAgricola.createMany({ data: withTenant(tiposProducaoAgricolaData), skipDuplicates: true });
    await prisma.especieArvore.createMany({ data: withTenant(especiesArvoreData), skipDuplicates: true });
    await prisma.tipoEstabelecimentoTuristico.createMany({ data: withTenant(tiposEstabelecimentoTuristicoData), skipDuplicates: true });
    await prisma.modalidadeEsportiva.createMany({ data: withTenant(modalidadesEsportivasData), skipDuplicates: true });
    await prisma.tipoAtividadeCultural.createMany({ data: withTenant(tiposAtividadeCulturalData), skipDuplicates: true });
    await prisma.tipoOcorrencia.createMany({ data: withTenant(tiposOcorrenciaData), skipDuplicates: true });
    await prisma.programaSocial.createMany({ data: withTenant(programasSociaisData), skipDuplicates: true });
  });
}

/** Atualiza/suspende/reativa um tenant (visão de plataforma). */
export async function updateTenant(id: string, data: Record<string, unknown>): Promise<any> {
  if (typeof data.slug === 'string' && RESERVED_SLUGS.includes(data.slug)) {
    const err = new Error(`Slug reservado: ${data.slug}`) as Error & { code?: string };
    err.code = 'RESERVED_SLUG';
    throw err;
  }

  // Se o plano está sendo alterado, herda do catálogo os campos NÃO enviados no
  // payload (limites/features). Enviar maxUsers/maxCitizens/features = override
  // por município; omiti-los = herdar do plano.
  if (typeof data.plan === 'string') {
    const limits = await resolvePlanLimits(data.plan, {
      maxUsers: data.maxUsers as number | undefined,
      maxCitizens: data.maxCitizens as number | undefined,
      features: 'features' in data ? data.features : undefined,
    });
    if (data.maxUsers === undefined && limits.maxUsers !== undefined) data.maxUsers = limits.maxUsers;
    if (data.maxCitizens === undefined && limits.maxCitizens !== undefined) data.maxCitizens = limits.maxCitizens;
    if (!('features' in data) && limits.features !== undefined) data.features = limits.features;
  }

  const { prisma } = await import('../lib/prisma');
  const tenant = await runAsPlatform(async () =>
    await prisma.tenant.update({ where: { id }, data: data as any })
  );

  const { TenantService } = await import('./tenant.service');
  TenantService.invalidate();

  return tenant;
}

// ============================================================================
// DETALHE / GESTÃO DE ADMINS (painel de município)
// ============================================================================

/** Detalhe completo de um município: dados, uso vs limites e admins. */
export async function getTenantDetail(id: string): Promise<any | null> {
  const { prisma } = await import('../lib/prisma');
  return runAsPlatform(async () => {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return null;

    const [users, citizens, protocols, admins] = await Promise.all([
      prisma.user.count({ where: { tenantId: id } }),
      prisma.citizen.count({ where: { tenantId: id } }),
      prisma.protocolSimplified.count({ where: { tenantId: id } }),
      prisma.user.findMany({
        where: { tenantId: id, role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: {
          id: true, name: true, email: true, role: true, isActive: true,
          mustChangePassword: true, lastLogin: true, createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      ...tenant,
      usage: {
        users, citizens, protocols,
        maxUsers: tenant.maxUsers, maxCitizens: tenant.maxCitizens,
      },
      admins,
    };
  });
}

/** Cria um novo ADMIN para um município (senha temporária, mustChangePassword). */
export async function createTenantAdmin(
  tenantId: string,
  input: { name: string; email: string }
): Promise<{ id: string; email: string; name: string; temporaryPassword: string }> {
  const crypto = await import('crypto');
  const bcrypt = await import('bcryptjs');
  const { prisma } = await import('../lib/prisma');

  const tempPassword = crypto.randomBytes(9).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const admin = await runAsPlatform(async () =>
    prisma.user.create({
      data: {
        tenantId,
        name: input.name,
        email: input.email,
        password: passwordHash,
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: true,
      },
      select: { id: true, email: true, name: true },
    })
  );

  return { ...admin, temporaryPassword: tempPassword };
}

/** Reseta a senha de um usuário de um município (nova senha temporária). */
export async function resetTenantUserPassword(
  tenantId: string,
  userId: string
): Promise<{ temporaryPassword: string }> {
  const crypto = await import('crypto');
  const bcrypt = await import('bcryptjs');
  const { prisma } = await import('../lib/prisma');

  const tempPassword = crypto.randomBytes(9).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // Preflight de ownership: o usuário precisa pertencer ao tenant informado —
  // impede reset cross-tenant a partir do painel.
  const updated = await runAsPlatform(async () => {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true },
    });
    if (!user) {
      const err = new Error('Usuário não encontrado neste município') as Error & { code?: string };
      err.code = 'P2025';
      throw err;
    }
    return prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash, mustChangePassword: true },
    });
  });

  if (!updated) throw new Error('Falha ao resetar senha');
  return { temporaryPassword: tempPassword };
}

/** Ativa/desativa um usuário de um município. */
export async function setTenantUserActive(
  tenantId: string,
  userId: string,
  isActive: boolean
): Promise<void> {
  const { prisma } = await import('../lib/prisma');
  await runAsPlatform(async () => {
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId }, select: { id: true } });
    if (!user) {
      const err = new Error('Usuário não encontrado neste município') as Error & { code?: string };
      err.code = 'P2025';
      throw err;
    }
    await prisma.user.update({ where: { id: userId }, data: { isActive } });
  });
}
