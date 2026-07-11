/**
 * ============================================================================
 * PLATFORM ROUTES (Fase C Multi-Tenant) — /api/platform
 * ============================================================================
 * Console de plataforma: autenticação de PlatformUser + gestão de municípios.
 * Substitui os endpoints /api/super-admin/tenants (guardados por role de
 * tenant — achado R2). Os antigos permanecem em dupla aceitação até o corte
 * (Fase D/H) e compartilham a MESMA lógica via tenant-provisioning.service.
 *
 * Rotas:
 *   POST /auth/login   — login do operador (cookie httpOnly próprio)
 *   POST /auth/logout
 *   GET  /auth/me
 *   GET  /tenants      — lista municípios com uso
 *   POST /tenants      — provisiona município (PLATFORM_ADMIN)
 *   PATCH /tenants/:id — atualiza/suspende/reativa (PLATFORM_ADMIN)
 */

import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';
import {
  platformAuthMiddleware,
  requirePlatformRole,
  PlatformAuthenticatedRequest,
  PLATFORM_TOKEN_COOKIE,
} from '../middleware/platform-auth';
import {
  listTenantsWithUsage,
  provisionTenant,
  updateTenant,
} from '../services/tenant-provisioning.service';
import { logAuditEvent, AUDIT_EVENTS } from '../utils/audit-logger';

const router = Router();

const PLATFORM_TOKEN_TTL = '8h';

// ============================================================================
// AUTH
// ============================================================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    const { email, password } = parsed.data;

    const user = await runAsPlatform(async () =>
      prisma.platformUser.findFirst({ where: { email, isActive: true } })
    );

    // Mensagem única — não revelar se o email existe
    const invalid = () => res.status(401).json({ error: 'Credenciais inválidas' });
    if (!user) return invalid();

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      await logAuditEvent({
        action: AUDIT_EVENTS.LOGIN_FAILED,
        resource: req.originalUrl,
        method: req.method,
        details: { context: 'platform', email },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: false,
        errorMessage: 'Senha incorreta (plataforma)',
      }).catch(() => undefined);
      return invalid();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'Configuração de segurança inválida' });
    }

    const token = jwt.sign(
      { platformUserId: user.id, type: 'platform', role: user.role },
      jwtSecret,
      { expiresIn: PLATFORM_TOKEN_TTL }
    );

    await runAsPlatform(async () =>
      prisma.platformUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    );

    await logAuditEvent({
      action: AUDIT_EVENTS.LOGIN_SUCCESS,
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: user.id },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
    }).catch(() => undefined);

    res.cookie(PLATFORM_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      platformUser: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Erro no login de plataforma:', error);
    res.status(500).json({ error: 'Erro interno no login' });
  }
});

router.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie(PLATFORM_TOKEN_COOKIE);
  res.json({ success: true });
});

router.get('/auth/me', platformAuthMiddleware, (req: Request, res: Response) => {
  res.json({ success: true, platformUser: (req as PlatformAuthenticatedRequest).platformUser });
});

// ============================================================================
// TENANTS (gestão de municípios)
// ============================================================================

const createTenantSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  nome: z.string().min(3),
  cnpj: z.string().min(14).max(18),
  nomeMunicipio: z.string().min(2),
  ufMunicipio: z.string().length(2),
  codigoIbge: z.string().optional(),
  customDomain: z.string().optional(),
  plan: z.enum(['basic', 'professional', 'enterprise']).optional(),
  maxUsers: z.number().int().positive().optional(),
  maxCitizens: z.number().int().positive().optional(),
  features: z.record(z.string(), z.unknown()).optional(),
  branding: z.record(z.string(), z.unknown()).optional(),
  adminName: z.string().min(3),
  adminEmail: z.string().email(),
});

router.get('/tenants', platformAuthMiddleware, async (_req: Request, res: Response) => {
  try {
    const tenants = await listTenantsWithUsage();
    res.json({ success: true, tenants });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
});

router.post(
  '/tenants',
  platformAuthMiddleware,
  requirePlatformRole('PLATFORM_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const parsed = createTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
      }

      const result = await provisionTenant(parsed.data);

      await logAuditEvent({
        action: AUDIT_EVENTS.TENANT_CREATED,
        resource: req.originalUrl,
        method: req.method,
        details: {
          context: 'platform',
          platformUserId: (req as PlatformAuthenticatedRequest).platformUser?.id,
          tenantId: result.tenant.id,
          slug: result.tenant.slug,
          adminEmail: parsed.data.adminEmail,
        },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      }).catch(() => undefined);

      res.status(201).json({
        success: true,
        tenant: result.tenant,
        admin: result.admin,
        departmentsCreated: result.departmentsCreated,
        servicesCreated: result.servicesCreated,
        temporaryPassword: result.temporaryPassword,
        accessUrl: process.env.TENANT_BASE_DOMAIN
          ? `https://${result.tenant.slug}.${process.env.TENANT_BASE_DOMAIN}`
          : undefined,
      });
    } catch (error: any) {
      if (error?.code === 'RESERVED_SLUG') {
        return res.status(400).json({ error: error.message });
      }
      if (error?.code === 'P2002') {
        return res.status(409).json({ error: 'Slug, CNPJ, domínio ou email já em uso' });
      }
      console.error('Erro ao provisionar tenant:', error);
      res.status(500).json({ error: 'Erro ao provisionar tenant' });
    }
  }
);

router.patch(
  '/tenants/:id',
  platformAuthMiddleware,
  requirePlatformRole('PLATFORM_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const updateSchema = createTenantSchema
        .partial()
        .omit({ adminName: true, adminEmail: true })
        .extend({
          status: z
            .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'CANCELLED'])
            .optional(),
          suspensionReason: z.string().nullable().optional(),
          paymentStatus: z.string().optional(),
        });
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
      }

      const tenant = await updateTenant(req.params.id, parsed.data as Record<string, unknown>);

      await logAuditEvent({
        action: AUDIT_EVENTS.TENANT_CONFIG_CHANGE,
        resource: req.originalUrl,
        method: req.method,
        details: {
          context: 'platform',
          platformUserId: (req as PlatformAuthenticatedRequest).platformUser?.id,
          tenantId: tenant.id,
          changes: Object.keys(parsed.data),
        },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: true,
      }).catch(() => undefined);

      res.json({ success: true, tenant });
    } catch (error: any) {
      if (error?.code === 'RESERVED_SLUG') {
        return res.status(400).json({ error: error.message });
      }
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Tenant não encontrado' });
      }
      console.error('Erro ao atualizar tenant:', error);
      res.status(500).json({ error: 'Erro ao atualizar tenant' });
    }
  }
);

export default router;
