import { Router } from 'express';
import culturaService from '../services/cultura/cultura.service';
import esportesService from '../services/esportes/esportes.service';
import habitacaoService from '../services/habitacao/habitacao.service';
import meioAmbienteService from '../services/meio-ambiente/meio-ambiente.service';
import obrasService from '../services/obras/obras.service';
import segurancaService from '../services/seguranca/seguranca.service';
import planejamentoService from '../services/planejamento/planejamento.service';

const router = Router();

// ============================================================================
// STATS ENDPOINTS PARA TODAS AS SECRETARIAS
// ============================================================================

// CULTURA
router.get('/cultura/stats', async (req, res) => {
  try {
    const stats = await culturaService.getEstatisticasCultura();

    res.json({
      events: {
        total: stats.totalEventos,
        thisMonth: 0,
        monthly: 0,
        upcoming: stats.totalEventos,
        participants: 0,
      },
      culturalSpaces: {
        total: stats.totalEspacos,
        active: stats.totalEspacos,
      },
      artists: {
        total: stats.totalArtistas,
        registered: stats.totalArtistas,
      },
      protocols: {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
      },
      spaces: {
        total: stats.totalEspacos,
        reservations: 0,
      },
      workshops: {
        active: 0,
        students: 0,
      },
      groups: {
        active: 0,
        performances: 0,
      },
      library: {
        books: stats.totalLivros,
        loans: 0,
      },
      patrimony: {
        sites: stats.totalPatrimonios,
        visitors: 0,
      },
      notices: {
        active: stats.totalEditais,
        applications: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ESPORTES
router.get('/esportes/stats', async (req, res) => {
  try {
    const stats = await esportesService.getEstatisticasEsportes();

    res.json({
      athletes: {
        total: stats.totalAtletas,
        active: stats.totalAtletas,
      },
      championships: {
        total: stats.totalCampeonatos,
        active: stats.campeonatosAtivos,
      },
      schools: {
        total: stats.totalEscolinhas,
        students: stats.vagasOcupadas,
        vacancies: stats.vagasLivres,
      },
      equipment: {
        total: stats.totalEquipamentos,
        available: stats.totalEquipamentos,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// HABITAÇÃO
router.get('/habitacao/stats', async (req, res) => {
  try {
    const stats = await habitacaoService.getEstatisticasHabitacao();

    res.json({
      housing: {
        total: stats.totalConjuntos,
        units: 0,
      },
      applications: {
        total: stats.totalInscricoes,
        approved: stats.inscricoesAprovadas,
        pending: stats.totalInscricoes - stats.inscricoesAprovadas,
      },
      construction: {
        total: stats.totalObras,
        ongoing: stats.obrasEmAndamento,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MEIO AMBIENTE
router.get('/meio-ambiente/stats', async (req, res) => {
  try {
    const stats = await meioAmbienteService.getEstatisticasMeioAmbiente();

    res.json({
      trees: {
        total: stats.totalArvores,
        planted: 0,
      },
      parks: {
        total: stats.totalParques,
        maintained: stats.totalParques,
      },
      collectionPoints: {
        total: stats.totalPontosColeta,
        active: stats.totalPontosColeta,
      },
      licenses: {
        total: stats.totalLicencas,
        pending: 0,
        approved: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// OBRAS PÚBLICAS
router.get('/obras-publicas/stats', async (req, res) => {
  try {
    const stats = await obrasService.getEstatisticasObras();

    res.json({
      projects: {
        total: stats.totalObras,
        ongoing: 0,
        completed: 0,
      },
      requests: {
        total: stats.totalSolicitacoes,
        pending: 0,
      },
      lighting: {
        total: stats.totalPontosIluminacao,
        working: stats.totalPontosIluminacao,
      },
      types: {
        total: stats.totalTipos,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SEGURANÇA PÚBLICA
router.get('/seguranca-publica/stats', async (req, res) => {
  try {
    const stats = await segurancaService.getEstatisticasSeguranca();

    res.json({
      vehicles: {
        total: stats.totalViaturas,
        active: stats.totalViaturas,
      },
      occurrences: {
        total: stats.totalOcorrencias,
        thisMonth: 0,
        resolved: 0,
      },
      patrols: {
        total: stats.totalRotas,
        active: stats.totalRotas,
      },
      cameras: {
        total: stats.totalCameras,
        operational: stats.totalCameras,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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

// PLANEJAMENTO URBANO
router.get('/planejamento-urbano/stats', async (req, res) => {
  try {
    const stats = await planejamentoService.getEstatisticasPlanejamento();

    res.json({
      zones: {
        total: stats.totalZonas,
        types: 0,
      },
      licenses: {
        total: stats.totalLicencas,
        pending: 0,
        approved: 0,
      },
      properties: {
        total: stats.totalImoveis,
        registered: stats.totalImoveis,
      },
      subdivisions: {
        total: stats.totalLoteamentos,
        approved: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
