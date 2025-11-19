import { Router } from 'express';
import agriculturaService from '../services/agricultura/agricultura.service';

const router = Router();

// ===== MS-22: VISITAS TÉCNICAS =====
router.post('/visitas-tecnicas', async (req, res) => {
  try {
    const visita = await agriculturaService.createVisitaTecnica(req.body);
    res.status(201).json(visita);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/visitas-tecnicas', async (req, res) => {
  try {
    const { produtorId, tecnicoId } = req.query;
    const visitas = await agriculturaService.listVisitasTecnicas(
      produtorId as string,
      tecnicoId as string
    );
    res.json(visitas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/visitas-tecnicas/:id', async (req, res) => {
  try {
    const visita = await agriculturaService.updateVisitaTecnica(req.params.id, req.body);
    res.json(visita);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-23: PRODUÇÃO AGRÍCOLA =====
router.post('/producao', async (req, res) => {
  try {
    const registro = await agriculturaService.createRegistroProducao(req.body);
    res.status(201).json(registro);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/producao', async (req, res) => {
  try {
    const { produtorId, safra, produto } = req.query;
    const registros = await agriculturaService.listRegistrosProducao(
      produtorId as string,
      safra as string,
      produto as string
    );
    res.json(registros);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/producao/estatisticas', async (req, res) => {
  try {
    const { safra } = req.query;
    const stats = await agriculturaService.getEstatisticasProducao(safra as string);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-24: FEIRAS =====
router.post('/feiras', async (req, res) => {
  try {
    const feira = await agriculturaService.createFeira(req.body);
    res.status(201).json(feira);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/feiras', async (req, res) => {
  try {
    const { isActive } = req.query;
    const feiras = await agriculturaService.listFeiras(
      isActive !== undefined ? isActive === 'true' : undefined
    );
    res.json(feiras);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/feiras/:id', async (req, res) => {
  try {
    const feira = await agriculturaService.findFeiraById(req.params.id);
    res.json(feira);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/feiras/:id', async (req, res) => {
  try {
    const feira = await agriculturaService.updateFeira(req.params.id, req.body);
    res.json(feira);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/feiras/:feiraId/boxes', async (req, res) => {
  try {
    const box = await agriculturaService.createBoxFeira(req.params.feiraId, req.body);
    res.status(201).json(box);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/feiras/:feiraId/boxes', async (req, res) => {
  try {
    const boxes = await agriculturaService.listBoxesFeira(req.params.feiraId);
    res.json(boxes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/boxes/:boxId/alocar', async (req, res) => {
  try {
    const { produtorId } = req.body;
    const box = await agriculturaService.alocarProdutorBox(req.params.boxId, produtorId);
    res.json(box);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/boxes/:boxId/desalocar', async (req, res) => {
  try {
    const box = await agriculturaService.desalocarBox(req.params.boxId);
    res.json(box);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/feiras/:feiraId/estatisticas', async (req, res) => {
  try {
    const stats = await agriculturaService.getEstatisticasFeira(req.params.feiraId);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
