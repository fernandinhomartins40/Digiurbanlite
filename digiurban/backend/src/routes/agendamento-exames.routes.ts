import { Router } from 'express';
import agendamentoExamesService from '../services/agendamento-exames/agendamento-exames.service';

const router = Router();

router.post('/solicitacoes', async (req, res) => {
  try {
    const solicitacao = await agendamentoExamesService.createSolicitacao(req.body);
    res.status(201).json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/solicitacoes/:id', async (req, res) => {
  try {
    const solicitacao = await agendamentoExamesService.findSolicitacaoById(req.params.id);
    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });
    res.json(solicitacao);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/solicitacoes/cidadao/:citizenId', async (req, res) => {
  try {
    const solicitacoes = await agendamentoExamesService.findSolicitacoesByCitizen(req.params.citizenId);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/solicitacoes/status/:status', async (req, res) => {
  try {
    const solicitacoes = await agendamentoExamesService.findSolicitacoesByStatus(req.params.status as any);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/agendamentos', async (req, res) => {
  try {
    const agendamento = await agendamentoExamesService.agendarExame(req.body);
    res.status(201).json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/agendamentos/:id/confirmar', async (req, res) => {
  try {
    const agendamento = await agendamentoExamesService.confirmarAgendamento(req.params.id);
    res.json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/agendamentos/:id/registrar-realizacao', async (req, res) => {
  try {
    const agendamento = await agendamentoExamesService.registrarRealizacao({
      agendamentoId: req.params.id,
      ...req.body,
    });
    res.json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/agendamentos/:id/anexar-laudo', async (req, res) => {
  try {
    const agendamento = await agendamentoExamesService.anexarLaudo({
      agendamentoId: req.params.id,
      ...req.body,
    });
    res.json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/agendamentos/:id/entregar-resultado', async (req, res) => {
  try {
    const agendamento = await agendamentoExamesService.marcarResultadoEntregue(req.params.id);
    res.json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/agendamentos/dia/:data', async (req, res) => {
  try {
    const data = new Date(req.params.data);
    const agendamentos = await agendamentoExamesService.getAgendamentosDoDia(data);
    res.json(agendamentos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
