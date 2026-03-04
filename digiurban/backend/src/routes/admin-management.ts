// ============================================================================
// ADMIN-MANAGEMENT.TS - ISOLAMENTO PROFISSIONAL COMPLETO
// ============================================================================

import { Router, Response, RequestHandler, Request, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import {
  ROLE_HIERARCHY,
  ROLE_DISPLAY_NAMES,
  TEAM_ROLES,
  canManageRole as canManageRoleHelper,
  getRoleLevel,
  isTeamRole
} from '../types/roles';
import { generateCompleteWorkflowBySubtype } from '../services/workflow-template.service';
import { createServiceWorkflow } from '../services/service-workflow.service';
import {
  buildUserDepartmentScopeWhere,
  extractDepartmentIdsFromOrganization,
  extractPrimaryDepartmentIdFromOrganization,
  getAccessibleDepartmentIdsForUser,
  reconcileAdministrativeDepartmentAssignments,
} from '../services/organizational-context.service';
import { assertDepartmentScopedEntities } from '../services/organizational-integrity.service';
import { syncUserPersonIdentity } from '../services/person-identity.service';
import { normalizeCpf, normalizeEmail, normalizeNullableString } from '../utils/identity';
import { validateCPF } from '../utils/validators';
// Helpers implementados usando assignments como fonte primaria e
// userDepartments/user.departmentId apenas como projecoes de compatibilidade.
const getUserDepartments = (user: any) => {
  const assignmentDepartments =
    user.assignments
      ?.filter((assignment: any) => ['ATIVO', 'AFASTADO', 'LICENCA'].includes(assignment.situacao))
      .map((assignment: any) => ({
        id: assignment.department.id,
        name: assignment.department.name,
        code: assignment.department.code,
        isPrimary: assignment.isPrimary,
        isActive: true
      })) || [];

  if (assignmentDepartments.length > 0) {
    const uniqueDepartments = new Map<string, any>();
    for (const department of assignmentDepartments) {
      if (!uniqueDepartments.has(department.id) || department.isPrimary) {
        uniqueDepartments.set(department.id, department);
      }
    }
    return Array.from(uniqueDepartments.values());
  }

  if (!user.userDepartments) return [];
  return user.userDepartments.map((ud: any) => ({
    id: ud.department.id,
    name: ud.department.name,
    code: ud.department.code,
    isPrimary: ud.isPrimary,
    isActive: ud.isActive
  }));
};

const getPrimaryDepartment = (user: any) => {
  const primaryDepartmentId = extractPrimaryDepartmentIdFromOrganization(user);
  if (!primaryDepartmentId) return null;

  const primaryAssignment = user.assignments?.find(
    (assignment: any) =>
      assignment.departmentId === primaryDepartmentId &&
      ['ATIVO', 'AFASTADO', 'LICENCA'].includes(assignment.situacao)
  );

  if (primaryAssignment?.department) {
    return primaryAssignment.department;
  }

  if (!user.userDepartments) return user.department || null;
  const primary = user.userDepartments.find((ud: any) => ud.departmentId === primaryDepartmentId);
  return primary ? primary.department : user.department || null;
};

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
  departmentId?: string | { in: string[] };
  category?: string;
  isActive?: boolean;
}

// Using Prisma generated type for full compatibility
type UserWhereInput = Prisma.UserWhereInput;

interface ProtocolFilterInput {
  departmentId?: string | { in: string[] };
  createdAt?: {
    gte: Date;
    lte: Date;
  };
  assignedUserId?: { not: null };
}

// ====================== HELPER FUNCTIONS ======================

// ✅ Constantes de roles agora vêm de @/types/roles para centralização

// ✅ Lista oficial das 13 secretarias do sistema
const OFFICIAL_DEPARTMENTS = [
  'Secretaria de Agricultura',
  'Secretaria de Assistência Social',
  'Secretaria de Cultura',
  'Secretaria de Educação',
  'Secretaria de Esportes',
  'Secretaria de Habitação',
  'Secretaria de Meio Ambiente',
  'Secretaria de Obras Públicas',
  'Secretaria de Planejamento Urbano',
  'Secretaria de Saúde',
  'Secretaria de Segurança Pública',
  'Secretaria de Serviços Públicos',
  'Secretaria de Turismo',
  // Novas secretarias
  'Secretaria de Administração',
  'Defesa Civil',
  'Secretaria de Desenvolvimento Econômico',
  'Secretaria de Fazenda',
  'Secretaria de Mobilidade Urbana',
  'Secretaria de Políticas para Mulheres',
  'Secretaria de Tecnologia e Inovação',
  'Secretaria de Transportes e Trânsito'
];

// Alias para manter compatibilidade
const canManageRole = canManageRoleHelper;

async function validateDepartment(departmentId: string): Promise<boolean> {
  const department = await prisma.department.findFirst({
    where: {
      id: departmentId,
      isActive: true,
      name: {
        in: OFFICIAL_DEPARTMENTS
      }
    }
  });
  return !!department;
}

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

// ✅ HELPER: Normalizar requiredDocuments para sempre ser array
function normalizeServiceData<T extends { requiredDocuments?: any }>(service: T): T {
  return {
    ...service,
    requiredDocuments: Array.isArray(service.requiredDocuments)
      ? service.requiredDocuments
      : []
  };
}

function createServiceWhereClause(params: {
  departmentId?: string | { in: string[] };
  departmentIds?: string[];
  category?: string;
  isActive?: boolean;
}): Omit<ServiceWhereInput, 'tenantId'> {
  const where: Omit<ServiceWhereInput, 'tenantId'> = {};

  if (params.departmentIds && params.departmentIds.length > 0) {
    where.departmentId = { in: params.departmentIds };
  } else if (params.departmentId) {
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
  departmentIds?: string[];
  role?: string;
  isActive?: boolean;
  excludeSuperAdmin?: boolean;
}): UserWhereInput {
  const andClauses: UserWhereInput[] = [];
  const scopedDepartmentIds = Array.from(
    new Set(
      [params.departmentId, ...(params.departmentIds || [])].filter(
        (departmentId): departmentId is string => Boolean(departmentId)
      )
    )
  );

  if (scopedDepartmentIds.length > 0) {
    andClauses.push(buildUserDepartmentScopeWhere(scopedDepartmentIds));
  }

  if (params.excludeSuperAdmin) {
    andClauses.push({ role: { not: 'SUPER_ADMIN' as const } });
  }

  if (params.role) {
    andClauses.push({ role: params.role as any });
  }

  if (params.isActive !== undefined) {
    andClauses.push({ isActive: params.isActive });
  }

  if (andClauses.length === 0) {
    return {};
  }

  if (andClauses.length === 1) {
    return andClauses[0];
  }

  return { AND: andClauses };
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

const optionalNullableStringSchema = z.string().nullish();
const optionalNullableDateSchema = z.string().nullish();
const optionalNullableJsonSchema = z.any().nullish();

const initialAssignmentSchema = z.object({
  departmentId: z.string().min(1, 'Departamento da lotação é obrigatório'),
  organizationalUnitId: z.string().min(1, 'Unidade organizacional é obrigatória'),
  positionId: optionalNullableStringSchema,
  functionId: optionalNullableStringSchema,
  dataInicio: optionalNullableDateSchema,
  cargaHoraria: z.number().nullable().optional(),
  percentualDedicacao: z.number().nullable().optional(),
  observacoes: optionalNullableStringSchema
});

const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: strongPasswordSchema,
  role: z.enum(['USER', 'COORDINATOR', 'MANAGER', 'ADMIN']),
  // ✅ SUPORTA AMBOS: antigo e novo
  departmentId: z.string().optional(),           // Schema antigo (1 dept)
  departmentIds: z.array(z.string()).optional(), // Schema novo (N depts)
  primaryDepartmentId: optionalNullableStringSchema,    // Qual é o principal
  // ✅ DADOS DE SERVIDOR PÚBLICO
  cpf: optionalNullableStringSchema,
  matricula: optionalNullableStringSchema,
  rg: optionalNullableStringSchema,
  dataNascimento: optionalNullableDateSchema, // ISO date string
  telefone: optionalNullableStringSchema,
  telefoneSecundario: optionalNullableStringSchema,
  endereco: optionalNullableJsonSchema, // JSON
  cargoEfetivo: optionalNullableStringSchema,
  situacaoFuncional: optionalNullableStringSchema,
  dataAdmissao: optionalNullableDateSchema, // ISO date string
  observacoes: optionalNullableStringSchema,
  initialAssignment: initialAssignmentSchema.optional()
        });

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER', 'COORDINATOR', 'MANAGER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
  // ✅ SUPORTA AMBOS
  departmentId: optionalNullableStringSchema,
  departmentIds: z.array(z.string()).optional(),
  primaryDepartmentId: optionalNullableStringSchema,
  // ✅ DADOS DE SERVIDOR PÚBLICO
  cpf: optionalNullableStringSchema,
  matricula: optionalNullableStringSchema,
  rg: optionalNullableStringSchema,
  dataNascimento: optionalNullableDateSchema, // ISO date string
  telefone: optionalNullableStringSchema,
  telefoneSecundario: optionalNullableStringSchema,
  endereco: optionalNullableJsonSchema, // JSON
  cargoEfetivo: optionalNullableStringSchema,
  situacaoFuncional: optionalNullableStringSchema,
  dataAdmissao: optionalNullableDateSchema, // ISO date string
  observacoes: optionalNullableStringSchema
        });

function normalizeOptionalTextInput(value?: string | null): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return normalizeNullableString(value);
}

function normalizeOptionalDateInput(value?: string | null): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeManagementUserInput<
  T extends {
    name?: string;
    email?: string;
    departmentId?: string | null;
    departmentIds?: string[];
    primaryDepartmentId?: string | null;
    cpf?: string | null;
    matricula?: string | null;
    rg?: string | null;
    dataNascimento?: string | null;
    telefone?: string | null;
    telefoneSecundario?: string | null;
    cargoEfetivo?: string | null;
    situacaoFuncional?: string | null;
    dataAdmissao?: string | null;
    observacoes?: string | null;
    initialAssignment?: {
      departmentId: string;
      organizationalUnitId: string;
      positionId?: string | null;
      functionId?: string | null;
      dataInicio?: string | null;
      observacoes?: string | null;
      cargaHoraria?: number | null;
      percentualDedicacao?: number | null;
    };
  }
>(data: T): T {
  return {
    ...data,
    name: data.name?.trim() as T['name'],
    email: (normalizeEmail(data.email) ?? data.email) as T['email'],
    departmentId: normalizeOptionalTextInput(data.departmentId) as T['departmentId'],
    departmentIds: data.departmentIds?.filter((departmentId) => departmentId.trim().length > 0) as T['departmentIds'],
    primaryDepartmentId: normalizeOptionalTextInput(data.primaryDepartmentId) as T['primaryDepartmentId'],
    cpf: (
      data.cpf === undefined
        ? undefined
        : normalizeOptionalTextInput(normalizeCpf(data.cpf))
    ) as T['cpf'],
    matricula: normalizeOptionalTextInput(data.matricula) as T['matricula'],
    rg: normalizeOptionalTextInput(data.rg) as T['rg'],
    dataNascimento: normalizeOptionalDateInput(data.dataNascimento) as T['dataNascimento'],
    telefone: normalizeOptionalTextInput(data.telefone) as T['telefone'],
    telefoneSecundario: normalizeOptionalTextInput(data.telefoneSecundario) as T['telefoneSecundario'],
    cargoEfetivo: normalizeOptionalTextInput(data.cargoEfetivo) as T['cargoEfetivo'],
    situacaoFuncional: normalizeOptionalTextInput(data.situacaoFuncional) as T['situacaoFuncional'],
    dataAdmissao: normalizeOptionalDateInput(data.dataAdmissao) as T['dataAdmissao'],
    observacoes: normalizeOptionalTextInput(data.observacoes) as T['observacoes'],
    initialAssignment: data.initialAssignment
      ? {
          ...data.initialAssignment,
          positionId: normalizeOptionalTextInput(data.initialAssignment.positionId) ?? undefined,
          functionId: normalizeOptionalTextInput(data.initialAssignment.functionId) ?? undefined,
          dataInicio: normalizeOptionalDateInput(data.initialAssignment.dataInicio) ?? undefined,
          observacoes: normalizeOptionalTextInput(data.initialAssignment.observacoes) ?? undefined,
        }
      : undefined,
  };
}

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
      departmentId?: string | { in: string[] };
      departmentIds?: string[];
      category?: string;
      isActive?: boolean;
    } = {};

    // Filtrar por departamento se não for ADMIN
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      whereParams.departmentIds = await getAccessibleDepartmentIdsForUser({
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId
      });
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

    // ✅ NORMALIZAÇÃO: Garantir que requiredDocuments seja sempre array
    const normalizedServices = services.map(normalizeServiceData);

    return res.json(createPaginatedResponse(normalizedServices, paginationInfo));
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
    let departmentId = data.departmentId || user.departmentId;
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const scopedDepartmentIds = await getAccessibleDepartmentIdsForUser({
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId
      });
      if (scopedDepartmentIds.length === 0) {
        departmentId = undefined;
      } else if (!departmentId || !scopedDepartmentIds.includes(departmentId)) {
        departmentId = scopedDepartmentIds[0];
      }
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

    // ✅ AUTO-GERAÇÃO DE WORKFLOW: Gerar workflow automaticamente
    try {
      const workflowData = generateCompleteWorkflowBySubtype(service as any);
      await createServiceWorkflow({
        serviceId: service.id,
        ...workflowData
      });
      console.log(`✅ Workflow gerado automaticamente para serviço: ${service.name}`);
    } catch (workflowError) {
      console.error(`⚠️  Erro ao gerar workflow para serviço ${service.name}:`, workflowError);
      // Não falhar a criação do serviço se workflow falhar
      // O workflow pode ser criado manualmente depois
    }

    // ✅ NORMALIZAÇÃO: Garantir que requiredDocuments seja sempre array
    const normalizedService = normalizeServiceData(service);

    return res.status(201).json(createSuccessResponse(normalizedService, 'Serviço criado com sucesso'));
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
      departmentId?: string | { in: string[] };
    } = {};

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const scopedDepartmentIds = await getAccessibleDepartmentIdsForUser({
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId
      });
      if (scopedDepartmentIds.length > 0) {
        serviceWhereParams.departmentId = { in: scopedDepartmentIds };
      }
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

    // ✅ NORMALIZAÇÃO: Garantir que requiredDocuments seja sempre array
    const normalizedService = normalizeServiceData(updatedService);

    return res.json(createSuccessResponse(normalizedService, 'Serviço atualizado com sucesso'));
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
    const includeSuperAdmin = getBooleanParam(req.query.includeSuperAdmin);
    const page = getNumberParam(req.query.page) || 1;
    const limit = getNumberParam(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    // Construir filtros baseados no nível de acesso
    const canIncludeSuperAdmin =
      includeSuperAdmin && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

    const whereParams: {
      departmentId?: string;
      departmentIds?: string[];
      role?: string;
      isActive?: boolean;
      excludeSuperAdmin: boolean;
    } = {
      excludeSuperAdmin: !canIncludeSuperAdmin
        };

    // Filtrar por departamento se não for ADMIN
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      whereParams.departmentIds = await getAccessibleDepartmentIdsForUser({
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId
      });
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
          departmentId: true,
          // ✅ DADOS DE SERVIDOR PÚBLICO
          cpf: true,
          matricula: true,
          rg: true,
          dataNascimento: true,
          telefone: true,
          telefoneSecundario: true,
          endereco: true,
          cargoEfetivo: true,
          situacaoFuncional: true,
          dataAdmissao: true,
          observacoes: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true
        }
      },
          // ✅ NOVO: Incluir múltiplos departamentos
          userDepartments: {
            where: { isActive: true },
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            },
            orderBy: [
              { isPrimary: 'desc' },
              { createdAt: 'asc' }
            ]
          },
          // ✅ SISTEMA UNIFICADO: Vínculos funcionais ativos
          assignments: {
            where: {
              situacao: { in: ['ATIVO', 'AFASTADO', 'LICENCA'] }
            },
            include: {
              department: {
                select: { id: true, name: true, code: true }
              },
              organizationalUnit: {
                select: {
                  id: true,
                  nome: true,
                  sigla: true,
                  tipo: true,
                  nivel: true
                }
              },
              position: {
                select: {
                  id: true,
                  nome: true,
                  tipo: true,
                  nivel: true
                }
              },
              function: {
                select: {
                  id: true,
                  nome: true,
                  tipo: true,
                  simbolo: true
                }
              }
            },
            orderBy: [
              { isPrimary: 'desc' },
              { dataInicio: 'desc' }
            ]
          },
          // ✅ Hierarquia: Supervisores
          supervisores: {
            where: { ativo: true },
            select: {
              id: true,
              tipo: true,
              supervisor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  cpf: true,
                  matricula: true
                }
              }
            }
          },
          // ✅ Hierarquia: Subordinados (count)
          subordinados: {
            where: { ativo: true },
            select: {
              id: true
            }
          },
          // ✅ Dados profissionais específicos
          healthData: {
            select: {
              categoria: true,
              registroProfissional: true,
              tipoRegistro: true,
              especialidades: true,
              status: true
            }
          },
          educationData: {
            select: {
              categoria: true,
              formacao: true,
              disciplinas: true,
              nivelEnsino: true
            }
          },
          engineeringData: {
            select: {
              categoria: true,
              registroProfissional: true,
              tipoRegistro: true,
              especialidades: true
            }
          },
          socialAssistanceData: {
            select: {
              categoria: true,
              registroProfissional: true,
              tipoRegistro: true,
              areasAtuacao: true
            }
          },
          _count: {
            select: {
              assignedProtocolsSimplified: true,
              subordinados: true
        }
      }
        },
        orderBy: [{ role: 'desc' }, { name: 'asc' }],
        skip,
        take: limit
        }),
      prisma.user.count({ where }),
    ]);

    // ✅ Adicionar campos computed
    const membersWithDepartments = teamMembers.map(member => ({
      ...member,
      departments: getUserDepartments(member as any),
      primaryDepartment: getPrimaryDepartment(member as any)
    }));

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
        };

    return res.json(createSuccessResponse({ teamMembers: membersWithDepartments, pagination }));
  })
);

/**
 * GET /api/admin/users/:id - Buscar usuário por ID
 */
router.get(
  '/users/:id',
  handleAsyncRoute(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        departmentId: true,
        cpf: true,
        matricula: true,
        rg: true,
        dataNascimento: true,
        telefone: true,
        telefoneSecundario: true,
        endereco: true,
        cargoEfetivo: true,
        situacaoFuncional: true,
        dataAdmissao: true,
        observacoes: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        userDepartments: {
          where: { isActive: true },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        assignments: {
          include: {
            department: {
              select: { id: true, name: true, code: true }
            },
            organizationalUnit: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                tipo: true,
                nivel: true
              }
            },
            position: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                nivel: true
              }
            },
            function: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                simbolo: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { dataInicio: 'desc' }
          ]
        },
        supervisores: {
          where: { ativo: true },
          select: {
            id: true,
            tipo: true,
            ativo: true,
            organizationalUnit: {
              select: {
                id: true,
                nome: true,
                sigla: true
              }
            },
            supervisor: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                assignments: {
                  where: {
                    situacao: { in: ['ATIVO', 'AFASTADO', 'LICENCA'] },
                    isPrimary: true
                  },
                  include: {
                    department: {
                      select: { id: true, name: true, code: true }
                    },
                    organizationalUnit: {
                      select: { id: true, nome: true, sigla: true }
                    },
                    position: {
                      select: { id: true, nome: true }
                    }
                  },
                  orderBy: [{ dataInicio: 'desc' }]
                }
              }
            }
          }
        },
        subordinados: {
          where: { ativo: true },
          select: {
            id: true,
            tipo: true,
            ativo: true,
            organizationalUnit: {
              select: {
                id: true,
                nome: true,
                sigla: true
              }
            },
            subordinado: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                assignments: {
                  where: {
                    situacao: { in: ['ATIVO', 'AFASTADO', 'LICENCA'] },
                    isPrimary: true
                  },
                  include: {
                    department: {
                      select: { id: true, name: true, code: true }
                    },
                    organizationalUnit: {
                      select: { id: true, nome: true, sigla: true }
                    },
                    position: {
                      select: { id: true, nome: true }
                    }
                  },
                  orderBy: [{ dataInicio: 'desc' }]
                }
              }
            }
          }
        },
        healthData: {
          select: {
            categoria: true,
            registroProfissional: true,
            tipoRegistro: true,
            ufRegistro: true,
            cns: true,
            cbo: true,
            especialidades: true,
            status: true
          }
        },
        educationData: {
          select: {
            categoria: true,
            formacao: true,
            disciplinas: true,
            nivelEnsino: true
          }
        },
        engineeringData: {
          select: {
            categoria: true,
            registroProfissional: true,
            tipoRegistro: true,
            especialidades: true
          }
        },
        socialAssistanceData: {
          select: {
            categoria: true,
            registroProfissional: true,
            tipoRegistro: true,
            areasAtuacao: true
          }
        },
        _count: {
          select: {
            assignedProtocolsSimplified: true,
            subordinados: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse('USER_NOT_FOUND', 'Usuário não encontrado')
      );
    }

    const userWithDepartments = {
      ...user,
      departments: getUserDepartments(user as any),
      primaryDepartment: getPrimaryDepartment(user as any)
    };

    return res.json(createSuccessResponse({ user: userWithDepartments }));
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
    const data = normalizeManagementUserInput(createUserSchema.parse(req.body));
    const { user } = req;

    // ✅ VALIDAÇÃO: Verificar se é um role válido para equipe
    // (Zod já garante que só USER, COORDINATOR, MANAGER ou ADMIN são aceitos)
    if (!isTeamRole(data.role)) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_ROLE',
          `O role ${data.role} não é válido para equipe. Roles válidos: ${TEAM_ROLES.join(', ')}`
        )
      );
    }

    // ✅ VALIDAÇÃO DE HIERARQUIA: Verificar se o usuário pode criar o role solicitado
    if (!canManageRole(user.role, data.role)) {
      return res.status(403).json(
        createErrorResponse(
          'FORBIDDEN',
          `Você não pode criar usuários com o cargo ${ROLE_DISPLAY_NAMES[data.role as keyof typeof ROLE_DISPLAY_NAMES]}. Apenas cargos inferiores ao seu (${ROLE_DISPLAY_NAMES[user.role as keyof typeof ROLE_DISPLAY_NAMES]}) são permitidos.`
        )
      );
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findFirst({
      where: {
          email: {
            equals: data.email,
            mode: 'insensitive'
          }
        }
        });

    if (existingUser) {
      return res.status(400).json(
        createErrorResponse('USER_EXISTS', 'Email já está em uso')
      );
    }

    if (data.cpf && !validateCPF(data.cpf)) {
      return res.status(400).json(
        createErrorResponse('INVALID_CPF', 'CPF inválido')
      );
    }

    if (data.cpf) {
      const existingUserByCpf = await prisma.user.findFirst({
        where: { cpf: data.cpf }
      });

      if (existingUserByCpf) {
        return res.status(400).json(
          createErrorResponse('USER_CPF_EXISTS', 'Já existe um servidor com este CPF')
        );
      }
    }

    // ✅ MÚLTIPLOS DEPARTAMENTOS: Processar departmentIds (novo) ou departmentId (legado)
    let departmentIds: string[] = [];
    let primaryDepartmentId: string | null = null;
    const initialAssignment = data.initialAssignment;

    if (data.departmentIds && data.departmentIds.length > 0) {
      // Schema novo: múltiplos departamentos
      departmentIds = data.departmentIds;
      primaryDepartmentId = data.primaryDepartmentId || departmentIds[0];
    } else if (data.departmentId) {
      // Schema legado: single department
      departmentIds = [data.departmentId];
      primaryDepartmentId = data.departmentId;
    }

    if (initialAssignment) {
      await assertDepartmentScopedEntities({
        departmentId: initialAssignment.departmentId,
        organizationalUnitId: initialAssignment.organizationalUnitId,
        positionId: initialAssignment.positionId,
        functionId: initialAssignment.functionId,
      });

      if (!departmentIds.includes(initialAssignment.departmentId)) {
        departmentIds = [initialAssignment.departmentId, ...departmentIds];
      }

      primaryDepartmentId = initialAssignment.departmentId;
    }

    // Se não é ADMIN, forçar apenas seus próprios departamentos
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const scopedDepartmentIds = await getAccessibleDepartmentIdsForUser({
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId
      });

      if (initialAssignment && !scopedDepartmentIds.includes(initialAssignment.departmentId)) {
        return res.status(403).json(
          createErrorResponse(
            'FORBIDDEN',
            'Você não pode criar um servidor com lotação inicial fora do seu escopo organizacional.'
          )
        );
      }

      departmentIds = scopedDepartmentIds;
      primaryDepartmentId = initialAssignment?.departmentId || scopedDepartmentIds[0] || null;
    }

    // ✅ VALIDAÇÃO PROFISSIONAL: Verificar se todos os departamentos existem e são oficiais
    for (const deptId of departmentIds) {
      const isValid = await validateDepartment(deptId);
      if (!isValid) {
        return res.status(400).json(
          createErrorResponse(
            'INVALID_DEPARTMENT',
            `Departamento ${deptId} é inválido ou não encontrado. Apenas as 13 secretarias oficiais podem ser selecionadas.`
          )
        );
      }
    }

    // Verificar se o primary existe na lista
    if (primaryDepartmentId && !departmentIds.includes(primaryDepartmentId)) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_PRIMARY',
          'O departamento principal deve estar na lista de departamentos selecionados.'
        )
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          isActive: true,
          mustChangePassword: true,
          // ✅ DADOS DE SERVIDOR PÚBLICO
          cpf: data.cpf || null,
          matricula: data.matricula || null,
          rg: data.rg || null,
          dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
          telefone: data.telefone || null,
          telefoneSecundario: data.telefoneSecundario || null,
          endereco: data.endereco || null,
          cargoEfetivo: data.cargoEfetivo || null,
          situacaoFuncional: data.situacaoFuncional || 'ATIVO',
          dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao) : null,
          observacoes: data.observacoes || null,
        },
        select: {
          id: true,
          personId: true,
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
          },
          userDepartments: {
            where: { isActive: true },
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }]
          }
        }
      });

      await syncUserPersonIdentity(tx, {
        userId: createdUser.id,
        currentPersonId: createdUser.personId,
        cpf: data.cpf,
        name: data.name,
        email: data.email,
        phone: data.telefone,
        rg: data.rg,
        birthDate: data.dataNascimento ? new Date(data.dataNascimento) : null,
        isActive: true,
      });

      if (initialAssignment) {
        await tx.employeeAssignment.create({
          data: {
            userId: createdUser.id,
            departmentId: initialAssignment.departmentId,
            organizationalUnitId: initialAssignment.organizationalUnitId,
            positionId: initialAssignment.positionId || null,
            functionId: initialAssignment.functionId || null,
            tipo: 'LOTACAO',
            situacao: 'ATIVO',
            isPrimary: true,
            dataInicio: initialAssignment.dataInicio ? new Date(initialAssignment.dataInicio) : new Date(),
            cargaHoraria: initialAssignment.cargaHoraria ?? null,
            percentualDedicacao: initialAssignment.percentualDedicacao ?? null,
            observacoes: initialAssignment.observacoes || 'Lotação inicial criada no cadastro do servidor.',
            createdBy: user.id
          }
        });
      }

      return createdUser;
    });

    // ✅ Adicionar campos computed
    await reconcileAdministrativeDepartmentAssignments({
      userId: newUser.id,
      departmentIds,
      primaryDepartmentId,
      executorId: user.id
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        userDepartments: {
          where: { isActive: true },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        assignments: {
          where: {
            situacao: { in: ['ATIVO', 'AFASTADO', 'LICENCA'] }
          },
          include: {
            department: {
              select: { id: true, name: true, code: true }
            },
            organizationalUnit: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                tipo: true,
                nivel: true
              }
            },
            position: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                nivel: true
              }
            },
            function: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                simbolo: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { dataInicio: 'desc' }
          ]
        }
      }
    });

    const userWithDepartments = {
      ...(refreshedUser || newUser),
      departments: getUserDepartments((refreshedUser || newUser) as any),
      primaryDepartment: getPrimaryDepartment((refreshedUser || newUser) as any)
    };

    return res.status(201).json(
      createSuccessResponse(userWithDepartments, 'Membro da equipe criado com sucesso')
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
    const data = normalizeManagementUserInput(updateUserSchema.parse(req.body));
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
      departmentIds?: string[];
      excludeSuperAdmin: boolean;
    } = {
      excludeSuperAdmin: true
        };

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      userWhereParams.departmentIds = await getAccessibleDepartmentIdsForUser({
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId
      });
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

    // ✅ VALIDAÇÃO DE HIERARQUIA: Verificar se o usuário pode gerenciar o role do target
    if (!canManageRole(user.role, targetUser.role)) {
      return res.status(403).json(
        createErrorResponse(
          'FORBIDDEN',
          `Você não pode editar usuários com role ${targetUser.role}. Apenas roles inferiores ao seu (${user.role}) são permitidos.`
        )
      );
    }

    // ✅ VALIDAÇÃO DE HIERARQUIA: Se está alterando o role, verificar se pode criar o novo role
    if (data.role && !canManageRole(user.role, data.role)) {
      return res.status(403).json(
        createErrorResponse(
          'FORBIDDEN',
          `Você não pode atribuir o role ${data.role}. Apenas roles inferiores ao seu (${user.role}) são permitidos.`
        )
      );
    }

    // Verificar se não está tentando alterar seu próprio usuário
    if (targetUser.id === user.id) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Você não pode alterar seu próprio usuário')
      );
    }

    if (data.email && data.email !== targetUser.email) {
      const existingUserWithEmail = await prisma.user.findFirst({
        where: {
          email: {
            equals: data.email,
            mode: 'insensitive'
          },
          id: { not: userId }
        }
      });

      if (existingUserWithEmail) {
        return res.status(400).json(
          createErrorResponse('USER_EXISTS', 'Email já está em uso')
        );
      }
    }

    if (data.cpf && !validateCPF(data.cpf)) {
      return res.status(400).json(
        createErrorResponse('INVALID_CPF', 'CPF inválido')
      );
    }

    if (data.cpf) {
      const existingUserWithCpf = await prisma.user.findFirst({
        where: {
          cpf: data.cpf,
          id: { not: userId }
        }
      });

      if (existingUserWithCpf) {
        return res.status(400).json(
          createErrorResponse('USER_CPF_EXISTS', 'Já existe um servidor com este CPF')
        );
      }
    }

    // ✅ MÚLTIPLOS DEPARTAMENTOS: Processar departmentIds (novo) ou departmentId (legado)
    let departmentIds: string[] | undefined;
    let primaryDepartmentId: string | null | undefined;

    if (data.departmentIds !== undefined) {
      // Schema novo: múltiplos departamentos
      departmentIds = data.departmentIds;
      primaryDepartmentId = data.primaryDepartmentId || (departmentIds.length > 0 ? departmentIds[0] : null);
    } else if (data.departmentId !== undefined) {
      // Schema legado: single department
      departmentIds = data.departmentId ? [data.departmentId] : [];
      primaryDepartmentId = data.departmentId;
    }

    // ✅ VALIDAÇÃO PROFISSIONAL: Verificar se todos os departamentos existem e são oficiais
    if (departmentIds && departmentIds.length > 0) {
      for (const deptId of departmentIds) {
        const isValid = await validateDepartment(deptId);
        if (!isValid) {
          return res.status(400).json(
            createErrorResponse(
              'INVALID_DEPARTMENT',
              `Departamento ${deptId} é inválido ou não encontrado. Apenas as 13 secretarias oficiais podem ser selecionadas.`
            )
          );
        }
      }

      // Verificar se o primary existe na lista
      if (primaryDepartmentId && !departmentIds.includes(primaryDepartmentId)) {
        return res.status(400).json(
          createErrorResponse(
            'INVALID_PRIMARY',
            'O departamento principal deve estar na lista de departamentos selecionados.'
          )
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
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // ✅ DADOS DE SERVIDOR PÚBLICO
    if (data.cpf !== undefined) updateData.cpf = data.cpf || null;
    if (data.matricula !== undefined) updateData.matricula = data.matricula || null;
    if (data.rg !== undefined) updateData.rg = data.rg || null;
    if (data.dataNascimento !== undefined) updateData.dataNascimento = data.dataNascimento ? new Date(data.dataNascimento) : null;
    if (data.telefone !== undefined) updateData.telefone = data.telefone || null;
    if (data.telefoneSecundario !== undefined) updateData.telefoneSecundario = data.telefoneSecundario || null;
    if (data.endereco !== undefined) updateData.endereco = data.endereco || null;
    if (data.cargoEfetivo !== undefined) updateData.cargoEfetivo = data.cargoEfetivo || null;
    if (data.situacaoFuncional !== undefined) updateData.situacaoFuncional = data.situacaoFuncional || null;
    if (data.dataAdmissao !== undefined) updateData.dataAdmissao = data.dataAdmissao ? new Date(data.dataAdmissao) : null;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes || null;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: updateData
      });

      await syncUserPersonIdentity(tx, {
        userId,
        currentPersonId: targetUser.personId,
        cpf: data.cpf !== undefined ? data.cpf : targetUser.cpf,
        name: data.name ?? targetUser.name,
        email: data.email ?? targetUser.email,
        phone: data.telefone !== undefined ? data.telefone : targetUser.telefone,
        rg: data.rg !== undefined ? data.rg : targetUser.rg,
        birthDate:
          data.dataNascimento !== undefined
            ? data.dataNascimento
              ? new Date(data.dataNascimento)
              : null
            : targetUser.dataNascimento,
        isActive: data.isActive ?? updated.isActive,
      });

      return tx.user.findUnique({
        where: { id: userId },
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
          },
          userDepartments: {
            where: { isActive: true },
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            },
            orderBy: [
              { isPrimary: 'desc' },
              { createdAt: 'asc' }
            ]
          }
        }
      });
    });

    // ✅ Adicionar campos computed
    if (departmentIds !== undefined) {
      await reconcileAdministrativeDepartmentAssignments({
        userId,
        departmentIds,
        primaryDepartmentId,
        executorId: user.id
      });
    }

    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        userDepartments: {
          where: { isActive: true },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        assignments: {
          where: {
            situacao: { in: ['ATIVO', 'AFASTADO', 'LICENCA'] }
          },
          include: {
            department: {
              select: { id: true, name: true, code: true }
            },
            organizationalUnit: {
              select: {
                id: true,
                nome: true,
                sigla: true,
                tipo: true,
                nivel: true
              }
            },
            position: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                nivel: true
              }
            },
            function: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                simbolo: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { dataInicio: 'desc' }
          ]
        }
      }
    });

    const userWithDepartments = {
      ...(refreshedUser || updatedUser),
      departments: getUserDepartments((refreshedUser || updatedUser) as any),
      primaryDepartment: getPrimaryDepartment((refreshedUser || updatedUser) as any)
    };

    return res.json(createSuccessResponse(userWithDepartments, 'Membro da equipe atualizado com sucesso'));
  })
);

/**
 * DELETE /api/admin/team/:id - Excluir membro da equipe
 */
router.delete(
  '/team/:id',
  requirePermission('team:manage'),
  auditLog('DELETE_TEAM_MEMBER'),
  handleAsyncRoute(async (req, res) => {
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
      departmentIds?: string[];
      excludeSuperAdmin: boolean;
    } = {
      excludeSuperAdmin: true
        };

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      userWhereParams.departmentIds = await getAccessibleDepartmentIdsForUser({
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId
      });
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

    // ✅ VALIDAÇÃO DE HIERARQUIA: Verificar se o usuário pode excluir o role do target
    if (!canManageRole(user.role, targetUser.role)) {
      return res.status(403).json(
        createErrorResponse(
          'FORBIDDEN',
          `Você não pode excluir usuários com role ${targetUser.role}. Apenas roles inferiores ao seu (${user.role}) são permitidos.`
        )
      );
    }

    // Verificar se não está tentando excluir seu próprio usuário
    if (targetUser.id === user.id) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Você não pode excluir seu próprio usuário')
      );
    }

    // Verificar se o usuário tem protocolos atribuídos
    const assignedProtocolsCount = await prisma.protocolSimplified.count({
      where: {
        assignedUserId: userId
      }
    });

    if (assignedProtocolsCount > 0) {
      // Em vez de excluir, apenas desativar o usuário
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return res.json(
        createSuccessResponse(
          { userId, assignedProtocols: assignedProtocolsCount },
          `Usuário desativado pois possui ${assignedProtocolsCount} protocolo(s) atribuído(s). Para preservar o histórico, o usuário foi desativado ao invés de excluído.`
        )
      );
    }

    // Se não tem protocolos, pode excluir
    await prisma.user.delete({
      where: { id: userId }
    });

    return res.json(
      createSuccessResponse({ userId }, 'Usuário excluído com sucesso')
    );
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

    // ✅ Listar apenas departamentos oficiais ativos
    const departments = await prisma.department.findMany({
      where: {
        isActive: true,
        name: {
          in: OFFICIAL_DEPARTMENTS
        }
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

    // ✅ Log profissional para auditoria
    console.log(`📊 [DEPARTMENTS] Retornando ${departmentList.length}/${OFFICIAL_DEPARTMENTS.length} departamentos oficiais`);

    if (departmentList.length < OFFICIAL_DEPARTMENTS.length) {
      console.warn(`⚠️  [DEPARTMENTS] Alguns departamentos oficiais não foram encontrados no banco de dados`);
      const foundNames = departmentList.map(d => d.name);
      const missing = OFFICIAL_DEPARTMENTS.filter(name => !foundNames.includes(name));
      console.warn(`   Departamentos faltando: ${missing.join(', ')}`);
    }

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
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      const scopedDepartmentIds = await getAccessibleDepartmentIdsForUser({
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId
      });
      if (scopedDepartmentIds.length > 0) {
        protocolFilter.departmentId = { in: scopedDepartmentIds };
      }
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
