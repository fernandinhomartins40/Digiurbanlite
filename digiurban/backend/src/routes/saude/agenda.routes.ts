import { Router } from 'express';
import agendaService from '../../services/saude/agenda.service';

const router = Router();

// POST /api/saude/agenda - Configurar agenda
router.post('/', async (req, res) => {
  try {
    const config = await agendaService.configurar(req.body);
    res.status(201).json(config);
  } catch (error) {
    console.error('Erro ao configurar agenda:', error);
    res.status(500).json({ error: 'Erro ao configurar agenda' });
  }
});

// GET /api/saude/agenda - Listar configurações
router.get('/', async (req, res) => {
  try {
    const { profissionalId, unidadeId, diaSemana } = req.query;
    const configs = await agendaService.listar({
      profissionalId: profissionalId as string,
      unidadeId: unidadeId as string,
      diaSemana: diaSemana ? parseInt(diaSemana as string) : undefined,
    });
    res.json(configs);
  } catch (error) {
    console.error('Erro ao listar agenda:', error);
    res.status(500).json({ error: 'Erro ao listar agenda' });
  }
});

// POST /api/saude/agenda/indisponibilidade - Marcar indisponibilidade
router.post('/indisponibilidade', async (req, res) => {
  try {
    const indisponibilidade = await agendaService.marcarIndisponibilidade(req.body);
    res.status(201).json(indisponibilidade);
  } catch (error) {
    console.error('Erro ao marcar indisponibilidade:', error);
    res.status(500).json({ error: 'Erro ao marcar indisponibilidade' });
  }
});

// GET /api/saude/agenda/indisponibilidade - Listar indisponibilidades
router.get('/indisponibilidade', async (req, res) => {
  try {
    const { profissionalId, dataInicio, dataFim } = req.query;
    const indisponibilidades = await agendaService.listarIndisponibilidades(
      profissionalId as string,
      dataInicio ? new Date(dataInicio as string) : undefined,
      dataFim ? new Date(dataFim as string) : undefined
    );
    res.json(indisponibilidades);
  } catch (error) {
    console.error('Erro ao listar indisponibilidades:', error);
    res.status(500).json({ error: 'Erro ao listar indisponibilidades' });
  }
});

export default router;
