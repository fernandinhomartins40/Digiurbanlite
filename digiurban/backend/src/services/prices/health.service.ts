/**
 * Conferência diária das fontes oficiais (as APIs do governo mudam de endereço
 * e de formato sem aviso — foi o que derrubou o sistema antigo). O resultado
 * aparece no topo da tela de Pesquisa de preços.
 */

import { prisma } from '../../lib/prisma';
import { COMPRAS_BASE, DAY, PNCP_BASE, getJson, isoDay, sourceHttp } from './http';
import { BPS_URL } from './sources/bps';

export interface SourceHealth {
  name: string;
  ok: boolean;
  message: string;
}

export interface HealthReport {
  checkedAt: string;
  sources: SourceHealth[];
  catalogItems: number;
  bpsRows: number;
}

const KEY = 'prices:health';

async function check(name: string, fn: () => Promise<string>): Promise<SourceHealth> {
  try {
    return { name, ok: true, message: await fn() };
  } catch (error: any) {
    return { name, ok: false, message: error?.message || 'sem resposta' };
  }
}

export async function checkSources(): Promise<HealthReport> {
  const today = new Date();
  const from = isoDay(new Date(today.getTime() - 364 * DAY));
  const sources = await Promise.all([
    check('Compras.gov.br — pesquisa de preços', async () => {
      // papel A4 (CATMAT 461829): item comum, sempre tem compra no ano
      const data = await getJson<any>(`${COMPRAS_BASE}/modulo-pesquisa-preco/1_consultarMaterial`, {
        pagina: 1, tamanhoPagina: 10, tipo: 'codigoItemCatalogo', codigo: 461829, dataCompraInicio: from, dataCompraFim: isoDay(today),
      });
      if (!Array.isArray(data?.resultado)) throw new Error('formato da resposta mudou');
      return `${data.totalRegistros} preços de teste`;
    }),
    check('PNCP', async () => {
      const data = await getJson<any>(`${PNCP_BASE}/api/search/`, { tipos_documento: 'edital', pagina: 1, tam_pagina: 1, q: 'papel', status: 'encerradas' });
      if (!Array.isArray(data?.items)) throw new Error('formato da resposta mudou');
      return 'busca respondendo';
    }),
    check('Banco de Preços em Saúde', async () => {
      const response = await sourceHttp.head(BPS_URL(today.getUTCFullYear()), { timeout: 30_000 });
      const modified = response.headers['last-modified'] ? new Date(String(response.headers['last-modified'])) : null;
      if (modified && today.getTime() - modified.getTime() > 45 * DAY) throw new Error(`arquivo sem atualização desde ${modified.toLocaleDateString('pt-BR')}`);
      return modified ? `atualizado em ${modified.toLocaleDateString('pt-BR')}` : 'arquivo disponível';
    }),
    check('IPCA (Banco Central)', async () => {
      const data = await getJson<any[]>('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1', { formato: 'json' });
      if (!Array.isArray(data) || !data[0]?.data) throw new Error('formato da resposta mudou');
      return `último índice: ${data[0].data.slice(3)}`;
    }),
  ]);
  const [catalogItems, bpsRows] = await Promise.all([
    prisma.priceCatalogEntry.count({ where: { kind: { in: ['PDM', 'SERVICO'] } } }),
    prisma.priceBpsEntry.count(),
  ]);
  const report: HealthReport = { checkedAt: new Date().toISOString(), sources, catalogItems, bpsRows };
  const expiresAt = new Date(Date.now() + 3 * DAY);
  await prisma.priceSourceCache.upsert({ where: { key: KEY }, create: { key: KEY, payload: report as any, expiresAt }, update: { payload: report as any, expiresAt } });
  return report;
}

export async function lastHealth(): Promise<HealthReport | null> {
  const row = await prisma.priceSourceCache.findUnique({ where: { key: KEY } }).catch(() => null);
  return (row?.payload as unknown as HealthReport) || null;
}
