import { Router } from 'express';
import assistenciaTecnicaService from '../services/assistencia-tecnica/assistencia-tecnica.service';

const router = Router();

// ============================================================================
// MS-04: ASSISTÊNCIA TÉCNICA RURAL (ATER)
// ============================================================================

// ========== TÉCNICOS ==========

router.post('/tecnicos', async (req, res) => {
  try {
    const tecnico = await assistenciaTecnicaService.createTecnico(req.body);
    res.status(201).json(tecnico);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tecnicos', async (req, res) => {
  try {
    const tecnicos = await assistenciaTecnicaService.listTecnicosAtivos();
    res.json(tecnicos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tecnicos/especialidade/:especialidade', async (req, res) => {
  try {
    const tecnicos = await assistenciaTecnicaService.listByEspecialidade(req.params.especialidade);
    res.json(tecnicos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tecnicos/:id', async (req, res) => {
  try {
    const tecnico = await assistenciaTecnicaService.findTecnicoById(req.params.id);
    res.json(tecnico);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/tecnicos/:id', async (req, res) => {
  try {
    const tecnico = await assistenciaTecnicaService.updateTecnico(req.params.id, req.body);
    res.json(tecnico);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/tecnicos/:id/deactivate', async (req, res) => {
  try {
    const tecnico = await assistenciaTecnicaService.deactivateTecnico(req.params.id);
    res.json(tecnico);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ========== SOLICITAÇÕES ==========

router.post('/solicitacoes-assistencia', async (req, res) => {
  try {
    const solicitacao = await assistenciaTecnicaService.createSolicitacao(req.body);
    res.status(201).json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/solicitacoes-assistencia', async (req, res) => {
  try {
    const { status, urgente, tipoAssistencia } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (urgente !== undefined) filters.urgente = urgente === 'true';
    if (tipoAssistencia) filters.tipoAssistencia = tipoAssistencia;

    const solicitacoes = await assistenciaTecnicaService.listSolicitacoes(filters);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/solicitacoes-assistencia/produtor/:produtorId', async (req, res) => {
  try {
    const solicitacoes = await assistenciaTecnicaService.findSolicitacoesByProdutor(
      req.params.produtorId
    );
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/solicitacoes-assistencia/statistics', async (req, res) => {
  try {
    const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
    const stats = await assistenciaTecnicaService.getStatistics(ano);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/solicitacoes-assistencia/:id', async (req, res) => {
  try {
    const solicitacao = await assistenciaTecnicaService.findSolicitacaoById(req.params.id);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/solicitacoes-assistencia/:id', async (req, res) => {
  try {
    const solicitacao = await assistenciaTecnicaService.updateSolicitacao(req.params.id, req.body);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/solicitacoes-assistencia/:id/cancelar', async (req, res) => {
  try {
    const solicitacao = await assistenciaTecnicaService.cancelarSolicitacao(req.params.id);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ========== VISITAS ==========

router.post('/visitas-assistencia', async (req, res) => {
  try {
    const visita = await assistenciaTecnicaService.createVisita(req.body);
    res.status(201).json(visita);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/visitas-assistencia/tecnico/:tecnicoId', async (req, res) => {
  try {
    const { status } = req.query;
    const filters: any = {};
    if (status) filters.status = status;

    const visitas = await assistenciaTecnicaService.findVisitasByTecnico(req.params.tecnicoId, filters);
    res.json(visitas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/visitas-assistencia/data/:data', async (req, res) => {
  try {
    const data = new Date(req.params.data);
    const visitas = await assistenciaTecnicaService.findVisitasPorData(data);
    res.json(visitas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/visitas-assistencia/:id', async (req, res) => {
  try {
    const visita = await assistenciaTecnicaService.findVisitaById(req.params.id);
    res.json(visita);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/visitas-assistencia/:id', async (req, res) => {
  try {
    const visita = await assistenciaTecnicaService.updateVisita(req.params.id, req.body);
    res.json(visita);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/visitas-assistencia/:id/confirmar', async (req, res) => {
  try {
    const visita = await assistenciaTecnicaService.confirmarVisita(req.params.id);
    res.json(visita);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/visitas-assistencia/:id/iniciar', async (req, res) => {
  try {
    const visita = await assistenciaTecnicaService.iniciarVisita(req.params.id);
    res.json(visita);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/visitas-assistencia/:id/concluir', async (req, res) => {
  try {
    const visita = await assistenciaTecnicaService.concluirVisita(req.params.id, req.body);
    res.json(visita);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
