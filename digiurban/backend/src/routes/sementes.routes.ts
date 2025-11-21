import { Router } from 'express';
import sementesService from '../services/sementes/sementes.service';

const router = Router();

// ============================================================================
// MS-03: DISTRIBUIÇÃO DE SEMENTES E MUDAS
// ============================================================================

// ========== ESTOQUE ==========

// Criar item de estoque
router.post('/estoque-sementes', async (req, res) => {
  try {
    const estoque = await sementesService.createEstoque(req.body);
    res.status(201).json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar estoque ativo
router.get('/estoque-sementes', async (req, res) => {
  try {
    const estoque = await sementesService.listEstoqueAtivo();
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar por tipo (SEMENTE ou MUDA)
router.get('/estoque-sementes/tipo/:tipo', async (req, res) => {
  try {
    const tipo = req.params.tipo as 'SEMENTE' | 'MUDA';
    const estoque = await sementesService.listByTipo(tipo);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar estoque baixo
router.get('/estoque-sementes/baixo', async (req, res) => {
  try {
    const estoque = await sementesService.listEstoqueBaixo();
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar próximos ao vencimento
router.get('/estoque-sementes/vencimento', async (req, res) => {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias as string) : 30;
    const estoque = await sementesService.listProximosVencimento(dias);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Estatísticas de estoque
router.get('/estoque-sementes/statistics', async (req, res) => {
  try {
    const stats = await sementesService.getEstoqueStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar item de estoque por ID
router.get('/estoque-sementes/:id', async (req, res) => {
  try {
    const estoque = await sementesService.findEstoqueById(req.params.id);
    res.json(estoque);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Buscar por lote
router.get('/estoque-sementes/lote/:numeroLote', async (req, res) => {
  try {
    const estoque = await sementesService.findByLote(req.params.numeroLote);
    res.json(estoque);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Atualizar item de estoque
router.put('/estoque-sementes/:id', async (req, res) => {
  try {
    const estoque = await sementesService.updateEstoque(req.params.id, req.body);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar quantidade (entrada)
router.post('/estoque-sementes/:id/adicionar', async (req, res) => {
  try {
    const { quantidade } = req.body;
    const estoque = await sementesService.addQuantidade(req.params.id, quantidade);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ========== DISTRIBUIÇÃO ==========

// Criar distribuição
router.post('/distribuicoes-sementes', async (req, res) => {
  try {
    const distribuicao = await sementesService.createDistribuicao(req.body);
    res.status(201).json(distribuicao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar distribuições
router.get('/distribuicoes-sementes', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    const filters: any = {};
    if (dataInicio) filters.dataInicio = new Date(dataInicio as string);
    if (dataFim) filters.dataFim = new Date(dataFim as string);

    const distribuicoes = await sementesService.listDistribuicoes(filters);
    res.json(distribuicoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar distribuições por produtor
router.get('/distribuicoes-sementes/produtor/:produtorId', async (req, res) => {
  try {
    const distribuicoes = await sementesService.findDistribuicoesByProdutor(
      req.params.produtorId
    );
    res.json(distribuicoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Estatísticas de distribuição
router.get('/distribuicoes-sementes/statistics', async (req, res) => {
  try {
    const ano = req.query.ano ? parseInt(req.query.ano as string) : undefined;
    const stats = await sementesService.getDistribuicaoStatistics(ano);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar distribuição por ID
router.get('/distribuicoes-sementes/:id', async (req, res) => {
  try {
    const distribuicao = await sementesService.findDistribuicaoById(req.params.id);
    res.json(distribuicao);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Cancelar distribuição
router.delete('/distribuicoes-sementes/:id', async (req, res) => {
  try {
    const result = await sementesService.cancelarDistribuicao(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
