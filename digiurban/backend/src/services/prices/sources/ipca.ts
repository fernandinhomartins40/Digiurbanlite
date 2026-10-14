/**
 * IPCA mensal (IBGE) pela série 433 do Banco Central (SGS), sem chave.
 * Usado para atualizar os preços até hoje (IN 65/2021, art. 5º, II).
 */

import { DAY, cached, getJson } from '../http';
import type { MonthlyRate } from '../rules';

export async function ipcaRates(): Promise<MonthlyRate[]> {
  try {
    return await cached('bcb:ipca', DAY, async () => {
      const start = new Date(Date.now() - 3 * 366 * DAY);
      const end = new Date();
      const br = (date: Date) => `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
      // sem dataFinal a API do Banco Central não responde (conferido em 2026-10-14)
      const data = await getJson<Array<{ data: string; valor: string }>>('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados', {
        formato: 'json',
        dataInicial: `01/${String(start.getUTCMonth() + 1).padStart(2, '0')}/${start.getUTCFullYear()}`,
        dataFinal: br(end),
      });
      return (Array.isArray(data) ? data : [])
        .map((row) => {
          const [, month, year] = String(row.data).split('/');
          return { month: `${year}-${month}`, rate: Number(String(row.valor).replace(',', '.')) };
        })
        .filter((row) => /^\d{4}-\d{2}$/.test(row.month) && Number.isFinite(row.rate));
    });
  } catch {
    return []; // sem IPCA: preços sem correção (o documento diz isso)
  }
}
