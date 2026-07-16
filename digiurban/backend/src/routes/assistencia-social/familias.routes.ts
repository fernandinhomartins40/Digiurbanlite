import { Router } from 'express';
import cadUnicoService from '../../services/cadunico/cadunico.service';
import { prisma } from '../../lib/prisma';

const router = Router();

/** Anexa {responsavel: Citizen} a uma lista de famílias. */
async function comResponsaveis(familias: any[]) {
  const ids = Array.from(new Set(familias.map((f) => f.responsavelFamiliarId).filter(Boolean)));
  if (ids.length === 0) return familias;
  const pessoas = await prisma.citizen.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, cpf: true },
  });
  const porId = new Map(pessoas.map((p) => [p.id, p]));
  return familias.map((f) => ({ ...f, responsavel: porId.get(f.responsavelFamiliarId) || null }));
}

// GET /api/apps/assistencia-social/familias/stats
router.get('/stats', async (_req, res) => {
  try {
    const [total, porStatus, membros] = await Promise.all([
      prisma.cadUnicoFamilia.count(),
      prisma.cadUnicoFamilia.groupBy({ by: ['status'], _count: true }),
      prisma.membroFamilia.count(),
    ]);
    res.json({
      totalFamilias: total,
      totalMembros: membros,
      porStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao obter estatísticas' });
  }
});

// GET /api/apps/assistencia-social/familias?status=&responsavelId=&numeroCadUnico=
router.get('/', async (req, res) => {
  try {
    const { status, responsavelId, numeroCadUnico } = req.query;
    let familias: any[];
    if (numeroCadUnico) {
      const f = await cadUnicoService.findByNumeroCadUnico(numeroCadUnico as string);
      familias = f ? [f] : [];
    } else if (responsavelId) {
      familias = await cadUnicoService.findByResponsavel(responsavelId as string);
    } else if (status) {
      familias = await cadUnicoService.findByStatus(status as any);
    } else {
      familias = await prisma.cadUnicoFamilia.findMany({
        include: { membros: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
    }
    res.json(await comResponsaveis(familias));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar famílias' });
  }
});

// POST /api/apps/assistencia-social/familias - Cadastrar família (CadÚnico)
router.post('/', async (req, res) => {
  try {
    if (!req.body.responsavelFamiliarId) {
      return res.status(400).json({ error: 'responsavelFamiliarId é obrigatório' });
    }
    const familia = await cadUnicoService.createFamilia({
      responsavelFamiliarId: req.body.responsavelFamiliarId,
      endereco: req.body.endereco || {},
      rendaTotalFamiliar: req.body.rendaTotalFamiliar,
      membros: (req.body.membros || []).map((m: any) => ({
        ...m,
        dataNascimento: m.dataNascimento ? new Date(m.dataNascimento) : new Date(),
      })),
    });
    res.status(201).json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao cadastrar família' });
  }
});

// GET /api/apps/assistencia-social/familias/:id
router.get('/:id', async (req, res) => {
  try {
    const familia = await cadUnicoService.findById(req.params.id);
    if (!familia) return res.status(404).json({ error: 'Família não encontrada' });
    const [comDados] = await comResponsaveis([familia]);
    res.json(comDados);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar família' });
  }
});

// POST /api/apps/assistencia-social/familias/:id/agendar-entrevista
router.post('/:id/agendar-entrevista', async (req, res) => {
  try {
    if (!req.body.dataEntrevista) {
      return res.status(400).json({ error: 'dataEntrevista é obrigatória' });
    }
    const familia = await cadUnicoService.agendarEntrevista({
      familiaId: req.params.id,
      dataEntrevista: new Date(req.body.dataEntrevista),
      entrevistadorId: req.body.entrevistadorId || (req as any).userId,
    });
    res.json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao agendar entrevista' });
  }
});

// POST /api/apps/assistencia-social/familias/:id/realizar-entrevista
router.post('/:id/realizar-entrevista', async (req, res) => {
  try {
    const familia = await cadUnicoService.realizarEntrevista({
      familiaId: req.params.id,
      entrevistadorId: req.body.entrevistadorId || (req as any).userId,
      dadosAtualizados: req.body.dadosAtualizados,
      observacoes: req.body.observacoes,
    });
    res.json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao registrar entrevista' });
  }
});

// POST /api/apps/assistencia-social/familias/:id/validar
router.post('/:id/validar', async (req, res) => {
  try {
    const familia = await cadUnicoService.validarDados({
      familiaId: req.params.id,
      validadorId: req.body.validadorId || (req as any).userId,
      aprovado: !!req.body.aprovado,
      observacoes: req.body.observacoes,
    });
    res.json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao validar dados' });
  }
});

// POST /api/apps/assistencia-social/familias/:id/ativar
router.post('/:id/ativar', async (req, res) => {
  try {
    const familia = await cadUnicoService.ativarCadastro(
      req.params.id,
      (req as any).userId || 'sistema'
    );
    res.json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao ativar cadastro' });
  }
});

export default router;
