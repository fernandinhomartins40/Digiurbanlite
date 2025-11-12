import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UserRole } from '@prisma/client';
import {
  AuthenticatedRequest,
  UserWithRelations,
  JWTPayload,
  RoleHierarchy
        } from '../types';

/**
 * Middleware de autenticação básica para administradores
 * Usa tipos centralizados e validação robusta
 */
export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Tentar obter token do cookie primeiro, depois do header Authorization (fallback)
    let token = req.cookies?.digiurban_admin_token;
    const authHeader = req.headers.authorization;

    console.log('[AUTH DEBUG] URL:', req.method, req.originalUrl || req.url);
    console.log('[AUTH DEBUG] Path:', req.path);
    console.log('[AUTH DEBUG] Cookie Token:', token ? 'EXISTS' : 'MISSING');
    console.log('[AUTH DEBUG] Headers Authorization:', authHeader ? 'EXISTS' : 'MISSING');

    // Se não tiver token no cookie, tentar header Authorization (compatibilidade retroativa)
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('[AUTH DEBUG] Using token from Authorization header (fallback)');
    }

    if (!token) {
      console.log('[AUTH DEBUG] REJECTED: No token in cookie or Authorization header');
      res.status(401).json({ error: 'Token de acesso necessário' });
      return;
    }

    // Verificar e decodificar o token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      res.status(500).json({ error: 'Configuração de segurança inválida' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Verificar se é um token de admin (se existir essa propriedade)
    const tokenWithType = decoded as JWTPayload & { type?: string };
    if (tokenWithType.type && tokenWithType.type !== 'admin') {
      res.status(401).json({ error: 'Token inválido para acesso admin' });
      return;
    }

    // Single tenant: verificação de tenant removida

    // Buscar o usuário no banco com tipos seguros
    const user: UserWithRelations | null = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        isActive: true
        },
      include: {
        department: true
      }
      });

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
      return;
    }

    // Adicionar usuário e informações à requisição usando tipos seguros
    (req as AuthenticatedRequest).userId = user.id;
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).userRole = user.role;

    next();
  } catch (error: unknown) {
    console.error('Erro na autenticação do admin:', error);

    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Token inválido' });
        return;
      }

      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expirado' });
        return;
      }
    }

    res.status(500).json({ error: 'Erro interno na autenticação' });
      }
};

/**
 * Factory para middleware de verificação de permissões específicas
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { user } = req as AuthenticatedRequest;

    if (!user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const userPermissions = getRolePermissions(user.role);

    if (!userPermissions.includes(permission)) {
      res.status(403).json({
        error: 'Acesso negado',
        required: permission,
        role: user.role
      });
      return;
    }

    next();
  };
};

/**
 * Factory para middleware de verificação de múltiplas permissões
 * Usuário precisa ter pelo menos uma das permissões
 */
export const requireAnyPermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { user } = req as AuthenticatedRequest;

    if (!user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const userPermissions = getRolePermissions(user.role);
    const hasPermission = permissions.some(permission => userPermissions.includes(permission));

    if (!hasPermission) {
      res.status(403).json({
        error: 'Acesso negado',
        required: permissions,
        role: user.role
      });
      return;
    }

    next();
  };
};

/**
 * Factory para middleware de verificação de role mínimo
 */
export const requireMinRole = (minRole: UserRole) => {
  const roleHierarchy: RoleHierarchy = {
    GUEST: 0,
    USER: 1,
    COORDINATOR: 2,
    MANAGER: 3,
    ADMIN: 4,
    SUPER_ADMIN: 5
        };

  return (req: Request, res: Response, next: NextFunction): void => {
    const { user } = req as AuthenticatedRequest;

    if (!user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[minRole] || 999;

    if (userLevel < requiredLevel) {
      res.status(403).json({
        error: 'Nível de acesso insuficiente',
        required: minRole,
        current: user.role
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar acesso ao departamento
 */
export const requireDepartmentAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { user } = req as AuthenticatedRequest;
  const departmentId = req.params.departmentId || req.body.departmentId;

  if (!user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  // ADMIN tem acesso a todos os departamentos
  if (user.role === UserRole.ADMIN) {
    next();
    return;
  }

  // Outros níveis só acessam seu próprio departamento
  if (user.departmentId !== departmentId) {
    res.status(403).json({
      error: 'Acesso negado: você só pode acessar seu próprio departamento'
      });
    return;
  }

  next();
};

// Interface para filtros de dados baseados em role
interface DataFilters {
  assignedUserId?: string;
  departmentId?: string;
  createdById?: string; // ✅ Correto: createdById
  id?: string; // Para caso de 'no-access'
}

/**
 * Middleware para filtrar dados baseado na função do usuário
 */
export const addDataFilter = (req: Request, res: Response, next: NextFunction): void => {
  const { user } = req as AuthenticatedRequest;

  if (!user) {
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  // Adicionar filtros baseados na função
  const filters: DataFilters = {};

  switch (user.role) {
    case UserRole.USER:
      // Funcionário vê apenas protocolos atribuídos a ele
      filters.assignedUserId = user.id;
      break;

    case UserRole.COORDINATOR:
    case UserRole.MANAGER:
      // Coordenador e Secretário veem apenas do seu departamento
      if (user.departmentId) {
        filters.departmentId = user.departmentId;
      }
      break;

    case UserRole.ADMIN:
    case UserRole.SUPER_ADMIN:
      // Admin vê todos os dados do tenant (filtro já aplicado)
      break;

    default:
      // Guest ou outros roles - sem dados
      filters.id = 'no-access';
      break;
  }

  // Adicionar filtros à requisição usando tipos seguros
  (req as any).dataFilters = filters;

  next();
};

/**
 * Função para obter permissões baseadas na função
 */
function getRolePermissions(role: UserRole): string[] {
  const rolePermissions: Record<UserRole, string[]> = {
    [UserRole.GUEST]: [],
    [UserRole.USER]: [
      'protocols:read',
      'protocols:update',
      'protocols:comment',
      'department:read',
      // Permissões de cidadãos para todos servidores
      'citizens:read',
      'citizens:create',
      'citizens:verify',
      'citizens:update',
      'social-assistance:read',
      'social-assistance:create',
      'social-assistance:update',
    ],
    [UserRole.COORDINATOR]: [
      'protocols:read',
      'protocols:update',
      'protocols:assign',
      'protocols:comment',
      'team:read',
      'team:metrics',
      'department:read',
      // Permissões de cidadãos para todos servidores
      'citizens:read',
      'citizens:create',
      'citizens:verify',
      'citizens:update',
      'social-assistance:read',
      'social-assistance:create',
      'social-assistance:update',
    ],
    [UserRole.MANAGER]: [
      'protocols:read',
      'protocols:update',
      'protocols:assign',
      'protocols:comment',
      'services:create',
      'services:update',
      'team:read',
      'team:manage',
      'reports:department',
      'department:manage',
      // Permissões de cidadãos para todos servidores
      'citizens:read',
      'citizens:create',
      'citizens:verify',
      'citizens:update',
      'citizens:manage',
      'social-assistance:read',
      'social-assistance:create',
      'social-assistance:update',
    ],
    [UserRole.ADMIN]: [
      'protocols:read',
      'protocols:update',
      'protocols:assign',
      'protocols:comment',
      'protocols:create',
      'services:create',
      'services:update',
      'services:delete',
      'team:read',
      'team:manage',
      'citizens:read',
      'citizens:create',
      'citizens:verify',
      'citizens:update',
      'citizens:manage',
      'chamados:create',
      'reports:full',
      'departments:read',
      'analytics:full',
      'social-assistance:read',
      'social-assistance:create',
      'social-assistance:update',
    ],
    [UserRole.SUPER_ADMIN]: [
      'system:admin',
      'tenants:manage',
      'users:super_manage',
      '*', // Todas as permissões
    ]
        };

  return rolePermissions[role] || [];
}

/**
 * Factory para middleware de log de auditoria
 */
export const auditLog = (action: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const { user } = req as AuthenticatedRequest;

    if (user) {
      console.log(
        `[AUDIT] ${new Date().toISOString()} - User: ${user.email} (${user.role}) - Action: ${action} - IP: ${req.ip}`
      );

      // Aqui você poderia salvar no banco de dados para auditoria
      // await prisma.auditLog.create({
      //   data: {
      //     userId: user.id,
      //     action,
      //     ip: req.ip,
      //     userAgent: req.headers['user-agent']
      //   }
      // });
    }

    next();
  };
};
