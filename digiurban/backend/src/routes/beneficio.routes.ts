import { Router } from 'express';
import beneficioService from '../services/beneficio/beneficio.service';

const router = Router();

// ===== TIPOS DE BENEFÍCIO =====
router.post('/tipos', async (req, res) => {
  try {
    const tipo = await beneficioService.createTipoBeneficio(req.body);
    res.status(201).json(tipo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tipos', async (req, res) => {
  try {
    const { categoria } = req.query;
    const tipos = await beneficioService.listTiposBeneficio(categoria as string);
    res.json(tipos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/tipos/:id', async (req, res) => {
  try {
    const tipo = await beneficioService.updateTipoBeneficio(req.params.id, req.body);
    res.json(tipo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== SOLICITAÇÕES =====
router.post('/solicitacoes', async (req, res) => {
  try {
    const solicitacao = await beneficioService.createSolicitacao(req.body);
    res.status(201).json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/solicitacoes', async (req, res) => {
  try {
    const { status, citizenId } = req.query;
    const solicitacoes = await beneficioService.listSolicitacoes(
      status as string,
      citizenId as string
    );
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/solicitacoes/:id', async (req, res) => {
  try {
    const solicitacao = await beneficioService.findSolicitacaoById(req.params.id);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/solicitacoes/:id/analisar', async (req, res) => {
  try {
    const { analisadoPor, deferido, motivoIndeferimento, valorConcedido } = req.body;
    const solicitacao = await beneficioService.analisarSolicitacao(
      req.params.id,
      analisadoPor,
      deferido,
      motivoIndeferimento,
      valorConcedido
    );
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/solicitacoes/:id/entregar', async (req, res) => {
  try {
    const solicitacao = await beneficioService.registrarEntrega(req.params.id);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const stats = await beneficioService.getStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
