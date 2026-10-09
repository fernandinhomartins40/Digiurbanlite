import { Router } from 'express';
import { sendError } from '../../utils/explain-error';
import triagemService from '../../services/saude/triagem-enfermagem.service';

const router = Router();

// POST /api/saude/triagem - Criar triagem
router.post('/', async (req, res) => {
  try {
    // Quem registra a triagem é o profissional logado (antes a tela mandava um
    // id fixo que não existe e a gravação falhava sempre)
    const triagem = await triagemService.criar({ ...req.body, enfermeiroId: (req as any).userId });
    res.status(201).json(triagem);
  } catch (error) {
    console.error('Erro ao criar triagem:', error);
    sendError(res, error, 'Erro ao criar triagem');
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
    sendError(res, error, 'Erro ao buscar triagem');
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
    sendError(res, error, 'Erro ao listar triagens');
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
    sendError(res, error, 'Erro ao obter estatísticas');
  }
});

export default router;
