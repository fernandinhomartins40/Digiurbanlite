import { Router } from 'express';
import { prisma } from '../../lib/prisma';

const router = Router();

// POST /api/saude/imunizacao - Registrar dose aplicada
router.post('/', async (req, res) => {
  try {
    const {
      citizenId,
      vacina,
      dose,
      lote,
      dataAplicacao,
      unidadeId,
      profissionalId,
      observacoes,
    } = req.body;

    if (!citizenId || !vacina || !dose) {
      return res.status(400).json({ error: 'citizenId, vacina e dose são obrigatórios' });
    }

    const imunizacao = await prisma.imunizacaoCidadao.create({
      data: {
        citizenId,
        vacina,
        dose,
        lote,
        dataAplicacao: dataAplicacao ? new Date(dataAplicacao) : new Date(),
        unidadeId: unidadeId || null,
        profissionalId: profissionalId || (req as any).userId || null,
        observacoes,
      },
    });

    res.status(201).json(imunizacao);
  } catch (error: any) {
    console.error('Erro ao registrar imunização:', error);
    res.status(500).json({ error: 'Erro ao registrar imunização' });
  }
});

// GET /api/saude/imunizacao/cidadao/:citizenId - Histórico de vacinas do cidadão
router.get('/cidadao/:citizenId', async (req, res) => {
  try {
    const imunizacoes = await prisma.imunizacaoCidadao.findMany({
      where: { citizenId: req.params.citizenId },
      orderBy: { dataAplicacao: 'desc' },
      include: {
        unidade: { select: { nome: true } },
        profissional: { select: { name: true } },
      },
    });

    res.json(imunizacoes);
  } catch (error: any) {
    console.error('Erro ao listar imunizações:', error);
    res.status(500).json({ error: 'Erro ao listar imunizações' });
  }
});

// GET /api/saude/imunizacao/cidadao/:citizenId/carteira - Carteira de vacinação
// agrupada por vacina (base da "Declaração de Vacinação" do catálogo)
router.get('/cidadao/:citizenId/carteira', async (req, res) => {
  try {
    const [cidadao, imunizacoes] = await Promise.all([
      prisma.citizen.findUnique({
        where: { id: req.params.citizenId },
        select: { id: true, name: true, cpf: true, birthDate: true },
      }),
      prisma.imunizacaoCidadao.findMany({
        where: { citizenId: req.params.citizenId },
        orderBy: { dataAplicacao: 'asc' },
        include: {
          unidade: { select: { nome: true } },
          profissional: { select: { name: true } },
        },
      }),
    ]);

    if (!cidadao) {
      return res.status(404).json({ error: 'Cidadão não encontrado' });
    }

    const porVacina = new Map<string, any[]>();
    for (const dose of imunizacoes) {
      const lista = porVacina.get(dose.vacina) || [];
      lista.push({
        id: dose.id,
        dose: dose.dose,
        lote: dose.lote,
        dataAplicacao: dose.dataAplicacao,
        unidade: dose.unidade?.nome || null,
        profissional: dose.profissional?.name || null,
      });
      porVacina.set(dose.vacina, lista);
    }

    res.json({
      cidadao,
      totalDoses: imunizacoes.length,
      vacinas: Array.from(porVacina.entries()).map(([vacina, doses]) => ({
        vacina,
        doses,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao gerar carteira de vacinação:', error);
    res.status(500).json({ error: 'Erro ao gerar carteira de vacinação' });
  }
});

// PUT /api/saude/imunizacao/:id - Corrigir registro
router.put('/:id', async (req, res) => {
  try {
    const { vacina, dose, lote, dataAplicacao, observacoes } = req.body;
    const imunizacao = await prisma.imunizacaoCidadao.update({
      where: { id: req.params.id },
      data: {
        ...(vacina && { vacina }),
        ...(dose && { dose }),
        ...(lote !== undefined && { lote }),
        ...(dataAplicacao && { dataAplicacao: new Date(dataAplicacao) }),
        ...(observacoes !== undefined && { observacoes }),
      },
    });
    res.json(imunizacao);
  } catch (error: any) {
    console.error('Erro ao atualizar imunização:', error);
    res.status(500).json({ error: 'Erro ao atualizar imunização' });
  }
});

// DELETE /api/saude/imunizacao/:id - Remover registro incorreto
router.delete('/:id', async (req, res) => {
  try {
    await prisma.imunizacaoCidadao.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover imunização:', error);
    res.status(500).json({ error: 'Erro ao remover imunização' });
  }
});

export default router;
