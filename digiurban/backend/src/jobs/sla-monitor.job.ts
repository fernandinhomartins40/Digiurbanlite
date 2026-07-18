/**
 * Job de monitoramento de SLA e pendências.
 *
 * Antes deste job, NADA marcava SLAs como atrasados (isOverdue só mudava num
 * endpoint manual por protocolo) — dashboards de atraso mostravam zero.
 *
 * Diariamente às 06:00, por tenant ativo:
 * 1. Marca isOverdue/daysOverdue dos SLAs ativos vencidos (e corrige flags
 *    obsoletas de SLAs pausados);
 * 2. Envia lembretes de pendências próximas do prazo/vencidas;
 * 3. Expira pendências paradas há mais de 30 dias do prazo.
 */

import cron from 'node-cron';
import { differenceInCalendarDays } from 'date-fns';
import { prisma } from '../lib/prisma';
import { forEachActiveTenant } from '../lib/tenant-iterator';
import {
  processPendingReminders,
  expireStalePendings
} from '../services/protocol-pending.service';

export async function runSlaMonitorForCurrentTenant() {
  const now = new Date();

  // SLAs ativos (não finalizados, não pausados) vencidos
  const overdueCandidates = await prisma.protocolSLA.findMany({
    where: {
      actualEndDate: null,
      isPaused: false,
      expectedEndDate: { lt: now }
    },
    select: { protocolId: true, expectedEndDate: true, isOverdue: true, daysOverdue: true }
  });

  let updated = 0;
  for (const sla of overdueCandidates) {
    const daysOverdue = Math.max(1, differenceInCalendarDays(now, sla.expectedEndDate));
    if (!sla.isOverdue || sla.daysOverdue !== daysOverdue) {
      await prisma.protocolSLA.update({
        where: { protocolId: sla.protocolId },
        data: { isOverdue: true, daysOverdue }
      });
      updated++;
    }
  }

  // SLA pausado não conta como atrasado — limpar flag obsoleta
  const cleared = await prisma.protocolSLA.updateMany({
    where: {
      actualEndDate: null,
      isPaused: true,
      isOverdue: true
    },
    data: { isOverdue: false, daysOverdue: 0 }
  });

  const reminders = await processPendingReminders();
  const expired = await expireStalePendings(30);

  return {
    overdueChecked: overdueCandidates.length,
    overdueUpdated: updated,
    pausedCleared: cleared.count,
    reminders,
    expiredCount: expired.expiredCount
  };
}

/**
 * Inicializar job de monitoramento de SLA (diário às 06:00)
 */
export function initSlaMonitorJob() {
  cron.schedule('0 6 * * *', async () => {
    console.log('[JOB] Iniciando monitoramento de SLA...');

    try {
      await forEachActiveTenant('sla-monitor', async (tenant) => {
        const result = await runSlaMonitorForCurrentTenant();
        console.log(
          `[JOB] [${tenant.slug}] SLA: ${result.overdueUpdated}/${result.overdueChecked} marcados em atraso | ` +
          `lembretes: ${result.reminders.upcomingSent + result.reminders.overdueSent} | ` +
          `pausados corrigidos: ${result.pausedCleared}`
        );
      });
    } catch (error: any) {
      console.error('[JOB] ❌ Erro no monitoramento de SLA:', error.message);
    }
  });

  console.log('✅ Job de monitoramento de SLA iniciado (diário às 06:00)');
}
