import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// CRUD DE FUNÇÕES (GRATIFICADAS, COMISSIONADAS, ETC)
// ============================================

/**
 * GET /api/functions
 * Listar todas as funções
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      departmentId,
      tipo,
      isActive,
      search,
    } = req.query;

    const where: any = {};

    if (departmentId) where.departmentId = departmentId as string;
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
    console.error('Erro ao listar funções:', error);
    res.status(500).json({ error: 'Erro ao listar funções' });
  }
});

/**
 * GET /api/functions/:id
 * Buscar função específica
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const func = await prisma.function.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, code: true },
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
      return res.status(404).json({ error: 'Função não encontrada' });
    }

    res.json(func);
  } catch (error) {
    console.error('Erro ao buscar função:', error);
    res.status(500).json({ error: 'Erro ao buscar função' });
  }
});

/**
 * POST /api/functions
 * Criar nova função
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      nome,
      descricao,
      tipo,
      simbolo,
      valor,
      departmentId,
      requisitos,
      atribuicoes,
    } = req.body;

    // Validações
    if (!nome || !tipo || !departmentId) {
      return res.status(400).json({
        error: 'Nome, tipo e departamento são obrigatórios',
      });
    }

    // Verificar se departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    const func = await prisma.function.create({
      data: {
        nome,
        descricao,
        tipo,
        simbolo,
        valor,
        departmentId,
        requisitos,
        atribuicoes,
        createdBy: (req.user as any)?.id,
      },
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json(func);
  } catch (error: any) {
    console.error('Erro ao criar função:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Já existe uma função com este símbolo neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao criar função' });
  }
});

/**
 * PUT /api/functions/:id
 * Atualizar função
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      tipo,
      simbolo,
      valor,
      requisitos,
      atribuicoes,
      isActive,
    } = req.body;

    // Verificar se função existe
    const existingFunc = await prisma.function.findUnique({
      where: { id },
    });
    if (!existingFunc) {
      return res.status(404).json({ error: 'Função não encontrada' });
    }

    // Update dinâmico
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (simbolo !== undefined) updateData.simbolo = simbolo;
    if (valor !== undefined) updateData.valor = valor;
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
      },
    });

    res.json(func);
  } catch (error: any) {
    console.error('Erro ao atualizar função:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Já existe uma função com este símbolo neste departamento',
      });
    }

    res.status(500).json({ error: 'Erro ao atualizar função' });
  }
});

/**
 * DELETE /api/functions/:id
 * Desativar função (soft delete)
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar se função existe
    const func = await prisma.function.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { situacao: 'ATIVO' },
        },
      },
    });

    if (!func) {
      return res.status(404).json({ error: 'Função não encontrada' });
    }

    // Validação: não pode desativar se houver servidores ativos com esta função
    if (func.assignments.length > 0) {
      return res.status(400).json({
        error: 'Não é possível desativar uma função que possui servidores ativos vinculados',
      });
    }

    // Desativar (soft delete)
    const deactivated = await prisma.function.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      message: 'Função desativada com sucesso',
      function: deactivated,
    });
  } catch (error) {
    console.error('Erro ao desativar função:', error);
    res.status(500).json({ error: 'Erro ao desativar função' });
  }
});

export default router;
