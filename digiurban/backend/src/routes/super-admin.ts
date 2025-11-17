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
    const backupDir = path.join(process.cwd(), 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    // Criar diretório de backups se não existir
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (err) {
      console.log('Diretório de backups já existe ou erro ao criar:', err);
    }

    // Obter caminho do banco de dados
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';

    // Copiar arquivo do banco de dados
    await fs.copyFile(dbPath, backupPath);

    // Obter tamanho do arquivo
    const stats = await fs.stat(backupPath);

    return res.json({
      success: true,
      message: 'Backup criado com sucesso',
      data: {
        fileName: backupFileName,
        path: backupPath,
        size: stats.size,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar backup do banco de dados'
    });
  }
});

// GET /api/super-admin/system/backups - Listar backups disponíveis
router.get('/system/backups', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const backupDir = path.join(process.cwd(), 'backups');

    try {
      const files = await fs.readdir(backupDir);
      const backups = await Promise.all(
        files
          .filter(file => file.endsWith('.db'))
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

// ============================================
// EMAIL SERVER ROUTES
// ============================================

// GET /api/super-admin/email-server/domains - Listar domínios
router.get('/email-server/domains', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    // TODO: Integrar com ultrazend-smtp-server para buscar domínios reais
    // Por enquanto, retornar mock vazio
    const domains: any[] = [];

    return res.json({ domains });
  } catch (error) {
    console.error('Erro ao buscar domínios:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/super-admin/email-server/domains - Adicionar domínio
router.post('/email-server/domains', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { domain_name } = req.body;

    if (!domain_name || typeof domain_name !== 'string') {
      return res.status(400).json({ error: 'Nome do domínio é obrigatório' });
    }

    // TODO: Integrar com ultrazend-smtp-server para adicionar domínio real
    const domain = {
      id: Date.now().toString(),
      domain_name: domain_name.toLowerCase(),
      is_verified: false,
      dkim_enabled: true,
      spf_enabled: true,
      created_at: new Date().toISOString()
    };

    return res.json({ domain });
  } catch (error) {
    console.error('Erro ao adicionar domínio:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/super-admin/email-server/domains/:id - Remover domínio
router.delete('/email-server/domains/:id', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Integrar com ultrazend-smtp-server para remover domínio real

    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover domínio:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/super-admin/email-server/domains/:id/verify - Verificar domínio
router.post('/email-server/domains/:id/verify', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Integrar com ultrazend-smtp-server para verificar DNS real
    // Por enquanto, simular verificação
    const verified = Math.random() > 0.5; // Mock: 50% de chance

    return res.json({ verified });
  } catch (error) {
    console.error('Erro ao verificar domínio:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/super-admin/email-server/dkim - Listar chaves DKIM
router.get('/email-server/dkim', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    // TODO: Integrar com ultrazend-smtp-server para buscar chaves DKIM reais
    const keys: any[] = [];

    return res.json({ keys });
  } catch (error) {
    console.error('Erro ao buscar chaves DKIM:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/super-admin/email-server/dkim/generate - Gerar chave DKIM
router.post('/email-server/dkim/generate', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { domain_id } = req.body;

    if (!domain_id) {
      return res.status(400).json({ error: 'ID do domínio é obrigatório' });
    }

    // TODO: Integrar com ultrazend-smtp-server para gerar chave DKIM real
    const key = {
      id: Date.now().toString(),
      domain_id,
      selector: 'default',
      public_key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...', // Mock
      is_active: true
    };

    return res.json({ key });
  } catch (error) {
    console.error('Erro ao gerar chave DKIM:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/super-admin/email-server/config - Obter configuração SMTP
router.get('/email-server/config', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    // TODO: Integrar com ultrazend-smtp-server para buscar config real
    const config = {
      hostname: 'mail.digiurban.com',
      mxPort: 25,
      submissionPort: 587,
      tlsEnabled: true,
      maxConnections: 100,
      maxMessageSize: 50 * 1024 * 1024
    };

    return res.json({ config });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/super-admin/email-server/config - Atualizar configuração SMTP
router.put('/email-server/config', adminAuthMiddleware, superAdminOnly, async (req: Request, res: Response) => {
  try {
    const { hostname, mxPort, submissionPort, tlsEnabled, maxConnections, maxMessageSize } = req.body;

    // TODO: Integrar com ultrazend-smtp-server para salvar config real

    return res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
