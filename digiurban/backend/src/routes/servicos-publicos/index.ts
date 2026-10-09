import { Router } from 'express';
import ordemServicoService, { OS_DEPARTMENTS } from '../../services/servicos-publicos/ordem-servico.service';
import { getUserDepartmentCodes, requireDepartmentAccess } from '../../middleware/department-access';

/**
 * App Ordens de Serviço — Serviços Públicos (Fase 1D)
 * Prefixo: /api/apps/servicos-publicos
 */
const router = Router();
// Equipe da secretaria + ADMIN (antes: só ADMIN)
// O app atende várias secretarias com equipe de campo; cada pessoa vê só as OS
// das suas secretarias (ADMIN/SUPER_ADMIN veem todas)
router.use(...requireDepartmentAccess(...OS_DEPARTMENTS));
router.use(async (req: any, _res, next) => {
  try {
    const user = req.user;
    if (['ADMIN', 'SUPER_ADMIN'].includes(String(user?.role))) req.osScope = null;
    else req.osScope = (await getUserDepartmentCodes(user)).filter((code) => OS_DEPARTMENTS.includes(code));
    next();
  } catch (error) {
    next(error);
  }
});

// GET /api/apps/servicos-publicos/secretarias — secretarias de quem usa (para o filtro e a criação)
router.get('/secretarias', (req: any, res) => res.json(req.osScope || OS_DEPARTMENTS));

/** Toda ação sobre uma OS confere se ela é de uma secretaria de quem pede */
router.use('/os/:id', async (req: any, res, next) => {
  if (['mapa', 'stats'].includes(req.params.id)) return next();
  try {
    await ordemServicoService.assertScope(req.params.id, req.osScope);
    next();
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro na operação' });
  }
};

// ==================== EQUIPES ====================

// GET /api/apps/servicos-publicos/equipes — Teams ativos da secretaria
router.get(
  '/equipes',
  handle(async (req, res) => res.json(await ordemServicoService.listEquipes(req.osScope)))
);

// ==================== ORDENS DE SERVIÇO ====================

// Rotas fixas ANTES de /os/:id
router.get(
  '/os/stats',
  handle(async (req, res) => res.json(await ordemServicoService.getStatistics(req.osScope)))
);

router.get(
  '/os/mapa',
  handle(async (req, res) => res.json(await ordemServicoService.getMapa(req.osScope)))
);

// GET /api/apps/servicos-publicos/os?status=&tipo=&bairro=&prioridade=&equipeId=
router.get(
  '/os',
  handle(async (req, res) => {
    const { status, tipo, bairro, prioridade, equipeId } = req.query;
    res.json(
      await ordemServicoService.listOrdens({
        status: (status as string) || undefined,
        tipo: (tipo as string) || undefined,
        bairro: (bairro as string) || undefined,
        prioridade: (prioridade as string) || undefined,
        equipeId: (equipeId as string) || undefined,
        departmentCode: (req.query.departmentCode as string) || undefined,
      }, req.osScope)
    );
  })
);

router.post(
  '/os',
  handle(async (req, res) => {
    // nova OS só numa secretaria de quem cria
    const permitidas: string[] = req.osScope || OS_DEPARTMENTS;
    const pedida = String(req.body?.departmentCode || permitidas[0] || '').toUpperCase();
    if (!permitidas.includes(pedida)) return res.status(403).json({ error: 'Escolha uma secretaria sua' });
    res.status(201).json(await ordemServicoService.createOrdem({ ...req.body, departmentCode: pedida }));
  })
);

router.get(
  '/os/:id',
  handle(async (req, res) => {
    const ordem = await ordemServicoService.findById(req.params.id, req.osScope);
    if (!ordem) return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
    res.json(ordem);
  })
);

// PUT /os/:id — triagem (tipo, prioridade, SLA, local)
router.put(
  '/os/:id',
  handle(async (req, res) => res.json(await ordemServicoService.updateOrdem(req.params.id, req.body)))
);

router.post(
  '/os/:id/despachar',
  handle(async (req, res) =>
    res.json(
      await ordemServicoService.despachar(req.params.id, {
        equipeId: req.body?.equipeId,
        responsavelId: req.body?.responsavelId,
        observacoes: req.body?.observacoes,
        userId: (req as any).userId,
      })
    )
  )
);

router.post(
  '/os/:id/iniciar',
  handle(async (req, res) =>
    res.json(await ordemServicoService.iniciar(req.params.id, (req as any).userId))
  )
);

router.post(
  '/os/:id/apontamentos',
  handle(async (req, res) =>
    res.status(201).json(
      await ordemServicoService.registrarApontamento(req.params.id, {
        ...req.body,
        userId: req.body?.userId || (req as any).userId,
      })
    )
  )
);

router.post(
  '/os/:id/concluir',
  handle(async (req, res) =>
    res.json(
      await ordemServicoService.concluir(req.params.id, {
        ...req.body,
        userId: req.body?.userId || (req as any).userId,
      })
    )
  )
);

router.post(
  '/os/:id/cancelar',
  handle(async (req, res) =>
    res.json(
      await ordemServicoService.cancelar(req.params.id, {
        motivo: req.body?.motivo,
        userId: (req as any).userId,
      })
    )
  )
);

export default router;
