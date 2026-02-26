/**
 * Serviço de numeração automática de processos internos
 * Formato: {PREFIX}-{ANO}-{SEQUENCIAL} ex: MEM-2026-00001
 * Thread-safe via upsert + increment atômico no PostgreSQL
 */
import prisma from '../utils/prisma';
import logger from '../utils/logger';

/**
 * Gera o próximo número de protocolo interno.
 * Thread-safe: usa upsert + $executeRaw com UPDATE ... RETURNING para incremento atômico.
 */
export async function generateProcessNumber(prefix: string): Promise<string> {
  const year = new Date().getFullYear();

  // Garantir que a sequência existe e incrementar atomicamente
  // Usamos upsert seguido de incremento em transaction serializable
  const result = await prisma.$transaction(async (tx) => {
    // Upsert: cria se não existe, incrementa se existe
    await tx.processNumberSequence.upsert({
      where: { prefix_year: { prefix, year } },
      create: { prefix, year, lastSequential: 0 },
      update: {},
    });

    // Incrementar e retornar o novo valor atomicamente
    const updated = await tx.processNumberSequence.update({
      where: { prefix_year: { prefix, year } },
      data: { lastSequential: { increment: 1 } },
      select: { lastSequential: true },
    });

    return updated.lastSequential;
  }, {
    isolationLevel: 'Serializable',
  });

  const number = `${prefix}-${year}-${String(result).padStart(5, '0')}`;
  logger.info(`Número de processo gerado: ${number}`);
  return number;
}
