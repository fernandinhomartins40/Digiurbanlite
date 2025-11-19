import { Router } from 'express';
import portalAlunoService from '../services/portal-aluno/portal-aluno.service';

const router = Router();

// ============================================================================
// MS-12: PORTAL DO ALUNO/PAIS - ROTAS
// ============================================================================

// ===== BOLETIM =====

router.get('/alunos/:alunoId/boletim', async (req, res) => {
  try {
    const { ano, semestre } = req.query;
    const boletim = await portalAlunoService.getBoletimAluno(
      req.params.alunoId,
      parseInt(ano as string),
      semestre ? parseInt(semestre as string) : undefined
    );
    res.json(boletim);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/boletim', async (req, res) => {
  try {
    const boletim = await portalAlunoService.createBoletim(req.body);
    res.status(201).json(boletim);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/boletim/:id', async (req, res) => {
  try {
    const boletim = await portalAlunoService.updateBoletim(req.params.id, req.body);
    res.json(boletim);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== FREQUÊNCIA =====

router.get('/alunos/:alunoId/frequencia', async (req, res) => {
  try {
    const { diarioId } = req.query;
    const frequencia = await portalAlunoService.getFrequenciaAluno(
      req.params.alunoId,
      diarioId as string
    );
    res.json(frequencia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== NOTAS =====

router.get('/alunos/:alunoId/notas', async (req, res) => {
  try {
    const { diarioId } = req.query;
    const notas = await portalAlunoService.getNotasAluno(
      req.params.alunoId,
      diarioId as string
    );
    res.json(notas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== OCORRÊNCIAS =====

router.post('/ocorrencias', async (req, res) => {
  try {
    const ocorrencia = await portalAlunoService.createOcorrencia(req.body);
    res.status(201).json(ocorrencia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/alunos/:alunoId/ocorrencias', async (req, res) => {
  try {
    const { tipo } = req.query;
    const ocorrencias = await portalAlunoService.listOcorrencias(
      req.params.alunoId,
      tipo as string
    );
    res.json(ocorrencias);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/ocorrencias/:id/marcar-lida', async (req, res) => {
  try {
    const ocorrencia = await portalAlunoService.marcarOcorrenciaLida(req.params.id);
    res.json(ocorrencia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== HISTÓRICO ESCOLAR =====

router.get('/alunos/:alunoId/historico', async (req, res) => {
  try {
    const historico = await portalAlunoService.getHistoricoEscolar(req.params.alunoId);
    res.json(historico);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== CARDÁPIO =====

router.get('/unidades/:unidadeEducacaoId/cardapio-semana', async (req, res) => {
  try {
    const cardapio = await portalAlunoService.getCardapioDaSemana(req.params.unidadeEducacaoId);
    res.json(cardapio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== RESUMO =====

router.get('/alunos/:alunoId/resumo', async (req, res) => {
  try {
    const { ano } = req.query;
    const resumo = await portalAlunoService.getResumoAluno(
      req.params.alunoId,
      parseInt(ano as string)
    );
    res.json(resumo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
