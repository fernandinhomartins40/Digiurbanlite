import { Router } from 'express';
import prontuarioService from '../services/prontuario/prontuario.service';

const router = Router();

// ==================== GESTÃO DE ATENDIMENTOS ====================

/**
 * POST /api/prontuario/atendimentos
 * Iniciar novo atendimento (Check-in)
 */
router.post('/atendimentos', async (req, res) => {
  try {
    const atendimento = await prontuarioService.iniciarAtendimento(req.body);
    res.status(201).json(atendimento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/prontuario/atendimentos/:id
 * Buscar atendimento por ID
 */
router.get('/atendimentos/:id', async (req, res) => {
  try {
    const atendimento = await prontuarioService.findById(req.params.id);
    if (!atendimento) {
      return res.status(404).json({ error: 'Atendimento não encontrado' });
    }
    res.json(atendimento);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/prontuario/atendimentos/cidadao/:citizenId
 * Buscar atendimentos por cidadão
 */
router.get('/atendimentos/cidadao/:citizenId', async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const atendimentos = await prontuarioService.findByCitizen(req.params.citizenId, limit);
    res.json(atendimentos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/prontuario/fila/:unidadeId
 * Buscar fila de atendimento
 */
router.get('/fila/:unidadeId', async (req, res) => {
  try {
    const status = req.query.status as any;
    const fila = await prontuarioService.getFilaAtendimento(req.params.unidadeId, status);
    res.json(fila);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/prontuario/atendimentos/:id/finalizar
 * Finalizar atendimento completo
 */
router.put('/atendimentos/:id/finalizar', async (req, res) => {
  try {
    const atendimento = await prontuarioService.finalizarAtendimento(
      req.params.id,
      req.body.userId
    );
    res.json(atendimento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== TRIAGEM ====================

/**
 * POST /api/prontuario/triagem
 * Realizar triagem de enfermagem
 */
router.post('/triagem', async (req, res) => {
  try {
    const triagem = await prontuarioService.realizarTriagem(req.body);
    res.status(201).json(triagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== CONSULTA MÉDICA ====================

/**
 * GET /api/prontuario/proximo-paciente/:medicoId
 * Chamar próximo paciente da fila
 */
router.get('/proximo-paciente/:medicoId', async (req, res) => {
  try {
    const unidadeId = req.query.unidadeId as string;
    if (!unidadeId) {
      return res.status(400).json({ error: 'unidadeId é obrigatório' });
    }
    const atendimento = await prontuarioService.chamarProximoPaciente(
      req.params.medicoId,
      unidadeId
    );
    res.json(atendimento);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/prontuario/consultas
 * Iniciar consulta médica
 */
router.post('/consultas', async (req, res) => {
  try {
    const consulta = await prontuarioService.iniciarConsulta(req.body);
    res.status(201).json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/prontuario/consultas/:id/finalizar
 * Finalizar consulta médica
 */
router.put('/consultas/:id/finalizar', async (req, res) => {
  try {
    const consulta = await prontuarioService.finalizarConsulta({
      consultaId: req.params.id,
      ...req.body,
    });
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/prontuario/consultas/medico/:medicoId
 * Buscar consultas por médico
 */
router.get('/consultas/medico/:medicoId', async (req, res) => {
  try {
    const dataInicio = req.query.dataInicio
      ? new Date(req.query.dataInicio as string)
      : undefined;
    const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
    const consultas = await prontuarioService.findByMedico(
      req.params.medicoId,
      dataInicio,
      dataFim
    );
    res.json(consultas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PRESCRIÇÕES ====================

/**
 * POST /api/prontuario/prescricoes
 * Adicionar prescrição
 */
router.post('/prescricoes', async (req, res) => {
  try {
    const prescricao = await prontuarioService.adicionarPrescricao(req.body);
    res.status(201).json(prescricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== EXAMES ====================

/**
 * POST /api/prontuario/exames
 * Solicitar exame
 */
router.post('/exames', async (req, res) => {
  try {
    const exame = await prontuarioService.solicitarExame(req.body);
    res.status(201).json(exame);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ATESTADOS ====================

/**
 * POST /api/prontuario/atestados
 * Emitir atestado médico
 */
router.post('/atestados', async (req, res) => {
  try {
    const atestado = await prontuarioService.emitirAtestado({
      ...req.body,
      dataInicio: new Date(req.body.dataInicio),
    });
    res.status(201).json(atestado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ESTATÍSTICAS ====================

/**
 * GET /api/prontuario/estatisticas/:unidadeId
 * Estatísticas de atendimento
 */
router.get('/estatisticas/:unidadeId', async (req, res) => {
  try {
    const dataInicio = new Date(req.query.dataInicio as string);
    const dataFim = new Date(req.query.dataFim as string);
    const stats = await prontuarioService.getEstatisticas(
      req.params.unidadeId,
      dataInicio,
      dataFim
    );
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
