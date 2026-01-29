// ============================================================================
// ROUTES - APP SAÚDE: ATENDIMENTO INTEGRADO
// ============================================================================

import { Router, Request, Response } from 'express';
import {
  AgendaService,
  AgendamentoService,
  FilaService,
  ProntuarioService,
  PrescricaoService,
  ExamesService,
  AtestadoService,
  EncaminhamentoService,
  AtendimentoService,
} from '../services/atendimento';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================================================
// Todas as rotas de saúde exigem autenticação
router.use(authenticateToken);

// ============================================================================
// AGENDA E DISPONIBILIDADES
// ============================================================================

/**
 * POST /api/saude/atendimento/agenda/disponibilidades
 * Buscar horários disponíveis para agendamento
 */
router.post('/agenda/disponibilidades', async (req: Request, res: Response) => {
  try {
    const disponibilidades = await AgendaService.buscarDisponibilidades(req.body);
    res.json(disponibilidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/atendimento/agenda/indisponibilidade
 * Criar indisponibilidade (férias, licença, etc.)
 */
router.post('/agenda/indisponibilidade', async (req: Request, res: Response) => {
  try {
    const indisponibilidade = await AgendaService.criarIndisponibilidade(req.body);
    res.status(201).json(indisponibilidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/atendimento/agenda/indisponibilidade/:id
 * Atualizar indisponibilidade
 */
router.put('/agenda/indisponibilidade/:id', async (req: Request, res: Response) => {
  try {
    const indisponibilidade = await AgendaService.atualizarIndisponibilidade(req.params.id, req.body);
    res.json(indisponibilidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/saude/atendimento/agenda/indisponibilidade/:id
 * Excluir indisponibilidade
 */
router.delete('/agenda/indisponibilidade/:id', async (req: Request, res: Response) => {
  try {
    await AgendaService.excluirIndisponibilidade(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/agenda/indisponibilidades/:profissionalId
 * Listar indisponibilidades de um profissional
 */
router.get('/agenda/indisponibilidades/:profissionalId', async (req: Request, res: Response) => {
  try {
    const ativas = req.query.ativas === 'true';
    const indisponibilidades = await AgendaService.listarIndisponibilidades(req.params.profissionalId, ativas);
    res.json(indisponibilidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// AGENDAMENTO DE CONSULTAS
// ============================================================================

/**
 * POST /api/saude/atendimento/agendamento
 * Agendar consulta
 */
router.post('/agendamento', async (req: Request, res: Response) => {
  try {
    const consulta = await AgendamentoService.agendarConsulta(req.body);
    res.status(201).json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/atendimento/agendamento/:id/reagendar
 * Reagendar consulta
 */
router.put('/agendamento/:id/reagendar', async (req: Request, res: Response) => {
  try {
    const { novaDataHora, motivo } = req.body;
    const consulta = await AgendamentoService.reagendarConsulta(req.params.id, novaDataHora, motivo);
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/atendimento/agendamento/:id/cancelar
 * Cancelar consulta
 */
router.put('/agendamento/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo, canceladoPor } = req.body;
    const consulta = await AgendamentoService.cancelarConsulta(req.params.id, motivo, canceladoPor);
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/atendimento/agendamento/:id/confirmar
 * Confirmar consulta
 */
router.put('/agendamento/:id/confirmar', async (req: Request, res: Response) => {
  try {
    const consulta = await AgendamentoService.confirmarConsulta(req.params.id);
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/agendamento/cidadao/:citizenId
 * Listar consultas de um cidadão
 */
router.get('/agendamento/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const filtros = {
      status: req.query.status as string,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const consultas = await AgendamentoService.listarConsultasCidadao(req.params.citizenId, filtros);
    res.json(consultas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/agendamento
 * Listar consultas agendadas (visão administrativa)
 */
router.get('/agendamento', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      profissionalId: req.query.profissionalId as string,
      status: req.query.status as string,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const consultas = await AgendamentoService.listarConsultas(filtros);
    res.json(consultas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/agendamento/estatisticas
 * Obter estatísticas de agendamento
 */
router.get('/agendamento/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await AgendamentoService.obterEstatisticas(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FILA DE ATENDIMENTO
// ============================================================================

/**
 * POST /api/saude/atendimento/fila/checkin
 * Realizar check-in na fila
 */
router.post('/fila/checkin', async (req: Request, res: Response) => {
  try {
    const fila = await FilaService.realizarCheckIn(req.body);
    res.status(201).json(fila);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/atendimento/fila/chamar-proximo
 * Chamar próximo paciente
 */
router.post('/fila/chamar-proximo', async (req: Request, res: Response) => {
  try {
    const { unidadeId, consultorio } = req.body;
    const fila = await FilaService.chamarProximo(unidadeId, consultorio);
    res.json(fila);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/atendimento/fila/chamar-paciente
 * Chamar paciente específico
 */
router.post('/fila/chamar-paciente', async (req: Request, res: Response) => {
  try {
    const fila = await FilaService.chamarPaciente(req.body);
    res.json(fila);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/atendimento/fila/:id/status
 * Atualizar status na fila
 */
router.put('/fila/:id/status', async (req: Request, res: Response) => {
  try {
    const fila = await FilaService.atualizarStatus(req.params.id, req.body);
    res.json(fila);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/fila/:unidadeId
 * Listar fila de uma unidade
 */
router.get('/fila/:unidadeId', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as any;
    const fila = await FilaService.listarFila(req.params.unidadeId, status);
    res.json(fila);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/fila/:id/posicao
 * Obter posição na fila
 */
router.get('/fila/:id/posicao', async (req: Request, res: Response) => {
  try {
    const posicao = await FilaService.obterPosicao(req.params.id);
    res.json(posicao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/fila/chamadas/:unidadeId
 * Obter chamadas recentes do painel
 */
router.get('/fila/chamadas/:unidadeId', async (req: Request, res: Response) => {
  try {
    const limite = req.query.limite ? parseInt(req.query.limite as string) : 10;
    const chamadas = await FilaService.obterChamadasRecentes(req.params.unidadeId, limite);
    res.json(chamadas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/atendimento/fila/:id/cancelar
 * Cancelar entrada na fila
 */
router.put('/fila/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { observacoes } = req.body;
    const fila = await FilaService.cancelarFila(req.params.id, observacoes);
    res.json(fila);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// PRONTUÁRIO ELETRÔNICO
// ============================================================================

/**
 * GET /api/saude/atendimento/prontuario/:citizenId
 * Obter prontuário completo do cidadão
 */
router.get('/prontuario/:citizenId', async (req: Request, res: Response) => {
  try {
    const prontuario = await ProntuarioService.obterProntuarioCompleto(req.params.citizenId);
    res.json(prontuario);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/prontuario/:citizenId/timeline
 * Gerar timeline de eventos do prontuário
 */
router.get('/prontuario/:citizenId/timeline', async (req: Request, res: Response) => {
  try {
    const timeline = await ProntuarioService.gerarTimeline(req.params.citizenId);
    res.json(timeline);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/prontuario/:citizenId/historico
 * Buscar histórico de atendimentos com filtros
 */
router.get('/prontuario/:citizenId/historico', async (req: Request, res: Response) => {
  try {
    const filtros = {
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
      unidadeId: req.query.unidadeId as string,
      profissionalId: req.query.profissionalId as string,
      tipo: req.query.tipo as string,
    };
    const historico = await ProntuarioService.buscarHistorico(req.params.citizenId, filtros);
    res.json(historico);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Alergias
router.post('/prontuario/alergia', async (req: Request, res: Response) => {
  try {
    const alergia = await ProntuarioService.criarAlergia(req.body);
    res.status(201).json(alergia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/prontuario/alergia/:id', async (req: Request, res: Response) => {
  try {
    const alergia = await ProntuarioService.atualizarAlergia(req.params.id, req.body);
    res.json(alergia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/prontuario/alergia/:id', async (req: Request, res: Response) => {
  try {
    await ProntuarioService.excluirAlergia(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prontuario/alergia/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const alergias = await ProntuarioService.listarAlergias(req.params.citizenId);
    res.json(alergias);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Comorbidades
router.post('/prontuario/comorbidade', async (req: Request, res: Response) => {
  try {
    const comorbidade = await ProntuarioService.criarComorbidade(req.body);
    res.status(201).json(comorbidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/prontuario/comorbidade/:id', async (req: Request, res: Response) => {
  try {
    const comorbidade = await ProntuarioService.atualizarComorbidade(req.params.id, req.body);
    res.json(comorbidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/prontuario/comorbidade/:id', async (req: Request, res: Response) => {
  try {
    await ProntuarioService.excluirComorbidade(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prontuario/comorbidade/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const apenasAtivas = req.query.apenasAtivas !== 'false';
    const comorbidades = await ProntuarioService.listarComorbidades(req.params.citizenId, apenasAtivas);
    res.json(comorbidades);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Anexos
router.post('/prontuario/anexo', async (req: Request, res: Response) => {
  try {
    const anexo = await ProntuarioService.criarAnexo(req.body);
    res.status(201).json(anexo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/prontuario/anexo/:id', async (req: Request, res: Response) => {
  try {
    const anexo = await ProntuarioService.atualizarAnexo(req.params.id, req.body);
    res.json(anexo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/prontuario/anexo/:id', async (req: Request, res: Response) => {
  try {
    await ProntuarioService.excluirAnexo(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prontuario/anexo/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const atendimentoId = req.query.atendimentoId as string;
    const anexos = await ProntuarioService.listarAnexos(req.params.citizenId, atendimentoId);
    res.json(anexos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Imunizações
router.post('/prontuario/imunizacao', async (req: Request, res: Response) => {
  try {
    const imunizacao = await ProntuarioService.criarImunizacao(req.body);
    res.status(201).json(imunizacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/prontuario/imunizacao/:id', async (req: Request, res: Response) => {
  try {
    const imunizacao = await ProntuarioService.atualizarImunizacao(req.params.id, req.body);
    res.json(imunizacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/prontuario/imunizacao/:id', async (req: Request, res: Response) => {
  try {
    await ProntuarioService.excluirImunizacao(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prontuario/imunizacao/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const imunizacoes = await ProntuarioService.listarImunizacoes(req.params.citizenId);
    res.json(imunizacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// ATENDIMENTO MÉDICO
// ============================================================================

/**
 * POST /api/saude/atendimento/atendimento
 * Iniciar atendimento médico
 */
router.post('/atendimento', async (req: Request, res: Response) => {
  try {
    const atendimento = await AtendimentoService.iniciarAtendimento(req.body);
    res.status(201).json(atendimento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/atendimento/:id
 * Buscar atendimento completo
 */
router.get('/atendimento/:id', async (req: Request, res: Response) => {
  try {
    const atendimento = await AtendimentoService.buscarAtendimento(req.params.id);
    res.json(atendimento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/atendimento/atendimento/:id
 * Atualizar atendimento
 */
router.put('/atendimento/:id', async (req: Request, res: Response) => {
  try {
    const atendimento = await AtendimentoService.atualizarAtendimento(req.params.id, req.body);
    res.json(atendimento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/atendimento/atendimento/:id/finalizar
 * Finalizar atendimento
 */
router.put('/atendimento/:id/finalizar', async (req: Request, res: Response) => {
  try {
    const { observacoes } = req.body;
    const atendimento = await AtendimentoService.finalizarAtendimento(req.params.id, observacoes);
    res.json(atendimento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/atendimento/atendimento/:id/cancelar
 * Cancelar atendimento
 */
router.put('/atendimento/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const atendimento = await AtendimentoService.cancelarAtendimento(req.params.id, motivo);
    res.json(atendimento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/atendimento
 * Listar atendimentos
 */
router.get('/atendimento', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      citizenId: req.query.citizenId as string,
      profissionalId: req.query.profissionalId as string,
      tipo: req.query.tipo as any,
      status: req.query.status as any,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const atendimentos = await AtendimentoService.listarAtendimentos(filtros);
    res.json(atendimentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/atendimento/estatisticas
 * Obter estatísticas de atendimentos
 */
router.get('/atendimento/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      profissionalId: req.query.profissionalId as string,
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await AtendimentoService.obterEstatisticas(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/atendimento/atendimento/produtividade
 * Obter produtividade de profissionais
 */
router.get('/atendimento/produtividade', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const produtividade = await AtendimentoService.obterProdutividadeProfissionais(filtros);
    res.json(produtividade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Triagem
router.post('/atendimento/triagem', async (req: Request, res: Response) => {
  try {
    const triagem = await AtendimentoService.realizarTriagem(req.body);
    res.status(201).json(triagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/atendimento/triagem/:id', async (req: Request, res: Response) => {
  try {
    const triagem = await AtendimentoService.atualizarTriagem(req.params.id, req.body);
    res.json(triagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atendimento/triagem/:atendimentoId', async (req: Request, res: Response) => {
  try {
    const triagem = await AtendimentoService.buscarTriagem(req.params.atendimentoId);
    res.json(triagem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Consulta Médica
router.post('/atendimento/consulta', async (req: Request, res: Response) => {
  try {
    const consulta = await AtendimentoService.registrarConsulta(req.body);
    res.status(201).json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/atendimento/consulta/:id', async (req: Request, res: Response) => {
  try {
    const consulta = await AtendimentoService.atualizarConsulta(req.params.id, req.body);
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atendimento/consulta/:atendimentoId', async (req: Request, res: Response) => {
  try {
    const consulta = await AtendimentoService.buscarConsulta(req.params.atendimentoId);
    res.json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// PRESCRIÇÕES
// ============================================================================

router.post('/prescricao', async (req: Request, res: Response) => {
  try {
    const prescricao = await PrescricaoService.criarPrescricao(req.body);
    res.status(201).json(prescricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prescricao/:id', async (req: Request, res: Response) => {
  try {
    const prescricao = await PrescricaoService.buscarPrescricao(req.params.id);
    res.json(prescricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/prescricao/:id', async (req: Request, res: Response) => {
  try {
    const prescricao = await PrescricaoService.atualizarPrescricao(req.params.id, req.body);
    res.json(prescricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/prescricao/:prescricaoId/item', async (req: Request, res: Response) => {
  try {
    const item = await PrescricaoService.adicionarItem(req.params.prescricaoId, req.body);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/prescricao/item/:itemId', async (req: Request, res: Response) => {
  try {
    const item = await PrescricaoService.atualizarItem(req.params.itemId, req.body);
    res.json(item);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/prescricao/item/:itemId', async (req: Request, res: Response) => {
  try {
    await PrescricaoService.removerItem(req.params.itemId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prescricao/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const filtros = {
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
      profissionalId: req.query.profissionalId as string,
    };
    const prescricoes = await PrescricaoService.listarPrescricoesCidadao(req.params.citizenId, filtros);
    res.json(prescricoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prescricao/atendimento/:atendimentoId', async (req: Request, res: Response) => {
  try {
    const prescricoes = await PrescricaoService.listarPrescricoesAtendimento(req.params.atendimentoId);
    res.json(prescricoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prescricao/:id/validade', async (req: Request, res: Response) => {
  try {
    const validade = await PrescricaoService.verificarValidade(req.params.id);
    res.json(validade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prescricao/medicamentos/disponiveis', async (req: Request, res: Response) => {
  try {
    const filtros = {
      nome: req.query.nome as string,
      principioAtivo: req.query.principioAtivo as string,
      unidadeId: req.query.unidadeId as string,
    };
    const medicamentos = await PrescricaoService.buscarMedicamentosDisponiveis(filtros);
    res.json(medicamentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/prescricao/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      profissionalId: req.query.profissionalId as string,
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await PrescricaoService.obterEstatisticas(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/prescricao/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const prescricao = await PrescricaoService.cancelarPrescricao(req.params.id, motivo);
    res.json(prescricao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// EXAMES
// ============================================================================

router.post('/exames/solicitar', async (req: Request, res: Response) => {
  try {
    const exame = await ExamesService.solicitarExame(req.body);
    res.status(201).json(exame);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exames/:id', async (req: Request, res: Response) => {
  try {
    const exame = await ExamesService.buscarExame(req.params.id);
    res.json(exame);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/exames/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, observacoes } = req.body;
    const exame = await ExamesService.atualizarStatus(req.params.id, status, observacoes);
    res.json(exame);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/exames/:id/coleta', async (req: Request, res: Response) => {
  try {
    const exame = await ExamesService.registrarColeta(req.params.id, req.body);
    res.json(exame);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/exames/resultado', async (req: Request, res: Response) => {
  try {
    const resultado = await ExamesService.adicionarResultado(req.body);
    res.status(201).json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/exames/resultado/:id', async (req: Request, res: Response) => {
  try {
    const resultado = await ExamesService.atualizarResultado(req.params.id, req.body);
    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/exames/resultado/:id', async (req: Request, res: Response) => {
  try {
    await ExamesService.removerResultado(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exames/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const filtros = {
      status: req.query.status as any,
      tipoExame: req.query.tipoExame as string,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const exames = await ExamesService.listarExamesCidadao(req.params.citizenId, filtros);
    res.json(exames);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exames/atendimento/:atendimentoId', async (req: Request, res: Response) => {
  try {
    const exames = await ExamesService.listarExamesAtendimento(req.params.atendimentoId);
    res.json(exames);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exames/pendentes/coleta', async (req: Request, res: Response) => {
  try {
    const unidadeId = req.query.unidadeId as string;
    const exames = await ExamesService.listarExamesPendentesColeta(unidadeId);
    res.json(exames);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exames/aguardando/resultado', async (req: Request, res: Response) => {
  try {
    const unidadeId = req.query.unidadeId as string;
    const exames = await ExamesService.listarExamesAguardandoResultado(unidadeId);
    res.json(exames);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exames/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      profissionalId: req.query.profissionalId as string,
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await ExamesService.obterEstatisticas(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/exames/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const exame = await ExamesService.cancelarExame(req.params.id, motivo);
    res.json(exame);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/exames/historico/:citizenId/:tipoExame', async (req: Request, res: Response) => {
  try {
    const historico = await ExamesService.buscarHistoricoExameTipo(
      req.params.citizenId,
      req.params.tipoExame
    );
    res.json(historico);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// ATESTADOS
// ============================================================================

router.post('/atestado', async (req: Request, res: Response) => {
  try {
    const atestado = await AtestadoService.emitirAtestado(req.body);
    res.status(201).json(atestado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atestado/:id', async (req: Request, res: Response) => {
  try {
    const atestado = await AtestadoService.buscarAtestado(req.params.id);
    res.json(atestado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/atestado/:id', async (req: Request, res: Response) => {
  try {
    const atestado = await AtestadoService.atualizarAtestado(req.params.id, req.body);
    res.json(atestado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atestado/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const filtros = {
      tipo: req.query.tipo as any,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const atestados = await AtestadoService.listarAtestadosCidadao(req.params.citizenId, filtros);
    res.json(atestados);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atestado/atendimento/:atendimentoId', async (req: Request, res: Response) => {
  try {
    const atestados = await AtestadoService.listarAtestadosAtendimento(req.params.atendimentoId);
    res.json(atestados);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atestado/ativos', async (req: Request, res: Response) => {
  try {
    const citizenId = req.query.citizenId as string;
    const atestados = await AtestadoService.listarAtestadosAtivos(citizenId);
    res.json(atestados);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atestado/verificar-afastamento/:citizenId', async (req: Request, res: Response) => {
  try {
    const data = req.query.data ? new Date(req.query.data as string) : undefined;
    const resultado = await AtestadoService.verificarAfastamento(req.params.citizenId, data);
    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atestado/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      profissionalId: req.query.profissionalId as string,
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await AtestadoService.obterEstatisticas(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/atestado/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const atestado = await AtestadoService.cancelarAtestado(req.params.id, motivo);
    res.json(atestado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/atestado/:id/segunda-via', async (req: Request, res: Response) => {
  try {
    const atestado = await AtestadoService.gerarSegundaVia(req.params.id);
    res.json(atestado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/atestado/historico/:citizenId', async (req: Request, res: Response) => {
  try {
    const ultimos12Meses = req.query.ultimos12Meses !== 'false';
    const historico = await AtestadoService.buscarHistoricoAfastamentos(req.params.citizenId, ultimos12Meses);
    res.json(historico);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// ENCAMINHAMENTOS
// ============================================================================

router.post('/encaminhamento', async (req: Request, res: Response) => {
  try {
    const encaminhamento = await EncaminhamentoService.criarEncaminhamento(req.body);
    res.status(201).json(encaminhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/encaminhamento/:id', async (req: Request, res: Response) => {
  try {
    const encaminhamento = await EncaminhamentoService.buscarEncaminhamento(req.params.id);
    res.json(encaminhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/encaminhamento/:id', async (req: Request, res: Response) => {
  try {
    const encaminhamento = await EncaminhamentoService.atualizarEncaminhamento(req.params.id, req.body);
    res.json(encaminhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/encaminhamento/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, observacoes } = req.body;
    const encaminhamento = await EncaminhamentoService.atualizarStatus(req.params.id, status, observacoes);
    res.json(encaminhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/encaminhamento/:id/agendar', async (req: Request, res: Response) => {
  try {
    const { dataAgendamento, profissionalDestinoId } = req.body;
    const encaminhamento = await EncaminhamentoService.agendarEncaminhamento(
      req.params.id,
      dataAgendamento,
      profissionalDestinoId
    );
    res.json(encaminhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/encaminhamento/:id/realizar', async (req: Request, res: Response) => {
  try {
    const { atendimentoDestinoId, observacoes } = req.body;
    const encaminhamento = await EncaminhamentoService.registrarRealizacao(
      req.params.id,
      atendimentoDestinoId,
      observacoes
    );
    res.json(encaminhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/encaminhamento/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const filtros = {
      status: req.query.status as any,
      especialidade: req.query.especialidade as string,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const encaminhamentos = await EncaminhamentoService.listarEncaminhamentosCidadao(
      req.params.citizenId,
      filtros
    );
    res.json(encaminhamentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/encaminhamento/atendimento/:atendimentoId', async (req: Request, res: Response) => {
  try {
    const encaminhamentos = await EncaminhamentoService.listarEncaminhamentosAtendimento(req.params.atendimentoId);
    res.json(encaminhamentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/encaminhamento/pendentes', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeDestinoId: req.query.unidadeDestinoId as string,
      especialidade: req.query.especialidade as string,
      prioridade: req.query.prioridade as string,
    };
    const encaminhamentos = await EncaminhamentoService.listarEncaminhamentosPendentes(filtros);
    res.json(encaminhamentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/encaminhamento', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeOrigemId: req.query.unidadeOrigemId as string,
      unidadeDestinoId: req.query.unidadeDestinoId as string,
      profissionalOrigemId: req.query.profissionalOrigemId as string,
      especialidade: req.query.especialidade as string,
      status: req.query.status as any,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const encaminhamentos = await EncaminhamentoService.listarEncaminhamentos(filtros);
    res.json(encaminhamentos);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/encaminhamento/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeOrigemId: req.query.unidadeOrigemId as string,
      unidadeDestinoId: req.query.unidadeDestinoId as string,
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await EncaminhamentoService.obterEstatisticas(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/encaminhamento/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const encaminhamento = await EncaminhamentoService.cancelarEncaminhamento(req.params.id, motivo);
    res.json(encaminhamento);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/encaminhamento/profissionais/:especialidade', async (req: Request, res: Response) => {
  try {
    const unidadeId = req.query.unidadeId as string;
    const profissionais = await EncaminhamentoService.buscarProfissionaisDisponiveis(
      req.params.especialidade,
      unidadeId
    );
    res.json(profissionais);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// GERAÇÃO DE PDFs
// ============================================================================

import PDFSaudeService from '../services/atendimento/pdf-saude.service';

/**
 * POST /api/saude/atendimento/prescricao/:id/pdf
 * Gerar PDF da prescrição
 */
router.post('/prescricao/:id/pdf', async (req: Request, res: Response) => {
  try {
    const filePath = await PDFSaudeService.gerarPrescricaoPDF(req.params.id);
    res.json({
      success: true,
      message: 'PDF gerado com sucesso',
      filePath
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/atendimento/atestado/:id/pdf
 * Gerar PDF do atestado
 */
router.post('/atestado/:id/pdf', async (req: Request, res: Response) => {
  try {
    const filePath = await PDFSaudeService.gerarAtestadoPDF(req.params.id);
    res.json({
      success: true,
      message: 'PDF gerado com sucesso',
      filePath
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/atendimento/exames/:consultaId/pdf
 * Gerar PDF de solicitação de exames
 * Body: { exameIds: string[] }
 */
router.post('/exames/:consultaId/pdf', async (req: Request, res: Response) => {
  try {
    const { exameIds } = req.body;
    const filePath = await PDFSaudeService.gerarSolicitacaoExamesPDF(req.params.consultaId, exameIds);
    res.json({
      success: true,
      message: 'PDF gerado com sucesso',
      filePath
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/atendimento/encaminhamento/:id/pdf
 * Gerar PDF do encaminhamento
 */
router.post('/encaminhamento/:id/pdf', async (req: Request, res: Response) => {
  try {
    const filePath = await PDFSaudeService.gerarEncaminhamentoPDF(req.params.id);
    res.json({
      success: true,
      message: 'PDF gerado com sucesso',
      filePath
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
