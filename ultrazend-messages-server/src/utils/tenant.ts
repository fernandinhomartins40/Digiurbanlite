/**
 * ============================================================================
 * RESOLUÇÃO DE TENANT PARA PERSISTÊNCIA (Fase 5 do plano 2026-07-13)
 * ============================================================================
 * O Messages Server grava Conversation/Message direto no banco compartilhado.
 * Antes desta fase, essas linhas nasciam com tenantId NULL — invisíveis às
 * leituras escopadas do backend e sem isolamento at-rest.
 *
 * Ordem de resolução:
 *   1. Contexto ALS do bot (claim tenantId do JWT do cidadão) — caminho quente;
 *   2. tenantId da própria conversa (mensagens em conversa existente);
 *   3. tenantId do cidadão participante (raw SQL — o schema local pode estar
 *      atrás do banco; a coluna existe desde as ondas 1-7);
 *   4. tenant default (instalação single-tenant migrada).
 */

import prisma from './prisma';
import logger from './logger';
import { getBotTenantId } from '../bot/tenant-context';

export const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'tenant-default';

export async function resolveTenantId(opts: {
  citizenId?: string | null;
  conversationId?: string | null;
}): Promise<string> {
  const fromContext = getBotTenantId();
  if (fromContext) return fromContext;

  try {
    if (opts.conversationId) {
      const conv = await prisma.conversation.findUnique({
        where: { id: opts.conversationId },
        select: { tenantId: true },
      });
      if (conv?.tenantId) return conv.tenantId;
    }

    if (opts.citizenId) {
      const rows = await prisma.$queryRaw<Array<{ tenantId: string | null }>>`
        SELECT "tenantId" FROM citizens WHERE id = ${opts.citizenId} LIMIT 1
      `;
      if (rows[0]?.tenantId) return rows[0].tenantId;
    }
  } catch (error) {
    // Transição: coluna/tabela ausente (migrations pendentes) — seguir p/ default.
    logger.warn('resolveTenantId: falha ao derivar tenant, usando default', {
      error: error instanceof Error ? error.message : error,
    });
  }

  return DEFAULT_TENANT_ID;
}
