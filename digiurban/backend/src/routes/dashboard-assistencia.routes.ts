import { Router } from 'express';
import dashboardAssistenciaService from '../services/dashboard-assistencia/dashboard-assistencia.service';

const router = Router();

// ============================================================================
// MS-18: DASHBOARD ASSISTÊNCIA SOCIAL - ROTAS
// ============================================================================

// ===== VISÃO GERAL =====

router.get('/visao-geral', async (req, res) => {
  try {
    const { unidadeCRASId } = req.query;
    const visao = await dashboardAssistenciaService.getVisaoGeral(unidadeCRASId as string);
    res.json(visao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== ESTATÍSTICAS =====

router.get('/estatisticas/beneficios', async (req, res) => {
  try {
    const { unidadeCRASId } = req.query;
    const stats = await dashboardAssistenciaService.getEstatisticasBeneficios(unidadeCRASId as string);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/estatisticas/programas', async (req, res) => {
  try {
    const { unidadeCRASId } = req.query;
    const stats = await dashboardAssistenciaService.getEstatisticasProgramas(unidadeCRASId as string);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/estatisticas/atendimentos', async (req, res) => {
  try {
    const { unidadeCRASId } = req.query;
    const stats = await dashboardAssistenciaService.getEstatisticasAtendimentos(unidadeCRASId as string);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/estatisticas/cadunico', async (req, res) => {
  try {
    const { unidadeCRASId } = req.query;
    const stats = await dashboardAssistenciaService.getEstatisticasCadUnico(unidadeCRASId as string);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== INDICADORES =====

router.get('/indicadores-mensais', async (req, res) => {
  try {
    const { ano, mes, unidadeCRASId } = req.query;
    const indicadores = await dashboardAssistenciaService.getIndicadoresMensais(
      parseInt(ano as string),
      parseInt(mes as string),
      unidadeCRASId as string
    );
    res.json(indicadores);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== RANKING =====

router.get('/ranking-cras', async (req, res) => {
  try {
    const ranking = await dashboardAssistenciaService.getRankingCRAS();
    res.json(ranking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== DASHBOARD COMPLETO =====

router.get('/completo', async (req, res) => {
  try {
    const { unidadeCRASId } = req.query;
    const dashboard = await dashboardAssistenciaService.getDashboardCompleto(unidadeCRASId as string);
    res.json(dashboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
