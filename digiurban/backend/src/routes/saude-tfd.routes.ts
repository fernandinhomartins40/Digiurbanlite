// ============================================================================
// ROUTES - APP SAÚDE: TFD (Tratamento Fora do Domicílio)
// ============================================================================

import { Router, Request, Response } from 'express';
import {
  SolicitacoesTFDService,
  RegulacaoTFDService,
  ViagensTFDService,
} from '../services/tfd';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Middleware de autenticação para todas as rotas de TFD
router.use(authenticateToken);

// ============================================================================
// SOLICITAÇÕES TFD
// ============================================================================

/**
 * POST /api/saude/tfd/solicitacao
 * Criar solicitação de TFD
 */
router.post('/solicitacao', async (req: Request, res: Response) => {
  try {
    const solicitacao = await SolicitacoesTFDService.criarSolicitacao(req.body);
    res.status(201).json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/solicitacao/:id
 * Buscar solicitação completa
 */
router.get('/solicitacao/:id', async (req: Request, res: Response) => {
  try {
    const solicitacao = await SolicitacoesTFDService.buscarSolicitacao(req.params.id);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/solicitacao/:id
 * Atualizar solicitação
 */
router.put('/solicitacao/:id', async (req: Request, res: Response) => {
  try {
    const solicitacao = await SolicitacoesTFDService.atualizarSolicitacao(req.params.id, req.body);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/solicitacao
 * Listar solicitações
 */
router.get('/solicitacao', async (req: Request, res: Response) => {
  try {
    const filtros = {
      citizenId: req.query.citizenId as string,
      unidadeOrigemId: req.query.unidadeOrigemId as string,
      status: req.query.status as any,
      urgente: req.query.urgente === 'true' ? true : req.query.urgente === 'false' ? false : undefined,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const solicitacoes = await SolicitacoesTFDService.listarSolicitacoes(filtros);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/solicitacao/:id/status
 * Atualizar status da solicitação
 */
router.put('/solicitacao/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, observacoes } = req.body;
    const solicitacao = await SolicitacoesTFDService.atualizarStatus(
      req.params.id,
      status,
      observacoes
    );
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/solicitacao/:id/cancelar
 * Cancelar solicitação
 */
router.put('/solicitacao/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo, canceladoPorId } = req.body;
    const solicitacao = await SolicitacoesTFDService.cancelarSolicitacao(
      req.params.id,
      motivo,
      canceladoPorId
    );
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/solicitacao/:id/reabrir
 * Reabrir solicitação
 */
router.put('/solicitacao/:id/reabrir', async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const solicitacao = await SolicitacoesTFDService.reabrirSolicitacao(req.params.id, motivo);
    res.json(solicitacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/solicitacao/urgentes
 * Listar solicitações urgentes
 */
router.get('/solicitacao/urgentes', async (req: Request, res: Response) => {
  try {
    const solicitacoes = await SolicitacoesTFDService.listarSolicitacoesUrgentes();
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/solicitacao/cidadao/:citizenId/historico
 * Buscar histórico de solicitações do cidadão
 */
router.get('/solicitacao/cidadao/:citizenId/historico', async (req: Request, res: Response) => {
  try {
    const historico = await SolicitacoesTFDService.buscarHistoricoCidadao(req.params.citizenId);
    res.json(historico);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/solicitacao/estatisticas
 * Obter estatísticas de solicitações
 */
router.get('/solicitacao/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeOrigemId: req.query.unidadeOrigemId as string,
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await SolicitacoesTFDService.obterEstatisticas(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// DOCUMENTOS TFD
// ============================================================================

/**
 * POST /api/saude/tfd/documento
 * Adicionar documento à solicitação
 */
router.post('/documento', async (req: Request, res: Response) => {
  try {
    const documento = await SolicitacoesTFDService.adicionarDocumento(req.body);
    res.status(201).json(documento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/saude/tfd/documento/:id
 * Remover documento
 */
router.delete('/documento/:id', async (req: Request, res: Response) => {
  try {
    await SolicitacoesTFDService.removerDocumento(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/documento/solicitacao/:solicitacaoId
 * Listar documentos de uma solicitação
 */
router.get('/documento/solicitacao/:solicitacaoId', async (req: Request, res: Response) => {
  try {
    const documentos = await SolicitacoesTFDService.listarDocumentos(req.params.solicitacaoId);
    res.json(documentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/documento/verificar/:solicitacaoId
 * Verificar documentação completa
 */
router.get('/documento/verificar/:solicitacaoId', async (req: Request, res: Response) => {
  try {
    const verificacao = await SolicitacoesTFDService.verificarDocumentacaoCompleta(
      req.params.solicitacaoId
    );
    res.json(verificacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// REGULAÇÃO MÉDICA
// ============================================================================

/**
 * POST /api/saude/tfd/parecer
 * Criar parecer de regulação
 */
router.post('/parecer', async (req: Request, res: Response) => {
  try {
    const parecer = await RegulacaoTFDService.criarParecer(req.body);
    res.status(201).json(parecer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/parecer/:id
 * Buscar parecer
 */
router.get('/parecer/:id', async (req: Request, res: Response) => {
  try {
    const parecer = await RegulacaoTFDService.buscarParecer(req.params.id);
    res.json(parecer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/parecer/:id
 * Atualizar parecer
 */
router.put('/parecer/:id', async (req: Request, res: Response) => {
  try {
    const parecer = await RegulacaoTFDService.atualizarParecer(req.params.id, req.body);
    res.json(parecer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/parecer/solicitacao/:solicitacaoId
 * Listar pareceres de uma solicitação
 */
router.get('/parecer/solicitacao/:solicitacaoId', async (req: Request, res: Response) => {
  try {
    const pareceres = await RegulacaoTFDService.listarPareceresSolicitacao(req.params.solicitacaoId);
    res.json(pareceres);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/regulacao/aguardando
 * Listar solicitações aguardando regulação
 */
router.get('/regulacao/aguardando', async (req: Request, res: Response) => {
  try {
    const filtros = {
      urgente: req.query.urgente === 'true' ? true : req.query.urgente === 'false' ? false : undefined,
      especialidade: req.query.especialidade as string,
    };
    const solicitacoes = await RegulacaoTFDService.listarAguardandoRegulacao(filtros);
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/regulacao/estatisticas
 * Obter estatísticas de regulação
 */
router.get('/regulacao/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await RegulacaoTFDService.obterEstatisticasRegulacao(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/tfd/regulacao/relatorio
 * Gerar relatório de regulação
 */
router.post('/regulacao/relatorio', async (req: Request, res: Response) => {
  try {
    const filtros = {
      dataInicio: new Date(req.body.dataInicio),
      dataFim: new Date(req.body.dataFim),
      reguladorId: req.body.reguladorId as string,
    };
    const relatorio = await RegulacaoTFDService.gerarRelatorioRegulacao(filtros);
    res.json(relatorio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// APROVAÇÃO DA GESTÃO
// ============================================================================

/**
 * POST /api/saude/tfd/aprovacao-gestao
 * Criar aprovação da gestão
 */
router.post('/aprovacao-gestao', async (req: Request, res: Response) => {
  try {
    const aprovacao = await RegulacaoTFDService.criarAprovacaoGestao(req.body);
    res.status(201).json(aprovacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/aprovacao-gestao/:id
 * Buscar aprovação
 */
router.get('/aprovacao-gestao/:id', async (req: Request, res: Response) => {
  try {
    const aprovacao = await RegulacaoTFDService.buscarAprovacao(req.params.id);
    res.json(aprovacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/aprovacao-gestao/solicitacao/:solicitacaoId
 * Listar aprovações de uma solicitação
 */
router.get('/aprovacao-gestao/solicitacao/:solicitacaoId', async (req: Request, res: Response) => {
  try {
    const aprovacoes = await RegulacaoTFDService.listarAprovacoesSolicitacao(req.params.solicitacaoId);
    res.json(aprovacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/aprovacao-gestao/aguardando
 * Listar solicitações aguardando aprovação da gestão
 */
router.get('/aprovacao-gestao/aguardando', async (req: Request, res: Response) => {
  try {
    const solicitacoes = await RegulacaoTFDService.listarAguardandoAprovacaoGestao();
    res.json(solicitacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// AGENDAMENTOS EXTERNOS
// ============================================================================

/**
 * POST /api/saude/tfd/agendamento-externo
 * Criar agendamento externo
 */
router.post('/agendamento-externo', async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuário autenticado é obrigatório para criar agendamento' });
    }

    const agendamento = await RegulacaoTFDService.criarAgendamentoExterno(req.body, req.userId);
    res.status(201).json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/agendamento-externo/:id
 * Buscar agendamento
 */
router.get('/agendamento-externo/:id', async (req: Request, res: Response) => {
  try {
    const agendamento = await RegulacaoTFDService.buscarAgendamento(req.params.id);
    res.json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/agendamento-externo/:id
 * Atualizar agendamento
 */
router.put('/agendamento-externo/:id', async (req: Request, res: Response) => {
  try {
    const agendamento = await RegulacaoTFDService.atualizarAgendamento(req.params.id, req.body, req.userId);
    res.json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/agendamento-externo/:id/confirmar
 * Confirmar agendamento
 */
router.put('/agendamento-externo/:id/confirmar', async (req: Request, res: Response) => {
  try {
    const agendamento = await RegulacaoTFDService.confirmarAgendamento(req.params.id, req.userId);
    res.json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/agendamento-externo/:id/cancelar
 * Cancelar agendamento
 */
router.put('/agendamento-externo/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const agendamento = await RegulacaoTFDService.cancelarAgendamento(req.params.id, motivo, req.userId);
    res.json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/agendamento-externo/:id/comparecimento
 * Registrar comparecimento
 */
router.put('/agendamento-externo/:id/comparecimento', async (req: Request, res: Response) => {
  try {
    const { compareceu, observacoes } = req.body;
    const agendamento = await RegulacaoTFDService.registrarComparecimento(
      req.params.id,
      compareceu,
      observacoes,
      req.userId
    );
    res.json(agendamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/agendamento-externo/solicitacao/:solicitacaoId
 * Listar agendamentos de uma solicitação
 */
router.get('/agendamento-externo/solicitacao/:solicitacaoId', async (req: Request, res: Response) => {
  try {
    const agendamentos = await RegulacaoTFDService.listarAgendamentosSolicitacao(
      req.params.solicitacaoId
    );
    res.json(agendamentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/agendamento-externo/proximos
 * Listar próximos agendamentos
 */
router.get('/agendamento-externo/proximos', async (req: Request, res: Response) => {
  try {
    const filtros = {
      diasProximos: req.query.dias ? parseInt(req.query.dias as string) : 30,
      status: req.query.status as any,
    };
    const agendamentos = await RegulacaoTFDService.listarProximosAgendamentos(filtros);
    res.json(agendamentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/agendamento-externo/estatisticas
 * Obter estatísticas de agendamentos
 */
router.get('/agendamento-externo/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await RegulacaoTFDService.obterEstatisticasAgendamentos(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// VIAGENS
// ============================================================================

/**
 * POST /api/saude/tfd/viagem
 * Criar viagem
 */
router.post('/viagem', async (req: Request, res: Response) => {
  try {
    const viagem = await ViagensTFDService.criarViagem(req.body);
    res.status(201).json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/viagem/:id
 * Buscar viagem completa
 */
router.get('/viagem/:id', async (req: Request, res: Response) => {
  try {
    const viagem = await ViagensTFDService.buscarViagem(req.params.id);
    res.json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/viagem/:id
 * Atualizar viagem
 */
router.put('/viagem/:id', async (req: Request, res: Response) => {
  try {
    const viagem = await ViagensTFDService.atualizarViagem(req.params.id, req.body);
    res.json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/viagem
 * Listar viagens
 */
router.get('/viagem', async (req: Request, res: Response) => {
  try {
    const filtros = {
      solicitacaoId: req.query.solicitacaoId as string,
      veiculoId: req.query.veiculoId as string,
      motoristaId: req.query.motoristaId as string,
      status: req.query.status as any,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const viagens = await ViagensTFDService.listarViagens(filtros);
    res.json(viagens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/viagem/:id/status
 * Atualizar status da viagem
 */
router.put('/viagem/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, observacoes } = req.body;
    const viagem = await ViagensTFDService.atualizarStatus(req.params.id, status, observacoes);
    res.json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/viagem/:id/confirmar
 * Confirmar viagem
 */
router.put('/viagem/:id/confirmar', async (req: Request, res: Response) => {
  try {
    const viagem = await ViagensTFDService.confirmarViagem(req.params.id);
    res.json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/viagem/:id/iniciar
 * Iniciar viagem
 */
router.put('/viagem/:id/iniciar', async (req: Request, res: Response) => {
  try {
    const viagem = await ViagensTFDService.iniciarViagem(req.params.id);
    res.json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/viagem/:id/concluir
 * Concluir viagem
 */
router.put('/viagem/:id/concluir', async (req: Request, res: Response) => {
  try {
    const { observacoes } = req.body;
    const viagem = await ViagensTFDService.concluirViagem(req.params.id, observacoes);
    res.json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/viagem/:id/cancelar
 * Cancelar viagem
 */
router.put('/viagem/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const viagem = await ViagensTFDService.cancelarViagem(req.params.id, motivo);
    res.json(viagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/viagem/proximas
 * Listar próximas viagens
 */
router.get('/viagem/proximas', async (req: Request, res: Response) => {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias as string) : 7;
    const viagens = await ViagensTFDService.listarProximasViagens(dias);
    res.json(viagens);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/viagem/estatisticas
 * Obter estatísticas de viagens
 */
router.get('/viagem/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await ViagensTFDService.obterEstatisticas(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// PASSAGEIROS
// ============================================================================

/**
 * POST /api/saude/tfd/passageiro
 * Adicionar passageiro à viagem
 */
router.post('/passageiro', async (req: Request, res: Response) => {
  try {
    const passageiro = await ViagensTFDService.adicionarPassageiro(req.body);
    res.status(201).json(passageiro);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/saude/tfd/passageiro/:id
 * Remover passageiro
 */
router.delete('/passageiro/:id', async (req: Request, res: Response) => {
  try {
    await ViagensTFDService.removerPassageiro(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/passageiro/viagem/:viagemId
 * Listar passageiros de uma viagem
 */
router.get('/passageiro/viagem/:viagemId', async (req: Request, res: Response) => {
  try {
    const passageiros = await ViagensTFDService.listarPassageiros(req.params.viagemId);
    res.json(passageiros);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/tfd/passageiro/agrupar
 * Agrupar solicitações compatíveis para viagem
 */
router.post('/passageiro/agrupar', async (req: Request, res: Response) => {
  try {
    const filtros = {
      cidadeDestino: req.body.cidadeDestino,
      estadoDestino: req.body.estadoDestino,
      dataInicio: new Date(req.body.dataInicio),
      dataFim: new Date(req.body.dataFim),
    };
    const grupos = await ViagensTFDService.agruparSolicitacoesCompativeis(filtros);
    res.json(grupos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// PRESTAÇÃO DE CONTAS
// ============================================================================

/**
 * POST /api/saude/tfd/prestacao-contas
 * Criar prestação de contas
 */
router.post('/prestacao-contas', async (req: Request, res: Response) => {
  try {
    const prestacao = await ViagensTFDService.criarPrestacaoContas(req.body);
    res.status(201).json(prestacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/prestacao-contas/:id
 * Buscar prestação de contas
 */
router.get('/prestacao-contas/:id', async (req: Request, res: Response) => {
  try {
    const prestacao = await ViagensTFDService.buscarPrestacaoContas(req.params.id);
    res.json(prestacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/prestacao-contas/:id
 * Atualizar prestação de contas
 */
router.put('/prestacao-contas/:id', async (req: Request, res: Response) => {
  try {
    const prestacao = await ViagensTFDService.atualizarPrestacaoContas(req.params.id, req.body);
    res.json(prestacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/prestacao-contas/:id/aprovar
 * Aprovar prestação de contas
 */
router.put('/prestacao-contas/:id/aprovar', async (req: Request, res: Response) => {
  try {
    const { aprovadoPorId, observacoes } = req.body;
    const prestacao = await ViagensTFDService.aprovarPrestacaoContas(
      req.params.id,
      aprovadoPorId,
      observacoes
    );
    res.json(prestacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/tfd/prestacao-contas/:id/reprovar
 * Reprovar prestação de contas
 */
router.put('/prestacao-contas/:id/reprovar', async (req: Request, res: Response) => {
  try {
    const { aprovadoPorId, motivo } = req.body;
    const prestacao = await ViagensTFDService.reprovarPrestacaoContas(
      req.params.id,
      aprovadoPorId,
      motivo
    );
    res.json(prestacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/tfd/prestacao-contas
 * Listar prestações de contas
 */
router.get('/prestacao-contas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      viagemId: req.query.viagemId as string,
      status: req.query.status as any,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const prestacoes = await ViagensTFDService.listarPrestacoesContas(filtros);
    res.json(prestacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// UPLOAD DE DOCUMENTOS TFD
// ============================================================================

import { uploadSingle } from '../config/upload';
import path from 'path';
import fs from 'fs/promises';

/**
 * POST /api/saude/tfd/solicitacao/:id/upload-documento
 * Upload de documento para solicitação TFD
 */
router.post('/solicitacao/:id/upload-documento', uploadSingle, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const solicitacaoId = req.params.id;
    const { tipoDocumento, descricao } = req.body;

    // Mover arquivo para pasta específica de TFD
    const tfdDir = path.join(process.cwd(), 'uploads', 'saude', 'tfd', solicitacaoId);
    await fs.mkdir(tfdDir, { recursive: true });

    const newFileName = `${tipoDocumento}_${Date.now()}${path.extname(req.file.originalname)}`;
    const newPath = path.join(tfdDir, newFileName);

    await fs.rename(req.file.path, newPath);

    res.status(201).json({
      success: true,
      message: 'Documento enviado com sucesso',
      file: {
        fileName: newFileName,
        filePath: `/uploads/saude/tfd/${solicitacaoId}/${newFileName}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        tipoDocumento,
        descricao
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/tfd/viagem/:id/upload-comprovante
 * Upload de comprovante de despesa para viagem TFD
 */
router.post('/viagem/:id/upload-comprovante', uploadSingle, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const viagemId = req.params.id;
    const { tipo, valor, descricao } = req.body;

    // Mover arquivo para pasta específica de comprovantes
    const comprovantesDir = path.join(process.cwd(), 'uploads', 'saude', 'tfd', 'comprovantes', viagemId);
    await fs.mkdir(comprovantesDir, { recursive: true });

    const newFileName = `comprovante_${tipo}_${Date.now()}${path.extname(req.file.originalname)}`;
    const newPath = path.join(comprovantesDir, newFileName);

    await fs.rename(req.file.path, newPath);

    res.status(201).json({
      success: true,
      message: 'Comprovante enviado com sucesso',
      file: {
        fileName: newFileName,
        filePath: `/uploads/saude/tfd/comprovantes/${viagemId}/${newFileName}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        tipo,
        valor: parseFloat(valor),
        descricao
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
