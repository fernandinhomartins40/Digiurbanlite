/**
 * Job para reverter delegações de protocolos expiradas
 * Executa automaticamente a cada hora
 */

import cron from 'node-cron';
import { revertExpiredDelegations } from '../services/protocolAssignmentService';

/**
 * Inicializar job de reversão de delegações
 * Executa todos os dias às 00:00, 06:00, 12:00 e 18:00
 */
export function initRevertExpiredDelegationsJob() {
  // Executar a cada 6 horas (00:00, 06:00, 12:00, 18:00)
  cron.schedule('0 */6 * * *', async () => {
    console.log('[JOB] Iniciando reversão de delegações expiradas...');

    try {
      const result = await revertExpiredDelegations();

      console.log(`[JOB] ✅ Delegações processadas: ${result.processedCount}`);

      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;

      console.log(`[JOB] ✅ Sucesso: ${successCount} | ❌ Falhas: ${failCount}`);

      if (failCount > 0) {
        console.error('[JOB] Falhas:', result.results.filter(r => !r.success));
      }
    } catch (error: any) {
      console.error('[JOB] ❌ Erro ao reverter delegações:', error.message);
    }
  });

  console.log('✅ Job de reversão de delegações iniciado (executa a cada 6 horas)');
}

/**
 * Executar job manualmente (para testes ou execução sob demanda)
 */
export async function runRevertExpiredDelegationsManually() {
  console.log('[MANUAL] Iniciando reversão de delegações expiradas...');

  try {
    const result = await revertExpiredDelegations();

    console.log(`[MANUAL] ✅ Delegações processadas: ${result.processedCount}`);

    return result;
  } catch (error: any) {
    console.error('[MANUAL] ❌ Erro ao reverter delegações:', error.message);
    throw error;
  }
}
