import { Router } from 'express';
import unidadeEducacaoService from '../../services/unidade-educacao/unidade-educacao.service';

const router = Router();

// GET /api/apps/educacao/unidades/stats
router.get('/stats', async (_req, res) => {
  try {
    res.json(await unidadeEducacaoService.getStatistics());
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao obter estatísticas' });
  }
});

// GET /api/apps/educacao/unidades
router.get('/', async (req, res) => {
  try {
    const { tipo, bairro, nivelEnsino, turno, ativas } = req.query;
    if (ativas === 'true') {
      return res.json(await unidadeEducacaoService.listUnidadesAtivas(tipo as string | undefined));
    }
    res.json(
      await unidadeEducacaoService.listUnidades({
        tipo: tipo as string | undefined,
        bairro: bairro as string | undefined,
        nivelEnsino: nivelEnsino as string | undefined,
        turno: turno as string | undefined,
      } as any)
    );
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar unidades' });
  }
});

// POST /api/apps/educacao/unidades
router.post('/', async (req, res) => {
  try {
    res.status(201).json(await unidadeEducacaoService.createUnidade(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar unidade' });
  }
});

// GET /api/apps/educacao/unidades/:id
router.get('/:id', async (req, res) => {
  try {
    const unidade = await unidadeEducacaoService.findUnidadeById(req.params.id);
    if (!unidade) return res.status(404).json({ error: 'Unidade não encontrada' });
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar unidade' });
  }
});

// PUT /api/apps/educacao/unidades/:id
router.put('/:id', async (req, res) => {
  try {
    res.json(await unidadeEducacaoService.updateUnidade(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar unidade' });
  }
});

// DELETE /api/apps/educacao/unidades/:id (desativa)
router.delete('/:id', async (req, res) => {
  try {
    res.json(await unidadeEducacaoService.deactivateUnidade(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao desativar unidade' });
  }
});

export default router;
