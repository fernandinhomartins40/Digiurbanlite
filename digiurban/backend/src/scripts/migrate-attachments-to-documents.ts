/**
 * ============================================================================
 * SCRIPT DE MIGRAÇÃO: attachments → protocol_documents
 * ============================================================================
 * Migra documentos do campo attachments/documents antigo para a tabela
 * protocol_documents
 *
 * USO:
 *   npx ts-node src/scripts/migrate-attachments-to-documents.ts
 */

import { PrismaClient, DocumentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAttachmentsToDocuments() {
  console.log('🔄 Iniciando migração de attachments → protocol_documents...\n');

  try {
    // Buscar todos os protocolos que têm attachments ou documents
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        OR: [
          { attachments: { not: null } },
          { documents: { not: null } }
        ]
      },
      select: {
        id: true,
        number: true,
        attachments: true,
        documents: true
      }
    });

    console.log(`📋 Encontrados ${protocols.length} protocolos com documentos antigos\n`);

    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const protocol of protocols) {
      try {
        console.log(`\n📦 Protocolo ${protocol.number} (${protocol.id})`);

        // Verificar se já existem documentos migrados
        const existingDocs = await prisma.protocolDocument.count({
          where: { protocolId: protocol.id }
        });

        if (existingDocs > 0) {
          console.log(`   ⏭️  Pulando - já possui ${existingDocs} documento(s) migrado(s)`);
          totalSkipped++;
          continue;
        }

        // Parsear attachments
        let attachments: any[] = [];

        if (protocol.attachments) {
          try {
            if (typeof protocol.attachments === 'string') {
              attachments = JSON.parse(protocol.attachments);
            } else if (Array.isArray(protocol.attachments)) {
              attachments = protocol.attachments;
            }
          } catch (e) {
            console.warn('   ⚠️  Erro ao parsear attachments:', e);
          }
        }

        // Se não tem attachments, tentar documents
        if (attachments.length === 0 && protocol.documents) {
          try {
            if (typeof protocol.documents === 'string') {
              attachments = JSON.parse(protocol.documents);
            } else if (Array.isArray(protocol.documents)) {
              attachments = protocol.documents;
            }
          } catch (e) {
            console.warn('   ⚠️  Erro ao parsear documents:', e);
          }
        }

        if (attachments.length === 0) {
          console.log('   ℹ️  Nenhum documento encontrado');
          totalSkipped++;
          continue;
        }

        console.log(`   → Migrando ${attachments.length} documento(s)...`);

        // Migrar cada attachment
        for (const att of attachments) {
          const documentData = {
            protocolId: protocol.id,
            documentType: att.documentId || att.id || 'Documento',
            isRequired: false, // Documentos antigos são considerados opcionais
            status: DocumentStatus.UPLOADED,
            fileName: att.originalName || att.filename || att.name || 'arquivo',
            fileUrl: att.path || att.url || '',
            fileSize: att.size || 0,
            mimeType: att.mimetype || 'application/octet-stream',
            uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
            uploadedBy: null, // Não temos essa informação nos dados antigos
            version: 1
          };

          await prisma.protocolDocument.create({
            data: documentData
          });

          console.log(`   ✓ ${documentData.documentType} (${documentData.fileName})`);
        }

        totalMigrated += attachments.length;
        console.log(`   ✅ ${attachments.length} documento(s) migrado(s)`);

      } catch (error) {
        console.error(`   ❌ Erro ao migrar protocolo ${protocol.number}:`, error);
        totalErrors++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(70));
    console.log(`✅ Documentos migrados: ${totalMigrated}`);
    console.log(`⏭️  Protocolos pulados: ${totalSkipped}`);
    console.log(`❌ Erros: ${totalErrors}`);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateAttachmentsToDocuments()
  .then(() => {
    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  });
