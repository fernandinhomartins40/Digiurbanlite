import { Router } from 'express';
import portalProfessorService from '../services/portal-professor/portal-professor.service';

const router = Router();

// ============================================================================
// MS-11: PORTAL DO PROFESSOR - ROTAS
// ============================================================================

// ===== DIÁRIO DE CLASSE =====

router.post('/diarios', async (req, res) => {
  try {
    const diario = await portalProfessorService.createDiario(req.body);
    res.status(201).json(diario);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/diarios', async (req, res) => {
  try {
    const { professorId, unidadeEducacaoId } = req.query;
    const diarios = await portalProfessorService.listDiarios(
      professorId as string,
      unidadeEducacaoId as string
    );
    res.json(diarios);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/diarios/:id', async (req, res) => {
  try {
    const diario = await portalProfessorService.findDiarioById(req.params.id);
    res.json(diario);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// ===== AULAS =====

router.post('/diarios/:diarioId/aulas', async (req, res) => {
  try {
    const aula = await portalProfessorService.createAula(req.params.diarioId, req.body);
    res.status(201).json(aula);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/diarios/:diarioId/aulas', async (req, res) => {
  try {
    const aulas = await portalProfessorService.listAulas(req.params.diarioId);
    res.json(aulas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/aulas/:id', async (req, res) => {
  try {
    const aula = await portalProfessorService.updateAula(req.params.id, req.body);
    res.json(aula);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== FREQUÊNCIAS =====

router.post('/aulas/:aulaId/frequencias', async (req, res) => {
  try {
    const frequencias = await portalProfessorService.registrarFrequencia(
      req.params.aulaId,
      req.body.frequencias
    );
    res.status(201).json(frequencias);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/frequencias/:id', async (req, res) => {
  try {
    const frequencia = await portalProfessorService.updateFrequencia(req.params.id, req.body);
    res.json(frequencia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/diarios/:diarioId/alunos/:alunoId/frequencias', async (req, res) => {
  try {
    const resultado = await portalProfessorService.getFrequenciasPorAluno(
      req.params.diarioId,
      req.params.alunoId
    );
    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== AVALIAÇÕES =====

router.post('/diarios/:diarioId/avaliacoes', async (req, res) => {
  try {
    const avaliacao = await portalProfessorService.createAvaliacao(req.params.diarioId, req.body);
    res.status(201).json(avaliacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/diarios/:diarioId/avaliacoes', async (req, res) => {
  try {
    const avaliacoes = await portalProfessorService.listAvaliacoes(req.params.diarioId);
    res.json(avaliacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/avaliacoes/:id', async (req, res) => {
  try {
    const avaliacao = await portalProfessorService.updateAvaliacao(req.params.id, req.body);
    res.json(avaliacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== NOTAS =====

router.post('/avaliacoes/:avaliacaoId/notas', async (req, res) => {
  try {
    const notas = await portalProfessorService.lancarNotas(
      req.params.avaliacaoId,
      req.body.notas
    );
    res.status(201).json(notas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/notas/:id', async (req, res) => {
  try {
    const nota = await portalProfessorService.updateNota(req.params.id, req.body);
    res.json(nota);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/diarios/:diarioId/alunos/:alunoId/media', async (req, res) => {
  try {
    const media = await portalProfessorService.calcularMediaAluno(
      req.params.diarioId,
      req.params.alunoId
    );
    res.json(media);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== RELATÓRIOS =====

router.get('/diarios/:diarioId/alunos/:alunoId/boletim', async (req, res) => {
  try {
    const boletim = await portalProfessorService.getBoletimAluno(
      req.params.diarioId,
      req.params.alunoId
    );
    res.json(boletim);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/diarios/:diarioId/mapa-notas', async (req, res) => {
  try {
    const mapa = await portalProfessorService.getMapaNotas(req.params.diarioId);
    res.json(mapa);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
