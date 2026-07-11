/**
 * ============================================================================
 * JOB: VERIFICAÇÃO DE CATEGORIAS EXPIRADAS
 * ============================================================================
 * Job que roda periodicamente para:
 * - Marcar categorias expiradas
 * - Desativar categorias se configurado
 * - Enviar notificações de renovação
 * ============================================================================
 */

import * as categoryService from '../services/citizen-category-expanded.service';
import { prisma } from '../lib/prisma';
import { forEachActiveTenant } from '../lib/tenant-iterator';

/**
 * Verifica e marca categorias expiradas
 */
export async function checkExpiredCategories() {
  console.log('🔍 [Job] Verificando categorias expiradas...');

  try {
    const result = await categoryService.checkAndMarkExpiredCategories();

    console.log(`✅ [Job] Verificação concluída: ${result.total} categoria(s) expirada(s)`);

    if (result.total > 0) {
      console.log('📋 [Job] Categorias expiradas:');
      for (const expired of result.expired) {
        console.log(`   - ${expired.categoryCode} (assignment: ${expired.assignmentId})`);
        if (expired.autoDeactivated) {
          console.log(`     ⚠️  Desativada automaticamente`);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('❌ [Job] Erro ao verificar categorias expiradas:', error);
    throw error;
  }
}

/**
 * Envia lembretes de renovação para categorias próximas do vencimento
 */
export async function sendRenewalReminders() {
  console.log('📧 [Job] Enviando lembretes de renovação...');

  try {
    // Buscar categorias que precisam de renovação nos próximos 30 dias
    const needingRenewal = await categoryService.getCategoriesNeedingRenewal(30);

    console.log(`📊 [Job] Encontradas ${needingRenewal.length} categoria(s) precisando renovação`);

    let remindersCreated = 0;

    for (const assignment of needingRenewal) {
      // Verificar se já existe notificação recente
      const recentNotification = await prisma.notification.findFirst({
        where: {
          citizenId: assignment.citizenId,
          type: 'CATEGORY_RENEWAL_REMINDER',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
          },
          metadata: {
            path: ['assignmentId'],
            equals: assignment.id,
          },
        },
      });

      if (recentNotification) {
        console.log(`   ℹ️  Lembrete já enviado recentemente para ${assignment.category.name}`);
        continue;
      }

      // Calcular dias até expiração
      const daysUntilExpiry = assignment.expiresAt
        ? Math.ceil((assignment.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      // Criar notificação
      await prisma.notification.create({
        data: {
          citizenId: assignment.citizenId,
          type: 'CATEGORY_RENEWAL_REMINDER',
          title: `Renovação de Categoria: ${assignment.category.name}`,
          message: `Sua categoria "${assignment.category.name}" expira em ${daysUntilExpiry} dia(s). Clique para renovar.`,
          isRead: false,
          metadata: {
            assignmentId: assignment.id,
            categoryId: assignment.categoryId,
            categoryCode: assignment.category.code,
            expiresAt: assignment.expiresAt,
            daysUntilExpiry,
            priority: daysUntilExpiry <= 7 ? 'HIGH' : 'MEDIUM', // Moved to metadata
          },
        },
      });

      remindersCreated++;
      console.log(`   ✉️  Lembrete enviado: ${assignment.category.name} (${daysUntilExpiry} dias)`);
    }

    console.log(`✅ [Job] ${remindersCreated} lembrete(s) de renovação criado(s)`);

    return {
      total: needingRenewal.length,
      remindersSent: remindersCreated,
    };
  } catch (error) {
    console.error('❌ [Job] Erro ao enviar lembretes:', error);
    throw error;
  }
}

/**
 * Verifica progressão automática de categorias
 */
export async function checkCategoryProgression() {
  console.log('⬆️  [Job] Verificando progressão de categorias...');

  try {
    // Buscar todas as atribuições ativas com categorias que têm progressão
    const assignments = await prisma.citizenCategoryAssignment.findMany({
      where: {
        active: true,
        category: {
          hasProgression: true,
        },
      },
      include: {
        category: true,
        citizen: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`📊 [Job] Verificando ${assignments.length} atribuição(ões) com progressão`);

    let progressionsApplied = 0;

    for (const assignment of assignments) {
      // Verificar se pode progredir
      const check = await categoryService.checkProgression(assignment.id);

      if (check.canProgress && check.nextCategory) {
        console.log(`   ⬆️  ${assignment.citizen.name} pode progredir para: ${check.nextCategory.name}`);

        // Aplicar progressão automaticamente
        try {
          await categoryService.applyProgression(assignment.id);
          progressionsApplied++;

          // Criar notificação
          await prisma.notification.create({
            data: {
              citizenId: assignment.citizenId,
              type: 'CATEGORY_UPGRADED',
              title: 'Parabéns! Você evoluiu de categoria!',
              message: `Sua categoria "${assignment.category.name}" foi promovida para "${check.nextCategory.name}"!`,
              isRead: false,
              metadata: {
                fromCategory: assignment.category.code,
                toCategory: check.nextCategory.code,
                priority: 'HIGH', // Moved to metadata
              },
            },
          });

          console.log(`   ✅ Progressão aplicada com sucesso`);
        } catch (error) {
          console.error(`   ❌ Erro ao aplicar progressão:`, error);
        }
      }
    }

    console.log(`✅ [Job] ${progressionsApplied} progressão(ões) aplicada(s)`);

    return {
      total: assignments.length,
      progressionsApplied,
    };
  } catch (error) {
    console.error('❌ [Job] Erro ao verificar progressão:', error);
    throw error;
  }
}

/**
 * Job principal que executa todas as verificações
 * Fase A Multi-Tenant: itera os tenants ativos — categorias são dado municipal.
 */
export async function runCategoryMaintenanceJob() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 INICIANDO JOB DE MANUTENÇÃO DE CATEGORIAS');
  console.log('='.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    const totals = { expired: 0, reminders: 0, progressions: 0 };

    const summary = await forEachActiveTenant('category-maintenance', async (tenant) => {
      console.log(`\n🏛️  Tenant: ${tenant.slug}`);

      // 1. Verificar categorias expiradas
      const expiredResult = await checkExpiredCategories();

      // 2. Enviar lembretes de renovação
      const remindersResult = await sendRenewalReminders();

      // 3. Verificar progressão
      const progressionResult = await checkCategoryProgression();

      totals.expired += expiredResult.total;
      totals.reminders += remindersResult.remindersSent;
      totals.progressions += progressionResult.progressionsApplied;
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('✅ JOB CONCLUÍDO COM SUCESSO');
    console.log('='.repeat(80));
    console.log(`⏱️  Duração: ${duration}s`);
    console.log(`📊 Resumo (${summary.succeeded}/${summary.total} tenants):`);
    console.log(`   - Categorias expiradas: ${totals.expired}`);
    console.log(`   - Lembretes enviados: ${totals.reminders}`);
    console.log(`   - Progressões aplicadas: ${totals.progressions}`);
    console.log('='.repeat(80) + '\n');

    return {
      success: summary.failed.length === 0,
      duration,
      expired: totals.expired,
      reminders: totals.reminders,
      progressions: totals.progressions,
      tenants: summary,
    };
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ JOB FALHOU');
    console.error('='.repeat(80));
    console.error(error);
    console.error('='.repeat(80) + '\n');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Permitir execução direta do script
if (require.main === module) {
  runCategoryMaintenanceJob()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default {
  checkExpiredCategories,
  sendRenewalReminders,
  checkCategoryProgression,
  runCategoryMaintenanceJob,
};
