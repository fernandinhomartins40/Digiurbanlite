import { PrismaClient, Prisma } from '@prisma/client';
import path from 'path';
import '../types/globals'; // Importar tipos globais

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

// Prevent multiple instances of Prisma Client in development
// Global declaration in src/types/globals.ts
export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl()
        }
        },
    log: ['query', 'error', 'warn']
        });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Log do caminho do banco ao inicializar (apenas uma vez)
if (!globalThis.__prisma) {
  console.log(`📊 Database: ${getDatabaseUrl()}`);
}
