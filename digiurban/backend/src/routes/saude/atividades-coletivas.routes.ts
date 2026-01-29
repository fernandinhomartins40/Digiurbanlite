import { Router } from 'express';
import atividadeService from '../../services/saude/atividade-coletiva.service';

const router = Router();

// POST /api/saude/atividades-coletivas - Criar atividade
router.post('/', async (req, res) => {
  try {
    const atividade = await atividadeService.criar(req.body);
    res.status(201).json(atividade);
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({ error: 'Erro ao criar atividade coletiva' });
  }
});

// GET /api/saude/atividades-coletivas - Listar atividades
router.get('/', async (req, res) => {
  try {
    const { unidadeId, tipo, status, dataInicio, dataFim } = req.query;
    const atividades = await atividadeService.listar({
      unidadeId: unidadeId as string,
      tipo: tipo as string,
      status: status as string,
      dataInicio: dataInicio ? new Date(dataInicio as string) : undefined,
      dataFim: dataFim ? new Date(dataFim as string) : undefined,
    });
    res.json(atividades);
  } catch (error) {
    console.error('Erro ao listar atividades:', error);
    res.status(500).json({ error: 'Erro ao listar atividades' });
  }
});

// GET /api/saude/atividades-coletivas/:id - Buscar por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const atividade = await atividadeService.buscarPorId(id);
    res.json(atividade);
  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    res.status(500).json({ error: 'Erro ao buscar atividade' });
  }
});

// POST /api/saude/atividades-coletivas/:id/profissionais - Adicionar profissional
router.post('/:id/profissionais', async (req, res) => {
  try {
    const { id } = req.params;
    const { profissionalId, funcao } = req.body;
    const prof = await atividadeService.adicionarProfissional(id, profissionalId, funcao);
    res.status(201).json(prof);
  } catch (error) {
    console.error('Erro ao adicionar profissional:', error);
    res.status(500).json({ error: 'Erro ao adicionar profissional' });
  }
});

// POST /api/saude/atividades-coletivas/:id/participantes - Adicionar participante
router.post('/:id/participantes', async (req, res) => {
  try {
    const { id } = req.params;
    const participante = await atividadeService.adicionarParticipante(id, req.body);
    res.status(201).json(participante);
  } catch (error) {
    console.error('Erro ao adicionar participante:', error);
    res.status(500).json({ error: 'Erro ao adicionar participante' });
  }
});

// PATCH /api/saude/atividades-coletivas/:id/status - Atualizar status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const atividade = await atividadeService.atualizarStatus(id, status);
    res.json(atividade);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

export default router;
