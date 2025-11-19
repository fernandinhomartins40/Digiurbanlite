import { Router } from 'express';
import obrasService from '../services/obras/obras.service';
const router = Router();

// Tipos de Obra
router.post('/tipos', async (req, res) => { try { res.status(201).json(await obrasService.createTipoObra(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/tipos', async (req, res) => { try { res.json(await obrasService.listTiposObra()); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/tipos/:id', async (req, res) => { try { res.json(await obrasService.updateTipoObra(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Solicitações
router.post('/solicitacoes', async (req, res) => { try { res.status(201).json(await obrasService.createSolicitacaoObra(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/solicitacoes', async (req, res) => { try { res.json(await obrasService.listSolicitacoesObra(req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/solicitacoes/:id', async (req, res) => { try { res.json(await obrasService.updateSolicitacaoObra(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Obras
router.post('/obras', async (req, res) => { try { res.status(201).json(await obrasService.createObraPublica(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/obras', async (req, res) => { try { res.json(await obrasService.listObrasPublicas(req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/obras/:id', async (req, res) => { try { res.json(await obrasService.updateObraPublica(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.patch('/obras/:id/iniciar', async (req, res) => { try { res.json(await obrasService.iniciarObra(req.params.id)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.patch('/obras/:id/finalizar', async (req, res) => { try { res.json(await obrasService.finalizarObra(req.params.id)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Iluminação
router.post('/iluminacao', async (req, res) => { try { res.status(201).json(await obrasService.createPontoIluminacao(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/iluminacao', async (req, res) => { try { res.json(await obrasService.listPontosIluminacao(req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/iluminacao/:id', async (req, res) => { try { res.json(await obrasService.updatePontoIluminacao(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

router.get('/estatisticas', async (req, res) => { try { res.json(await obrasService.getEstatisticasObras()); } catch (error: any) { res.status(400).json({ error: error.message }); } });

export default router;
