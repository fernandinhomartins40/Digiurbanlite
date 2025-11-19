import { Router } from 'express';
import agendaMedicaService from '../services/agenda-medica/agenda-medica.service';

const router = Router();

// ==================== GESTÃO DE AGENDAS ====================

/**
 * POST /api/agenda-medica
 * Criar nova agenda médica
 */
router.post('/', async (req, res) => {
  try {
    const agenda = await agendaMedicaService.createAgenda(req.body);
    res.status(201).json(agenda);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/agenda-medica/:id
 * Buscar agenda por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const agenda = await agendaMedicaService.findById(req.params.id);
    if (!agenda) {
      return res.status(404).json({ error: 'Agenda não encontrada' });
    }
    res.json(agenda);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agenda-medica/profissional/:profissionalId
 * Buscar agendas por profissional
 */
router.get('/profissional/:profissionalId', async (req, res) => {
  try {
    const agendas = await agendaMedicaService.findByProfissional(req.params.profissionalId);
    res.json(agendas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agenda-medica/unidade/:unidadeId
 * Buscar agendas por unidade
 */
router.get('/unidade/:unidadeId', async (req, res) => {
  try {
    const diaSemana = req.query.diaSemana ? Number(req.query.diaSemana) : undefined;
    const agendas = await agendaMedicaService.findByUnidade(req.params.unidadeId, diaSemana);
    res.json(agendas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/agenda-medica/:id
 * Atualizar agenda
 */
router.put('/:id', async (req, res) => {
  try {
    const agenda = await agendaMedicaService.update(req.params.id, req.body);
    res.json(agenda);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/agenda-medica/:id
 * Desativar agenda
 */
router.delete('/:id', async (req, res) => {
  try {
    const agenda = await agendaMedicaService.deactivate(req.params.id);
    res.json(agenda);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/agenda-medica/:id/horarios-disponiveis
 * Verificar horários disponíveis
 */
router.get('/:id/horarios-disponiveis', async (req, res) => {
  try {
    const data = new Date(req.query.data as string);
    const horarios = await agendaMedicaService.getHorariosDisponiveis(req.params.id, data);
    res.json(horarios);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== GESTÃO DE CONSULTAS ====================

/**
 * POST /api/agenda-medica/consultas
 * Agendar consulta
 */
router.post('/consultas', async (req, res) => {
  try {
    const consulta = await agendaMedicaService.agendarConsulta({
      ...req.body,
      dataHora: new Date(req.body.dataHora),
    });
    res.status(201).json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/agenda-medica/consultas/:id/confirmar
 * Confirmar consulta
 */
router.put('/consultas/:id/confirmar', async (req, res) => {
  try {
    const consulta = await agendaMedicaService.confirmarConsulta(req.params.id);
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/agenda-medica/consultas/:id/cancelar
 * Cancelar consulta
 */
router.put('/consultas/:id/cancelar', async (req, res) => {
  try {
    const consulta = await agendaMedicaService.cancelarConsulta(req.params.id, req.body);
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/agenda-medica/consultas/:id/realizada
 * Marcar consulta como realizada
 */
router.put('/consultas/:id/realizada', async (req, res) => {
  try {
    const consulta = await agendaMedicaService.marcarRealizada(req.params.id);
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/agenda-medica/consultas/:id/falta
 * Marcar falta
 */
router.put('/consultas/:id/falta', async (req, res) => {
  try {
    const consulta = await agendaMedicaService.marcarFalta(req.params.id);
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/agenda-medica/consultas/cidadao/:citizenId
 * Buscar consultas por cidadão
 */
router.get('/consultas/cidadao/:citizenId', async (req, res) => {
  try {
    const incluirHistorico = req.query.historico === 'true';
    const consultas = await agendaMedicaService.findConsultasByCitizen(
      req.params.citizenId,
      incluirHistorico
    );
    res.json(consultas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agenda-medica/:id/consultas-dia
 * Buscar consultas do dia
 */
router.get('/:id/consultas-dia', async (req, res) => {
  try {
    const data = new Date(req.query.data as string);
    const consultas = await agendaMedicaService.getConsultasDoDia(req.params.id, data);
    res.json(consultas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RELATÓRIOS ====================

/**
 * GET /api/agenda-medica/relatorios/ocupacao/:profissionalId
 * Relatório de taxa de ocupação
 */
router.get('/relatorios/ocupacao/:profissionalId', async (req, res) => {
  try {
    const dataInicio = new Date(req.query.dataInicio as string);
    const dataFim = new Date(req.query.dataFim as string);
    const relatorio = await agendaMedicaService.getRelatorioOcupacao(
      req.params.profissionalId,
      dataInicio,
      dataFim
    );
    res.json(relatorio);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
