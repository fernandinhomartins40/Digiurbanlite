/**
 * ============================================================================
 * AUDITORIA DE ARQUIVOS FALTANTES
 * ============================================================================
 *
 * Script para auditar documentos que têm registro no banco mas arquivo físico faltando
 *
 * Gera relatório com:
 * - Documentos com fileUrl mas arquivo não existe no disco
 * - Protocolos afetados
 * - Status dos protocolos (CONCLUIDO, PROGRESSO, etc)
 * - Data da última modificação
 *
 * USO:
 *   npx tsx src/scripts/audit-missing-files.ts
 *   npx tsx src/scripts/audit-missing-files.ts --export=relatorio.json
 */

import { PrismaClient, ProtocolStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { getProtocolFilePath, extractFilename } from '../config/upload';

const prisma = new PrismaClient();

interface MissingFileReport {
  documentId: string;
  protocolId: string;
  protocolNumber: string;
  protocolStatus: ProtocolStatus;
  documentType: string;
  fileName: string | null;
  fileUrl: string | null;
  expectedPath: string;
  uploadedAt: Date | null;
  protocolCreatedAt: Date;
  protocolUpdatedAt: Date;
}

const missingFiles: MissingFileReport[] = [];

async function auditMissingFiles() {
  console.log('🔍 AUDITORIA DE ARQUIVOS FALTANTES');
  console.log('='.repeat(70));
  console.log('');

  // Buscar todos os documentos que têm fileUrl (foram enviados)
  console.log('📄 Buscando documentos com arquivos registrados...');

  const documents = await prisma.protocolDocument.findMany({
    where: {
      fileUrl: {
        not: null
      }
    },
    include: {
      protocol: {
        select: {
          id: true,
          number: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }
    },
    orderBy: {
      uploadedAt: 'desc'
    }
  });

  console.log(`   Total de documentos com arquivos: ${documents.length}`);
  console.log('');

  console.log('🔎 Verificando existência física dos arquivos...');
  console.log('');

  for (const doc of documents) {
    if (!doc.fileUrl) continue;

    // Pular URLs externas
    if (doc.fileUrl.startsWith('http')) {
      continue;
    }

    // Verificar se arquivo existe
    const filename = extractFilename(doc.fileUrl);
    const filePath = getProtocolFilePath(doc.protocolId, filename);
    const exists = fs.existsSync(filePath);

    if (!exists) {
      missingFiles.push({
        documentId: doc.id,
        protocolId: doc.protocolId,
        protocolNumber: doc.protocol.number,
        protocolStatus: doc.protocol.status,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        expectedPath: filePath,
        uploadedAt: doc.uploadedAt,
        protocolCreatedAt: doc.protocol.createdAt,
        protocolUpdatedAt: doc.protocol.updatedAt
      });

      console.log(`   ❌ ARQUIVO FALTANDO`);
      console.log(`      Protocolo: ${doc.protocol.number} (${doc.protocol.status})`);
      console.log(`      Documento: ${doc.documentType}`);
      console.log(`      Arquivo: ${doc.fileName || 'N/A'}`);
      console.log(`      Caminho esperado: ${filePath}`);
      console.log(`      Upload em: ${doc.uploadedAt?.toLocaleString('pt-BR') || 'N/A'}`);
      console.log('');
    }
  }

  // Relatório final
  console.log('='.repeat(70));
  console.log('📊 RESUMO DA AUDITORIA');
  console.log('='.repeat(70));
  console.log(`Total de documentos analisados:     ${documents.length}`);
  console.log(`Arquivos faltando:                  ${missingFiles.length}`);
  console.log(`Taxa de integridade:                ${((1 - missingFiles.length / documents.length) * 100).toFixed(2)}%`);
  console.log('');

  // Estatísticas por status de protocolo
  if (missingFiles.length > 0) {
    console.log('📈 ESTATÍSTICAS POR STATUS DO PROTOCOLO');
    console.log('-'.repeat(70));

    const byStatus = missingFiles.reduce((acc, file) => {
      acc[file.protocolStatus] = (acc[file.protocolStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [status, count] of Object.entries(byStatus)) {
      console.log(`   ${status.padEnd(20)} ${count} arquivo(s)`);
    }
    console.log('');

    // Protocolos mais afetados
    console.log('🔴 TOP 10 PROTOCOLOS MAIS AFETADOS');
    console.log('-'.repeat(70));

    const byProtocol = missingFiles.reduce((acc, file) => {
      const key = `${file.protocolNumber} (${file.protocolStatus})`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topProtocols = Object.entries(byProtocol)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [protocol, count] of topProtocols) {
      console.log(`   ${protocol.padEnd(40)} ${count} arquivo(s) faltando`);
    }
    console.log('');
  }

  // Exportar relatório se solicitado
  const exportArg = process.argv.find(arg => arg.startsWith('--export='));
  if (exportArg && missingFiles.length > 0) {
    const exportPath = exportArg.split('=')[1];
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalDocuments: documents.length,
        missingFiles: missingFiles.length,
        integrityRate: ((1 - missingFiles.length / documents.length) * 100).toFixed(2) + '%'
      },
      missingFiles: missingFiles.map(f => ({
        ...f,
        uploadedAt: f.uploadedAt?.toISOString(),
        protocolCreatedAt: f.protocolCreatedAt.toISOString(),
        protocolUpdatedAt: f.protocolUpdatedAt.toISOString()
      }))
    };

    fs.writeFileSync(exportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Relatório exportado para: ${exportPath}`);
    console.log('');
  }

  console.log('='.repeat(70));

  if (missingFiles.length === 0) {
    console.log('✅ Todos os arquivos estão íntegros!');
  } else {
    console.log('⚠️  AÇÃO NECESSÁRIA:');
    console.log('   1. Verificar se há backup dos arquivos faltantes');
    console.log('   2. Considerar marcar documentos como PENDING para reenvio');
    console.log('   3. Entrar em contato com cidadãos para reenvio de documentos');
    console.log('');
    console.log('💡 RECOMENDAÇÃO:');
    console.log('   - Implementar backup automático de arquivos');
    console.log('   - Nunca deletar arquivos de protocolos concluídos');
    console.log('   - Manter arquivos mesmo após conclusão (preservação municipal)');
  }
}

// Executar auditoria
if (require.main === module) {
  auditMissingFiles()
    .then(() => {
      console.log('');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal na auditoria:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { auditMissingFiles };
