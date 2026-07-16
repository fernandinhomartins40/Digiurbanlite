import { Router } from 'express';
import { prisma } from '../../lib/prisma';

const router = Router();

// POST /api/saude/painel - Registrar chamada manual no painel
router.post('/', async (req, res) => {
  try {
    const { unidadeId, filaId, consultorio, nomePaciente, mensagem } = req.body;

    if (!unidadeId || !filaId || !nomePaciente) {
      return res
        .status(400)
        .json({ error: 'unidadeId, filaId e nomePaciente são obrigatórios' });
    }

    const chamada = await prisma.chamadaPainel.create({
      data: {
        unidadeId,
        filaId,
        consultorio: consultorio || 'Consultório',
        nomePaciente,
        mensagem,
      },
    });

    res.status(201).json(chamada);
  } catch (error: any) {
    console.error('Erro ao registrar chamada no painel:', error);
    res.status(500).json({ error: 'Erro ao registrar chamada no painel' });
  }
});

// GET /api/saude/painel/unidade/:unidadeId - Últimas chamadas da unidade (para a TV)
router.get('/unidade/:unidadeId', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    const chamadas = await prisma.chamadaPainel.findMany({
      where: {
        unidadeId: req.params.unidadeId,
        exibidoEm: { gte: inicioDoDia },
      },
      orderBy: { exibidoEm: 'desc' },
      take: Math.min(limit, 20),
      include: {
        unidade: { select: { nome: true } },
      },
    });

    res.json(chamadas);
  } catch (error: any) {
    console.error('Erro ao listar chamadas do painel:', error);
    res.status(500).json({ error: 'Erro ao listar chamadas do painel' });
  }
});

// POST /api/saude/painel/:id/repetir - Repetir uma chamada (re-exibe no painel)
router.post('/:id/repetir', async (req, res) => {
  try {
    const original = await prisma.chamadaPainel.findUnique({
      where: { id: req.params.id },
    });

    if (!original) {
      return res.status(404).json({ error: 'Chamada não encontrada' });
    }

    const repetida = await prisma.chamadaPainel.create({
      data: {
        unidadeId: original.unidadeId,
        filaId: original.filaId,
        consultorio: original.consultorio,
        nomePaciente: original.nomePaciente,
        mensagem: original.mensagem,
      },
    });

    res.status(201).json(repetida);
  } catch (error: any) {
    console.error('Erro ao repetir chamada:', error);
    res.status(500).json({ error: 'Erro ao repetir chamada' });
  }
});

export default router;
