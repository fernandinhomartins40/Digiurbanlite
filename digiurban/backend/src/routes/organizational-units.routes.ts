import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// CRUD DE UNIDADES ORGANIZACIONAIS
// ============================================

/**
 * GET /api/organizational-units
 * Listar todas as unidades organizacionais
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      departmentId,
      tipo,
      parentId,
      isActive,
      nivel,
      search,
    } = req.query;

    const where: any = {};

    if (departmentId) where.departmentId = departmentId as string;
    if (tipo) where.tipo = tipo as string;
    if (parentId === 'null') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId as string;
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (nivel) where.nivel = parseInt(nivel as string);
    if (search) {
      where.OR = [
        { nome: { contains: search as string, mode: 'insensitive' } },
        { sigla: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const units = await prisma.organizationalUnit.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        parent: {
          select: { id: true, nome: true, sigla: true, tipo: true },
        },
        responsavel: {
          select: { id: true, name: true, email: true },
        },
        children: {
          select: { id: true, nome: true, sigla: true, tipo: true, nivel: true },
        },
        _count: {
          select: {
            positions: true,
            assignments: true,
            teams: true,
          },
        },
      },
      orderBy: [
        { nivel: 'asc' },
        { nome: 'asc' },
      ],
    });

    res.json(units);
  } catch (error) {
    console.error('Erro ao listar unidades organizacionais:', error);
    res.status(500).json({ error: 'Erro ao listar unidades organizacionais' });
  }
});

/**
 * GET /api/organizational-units/:id
 * Buscar unidade organizacional específica
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const unit = await prisma.organizationalUnit.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, code: true, description: true },
        },
        parent: {
          select: { id: true, nome: true, sigla: true, tipo: true, nivel: true },
        },
        responsavel: {
          select: { id: true, name: true, email: true, role: true },
        },
        children: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
            nivel: true,
            isActive: true,
            responsavel: {
              select: { id: true, name: true },
            },
          },
        },
        positions: {
          where: { isActive: true },
          select: {
            id: true,
            nome: true,
            tipo: true,
            nivel: true,
            _count: {
              select: { assignments: true },
            },
          },
        },
        assignments: {
          where: { situacao: 'ATIVO' },
          select: {
            id: true,
            user: {
              select: { id: true, name: true, email: true },
            },
            position: {
              select: { id: true, nome: true, tipo: true },
            },
            function: {
              select: { id: true, nome: true, tipo: true },
            },
            isPrimary: true,
            dataInicio: true,
          },
        },
        _count: {
          select: {
            positions: true,
            assignments: true,
            teams: true,
            children: true,
          },
        },
      },
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unidade organizacional não encontrada' });
    }

    res.json(unit);
  } catch (error) {
    console.error('Erro ao buscar unidade organizacional:', error);
    res.status(500).json({ error: 'Erro ao buscar unidade organizacional' });
  }
});

/**
 * GET /api/organizational-units/:id/hierarchy
 * Buscar organograma completo de uma unidade (hierarquia)
 */
router.get('/:id/hierarchy', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Função recursiva para construir árvore
    const buildTree = async (unitId: string): Promise<any> => {
      const unit = await prisma.organizationalUnit.findUnique({
        where: { id: unitId },
        include: {
          responsavel: {
            select: { id: true, name: true, email: true },
          },
          children: {
            where: { isActive: true },
            orderBy: { nome: 'asc' },
          },
          _count: {
            select: {
              assignments: { where: { situacao: 'ATIVO' } },
              positions: true,
            },
          },
        },
      });

      if (!unit) return null;

      const childrenWithTree = await Promise.all(
        unit.children.map((child) => buildTree(child.id))
      );

      return {
        ...unit,
        children: childrenWithTree,
      };
    };

    const hierarchy = await buildTree(id);

    if (!hierarchy) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    res.json(hierarchy);
  } catch (error) {
    console.error('Erro ao buscar hierarquia:', error);
    res.status(500).json({ error: 'Erro ao buscar hierarquia' });
  }
});

/**
 * POST /api/organizational-units
 * Criar nova unidade organizacional
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      nome,
      sigla,
      tipo,
      nivel,
      departmentId,
      parentId,
      responsavelId,
      descricao,
      competencias,
      endereco,
      telefone,
      email,
    } = req.body;

    // Validações
    if (!nome || !tipo || nivel === undefined || !departmentId) {
      return res.status(400).json({
        error: 'Nome, tipo, nível e departamento são obrigatórios',
      });
    }

    // Verificar se departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Verificar se parent existe (se fornecido)
    if (parentId) {
      const parent = await prisma.organizationalUnit.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return res.status(404).json({ error: 'Unidade pai não encontrada' });
      }
    }

    // Verificar se responsável existe (se fornecido)
    if (responsavelId) {
      const responsavel = await prisma.user.findUnique({
        where: { id: responsavelId },
      });
      if (!responsavel) {
        return res.status(404).json({ error: 'Responsável não encontrado' });
      }
    }

    const unit = await prisma.organizationalUnit.create({
      data: {
        nome,
        sigla,
        tipo,
        nivel,
        departmentId,
        parentId,
        responsavelId,
        descricao,
        competencias,
        endereco,
        telefone,
        email,
        createdBy: (req.user as any)?.id,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, nome: true, sigla: true },
        },
        responsavel: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(unit);
  } catch (error: any) {
    console.error('Erro ao criar unidade organizacional:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Já existe uma unidade com esta sigla neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao criar unidade organizacional' });
  }
});

/**
 * PUT /api/organizational-units/:id
 * Atualizar unidade organizacional
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nome,
      sigla,
      tipo,
      nivel,
      parentId,
      responsavelId,
      descricao,
      competencias,
      endereco,
      telefone,
      email,
      isActive,
    } = req.body;

    // Verificar se unidade existe
    const existingUnit = await prisma.organizationalUnit.findUnique({
      where: { id },
    });
    if (!existingUnit) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    // Validação: não pode ser pai de si mesma
    if (parentId === id) {
      return res.status(400).json({ error: 'Uma unidade não pode ser pai de si mesma' });
    }

    // Update dinâmico
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (sigla !== undefined) updateData.sigla = sigla;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (nivel !== undefined) updateData.nivel = nivel;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (responsavelId !== undefined) updateData.responsavelId = responsavelId;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (competencias !== undefined) updateData.competencias = competencias;
    if (endereco !== undefined) updateData.endereco = endereco;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;

    updateData.updatedAt = new Date();

    const unit = await prisma.organizationalUnit.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, nome: true, sigla: true },
        },
        responsavel: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(unit);
  } catch (error: any) {
    console.error('Erro ao atualizar unidade organizacional:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Já existe uma unidade com esta sigla neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao atualizar unidade organizacional' });
  }
});

/**
 * DELETE /api/organizational-units/:id
 * Desativar unidade organizacional (soft delete)
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se unidade existe
    const unit = await prisma.organizationalUnit.findUnique({
      where: { id },
      include: {
        children: {
          where: { isActive: true },
        },
        assignments: {
          where: { situacao: 'ATIVO' },
        },
      },
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unidade não encontrada' });
    }

    // Validação: não pode desativar se tiver unidades filhas ativas
    if (unit.children.length > 0) {
      return res.status(400).json({
        error: 'Não é possível desativar uma unidade que possui unidades subordinadas ativas',
      });
    }

    // Validação: não pode desativar se tiver vínculos ativos
    if (unit.assignments.length > 0) {
      return res.status(400).json({
        error: 'Não é possível desativar uma unidade que possui servidores ativos vinculados',
      });
    }

    // Desativar (soft delete)
    const deactivated = await prisma.organizationalUnit.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: 'Unidade organizacional desativada com sucesso',
      unit: deactivated,
    });
  } catch (error) {
    console.error('Erro ao desativar unidade organizacional:', error);
    res.status(500).json({ error: 'Erro ao desativar unidade organizacional' });
  }
});

export default router;
