import { PrismaClient, Prisma } from '@prisma/client';
import path from 'path';
import '../types/globals'; // Importar tipos globais
import { cascadeDeleteExtension } from '../middleware/prisma-cascade-delete.middleware';

export { Prisma };

// ✅ SOLUÇÃO DEFINITIVA: Caminho absoluto para evitar duplicação de banco
// Garante que o banco seja criado sempre em ./prisma/dev.db relativo à raiz do projeto
const getDatabaseUrl = (): string => {
  // Se DATABASE_URL já é absoluto ou file:///, usar diretamente
  const envUrl = process.env.DATABASE_URL || '';

  if (envUrl.startsWith('file:///') || envUrl.startsWith('postgresql://') || envUrl.startsWith('mysql://')) {
    return envUrl;
  }

  // Converter caminho relativo para absoluto baseado no diretório do projeto
  // process.cwd() retorna o diretório onde npm run dev foi executado (backend/)
  if (envUrl.startsWith('file:./')) {
    const relativePath = envUrl.replace('file:./', '');
    const absolutePath = path.resolve(process.cwd(), relativePath);
    return `file:${absolutePath}`;
  }

  // Fallback seguro
  const defaultPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
  console.warn(`⚠️  DATABASE_URL não configurado corretamente. Usando: file:${defaultPath}`);
  return `file:${defaultPath}`;
};

// Criar PrismaClient base
const prismaBase = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: ['query', 'error', 'warn']
});

const isAuditStorageUnavailable = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2021' || error.code === 'P2022';
  }

  return error instanceof Error && /audit_logs|audit logs?.*does not exist|audit_logs.*does not exist/i.test(error.message);
};

const buildAuditLogFallback = (data: Prisma.AuditLogCreateArgs['data']) => ({
  id: `audit-log-fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  userId: data.userId ?? null,
  citizenId: data.citizenId ?? null,
  action: data.action,
  resource: data.resource ?? null,
  method: data.method ?? null,
  details: data.details ?? null,
  ip: data.ip ?? null,
  userAgent: data.userAgent ?? null,
  success: data.success ?? true,
  errorMessage: data.errorMessage ?? null,
  createdAt: new Date()
});

const auditLogFallbackExtension = Prisma.defineExtension({
  query: {
    auditLog: {
      async create({ args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (isAuditStorageUnavailable(error)) {
            console.warn('[PRISMA] Escrita em audit_logs ignorada porque a tabela não está disponível.');
            return buildAuditLogFallback(args.data) as any;
          }

          throw error;
        }
      },
      async createMany({ args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (isAuditStorageUnavailable(error)) {
            console.warn('[PRISMA] Escrita em audit_logs ignorada porque a tabela não está disponível.');
            return { count: 0 };
          }

          throw error;
        }
      }
    }
  }
});

// ✅ FASE 4: Aplicar extension de cascade delete para arquivos físicos
// Usa Prisma Client Extensions API (compatível com Prisma 6.x)
// ✅ FASES 2/3 MULTI-TENANT: tenant-isolation injeta tenantId nas escritas E
// filtra leituras/mutações de models escopados (detectados via DMMF) a partir
// do contexto ALS. Ver src/lib/prisma-tenant-extension.ts.
import { tenantExtension } from './prisma-tenant-extension';

const prismaExtended = prismaBase
  .$extends(cascadeDeleteExtension)
  .$extends(auditLogFallbackExtension)
  .$extends(tenantExtension) as unknown as PrismaClient;

// Prevent multiple instances of Prisma Client in development
// Global declaration in src/types/globals.ts
export const prisma: PrismaClient =
  (globalThis.__prisma as PrismaClient) || prismaExtended;

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma as any;
}

// Log do caminho do banco ao inicializar (apenas uma vez)
if (!globalThis.__prisma) {
  console.log(`📊 Database: ${getDatabaseUrl()}`);
  console.log('🗑️  Cascade delete extension ativada');
}
