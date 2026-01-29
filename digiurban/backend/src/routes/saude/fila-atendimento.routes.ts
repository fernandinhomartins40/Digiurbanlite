import { Router } from 'express';
import filaAtendimentoService from '../../services/saude/fila-atendimento.service';

const router = Router();

// POST /api/saude/fila-atendimento - Adicionar paciente à fila
router.post('/', async (req, res) => {
  try {
    const fila = await filaAtendimentoService.adicionarNaFila(req.body);
    res.status(201).json(fila);
  } catch (error) {
    console.error('Erro ao adicionar na fila:', error);
    res.status(500).json({ error: 'Erro ao adicionar paciente na fila' });
  }
});

// GET /api/saude/fila-atendimento - Listar fila por unidade
router.get('/', async (req, res) => {
  try {
    const { unidadeId, data } = req.query;
    const fila = await filaAtendimentoService.listarFilaPorUnidade(
      unidadeId as string,
      data ? new Date(data as string) : undefined
    );
    res.json(fila);
  } catch (error) {
    console.error('Erro ao listar fila:', error);
    res.status(500).json({ error: 'Erro ao listar fila de atendimento' });
  }
});

// PATCH /api/saude/fila-atendimento/:id/status - Atualizar status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const fila = await filaAtendimentoService.atualizarStatus(id, status);
    res.json(fila);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// POST /api/saude/fila-atendimento/chamar-proximo - Chamar próximo paciente
router.post('/chamar-proximo', async (req, res) => {
  try {
    const { unidadeId, profissionalId } = req.body;
    const proximo = await filaAtendimentoService.chamarProximo(unidadeId, profissionalId);
    res.json(proximo);
  } catch (error) {
    console.error('Erro ao chamar próximo:', error);
    res.status(500).json({ error: 'Erro ao chamar próximo paciente' });
  }
});

// GET /api/saude/fila-atendimento/estatisticas - Estatísticas
router.get('/estatisticas', async (req, res) => {
  try {
    const { unidadeId, dataInicio, dataFim } = req.query;
    const stats = await filaAtendimentoService.obterEstatisticas(
      unidadeId as string,
      new Date(dataInicio as string),
      new Date(dataFim as string)
    );
    res.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

export default router;
