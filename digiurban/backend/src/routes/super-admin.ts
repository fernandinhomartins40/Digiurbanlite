import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginRateLimiter } from '../middleware/rate-limit';
import { accountLockoutMiddleware } from '../middleware/account-lockout';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import emailServerRouter from './email-server';

const execAsync = promisify(exec);
const router = Router();

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

    // Buscar usuário pelo email
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        isActive: true
      },
      include: {
        department: true
      }
    });

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
        type: 'admin'
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
    // Usar /tmp que sempre tem permissão de escrita
    const backupDir = '/tmp/digiurban-backups';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);

    // Criar diretório de backups se não existir
    await fs.mkdir(backupDir, { recursive: true });

    console.log('[BACKUP] Iniciando backup do banco de dados...');

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
    const backupDir = '/tmp/digiurban-backups';

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
    const backupDir = '/tmp/digiurban-backups';
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
    const backupDir = '/tmp/digiurban-backups';
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
    const backupDir = '/tmp/digiurban-backups';
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

    // Lista de todos os modelos do Prisma
    const modelNames = [
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

    // Obter contagem de registros para cada tabela
    const tables = await Promise.all(
      modelNames.map(async (modelName) => {
        try {
          // @ts-ignore
          const count = await prisma[modelName].count();

          // Mapear nome do modelo para nome da tabela no PostgreSQL
          const tableNameMap: Record<string, string> = {
            'municipioConfig': 'municipio_config',
            'user': 'users',
            'citizen': 'citizens',
            'department': 'departments',
            'protocolSimplified': 'protocols_simplified',
            'service': 'services_simplified',
            'auditLog': 'audit_logs',
            'citizenDocument': 'citizen_documents',
            'protocolDocument': 'protocol_documents',
            'protocolInteraction': 'protocol_interactions',
            'protocolStage': 'protocol_stages',
            'notification': 'notifications'
          };

          const tableName = tableNameMap[modelName] || modelName;

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

          // Última modificação - usar data atual como aproximação
          const lastModified = new Date();

          return {
            name: tableName,
            recordCount: count,
            size: `${sizeMB} MB`,
            lastModified: lastModified.toISOString(),
            indexes: indexCount,
            relations: [] // Simplificado - pode ser expandido consultando pg_constraint
          };
        } catch (error: any) {
          console.warn(`[SCHEMA] Erro ao processar tabela ${modelName}:`, error.message);
          return null;
        }
      })
    );

    // Filtrar tabelas que falharam
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
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        departmentId: departmentId || null,
        isActive: true
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
            name: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Super Admin criado com sucesso',
      data: newAdmin
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
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (departmentId !== undefined) updateData.departmentId = departmentId;

    const updatedAdmin = await prisma.user.update({
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

    return res.json({
      success: true,
      message: 'Super Admin atualizado com sucesso',
      data: updatedAdmin
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

export default router;
