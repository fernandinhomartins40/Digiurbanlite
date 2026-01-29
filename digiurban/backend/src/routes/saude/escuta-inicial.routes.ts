import { Router } from 'express';
import escutaInicialService from '../../services/saude/escuta-inicial.service';

const router = Router();

// POST /api/saude/escuta-inicial - Criar escuta inicial
router.post('/', async (req, res) => {
  try {
    const escuta = await escutaInicialService.criar(req.body);
    res.status(201).json(escuta);
  } catch (error) {
    console.error('Erro ao criar escuta inicial:', error);
    res.status(500).json({ error: 'Erro ao criar escuta inicial' });
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
    res.status(500).json({ error: 'Erro ao buscar escuta inicial' });
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
    res.status(500).json({ error: 'Erro ao listar escutas iniciais' });
  }
});

export default router;
