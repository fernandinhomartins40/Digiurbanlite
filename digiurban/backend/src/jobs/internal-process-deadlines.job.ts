/**
 * Rotina diária (8h, Brasília): processos internos com etapa de contratação
 * (Lei 14.133) com prazo vencido avisam a unidade — uma vez por etapa.
 */

import cron from 'node-cron';
import { forEachActiveTenant } from '../lib/tenant-iterator';
import { notifyOverdueStages } from '../services/internal-process/flows/flow.service';

export function initInternalProcessDeadlinesJob() {
  cron.schedule(
    '0 8 * * 1-5',
    async () => {
      await forEachActiveTenant('internal-process-deadlines', async () => {
        await notifyOverdueStages();
      }).catch((error) => console.error('[processo-interno] rotina de prazos:', error));
    },
    { timezone: 'America/Sao_Paulo' }
  );
}
