import { Router } from 'express';
import triagemService from '../../services/saude/triagem-enfermagem.service';

const router = Router();

// POST /api/saude/triagem - Criar triagem
router.post('/', async (req, res) => {
  try {
    const triagem = await triagemService.criar(req.body);
    res.status(201).json(triagem);
  } catch (error) {
    console.error('Erro ao criar triagem:', error);
    res.status(500).json({ error: 'Erro ao criar triagem' });
  }
});

// GET /api/saude/triagem/fila/:filaId - Buscar por fila
router.get('/fila/:filaId', async (req, res) => {
  try {
    const { filaId } = req.params;
    const triagem = await triagemService.buscarPorFila(filaId);
    res.json(triagem);
  } catch (error) {
    console.error('Erro ao buscar triagem:', error);
    res.status(500).json({ error: 'Erro ao buscar triagem' });
  }
});

// GET /api/saude/triagem - Listar triagens
router.get('/', async (req, res) => {
  try {
    const { unidadeId, dataInicio, dataFim } = req.query;
    const triagens = await triagemService.listar({
      unidadeId: unidadeId as string,
      dataInicio: dataInicio ? new Date(dataInicio as string) : undefined,
      dataFim: dataFim ? new Date(dataFim as string) : undefined,
    });
    res.json(triagens);
  } catch (error) {
    console.error('Erro ao listar triagens:', error);
    res.status(500).json({ error: 'Erro ao listar triagens' });
  }
});

// GET /api/saude/triagem/estatisticas - Estatísticas de classificação
router.get('/estatisticas', async (req, res) => {
  try {
    const { unidadeId, dataInicio, dataFim } = req.query;
    const stats = await triagemService.obterEstatisticasClassificacao(
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
