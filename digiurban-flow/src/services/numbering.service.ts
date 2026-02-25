/**
 * Serviço de numeração automática de processos internos
 * Formato: {PREFIX}-{ANO}-{SEQUENCIAL} ex: MEM-2026-00001
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';

/**
 * Gera o próximo número de protocolo interno
 * Thread-safe via SELECT FOR UPDATE
 */
export async function generateProcessNumber(prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;

  // Buscar último número do ano com o mesmo prefixo
  const lastProcess = await prisma.internalProcess.findFirst({
    where: {
      number: { startsWith: fullPrefix },
    },
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  let sequential = 1;

  if (lastProcess) {
    const parts = lastProcess.number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequential = lastSeq + 1;
    }
  }

  const number = `${fullPrefix}${String(sequential).padStart(5, '0')}`;
  logger.info(`Número de processo gerado: ${number}`);
  return number;
}
