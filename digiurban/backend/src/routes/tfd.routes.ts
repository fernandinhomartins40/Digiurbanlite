import { Router } from 'express';
import tfdService from '../services/tfd/tfd.service';
import tfdMontadorService from '../services/tfd/tfd-montador.service';
import protocolToTFDService from '../services/tfd/protocol-to-tfd.service';

const router = Router();

// ==================== SOLICITAÇÕES ====================

router.post('/solicitacoes', async (req, res) => {
  try {
    const solicitacao = await tfdService.createSolicitacao(req.body);
    res.status(201).json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/solicitacoes/:id', async (req, res) => {
  try {
    const solicitacao = await tfdService.findById(req.params.id);
    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    res.json(solicitacao);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/solicitacoes/cidadao/:citizenId', async (req, res) => {
  try {
    const solicitacoes = await tfdService.findByCitizen(req.params.citizenId);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/solicitacoes/status/:status', async (req, res) => {
  try {
    const solicitacoes = await tfdService.findByStatus(req.params.status as any);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/solicitacoes/:id/cancelar', async (req, res) => {
  try {
    const { userId, motivo } = req.body;
    const solicitacao = await tfdService.cancelarSolicitacao(req.params.id, userId, motivo);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== WORKFLOW - ANÁLISE DOCUMENTAL ====================

router.put('/solicitacoes/:id/analisar-documentacao', async (req, res) => {
  try {
    const solicitacao = await tfdService.analisarDocumentacao({
      solicitacaoId: req.params.id,
      ...req.body,
    });
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== WORKFLOW - REGULAÇÃO MÉDICA ====================

router.put('/solicitacoes/:id/regulacao-medica', async (req, res) => {
  try {
    const solicitacao = await tfdService.regulacaoMedica({
      solicitacaoId: req.params.id,
      ...req.body,
    });
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== WORKFLOW - APROVAÇÃO GESTÃO ====================

router.put('/solicitacoes/:id/aprovar-gestao', async (req, res) => {
  try {
    const solicitacao = await tfdService.aprovarGestao({
      solicitacaoId: req.params.id,
      ...req.body,
    });
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== VIAGENS ====================

router.post('/viagens', async (req, res) => {
  try {
    const viagem = await tfdService.agendarViagem(req.body);
    res.status(201).json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/viagens/:id/iniciar', async (req, res) => {
  try {
    const { userId } = req.body;
    const viagem = await tfdService.iniciarViagem(req.params.id, userId);
    res.json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/viagens/:id/retorno', async (req, res) => {
  try {
    const { userId, observacoes } = req.body;
    const solicitacao = await tfdService.registrarRetorno(req.params.id, userId, observacoes);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/viagens/:id/despesas', async (req, res) => {
  try {
    const viagem = await tfdService.registrarDespesas({
      viagemId: req.params.id,
      ...req.body,
    });
    res.json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/viagens/agendadas', async (req, res) => {
  try {
    const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
    const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
    const viagens = await tfdService.listarViagensAgendadas(dataInicio, dataFim);
    res.json(viagens);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VEÍCULOS ====================

router.post('/veiculos', async (req, res) => {
  try {
    const veiculo = await tfdService.createVeiculo(req.body);
    res.status(201).json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/veiculos/disponiveis', async (req, res) => {
  try {
    const veiculos = await tfdService.listarVeiculosDisponiveis();
    res.json(veiculos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/veiculos/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const veiculo = await tfdService.updateVeiculoStatus(req.params.id, status);
    res.json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== MOTORISTAS ====================

router.post('/motoristas', async (req, res) => {
  try {
    const motorista = await tfdService.createMotorista(req.body);
    res.status(201).json(motorista);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/motoristas/disponiveis', async (req, res) => {
  try {
    const motoristas = await tfdService.listarMotoristasDisponiveis();
    res.json(motoristas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RELATÓRIOS ====================

router.get('/relatorios', async (req, res) => {
  try {
    const dataInicio = new Date(req.query.dataInicio as string);
    const dataFim = new Date(req.query.dataFim as string);
    const relatorio = await tfdService.getRelatorio(dataInicio, dataFim);
    res.json(relatorio);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MONTADOR DE LISTAS (ALGORITMO) ====================

router.post('/viagens/montar-lista', async (req, res) => {
  try {
    const resultado = await tfdMontadorService.montarListaAutomatica(req.body);
    res.status(201).json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/viagens/preview-lista', async (req, res) => {
  try {
    const preview = await tfdMontadorService.previewLista(req.body);
    res.json(preview);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== INTEGRAÇÃO COM PROTOCOLOS ====================

router.post('/convert-protocol/:protocolId', async (req, res) => {
  try {
    const solicitacao = await protocolToTFDService.convertProtocolToTFD(req.params.protocolId);
    res.status(201).json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/by-protocol/:protocolId', async (req, res) => {
  try {
    const solicitacao = await protocolToTFDService.findByProtocolId(req.params.protocolId);
    if (!solicitacao) {
      return res.status(404).json({ error: 'Solicitação TFD não encontrada para este protocolo' });
    }
    res.json(solicitacao);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync-status/:solicitacaoId', async (req, res) => {
  try {
    await protocolToTFDService.syncTFDStatusToProtocol(req.params.solicitacaoId);
    res.json({ message: 'Status sincronizado com sucesso' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
