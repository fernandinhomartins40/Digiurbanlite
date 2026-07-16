import { Router } from 'express';
import agendaMedicaService from '../../services/agenda-medica/agenda-medica.service';
import { prisma } from '../../lib/prisma';

const router = Router();

/** Anexa {citizen: {id, name, cpf}} a uma lista de consultas agendadas. */
async function comCidadaos(consultas: any[]) {
  const ids = Array.from(new Set(consultas.map((c) => c.citizenId).filter(Boolean)));
  if (ids.length === 0) return consultas;
  const cidadaos = await prisma.citizen.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, cpf: true },
  });
  const porId = new Map(cidadaos.map((c) => [c.id, c]));
  return consultas.map((c) => ({ ...c, citizen: porId.get(c.citizenId) || null }));
}

// ============================================================================
// AGENDAS (grade semanal do profissional)
// ============================================================================

// POST /api/saude/agendamento/agendas - Criar agenda semanal
router.post('/agendas', async (req, res) => {
  try {
    const agenda = await agendaMedicaService.createAgenda({
      ...req.body,
      diaSemana: Number(req.body.diaSemana),
      tempoPorConsulta: Number(req.body.tempoPorConsulta),
      vagasDisponiveis: Number(req.body.vagasDisponiveis || 0),
    });
    res.status(201).json(agenda);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar agenda' });
  }
});

// GET /api/saude/agendamento/agendas?profissionalId=|unidadeId=&diaSemana=
router.get('/agendas', async (req, res) => {
  try {
    const { profissionalId, unidadeId, diaSemana } = req.query;

    if (profissionalId) {
      return res.json(await agendaMedicaService.findByProfissional(profissionalId as string));
    }
    if (unidadeId) {
      return res.json(
        await agendaMedicaService.findByUnidade(
          unidadeId as string,
          diaSemana !== undefined ? Number(diaSemana) : undefined
        )
      );
    }
    return res.status(400).json({ error: 'Informe profissionalId ou unidadeId' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar agendas' });
  }
});

// GET /api/saude/agendamento/agendas/:id
router.get('/agendas/:id', async (req, res) => {
  try {
    const agenda = await agendaMedicaService.findById(req.params.id);
    if (!agenda) return res.status(404).json({ error: 'Agenda não encontrada' });
    res.json(agenda);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar agenda' });
  }
});

// PUT /api/saude/agendamento/agendas/:id
router.put('/agendas/:id', async (req, res) => {
  try {
    res.json(await agendaMedicaService.update(req.params.id, req.body));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao atualizar agenda' });
  }
});

// DELETE /api/saude/agendamento/agendas/:id - Desativar
router.delete('/agendas/:id', async (req, res) => {
  try {
    res.json(await agendaMedicaService.deactivate(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao desativar agenda' });
  }
});

// GET /api/saude/agendamento/agendas/:id/horarios?data=YYYY-MM-DD - Slots do dia
router.get('/agendas/:id/horarios', async (req, res) => {
  try {
    if (!req.query.data) {
      return res.status(400).json({ error: 'Parâmetro data é obrigatório (YYYY-MM-DD)' });
    }
    const data = new Date(`${req.query.data}T12:00:00`);
    const horarios = await agendaMedicaService.getHorariosDisponiveis(req.params.id, data);
    res.json(horarios);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar horários' });
  }
});

// GET /api/saude/agendamento/agendas/:id/consultas?data=YYYY-MM-DD - Consultas do dia
router.get('/agendas/:id/consultas', async (req, res) => {
  try {
    const data = req.query.data ? new Date(`${req.query.data}T12:00:00`) : new Date();
    const consultas = await agendaMedicaService.getConsultasDoDia(req.params.id, data);
    res.json(await comCidadaos(consultas));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao buscar consultas do dia' });
  }
});

// ============================================================================
// CONSULTAS AGENDADAS
// ============================================================================

// POST /api/saude/agendamento/consultas - Marcar consulta
router.post('/consultas', async (req, res) => {
  try {
    const { agendaId, citizenId, dataHora, motivoConsulta, observacoes } = req.body;
    if (!agendaId || !citizenId || !dataHora) {
      return res.status(400).json({ error: 'agendaId, citizenId e dataHora são obrigatórios' });
    }
    const consulta = await agendaMedicaService.agendarConsulta({
      agendaId,
      citizenId,
      dataHora: new Date(dataHora),
      motivoConsulta,
      observacoes,
    });
    res.status(201).json(consulta);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao agendar consulta' });
  }
});

// GET /api/saude/agendamento/consultas/cidadao/:citizenId?historico=true
router.get('/consultas/cidadao/:citizenId', async (req, res) => {
  try {
    const consultas = await agendaMedicaService.findConsultasByCitizen(
      req.params.citizenId,
      req.query.historico === 'true'
    );
    res.json(consultas);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao listar consultas' });
  }
});

// PUT /api/saude/agendamento/consultas/:id/confirmar
router.put('/consultas/:id/confirmar', async (req, res) => {
  try {
    res.json(await agendaMedicaService.confirmarConsulta(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao confirmar consulta' });
  }
});

// PUT /api/saude/agendamento/consultas/:id/cancelar
router.put('/consultas/:id/cancelar', async (req, res) => {
  try {
    const canceladoPor = req.body.canceladoPor || (req as any).userId || 'sistema';
    res.json(
      await agendaMedicaService.cancelarConsulta(req.params.id, {
        canceladoPor,
        motivoCancelamento: req.body.motivoCancelamento || 'Não informado',
      })
    );
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao cancelar consulta' });
  }
});

// PUT /api/saude/agendamento/consultas/:id/realizada
router.put('/consultas/:id/realizada', async (req, res) => {
  try {
    res.json(await agendaMedicaService.marcarRealizada(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao marcar consulta como realizada' });
  }
});

// PUT /api/saude/agendamento/consultas/:id/falta
router.put('/consultas/:id/falta', async (req, res) => {
  try {
    res.json(await agendaMedicaService.marcarFalta(req.params.id));
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao marcar falta' });
  }
});

// GET /api/saude/agendamento/relatorio-ocupacao?profissionalId=&dataInicio=&dataFim=
router.get('/relatorio-ocupacao', async (req, res) => {
  try {
    const { profissionalId, dataInicio, dataFim } = req.query;
    if (!profissionalId || !dataInicio || !dataFim) {
      return res
        .status(400)
        .json({ error: 'profissionalId, dataInicio e dataFim são obrigatórios' });
    }
    const relatorio = await agendaMedicaService.getRelatorioOcupacao(
      profissionalId as string,
      new Date(dataInicio as string),
      new Date(dataFim as string)
    );
    res.json(relatorio);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao gerar relatório' });
  }
});

export default router;
