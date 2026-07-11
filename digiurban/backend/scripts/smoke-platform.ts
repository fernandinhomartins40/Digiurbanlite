/**
 * ============================================================================
 * SMOKE TEST — Fase C Multi-Tenant (Platform Admin)
 * ============================================================================
 * Valida contra banco real:
 *   1. platformAuthMiddleware: aceita só token type='platform' de user ativo;
 *      rejeita token de admin de tenant, token inválido e user inativo
 *   2. requirePlatformRole: PLATFORM_SUPPORT não passa em rota de escrita
 *   3. provisionTenant: município completo (tenant + ADMIN + 8 secretarias +
 *      7 serviços); slug reservado rejeitado; duplicata → P2002
 *   4. updateTenant: suspensão/reativação
 *
 * Uso:
 *   DATABASE_URL=... JWT_SECRET=... npx ts-node --transpile-only scripts/smoke-platform.ts
 */

import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { runAsPlatform } from '../src/lib/tenant-context';
import { platformAuthMiddleware, requirePlatformRole } from '../src/middleware/platform-auth';
import {
  provisionTenant,
  updateTenant,
  listTenantsWithUsage,
} from '../src/services/tenant-provisioning.service';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-secret';

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** Executa um middleware com req/res mockados e devolve o resultado. */
async function runMiddleware(
  middleware: (req: any, res: any, next: any) => any,
  req: Record<string, unknown>
): Promise<{ nextCalled: boolean; status?: number; body?: any; req: any }> {
  return new Promise((resolve) => {
    const state: { nextCalled: boolean; status?: number; body?: any } = { nextCalled: false };
    const res = {
      status(code: number) {
        state.status = code;
        return this;
      },
      json(body: any) {
        state.body = body;
        resolve({ ...state, req });
        return this;
      },
    };
    const next = () => {
      state.nextCalled = true;
      resolve({ ...state, req });
    };
    void middleware(req, res, next);
  });
}

async function main(): Promise<void> {
  const stamp = Date.now();

  console.log('\n[setup] PlatformUser ativo, inativo e de suporte');
  const password = 'senha-smoke-123';
  const hash = await bcrypt.hash(password, 4);
  const [admin, inactive, support] = await runAsPlatform(async () =>
    Promise.all([
      prisma.platformUser.create({
        data: { email: `padm-${stamp}@smoke.test`, name: 'Platform Admin', password: hash },
      }),
      prisma.platformUser.create({
        data: { email: `pinact-${stamp}@smoke.test`, name: 'Inativo', password: hash, isActive: false },
      }),
      prisma.platformUser.create({
        data: { email: `psup-${stamp}@smoke.test`, name: 'Suporte', password: hash, role: 'PLATFORM_SUPPORT' },
      }),
    ])
  );

  const secret = process.env.JWT_SECRET!;
  const platformToken = jwt.sign({ platformUserId: admin.id, type: 'platform', role: admin.role }, secret);
  const supportToken = jwt.sign({ platformUserId: support.id, type: 'platform', role: support.role }, secret);
  const inactiveToken = jwt.sign({ platformUserId: inactive.id, type: 'platform', role: inactive.role }, secret);
  const tenantAdminToken = jwt.sign({ userId: 'algum-user', type: 'admin', tenantId: 'tenant-x' }, secret);

  console.log('\n[1] platformAuthMiddleware');
  const ok = await runMiddleware(platformAuthMiddleware, {
    cookies: { digiurban_platform_token: platformToken },
    headers: {},
  });
  assert(ok.nextCalled, 'token de plataforma válido passa');
  assert(ok.req.platformUser?.id === admin.id, 'platformUser anexado à request');

  const asAdmin = await runMiddleware(platformAuthMiddleware, {
    cookies: {},
    headers: { authorization: `Bearer ${tenantAdminToken}` },
  });
  assert(!asAdmin.nextCalled && asAdmin.status === 401, 'token de ADMIN de tenant é rejeitado (401)');

  const asInactive = await runMiddleware(platformAuthMiddleware, {
    cookies: { digiurban_platform_token: inactiveToken },
    headers: {},
  });
  assert(!asInactive.nextCalled && asInactive.status === 401, 'operador inativo é rejeitado (401)');

  const asGarbage = await runMiddleware(platformAuthMiddleware, {
    cookies: { digiurban_platform_token: 'lixo' },
    headers: {},
  });
  assert(!asGarbage.nextCalled && asGarbage.status === 401, 'token inválido é rejeitado (401)');

  const noToken = await runMiddleware(platformAuthMiddleware, { cookies: {}, headers: {} });
  assert(!noToken.nextCalled && noToken.status === 401, 'sem token é rejeitado (401)');

  console.log('\n[2] requirePlatformRole');
  const supportReq = await runMiddleware(platformAuthMiddleware, {
    cookies: { digiurban_platform_token: supportToken },
    headers: {},
  });
  assert(supportReq.nextCalled, 'PLATFORM_SUPPORT autentica');
  const roleCheck = await runMiddleware(requirePlatformRole('PLATFORM_ADMIN'), supportReq.req);
  assert(!roleCheck.nextCalled && roleCheck.status === 403, 'PLATFORM_SUPPORT barrado em escrita (403)');
  const roleOk = await runMiddleware(requirePlatformRole('PLATFORM_ADMIN'), ok.req);
  assert(roleOk.nextCalled, 'PLATFORM_ADMIN passa no requirePlatformRole');

  console.log('\n[3] provisionTenant (service compartilhado)');
  const slug = `smk-plat-${stamp}`;
  const result = await provisionTenant({
    slug,
    nome: `Prefeitura Smoke ${stamp}`,
    cnpj: `${stamp}`.padStart(14, '5').slice(0, 14),
    nomeMunicipio: 'Cidade Plataforma',
    ufMunicipio: 'SP',
    adminName: 'Admin Municipal',
    adminEmail: `adm-${stamp}@smoke.test`,
  });
  assert(!!result.tenant.id, 'tenant criado');
  assert(!!result.temporaryPassword, 'senha temporária gerada');
  assert(result.departmentsCreated === 8, '8 secretarias padrão', String(result.departmentsCreated));
  assert(result.servicesCreated === 7, '7 serviços padrão', String(result.servicesCreated));

  const adminUser = await runAsPlatform(async () =>
    prisma.user.findFirst({ where: { email: `adm-${stamp}@smoke.test` }, select: { tenantId: true, role: true, mustChangePassword: true } })
  );
  assert(adminUser?.tenantId === result.tenant.id, 'ADMIN municipal carimbado no tenant novo');
  assert(adminUser?.mustChangePassword === true, 'mustChangePassword ativo');

  try {
    await provisionTenant({
      slug: 'platform',
      nome: 'x', cnpj: '11111111111111', nomeMunicipio: 'x', ufMunicipio: 'SP',
      adminName: 'x', adminEmail: 'x@x.test',
    } as any);
    assert(false, 'slug reservado rejeitado');
  } catch (e: any) {
    assert(e?.code === 'RESERVED_SLUG', 'slug reservado rejeitado (RESERVED_SLUG)');
  }

  try {
    await provisionTenant({
      slug,
      nome: 'Dup', cnpj: '22222222222222', nomeMunicipio: 'Dup', ufMunicipio: 'RJ',
      adminName: 'Dup', adminEmail: `dup-${stamp}@smoke.test`,
    });
    assert(false, 'slug duplicado → P2002');
  } catch (e: any) {
    assert(e?.code === 'P2002', 'slug duplicado → P2002', e?.code);
  }

  console.log('\n[4] updateTenant + listTenantsWithUsage');
  const suspended = await updateTenant(result.tenant.id, { status: 'SUSPENDED', suspensionReason: 'smoke' });
  assert(suspended.status === 'SUSPENDED', 'suspensão aplicada');
  const reactivated = await updateTenant(result.tenant.id, { status: 'ACTIVE', suspensionReason: null });
  assert(reactivated.status === 'ACTIVE', 'reativação aplicada');

  const list = (await listTenantsWithUsage()) as any[];
  const entry = list.find((t) => t.id === result.tenant.id);
  assert(!!entry && entry._counts.users === 1, 'listagem traz contadores (1 user)');

  // Cleanup
  await runAsPlatform(async () => {
    await prisma.serviceSimplified.deleteMany({ where: { tenantId: result.tenant.id } });
    await prisma.department.deleteMany({ where: { tenantId: result.tenant.id } });
    await prisma.user.deleteMany({ where: { tenantId: result.tenant.id } });
    await prisma.tenant.delete({ where: { id: result.tenant.id } });
    await prisma.platformUser.deleteMany({ where: { id: { in: [admin.id, inactive.id, support.id] } } });
  });

  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Erro fatal no smoke:', error);
  process.exit(1);
});
