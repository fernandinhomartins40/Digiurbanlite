/**
 * ============================================================================
 * SMOKE TEST — Fase B Multi-Tenant (isolamento de uploads)
 * ============================================================================
 * Valida em banco real + filesystem temporário (UPLOAD_BASE_PATH):
 *   1. getProtocolFilePath: layout novo, fallback legado, canônico quando ausente
 *   2. migrate-uploads-tenant.ts: move dirs para t/{tenantId}/, órfão para
 *      __orphan__/, reescreve fileUrl no banco
 *
 * Uso:
 *   DATABASE_URL=... UPLOAD_BASE_PATH=<tmp> npx ts-node --transpile-only \
 *     scripts/smoke-uploads-tenant.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { prisma } from '../src/lib/prisma';
import { runAsTenant, runAsPlatform } from '../src/lib/tenant-context';
import { getProtocolFilePath, getProtocolFileUrl } from '../src/config/upload';

const UPLOAD_DIR = process.env.UPLOAD_BASE_PATH || '';
if (!UPLOAD_DIR) {
  console.error('Defina UPLOAD_BASE_PATH para um diretório temporário.');
  process.exit(1);
}

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

async function seedTenantWorld(slug: string, stamp: number) {
  return runAsPlatform(async () => {
    const tenant = await prisma.tenant.create({
      data: {
        slug, nome: `Smoke Uploads ${slug}`, cnpj: `${Math.floor(Math.random() * 1e14)}`.padStart(14, '9'),
        nomeMunicipio: slug, ufMunicipio: 'SP', status: 'ACTIVE',
      } as any,
    });
    return runAsTenant(tenant.id, async () => {
      const dept = await prisma.department.create({
        data: { name: `Secretaria ${slug} ${stamp}` },
      });
      const service = await prisma.serviceSimplified.create({
        data: { name: `Serviço ${slug} ${stamp}`, departmentId: dept.id, serviceType: 'SEM_DADOS' as any },
      });
      const citizen = await prisma.citizen.create({
        data: {
          cpf: `${Math.floor(Math.random() * 1e11)}`.padStart(11, '7'),
          name: `Cidadão ${slug}`, email: `${slug}-${stamp}@smoke.test`, password: 'x',
        },
      });
      const protocol = await prisma.protocolSimplified.create({
        data: {
          number: `SMK-${slug}-${stamp}`, title: 'Smoke', citizenId: citizen.id,
          serviceId: service.id, departmentId: dept.id,
        },
      });
      const doc = await prisma.protocolDocument.create({
        data: {
          protocolId: protocol.id, documentType: 'ANEXO', isRequired: false,
          fileUrl: `/uploads/protocols/${protocol.id}/doc.pdf`,
          fileName: 'doc.pdf',
        } as any,
      });
      return { tenant, protocol, doc };
    });
  });
}

async function main(): Promise<void> {
  const stamp = Date.now();
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  console.log('\n[setup] 2 tenants com protocolo + documento, arquivos no layout legado');
  const A = await seedTenantWorld(`smk-up-a-${stamp}`, stamp);
  const B = await seedTenantWorld(`smk-up-b-${stamp}`, stamp);

  for (const w of [A, B]) {
    const dir = path.join(UPLOAD_DIR, 'protocols', w.protocol.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'doc.pdf'), `conteudo-${w.tenant.slug}`);
  }
  // Órfão: diretório sem protocolo correspondente
  const orphanDir = path.join(UPLOAD_DIR, 'protocols', 'protocolo-inexistente');
  fs.mkdirSync(orphanDir, { recursive: true });
  fs.writeFileSync(path.join(orphanDir, 'orfao.pdf'), 'orfao');

  console.log('\n[1] getProtocolFilePath: fallback legado antes da migração');
  const legacyResolved = await runAsTenant(A.tenant.id, async () =>
    getProtocolFilePath(A.protocol.id, 'doc.pdf')
  );
  assert(
    legacyResolved === path.join(UPLOAD_DIR, 'protocols', A.protocol.id, 'doc.pdf'),
    'resolve para o layout legado quando o novo não existe',
    legacyResolved
  );

  console.log('\n[2] executando migrate-uploads-tenant.ts (real)');
  execFileSync(
    'npx',
    ['ts-node', '--transpile-only', 'scripts/migrate-uploads-tenant.ts'],
    { env: { ...process.env }, stdio: 'pipe', shell: process.platform === 'win32' }
  );

  console.log('\n[3] arquivos movidos para t/{tenantId}/ e órfão isolado');
  for (const w of [A, B]) {
    const newPath = path.join(UPLOAD_DIR, 't', w.tenant.id, 'protocols', w.protocol.id, 'doc.pdf');
    const oldPath = path.join(UPLOAD_DIR, 'protocols', w.protocol.id, 'doc.pdf');
    assert(fs.existsSync(newPath), `${w.tenant.slug}: arquivo no layout novo`);
    assert(!fs.existsSync(oldPath), `${w.tenant.slug}: layout legado esvaziado`);
    if (fs.existsSync(newPath)) {
      assert(
        fs.readFileSync(newPath, 'utf8') === `conteudo-${w.tenant.slug}`,
        `${w.tenant.slug}: conteúdo preservado`
      );
    }
  }
  assert(
    fs.existsSync(path.join(UPLOAD_DIR, '__orphan__', 'protocols', 'protocolo-inexistente', 'orfao.pdf')),
    'órfão movido para __orphan__/ (não deletado)'
  );

  console.log('\n[4] URLs reescritas no banco');
  for (const w of [A, B]) {
    const doc = await runAsPlatform(async () =>
      prisma.protocolDocument.findFirst({ where: { id: w.doc.id }, select: { fileUrl: true } })
    );
    assert(
      doc?.fileUrl === `/uploads/t/${w.tenant.id}/protocols/${w.protocol.id}/doc.pdf`,
      `${w.tenant.slug}: fileUrl reescrita`,
      doc?.fileUrl || 'null'
    );
  }

  console.log('\n[5] getProtocolFilePath resolve o layout novo pós-migração');
  const newResolved = await runAsTenant(A.tenant.id, async () =>
    getProtocolFilePath(A.protocol.id, 'doc.pdf')
  );
  assert(
    newResolved === path.join(UPLOAD_DIR, 't', A.tenant.id, 'protocols', A.protocol.id, 'doc.pdf'),
    'resolve para o layout particionado',
    newResolved
  );
  const urlNow = await runAsTenant(A.tenant.id, async () =>
    getProtocolFileUrl(A.protocol.id, 'novo.pdf')
  );
  assert(
    urlNow === `/uploads/t/${A.tenant.id}/protocols/${A.protocol.id}/novo.pdf`,
    'novas URLs nascem particionadas',
    urlNow
  );

  // Cleanup banco (arquivos ficam no tmp da sessão)
  await runAsPlatform(async () => {
    for (const w of [A, B]) {
      await prisma.protocolDocument.deleteMany({ where: { protocolId: w.protocol.id } });
      await prisma.protocolSimplified.deleteMany({ where: { id: w.protocol.id } });
      await prisma.citizen.deleteMany({ where: { tenantId: w.tenant.id } });
      await prisma.serviceSimplified.deleteMany({ where: { tenantId: w.tenant.id } });
      await prisma.department.deleteMany({ where: { tenantId: w.tenant.id } });
      await prisma.tenant.delete({ where: { id: w.tenant.id } });
    }
  });

  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Erro fatal no smoke:', error);
  process.exit(1);
});
