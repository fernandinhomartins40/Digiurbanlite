import { Router } from 'express';
import produtorRuralService from '../services/produtor-rural/produtor-rural.service';

const router = Router();

// ============================================================================
// MS-19: CADASTRO DE PRODUTORES RURAIS
// ============================================================================

// Criar produtor rural
router.post('/produtores', async (req, res) => {
  try {
    const produtor = await produtorRuralService.createProdutor(req.body);
    res.status(201).json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todos os produtores (com filtros)
router.get('/produtores', async (req, res) => {
  try {
    const { tipoProducao, temCAR, temDAP, pendencias, isActive } = req.query;

    const filters: any = {};
    if (tipoProducao) filters.tipoProducao = tipoProducao as string;
    if (temCAR !== undefined) filters.temCAR = temCAR === 'true';
    if (temDAP !== undefined) filters.temDAP = temDAP === 'true';
    if (pendencias !== undefined) filters.pendencias = pendencias === 'true';
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const produtores = await produtorRuralService.listProdutores(filters);
    res.json(produtores);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Listar produtores ativos
router.get('/produtores/ativos', async (req, res) => {
  try {
    const produtores = await produtorRuralService.listProdutoresAtivos();
    res.json(produtores);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar produtores por tipo de produção
router.get('/produtores/tipo-producao/:tipoProducao', async (req, res) => {
  try {
    const produtores = await produtorRuralService.findProdutoresByTipo(req.params.tipoProducao);
    res.json(produtores);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar produtores com pendências
router.get('/produtores/pendencias', async (req, res) => {
  try {
    const produtores = await produtorRuralService.findProdutoresComPendencias();
    res.json(produtores);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Estatísticas
router.get('/produtores/statistics', async (req, res) => {
  try {
    const stats = await produtorRuralService.getStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar produtor por ID
router.get('/produtores/:id', async (req, res) => {
  try {
    const produtor = await produtorRuralService.findProdutorById(req.params.id);
    res.json(produtor);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Buscar produtor por CPF
router.get('/produtores/cpf/:cpf', async (req, res) => {
  try {
    const produtor = await produtorRuralService.findProdutorByCPF(req.params.cpf);
    res.json(produtor);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Buscar produtor por citizenId
router.get('/produtores/citizen/:citizenId', async (req, res) => {
  try {
    const produtor = await produtorRuralService.findProdutorByCitizenId(req.params.citizenId);
    res.json(produtor);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Atualizar produtor
router.put('/produtores/:id', async (req, res) => {
  try {
    const produtor = await produtorRuralService.updateProdutor(req.params.id, req.body);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar tipo de produção
router.post('/produtores/:id/tipos-producao', async (req, res) => {
  try {
    const { tipoProducao } = req.body;
    const produtor = await produtorRuralService.addTipoProducao(req.params.id, tipoProducao);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remover tipo de produção
router.delete('/produtores/:id/tipos-producao/:tipoProducao', async (req, res) => {
  try {
    const produtor = await produtorRuralService.removeTipoProducao(
      req.params.id,
      req.params.tipoProducao
    );
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Registrar pendência
router.post('/produtores/:id/pendencias', async (req, res) => {
  try {
    const { motivoPendencia } = req.body;
    const produtor = await produtorRuralService.registrarPendencia(req.params.id, motivoPendencia);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Resolver pendência
router.delete('/produtores/:id/pendencias', async (req, res) => {
  try {
    const produtor = await produtorRuralService.resolverPendencia(req.params.id);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar CAR
router.patch('/produtores/:id/car', async (req, res) => {
  try {
    const { car } = req.body;
    const produtor = await produtorRuralService.updateCAR(req.params.id, car);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar DAP
router.patch('/produtores/:id/dap', async (req, res) => {
  try {
    const { dap } = req.body;
    const produtor = await produtorRuralService.updateDAP(req.params.id, dap);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Desativar produtor
router.patch('/produtores/:id/deactivate', async (req, res) => {
  try {
    const produtor = await produtorRuralService.deactivateProdutor(req.params.id);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reativar produtor
router.patch('/produtores/:id/reactivate', async (req, res) => {
  try {
    const produtor = await produtorRuralService.reactivateProdutor(req.params.id);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Upload de foto
router.post('/produtores/:id/foto', async (req, res) => {
  try {
    const { fotoUrl } = req.body;
    const produtor = await produtorRuralService.uploadFoto(req.params.id, fotoUrl);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Adicionar documento
router.post('/produtores/:id/documentos', async (req, res) => {
  try {
    const produtor = await produtorRuralService.addDocumento(req.params.id, req.body);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remover documento
router.delete('/produtores/:id/documentos/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const produtor = await produtorRuralService.removeDocumento(req.params.id, index);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Emitir carteirinha
router.post('/produtores/:id/carteirinha', async (req, res) => {
  try {
    const produtor = await produtorRuralService.emitirCarteirinha(req.params.id);
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar por número de carteirinha
router.get('/produtores/carteirinha/:numero', async (req, res) => {
  try {
    const produtor = await produtorRuralService.findByCarteirinha(req.params.numero);
    res.json(produtor);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Buscar com propriedades
router.get('/produtores/:id/propriedades', async (req, res) => {
  try {
    const produtor = await produtorRuralService.findProdutorComPropriedades(req.params.id);
    res.json(produtor);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Buscar histórico completo
router.get('/produtores/:id/historico', async (req, res) => {
  try {
    const produtor = await produtorRuralService.findHistoricoCompleto(req.params.id);
    res.json(produtor);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Validar DAP
router.patch('/produtores/:id/validar-dap', async (req, res) => {
  try {
    const { dataValidade } = req.body;
    const produtor = await produtorRuralService.validarDAP(req.params.id, new Date(dataValidade));
    res.json(produtor);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar produtor
router.delete('/produtores/:id', async (req, res) => {
  try {
    const result = await produtorRuralService.deleteProdutor(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
