// ============================================================================
// ROUTES - APP SAÚDE: FARMÁCIA MUNICIPAL
// ============================================================================

import { Router, Request, Response } from 'express';
import { EstoqueService, DispensacaoService } from '../services/farmacia';
import MedicamentoService from '../services/medicamento/medicamento.service';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

function parseDateParam(value: unknown): Date | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

async function resolveUnidadeId(unidadeId?: string) {
  if (unidadeId) return unidadeId;

  const primeiraAtiva = await prisma.unidadeSaude.findFirst({
    where: { isActive: true },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  return primeiraAtiva?.id;
}

function resolveDateRange(dataInicio?: Date, dataFim?: Date) {
  if (dataInicio && dataFim) {
    return { dataInicio, dataFim };
  }

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);

  return {
    dataInicio: dataInicio || inicioMes,
    dataFim: dataFim || fimHoje,
  };
}

function mapEstoqueItem(item: any) {
  const quantidadeAtual = item.quantidadeAtual ?? item.quantidade ?? 0;
  const quantidadeMinima = item.quantidadeMinima ?? item.estoqueMinimo ?? 0;
  const quantidadeMaxima = Math.max(
    item.quantidadeMaxima ?? 0,
    quantidadeMinima > 0 ? quantidadeMinima * 10 : 0,
    quantidadeAtual || 1
  );

  return {
    id: item.id,
    medicamentoId: item.medicamentoId,
    medicamento: item.medicamento?.nome || item.medicamentoNome || 'Nao informado',
    nome: item.medicamento?.nome || item.medicamentoNome || 'Nao informado',
    principioAtivo: item.medicamento?.principioAtivo || null,
    unidadeId: item.unidadeId,
    unidadeSaudeId: item.unidadeId,
    lote: item.lote,
    validade: item.validade || item.dataValidade || null,
    dataValidade: item.dataValidade || item.validade || null,
    quantidade: quantidadeAtual,
    quantidadeAtual,
    quantidadeMinima,
    estoqueMinimo: quantidadeMinima,
    quantidadeMaxima,
    status: item.status || null,
  };
}

function mapAlertaItem(item: any) {
  return {
    id: item.id,
    tipo: item.tipoAlerta || item.tipo || 'ESTOQUE_BAIXO',
    mensagem: item.mensagem || null,
    medicamento: item.medicamento?.nome || item.medicamento || 'Nao informado',
    quantidadeAtual: item.quantidadeAtual ?? null,
    quantidadeMinima: item.quantidadeMinima ?? null,
    dataValidade: item.dataVencimento || item.dataValidade || null,
    unidadeId: item.unidadeId || null,
    visualizado: item.visualizado ?? false,
    dataGeracao: item.dataGeracao || null,
  };
}

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
    const unidadeId = await resolveUnidadeId(req.body.unidadeId);

    if (!unidadeId) {
      return res
        .status(400)
        .json({ error: 'Nenhuma unidade de saude ativa encontrada para vinculacao do estoque' });
    }

    const validade = new Date(estoqueData.validade);
    if (!estoqueData.validade || Number.isNaN(validade.getTime())) {
      return res.status(400).json({ error: 'Data de validade invalida' });
    }

    const quantidade = Number(estoqueData.quantidade);
    const estoqueMinimo = Number(estoqueData.estoqueMinimo);
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      return res.status(400).json({ error: 'Quantidade invalida' });
    }
    if (!Number.isFinite(estoqueMinimo) || estoqueMinimo < 0) {
      return res.status(400).json({ error: 'Estoque minimo invalido' });
    }

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
    req.body.unidadeId = unidadeId;
    estoqueData.quantidade = quantidade;
    estoqueData.estoqueMinimo = estoqueMinimo;
    estoqueData.validade = validade.toISOString();

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
      item: mapEstoqueItem({ ...estoque, medicamento }),
    });
  } catch (error: any) {
    console.error('Erro ao criar estoque:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/estoque
 * Listar estoque de medicamentos
 */
router.get('/estoque', async (req: Request, res: Response) => {
  try {
    const unidadeId = await resolveUnidadeId(req.query.unidadeId as string | undefined);
    if (!unidadeId) {
      return res.json([]);
    }

    const status = req.query.status as string | undefined;
    const estoque = await MedicamentoService.findEstoqueByUnidade(unidadeId, status as any);
    res.json(estoque.map(mapEstoqueItem));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/estoque/:unidadeId
 * Obter estoque consolidado por unidade
 */
router.get('/estoque/unidade/:unidadeId', async (req: Request, res: Response) => {
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

/**
 * PUT /api/saude/farmacia/estoque/:id
 * Atualizar estoque de medicamento
 */
router.put('/estoque/:id', async (req: Request, res: Response) => {
  try {
    const updateData: any = {};
    if (req.body.quantidadeAtual !== undefined) {
      updateData.quantidadeAtual = Number(req.body.quantidadeAtual);
    }
    if (req.body.quantidadeMinima !== undefined) {
      updateData.quantidadeMinima = Number(req.body.quantidadeMinima);
    }
    if (req.body.estoqueMinimo !== undefined && updateData.quantidadeMinima === undefined) {
      updateData.quantidadeMinima = Number(req.body.estoqueMinimo);
    }
    if (req.body.quantidadeMaxima !== undefined) {
      updateData.quantidadeMaxima = Number(req.body.quantidadeMaxima);
    }
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
    }

    const estoque = await MedicamentoService.updateEstoque(req.params.id, updateData);
    res.json(mapEstoqueItem(estoque));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/estoque/:unidadeId', async (req: Request, res: Response) => {
  try {
    const estoque = await EstoqueService.obterEstoquePorUnidade(req.params.unidadeId);
    res.json(estoque);
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

router.post('/transferencia/:id/confirmar', async (req: Request, res: Response) => {
  try {
    const aprovadoPorId = req.body.aprovadoPor || req.body.aprovadoPorId || req.userId;
    if (!aprovadoPorId) {
      return res.status(400).json({ error: 'aprovadoPorId e obrigatorio' });
    }

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
 * GET /api/saude/farmacia/alertas
 * Listar alertas de estoque (alias)
 */
router.get('/alertas', async (req: Request, res: Response) => {
  try {
    const unidadeId = req.query.unidadeId as string | undefined;
    const apenasAtivos = req.query.ativos !== 'false';
    const alertas = apenasAtivos
      ? await EstoqueService.listarAlertasAtivos(unidadeId)
      : await EstoqueService.listarAlertas({ unidadeId });

    res.json(alertas.map(mapAlertaItem));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/alerta
 * Listar alertas de estoque
 */
router.get('/alerta', async (req: Request, res: Response) => {
  try {
    const unidadeId = req.query.unidadeId as string | undefined;
    const alertas = await EstoqueService.listarAlertas({ unidadeId });
    res.json(alertas.map(mapAlertaItem));
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
    res.json(alertas.map(mapAlertaItem));
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
    const profissionalId = req.body.profissionalId || req.body.dispensadoPor || req.userId;
    if (!profissionalId) {
      return res.status(400).json({ error: 'profissionalId e obrigatorio' });
    }

    if (Array.isArray(req.body.itens) && req.body.itens.length > 0) {
      const resultados = [] as any[];

      for (const item of req.body.itens) {
        const estoqueId = item?.estoqueId as string | undefined;
        const quantidade = Number(item?.quantidade);

        if (!estoqueId || !Number.isFinite(quantidade) || quantidade <= 0) {
          return res.status(400).json({ error: 'Itens da dispensacao estao invalidos' });
        }

        const estoque = await MedicamentoService.findEstoqueById(estoqueId);
        if (!estoque) {
          return res.status(404).json({ error: `Estoque nao encontrado: ${estoqueId}` });
        }

        const atual = estoque.quantidadeAtual ?? estoque.quantidade ?? 0;
        if (atual < quantidade) {
          return res.status(400).json({
            error: `Quantidade insuficiente em estoque para ${estoque.medicamento?.nome || estoqueId}`,
          });
        }

        await MedicamentoService.removerQuantidade(estoqueId, quantidade);

        const dispensacao = await DispensacaoService.dispensarMedicamento({
          prescricaoId: req.body.prescricaoId,
          medicamentoId: estoque.medicamentoId,
          estoqueId,
          citizenId: req.body.citizenId || req.body.cidadaoId,
          atendimentoId: req.body.atendimentoId,
          quantidade,
          dispensadoPor: profissionalId,
          observacoes: req.body.observacoes,
        } as any);

        resultados.push(dispensacao);
      }

      return res.status(201).json({
        success: true,
        totalItens: resultados.length,
        dispensacoes: resultados,
      });
    }

    const dispensacao = await DispensacaoService.dispensarMedicamento({
      ...req.body,
      dispensadoPor: profissionalId,
    });
    res.status(201).json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/dispensacoes', async (req: Request, res: Response) => {
  try {
    const profissionalId = req.body.profissionalId || req.body.dispensadoPor || req.userId;
    if (!profissionalId) {
      return res.status(400).json({ error: 'profissionalId e obrigatorio' });
    }

    if (Array.isArray(req.body.itens) && req.body.itens.length > 0) {
      const resultados = [] as any[];

      for (const item of req.body.itens) {
        const estoqueId = item?.estoqueId as string | undefined;
        const quantidade = Number(item?.quantidade);

        if (!estoqueId || !Number.isFinite(quantidade) || quantidade <= 0) {
          return res.status(400).json({ error: 'Itens da dispensacao estao invalidos' });
        }

        const estoque = await MedicamentoService.findEstoqueById(estoqueId);
        if (!estoque) {
          return res.status(404).json({ error: `Estoque nao encontrado: ${estoqueId}` });
        }

        const atual = estoque.quantidadeAtual ?? estoque.quantidade ?? 0;
        if (atual < quantidade) {
          return res.status(400).json({
            error: `Quantidade insuficiente em estoque para ${estoque.medicamento?.nome || estoqueId}`,
          });
        }

        await MedicamentoService.removerQuantidade(estoqueId, quantidade);

        const dispensacao = await DispensacaoService.dispensarMedicamento({
          prescricaoId: req.body.prescricaoId,
          medicamentoId: estoque.medicamentoId,
          estoqueId,
          citizenId: req.body.citizenId || req.body.cidadaoId,
          atendimentoId: req.body.atendimentoId,
          quantidade,
          dispensadoPor: profissionalId,
          observacoes: req.body.observacoes,
        } as any);

        resultados.push(dispensacao);
      }

      return res.status(201).json({
        success: true,
        totalItens: resultados.length,
        dispensacoes: resultados,
      });
    }

    const response = await DispensacaoService.dispensarMedicamento({
      ...req.body,
      dispensadoPor: profissionalId,
    } as any);

    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/dispensacao
 * Listar dispensacoes com filtros
 */
router.get('/dispensacao', async (req: Request, res: Response) => {
  try {
    const dataInicio = parseDateParam(req.query.dataInicio);
    const dataFim = parseDateParam(req.query.dataFim);
    const where: any = {};

    if (req.query.citizenId) where.citizenId = req.query.citizenId as string;
    if (req.query.cidadaoId) where.citizenId = req.query.cidadaoId as string;
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = dataInicio;
      if (dataFim) where.data.lte = dataFim;
    }

    if (req.query.unidadeId) {
      const estoques = await prisma.estoqueMedicamento.findMany({
        where: { unidadeId: req.query.unidadeId as string },
        select: { id: true },
      });
      where.estoqueId = { in: estoques.map((item) => item.id) };
    }

    const dispensacoes = await prisma.dispensacaoMedicamento.findMany({
      where,
      orderBy: { data: 'desc' },
      take: 200,
    });

    res.json(dispensacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/saude/farmacia/dispensacao/:id
 * Buscar dispensação
 */
router.get('/dispensacao/item/:id', async (req: Request, res: Response) => {
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
router.put('/dispensacao/item/:id', async (req: Request, res: Response) => {
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
      dataInicio: parseDateParam(req.query.dataInicio),
      dataFim: parseDateParam(req.query.dataFim),
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
      dataInicio: parseDateParam(req.query.dataInicio),
      dataFim: parseDateParam(req.query.dataFim),
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
    const parsedInicio = parseDateParam(req.query.dataInicio);
    const parsedFim = parseDateParam(req.query.dataFim);
    const periodo = resolveDateRange(parsedInicio, parsedFim);

    const filtros = {
      unidadeId: req.query.unidadeId as string,
      dataInicio: periodo.dataInicio,
      dataFim: periodo.dataFim,
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
      dataInicio: parseDateParam(req.body.dataInicio),
      dataFim: parseDateParam(req.body.dataFim),
      medicamentoId: req.body.medicamentoId as string,
    };
    const relatorio = await DispensacaoService.gerarRelatorioAuditoria(filtros);
    res.json(relatorio);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/dispensacoes', async (req: Request, res: Response) => {
  try {
    const dataInicio = parseDateParam(req.query.dataInicio);
    const dataFim = parseDateParam(req.query.dataFim);
    const where: any = {};

    if (req.query.citizenId) where.citizenId = req.query.citizenId as string;
    if (req.query.cidadaoId) where.citizenId = req.query.cidadaoId as string;
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = dataInicio;
      if (dataFim) where.data.lte = dataFim;
    }

    if (req.query.unidadeId) {
      const estoques = await prisma.estoqueMedicamento.findMany({
        where: { unidadeId: req.query.unidadeId as string },
        select: { id: true },
      });
      where.estoqueId = { in: estoques.map((item) => item.id) };
    }

    const dispensacoes = await prisma.dispensacaoMedicamento.findMany({
      where,
      orderBy: { data: 'desc' },
      take: 200,
    });

    res.json(dispensacoes);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/dispensacao/:id', async (req: Request, res: Response) => {
  try {
    const dispensacao = await DispensacaoService.buscarDispensacao(req.params.id);
    res.json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/dispensacao/:id', async (req: Request, res: Response) => {
  try {
    const dispensacao = await DispensacaoService.atualizarDispensacao(req.params.id, req.body);
    res.json(dispensacao);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
