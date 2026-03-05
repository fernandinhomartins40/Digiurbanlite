import { Router } from 'express';
import consultaMedicaService from '../../services/saude/consulta-medica.service';
import { prisma } from '../../lib/prisma';

const router = Router();

// ─── Contexto da fila (dados paciente + histórico + problemas) ─────────────
router.get('/contexto-fila/:filaId', async (req, res) => {
  try {
    const contexto = await consultaMedicaService.buscarContextoFila(req.params.filaId);
    if (!contexto) return res.status(404).json({ error: 'Entrada na fila não encontrada' });
    res.json(contexto);
  } catch (error) {
    console.error('Erro ao buscar contexto da fila:', error);
    res.status(500).json({ error: 'Erro ao buscar contexto' });
  }
});

// ─── Criar consulta médica ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const consulta = await consultaMedicaService.criar(req.body);
    res.status(201).json(consulta);
  } catch (error: any) {
    console.error('Erro ao criar consulta:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar consulta' });
  }
});

// ─── Buscar consulta por fila ───────────────────────────────────────────────
router.get('/fila/:filaId', async (req, res) => {
  try {
    const consulta = await consultaMedicaService.buscarPorFila(req.params.filaId);
    res.json(consulta);
  } catch (error) {
    console.error('Erro ao buscar consulta:', error);
    res.status(500).json({ error: 'Erro ao buscar consulta' });
  }
});

// ─── Finalizar consulta ─────────────────────────────────────────────────────
router.post('/finalizar/:filaId', async (req, res) => {
  try {
    const result = await consultaMedicaService.finalizar(req.params.filaId);
    res.json(result);
  } catch (error: any) {
    console.error('Erro ao finalizar consulta:', error);
    res.status(500).json({ error: error.message || 'Erro ao finalizar' });
  }
});

// ─── Prescrições ────────────────────────────────────────────────────────────
router.post('/:consultaId/prescricao', async (req, res) => {
  try {
    const prescricao = await consultaMedicaService.criarPrescricao(req.params.consultaId, req.body);
    res.status(201).json(prescricao);
  } catch (error) {
    console.error('Erro ao criar prescrição:', error);
    res.status(500).json({ error: 'Erro ao criar prescrição' });
  }
});

router.get('/:consultaId/prescricoes', async (req, res) => {
  try {
    const prescricoes = await consultaMedicaService.listarPrescricoes(req.params.consultaId);
    res.json(prescricoes);
  } catch (error) {
    console.error('Erro ao listar prescrições:', error);
    res.status(500).json({ error: 'Erro ao listar prescrições' });
  }
});

// ─── Exames ─────────────────────────────────────────────────────────────────
router.post('/:consultaId/exame', async (req, res) => {
  try {
    const exame = await consultaMedicaService.criarExame(req.params.consultaId, req.body);
    res.status(201).json(exame);
  } catch (error) {
    console.error('Erro ao criar exame:', error);
    res.status(500).json({ error: 'Erro ao criar exame' });
  }
});

router.get('/:consultaId/exames', async (req, res) => {
  try {
    const exames = await consultaMedicaService.listarExames(req.params.consultaId);
    res.json(exames);
  } catch (error) {
    console.error('Erro ao listar exames:', error);
    res.status(500).json({ error: 'Erro ao listar exames' });
  }
});

// ─── Encaminhamentos ────────────────────────────────────────────────────────
router.post('/:consultaId/encaminhamento', async (req, res) => {
  try {
    const enc = await consultaMedicaService.criarEncaminhamento(req.params.consultaId, req.body);
    res.status(201).json(enc);
  } catch (error) {
    console.error('Erro ao criar encaminhamento:', error);
    res.status(500).json({ error: 'Erro ao criar encaminhamento' });
  }
});

router.get('/:consultaId/encaminhamentos', async (req, res) => {
  try {
    const encs = await consultaMedicaService.listarEncaminhamentos(req.params.consultaId);
    res.json(encs);
  } catch (error) {
    console.error('Erro ao listar encaminhamentos:', error);
    res.status(500).json({ error: 'Erro ao listar encaminhamentos' });
  }
});

// ─── Atestados ──────────────────────────────────────────────────────────────
router.post('/:consultaId/atestado', async (req, res) => {
  try {
    const atestado = await consultaMedicaService.criarAtestado(req.params.consultaId, req.body);
    res.status(201).json(atestado);
  } catch (error) {
    console.error('Erro ao criar atestado:', error);
    res.status(500).json({ error: 'Erro ao criar atestado' });
  }
});

router.get('/:consultaId/atestados', async (req, res) => {
  try {
    const atestados = await consultaMedicaService.listarAtestados(req.params.consultaId);
    res.json(atestados);
  } catch (error) {
    console.error('Erro ao listar atestados:', error);
    res.status(500).json({ error: 'Erro ao listar atestados' });
  }
});

// ─── Problemas / Condições do cidadão ──────────────────────────────────────
router.get('/problemas/:citizenId', async (req, res) => {
  try {
    const problemas = await consultaMedicaService.buscarProblemasCidadao(req.params.citizenId);
    res.json(problemas);
  } catch (error) {
    console.error('Erro ao buscar problemas:', error);
    res.status(500).json({ error: 'Erro ao buscar problemas' });
  }
});

router.post('/problemas/:citizenId', async (req, res) => {
  try {
    const problema = await consultaMedicaService.criarProblema(req.params.citizenId, req.body);
    res.status(201).json(problema);
  } catch (error) {
    console.error('Erro ao criar problema:', error);
    res.status(500).json({ error: 'Erro ao criar problema' });
  }
});

// ─── Busca de medicamentos (autocomplete) ──────────────────────────────────
router.get('/medicamentos/busca', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) return res.json([]);
    const meds = await consultaMedicaService.buscarMedicamentos(q as string);
    res.json(meds);
  } catch (error) {
    console.error('Erro ao buscar medicamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar medicamentos' });
  }
});

// Prontuario consolidado do cidadao
router.get('/prontuario/:citizenId', async (req, res) => {
  try {
    const { citizenId } = req.params;

    const cidadao = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        id: true,
        name: true,
        cpf: true,
        birthDate: true,
        phone: true,
      },
    });

    if (!cidadao) {
      return res.status(404).json({ error: 'Cidadao nao encontrado' });
    }

    const atendimentos = await prisma.atendimentoMedico.findMany({
      where: { citizenId },
      orderBy: { dataAtendimento: 'desc' },
      take: 100,
    });

    const consultas = await prisma.consultaMedica.findMany({
      where: {
        atendimento: {
          citizenId,
        },
      },
      orderBy: { dataHora: 'desc' },
      take: 200,
    });

    const medicoIds = Array.from(new Set(consultas.map((consulta) => consulta.medicoId).filter(Boolean)));
    const medicos = medicoIds.length
      ? await prisma.user.findMany({
          where: { id: { in: medicoIds } },
          select: { id: true, name: true },
        })
      : [];
    const medicosById = new Map(medicos.map((medico) => [medico.id, medico]));
    const consultasComMedico = consultas.map((consulta) => ({
      ...consulta,
      medico: medicosById.has(consulta.medicoId)
        ? {
            id: consulta.medicoId,
            name: medicosById.get(consulta.medicoId)?.name || 'NÃ£o informado',
          }
        : null,
    }));

    const consultaIds = consultas.map((consulta) => consulta.id);

    const [prescricoes, exames, encaminhamentos, atestados] = await Promise.all([
      prisma.prescricao.findMany({
        where: { consultaId: { in: consultaIds } },
        orderBy: { dataHora: 'desc' },
      }),
      prisma.exameSolicitado.findMany({
        where: { consultaId: { in: consultaIds } },
        orderBy: { dataHora: 'desc' },
      }),
      prisma.encaminhamento.findMany({
        where: { consultaId: { in: consultaIds } },
        orderBy: { dataHora: 'desc' },
      }),
      prisma.atestado.findMany({
        where: { consultaId: { in: consultaIds } },
        orderBy: { dataHora: 'desc' },
      }),
    ]);

    return res.json({
      cidadao,
      atendimentos,
      consultas: consultasComMedico,
      prescricoes,
      exames,
      encaminhamentos,
      atestados,
    });
  } catch (error) {
    console.error('Erro ao buscar prontuario:', error);
    return res.status(500).json({ error: 'Erro ao buscar prontuario' });
  }
});

router.get('/prontuario/:citizenId/timeline', async (req, res) => {
  try {
    const { citizenId } = req.params;

    const consultas = await prisma.consultaMedica.findMany({
      where: {
        atendimento: {
          citizenId,
        },
      },
      select: {
        id: true,
        dataHora: true,
        motivoConsulta: true,
        diagnosticoPrincipal: true,
      },
      orderBy: { dataHora: 'desc' },
      take: 200,
    });

    const timeline = consultas.map((consulta) => ({
      id: consulta.id,
      tipo: 'CONSULTA',
      dataHora: consulta.dataHora,
      titulo: consulta.motivoConsulta || 'Consulta medica',
      descricao: consulta.diagnosticoPrincipal || null,
    }));

    return res.json(timeline);
  } catch (error) {
    console.error('Erro ao buscar timeline do prontuario:', error);
    return res.status(500).json({ error: 'Erro ao buscar timeline do prontuario' });
  }
});

router.get('/prescricoes/pendentes', async (req, res) => {
  try {
    const { cidadaoId, unidadeId, status } = req.query;

    const where: any = {
      dispensada: false,
      consulta: {
        atendimento: {},
      },
    };

    if (cidadaoId) {
      where.consulta.atendimento.citizenId = cidadaoId as string;
    }

    if (unidadeId) {
      where.consulta.atendimento.unidadeId = unidadeId as string;
    }

    if (status === 'ATIVA') {
      where.validade = { gte: new Date() };
    }

    const prescricoes = await prisma.prescricao.findMany({
      where,
      include: {
        consulta: {
          select: {
            id: true,
            medicoId: true,
            profissionalSaudeId: true,
            atendimento: {
              select: {
                id: true,
                citizenId: true,
              },
            },
          },
        },
      },
      orderBy: { dataHora: 'desc' },
      take: 200,
    });

    const medicoIds = Array.from(
      new Set(prescricoes.map((prescricao) => prescricao.consulta.medicoId).filter(Boolean))
    );
    const citizenIds = Array.from(
      new Set(
        prescricoes
          .map((prescricao) => prescricao.consulta.atendimento.citizenId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const [medicos, cidadaos] = await Promise.all([
      medicoIds.length
        ? prisma.user.findMany({
            where: { id: { in: medicoIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      citizenIds.length
        ? prisma.citizen.findMany({
            where: { id: { in: citizenIds } },
            select: { id: true, name: true, cpf: true },
          })
        : Promise.resolve([]),
    ]);

    const medicosById = new Map(medicos.map((medico) => [medico.id, medico]));
    const cidadaosById = new Map(cidadaos.map((cidadao) => [cidadao.id, cidadao]));

    const payload = prescricoes.map((prescricao, index) => {
      const medico = medicosById.get(prescricao.consulta.medicoId);
      const cidadao = cidadaosById.get(prescricao.consulta.atendimento.citizenId);

      return {
        id: prescricao.id,
        numero: `RX-${String(index + 1).padStart(4, '0')}`,
        dataEmissao: prescricao.dataHora,
        validade: prescricao.validade,
        medicamentos: prescricao.medicamentos,
        observacoes: prescricao.observacoes,
        medico: medico
          ? {
              id: medico.id,
              nome: medico.name,
            }
          : null,
        citizen: cidadao
          ? {
              id: cidadao.id,
              name: cidadao.name,
              cpf: cidadao.cpf,
            }
          : null,
        atendimentoId: prescricao.consulta.atendimento.id,
      };
    });

    return res.json(payload);
  } catch (error) {
    console.error('Erro ao listar prescricoes pendentes:', error);
    return res.status(500).json({ error: 'Erro ao listar prescricoes pendentes' });
  }
});

export default router;
