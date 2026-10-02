/**
 * Trava "uma mensagem por vez" de cada cidadão com o DigiBot.
 *
 * Antes ficava num Map em memória: sumia a cada deploy e não valia se houvesse
 * mais de um servidor do bot. Agora fica no Redis (SET NX com validade de 30 s,
 * liberada só por quem travou). Sem Redis, cai para a memória — o bot nunca
 * deixa de responder por causa da trava.
 */

import crypto from 'crypto';
import { createClient, RedisClientType } from 'redis';
import logger from './logger';

const TTL_MS = 30000;
const memory = new Map<string, { token: string; at: number }>();
let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType | null> | null = null;

async function redis(): Promise<RedisClientType | null> {
  if (client?.isReady) return client;
  if (!connecting) {
    connecting = (async () => {
      try {
        const c = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' }) as RedisClientType;
        c.on('error', () => undefined);
        await c.connect();
        client = c;
        return c;
      } catch (error) {
        logger.warn('botLock: Redis indisponível, usando memória', { error: error instanceof Error ? error.message : error });
        return null;
      } finally {
        // nova tentativa de conexão na próxima chamada se esta falhou
        setTimeout(() => { connecting = null; }, client ? 0 : 10000);
      }
    })();
  }
  return connecting;
}

export interface BotLock {
  key: string;
  token: string;
}

/** Trava por cidadão + conversa (qualquer ação: iniciar, mensagem, envio de arquivo) */
export async function acquireBotLock(citizenId: string, conversationId?: string): Promise<BotLock | null> {
  const key = `digibot:lock:${citizenId}:${conversationId || 'default'}`;
  const token = crypto.randomBytes(8).toString('hex');
  const r = await redis();
  if (r) {
    try {
      const ok = await r.set(key, token, { NX: true, PX: TTL_MS });
      return ok ? { key, token } : null;
    } catch {
      // Redis caiu no meio: segue com a memória
    }
  }
  const now = Date.now();
  const existing = memory.get(key);
  if (existing && now - existing.at < TTL_MS) return null;
  memory.set(key, { token, at: now });
  return { key, token };
}

export async function releaseBotLock(lock: BotLock | null): Promise<void> {
  if (!lock) return;
  const mem = memory.get(lock.key);
  if (mem?.token === lock.token) memory.delete(lock.key);
  const r = await redis();
  if (!r) return;
  try {
    // só apaga se a trava ainda for nossa (não libera a de outra requisição)
    await r.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", {
      keys: [lock.key],
      arguments: [lock.token],
    });
  } catch {
    // expira sozinha em 30 s
  }
}
