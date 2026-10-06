/**
 * Leitura automática dos documentos enviados (a cada 2 minutos) — ver
 * services/doc-reading/doc-reading.service.ts. Desligável no painel
 * (Super-admin › Privacidade › Documentos).
 */

import cron from 'node-cron';
import { runDocReadingSweep } from '../services/doc-reading/doc-reading.service';

export function initDocReadingJob() {
  cron.schedule('*/2 * * * *', async () => {
    try {
      const result = await runDocReadingSweep();
      if (result.read > 0) console.log(`[JOB] Leitura de documentos: ${result.read} lido(s)`);
    } catch (error: any) {
      console.error('[JOB] ❌ Erro na leitura de documentos:', error?.message || error);
    }
  });
  console.log('✅ Job de leitura de documentos iniciado (a cada 2 minutos)');
}
