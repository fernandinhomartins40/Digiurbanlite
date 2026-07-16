import { Router } from 'express';
import programaSocialService from '../../services/programa-social/programa-social.service';
import { prisma } from '../../lib/prisma';

const router = Router();

/** Anexa {beneficiario, programa} a uma lista de inscrições. */
async function comDetalhes(inscricoes: any[]) {
  const citizenIds = Array.from(new Set(inscricoes.map((i) => i.beneficiarioId).filter(Boolean)));
  const programaIds = Array.from(new Set(inscricoes.map((i) => i.programaId).filter(Boolean)));
  const [pessoas, programas] = await Promise.all([
    citizenIds.length
      ? prisma.citizen.findMany({
          where: { id: { in: citizenIds } },
          select: { id: true, name: true, cpf: true },
        })
      : Promise.resolve([]),
    programaIds.length
      ? prisma.programaSocial.findMany({
          where: { id: { in: programaIds } },
          select: { id: true, nome: true, valorBeneficio: true, periodicidade: true },
        })
      : Promise.resolve([]),
  ]);
  const pessoaPorId = new Map(pessoas.map((p) => [p.id, p]));
  const programaPorId = new Map(programas.map((p) => [p.id, p]));
  return inscricoes.map((i) => ({
    ...i,
    beneficiario: pessoaPorId.get(i.beneficiarioId) || null,
    programa: programaPorId.get(i.programaId) || null,
  }));
}

// ==================== CATÁLOGO DE PROGRAMAS ====================

// GET /api/apps/assistencia-social/programas/catalogo
router.get('/catalogo', async (_req, res) => {
  try {
    const programas = await prisma.programaSocial.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' },
    });
    res.json(programas);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar programas' });
  }
});

// POST /api/apps/assistencia-social/programas/catalogo
router.post('/catalogo', async (req, res) => {
  try {
    if (!req.body.nome) {
      return res.status(400).json({ error: 'nome é obrigatório' });
    }
    const programa = await prisma.programaSocial.create({
      data: {
        nome: req.body.nome,
        descricao: req.body.descricao,
        tipo: req.body.tipo,
        valorBeneficio: req.body.valorBeneficio ? Number(req.body.valorBeneficio) : null,
        periodicidade: req.body.periodicidade,
        orgaoResponsavel: req.body.orgaoResponsavel,
      },
    });
    res.status(201).json(programa);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar programa' });
  }
});

// ==================== INSCRIÇÕES / BENEFÍCIOS ====================

// GET /api/apps/assistencia-social/programas/inscricoes?status=&beneficiarioId=&familiaId=
router.get('/inscricoes', async (req, res) => {
  try {
    const { status, beneficiarioId, familiaId } = req.query;
    let inscricoes: any[];
    if (beneficiarioId) {
      inscricoes = await programaSocialService.findByBeneficiario(beneficiarioId as string);
    } else if (familiaId) {
      inscricoes = await programaSocialService.findByFamilia(familiaId as string);
    } else if (status) {
      inscricoes = await programaSocialService.findByStatus(status as any);
    } else {
      inscricoes = await prisma.inscricaoProgramaSocial.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
    }
    res.json(await comDetalhes(inscricoes));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar inscrições' });
  }
});

// POST /api/apps/assistencia-social/programas/inscricoes
router.post('/inscricoes', async (req, res) => {
  try {
    const { programaId, familiaId, beneficiarioId } = req.body;
    if (!programaId || !familiaId || !beneficiarioId) {
      return res
        .status(400)
        .json({ error: 'programaId, familiaId e beneficiarioId são obrigatórios' });
    }
    const inscricao = await programaSocialService.createInscricao(req.body);
    res.status(201).json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar inscrição' });
  }
});

// GET /api/apps/assistencia-social/programas/inscricoes/:id
router.get('/inscricoes/:id', async (req, res) => {
  try {
    const inscricao = await programaSocialService.findById(req.params.id);
    if (!inscricao) return res.status(404).json({ error: 'Inscrição não encontrada' });
    const [comDados] = await comDetalhes([inscricao]);
    res.json(comDados);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar inscrição' });
  }
});

// POST /api/apps/assistencia-social/programas/inscricoes/:id/analisar
router.post('/inscricoes/:id/analisar', async (req, res) => {
  try {
    const inscricao = await programaSocialService.analisarInscricao({
      inscricaoId: req.params.id,
      analistaId: req.body.analistaId || (req as any).userId,
      aprovado: !!req.body.aprovado,
      justificativa: req.body.justificativa,
    });
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao analisar inscrição' });
  }
});

// POST /api/apps/assistencia-social/programas/inscricoes/:id/aprovar
router.post('/inscricoes/:id/aprovar', async (req, res) => {
  try {
    const inscricao = await programaSocialService.aprovarInscricao({
      inscricaoId: req.params.id,
      gestorId: req.body.gestorId || (req as any).userId,
      dataInicio: req.body.dataInicio ? new Date(req.body.dataInicio) : new Date(),
      dataFim: req.body.dataFim ? new Date(req.body.dataFim) : undefined,
    });
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao aprovar inscrição' });
  }
});

// POST /api/apps/assistencia-social/programas/inscricoes/:id/suspender
router.post('/inscricoes/:id/suspender', async (req, res) => {
  try {
    res.json(
      await programaSocialService.suspenderBeneficio(
        req.params.id,
        (req as any).userId || 'sistema',
        req.body.motivo || 'Não informado'
      )
    );
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao suspender benefício' });
  }
});

// POST /api/apps/assistencia-social/programas/inscricoes/:id/reativar
router.post('/inscricoes/:id/reativar', async (req, res) => {
  try {
    res.json(
      await programaSocialService.reativarBeneficio(req.params.id, (req as any).userId || 'sistema')
    );
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao reativar benefício' });
  }
});

// POST /api/apps/assistencia-social/programas/inscricoes/:id/cancelar
router.post('/inscricoes/:id/cancelar', async (req, res) => {
  try {
    res.json(
      await programaSocialService.cancelarBeneficio(
        req.params.id,
        (req as any).userId || 'sistema',
        req.body.motivo || 'Não informado'
      )
    );
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao cancelar benefício' });
  }
});

// POST /api/apps/assistencia-social/programas/inscricoes/:id/acompanhamentos
router.post('/inscricoes/:id/acompanhamentos', async (req, res) => {
  try {
    const acompanhamento = await programaSocialService.registrarAcompanhamento({
      inscricaoId: req.params.id,
      assistenteSocialId: req.body.assistenteSocialId || (req as any).userId,
      dataVisita: req.body.dataVisita ? new Date(req.body.dataVisita) : new Date(),
      tipoAcompanhamento: req.body.tipoAcompanhamento || 'VISITA',
      condicoesFamiliares: req.body.condicoesFamiliares,
      necessidadesIdentificadas: req.body.necessidadesIdentificadas,
      acoesRealizadas: req.body.acoesRealizadas,
      proximaVisita: req.body.proximaVisita ? new Date(req.body.proximaVisita) : undefined,
      observacoes: req.body.observacoes,
    });
    res.status(201).json(acompanhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao registrar acompanhamento' });
  }
});

// POST /api/apps/assistencia-social/programas/inscricoes/:id/pagamentos
router.post('/inscricoes/:id/pagamentos', async (req, res) => {
  try {
    if (!req.body.mesReferencia || !req.body.valor) {
      return res.status(400).json({ error: 'mesReferencia e valor são obrigatórios' });
    }
    const pagamento = await programaSocialService.registrarPagamento({
      inscricaoId: req.params.id,
      mesReferencia: req.body.mesReferencia,
      valor: Number(req.body.valor),
      mecanismoPagamento: req.body.mecanismoPagamento || 'DINHEIRO',
      comprovante: req.body.comprovante,
    });
    res.status(201).json(pagamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao registrar pagamento' });
  }
});

// POST /api/apps/assistencia-social/programas/pagamentos/:pagamentoId/confirmar
router.post('/pagamentos/:pagamentoId/confirmar', async (req, res) => {
  try {
    res.json(await programaSocialService.confirmarPagamento(req.params.pagamentoId));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao confirmar pagamento' });
  }
});

// GET /api/apps/assistencia-social/programas/stats
router.get('/stats', async (_req, res) => {
  try {
    const [porStatus, totalProgramas, pagamentosMes] = await Promise.all([
      prisma.inscricaoProgramaSocial.groupBy({ by: ['status'], _count: true }),
      prisma.programaSocial.count({ where: { isActive: true } }),
      prisma.pagamentoBeneficio.aggregate({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { valor: true },
        _count: true,
      }),
    ]);
    res.json({
      inscricoesPorStatus: porStatus.map((s) => ({ status: s.status, total: s._count })),
      totalProgramas,
      pagamentosNoMes: pagamentosMes._count,
      valorPagoNoMes: pagamentosMes._sum.valor || 0,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao obter estatísticas' });
  }
});

export default router;
