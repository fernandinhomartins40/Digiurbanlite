/**
 * ============================================================================
 * TENANT CONTEXT — Messages Server (Fase 6 Multi-Tenant)
 * ============================================================================
 * AsyncLocalStorage que carrega o tenantId do cidadão por requisição de bot.
 * O DigiUrbanIntegration (interceptor axios) injeta X-Tenant-Id em TODA chamada
 * ao backend a partir daqui — inclusive nas que não têm citizenId
 * (listServices, searchServices), fechando o gap do internal-tenant-context.
 *
 * Origem do tenantId:
 *  - WebSocket: claim do JWT do cidadão (setado no handshake)
 *  - HTTP bot-flow: derivado do citizenId no início do processamento
 */

import { AsyncLocalStorage } from 'async_hooks';

interface BotTenantContext {
  tenantId?: string;
}

const storage = new AsyncLocalStorage<BotTenantContext>();

export function runWithTenant<T>(tenantId: string | undefined, fn: () => T): T {
  return storage.run({ tenantId }, fn);
}

export function getBotTenantId(): string | undefined {
  return storage.getStore()?.tenantId;
}
