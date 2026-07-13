import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DEFAULT_TENANT_ID, runAsPlatform } from '../lib/tenant-context';
import { TenantService } from '../services/tenant.service';
import {
  seedDefaultDepartments,
  seedDefaultServices,
  listTenantsWithUsage,
  provisionTenant,
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
import crypto from 'crypto';
import { logAuditEvent, AUDIT_EVENTS } from '../utils/audit-logger';
import { loginRateLimiter } from '../middleware/rate-limit';
import { accountLockoutMiddleware } from '../middleware/account-lockout';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import emailServerRouter from './email-server';
import {
  ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES,
  extractPrimaryDepartmentIdFromOrganization,
  reconcileAdministrativeDepartmentAssignments,
} from '../services/organizational-context.service';
import { syncUserPersonIdentity } from '../services/person-identity.service';
import { normalizeEmail, normalizeNullableString } from '../utils/identity';

const execAsync = promisify(exec);
const router = Router();

// Função auxiliar para obter diretório de backups com fallback e migração automática
async function getBackupDir(): Promise<string> {
  const preferredDir = process.env.BACKUPS_DIR || '/app/backups';
  const legacyDir = '/tmp/digiurban-backups';

  try {
    // Tentar criar e testar o diretório preferido
    await fs.mkdir(preferredDir, { recursive: true });
    const testPath = path.join(preferredDir, '.test');
    await fs.writeFile(testPath, 'test');
    await fs.unlink(testPath);

    // ✅ Diretório persistente disponível - migrar backups antigos de /tmp se existirem
    try {
      const legacyFiles = await fs.readdir(legacyDir);
      const backupFiles = legacyFiles.filter(f =>
        f.endsWith('.json') || f.endsWith('.db') || f.endsWith('.sql')
      );

      if (backupFiles.length > 0) {
        console.log(`[BACKUP] 📦 Migrando ${backupFiles.length} backup(s) de ${legacyDir} para ${preferredDir}...`);

        for (const file of backupFiles) {
          const sourcePath = path.join(legacyDir, file);
          const destPath = path.join(preferredDir, file);

          // Verificar se arquivo já existe no destino
          try {
            await fs.access(destPath);
            console.log(`[BACKUP] ⏭️  ${file} já existe no destino, pulando...`);
          } catch {
            // Arquivo não existe, copiar
            await fs.copyFile(sourcePath, destPath);
            console.log(`[BACKUP] ✅ ${file} migrado com sucesso`);
          }
        }

        console.log(`[BACKUP] 🎉 Migração concluída! Backups agora em volume persistente.`);
      }
    } catch (legacyError) {
      // /tmp/digiurban-backups não existe ou está vazio, tudo bem
    }

    return preferredDir;
  } catch (error) {
    // Fallback para /tmp se não tiver permissão
    console.warn(`[BACKUP] Usando /tmp como fallback (sem permissão em ${preferredDir})`);
    await fs.mkdir(legacyDir, { recursive: true });
    return legacyDir;
  }
}

// Middleware para verificar se é SUPER_ADMIN
const superAdminOnly = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  if (!user || user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Acesso negado. Apenas Super Administradores podem acessar esta rota.'
    });
  }
  next();
};

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

// POST /api/super-admin/login - Login de super administrador
router.post('/login', loginRateLimiter, accountLockoutMiddleware('user'), async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    // Buscar usuário pelo email — SUPER_ADMIN é identidade de PLATAFORMA:
    // runAsPlatform evita que a tenant-extension esconda o usuário quando o
    // contexto do host/cookie aponta para outro município (ex.: cookie
    // digiurban_tenant_slug de um portal de cidadão). Sem isto, o login falha
    // com "não autorizado" sempre que o navegador está escopado a um tenant
    // diferente do do super-admin.
    const user = await runAsPlatform(async () =>
      prisma.user.findFirst({
        where: {
          email: data.email,
          isActive: true,
          role: 'SUPER_ADMIN'
        },
        include: {
          department: true
        }
      })
    );

    // Verificar se existe e se é SUPER_ADMIN
    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(401).json({ error: 'Credenciais inválidas ou acesso não autorizado' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        departmentId: user.departmentId,
        type: 'admin',
        tenantId: req.tenantId || DEFAULT_TENANT_ID // Fase 4 Multi-Tenant
      },
      jwtSecret,
      { expiresIn: '8h' }
    );

    // Configurar cookie httpOnly
    res.cookie('digiurban_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    });

    return res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        department: user.department
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    }
    console.error('Erro no login super admin:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/super-admin/auth/me - Obter informações do super admin autenticado
router.get('/auth/me', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true
          }
        },
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Erro ao buscar dados do super admin:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Schema de validação para atualização do município
const updateMunicipioSchema = z.object({
  nome: z.string().optional(),
  cnpj: z.string().optional(),
  codigoIbge: z.string().optional(),
  nomeMunicipio: z.string().optional(),
  ufMunicipio: z.string().optional(),
  brasao: z.string().nullable().optional(),
  corPrimaria: z.string().optional(),
  configuracoes: z.any().optional(),
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  suspensionReason: z.string().nullable().optional(),
  paymentStatus: z.enum(['active', 'pending', 'overdue', 'suspended']).optional(),
  subscriptionPlan: z.enum(['basic', 'professional', 'enterprise']).optional(),
  subscriptionEnds: z.string().optional(),
  maxUsers: z.number().int().positive().optional(),
  maxCitizens: z.number().int().positive().optional(),
  features: z.any().optional()
});

// GET /api/super-admin/municipio - Obter configuração do município
router.get('/municipio', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const municipio = await prisma.municipioConfig.findUnique({
      where: { id: 'singleton' }
    });

    if (!municipio) {
      return res.status(404).json({ error: 'Configuração do município não encontrada' });
    }

    return res.json({
      success: true,
      data: municipio
    });
  } catch (error) {
    console.error('Erro ao buscar configuração do município:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/super-admin/municipio - Atualizar configuração do município
router.put('/municipio', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const data = updateMunicipioSchema.parse(req.body);

    // Converter subscriptionEnds para DateTime se fornecido
    const updateData: any = { ...data };
    if (data.subscriptionEnds) {
      updateData.subscriptionEnds = new Date(data.subscriptionEnds);
    }

    const municipio = await prisma.municipioConfig.update({
      where: { id: 'singleton' },
      data: updateData
    });

    return res.json({
      success: true,
      message: 'Configuração do município atualizada com sucesso',
      data: municipio
    });
  } catch (error: any) {
    console.error('Erro ao atualizar configuração do município:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues
      });
    }

    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/super-admin/municipio/suspend - Suspender município
router.post('/municipio/suspend', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Motivo da suspensão é obrigatório' });
    }

    const municipio = await prisma.municipioConfig.update({
      where: { id: 'singleton' },
      data: {
        isSuspended: true,
        suspensionReason: reason,
        isActive: false
      }
    });

    return res.json({
      success: true,
      message: 'Município suspenso com sucesso',
      data: municipio
    });
  } catch (error) {
    console.error('Erro ao suspender município:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/super-admin/municipio/activate - Ativar município
router.post('/municipio/activate', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const municipio = await prisma.municipioConfig.update({
      where: { id: 'singleton' },
      data: {
        isSuspended: false,
        suspensionReason: null,
        isActive: true
      }
    });

    return res.json({
      success: true,
      message: 'Município ativado com sucesso',
      data: municipio
    });
  } catch (error) {
    console.error('Erro ao ativar município:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/super-admin/stats - Estatísticas gerais do sistema
router.get('/stats', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCitizens,
      activeCitizens,
      totalProtocols,
      activeProtocols,
      completedProtocols,
      inProgressProtocols,
      totalDepartments,
      municipio
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.citizen.count(),
      prisma.citizen.count({ where: { isActive: true } }),
      prisma.protocolSimplified.count(),
      prisma.protocolSimplified.count({ where: { status: { not: 'CONCLUIDO' } } }),
      prisma.protocolSimplified.count({ where: { status: 'CONCLUIDO' } }),
      prisma.protocolSimplified.count({ where: { status: 'PROGRESSO' } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.municipioConfig.findUnique({ where: { id: 'singleton' } })
    ]);

    return res.json({
      success: true,
      data: {
        municipio: {
          nome: municipio?.nome,
          nomeMunicipio: municipio?.nomeMunicipio,
          uf: municipio?.ufMunicipio,
          isActive: municipio?.isActive,
          isSuspended: municipio?.isSuspended,
          subscriptionPlan: municipio?.subscriptionPlan,
          subscriptionEnds: municipio?.subscriptionEnds
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          limit: municipio?.maxUsers || 10,
          percentage: municipio?.maxUsers ? (totalUsers / municipio.maxUsers) * 100 : 0
        },
        citizens: {
          total: totalCitizens,
          active: activeCitizens,
          limit: municipio?.maxCitizens || 10000,
          percentage: municipio?.maxCitizens ? (totalCitizens / municipio.maxCitizens) * 100 : 0
        },
        protocols: {
          total: totalProtocols,
          active: activeProtocols,
          completed: completedProtocols,
          inProgress: inProgressProtocols
        },
        departments: {
          total: totalDepartments
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/super-admin/system/health - Status de saúde do sistema
router.get('/system/health', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Testar conexão com banco de dados
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;

    // Informações do sistema
    const systemInfo = {
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown'
      }
    };

    // Status dos componentes
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbResponseTime < 100 ? 'healthy' : 'degraded',
        responseTime: dbResponseTime
      },
      system: systemInfo,
      checks: {
        database: dbResponseTime < 100,
        memory: systemInfo.memory.usagePercent < 90,
        disk: true // Placeholder
      }
    };

    return res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Erro ao verificar saúde do sistema:', error);
    return res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Erro ao verificar saúde do sistema'
    });
  }
});

// GET /api/super-admin/system/metrics - Métricas de performance
router.get('/system/metrics', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    // Obter estatísticas do banco de dados (PostgreSQL)
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

    // Métricas de performance
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      system: {
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      },
      database: {
        connected: true,
        stats: databaseStats
      }
    };

    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/super-admin/system/backup - Criar backup do banco de dados
router.post('/system/backup', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const backupDir = await getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);

    console.log(`[BACKUP] Iniciando backup do banco de dados...`);
    console.log(`[BACKUP] Diretório: ${backupDir}`);

    // Fazer backup usando Prisma (funciona com qualquer DB)
    const backupData: any = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        database: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown'
      },
      data: {}
    };

    // Lista de modelos para fazer backup
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
      'notification'
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
        // Continuar mesmo se uma tabela falhar
      }
    }

    // Salvar backup JSON
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    const stats = await fs.stat(backupPath);

    console.log(`[BACKUP] ✅ Backup concluído: ${totalRecords} registros totais`);

    return res.json({
      success: true,
      message: `Backup criado com sucesso (${totalRecords} registros)`,
      data: {
        fileName: backupFileName,
        path: backupPath,
        size: stats.size,
        timestamp: new Date().toISOString(),
        totalRecords,
        format: 'json'
      }
    });
  } catch (error: any) {
    console.error('[BACKUP] ❌ Erro ao criar backup:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar backup do banco de dados',
      details: error.message
    });
  }
});

// GET /api/super-admin/system/backups - Listar backups disponíveis
router.get('/system/backups', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
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
              modifiedAt: stats.mtime
            };
          })
      );

      // Ordenar por data de criação (mais recente primeiro)
      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return res.json({
        success: true,
        data: backups
      });
    } catch (err) {
      return res.json({
        success: true,
        data: []
      });
    }
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/super-admin/system/backup/:fileName - Download de backup
router.get('/system/backup/:fileName', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const backupDir = await getBackupDir();
    const filePath = path.join(backupDir, fileName);

    // Validar nome do arquivo para evitar path traversal
    if (fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }

    // Verificar se arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    // Enviar arquivo para download
    return res.download(filePath, fileName);
  } catch (error: any) {
    console.error('[BACKUP] Erro ao fazer download:', error);
    return res.status(500).json({ error: 'Erro ao fazer download do backup' });
  }
});

// DELETE /api/super-admin/system/backup/:fileName - Deletar backup
router.delete('/system/backup/:fileName', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const backupDir = await getBackupDir();
    const filePath = path.join(backupDir, fileName);

    // Validar nome do arquivo para evitar path traversal
    if (fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }

    // Verificar se arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    // Deletar arquivo
    await fs.unlink(filePath);

    console.log(`[BACKUP] ✅ Backup deletado: ${fileName}`);

    return res.json({
      success: true,
      message: 'Backup deletado com sucesso'
    });
  } catch (error: any) {
    console.error('[BACKUP] Erro ao deletar backup:', error);
    return res.status(500).json({ error: 'Erro ao deletar backup' });
  }
});

// POST /api/super-admin/system/backup/:fileName/restore - Restaurar backup
router.post('/system/backup/:fileName/restore', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const backupDir = await getBackupDir();
    const filePath = path.join(backupDir, fileName);

    // Validar nome do arquivo
    if (fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({ error: 'Nome de arquivo inválido' });
    }

    // Verificar se é arquivo JSON
    if (!fileName.endsWith('.json')) {
      return res.status(400).json({ error: 'Apenas backups em formato JSON podem ser restaurados' });
    }

    // Ler arquivo de backup
    const backupContent = await fs.readFile(filePath, 'utf-8');
    const backupData = JSON.parse(backupContent);

    console.log('[RESTORE] Iniciando restauração do backup...');

    // Validar estrutura do backup
    if (!backupData.metadata || !backupData.data) {
      return res.status(400).json({ error: 'Formato de backup inválido' });
    }

    let restoredRecords = 0;
    const errors: string[] = [];

    // Restaurar cada modelo
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
              skipDuplicates: true
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

    return res.json({
      success: true,
      message: `Backup restaurado com sucesso (${restoredRecords} registros)`,
      data: {
        restoredRecords,
        backupMetadata: backupData.metadata,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error: any) {
    console.error('[RESTORE] ❌ Erro ao restaurar backup:', error);
    return res.status(500).json({
      error: 'Erro ao restaurar backup',
      details: error.message
    });
  }
});

// GET /api/super-admin/schema - Obter informações do schema do banco de dados
router.get('/schema', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    console.log('[SCHEMA] Buscando informações do banco de dados...');

    // Obter versão do PostgreSQL
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    const versionString = versionResult[0]?.version || 'Unknown';
    const versionMatch = versionString.match(/PostgreSQL ([\d.]+)/);
    const dbVersion = versionMatch ? versionMatch[1] : 'Unknown';

    // Buscar TODAS as tabelas do schema public do PostgreSQL
    const allTablesResult = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
      ORDER BY tablename
    `;

    const allTableNames = allTablesResult.map(t => t.tablename);

    console.log(`[SCHEMA] Encontradas ${allTableNames.length} tabelas no banco de dados`);

    // Obter informações detalhadas para cada tabela
    const tables = await Promise.all(
      allTableNames.map(async (tableName) => {
        try {
          // Obter contagem de registros
          const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          const count = Number(countResult[0]?.count || 0);

          // Obter tamanho da tabela
          const sizeResult = await prisma.$queryRawUnsafe<Array<{ size: bigint }>>(
            `SELECT pg_total_relation_size('"${tableName}"') as size`
          );
          const sizeBytes = Number(sizeResult[0]?.size || 0);
          const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

          // Obter número de índices
          const indexResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM pg_indexes WHERE tablename = '${tableName}'`
          );
          const indexCount = Number(indexResult[0]?.count || 0);

          // Obter última modificação (última atualização de estatísticas)
          const statsResult = await prisma.$queryRawUnsafe<Array<{ last_modified: Date | null }>>(
            `SELECT last_analyze as last_modified FROM pg_stat_user_tables WHERE relname = '${tableName}'`
          );
          const lastModified = statsResult[0]?.last_modified || new Date();

          // Obter relações (foreign keys)
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
            relations
          };
        } catch (error: any) {
          console.warn(`[SCHEMA] Erro ao processar tabela ${tableName}:`, error.message);
          return {
            name: tableName,
            recordCount: 0,
            size: '0.00 MB',
            lastModified: new Date().toISOString(),
            indexes: 0,
            relations: []
          };
        }
      })
    );

    // Filtrar tabelas que falharam (caso queira, mas agora retornamos com valores padrão)
    const validTables = tables.filter(t => t !== null);

    // Calcular totais
    const totalRecords = validTables.reduce((sum, t) => sum + (t?.recordCount || 0), 0);
    const totalTables = validTables.length;

    // Obter tamanho total do banco
    const dbSizeResult = await prisma.$queryRaw<Array<{ size: bigint }>>`
      SELECT pg_database_size(current_database()) as size
    ` as any;

    const dbSizeBytes = Number(dbSizeResult[0]?.size || 0);
    const dbSizeGB = (dbSizeBytes / (1024 * 1024 * 1024)).toFixed(2);

    // Obter migrations aplicadas do Prisma
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
      changes: m.logs ? [m.logs] : ['Migration aplicada com sucesso']
    }));

    // Obter último backup (do diretório de backups)
    let lastBackup = null;
    try {
      const backupDir = '/tmp/digiurban-backups';
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
      lastBackup: lastBackup || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    };

    console.log(`[SCHEMA] ✅ Schema obtido com sucesso: ${totalTables} tabelas, ${totalRecords} registros`);

    return res.json({
      success: true,
      data: {
        info: databaseInfo,
        tables: validTables,
        migrations
      }
    });
  } catch (error: any) {
    console.error('[SCHEMA] ❌ Erro ao obter schema:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter informações do schema',
      details: error.message
    });
  }
});

// POST /api/super-admin/schema/run-migrations - Executar migrations pendentes
router.post('/schema/run-migrations', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    console.log('[SCHEMA] Executando migrations pendentes...');

    // Executar npx prisma migrate deploy no backend
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    const backendPath = path.join(__dirname, '..', '..');

    const { stdout, stderr } = await execPromise('npx prisma migrate deploy', {
      cwd: backendPath,
      env: { ...process.env }
    });

    console.log('[SCHEMA] stdout:', stdout);
    if (stderr) {
      console.log('[SCHEMA] stderr:', stderr);
    }

    // Verificar se houve sucesso
    const success = !stderr.includes('Error') && !stderr.includes('failed');

    if (success) {
      console.log('[SCHEMA] ✅ Migrations executadas com sucesso');
      return res.json({
        success: true,
        message: 'Migrations executadas com sucesso',
        output: stdout
      });
    } else {
      console.error('[SCHEMA] ❌ Erro ao executar migrations:', stderr);
      return res.status(500).json({
        success: false,
        error: 'Erro ao executar migrations',
        details: stderr
      });
    }
  } catch (error: any) {
    console.error('[SCHEMA] ❌ Erro ao executar migrations:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao executar migrations',
      details: error.message
    });
  }
});

// ============================================
// CONFIGURAÇÕES DO MUNICÍPIO (SINGLE-TENANT)
// ============================================

// GET /api/super-admin/settings/municipal - Obter configurações do município
router.get('/settings/municipal', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    console.log('[SETTINGS] Buscando configurações municipais...');

    // Buscar configuração do município (singleton)
    const municipioConfig = await prisma.municipioConfig.findUnique({
      where: { id: 'singleton' }
    });

    if (!municipioConfig) {
      return res.status(404).json({
        success: false,
        error: 'Configuração municipal não encontrada'
      });
    }

    // Estatísticas de uso
    const [totalUsers, totalCitizens, protocolsThisMonth] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.citizen.count({ where: { isActive: true } }),
      prisma.protocolSimplified.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    const usageStats = {
      usuariosAtivos: totalUsers,
      usuariosMax: municipioConfig.maxUsers,
      cidadaosRegistrados: totalCitizens,
      cidadaosMax: municipioConfig.maxCitizens,
      protocolosEsteMes: protocolsThisMonth,
      percentualUsuarios: Math.round((totalUsers / municipioConfig.maxUsers) * 100),
      percentualCidadaos: Math.round((totalCitizens / municipioConfig.maxCitizens) * 100)
    };

    console.log('[SETTINGS] ✅ Configurações obtidas com sucesso');

    return res.json({
      success: true,
      data: {
        config: municipioConfig,
        usageStats
      }
    });
  } catch (error: any) {
    console.error('[SETTINGS] ❌ Erro ao obter configurações:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter configurações municipais',
      details: error.message
    });
  }
});

// PUT /api/super-admin/settings/municipal - Atualizar configurações do município
router.put('/settings/municipal', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { nome, cnpj, codigoIbge, nomeMunicipio, ufMunicipio, brasao, corPrimaria } = req.body;

    console.log('[SETTINGS] Atualizando configurações municipais...');

    const updatedConfig = await prisma.municipioConfig.update({
      where: { id: 'singleton' },
      data: {
        ...(nome && { nome }),
        ...(cnpj && { cnpj }),
        ...(codigoIbge && { codigoIbge }),
        ...(nomeMunicipio && { nomeMunicipio }),
        ...(ufMunicipio && { ufMunicipio }),
        ...(brasao !== undefined && { brasao }),
        ...(corPrimaria && { corPrimaria })
      }
    });

    console.log('[SETTINGS] ✅ Configurações atualizadas com sucesso');

    return res.json({
      success: true,
      message: 'Configurações municipais atualizadas com sucesso',
      data: updatedConfig
    });
  } catch (error: any) {
    console.error('[SETTINGS] ❌ Erro ao atualizar configurações:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar configurações municipais',
      details: error.message
    });
  }
});

// GET /api/super-admin/settings/features - Obter módulos e funcionalidades habilitadas
router.get('/settings/features', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    console.log('[SETTINGS] Buscando features habilitadas...');

    const municipioConfig = await prisma.municipioConfig.findUnique({
      where: { id: 'singleton' },
      select: { features: true, subscriptionPlan: true }
    });

    if (!municipioConfig) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      });
    }

    // Features padrão se não existir no JSON
    const defaultFeatures = {
      moduloEncaminhamentosTFD: true,
      moduloControlePragas: true,
      moduloPodaPreventivaArvores: true,
      moduloColeta: true,
      moduloAgendamentos: false,
      notificacoesPush: false,
      notificacoesEmail: true,
      notificacoesSMS: false,
      assinaturaDigital: false,
      relatoriosAvancados: municipioConfig.subscriptionPlan !== 'basic',
      apiExterna: municipioConfig.subscriptionPlan === 'enterprise',
      integracaoMaps: true,
      integracaoSMTP: true
    };

    const features = (municipioConfig.features as any) || defaultFeatures;

    console.log('[SETTINGS] ✅ Features obtidas com sucesso');

    return res.json({
      success: true,
      data: {
        features,
        subscriptionPlan: municipioConfig.subscriptionPlan
      }
    });
  } catch (error: any) {
    console.error('[SETTINGS] ❌ Erro ao obter features:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter features',
      details: error.message
    });
  }
});

// PUT /api/super-admin/settings/features - Atualizar features habilitadas
router.put('/settings/features', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { features } = req.body;

    console.log('[SETTINGS] Atualizando features...');

    const updatedConfig = await prisma.municipioConfig.update({
      where: { id: 'singleton' },
      data: { features }
    });

    console.log('[SETTINGS] ✅ Features atualizadas com sucesso');

    return res.json({
      success: true,
      message: 'Features atualizadas com sucesso',
      data: updatedConfig.features
    });
  } catch (error: any) {
    console.error('[SETTINGS] ❌ Erro ao atualizar features:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar features',
      details: error.message
    });
  }
});

// GET /api/super-admin/settings/limits - Obter limites e quotas
router.get('/settings/limits', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    console.log('[SETTINGS] Buscando limites e quotas...');

    const municipioConfig = await prisma.municipioConfig.findUnique({
      where: { id: 'singleton' },
      select: {
        maxUsers: true,
        maxCitizens: true,
        subscriptionPlan: true,
        subscriptionEnds: true,
        paymentStatus: true
      }
    });

    if (!municipioConfig) {
      return res.status(404).json({
        success: false,
        error: 'Configuração não encontrada'
      });
    }

    // Contagens atuais
    const [currentUsers, currentCitizens] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.citizen.count({ where: { isActive: true } })
    ]);

    const limits = {
      maxUsers: {
        atual: currentUsers,
        limite: municipioConfig.maxUsers,
        percentual: Math.round((currentUsers / municipioConfig.maxUsers) * 100)
      },
      maxCitizens: {
        atual: currentCitizens,
        limite: municipioConfig.maxCitizens,
        percentual: Math.round((currentCitizens / municipioConfig.maxCitizens) * 100)
      },
      subscription: {
        plan: municipioConfig.subscriptionPlan,
        ends: municipioConfig.subscriptionEnds,
        paymentStatus: municipioConfig.paymentStatus
      }
    };

    console.log('[SETTINGS] ✅ Limites obtidos com sucesso');

    return res.json({
      success: true,
      data: limits
    });
  } catch (error: any) {
    console.error('[SETTINGS] ❌ Erro ao obter limites:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao obter limites',
      details: error.message
    });
  }
});

// PUT /api/super-admin/settings/limits - Atualizar limites
router.put('/settings/limits', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { maxUsers, maxCitizens } = req.body;

    console.log('[SETTINGS] Atualizando limites...');

    const updatedConfig = await prisma.municipioConfig.update({
      where: { id: 'singleton' },
      data: {
        ...(maxUsers && { maxUsers: parseInt(maxUsers) }),
        ...(maxCitizens && { maxCitizens: parseInt(maxCitizens) })
      }
    });

    console.log('[SETTINGS] ✅ Limites atualizados com sucesso');

    return res.json({
      success: true,
      message: 'Limites atualizados com sucesso',
      data: {
        maxUsers: updatedConfig.maxUsers,
        maxCitizens: updatedConfig.maxCitizens
      }
    });
  } catch (error: any) {
    console.error('[SETTINGS] ❌ Erro ao atualizar limites:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar limites',
      details: error.message
    });
  }
});

// ============================================
// GERENCIAMENTO DE USUÁRIOS DO MUNICÍPIO
// ============================================

// GET /api/super-admin/departments - Listar todos os departamentos
router.get('/departments', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    console.log('[DEPARTMENTS] Listando departamentos...');

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`[DEPARTMENTS] ✅ ${departments.length} departamentos obtidos`);

    return res.json({
      success: true,
      data: {
        departments
      }
    });
  } catch (error: any) {
    console.error('[DEPARTMENTS] ❌ Erro ao listar departamentos:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar departamentos',
      details: error.message
    });
  }
});

// GET /api/super-admin/users - Listar TODOS os usuários do município
router.get('/users', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    console.log('[USERS] Listando todos os usuários do município...');

    const { role, active, search, page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Construir filtros
    const where: any = {};

    if (role && typeof role === 'string') {
      where.role = role;
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
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
              situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES }
            },
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
              { dataInicio: 'desc' }
            ]
          },
          _count: {
            select: {
              assignedProtocolsSimplified: true
            }
          }
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: parseInt(limit as string)
      }),
      prisma.user.count({ where })
    ]);

    // Processar departamentos
    const usersWithDepartments = users.map(user => {
      const assignmentDepartments = user.assignments.map((assignment) => ({
        id: assignment.department.id,
        name: assignment.department.name,
        code: assignment.department.code,
        isPrimary: assignment.isPrimary
      }));

      const fallbackDepartments = user.userDepartments.map(ud => ({
        id: ud.department.id,
        name: ud.department.name,
        code: ud.department.code,
        isPrimary: ud.isPrimary
      }));

      const departments =
        assignmentDepartments.length > 0
          ? Array.from(
              new Map(
                assignmentDepartments.map((department) => [department.id, department])
              ).values()
            )
          : fallbackDepartments;

      const primaryDepartmentId = extractPrimaryDepartmentIdFromOrganization(user);
      const primaryDepartment =
        user.assignments.find((assignment) => assignment.departmentId === primaryDepartmentId)?.department ||
        user.userDepartments.find((ud) => ud.departmentId === primaryDepartmentId)?.department ||
        user.department;

      return {
        ...user,
        departments,
        primaryDepartment,
        protocolsCount: user._count.assignedProtocolsSimplified
      };
    });

    const totalPages = Math.ceil(total / parseInt(limit as string));

    console.log(`[USERS] ✅ ${users.length} usuários obtidos (${total} total)`);

    return res.json({
      success: true,
      data: {
        users: usersWithDepartments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages
        }
      }
    });
  } catch (error: any) {
    console.error('[USERS] ❌ Erro ao listar usuários:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar usuários',
      details: error.message
    });
  }
});

// POST /api/super-admin/users - Criar novo usuário
router.post('/users', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role,
      departmentIds,
      primaryDepartmentId,
      isActive
    } = req.body;

    console.log('[USERS] Criando novo usuário:', email);

    // Verificar se email já existe
    const normalizedEmail = normalizeEmail(email) || email;

    // findFirst: unique agora é composta [tenantId, email]; escopo por tenant via extension
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já cadastrado'
      });
    }

    // Hash da senha
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const normalizedDepartmentIds = Array.from(
      new Set(Array.isArray(departmentIds) ? departmentIds.filter(Boolean) : [])
    );
    const resolvedPrimaryDepartmentId =
      normalizedDepartmentIds.includes(primaryDepartmentId)
        ? primaryDepartmentId
        : normalizedDepartmentIds[0] || null;

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: normalizeNullableString(name) || name,
          email: normalizedEmail,
          password: hashedPassword,
          role: role || 'USER',
          isActive: isActive !== false
        }
      });

      await syncUserPersonIdentity(tx, {
        userId: createdUser.id,
        currentPersonId: createdUser.personId,
        name: createdUser.name,
        email: createdUser.email,
        isActive: createdUser.isActive,
      });

      return createdUser;
    });

    console.log('[USERS] ✅ Usuário criado com sucesso:', user.id);

    await reconcileAdministrativeDepartmentAssignments({
      userId: user.id,
      departmentIds: normalizedDepartmentIds,
      primaryDepartmentId: resolvedPrimaryDepartmentId,
      executorId: (req as any).user?.id || null
    });

    const hydratedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
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
        },
        assignments: {
          where: {
            situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES }
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: [{ isPrimary: 'desc' }, { dataInicio: 'desc' }]
        }
      }
    });

    return res.json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: { user: hydratedUser || user }
    });
  } catch (error: any) {
    console.error('[USERS] ❌ Erro ao criar usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar usuário',
      details: error.message
    });
  }
});

// PUT /api/super-admin/users/:id - Atualizar usuário
router.put('/users/:id', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      departmentIds,
      primaryDepartmentId,
      isActive,
      password
    } = req.body;

    console.log('[USERS] Atualizando usuário:', id);

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Preparar dados para atualização
    const updateData: any = {
      name: normalizeNullableString(name) || name,
      email: email ? normalizeEmail(email) || email : email,
      role,
      isActive
    };

    // Se senha foi fornecida, fazer hash
    if (password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Atualizar usuário
    const existingTarget = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        personId: true,
        name: true,
        email: true,
        isActive: true,
      }
    });

    if (!existingTarget) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: updateData
      });

      await syncUserPersonIdentity(tx, {
        userId: id,
        currentPersonId: existingTarget.personId,
        name: updated.name,
        email: updated.email,
        isActive: updated.isActive,
      });

      return updated;
    });

    console.log('[USERS] ✅ Usuário atualizado com sucesso:', id);

    if (departmentIds !== undefined || primaryDepartmentId !== undefined) {
      const normalizedDepartmentIds = Array.from(
        new Set(Array.isArray(departmentIds) ? departmentIds.filter(Boolean) : [])
      );
      const resolvedPrimaryDepartmentId =
        normalizedDepartmentIds.includes(primaryDepartmentId)
          ? primaryDepartmentId
          : normalizedDepartmentIds[0] || null;

      await reconcileAdministrativeDepartmentAssignments({
        userId: id,
        departmentIds: normalizedDepartmentIds,
        primaryDepartmentId: resolvedPrimaryDepartmentId,
        executorId: (req as any).user?.id || null
      });
    }

    const hydratedUser = await prisma.user.findUnique({
      where: { id },
      include: {
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
        },
        assignments: {
          where: {
            situacao: { in: ACTIVE_ORGANIZATIONAL_ASSIGNMENT_STATUSES }
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          },
          orderBy: [{ isPrimary: 'desc' }, { dataInicio: 'desc' }]
        }
      }
    });

    return res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: { user: hydratedUser || updatedUser }
    });
  } catch (error: any) {
    console.error('[USERS] ❌ Erro ao atualizar usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar usuário',
      details: error.message
    });
  }
});

// DELETE /api/super-admin/users/:id - Excluir usuário
router.delete('/users/:id', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log('[USERS] Excluindo usuário:', id);

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Não permitir excluir super admins
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Não é permitido excluir Super Admins'
      });
    }

    // Excluir departamentos do usuário
    await prisma.userDepartment.deleteMany({
      where: { userId: id }
    });

    // Excluir usuário
    await prisma.user.delete({
      where: { id }
    });

    console.log('[USERS] ✅ Usuário excluído com sucesso:', id);

    return res.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
  } catch (error: any) {
    console.error('[USERS] ❌ Erro ao excluir usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao excluir usuário',
      details: error.message
    });
  }
});

// GET /api/super-admin/users/admins - Listar apenas super admins
router.get('/users/admins', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({
      success: true,
      data: superAdmins
    });
  } catch (error) {
    console.error('Erro ao listar super admins:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/super-admin/users/admins - Criar novo super admin
router.post('/users/admins', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { name, email, password, departmentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    // Verificar se email já existe
    const normalizedEmail = normalizeEmail(email) || email;

    // findFirst: unique agora é composta [tenantId, email]; escopo por tenant via extension
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const newAdmin = await prisma.$transaction(async (tx) => {
      const createdAdmin = await tx.user.create({
        data: {
          name: normalizeNullableString(name) || name,
          email: normalizedEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true
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
              name: true
            }
          }
        }
      });

      await syncUserPersonIdentity(tx, {
        userId: createdAdmin.id,
        currentPersonId: createdAdmin.personId,
        name: createdAdmin.name,
        email: createdAdmin.email,
        isActive: createdAdmin.isActive,
      });

      return createdAdmin;
    });

    await reconcileAdministrativeDepartmentAssignments({
      userId: newAdmin.id,
      departmentIds: departmentId ? [departmentId] : [],
      primaryDepartmentId: departmentId || null,
      executorId: (req as any).user?.id || null
    });

    const hydratedAdmin = await prisma.user.findUnique({
      where: { id: newAdmin.id },
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
            name: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Super Admin criado com sucesso',
      data: hydratedAdmin || newAdmin
    });
  } catch (error) {
    console.error('Erro ao criar super admin:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/super-admin/users/admins/:id - Atualizar super admin
router.put('/users/admins/:id', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, isActive, departmentId } = req.body;

    const updateData: any = {};
    if (name) updateData.name = normalizeNullableString(name) || name;
    if (email) updateData.email = normalizeEmail(email) || email;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const existingAdmin = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        personId: true,
        name: true,
        email: true,
        isActive: true,
      }
    });

    if (!existingAdmin) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updatedAdmin = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
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
              name: true
            }
          }
        }
      });

      await syncUserPersonIdentity(tx, {
        userId: id,
        currentPersonId: existingAdmin.personId,
        name: updated.name,
        email: updated.email,
        isActive: updated.isActive,
      });

      return updated;
    });

    if (departmentId !== undefined) {
      await reconcileAdministrativeDepartmentAssignments({
        userId: id,
        departmentIds: departmentId ? [departmentId] : [],
        primaryDepartmentId: departmentId || null,
        executorId: (req as any).user?.id || null
      });
    }

    const hydratedAdmin = await prisma.user.findUnique({
      where: { id },
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
            name: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Super Admin atualizado com sucesso',
      data: hydratedAdmin || updatedAdmin
    });
  } catch (error) {
    console.error('Erro ao atualizar super admin:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/super-admin/users/admins/:id - Desativar super admin
router.delete('/users/admins/:id', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).userId;

    // Não permitir que o usuário desative a si mesmo
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Não é possível desativar sua própria conta' });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: 'Super Admin desativado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desativar super admin:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/super-admin/audit - Listar logs de auditoria
router.get('/audit', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const {
      dateRange = '24h',
      status,
      action,
      resource,
      userId,
      tenantId,
      page = '1',
      limit = '50'
    } = req.query;

    // Construir filtros de data
    const now = new Date();
    let dateFilter: any = {};

    switch (dateRange) {
      case '1h':
        dateFilter = { gte: new Date(now.getTime() - 60 * 60 * 1000) };
        break;
      case '24h':
        dateFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        break;
      case '7d':
        dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'all':
      default:
        dateFilter = undefined;
        break;
    }

    // Construir filtros
    const where: any = {};
    if (dateFilter) {
      where.createdAt = dateFilter;
    }
    if (status) {
      where.success = status === 'success' ? true : status === 'failed' ? false : undefined;
    }
    if (action && action !== 'all') {
      where.action = { startsWith: action as string };
    }
    if (resource && resource !== 'all') {
      where.resource = { contains: resource as string };
    }
    if (userId) {
      where.userId = userId as string;
    }
    // Filtro por município (auditoria cross-tenant da plataforma)
    if (tenantId && tenantId !== 'all') {
      where.tenantId = tenantId as string;
    }

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Buscar logs
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          citizen: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.auditLog.count({ where })
    ]);

    // Formatar resposta
    const formattedLogs = logs.map(log => {
      const actor = log.user || log.citizen;
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        userId: log.userId || log.citizenId || 'system',
        userName: actor?.name || 'Sistema',
        userEmail: actor?.email || 'system@digiurban.com',
        action: log.action,
        resource: log.resource || 'unknown',
        resourceId: (log.details as any)?.resourceId || 'N/A',
        status: log.success ? 'success' : 'failed',
        ipAddress: log.ip || 'unknown',
        userAgent: log.userAgent || 'unknown',
        changes: (log.details as any)?.changes || [],
        metadata: log.details || {},
        errorMessage: log.errorMessage
      };
    });

    return res.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/super-admin/audit/stats - Estatísticas de auditoria
router.get('/audit/stats', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { dateRange = '24h' } = req.query;

    // Construir filtros de data
    const now = new Date();
    let dateFilter: any = {};

    switch (dateRange) {
      case '1h':
        dateFilter = { gte: new Date(now.getTime() - 60 * 60 * 1000) };
        break;
      case '24h':
        dateFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        break;
      case '7d':
        dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'all':
      default:
        dateFilter = undefined;
        break;
    }

    const where: any = dateFilter ? { createdAt: dateFilter } : {};

    // Buscar estatísticas
    const [
      totalActions,
      successfulActions,
      failedActions,
      criticalActions,
      uniqueUsers,
      uniqueCitizens
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, success: true } }),
      prisma.auditLog.count({ where: { ...where, success: false } }),
      prisma.auditLog.count({
        where: {
          ...where,
          action: {
            in: ['user_deleted', 'citizen_deleted', 'account_locked', 'tenant_suspended', 'data_export']
          }
        }
      }),
      prisma.auditLog.findMany({
        where: { ...where, userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true }
      }),
      prisma.auditLog.findMany({
        where: { ...where, citizenId: { not: null } },
        distinct: ['citizenId'],
        select: { citizenId: true }
      })
    ]);

    const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;

    return res.json({
      success: true,
      data: {
        totalActions,
        successRate: parseFloat(successRate.toFixed(1)),
        failedActions,
        criticalActions,
        uniqueUsers: uniqueUsers.length,
        uniqueTenants: uniqueCitizens.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de auditoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/super-admin/audit/export - Exportar logs de auditoria
router.post('/audit/export', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { format = 'json', dateRange = '24h', filters = {} } = req.body;

    // Construir filtros de data
    const now = new Date();
    let dateFilter: any = {};

    switch (dateRange) {
      case '1h':
        dateFilter = { gte: new Date(now.getTime() - 60 * 60 * 1000) };
        break;
      case '24h':
        dateFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        break;
      case '7d':
        dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case 'all':
      default:
        dateFilter = undefined;
        break;
    }

    const where: any = dateFilter ? { createdAt: dateFilter } : {};

    // Aplicar filtros adicionais
    if (filters.status) {
      where.success = filters.status === 'success';
    }
    if (filters.action) {
      where.action = { startsWith: filters.action };
    }

    // Buscar todos os logs
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        citizen: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (format === 'csv') {
      // Gerar CSV
      const csvHeader = 'ID,Timestamp,User,Email,Action,Resource,Status,IP,User Agent\n';
      const csvRows = logs.map(log => {
        const actor = log.user || log.citizen;
        return [
          log.id,
          log.createdAt.toISOString(),
          actor?.name || 'Sistema',
          actor?.email || 'system@digiurban.com',
          log.action,
          log.resource || 'unknown',
          log.success ? 'success' : 'failed',
          log.ip || 'unknown',
          `"${log.userAgent || 'unknown'}"`
        ].join(',');
      }).join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      return res.send(csv);
    } else {
      // Gerar JSON
      const jsonData = logs.map(log => {
        const actor = log.user || log.citizen;
        return {
          id: log.id,
          timestamp: log.createdAt.toISOString(),
          userName: actor?.name || 'Sistema',
          userEmail: actor?.email || 'system@digiurban.com',
          action: log.action,
          resource: log.resource || 'unknown',
          status: log.success ? 'success' : 'failed',
          ipAddress: log.ip || 'unknown',
          userAgent: log.userAgent || 'unknown',
          details: log.details,
          errorMessage: log.errorMessage
        };
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
      return res.json(jsonData);
    }
  } catch (error) {
    console.error('Erro ao exportar logs de auditoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Mount email server management routes
router.use('/email-server', emailServerRouter);

// ============================================
// SYSTEM LOGS - Visualização de Logs Winston
// ============================================

interface LogLine {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  stack?: string;
}

// GET /api/super-admin/system-logs - Listar arquivos de log disponíveis
router.get('/system-logs', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');

    // Verificar se o diretório existe
    try {
      await fs.access(logsDir);
    } catch {
      return res.json({
        success: true,
        data: {
          logs: [],
          logsDir,
          message: 'Diretório de logs não encontrado ou vazio'
        }
      });
    }

    const files = await fs.readdir(logsDir);

    const logFiles = await Promise.all(
      files
        .filter(file => file.endsWith('.log'))
        .map(async (file) => {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);

          // Extrair tipo e data do nome do arquivo
          // Formato: combined-2026-01-02.log, error-2026-01-02.log, etc.
          const match = file.match(/^([\w-]+)-(\d{4}-\d{2}-\d{2})\.log$/);

          return {
            fileName: file,
            type: match ? match[1] : 'unknown',
            date: match ? match[2] : null,
            size: stats.size,
            sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            path: file
          };
        })
    );

    // Ordenar por data (mais recente primeiro) e depois por tipo
    logFiles.sort((a, b) => {
      const dateCompare = (b.date || '').localeCompare(a.date || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.type || '').localeCompare(b.type || '');
    });

    // Agrupar por tipo
    const logsByType: Record<string, typeof logFiles> = {};
    logFiles.forEach(log => {
      if (!logsByType[log.type]) {
        logsByType[log.type] = [];
      }
      logsByType[log.type].push(log);
    });

    return res.json({
      success: true,
      data: {
        logs: logFiles,
        logsByType,
        logsDir,
        totalFiles: logFiles.length,
        totalSize: logFiles.reduce((sum, log) => sum + log.size, 0)
      }
    });
  } catch (error: any) {
    console.error('[SYSTEM-LOGS] Erro ao listar logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao listar arquivos de log',
      details: error.message
    });
  }
});

// GET /api/super-admin/system-logs/:fileName - Ler conteúdo de um arquivo de log
router.get('/system-logs/:fileName', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const {
      offset = '0',
      limit = '100',
      level,
      search,
      reverse = 'true' // Por padrão, mostrar logs mais recentes primeiro
    } = req.query;

    // Validar nome do arquivo para evitar path traversal
    if (fileName.includes('..') || fileName.includes('/') || !fileName.endsWith('.log')) {
      return res.status(400).json({
        success: false,
        error: 'Nome de arquivo inválido'
      });
    }

    const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');
    const filePath = path.join(logsDir, fileName);

    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Arquivo de log não encontrado'
      });
    }

    // Ler o arquivo
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    // Parse das linhas JSON
    let parsedLines: LogLine[] = lines
      .map((line, index) => {
        try {
          // Tentar parse como JSON (formato Winston)
          const parsed = JSON.parse(line);
          return {
            timestamp: parsed.timestamp || new Date().toISOString(),
            level: parsed.level || 'info',
            message: parsed.message || line,
            meta: parsed,
            stack: parsed.stack,
            _lineNumber: index + 1
          };
        } catch {
          // Se não for JSON, tratar como texto simples
          return {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line,
            meta: {},
            _lineNumber: index + 1
          };
        }
      });

    // Filtrar por nível se especificado
    if (level) {
      parsedLines = parsedLines.filter(line =>
        line.level.toLowerCase() === (level as string).toLowerCase()
      );
    }

    // Filtrar por busca se especificado
    if (search) {
      const searchLower = (search as string).toLowerCase();
      parsedLines = parsedLines.filter(line => {
        const messageMatch = line.message.toLowerCase().includes(searchLower);
        const metaMatch = JSON.stringify(line.meta).toLowerCase().includes(searchLower);
        return messageMatch || metaMatch;
      });
    }

    // Reverter ordem se solicitado (logs mais recentes primeiro)
    if (reverse === 'true') {
      parsedLines.reverse();
    }

    // Paginação
    const offsetNum = parseInt(offset as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const total = parsedLines.length;
    const paginatedLines = parsedLines.slice(offsetNum, offsetNum + limitNum);

    return res.json({
      success: true,
      data: {
        lines: paginatedLines,
        total,
        offset: offsetNum,
        limit: limitNum,
        hasMore: offsetNum + limitNum < total,
        fileName
      }
    });
  } catch (error: any) {
    console.error('[SYSTEM-LOGS] Erro ao ler log:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao ler arquivo de log',
      details: error.message
    });
  }
});

// GET /api/super-admin/system-logs/:fileName/download - Download do arquivo completo
router.get('/system-logs/:fileName/download', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;

    // Validar nome do arquivo
    if (fileName.includes('..') || fileName.includes('/') || !fileName.endsWith('.log')) {
      return res.status(400).json({
        success: false,
        error: 'Nome de arquivo inválido'
      });
    }

    const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');
    const filePath = path.join(logsDir, fileName);

    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Arquivo de log não encontrado'
      });
    }

    // Enviar o arquivo
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('[SYSTEM-LOGS] Erro ao fazer download:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao fazer download do arquivo',
      details: error.message
    });
  }
});

// GET /api/super-admin/system-logs/stats - Estatísticas agregadas
router.get('/system-logs/stats', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { dateRange = '24h' } = req.query;

    const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');

    // Calcular período
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Ler arquivo combined do dia atual
    const today = now.toISOString().split('T')[0];
    const combinedFile = `combined-${today}.log`;
    const errorFile = `error-${today}.log`;
    const httpFile = `http-${today}.log`;

    const stats = {
      errors: 0,
      warnings: 0,
      info: 0,
      debug: 0,
      httpRequests: 0,
      totalLogs: 0,
      avgResponseTime: 0,
      timeRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    };

    // Ler arquivo combined para estatísticas gerais
    try {
      const combinedPath = path.join(logsDir, combinedFile);
      const content = await fs.readFile(combinedPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      let responseTimes: number[] = [];

      lines.forEach(line => {
        try {
          const log = JSON.parse(line);
          const logDate = new Date(log.timestamp);

          if (logDate >= startDate && logDate <= now) {
            stats.totalLogs++;

            switch (log.level) {
              case 'error':
                stats.errors++;
                break;
              case 'warn':
                stats.warnings++;
                break;
              case 'info':
                stats.info++;
                break;
              case 'debug':
                stats.debug++;
                break;
            }

            // Extrair tempo de resposta se disponível
            if (log.responseTime) {
              const time = parseInt(log.responseTime.replace('ms', ''), 10);
              if (!isNaN(time)) {
                responseTimes.push(time);
              }
            }
          }
        } catch {
          // Ignorar linhas inválidas
        }
      });

      // Calcular média de tempo de resposta
      if (responseTimes.length > 0) {
        stats.avgResponseTime = Math.round(
          responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        );
      }
    } catch {
      // Arquivo não existe ou erro ao ler
    }

    // Ler arquivo HTTP para contagem de requisições
    try {
      const httpPath = path.join(logsDir, httpFile);
      const content = await fs.readFile(httpPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      lines.forEach(line => {
        try {
          const log = JSON.parse(line);
          const logDate = new Date(log.timestamp);

          if (logDate >= startDate && logDate <= now) {
            stats.httpRequests++;
          }
        } catch {
          // Ignorar linhas inválidas
        }
      });
    } catch {
      // Arquivo não existe ou erro ao ler
    }

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('[SYSTEM-LOGS] Erro ao calcular estatísticas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao calcular estatísticas',
      details: error.message
    });
  }
});

// GET /api/super-admin/system-logs/:fileName/stream - Stream em tempo real (SSE)
router.get('/system-logs/:fileName/stream', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;

    // Validar nome do arquivo
    if (fileName.includes('..') || fileName.includes('/') || !fileName.endsWith('.log')) {
      return res.status(400).json({
        success: false,
        error: 'Nome de arquivo inválido'
      });
    }

    const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');
    const filePath = path.join(logsDir, fileName);

    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Arquivo de log não encontrado'
      });
    }

    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Ler posição atual do arquivo
    let lastSize = (await fs.stat(filePath)).size;

    // Função para enviar novos logs
    const sendNewLogs = async () => {
      try {
        const currentSize = (await fs.stat(filePath)).size;

        if (currentSize > lastSize) {
          // Ler apenas a parte nova do arquivo
          const readStream = require('fs').createReadStream(filePath, {
            start: lastSize,
            end: currentSize
          });

          let newContent = '';
          for await (const chunk of readStream) {
            newContent += chunk.toString();
          }

          // Enviar novas linhas via SSE
          const newLines = newContent.split('\n').filter(line => line.trim());
          newLines.forEach(line => {
            try {
              const parsed = JSON.parse(line);
              res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            } catch {
              res.write(`data: ${JSON.stringify({ message: line })}\n\n`);
            }
          });

          lastSize = currentSize;
        }
      } catch (error) {
        console.error('[SYSTEM-LOGS] Erro no streaming:', error);
      }
    };

    // Enviar heartbeat e verificar novos logs a cada 2 segundos
    const interval = setInterval(sendNewLogs, 2000);

    // Limpar ao desconectar
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });

    // Enviar mensagem inicial
    res.write(`data: ${JSON.stringify({ type: 'connected', fileName })}\n\n`);
  } catch (error: any) {
    console.error('[SYSTEM-LOGS] Erro ao iniciar stream:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao iniciar streaming',
      details: error.message
    });
  }
});


// ============================================================================
// GESTÃO DE TENANTS (Fases 5/8 Multi-Tenant — groundwork de provisionamento)
// Na Fase 5 estes endpoints migram para o painel de plataforma (PlatformUser);
// até lá, SUPER_ADMIN do tenant default opera como plataforma.
// ============================================================================

const createTenantSchema = z.object({
  slug: z.string().min(2).max(40).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'slug: minúsculas, números e hífens'),
  nome: z.string().min(3),
  cnpj: z.string().min(14),
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

// (RESERVED_SLUGS agora vive no tenant-provisioning.service — validado lá)

// ⚠️ DUPLA ACEITAÇÃO (Fase C): estes endpoints foram MIGRADOS para
// /api/platform/tenants (PlatformUser — identidade de plataforma separada do
// tenant, achado R2). Permanecem aqui apenas até o corte (Fase D/H), agora
// delegando para o MESMO service. Não adicionar funcionalidades novas aqui.
function warnDeprecatedTenantEndpoint(req: Request): void {
  console.warn(
    `[DEPRECATED] ${req.method} ${req.originalUrl} — use /api/platform/tenants (PlatformUser). Corte previsto na Fase D/H.`
  );
}

// GET /api/super-admin/tenants — listar todos os tenants
router.get('/tenants', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    warnDeprecatedTenantEndpoint(req);
    const tenants = await listTenantsWithUsage();
    res.json({ success: true, tenants });
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
});

// POST /api/super-admin/tenants — provisionar novo município
// Cria: tenant + usuário ADMIN inicial (senha temporária, mustChangePassword)
router.post('/tenants', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    warnDeprecatedTenantEndpoint(req);
    const parsed = createTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }

    const result = await provisionTenant(parsed.data);

    await logAuditEvent({
      userId: (req as any).userId,
      action: AUDIT_EVENTS.TENANT_CREATED,
      resource: req.originalUrl,
      method: req.method,
      details: { tenantId: result.tenant.id, slug: result.tenant.slug, adminEmail: parsed.data.adminEmail },
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
      // Entregue UMA única vez; o admin troca no primeiro login (mustChangePassword)
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
});

// PATCH /api/super-admin/tenants/:id — atualizar/suspender/reativar
router.patch('/tenants/:id', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    warnDeprecatedTenantEndpoint(req);
    const updateSchema = createTenantSchema.partial().omit({ adminName: true, adminEmail: true }).extend({
      status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'CANCELLED']).optional(),
      suspensionReason: z.string().nullable().optional(),
      paymentStatus: z.string().optional(),
    });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    }

    const tenant = await updateTenant(req.params.id, parsed.data as Record<string, unknown>);

    await logAuditEvent({
      userId: (req as any).userId,
      action: AUDIT_EVENTS.TENANT_CONFIG_CHANGE,
      resource: req.originalUrl,
      method: req.method,
      details: { tenantId: tenant.id, changes: Object.keys(parsed.data) },
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
});

// ============================================================================
// DETALHE / ADMINS / MÓDULOS DE UM MUNICÍPIO (painel de plataforma)
// ============================================================================

// GET /api/super-admin/modules — catálogo de módulos ativáveis (para o wizard)
router.get('/modules', adminAuthMiddleware, superAdminOnly, (_req: Request, res: Response) => {
  res.json({ success: true, modules: AVAILABLE_MODULES });
});

// GET /api/super-admin/platform-info — dados da plataforma p/ o painel montar
// o endereço da prefeitura (subdomínio) e sinalizar se a infra está pronta.
router.get('/platform-info', adminAuthMiddleware, superAdminOnly, (_req: Request, res: Response) => {
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

// POST /api/super-admin/tenants/:id/logo — upload do logo (identidade visual)
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
  adminAuthMiddleware,
  superAdminOnly,
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
      const uploadBase = process.env.UPLOAD_BASE_PATH || path.join(process.cwd(), 'uploads');
      const dir = path.join(uploadBase, 'public', 'branding', tenantId);
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

// GET /api/super-admin/tenants/:id — detalhe (uso, limites, admins)
router.get('/tenants/:id', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const detail = await getTenantDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: 'Município não encontrado' });
    res.json({ success: true, tenant: detail });
  } catch (error) {
    console.error('Erro ao buscar detalhe do município:', error);
    res.status(500).json({ error: 'Erro ao buscar município' });
  }
});

// POST /api/super-admin/tenants/:id/admins — novo ADMIN municipal
router.post('/tenants/:id/admins', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const schema = z.object({ name: z.string().min(3), email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Nome e email válidos são obrigatórios' });

    const admin = await createTenantAdmin(req.params.id, parsed.data);
    await logAuditEvent({
      userId: (req as any).userId,
      action: 'tenant_admin_created',
      resource: req.originalUrl,
      method: req.method,
      details: { tenantId: req.params.id, adminEmail: parsed.data.email },
      ip: req.ip, userAgent: req.headers['user-agent'], success: true,
    }).catch(() => undefined);
    res.status(201).json({ success: true, admin });
  } catch (error: any) {
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Email já em uso' });
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ error: 'Erro ao criar administrador' });
  }
});

// POST /api/super-admin/tenants/:id/users/:userId/reset-password
router.post('/tenants/:id/users/:userId/reset-password', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const result = await resetTenantUserPassword(req.params.id, req.params.userId);
    await logAuditEvent({
      userId: (req as any).userId,
      action: 'tenant_user_password_reset',
      resource: req.originalUrl,
      method: req.method,
      details: { tenantId: req.params.id, targetUserId: req.params.userId },
      ip: req.ip, userAgent: req.headers['user-agent'], success: true,
    }).catch(() => undefined);
    res.json({ success: true, ...result });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ error: error.message });
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
});

// PATCH /api/super-admin/tenants/:id/users/:userId — ativar/desativar
router.patch('/tenants/:id/users/:userId', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
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

// GET /api/super-admin/invoices — todas as faturas (filtro opcional ?status=)
router.get('/invoices', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const invoices = await listAllInvoices(req.query.status as string | undefined);
    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Erro ao listar faturas:', error);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
});

// GET /api/super-admin/tenants/:id/invoices — faturas de um município
router.get('/tenants/:id/invoices', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const invoices = await listTenantInvoices(req.params.id);
    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Erro ao listar faturas do município:', error);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
});

// POST /api/super-admin/tenants/:id/invoices — gerar fatura
router.post('/tenants/:id/invoices', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
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

// PATCH /api/super-admin/invoices/:invoiceId — mudar status (pagar/cancelar)
router.patch('/invoices/:invoiceId', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
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
// LEADS (funil de captação)
// ============================================================================

// GET /api/super-admin/leads — funil (filtro opcional ?status=)
router.get('/leads', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const leads = await listLeads(req.query.status as string | undefined);
    res.json({ success: true, leads });
  } catch (error) {
    console.error('Erro ao listar leads:', error);
    res.status(500).json({ error: 'Erro ao listar leads' });
  }
});

// PATCH /api/super-admin/leads/:leadId — mover no funil
router.patch('/leads/:leadId', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
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

export default router;
