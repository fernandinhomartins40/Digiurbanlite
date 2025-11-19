import { Router } from 'express';
import meioAmbienteService from '../services/meio-ambiente/meio-ambiente.service';

const router = Router();

// MS-43: Árvores
router.post('/arvores', async (req, res) => {
  try {
    res.status(201).json(await meioAmbienteService.createArvoreUrbana(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/arvores', async (req, res) => {
  try {
    res.json(await meioAmbienteService.listArvoresUrbanas(req.query.status as string));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/arvores/:id', async (req, res) => {
  try {
    res.json(await meioAmbienteService.findArvoreUrbanaById(req.params.id));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/arvores/:id', async (req, res) => {
  try {
    res.json(await meioAmbienteService.updateArvoreUrbana(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// MS-44: Parques/Praças
router.post('/parques-pracas', async (req, res) => {
  try {
    res.status(201).json(await meioAmbienteService.createParquePraca(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/parques-pracas', async (req, res) => {
  try {
    res.json(await meioAmbienteService.listParquesPracas());
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/parques-pracas/:id', async (req, res) => {
  try {
    res.json(await meioAmbienteService.findParquePracaById(req.params.id));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/parques-pracas/:id', async (req, res) => {
  try {
    res.json(await meioAmbienteService.updateParquePraca(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// MS-45: Pontos de Coleta
router.post('/pontos-coleta', async (req, res) => {
  try {
    res.status(201).json(await meioAmbienteService.createPontoColeta(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/pontos-coleta', async (req, res) => {
  try {
    res.json(await meioAmbienteService.listPontosColeta(req.query.tipoMaterial as string));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/pontos-coleta/:id', async (req, res) => {
  try {
    res.json(await meioAmbienteService.findPontoColetaById(req.params.id));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/pontos-coleta/:id', async (req, res) => {
  try {
    res.json(await meioAmbienteService.updatePontoColeta(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// MS-46: Licenças Ambientais
router.post('/licencas', async (req, res) => {
  try {
    res.status(201).json(await meioAmbienteService.createLicencaAmbiental(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/licencas', async (req, res) => {
  try {
    res.json(await meioAmbienteService.listLicencasAmbientais(req.query.status as string));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/licencas/:id', async (req, res) => {
  try {
    res.json(await meioAmbienteService.findLicencaAmbientalById(req.params.id));
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/licencas/:id', async (req, res) => {
  try {
    res.json(await meioAmbienteService.updateLicencaAmbiental(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/licencas/:id/aprovar', async (req, res) => {
  try {
    res.json(await meioAmbienteService.aprovarLicenca(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/licencas/:id/rejeitar', async (req, res) => {
  try {
    res.json(await meioAmbienteService.rejeitarLicenca(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Estatísticas
router.get('/estatisticas', async (req, res) => {
  try {
    res.json(await meioAmbienteService.getEstatisticasMeioAmbiente());
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
