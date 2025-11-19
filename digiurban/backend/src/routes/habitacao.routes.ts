import { Router } from 'express';
import habitacaoService from '../services/habitacao/habitacao.service';

const router = Router();

// MS-37: Conjuntos
router.post('/conjuntos', async (req, res) => {
  try {
    res.status(201).json(await habitacaoService.createConjuntoHabitacional(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/conjuntos', async (req, res) => {
  try {
    res.json(await habitacaoService.listConjuntosHabitacionais());
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/conjuntos/:id', async (req, res) => {
  try {
    res.json(await habitacaoService.findConjuntoHabitacionalById(req.params.id));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/conjuntos/:id', async (req, res) => {
  try {
    res.json(await habitacaoService.updateConjuntoHabitacional(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// MS-38: Inscrições
router.post('/inscricoes', async (req, res) => {
  try {
    res.status(201).json(await habitacaoService.createInscricaoHabitacao(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/inscricoes', async (req, res) => {
  try {
    res.json(await habitacaoService.listInscricoesHabitacao(req.query.status as string));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/inscricoes/:id', async (req, res) => {
  try {
    res.json(await habitacaoService.findInscricaoHabitacaoById(req.params.id));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/inscricoes/:id', async (req, res) => {
  try {
    res.json(await habitacaoService.updateInscricaoHabitacao(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/inscricoes/:id/calcular-pontuacao', async (req, res) => {
  try {
    res.json(await habitacaoService.calcularPontuacao(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/inscricoes-ranking', async (req, res) => {
  try {
    res.json(await habitacaoService.getRankingInscricoes(parseInt(req.query.limit as string) || 100));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// MS-39: Obras
router.post('/obras', async (req, res) => {
  try {
    res.status(201).json(await habitacaoService.createObraHabitacional(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/obras', async (req, res) => {
  try {
    res.json(await habitacaoService.listObrasHabitacionais(req.query.status as string));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/obras/:id', async (req, res) => {
  try {
    res.json(await habitacaoService.findObraHabitacionalById(req.params.id));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/obras/:id', async (req, res) => {
  try {
    res.json(await habitacaoService.updateObraHabitacional(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/obras/:id/iniciar', async (req, res) => {
  try {
    res.json(await habitacaoService.iniciarObra(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/obras/:id/finalizar', async (req, res) => {
  try {
    res.json(await habitacaoService.finalizarObra(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Estatísticas
router.get('/estatisticas', async (req, res) => {
  try {
    res.json(await habitacaoService.getEstatisticasHabitacao());
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
