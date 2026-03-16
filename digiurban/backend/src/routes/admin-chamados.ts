import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requirePermission } from '../middleware/admin-auth';
import { generateTicketNumberSafe } from '../services/ticket-number.service';
import { log } from '../config/logger.config';
import { isPrismaMissingTableError } from '../utils/prisma-missing-table';
import {
  listDepartmentTicketAssignees,
  resolveDefaultDepartmentTicketAssignee,
} from '../services/ticket-assignment.service';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

interface Tenant {
  id: string;
  name: string;
  cnpj?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthenticatedRequest {
  user: User;
  tenant: Tenant;
  params: Record<string, string>;
  query: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

interface ServicesByDepartment {
  department: {
    id: string;
    name: string;
  };
  services: unknown[];
}

interface CitizenWhereInput {
  isActive: boolean;
  cpf?: { contains: string };
  email?: { contains: string };
  name?: { contains: string };
}

interface ServiceWhereInput {
  isActive: boolean;
  departmentId?: string;
  category?: string;
}

interface TicketResponsibleUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

function createErrorResponse(error: string, message: string, details?: unknown): ErrorResponse {
  return {
    success: false,
    error,
    message,
    details,
  };
}

function handleAsyncRoute(
  fn: (req: AuthenticatedRequest, res: Response) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as AuthenticatedRequest, res)).catch(next);
  };
}

function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  if (typeof param === 'string') return param;
  return '';
}

function getNumberParam(param: string | string[] | undefined): number {
  if (typeof param === 'string') return parseInt(param, 10) || 0;
  return 0;
}

function canManageTicket(user: User, requestedById: string): boolean {
  return (
    user.id === requestedById ||
    user.role === UserRole.ADMIN ||
    user.role === UserRole.SUPER_ADMIN
  );
}

async function notifyResponsibleUser(
  responsibleUserId: string | null | undefined,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  if (!responsibleUserId) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId: responsibleUserId,
      title,
      message,
      type: 'INFO',
      metadata: metadata as any,
    },
  });
}

const createChamadoSchema = z.object({
  citizenId: z.string().min(1, 'Cidadao e obrigatorio'),
  serviceId: z.string().min(1, 'Servico e obrigatorio'),
  title: z.string().min(5, 'Titulo deve ter pelo menos 5 caracteres'),
  description: z.string().min(10, 'Descricao deve ter pelo menos 10 caracteres'),
  priority: z.number().int().min(1).max(5).default(3),
  assignedUserId: z.string().optional(),
  observations: z.string().optional(),
});

const requestTicketUpdateSchema = z.object({
  message: z.string().trim().min(5).max(500).optional(),
});

const cancelTicketSchema = z.object({
  reason: z.string().trim().min(5).max(500).optional(),
});

function auditLog(_action: string) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
}

const router = Router();
router.use(adminAuthMiddleware);

router.get(
  '/department-assignees',
  requirePermission('chamados:create'),
  handleAsyncRoute(async (req, res) => {
    const departmentId = getStringParam(req.query.departmentId);

    if (!departmentId) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'departmentId is required'));
      return;
    }

    const assignees = await listDepartmentTicketAssignees(departmentId);

    res.json(
      createSuccessResponse({
        assignees,
        defaultAssignee: assignees[0] || null,
      })
    );
  })
);

router.post(
  '/',
  requirePermission('chamados:create'),
  auditLog('CREATE_TICKET'),
  handleAsyncRoute(async (req, res) => {
    log.info('Criando chamado administrativo', {
      userId: req.user?.id,
      userName: req.user?.name,
      body: req.body,
    });

    let data: z.infer<typeof createChamadoSchema>;

    try {
      data = createChamadoSchema.parse(req.body);
    } catch (validationError: any) {
      log.warn('Erro de validacao ao criar chamado', {
        errors: validationError.errors,
        body: req.body,
        userId: req.user?.id,
      });
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Dados invalidos', validationError.errors)
      );
      return;
    }

    const { user } = req;
    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuario nao autenticado'));
      return;
    }

    try {
      const citizen = await prisma.citizen.findFirst({
        where: {
          id: data.citizenId,
          isActive: true,
        },
      });

      if (!citizen) {
        res.status(404).json(createErrorResponse('NOT_FOUND', 'Cidadao nao encontrado ou inativo'));
        return;
      }

      const service = await prisma.serviceSimplified.findFirst({
        where: {
          id: data.serviceId,
          isActive: true,
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!service) {
        res.status(404).json(createErrorResponse('NOT_FOUND', 'Servico nao encontrado ou inativo'));
        return;
      }

      const availableAssignees = await listDepartmentTicketAssignees(service.departmentId);
      let assignedUserId = data.assignedUserId?.trim() || '';

      if (assignedUserId) {
        const selectedAssignee = availableAssignees.find((assignee) => assignee.id === assignedUserId);
        if (!selectedAssignee) {
          res.status(404).json(
            createErrorResponse(
              'NOT_FOUND',
              'Servidor nao encontrado ou nao pertence a secretaria do servico'
            )
          );
          return;
        }
      } else {
        const defaultAssignee = await resolveDefaultDepartmentTicketAssignee(service.departmentId);
        assignedUserId = defaultAssignee?.id || '';
      }

      const ticketNumber = await generateTicketNumberSafe();

      const ticket = await prisma.adminTicket.create({
        data: {
          number: ticketNumber,
          title: data.title,
          description: data.description,
          priority: data.priority,
          observations: data.observations,
          citizenId: data.citizenId,
          serviceId: data.serviceId,
          departmentId: service.departmentId,
          requestedById: user.id,
          ...(assignedUserId ? { assignedUserId } : {}),
          status: 'PENDING',
        },
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              estimatedDays: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      await notifyResponsibleUser(
        ticket.assignedUserId,
        'Novo chamado administrativo',
        `O chamado ${ticket.number} foi criado para ${service.department.name}: ${ticket.title}`,
        {
          ticketId: ticket.id,
          ticketNumber: ticket.number,
          departmentId: ticket.departmentId,
          serviceId: ticket.serviceId,
          requestedById: user.id,
          requestedByName: user.name,
        }
      );

      res.status(201).json(
        createSuccessResponse({
          message: 'Chamado administrativo criado com sucesso. Aguardando analise da secretaria.',
          ticket: {
            id: ticket.id,
            number: ticket.number,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            citizen: ticket.citizen,
            service: ticket.service,
            department: ticket.department,
            requestedBy: ticket.requestedBy,
            assignedUser: ticket.assignedUser,
            createdAt: ticket.createdAt,
          },
        })
      );
    } catch (error) {
      if (isPrismaMissingTableError(error, ['admin_tickets'])) {
        log.error('[admin-chamados] Estrutura de banco ausente: tabela admin_tickets nao encontrada');
        res.status(503).json(
          createErrorResponse(
            'DATABASE_SCHEMA_MISMATCH',
            'Estrutura de chamados indisponivel no banco. Execute as migracoes pendentes.'
          )
        );
        return;
      }

      log.error('Erro inesperado ao criar chamado administrativo', { error });
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Erro ao criar chamado administrativo'));
    }
  })
);

router.get(
  '/',
  requirePermission('chamados:create'),
  handleAsyncRoute(async (req, res) => {
    const { user } = req;

    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuario nao autenticado'));
      return;
    }

    const page = getNumberParam(req.query.page) || 1;
    const limit = getNumberParam(req.query.limit) || 20;
    const status = getStringParam(req.query.status);
    const priority = getStringParam(req.query.priority);
    const departmentId = getStringParam(req.query.departmentId);
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    const canSeeAll = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

    if (!canSeeAll) {
      where.requestedById = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = parseInt(priority, 10);
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    try {
      const [tickets, total] = await Promise.all([
        prisma.adminTicket.findMany({
          where,
          include: {
            citizen: {
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true,
                phone: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            requestedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            protocol: {
              select: {
                id: true,
                number: true,
                status: true,
                createdAt: true,
                assignedUser: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        prisma.adminTicket.count({ where }),
      ]);

      const departmentsWithoutAssignee = Array.from(
        new Set(
          tickets
            .filter((ticket) => !ticket.assignedUser && ticket.departmentId)
            .map((ticket) => ticket.departmentId)
        )
      );

      const resolvedResponsibleEntries = await Promise.all(
        departmentsWithoutAssignee.map(async (currentDepartmentId) => {
          const responsibleUser = await resolveDefaultDepartmentTicketAssignee(currentDepartmentId);
          return [currentDepartmentId, responsibleUser] as const;
        })
      );

      const responsibleByDepartment = new Map<string, TicketResponsibleUser | null>(
        resolvedResponsibleEntries
      );

      const ticketsWithResponsible = tickets.map((ticket) => ({
        ...ticket,
        responsibleUser: ticket.assignedUser || responsibleByDepartment.get(ticket.departmentId) || null,
      }));

      const stats = await prisma.adminTicket.groupBy({
        by: ['status'],
        where: canSeeAll ? {} : { requestedById: user.id },
        _count: {
          status: true,
        },
      });

      const statusCount = stats.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>);

      res.json(
        createSuccessResponse({
          tickets: ticketsWithResponsible,
          stats: {
            total,
            byStatus: statusCount,
          },
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        })
      );
    } catch (error) {
      if (isPrismaMissingTableError(error, ['admin_tickets'])) {
        log.warn('[admin-chamados] tabela admin_tickets ausente. Retornando lista vazia em modo degradado.');
        res.json({
          success: true,
          data: {
            tickets: [],
            stats: {
              total: 0,
              byStatus: {},
            },
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
            },
          },
          degraded: true,
        });
        return;
      }

      log.error('Erro inesperado ao listar chamados administrativos', { error });
      res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Erro ao carregar chamados'));
    }
  })
);

router.post(
  '/:id/request-update',
  requirePermission('chamados:create'),
  auditLog('REQUEST_TICKET_UPDATE'),
  handleAsyncRoute(async (req, res) => {
    const { user } = req;

    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuario nao autenticado'));
      return;
    }

    const data = requestTicketUpdateSchema.parse(req.body ?? {});
    const ticket = await prisma.adminTicket.findUnique({
      where: { id: req.params.id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Chamado nao encontrado'));
      return;
    }

    if (!canManageTicket(user, ticket.requestedById)) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'Sem permissao para cobrar este chamado'));
      return;
    }

    if (ticket.status !== 'PENDING') {
      res.status(400).json(
        createErrorResponse(
          'INVALID_STATUS',
          'A cobranca de agilidade so pode ser feita em chamados pendentes'
        )
      );
      return;
    }

    const responsibleUser =
      ticket.assignedUserId ? { id: ticket.assignedUserId } : await resolveDefaultDepartmentTicketAssignee(ticket.departmentId);

    if (!responsibleUser?.id) {
      res.status(400).json(
        createErrorResponse(
          'NO_RESPONSIBLE_USER',
          'Nao foi encontrado servidor responsavel para este chamado'
        )
      );
      return;
    }

    const message =
      data.message ||
      `Solicitacao de agilidade para o chamado ${ticket.number}. Favor verificar o atendimento com prioridade.`;

    await prisma.$transaction(async (tx) => {
      if (!ticket.assignedUserId) {
        await tx.adminTicket.update({
          where: { id: ticket.id },
          data: {
            assignedUserId: responsibleUser.id,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: responsibleUser.id,
          title: 'Cobranca de agilidade em chamado',
          message,
          type: 'INFO',
          metadata: {
            ticketId: ticket.id,
            ticketNumber: ticket.number,
            departmentId: ticket.departmentId,
            requestedById: user.id,
            requestedByName: user.name,
            requestedByRole: user.role,
            action: 'REQUEST_TICKET_UPDATE',
          },
        },
      });
    });

    res.json(
      createSuccessResponse(
        {
          ticketId: ticket.id,
          responsibleUserId: responsibleUser.id,
        },
        'Cobranca de agilidade enviada com sucesso'
      )
    );
  })
);

router.post(
  '/:id/cancel',
  requirePermission('chamados:create'),
  auditLog('CANCEL_TICKET'),
  handleAsyncRoute(async (req, res) => {
    const { user } = req;

    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuario nao autenticado'));
      return;
    }

    const data = cancelTicketSchema.parse(req.body ?? {});
    const ticket = await prisma.adminTicket.findUnique({
      where: { id: req.params.id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Chamado nao encontrado'));
      return;
    }

    if (!canManageTicket(user, ticket.requestedById)) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'Sem permissao para cancelar este chamado'));
      return;
    }

    if (ticket.status !== 'PENDING') {
      res.status(400).json(
        createErrorResponse('INVALID_STATUS', 'Somente chamados pendentes podem ser cancelados')
      );
      return;
    }

    const cancellationNote = data.reason
      ? `Cancelado por ${user.name}: ${data.reason}`
      : `Cancelado por ${user.name}.`;

    const updatedTicket = await prisma.adminTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'CANCELLED',
        observations: ticket.observations
          ? `${ticket.observations}\n${cancellationNote}`
          : cancellationNote,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const cancelResponsibleUserId =
      ticket.assignedUserId ||
      (await resolveDefaultDepartmentTicketAssignee(ticket.departmentId))?.id;

    await notifyResponsibleUser(
      cancelResponsibleUserId,
      'Chamado cancelado',
      `O chamado ${ticket.number} foi cancelado por ${user.name}.`,
      {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        cancelledById: user.id,
        cancelledByName: user.name,
      }
    );

    res.json(
      createSuccessResponse(
        {
          ticket: updatedTicket,
        },
        'Chamado cancelado com sucesso'
      )
    );
  })
);

router.get(
  '/search/citizens',
  requirePermission('chamados:create'),
  handleAsyncRoute(async (req, res) => {
    const search = getStringParam(req.query.search);
    const type = getStringParam(req.query.type) || 'name';
    const { user } = req;

    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuario nao autenticado'));
      return;
    }

    if (!search || search.length < 2) {
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Digite pelo menos 2 caracteres para buscar')
      );
      return;
    }

    const where: CitizenWhereInput = {
      isActive: true,
    };

    switch (type) {
      case 'cpf':
        where.cpf = { contains: search };
        break;
      case 'email':
        where.email = { contains: search };
        break;
      default:
        where.name = { contains: search };
        break;
    }

    const citizens = await prisma.citizen.findMany({
      where,
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
      take: 10,
    });

    res.json(
      createSuccessResponse({
        citizens,
        total: citizens.length,
      })
    );
  })
);

router.get(
  '/search/services',
  requirePermission('chamados:create'),
  handleAsyncRoute(async (req, res) => {
    const departmentId = getStringParam(req.query.departmentId);
    const category = getStringParam(req.query.category);
    const { user } = req;

    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuario nao autenticado'));
      return;
    }

    const where: ServiceWhereInput = {
      isActive: true,
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (category) {
      where.category = category;
    }

    const services = await prisma.serviceSimplified.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
    });

    const servicesByDepartment: ServicesByDepartment[] = [];
    const departmentMap = new Map<string, ServicesByDepartment>();

    for (const service of services) {
      if (!departmentMap.has(service.departmentId)) {
        const entry: ServicesByDepartment = {
          department: service.department,
          services: [],
        };
        departmentMap.set(service.departmentId, entry);
        servicesByDepartment.push(entry);
      }

      departmentMap.get(service.departmentId)?.services.push({
        id: service.id,
        name: service.name,
        category: service.category,
        estimatedDays: service.estimatedDays,
        requiresDocuments: service.requiresDocuments,
      });
    }

    res.json(
      createSuccessResponse({
        servicesByDepartment,
        totalServices: services.length,
      })
    );
  })
);

export default router;
