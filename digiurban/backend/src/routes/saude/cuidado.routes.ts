import { Router } from 'express';
import { odontoService, preNatalService, visitaDomiciliarService } from '../../services/saude/cuidado.service';

/**
 * Linhas de cuidado do Atendimento de Saúde (Fase 2 da auditoria de 2026-10-08).
 * Montado em /api/saude: /odonto, /pre-natal, /visitas-domiciliares.
 * Acesso: equipe da Saúde + ADMIN (requireDepartmentAccess no index).
 */
const router = Router();

const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Não foi possível concluir a operação' });
  }
};

const day = (value: unknown, endOfDay = false) => {
  if (!value) return undefined;
  const date = new Date(`${String(value).slice(0, 10)}T${endOfDay ? '23:59:59' : '00:00:00'}-03:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

// ---------------------------------------------------------------- odontologia
// GET /api/saude/odonto/fila?unidadeId= — pacientes do dentista logado
router.get('/odonto/fila', handle(async (req, res) => res.json(await odontoService.minhaFila(req.userId, req.query.unidadeId as string | undefined))));

// GET /api/saude/odonto/fila/:filaId — atendimento odontológico desta entrada da fila
router.get('/odonto/fila/:filaId', handle(async (req, res) => res.json(await odontoService.porFila(req.params.filaId))));

// GET /api/saude/odonto/cidadao/:citizenId — histórico odontológico
router.get('/odonto/cidadao/:citizenId', handle(async (req, res) => res.json(await odontoService.historico(req.params.citizenId))));

// POST /api/saude/odonto — salvar (finalizar: true encerra o atendimento)
router.post('/odonto', handle(async (req, res) => res.status(201).json(await odontoService.salvar(req.userId, req.body))));

// ------------------------------------------------------------------ pré-natal
router.get('/pre-natal/resumo', handle(async (_req, res) => res.json(await preNatalService.resumo())));

// GET /api/saude/pre-natal?status=EM_ANDAMENTO&risco=ALTO_RISCO
router.get(
  '/pre-natal',
  handle(async (req, res) =>
    res.json(await preNatalService.listar({ status: req.query.status as string | undefined, risco: req.query.risco as string | undefined }))
  )
);

router.post('/pre-natal', handle(async (req, res) => res.status(201).json(await preNatalService.iniciar(req.body))));

router.get(
  '/pre-natal/:id',
  handle(async (req, res) => {
    const pn = await preNatalService.buscar(req.params.id);
    if (!pn) return res.status(404).json({ error: 'Pré-natal não encontrado' });
    res.json(pn);
  })
);

router.put('/pre-natal/:id/risco', handle(async (req, res) => res.json(await preNatalService.atualizarRisco(req.params.id, req.body))));
router.post('/pre-natal/:id/consultas', handle(async (req, res) => res.status(201).json(await preNatalService.registrarConsulta(req.params.id, req.userId, req.body))));
router.post('/pre-natal/:id/exames', handle(async (req, res) => res.status(201).json(await preNatalService.solicitarExame(req.params.id, req.body))));
router.put('/pre-natal/exames/:exameId/resultado', handle(async (req, res) => res.json(await preNatalService.registrarResultado(req.params.exameId, req.body))));
router.post('/pre-natal/:id/encerrar', handle(async (req, res) => res.json(await preNatalService.encerrar(req.params.id, req.body))));

// ------------------------------------------------------- visitas domiciliares
// GET /api/saude/visitas-domiciliares/resumo?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
router.get(
  '/visitas-domiciliares/resumo',
  handle(async (req, res) => {
    const fim = day(req.query.fim, true) || new Date();
    const inicio = day(req.query.inicio) || new Date(fim.getTime() - 30 * 24 * 60 * 60 * 1000);
    res.json(await visitaDomiciliarService.resumo(inicio, fim));
  })
);

// GET /api/saude/visitas-domiciliares?minhas=true&citizenId=&inicio=&fim=&encaminhadas=true
router.get(
  '/visitas-domiciliares',
  handle(async (req, res) =>
    res.json(
      await visitaDomiciliarService.listar({
        acsId: req.query.minhas === 'true' ? req.userId : (req.query.acsId as string | undefined),
        citizenId: req.query.citizenId as string | undefined,
        inicio: day(req.query.inicio),
        fim: day(req.query.fim, true),
        encaminhadas: req.query.encaminhadas === 'true',
      })
    )
  )
);

// POST /api/saude/visitas-domiciliares — o agente logado registra a visita
router.post('/visitas-domiciliares', handle(async (req, res) => res.status(201).json(await visitaDomiciliarService.registrar(req.userId, req.body))));

export default router;
