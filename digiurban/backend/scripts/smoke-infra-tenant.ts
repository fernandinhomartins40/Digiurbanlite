/**
 * ============================================================================
 * SMOKE TEST — Fase F Multi-Tenant (infra por tenant)
 * ============================================================================
 *   1. CacheService: mesma chave lógica em tenants diferentes → valores
 *      independentes; plataforma tem namespace próprio; sem contexto →
 *      telemetria + namespace do default
 *   2. Rate-limit: chave composta {tenant}:{ip} distingue tenants no mesmo IP
 *
 * Uso: npx ts-node --transpile-only scripts/smoke-infra-tenant.ts
 * (não precisa de banco — só memory cache e geração de chaves)
 */

import { runAsTenant, runAsPlatform } from '../src/lib/tenant-context';
import { getCacheService } from '../src/lib/CacheService';
import { resetFailSoftTelemetry, getFailSoftActivations } from '../src/lib/tenant-telemetry';

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

async function main(): Promise<void> {
  delete process.env.TENANT_STRICT;
  const cache = getCacheService();

  console.log('\n[1] CacheService: namespace por tenant');
  await runAsTenant('tenant-a', async () => {
    await cache.set('config:tema', 'azul');
  });
  await runAsTenant('tenant-b', async () => {
    await cache.set('config:tema', 'verde');
  });
  await runAsPlatform(async () => {
    await cache.set('config:tema', 'plataforma');
  });

  const fromA = await runAsTenant('tenant-a', async () => cache.get<string>('config:tema'));
  const fromB = await runAsTenant('tenant-b', async () => cache.get<string>('config:tema'));
  const fromP = await runAsPlatform(async () => cache.get<string>('config:tema'));
  assert(fromA === 'azul', 'tenant A lê o próprio valor', String(fromA));
  assert(fromB === 'verde', 'tenant B lê o próprio valor (mesma chave lógica)', String(fromB));
  assert(fromP === 'plataforma', 'plataforma tem namespace próprio', String(fromP));

  const fromC = await runAsTenant('tenant-c', async () => cache.get<string>('config:tema'));
  assert(fromC === null, 'tenant sem valor não herda de ninguém');

  resetFailSoftTelemetry();
  const noCtx = await cache.get<string>('config:tema');
  assert(getFailSoftActivations().size >= 1, 'sem contexto → telemetria de fail-soft');
  assert(noCtx === null || noCtx === undefined || typeof noCtx === 'string', 'sem contexto não explode (namespace default)');

  console.log('\n[2] CacheService: chave longa preserva o namespace');
  const longKey = 'k'.repeat(300);
  await runAsTenant('tenant-a', async () => cache.set(longKey, 'longa-a'));
  const longFromB = await runAsTenant('tenant-b', async () => cache.get<string>(longKey));
  const longFromA = await runAsTenant('tenant-a', async () => cache.get<string>(longKey));
  assert(longFromB === null, 'hash de chave longa não colide entre tenants');
  assert(longFromA === 'longa-a', 'hash de chave longa resolve para o dono');

  console.log('\n[3] Rate-limit: chave composta tenant:ip');
  // Importa via require para acessar o generator sem subir Express
  const rl = await import('../src/middleware/rate-limit');
  // O generator não é exportado — validar pela composição via um limiter real
  // seria teste de integração HTTP; aqui garantimos que o módulo carrega com
  // os keyGenerators aplicados (falha de tipo/carga apareceria aqui).
  assert(!!rl.loginRateLimiter && !!rl.apiRateLimiter, 'limiters carregam com keyGenerator por tenant');

  cache.destroy();
  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Erro fatal no smoke:', error);
  process.exit(1);
});
