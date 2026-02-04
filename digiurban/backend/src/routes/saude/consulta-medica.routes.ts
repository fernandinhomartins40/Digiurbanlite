import { Router } from 'express';
import consultaMedicaService from '../../services/saude/consulta-medica.service';

const router = Router();

// ─── Contexto da fila (dados paciente + histórico + problemas) ─────────────
router.get('/contexto-fila/:filaId', async (req, res) => {
  try {
    const contexto = await consultaMedicaService.buscarContextoFila(req.params.filaId);
    if (!contexto) return res.status(404).json({ error: 'Entrada na fila não encontrada' });
    res.json(contexto);
  } catch (error) {
    console.error('Erro ao buscar contexto da fila:', error);
    res.status(500).json({ error: 'Erro ao buscar contexto' });
  }
});

// ─── Criar consulta médica ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const consulta = await consultaMedicaService.criar(req.body);
    res.status(201).json(consulta);
  } catch (error: any) {
    console.error('Erro ao criar consulta:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar consulta' });
  }
});

// ─── Buscar consulta por fila ───────────────────────────────────────────────
router.get('/fila/:filaId', async (req, res) => {
  try {
    const consulta = await consultaMedicaService.buscarPorFila(req.params.filaId);
    res.json(consulta);
  } catch (error) {
    console.error('Erro ao buscar consulta:', error);
    res.status(500).json({ error: 'Erro ao buscar consulta' });
  }
});

// ─── Finalizar consulta ─────────────────────────────────────────────────────
router.post('/finalizar/:filaId', async (req, res) => {
  try {
    const result = await consultaMedicaService.finalizar(req.params.filaId);
    res.json(result);
  } catch (error: any) {
    console.error('Erro ao finalizar consulta:', error);
    res.status(500).json({ error: error.message || 'Erro ao finalizar' });
  }
});

// ─── Prescrições ────────────────────────────────────────────────────────────
router.post('/:consultaId/prescricao', async (req, res) => {
  try {
    const prescricao = await consultaMedicaService.criarPrescricao(req.params.consultaId, req.body);
    res.status(201).json(prescricao);
  } catch (error) {
    console.error('Erro ao criar prescrição:', error);
    res.status(500).json({ error: 'Erro ao criar prescrição' });
  }
});

router.get('/:consultaId/prescricoes', async (req, res) => {
  try {
    const prescricoes = await consultaMedicaService.listarPrescricoes(req.params.consultaId);
    res.json(prescricoes);
  } catch (error) {
    console.error('Erro ao listar prescrições:', error);
    res.status(500).json({ error: 'Erro ao listar prescrições' });
  }
});

// ─── Exames ─────────────────────────────────────────────────────────────────
router.post('/:consultaId/exame', async (req, res) => {
  try {
    const exame = await consultaMedicaService.criarExame(req.params.consultaId, req.body);
    res.status(201).json(exame);
  } catch (error) {
    console.error('Erro ao criar exame:', error);
    res.status(500).json({ error: 'Erro ao criar exame' });
  }
});

router.get('/:consultaId/exames', async (req, res) => {
  try {
    const exames = await consultaMedicaService.listarExames(req.params.consultaId);
    res.json(exames);
  } catch (error) {
    console.error('Erro ao listar exames:', error);
    res.status(500).json({ error: 'Erro ao listar exames' });
  }
});

// ─── Encaminhamentos ────────────────────────────────────────────────────────
router.post('/:consultaId/encaminhamento', async (req, res) => {
  try {
    const enc = await consultaMedicaService.criarEncaminhamento(req.params.consultaId, req.body);
    res.status(201).json(enc);
  } catch (error) {
    console.error('Erro ao criar encaminhamento:', error);
    res.status(500).json({ error: 'Erro ao criar encaminhamento' });
  }
});

router.get('/:consultaId/encaminhamentos', async (req, res) => {
  try {
    const encs = await consultaMedicaService.listarEncaminhamentos(req.params.consultaId);
    res.json(encs);
  } catch (error) {
    console.error('Erro ao listar encaminhamentos:', error);
    res.status(500).json({ error: 'Erro ao listar encaminhamentos' });
  }
});

// ─── Atestados ──────────────────────────────────────────────────────────────
router.post('/:consultaId/atestado', async (req, res) => {
  try {
    const atestado = await consultaMedicaService.criarAtestado(req.params.consultaId, req.body);
    res.status(201).json(atestado);
  } catch (error) {
    console.error('Erro ao criar atestado:', error);
    res.status(500).json({ error: 'Erro ao criar atestado' });
  }
});

router.get('/:consultaId/atestados', async (req, res) => {
  try {
    const atestados = await consultaMedicaService.listarAtestados(req.params.consultaId);
    res.json(atestados);
  } catch (error) {
    console.error('Erro ao listar atestados:', error);
    res.status(500).json({ error: 'Erro ao listar atestados' });
  }
});

// ─── Problemas / Condições do cidadão ──────────────────────────────────────
router.get('/problemas/:citizenId', async (req, res) => {
  try {
    const problemas = await consultaMedicaService.buscarProblemasCidadao(req.params.citizenId);
    res.json(problemas);
  } catch (error) {
    console.error('Erro ao buscar problemas:', error);
    res.status(500).json({ error: 'Erro ao buscar problemas' });
  }
});

router.post('/problemas/:citizenId', async (req, res) => {
  try {
    const problema = await consultaMedicaService.criarProblema(req.params.citizenId, req.body);
    res.status(201).json(problema);
  } catch (error) {
    console.error('Erro ao criar problema:', error);
    res.status(500).json({ error: 'Erro ao criar problema' });
  }
});

// ─── Busca de medicamentos (autocomplete) ──────────────────────────────────
router.get('/medicamentos/busca', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) return res.json([]);
    const meds = await consultaMedicaService.buscarMedicamentos(q as string);
    res.json(meds);
  } catch (error) {
    console.error('Erro ao buscar medicamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar medicamentos' });
  }
});

export default router;
