/**
 * Audit Logger - Sistema de auditoria de segurança (LGPD)
 * Registra eventos críticos do sistema para conformidade
 */

import { prisma } from '../lib/prisma';
import { Request } from 'express';

export interface AuditLogData {
  // Identificação do ator
  userId?: string;
  citizenId?: string;

  // Ação realizada
  action: string;
  resource?: string;
  method?: string;

  // Detalhes adicionais
  details?: Record<string, any>;

  // Informações da requisição
  ip?: string;
  userAgent?: string;

  // Status da operação
  success: boolean;
  errorMessage?: string;
}

/**
 * Registra um evento de auditoria no banco de dados
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        citizenId: data.citizenId,
        action: data.action,
        resource: data.resource,
        method: data.method,
        details: data.details ? JSON.parse(JSON.stringify(data.details)) : undefined,
        ip: data.ip,
        userAgent: data.userAgent,
        success: data.success,
        errorMessage: data.errorMessage
        }
        });

    // Log console para desenvolvimento/debug
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[AUDIT] ${data.action} - ` +
        `User: ${data.userId || data.citizenId || 'anônimo'} - ` +
        `Success: ${data.success}`
      );
    }
  } catch (error) {
    // Nunca falhar a operação por erro de auditoria
    console.error('[AUDIT] Erro ao registrar evento de auditoria:', error);
  }
}

/**
 * Helper para criar log de auditoria a partir de uma requisição Express
 */
export async function logFromRequest(
  req: Request,
  action: string,
  success: boolean,
  options?: {
    userId?: string;
    citizenId?: string;
    details?: Record<string, any>;
    errorMessage?: string;
  }
): Promise<void> {
  const tenant = (req as any).tenant;
  if (!tenant) {
    console.warn('[AUDIT] Tentativa de log sem tenant identificado');
    return;
  }

  await logAuditEvent({
    userId: options?.userId,
    citizenId: options?.citizenId,
    action,
    resource: req.path,
    method: req.method,
    details: options?.details,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    success,
    errorMessage: options?.errorMessage
        });
}

/**
 * Eventos críticos de segurança pré-definidos
 */
export const AUDIT_EVENTS = {
  // Autenticação
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',

  // Gerenciamento de Conta
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',

  // Cadastros
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  CITIZEN_REGISTERED: 'citizen_registered',
  CITIZEN_UPDATED: 'citizen_updated',
  CITIZEN_VERIFIED: 'citizen_verified',

  // Acessos Sensíveis (LGPD)
  SENSITIVE_DATA_ACCESS: 'sensitive_data_access',
  DATA_EXPORT: 'data_export',
  BULK_DATA_ACCESS: 'bulk_data_access',

  // Permissões
  PERMISSION_CHANGE: 'permission_change',
  ROLE_CHANGE: 'role_change',

  // Sistema
  SYSTEM_CONFIG_CHANGE: 'system_config_change',
  TENANT_CREATED: 'tenant_created',
  TENANT_CONFIG_CHANGE: 'tenant_config_change'
        } as const;

/**
 * Helper para log de login bem-sucedido
 */
export async function logLoginSuccess(
  req: Request,
  userType: 'user' | 'citizen',
  userId: string
): Promise<void> {
  await logAuditEvent({
    userId: userType === 'user' ? userId : undefined,
    citizenId: userType === 'citizen' ? userId : undefined,
        action: AUDIT_EVENTS.LOGIN_SUCCESS,
    resource: req.path,
    method: req.method,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    success: true
        });
}

/**
 * Helper para log de login falhado
 */
export async function logLoginFailed(
  req: Request,
  identifier: string,
  reason: string
): Promise<void> {
  await logAuditEvent({
        action: AUDIT_EVENTS.LOGIN_FAILED,
    resource: req.path,
    method: req.method,
    details: { identifier, reason },
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    success: false,
    errorMessage: reason
        });
}

/**
 * Helper para log de bloqueio de conta
 */
export async function logAccountLocked(
  userType: 'user' | 'citizen',
  userId: string,
  failedAttempts: number
): Promise<void> {
  await logAuditEvent({
    userId: userType === 'user' ? userId : undefined,
    citizenId: userType === 'citizen' ? userId : undefined,
        action: AUDIT_EVENTS.ACCOUNT_LOCKED,
    details: { failedAttempts },
    success: true
        });
}

/**
 * Helper para log de acesso a dados sensíveis (LGPD)
 */
export async function logSensitiveDataAccess(
  req: Request,
  userId: string,
  dataType: string,
  resourceId: string
): Promise<void> {
  await logAuditEvent({
    userId,
        action: AUDIT_EVENTS.SENSITIVE_DATA_ACCESS,
    resource: req.path,
    method: req.method,
    details: { dataType, resourceId },
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    success: true
        });
}
