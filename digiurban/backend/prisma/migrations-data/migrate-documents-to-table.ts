/**
 * ============================================================================
 * MIGRAÇÃO DE DADOS: JSON documents → Tabela ProtocolDocument
 * ============================================================================
 *
 * Este script migra documentos existentes do campo JSON `documents`
 * para a tabela `ProtocolDocument`, permitindo controle de aprovação.
 *
 * Execução: Automática via seed consolidado no deploy
 * Idempotente: Pode rodar múltiplas vezes sem duplicar dados
 */

import { PrismaClient, DocumentStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface DocumentJSON {
  id?: string;
  name?: string;
  originalName?: string;
  filename?: string;
  url?: string;
  path?: string;
  size?: number;
  mimetype?: string;
  mimeType?: string;
  uploadedAt?: string | Date;
  documentType?: string;
}

/**
 * Infere o tipo de documento baseado no nome do arquivo
 */
function inferDocumentType(fileName: string): string {
  const normalized = fileName.toLowerCase();

  if (normalized.includes('encaminhamento') || normalized.includes('médico')) {
    return 'Encaminhamento Médico';
  }
  if (normalized.includes('exame')) {
    return 'Exames Médicos';
  }
  if (normalized.includes('rg') || normalized.includes('cpf') || normalized.includes('sus') || normalized.includes('documento')) {
    return 'Documentos Pessoais (RG, CPF, Cartão SUS)';
  }
  if (normalized.includes('comprovante')) {
    return 'Comprovante';
  }

  return 'Documento Geral';
}

/**
 * Verifica se um documento já foi migrado
 */
async function isDocumentMigrated(protocolId: string, fileName: string): Promise<boolean> {
  const existing = await prisma.protocolDocument.findFirst({
    where: {
      protocolId,
      fileName
    }
  });

  return !!existing;
}

/**
 * Migra documentos de um protocolo específico
 */
async function migrateProtocolDocuments(protocol: any): Promise<number> {
  let migratedCount = 0;

  try {
    // Parsear documents se for string
    let documents: DocumentJSON[] = [];

    if (typeof protocol.documents === 'string') {
      try {
        documents = JSON.parse(protocol.documents);
      } catch (e) {
        console.warn(`   ⚠️  Protocolo ${protocol.number}: Erro ao parsear documents JSON`);
        return 0;
      }
    } else if (Array.isArray(protocol.documents)) {
      documents = protocol.documents as DocumentJSON[];
    } else if (protocol.documents && typeof protocol.documents === 'object') {
      // Se for objeto único, transformar em array
      documents = [protocol.documents as DocumentJSON];
    }

    if (documents.length === 0) {
      return 0;
    }

    // Migrar cada documento
    for (const doc of documents) {
      const fileName = doc.originalName || doc.name || doc.filename || 'documento.pdf';
      const fileUrl = doc.path || doc.url || '';

      // Verificar se já foi migrado
      if (await isDocumentMigrated(protocol.id, fileName)) {
        continue;
      }

      // Criar registro na tabela
      await prisma.protocolDocument.create({
        data: {
          protocolId: protocol.id,
          documentType: doc.documentType || inferDocumentType(fileName),
          fileName,
          fileUrl,
          fileSize: doc.size || 0,
          mimeType: doc.mimetype || doc.mimeType || 'application/octet-stream',
          status: DocumentStatus.UPLOADED, // Já foi enviado
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : protocol.createdAt,
          uploadedBy: protocol.citizenId,
          isRequired: true, // Assumir obrigatório por segurança
        }
      });

      migratedCount++;
    }

  } catch (error) {
    console.error(`   ❌ Erro ao migrar protocolo ${protocol.number}:`, error);
  }

  return migratedCount;
}

/**
 * Cria documentos PENDING para protocolos TFD que não têm documentos
 */
async function createPendingDocumentsForTFD(): Promise<number> {
  let createdCount = 0;

  try {
    // Buscar serviço TFD
    const tfdService = await prisma.serviceSimplified.findFirst({
      where: {
        moduleType: 'ENCAMINHAMENTOS_TFD'
      },
      select: {
        id: true,
        requiredDocuments: true
      }
    });

    if (!tfdService) {
      console.log('   ℹ️  Serviço TFD não encontrado, pulando criação de documentos PENDING');
      return 0;
    }

    // Parsear documentos obrigatórios
    let requiredDocs: any[] = [];
    if (tfdService.requiredDocuments) {
      if (typeof tfdService.requiredDocuments === 'string') {
        try {
          requiredDocs = JSON.parse(tfdService.requiredDocuments);
        } catch (e) {
          console.warn('   ⚠️  Erro ao parsear requiredDocuments do serviço TFD');
        }
      } else if (Array.isArray(tfdService.requiredDocuments)) {
        requiredDocs = tfdService.requiredDocuments;
      }
    }

    // Se não tem configuração, usar padrão TFD
    if (requiredDocs.length === 0) {
      requiredDocs = [
        { id: 'encaminhamento_medico', name: 'Encaminhamento Médico', required: true },
        { id: 'exames', name: 'Exames Médicos', required: false },
        { id: 'documentos_pessoais', name: 'Documentos Pessoais (RG, CPF, Cartão SUS)', required: true }
      ];
    }

    // Buscar protocolos TFD sem documentos na tabela
    const tfdProtocols = await prisma.protocolSimplified.findMany({
      where: {
        moduleType: 'ENCAMINHAMENTOS_TFD',
        ProtocolDocument: {
          none: {} // Não tem nenhum documento na tabela
        }
      },
      select: {
        id: true,
        number: true
      }
    });

    // Criar documentos PENDING para cada protocolo
    for (const protocol of tfdProtocols) {
      for (const docConfig of requiredDocs) {
        const docName = docConfig.name || docConfig.id || docConfig;
        const isRequired = typeof docConfig === 'object' ? (docConfig.required !== false) : true;

        await prisma.protocolDocument.create({
          data: {
            protocolId: protocol.id,
            documentType: docName,
            isRequired,
            status: DocumentStatus.PENDING
          }
        });

        createdCount++;
      }
    }

  } catch (error) {
    console.error('   ❌ Erro ao criar documentos PENDING:', error);
  }

  return createdCount;
}

/**
 * Função principal de migração
 */
export async function migrateDocumentsToTable() {
  console.log('\n📄 === MIGRAÇÃO: Campo JSON → Tabela ProtocolDocument ===\n');

  try {
    // 1. Buscar todos protocolos com documentos no JSON
    console.log('1️⃣  Buscando protocolos com documentos em JSON...');
    const protocolsWithDocs = await prisma.protocolSimplified.findMany({
      where: {
        documents: {
          not: Prisma.JsonNull
        }
      },
      select: {
        id: true,
        number: true,
        documents: true,
        citizenId: true,
        createdAt: true,
        moduleType: true
      }
    });

    console.log(`   ✓ Encontrados ${protocolsWithDocs.length} protocolos com documentos\n`);

    if (protocolsWithDocs.length === 0) {
      console.log('   ℹ️  Nenhum protocolo com documentos para migrar\n');
    } else {
      // 2. Migrar documentos
      console.log('2️⃣  Migrando documentos para tabela...');
      let totalMigrated = 0;

      for (const protocol of protocolsWithDocs) {
        const migrated = await migrateProtocolDocuments(protocol);
        if (migrated > 0) {
          console.log(`   ✓ Protocolo ${protocol.number}: ${migrated} documento(s) migrado(s)`);
          totalMigrated += migrated;
        }
      }

      console.log(`\n   ✅ Total migrado: ${totalMigrated} documento(s)\n`);
    }

    // 3. Criar documentos PENDING para protocolos TFD sem documentos
    console.log('3️⃣  Criando documentos PENDING para protocolos TFD...');
    const pendingCreated = await createPendingDocumentsForTFD();

    if (pendingCreated > 0) {
      console.log(`   ✅ Criados ${pendingCreated} documento(s) PENDING\n`);
    } else {
      console.log(`   ℹ️  Nenhum documento PENDING a criar\n`);
    }

    // 4. Estatísticas finais
    console.log('4️⃣  Estatísticas finais:');
    const totalDocuments = await prisma.protocolDocument.count();
    const byStatus = await prisma.protocolDocument.groupBy({
      by: ['status'],
      _count: true
    });

    console.log(`   📊 Total de documentos na tabela: ${totalDocuments}`);
    byStatus.forEach(stat => {
      console.log(`      - ${stat.status}: ${stat._count}`);
    });

    console.log('\n✅ Migração de documentos concluída com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro na migração de documentos:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  migrateDocumentsToTable()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
