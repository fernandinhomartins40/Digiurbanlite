/**
 * Desafio da prova de vida: o SERVIDOR sorteia para que lado o rosto deve
 * virar. Vale uma vez só, por 2 minutos, no município que pediu.
 * (Um único servidor de face: memória basta. Reiniciar só invalida desafios em curso.)
 */

import crypto from 'crypto';
import type { ChallengeDirection } from './decisions';

interface StoredChallenge {
  tenantId: string;
  subject: string;
  direction: ChallengeDirection;
  expiresAt: number;
}

const TTL_MS = 2 * 60 * 1000;
const challenges = new Map<string, StoredChallenge>();

function prune() {
  const now = Date.now();
  for (const [id, challenge] of challenges) {
    if (challenge.expiresAt < now) challenges.delete(id);
  }
  if (challenges.size > 5000) challenges.clear();
}

export function createChallenge(tenantId: string, subject: string) {
  prune();
  const id = crypto.randomBytes(16).toString('hex');
  const direction: ChallengeDirection = crypto.randomInt(2) === 0 ? 'left' : 'right';
  const expiresAt = Date.now() + TTL_MS;
  challenges.set(id, { tenantId, subject, direction, expiresAt });
  return { challengeId: id, direction, expiresAt: new Date(expiresAt).toISOString() };
}

/** Usa o desafio (uma vez só). Erro com mensagem para o cidadão se inválido. */
export function consumeChallenge(id: string | undefined, tenantId: string, subject: string): ChallengeDirection {
  const challenge = id ? challenges.get(id) : undefined;
  if (id) challenges.delete(id);
  if (!challenge || challenge.expiresAt < Date.now() || challenge.tenantId !== tenantId || challenge.subject !== subject) {
    const error = new Error('A validação expirou. Comece de novo.') as Error & { status?: number };
    error.status = 410;
    throw error;
  }
  return challenge.direction;
}
