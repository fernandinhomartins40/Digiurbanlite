import { Router } from 'express';
import esportesService from '../services/esportes/esportes.service';

const router = Router();

// ============================================================================
// ESPORTES (MS-33 a MS-36) - ROTAS
// ============================================================================

// ===== MS-33: ATLETAS =====

router.post('/atletas', async (req, res) => {
  try {
    const atleta = await esportesService.createAtleta(req.body);
    res.status(201).json(atleta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atletas', async (req, res) => {
  try {
    const { modalidade, categoria } = req.query;
    const atletas = await esportesService.listAtletas(
      modalidade as string,
      categoria as string
    );
    res.json(atletas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atletas/:id', async (req, res) => {
  try {
    const atleta = await esportesService.findAtletaById(req.params.id);
    res.json(atleta);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/atletas/:id', async (req, res) => {
  try {
    const atleta = await esportesService.updateAtleta(req.params.id, req.body);
    res.json(atleta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/atletas/:id', async (req, res) => {
  try {
    await esportesService.deleteAtleta(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-34: CAMPEONATOS =====

router.post('/campeonatos', async (req, res) => {
  try {
    const campeonato = await esportesService.createCampeonato(req.body);
    res.status(201).json(campeonato);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/campeonatos', async (req, res) => {
  try {
    const { modalidade, status } = req.query;
    const campeonatos = await esportesService.listCampeonatos(
      modalidade as string,
      status as string
    );
    res.json(campeonatos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/campeonatos/:id', async (req, res) => {
  try {
    const campeonato = await esportesService.findCampeonatoById(req.params.id);
    res.json(campeonato);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/campeonatos/:id', async (req, res) => {
  try {
    const campeonato = await esportesService.updateCampeonato(req.params.id, req.body);
    res.json(campeonato);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/campeonatos/:id/iniciar', async (req, res) => {
  try {
    const campeonato = await esportesService.iniciarCampeonato(req.params.id);
    res.json(campeonato);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/campeonatos/:id/finalizar', async (req, res) => {
  try {
    const campeonato = await esportesService.finalizarCampeonato(req.params.id);
    res.json(campeonato);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-35: ESCOLINHAS =====

router.post('/escolinhas', async (req, res) => {
  try {
    const escolinha = await esportesService.createEscolinhaEsporte(req.body);
    res.status(201).json(escolinha);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/escolinhas', async (req, res) => {
  try {
    const { modalidade } = req.query;
    const escolinhas = await esportesService.listEscolinhasEsporte(modalidade as string);
    res.json(escolinhas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/escolinhas/:id', async (req, res) => {
  try {
    const escolinha = await esportesService.findEscolinhaEsporteById(req.params.id);
    res.json(escolinha);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/escolinhas/:id', async (req, res) => {
  try {
    const escolinha = await esportesService.updateEscolinhaEsporte(req.params.id, req.body);
    res.json(escolinha);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/escolinhas/:id', async (req, res) => {
  try {
    await esportesService.deleteEscolinhaEsporte(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/escolinhas/:id/inscrever', async (req, res) => {
  try {
    const { alunoId } = req.body;
    const escolinha = await esportesService.inscreverAluno(req.params.id, alunoId);
    res.json(escolinha);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/escolinhas/:id/remover-aluno', async (req, res) => {
  try {
    const { alunoId } = req.body;
    const escolinha = await esportesService.removerAluno(req.params.id, alunoId);
    res.json(escolinha);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== MS-36: EQUIPAMENTOS =====

router.post('/equipamentos', async (req, res) => {
  try {
    const equipamento = await esportesService.createEquipamentoEsportivo(req.body);
    res.status(201).json(equipamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/equipamentos', async (req, res) => {
  try {
    const { tipo, status } = req.query;
    const equipamentos = await esportesService.listEquipamentosEsportivos(
      tipo as string,
      status as string
    );
    res.json(equipamentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/equipamentos/:id', async (req, res) => {
  try {
    const equipamento = await esportesService.findEquipamentoEsportivoById(req.params.id);
    res.json(equipamento);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.put('/equipamentos/:id', async (req, res) => {
  try {
    const equipamento = await esportesService.updateEquipamentoEsportivo(req.params.id, req.body);
    res.json(equipamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/equipamentos/:id', async (req, res) => {
  try {
    await esportesService.deleteEquipamentoEsportivo(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/equipamentos/:id/status', async (req, res) => {
  try {
    const { novoStatus } = req.body;
    const equipamento = await esportesService.atualizarStatusConservacao(
      req.params.id,
      novoStatus
    );
    res.json(equipamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ===== ESTATÍSTICAS =====

router.get('/estatisticas', async (req, res) => {
  try {
    const stats = await esportesService.getEstatisticasEsportes();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/estatisticas/atletas-por-modalidade', async (req, res) => {
  try {
    const stats = await esportesService.getAtletasPorModalidade();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
