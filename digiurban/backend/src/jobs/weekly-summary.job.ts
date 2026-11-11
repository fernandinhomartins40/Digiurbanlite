/**
 * Resumo da semana do Gabinete: segunda-feira a partir das 8h (Brasília).
 * Roda de hora em hora até as 18h: se o servidor estava fora às 8h o aviso
 * ainda sai no dia; a conferência por semana em sendWeeklySummary impede
 * repetir.
 */

import cron from 'node-cron';
import { forEachActiveTenant } from '../lib/tenant-iterator';
import { sendWeeklySummary } from '../services/city-numbers/weekly-summary.service';

export function initWeeklySummaryJob() {
  cron.schedule(
    '0 8-18 * * 1',
    async () => {
      await forEachActiveTenant('weekly-summary', async () => {
        await sendWeeklySummary();
      }).catch((error) => console.error('[gabinete] resumo da semana:', error));
    },
    { timezone: 'America/Sao_Paulo' }
  );
}
