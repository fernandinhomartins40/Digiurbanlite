import { Router } from 'express';
import { prisma } from '../../lib/prisma';

const router = Router();

// GET /api/apps/educacao/turmas?unidadeId=&serie=&ano=&turno=
router.get('/', async (req, res) => {
  try {
    const { unidadeId, serie, ano, turno } = req.query;
    const turmas = await prisma.turma.findMany({
      where: {
        isActive: true,
        ...(unidadeId && { unidadeEducacaoId: unidadeId as string }),
        ...(serie && { serie: serie as string }),
        ...(ano && { ano: Number(ano) }),
        ...(turno && { turno: turno as any }),
      },
      include: { _count: { select: { matriculas: true } } },
      orderBy: [{ serie: 'asc' }, { codigo: 'asc' }],
    });
    res.json(turmas);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar turmas' });
  }
});

// POST /api/apps/educacao/turmas
router.post('/', async (req, res) => {
  try {
    const { unidadeEducacaoId, codigo, nome, serie, turno, ano, professorId, sala, capacidade } =
      req.body;

    if (!unidadeEducacaoId || !codigo || !serie || !turno || !capacidade) {
      return res.status(400).json({
        error: 'unidadeEducacaoId, codigo, serie, turno e capacidade são obrigatórios',
      });
    }

    const turma = await prisma.turma.create({
      data: {
        unidadeEducacaoId,
        codigo,
        nome,
        serie,
        turno,
        ano: Number(ano) || new Date().getFullYear(),
        professorId: professorId || null,
        sala,
        capacidade: Number(capacidade),
        vagasDisponiveis: Number(capacidade),
      },
    });
    res.status(201).json(turma);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar turma' });
  }
});

// GET /api/apps/educacao/turmas/:id
router.get('/:id', async (req, res) => {
  try {
    const turma = await prisma.turma.findUnique({
      where: { id: req.params.id },
      include: {
        matriculas: {
          where: { situacao: 'ATIVA' },
          orderBy: { numeroMatricula: 'asc' },
        },
      },
    });
    if (!turma) return res.status(404).json({ error: 'Turma não encontrada' });

    // Anexa os nomes dos alunos (alunoId → Citizen)
    const alunoIds = Array.from(new Set(turma.matriculas.map((m) => m.alunoId)));
    const alunos = alunoIds.length
      ? await prisma.citizen.findMany({
          where: { id: { in: alunoIds } },
          select: { id: true, name: true, cpf: true },
        })
      : [];
    const porId = new Map(alunos.map((a) => [a.id, a]));

    res.json({
      ...turma,
      matriculas: turma.matriculas.map((m) => ({
        ...m,
        aluno: porId.get(m.alunoId) || null,
      })),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar turma' });
  }
});

// PUT /api/apps/educacao/turmas/:id
router.put('/:id', async (req, res) => {
  try {
    const { nome, serie, turno, professorId, sala, capacidade, isActive } = req.body;
    const turma = await prisma.turma.update({
      where: { id: req.params.id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(serie && { serie }),
        ...(turno && { turno }),
        ...(professorId !== undefined && { professorId }),
        ...(sala !== undefined && { sala }),
        ...(capacidade && { capacidade: Number(capacidade) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json(turma);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar turma' });
  }
});

export default router;
