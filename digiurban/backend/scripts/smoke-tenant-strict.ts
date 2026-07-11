/**
 * ============================================================================
 * SMOKE TEST — Fase D Multi-Tenant (fail-closed + telemetria)
 * ============================================================================
 * Valida os três cortes e a telemetria:
 *   1. TENANT_STRICT: Prisma sem contexto lança; com runAsTenant/runAsPlatform
 *      segue; telemetria registra ativações no modo fail-soft
 *   2. resolveUploadTenantId: strict lança sem contexto; explícito passa
 *   3. TENANT_STRICT_HOST: host desconhecido → null; localhost e
 *      TENANT_DEFAULT_HOSTS seguem resolvendo o default
 *   4. TENANT_REQUIRE_TOKEN_CLAIM: token legado sem claim → 401
 *      TENANT_CLAIM_REQUIRED; token de plataforma isento; claim correto passa
 *
 * Uso:
 *   DATABASE_URL=... JWT_SECRET=... npx ts-node --transpile-only scripts/smoke-tenant-strict.ts
 */

import * as jwt from 'jsonwebtoken';
import { prisma } from '../src/lib/prisma';
import { runAsTenant, runAsPlatform, DEFAULT_TENANT_ID } from '../src/lib/tenant-context';
import { resetFailSoftTelemetry, getFailSoftActivations } from '../src/lib/tenant-telemetry';
import { resolveUploadTenantId } from '../src/config/upload';
import { TenantService } from '../src/services/tenant.service';
import { tenantContextMiddleware } from '../src/middleware/tenant-context';

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

function setFlags(flags: Partial<Record<'TENANT_STRICT' | 'TENANT_STRICT_HOST' | 'TENANT_REQUIRE_TOKEN_CLAIM', string>>): void {
  delete process.env.TENANT_STRICT;
  delete process.env.TENANT_STRICT_HOST;
  delete process.env.TENANT_REQUIRE_TOKEN_CLAIM;
  Object.assign(process.env, flags);
}

async function runMiddleware(req: Record<string, unknown>): Promise<{ nextCalled: boolean; status?: number; body?: any }> {
  return new Promise((resolve) => {
    const state: { nextCalled: boolean; status?: number; body?: any } = { nextCalled: false };
    const res = {
      status(code: number) {
        state.status = code;
        return this;
      },
      json(body: any) {
        state.body = body;
        resolve(state);
        return this;
      },
    };
    void tenantContextMiddleware(req as any, res as any, () => {
      state.nextCalled = true;
      resolve(state);
    });
  });
}

async function main(): Promise<void> {
  // Garantir tenant default (banco limpo)
  await runAsPlatform(async () => {
    await prisma.tenant.upsert({
      where: { id: DEFAULT_TENANT_ID },
      update: {},
      create: {
        id: DEFAULT_TENANT_ID, slug: 'default', nome: 'Default', cnpj: '00000000000000',
        nomeMunicipio: 'Default', ufMunicipio: 'SP', status: 'ACTIVE',
      } as any,
    });
  });

  console.log('\n[1] TENANT_STRICT — extension Prisma');
  setFlags({});
  resetFailSoftTelemetry();
  const softCount = await prisma.department.count(); // sem contexto → fail-soft
  assert(softCount >= 0, 'sem strict: query sem contexto funciona (default)');
  assert(getFailSoftActivations().size >= 1, 'telemetria registrou a ativação de fail-soft');

  setFlags({ TENANT_STRICT: '1' });
  let strictThrew = false;
  try {
    await prisma.department.count();
  } catch (e: any) {
    strictThrew = /TENANT_STRICT/.test(e?.message || '');
  }
  assert(strictThrew, 'strict: query sem contexto LANÇA');

  const inTenant = await runAsTenant(DEFAULT_TENANT_ID, async () => prisma.department.count());
  assert(inTenant >= 0, 'strict: runAsTenant segue funcionando');
  const inPlatform = await runAsPlatform(async () => prisma.department.count());
  assert(inPlatform >= 0, 'strict: runAsPlatform segue funcionando');

  // Models GLOBAIS (Tenant, municipio_config...) são lidos sem contexto pela
  // resolução de host do middleware — strict NÃO pode quebrá-los (bug pego
  // pela telemetria durante a implementação: resolveTenantId rodava antes do
  // check de model escopado).
  TenantService.invalidate();
  const hostUnderStrict = await TenantService.getByHost('localhost');
  assert(
    hostUnderStrict?.id === DEFAULT_TENANT_ID,
    'strict: resolução de host (models globais) segue funcionando'
  );
  const middlewareUnderStrict = await runMiddleware({
    hostname: 'localhost',
    cookies: {},
    headers: {},
    ip: '127.0.0.1',
    originalUrl: '/api/teste',
    method: 'GET',
  });
  assert(middlewareUnderStrict.nextCalled, 'strict: tenantContextMiddleware completo passa');

  console.log('\n[2] TENANT_STRICT — resolver de uploads');
  let uploadThrew = false;
  try {
    resolveUploadTenantId();
  } catch (e: any) {
    uploadThrew = /TENANT_STRICT/.test(e?.message || '');
  }
  assert(uploadThrew, 'strict: upload sem contexto LANÇA');
  assert(resolveUploadTenantId('tenant-x') === 'tenant-x', 'strict: tenant explícito passa');
  const uploadInCtx = runAsTenant(DEFAULT_TENANT_ID, () => resolveUploadTenantId());
  assert(uploadInCtx === DEFAULT_TENANT_ID, 'strict: contexto ALS resolve');

  console.log('\n[3] TENANT_STRICT_HOST — resolução por host');
  setFlags({});
  TenantService.invalidate();
  const softHost = await TenantService.getByHost('municipio-fantasma.example.com');
  assert(softHost?.id === DEFAULT_TENANT_ID, 'sem strict: host desconhecido cai no default');

  setFlags({ TENANT_STRICT_HOST: '1' });
  TenantService.invalidate();
  const strictHost = await TenantService.getByHost('municipio-fantasma.example.com');
  assert(strictHost === null, 'strict: host desconhecido NÃO resolve (null)');
  const localhostHost = await TenantService.getByHost('localhost:3001');
  assert(localhostHost?.id === DEFAULT_TENANT_ID, 'strict: localhost segue no default');

  process.env.TENANT_DEFAULT_HOSTS = 'portal.cidade.gov.br';
  TenantService.invalidate();
  const mappedHost = await TenantService.getByHost('portal.cidade.gov.br');
  assert(mappedHost?.id === DEFAULT_TENANT_ID, 'strict: TENANT_DEFAULT_HOSTS resolve o default');
  delete process.env.TENANT_DEFAULT_HOSTS;

  console.log('\n[4] TENANT_REQUIRE_TOKEN_CLAIM — chokepoint');
  const secret = process.env.JWT_SECRET!;
  const legacyToken = jwt.sign({ userId: 'u1', type: 'admin' }, secret); // sem claim
  const claimToken = jwt.sign({ userId: 'u1', type: 'admin', tenantId: DEFAULT_TENANT_ID }, secret);
  const wrongClaim = jwt.sign({ userId: 'u1', type: 'admin', tenantId: 'outro-tenant' }, secret);
  const platformToken = jwt.sign({ platformUserId: 'p1', type: 'platform' }, secret);

  const baseReq = (token: string) => ({
    hostname: 'localhost',
    cookies: { digiurban_admin_token: token },
    headers: {},
    ip: '127.0.0.1',
    originalUrl: '/api/teste',
    method: 'GET',
  });

  setFlags({});
  TenantService.invalidate();
  const legacyOff = await runMiddleware(baseReq(legacyToken));
  assert(legacyOff.nextCalled, 'flag OFF: token legado sem claim passa (telemetria)');

  setFlags({ TENANT_REQUIRE_TOKEN_CLAIM: '1' });
  const legacyOn = await runMiddleware(baseReq(legacyToken));
  assert(
    !legacyOn.nextCalled && legacyOn.status === 401 && legacyOn.body?.code === 'TENANT_CLAIM_REQUIRED',
    'flag ON: token legado → 401 TENANT_CLAIM_REQUIRED',
    JSON.stringify(legacyOn.body)
  );

  const claimOk = await runMiddleware(baseReq(claimToken));
  assert(claimOk.nextCalled, 'flag ON: token com claim correto passa');

  const platformOk = await runMiddleware({
    hostname: 'localhost',
    cookies: {},
    headers: { authorization: `Bearer ${platformToken}` },
    ip: '127.0.0.1',
    originalUrl: '/api/platform/tenants',
    method: 'GET',
  });
  assert(platformOk.nextCalled, 'flag ON: token de plataforma (sem claim por design) passa');

  const mismatch = await runMiddleware(baseReq(wrongClaim));
  assert(
    !mismatch.nextCalled && mismatch.status === 401,
    'claim de outro tenant segue rejeitado (chokepoint original)'
  );

  setFlags({});
  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Erro fatal no smoke:', error);
  process.exit(1);
});
