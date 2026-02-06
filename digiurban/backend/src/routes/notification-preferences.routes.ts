/**
 * ============================================================================
 * NOTIFICATION PREFERENCES ROUTES - Gerenciar preferências de notificações
 * ============================================================================
 */

import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';

const router = Router();

// Schema de validação
const preferencesSchema = z.object({
  webEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  preferences: z.record(z.string(), z.object({
    web: z.boolean().optional(),
    push: z.boolean().optional(),
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
  })).optional(),
  quietHoursStart: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  quietHoursEnd: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
  dailyDigest: z.boolean().optional(),
  dailyDigestTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().nullable(),
});

/**
 * GET /api/notifications/preferences
 * Obter preferências de notificações do usuário
 */
router.get('/preferences', adminAuthMiddleware, async (req: any, res) => {
  try {
    const recipientType = req.user ? 'user' : 'citizen';
    const recipientId = req.user?.id || req.citizen?.id;

    if (!recipientId) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    let prefs = await prisma.notificationPreference.findUnique({
      where: recipientType === 'citizen' ? { citizenId: recipientId } : { userId: recipientId },
    });

    // Criar preferências padrão se não existir
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          [recipientType === 'citizen' ? 'citizenId' : 'userId']: recipientId,
          webEnabled: true,
          pushEnabled: false,
          emailEnabled: true,
          smsEnabled: false,
          preferences: {},
        },
      });
    }

    res.json({
      success: true,
      preferences: prefs,
    });
  } catch (error: any) {
    console.error('[Preferences] Error getting preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar preferências',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/notifications/preferences
 * Atualizar preferências de notificações
 */
router.patch('/preferences', adminAuthMiddleware, async (req: any, res) => {
  try {
    const recipientType = req.user ? 'user' : 'citizen';
    const recipientId = req.user?.id || req.citizen?.id;

    if (!recipientId) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    const validated = preferencesSchema.parse(req.body);

    const updated = await prisma.notificationPreference.upsert({
      where: recipientType === 'citizen' ? { citizenId: recipientId } : { userId: recipientId },
      create: {
        [recipientType === 'citizen' ? 'citizenId' : 'userId']: recipientId,
        ...validated,
        preferences: (validated.preferences || {}) as Prisma.InputJsonValue,
      },
      update: {
        ...validated,
        preferences: validated.preferences ? validated.preferences as Prisma.InputJsonValue : undefined,
      },
    });

    console.log(`✅ [Preferences] Updated for ${recipientType}:${recipientId}`);

    res.json({
      success: true,
      message: 'Preferências atualizadas com sucesso',
      preferences: updated,
    });
  } catch (error: any) {
    console.error('[Preferences] Error updating preferences:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.issues,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar preferências',
      error: error.message,
    });
  }
});

/**
 * GET /api/notifications/types
 * Listar tipos de notificações disponíveis
 */
router.get('/types', (_req, res) => {
  const notificationTypes = [
    // Protocolos
    { type: 'PROTOCOL_CREATED', label: 'Protocolo criado', category: 'Protocolos', icon: 'FileText' },
    { type: 'PROTOCOL_STATUS', label: 'Status do protocolo alterado', category: 'Protocolos', icon: 'RefreshCw' },
    { type: 'PROTOCOL_ASSIGNED', label: 'Protocolo atribuído a você', category: 'Protocolos', icon: 'UserCheck' },
    { type: 'PROTOCOL_MESSAGE', label: 'Nova mensagem no protocolo', category: 'Protocolos', icon: 'MessageSquare' },
    { type: 'PROTOCOL_SLA_EXPIRING', label: 'Prazo do protocolo expirando', category: 'Protocolos', icon: 'AlertTriangle' },
    { type: 'PROTOCOL_OVERDUE', label: 'Protocolo vencido', category: 'Protocolos', icon: 'AlertCircle' },
    { type: 'PROTOCOL_COMPLETED', label: 'Protocolo concluído', category: 'Protocolos', icon: 'CheckCircle' },

    // Documentos
    { type: 'DOCUMENT_REQUESTED', label: 'Documento solicitado', category: 'Documentos', icon: 'FileText' },
    { type: 'DOCUMENT_APPROVED', label: 'Documento aprovado', category: 'Documentos', icon: 'CheckCircle' },
    { type: 'DOCUMENT_REJECTED', label: 'Documento rejeitado', category: 'Documentos', icon: 'XCircle' },
    { type: 'DOCUMENT_UPLOADED', label: 'Documento enviado', category: 'Documentos', icon: 'Upload' },

    // Avaliações
    { type: 'EVALUATION_PENDING', label: 'Avaliação pendente', category: 'Avaliações', icon: 'Star' },
    { type: 'EVALUATION_RECEIVED', label: 'Avaliação recebida', category: 'Avaliações', icon: 'ThumbsUp' },

    // Agendamentos
    { type: 'APPOINTMENT_CREATED', label: 'Agendamento criado', category: 'Agendamentos', icon: 'Calendar' },
    { type: 'APPOINTMENT_REMINDER', label: 'Lembrete de agendamento', category: 'Agendamentos', icon: 'Bell' },
    { type: 'APPOINTMENT_CANCELLED', label: 'Agendamento cancelado', category: 'Agendamentos', icon: 'XCircle' },
    { type: 'APPOINTMENT_CONFIRMED', label: 'Agendamento confirmado', category: 'Agendamentos', icon: 'CheckCircle' },

    // Saúde
    { type: 'PRESCRIPTION_ISSUED', label: 'Prescrição médica emitida', category: 'Saúde', icon: 'FileText' },
    { type: 'EXAM_RESULT', label: 'Resultado de exame disponível', category: 'Saúde', icon: 'Activity' },
    { type: 'VACCINATION_DUE', label: 'Vacinação em dia', category: 'Saúde', icon: 'Syringe' },

    // Família
    { type: 'FAMILY_INVITE', label: 'Convite familiar', category: 'Família', icon: 'Users' },
    { type: 'FAMILY_ACCEPTED', label: 'Convite aceito', category: 'Família', icon: 'UserPlus' },
    { type: 'FAMILY_REJECTED', label: 'Convite recusado', category: 'Família', icon: 'UserX' },

    // Sistema
    { type: 'SYSTEM_ANNOUNCEMENT', label: 'Anúncio do sistema', category: 'Sistema', icon: 'Megaphone' },
    { type: 'SYSTEM_MAINTENANCE', label: 'Manutenção programada', category: 'Sistema', icon: 'Settings' },
  ];

  const channels = [
    { channel: 'web', label: 'Web', description: 'Notificações dentro da aplicação', icon: 'Globe' },
    { channel: 'push', label: 'Push', description: 'Notificações push do navegador', icon: 'Smartphone' },
    { channel: 'email', label: 'Email', description: 'Notificações por email', icon: 'Mail' },
    { channel: 'sms', label: 'SMS', description: 'Notificações por SMS', icon: 'MessageCircle' },
  ];

  res.json({
    success: true,
    types: notificationTypes,
    channels,
  });
});

/**
 * POST /api/notifications/test
 * Enviar notificação de teste (desenvolvimento)
 */
router.post('/test', adminAuthMiddleware, async (req: any, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Endpoint disponível apenas em desenvolvimento',
      });
    }

    const recipientType = req.user ? 'user' : 'citizen';
    const recipientId = req.user?.id || req.citizen?.id;

    if (!recipientId) {
      return res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
    }

    const { NotificationService } = await import('../services/notification.service');
    const notificationService = (await import('../services/notification.service')).default;

    await notificationService.notify({
      recipientType,
      recipientId,
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Notificação de Teste',
      message: 'Esta é uma notificação de teste do sistema.',
      data: {
        testId: Date.now(),
      },
      priority: 'normal',
    });

    res.json({
      success: true,
      message: 'Notificação de teste enviada',
    });
  } catch (error: any) {
    console.error('[Preferences] Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar notificação de teste',
      error: error.message,
    });
  }
});

export default router;
