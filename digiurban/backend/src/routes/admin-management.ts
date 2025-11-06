// ============================================================================
// ADMIN-MANAGEMENT.TS - ISOLAMENTO PROFISSIONAL COMPLETO
// ============================================================================

import { Router, Response, RequestHandler, Request, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/admin-auth';

// ====================== TIPOS E INTERFACES ISOLADAS ======================

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  tenantId?: string;
  departmentId?: string;
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
  tenant?: Tenant;

  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: Record<string, unknown>;
}

interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
  [key: string]: unknown;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface DepartmentInfo {
  id: string;
  name: string;
  code: string | null;
  usersCount: number;
  servicesCount: number;
  protocolsCount: number;
}

interface UserPerformance {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  protocolsCount: number;
}

interface ServiceWhereInput {
  departmentId?: string;
  category?: string;
  isActive?: boolean;
}

// Using Prisma generated type for full compatibility
type UserWhereInput = Prisma.UserWhereInput;

interface ProtocolFilterInput {
  departmentId?: string;
  createdAt?: {
    gte: Date;
    lte: Date;
  };
  assignedUserId?: { not: null };
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

function createSuccessResponse<T>(data?: T, message?: string): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true
        };

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return response;
}

function createErrorResponse(error: string, message: string, details?: unknown): ErrorResponse {
  return {
    success: false,
    error,
    message,
    details
  };
}

function createPaginatedResponse<T>(data: T[], pagination: PaginationInfo) {
  return {
    success: true,
    data,
    pagination
        };
}

function handleAsyncRoute(
  fn: (req: AuthenticatedRequest, res: Response) => Promise<Response | void>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as AuthenticatedRequest, res)).catch(next);
  };
}

function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function createServiceWhereClause(params: {
  departmentId?: string;
  category?: string;
  isActive?: boolean;
}): Omit<ServiceWhereInput, 'tenantId'> {
  const where: Omit<ServiceWhereInput, 'tenantId'> = {};

  if (params.departmentId) {
    where.departmentId = params.departmentId;
  }

  if (params.category) {
    where.category = params.category;
  }

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  return where;
}

function createUserWhereClause(params: {
  departmentId?: string;
  role?: string;
  isActive?: boolean;
  excludeSuperAdmin?: boolean;
}): UserWhereInput {
  const where: UserWhereInput = {};

  if (params.departmentId) {
    where.departmentId = params.departmentId;
  }

  // Handle role filter with proper priority for excludeSuperAdmin
  if (params.excludeSuperAdmin) {
    where.role = { not: 'SUPER_ADMIN' as const };
  } else if (params.role) {
    where.role = params.role as any; // Cast to handle UserRole enum
  }

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  return where;
}

// ====================== MIDDLEWARE FUNCTIONS ======================

const tenantMiddleware: RequestHandler = (_req: Request, _res: Response, next: NextFunction) => {
  // Tenant middleware implementation
  next();
};

// adminAuthMiddleware já importado de '../middleware/admin-auth'

const requirePermission = (permission: string): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Usuário não autenticado'
      });
    }

    // ADMIN tem todas as permissões
    if (user.role === 'ADMIN') {
      return next();
    }

    // Verificar permissões específicas por role
    const rolePermissions: Record<string, string[]> = {
      'MANAGER': ['team:read', 'protocols:read', 'protocols:assign', 'protocols:update', 'departments:read'],
      'USER': ['protocols:read']
        };

    const userPermissions = rolePermissions[user.role] || [];

    if (userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Sem permissão para esta ação'
    });
  };
};

const auditLog = (_action: string): RequestHandler => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // Audit log implementation
    next();
  };
};

// ====================== VALIDATION SCHEMAS ======================

const createServiceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  category: z.string().optional(),
  requiresDocuments: z.boolean().default(false),
  requiredDocuments: z.array(z.string()).optional(),
  estimatedDays: z.number().int().positive().optional(),
  priority: z.number().int().min(1).max(10).default(1),
  requirements: z.array(z.string()).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  departmentId: z.string().optional()
        });

const updateServiceSchema = createServiceSchema.partial();

// ✅ SEGURANÇA: Schema de senha forte
const strongPasswordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/\d/, 'Senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos um caractere especial');

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: strongPasswordSchema, // ✅ Validação de senha forte
  role: z.enum(['USER', 'COORDINATOR', 'MANAGER']),
  departmentId: z.string().optional()
        });

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER', 'COORDINATOR', 'MANAGER']).optional(),
  departmentId: z.string().optional(),
  isActive: z.boolean().optional()
        });

// ====================== ROUTER SETUP ======================

const router = Router();

// Middleware para verificar tenant em todas as rotas
router.use(adminAuthMiddleware);

// ====================== ROUTES ======================

/**
 * GET /api/admin/services - Listar serviços da secretaria
 */
router.get(
  '/services',
  requirePermission('department:read'),
  handleAsyncRoute(async (req, res) => {
    const { user } = req;
    const category = getStringParam(req.query.category);
    const active = getStringParam(req.query.active);
    const page = getNumberParam(req.query.page) || 1;
    const limit = getNumberParam(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    // Construir filtros baseados no nível de acesso
    const whereParams: {
      departmentId?: string;
      category?: string;
      isActive?: boolean;
    } = {};

    // Filtrar por departamento se não for ADMIN
    if (user.role !== 'ADMIN' && user.departmentId) {
      whereParams.departmentId = user.departmentId;
    }

    if (category) {
      whereParams.category = category;
    }

    if (active) {
      whereParams.isActive = getBooleanParam(req.query.active);
    }

    const where = createServiceWhereClause(whereParams);

    const [services, total] = await Promise.all([
      prisma.serviceSimplified.findMany({
        where,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
        }
      },
          _count: {
            select: {
              protocolsSimplified: true
        }
      } as any, // TODO: Prisma _count não suporta select em relações
        },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
        skip,
        take: limit
        }),
      prisma.serviceSimplified.count({ where }),
    ]);

    const paginationInfo: PaginationInfo = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
        };

    return res.json(createPaginatedResponse(services, paginationInfo));
  })
);

/**
 * POST /api/admin/services - Criar novo serviço
 */
router.post(
  '/services',
  requirePermission('services:create'),
  auditLog('CREATE_SERVICE'),
  handleAsyncRoute(async (req, res) => {
    const data = createServiceSchema.parse(req.body);
    const { user } = req;

    // Verificar se o usuário pode criar serviços no departamento
    let departmentId = user.departmentId;
    if (user.role === 'ADMIN' && data.departmentId) {
      departmentId = data.departmentId;
    }

    if (!departmentId) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Departamento é obrigatório')
      );
    }

    // Verificar se o departamento existe
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        isActive: true
        }
        });

    if (!department) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Departamento não encontrado')
      );
    }

    // Criar serviço
    const service = await prisma.serviceSimplified.create({
      data: {
        departmentId,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        serviceType: 'COM_DADOS', // Campo obrigatório adicionado
        requiresDocuments: data.requiresDocuments,
        requiredDocuments: data.requiredDocuments ? data.requiredDocuments as Prisma.InputJsonValue : undefined,
        estimatedDays: data.estimatedDays || null,
        priority: data.priority,
        icon: data.icon || null,
        color: data.color || null,
        isActive: true
        },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
        }
      }
        }
        });

    return res.status(201).json(createSuccessResponse(service, 'Serviço criado com sucesso'));
  })
);

/**
 * PUT /api/admin/services/:id - Atualizar serviço
 */
router.put(
  '/services/:id',
  requirePermission('services:update'),
  auditLog('UPDATE_SERVICE'),
  handleAsyncRoute(async (req, res) => {
    const data = updateServiceSchema.parse(req.body);
    const { user } = req;
    const serviceId = getStringParam(req.params.id);

    if (!serviceId) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'ID do serviço é obrigatório')
      );
    }

    // Verificar se o serviço existe e usuário tem acesso
    const serviceWhereParams: {
      departmentId?: string;
    } = {};

    if (user.role !== 'ADMIN' && user.departmentId) {
      serviceWhereParams.departmentId = user.departmentId;
    }

    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id: serviceId,
        ...serviceWhereParams
        }
        });

    if (!service) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Serviço não encontrado ou sem acesso')
      );
    }

    // Atualizar serviço
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
        };

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.requiresDocuments !== undefined) updateData.requiresDocuments = data.requiresDocuments;
    if (data.requiredDocuments !== undefined) updateData.requiredDocuments = data.requiredDocuments ? data.requiredDocuments as Prisma.InputJsonValue : null;
    if (data.estimatedDays !== undefined) updateData.estimatedDays = data.estimatedDays;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.requirements !== undefined) updateData.requirements = data.requirements ? data.requirements as Prisma.InputJsonValue : null;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;

    const updatedService = await prisma.serviceSimplified.update({
      where: { id: serviceId },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
        }
      }
        }
        });

    return res.json(createSuccessResponse(updatedService, 'Serviço atualizado com sucesso'));
  })
);

/**
 * GET /api/admin/team - Listar equipe do departamento
 */
router.get(
  '/team',
  requirePermission('team:read'),
  handleAsyncRoute(async (req, res) => {
    const { user } = req;
    const role = getStringParam(req.query.role);
    const active = getStringParam(req.query.active);
    const page = getNumberParam(req.query.page) || 1;
    const limit = getNumberParam(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    // Construir filtros baseados no nível de acesso
    const whereParams: {
      departmentId?: string;
      role?: string;
      isActive?: boolean;
      excludeSuperAdmin: boolean;
    } = {
      excludeSuperAdmin: true
        };

    // Filtrar por departamento se não for ADMIN
    if (user.role !== 'ADMIN' && user.departmentId) {
      whereParams.departmentId = user.departmentId;
    }

    if (role) {
      whereParams.role = role;
    }

    if (active) {
      whereParams.isActive = getBooleanParam(req.query.active);
    }

    const where = createUserWhereClause(whereParams);

    const [teamMembers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true
        }
      },
          _count: {
            select: {
              assignedProtocolsSimplified: true
        }
      }
        },
        orderBy: [{ role: 'desc' }, { name: 'asc' }],
        skip,
        take: limit
        }),
      prisma.user.count({ where }),
    ]);

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
        };

    return res.json(createSuccessResponse({ teamMembers, pagination }));
  })
);

/**
 * POST /api/admin/team - Adicionar membro à equipe
 */
router.post(
  '/team',
  requirePermission('team:manage'),
  auditLog('CREATE_TEAM_MEMBER'),
  handleAsyncRoute(async (req, res) => {
    const data = createUserSchema.parse(req.body);
    const { user } = req;

    // Verificar se o email já existe
    const existingUser = await prisma.user.findFirst({
      where: {
          email: data.email
        }
        });

    if (existingUser) {
      return res.status(400).json(
        createErrorResponse('USER_EXISTS', 'Email já está em uso')
      );
    }

    // Definir departamento
    let departmentId = data.departmentId;
    if (user.role !== 'ADMIN') {
      departmentId = user.departmentId; // Forçar departamento do usuário
    }

    // Verificar se o departamento existe (se informado)
    if (departmentId) {
      // ✅ Validar departamento global (sem tenantId)
      const department = await prisma.department.findFirst({
        where: {
          id: departmentId,
          isActive: true
        }
        });

      if (!department) {
        return res.status(404).json(
          createErrorResponse('NOT_FOUND', 'Departamento não encontrado')
        );
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        departmentId: departmentId || null,
        isActive: true,
        mustChangePassword: true
        },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
        }
      }
        }
        });

    return res.status(201).json(
      createSuccessResponse(newUser, 'Membro da equipe criado com sucesso')
    );
  })
);

/**
 * PUT /api/admin/team/:id - Atualizar membro da equipe
 */
router.put(
  '/team/:id',
  requirePermission('team:manage'),
  auditLog('UPDATE_TEAM_MEMBER'),
  handleAsyncRoute(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const { user } = req;
    const userId = getStringParam(req.params.id);

    if (!userId) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'ID do usuário é obrigatório')
      );
    }

    // Verificar se o usuário existe e tem acesso
    const userWhereParams: {
      departmentId?: string;
      excludeSuperAdmin: boolean;
    } = {
      excludeSuperAdmin: true
        };

    if (user.role !== 'ADMIN' && user.departmentId) {
      userWhereParams.departmentId = user.departmentId;
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        ...createUserWhereClause(userWhereParams)
        }
        });

    if (!targetUser) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Usuário não encontrado ou sem acesso')
      );
    }

    // Verificar se não está tentando alterar seu próprio usuário
    if (targetUser.id === user.id) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Você não pode alterar seu próprio usuário')
      );
    }

    // Verificar se o departamento existe (se informado)
    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: data.departmentId,
          isActive: true
        }
        });

      if (!department) {
        return res.status(404).json(
          createErrorResponse('NOT_FOUND', 'Departamento não encontrado')
        );
      }
    }

    // Atualizar usuário
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
        };

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
        }
      }
        }
        });

    return res.json(createSuccessResponse(updatedUser, 'Membro da equipe atualizado com sucesso'));
  })
);

/**
 * GET /api/admin/departments - Listar departamentos
 */
router.get(
  '/departments',
  requirePermission('departments:read'),
  handleAsyncRoute(async (req, res) => {
    const { user } = req;

    // ✅ Listar departamentos globais (sem filtro de tenant)
    const departments = await prisma.department.findMany({
      where: {
        isActive: true
        },
      include: {
        _count: {
          select: {
            users: true,
            servicesSimplified: true,
            protocolsSimplified: true
        }
      }
        },
      orderBy: {
        name: 'asc'
        }
        });

    const departmentList: DepartmentInfo[] = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      usersCount: dept._count.users,
      servicesCount: dept._count.servicesSimplified,
      protocolsCount: dept._count.protocolsSimplified
        }));

    return res.json(createSuccessResponse({ departments: departmentList }));
  })
);

/**
 * GET /api/admin/reports/team-performance - Relatório de performance da equipe
 */
router.get(
  '/reports/team-performance',
  requirePermission('team:metrics'),
  handleAsyncRoute(async (req, res) => {
    const { user } = req;
    const dateFrom = getStringParam(req.query.dateFrom);
    const dateTo = getStringParam(req.query.dateTo);

    // Definir período (padrão: últimos 30 dias)
    const endDate = dateTo ? new Date(dateTo) : new Date();
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Filtros baseados no nível de acesso
    const protocolFilter: ProtocolFilterInput = {
      createdAt: {
        gte: startDate,
        lte: endDate
        },
      assignedUserId: { not: null }
        };

    // Filtrar por departamento se não for ADMIN
    if (user.role !== 'ADMIN' && user.departmentId) {
      protocolFilter.departmentId = user.departmentId;
    }

    // Performance por usuário
    const userPerformance = await prisma.protocolSimplified.groupBy({
      by: ['assignedUserId'],
      where: {
        ...protocolFilter,
        assignedUserId: { not: null }
        },
      _count: {
        id: true
        }
        });

    // Buscar dados dos usuários
    const userIds = userPerformance.map(item => item.assignedUserId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds as string[] } },
      select: { id: true, name: true, email: true, role: true }
      });

    const performanceWithUsers: UserPerformance[] = userPerformance.map(item => ({
      user: users.find(u => u.id === item.assignedUserId) || {
        id: item.assignedUserId || '',
        name: 'Usuário não encontrado',
        email: '',
        role: ''
      },
      protocolsCount: item._count.id
        }));

    return res.json(createSuccessResponse({
      period: { startDate, endDate },
      userPerformance: performanceWithUsers
        }));
  })
);

// ====================== ERROR HANDLING ======================

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Erro nas rotas de gestão administrativa:', error);

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