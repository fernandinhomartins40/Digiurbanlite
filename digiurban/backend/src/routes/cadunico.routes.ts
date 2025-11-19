import { Router } from 'express';
import cadunicoService from '../services/cadunico/cadunico.service';

const router = Router();

router.post('/familias', async (req, res) => {
  try {
    const familia = await cadunicoService.createFamilia(req.body);
    res.status(201).json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/familias/:id', async (req, res) => {
  try {
    const familia = await cadunicoService.findById(req.params.id);
    if (!familia) return res.status(404).json({ error: 'Família não encontrada' });
    res.json(familia);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/familias/responsavel/:responsavelId', async (req, res) => {
  try {
    const familias = await cadunicoService.findByResponsavel(req.params.responsavelId);
    res.json(familias);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/familias/numero/:numeroCadUnico', async (req, res) => {
  try {
    const familia = await cadunicoService.findByNumeroCadUnico(req.params.numeroCadUnico);
    if (!familia) return res.status(404).json({ error: 'Família não encontrada' });
    res.json(familia);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/familias/status/:status', async (req, res) => {
  try {
    const familias = await cadunicoService.findByStatus(req.params.status as any);
    res.json(familias);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/familias/:id/agendar-entrevista', async (req, res) => {
  try {
    const familia = await cadunicoService.agendarEntrevista({
      familiaId: req.params.id,
      ...req.body,
    });
    res.json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/familias/:id/realizar-entrevista', async (req, res) => {
  try {
    const familia = await cadunicoService.realizarEntrevista({
      familiaId: req.params.id,
      ...req.body,
    });
    res.json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/familias/:id/validar-dados', async (req, res) => {
  try {
    const familia = await cadunicoService.validarDados({
      familiaId: req.params.id,
      ...req.body,
    });
    res.json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/familias/:id/ativar', async (req, res) => {
  try {
    const { userId } = req.body;
    const familia = await cadunicoService.ativarCadastro(req.params.id, userId);
    res.json(familia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
