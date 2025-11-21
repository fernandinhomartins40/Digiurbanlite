import { Router } from 'express';
import propriedadeRuralService from '../services/propriedade-rural/propriedade-rural.service';

const router = Router();

// ============================================================================
// MS-02: CADASTRO DE PROPRIEDADES RURAIS
// ============================================================================

// Criar propriedade rural
router.post('/propriedades', async (req, res) => {
  try {
    const propriedade = await propriedadeRuralService.createPropriedade(req.body);
    res.status(201).json(propriedade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todas as propriedades
router.get('/propriedades', async (req, res) => {
  try {
    const { isActive } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const propriedades = await propriedadeRuralService.listPropriedades(filters);
    res.json(propriedades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar propriedades ativas
router.get('/propriedades/ativas', async (req, res) => {
  try {
    const propriedades = await propriedadeRuralService.listPropriedadesAtivas();
    res.json(propriedades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar propriedades por produtor
router.get('/propriedades/produtor/:produtorId', async (req, res) => {
  try {
    const propriedades = await propriedadeRuralService.findByProdutor(req.params.produtorId);
    res.json(propriedades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar propriedades com geolocalização
router.get('/propriedades/geolocalizadas', async (req, res) => {
  try {
    const propriedades = await propriedadeRuralService.findComGeolocalizacao();
    res.json(propriedades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Estatísticas
router.get('/propriedades/statistics', async (req, res) => {
  try {
    const stats = await propriedadeRuralService.getStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar propriedade por ID
router.get('/propriedades/:id', async (req, res) => {
  try {
    const propriedade = await propriedadeRuralService.findPropriedadeById(req.params.id);
    res.json(propriedade);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Buscar propriedade por CAR
router.get('/propriedades/car/:car', async (req, res) => {
  try {
    const propriedade = await propriedadeRuralService.findByCAR(req.params.car);
    res.json(propriedade);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Buscar com histórico completo
router.get('/propriedades/:id/historico', async (req, res) => {
  try {
    const propriedade = await propriedadeRuralService.findComHistorico(req.params.id);
    res.json(propriedade);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Atualizar propriedade
router.put('/propriedades/:id', async (req, res) => {
  try {
    const propriedade = await propriedadeRuralService.updatePropriedade(req.params.id, req.body);
    res.json(propriedade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar foto
router.post('/propriedades/:id/fotos', async (req, res) => {
  try {
    const propriedade = await propriedadeRuralService.addFoto(req.params.id, req.body);
    res.json(propriedade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remover foto
router.delete('/propriedades/:id/fotos/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const propriedade = await propriedadeRuralService.removeFoto(req.params.id, index);
    res.json(propriedade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar geolocalização
router.patch('/propriedades/:id/geolocalizacao', async (req, res) => {
  try {
    const { latitude, longitude, coordenadasPoligono } = req.body;
    const propriedade = await propriedadeRuralService.updateGeolocalizacao(
      req.params.id,
      latitude,
      longitude,
      coordenadasPoligono
    );
    res.json(propriedade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar cultura
router.post('/propriedades/:id/culturas', async (req, res) => {
  try {
    const propriedade = await propriedadeRuralService.addCultura(req.params.id, req.body);
    res.json(propriedade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remover cultura
router.delete('/propriedades/:id/culturas/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const propriedade = await propriedadeRuralService.removeCultura(req.params.id, index);
    res.json(propriedade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Desativar propriedade
router.patch('/propriedades/:id/deactivate', async (req, res) => {
  try {
    const propriedade = await propriedadeRuralService.deactivatePropriedade(req.params.id);
    res.json(propriedade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reativar propriedade
router.patch('/propriedades/:id/reactivate', async (req, res) => {
  try {
    const propriedade = await propriedadeRuralService.reactivatePropriedade(req.params.id);
    res.json(propriedade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar propriedade
router.delete('/propriedades/:id', async (req, res) => {
  try {
    const result = await propriedadeRuralService.deletePropriedade(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
