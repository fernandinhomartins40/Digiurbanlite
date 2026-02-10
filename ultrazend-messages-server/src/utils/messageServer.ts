import prisma from './prisma';
import logger from './logger';

const coercePort = (value: unknown, fallback: number): number => {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/**
 * Garante que exista um MessageServer ativo e retorna o id.
 *
 * Motivo: em alguns ambientes o bootstrap do `src/index.ts` pode não criar
 * o registro (migrations/seed parciais, múltiplas instâncias, DB vazio etc).
 * Sem isso, toda criação de conversa falha com "No active message server found".
 */
export async function ensureActiveMessageServerId(): Promise<string> {
  const envId = String(process.env.MESSAGE_SERVER_ID || '').trim();

  if (envId) {
    const existing = await prisma.messageServer.findUnique({
      where: { id: envId },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    logger.warn('MESSAGE_SERVER_ID configured but not found in database; falling back to active server', {
      envId,
    });
  }

  const active = await prisma.messageServer.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (active) {
    // Cache dentro do processo para evitar múltiplas queries por request.
    process.env.MESSAGE_SERVER_ID = active.id;
    return active.id;
  }

  logger.warn('No active MessageServer found. Creating default...');

  const created = await prisma.messageServer.create({
    data: {
      name: process.env.MESSAGE_SERVER_NAME || 'DigiUrban Messages',
      hostname: process.env.MESSAGE_SERVER_HOSTNAME || process.env.HOSTNAME || 'messages.digiurban.local',
      wsPort: coercePort(process.env.PORT, 9001),
      isActive: true,
      enableEncryption: false,
      enableP2P: true,
      enableBroadcast: true,
    },
    select: { id: true },
  });

  process.env.MESSAGE_SERVER_ID = created.id;
  logger.info('Default MessageServer created (lazy)', { messageServerId: created.id });
  return created.id;
}

