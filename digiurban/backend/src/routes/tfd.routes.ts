import { Router } from 'express';
import tfdService from '../services/tfd/tfd.service';
import tfdMontadorService from '../services/tfd/tfd-montador.service';
import protocolToTFDService from '../services/tfd/protocol-to-tfd.service';

const router = Router();

// ==================== DASHBOARD ====================

router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await tfdService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SOLICITAÇÕES ====================

// Listagem com filtros
router.get('/solicitacoes', async (req, res) => {
  try {
    const { status, prioridade, search } = req.query;

    const where: any = {};

    // Filtro por status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filtro por prioridade
    if (prioridade && prioridade !== 'all') {
      where.prioridade = prioridade;
    }

    // Busca por protocolo ID ou nome do cidadão
    if (search) {
      where.OR = [
        { protocolId: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const solicitacoes = await tfdService.findAll(where);
    res.json({ data: solicitacoes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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

// ==================== VEÍCULOS (CRUD COMPLETO) ====================

// Listar todos os veículos
router.get('/veiculos', async (req, res) => {
  try {
    const filters = {
      isActive: req.query.isActive === 'false' ? false : undefined,
      status: req.query.status as string | undefined
    };
    const veiculos = await tfdService.listarVeiculos(filters);
    res.json(veiculos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Listar veículos disponíveis
router.get('/veiculos/disponiveis', async (req, res) => {
  try {
    const veiculos = await tfdService.listarVeiculosDisponiveis();
    res.json(veiculos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar veículo por ID
router.get('/veiculos/:id', async (req, res) => {
  try {
    const veiculo = await tfdService.findVeiculoById(req.params.id);
    if (!veiculo) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }
    res.json(veiculo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar veículo
router.post('/veiculos', async (req, res) => {
  try {
    const veiculo = await tfdService.createVeiculo(req.body);
    res.status(201).json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar veículo
router.put('/veiculos/:id', async (req, res) => {
  try {
    const veiculo = await tfdService.updateVeiculo(req.params.id, req.body);
    res.json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar apenas status do veículo
router.put('/veiculos/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const veiculo = await tfdService.updateVeiculoStatus(req.params.id, status);
    res.json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar veículo (soft delete)
router.delete('/veiculos/:id', async (req, res) => {
  try {
    const veiculo = await tfdService.deleteVeiculo(req.params.id);
    res.json(veiculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== MOTORISTAS (CRUD COMPLETO) ====================

// Listar todos os motoristas
router.get('/motoristas', async (req, res) => {
  try {
    const filters = {
      isActive: req.query.isActive === 'false' ? false : undefined,
      status: req.query.status as string | undefined
    };
    const motoristas = await tfdService.listarMotoristas(filters);
    res.json(motoristas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Listar motoristas disponíveis
router.get('/motoristas/disponiveis', async (req, res) => {
  try {
    const motoristas = await tfdService.listarMotoristasDisponiveis();
    res.json(motoristas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar motorista por ID
router.get('/motoristas/:id', async (req, res) => {
  try {
    const motorista = await tfdService.findMotoristaById(req.params.id);
    if (!motorista) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }
    res.json(motorista);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar motorista
router.post('/motoristas', async (req, res) => {
  try {
    const motorista = await tfdService.createMotorista(req.body);
    res.status(201).json(motorista);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar motorista
router.put('/motoristas/:id', async (req, res) => {
  try {
    const motorista = await tfdService.updateMotorista(req.params.id, req.body);
    res.json(motorista);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar motorista (soft delete)
router.delete('/motoristas/:id', async (req, res) => {
  try {
    const motorista = await tfdService.deleteMotorista(req.params.id);
    res.json(motorista);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ESPECIALIDADES (CRUD COMPLETO) ====================

// Listar especialidades
router.get('/especialidades', async (req, res) => {
  try {
    const apenasAtivas = req.query.apenasAtivas !== 'false';
    const especialidades = await tfdService.listarEspecialidades(apenasAtivas);
    res.json(especialidades);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar especialidade por ID
router.get('/especialidades/:id', async (req, res) => {
  try {
    const especialidade = await tfdService.findEspecialidadeById(req.params.id);
    if (!especialidade) {
      return res.status(404).json({ error: 'Especialidade não encontrada' });
    }
    res.json(especialidade);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar especialidade
router.post('/especialidades', async (req, res) => {
  try {
    const especialidade = await tfdService.createEspecialidade(req.body);
    res.status(201).json(especialidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar especialidade
router.put('/especialidades/:id', async (req, res) => {
  try {
    const especialidade = await tfdService.updateEspecialidade(req.params.id, req.body);
    res.json(especialidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar especialidade (soft delete)
router.delete('/especialidades/:id', async (req, res) => {
  try {
    const especialidade = await tfdService.deleteEspecialidade(req.params.id);
    res.json(especialidade);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DESTINOS (CRUD COMPLETO) ====================

// Listar destinos
router.get('/destinos', async (req, res) => {
  try {
    const apenasAtivos = req.query.apenasAtivos !== 'false';
    const destinos = await tfdService.listarDestinos(apenasAtivos);
    res.json(destinos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar destino por ID
router.get('/destinos/:id', async (req, res) => {
  try {
    const destino = await tfdService.findDestinoById(req.params.id);
    if (!destino) {
      return res.status(404).json({ error: 'Destino não encontrado' });
    }
    res.json(destino);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar destino
router.post('/destinos', async (req, res) => {
  try {
    const destino = await tfdService.createDestino(req.body);
    res.status(201).json(destino);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar destino
router.put('/destinos/:id', async (req, res) => {
  try {
    const destino = await tfdService.updateDestino(req.params.id, req.body);
    res.json(destino);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar destino (soft delete)
router.delete('/destinos/:id', async (req, res) => {
  try {
    const destino = await tfdService.deleteDestino(req.params.id);
    res.json(destino);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
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

// ==================== ENUMS DINÂMICOS (FASE 2) ====================

/**
 * Endpoint genérico para buscar dados dinâmicos de entidades do APP
 * Usado por formulários de serviços via enumSource
 */
router.get('/enums/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const { filters } = req.query;

    let parsedFilters: any = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters as string);
      } catch (e) {
        // Ignora se não for JSON válido
      }
    }

    switch (entity) {
      case 'especialidades':
        const especialidades = await tfdService.listarEspecialidades(true);
        return res.json(especialidades);

      case 'veiculos':
        const veiculosFilters = parsedFilters.status ? { status: parsedFilters.status } : {};
        const veiculos = await tfdService.listarVeiculos(veiculosFilters);
        return res.json(veiculos);

      case 'motoristas':
        const motoristasFilters = parsedFilters.status ? { status: parsedFilters.status } : {};
        const motoristas = await tfdService.listarMotoristas(motoristasFilters);
        return res.json(motoristas);

      case 'destinos':
        const destinos = await tfdService.listarDestinos(true);
        return res.json(destinos);

      default:
        return res.status(404).json({ error: `Entity '${entity}' not found` });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
