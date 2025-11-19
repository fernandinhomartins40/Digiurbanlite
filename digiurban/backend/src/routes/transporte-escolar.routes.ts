import { Router } from 'express';
import transporteEscolarService from '../services/transporte-escolar/transporte-escolar.service';

const router = Router();

// ==================== VEÍCULOS ====================

router.post('/veiculos', async (req, res) => {
  try {
    const veiculo = await transporteEscolarService.createVeiculo(req.body);
    res.status(201).json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/veiculos/:id', async (req, res) => {
  try {
    const veiculo = await transporteEscolarService.findVeiculoById(req.params.id);
    if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado' });
    res.json(veiculo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/veiculos', async (req, res) => {
  try {
    const disponiveis = req.query.disponiveis === 'true';
    const veiculos = disponiveis
      ? await transporteEscolarService.listVeiculosDisponiveis()
      : await transporteEscolarService.listAllVeiculos();
    res.json(veiculos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/veiculos/:id', async (req, res) => {
  try {
    const veiculo = await transporteEscolarService.updateVeiculo(req.params.id, req.body);
    res.json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/veiculos/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const veiculo = await transporteEscolarService.updateVeiculoStatus(req.params.id, status);
    res.json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/veiculos/:id/manutencao', async (req, res) => {
  try {
    const { kmAtual } = req.body;
    const veiculo = await transporteEscolarService.registrarManutencao(req.params.id, kmAtual);
    res.json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/veiculos/:id/finalizar-manutencao', async (req, res) => {
  try {
    const { proximaManutencaoKm } = req.body;
    const veiculo = await transporteEscolarService.finalizarManutencao(req.params.id, proximaManutencaoKm);
    res.json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/veiculos/:id', async (req, res) => {
  try {
    const veiculo = await transporteEscolarService.deactivateVeiculo(req.params.id);
    res.json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ROTAS ====================

router.post('/rotas', async (req, res) => {
  try {
    const rota = await transporteEscolarService.createRota(req.body);
    res.status(201).json(rota);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/rotas/:id', async (req, res) => {
  try {
    const rota = await transporteEscolarService.findRotaById(req.params.id);
    if (!rota) return res.status(404).json({ error: 'Rota não encontrada' });
    res.json(rota);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rotas', async (req, res) => {
  try {
    const turno = req.query.turno as any;
    const rotas = turno
      ? await transporteEscolarService.listRotasByTurno(turno)
      : await transporteEscolarService.listAllRotas();
    res.json(rotas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/rotas/:id', async (req, res) => {
  try {
    const rota = await transporteEscolarService.updateRota(req.params.id, req.body);
    res.json(rota);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/rotas/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const rota = await transporteEscolarService.updateRotaStatus(req.params.id, status);
    res.json(rota);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/rotas/:id', async (req, res) => {
  try {
    const rota = await transporteEscolarService.inativarRota(req.params.id);
    res.json(rota);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== PARADAS ====================

router.post('/rotas/:rotaId/paradas', async (req, res) => {
  try {
    const parada = await transporteEscolarService.adicionarParada(req.params.rotaId, req.body);
    res.status(201).json(parada);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/paradas/:id', async (req, res) => {
  try {
    const parada = await transporteEscolarService.updateParada(req.params.id, req.body);
    res.json(parada);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/paradas/:id', async (req, res) => {
  try {
    await transporteEscolarService.removerParada(req.params.id);
    res.json({ message: 'Parada removida com sucesso' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ALUNOS ====================

router.post('/alunos/vincular', async (req, res) => {
  try {
    const vinculo = await transporteEscolarService.vincularAluno(req.body);
    res.status(201).json(vinculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/alunos/:alunoRotaId', async (req, res) => {
  try {
    const vinculo = await transporteEscolarService.desvincularAluno(req.params.alunoRotaId);
    res.json(vinculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/rotas/:rotaId/alunos', async (req, res) => {
  try {
    const alunos = await transporteEscolarService.findAlunosByRota(req.params.rotaId);
    res.json(alunos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alunos/:alunoId/rota', async (req, res) => {
  try {
    const rota = await transporteEscolarService.findRotaByAluno(req.params.alunoId);
    res.json(rota);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RELATÓRIOS ====================

router.get('/relatorios/estatisticas', async (req, res) => {
  try {
    const stats = await transporteEscolarService.getEstatisticas();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/relatorios/manutencao', async (req, res) => {
  try {
    const veiculos = await transporteEscolarService.getVeiculosManutencao();
    res.json(veiculos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
