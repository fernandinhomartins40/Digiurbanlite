import { Router } from 'express';
import matriculaService from '../../services/matricula/matricula.service';
import { prisma } from '../../lib/prisma';

const router = Router();

/** Anexa {aluno, responsavel} (Citizen) a uma lista de inscrições/matrículas. */
async function comPessoas(itens: any[]) {
  const ids = Array.from(
    new Set(
      itens.flatMap((i) => [i.alunoId, i.responsavelId]).filter(Boolean)
    )
  );
  if (ids.length === 0) return itens;
  const pessoas = await prisma.citizen.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, cpf: true },
  });
  const porId = new Map(pessoas.map((p) => [p.id, p]));
  return itens.map((i) => ({
    ...i,
    aluno: porId.get(i.alunoId) || null,
    responsavel: porId.get(i.responsavelId) || null,
  }));
}

// GET /api/apps/educacao/matriculas/inscricoes?status=
router.get('/inscricoes', async (req, res) => {
  try {
    const { status, alunoId } = req.query;
    let inscricoes: any[];
    if (alunoId) {
      inscricoes = await matriculaService.findByAluno(alunoId as string);
    } else if (status) {
      inscricoes = await matriculaService.findByStatus(status as any);
    } else {
      inscricoes = await prisma.inscricaoMatricula.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { matricula: true },
      });
    }
    res.json(await comPessoas(inscricoes));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar inscrições' });
  }
});

// POST /api/apps/educacao/matriculas/inscricoes - Nova inscrição
router.post('/inscricoes', async (req, res) => {
  try {
    if (!req.body.alunoId || !req.body.responsavelId || !req.body.serie) {
      return res
        .status(400)
        .json({ error: 'alunoId, responsavelId e serie são obrigatórios' });
    }
    const inscricao = await matriculaService.createInscricao(req.body);
    res.status(201).json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar inscrição' });
  }
});

// GET /api/apps/educacao/matriculas/inscricoes/:id
router.get('/inscricoes/:id', async (req, res) => {
  try {
    const inscricao = await matriculaService.findById(req.params.id);
    if (!inscricao) return res.status(404).json({ error: 'Inscrição não encontrada' });
    const [comDados] = await comPessoas([inscricao]);
    res.json(comDados);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar inscrição' });
  }
});

// POST /api/apps/educacao/matriculas/inscricoes/:id/validar-documentos
router.post('/inscricoes/:id/validar-documentos', async (req, res) => {
  try {
    const validadorId = req.body.validadorId || (req as any).userId;
    const inscricao = await matriculaService.validarDocumentos({
      inscricaoId: req.params.id,
      validadorId,
      aprovado: !!req.body.aprovado,
      documentosPendentes: req.body.documentosPendentes,
      observacoes: req.body.observacoes,
    });
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao validar documentos' });
  }
});

// POST /api/apps/educacao/matriculas/inscricoes/:id/atribuir-vaga
router.post('/inscricoes/:id/atribuir-vaga', async (req, res) => {
  try {
    if (!req.body.turmaId) {
      return res.status(400).json({ error: 'turmaId é obrigatório' });
    }
    const gestorId = req.body.gestorId || (req as any).userId;
    const inscricao = await matriculaService.atribuirVaga({
      inscricaoId: req.params.id,
      turmaId: req.body.turmaId,
      gestorId,
    });
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao atribuir vaga' });
  }
});

// POST /api/apps/educacao/matriculas/inscricoes/:id/confirmar
router.post('/inscricoes/:id/confirmar', async (req, res) => {
  try {
    const matricula = await matriculaService.confirmarMatricula({
      inscricaoId: req.params.id,
      responsavelId: req.body.responsavelId || (req as any).userId,
      dataInicio: req.body.dataInicio ? new Date(req.body.dataInicio) : new Date(),
    });
    res.status(201).json(matricula);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao confirmar matrícula' });
  }
});

// GET /api/apps/educacao/matriculas?unidadeId=&turmaId=&situacao=
router.get('/', async (req, res) => {
  try {
    const { unidadeId, turmaId, situacao, anoLetivo } = req.query;
    const matriculas = await prisma.matricula.findMany({
      where: {
        ...(unidadeId && { unidadeEducacaoId: unidadeId as string }),
        ...(turmaId && { turmaId: turmaId as string }),
        ...(situacao && { situacao: situacao as any }),
        ...(anoLetivo && { anoLetivo: Number(anoLetivo) }),
      },
      include: { turma: { select: { codigo: true, nome: true, serie: true, turno: true } } },
      orderBy: { dataMatricula: 'desc' },
      take: 300,
    });
    res.json(await comPessoas(matriculas));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar matrículas' });
  }
});

// GET /api/apps/educacao/matriculas/stats
router.get('/stats', async (_req, res) => {
  try {
    const [porStatus, matriculasAtivas, turmas] = await Promise.all([
      prisma.inscricaoMatricula.groupBy({ by: ['status'], _count: true }),
      prisma.matricula.count({ where: { situacao: 'ATIVA' } }),
      prisma.turma.aggregate({
        where: { isActive: true },
        _sum: { capacidade: true, vagasOcupadas: true },
      }),
    ]);

    res.json({
      inscricoesPorStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
      matriculasAtivas,
      capacidadeTotal: turmas._sum.capacidade || 0,
      vagasOcupadas: turmas._sum.vagasOcupadas || 0,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao obter estatísticas' });
  }
});

export default router;
