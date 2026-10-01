/**
 * Job diário (03:30) do prazo de guarda das conversas — ver
 * services/privacy-retention.service.ts. Só age se ativado no painel
 * (Super-admin › Privacidade); desligado por padrão.
 */

import cron from 'node-cron';
import { getRetentionSettings, runRetention } from '../services/privacy-retention.service';

export function initPrivacyRetentionJob() {
  cron.schedule('30 3 * * *', async () => {
    try {
      const settings = await getRetentionSettings();
      if (!settings.enabled) return;
      const r = await runRetention();
      console.log(
        `[JOB] Prazo de guarda: bot ${r.botMessages} | chat ${r.chatMessages} | fluxos ${r.flowStates} | ` +
          `bot antigo ${r.legacyBotMessages} | assistente ${r.assistantConversations}`
      );
    } catch (error: any) {
      console.error('[JOB] ❌ Erro no prazo de guarda das conversas:', error?.message || error);
    }
  });
  console.log('✅ Job de prazo de guarda das conversas iniciado (diário às 03:30)');
}
