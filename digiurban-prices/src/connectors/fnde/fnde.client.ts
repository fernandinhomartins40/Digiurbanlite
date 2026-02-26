import { logger } from '../../utils/logger';
import type { FndeContrato, FndeFetchOptions } from './fnde.types';

// FNDE — Situação em fev/2026:
// - API SIGECON (sigecon-web/api/v1): retorna 404 — descontinuada
// - Portal dadosabertos.fnde.gov.br: redireciona para dados.gov.br que exige JS
// - Painel de Preços PNAE: descontinuado em julho/2025 (Comunicado nº 30/25)
// - Dados de repasses financeiros disponíveis via Olinda OData, mas sem preços/itens
//
// Os dados de compras do FNDE estão incorporados na API ComprasNet v2
// (api.compras.dados.gov.br) via contratos SIASG — não há fonte separada.
// Este conector é mantido como stub para não quebrar o orquestrador.

export class FndeClient {
  // FNDE não tem API pública de preços/itens disponível em 2026.
  // Os contratos do FNDE aparecem na ingestão ComprasNet via SIASG.
  async fetchContratosAlimentacao(_options: FndeFetchOptions = {}): Promise<FndeContrato[]> {
    logger.info('[FNDE] Fonte indisponível: API de preços PNAE descontinuada em jul/2025 (Comunicado nº 30/25). Dados do FNDE são cobertos pelo conector ComprasNet/SIASG.');
    return [];
  }

  async ping(): Promise<boolean> {
    return false;
  }
}

let instance: FndeClient | null = null;
export function getFndeClient(): FndeClient {
  if (!instance) instance = new FndeClient();
  return instance;
}
