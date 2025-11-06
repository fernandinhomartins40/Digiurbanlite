/**
 * Middleware de Account Lockout
 * Proteção contra ataques de força bruta através de bloqueio temporário de conta
 * Conforme OWASP Authentication Cheat Sheet 2024
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ACCOUNT_LOCKOUT } from '../config/security';
import { logAccountLocked } from '../utils/audit-logger';

/**
 * Verifica se a conta está bloqueada por tentativas excessivas de login
 * @param model 'user' ou 'citizen'
 * @param identifier email (user) ou cpf/email (citizen)
 * @param tenantId ID do tenant
 */
export async function checkAccountLockout(
  model: 'user' | 'citizen',
  identifier: string
): Promise<{ isLocked: boolean; remainingTime?: number }> {
  try {
    let account: { lockedUntil: Date | null } | null = null;

    if (model === 'user') {
      account = await prisma.user.findFirst({
        where: {
          email: identifier
        },
        select: {
          lockedUntil: true
      }
      });
    } else {
      account = await prisma.citizen.findFirst({
        where: {
          OR: [{ cpf: identifier }, { email: identifier }]
        },
        select: {
          lockedUntil: true
      }
      });
    }

    if (!account || !account.lockedUntil) {
      return { isLocked: false };
    }

    const now = new Date();
    if (account.lockedUntil > now) {
      const remainingTime = Math.ceil((account.lockedUntil.getTime() - now.getTime()) / 1000 / 60);
      return { isLocked: true, remainingTime };
    }

    // Se o bloqueio expirou, resetar os campos
    if (model === 'user') {
      await prisma.user.updateMany({
        where: {
          email: identifier
        },
        data: {
          lockedUntil: null,
          failedLoginAttempts: 0
      }
      });
    } else {
      await prisma.citizen.updateMany({
        where: {
          OR: [{ cpf: identifier }, { email: identifier }]
        },
        data: {
          lockedUntil: null,
          failedLoginAttempts: 0
      }
      });
    }

    return { isLocked: false };
  } catch (error) {
    console.error('[SECURITY] Erro ao verificar bloqueio de conta:', error);
    return { isLocked: false }; // Em caso de erro, permitir tentativa (fail open)
      }
}

/**
 * Incrementa contador de tentativas falhadas e bloqueia conta se necessário
 * @param model 'user' ou 'citizen'
 * @param identifier email (user) ou cpf/email (citizen)
 * @param tenantId ID do tenant
 */
export async function recordFailedLogin(
  model: 'user' | 'citizen',
  identifier: string
): Promise<void> {
  try {
    let account: { id: string; failedLoginAttempts: number } | null = null;

    if (model === 'user') {
      account = await prisma.user.findFirst({
        where: {
          email: identifier
        },
        select: {
          id: true,
          failedLoginAttempts: true
      }
      });
    } else {
      account = await prisma.citizen.findFirst({
        where: {
          OR: [{ cpf: identifier }, { email: identifier }]
        },
        select: {
          id: true,
          failedLoginAttempts: true
      }
      });
    }

    if (!account) {
      return; // Conta não existe, não fazer nada
    }

    const newAttempts = account.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= ACCOUNT_LOCKOUT.MAX_FAILED_ATTEMPTS;

    const updateData: any = {
      failedLoginAttempts: newAttempts
        };

    if (shouldLock) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MINUTES);
      updateData.lockedUntil = lockUntil;

      console.warn(
        `[SECURITY] Conta bloqueada por ${ACCOUNT_LOCKOUT.LOCKOUT_DURATION_MINUTES} minutos - ` +
        `Tipo: ${model}, ID: ${account.id}, Tentativas: ${newAttempts}`
      );

      // Log de auditoria: conta bloqueada
      await logAccountLocked(model, account.id, newAttempts);
    }

    if (model === 'user') {
      await prisma.user.update({
        where: { id: account.id },
        data: updateData
      });
    } else {
      await prisma.citizen.update({
        where: { id: account.id },
        data: updateData
      });
      }
  } catch (error) {
    console.error('[SECURITY] Erro ao registrar tentativa falhada:', error);
      }
}

/**
 * Reseta contador de tentativas falhadas após login bem-sucedido
 * @param model 'user' ou 'citizen'
 * @param id ID do usuário/cidadão
 */
export async function resetFailedAttempts(
  model: 'user' | 'citizen',
  id: string
): Promise<void> {
  try {
    if (model === 'user') {
      await prisma.user.update({
        where: { id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date()
      }
      });
    } else {
      await prisma.citizen.update({
        where: { id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date()
      }
      });
      }
  } catch (error) {
    console.error('[SECURITY] Erro ao resetar tentativas falhadas:', error);
      }
}

/**
 * Factory para middleware de verificação de bloqueio de conta
 * Usa antes da validação de credenciais
 */
export const accountLockoutMiddleware = (model: 'user' | 'citizen') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenant } = req as any;
      if (!tenant) {
        return next();
      }

      let identifier: string | undefined;
      if (model === 'user') {
        identifier = req.body.email;
      } else {
        identifier = req.body.login; // CPF ou email
      }

      if (!identifier) {
        return next();
      }

      const { isLocked, remainingTime } = await checkAccountLockout(model, identifier);

      if (isLocked) {
        console.warn(
          `[SECURITY] Tentativa de login em conta bloqueada - ` +
          `Tipo: ${model}, Identifier: ${identifier}`
        );

        res.status(423).json({
          success: false,
          error: 'Account locked',
          message: `Conta bloqueada por tentativas excessivas de login. Tente novamente em ${remainingTime} minutos.`,
          remainingTime
      });
        return;
      }

      next();
    } catch (error) {
      console.error('[SECURITY] Erro no middleware de bloqueio de conta:', error);
      next(); // Em caso de erro, permitir tentativa (fail open)
      }
  };
};
