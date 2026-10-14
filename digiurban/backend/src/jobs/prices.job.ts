/**
 * Rotinas da pesquisa de preços (dados públicos, da plataforma):
 *  - ao subir: catálogo vazio → copia famílias e serviços; itens de material
 *    incompletos → continua a cópia (~45 min a primeira vez); BPS vazio → copia o ano
 *  - todo dia 04:40 (UTC): BPS do ano atual e do anterior + conferência das fontes
 *  - todo domingo 05:10 (UTC): catálogo de famílias (PDM), serviços e itens novos
 *  - todo dia 05:30 (UTC): limpa respostas vencidas guardadas das fontes
 */

import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';
import logger from '../config/logger.config';
import { catalogSize, syncCatalogKind, syncMaterialItems } from '../services/prices/catalog.service';
import { importBpsYear } from '../services/prices/sources/bps';
import { checkSources } from '../services/prices/health.service';

let catalogRunning = false;

export async function syncCatalog(options: { families?: boolean; items?: boolean; fresh?: boolean } = { families: true, items: true }): Promise<void> {
  if (catalogRunning) return;
  catalogRunning = true;
  try {
    if (options.families) {
      await syncCatalogKind('SERVICO');
      await syncCatalogKind('PDM');
    }
    if (options.items) await syncMaterialItems(options.fresh);
  } finally {
    catalogRunning = false;
  }
}

export async function syncBps(): Promise<void> {
  const year = new Date().getUTCFullYear();
  for (const target of [year, year - 1]) {
    try {
      const rows = await importBpsYear(target);
      logger.info(`[prices] BPS ${target}: ${rows} linhas`);
    } catch (error: any) {
      logger.warn(`[prices] BPS ${target} não copiado`, { error: String(error?.message || error) });
    }
  }
}

const quietly = (label: string, fn: () => Promise<unknown>) => () => {
  runAsPlatform(fn).catch((error: any) => logger.warn(`[prices] ${label}`, { error: String(error?.message || error) }));
};

export function initPricesJob(): void {
  // espera o servidor assentar antes de baixar dados pesados
  setTimeout(
    quietly('carga inicial', async () => {
      if ((await prisma.priceBpsEntry.count()) === 0) await syncBps();
      await checkSources();
      // itens de material: começa ou continua a cópia (retoma da página guardada)
      const progress = await prisma.priceSourceCache.findUnique({ where: { key: 'prices:catalog-material-page' } });
      const finished = !!(progress?.payload as any)?.doneAt;
      await syncCatalog({ families: (await catalogSize()) === 0, items: !finished });
    }),
    2 * 60 * 1000
  );
  cron.schedule('40 4 * * *', quietly('rotina diária', async () => {
    await syncBps();
    await checkSources();
    // cópia dos itens parou no meio (fonte fora do ar)? continua de onde parou
    const progress = await prisma.priceSourceCache.findUnique({ where: { key: 'prices:catalog-material-page' } });
    if (!(progress?.payload as any)?.doneAt) await syncCatalog({ items: true });
  }));
  cron.schedule('10 5 * * 0', quietly('catálogo semanal', () => syncCatalog({ families: true, items: true, fresh: true })));
  cron.schedule('30 5 * * *', quietly('limpeza do cache', () => prisma.priceSourceCache.deleteMany({ where: { expiresAt: { lt: new Date() }, NOT: { key: 'prices:health' } } })));
}
