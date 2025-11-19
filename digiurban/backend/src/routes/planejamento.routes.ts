import { Router } from 'express';
import planejamentoService from '../services/planejamento/planejamento.service';
const router = Router();

// Zonas Urbanas
router.post('/zonas', async (req, res) => { try { res.status(201).json(await planejamentoService.createZonaUrbana(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/zonas', async (req, res) => { try { res.json(await planejamentoService.listZonasUrbanas(req.query.tipo as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/zonas/:id', async (req, res) => { try { res.json(await planejamentoService.updateZonaUrbana(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Licenças de Obra
router.post('/licencas', async (req, res) => { try { res.status(201).json(await planejamentoService.createLicencaObra(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/licencas', async (req, res) => { try { res.json(await planejamentoService.listLicencasObra(req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/licencas/:id', async (req, res) => { try { res.json(await planejamentoService.updateLicencaObra(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.patch('/licencas/:id/aprovar', async (req, res) => { try { res.json(await planejamentoService.aprovarLicenca(req.params.id)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.patch('/licencas/:id/rejeitar', async (req, res) => { try { res.json(await planejamentoService.rejeitarLicenca(req.params.id)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Imóveis
router.post('/imoveis', async (req, res) => { try { res.status(201).json(await planejamentoService.createImovelUrbano(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/imoveis', async (req, res) => { try { res.json(await planejamentoService.listImoveisUrbanos()); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/imoveis/:id', async (req, res) => { try { res.json(await planejamentoService.updateImovelUrbano(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Loteamentos
router.post('/loteamentos', async (req, res) => { try { res.status(201).json(await planejamentoService.createLoteamento(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/loteamentos', async (req, res) => { try { res.json(await planejamentoService.listLoteamentos(req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/loteamentos/:id', async (req, res) => { try { res.json(await planejamentoService.updateLoteamento(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

router.get('/estatisticas', async (req, res) => { try { res.json(await planejamentoService.getEstatisticasPlanejamento()); } catch (error: any) { res.status(400).json({ error: error.message }); } });

export default router;
