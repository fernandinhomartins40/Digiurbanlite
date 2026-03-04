import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth';
import {
  assertDepartmentScopedEntities,
  OrganizationalIntegrityError,
} from '../services/organizational-integrity.service';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { departmentId, organizationalUnitId, tipo, nivel, categoria, isActive, search } =
      req.query;

    const where: any = {};

    if (departmentId) where.departmentId = departmentId as string;
    if (organizationalUnitId) where.organizationalUnitId = organizationalUnitId as string;
    if (tipo) where.tipo = tipo as string;
    if (nivel) where.nivel = nivel as string;
    if (categoria) where.categoria = { contains: categoria as string, mode: 'insensitive' };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { descricao: { contains: search as string, mode: 'insensitive' } },
        { categoria: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const positions = await prisma.position.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true, tipo: true },
        },
        _count: {
          select: {
            assignments: true,
            functions: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    res.json(positions);
  } catch (error) {
    console.error('Erro ao listar cargos:', error);
    res.status(500).json({ error: 'Erro ao listar cargos' });
  }
});

router.get('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true, tipo: true, nivel: true },
        },
        functions: {
          where: { isActive: true },
          select: {
            id: true,
            nome: true,
            tipo: true,
            simbolo: true,
            valor: true,
            _count: {
              select: { assignments: true },
            },
          },
          orderBy: { nome: 'asc' },
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
          },
        },
        _count: {
          select: {
            assignments: true,
            functions: true,
          },
        },
      },
    });

    if (!position) {
      return res.status(404).json({ error: 'Cargo nao encontrado' });
    }

    res.json(position);
  } catch (error) {
    console.error('Erro ao buscar cargo:', error);
    res.status(500).json({ error: 'Erro ao buscar cargo' });
  }
});

router.post('/', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const {
      nome,
      descricao,
      cbo,
      tipo,
      categoria,
      nivel,
      requisitos,
      atribuicoes,
      departmentId,
      organizationalUnitId,
      cargaHorariaPadrao,
      salarioBase,
    } = req.body;

    if (!nome || !tipo || !departmentId || !organizationalUnitId) {
      return res.status(400).json({
        error: 'Nome, tipo, secretaria e unidade organizacional sao obrigatorios',
      });
    }

    await assertDepartmentScopedEntities({ departmentId, organizationalUnitId });

    const position = await prisma.position.create({
      data: {
        nome,
        descricao,
        cbo,
        tipo,
        categoria,
        nivel,
        requisitos,
        atribuicoes,
        departmentId,
        organizationalUnitId,
        cargaHorariaPadrao,
        salarioBase,
        createdBy: (req.user as any)?.id,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    res.status(201).json(position);
  } catch (error: any) {
    console.error('Erro ao criar cargo:', error);

    if (error instanceof OrganizationalIntegrityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ja existe um cargo com este nome neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao criar cargo' });
  }
});

router.put('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      cbo,
      tipo,
      categoria,
      nivel,
      requisitos,
      atribuicoes,
      organizationalUnitId,
      cargaHorariaPadrao,
      salarioBase,
      isActive,
    } = req.body;

    const existingPosition = await prisma.position.findUnique({
      where: { id },
    });
    if (!existingPosition) {
      return res.status(404).json({ error: 'Cargo nao encontrado' });
    }

    const resolvedOrganizationalUnitId =
      organizationalUnitId !== undefined ? organizationalUnitId : existingPosition.organizationalUnitId;

    if (!resolvedOrganizationalUnitId) {
      return res.status(400).json({
        error: 'Todo cargo deve estar vinculado a uma unidade organizacional',
      });
    }

    await assertDepartmentScopedEntities({
      departmentId: existingPosition.departmentId,
      organizationalUnitId: resolvedOrganizationalUnitId,
    });

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (cbo !== undefined) updateData.cbo = cbo;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (nivel !== undefined) updateData.nivel = nivel;
    if (requisitos !== undefined) updateData.requisitos = requisitos;
    if (atribuicoes !== undefined) updateData.atribuicoes = atribuicoes;
    if (organizationalUnitId !== undefined) updateData.organizationalUnitId = organizationalUnitId;
    if (cargaHorariaPadrao !== undefined) updateData.cargaHorariaPadrao = cargaHorariaPadrao;
    if (salarioBase !== undefined) updateData.salarioBase = salarioBase;
    if (isActive !== undefined) updateData.isActive = isActive;
    updateData.updatedAt = new Date();

    const position = await prisma.position.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: { id: true, name: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
      },
    });

    res.json(position);
  } catch (error: any) {
    console.error('Erro ao atualizar cargo:', error);

    if (error instanceof OrganizationalIntegrityError) {
      return res.status(error.statusCode).json({ error: error.message, code: error.code });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ja existe um cargo com este nome neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao atualizar cargo' });
  }
});

router.delete('/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { situacao: 'ATIVO' },
        },
        functions: {
          where: { isActive: true },
        },
      },
    });

    if (!position) {
      return res.status(404).json({ error: 'Cargo nao encontrado' });
    }

    if (position.assignments.length > 0) {
      return res.status(400).json({
        error: 'Nao e possivel desativar um cargo que possui servidores ativos vinculados',
      });
    }

    if (position.functions.length > 0) {
      return res.status(400).json({
        error: 'Nao e possivel desativar um cargo que possui funcoes ativas vinculadas',
      });
    }

    const deactivated = await prisma.position.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: 'Cargo desativado com sucesso',
      position: deactivated,
    });
  } catch (error) {
    console.error('Erro ao desativar cargo:', error);
    res.status(500).json({ error: 'Erro ao desativar cargo' });
  }
});

export default router;
