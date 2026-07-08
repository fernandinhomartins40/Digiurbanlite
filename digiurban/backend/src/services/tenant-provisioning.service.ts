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
