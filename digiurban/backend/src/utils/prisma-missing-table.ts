import { Prisma } from '@prisma/client';

function normalize(value: string): string {
  return value.toLowerCase();
}

export function isPrismaMissingTableError(error: unknown, tableNames?: string[]): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== 'P2021') {
    return false;
  }

  if (!tableNames || tableNames.length === 0) {
    return true;
  }

  const metaTable = typeof error.meta?.table === 'string' ? normalize(error.meta.table) : '';
  const message = normalize(error.message);
  return tableNames.some((tableName) => {
    const normalizedTable = normalize(tableName);
    return metaTable.includes(normalizedTable) || message.includes(normalizedTable);
  });
}
