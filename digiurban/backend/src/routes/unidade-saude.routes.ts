import { Router } from 'express';
import unidadeSaudeService from '../services/unidade-saude/unidade-saude.service';

const router = Router();

// ============================================================================
// MS-01: GESTÃO DE UNIDADES DE SAÚDE
// ============================================================================

// Criar unidade de saúde
router.post('/unidades', async (req, res) => {
  try {
    const unidade = await unidadeSaudeService.createUnidade(req.body);
    res.status(201).json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todas as unidades (com filtros)
router.get('/unidades', async (req, res) => {
  try {
    const { tipo, bairro, especialidade, isActive } = req.query;

    const filters: any = {};
    if (tipo) filters.tipo = tipo as string;
    if (bairro) filters.bairro = bairro as string;
    if (especialidade) filters.especialidade = especialidade as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const unidades = await unidadeSaudeService.listUnidades(filters);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar unidades ativas
router.get('/unidades/ativas', async (req, res) => {
  try {
    const { tipo } = req.query;
    const unidades = await unidadeSaudeService.listUnidadesAtivas(tipo as string);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por tipo
router.get('/unidades/tipo/:tipo', async (req, res) => {
  try {
    const unidades = await unidadeSaudeService.findUnidadesByTipo(req.params.tipo);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por bairro
router.get('/unidades/bairro/:bairro', async (req, res) => {
  try {
    const unidades = await unidadeSaudeService.findUnidadesByBairro(req.params.bairro);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por especialidade
router.get('/unidades/especialidade/:especialidade', async (req, res) => {
  try {
    const unidades = await unidadeSaudeService.findUnidadesByEspecialidade(req.params.especialidade);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Estatísticas
router.get('/unidades/statistics', async (req, res) => {
  try {
    const stats = await unidadeSaudeService.getStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidade por ID
router.get('/unidades/:id', async (req, res) => {
  try {
    const unidade = await unidadeSaudeService.findUnidadeById(req.params.id);
    res.json(unidade);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Atualizar unidade
router.put('/unidades/:id', async (req, res) => {
  try {
    const unidade = await unidadeSaudeService.updateUnidade(req.params.id, req.body);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar especialidade
router.post('/unidades/:id/especialidades', async (req, res) => {
  try {
    const { especialidade } = req.body;
    const unidade = await unidadeSaudeService.addEspecialidade(req.params.id, especialidade);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remover especialidade
router.delete('/unidades/:id/especialidades/:especialidade', async (req, res) => {
  try {
    const unidade = await unidadeSaudeService.removeEspecialidade(
      req.params.id,
      req.params.especialidade
    );
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Desativar unidade
router.patch('/unidades/:id/deactivate', async (req, res) => {
  try {
    const unidade = await unidadeSaudeService.deactivateUnidade(req.params.id);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reativar unidade
router.patch('/unidades/:id/reactivate', async (req, res) => {
  try {
    const unidade = await unidadeSaudeService.reactivateUnidade(req.params.id);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar unidade
router.delete('/unidades/:id', async (req, res) => {
  try {
    const result = await unidadeSaudeService.deleteUnidade(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
