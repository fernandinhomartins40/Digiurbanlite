import { Router } from 'express';
import servicosPublicosService from '../services/servicos-publicos/servicos-publicos.service';
const router = Router();

// Rotas de Coleta
router.post('/rotas-coleta', async (req, res) => { try { res.status(201).json(await servicosPublicosService.createRotaColeta(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/rotas-coleta', async (req, res) => { try { res.json(await servicosPublicosService.listRotasColeta(req.query.diasSemana as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/rotas-coleta/:id', async (req, res) => { try { res.json(await servicosPublicosService.updateRotaColeta(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Manutenções
router.post('/manutencoes', async (req, res) => { try { res.status(201).json(await servicosPublicosService.createSolicitacaoManutencao(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/manutencoes', async (req, res) => { try { res.json(await servicosPublicosService.listSolicitacoesManutencao(req.query.tipo as string, req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/manutencoes/:id', async (req, res) => { try { res.json(await servicosPublicosService.updateSolicitacaoManutencao(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Poda de Árvores
router.post('/podas', async (req, res) => { try { res.status(201).json(await servicosPublicosService.createSolicitacaoPoda(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/podas', async (req, res) => { try { res.json(await servicosPublicosService.listSolicitacoesPoda(req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/podas/:id', async (req, res) => { try { res.json(await servicosPublicosService.updateSolicitacaoPoda(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Cemitérios
router.post('/cemiterios', async (req, res) => { try { res.status(201).json(await servicosPublicosService.createCemiterio(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/cemiterios', async (req, res) => { try { res.json(await servicosPublicosService.listCemiterios()); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/cemiterios/:id', async (req, res) => { try { res.json(await servicosPublicosService.updateCemiterio(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Sepulturas
router.post('/sepulturas', async (req, res) => { try { res.status(201).json(await servicosPublicosService.createSepultura(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/sepulturas', async (req, res) => { try { res.json(await servicosPublicosService.listSepulturas(req.query.cemiterioId as string, req.query.status as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/sepulturas/:id', async (req, res) => { try { res.json(await servicosPublicosService.updateSepultura(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

// Feiras Livres
router.post('/feiras', async (req, res) => { try { res.status(201).json(await servicosPublicosService.createFeiraLivre(req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.get('/feiras', async (req, res) => { try { res.json(await servicosPublicosService.listFeirasLivres(req.query.diaSemana as string)); } catch (error: any) { res.status(400).json({ error: error.message }); } });
router.put('/feiras/:id', async (req, res) => { try { res.json(await servicosPublicosService.updateFeiraLivre(req.params.id, req.body)); } catch (error: any) { res.status(400).json({ error: error.message }); } });

router.get('/estatisticas', async (req, res) => { try { res.json(await servicosPublicosService.getEstatisticasServicos()); } catch (error: any) { res.status(400).json({ error: error.message }); } });

export default router;
