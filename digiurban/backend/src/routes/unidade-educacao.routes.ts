import { Router } from 'express';
import unidadeEducacaoService from '../services/unidade-educacao/unidade-educacao.service';

const router = Router();

// ============================================================================
// MS-07: GESTÃO DE UNIDADES EDUCACIONAIS
// ============================================================================

// Criar unidade educacional
router.post('/unidades', async (req, res) => {
  try {
    const unidade = await unidadeEducacaoService.createUnidade(req.body);
    res.status(201).json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todas as unidades (com filtros)
router.get('/unidades', async (req, res) => {
  try {
    const { tipo, bairro, nivelEnsino, turno, isActive } = req.query;

    const filters: any = {};
    if (tipo) filters.tipo = tipo as string;
    if (bairro) filters.bairro = bairro as string;
    if (nivelEnsino) filters.nivelEnsino = nivelEnsino as string;
    if (turno) filters.turno = turno as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const unidades = await unidadeEducacaoService.listUnidades(filters);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar unidades ativas
router.get('/unidades/ativas', async (req, res) => {
  try {
    const { tipo } = req.query;
    const unidades = await unidadeEducacaoService.listUnidadesAtivas(tipo as string);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por tipo
router.get('/unidades/tipo/:tipo', async (req, res) => {
  try {
    const unidades = await unidadeEducacaoService.findUnidadesByTipo(req.params.tipo);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por bairro
router.get('/unidades/bairro/:bairro', async (req, res) => {
  try {
    const unidades = await unidadeEducacaoService.findUnidadesByBairro(req.params.bairro);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por nível de ensino
router.get('/unidades/nivel-ensino/:nivelEnsino', async (req, res) => {
  try {
    const unidades = await unidadeEducacaoService.findUnidadesByNivelEnsino(req.params.nivelEnsino);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidades por turno
router.get('/unidades/turno/:turno', async (req, res) => {
  try {
    const unidades = await unidadeEducacaoService.findUnidadesByTurno(req.params.turno);
    res.json(unidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Estatísticas
router.get('/unidades/statistics', async (req, res) => {
  try {
    const stats = await unidadeEducacaoService.getStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar unidade por ID
router.get('/unidades/:id', async (req, res) => {
  try {
    const unidade = await unidadeEducacaoService.findUnidadeById(req.params.id);
    res.json(unidade);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Atualizar unidade
router.put('/unidades/:id', async (req, res) => {
  try {
    const unidade = await unidadeEducacaoService.updateUnidade(req.params.id, req.body);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar nível de ensino
router.post('/unidades/:id/niveis-ensino', async (req, res) => {
  try {
    const { nivelEnsino } = req.body;
    const unidade = await unidadeEducacaoService.addNivelEnsino(req.params.id, nivelEnsino);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remover nível de ensino
router.delete('/unidades/:id/niveis-ensino/:nivelEnsino', async (req, res) => {
  try {
    const unidade = await unidadeEducacaoService.removeNivelEnsino(
      req.params.id,
      req.params.nivelEnsino
    );
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar turno
router.post('/unidades/:id/turnos', async (req, res) => {
  try {
    const { turno } = req.body;
    const unidade = await unidadeEducacaoService.addTurno(req.params.id, turno);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remover turno
router.delete('/unidades/:id/turnos/:turno', async (req, res) => {
  try {
    const unidade = await unidadeEducacaoService.removeTurno(req.params.id, req.params.turno);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar vagas
router.patch('/unidades/:id/vagas', async (req, res) => {
  try {
    const { vagas } = req.body;
    const unidade = await unidadeEducacaoService.updateVagas(req.params.id, vagas);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Desativar unidade
router.patch('/unidades/:id/deactivate', async (req, res) => {
  try {
    const unidade = await unidadeEducacaoService.deactivateUnidade(req.params.id);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reativar unidade
router.patch('/unidades/:id/reactivate', async (req, res) => {
  try {
    const unidade = await unidadeEducacaoService.reactivateUnidade(req.params.id);
    res.json(unidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar unidade
router.delete('/unidades/:id', async (req, res) => {
  try {
    const result = await unidadeEducacaoService.deleteUnidade(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
