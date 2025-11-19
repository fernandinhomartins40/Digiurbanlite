import { Router } from 'express';
import medicamentoService from '../services/medicamento/medicamento.service';

const router = Router();

// ==================== GESTÃO DE MEDICAMENTOS ====================

router.post('/medicamentos', async (req, res) => {
  try {
    const medicamento = await medicamentoService.createMedicamento(req.body);
    res.status(201).json(medicamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/medicamentos/:id', async (req, res) => {
  try {
    const medicamento = await medicamentoService.findById(req.params.id);
    if (!medicamento) {
      return res.status(404).json({ error: 'Medicamento não encontrado' });
    }
    res.json(medicamento);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/medicamentos/search/:termo', async (req, res) => {
  try {
    const medicamentos = await medicamentoService.search(req.params.termo);
    res.json(medicamentos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/medicamentos', async (req, res) => {
  try {
    const medicamentos = await medicamentoService.listAll();
    res.json(medicamentos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/medicamentos/:id', async (req, res) => {
  try {
    const medicamento = await medicamentoService.updateMedicamento(req.params.id, req.body);
    res.json(medicamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/medicamentos/:id', async (req, res) => {
  try {
    const medicamento = await medicamentoService.deactivate(req.params.id);
    res.json(medicamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== GESTÃO DE ESTOQUE ====================

router.post('/estoque', async (req, res) => {
  try {
    const estoque = await medicamentoService.createEstoque(req.body);
    res.status(201).json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/estoque/:id', async (req, res) => {
  try {
    const estoque = await medicamentoService.findEstoqueById(req.params.id);
    if (!estoque) {
      return res.status(404).json({ error: 'Estoque não encontrado' });
    }
    res.json(estoque);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/estoque/medicamento/:medicamentoId/unidade/:unidadeId', async (req, res) => {
  try {
    const estoque = await medicamentoService.findEstoqueByMedicamentoUnidade(
      req.params.medicamentoId,
      req.params.unidadeId
    );
    res.json(estoque);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/estoque/unidade/:unidadeId', async (req, res) => {
  try {
    const status = req.query.status as any;
    const estoque = await medicamentoService.findEstoqueByUnidade(req.params.unidadeId, status);
    res.json(estoque);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/estoque/:id', async (req, res) => {
  try {
    const estoque = await medicamentoService.updateEstoque(req.params.id, req.body);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/estoque/:id/adicionar', async (req, res) => {
  try {
    const { quantidade } = req.body;
    const estoque = await medicamentoService.adicionarQuantidade(req.params.id, quantidade);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/estoque/:id/remover', async (req, res) => {
  try {
    const { quantidade } = req.body;
    const estoque = await medicamentoService.removerQuantidade(req.params.id, quantidade);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/estoque/alertas/baixo', async (req, res) => {
  try {
    const unidadeId = req.query.unidadeId as string | undefined;
    const estoques = await medicamentoService.getEstoqueBaixo(unidadeId);
    res.json(estoques);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/estoque/alertas/vencimento', async (req, res) => {
  try {
    const unidadeId = req.query.unidadeId as string | undefined;
    const dias = req.query.dias ? Number(req.query.dias) : 30;
    const estoques = await medicamentoService.getProximosVencimento(unidadeId, dias);
    res.json(estoques);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/estoque/marcar-vencidos', async (req, res) => {
  try {
    const unidadeId = req.body.unidadeId;
    const count = await medicamentoService.marcarVencidos(unidadeId);
    res.json({ message: `${count} lote(s) marcado(s) como vencido(s)` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DISPENSAÇÃO ====================

router.post('/dispensacao', async (req, res) => {
  try {
    const dispensacao = await medicamentoService.dispensarMedicamento(req.body);
    res.status(201).json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/dispensacao/:id/confirmar', async (req, res) => {
  try {
    const dispensacao = await medicamentoService.confirmarDispensacao(req.params.id);
    res.json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/dispensacao/:id/cancelar', async (req, res) => {
  try {
    const { motivo } = req.body;
    const dispensacao = await medicamentoService.cancelarDispensacao(req.params.id, motivo);
    res.json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/dispensacao/cidadao/:citizenId', async (req, res) => {
  try {
    const dispensacoes = await medicamentoService.findDispensacoesByCitizen(req.params.citizenId);
    res.json(dispensacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dispensacao/atendimento/:atendimentoId', async (req, res) => {
  try {
    const dispensacoes = await medicamentoService.findDispensacoesByAtendimento(
      req.params.atendimentoId
    );
    res.json(dispensacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RELATÓRIOS ====================

router.get('/relatorios/consumo/:unidadeId', async (req, res) => {
  try {
    const dataInicio = new Date(req.query.dataInicio as string);
    const dataFim = new Date(req.query.dataFim as string);
    const medicamentoId = req.query.medicamentoId as string | undefined;
    const relatorio = await medicamentoService.getRelatorioConsumo(
      req.params.unidadeId,
      dataInicio,
      dataFim,
      medicamentoId
    );
    res.json(relatorio);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
