import { Router } from 'express';
import transporteEscolarService from '../../services/transporte-escolar/transporte-escolar.service';
import { prisma } from '../../lib/prisma';

const router = Router();

// ==================== ESTATÍSTICAS ====================

// GET /api/apps/educacao/transporte/stats
router.get('/stats', async (_req, res) => {
  try {
    res.json(await transporteEscolarService.getEstatisticas());
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao obter estatísticas' });
  }
});

// ==================== VEÍCULOS ====================

// GET /api/apps/educacao/transporte/veiculos?disponiveis=true
router.get('/veiculos', async (req, res) => {
  try {
    const lista =
      req.query.disponiveis === 'true'
        ? await transporteEscolarService.listVeiculosDisponiveis()
        : await transporteEscolarService.listAllVeiculos();
    res.json(lista);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar veículos' });
  }
});

// POST /api/apps/educacao/transporte/veiculos
router.post('/veiculos', async (req, res) => {
  try {
    if (!req.body.placa || !req.body.modelo || !req.body.capacidade) {
      return res.status(400).json({ error: 'placa, modelo e capacidade são obrigatórios' });
    }
    res.status(201).json(await transporteEscolarService.createVeiculo(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar veículo' });
  }
});

// PUT /api/apps/educacao/transporte/veiculos/:id
router.put('/veiculos/:id', async (req, res) => {
  try {
    res.json(await transporteEscolarService.updateVeiculo(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar veículo' });
  }
});

// PUT /api/apps/educacao/transporte/veiculos/:id/status
router.put('/veiculos/:id/status', async (req, res) => {
  try {
    res.json(
      await transporteEscolarService.updateVeiculoStatus(req.params.id, req.body.status)
    );
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar status do veículo' });
  }
});

// DELETE /api/apps/educacao/transporte/veiculos/:id (desativa)
router.delete('/veiculos/:id', async (req, res) => {
  try {
    res.json(await transporteEscolarService.deactivateVeiculo(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao desativar veículo' });
  }
});

// ==================== ROTAS ====================

// GET /api/apps/educacao/transporte/rotas?turno=
router.get('/rotas', async (req, res) => {
  try {
    const lista = req.query.turno
      ? await transporteEscolarService.listRotasByTurno(req.query.turno as any)
      : await transporteEscolarService.listAllRotas();
    res.json(lista);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar rotas' });
  }
});

// POST /api/apps/educacao/transporte/rotas
router.post('/rotas', async (req, res) => {
  try {
    if (!req.body.nome || !req.body.veiculoId || !req.body.motoristaId || !req.body.turno) {
      return res
        .status(400)
        .json({ error: 'nome, veiculoId, motoristaId e turno são obrigatórios' });
    }
    res.status(201).json(await transporteEscolarService.createRota(req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar rota' });
  }
});

// GET /api/apps/educacao/transporte/rotas/:id (com alunos)
router.get('/rotas/:id', async (req, res) => {
  try {
    const rota = await transporteEscolarService.findRotaById(req.params.id);
    if (!rota) return res.status(404).json({ error: 'Rota não encontrada' });

    const vinculos = await prisma.alunoRota.findMany({
      where: { rotaId: req.params.id, ativo: true },
    });
    const alunoIds = vinculos.map((v) => v.alunoId);
    const alunos = alunoIds.length
      ? await prisma.citizen.findMany({
          where: { id: { in: alunoIds } },
          select: { id: true, name: true, cpf: true },
        })
      : [];
    const porId = new Map(alunos.map((a) => [a.id, a]));

    res.json({
      ...rota,
      alunos: vinculos.map((v) => ({
        ...v,
        aluno: porId.get(v.alunoId) || null,
      })),
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar rota' });
  }
});

// PUT /api/apps/educacao/transporte/rotas/:id
router.put('/rotas/:id', async (req, res) => {
  try {
    res.json(await transporteEscolarService.updateRota(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar rota' });
  }
});

// DELETE /api/apps/educacao/transporte/rotas/:id (inativa + desvincula alunos)
router.delete('/rotas/:id', async (req, res) => {
  try {
    res.json(await transporteEscolarService.inativarRota(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao inativar rota' });
  }
});

// ==================== ALUNOS ↔ ROTAS ====================

// POST /api/apps/educacao/transporte/rotas/:id/alunos
router.post('/rotas/:id/alunos', async (req, res) => {
  try {
    if (!req.body.alunoId) {
      return res.status(400).json({ error: 'alunoId é obrigatório' });
    }
    const vinculo = await transporteEscolarService.vincularAluno({
      rotaId: req.params.id,
      alunoId: req.body.alunoId,
      paradaId: req.body.pontoEmbarque || req.body.paradaId,
    });
    res.status(201).json(vinculo);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao vincular aluno' });
  }
});

// DELETE /api/apps/educacao/transporte/alunos/:vinculoId
router.delete('/alunos/:vinculoId', async (req, res) => {
  try {
    res.json(await transporteEscolarService.desvincularAluno(req.params.vinculoId));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao desvincular aluno' });
  }
});

export default router;
