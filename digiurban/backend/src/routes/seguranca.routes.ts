import { Router } from 'express';
import segurancaService from '../services/seguranca/seguranca.service';
const router = Router();

// Viaturas
router.post('/viaturas', async (req, res) => { try { res.status(201).json(await segurancaService.createViatura(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/viaturas', async (req, res) => { try { res.json(await segurancaService.listViaturas(req.query.tipo as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/viaturas/:id', async (req, res) => { try { res.json(await segurancaService.updateViatura(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Ocorrências
router.post('/ocorrencias', async (req, res) => { try { res.status(201).json(await segurancaService.createOcorrencia(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/ocorrencias', async (req, res) => { try { res.json(await segurancaService.listOcorrencias(req.query.tipo as string, req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/ocorrencias/:id', async (req, res) => { try { res.json(await segurancaService.updateOcorrencia(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.patch('/ocorrencias/:id/finalizar', async (req, res) => { try { res.json(await segurancaService.finalizarOcorrencia(req.params.id)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Rotas de Patrulha
router.post('/rotas-patrulha', async (req, res) => { try { res.status(201).json(await segurancaService.createRotaPatrulha(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/rotas-patrulha', async (req, res) => { try { res.json(await segurancaService.listRotasPatrulha(req.query.turno as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/rotas-patrulha/:id', async (req, res) => { try { res.json(await segurancaService.updateRotaPatrulha(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Câmeras
router.post('/cameras', async (req, res) => { try { res.status(201).json(await segurancaService.createCamera(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/cameras', async (req, res) => { try { res.json(await segurancaService.listCameras(req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/cameras/:id', async (req, res) => { try { res.json(await segurancaService.updateCamera(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

router.get('/estatisticas', async (req, res) => { try { res.json(await segurancaService.getEstatisticasSeguranca()); } catch (error: any) { res.status(400).json({ error: error.message }); } });

export default router;
