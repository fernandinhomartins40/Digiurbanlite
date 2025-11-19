import { Router } from 'express';
import programaSocialService from '../services/programa-social/programa-social.service';

const router = Router();

router.post('/inscricoes', async (req, res) => {
  try {
    const inscricao = await programaSocialService.createInscricao(req.body);
    res.status(201).json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/inscricoes/:id', async (req, res) => {
  try {
    const inscricao = await programaSocialService.findById(req.params.id);
    if (!inscricao) return res.status(404).json({ error: 'Inscrição não encontrada' });
    res.json(inscricao);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inscricoes/beneficiario/:beneficiarioId', async (req, res) => {
  try {
    const inscricoes = await programaSocialService.findByBeneficiario(req.params.beneficiarioId);
    res.json(inscricoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inscricoes/familia/:familiaId', async (req, res) => {
  try {
    const inscricoes = await programaSocialService.findByFamilia(req.params.familiaId);
    res.json(inscricoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inscricoes/status/:status', async (req, res) => {
  try {
    const inscricoes = await programaSocialService.findByStatus(req.params.status as any);
    res.json(inscricoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/inscricoes/:id/analisar', async (req, res) => {
  try {
    const inscricao = await programaSocialService.analisarInscricao({
      inscricaoId: req.params.id,
      ...req.body,
    });
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/inscricoes/:id/aprovar', async (req, res) => {
  try {
    const inscricao = await programaSocialService.aprovarInscricao({
      inscricaoId: req.params.id,
      ...req.body,
    });
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/inscricoes/:id/suspender', async (req, res) => {
  try {
    const { userId, motivo } = req.body;
    const inscricao = await programaSocialService.suspenderBeneficio(req.params.id, userId, motivo);
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/inscricoes/:id/reativar', async (req, res) => {
  try {
    const { userId } = req.body;
    const inscricao = await programaSocialService.reativarBeneficio(req.params.id, userId);
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/inscricoes/:id/cancelar', async (req, res) => {
  try {
    const { userId, motivo } = req.body;
    const inscricao = await programaSocialService.cancelarBeneficio(req.params.id, userId, motivo);
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/acompanhamentos', async (req, res) => {
  try {
    const acompanhamento = await programaSocialService.registrarAcompanhamento(req.body);
    res.status(201).json(acompanhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/pagamentos', async (req, res) => {
  try {
    const pagamento = await programaSocialService.registrarPagamento(req.body);
    res.status(201).json(pagamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/pagamentos/:id/confirmar', async (req, res) => {
  try {
    const pagamento = await programaSocialService.confirmarPagamento(req.params.id);
    res.json(pagamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/relatorios/:programaId', async (req, res) => {
  try {
    const dataInicio = new Date(req.query.dataInicio as string);
    const dataFim = new Date(req.query.dataFim as string);
    const relatorio = await programaSocialService.getRelatorio(req.params.programaId, dataInicio, dataFim);
    res.json(relatorio);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
