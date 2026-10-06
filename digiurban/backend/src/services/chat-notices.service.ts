/**
 * Avisos da prefeitura no chat do cidadão (conversa "Avisos da Prefeitura",
 * só de leitura), pelo servidor de mensagens.
 *
 * Autenticado pelo token interno (Super-admin › Chaves de API › Comunicação
 * interna) — antes o backend inventava uma sessão de servidor sem município
 * (e às vezes com o usuário "system", que não existe) e os avisos eram
 * recusados. Nunca falha quem chamou: aviso no chat é complemento.
 */

import { acceptedInternalTokens } from './platform-secrets.service';
import { tryGetTenantId } from '../lib/tenant-context';

const MESSAGES_URL = (process.env.MESSAGES_SERVER_URL || 'http://ultrazend-messages:9001').replace(/\/+$/, '');

async function internalToken(): Promise<string> {
  const { db } = await acceptedInternalTokens().catch(() => ({ db: [] as string[] }));
  return db[0] || process.env.DIGIURBAN_SERVICE_TOKEN || process.env.MESSAGES_SERVICE_TOKEN || '';
}

export async function sendChatNotice(input: { citizenId: string; content: string; protocolId?: string | null }): Promise<boolean> {
  try {
    const token = await internalToken();
    if (!token || !input.citizenId || !input.content?.trim()) return false;
    const tenantId = tryGetTenantId();
    const response = await fetch(`${MESSAGES_URL}/internal/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
      },
      body: JSON.stringify({ citizenId: input.citizenId, content: input.content.trim(), protocolId: input.protocolId || null }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.warn(`[chat-notices] aviso recusado (${response.status}) para o cidadão ${input.citizenId}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[chat-notices] servidor de mensagens indisponível:', error instanceof Error ? error.message : error);
    return false;
  }
}
