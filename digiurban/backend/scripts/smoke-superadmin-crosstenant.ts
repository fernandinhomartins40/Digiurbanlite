/**
 * ============================================================================
 * SMOKE — SUPER_ADMIN cross-tenant (bug do login sob contexto de outro tenant)
 * ============================================================================
 * Reproduz o bug de produção: super-admin do tenant-default tentando logar/
 * operar quando o navegador está escopado a OUTRO município (cookie
 * digiurban_tenant_slug=palmital → req.tenantId = palmital).
 *
 *   1. login do super-admin com contexto de tenant B → 200 (runAsPlatform)
 *   2. adminAuthMiddleware valida o token do super-admin sob contexto de B →
 *      passa (SUPER_ADMIN isento do claim de tenant)
 *   3. um ADMIN comum de B com contexto de B → passa; sob contexto de A → 401
 *      (claim de tenant continua estrito para não-super-admin)
 *
 * Uso: DATABASE_URL=... JWT_SECRET=... npx ts-node --transpile-only scripts/smoke-superadmin-crosstenant.ts
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../src/lib/prisma';
import { runAsPlatform, DEFAULT_TENANT_ID } from '../src/lib/tenant-context';
import { tenantContextMiddleware } from '../src/middleware/tenant-context';
import { adminAuthMiddleware } from '../src/middleware/admin-auth';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-secret';

let passed = 0, failed = 0;
function assert(cond: boolean, name: string, detail?: string): void {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

async function buildApp() {
  const superAdmin = (await import('../src/routes/super-admin')).default;
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());
  app.use(tenantContextMiddleware);
  app.use('/api/super-admin', superAdmin);
  // rota protegida mínima para exercitar o adminAuthMiddleware
  app.get('/api/protected', adminAuthMiddleware, (req, res) => {
    res.json({ ok: true, role: (req as any).user?.role });
  });
  return app;
}

async function request(app: any, method: string, path: string, opts: { body?: any; cookie?: string } = {}) {
  const http = await import('http');
  const server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as any).port;
  const payload = opts.body ? JSON.stringify(opts.body) : undefined;
  return new Promise<{ status: number; body: any; setCookie: string[] }>((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, method, path,
        headers: { 'Content-Type': 'application/json', ...(opts.cookie ? { Cookie: opts.cookie } : {}), ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) } },
      (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => { server.close(); let b: any = {}; try { b = JSON.parse(d); } catch { b = d; } resolve({ status: res.statusCode || 0, body: b, setCookie: (res.headers['set-cookie'] as string[]) || [] }); }); }
    );
    req.on('error', (e) => { server.close(); reject(e); });
    if (payload) req.write(payload); req.end();
  });
}

async function main(): Promise<void> {
  const stamp = Date.now();
  const saEmail = `sa-${stamp}@smk.test`;
  const adminEmail = `adm-${stamp}@smk.test`;
  const password = 'SenhaForte@123';
  const hash = await bcrypt.hash(password, 4);

  console.log('\n[setup] tenant-default + tenant B; super-admin no default; admin comum em B');
  const { tenantB, sa, adminB } = await runAsPlatform(async () => {
    await prisma.tenant.upsert({ where: { id: DEFAULT_TENANT_ID }, update: {}, create: { id: DEFAULT_TENANT_ID, slug: 'default', nome: 'Default', cnpj: '00000000000000', nomeMunicipio: 'Default', ufMunicipio: 'SP', status: 'ACTIVE' } as any });
    const b = await prisma.tenant.create({ data: { slug: `sab${stamp}`, nome: 'Cidade B', cnpj: `${Math.floor(Math.random()*1e14)}`.padStart(14,'7'), nomeMunicipio: 'Cidade B', ufMunicipio: 'SP', status: 'ACTIVE' } as any });
    const sa = await prisma.user.create({ data: { tenantId: DEFAULT_TENANT_ID, name: 'Super', email: saEmail, password: hash, role: 'SUPER_ADMIN', isActive: true } as any });
    const adminB = await prisma.user.create({ data: { tenantId: b.id, name: 'Admin B', email: adminEmail, password: hash, role: 'ADMIN', isActive: true } as any });
    return { tenantB: b, sa, adminB };
  });

  const app = await buildApp();
  const slugCookieB = `digiurban_tenant_slug=${tenantB.slug}`;

  console.log('\n[1] login do super-admin COM contexto de B (cookie de slug de B)');
  const r1 = await request(app, 'POST', '/api/super-admin/login', { body: { email: saEmail, password }, cookie: slugCookieB });
  assert(r1.status === 200, 'super-admin loga mesmo sob contexto de outro tenant', String(r1.status));
  assert(r1.body?.user?.role === 'SUPER_ADMIN', 'retorna o super-admin correto');
  const saCookie = (r1.setCookie.find((c) => c.startsWith('digiurban_admin_token=')) || '').split(';')[0];
  assert(!!saCookie, 'cookie de sessão emitido');

  console.log('\n[2] super-admin acessa rota protegida SOB contexto de B → passa');
  const r2 = await request(app, 'GET', '/api/protected', { cookie: `${saCookie}; ${slugCookieB}` });
  assert(r2.status === 200 && r2.body?.role === 'SUPER_ADMIN', 'super-admin isento do claim de tenant', `${r2.status}`);

  console.log('\n[3] ADMIN comum de B sob contexto de B → passa; sob contexto de A(default) → 401');
  const adminTokenB = jwt.sign({ userId: adminB.id, type: 'admin', tenantId: tenantB.id, role: 'ADMIN' }, process.env.JWT_SECRET!);
  const okB = await request(app, 'GET', '/api/protected', { cookie: `digiurban_admin_token=${adminTokenB}; ${slugCookieB}` });
  assert(okB.status === 200, 'admin de B passa no contexto de B', String(okB.status));
  const crossA = await request(app, 'GET', '/api/protected', { cookie: `digiurban_admin_token=${adminTokenB}` }); // sem slug → default
  assert(crossA.status === 401, 'admin de B é bloqueado sob contexto default (claim estrito para não-super)', String(crossA.status));

  // Cleanup
  await runAsPlatform(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [sa.id, adminB.id] } } });
    await prisma.tenant.delete({ where: { id: tenantB.id } });
  });

  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Erro fatal no smoke:', e); process.exit(1); });
