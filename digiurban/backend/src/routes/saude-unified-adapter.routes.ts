/**
 * Rotas Adaptadoras: Apps de Saúde → Sistema Unificado V2.0
 *
 * Este arquivo contém rotas adaptadoras que facilitam a integração dos apps de saúde
 * com o Sistema Unificado de Vinculação V2.0, mantendo compatibilidade com o frontend existente.
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
router.use(authenticateAdmin);

// ============================================================
// ROTAS DE SERVIDORES DE SAÚDE (HealthProfessionalData)
// ============================================================

/**
 * GET /api/saude/servidores
 * Listar todos os servidores com dados de saúde (HealthProfessionalData)
 * Query params: categoria, status, search
 */
router.get('/servidores', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { categoria, status, search } = req.query;

    const where: any = {};

    if (categoria) {
      where.categoria = categoria as string;
    }

    if (status) {
      where.status = status as string;
    }

    const servidores = await prisma.user.findMany({
      where: {
        healthData: {
          isNot: null,
          ...(Object.keys(where).length > 0 && { is: where }),
        },
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        healthData: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignments: {
          where: { situacao: 'ATIVO' },
          include: {
            organizationalUnit: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
            position: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        equipesParticipa: {
          where: { ativo: true },
          include: {
            team: {
              select: {
                id: true,
                nome: true,
                sigla: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(servidores);
  } catch (error: any) {
    console.error('Erro ao listar servidores de saúde:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/saude/servidores/:userId
 * Buscar dados completos de um servidor de saúde
 */
router.get('/servidores/:userId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const servidor = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        healthData: true,
        department: true,
        assignments: {
          include: {
            organizationalUnit: {
              include: {
                unidadeSaude: true,
              },
            },
            position: true,
          },
          orderBy: { dataInicio: 'desc' },
        },
        equipesParticipa: {
          include: {
            team: {
              include: {
                equipeSaude: true,
              },
            },
          },
          orderBy: { dataInicio: 'desc' },
        },
      },
    });

    if (!servidor) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }

    if (!servidor.healthData) {
      return res.status(400).json({ error: 'Servidor não possui dados de saúde' });
    }

    res.json(servidor);
  } catch (error: any) {
    console.error('Erro ao buscar servidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE VINCULAÇÃO COM UNIDADES
// ============================================================

/**
 * POST /api/saude/servidores/:userId/vincular-unidade
 * Criar vínculo de servidor com unidade de saúde usando Sistema Unificado V2.0
 */
router.post(
  '/servidores/:userId/vincular-unidade',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { unidadeId, positionId, dataInicio, dataFim, cargaHoraria, percentualDedicacao, observacoes } =
        req.body;

      // Validações
      if (!unidadeId || !dataInicio) {
        return res.status(400).json({ error: 'unidadeId e dataInicio são obrigatórios' });
      }

      // 1. Verificar se servidor tem dados de saúde
      const healthData = await prisma.healthProfessionalData.findUnique({
        where: { userId },
        include: {
          user: {
            include: { department: true },
          },
        },
      });

      if (!healthData) {
        return res.status(400).json({
          error: 'Servidor não possui dados profissionais de saúde',
        });
      }

      // 2. Buscar unidade e seu OrganizationalUnit
      const unidade = await prisma.unidadeSaude.findUnique({
        where: { id: unidadeId },
        include: { organizationalUnit: true },
      });

      if (!unidade) {
        return res.status(404).json({ error: 'Unidade de saúde não encontrada' });
      }

      if (!unidade.organizationalUnit) {
        return res.status(400).json({
          error: 'Unidade não está mapeada no Sistema Unificado. Execute a migração primeiro.',
        });
      }

      const assignmentDepartmentId =
        unidade.organizationalUnit.departmentId || healthData.user.departmentId;

      if (!assignmentDepartmentId) {
        return res.status(400).json({
          error: 'Nao foi possivel determinar o departamento do vinculo da unidade.',
        });
      }

      let resolvedPositionId: string | undefined;
      if (positionId) {
        const position = await prisma.position.findFirst({
          where: {
            id: positionId,
            departmentId: assignmentDepartmentId,
            isActive: true,
          },
          select: { id: true },
        });

        if (!position) {
          return res.status(400).json({
            error: 'Cargo informado nao pertence ao departamento da unidade ou esta inativo.',
          });
        }

        resolvedPositionId = position.id;
      }

      // 4. Criar EmployeeAssignment (Sistema Unificado V2.0)
      const assignment = await prisma.employeeAssignment.create({
        data: {
          userId,
          departmentId: assignmentDepartmentId,
          organizationalUnitId: unidade.organizationalUnitId!,
          positionId: resolvedPositionId,
          tipo: 'LOTACAO',
          situacao: 'ATIVO',
          isPrimary: false,
          dataInicio: new Date(dataInicio),
          dataFim: dataFim ? new Date(dataFim) : null,
          cargaHoraria,
          percentualDedicacao,
          observacoes: observacoes || `Vínculo com ${unidade.nome}`,
        },
      });

      // 5. Criar auditoria
      await prisma.assignmentAudit.create({
        data: {
          assignmentId: assignment.id,
          tipo: 'CRIACAO',
          userId,
          userName: healthData.user.name,
          motivo: 'Vinculação com unidade de saúde',
          detalhes: {
            unidade: unidade.nome,
            cnes: unidade.cnes || 'N/A',
          },
        },
      });

      res.json({
        success: true,
        assignment,
        unidade: {
          id: unidade.id,
          nome: unidade.nome,
          cnes: unidade.cnes,
        },
        message: 'Vínculo criado com sucesso no Sistema Unificado V2.0',
      });
    } catch (error: any) {
      console.error('Erro ao vincular servidor à unidade:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PUT /api/saude/servidores/:userId/vinculos/:assignmentId
 * Atualizar vínculo existente
 */
router.put(
  '/servidores/:userId/vinculos/:assignmentId',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId, assignmentId } = req.params;
      const { dataFim, cargaHoraria, percentualDedicacao, observacoes } = req.body;

      // Buscar assignment
      const assignment = await prisma.employeeAssignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Vínculo não encontrado' });
      }

      if (assignment.userId !== userId) {
        return res.status(403).json({ error: 'Vínculo não pertence a este servidor' });
      }

      // Atualizar
      const updated = await prisma.employeeAssignment.update({
        where: { id: assignmentId },
        data: {
          dataFim: dataFim ? new Date(dataFim) : undefined,
          cargaHoraria,
          percentualDedicacao,
          observacoes,
        },
      });

      // Criar auditoria
      await prisma.assignmentAudit.create({
        data: {
          assignmentId,
          tipo: 'ALTERACAO_CARGA_HORARIA',
          userId,
          userName: (req as any).user?.name || 'Sistema',
          motivo: 'Atualização de vínculo',
          detalhes: {
            observacoes: observacoes || 'Dados do vínculo atualizados',
          },
        },
      });

      res.json({ success: true, assignment: updated });
    } catch (error: any) {
      console.error('Erro ao atualizar vínculo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * DELETE /api/saude/servidores/:userId/vinculos/:assignmentId
 * Encerrar vínculo
 */
router.delete(
  '/servidores/:userId/vinculos/:assignmentId',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId, assignmentId } = req.params;
      const { motivo } = req.body;

      // Buscar assignment
      const assignment = await prisma.employeeAssignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        return res.status(404).json({ error: 'Vínculo não encontrado' });
      }

      if (assignment.userId !== userId) {
        return res.status(403).json({ error: 'Vínculo não pertence a este servidor' });
      }

      // Encerrar
      const updated = await prisma.employeeAssignment.update({
        where: { id: assignmentId },
        data: {
          situacao: 'SUSPENSO',
          dataFim: new Date(),
        },
      });

      // Criar auditoria
      await prisma.assignmentAudit.create({
        data: {
          assignmentId,
          tipo: 'DESATIVACAO',
          userId,
          userName: (req as any).user?.name || 'Sistema',
          motivo: motivo || 'Encerramento de vínculo',
        },
      });

      res.json({ success: true, assignment: updated });
    } catch (error: any) {
      console.error('Erro ao encerrar vínculo:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// ROTAS DE VINCULAÇÃO COM EQUIPES
// ============================================================

/**
 * POST /api/saude/servidores/:userId/vincular-equipe
 * Vincular servidor a equipe ESF usando Sistema Unificado V2.0
 */
router.post(
  '/servidores/:userId/vincular-equipe',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { equipeId, funcao, cbo, dataInicio, dataFim, observacoes } = req.body;

      // Validações
      if (!equipeId || !dataInicio) {
        return res.status(400).json({ error: 'equipeId e dataInicio são obrigatórios' });
      }

      // Verificar dados de saúde
      const healthData = await prisma.healthProfessionalData.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!healthData) {
        return res.status(400).json({
          error: 'Servidor não possui dados profissionais de saúde',
        });
      }

      // Buscar equipe
      const equipe = await prisma.equipeSaude.findUnique({
        where: { id: equipeId },
        include: { team: true },
      });

      if (!equipe) {
        return res.status(404).json({ error: 'Equipe não encontrada' });
      }

      if (!equipe.team) {
        return res.status(400).json({
          error: 'Equipe não está mapeada no Sistema Unificado. Execute a migração primeiro.',
        });
      }

      // Criar TeamMember (Sistema Unificado V2.0)
      const member = await prisma.teamMember.create({
        data: {
          teamId: equipe.teamId!,
          userId,
          papel: funcao || 'MEMBRO',
          atribuicoes: observacoes || `CBO: ${cbo || 'N/A'}`,
          dataInicio: new Date(dataInicio),
          dataFim: dataFim ? new Date(dataFim) : null,
          ativo: true,
        },
      });

      res.json({
        success: true,
        member,
        equipe: {
          id: equipe.id,
          nome: equipe.nome,
          ine: equipe.ine,
          tipo: equipe.tipo,
        },
        message: 'Vínculo com equipe criado com sucesso no Sistema Unificado V2.0',
      });
    } catch (error: any) {
      console.error('Erro ao vincular servidor à equipe:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * DELETE /api/saude/servidores/:userId/equipes/:memberId
 * Remover servidor de equipe
 */
router.delete(
  '/servidores/:userId/equipes/:memberId',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId, memberId } = req.params;

      // Buscar membro
      const member = await prisma.teamMember.findUnique({
        where: { id: memberId },
      });

      if (!member) {
        return res.status(404).json({ error: 'Vínculo com equipe não encontrado' });
      }

      if (member.userId !== userId) {
        return res.status(403).json({ error: 'Vínculo não pertence a este servidor' });
      }

      // Desativar
      const updated = await prisma.teamMember.update({
        where: { id: memberId },
        data: {
          ativo: false,
          dataFim: new Date(),
        },
      });

      res.json({ success: true, member: updated });
    } catch (error: any) {
      console.error('Erro ao remover servidor da equipe:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// ROTAS DE ESTATÍSTICAS
// ============================================================

/**
 * GET /api/saude/stats
 * Estatísticas gerais dos servidores de saúde
 */
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const [
      totalServidores,
      porCategoria,
      porStatus,
      totalVinculos,
      totalEquipes,
    ] = await Promise.all([
      // Total de servidores com dados de saúde
      prisma.healthProfessionalData.count(),

      // Por categoria
      prisma.healthProfessionalData.groupBy({
        by: ['categoria'],
        _count: true,
        orderBy: { _count: { categoria: 'desc' } },
      }),

      // Por status
      prisma.healthProfessionalData.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Total de vínculos ativos
      prisma.employeeAssignment.count({
        where: {
          situacao: 'ATIVO',
          user: {
            healthData: { isNot: null },
          },
        },
      }),

      // Total de membros ativos em equipes
      prisma.teamMember.count({
        where: {
          ativo: true,
          user: {
            healthData: { isNot: null },
          },
        },
      }),
    ]);

    res.json({
      totalServidores,
      porCategoria: porCategoria.map((item) => ({
        categoria: item.categoria,
        quantidade: item._count,
      })),
      porStatus: porStatus.map((item) => ({
        status: item.status,
        quantidade: item._count,
      })),
      totalVinculos,
      totalEquipes,
    });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
