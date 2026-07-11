/**
 * ============================================================================
 * NOTIFICATION CRON JOBS - Jobs agendados para notificações
 * ============================================================================
 * Fase A Multi-Tenant: todo cron que toca dado municipal itera os tenants
 * ativos via forEachActiveTenant — sem isso, o fail-soft da Prisma extension
 * limitaria o processamento ao tenant default (risco R1 da auditoria).
 */

import cron from 'node-cron';
import NotificationTriggers from '../services/notification-triggers';
import { forEachActiveTenant } from '../lib/tenant-iterator';

/**
 * Verificar SLAs expirando (todo dia às 8h)
 */
cron.schedule('0 8 * * *', async () => {
  console.log('🔔 [Cron] Running SLA expiring check...');
  try {
    await forEachActiveTenant('sla-expiring', async () => {
      await NotificationTriggers.checkSLAExpiring();
    });
    console.log('✅ [Cron] SLA expiring check completed');
  } catch (error) {
    console.error('❌ [Cron] Error in SLA expiring check:', error);
  }
});

/**
 * Verificar protocolos vencidos (todo dia às 9h e 17h)
 */
cron.schedule('0 9,17 * * *', async () => {
  console.log('🔔 [Cron] Running overdue protocols check...');
  try {
    await forEachActiveTenant('overdue-protocols', async () => {
      await NotificationTriggers.checkOverdueProtocols();
    });
    console.log('✅ [Cron] Overdue protocols check completed');
  } catch (error) {
    console.error('❌ [Cron] Error in overdue protocols check:', error);
  }
});

/**
 * Lembretes de pendências dos protocolos (10h e 18h)
 */
cron.schedule('0 10,18 * * *', async () => {
  console.log('🔔 [Cron] Running protocol pending reminders...');
  try {
    const pendingService = await import('../services/protocol-pending.service');
    await forEachActiveTenant('pending-reminders', async (tenant) => {
      const result = await pendingService.processPendingReminders();
      console.log(`   ↳ [${tenant.slug}] pending reminders`, result);
    });
    console.log('✅ [Cron] Protocol pending reminders completed');
  } catch (error) {
    console.error('❌ [Cron] Error in protocol pending reminders:', error);
  }
});

/**
 * Expirar pendências muito antigas (1h15)
 */
cron.schedule('15 1 * * *', async () => {
  console.log('🔔 [Cron] Running stale pending expiration...');
  try {
    const pendingService = await import('../services/protocol-pending.service');
    await forEachActiveTenant('stale-pendings', async (tenant) => {
      const result = await pendingService.expireStalePendings();
      console.log(`   ↳ [${tenant.slug}] stale pendings`, result);
    });
    console.log('✅ [Cron] Stale pending expiration completed');
  } catch (error) {
    console.error('❌ [Cron] Error in stale pending expiration:', error);
  }
});

/**
 * Limpar jobs antigos da fila (todo dia à meia-noite)
 * Manutenção da fila BullMQ (Redis) — operação de PLATAFORMA, não itera tenants.
 */
cron.schedule('0 0 * * *', async () => {
  console.log('🔔 [Cron] Running queue cleanup...');
  try {
    const notificationService = (await import('../services/notification.service')).default;
    await notificationService.cleanOldJobs();
    console.log('✅ [Cron] Queue cleanup completed');
  } catch (error) {
    console.error('❌ [Cron] Error in queue cleanup:', error);
  }
});

console.log('✅ Notification cron jobs initialized');

export default {
  // Export para poder ser importado
};
