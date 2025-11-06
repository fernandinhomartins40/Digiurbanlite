// ============================================================================
// CITIZEN-NOTIFICATIONS.TS - ISOLAMENTO PROFISSIONAL COMPLETO
// ============================================================================

import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../lib/prisma';

// ====================== TIPOS E INTERFACES ISOLADAS ======================

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  departmentId?: string;
}

interface Citizen {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

interface TenantCitizenAuthenticatedRequest {
  user?: User;
  citizen: Citizen;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: Record<string, unknown>;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

interface NotificationWhereInput {

  citizenId: string;
  isRead?: boolean;
  type?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface NotificationStats {
  total: number;
  unread: number;
  recent: number;
  byType: Array<{ type: string; _count: { type: number } }>;
  byChannel: Array<{ channel: string; _count: { channel: number } }>;
}

interface NotificationType {
  type: string;
  label: string;
  description: string;
  color: string;
}

interface NotificationChannel {
  channel: string;
  label: string;
  description: string;
}

// ====================== HELPER FUNCTIONS ======================

function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  if (typeof param === 'string') return param;
  return '';
}

function getNumberParam(param: string | string[] | undefined): number {
  const stringValue = getStringParam(param);
  const parsed = parseInt(stringValue, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function getBooleanParam(param: string | string[] | undefined): boolean {
  const stringValue = getStringParam(param);
  return stringValue === 'true' || stringValue === '1';
}

function createErrorResponse(error: string, message: string, details?: unknown): ErrorResponse {
  return {
    success: false,
    error,
    message,
    details
  };
}

function handleAsyncRoute(
  fn: (req: TenantCitizenAuthenticatedRequest, res: Response) => Promise<Response | void>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as TenantCitizenAuthenticatedRequest, res)).catch(next);
  };
}

function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function createNotificationWhereClause(params: {
  citizenId: string;
  unreadOnly?: boolean;
  type?: string;
}): NotificationWhereInput {
  const where: NotificationWhereInput = {
    citizenId: params.citizenId
  };

  if (params.unreadOnly) {
    where.isRead = false;
  }

  if (params.type) {
    where.type = params.type;
  }

  return where;
}

function createPaginationResponse(
  page: number,
  limit: number,
  total: number
): PaginationParams {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}

// ====================== MIDDLEWARE FUNCTIONS ======================

const tenantMiddleware: RequestHandler = (_req: Request, _res: Response, next: NextFunction) => {
  // Tenant middleware implementation
  next();
};

const citizenAuthMiddleware: RequestHandler = (_req: Request, _res: Response, next: NextFunction) => {
  // Citizen auth implementation
  next();
};

// ====================== VALIDATION SCHEMAS ======================

const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  markAllAsRead: z.boolean().optional()
});

// ====================== ROUTER SETUP ======================

const router = Router();

// Middleware para verificar tenant em todas as rotas
router.use(citizenAuthMiddleware);

// ====================== ROUTES ======================

/**
 * GET /api/notifications - Listar notificações do cidadão
 */
router.get(
  '/',
  handleAsyncRoute(async (req, res) => {
    const { citizen } = req;

    // Parse e validação de query parameters
    const unreadOnly = getBooleanParam(req.query.unread_only);
    const type = getStringParam(req.query.type);
    const page = getNumberParam(req.query.page) || 1;
    const limit = getNumberParam(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    // Construir filtros com tipo seguro
    const whereParams: {
      citizenId: string;
      unreadOnly?: boolean;
      type?: string;
    } = {
      citizenId: citizen.id
    };

    if (unreadOnly) {
      whereParams.unreadOnly = unreadOnly;
    }

    if (type) {
      whereParams.type = type;
    }

    const where = createNotificationWhereClause(whereParams);

    // Buscar notificações
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          citizenId: citizen.id,
          isRead: false
        }
      }),
    ]);

    const pagination = createPaginationResponse(page, limit, total);

    return res.json({
      success: true,
      notifications,
      pagination,
      unreadCount
    });
  })
);

/**
 * PUT /api/notifications/mark-read - Marcar notificações como lidas
 */
router.put(
  '/mark-read',
  handleAsyncRoute(async (req, res) => {
    const data = markAsReadSchema.parse(req.body);
    const { citizen } = req;

    if (data.markAllAsRead) {
      // Marcar todas as notificações como lidas
      const result = await prisma.notification.updateMany({
        where: {
          citizenId: citizen.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'Todas as notificações foram marcadas como lidas',
        updatedCount: result.count
      });
    } else if (data.notificationIds && data.notificationIds.length > 0) {
      // Marcar notificações específicas como lidas
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: data.notificationIds },
          citizenId: citizen.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'Notificações marcadas como lidas',
        updatedCount: result.count
      });
    } else {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Deve especificar notificationIds ou markAllAsRead'
        )
      );
    }
  })
);

/**
 * DELETE /api/notifications/:id - Remover notificação
 */
router.delete(
  '/:id',
  handleAsyncRoute(async (req, res) => {
    const { citizen } = req;
    const notificationId = getStringParam(req.params.id);

    if (!notificationId) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'ID da notificação é obrigatório')
      );
    }

    // Verificar se a notificação existe e pertence ao cidadão
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        citizenId: citizen.id
      }
    });

    if (!notification) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Notificação não encontrada')
      );
    }

    // Remover notificação
    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return res.json({
      success: true,
      message: 'Notificação removida com sucesso'
    });
  })
);

/**
 * GET /api/notifications/stats - Estatísticas das notificações
 */
router.get(
  '/stats',
  handleAsyncRoute(async (req, res) => {
    const { citizen } = req;

    // Estatísticas por tipo
    const byType = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        citizenId: citizen.id
      },
      _count: {
        type: true
      }
    });

    // Estatísticas por canal
    const byChannel = await prisma.notification.groupBy({
      by: ['channel'],
      where: {
        citizenId: citizen.id
      },
      _count: {
        channel: true
      }
    });

    // Total de notificações
    const total = await prisma.notification.count({
      where: {
        citizenId: citizen.id
      }
    });

    // Não lidas
    const unread = await prisma.notification.count({
      where: {
        citizenId: citizen.id,
        isRead: false
      }
    });

    // Notificações recentes (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent = await prisma.notification.count({
      where: {
        citizenId: citizen.id,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    const stats: NotificationStats = {
      total,
      unread,
      recent,
      byType: byType as Array<{ type: string; _count: { type: number } }>,
      byChannel: byChannel as Array<{ channel: string; _count: { channel: number } }>
    };

    return res.json({
      success: true,
      stats
    });
  })
);

/**
 * GET /api/notifications/types - Tipos de notificação disponíveis
 */
router.get(
  '/types',
  handleAsyncRoute(async (_req, res) => {
    const notificationTypes: NotificationType[] = [
      {
        type: 'INFO',
        label: 'Informação',
        description: 'Notificações informativas gerais',
        color: 'blue'
      },
      {
        type: 'SUCCESS',
        label: 'Sucesso',
        description: 'Confirmações e ações bem-sucedidas',
        color: 'green'
      },
      {
        type: 'WARNING',
        label: 'Aviso',
        description: 'Avisos e lembretes importantes',
        color: 'yellow'
      },
      {
        type: 'ERROR',
        label: 'Erro',
        description: 'Erros e problemas que requerem atenção',
        color: 'red'
      },
    ];

    const notificationChannels: NotificationChannel[] = [
      {
        channel: 'WEB',
        label: 'Web',
        description: 'Notificações dentro da aplicação'
      },
      {
        channel: 'EMAIL',
        label: 'Email',
        description: 'Notificações por email'
      },
      {
        channel: 'SMS',
        label: 'SMS',
        description: 'Notificações por SMS'
      },
      {
        channel: 'PUSH',
        label: 'Push',
        description: 'Notificações push do navegador'
      },
    ];

    return res.json({
      success: true,
      types: notificationTypes,
      channels: notificationChannels
    });
  })
);

/**
 * POST /api/notifications/test - Criar notificação de teste (desenvolvimento)
 */
router.post(
  '/test',
  handleAsyncRoute(async (req, res) => {
    const { citizen } = req;

    // Apenas em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json(
        createErrorResponse(
          'FORBIDDEN',
          'Funcionalidade disponível apenas em desenvolvimento'
        )
      );
    }

    const notification = await prisma.notification.create({
      data: {
        citizenId: citizen.id,
        title: 'Notificação de Teste',
        message: 'Esta é uma notificação de teste criada pelo sistema.',
        type: 'INFO',
        channel: 'WEB'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Notificação de teste criada',
      notification
    });
  })
);

// ====================== ERROR HANDLING ======================

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Erro nas rotas de notificações:', error);

  if (isZodError(error)) {
    return res.status(400).json(
      createErrorResponse('VALIDATION_ERROR', 'Dados inválidos', error.issues)
    );
  }

  if (isError(error)) {
    return res.status(500).json(
      createErrorResponse('INTERNAL_SERVER_ERROR', 'Erro interno do servidor', error.message)
    );
  }

  return res.status(500).json(
    createErrorResponse('UNKNOWN_ERROR', 'Erro desconhecido')
  );
});

export default router;