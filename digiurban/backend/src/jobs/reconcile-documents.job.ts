/**
 * ============================================================================
 * RECONCILE DOCUMENTS JOB - FASE 2
 * ============================================================================
 *
 * Job diário para reconciliar documentos com estados inconsistentes
 *
 * Executa:
 * - Validação de integridade de todos os documentos
 * - Correção automática de inconsistências conhecidas
 * - Relatório de documentos problemáticos
 *
 * USO:
 *   node -r ts-node/register src/jobs/reconcile-documents.job.ts
 */

import {
  validateDocumentIntegrity,
  reconcileDocument,
  auditAllDocuments
} from '../services/document-integrity.service';
import { runAsPlatform } from '../lib/tenant-context';

// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

interface ReconciliationReport {
  timestamp: Date;
  totalDocuments: number;
  validDocuments: number;
  invalidDocuments: number;
  reconciledDocuments: number;
  failedReconciliations: number;
  actions: {
    documentId: string;
    documentType: string;
    protocolId: string;
    action: string;
    success: boolean;
  }[];
}

/**
 * Executa job de reconciliação
 */
async function reconcileDocumentsJob(): Promise<ReconciliationReport> {
  console.log('🔄 JOB: Reconciliação de Documentos');
  console.log('='.repeat(60));
  console.log(`Iniciado em: ${new Date().toISOString()}`);
  console.log('');

  // 1. Auditoria global
  console.log('📊 Executando auditoria global...');
  const audit = await auditAllDocuments();

  console.log(`   Total de documentos: ${audit.totalDocuments}`);
  console.log(`   Válidos: ${audit.validDocuments}`);
  console.log(`   Inválidos: ${audit.invalidDocuments}`);
  console.log(`   Banco sem arquivo: ${audit.dbWithoutFiles}`);
  console.log('');

  if (audit.invalidDocuments === 0) {
    console.log('✅ Todos os documentos estão íntegros. Nenhuma reconciliação necessária.');
    return {
      timestamp: new Date(),
      totalDocuments: audit.totalDocuments,
      validDocuments: audit.validDocuments,
      invalidDocuments: 0,
      reconciledDocuments: 0,
      failedReconciliations: 0,
      actions: []
    };
  }

  // 2. Reconciliar documentos inválidos
  console.log(`🔧 Reconciliando ${audit.invalidDocuments} documentos inválidos...`);
  console.log('');

  const report: ReconciliationReport = {
    timestamp: new Date(),
    totalDocuments: audit.totalDocuments,
    validDocuments: audit.validDocuments,
    invalidDocuments: audit.invalidDocuments,
    reconciledDocuments: 0,
    failedReconciliations: 0,
    actions: []
  };

  for (const invalidDoc of audit.invalidDetails) {
    try {
      console.log(`   📄 ${invalidDoc.documentType} (${invalidDoc.documentId.substring(0, 8)}...)`);
      console.log(`      Protocolo: ${invalidDoc.protocolId.substring(0, 8)}...`);
      console.log(`      Problema: ${invalidDoc.reason}`);

      const result = await reconcileDocument(invalidDoc.documentId);

      if (result.fixed) {
        console.log(`      ✅ Reconciliado: ${result.action}`);
        report.reconciledDocuments++;
      } else {
        console.log(`      ⚠️  Não reconciliado: ${result.action}`);
        report.failedReconciliations++;
      }

      report.actions.push({
        documentId: invalidDoc.documentId,
        documentType: invalidDoc.documentType,
        protocolId: invalidDoc.protocolId,
        action: result.action,
        success: result.fixed
      });

      console.log('');
    } catch (error) {
      console.error(`      ❌ Erro ao reconciliar: ${error}`);
      report.failedReconciliations++;
      report.actions.push({
        documentId: invalidDoc.documentId,
        documentType: invalidDoc.documentType,
        protocolId: invalidDoc.protocolId,
        action: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`,
        success: false
      });
    }
  }

  // 3. Relatório final
  console.log('='.repeat(60));
  console.log('📈 RELATÓRIO DE RECONCILIAÇÃO');
  console.log('='.repeat(60));
  console.log(`Total de documentos:       ${report.totalDocuments}`);
  console.log(`Documentos inválidos:      ${report.invalidDocuments}`);
  console.log(`Reconciliados com sucesso: ${report.reconciledDocuments}`);
  console.log(`Falhas na reconciliação:   ${report.failedReconciliations}`);
  console.log('='.repeat(60));

  // 4. Salvar relatório no banco (opcional - criar tabela JobLog)
  // await prisma.jobLog.create({ ... })

  return report;
}

/**
 * Configurar cron job (se usando node-cron ou similar)
 */
export function scheduleReconciliationJob() {
  // Exemplo com node-cron:
  // cron.schedule('0 2 * * *', async () => { // Todo dia às 2h da manhã
  //   await reconcileDocumentsJob();
  // });
}

// Se executado diretamente via CLI
// Fase A Multi-Tenant: runAsPlatform — integridade de documentos é manutenção
// GLOBAL (document-integrity.service usa o prisma compartilhado; sem contexto,
// o fail-soft limitaria a auditoria ao tenant default e docs dos demais
// municípios ficariam invisíveis ao job).
if (require.main === module) {
  runAsPlatform(() => reconcileDocumentsJob())
    .then((report) => {
      console.log('');
      console.log('✅ Job concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal no job:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { reconcileDocumentsJob };
