import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import {
  assertDepartmentScopedEntities,
  assertUserAssignmentScope,
  OrganizationalIntegrityError,
} from '../services/organizational-integrity.service';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

// ============================================
// CRUD DE EQUIPES E GRUPOS DE TRABALHO
// ============================================

/**
 * GET /api/teams
 * Listar todas as equipes
 */
router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const {
      departmentId,
      organizationalUnitId,
      coordenadorId,
      tipo,
      ativo,
      search,
    } = req.query;

    const where: any = {};

    if (departmentId) where.departmentId = departmentId as string;
    if (organizationalUnitId) where.organizationalUnitId = organizationalUnitId as string;
    if (coordenadorId) where.coordenadorId = coordenadorId as string;
    if (tipo) where.tipo = tipo as string;
    if (ativo !== undefined) where.ativo = ativo === 'true';
    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { sigla: { contains: search as string, mode: 'insensitive' } },
        { finalidade: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true, tipo: true },
        },
        coordenador: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            membros: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    res.json(teams);
  } catch (error) {
    console.error('Erro ao listar equipes:', error);
    res.status(500).json({ error: 'Erro ao listar equipes' });
  }
});

/**
 * GET /api/teams/:id
 * Buscar equipe específica
 */
router.get('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, code: true, description: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true, tipo: true, nivel: true },
        },
        coordenador: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            assignments: {
              where: { situacao: 'ATIVO', isPrimary: true },
              include: {
                position: {
                  select: { id: true, nome: true },
                },
              },
            },
          },
        },
        membros: {
          where: { ativo: true },
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
                    position: {
                      select: { id: true, nome: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { dataInicio: 'desc' },
        },
        _count: {
          select: {
            membros: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    res.json(team);
  } catch (error) {
    console.error('Erro ao buscar equipe:', error);
    res.status(500).json({ error: 'Erro ao buscar equipe' });
  }
});

/**
 * POST /api/teams
 * Criar nova equipe
 */
router.post('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const {
      nome,
      sigla,
      tipo,
      finalidade,
      departmentId,
      organizationalUnitId,
      coordenadorId,
      dataInicio,
      dataFim,
    } = req.body;

    // Validações
    if (!nome || !tipo || !departmentId) {
      return res.status(400).json({
        error: 'Nome, tipo e departamento são obrigatórios',
      });
    }

    await assertDepartmentScopedEntities({
      departmentId,
      organizationalUnitId,
    });

    // Verificar se coordenador existe (se fornecido)
    if (coordenadorId) {
      await assertUserAssignmentScope({
        userId: coordenadorId,
        departmentId,
        organizationalUnitId,
        label: 'Coordenador',
      });
    }

    const team = await prisma.team.create({
      data: {
        nome,
        sigla,
        tipo,
        finalidade,
        departmentId,
        organizationalUnitId,
        coordenadorId,
        dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
        dataFim: dataFim ? new Date(dataFim) : null,
        createdBy: (req.user as any)?.id,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
        coordenador: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(team);
  } catch (error: any) {
    console.error('Erro ao criar equipe:', error);

    if (error instanceof OrganizationalIntegrityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Já existe uma equipe com esta sigla neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao criar equipe' });
  }
});

/**
 * PUT /api/teams/:id
 * Atualizar equipe
 */
router.put('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nome,
      sigla,
      tipo,
      finalidade,
      organizationalUnitId,
      coordenadorId,
      dataFim,
      ativo,
    } = req.body;

    // Verificar se equipe existe
    const existingTeam = await prisma.team.findUnique({
      where: { id },
    });

    if (!existingTeam) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    await assertDepartmentScopedEntities({
      departmentId: existingTeam.departmentId,
      organizationalUnitId:
        organizationalUnitId !== undefined ? organizationalUnitId : existingTeam.organizationalUnitId,
    });

    if (coordenadorId !== undefined && coordenadorId !== null) {
      await assertUserAssignmentScope({
        userId: coordenadorId,
        departmentId: existingTeam.departmentId,
        organizationalUnitId:
          organizationalUnitId !== undefined ? organizationalUnitId : existingTeam.organizationalUnitId,
        label: 'Coordenador',
      });
    }

    // Update dinâmico
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (sigla !== undefined) updateData.sigla = sigla;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (finalidade !== undefined) updateData.finalidade = finalidade;
    if (organizationalUnitId !== undefined) updateData.organizationalUnitId = organizationalUnitId;
    if (coordenadorId !== undefined) updateData.coordenadorId = coordenadorId;
    if (dataFim !== undefined) updateData.dataFim = dataFim ? new Date(dataFim) : null;
    if (ativo !== undefined) updateData.ativo = ativo;

    updateData.updatedAt = new Date();

    const team = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: { id: true, name: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
        coordenador: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(team);
  } catch (error: any) {
    console.error('Erro ao atualizar equipe:', error);

    if (error instanceof OrganizationalIntegrityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Já existe uma equipe com esta sigla neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao atualizar equipe' });
  }
});

/**
 * DELETE /api/teams/:id
 * Desativar equipe
 */
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dataFim, motivo } = req.body;

    // Verificar se equipe existe
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    // Desativar equipe e seus membros
    await prisma.$transaction([
      prisma.team.update({
        where: { id },
        data: {
          ativo: false,
          dataFim: dataFim ? new Date(dataFim) : new Date(),
        },
      }),
      prisma.teamMember.updateMany({
        where: {
          teamId: id,
          ativo: true,
        },
        data: {
          ativo: false,
          dataFim: dataFim ? new Date(dataFim) : new Date(),
        },
      }),
    ]);

    res.json({
      message: 'Equipe e membros desativados com sucesso',
    });
  } catch (error) {
    console.error('Erro ao desativar equipe:', error);
    res.status(500).json({ error: 'Erro ao desativar equipe' });
  }
});

// ============================================
// MEMBROS DA EQUIPE
// ============================================

/**
 * GET /api/teams/:id/members
 * Listar membros de uma equipe
 */
router.get('/:id/members', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeInactive } = req.query;

    const where: any = { teamId: id };
    if (!includeInactive) {
      where.ativo = true;
    }

    const members = await prisma.teamMember.findMany({
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
                position: {
                  select: { id: true, nome: true, tipo: true },
                },
                organizationalUnit: {
                  select: { id: true, nome: true, sigla: true },
                },
              },
            },
          },
        },
      },
      orderBy: { dataInicio: 'desc' },
    });

    res.json(members);
  } catch (error) {
    console.error('Erro ao listar membros:', error);
    res.status(500).json({ error: 'Erro ao listar membros' });
  }
});

/**
 * POST /api/teams/:id/members
 * Adicionar membro à equipe
 */
router.post('/:id/members', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      userId,
      papel,
      atribuicoes,
      dataInicio,
      dataFim,
    } = req.body;

    // Validações
    if (!userId) {
      return res.status(400).json({
        error: 'Usuário é obrigatório',
      });
    }

    // Verificar se equipe existe
    const team = await prisma.team.findUnique({
      where: { id },
    });
    if (!team) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }

    await assertUserAssignmentScope({
      userId,
      departmentId: team.departmentId,
      organizationalUnitId: team.organizationalUnitId,
      label: 'Usuário',
    });

    // Verificar se já é membro ativo
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId,
        ativo: true,
      },
    });

    if (existingMember) {
      return res.status(409).json({
        error: 'Este usuário já é membro ativo desta equipe',
      });
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId: id,
        userId,
        papel,
        atribuicoes,
        dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
        dataFim: dataFim ? new Date(dataFim) : null,
        createdBy: (req.user as any)?.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(member);
  } catch (error: any) {
    console.error('Erro ao adicionar membro:', error);

    if (error instanceof OrganizationalIntegrityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Este membro já está registrado nesta equipe com esta data',
      });
    }

    res.status(500).json({ error: 'Erro ao adicionar membro' });
  }
});

/**
 * PUT /api/teams/:teamId/members/:memberId
 * Atualizar membro da equipe
 */
router.put('/:teamId/members/:memberId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const {
      papel,
      atribuicoes,
      dataFim,
      ativo,
    } = req.body;

    // Verificar se membro existe
    const existingMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    // Update dinâmico
    const updateData: any = {};
    if (papel !== undefined) updateData.papel = papel;
    if (atribuicoes !== undefined) updateData.atribuicoes = atribuicoes;
    if (dataFim !== undefined) updateData.dataFim = dataFim ? new Date(dataFim) : null;
    if (ativo !== undefined) updateData.ativo = ativo;

    updateData.updatedAt = new Date();

    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(member);
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    res.status(500).json({ error: 'Erro ao atualizar membro' });
  }
});

/**
 * DELETE /api/teams/:teamId/members/:memberId
 * Remover membro da equipe
 */
router.delete('/:teamId/members/:memberId', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const { dataFim, motivo } = req.body;

    // Verificar se membro existe
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return res.status(404).json({ error: 'Membro não encontrado' });
    }

    // Desativar membro
    const deactivated = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ativo: false,
        dataFim: dataFim ? new Date(dataFim) : new Date(),
        atribuicoes: motivo ? `${member.atribuicoes || ''}\nMotivo da saída: ${motivo}` : member.atribuicoes,
      },
    });

    res.json({
      message: 'Membro removido da equipe com sucesso',
      member: deactivated,
    });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ error: 'Erro ao remover membro' });
  }
});

export default router;
