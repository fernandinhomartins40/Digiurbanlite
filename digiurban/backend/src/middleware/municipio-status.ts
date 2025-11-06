import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Middleware para verificar se o município está ativo
 * Bloqueia requisições se o município estiver suspenso ou inativo
 */
export const checkMunicipioStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Rotas públicas que não devem ser bloqueadas
    const publicRoutes = [
      '/api/auth/admin/login',
      '/api/auth/citizen/login',
      '/api/public/',
      '/api/super-admin/' // Super admin sempre pode acessar
    ];

    // Verificar se é uma rota pública
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    if (isPublicRoute) {
      return next();
    }

    // Buscar configuração do município
    const municipio = await prisma.municipioConfig.findUnique({
      where: { id: 'singleton' },
      select: {
        isActive: true,
        isSuspended: true,
        suspensionReason: true,
        paymentStatus: true
      }
    });

    if (!municipio) {
      return res.status(503).json({
        error: 'Sistema não configurado',
        message: 'O sistema ainda não foi configurado. Entre em contato com o suporte.'
      });
    }

    // Verificar se está suspenso
    if (municipio.isSuspended) {
      return res.status(403).json({
        error: 'Município suspenso',
        message: municipio.suspensionReason || 'O acesso ao sistema foi temporariamente suspenso.',
        code: 'MUNICIPALITY_SUSPENDED'
      });
    }

    // Verificar se está ativo
    if (!municipio.isActive) {
      return res.status(403).json({
        error: 'Município inativo',
        message: 'O acesso ao sistema está desativado. Entre em contato com o suporte.',
        code: 'MUNICIPALITY_INACTIVE'
      });
    }

    // Verificar status de pagamento
    if (municipio.paymentStatus === 'suspended') {
      return res.status(402).json({
        error: 'Pagamento pendente',
        message: 'O acesso ao sistema foi suspenso por falta de pagamento. Regularize sua situação para continuar.',
        code: 'PAYMENT_REQUIRED'
      });
    }

    if (municipio.paymentStatus === 'overdue') {
      // Avisar mas não bloquear (ainda)
      (res as any).paymentWarning = {
        status: 'overdue',
        message: 'Existe um pagamento em atraso. Regularize sua situação para evitar suspensão.'
      };
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar status do município:', error);
    // Em caso de erro, permite acesso (fail-open para não travar o sistema)
    next();
  }
};

/**
 * Middleware para verificar limites de uso (usuários e cidadãos)
 */
export const checkUsageLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Apenas verificar em rotas de criação
    const isCreationRoute = req.method === 'POST' && (
      req.path.includes('/users') ||
      req.path.includes('/citizen/register')
    );

    if (!isCreationRoute) {
      return next();
    }

    const municipio = await prisma.municipioConfig.findUnique({
      where: { id: 'singleton' },
      select: {
        maxUsers: true,
        maxCitizens: true
      }
    });

    if (!municipio) {
      return next();
    }

    // Verificar limite de usuários
    if (req.path.includes('/users')) {
      const currentUsers = await prisma.user.count({ where: { isActive: true } });
      if (currentUsers >= municipio.maxUsers) {
        return res.status(403).json({
          error: 'Limite de usuários atingido',
          message: `O município atingiu o limite de ${municipio.maxUsers} usuários. Atualize seu plano para adicionar mais usuários.`,
          code: 'USER_LIMIT_REACHED',
          current: currentUsers,
          limit: municipio.maxUsers
        });
      }
    }

    // Verificar limite de cidadãos
    if (req.path.includes('/citizen/register')) {
      const currentCitizens = await prisma.citizen.count({ where: { isActive: true } });
      if (currentCitizens >= municipio.maxCitizens) {
        return res.status(403).json({
          error: 'Limite de cidadãos atingido',
          message: `O município atingiu o limite de ${municipio.maxCitizens} cidadãos cadastrados. Entre em contato com o suporte para aumentar o limite.`,
          code: 'CITIZEN_LIMIT_REACHED',
          current: currentCitizens,
          limit: municipio.maxCitizens
        });
      }
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar limites de uso:', error);
    next();
  }
};
