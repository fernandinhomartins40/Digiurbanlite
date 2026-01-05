import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import emailDomainsRouter from './email-domains';
// SMTP Server agora roda em container separado (ultrazend-smtp)
// import { getEmailServerRuntimeStatus, startEmailServer, stopEmailServer } from '../lib/email/email-server-manager';

const router = Router();

// Aplicar middleware de autenticação e super admin em todas as rotas
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Mount domains routes
router.use('/domains', emailDomainsRouter);

/**
 * GET /api/super-admin/email-server/status
 * Retorna o status atual do servidor SMTP
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const emailServer = await prisma.emailServer.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!emailServer) {
      return res.json({
        status: {
          isRunning: false,
          uptime: 0,
          hostname: 'N/A',
          ports: { mx: 25, submission: 587 },
          stats: {
            totalEmails: 0,
            deliveredEmails: 0,
            failedEmails: 0,
            queuedEmails: 0,
            deliveryRate: '0%'
          },
          connections: {
            active: 0,
            total: 0
          }
        }
      });
    }

    // Buscar estatísticas
    const [totalEmails, deliveredEmails, failedEmails, queuedEmails] = await Promise.all([
      prisma.email.count({ where: { emailServerId: emailServer.id } }),
      prisma.email.count({ where: { emailServerId: emailServer.id, status: 'DELIVERED' } }),
      prisma.email.count({ where: { emailServerId: emailServer.id, status: 'FAILED' } }),
      prisma.email.count({ where: { emailServerId: emailServer.id, status: 'QUEUED' } })
    ]);

    const deliveryRate = totalEmails > 0
      ? ((deliveredEmails / totalEmails) * 100).toFixed(1) + '%'
      : '0%';

    // SMTP Server agora roda em container separado - status fixo
    // const runtimeStatus = getEmailServerRuntimeStatus();

    res.json({
      status: {
        isRunning: emailServer.isActive,  // Baseado no DB, não runtime
        uptime: 0,  // Container separado não reporta uptime aqui
        hostname: emailServer.hostname,
        ports: {
          mx: emailServer.mxPort,
          submission: emailServer.submissionPort
        },
        stats: {
          totalEmails,
          deliveredEmails,
          failedEmails,
          queuedEmails,
          deliveryRate
        },
        connections: {
          active: 0,  // Container separado não reporta conexões
          total: 100
        }
      }
    });
  } catch (error) {
    console.error('Error getting server status:', error);
    res.status(500).json({ error: 'Failed to get server status' });
  }
});

/**
 * GET /api/super-admin/email-server/dashboard-stats
 * Retorna estatísticas completas para o dashboard
 */
router.get('/dashboard-stats', async (req: Request, res: Response) => {
  try {
    const emailServer = await prisma.emailServer.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!emailServer) {
      return res.json({
        stats: {
          server: { isRunning: false, uptime: 0, hostname: 'N/A' },
          domains: { total: 0, verified: 0, pending: 0 },
          emails: { total: 0, sent: 0, delivered: 0, failed: 0, queued: 0, deliveryRate: 0 },
          recentActivity: []
        }
      });
    }

    // Estatísticas de domínios
    const [totalDomains, verifiedDomains] = await Promise.all([
      prisma.emailDomain.count({ where: { emailServerId: emailServer.id } }),
      prisma.emailDomain.count({ where: { emailServerId: emailServer.id, isVerified: true } })
    ]);

    // Estatísticas de emails
    const [totalEmails, sentEmails, deliveredEmails, failedEmails, queuedEmails] = await Promise.all([
      prisma.email.count({ where: { emailServerId: emailServer.id } }),
      prisma.email.count({ where: { emailServerId: emailServer.id, status: 'SENT' } }),
      prisma.email.count({ where: { emailServerId: emailServer.id, status: 'DELIVERED' } }),
      prisma.email.count({ where: { emailServerId: emailServer.id, status: 'FAILED' } }),
      prisma.email.count({ where: { emailServerId: emailServer.id, status: 'QUEUED' } })
    ]);

    const deliveryRate = totalEmails > 0
      ? (deliveredEmails / totalEmails) * 100
      : 0;

    // Atividade recente (últimos logs)
    const recentLogs = await prisma.emailLog.findMany({
      where: { emailServerId: emailServer.id },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    const recentActivity = recentLogs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      type: log.level,
      message: log.message,
      status: log.level === 'ERROR' ? 'error' as const :
              log.level === 'WARN' ? 'warning' as const :
              log.level === 'INFO' ? 'success' as const : 'info' as const
    }));

    // SMTP Server agora roda em container separado
    // const runtimeStatus = getEmailServerRuntimeStatus();

    res.json({
      stats: {
        server: {
          isRunning: emailServer.isActive,
          uptime: 0,
          hostname: emailServer.hostname
        },
        domains: {
          total: totalDomains,
          verified: verifiedDomains,
          pending: totalDomains - verifiedDomains
        },
        emails: {
          total: totalEmails,
          sent: sentEmails,
          delivered: deliveredEmails,
          failed: failedEmails,
          queued: queuedEmails,
          deliveryRate
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

/**
 * GET /api/super-admin/email-server/config
 * Retorna a configuração atual do servidor
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const emailServer = await prisma.emailServer.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!emailServer) {
      return res.json({
        config: {
          hostname: 'smtp.digiurban.com.br',
          mxPort: 25,
          submissionPort: 587,
          maxConnections: 100,
          maxMessageSize: 50 * 1024 * 1024,
          tlsEnabled: true,
          certPath: '',
          keyPath: '',
          authRequired: true,
          isPremiumService: true,
          monthlyPrice: 99.00,
          maxEmailsPerMonth: 10000
        }
      });
    }

    res.json({
      config: {
        hostname: emailServer.hostname,
        mxPort: emailServer.mxPort,
        submissionPort: emailServer.submissionPort,
        maxConnections: 100, // TODO: Adicionar ao schema
        maxMessageSize: 50 * 1024 * 1024, // TODO: Adicionar ao schema
        tlsEnabled: emailServer.tlsEnabled,
        certPath: emailServer.certPath || '',
        keyPath: emailServer.keyPath || '',
        authRequired: true, // TODO: Adicionar ao schema
        isPremiumService: emailServer.isPremiumService,
        monthlyPrice: Number(emailServer.monthlyPrice),
        maxEmailsPerMonth: emailServer.maxEmailsPerMonth
      }
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

/**
 * PUT /api/super-admin/email-server/config
 * Atualiza a configuração do servidor
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const {
      hostname,
      mxPort,
      submissionPort,
      tlsEnabled,
      certPath,
      keyPath,
      isPremiumService,
      monthlyPrice,
      maxEmailsPerMonth
    } = req.body;

    let emailServer = await prisma.emailServer.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!emailServer) {
      // Criar novo servidor
      emailServer = await prisma.emailServer.create({
        data: {
          hostname,
          mxPort,
          submissionPort,
          tlsEnabled,
          certPath,
          keyPath,
          isPremiumService,
          monthlyPrice,
          maxEmailsPerMonth,
          isActive: true
        }
      });
    } else {
      // Atualizar existente
      emailServer = await prisma.emailServer.update({
        where: { id: emailServer.id },
        data: {
          hostname,
          mxPort,
          submissionPort,
          tlsEnabled,
          certPath,
          keyPath,
          isPremiumService,
          monthlyPrice,
          maxEmailsPerMonth
        }
      });
    }

    res.json({ success: true, config: emailServer });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

/**
 * POST /api/super-admin/email-server/start
 * Inicia o servidor SMTP
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    let emailServer = await prisma.emailServer.findFirst();

    // Se não existir, criar com valores padrão
    if (!emailServer) {
      emailServer = await prisma.emailServer.create({
        data: {
          hostname: 'smtp.digiurban.com.br',
          mxPort: 25,
          submissionPort: 587,
          tlsEnabled: true,
          isPremiumService: true,
          monthlyPrice: 99.00,
          maxEmailsPerMonth: 10000,
          isActive: true
        }
      });
    } else {
      await prisma.emailServer.update({
        where: { id: emailServer.id },
        data: { isActive: true }
      });
    }

    // SMTP Server agora roda em container separado
    // Apenas atualiza o status no DB
    // const status = await startEmailServer();
    res.json({
      success: true,
      message: 'Server configuration updated (restart ultrazend-smtp container to apply)',
      status: { isRunning: true, hostname: emailServer.hostname }
    });
  } catch (error) {
    console.error('Error starting server:', error);
    res.status(500).json({ error: 'Failed to start server' });
  }
});

/**
 * POST /api/super-admin/email-server/stop
 * Para o servidor SMTP
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const emailServer = await prisma.emailServer.findFirst();

    if (!emailServer) {
      return res.status(404).json({ error: 'Email server not configured' });
    }

    await prisma.emailServer.update({
      where: { id: emailServer.id },
      data: { isActive: false }
    });

    // SMTP Server agora roda em container separado
    // await stopEmailServer();

    res.json({
      success: true,
      message: 'Server configuration updated (restart ultrazend-smtp container to apply)'
    });
  } catch (error) {
    console.error('Error stopping server:', error);
    res.status(500).json({ error: 'Failed to stop server' });
  }
});

/**
 * POST /api/super-admin/email-server/restart
 * Reinicia o servidor SMTP
 */
router.post('/restart', async (req: Request, res: Response) => {
  try {
    let emailServer = await prisma.emailServer.findFirst();

    // Se não existir, criar com valores padrão
    if (!emailServer) {
      emailServer = await prisma.emailServer.create({
        data: {
          hostname: 'smtp.digiurban.com.br',
          mxPort: 25,
          submissionPort: 587,
          tlsEnabled: true,
          isPremiumService: true,
          monthlyPrice: 99.00,
          maxEmailsPerMonth: 10000,
          isActive: true
        }
      });
    } else {
      await prisma.emailServer.update({
        where: { id: emailServer.id },
        data: { isActive: true }
      });
    }

    // SMTP Server agora roda em container separado
    // await stopEmailServer();
    // const status = await startEmailServer();
    res.json({
      success: true,
      message: 'Server configuration updated (restart ultrazend-smtp container to apply)',
      status: { isRunning: true, hostname: emailServer.hostname }
    });
  } catch (error) {
    console.error('Error restarting server:', error);
    res.status(500).json({ error: 'Failed to restart server' });
  }
});

/**
 * GET /api/super-admin/email-server/logs
 * Retorna os logs do servidor
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { level, limit = 100, offset = 0 } = req.query;

    const emailServer = await prisma.emailServer.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!emailServer) {
      return res.json({ logs: [] });
    }

    const where: any = { emailServerId: emailServer.id };
    if (level) {
      where.level = level;
    }

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    res.json({
      logs: logs.map(log => ({
        id: log.id,
        level: log.level,
        message: log.message,
        timestamp: log.timestamp.toISOString(),
        data: log.data || {}
      }))
    });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

export default router;
