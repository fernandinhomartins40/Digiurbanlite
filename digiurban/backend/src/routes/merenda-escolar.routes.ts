import { Router } from 'express';
import merendaEscolarService from '../services/merenda-escolar/merenda-escolar.service';

const router = Router();

// ===== CARDÁPIOS =====
router.post('/cardapios', async (req, res) => {
  try {
    const cardapio = await merendaEscolarService.createCardapio(req.body);
    res.status(201).json(cardapio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/cardapios', async (req, res) => {
  try {
    const { unidadeEducacaoId, diaSemana } = req.query;
    const cardapios = await merendaEscolarService.listCardapios(
      unidadeEducacaoId as string,
      diaSemana ? parseInt(diaSemana as string) : undefined
    );
    res.json(cardapios);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/cardapios/:id', async (req, res) => {
  try {
    const cardapio = await merendaEscolarService.findCardapioById(req.params.id);
    res.json(cardapio);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/cardapios/:id', async (req, res) => {
  try {
    const cardapio = await merendaEscolarService.updateCardapio(req.params.id, req.body);
    res.json(cardapio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/cardapios/:id', async (req, res) => {
  try {
    const result = await merendaEscolarService.deleteCardapio(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== ESTOQUE =====
router.post('/estoque', async (req, res) => {
  try {
    const estoque = await merendaEscolarService.createEstoqueAlimento(req.body);
    res.status(201).json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/estoque', async (req, res) => {
  try {
    const { categoria } = req.query;
    const estoque = await merendaEscolarService.listEstoque(categoria as string);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/estoque/vencimento/:dias', async (req, res) => {
  try {
    const dias = parseInt(req.params.dias);
    const estoque = await merendaEscolarService.listEstoqueProximoVencimento(dias);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/estoque/:id/ajustar', async (req, res) => {
  try {
    const { ajuste } = req.body;
    const estoque = await merendaEscolarService.ajustarQuantidadeEstoque(req.params.id, ajuste);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== CONSUMO =====
router.post('/consumo', async (req, res) => {
  try {
    const consumo = await merendaEscolarService.registrarConsumo(req.body);
    res.status(201).json(consumo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/consumo', async (req, res) => {
  try {
    const { unidadeEducacaoId, dataInicio, dataFim } = req.query;
    const consumos = await merendaEscolarService.listConsumo(
      unidadeEducacaoId as string,
      dataInicio ? new Date(dataInicio as string) : undefined,
      dataFim ? new Date(dataFim as string) : undefined
    );
    res.json(consumos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/statistics', async (req, res) => {
  try {
    const { unidadeEducacaoId } = req.query;
    const stats = await merendaEscolarService.getStatistics(unidadeEducacaoId as string);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
