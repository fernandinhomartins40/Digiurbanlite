/**
 * ============================================================================
 * PRISMA CASCADE DELETE EXTENSION - FASE 4
 * ============================================================================
 *
 * Prisma Client Extension para deletar arquivos físicos automaticamente
 * quando documentos ou protocolos são deletados do banco de dados
 *
 * 🛡️ PROTEÇÃO DE PRESERVAÇÃO MUNICIPAL:
 * ⚠️ AVISO CRÍTICO: Esta funcionalidade está DESABILITADA para protocolos
 * - Documentos municipais são patrimônio público permanente
 * - NUNCA deletar arquivos de protocolos, mesmo que deletados do banco
 * - Apenas documentos individuais podem ter arquivos removidos manualmente
 *
 * Compatível com Prisma 6.x usando Client Extensions API
 * Referência: https://www.prisma.io/docs/orm/prisma-client/client-extensions
 */

import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { getProtocolFilePath, extractFilename } from '../config/upload';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'protocols');

/**
 * Deleta arquivo físico de forma segura
 */
function deletePhysicalFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`   🗑️  Arquivo deletado: ${path.basename(filePath)}`);
    }
  } catch (error) {
    console.error(`   ❌ Erro ao deletar arquivo físico: ${filePath}`, error);
  }
}

/**
 * Deleta diretório se estiver vazio
 */
function deleteEmptyDirectory(dirPath: string): void {
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`   📁 Diretório vazio deletado: ${path.basename(dirPath)}`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Erro ao deletar diretório: ${dirPath}`, error);
  }
}

/**
 * Deleta todos os arquivos de um diretório de protocolo
 */
function deleteProtocolDirectory(protocolId: string, protocolNumber?: string): void {
  const protocolDir = path.join(UPLOAD_DIR, protocolId);

  if (fs.existsSync(protocolDir)) {
    try {
      const files = fs.readdirSync(protocolDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(protocolDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
      }

      fs.rmdirSync(protocolDir);

      const protocolLabel = protocolNumber ? `Protocolo ${protocolNumber}` : `Protocolo ${protocolId}`;
      console.log(`   🗑️  ${protocolLabel}: ${deletedCount} arquivo(s) deletado(s)`);
    } catch (error) {
      console.error(`   ❌ Erro ao deletar diretório do protocolo ${protocolId}:`, error);
    }
  }
}

/**
 * Prisma Client Extension para cascade delete de arquivos físicos
 * Usa a API de query hooks para interceptar operações de delete
 */
export const cascadeDeleteExtension = Prisma.defineExtension({
  name: 'cascadeDelete',

  query: {
    protocolDocument: {
      /**
       * Hook para delete único de documento
       */
      async delete({ args, query }) {
        // 1. Buscar informações do documento antes de deletar
        const document = await (query as any).__prismaClient.protocolDocument.findUnique({
          where: args.where,
          select: { id: true, protocolId: true, fileUrl: true, fileName: true }
        });

        // 2. Executar delete no banco
        const result = await query(args);

        // 3. Deletar arquivo físico se existir
        if (document?.fileUrl) {
          const filename = extractFilename(document.fileUrl);
          const filePath = getProtocolFilePath(document.protocolId, filename);
          deletePhysicalFile(filePath);

          // Verificar se diretório do protocolo ficou vazio
          const protocolDir = path.join(UPLOAD_DIR, document.protocolId);
          deleteEmptyDirectory(protocolDir);
        }

        return result;
      },

      /**
       * Hook para deleteMany de documentos
       */
      async deleteMany({ args, query }) {
        // 1. Buscar documentos antes de deletar
        const documents = await (query as any).__prismaClient.protocolDocument.findMany({
          where: args.where,
          select: { id: true, protocolId: true, fileUrl: true }
        });

        // 2. Executar delete no banco
        const result = await query(args);

        // 3. Deletar arquivos físicos
        for (const doc of documents) {
          if (doc.fileUrl) {
            const filename = extractFilename(doc.fileUrl);
            const filePath = getProtocolFilePath(doc.protocolId, filename);
            deletePhysicalFile(filePath);
          }
        }

        // 4. Verificar diretórios vazios
        const protocolIds = new Set(documents.map((d: any) => d.protocolId as string));
        for (const protocolId of protocolIds) {
          const protocolDir = path.join(UPLOAD_DIR, protocolId as string);
          deleteEmptyDirectory(protocolDir);
        }

        return result;
      }
    },

    protocolSimplified: {
      /**
       * Hook para delete único de protocolo
       * 🛡️ PROTEÇÃO: NUNCA deletar arquivos de protocolo (preservação municipal)
       */
      async delete({ args, query }) {
        // 1. Buscar informações do protocolo antes de deletar
        const protocol = await (query as any).__prismaClient.protocolSimplified.findUnique({
          where: args.where,
          select: { id: true, number: true }
        });

        // 2. Executar delete no banco (cascade delete de documentos via onDelete: Cascade)
        const result = await query(args);

        // 🛡️ PRESERVAÇÃO MUNICIPAL: Arquivos NÃO são deletados
        // Os arquivos permanecem no disco para fins de auditoria e compliance
        if (protocol) {
          console.log(`   🛡️  Protocolo ${protocol.number} deletado do banco`);
          console.log(`   📁 Arquivos preservados em: uploads/protocols/${protocol.id}/`);
          console.log(`   ⚠️  Documentos municipais são patrimônio público permanente`);
        }

        return result;
      },

      /**
       * Hook para deleteMany de protocolos
       * 🛡️ PROTEÇÃO: NUNCA deletar arquivos de protocolo (preservação municipal)
       */
      async deleteMany({ args, query }) {
        // 1. Buscar protocolos antes de deletar
        const protocols = await (query as any).__prismaClient.protocolSimplified.findMany({
          where: args.where,
          select: { id: true, number: true }
        });

        // 2. Executar delete no banco
        const result = await query(args);

        // 🛡️ PRESERVAÇÃO MUNICIPAL: Arquivos NÃO são deletados
        // Os arquivos permanecem no disco para fins de auditoria e compliance
        if (protocols.length > 0) {
          console.log(`   🛡️  ${protocols.length} protocolo(s) deletado(s) do banco`);
          console.log(`   📁 Arquivos preservados para compliance e auditoria`);
          console.log(`   ⚠️  Documentos municipais são patrimônio público permanente`);
        }

        return result;
      }
    }
  }
});

/**
 * INSTRUÇÕES DE USO:
 *
 * No arquivo lib/prisma.ts:
 *
 * import { cascadeDeleteExtension } from '../middleware/prisma-cascade-delete.middleware';
 *
 * const prismaBase = new PrismaClient({
 *   datasources: { db: { url: getDatabaseUrl() } },
 *   log: ['query', 'error', 'warn']
 * });
 *
 * export const prisma = prismaBase.$extends(cascadeDeleteExtension);
 */
