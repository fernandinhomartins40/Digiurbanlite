import { PrismaClient, TipoExameSolicitacao, StatusSolicitacaoExame, StatusAgendamentoExame } from '@prisma/client';
import workflowInstanceService from '../workflow/workflow-instance.service';

const prisma = new PrismaClient();

export interface CreateSolicitacaoExameDTO {
  citizenId: string;
  medicoSolicitante: string;
  unidadeSaude: string;
  tipoExame: TipoExameSolicitacao;
  exameEspecifico: string;
  justificativa: string;
  prioridade?: number;
  documentosAnexados?: any;
}

export interface AgendarExameDTO {
  solicitacaoId: string;
  laboratorioId?: string;
  dataAgendada: Date;
  horario: string;
  localRealizacao: string;
  preparoNecessario?: string;
}

export interface RegistrarRealizacaoDTO {
  agendamentoId: string;
  dataRealizacao: Date;
}

export interface AnexarLaudoDTO {
  agendamentoId: string;
  laudoUrl: string;
  medicoLaudador: string;
  observacoesResultado?: string;
}

export class AgendamentoExamesService {
  async createSolicitacao(data: CreateSolicitacaoExameDTO) {
    const workflow = await workflowInstanceService.create({
      definitionId: 'agendamento-exame-v1',
      entityType: 'SOLICITACAO_EXAME',
      entityId: '',
      citizenId: data.citizenId,
      currentStage: 'AGUARDANDO_AGENDAMENTO',
      priority: data.prioridade || 0,
      metadata: { tipoExame: data.tipoExame },
    });

    const solicitacao = await prisma.solicitacaoExame.create({
      data: {
        ...data,
        workflowId: workflow.id,
        prioridade: data.prioridade || 0,
        status: 'AGUARDANDO_AGENDAMENTO',
      },
    });

    await workflowInstanceService.update(workflow.id, { entityId: solicitacao.id });
    return solicitacao;
  }

  async agendarExame(data: AgendarExameDTO) {
    const solicitacao = await prisma.solicitacaoExame.findUnique({
      where: { id: data.solicitacaoId },
    });

    if (!solicitacao) throw new Error('Solicitação não encontrada');

    const agendamento = await prisma.agendamentoExame.create({
      data: {
        solicitacaoId: data.solicitacaoId,
        laboratorioId: data.laboratorioId,
        dataAgendada: data.dataAgendada,
        horario: data.horario,
        localRealizacao: data.localRealizacao,
        preparoNecessario: data.preparoNecessario,
        status: 'AGENDADO',
      },
    });

    await prisma.solicitacaoExame.update({
      where: { id: data.solicitacaoId },
      data: { status: 'AGENDADO' },
    });

    await workflowInstanceService.transition(
      solicitacao.workflowId,
      'CONFIRMACAO',
      'EXAME_AGENDADO',
      'system',
      undefined,
      `Agendado para ${data.dataAgendada.toLocaleDateString()} às ${data.horario}`
    );

    return agendamento;
  }

  async confirmarAgendamento(agendamentoId: string) {
    const agendamento = await prisma.agendamentoExame.findUnique({
      where: { id: agendamentoId },
      include: { solicitacao: true },
    });

    if (!agendamento) throw new Error('Agendamento não encontrado');

    await prisma.agendamentoExame.update({
      where: { id: agendamentoId },
      data: { status: 'CONFIRMADO' },
    });

    await prisma.solicitacaoExame.update({
      where: { id: agendamento.solicitacaoId },
      data: { status: 'CONFIRMADO' },
    });

    await workflowInstanceService.transition(
      agendamento.solicitacao.workflowId,
      'REALIZACAO',
      'CONFIRMADO_PELO_CIDADAO',
      'system'
    );

    return agendamento;
  }

  async registrarRealizacao(data: RegistrarRealizacaoDTO) {
    const agendamento = await prisma.agendamentoExame.findUnique({
      where: { id: data.agendamentoId },
      include: { solicitacao: true },
    });

    if (!agendamento) throw new Error('Agendamento não encontrado');

    await prisma.agendamentoExame.update({
      where: { id: data.agendamentoId },
      data: {
        status: 'REALIZADO',
        dataRealizacao: data.dataRealizacao,
      },
    });

    await prisma.solicitacaoExame.update({
      where: { id: agendamento.solicitacaoId },
      data: { status: 'REALIZADO' },
    });

    await workflowInstanceService.transition(
      agendamento.solicitacao.workflowId,
      'LAUDAGEM',
      'EXAME_REALIZADO',
      'system'
    );

    return agendamento;
  }

  async anexarLaudo(data: AnexarLaudoDTO) {
    const agendamento = await prisma.agendamentoExame.findUnique({
      where: { id: data.agendamentoId },
      include: { solicitacao: true },
    });

    if (!agendamento) throw new Error('Agendamento não encontrado');

    await prisma.agendamentoExame.update({
      where: { id: data.agendamentoId },
      data: {
        laudoUrl: data.laudoUrl,
        medicoLaudador: data.medicoLaudador,
        resultadoDisponivel: true,
        dataResultado: new Date(),
        observacoesResultado: data.observacoesResultado,
      },
    });

    await prisma.solicitacaoExame.update({
      where: { id: agendamento.solicitacaoId },
      data: { status: 'LAUDADO' },
    });

    await workflowInstanceService.transition(
      agendamento.solicitacao.workflowId,
      'ENTREGA',
      'LAUDO_ANEXADO',
      data.medicoLaudador
    );

    return agendamento;
  }

  async marcarResultadoEntregue(agendamentoId: string) {
    const agendamento = await prisma.agendamentoExame.findUnique({
      where: { id: agendamentoId },
      include: { solicitacao: true },
    });

    if (!agendamento) throw new Error('Agendamento não encontrado');

    await prisma.solicitacaoExame.update({
      where: { id: agendamento.solicitacaoId },
      data: { status: 'RESULTADO_ENTREGUE' },
    });

    await workflowInstanceService.complete(
      agendamento.solicitacao.workflowId,
      'system',
      undefined,
      'Resultado entregue ao paciente'
    );

    return agendamento;
  }

  async findSolicitacaoById(id: string) {
    return await prisma.solicitacaoExame.findUnique({
      where: { id },
      include: { agendamento: true },
    });
  }

  async findSolicitacoesByCitizen(citizenId: string) {
    return await prisma.solicitacaoExame.findMany({
      where: { citizenId },
      include: { agendamento: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSolicitacoesByStatus(status: StatusSolicitacaoExame) {
    return await prisma.solicitacaoExame.findMany({
      where: { status },
      include: { agendamento: true },
      orderBy: [{ prioridade: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getAgendamentosDoDia(data: Date) {
    const inicioDia = new Date(data.setHours(0, 0, 0, 0));
    const fimDia = new Date(data.setHours(23, 59, 59, 999));

    return await prisma.agendamentoExame.findMany({
      where: {
        dataAgendada: {
          gte: inicioDia,
          lte: fimDia,
        },
        status: {
          in: ['AGENDADO', 'CONFIRMADO'],
        },
      },
      include: {
        solicitacao: true,
      },
      orderBy: { horario: 'asc' },
    });
  }
}

export default new AgendamentoExamesService();
