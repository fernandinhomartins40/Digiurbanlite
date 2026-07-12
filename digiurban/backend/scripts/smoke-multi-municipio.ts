/**
 * ============================================================================
 * SMOKE TEST — Login multi-município do cidadão (subdomínios white-label)
 * ============================================================================
 * Exercita as rotas HTTP reais com um mesmo CPF cadastrado em 2 municípios:
 *   1. login no subdomínio A → sessão de A (município fixo pelo host)
 *   2. login no domínio raiz → 409 MUNICIPIO_SELECTION_REQUIRED (lista os 2)
 *   3. login no subdomínio B → sessão de B
 *   4. login no subdomínio A com CPF só cadastrado em B → 401 NO_LINK_IN_TENANT
 *   5. GET /municipios (autenticado) → lista os 2, marca o atual
 *   6. POST /switch-municipio → re-emite sessão do outro município
 *
 * Uso: DATABASE_URL=... JWT_SECRET=... npx ts-node --transpile-only scripts/smoke-multi-municipio.ts
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { runAsPlatform } from '../src/lib/tenant-context';
import { tenantContextMiddleware } from '../src/middleware/tenant-context';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-secret';
process.env.TENANT_BASE_DOMAIN = 'digiurban.test';

let passed = 0, failed = 0;
function assert(cond: boolean, name: string, detail?: string): void {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

// Mini-app só com o necessário para exercitar citizen-auth
async function buildApp() {
  const citizenAuth = (await import('../src/routes/citizen-auth')).default;
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());
  app.use(tenantContextMiddleware);
  app.use('/api/citizen/auth', citizenAuth);
  return app;
}

// Cliente HTTP mínimo com suporte a Host header e cookies
async function request(
  app: any,
  method: string,
  path: string,
  opts: { host?: string; body?: any; cookie?: string } = {}
): Promise<{ status: number; body: any; setCookie: string[] }> {
  const http = await import('http');
  const server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as any).port;
  const payload = opts.body ? JSON.stringify(opts.body) : undefined;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1', port, method, path,
        headers: {
          'Content-Type': 'application/json',
          ...(opts.host ? { 'x-forwarded-host': opts.host, Host: opts.host } : {}),
          ...(opts.cookie ? { Cookie: opts.cookie } : {}),
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          server.close();
          let body: any = {};
          try { body = JSON.parse(data); } catch { body = data; }
          resolve({ status: res.statusCode || 0, body, setCookie: (res.headers['set-cookie'] as string[]) || [] });
        });
      }
    );
    req.on('error', (e) => { server.close(); reject(e); });
    if (payload) req.write(payload);
    req.end();
  });
}

function cookieFrom(setCookie: string[]): string {
  const c = setCookie.find((s) => s.startsWith('digiurban_citizen_token='));
  return c ? c.split(';')[0] : '';
}

async function main(): Promise<void> {
  const stamp = Date.now();
  const cpf = `${stamp}`.slice(-11).padStart(11, '9');
  const cpfOnlyB = `${stamp + 1}`.slice(-11).padStart(11, '8');
  const password = 'SenhaForte@123';
  const hash = await bcrypt.hash(password, 4);

  console.log('\n[setup] 2 municípios (slug A e B) + mesmo CPF nos dois');
  const { tenantA, tenantB } = await runAsPlatform(async () => {
    const mk = (slug: string, nome: string, uf: string) =>
      prisma.tenant.create({ data: { slug, nome, cnpj: `${Math.floor(Math.random() * 1e14)}`.padStart(14, '7'), nomeMunicipio: nome, ufMunicipio: uf, status: 'ACTIVE' } as any });
    const a = await mk(`smka${stamp}`, 'São Carlos Smoke', 'SP');
    const b = await mk(`smkb${stamp}`, 'Ribeirão Smoke', 'SP');
    const mkCitizen = (tenantId: string, c: string) =>
      prisma.citizen.create({ data: { tenantId, cpf: c, name: 'Cidadão Multi', email: `multi-${tenantId}@smk.test`, password: hash, isActive: true, verificationStatus: 'PENDING' } as any });
    await mkCitizen(a.id, cpf);
    await mkCitizen(b.id, cpf);
    await mkCitizen(b.id, cpfOnlyB); // CPF só em B
    return { tenantA: a, tenantB: b };
  });

  const app = await buildApp();
  const hostA = `${tenantA.slug}.digiurban.test`;
  const hostB = `${tenantB.slug}.digiurban.test`;

  console.log('\n[1] login no subdomínio A → sessão de A');
  const r1 = await request(app, 'POST', '/api/citizen/auth/login', { host: hostA, body: { login: cpf, password } });
  assert(r1.status === 200, 'login 200 no subdomínio A', String(r1.status));
  assert(r1.body?.tenantId === tenantA.id, 'sessão carimbada com o tenant A');
  assert(!!cookieFrom(r1.setCookie), 'cookie de sessão emitido');
  assert(!r1.setCookie.some((c) => c.includes('Domain=')), 'cookie SEM Domain (preso ao host)');

  console.log('\n[2] login no domínio raiz → 409 pede escolha');
  const r2 = await request(app, 'POST', '/api/citizen/auth/login', { host: 'www.digiurban.test', body: { login: cpf, password } });
  assert(r2.status === 409 && r2.body?.code === 'MUNICIPIO_SELECTION_REQUIRED', '409 seleção obrigatória', `${r2.status}/${r2.body?.code}`);
  assert(Array.isArray(r2.body?.municipios) && r2.body.municipios.length === 2, 'lista os 2 municípios do CPF', String(r2.body?.municipios?.length));

  console.log('\n[3] login no subdomínio B → sessão de B');
  const r3 = await request(app, 'POST', '/api/citizen/auth/login', { host: hostB, body: { login: cpf, password } });
  assert(r3.status === 200 && r3.body?.tenantId === tenantB.id, 'login em B → sessão de B');

  console.log('\n[4] login no subdomínio A com CPF só cadastrado em B → 401');
  const r4 = await request(app, 'POST', '/api/citizen/auth/login', { host: hostA, body: { login: cpfOnlyB, password } });
  assert(r4.status === 401 && r4.body?.code === 'NO_LINK_IN_TENANT', 'sem cadastro no município → 401', `${r4.status}/${r4.body?.code}`);

  console.log('\n[5] GET /municipios (autenticado em A) lista os 2 e marca o atual');
  const sessionA = cookieFrom(r1.setCookie);
  const r5 = await request(app, 'GET', '/api/citizen/auth/municipios', { host: hostA, cookie: sessionA });
  assert(r5.status === 200 && r5.body?.municipios?.length === 2, 'lista os 2 municípios do CPF logado', String(r5.body?.municipios?.length));
  assert(r5.body.municipios.find((m: any) => m.tenantId === tenantA.id)?.current === true, 'município atual marcado (A)');

  console.log('\n[6] switch para B re-emite sessão sem senha');
  const r6 = await request(app, 'POST', '/api/citizen/auth/switch-municipio', { host: hostA, cookie: sessionA, body: { tenantId: tenantB.id } });
  assert(r6.status === 200 && r6.body?.tenantId === tenantB.id, 'switch para B ok', `${r6.status}/${r6.body?.tenantId}`);
  assert(!!cookieFrom(r6.setCookie), 'nova sessão emitida no switch');

  console.log('\n[7] switch para município sem vínculo → 403');
  const other = await runAsPlatform(async () => prisma.tenant.create({ data: { slug: `smkc${stamp}`, nome: 'Outro', cnpj: `${Math.floor(Math.random() * 1e14)}`.padStart(14, '6'), nomeMunicipio: 'Outro', ufMunicipio: 'RJ', status: 'ACTIVE' } as any }));
  const r7 = await request(app, 'POST', '/api/citizen/auth/switch-municipio', { host: hostA, cookie: sessionA, body: { tenantId: other.id } });
  assert(r7.status === 403 && r7.body?.code === 'NO_LINK_IN_TENANT', 'switch sem vínculo → 403', `${r7.status}/${r7.body?.code}`);

  // Cleanup
  await runAsPlatform(async () => {
    for (const t of [tenantA.id, tenantB.id, other.id]) {
      await prisma.citizen.deleteMany({ where: { tenantId: t } });
      await prisma.tenant.delete({ where: { id: t } });
    }
  });

  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Erro fatal no smoke:', e); process.exit(1); });
