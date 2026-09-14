import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import {
  assertDepartmentScopedEntities,
  assertUserAssignmentScope,
  assertUsersShareActiveDepartmentScope,
  OrganizationalIntegrityError,
} from '../services/organizational-integrity.service';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

// ============================================
// CRUD DE HIERARQUIA ORGANIZACIONAL
// ============================================

/**
 * GET /api/employee-hierarchies
 * Listar todas as relações hierárquicas
 */
router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const {
      subordinadoId,
      supervisorId,
      organizationalUnitId,
      tipo,
      ativo,
    } = req.query;

    const where: any = {};

    if (subordinadoId) where.subordinadoId = subordinadoId as string;
    if (supervisorId) where.supervisorId = supervisorId as string;
    if (organizationalUnitId) where.organizationalUnitId = organizationalUnitId as string;
    if (tipo) where.tipo = tipo as string;
    if (ativo !== undefined) where.ativo = ativo === 'true';

    const hierarchies = await prisma.employeeHierarchy.findMany({
      where,
      include: {
        subordinado: {
          select: { id: true, name: true, email: true, role: true },
        },
        supervisor: {
          select: { id: true, name: true, email: true, role: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true, tipo: true },
        },
      },
      orderBy: { dataInicio: 'desc' },
    });

    res.json(hierarchies);
  } catch (error) {
    console.error('Erro ao listar hierarquias:', error);
    res.status(500).json({ error: 'Erro ao listar hierarquias' });
  }
});

/**
 * GET /api/employee-hierarchies/:id
 * Buscar hierarquia específica
 */
router.get('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hierarchy = await prisma.employeeHierarchy.findUnique({
      where: { id },
      include: {
        subordinado: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            assignments: {
              where: { situacao: 'ATIVO' },
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
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            assignments: {
              where: { situacao: 'ATIVO' },
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
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true, tipo: true, nivel: true },
        },
      },
    });

    if (!hierarchy) {
      return res.status(404).json({ error: 'Hierarquia não encontrada' });
    }

    res.json(hierarchy);
  } catch (error) {
    console.error('Erro ao buscar hierarquia:', error);
    res.status(500).json({ error: 'Erro ao buscar hierarquia' });
  }
});

/**
 * GET /api/employee-hierarchies/employee/:userId/subordinates
 * Buscar subordinados diretos de um servidor
 */
router.get('/employee/:userId/subordinates', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { tipo, includeInactive } = req.query;

    const where: any = {
      supervisorId: userId,
    };

    if (tipo) where.tipo = tipo as string;
    if (!includeInactive) where.ativo = true;

    const subordinates = await prisma.employeeHierarchy.findMany({
      where,
      include: {
        subordinado: {
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
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
      },
      orderBy: { dataInicio: 'desc' },
    });

    res.json(subordinates);
  } catch (error) {
    console.error('Erro ao buscar subordinados:', error);
    res.status(500).json({ error: 'Erro ao buscar subordinados' });
  }
});

/**
 * GET /api/employee-hierarchies/employee/:userId/supervisors
 * Buscar supervisores de um servidor
 */
router.get('/employee/:userId/supervisors', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { tipo, includeInactive } = req.query;

    const where: any = {
      subordinadoId: userId,
    };

    if (tipo) where.tipo = tipo as string;
    if (!includeInactive) where.ativo = true;

    const supervisors = await prisma.employeeHierarchy.findMany({
      where,
      include: {
        supervisor: {
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
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
      },
      orderBy: { dataInicio: 'desc' },
    });

    res.json(supervisors);
  } catch (error) {
    console.error('Erro ao buscar supervisores:', error);
    res.status(500).json({ error: 'Erro ao buscar supervisores' });
  }
});

/**
 * GET /api/employee-hierarchies/employee/:userId/org-chart
 * Buscar organograma completo de um servidor (hierarquia recursiva)
 */
router.get('/employee/:userId/org-chart', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Buscar servidor principal
    const employee = await prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!employee) {
      return res.status(404).json({ error: 'Servidor não encontrado' });
    }

    // Função recursiva para buscar subordinados
    const buildOrgChart = async (supervisorId: string, depth: number = 0): Promise<any> => {
      if (depth > 5) return []; // Limite de profundidade

      const subordinates = await prisma.employeeHierarchy.findMany({
        where: {
          supervisorId,
          ativo: true,
        },
        include: {
          subordinado: {
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
          organizationalUnit: {
            select: { id: true, nome: true, sigla: true },
          },
        },
      });

      const subordinatesWithChildren = await Promise.all(
        subordinates.map(async (sub) => ({
          ...sub,
          subordinado: {
            ...sub.subordinado,
            subordinates: await buildOrgChart(sub.subordinadoId, depth + 1),
          },
        }))
      );

      return subordinatesWithChildren;
    };

    const orgChart = {
      employee,
      subordinates: await buildOrgChart(userId),
    };

    res.json(orgChart);
  } catch (error) {
    console.error('Erro ao buscar organograma:', error);
    res.status(500).json({ error: 'Erro ao buscar organograma' });
  }
});

/**
 * POST /api/employee-hierarchies
 * Criar nova relação hierárquica
 */
router.post('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const {
      subordinadoId,
      supervisorId,
      tipo,
      organizationalUnitId,
      dataInicio,
      dataFim,
      observacoes,
    } = req.body;

    // Validações
    if (!subordinadoId || !supervisorId || !tipo) {
      return res.status(400).json({
        error: 'Subordinado, supervisor e tipo são obrigatórios',
      });
    }

    // Não pode ser supervisor de si mesmo
    if (subordinadoId === supervisorId) {
      return res.status(400).json({
        error: 'Um servidor não pode ser supervisor de si mesmo',
      });
    }

    let resolvedDepartmentId: string | null = null;

    if (organizationalUnitId) {
      const organizationalUnit = await prisma.organizationalUnit.findUnique({
        where: { id: organizationalUnitId },
        select: { departmentId: true },
      });

      if (!organizationalUnit) {
        return res.status(404).json({ error: 'Unidade organizacional não encontrada' });
      }

      await assertDepartmentScopedEntities({
        departmentId: organizationalUnit.departmentId,
        organizationalUnitId,
      });
      resolvedDepartmentId = organizationalUnit?.departmentId || null;
    } else {
      const sharedScope = await assertUsersShareActiveDepartmentScope({
        subordinateId: subordinadoId,
        supervisorId,
      });
      resolvedDepartmentId = sharedScope.sharedDepartmentId;
    }

    if (resolvedDepartmentId) {
      await assertUserAssignmentScope({
        userId: subordinadoId,
        departmentId: resolvedDepartmentId,
        organizationalUnitId,
        label: 'Subordinado',
      });
      await assertUserAssignmentScope({
        userId: supervisorId,
        departmentId: resolvedDepartmentId,
        organizationalUnitId,
        label: 'Supervisor',
      });
    }

    // Verificar se já existe relação ativa do mesmo tipo
    const existingHierarchy = await prisma.employeeHierarchy.findFirst({
      where: {
        subordinadoId,
        supervisorId,
        tipo,
        ativo: true,
      },
    });

    if (existingHierarchy) {
      return res.status(409).json({
        error: 'Já existe uma relação hierárquica ativa entre estes servidores',
      });
    }

    const hierarchy = await prisma.employeeHierarchy.create({
      data: {
        subordinadoId,
        supervisorId,
        tipo,
        organizationalUnitId,
        dataInicio: dataInicio ? new Date(dataInicio) : new Date(),
        dataFim: dataFim ? new Date(dataFim) : null,
        observacoes,
        createdBy: (req.user as any)?.id,
      },
      include: {
        subordinado: {
          select: { id: true, name: true, email: true },
        },
        supervisor: {
          select: { id: true, name: true, email: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    res.status(201).json(hierarchy);
  } catch (error: any) {
    console.error('Erro ao criar hierarquia:', error);

    if (error instanceof OrganizationalIntegrityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Já existe esta relação hierárquica',
      });
    }

    res.status(500).json({ error: 'Erro ao criar hierarquia' });
  }
});

/**
 * PUT /api/employee-hierarchies/:id
 * Atualizar relação hierárquica
 */
router.put('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      organizationalUnitId,
      dataFim,
      ativo,
      observacoes,
    } = req.body;

    // Verificar se hierarquia existe
    const existingHierarchy = await prisma.employeeHierarchy.findUnique({
      where: { id },
    });

    if (!existingHierarchy) {
      return res.status(404).json({ error: 'Hierarquia não encontrada' });
    }

    if (organizationalUnitId !== undefined && organizationalUnitId !== null) {
      const organizationalUnit = await prisma.organizationalUnit.findUnique({
        where: { id: organizationalUnitId },
        select: { departmentId: true },
      });

      if (!organizationalUnit) {
        return res.status(404).json({ error: 'Unidade organizacional não encontrada' });
      }

      await assertDepartmentScopedEntities({
        departmentId: organizationalUnit.departmentId,
        organizationalUnitId,
      });
      await assertUserAssignmentScope({
        userId: existingHierarchy.subordinadoId,
        departmentId: organizationalUnit.departmentId,
        organizationalUnitId,
        label: 'Subordinado',
      });
      await assertUserAssignmentScope({
        userId: existingHierarchy.supervisorId,
        departmentId: organizationalUnit.departmentId,
        organizationalUnitId,
        label: 'Supervisor',
      });
    }

    // Update dinâmico
    const updateData: any = {};
    if (tipo !== undefined) updateData.tipo = tipo;
    if (organizationalUnitId !== undefined) updateData.organizationalUnitId = organizationalUnitId;
    if (dataFim !== undefined) updateData.dataFim = dataFim ? new Date(dataFim) : null;
    if (ativo !== undefined) updateData.ativo = ativo;
    if (observacoes !== undefined) updateData.observacoes = observacoes;

    updateData.updatedAt = new Date();

    const hierarchy = await prisma.employeeHierarchy.update({
      where: { id },
      data: updateData,
      include: {
        subordinado: {
          select: { id: true, name: true, email: true },
        },
        supervisor: {
          select: { id: true, name: true, email: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    res.json(hierarchy);
  } catch (error) {
    console.error('Erro ao atualizar hierarquia:', error);

    if (error instanceof OrganizationalIntegrityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }

    res.status(500).json({ error: 'Erro ao atualizar hierarquia' });
  }
});

/**
 * DELETE /api/employee-hierarchies/:id
 * Desativar relação hierárquica
 */
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dataFim, motivo } = req.body;

    // Verificar se hierarquia existe
    const hierarchy = await prisma.employeeHierarchy.findUnique({
      where: { id },
    });

    if (!hierarchy) {
      return res.status(404).json({ error: 'Hierarquia não encontrada' });
    }

    // Desativar
    const deactivated = await prisma.employeeHierarchy.update({
      where: { id },
      data: {
        ativo: false,
        dataFim: dataFim ? new Date(dataFim) : new Date(),
        observacoes: motivo || hierarchy.observacoes,
      },
    });

    res.json({
      message: 'Hierarquia desativada com sucesso',
      hierarchy: deactivated,
    });
  } catch (error) {
    console.error('Erro ao desativar hierarquia:', error);
    res.status(500).json({ error: 'Erro ao desativar hierarquia' });
  }
});

export default router;
