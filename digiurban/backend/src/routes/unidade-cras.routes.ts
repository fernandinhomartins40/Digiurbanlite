import { Router } from 'express';
import unidadeCRASService from '../services/unidade-cras/unidade-cras.service';

const router = Router();

// ============================================================================
// MS-13: GESTÃO DE CRAS/CREAS
// ============================================================================

// Criar unidade CRAS/CREAS
router.post('/unidades', async (req, res) => {
  try {
    const unidade = await unidadeCRASService.createUnidade(req.body);
    res.status(201).json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todas as unidades (com filtros)
router.get('/unidades', async (req, res) => {
  try {
    const { tipo, bairro, programa, isActive } = req.query;

    const filters: any = {};
    if (tipo) filters.tipo = tipo as string;
    if (bairro) filters.bairro = bairro as string;
    if (programa) filters.programa = programa as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const unidades = await unidadeCRASService.listUnidades(filters);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar unidades ativas
router.get('/unidades/ativas', async (req, res) => {
  try {
    const { tipo } = req.query;
    const unidades = await unidadeCRASService.listUnidadesAtivas(tipo as string);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por tipo
router.get('/unidades/tipo/:tipo', async (req, res) => {
  try {
    const unidades = await unidadeCRASService.findUnidadesByTipo(req.params.tipo);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por bairro
router.get('/unidades/bairro/:bairro', async (req, res) => {
  try {
    const unidades = await unidadeCRASService.findUnidadesByBairro(req.params.bairro);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por programa
router.get('/unidades/programa/:programa', async (req, res) => {
  try {
    const unidades = await unidadeCRASService.findUnidadesByPrograma(req.params.programa);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Estatísticas
router.get('/unidades/statistics', async (req, res) => {
  try {
    const stats = await unidadeCRASService.getStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidade por ID
router.get('/unidades/:id', async (req, res) => {
  try {
    const unidade = await unidadeCRASService.findUnidadeById(req.params.id);
    res.json(unidade);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Atualizar unidade
router.put('/unidades/:id', async (req, res) => {
  try {
    const unidade = await unidadeCRASService.updateUnidade(req.params.id, req.body);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar programa
router.post('/unidades/:id/programas', async (req, res) => {
  try {
    const { programa } = req.body;
    const unidade = await unidadeCRASService.addPrograma(req.params.id, programa);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remover programa
router.delete('/unidades/:id/programas/:programa', async (req, res) => {
  try {
    const unidade = await unidadeCRASService.removePrograma(
      req.params.id,
      req.params.programa
    );
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Desativar unidade
router.patch('/unidades/:id/deactivate', async (req, res) => {
  try {
    const unidade = await unidadeCRASService.deactivateUnidade(req.params.id);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reativar unidade
router.patch('/unidades/:id/reactivate', async (req, res) => {
  try {
    const unidade = await unidadeCRASService.reactivateUnidade(req.params.id);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar unidade
router.delete('/unidades/:id', async (req, res) => {
  try {
    const result = await unidadeCRASService.deleteUnidade(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
