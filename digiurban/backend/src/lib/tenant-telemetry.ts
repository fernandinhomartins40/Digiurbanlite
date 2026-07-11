/**
 * ============================================================================
 * TENANT FAIL-SOFT TELEMETRY + FLAGS DE CORTE (Fase D Multi-Tenant)
 * ============================================================================
 * A Fase D encerra a janela de transição em 2 passos:
 *
 * 1. TELEMETRIA (sempre ativa): toda ativação de fail-soft — código operando
 *    no tenant default por falta de contexto/claim/host — é logada com o
 *    call-site, deduplicada (1º log com stack; resumo periódico com contagens).
 *    Meta operacional: zerar as ocorrências ANTES de ligar os cortes.
 *
 * 2. CORTES (opt-in por env, kill-switch = desligar a env):
 *    - TENANT_STRICT=1              → operação Prisma/upload sem contexto LANÇA
 *                                     em vez de cair no default (dev/CI/staging
 *                                     primeiro; produção após telemetria zerada)
 *    - TENANT_STRICT_HOST=1         → host desconhecido NÃO resolve para o
 *                                     default (tenantStatus responde
 *                                     TENANT_UNRESOLVED). localhost/IPs e
 *                                     TENANT_DEFAULT_HOSTS continuam mapeando
 *                                     para o tenant default.
 *    - TENANT_REQUIRE_TOKEN_CLAIM=1 → JWT sem claim tenantId (sessão antiga) é
 *                                     rejeitado com 401 no chokepoint (tokens
 *                                     type='platform' são isentos por design).
 *
 * Flags lidas a cada chamada (baratas) — permitem toggle em teste e restart
 * sem rebuild.
 */

import { logger } from '../config/logger.config';

function flag(name: string): boolean {
  const v = process.env[name];
  return v === '1' || v === 'true';
}

export const isTenantStrict = (): boolean => flag('TENANT_STRICT');
export const isTenantStrictHost = (): boolean => flag('TENANT_STRICT_HOST');
export const requiresTokenClaim = (): boolean => flag('TENANT_REQUIRE_TOKEN_CLAIM');

/** Hosts extras que resolvem para o tenant default (domínio do modo single-tenant). */
export function defaultTenantHosts(): Set<string> {
  const extra = (process.env.TENANT_DEFAULT_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return new Set(['localhost', '127.0.0.1', '::1', 'backend', ...extra]);
}

// ── Telemetria deduplicada ──────────────────────────────────────────────────

const SUMMARY_INTERVAL_MS = 5 * 60_000;

const activations = new Map<string, number>();
let lastSummaryAt = Date.now();

/** Assinatura curta do call-site (3 frames acima do reporter). */
function callSiteSignature(): string {
  const stack = new Error().stack || '';
  return stack
    .split('\n')
    .slice(3, 6)
    .map((l) => l.trim())
    .join(' <- ');
}

/**
 * Registra uma ativação de fail-soft. Primeiro hit de cada call-site loga o
 * stack completo; os demais só contam. Resumo com contagens a cada 5 min.
 */
export function reportTenantFailSoft(source: string, extra?: Record<string, unknown>): void {
  const signature = `${source} @ ${callSiteSignature()}`;
  const count = (activations.get(signature) || 0) + 1;
  activations.set(signature, count);

  if (count === 1) {
    logger.warn(`[TENANT-FAILSOFT] ${source}: operando no tenant default por ausência de contexto`, {
      signature,
      ...extra,
    });
  }

  const now = Date.now();
  if (now - lastSummaryAt >= SUMMARY_INTERVAL_MS) {
    lastSummaryAt = now;
    logger.warn('[TENANT-FAILSOFT] resumo de ativações (zerar antes de ligar os cortes da Fase D)', {
      total: [...activations.values()].reduce((a, b) => a + b, 0),
      porCallSite: Object.fromEntries(activations),
    });
  }
}

/** Visível para testes/diagnóstico. */
export function getFailSoftActivations(): ReadonlyMap<string, number> {
  return activations;
}

export function resetFailSoftTelemetry(): void {
  activations.clear();
  lastSummaryAt = Date.now();
}
