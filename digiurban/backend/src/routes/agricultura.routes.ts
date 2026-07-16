import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth';
import agriculturaService from '../services/agricultura/agricultura.service';

/**
 * App Agricultura (Fase 1C) — rotas no contrato exato da UI existente
 * (frontend lib/hooks/use-agricultura-api.ts). Prefixo: /api/agricultura
 */
const router = Router();
router.use(authenticateAdmin);

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro na operação' });
  }
};

// ==================== PRODUTORES ====================

// Rotas fixas ANTES de /:id
router.get(
  '/produtores/statistics',
  handle(async (_req, res) => res.json(await agriculturaService.getProdutorStatistics()))
);

router.get(
  '/produtores',
  handle(async (req, res) => {
    const { isActive, search } = req.query;
    res.json(
      await agriculturaService.listProdutores({
        isActive: isActive === undefined ? undefined : isActive === 'true',
        search: (search as string) || undefined,
      })
    );
  })
);

router.post(
  '/produtores',
  handle(async (req, res) => res.status(201).json(await agriculturaService.createProdutor(req.body)))
);

router.get(
  '/produtores/:id',
  handle(async (req, res) => {
    const produtor = await agriculturaService.findProdutorById(req.params.id);
    if (!produtor) return res.status(404).json({ error: 'Produtor não encontrado' });
    res.json(produtor);
  })
);

router.put(
  '/produtores/:id',
  handle(async (req, res) => res.json(await agriculturaService.updateProdutor(req.params.id, req.body)))
);

router.delete(
  '/produtores/:id',
  handle(async (req, res) => res.json(await agriculturaService.deactivateProdutor(req.params.id)))
);

router.post(
  '/produtores/:id/carteirinha',
  handle(async (req, res) => res.json(await agriculturaService.emitirCarteirinha(req.params.id)))
);

router.post(
  '/produtores/:id/foto',
  handle(async (req, res) => {
    if (!req.body?.fotoUrl) return res.status(400).json({ error: 'fotoUrl é obrigatória' });
    res.json(await agriculturaService.setFotoProdutor(req.params.id, req.body.fotoUrl));
  })
);

// ==================== PROPRIEDADES ====================

router.get(
  '/propriedades/statistics',
  handle(async (_req, res) => res.json(await agriculturaService.getPropriedadeStatistics()))
);

router.get(
  '/propriedades',
  handle(async (req, res) => {
    const { produtorId, isActive } = req.query;
    res.json(
      await agriculturaService.listPropriedades({
        produtorId: (produtorId as string) || undefined,
        isActive: isActive === undefined ? undefined : isActive === 'true',
      })
    );
  })
);

router.post(
  '/propriedades',
  handle(async (req, res) =>
    res.status(201).json(await agriculturaService.createPropriedade(req.body))
  )
);

router.get(
  '/propriedades/:id',
  handle(async (req, res) => {
    const propriedade = await agriculturaService.findPropriedadeById(req.params.id);
    if (!propriedade) return res.status(404).json({ error: 'Propriedade não encontrada' });
    res.json(propriedade);
  })
);

router.put(
  '/propriedades/:id',
  handle(async (req, res) =>
    res.json(await agriculturaService.updatePropriedade(req.params.id, req.body))
  )
);

router.post(
  '/propriedades/:id/fotos',
  handle(async (req, res) =>
    res.json(await agriculturaService.addFotoPropriedade(req.params.id, req.body))
  )
);

// ==================== ESTOQUE DE SEMENTES/MUDAS ====================

router.get(
  '/estoque-sementes/statistics',
  handle(async (_req, res) => res.json(await agriculturaService.getEstoqueStatistics()))
);

router.get(
  '/estoque-sementes/baixo',
  handle(async (_req, res) => res.json(await agriculturaService.getEstoqueBaixo()))
);

router.get(
  '/estoque-sementes',
  handle(async (_req, res) => res.json(await agriculturaService.listEstoque()))
);

router.post(
  '/estoque-sementes',
  handle(async (req, res) => res.status(201).json(await agriculturaService.createEstoque(req.body)))
);

router.get(
  '/estoque-sementes/:id',
  handle(async (req, res) => {
    const item = await agriculturaService.findEstoqueById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item de estoque não encontrado' });
    res.json(item);
  })
);

router.put(
  '/estoque-sementes/:id',
  handle(async (req, res) => res.json(await agriculturaService.updateEstoque(req.params.id, req.body)))
);

// ==================== DISTRIBUIÇÕES ====================

router.get(
  '/distribuicoes-sementes/statistics',
  handle(async (req, res) => {
    const ano = req.query.ano ? Number(req.query.ano) : undefined;
    res.json(await agriculturaService.getDistribuicaoStatistics(ano));
  })
);

router.get(
  '/distribuicoes-sementes',
  handle(async (req, res) => {
    const { produtorId, estoqueId, safra } = req.query;
    res.json(
      await agriculturaService.listDistribuicoes({
        produtorId: (produtorId as string) || undefined,
        estoqueId: (estoqueId as string) || undefined,
        safra: (safra as string) || undefined,
      })
    );
  })
);

router.post(
  '/distribuicoes-sementes',
  handle(async (req, res) =>
    res.status(201).json(
      await agriculturaService.createDistribuicao({
        ...req.body,
        responsavelId: req.body?.responsavelId || (req as any).userId,
      })
    )
  )
);

// ==================== TÉCNICOS ====================

router.get(
  '/tecnicos',
  handle(async (_req, res) => res.json(await agriculturaService.listTecnicos()))
);

router.post(
  '/tecnicos',
  handle(async (req, res) => res.status(201).json(await agriculturaService.createTecnico(req.body)))
);

router.get(
  '/tecnicos/:id',
  handle(async (req, res) => {
    const tecnico = await agriculturaService.findTecnicoById(req.params.id);
    if (!tecnico) return res.status(404).json({ error: 'Técnico não encontrado' });
    res.json(tecnico);
  })
);

// ==================== SOLICITAÇÕES DE ASSISTÊNCIA ====================

router.get(
  '/solicitacoes-assistencia/statistics',
  handle(async (req, res) => {
    const ano = req.query.ano ? Number(req.query.ano) : undefined;
    res.json(await agriculturaService.getSolicitacaoStatistics(ano));
  })
);

router.get(
  '/solicitacoes-assistencia',
  handle(async (req, res) => {
    const { status, produtorId, tecnicoId } = req.query;
    res.json(
      await agriculturaService.listSolicitacoes({
        status: (status as string) || undefined,
        produtorId: (produtorId as string) || undefined,
        tecnicoId: (tecnicoId as string) || undefined,
      })
    );
  })
);

router.post(
  '/solicitacoes-assistencia',
  handle(async (req, res) =>
    res.status(201).json(await agriculturaService.createSolicitacao(req.body))
  )
);

router.get(
  '/solicitacoes-assistencia/:id',
  handle(async (req, res) => {
    const solicitacao = await agriculturaService.findSolicitacaoById(req.params.id);
    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });
    res.json(solicitacao);
  })
);

router.put(
  '/solicitacoes-assistencia/:id',
  handle(async (req, res) =>
    res.json(await agriculturaService.updateSolicitacao(req.params.id, req.body))
  )
);

// ==================== VISITAS ====================

router.post(
  '/visitas-assistencia',
  handle(async (req, res) => res.status(201).json(await agriculturaService.createVisita(req.body)))
);

router.get(
  '/visitas-assistencia/:id',
  handle(async (req, res) => {
    const visita = await agriculturaService.findVisitaById(req.params.id);
    if (!visita) return res.status(404).json({ error: 'Visita não encontrada' });
    res.json(visita);
  })
);

router.put(
  '/visitas-assistencia/:id',
  handle(async (req, res) => res.json(await agriculturaService.updateVisita(req.params.id, req.body)))
);

router.patch(
  '/visitas-assistencia/:id/confirmar',
  handle(async (req, res) => res.json(await agriculturaService.confirmarVisita(req.params.id)))
);

router.patch(
  '/visitas-assistencia/:id/iniciar',
  handle(async (req, res) => res.json(await agriculturaService.iniciarVisita(req.params.id)))
);

router.patch(
  '/visitas-assistencia/:id/concluir',
  handle(async (req, res) => res.json(await agriculturaService.concluirVisita(req.params.id, req.body)))
);

export default router;
