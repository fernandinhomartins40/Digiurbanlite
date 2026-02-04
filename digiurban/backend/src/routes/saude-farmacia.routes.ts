// ============================================================================
// ROUTES - APP SAÚDE: FARMÁCIA MUNICIPAL
// ============================================================================

import { Router, Request, Response } from 'express';
import { EstoqueService, DispensacaoService } from '../services/farmacia';
import MedicamentoService from '../services/medicamento/medicamento.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Middleware de autenticação para todas as rotas de farmácia
router.use(authenticateToken);

// ============================================================================
// MEDICAMENTOS RENAME
// ============================================================================

/**
 * GET /api/saude/farmacia/medicamentos/rename/search
 * Buscar medicamentos da RENAME
 */
router.get('/medicamentos/rename/search', async (req: Request, res: Response) => {
  try {
    const termo = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (!termo) {
      return res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório' });
    }

    const medicamentos = await MedicamentoService.searchRename(termo, limit);
    res.json(medicamentos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/medicamentos/rename/list
 * Listar medicamentos da RENAME com paginação
 */
router.get('/medicamentos/rename/list', async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const resultado = await MedicamentoService.listRename(page, limit);
    res.json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LOTES DE MEDICAMENTOS
// ============================================================================

/**
 * POST /api/saude/farmacia/lote
 * Criar lote de medicamento
 */
router.post('/lote', async (req: Request, res: Response) => {
  try {
    const lote = await EstoqueService.criarLote(req.body);
    res.status(201).json(lote);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/lote/:id
 * Buscar lote por ID
 */
router.get('/lote/:id', async (req: Request, res: Response) => {
  try {
    const lote = await EstoqueService.buscarLote(req.params.id);
    res.json(lote);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/farmacia/lote/:id
 * Atualizar lote
 */
router.put('/lote/:id', async (req: Request, res: Response) => {
  try {
    const lote = await EstoqueService.atualizarLote(req.params.id, req.body);
    res.json(lote);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/lote/medicamento/:medicamentoId
 * Listar lotes de um medicamento
 */
router.get('/lote/medicamento/:medicamentoId', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      apenasValidos: req.query.apenasValidos === 'true',
      apenasComEstoque: req.query.apenasComEstoque === 'true',
    };
    const lotes = await EstoqueService.listarLotesMedicamento(req.params.medicamentoId, filtros);
    res.json(lotes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/lote/unidade/:unidadeId
 * Listar lotes de uma unidade
 */
router.get('/lote/unidade/:unidadeId', async (req: Request, res: Response) => {
  try {
    const filtros = {
      medicamentoId: req.query.medicamentoId as string,
      apenasValidos: req.query.apenasValidos === 'true',
      apenasComEstoque: req.query.apenasComEstoque === 'true',
    };
    const lotes = await EstoqueService.listarLotesUnidade(req.params.unidadeId, filtros);
    res.json(lotes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/farmacia/lote/baixa
 * Dar baixa em lote
 */
router.post('/lote/baixa', async (req: Request, res: Response) => {
  try {
    const lote = await EstoqueService.darBaixaLote(req.body);
    res.json(lote);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/farmacia/lote/:id/adicionar
 * Adicionar quantidade ao lote
 */
router.post('/lote/:id/adicionar', async (req: Request, res: Response) => {
  try {
    const { quantidade, motivo } = req.body;
    const lote = await EstoqueService.adicionarQuantidade(req.params.id, quantidade, motivo);
    res.json(lote);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/lote/proximos-vencimento
 * Listar lotes próximos do vencimento
 */
router.get('/lote/proximos-vencimento', async (req: Request, res: Response) => {
  try {
    const diasAntecedencia = req.query.dias ? parseInt(req.query.dias as string) : 90;
    const unidadeId = req.query.unidadeId as string;
    const lotes = await EstoqueService.listarLotesProximosVencimento(diasAntecedencia, unidadeId);
    res.json(lotes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/lote/vencidos
 * Listar lotes vencidos
 */
router.get('/lote/vencidos', async (req: Request, res: Response) => {
  try {
    const unidadeId = req.query.unidadeId as string;
    const lotes = await EstoqueService.listarLotesVencidos(unidadeId);
    res.json(lotes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// ESTOQUE
// ============================================================================

/**
 * POST /api/saude/farmacia/estoque
 * Criar novo medicamento e adicionar ao estoque
 */
router.post('/estoque', async (req: Request, res: Response) => {
  try {
    const { medicamentoId, isRename, ...estoqueData } = req.body;

    let medicamento;

    // Se for medicamento da RENAME, usa o ID
    if (isRename && medicamentoId) {
      medicamento = await MedicamentoService.findById(medicamentoId);
      if (!medicamento) {
        return res.status(404).json({ error: 'Medicamento RENAME não encontrado' });
      }
    } else {
      // Se for manual, cria novo medicamento
      medicamento = await MedicamentoService.createMedicamento({
        nome: estoqueData.nome,
        principioAtivo: estoqueData.principioAtivo,
        apresentacao: `${estoqueData.formaFarmaceutica} ${estoqueData.concentracao || ''}`.trim(),
        tipo: estoqueData.formaFarmaceutica,
        concentracao: estoqueData.concentracao,
        fabricante: estoqueData.fabricante,
        isControlado: estoqueData.isControlado || false,
      });
    }

    // Criar entrada no estoque (usar serviço existente ou criar novo)
    const estoque = await MedicamentoService.createEstoque({
      medicamentoId: medicamento.id,
      unidadeId: req.body.unidadeId || 'default-unidade-id', // TODO: Pegar da sessão
      lote: estoqueData.lote,
      validade: new Date(estoqueData.validade),
      dataValidade: new Date(estoqueData.validade),
      quantidade: estoqueData.quantidade,
      quantidadeAtual: estoqueData.quantidade,
      estoqueMinimo: estoqueData.estoqueMinimo,
      quantidadeMinima: estoqueData.estoqueMinimo,
    });

    res.status(201).json({
      success: true,
      medicamento,
      estoque,
    });
  } catch (error: any) {
    console.error('Erro ao criar estoque:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/estoque/:unidadeId
 * Obter estoque consolidado por unidade
 */
router.get('/estoque/:unidadeId', async (req: Request, res: Response) => {
  try {
    const estoque = await EstoqueService.obterEstoquePorUnidade(req.params.unidadeId);
    res.json(estoque);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/farmacia/estoque/verificar-disponibilidade
 * Verificar disponibilidade de medicamento
 */
router.post('/estoque/verificar-disponibilidade', async (req: Request, res: Response) => {
  try {
    const { medicamentoId, quantidade, unidadeId } = req.body;
    const disponibilidade = await EstoqueService.verificarDisponibilidade(
      medicamentoId,
      quantidade,
      unidadeId
    );
    res.json(disponibilidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/estoque/estatisticas
 * Obter estatísticas de estoque
 */
router.get('/estoque/estatisticas', async (req: Request, res: Response) => {
  try {
    const unidadeId = req.query.unidadeId as string;
    const estatisticas = await EstoqueService.obterEstatisticas(unidadeId);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// TRANSFERÊNCIAS DE ESTOQUE
// ============================================================================

/**
 * POST /api/saude/farmacia/transferencia
 * Criar transferência de estoque
 */
router.post('/transferencia', async (req: Request, res: Response) => {
  try {
    const transferencia = await EstoqueService.criarTransferencia(req.body);
    res.status(201).json(transferencia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/farmacia/transferencia/:id/aprovar
 * Aprovar transferência
 */
router.put('/transferencia/:id/aprovar', async (req: Request, res: Response) => {
  try {
    const { aprovadoPorId } = req.body;
    const transferencia = await EstoqueService.aprovarTransferencia(req.params.id, aprovadoPorId);
    res.json(transferencia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/farmacia/transferencia/:id/recusar
 * Recusar transferência
 */
router.put('/transferencia/:id/recusar', async (req: Request, res: Response) => {
  try {
    const { aprovadoPorId, motivo } = req.body;
    const transferencia = await EstoqueService.recusarTransferencia(
      req.params.id,
      aprovadoPorId,
      motivo
    );
    res.json(transferencia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/farmacia/transferencia/:id/cancelar
 * Cancelar transferência
 */
router.put('/transferencia/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const transferencia = await EstoqueService.cancelarTransferencia(req.params.id, motivo);
    res.json(transferencia);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/transferencia
 * Listar transferências
 */
router.get('/transferencia', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeOrigemId: req.query.unidadeOrigemId as string,
      unidadeDestinoId: req.query.unidadeDestinoId as string,
      status: req.query.status as any,
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
    };
    const transferencias = await EstoqueService.listarTransferencias(filtros);
    res.json(transferencias);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// ALERTAS DE ESTOQUE
// ============================================================================

/**
 * POST /api/saude/farmacia/alerta
 * Criar alerta de estoque
 */
router.post('/alerta', async (req: Request, res: Response) => {
  try {
    const alerta = await EstoqueService.criarAlerta(req.body);
    res.status(201).json(alerta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/farmacia/alerta/:id/visualizar
 * Marcar alerta como visualizado
 */
router.put('/alerta/:id/visualizar', async (req: Request, res: Response) => {
  try {
    const { visualizadoPorId } = req.body;
    const alerta = await EstoqueService.visualizarAlerta(req.params.id, visualizadoPorId);
    res.json(alerta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/farmacia/alerta/:id/resolver
 * Resolver alerta
 */
router.put('/alerta/:id/resolver', async (req: Request, res: Response) => {
  try {
    const { resolvidoPorId, observacoes } = req.body;
    const alerta = await EstoqueService.resolverAlerta(req.params.id, resolvidoPorId, observacoes);
    res.json(alerta);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/alerta/ativos
 * Listar alertas ativos
 */
router.get('/alerta/ativos', async (req: Request, res: Response) => {
  try {
    const unidadeId = req.query.unidadeId as string;
    const alertas = await EstoqueService.listarAlertasAtivos(unidadeId);
    res.json(alertas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/farmacia/alerta/verificar-automaticos
 * Verificar e gerar alertas automáticos
 */
router.post('/alerta/verificar-automaticos', async (req: Request, res: Response) => {
  try {
    const unidadeId = req.query.unidadeId as string;
    const alertas = await EstoqueService.verificarAlertasAutomaticos(unidadeId);
    res.json(alertas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// DISPENSAÇÃO DE MEDICAMENTOS
// ============================================================================

/**
 * POST /api/saude/farmacia/dispensacao
 * Dispensar medicamento
 */
router.post('/dispensacao', async (req: Request, res: Response) => {
  try {
    const dispensacao = await DispensacaoService.dispensarMedicamento(req.body);
    res.status(201).json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/dispensacao/:id
 * Buscar dispensação
 */
router.get('/dispensacao/:id', async (req: Request, res: Response) => {
  try {
    const dispensacao = await DispensacaoService.buscarDispensacao(req.params.id);
    res.json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/farmacia/dispensacao/:id
 * Atualizar dispensação
 */
router.put('/dispensacao/:id', async (req: Request, res: Response) => {
  try {
    const dispensacao = await DispensacaoService.atualizarDispensacao(req.params.id, req.body);
    res.json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/dispensacao/prescricao/:prescricaoId
 * Listar dispensações de uma prescrição
 */
router.get('/dispensacao/prescricao/:prescricaoId', async (req: Request, res: Response) => {
  try {
    const dispensacoes = await DispensacaoService.listarDispensacoesPrescricao(req.params.prescricaoId);
    res.json(dispensacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/dispensacao/cidadao/:citizenId
 * Listar dispensações de um cidadão
 */
router.get('/dispensacao/cidadao/:citizenId', async (req: Request, res: Response) => {
  try {
    const filtros = {
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
      medicamentoId: req.query.medicamentoId as string,
    };
    const dispensacoes = await DispensacaoService.listarDispensacoesCidadao(
      req.params.citizenId,
      filtros
    );
    res.json(dispensacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/dispensacao/unidade/:unidadeId
 * Listar dispensações por unidade
 */
router.get('/dispensacao/unidade/:unidadeId', async (req: Request, res: Response) => {
  try {
    const filtros = {
      dataInicio: req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined,
      dataFim: req.query.dataFim ? new Date(req.query.dataFim as string) : undefined,
      medicamentoId: req.query.medicamentoId as string,
      dispensadoPorId: req.query.dispensadoPorId as string,
    };
    const dispensacoes = await DispensacaoService.listarDispensacoesUnidade(
      req.params.unidadeId,
      filtros
    );
    res.json(dispensacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/dispensacao/status/:prescricaoId
 * Verificar status de dispensação de uma prescrição
 */
router.get('/dispensacao/status/:prescricaoId', async (req: Request, res: Response) => {
  try {
    const status = await DispensacaoService.verificarStatusDispensacao(req.params.prescricaoId);
    res.json(status);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/farmacia/dispensacao/completa/:prescricaoId
 * Dispensar prescrição completa
 */
router.post('/dispensacao/completa/:prescricaoId', async (req: Request, res: Response) => {
  try {
    const { unidadeId, dispensadoPorId } = req.body;
    const resultado = await DispensacaoService.dispensarPrescricaoCompleta(
      req.params.prescricaoId,
      unidadeId,
      dispensadoPorId
    );
    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/dispensacao/estatisticas
 * Obter estatísticas de dispensação
 */
router.get('/dispensacao/estatisticas', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      dataInicio: new Date(req.query.dataInicio as string),
      dataFim: new Date(req.query.dataFim as string),
    };
    const estatisticas = await DispensacaoService.obterEstatisticas(filtros);
    res.json(estatisticas);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/saude/farmacia/dispensacao/:id/cancelar
 * Cancelar dispensação
 */
router.put('/dispensacao/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { motivo, canceladoPorId } = req.body;
    const dispensacao = await DispensacaoService.cancelarDispensacao(
      req.params.id,
      motivo,
      canceladoPorId
    );
    res.json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/dispensacao/pendentes/:unidadeId
 * Listar prescrições pendentes de dispensação
 */
router.get('/dispensacao/pendentes/:unidadeId', async (req: Request, res: Response) => {
  try {
    const prescricoes = await DispensacaoService.listarPrescricoesPendentes(req.params.unidadeId);
    res.json(prescricoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/saude/farmacia/dispensacao/relatorio/auditoria
 * Gerar relatório de dispensação para auditoria
 */
router.post('/dispensacao/relatorio/auditoria', async (req: Request, res: Response) => {
  try {
    const filtros = {
      unidadeId: req.query.unidadeId as string,
      dataInicio: new Date(req.body.dataInicio),
      dataFim: new Date(req.body.dataFim),
      medicamentoId: req.body.medicamentoId as string,
    };
    const relatorio = await DispensacaoService.gerarRelatorioAuditoria(filtros);
    res.json(relatorio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
