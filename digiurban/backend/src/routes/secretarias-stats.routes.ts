import { Router } from 'express';

const router = Router();

// ============================================================================
// STATS ENDPOINTS PARA TODAS AS SECRETARIAS
// ============================================================================

// CULTURA - Service deletado (MS)
router.get('/cultura/stats', async (req, res) => {
  res.json({
    events: { total: 0, thisMonth: 0, monthly: 0, upcoming: 0, participants: 0 },
    culturalSpaces: { total: 0, active: 0 },
    artists: { total: 0, registered: 0 },
    protocols: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    spaces: { total: 0, reservations: 0 },
    workshops: { active: 0, students: 0 },
    groups: { active: 0, performances: 0 },
    library: { books: 0, loans: 0 },
    patrimony: { sites: 0, visitors: 0 },
    notices: { active: 0, applications: 0 },
  });
});

// ESPORTES - Service deletado (MS)
router.get('/esportes/stats', async (req, res) => {
  res.json({
    athletes: { total: 0, active: 0 },
    championships: { total: 0, active: 0 },
    schools: { total: 0, students: 0, vacancies: 0 },
    equipment: { total: 0, available: 0 },
  });
});

// HABITAÇÃO - Service deletado (MS)
router.get('/habitacao/stats', async (req, res) => {
  res.json({
    housing: { total: 0, units: 0 },
    applications: { total: 0, approved: 0, pending: 0 },
    construction: { total: 0, ongoing: 0 },
  });
});

// MEIO AMBIENTE - Service deletado (MS)
router.get('/meio-ambiente/stats', async (req, res) => {
  res.json({
    trees: { total: 0, planted: 0 },
    parks: { total: 0, maintained: 0 },
    collectionPoints: { total: 0, active: 0 },
    licenses: { total: 0, pending: 0, approved: 0 },
  });
});

// OBRAS PÚBLICAS - Service deletado (MS)
router.get('/obras-publicas/stats', async (req, res) => {
  res.json({
    projects: { total: 0, ongoing: 0, completed: 0 },
    requests: { total: 0, pending: 0 },
    lighting: { total: 0, working: 0 },
    types: { total: 0 },
  });
});

// SEGURANÇA PÚBLICA - Service deletado (MS)
router.get('/seguranca-publica/stats', async (req, res) => {
  res.json({
    vehicles: { total: 0, active: 0 },
    occurrences: { total: 0, thisMonth: 0, resolved: 0 },
    patrols: { total: 0, active: 0 },
    cameras: { total: 0, operational: 0 },
  });
});

// TURISMO - Service deletado (MS)
router.get('/turismo/stats', async (req, res) => {
  res.json({
    establishments: { total: 0, active: 0 },
    guides: { total: 0, active: 0 },
    attractions: { total: 0, visitors: 0 },
    events: { total: 0, upcoming: 0 },
  });
});

// PLANEJAMENTO URBANO - Service deletado (MS)
router.get('/planejamento-urbano/stats', async (req, res) => {
  res.json({
    zones: { total: 0, types: 0 },
    licenses: { total: 0, pending: 0, approved: 0 },
    properties: { total: 0, registered: 0 },
    subdivisions: { total: 0, approved: 0 },
  });
});

// SERVIÇOS PÚBLICOS - Service deletado (MS)
router.get('/servicos-publicos/stats', async (req, res) => {
  res.json({
    collectionRoutes: { total: 0, active: 0 },
    maintenanceRequests: { total: 0, pending: 0, completed: 0 },
    pruningRequests: { total: 0, pending: 0 },
    cemeteries: { total: 0, graves: 0 },
    markets: { total: 0, active: 0 },
  });
});

export default router;
