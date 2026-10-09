import { Router } from 'express';
import { sendError } from '../../utils/explain-error';
import escutaInicialService from '../../services/saude/escuta-inicial.service';

const router = Router();

// POST /api/saude/escuta-inicial - Criar escuta inicial
router.post('/', async (req, res) => {
  try {
    const escuta = await escutaInicialService.criar({ ...req.body, profissionalId: req.body.profissionalId || (req as any).userId });
    res.status(201).json(escuta);
  } catch (error) {
    console.error('Erro ao criar escuta inicial:', error);
    sendError(res, error, 'Erro ao criar escuta inicial');
  }
});

// GET /api/saude/escuta-inicial/fila/:filaId - Buscar por fila
router.get('/fila/:filaId', async (req, res) => {
  try {
    const { filaId } = req.params;
    const escuta = await escutaInicialService.buscarPorFila(filaId);
    res.json(escuta);
  } catch (error) {
    console.error('Erro ao buscar escuta inicial:', error);
    sendError(res, error, 'Erro ao buscar escuta inicial');
  }
});

// GET /api/saude/escuta-inicial - Listar escutas
router.get('/', async (req, res) => {
  try {
    const { unidadeId, dataInicio, dataFim } = req.query;
    const escutas = await escutaInicialService.listar({
      unidadeId: unidadeId as string,
      dataInicio: dataInicio ? new Date(dataInicio as string) : undefined,
      dataFim: dataFim ? new Date(dataFim as string) : undefined,
    });
    res.json(escutas);
  } catch (error) {
    console.error('Erro ao listar escutas:', error);
    sendError(res, error, 'Erro ao listar escutas iniciais');
  }
});

export default router;
