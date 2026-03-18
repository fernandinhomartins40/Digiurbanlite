/**
 * ============================================================================
 * NOTIFICATION CRON JOBS - Jobs agendados para notificações
 * ============================================================================
 */

import cron from 'node-cron';
import NotificationTriggers from '../services/notification-triggers';

/**
 * Verificar SLAs expirando (todo dia às 8h)
 */
cron.schedule('0 8 * * *', async () => {
  console.log('🔔 [Cron] Running SLA expiring check...');
  try {
    await NotificationTriggers.checkSLAExpiring();
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
    await NotificationTriggers.checkOverdueProtocols();
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
    const result = await pendingService.processPendingReminders();
    console.log('✅ [Cron] Protocol pending reminders completed', result);
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
    const result = await pendingService.expireStalePendings();
    console.log('✅ [Cron] Stale pending expiration completed', result);
  } catch (error) {
    console.error('❌ [Cron] Error in stale pending expiration:', error);
  }
});

/**
 * Limpar jobs antigos da fila (todo dia à meia-noite)
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
