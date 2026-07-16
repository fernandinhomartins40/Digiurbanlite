import { Router } from 'express';
import unidadeCRASService from '../../services/unidade-cras/unidade-cras.service';

const router = Router();

// GET /api/apps/assistencia-social/unidades/stats
router.get('/stats', async (_req, res) => {
  try {
    res.json(await unidadeCRASService.getStatistics());
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao obter estatísticas' });
  }
});

// GET /api/apps/assistencia-social/unidades
router.get('/', async (req, res) => {
  try {
    const { tipo, bairro, ativas } = req.query;
    if (ativas === 'true') {
      return res.json(await unidadeCRASService.listUnidadesAtivas(tipo as string | undefined));
    }
    res.json(
      await unidadeCRASService.listUnidades({
        tipo: tipo as string | undefined,
        bairro: bairro as string | undefined,
      } as any)
    );
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar unidades' });
  }
});

// POST /api/apps/assistencia-social/unidades
router.post('/', async (req, res) => {
  try {
    res.status(201).json(await unidadeCRASService.createUnidade(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar unidade' });
  }
});

// GET /api/apps/assistencia-social/unidades/:id
router.get('/:id', async (req, res) => {
  try {
    const unidade = await unidadeCRASService.findUnidadeById(req.params.id);
    if (!unidade) return res.status(404).json({ error: 'Unidade não encontrada' });
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar unidade' });
  }
});

// PUT /api/apps/assistencia-social/unidades/:id
router.put('/:id', async (req, res) => {
  try {
    res.json(await unidadeCRASService.updateUnidade(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar unidade' });
  }
});

// DELETE /api/apps/assistencia-social/unidades/:id (desativa)
router.delete('/:id', async (req, res) => {
  try {
    res.json(await unidadeCRASService.deactivateUnidade(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao desativar unidade' });
  }
});

export default router;
