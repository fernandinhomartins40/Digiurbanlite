import { Router } from 'express';
import atendimentoPsicossocialService from '../services/atendimento-psicossocial/atendimento-psicossocial.service';

const router = Router();

// ============================================================================
// MS-17: ATENDIMENTO PSICOSSOCIAL - ROTAS
// ============================================================================

// ===== FICHAS DE ATENDIMENTO =====

router.post('/fichas', async (req, res) => {
  try {
    const ficha = await atendimentoPsicossocialService.createFicha(req.body);
    res.status(201).json(ficha);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/fichas', async (req, res) => {
  try {
    const { citizenId, profissionalId, unidadeCRASId, statusCaso } = req.query;
    const fichas = await atendimentoPsicossocialService.listFichas(
      citizenId as string,
      profissionalId as string,
      unidadeCRASId as string,
      statusCaso as string
    );
    res.json(fichas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/fichas/:id', async (req, res) => {
  try {
    const ficha = await atendimentoPsicossocialService.findFichaById(req.params.id);
    res.json(ficha);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/fichas/:id', async (req, res) => {
  try {
    const ficha = await atendimentoPsicossocialService.updateFicha(req.params.id, req.body);
    res.json(ficha);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== ACOMPANHAMENTOS =====

router.post('/fichas/:fichaId/acompanhamentos', async (req, res) => {
  try {
    const acompanhamento = await atendimentoPsicossocialService.addAcompanhamento(
      req.params.fichaId,
      req.body
    );
    res.status(201).json(acompanhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== ENCERRAMENTO DE CASO =====

router.patch('/fichas/:id/encerrar', async (req, res) => {
  try {
    const { observacoes } = req.body;
    const ficha = await atendimentoPsicossocialService.encerrarCaso(req.params.id, observacoes);
    res.json(ficha);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== ESTATÍSTICAS =====

router.get('/estatisticas', async (req, res) => {
  try {
    const { unidadeCRASId } = req.query;
    const stats = await atendimentoPsicossocialService.getStatistics(unidadeCRASId as string);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
