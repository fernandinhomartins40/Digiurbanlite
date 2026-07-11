/**
 * ============================================================================
 * CLEANUP ORPHAN FILES JOB - FASE 4
 * ============================================================================
 *
 * Job semanal para limpar arquivos órfãos (arquivos no disco sem registro no banco)
 *
 * Executa:
 * - Scan de todos os arquivos em /uploads/protocols
 * - Verifica se existe registro no banco
 * - Deleta arquivos sem registro (órfãos)
 * - Deleta diretórios vazios
 *
 * 🛡️ PROTEÇÃO DE PRESERVAÇÃO MUNICIPAL:
 * - NUNCA deleta arquivos de protocolos com documentos registrados no banco
 * - NUNCA deleta arquivos de protocolos CONCLUÍDOS, CANCELADOS ou qualquer outro status
 * - Documentos são patrimônio público e devem ser preservados permanentemente
 * - Apenas deleta arquivos órfãos sem nenhum vínculo no banco de dados
 *
 * USO:
 *   node -r ts-node/register src/jobs/cleanup-orphan-files.job.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { runAsPlatform } from '../lib/tenant-context';

const prisma = new PrismaClient();

// Parse argumentos
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'protocols');

interface CleanupStats {
  totalFiles: number;
  orphanFiles: number;
  filesDeleted: number;
  emptyDirsDeleted: number;
  errors: number;
  spaceSaved: number; // bytes
}

const stats: CleanupStats = {
  totalFiles: 0,
  orphanFiles: 0,
  filesDeleted: 0,
  emptyDirsDeleted: 0,
  errors: 0,
  spaceSaved: 0
};

/**
 * Verifica se arquivo existe no banco de dados
 */
async function fileExistsInDatabase(
  protocolId: string,
  filename: string
): Promise<boolean> {
  const fileUrl = `/uploads/protocols/${protocolId}/${filename}`;

  const doc = await prisma.protocolDocument.findFirst({
    where: { fileUrl },
    select: { id: true }
  });

  return doc !== null;
}

/**
 * Verifica se protocolo existe E se tem documentos associados
 * ⚠️ CRÍTICO: NUNCA deletar arquivos de protocolos com documentos registrados,
 * independente do status (CONCLUIDO, CANCELADO, etc)
 */
async function protocolExists(protocolId: string): Promise<boolean> {
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: { id: true }
  });

  return protocol !== null;
}

/**
 * Verifica se protocolo tem documentos registrados no banco
 * Se tiver documentos, NUNCA deletar arquivos (preservação municipal)
 */
async function protocolHasDocuments(protocolId: string): Promise<boolean> {
  const count = await prisma.protocolDocument.count({
    where: { protocolId }
  });

  return count > 0;
}

/**
 * Processa arquivos de um protocolo
 */
async function processProtocolDirectory(protocolId: string): Promise<void> {
  const protocolDir = path.join(UPLOAD_DIR, protocolId);

  if (!fs.existsSync(protocolDir)) {
    return;
  }

  // ⚠️ CRÍTICO: Verificar se protocolo existe
  const protocolExistsFlag = await protocolExists(protocolId);

  // 🛡️ PROTEÇÃO: Verificar se tem documentos registrados
  const hasDocuments = await protocolHasDocuments(protocolId);

  if (!protocolExistsFlag) {
    console.log(`   ⚠️  Protocolo ${protocolId.substring(0, 8)}... não existe no banco`);

    // 🛡️ PRESERVAÇÃO MUNICIPAL: NUNCA deletar se tiver documentos
    if (hasDocuments) {
      console.log(`      🛡️  PROTEGIDO: Protocolo tem ${await prisma.protocolDocument.count({ where: { protocolId } })} documento(s) registrado(s)`);
      console.log(`      📁 Arquivos preservados para fins de auditoria e compliance`);
      console.log(`      ⚠️  Protocolo pode ter sido deletado incorretamente - verificar!`);
      return;
    }

    console.log(`      Deletando diretório completo: ${protocolDir}`);

    if (!DRY_RUN) {
      try {
        const files = fs.readdirSync(protocolDir);
        let dirSize = 0;

        for (const file of files) {
          const filePath = path.join(protocolDir, file);
          const stat = fs.statSync(filePath);
          dirSize += stat.size;
          fs.unlinkSync(filePath);
          stats.filesDeleted++;
        }

        fs.rmdirSync(protocolDir);
        stats.emptyDirsDeleted++;
        stats.spaceSaved += dirSize;

        console.log(`      ✓ Deletados ${files.length} arquivos (${(dirSize / 1024 / 1024).toFixed(2)} MB)`);
      } catch (error) {
        console.error(`      ❌ Erro ao deletar diretório: ${error}`);
        stats.errors++;
      }
    } else {
      const files = fs.readdirSync(protocolDir);
      let dirSize = 0;
      for (const file of files) {
        const stat = fs.statSync(path.join(protocolDir, file));
        dirSize += stat.size;
      }
      stats.filesDeleted += files.length;
      stats.emptyDirsDeleted++;
      stats.spaceSaved += dirSize;
      console.log(`      [DRY RUN] Deletaria ${files.length} arquivos (${(dirSize / 1024 / 1024).toFixed(2)} MB)`);
    }
    return;
  }

  // Processar arquivos individuais
  const files = fs.readdirSync(protocolDir);

  for (const filename of files) {
    stats.totalFiles++;

    const filePath = path.join(protocolDir, filename);
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      continue;
    }

    // Verificar se arquivo existe no banco
    const existsInDb = await fileExistsInDatabase(protocolId, filename);

    if (!existsInDb) {
      console.log(`   🗑️  Arquivo órfão: ${filename}`);
      console.log(`      Protocolo: ${protocolId.substring(0, 8)}...`);
      console.log(`      Tamanho: ${(stat.size / 1024).toFixed(2)} KB`);

      stats.orphanFiles++;

      if (!DRY_RUN) {
        try {
          fs.unlinkSync(filePath);
          stats.filesDeleted++;
          stats.spaceSaved += stat.size;
          console.log(`      ✓ Deletado`);
        } catch (error) {
          console.error(`      ❌ Erro ao deletar: ${error}`);
          stats.errors++;
        }
      } else {
        stats.filesDeleted++;
        stats.spaceSaved += stat.size;
        console.log(`      [DRY RUN] Seria deletado`);
      }
    }
  }

  // Verificar se diretório ficou vazio
  if (!DRY_RUN) {
    const remainingFiles = fs.readdirSync(protocolDir);
    if (remainingFiles.length === 0) {
      try {
        fs.rmdirSync(protocolDir);
        stats.emptyDirsDeleted++;
        console.log(`   📁 Diretório vazio deletado: ${protocolId.substring(0, 8)}...`);
      } catch (error) {
        console.error(`   ❌ Erro ao deletar diretório vazio: ${error}`);
      }
    }
  }
}

/**
 * Função principal de cleanup
 */
async function cleanupOrphanFiles() {
  console.log('🧹 CLEANUP DE ARQUIVOS ÓRFÃOS - FASE 4');
  console.log('='.repeat(60));
  console.log(`Modo: ${DRY_RUN ? 'DRY RUN (simulação)' : 'PRODUÇÃO (real)'}`);
  console.log(`Diretório: ${UPLOAD_DIR}`);
  console.log('='.repeat(60));
  console.log('');

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN: Nenhum arquivo será deletado');
    console.log('');
  }

  // Verificar se diretório existe
  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log('⚠️  Diretório de uploads não encontrado. Nada a fazer.');
    return;
  }

  // Listar protocolos
  console.log('📂 Escaneando diretórios de protocolos...');
  const protocolDirs = fs.readdirSync(UPLOAD_DIR);
  console.log(`   Total de diretórios: ${protocolDirs.length}`);
  console.log('');

  // Processar cada protocolo
  console.log('🔄 Processando arquivos...');
  console.log('');

  for (let i = 0; i < protocolDirs.length; i++) {
    const protocolId = protocolDirs[i];
    const protocolDir = path.join(UPLOAD_DIR, protocolId);

    if (!fs.statSync(protocolDir).isDirectory()) {
      continue;
    }

    console.log(`[${i + 1}/${protocolDirs.length}] Protocolo ${protocolId.substring(0, 12)}...`);
    await processProtocolDirectory(protocolId);
    console.log('');
  }

  // Relatório final
  console.log('='.repeat(60));
  console.log('📊 ESTATÍSTICAS DE CLEANUP');
  console.log('='.repeat(60));
  console.log(`Total de arquivos escaneados:  ${stats.totalFiles}`);
  console.log(`Arquivos órfãos encontrados:   ${stats.orphanFiles}`);
  console.log(`Arquivos deletados:            ${stats.filesDeleted}`);
  console.log(`Diretórios vazios deletados:   ${stats.emptyDirsDeleted}`);
  console.log(`Erros:                         ${stats.errors}`);
  console.log(`Espaço liberado:               ${(stats.spaceSaved / 1024 / 1024).toFixed(2)} MB`);
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('');
    console.log('✅ DRY RUN concluído!');
    console.log('   Para executar o cleanup real, rode sem --dry-run');
  } else {
    console.log('');
    console.log('✅ Cleanup concluído!');

    if (stats.errors > 0) {
      console.log('⚠️  Alguns arquivos tiveram erros. Verifique os logs acima.');
    }
  }
}

/**
 * Configurar cron job (se usando node-cron)
 */
export function scheduleCleanupJob() {
  // Exemplo com node-cron:
  // cron.schedule('0 3 * * 0', async () => { // Todo domingo às 3h da manhã
  //   await cleanupOrphanFiles();
  // });
}

// Se executado diretamente via CLI
// Fase A Multi-Tenant: runAsPlatform explícito — este job DELETA arquivos cujo
// registro não é encontrado no banco. Ele usa um PrismaClient próprio (sem a
// extension), mas o contexto de plataforma garante que uma futura migração
// para o prisma compartilhado jamais rode escopada a um tenant (o fail-soft
// esconderia os registros dos demais municípios e seus arquivos seriam
// apagados como "órfãos").
if (require.main === module) {
  runAsPlatform(() => cleanupOrphanFiles())
    .then(() => {
      console.log('');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal no cleanup:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { cleanupOrphanFiles };
