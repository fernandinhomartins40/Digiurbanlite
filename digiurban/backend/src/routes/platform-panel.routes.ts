/**
 * ============================================================================
 * PLATFORM PANEL ROUTES (Fases 1/6 do plano de correção Multi-Tenant 2026-07-13)
 * ============================================================================
 * Endpoints do painel de plataforma MOVIDOS de /api/super-admin (onde eram
 * guardados por role SUPER_ADMIN — usuário DE TENANT) para /api/platform,
 * guardados por PlatformUser (identidade de plataforma separada).
 *
 * Montado em /api/platform (index.ts), complementando routes/platform.ts
 * (auth + tenants list/create/patch). Aqui vivem:
 *   - Catálogo de módulos e info da plataforma (wizard de provisionamento)
 *   - Detalhe/branding/admins/usuários de um município
 *   - Billing (faturas) e leads
 *   - Infraestrutura: métricas, schema do banco, migrations, backups
 *
 * Os caminhos antigos em /api/super-admin respondem 410 Gone.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { runAsPlatform } from '../lib/tenant-context';
import { UPLOAD_BASE_DIR } from '../config/upload';
import {
  platformAuthMiddleware,
  requirePlatformRole,
  PlatformAuthenticatedRequest,
} from '../middleware/platform-auth';
import {
  updateTenant,
  getTenantDetail,
  createTenantAdmin,
  resetTenantUserPassword,
  setTenantUserActive,
  AVAILABLE_MODULES,
} from '../services/tenant-provisioning.service';
import {
  listTenantInvoices,
  listAllInvoices,
  createInvoice,
  updateInvoiceStatus,
  listLeads,
  updateLeadStatus,
} from '../services/platform-billing.service';
import {
  listPlans,
  createPlan,
  updatePlan,
  removePlan,
} from '../services/plan-config.service';
import { logAuditEvent } from '../utils/audit-logger';

const router = Router();

// Toda rota deste router exige operador de plataforma autenticado.
router.use(platformAuthMiddleware);

const PLATFORM_ADMIN = requirePlatformRole('PLATFORM_ADMIN');

function platformUserId(req: Request): string | undefined {
  return (req as PlatformAuthenticatedRequest).platformUser?.id;
}

// ============================================================================
// CATÁLOGO / INFO DA PLATAFORMA
// ============================================================================

// GET /api/platform/modules — catálogo de módulos ativáveis (para o wizard)
router.get('/modules', (_req: Request, res: Response) => {
  res.json({ success: true, modules: AVAILABLE_MODULES });
});

// GET /api/platform/platform-info — dados da plataforma p/ o painel montar
// o endereço da prefeitura (subdomínio) e sinalizar se a infra está pronta.
router.get('/platform-info', (_req: Request, res: Response) => {
  const baseDomain = (process.env.TENANT_BASE_DOMAIN || '').trim();
  res.json({
    success: true,
    tenantBaseDomain: baseDomain || null,
    // reservados que não podem ser slug (espelha o TenantService.getByHost)
    reservedSlugs: ['default', 'www', 'api', 'admin', 'platform', 'mail', 'smtp'],
    // subdomínio só funciona de fato se o backend souber o domínio base
    subdomainEnabled: !!baseDomain,
  });
});

// ============================================================================
// DETALHE / BRANDING / ADMINS / USUÁRIOS DE UM MUNICÍPIO
// ============================================================================

// GET /api/platform/tenants/:id — detalhe (uso, limites, admins)
router.get('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const detail = await getTenantDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: 'Município não encontrado' });
    res.json({ success: true, tenant: detail });
  } catch (error) {
    console.error('Erro ao buscar detalhe do município:', error);
    res.status(500).json({ error: 'Erro ao buscar município' });
  }
});

// POST /api/platform/tenants/:id/logo — upload do logo (identidade visual)
// Salvo em uploads/public/branding/{tenantId}/ (prefixo /public/ é liberado
// sem auth pelo uploads-access) — o logo aparece na landing pública do
// município. Grava branding.logoUrl no tenant.
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Formato inválido — use PNG, JPG, SVG ou WEBP'));
  },
});

router.post(
  '/tenants/:id/logo',
  PLATFORM_ADMIN,
  logoUpload.single('logo'),
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as { buffer: Buffer; mimetype: string } | undefined;
      if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

      const tenantId = req.params.id;
      const tenant = await runAsPlatform(async () =>
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, branding: true } })
      );
      if (!tenant) return res.status(404).json({ error: 'Município não encontrado' });

      // uploads/public/branding/{tenantId}/logo.{ext}
      const ext = file.mimetype === 'image/png' ? 'png'
        : file.mimetype === 'image/svg+xml' ? 'svg'
        : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      // Mesma raiz que o express.static serve (fonte única) — ver config/upload.
      const dir = path.join(UPLOAD_BASE_DIR, 'public', 'branding', tenantId);
      await fs.mkdir(dir, { recursive: true });
      const fileName = `logo-${Date.now()}.${ext}`;
      await fs.writeFile(path.join(dir, fileName), file.buffer);

      const logoUrl = `/uploads/public/branding/${tenantId}/${fileName}`;
      const branding = { ...(tenant.branding as Record<string, unknown> | null || {}), logoUrl };
      await updateTenant(tenantId, { branding });

      res.json({ success: true, logoUrl });
    } catch (error: any) {
      if (error?.message?.includes('Formato inválido')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Erro ao enviar logo:', error);
      res.status(500).json({ error: 'Erro ao enviar logo' });
    }
  }
);

// POST /api/platform/tenants/:id/admins — novo ADMIN municipal
router.post('/tenants/:id/admins', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const schema = z.object({ name: z.string().min(3), email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Nome e email válidos são obrigatórios' });

    const admin = await createTenantAdmin(req.params.id, parsed.data);
    await logAuditEvent({
      action: 'tenant_admin_created',
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: platformUserId(req), tenantId: req.params.id, adminEmail: parsed.data.email },
      ip: req.ip, userAgent: req.headers['user-agent'], success: true,
    }).catch(() => undefined);
    res.status(201).json({ success: true, admin });
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Email já em uso' });
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ error: 'Erro ao criar administrador' });
  }
});

// POST /api/platform/tenants/:id/users/:userId/reset-password
router.post('/tenants/:id/users/:userId/reset-password', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const result = await resetTenantUserPassword(req.params.id, req.params.userId);
    await logAuditEvent({
      action: 'tenant_user_password_reset',
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: platformUserId(req), tenantId: req.params.id, targetUserId: req.params.userId },
      ip: req.ip, userAgent: req.headers['user-agent'], success: true,
    }).catch(() => undefined);
    res.json({ success: true, ...result });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: error.message });
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
});

// PATCH /api/platform/tenants/:id/users/:userId — ativar/desativar
router.patch('/tenants/:id/users/:userId', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const schema = z.object({ isActive: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'isActive é obrigatório' });
    await setTenantUserActive(req.params.id, req.params.userId, parsed.data.isActive);
    res.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: error.message });
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// ============================================================================
// BILLING POR MUNICÍPIO
// ============================================================================

// GET /api/platform/invoices — todas as faturas (filtro opcional ?status=)
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const invoices = await listAllInvoices(req.query.status as string | undefined);
    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Erro ao listar faturas:', error);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
});

// GET /api/platform/tenants/:id/invoices — faturas de um município
router.get('/tenants/:id/invoices', async (req: Request, res: Response) => {
  try {
    const invoices = await listTenantInvoices(req.params.id);
    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Erro ao listar faturas do município:', error);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
});

// POST /api/platform/tenants/:id/invoices — gerar fatura
router.post('/tenants/:id/invoices', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      amount: z.number().positive().optional(),
      plan: z.string().optional(),
      period: z.string().optional(),
      dueDate: z.string().optional(),
      description: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    const invoice = await createInvoice({ tenantId: req.params.id, ...parsed.data });
    res.status(201).json({ success: true, invoice });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Município não encontrado' });
    console.error('Erro ao gerar fatura:', error);
    res.status(500).json({ error: 'Erro ao gerar fatura' });
  }
});

// PATCH /api/platform/invoices/:invoiceId — mudar status (pagar/cancelar)
router.patch('/invoices/:invoiceId', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const schema = z.object({ status: z.enum(['PAID', 'CANCELLED', 'FAILED', 'PENDING', 'OVERDUE']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Status inválido' });
    const invoice = await updateInvoiceStatus(req.params.invoiceId, parsed.data.status);
    res.json({ success: true, invoice });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Fatura não encontrada' });
    console.error('Erro ao atualizar fatura:', error);
    res.status(500).json({ error: 'Erro ao atualizar fatura' });
  }
});

// ============================================================================
// CATÁLOGO DE PLANOS (PlanConfig) — configurável, substitui o hardcode
// ============================================================================

const planSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().nullable(),
  monthlyPrice: z.number().min(0).optional(),
  maxUsers: z.number().int().optional(),
  maxCitizens: z.number().int().optional(),
  features: z.record(z.string(), z.boolean()).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/** Normaliza o `features` do payload (index signature do Zod → Record limpo). */
function normalizeFeatures(f: unknown): Record<string, boolean> | null | undefined {
  if (f === undefined) return undefined;
  if (f === null) return null;
  return { ...(f as Record<string, boolean>) };
}

// GET /api/platform/plans — catálogo de planos (com contagem de municípios)
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await listPlans();
    const active = plans.filter((p) => p.isActive);
    const mrr = plans.reduce((sum, p) => sum + (p.isActive ? p.monthlyPrice * p.tenants : 0), 0);
    const subscribers = plans.reduce((sum, p) => sum + p.tenants, 0);
    res.json({
      success: true,
      plans,
      stats: { totalPlans: plans.length, activePlans: active.length, totalSubscribers: subscribers, totalMRR: mrr },
    });
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
});

// POST /api/platform/plans — criar plano
router.post('/plans', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const parsed = planSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    const plan = await createPlan({ ...parsed.data, features: normalizeFeatures(parsed.data.features) });
    await logAuditEvent({
      action: 'plan_created',
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: platformUserId(req), code: plan.code },
      ip: req.ip, userAgent: req.headers['user-agent'], success: true,
    }).catch(() => undefined);
    res.status(201).json({ success: true, plan, message: 'Plano criado com sucesso' });
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Já existe um plano com este código' });
    console.error('Erro ao criar plano:', error);
    res.status(500).json({ error: 'Erro ao criar plano' });
  }
});

// PUT /api/platform/plans/:id — editar plano (code é imutável)
router.put('/plans/:id', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const parsed = planSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    const { code, ...data } = parsed.data; // ignora code — não editável
    const plan = await updatePlan(req.params.id, { ...data, features: normalizeFeatures(data.features) });
    await logAuditEvent({
      action: 'plan_updated',
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: platformUserId(req), planId: req.params.id },
      ip: req.ip, userAgent: req.headers['user-agent'], success: true,
    }).catch(() => undefined);
    res.json({ success: true, plan, message: 'Plano atualizado com sucesso' });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Plano não encontrado' });
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

// DELETE /api/platform/plans/:id — remove (ou desativa, se em uso)
router.delete('/plans/:id', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const result = await removePlan(req.params.id);
    await logAuditEvent({
      action: result.deleted ? 'plan_deleted' : 'plan_deactivated',
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: platformUserId(req), planId: req.params.id },
      ip: req.ip, userAgent: req.headers['user-agent'], success: true,
    }).catch(() => undefined);
    res.json({
      success: true,
      deleted: result.deleted,
      message: result.deleted ? 'Plano removido' : 'Plano em uso — foi desativado (não removido)',
    });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Plano não encontrado' });
    console.error('Erro ao remover plano:', error);
    res.status(500).json({ error: 'Erro ao remover plano' });
  }
});

// ============================================================================
// LEADS (funil de captação)
// ============================================================================

// GET /api/platform/leads — funil (filtro opcional ?status=)
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const leads = await listLeads(req.query.status as string | undefined);
    res.json({ success: true, leads });
  } catch (error) {
    console.error('Erro ao listar leads:', error);
    res.status(500).json({ error: 'Erro ao listar leads' });
  }
});

// PATCH /api/platform/leads/:leadId — mover no funil
router.patch('/leads/:leadId', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const schema = z.object({ status: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Status é obrigatório' });
    const lead = await updateLeadStatus(req.params.leadId, parsed.data.status);
    res.json({ success: true, lead });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Lead não encontrado' });
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
});

// ============================================================================
// INFRAESTRUTURA (Fase 6): MÉTRICAS / SCHEMA / MIGRATIONS / BACKUPS
// Operações de banco INTEIRO (todos os tenants) — exclusivas de plataforma.
// ============================================================================

// Diretório de backups com fallback e migração automática (movido de super-admin.ts)
async function getBackupDir(): Promise<string> {
  const preferredDir = process.env.BACKUPS_DIR || '/app/backups';
  const legacyDir = '/tmp/digiurban-backups';

  try {
    await fs.mkdir(preferredDir, { recursive: true });
    const testPath = path.join(preferredDir, '.test');
    await fs.writeFile(testPath, 'test');
    await fs.unlink(testPath);

    try {
      const legacyFiles = await fs.readdir(legacyDir);
      const backupFiles = legacyFiles.filter(f =>
        f.endsWith('.json') || f.endsWith('.db') || f.endsWith('.sql')
      );
      if (backupFiles.length > 0) {
        console.log(`[BACKUP] 📦 Migrando ${backupFiles.length} backup(s) de ${legacyDir} para ${preferredDir}...`);
        for (const file of backupFiles) {
          const src = path.join(legacyDir, file);
          const dst = path.join(preferredDir, file);
          try {
            await fs.access(dst);
          } catch {
            await fs.copyFile(src, dst);
          }
        }
      }
    } catch {
      // legacyDir ausente/vazio — ok
    }

    return preferredDir;
  } catch {
    await fs.mkdir(legacyDir, { recursive: true });
    return legacyDir;
  }
}

// GET /api/platform/system/metrics — métricas de performance
router.get('/system/metrics', async (_req: Request, res: Response) => {
  try {
    const databaseStats = await prisma.$queryRaw<any[]>`
      SELECT
        table_name as name,
        (SELECT COUNT(*)
         FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE') as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'User'
      LIMIT 1
    `;

    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      system: {
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem(),
      },
      database: {
        connected: true,
        stats: databaseStats,
      },
    };

    return res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/platform/system/backup — backup do banco (contexto de plataforma:
// dump NÃO escopado, todos os tenants — por isso exige PLATFORM_ADMIN)
router.post('/system/backup', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const backupDir = await getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);

    console.log(`[BACKUP] Iniciando backup do banco de dados...`);
    console.log(`[BACKUP] Diretório: ${backupDir}`);

    const backupData: any = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        database: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown',
      },
      data: {},
    };

    const models = [
      'municipioConfig',
      'user',
      'citizen',
      'department',
      'protocolSimplified',
      'service',
      'auditLog',
      'citizenDocument',
      'protocolDocument',
      'protocolInteraction',
      'protocolStage',
      'notification',
    ];

    let totalRecords = 0;

    for (const modelName of models) {
      try {
        // @ts-ignore - Prisma models dinâmicos
        if (prisma[modelName]) {
          console.log(`[BACKUP] Fazendo backup de ${modelName}...`);
          // @ts-ignore
          const records = await prisma[modelName].findMany();
          backupData.data[modelName] = records;
          totalRecords += records.length;
          console.log(`[BACKUP] ✓ ${modelName}: ${records.length} registros`);
        }
      } catch (modelError: any) {
        console.warn(`[BACKUP] ⚠ Erro ao fazer backup de ${modelName}:`, modelError.message);
      }
    }

    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    const stats = await fs.stat(backupPath);

    console.log(`[BACKUP] ✅ Backup concluído: ${totalRecords} registros totais`);

    await logAuditEvent({
      action: 'platform_backup_created',
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: platformUserId(req), fileName: backupFileName, totalRecords },
      ip: req.ip, userAgent: req.headers['user-agent'], success: true,
    }).catch(() => undefined);

    return res.json({
      success: true,
      message: `Backup criado com sucesso (${totalRecords} registros)`,
      data: {
        fileName: backupFileName,
        path: backupPath,
        size: stats.size,
        timestamp: new Date().toISOString(),
        totalRecords,
        format: 'json',
      },
    });
  } catch (error: any) {
    console.error('[BACKUP] ❌ Erro ao criar backup:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar backup do banco de dados',
      details: error.message,
    });
  }
});

// GET /api/platform/system/backups — listar backups disponíveis
router.get('/system/backups', async (_req: Request, res: Response) => {
  try {
    const backupDir = await getBackupDir();

    try {
      const files = await fs.readdir(backupDir);
      const backups = await Promise.all(
        files
          .filter(file => file.endsWith('.json') || file.endsWith('.db') || file.endsWith('.sql'))
          .map(async (file) => {
            const filePath = path.join(backupDir, file);
            const stats = await fs.stat(filePath);
            return {
              fileName: file,
              size: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
            };
          })
      );

      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return res.json({ success: true, data: backups });
    } catch {
      return res.json({ success: true, data: [] });
    }
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/platform/system/backup/:fileName — download de backup
router.get('/system/backup/:fileName', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const backupDir = await getBackupDir();
    const filePath = path.join(backupDir, fileName);

    // Validar nome do arquivo para evitar path traversal
    if (fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    return res.download(filePath, fileName);
  } catch (error: any) {
    console.error('[BACKUP] Erro ao fazer download:', error);
    return res.status(500).json({ error: 'Erro ao fazer download do backup' });
  }
});

// DELETE /api/platform/system/backup/:fileName — deletar backup
router.delete('/system/backup/:fileName', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const backupDir = await getBackupDir();
    const filePath = path.join(backupDir, fileName);

    if (fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    await fs.unlink(filePath);

    console.log(`[BACKUP] ✅ Backup deletado: ${fileName}`);

    return res.json({ success: true, message: 'Backup deletado com sucesso' });
  } catch (error: any) {
    console.error('[BACKUP] Erro ao deletar backup:', error);
    return res.status(500).json({ error: 'Erro ao deletar backup' });
  }
});

// POST /api/platform/system/backup/:fileName/restore — restaurar backup
router.post('/system/backup/:fileName/restore', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const backupDir = await getBackupDir();
    const filePath = path.join(backupDir, fileName);

    if (fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }

    if (!fileName.endsWith('.json')) {
      return res.status(400).json({ error: 'Apenas backups em formato JSON podem ser restaurados' });
    }

    const backupContent = await fs.readFile(filePath, 'utf-8');
    const backupData = JSON.parse(backupContent);

    console.log('[RESTORE] Iniciando restauração do backup...');

    if (!backupData.metadata || !backupData.data) {
      return res.status(400).json({ error: 'Formato de backup inválido' });
    }

    let restoredRecords = 0;
    const errors: string[] = [];

    for (const [modelName, records] of Object.entries(backupData.data)) {
      try {
        if (Array.isArray(records) && records.length > 0) {
          // @ts-ignore
          if (prisma[modelName]) {
            console.log(`[RESTORE] Restaurando ${modelName}...`);

            // Deletar registros existentes (cuidado!)
            // @ts-ignore
            await prisma[modelName].deleteMany({});

            // Inserir registros do backup
            // @ts-ignore
            await prisma[modelName].createMany({
              data: records,
              skipDuplicates: true,
            });

            restoredRecords += records.length;
            console.log(`[RESTORE] ✓ ${modelName}: ${records.length} registros restaurados`);
          }
        }
      } catch (modelError: any) {
        const errorMsg = `Erro ao restaurar ${modelName}: ${modelError.message}`;
        console.error(`[RESTORE] ⚠ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[RESTORE] ✅ Restauração concluída: ${restoredRecords} registros`);

    await logAuditEvent({
      action: 'platform_backup_restored',
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: platformUserId(req), fileName, restoredRecords },
      ip: req.ip, userAgent: req.headers['user-agent'], success: true,
    }).catch(() => undefined);

    return res.json({
      success: true,
      message: `Backup restaurado com sucesso (${restoredRecords} registros)`,
      data: {
        restoredRecords,
        backupMetadata: backupData.metadata,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('[RESTORE] ❌ Erro ao restaurar backup:', error);
    return res.status(500).json({
      error: 'Erro ao restaurar backup',
      details: error.message,
    });
  }
});

// GET /api/platform/schema — informações do schema do banco (todas as tabelas)
router.get('/schema', async (_req: Request, res: Response) => {
  try {
    console.log('[SCHEMA] Buscando informações do banco de dados...');

    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    const versionString = versionResult[0]?.version || 'Unknown';
    const versionMatch = versionString.match(/PostgreSQL ([\d.]+)/);
    const dbVersion = versionMatch ? versionMatch[1] : 'Unknown';

    const allTablesResult = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
      ORDER BY tablename
    `;

    const allTableNames = allTablesResult.map(t => t.tablename);

    console.log(`[SCHEMA] Encontradas ${allTableNames.length} tabelas no banco de dados`);

    const tables = await Promise.all(
      allTableNames.map(async (tableName) => {
        try {
          const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          const count = Number(countResult[0]?.count || 0);

          const sizeResult = await prisma.$queryRawUnsafe<Array<{ size: bigint }>>(
            `SELECT pg_total_relation_size('"${tableName}"') as size`
          );
          const sizeBytes = Number(sizeResult[0]?.size || 0);
          const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

          const indexResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM pg_indexes WHERE tablename = '${tableName}'`
          );
          const indexCount = Number(indexResult[0]?.count || 0);

          const statsResult = await prisma.$queryRawUnsafe<Array<{ last_modified: Date | null }>>(
            `SELECT last_analyze as last_modified FROM pg_stat_user_tables WHERE relname = '${tableName}'`
          );
          const lastModified = statsResult[0]?.last_modified || new Date();

          const relationsResult = await prisma.$queryRawUnsafe<Array<{ referenced_table: string }>>(
            `SELECT DISTINCT
              ccu.table_name AS referenced_table
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = '${tableName}'`
          );
          const relations = relationsResult.map(r => r.referenced_table);

          return {
            name: tableName,
            recordCount: count,
            size: `${sizeMB} MB`,
            lastModified: lastModified.toISOString(),
            indexes: indexCount,
            relations,
          };
        } catch (error: any) {
          console.warn(`[SCHEMA] Erro ao processar tabela ${tableName}:`, error.message);
          return {
            name: tableName,
            recordCount: 0,
            size: '0.00 MB',
            lastModified: new Date().toISOString(),
            indexes: 0,
            relations: [],
          };
        }
      })
    );

    const validTables = tables.filter(t => t !== null);
    const totalRecords = validTables.reduce((sum, t) => sum + (t?.recordCount || 0), 0);
    const totalTables = validTables.length;

    const dbSizeResult = await prisma.$queryRaw<Array<{ size: bigint }>>`
      SELECT pg_database_size(current_database()) as size
    ` as any;

    const dbSizeBytes = Number(dbSizeResult[0]?.size || 0);
    const dbSizeGB = (dbSizeBytes / (1024 * 1024 * 1024)).toFixed(2);

    const migrationsResult = await prisma.$queryRaw<Array<{
      id: string;
      checksum: string;
      finished_at: Date | null;
      migration_name: string;
      logs: string | null;
      rolled_back_at: Date | null;
      started_at: Date;
      applied_steps_count: number;
    }>>`
      SELECT * FROM "_prisma_migrations"
      ORDER BY started_at DESC
      LIMIT 10
    ` as any;

    const migrations = migrationsResult.map((m: any) => ({
      id: m.migration_name,
      name: m.migration_name.replace(/^\d+_/, ''),
      timestamp: m.started_at.toISOString(),
      status: m.finished_at ? 'applied' : (m.rolled_back_at ? 'failed' : 'pending'),
      executionTime: m.finished_at && m.started_at
        ? Math.floor((new Date(m.finished_at).getTime() - new Date(m.started_at).getTime()))
        : 0,
      changes: m.logs ? [m.logs] : ['Migration aplicada com sucesso'],
    }));

    // Último backup (do diretório de backups)
    let lastBackup: string | null = null;
    try {
      const backupDir = await getBackupDir();
      const files = await fs.readdir(backupDir);
      const backupFilesWithStats = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async f => {
            const stats = await fs.stat(path.join(backupDir, f));
            return { name: f, time: stats.mtime };
          })
      );

      const backupFiles = backupFilesWithStats.sort((a, b) => b.time.getTime() - a.time.getTime());

      if (backupFiles.length > 0) {
        lastBackup = backupFiles[0].time.toISOString();
      }
    } catch (err) {
      console.warn('[SCHEMA] Não foi possível obter informações de backup:', err);
    }

    const databaseInfo = {
      type: 'PostgreSQL',
      version: dbVersion,
      totalTables,
      totalRecords,
      databaseSize: `${dbSizeGB} GB`,
      lastBackup: lastBackup || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    };

    console.log(`[SCHEMA] ✅ Schema obtido com sucesso: ${totalTables} tabelas, ${totalRecords} registros`);

    return res.json({
      success: true,
      data: {
        info: databaseInfo,
        tables: validTables,
        migrations,
      },
    });
  } catch (error: any) {
    console.error('[SCHEMA] ❌ Erro ao obter schema:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter informações do schema',
      details: error.message,
    });
  }
});

// POST /api/platform/schema/run-migrations — executar migrations pendentes
router.post('/schema/run-migrations', PLATFORM_ADMIN, async (req: Request, res: Response) => {
  try {
    console.log('[SCHEMA] Executando migrations pendentes...');

    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    const backendPath = path.join(__dirname, '..', '..');

    const { stdout, stderr } = await execPromise('npx prisma migrate deploy', {
      cwd: backendPath,
      env: { ...process.env },
    });

    console.log('[SCHEMA] stdout:', stdout);
    if (stderr) {
      console.log('[SCHEMA] stderr:', stderr);
    }

    const success = !stderr.includes('Error') && !stderr.includes('failed');

    await logAuditEvent({
      action: 'platform_migrations_run',
      resource: req.originalUrl,
      method: req.method,
      details: { context: 'platform', platformUserId: platformUserId(req), success },
      ip: req.ip, userAgent: req.headers['user-agent'], success,
    }).catch(() => undefined);

    if (success) {
      console.log('[SCHEMA] ✅ Migrations executadas com sucesso');
      return res.json({
        success: true,
        message: 'Migrations executadas com sucesso',
        output: stdout,
      });
    } else {
      console.error('[SCHEMA] ❌ Erro ao executar migrations:', stderr);
      return res.status(500).json({
        success: false,
        error: 'Erro ao executar migrations',
        details: stderr,
      });
    }
  } catch (error: any) {
    console.error('[SCHEMA] ❌ Erro ao executar migrations:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao executar migrations',
      details: error.message,
    });
  }
});

export default router;
