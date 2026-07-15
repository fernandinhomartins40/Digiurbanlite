/**
 * ============================================================================
 * REGISTRY F3 — Shadow-read (comparação de paridade em background)
 * ============================================================================
 * Compara, sem afetar a resposta ao usuário, a contagem do caminho ATUAL
 * (protocolos por moduleType) com a do Registry (EntityRecords do EntityType).
 * Loga divergências por tenant/módulo para provar paridade ANTES de virar a
 * chave de leitura (REGISTRY_READ=on). Ver PLANO-IMPLEMENTACAO-REGISTRY.md (F3).
 *
 * A flag REGISTRY_READ controla o modo:
 *   off     (default) → não faz nada;
 *   shadow            → compara em background e loga;
 *   on                → (F4+) leitura servida pelo Registry.
 * ============================================================================
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

export type RegistryReadMode = 'off' | 'shadow' | 'on';

/** Resolve o modo de leitura do Registry para o tenant atual (env global v1). */
export function getRegistryReadMode(): RegistryReadMode {
  const raw = String(process.env.REGISTRY_READ ?? 'off').trim().toLowerCase();
  if (raw === 'shadow' || raw === 'on') return raw;
  return 'off';
}

/**
 * Dispara a comparação sem bloquear a resposta. Recebe o total já calculado
 * pelo caminho atual e conta o equivalente no Registry. Nunca lança — qualquer
 * erro é logado como aviso e engolido (shadow-read não pode afetar produção).
 */
export function shadowCompareCount(params: {
  moduleType: string;
  currentTotal: number;
  where?: Record<string, unknown>;
}): void {
  // Não await: roda em background.
  void (async () => {
    try {
      const entityType = await prisma.entityType.findFirst({
        where: { code: params.moduleType },
        select: { id: true },
      });
      if (!entityType) {
        logger.info('[registry-shadow] EntityType ausente (backfill/F1 pendente?)', {
          moduleType: params.moduleType,
        });
        return;
      }

      const registryTotal = await prisma.entityRecord.count({
        where: { entityTypeId: entityType.id },
      });

      const diff = registryTotal - params.currentTotal;
      const parity = params.currentTotal === 0 ? (registryTotal === 0 ? 1 : 0) : registryTotal / params.currentTotal;

      if (diff === 0) {
        logger.info('[registry-shadow] paridade OK', {
          moduleType: params.moduleType,
          total: params.currentTotal,
        });
      } else {
        logger.warn('[registry-shadow] DIVERGÊNCIA', {
          moduleType: params.moduleType,
          currentTotal: params.currentTotal,
          registryTotal,
          diff,
          parity: Number(parity.toFixed(4)),
        });
      }
    } catch (error) {
      logger.warn('[registry-shadow] falha na comparação (ignorada)', {
        moduleType: params.moduleType,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();
}
