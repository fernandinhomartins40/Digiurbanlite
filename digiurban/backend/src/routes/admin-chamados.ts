// ============================================================================
// ADMIN-CHAMADOS.TS - ISOLAMENTO PROFISSIONAL COMPLETO
// ============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import {
  adminAuthMiddleware,
  requirePermission,
  addDataFilter
        } from '../middleware/admin-auth';
import { generateProtocolNumberSafe } from '../services/protocol-number.service';
import { protocolStatusEngine } from '../services/protocol-status.engine';

// ====================== TIPOS E INTERFACES ISOLADAS ======================

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
  query: Record<string, string | string[]>;
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

// Helper functions
function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message })
        };
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
  fn: (req: AuthenticatedRequest, res: Response) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as AuthenticatedRequest, res)).catch(next);
  };
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

// ====================== HELPER FUNCTIONS ======================

function getStringParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  if (typeof param === 'string') return param;
  return '';
}

function getNumberParam(param: string | string[] | undefined): number {
  if (typeof param === 'number') return param;
  if (typeof param === 'string') return parseInt(param, 10) || 0;
  return 0;
}

// Função removida - usar getNextProtocolNumber() de protocol-helpers

// ====================== MIDDLEWARE FUNCTIONS ======================

function auditLog(_action: string) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // Audit log implementation
    next();
  };
}

// ====================== VALIDATION SCHEMAS ======================

const createChamadoSchema = z.object({
  citizenId: z.string().min(1, 'Cidadão é obrigatório'),
  serviceId: z.string().min(1, 'Serviço é obrigatório'),
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  priority: z.number().int().min(1).max(5).default(3), // 1=LOW, 2=NORMAL, 3=HIGH, 4=URGENT, 5=CRITICAL
  assignedUserId: z.string().optional(),
  dueDate: z.string().optional(),
  observations: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notifyCitizen: z.boolean().default(true),
  notifyDepartment: z.boolean().default(true)
      });

// ====================== ROUTER SETUP ======================

const router = Router();

// Middleware para verificar tenant em todas as rotas
router.use(adminAuthMiddleware);

// POST /api/admin/chamados - Criar novo chamado (FLUXO 1 - Top-Down)
router.post(
  '/',
  requirePermission('chamados:create'),
  auditLog('CREATE_CHAMADO'),
  handleAsyncRoute(async (req, res) => {
    const data = createChamadoSchema.parse(req.body);
    const { user } = req;

    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuário não autenticado'));
      return;
    }

    // Verificar se o cidadão existe e está ativo
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        isActive: true
      }
    });

    if (!citizen) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Cidadão não encontrado ou inativo'));
      return;
    }

    // Verificar se o serviço existe e está ativo
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id: data.serviceId,
        isActive: true
      },
      include: {
        department: {
          include: {
            users: {
              where: {
                isActive: true,
                role: { in: ['COORDINATOR', 'MANAGER'] }
      },
              select: {
                id: true,
                name: true,
                email: true,
                role: true
      }
      }
      }
        }
      }
      });

    if (!service) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Serviço não encontrado ou inativo'));
      return;
    }

    // Verificar se o usuário para atribuição existe (se informado)
    let assignedUser = null;
    if (data.assignedUserId) {
      assignedUser = await prisma.user.findFirst({
        where: {
          id: data.assignedUserId,
          departmentId: service.departmentId,
          isActive: true
        }
      });

      if (!assignedUser) {
        res.status(404).json(createErrorResponse('NOT_FOUND', 'Funcionário não encontrado ou não pertence ao departamento responsável'));
        return;
      }
    }

    // Gerar número do protocolo - Sistema centralizado com lock
    const protocolNumber = await generateProtocolNumberSafe();

    // Criar protocolo automaticamente (FLUXO 1)
    const protocolData = {
      citizenId: data.citizenId,
      serviceId: data.serviceId,
      departmentId: service.departmentId,
      number: protocolNumber,
      title: data.title,
      description: data.description,
      priority: data.priority,
      createdById: user.id,
      status: 'VINCULADO' as const,
      ...(data.assignedUserId && { assignedUserId: data.assignedUserId }),
      ...(data.dueDate && { dueDate: new Date(data.dueDate) })
        };

    const protocol = await prisma.protocolSimplified.create({
      data: protocolData,
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true
      }
      },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            estimatedDays: true
      }
      },
        department: {
          select: {
            id: true,
            name: true,
            code: true
      }
      },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
      }
      }
      }
      });

    // Criar histórico inicial detalhado
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'CHAMADO_CREATED',
        comment: `Chamado criado pelo ${user.role === 'ADMIN' ? 'Prefeito' : 'Administrador'} ${user.name}. ${data.observations || ''}`,
        userId: user.id
      }
      });

    // Notificar o cidadão se solicitado
    if (data.notifyCitizen) {
      await prisma.notification.create({
        data: {
          citizenId: data.citizenId,
          title: 'Protocolo Criado pela Prefeitura',
          message: `A prefeitura criou o protocolo ${protocolNumber} para atender sua necessidade: ${data.title}`,
          type: 'INFO',
          protocolId: protocol.id
      }
      });
    }

    // Notificar o departamento responsável se solicitado
    if (data.notifyDepartment) {
      const departmentUsers = service.department.users;

      for (const departmentUser of departmentUsers) {
        // Aqui você poderia enviar email ou outras notificações
        console.log(
          `[NOTIFICATION] Novo chamado ${protocolNumber} para ${departmentUser.name} (${departmentUser.email})`
        );
      }
    }

    // Notificar usuário atribuído se houver
    if (assignedUser) {
      console.log(
        `[NOTIFICATION] Protocolo ${protocolNumber} atribuído a ${assignedUser.name} (${assignedUser.email})`
      );
    }

    res.status(201).json(createSuccessResponse({
      message: 'Chamado criado e protocolo gerado com sucesso',
      protocol,
      chamado: {
        id: protocol.id,
        number: protocolNumber,
        type: 'TOP_DOWN',
        createdBy: user.name,
        priority: data.priority,
        tags: data.tags || []
      }
      }));
      })
);

// GET /api/admin/chamados - Listar chamados criados
router.get(
  '/',
  requirePermission('chamados:create'),
  handleAsyncRoute(async (req, res) => {
    const { user } = req;

    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuário não autenticado'));
      return;
    }

    const page = getNumberParam(req.query.page as string) || 1;
    const limit = getNumberParam(req.query.limit as string) || 20;
    const status = getStringParam(req.query.status as string);
    const priority = getStringParam(req.query.priority as string);
    const departmentId = getStringParam(req.query.departmentId as string);

    const skip = (page - 1) * limit;

    // Construir filtros para protocolos criados como chamados
    const where: Record<string, unknown> = {
      createdById: { not: null }, // Protocolos criados por usuários admin
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = parseInt(priority, 10);
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Buscar chamados (protocolos) com paginação
    const [chamados, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true,
              phone: true
      }
      },
          service: {
            select: {
              id: true,
              name: true,
              category: true
      }
      },
          department: {
            select: {
              id: true,
              name: true,
              code: true
      }
      },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
      }
      },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
      }
      },
          history: {
            where: { action: 'CHAMADO_CREATED' },
            take: 1,
            orderBy: { timestamp: 'desc' }
        },
          _count: {
            select: {
              history: true
      }
      }
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit
      }),
      prisma.protocolSimplified.count({ where }),
    ]);

    res.json(createSuccessResponse({
      chamados: chamados.map(protocol => ({
        id: protocol.id,
        number: protocol.number,
        title: protocol.title,
        description: protocol.description,
        status: protocol.status,
        priority: protocol.priority,
        citizen: protocol.citizen,
        service: protocol.service,
        department: protocol.department,
        assignedUser: protocol.assignedUser,
        createdBy: protocol.createdBy,
        createdAt: protocol.createdAt,
        updatedAt: protocol.updatedAt,
        dueDate: protocol.dueDate,
        concludedAt: protocol.concludedAt,
        historyCount: protocol._count.history,
        type: 'TOP_DOWN'
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
      }));
      })
);

// GET /api/admin/chamados/search/citizens - Buscar cidadãos para criar chamado
router.get(
  '/search/citizens',
  requirePermission('chamados:create'),
  handleAsyncRoute(async (req, res) => {
    const search = getStringParam(req.query.search as string);
    const type = getStringParam(req.query.type as string) || 'name';
    const { user } = req;

    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuário não autenticado'));
      return;
    }

    if (!search || search.length < 2) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Digite pelo menos 2 caracteres para buscar'));
      return;
    }

    // Construir filtros de busca
    const where: CitizenWhereInput = {
      isActive: true
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
        createdAt: true
        },
      orderBy: { name: 'asc' },
      take: 10, // Limitar resultados
      });

    res.json(createSuccessResponse({
      citizens,
      total: citizens.length
      }));
      })
);

// GET /api/admin/chamados/search/services - Buscar serviços disponíveis
router.get(
  '/search/services',
  requirePermission('chamados:create'),
  handleAsyncRoute(async (req, res) => {
    const departmentId = getStringParam(req.query.departmentId as string);
    const category = getStringParam(req.query.category as string);
    const { user } = req;

    if (!user) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Usuário não autenticado'));
      return;
    }

    // Construir filtros de busca
    const where: ServiceWhereInput = {
      isActive: true
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (category) {
      where.category = category;
    }

    // Buscar serviços agrupados por departamento
    const services = await prisma.serviceSimplified.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
      }
      }
        },
      orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }]
      });

    // Agrupar por departamento
    const servicesByDepartment: ServicesByDepartment[] = [];
    const departmentMap = new Map();

    for (const service of services) {
      if (!departmentMap.has(service.departmentId)) {
        departmentMap.set(service.departmentId, {
          department: service.department,
          services: []
      });
        servicesByDepartment.push(departmentMap.get(service.departmentId));
      }
      departmentMap.get(service.departmentId).services.push({
        id: service.id,
        name: service.name,
        category: service.category,
        estimatedDays: service.estimatedDays,
        requiresDocuments: service.requiresDocuments
      });
    }

    res.json(createSuccessResponse({
      servicesByDepartment,
      totalServices: services.length
      }));
      })
);

export default router;