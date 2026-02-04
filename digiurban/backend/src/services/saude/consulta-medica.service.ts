import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ConsultaMedicaService {
  // ─── Buscar dados completos da entrada na fila (paciente + histórico) ───────
  async buscarContextoFila(filaAtendimentoId: string) {
    const fila = await prisma.filaAtendimento.findUnique({
      where: { id: filaAtendimentoId },
      include: {
        citizen: true,
        profissional: { select: { id: true, name: true } },
        equipe: true,
        unidade: true,
        escutaInicial: true,
        triagem: true,
      },
    });

    if (!fila) return null;

    // Problemas ativos do cidadão
    const problemas = await prisma.problemaCondicao.findMany({
      where: { citizenId: fila.citizenId, status: 'ATIVO' },
      orderBy: { dataInicio: 'desc' },
    });

    // Últimas 5 consultas do cidadão
    const consultasAnteriores = await prisma.consultaMedica.findMany({
      where: {
        atendimento: { citizenId: fila.citizenId },
      },
      include: {
        atendimento: { select: { dataAtendimento: true } },
      },
      orderBy: { dataHora: 'desc' },
      take: 5,
    });

    return { fila, problemas, consultasAnteriores };
  }

  // ─── Criar consulta médica (método SOAP) ──────────────────────────────────
  async criar(data: {
    filaAtendimentoId: string;
    medicoId: string;
    motivoConsulta: string;
    historiaAtual?: string;
    historiaPregressa?: string;
    historiaFamiliar?: string;
    historiaSocial?: string;
    sinaisVitais?: Record<string, any>;
    exameFisicoGeral?: string;
    exameFisicoSistemas?: Record<string, string>;
    antropometria?: Record<string, any>;
    hipoteseDiagnostica?: string;
    diagnosticoPrincipal?: string;
    diagnosticosSecund?: Record<string, any>[];
    condutaTerapeutica?: string;
    orientacoes?: string;
    retornoNecessario?: boolean;
    prazoRetornoDias?: number;
    observacoes?: string;
  }) {
    // Buscar ou criar AtendimentoMedico vinculado à fila
    let atendimento = await prisma.atendimentoMedico.findFirst({
      where: { filaAtendimentoId: data.filaAtendimentoId },
    });

    if (!atendimento) {
      const fila = await prisma.filaAtendimento.findUnique({
        where: { id: data.filaAtendimentoId },
      });
      if (!fila) throw new Error('Entrada na fila não encontrada');

      atendimento = await prisma.atendimentoMedico.create({
        data: {
          workflowId: `workflow-${data.filaAtendimentoId}`,
          citizenId: fila.citizenId,
          unidadeId: fila.unidadeId,
          tipo: fila.tipoAtendimento as any,
          status: 'EM_CONSULTA',
          profissionalId: data.medicoId,
          filaAtendimentoId: data.filaAtendimentoId,
          horarioConsulta: new Date(),
        },
      });
    }

    const consulta = await prisma.consultaMedica.create({
      data: {
        atendimentoId: atendimento.id,
        medicoId: data.medicoId,
        motivoConsulta: data.motivoConsulta,
        historiaAtual: data.historiaAtual,
        historiaPregressa: data.historiaPregressa,
        historiaFamiliar: data.historiaFamiliar,
        historiaSocial: data.historiaSocial,
        sinaisVitais: data.sinaisVitais as any,
        exameFisicoGeral: data.exameFisicoGeral,
        exameFisicoSistemas: data.exameFisicoSistemas as any,
        antropometria: data.antropometria as any,
        hipoteseDiagnostica: data.hipoteseDiagnostica,
        diagnosticoPrincipal: data.diagnosticoPrincipal,
        diagnosticosSecund: data.diagnosticosSecund as any,
        condutaTerapeutica: data.condutaTerapeutica,
        orientacoes: data.orientacoes,
        retornoNecessario: data.retornoNecessario ?? false,
        prazoRetornoDias: data.prazoRetornoDias,
        observacoes: data.observacoes,
      },
    });

    // Atualizar status da fila para EM_CONSULTA
    await prisma.filaAtendimento.update({
      where: { id: data.filaAtendimentoId },
      data: { status: 'EM_CONSULTA', dataHoraInicio: new Date() },
    });

    return consulta;
  }

  // ─── Finalizar consulta ────────────────────────────────────────────────────
  async finalizar(filaAtendimentoId: string) {
    await prisma.filaAtendimento.update({
      where: { id: filaAtendimentoId },
      data: { status: 'FINALIZADO', dataHoraFim: new Date() },
    });

    const atendimento = await prisma.atendimentoMedico.findFirst({
      where: { filaAtendimentoId },
    });

    if (atendimento) {
      await prisma.atendimentoMedico.update({
        where: { id: atendimento.id },
        data: { status: 'CONSULTA_CONCLUIDA' },
      });
    }

    return { ok: true };
  }

  // ─── Buscar consulta por fila ──────────────────────────────────────────────
  async buscarPorFila(filaAtendimentoId: string) {
    const atendimento = await prisma.atendimentoMedico.findFirst({
      where: { filaAtendimentoId },
    });
    if (!atendimento) return null;

    return await prisma.consultaMedica.findUnique({
      where: { atendimentoId: atendimento.id },
      include: {
        prescricoes: true,
        examesSolicitados: true,
        encaminhamentos: true,
        atestados: true,
      },
    });
  }

  // ─── Prescrição ────────────────────────────────────────────────────────────
  async criarPrescricao(consultaId: string, data: {
    medicamentos: Record<string, any>;
    observacoes?: string;
    validade: string;
  }) {
    return await prisma.prescricao.create({
      data: {
        consultaId,
        medicamentos: data.medicamentos as any,
        observacoes: data.observacoes,
        validade: new Date(data.validade),
      },
    });
  }

  async listarPrescricoes(consultaId: string) {
    return await prisma.prescricao.findMany({
      where: { consultaId },
      orderBy: { dataHora: 'desc' },
    });
  }

  // ─── Exames ────────────────────────────────────────────────────────────────
  async criarExame(consultaId: string, data: {
    tipoExame: string;
    justificativa?: string;
    prioridade: string;
  }) {
    return await prisma.exameSolicitado.create({
      data: {
        consultaId,
        tipoExame: data.tipoExame,
        justificativa: data.justificativa,
        prioridade: data.prioridade as any,
        status: 'SOLICITADO',
      },
    });
  }

  async listarExames(consultaId: string) {
    return await prisma.exameSolicitado.findMany({
      where: { consultaId },
      orderBy: { dataHora: 'desc' },
    });
  }

  // ─── Encaminhamentos ───────────────────────────────────────────────────────
  async criarEncaminhamento(consultaId: string, data: {
    especialidade: string;
    motivo: string;
    prioridade: string;
  }) {
    return await prisma.encaminhamento.create({
      data: {
        consultaId,
        especialidade: data.especialidade,
        motivo: data.motivo,
        prioridade: data.prioridade as any,
        status: 'PENDENTE',
      },
    });
  }

  async listarEncaminhamentos(consultaId: string) {
    return await prisma.encaminhamento.findMany({
      where: { consultaId },
      orderBy: { dataHora: 'desc' },
    });
  }

  // ─── Atestados ─────────────────────────────────────────────────────────────
  async criarAtestado(consultaId: string, data: {
    tipo: string;
    cid10?: string;
    diasAfastamento: number;
    dataInicio: string;
    dataFim: string;
    observacoes?: string;
  }) {
    return await prisma.atestado.create({
      data: {
        consultaId,
        tipo: data.tipo as any,
        cid10: data.cid10,
        diasAfastamento: data.diasAfastamento,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        observacoes: data.observacoes,
      },
    });
  }

  async listarAtestados(consultaId: string) {
    return await prisma.atestado.findMany({
      where: { consultaId },
      orderBy: { dataHora: 'desc' },
    });
  }

  // ─── Problemas / Condições do cidadão ─────────────────────────────────────
  async criarProblema(citizenId: string, data: {
    tipo: string;
    codigo: string;
    descricao: string;
    gravidade?: string;
  }) {
    return await prisma.problemaCondicao.create({
      data: {
        citizenId,
        tipo: data.tipo as any,
        codigo: data.codigo,
        descricao: data.descricao,
        status: 'ATIVO',
        dataInicio: new Date(),
        gravidade: data.gravidade as any,
      },
    });
  }

  async buscarProblemasCidadao(citizenId: string) {
    return await prisma.problemaCondicao.findMany({
      where: { citizenId },
      orderBy: { dataInicio: 'desc' },
    });
  }

  // ─── Buscar medicamentos (autocomplete) ───────────────────────────────────
  async buscarMedicamentos(busca: string) {
    return await prisma.medicamento.findMany({
      where: {
        isActive: true,
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { principioAtivo: { contains: busca, mode: 'insensitive' } },
        ],
      },
      select: { id: true, nome: true, principioAtivo: true, apresentacao: true, concentracao: true },
      take: 20,
    });
  }
}

export default new ConsultaMedicaService();
