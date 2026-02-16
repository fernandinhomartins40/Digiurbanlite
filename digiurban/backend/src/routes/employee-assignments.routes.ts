import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { syncUserDepartmentsFromAssignments, syncAllUserDepartments } from '../services/assignment-sync.service';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// CRUD DE VÍNCULOS FUNCIONAIS (EMPLOYEE ASSIGNMENTS)
// ============================================

/**
 * GET /api/employee-assignments
 * Listar todos os vínculos funcionais
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      departmentId,
      organizationalUnitId,
      positionId,
      functionId,
      tipo,
      situacao,
      isPrimary,
      dataInicio,
      dataFim,
    } = req.query;

    const where: any = {};

    if (userId) where.userId = userId as string;
    if (departmentId) where.departmentId = departmentId as string;
    if (organizationalUnitId) where.organizationalUnitId = organizationalUnitId as string;
    if (positionId) where.positionId = positionId as string;
    if (functionId) where.functionId = functionId as string;
    if (tipo) where.tipo = tipo as string;
    if (situacao) where.situacao = situacao as string;
    if (isPrimary !== undefined) where.isPrimary = isPrimary === 'true';
    if (dataInicio) {
      where.dataInicio = { gte: new Date(dataInicio as string) };
    }
    if (dataFim) {
      where.dataFim = { lte: new Date(dataFim as string) };
    }

    const assignments = await prisma.employeeAssignment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true, tipo: true },
        },
        position: {
          select: { id: true, nome: true, tipo: true, nivel: true },
        },
        function: {
          select: { id: true, nome: true, tipo: true, simbolo: true },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { dataInicio: 'desc' },
      ],
    });

    res.json(assignments);
  } catch (error) {
    console.error('Erro ao listar vínculos:', error);
    res.status(500).json({ error: 'Erro ao listar vínculos' });
  }
});

/**
 * GET /api/employee-assignments/:id
 * Buscar vínculo específico
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.employeeAssignment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        department: {
          select: { id: true, name: true, code: true, description: true },
        },
        organizationalUnit: {
          select: {
            id: true,
            nome: true,
            sigla: true,
            tipo: true,
            nivel: true,
            responsavel: {
              select: { id: true, name: true },
            },
          },
        },
        position: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            nivel: true,
            categoria: true,
            cbo: true,
          },
        },
        function: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            simbolo: true,
            valor: true,
          },
        },
        auditorias: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Erro ao buscar vínculo:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculo' });
  }
});

/**
 * GET /api/employee-assignments/user/:userId
 * Buscar todos os vínculos de um servidor
 */
router.get('/user/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { includeInactive } = req.query;

    const where: any = { userId };
    if (!includeInactive) {
      where.situacao = 'ATIVO';
    }

    const assignments = await prisma.employeeAssignment.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true, tipo: true },
        },
        position: {
          select: { id: true, nome: true, tipo: true },
        },
        function: {
          select: { id: true, nome: true, tipo: true },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { dataInicio: 'desc' },
      ],
    });

    res.json(assignments);
  } catch (error) {
    console.error('Erro ao buscar vínculos do servidor:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculos do servidor' });
  }
});

/**
 * POST /api/employee-assignments
 * Criar novo vínculo funcional
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      departmentId,
      organizationalUnitId,
      positionId,
      functionId,
      tipo,
      situacao,
      isPrimary,
      dataInicio,
      dataFim,
      cargaHoraria,
      percentualDedicacao,
      observacoes,
      documentoVinculo,
    } = req.body;

    // Validações
    if (!userId || !departmentId || !tipo || !situacao || !dataInicio) {
      return res.status(400).json({
        error: 'Usuário, departamento, tipo, situação e data de início são obrigatórios',
      });
    }

    // Verificar se user existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se departamento existe
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Verificar se unidade organizacional existe (se fornecida)
    if (organizationalUnitId) {
      const unit = await prisma.organizationalUnit.findUnique({
        where: { id: organizationalUnitId },
      });
      if (!unit) {
        return res.status(404).json({ error: 'Unidade organizacional não encontrada' });
      }
    }

    // Verificar se cargo existe (se fornecido)
    if (positionId) {
      const position = await prisma.position.findUnique({ where: { id: positionId } });
      if (!position) {
        return res.status(404).json({ error: 'Cargo não encontrado' });
      }
    }

    // Verificar se função existe (se fornecida)
    if (functionId) {
      const func = await prisma.function.findUnique({ where: { id: functionId } });
      if (!func) {
        return res.status(404).json({ error: 'Função não encontrada' });
      }
    }

    // Se isPrimary, remover o primary de outros vínculos do mesmo usuário
    if (isPrimary) {
      await prisma.employeeAssignment.updateMany({
        where: {
          userId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Criar vínculo
    const assignment = await prisma.employeeAssignment.create({
      data: {
        userId,
        departmentId,
        organizationalUnitId,
        positionId,
        functionId,
        tipo,
        situacao,
        isPrimary: isPrimary || false,
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
        cargaHoraria,
        percentualDedicacao,
        observacoes,
        documentoVinculo,
        createdBy: (req.user as any)?.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
        position: {
          select: { id: true, nome: true, tipo: true },
        },
        function: {
          select: { id: true, nome: true, tipo: true },
        },
      },
    });

    // Criar auditoria
    await prisma.assignmentAudit.create({
      data: {
        assignmentId: assignment.id,
        tipo: 'CRIACAO',
        userId: assignment.userId,
        userName: user.name,
        departmentId: assignment.departmentId,
        departmentName: department.name,
        unitDestinoId: organizationalUnitId,
        executorId: (req.user as any)?.id,
        executorName: (req.user as any)?.name,
        documentoLegal: documentoVinculo,
        motivo: observacoes,
        dataEfetivacao: new Date(dataInicio),
        detalhes: {
          tipo,
          situacao,
          isPrimary,
          cargaHoraria,
          percentualDedicacao,
        },
      },
    });

    // P0: Sincronizar UserDepartment automaticamente
    await syncUserDepartmentsFromAssignments(userId);

    res.status(201).json(assignment);
  } catch (error: any) {
    console.error('Erro ao criar vínculo:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Já existe um vínculo com estas características',
      });
    }

    res.status(500).json({ error: 'Erro ao criar vínculo' });
  }
});

/**
 * PUT /api/employee-assignments/:id
 * Atualizar vínculo funcional
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      organizationalUnitId,
      positionId,
      functionId,
      tipo,
      situacao,
      isPrimary,
      dataFim,
      cargaHoraria,
      percentualDedicacao,
      observacoes,
      documentoVinculo,
    } = req.body;

    // Verificar se vínculo existe
    const existingAssignment = await prisma.employeeAssignment.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        organizationalUnit: true,
        position: true,
      },
    });

    if (!existingAssignment) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    // Se isPrimary, remover o primary de outros vínculos do mesmo usuário
    if (isPrimary && !existingAssignment.isPrimary) {
      await prisma.employeeAssignment.updateMany({
        where: {
          userId: existingAssignment.userId,
          isPrimary: true,
          id: { not: id },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Update dinâmico
    const updateData: any = {};
    if (organizationalUnitId !== undefined) updateData.organizationalUnitId = organizationalUnitId;
    if (positionId !== undefined) updateData.positionId = positionId;
    if (functionId !== undefined) updateData.functionId = functionId;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (situacao !== undefined) updateData.situacao = situacao;
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
    if (dataFim !== undefined) updateData.dataFim = dataFim ? new Date(dataFim) : null;
    if (cargaHoraria !== undefined) updateData.cargaHoraria = cargaHoraria;
    if (percentualDedicacao !== undefined) updateData.percentualDedicacao = percentualDedicacao;
    if (observacoes !== undefined) updateData.observacoes = observacoes;
    if (documentoVinculo !== undefined) updateData.documentoVinculo = documentoVinculo;

    updateData.updatedAt = new Date();

    const assignment = await prisma.employeeAssignment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true },
        },
        organizationalUnit: {
          select: { id: true, nome: true, sigla: true },
        },
        position: {
          select: { id: true, nome: true, tipo: true },
        },
        function: {
          select: { id: true, nome: true, tipo: true },
        },
      },
    });

    // Determinar tipo de auditoria
    let tipoAuditoria: string = 'ALTERACAO_CARGA_HORARIA';
    if (situacao && situacao !== existingAssignment.situacao) {
      if (situacao === 'ATIVO') tipoAuditoria = 'ATIVACAO';
      else if (situacao === 'INATIVO') tipoAuditoria = 'DESATIVACAO';
      else if (situacao === 'AFASTADO') tipoAuditoria = 'AFASTAMENTO';
    } else if (organizationalUnitId && organizationalUnitId !== existingAssignment.organizationalUnitId) {
      tipoAuditoria = 'TRANSFERENCIA';
    }

    // Criar auditoria
    await prisma.assignmentAudit.create({
      data: {
        assignmentId: id,
        tipo: tipoAuditoria as any,
        userId: existingAssignment.userId,
        userName: existingAssignment.user.name,
        departmentId: existingAssignment.departmentId,
        departmentName: existingAssignment.department.name,
        unitOrigemId: existingAssignment.organizationalUnitId,
        unitOrigemName: existingAssignment.organizationalUnit?.nome,
        unitDestinoId: organizationalUnitId,
        positionOrigemId: existingAssignment.positionId,
        positionOrigemName: existingAssignment.position?.nome,
        positionDestinoId: positionId,
        executorId: (req.user as any)?.id,
        executorName: (req.user as any)?.name,
        documentoLegal: documentoVinculo,
        motivo: observacoes,
        detalhes: updateData,
      },
    });

    // P0: Sincronizar UserDepartment automaticamente
    await syncUserDepartmentsFromAssignments(existingAssignment.userId);

    res.json(assignment);
  } catch (error: any) {
    console.error('Erro ao atualizar vínculo:', error);
    res.status(500).json({ error: 'Erro ao atualizar vínculo' });
  }
});

/**
 * DELETE /api/employee-assignments/:id
 * Encerrar vínculo funcional
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { motivo, dataFim } = req.body;

    // Verificar se vínculo existe
    const assignment = await prisma.employeeAssignment.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        organizationalUnit: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    // Encerrar vínculo
    const terminated = await prisma.employeeAssignment.update({
      where: { id },
      data: {
        situacao: 'INATIVO',
        dataFim: dataFim ? new Date(dataFim) : new Date(),
        observacoes: motivo || assignment.observacoes,
      },
    });

    // Criar auditoria
    await prisma.assignmentAudit.create({
      data: {
        assignmentId: id,
        tipo: 'DESATIVACAO',
        userId: assignment.userId,
        userName: assignment.user.name,
        departmentId: assignment.departmentId,
        departmentName: assignment.department.name,
        unitOrigemId: assignment.organizationalUnitId,
        unitOrigemName: assignment.organizationalUnit?.nome,
        executorId: (req.user as any)?.id,
        executorName: (req.user as any)?.name,
        motivo,
        dataEfetivacao: dataFim ? new Date(dataFim) : new Date(),
      },
    });

    // P0: Sincronizar UserDepartment automaticamente
    await syncUserDepartmentsFromAssignments(assignment.userId);

    res.json({
      message: 'Vínculo encerrado com sucesso',
      assignment: terminated,
    });
  } catch (error) {
    console.error('Erro ao encerrar vínculo:', error);
    res.status(500).json({ error: 'Erro ao encerrar vínculo' });
  }
});

/**
 * GET /api/employee-assignments/:id/audit
 * Buscar histórico de auditoria de um vínculo
 */
router.get('/:id/audit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const audits = await prisma.assignmentAudit.findMany({
      where: { assignmentId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(audits);
  } catch (error) {
    console.error('Erro ao buscar auditoria:', error);
    res.status(500).json({ error: 'Erro ao buscar auditoria' });
  }
});

/**
 * POST /api/employee-assignments/sync-all
 * Sincronizar UserDepartments de TODOS os servidores (migração/reparo)
 */
router.post('/sync-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await syncAllUserDepartments();
    res.json({
      message: 'Sincronização em lote concluída',
      ...result,
    });
  } catch (error) {
    console.error('Erro na sincronização em lote:', error);
    res.status(500).json({ error: 'Erro na sincronização em lote' });
  }
});

export default router;
