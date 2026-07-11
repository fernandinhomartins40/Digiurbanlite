/**
 * CRON JOB: Reset de Contadores de Email
 *
 * Responsável por resetar os contadores diários e mensais das contas de email
 *
 * Execuções:
 * - Todo dia à meia-noite: Reset de contadores diários
 * - Todo dia 1 à meia-noite: Reset de contadores mensais
 */

import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';

/**
 * Fase A Multi-Tenant: jobs de e-mail são operação de PLATAFORMA — os models
 * Email* não têm tenantId e o AuditLog resultante fica sem carimbo de tenant
 * (evento de plataforma). O wrapper evita o fail-soft para o tenant default.
 */
const asPlatform = (fn: () => Promise<void>) => () => runAsPlatform(fn);

/**
 * Reset diário dos contadores de emails enviados
 * Executa todo dia às 00:00
 */
export const resetDailyEmailCounters = cron.schedule('0 0 * * *', asPlatform(async () => {
  try {
    console.log('[CRON] Iniciando reset de contadores diários de email...');

    const result = await prisma.emailUser.updateMany({
      data: {
        sentToday: 0
      }
    });

    console.log(`[CRON] ✅ ${result.count} contas tiveram contadores diários resetados`);

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'DAILY_EMAIL_COUNTERS_RESET',
        resource: 'email_counters',
        details: {
          accountsReset: result.count,
          type: 'daily'
        },
        ip: 'cron-job',
        success: true
      }
    });
  } catch (error) {
    console.error('[CRON] ❌ Erro ao resetar contadores diários:', error);

    // Log de erro
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'DAILY_EMAIL_COUNTERS_RESET_FAILED',
        resource: 'email_counters',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'daily'
        },
        ip: 'cron-job',
        success: false
      }
    }).catch(err => console.error('[CRON] Failed to log error:', err));
  }
}));

/**
 * Reset mensal dos contadores de emails enviados
 * Executa todo dia 1 do mês às 00:00
 */
export const resetMonthlyEmailCounters = cron.schedule('0 0 1 * *', asPlatform(async () => {
  try {
    console.log('[CRON] Iniciando reset de contadores mensais de email...');

    const result = await prisma.emailUser.updateMany({
      data: {
        sentThisMonth: 0
      }
    });

    console.log(`[CRON] ✅ ${result.count} contas tiveram contadores mensais resetados`);

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'MONTHLY_EMAIL_COUNTERS_RESET',
        resource: 'email_counters',
        details: {
          accountsReset: result.count,
          type: 'monthly'
        },
        ip: 'cron-job',
        success: true
      }
    });
  } catch (error) {
    console.error('[CRON] ❌ Erro ao resetar contadores mensais:', error);

    // Log de erro
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'MONTHLY_EMAIL_COUNTERS_RESET_FAILED',
        resource: 'email_counters',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'monthly'
        },
        ip: 'cron-job',
        success: false
      }
    }).catch(err => console.error('[CRON] Failed to log error:', err));
  }
}));

/**
 * Verificar e atualizar status de subscriptions expiradas
 * Executa todo dia às 02:00
 */
export const checkExpiredSubscriptions = cron.schedule('0 2 * * *', asPlatform(async () => {
  try {
    console.log('[CRON] Verificando subscriptions expiradas...');

    const now = new Date();

    // Encontrar trials expirados
    const expiredTrials = await prisma.emailSubscription.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: {
          lte: now
        }
      },
      include: {
        emailServer: true
      }
    });

    for (const subscription of expiredTrials) {
      // Atualizar status para SUSPENDED
      await prisma.emailSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'SUSPENDED'
        }
      });

      // Desativar servidor de email
      await prisma.emailServer.update({
        where: { id: subscription.emailServerId },
        data: {
          isActive: false
        }
      });

      console.log(`[CRON] ⚠️  Trial expirado: ${subscription.emailServer.hostname}`);
    }

    // Encontrar subscriptions com período vencido
    const expiredSubscriptions = await prisma.emailSubscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          lte: now
        }
      },
      include: {
        emailServer: true
      }
    });

    for (const subscription of expiredSubscriptions) {
      // Atualizar status para EXPIRED
      await prisma.emailSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'EXPIRED'
        }
      });

      // Desativar servidor de email
      await prisma.emailServer.update({
        where: { id: subscription.emailServerId },
        data: {
          isActive: false
        }
      });

      console.log(`[CRON] ⚠️  Subscription expirada: ${subscription.emailServer.hostname}`);
    }

    console.log(`[CRON] ✅ ${expiredTrials.length} trials e ${expiredSubscriptions.length} subscriptions expiradas processadas`);

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'SUBSCRIPTIONS_EXPIRY_CHECK',
        resource: 'email_subscriptions',
        details: {
          expiredTrials: expiredTrials.length,
          expiredSubscriptions: expiredSubscriptions.length
        },
        ip: 'cron-job',
        success: true
      }
    });
  } catch (error) {
    console.error('[CRON] ❌ Erro ao verificar subscriptions expiradas:', error);

    await prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'SUBSCRIPTIONS_EXPIRY_CHECK_FAILED',
        resource: 'email_subscriptions',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        ip: 'cron-job',
        success: false
      }
    }).catch(err => console.error('[CRON] Failed to log error:', err));
  }
}));

/**
 * Iniciar todos os cron jobs de email
 */
export function startEmailCronJobs() {
  console.log('📅 Iniciando cron jobs de email...');

  resetDailyEmailCounters.start();
  console.log('  ✅ Reset diário de contadores agendado (00:00)');

  resetMonthlyEmailCounters.start();
  console.log('  ✅ Reset mensal de contadores agendado (Dia 1 às 00:00)');

  checkExpiredSubscriptions.start();
  console.log('  ✅ Verificação de subscriptions expiradas agendada (02:00)');

  console.log('📅 Todos os cron jobs de email iniciados com sucesso!');
}

/**
 * Parar todos os cron jobs de email
 */
export function stopEmailCronJobs() {
  console.log('🛑 Parando cron jobs de email...');

  resetDailyEmailCounters.stop();
  resetMonthlyEmailCounters.stop();
  checkExpiredSubscriptions.stop();

  console.log('🛑 Todos os cron jobs de email parados!');
}
