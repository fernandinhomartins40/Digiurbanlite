import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// DADOS PROFISSIONAIS ESPECÍFICOS - SAÚDE
// ============================================

/**
 * GET /api/professional-data/health/stats
 * Estatísticas de profissionais de saúde do sistema unificado
 * IMPORTANTE: Esta rota deve vir ANTES da rota /health/:userId para evitar conflitos
 */
router.get('/health/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [total, ativos, porCategoria] = await Promise.all([
      prisma.healthProfessionalData.count(),
      prisma.healthProfessionalData.count({ where: { status: 'ATIVO' } }),
      prisma.healthProfessionalData.groupBy({
        by: ['categoria'],
        _count: true,
        where: { status: 'ATIVO' },
      }),
    ]);

    res.json({
      total,
      ativos,
      porCategoria: porCategoria.map((item) => ({
        categoria: item.categoria,
        quantidade: item._count,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao buscar stats de profissionais de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/professional-data/health
 * Listar servidores com dados de saúde
 */
router.get('/health', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { categoria, ativo, search } = req.query;

    const where: any = {};
    if (categoria) where.categoria = categoria as string;
    if (ativo !== undefined) where.status = ativo === 'true' ? 'ATIVO' : 'INATIVO';

    const healthData = await prisma.healthProfessionalData.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            assignments: {
              where: { situacao: 'ATIVO', isPrimary: true },
              include: {
                department: {
                  select: { id: true, name: true },
                },
                organizationalUnit: {
                  select: { id: true, nome: true, sigla: true },
                },
                position: {
                  select: { id: true, nome: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtro de busca
    let filtered = healthData;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = healthData.filter(
        (item) =>
          item.user.name.toLowerCase().includes(searchLower) ||
          item.user.email.toLowerCase().includes(searchLower) ||
          item.registroProfissional?.toLowerCase().includes(searchLower) ||
          item.cns?.toLowerCase().includes(searchLower)
      );
    }

    res.json(filtered);
  } catch (error) {
    console.error('Erro ao listar dados de saúde:', error);
    res.status(500).json({ error: 'Erro ao listar dados de saúde' });
  }
});

/**
 * GET /api/professional-data/health/:userId
 * Buscar dados de saúde de um servidor
 */
router.get('/health/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const healthData = await prisma.healthProfessionalData.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            assignments: {
              where: { situacao: 'ATIVO' },
              include: {
                department: {
                  select: { id: true, name: true },
                },
                organizationalUnit: {
                  select: { id: true, nome: true, sigla: true },
                },
                position: {
                  select: { id: true, nome: true, tipo: true },
                },
              },
            },
          },
        },
      },
    });

    if (!healthData) {
      return res.status(404).json({ error: 'Dados de saúde não encontrados' });
    }

    res.json(healthData);
  } catch (error) {
    console.error('Erro ao buscar dados de saúde:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de saúde' });
  }
});

/**
 * POST /api/professional-data/health
 * Criar dados de saúde para um servidor
 */
router.post('/health', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      categoria,
      registroProfissional,
      tipoRegistro,
      ufRegistro,
      cns,
      cbo,
      especialidades,
      aceitaAgendamento,
      tempoMedioConsulta,
      observacoes,
    } = req.body;

    // Validações
    if (!userId || !categoria) {
      return res.status(400).json({
        error: 'Usuário e categoria são obrigatórios',
      });
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se já possui dados de saúde
    const existing = await prisma.healthProfessionalData.findUnique({
      where: { userId },
    });
    if (existing) {
      return res.status(409).json({
        error: 'Este usuário já possui dados de saúde cadastrados',
      });
    }

    const healthData = await prisma.healthProfessionalData.create({
      data: {
        userId,
        categoria,
        registroProfissional,
        tipoRegistro,
        ufRegistro,
        cns,
        cbo,
        especialidades,
        aceitaAgendamento,
        tempoMedioConsulta,
        observacoes,
        createdBy: (req.user as any)?.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(healthData);
  } catch (error: any) {
    console.error('Erro ao criar dados de saúde:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return res.status(409).json({
        error: `Este ${field} já está cadastrado`,
      });
    }

    res.status(500).json({ error: 'Erro ao criar dados de saúde' });
  }
});

/**
 * PUT /api/professional-data/health/:userId
 * Atualizar dados de saúde
 */
router.put('/health/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const {
      categoria,
      registroProfissional,
      tipoRegistro,
      ufRegistro,
      cns,
      cbo,
      especialidades,
      aceitaAgendamento,
      tempoMedioConsulta,
      ativo,
      motivoInativacao,
      observacoes,
    } = req.body;

    // Verificar se dados existem
    const existing = await prisma.healthProfessionalData.findUnique({
      where: { userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Dados de saúde não encontrados' });
    }

    // Update dinâmico
    const updateData: any = {};
    if (categoria !== undefined) updateData.categoria = categoria;
    if (registroProfissional !== undefined) updateData.registroProfissional = registroProfissional;
    if (tipoRegistro !== undefined) updateData.tipoRegistro = tipoRegistro;
    if (ufRegistro !== undefined) updateData.ufRegistro = ufRegistro;
    if (cns !== undefined) updateData.cns = cns;
    if (cbo !== undefined) updateData.cbo = cbo;
    if (especialidades !== undefined) updateData.especialidades = especialidades;
    if (aceitaAgendamento !== undefined) updateData.aceitaAgendamento = aceitaAgendamento;
    if (tempoMedioConsulta !== undefined) updateData.tempoMedioConsulta = tempoMedioConsulta;
    if (ativo !== undefined) {
      updateData.status = ativo ? 'ATIVO' : 'INATIVO';
      if (!ativo) {
        updateData.dataInativacao = new Date();
        updateData.motivoInativacao = motivoInativacao;
      }
    }
    if (observacoes !== undefined) updateData.observacoes = observacoes;

    updateData.updatedAt = new Date();

    const healthData = await prisma.healthProfessionalData.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(healthData);
  } catch (error: any) {
    console.error('Erro ao atualizar dados de saúde:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Este registro profissional ou CNS já está cadastrado',
      });
    }

    res.status(500).json({ error: 'Erro ao atualizar dados de saúde' });
  }
});

// ============================================
// DADOS PROFISSIONAIS ESPECÍFICOS - EDUCAÇÃO
// ============================================

/**
 * GET /api/professional-data/education
 * Listar servidores com dados de educação
 */
router.get('/education', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { categoria, ativo } = req.query;

    const where: any = {};
    if (categoria) where.categoria = categoria as string;
    if (ativo !== undefined) where.ativo = ativo === 'true';

    const educationData = await prisma.educationProfessionalData.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            assignments: {
              where: { situacao: 'ATIVO', isPrimary: true },
              include: {
                department: {
                  select: { id: true, name: true },
                },
                organizationalUnit: {
                  select: { id: true, nome: true, sigla: true },
                },
                position: {
                  select: { id: true, nome: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(educationData);
  } catch (error) {
    console.error('Erro ao listar dados de educação:', error);
    res.status(500).json({ error: 'Erro ao listar dados de educação' });
  }
});

/**
 * POST /api/professional-data/education
 * Criar dados de educação para um servidor
 */
router.post('/education', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      categoria,
      registroProfissional,
      formacao,
      posGraduacao,
      disciplinas,
      nivelEnsino,
      observacoes,
    } = req.body;

    // Validações
    if (!userId || !categoria) {
      return res.status(400).json({
        error: 'Usuário e categoria são obrigatórios',
      });
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se já possui dados de educação
    const existing = await prisma.educationProfessionalData.findUnique({
      where: { userId },
    });
    if (existing) {
      return res.status(409).json({
        error: 'Este usuário já possui dados de educação cadastrados',
      });
    }

    const educationData = await prisma.educationProfessionalData.create({
      data: {
        userId,
        categoria,
        registroProfissional,
        formacao,
        posGraduacao,
        disciplinas,
        nivelEnsino,
        observacoes,
        createdBy: (req.user as any)?.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(educationData);
  } catch (error) {
    console.error('Erro ao criar dados de educação:', error);
    res.status(500).json({ error: 'Erro ao criar dados de educação' });
  }
});

// ============================================
// DADOS PROFISSIONAIS ESPECÍFICOS - ENGENHARIA
// ============================================

/**
 * GET /api/professional-data/engineering
 * Listar servidores com dados de engenharia
 */
router.get('/engineering', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { categoria, ativo } = req.query;

    const where: any = {};
    if (categoria) where.categoria = categoria as string;
    if (ativo !== undefined) where.ativo = ativo === 'true';

    const engineeringData = await prisma.engineeringProfessionalData.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            assignments: {
              where: { situacao: 'ATIVO', isPrimary: true },
              include: {
                department: {
                  select: { id: true, name: true },
                },
                organizationalUnit: {
                  select: { id: true, nome: true, sigla: true },
                },
                position: {
                  select: { id: true, nome: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(engineeringData);
  } catch (error) {
    console.error('Erro ao listar dados de engenharia:', error);
    res.status(500).json({ error: 'Erro ao listar dados de engenharia' });
  }
});

/**
 * POST /api/professional-data/engineering
 * Criar dados de engenharia para um servidor
 */
router.post('/engineering', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      categoria,
      registroProfissional,
      tipoRegistro,
      ufRegistro,
      especialidades,
      observacoes,
    } = req.body;

    // Validações
    if (!userId || !categoria) {
      return res.status(400).json({
        error: 'Usuário e categoria são obrigatórios',
      });
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se já possui dados de engenharia
    const existing = await prisma.engineeringProfessionalData.findUnique({
      where: { userId },
    });
    if (existing) {
      return res.status(409).json({
        error: 'Este usuário já possui dados de engenharia cadastrados',
      });
    }

    const engineeringData = await prisma.engineeringProfessionalData.create({
      data: {
        userId,
        categoria,
        registroProfissional,
        tipoRegistro,
        ufRegistro,
        especialidades,
        observacoes,
        createdBy: (req.user as any)?.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(engineeringData);
  } catch (error: any) {
    console.error('Erro ao criar dados de engenharia:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Este registro profissional já está cadastrado',
      });
    }

    res.status(500).json({ error: 'Erro ao criar dados de engenharia' });
  }
});

// ============================================
// DADOS PROFISSIONAIS ESPECÍFICOS - ASSISTÊNCIA SOCIAL
// ============================================

/**
 * GET /api/professional-data/social-assistance
 * Listar servidores com dados de assistência social
 */
router.get('/social-assistance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { categoria, ativo } = req.query;

    const where: any = {};
    if (categoria) where.categoria = categoria as string;
    if (ativo !== undefined) where.ativo = ativo === 'true';

    const socialData = await prisma.socialAssistanceProfessionalData.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            assignments: {
              where: { situacao: 'ATIVO', isPrimary: true },
              include: {
                department: {
                  select: { id: true, name: true },
                },
                organizationalUnit: {
                  select: { id: true, nome: true, sigla: true },
                },
                position: {
                  select: { id: true, nome: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(socialData);
  } catch (error) {
    console.error('Erro ao listar dados de assistência social:', error);
    res.status(500).json({ error: 'Erro ao listar dados de assistência social' });
  }
});

/**
 * POST /api/professional-data/social-assistance
 * Criar dados de assistência social para um servidor
 */
router.post('/social-assistance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      categoria,
      registroProfissional,
      tipoRegistro,
      ufRegistro,
      areasAtuacao,
      observacoes,
    } = req.body;

    // Validações
    if (!userId || !categoria) {
      return res.status(400).json({
        error: 'Usuário e categoria são obrigatórios',
      });
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se já possui dados de assistência social
    const existing = await prisma.socialAssistanceProfessionalData.findUnique({
      where: { userId },
    });
    if (existing) {
      return res.status(409).json({
        error: 'Este usuário já possui dados de assistência social cadastrados',
      });
    }

    const socialData = await prisma.socialAssistanceProfessionalData.create({
      data: {
        userId,
        categoria,
        registroProfissional,
        tipoRegistro,
        ufRegistro,
        areasAtuacao,
        observacoes,
        createdBy: (req.user as any)?.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(socialData);
  } catch (error: any) {
    console.error('Erro ao criar dados de assistência social:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Este registro profissional já está cadastrado',
      });
    }

    res.status(500).json({ error: 'Erro ao criar dados de assistência social' });
  }
});

export default router;
