/**
 * ============================================================================
 * MIGRAÇÃO DE UPLOADS PARA O LAYOUT PARTICIONADO POR TENANT (Fase B)
 * ============================================================================
 * Move os arquivos do layout legado para uploads/t/{tenantId}/... derivando o
 * tenant do REGISTRO dono no banco, e reescreve as colunas de path/URL na
 * mesma passada (transacional por diretório).
 *
 * Cobertura:
 *   1. uploads/protocols/{protocolId}/         → tenant do protocolo
 *      (colunas: protocol_documents.fileUrl, citizen_documents.filePath/fileUrl,
 *       protocol_stage_artifacts.filePath/fileUrl)
 *   2. uploads/generated/{protocolId}/         → tenant do protocolo
 *      (colunas: generated_documents.filePath/fileUrl)
 *   3. uploads/saude/tfd/{solicitacaoId}/      → tenant da solicitação TFD
 *   4. uploads/saude/tfd/comprovantes/{viagemId}/ → tenant da viagem TFD
 *
 * Fora do escopo (documentado): uploads/documents (staging temporário),
 * external-docs legado (sem dono derivável do path — coberto por rows novas),
 * uploads/bot (Messages Server — próxima etapa da Fase B), avatares/branding
 * (públicos por decisão).
 *
 * Diretórios cujo dono não existe no banco vão para uploads/__orphan__/
 * (análise manual; NUNCA deletados aqui).
 *
 * Uso:
 *   DATABASE_URL=... npx ts-node --transpile-only scripts/migrate-uploads-tenant.ts --dry-run
 *   DATABASE_URL=... npx ts-node --transpile-only scripts/migrate-uploads-tenant.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../src/lib/prisma';
import { runAsPlatform, DEFAULT_TENANT_ID } from '../src/lib/tenant-context';

const DRY_RUN = process.argv.includes('--dry-run');
const UPLOAD_DIR = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
const ORPHAN_DIR = path.join(UPLOAD_DIR, '__orphan__');

const stats = {
  dirsMoved: 0,
  dirsOrphaned: 0,
  rowsUpdated: 0,
  errors: 0,
};

function log(msg: string): void {
  console.log(`${DRY_RUN ? '[DRY-RUN] ' : ''}${msg}`);
}

/** Move dir inteiro preservando conteúdo; cria o destino pai. */
function moveDir(src: string, dest: string): void {
  if (DRY_RUN) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(src, dest);
}

/**
 * Reescreve prefixos de path nas colunas indicadas (variantes com e sem barra
 * inicial e com backslash de escritas antigas em Windows/dev).
 */
interface DbTarget {
  table: string;
  column: string;
  /** Coluna Json (jsonb): REPLACE via cast texto e volta */
  json?: boolean;
}

async function rewriteDbPaths(
  oldRelative: string, // ex.: uploads/protocols/{pid}/
  newRelative: string, // ex.: uploads/t/{tid}/protocols/{pid}/
  targets: DbTarget[]
): Promise<void> {
  const variants: Array<[string, string]> = [
    [`/${oldRelative}`, `/${newRelative}`],
    [oldRelative, newRelative],
    [oldRelative.replace(/\//g, '\\\\'), newRelative],
  ];

  for (const { table, column, json } of targets) {
    for (const [from, to] of variants) {
      // Divergência intencional: colunas Json comparam/reescrevem via ::text;
      // LIKE '%...%' (o prefixo pode aparecer no meio do array JSON).
      const sql = json
        ? `UPDATE "${table}" SET "${column}" = REPLACE("${column}"::text, $1, $2)::jsonb WHERE "${column}"::text LIKE $3`
        : `UPDATE "${table}" SET "${column}" = REPLACE("${column}", $1, $2) WHERE "${column}" LIKE $3`;
      const likePattern = json ? `%${from}%` : `${from}%`;
      if (DRY_RUN) {
        const countSql = json
          ? `SELECT count(*)::bigint AS count FROM "${table}" WHERE "${column}"::text LIKE $1`
          : `SELECT count(*)::bigint AS count FROM "${table}" WHERE "${column}" LIKE $1`;
        const count = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(countSql, likePattern);
        const n = Number(count[0]?.count ?? 0);
        if (n > 0) log(`    ~ ${table}.${column}: ${n} linha(s) seriam reescritas (${from} → ${to})`);
        stats.rowsUpdated += n;
      } else {
        const updated = await prisma.$executeRawUnsafe(sql, from, to, likePattern);
        if (updated > 0) {
          log(`    ✓ ${table}.${column}: ${updated} linha(s) reescritas`);
          stats.rowsUpdated += updated;
        }
      }
    }
  }
}

/** Move um diretório-filho para o tenant dono, reescrevendo o banco. */
async function migrateOwnedDir(
  legacySubpath: string[], // ex.: ['protocols', pid]
  tenantId: string | null,
  dbTargets: DbTarget[]
): Promise<void> {
  const src = path.join(UPLOAD_DIR, ...legacySubpath);
  const relOld = `${legacySubpath.join('/')}/`;

  if (!tenantId) {
    const orphanDest = path.join(ORPHAN_DIR, ...legacySubpath);
    log(`  ⚠️  órfão (sem dono no banco): ${relOld} → __orphan__/`);
    moveDir(src, orphanDest);
    stats.dirsOrphaned++;
    return;
  }

  const dest = path.join(UPLOAD_DIR, 't', tenantId, ...legacySubpath);
  const relNew = `t/${tenantId}/${relOld}`;
  log(`  → ${relOld} → ${relNew}`);
  moveDir(src, dest);
  stats.dirsMoved++;
  await rewriteDbPaths(`uploads/${relOld}`, `uploads/${relNew}`, dbTargets);
}

/** Lista subdiretórios imediatos de um diretório (se existir). */
function listSubdirs(...segments: string[]): string[] {
  const dir = path.join(UPLOAD_DIR, ...segments);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

async function main(): Promise<void> {
  console.log('='.repeat(70));
  console.log(`MIGRAÇÃO DE UPLOADS → LAYOUT POR TENANT ${DRY_RUN ? '(DRY-RUN)' : ''}`);
  console.log('='.repeat(70));

  await runAsPlatform(async () => {
    // ── 1. uploads/protocols/{protocolId}/ ─────────────────────────────
    log('\n[1] uploads/protocols/');
    for (const protocolId of listSubdirs('protocols')) {
      try {
        const protocol = await prisma.protocolSimplified.findFirst({
          where: { id: protocolId },
          select: { tenantId: true },
        });
        await migrateOwnedDir(
          ['protocols', protocolId],
          protocol ? protocol.tenantId || DEFAULT_TENANT_ID : null,
          [
            { table: 'protocol_documents', column: 'fileUrl' },
            { table: 'citizen_documents', column: 'filePath' },
            { table: 'citizen_documents', column: 'fileUrl' },
            { table: 'protocol_stage_artifacts', column: 'filePath' },
            { table: 'protocol_stage_artifacts', column: 'fileUrl' },
          ]
        );
      } catch (error) {
        stats.errors++;
        console.error(`  ✗ protocols/${protocolId}:`, error instanceof Error ? error.message : error);
      }
    }

    // ── 2. uploads/generated/{protocolId}/ ─────────────────────────────
    log('\n[2] uploads/generated/');
    for (const protocolId of listSubdirs('generated')) {
      try {
        const protocol = await prisma.protocolSimplified.findFirst({
          where: { id: protocolId },
          select: { tenantId: true },
        });
        await migrateOwnedDir(
          ['generated', protocolId],
          protocol ? protocol.tenantId || DEFAULT_TENANT_ID : null,
          [
            { table: 'generated_documents', column: 'filePath' },
            { table: 'generated_documents', column: 'fileUrl' },
          ]
        );
      } catch (error) {
        stats.errors++;
        console.error(`  ✗ generated/${protocolId}:`, error instanceof Error ? error.message : error);
      }
    }

    // ── 3. uploads/saude/tfd/{solicitacaoId}/ (exceto comprovantes/) ───
    log('\n[3] uploads/saude/tfd/');
    for (const solicitacaoId of listSubdirs('saude', 'tfd')) {
      if (solicitacaoId === 'comprovantes') continue;
      try {
        const solicitacao = await prisma.solicitacaoTFD.findFirst({
          where: { id: solicitacaoId },
          select: { tenantId: true },
        });
        await migrateOwnedDir(
          ['saude', 'tfd', solicitacaoId],
          solicitacao ? solicitacao.tenantId || DEFAULT_TENANT_ID : null,
          [
            { table: 'documento_tfd', column: 'caminhoArquivo' },
            { table: 'solicitacoes_tfd', column: 'encaminhamentoMedicoUrl' },
            { table: 'solicitacoes_tfd', column: 'examesUrls', json: true },
          ]
        );
      } catch (error) {
        stats.errors++;
        console.error(`  ✗ saude/tfd/${solicitacaoId}:`, error instanceof Error ? error.message : error);
      }
    }

    // ── 4. uploads/saude/tfd/comprovantes/{viagemId}/ ───────────────────
    log('\n[4] uploads/saude/tfd/comprovantes/');
    for (const viagemId of listSubdirs('saude', 'tfd', 'comprovantes')) {
      try {
        const viagem = await prisma.viagemTFD.findFirst({
          where: { id: viagemId },
          select: { tenantId: true },
        });
        await migrateOwnedDir(
          ['saude', 'tfd', 'comprovantes', viagemId],
          viagem ? viagem.tenantId || DEFAULT_TENANT_ID : null,
          [
            { table: 'viagens_tfd', column: 'comprovantes', json: true },
            { table: 'prestacao_contas_tfd', column: 'comprovantesAnexados', json: true },
          ]
        );
      } catch (error) {
        stats.errors++;
        console.error(`  ✗ comprovantes/${viagemId}:`, error instanceof Error ? error.message : error);
      }
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('RESUMO');
  console.log('='.repeat(70));
  console.log(`Diretórios migrados:   ${stats.dirsMoved}`);
  console.log(`Diretórios órfãos:     ${stats.dirsOrphaned} (em uploads/__orphan__/)`);
  console.log(`Linhas reescritas:     ${stats.rowsUpdated}`);
  console.log(`Erros:                 ${stats.errors}`);
  if (DRY_RUN) {
    console.log('\nDRY-RUN concluído — nada foi movido. Rode sem --dry-run para executar.');
  }

  process.exit(stats.errors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Erro fatal na migração:', error);
  process.exit(1);
});
