import { Router } from 'express';
import matriculaService from '../services/matricula/matricula.service';

const router = Router();

router.post('/inscricoes', async (req, res) => {
  try {
    const inscricao = await matriculaService.createInscricao(req.body);
    res.status(201).json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/inscricoes/:id', async (req, res) => {
  try {
    const inscricao = await matriculaService.findById(req.params.id);
    if (!inscricao) return res.status(404).json({ error: 'Inscrição não encontrada' });
    res.json(inscricao);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inscricoes/aluno/:alunoId', async (req, res) => {
  try {
    const inscricoes = await matriculaService.findByAluno(req.params.alunoId);
    res.json(inscricoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/inscricoes/status/:status', async (req, res) => {
  try {
    const inscricoes = await matriculaService.findByStatus(req.params.status as any);
    res.json(inscricoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/inscricoes/:id/validar-documentos', async (req, res) => {
  try {
    const inscricao = await matriculaService.validarDocumentos({
      inscricaoId: req.params.id,
      ...req.body,
    });
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/inscricoes/:id/atribuir-vaga', async (req, res) => {
  try {
    const inscricao = await matriculaService.atribuirVaga({
      inscricaoId: req.params.id,
      ...req.body,
    });
    res.json(inscricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/inscricoes/:id/confirmar', async (req, res) => {
  try {
    const matricula = await matriculaService.confirmarMatricula({
      inscricaoId: req.params.id,
      ...req.body,
    });
    res.status(201).json(matricula);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
