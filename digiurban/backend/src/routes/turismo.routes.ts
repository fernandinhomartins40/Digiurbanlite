import { Router } from 'express';
import turismoService from '../services/turismo/turismo.service';
const router = Router();

// Estabelecimentos
router.post('/estabelecimentos', async (req, res) => { try { res.status(201).json(await turismoService.createEstabelecimentoTuristico(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/estabelecimentos', async (req, res) => { try { res.json(await turismoService.listEstabelecimentosTuristicos(req.query.tipo as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/estabelecimentos/:id', async (req, res) => { try { res.json(await turismoService.updateEstabelecimentoTuristico(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Guias
router.post('/guias', async (req, res) => { try { res.status(201).json(await turismoService.createGuiaTuristico(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/guias', async (req, res) => { try { res.json(await turismoService.listGuiasTuristicos()); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/guias/:id', async (req, res) => { try { res.json(await turismoService.updateGuiaTuristico(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Pontos Turísticos
router.post('/pontos', async (req, res) => { try { res.status(201).json(await turismoService.createPontoTuristico(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/pontos', async (req, res) => { try { res.json(await turismoService.listPontosTuristicos(req.query.tipo as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/pontos/:id', async (req, res) => { try { res.json(await turismoService.updatePontoTuristico(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Eventos
router.post('/eventos', async (req, res) => { try { res.status(201).json(await turismoService.createEventoTuristico(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/eventos', async (req, res) => { try { res.json(await turismoService.listEventosTuristicos()); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/eventos/:id', async (req, res) => { try { res.json(await turismoService.updateEventoTuristico(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

router.get('/estatisticas', async (req, res) => { try { res.json(await turismoService.getEstatisticasTurismo()); } catch (error: any) { res.status(400).json({ error: error.message }); } });

export default router;
