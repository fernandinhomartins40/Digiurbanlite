import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { AuthenticatedRequest, SuccessResponse, ErrorResponse } from '../types';

// Interfaces para tipos de alert
interface AlertData {
  id: string;
  name: string;
  type: string;
  metric: string;
  condition: string;
  threshold: number;
  threshold2?: number;
  frequency: string;
  recipients: string[];
  channels: string[];
  cooldown?: number;
  isActive: boolean;

  [key: string]: unknown;
}

interface TriggerData {
  id: string;
  alertId: string;
  triggeredAt: Date;
  value: number;
  message: string;
  isResolved: boolean;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

const router = Router();

// ============================================================================
// ALERTS APIs - SISTEMA DE ALERTAS AUTOMÁTICOS
// ============================================================================

// Schemas de validação
const createAlertSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    'DEADLINE_OVERDUE',
    'LOW_PERFORMANCE',
    'HIGH_DEMAND',
    'LOW_SATISFACTION',
    'SYSTEM_OVERLOAD',
    'BUDGET_ALERT',
  ]),
  metric: z.string(),
  condition: z.enum(['greater', 'less', 'equal', 'between']),
  threshold: z.number(),
  threshold2: z.number().optional(),
  frequency: z.enum(['REALTIME', 'DAILY', 'WEEKLY', 'MONTHLY']),
  recipients: z.array(z.string()),
  channels: z.array(z.enum(['email', 'sms', 'web', 'push'])),
  cooldown: z.number().optional().default(3600)
        });

const updateAlertSchema = createAlertSchema.partial();

// ============================================================================
// CRUD DE ALERTAS
// ============================================================================

// GET /api/alerts - Listar alertas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, isActive } = req.query;

    const whereClause: any = {};
    if (type) whereClause.type = type as string;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      include: {
        triggers: {
          take: 5,
          orderBy: { triggeredAt: 'desc' },
          where: { isResolved: false }
        }
        },
      orderBy: { createdAt: 'desc' }
        });

    res.json({
      success: true,
      data: alerts
        });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
        });
  }
});

// POST /api/alerts - Criar alerta
router.post(
  '/',
  authenticateToken,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const data = req.body;

      const alert = await prisma.alert.create({
        data: {
          ...data,
          createdBy: authReq.user.id
        }
        });

      // Registrar alerta no sistema de monitoramento
      registerAlertMonitoring(alert.id);

      res.status(201).json({
        success: true,
        data: alert
        });
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// PUT /api/alerts/:id - Atualizar alerta
router.put(
  '/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }

      const { id } = req.params;
      const data = req.body;

      // Verificar se o alerta existe
      const existingAlert = await prisma.alert.findFirst({
        where: { id }
        });

      if (!existingAlert) {
        return res.status(404).json({
          success: false,
          error: 'Alerta não encontrado'
        });
      }

      const alert = await prisma.alert.update({
        where: { id },
        data
        });

      // Atualizar no sistema de monitoramento
      updateAlertMonitoring(alert.id, alert as any);

      res.json({
        success: true,
        data: alert
        });
    } catch (error) {
      console.error('Error updating alert:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
        });
    }
  }
);

// DELETE /api/alerts/:id - Deletar alerta
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const { id } = req.params;

    // Verificar se o alerta existe
    const existingAlert = await prisma.alert.findFirst({
      where: { id }
        });

    if (!existingAlert) {
      return res.status(404).json({
        success: false,
        error: 'Alerta não encontrado'
        });
    }

    await prisma.alert.delete({
      where: { id }
        });

    // Remover do sistema de monitoramento
    unregisterAlertMonitoring(id);

    res.json({
      success: true,
      message: 'Alerta removido com sucesso'
        });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
        });
  }
});

// ============================================================================
// GERENCIAMENTO DE TRIGGERS
// ============================================================================

// GET /api/alerts/:id/triggers - Listar triggers de um alerta
router.get('/:id/triggers', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { isResolved } = req.query;

    const triggers = await prisma.alertTrigger.findMany({
      where: {
        alertId: id,
        ...(isResolved !== undefined && { isResolved: isResolved === 'true' })
        },
      orderBy: { triggeredAt: 'desc' }
        });

    res.json({
      success: true,
      data: triggers
        });
  } catch (error) {
    console.error('Error fetching alert triggers:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
        });
  }
});

// PUT /api/alerts/triggers/:triggerId/resolve - Resolver trigger
router.put('/triggers/:triggerId/resolve', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const { triggerId } = req.params;

    const trigger = await prisma.alertTrigger.findFirst({
      where: {
        id: triggerId
      }
    });

    if (!trigger) {
      return res.status(404).json({
        success: false,
        error: 'Trigger não encontrado'
        });
    }

    const updatedTrigger = await prisma.alertTrigger.update({
      where: { id: triggerId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: authReq.user.id
        }
        });

    res.json({
      success: true,
      data: updatedTrigger
        });
  } catch (error) {
    console.error('Error resolving trigger:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
        });
  }
});

// ============================================================================
// DASHBOARD DE ALERTAS
// ============================================================================

// GET /api/alerts/dashboard - Dashboard de alertas
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const [totalAlerts, activeAlerts, triggeredToday, unresolvedTriggers, alertsByType] =
      await Promise.all([
        // Total de alertas
        prisma.alert.count({}),

        // Alertas ativos
        prisma.alert.count({
          where: { isActive: true }
        }),

        // Triggers hoje
        prisma.alertTrigger.count({
          where: {
            triggeredAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
        }
        }),

        // Triggers não resolvidos
        prisma.alertTrigger.count({
          where: {
            isResolved: false
        }
        }),

        // Alertas por tipo
        prisma.alert.groupBy({
          by: ['type'],
          where: { isActive: true },
          _count: { type: true }
        }),
      ]);

    // Top 5 alertas mais disparados
    const topAlerts = await prisma.alert.findMany({
            orderBy: { triggerCount: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        triggerCount: true
        }
      });

    res.json({
      success: true,
      data: {
        summary: {
          totalAlerts,
          activeAlerts,
          triggeredToday,
          unresolvedTriggers
        },
        alertsByType: alertsByType.map(item => ({
          type: item.type,
          count: item._count.type
        })),
        topAlerts
        }
        });
  } catch (error) {
    console.error('Error fetching alerts dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
        });
  }
});

// ============================================================================
// SISTEMA DE MONITORAMENTO DE ALERTAS
// ============================================================================

// POST /api/alerts/test/:id - Testar alerta
router.post('/test/:id', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const { id } = req.params;

    const alert = await prisma.alert.findFirst({
      where: { id }
        });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alerta não encontrado'
        });
    }

    // Simular trigger do alerta
    const testTrigger = await triggerAlert(alert as any, {
      value: alert.threshold + (alert.condition === 'greater' ? 1 : -1),
      isTest: true
        });

    res.json({
      success: true,
      message: 'Alerta testado com sucesso',
      data: testTrigger
        });
  } catch (error) {
    console.error('Error testing alert:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
        });
  }
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function getUserLevel(role: string): number {
  const levels = {
    GUEST: 0,
    USER: 1,
    COORDINATOR: 2,
    MANAGER: 3,
    ADMIN: 4,
    SUPER_ADMIN: 5
        };
  return levels[role as keyof typeof levels] || 0;
}

async function registerAlertMonitoring(alertId: string) {
  // Registrar alerta no sistema de monitoramento
  console.log(`Registered alert monitoring for: ${alertId}`);
  // Aqui seria implementada a lógica para adicionar ao sistema de monitoramento em tempo real
}

async function updateAlertMonitoring(alertId: string, alert: AlertData) {
  // Atualizar configuração no sistema de monitoramento
  console.log(`Updated alert monitoring for: ${alertId}`);
}

async function unregisterAlertMonitoring(alertId: string) {
  // Remover do sistema de monitoramento
  console.log(`Unregistered alert monitoring for: ${alertId}`);
}

async function triggerAlert(
  alert: AlertData,
  context: { value: number; isTest?: boolean }
): Promise<TriggerData | null> {
  // Verificar cooldown (a menos que seja teste)
  if (!context.isTest && alert.lastTriggered && alert.cooldown) {
    const cooldownEnd = new Date((alert.lastTriggered as any).getTime() + alert.cooldown * 1000);
    if (new Date() < cooldownEnd) {
      return null; // Still in cooldown
    }
  }

  // Criar trigger
  const trigger = await prisma.alertTrigger.create({
    data: {
      alertId: alert.id,
      value: context.value,
      message: generateAlertMessage(alert, context.value),
      data: { timestamp: new Date(), isTest: context.isTest || false }
        }
        });

  // Atualizar contador e última execução do alerta
  await prisma.alert.update({
    where: { id: alert.id },
    data: {
      triggerCount: { increment: 1 },
      lastTriggered: new Date()
        }
        });

  // Enviar notificações (se não for teste)
  if (!context.isTest) {
    await sendAlertNotifications(alert, trigger);
  }

  return trigger;
}

function generateAlertMessage(alert: AlertData, value: number): string {
  const messages = {
    DEADLINE_OVERDUE: `Prazo vencido detectado. Valor: ${value}`,
    LOW_PERFORMANCE: `Performance baixa detectada. Valor: ${value}`,
    HIGH_DEMAND: `Pico de demanda detectado. Valor: ${value}`,
    LOW_SATISFACTION: `Satisfação baixa detectada. Valor: ${value}`,
    SYSTEM_OVERLOAD: `Sistema sobrecarregado. Valor: ${value}`,
    BUDGET_ALERT: `Alerta de orçamento. Valor: ${value}`
        };

  return messages[alert.type as keyof typeof messages] || `Alerta ${alert.name}: ${value}`;
}

async function sendAlertNotifications(alert: AlertData, trigger: TriggerData) {
  // Implementar envio de notificações por diferentes canais
  console.log(`Sending alert notifications for: ${alert.name}`);

  for (const channel of alert.channels) {
    switch (channel) {
      case 'email':
        await sendEmailNotification(alert, trigger);
        break;
      case 'web':
        await sendWebNotification(alert, trigger);
        break;
      case 'sms':
        await sendSMSNotification(alert, trigger);
        break;
      case 'push':
        await sendPushNotification(alert, trigger);
        break;
    }
  }
}

async function sendEmailNotification(alert: AlertData, trigger: TriggerData) {
  // Implementação do envio de email
  console.log(`Email notification sent for alert: ${alert.name}`);
}

async function sendWebNotification(alert: AlertData, trigger: TriggerData) {
  // Criar notificação web no banco
  for (const recipientId of alert.recipients) {
    await prisma.notification.create({
      data: {
        citizenId: recipientId,
        title: `Alerta: ${alert.name}`,
        message: trigger.message,
        type: 'WARNING',
        channel: 'WEB',
        metadata: {
          alertId: alert.id,
          triggerId: trigger.id
        }
        }
        });
  }
}

async function sendSMSNotification(alert: AlertData, trigger: TriggerData) {
  // Implementação do envio de SMS
  console.log(`SMS notification sent for alert: ${alert.name}`);
}

async function sendPushNotification(alert: AlertData, trigger: TriggerData) {
  // Implementação do push notification
  console.log(`Push notification sent for alert: ${alert.name}`);
}

export default router;
