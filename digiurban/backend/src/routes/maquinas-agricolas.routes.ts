import { Router } from 'express';
import maquinasAgricolasService from '../services/maquinas-agricolas/maquinas-agricolas.service';

const router = Router();

// ==================== MÁQUINAS ====================

router.post('/maquinas', async (req, res) => {
  try {
    const maquina = await maquinasAgricolasService.createMaquina(req.body);
    res.status(201).json(maquina);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/maquinas/:id', async (req, res) => {
  try {
    const maquina = await maquinasAgricolasService.findMaquinaById(req.params.id);
    if (!maquina) return res.status(404).json({ error: 'Máquina não encontrada' });
    res.json(maquina);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/maquinas', async (req, res) => {
  try {
    const disponiveis = req.query.disponiveis === 'true';
    const maquinas = disponiveis
      ? await maquinasAgricolasService.listMaquinasDisponiveis()
      : await maquinasAgricolasService.listAllMaquinas();
    res.json(maquinas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/maquinas/:id', async (req, res) => {
  try {
    const maquina = await maquinasAgricolasService.updateMaquina(req.params.id, req.body);
    res.json(maquina);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/maquinas/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const maquina = await maquinasAgricolasService.updateMaquinaStatus(req.params.id, status);
    res.json(maquina);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/maquinas/:id/manutencao', async (req, res) => {
  try {
    const maquina = await maquinasAgricolasService.registrarManutencao(req.params.id);
    res.json(maquina);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/maquinas/:id/finalizar-manutencao', async (req, res) => {
  try {
    const { proximaManutencaoHoras } = req.body;
    const maquina = await maquinasAgricolasService.finalizarManutencao(req.params.id, proximaManutencaoHoras);
    res.json(maquina);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== PRODUTORES RURAIS ====================

router.post('/produtores', async (req, res) => {
  try {
    const produtor = await maquinasAgricolasService.createProdutor(req.body);
    res.status(201).json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/produtores/:id', async (req, res) => {
  try {
    const produtor = await maquinasAgricolasService.findProdutorById(req.params.id);
    if (!produtor) return res.status(404).json({ error: 'Produtor não encontrado' });
    res.json(produtor);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/produtores/citizen/:citizenId', async (req, res) => {
  try {
    const produtor = await maquinasAgricolasService.findProdutorByCitizen(req.params.citizenId);
    res.json(produtor);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/produtores', async (req, res) => {
  try {
    const produtores = await maquinasAgricolasService.listAllProdutores();
    res.json(produtores);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/produtores/:id', async (req, res) => {
  try {
    const produtor = await maquinasAgricolasService.updateProdutor(req.params.id, req.body);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== SOLICITAÇÕES DE EMPRÉSTIMO ====================

router.post('/solicitacoes', async (req, res) => {
  try {
    const solicitacao = await maquinasAgricolasService.createSolicitacao(req.body);
    res.status(201).json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/solicitacoes/:id', async (req, res) => {
  try {
    const solicitacao = await maquinasAgricolasService.findSolicitacaoById(req.params.id);
    if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada' });
    res.json(solicitacao);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/solicitacoes/produtor/:produtorRuralId', async (req, res) => {
  try {
    const solicitacoes = await maquinasAgricolasService.findSolicitacoesByProdutor(req.params.produtorRuralId);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/solicitacoes/maquina/:maquinaId', async (req, res) => {
  try {
    const solicitacoes = await maquinasAgricolasService.findSolicitacoesByMaquina(req.params.maquinaId);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/solicitacoes/status/:status', async (req, res) => {
  try {
    const solicitacoes = await maquinasAgricolasService.findSolicitacoesByStatus(req.params.status as any);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/solicitacoes/:id/validar-cadastro', async (req, res) => {
  try {
    const { validadorId, aprovado } = req.body;
    const solicitacao = await maquinasAgricolasService.validarCadastro(req.params.id, validadorId, aprovado);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/solicitacoes/:id/aprovar-tecnico', async (req, res) => {
  try {
    const { tecnicoId, aprovado, justificativa } = req.body;
    const solicitacao = await maquinasAgricolasService.aprovarTecnico(req.params.id, tecnicoId, aprovado, justificativa);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/solicitacoes/:id/aprovar', async (req, res) => {
  try {
    const solicitacao = await maquinasAgricolasService.aprovarEmprestimo({
      solicitacaoId: req.params.id,
      ...req.body,
    });
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/solicitacoes/:id/registrar-emprestimo', async (req, res) => {
  try {
    const solicitacao = await maquinasAgricolasService.registrarEmprestimo({
      solicitacaoId: req.params.id,
      ...req.body,
    });
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/solicitacoes/:id/registrar-devolucao', async (req, res) => {
  try {
    const solicitacao = await maquinasAgricolasService.registrarDevolucao({
      solicitacaoId: req.params.id,
      ...req.body,
    });
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== RELATÓRIOS ====================

router.get('/relatorios/estatisticas', async (req, res) => {
  try {
    const dataInicio = new Date(req.query.dataInicio as string);
    const dataFim = new Date(req.query.dataFim as string);
    const stats = await maquinasAgricolasService.getEstatisticas(dataInicio, dataFim);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
