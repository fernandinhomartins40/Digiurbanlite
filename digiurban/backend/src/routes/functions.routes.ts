import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import {
  assertDepartmentScopedEntities,
  OrganizationalIntegrityError,
} from '../services/organizational-integrity.service';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { departmentId, positionId, tipo, isActive, search } = req.query;

    const where: any = {};

    if (departmentId) where.departmentId = departmentId as string;
    if (positionId) where.positionId = positionId as string;
    if (tipo) where.tipo = tipo as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { descricao: { contains: search as string, mode: 'insensitive' } },
        { simbolo: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const functions = await prisma.function.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        position: {
          select: {
            id: true,
            nome: true,
            organizationalUnit: {
              select: { id: true, nome: true, sigla: true, tipo: true },
            },
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    res.json(functions);
  } catch (error) {
    console.error('Erro ao listar funcoes:', error);
    res.status(500).json({ error: 'Erro ao listar funcoes' });
  }
});

router.get('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const func = await prisma.function.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        position: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            organizationalUnit: {
              select: { id: true, nome: true, sigla: true, tipo: true },
            },
          },
        },
        assignments: {
          where: { situacao: 'ATIVO' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            organizationalUnit: {
              select: { id: true, nome: true, sigla: true },
            },
            position: {
              select: { id: true, nome: true, tipo: true },
            },
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    if (!func) {
      return res.status(404).json({ error: 'Funcao nao encontrada' });
    }

    res.json(func);
  } catch (error) {
    console.error('Erro ao buscar funcao:', error);
    res.status(500).json({ error: 'Erro ao buscar funcao' });
  }
});

router.post('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { nome, descricao, tipo, simbolo, valor, departmentId, positionId, requisitos, atribuicoes } =
      req.body;

    if (!nome || !tipo || !departmentId || !positionId) {
      return res.status(400).json({
        error: 'Nome, tipo, secretaria e cargo sao obrigatorios',
      });
    }

    await assertDepartmentScopedEntities({
      departmentId,
      positionId,
    });

    const func = await prisma.function.create({
      data: {
        nome,
        descricao,
        tipo,
        simbolo,
        valor,
        departmentId,
        positionId,
        requisitos,
        atribuicoes,
        createdBy: (req.user as any)?.id,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, nome: true },
        },
      },
    });

    res.status(201).json(func);
  } catch (error: any) {
    console.error('Erro ao criar funcao:', error);

    if (error instanceof OrganizationalIntegrityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ja existe uma funcao com este simbolo neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao criar funcao' });
  }
});

router.put('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      tipo,
      simbolo,
      valor,
      departmentId,
      positionId,
      requisitos,
      atribuicoes,
      isActive,
    } = req.body;

    const existingFunc = await prisma.function.findUnique({
      where: { id },
    });
    if (!existingFunc) {
      return res.status(404).json({ error: 'Funcao nao encontrada' });
    }

    const resolvedDepartmentId = departmentId !== undefined ? departmentId : existingFunc.departmentId;
    const resolvedPositionId = positionId !== undefined ? positionId : existingFunc.positionId;

    if (!resolvedPositionId) {
      return res.status(400).json({
        error: 'Toda funcao deve estar vinculada a um cargo',
      });
    }

    await assertDepartmentScopedEntities({
      departmentId: resolvedDepartmentId,
      positionId: resolvedPositionId,
    });

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (simbolo !== undefined) updateData.simbolo = simbolo;
    if (valor !== undefined) updateData.valor = valor;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (positionId !== undefined) updateData.positionId = positionId;
    if (requisitos !== undefined) updateData.requisitos = requisitos;
    if (atribuicoes !== undefined) updateData.atribuicoes = atribuicoes;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    const func = await prisma.function.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: { id: true, name: true },
        },
        position: {
          select: { id: true, nome: true },
        },
      },
    });

    res.json(func);
  } catch (error: any) {
    console.error('Erro ao atualizar funcao:', error);

    if (error instanceof OrganizationalIntegrityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ja existe uma funcao com este simbolo neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao atualizar funcao' });
  }
});

router.delete('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const func = await prisma.function.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { situacao: 'ATIVO' },
        },
      },
    });

    if (!func) {
      return res.status(404).json({ error: 'Funcao nao encontrada' });
    }

    if (func.assignments.length > 0) {
      return res.status(400).json({
        error: 'Nao e possivel desativar uma funcao que possui servidores ativos vinculados',
      });
    }

    const deactivated = await prisma.function.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: 'Funcao desativada com sucesso',
      function: deactivated,
    });
  } catch (error) {
    console.error('Erro ao desativar funcao:', error);
    res.status(500).json({ error: 'Erro ao desativar funcao' });
  }
});

export default router;
