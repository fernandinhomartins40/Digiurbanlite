import { Router } from 'express';
import equipeService from '../../services/saude/equipe-saude.service';

const router = Router();

// POST /api/saude/equipes - Criar equipe
router.post('/', async (req, res) => {
  try {
    const equipe = await equipeService.criar(req.body);
    res.status(201).json(equipe);
  } catch (error) {
    console.error('Erro ao criar equipe:', error);
    res.status(500).json({ error: 'Erro ao criar equipe' });
  }
});

// GET /api/saude/equipes - Listar equipes
router.get('/', async (req, res) => {
  try {
    const { unidadeId } = req.query;
    const equipes = await equipeService.listar(unidadeId as string);
    res.json(equipes);
  } catch (error) {
    console.error('Erro ao listar equipes:', error);
    res.status(500).json({ error: 'Erro ao listar equipes' });
  }
});

// GET /api/saude/equipes/:id - Buscar equipe por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipe = await equipeService.buscarPorId(id);
    res.json(equipe);
  } catch (error) {
    console.error('Erro ao buscar equipe:', error);
    res.status(500).json({ error: 'Erro ao buscar equipe' });
  }
});

// PATCH /api/saude/equipes/:id - Atualizar equipe
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipe = await equipeService.atualizar(id, req.body);
    res.json(equipe);
  } catch (error) {
    console.error('Erro ao atualizar equipe:', error);
    res.status(500).json({ error: 'Erro ao atualizar equipe' });
  }
});

// DELETE /api/saude/equipes/:id - Desativar equipe
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const equipe = await equipeService.desativar(id);
    res.json(equipe);
  } catch (error) {
    console.error('Erro ao desativar equipe:', error);
    res.status(500).json({ error: 'Erro ao desativar equipe' });
  }
});

// Microáreas
// POST /api/saude/equipes/:id/microareas - Criar microárea
router.post('/:id/microareas', async (req, res) => {
  try {
    const { id } = req.params;
    const microarea = await equipeService.criarMicroarea({ ...req.body, equipeId: id });
    res.status(201).json(microarea);
  } catch (error) {
    console.error('Erro ao criar microárea:', error);
    res.status(500).json({ error: 'Erro ao criar microárea' });
  }
});

// GET /api/saude/equipes/:id/microareas - Listar microáreas
router.get('/:id/microareas', async (req, res) => {
  try {
    const { id } = req.params;
    const microareas = await equipeService.listarMicroareas(id);
    res.json(microareas);
  } catch (error) {
    console.error('Erro ao listar microáreas:', error);
    res.status(500).json({ error: 'Erro ao listar microáreas' });
  }
});

export default router;
