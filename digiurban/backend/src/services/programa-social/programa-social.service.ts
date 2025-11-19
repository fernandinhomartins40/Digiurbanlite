import {
  PrismaClient,
  ProgramaSocialStatus,
  StatusPagamento,
  MeioPagamento,
} from '@prisma/client';
import workflowInstanceService from '../workflow/workflow-instance.service';

const prisma = new PrismaClient();

export interface CreateInscricaoProgramaDTO {
  programaId: string;
  familiaId: string;
  beneficiarioId: string;
  documentosAnexados?: any;
  observacoes?: string;
}

export interface AnalisarInscricaoDTO {
  inscricaoId: string;
  analistaId: string;
  aprovado: boolean;
  justificativa?: string;
}

export interface AprovarInscricaoDTO {
  inscricaoId: string;
  gestorId: string;
  dataInicio: Date;
  dataFim?: Date;
}

export interface RegistrarAcompanhamentoDTO {
  inscricaoId: string;
  assistenteSocialId: string;
  dataVisita: Date;
  tipoAcompanhamento: string;
  condicoesFamiliares?: string;
  necessidadesIdentificadas?: string;
  acoesRealizadas?: string;
  proximaVisita?: Date;
  observacoes?: string;
}

export interface RegistrarPagamentoDTO {
  inscricaoId: string;
  mesReferencia: string;
  valor: number;
  mecanismoPagamento: MeioPagamento;
  comprovante?: string;
}

export class ProgramaSocialService {
  async createInscricao(data: CreateInscricaoProgramaDTO) {
    const workflow = await workflowInstanceService.create({
      definitionId: 'programa-social-v1',
      entityType: 'INSCRICAO_PROGRAMA_SOCIAL',
      entityId: '',
      citizenId: data.beneficiarioId,
      currentStage: 'ANALISE',
      metadata: { programaId: data.programaId },
    });

    const inscricao = await prisma.inscricaoProgramaSocial.create({
      data: {
        ...data,
        workflowId: workflow.id,
        status: 'AGUARDANDO_ANALISE',
      },
    });

    await workflowInstanceService.update(workflow.id, { entityId: inscricao.id });
    return inscricao;
  }

  async analisarInscricao(data: AnalisarInscricaoDTO) {
    const inscricao = await prisma.inscricaoProgramaSocial.findUnique({
      where: { id: data.inscricaoId },
    });

    if (!inscricao) throw new Error('Inscrição não encontrada');

    if (data.aprovado) {
      await prisma.inscricaoProgramaSocial.update({
        where: { id: data.inscricaoId },
        data: { status: 'APROVADO' },
      });

      await workflowInstanceService.transition(
        inscricao.workflowId,
        'APROVACAO',
        'ANALISE_APROVADA',
        data.analistaId,
        undefined,
        data.justificativa
      );
    } else {
      await prisma.inscricaoProgramaSocial.update({
        where: { id: data.inscricaoId },
        data: {
          status: 'CANCELADO',
          motivoCancelamento: data.justificativa,
        },
      });

      await workflowInstanceService.cancel(
        inscricao.workflowId,
        data.analistaId,
        undefined,
        data.justificativa || 'Inscrição não aprovada na análise'
      );
    }

    return await this.findById(data.inscricaoId);
  }

  async aprovarInscricao(data: AprovarInscricaoDTO) {
    const inscricao = await prisma.inscricaoProgramaSocial.findUnique({
      where: { id: data.inscricaoId },
    });

    if (!inscricao) throw new Error('Inscrição não encontrada');
    if (inscricao.status !== 'APROVADO') {
      throw new Error('Inscrição precisa estar aprovada na análise');
    }

    await prisma.inscricaoProgramaSocial.update({
      where: { id: data.inscricaoId },
      data: {
        status: 'ATIVA',
        dataAprovacao: new Date(),
        dataInicio: data.dataInicio,
      },
    });

    await workflowInstanceService.complete(
      inscricao.workflowId,
      data.gestorId,
      undefined,
      'Benefício aprovado e ativado'
    );

    return await this.findById(data.inscricaoId);
  }

  async suspenderBeneficio(inscricaoId: string, userId: string, motivo: string) {
    const inscricao = await prisma.inscricaoProgramaSocial.findUnique({
      where: { id: inscricaoId },
    });

    if (!inscricao) throw new Error('Inscrição não encontrada');

    await prisma.inscricaoProgramaSocial.update({
      where: { id: inscricaoId },
      data: {
        status: 'SUSPENSO',
        motivoCancelamento: motivo,
      },
    });

    return await this.findById(inscricaoId);
  }

  async reativarBeneficio(inscricaoId: string, userId: string) {
    await prisma.inscricaoProgramaSocial.update({
      where: { id: inscricaoId },
      data: { status: 'ATIVO' },
    });
    return await this.findById(inscricaoId);
  }

  async cancelarBeneficio(inscricaoId: string, userId: string, motivo: string) {
    await prisma.inscricaoProgramaSocial.update({
      where: { id: inscricaoId },
      data: {
        status: 'CANCELADO',
        motivoCancelamento: motivo,
      },
    });
    return await this.findById(inscricaoId);
  }

  async registrarAcompanhamento(data: RegistrarAcompanhamentoDTO) {
    const inscricao = await prisma.inscricaoProgramaSocial.findUnique({
      where: { id: data.inscricaoId },
    });

    if (!inscricao) throw new Error('Inscrição não encontrada');

    return await prisma.acompanhamentoBeneficio.create({
      data: {
        inscricaoId: data.inscricaoId,
        assistenteSocialId: data.assistenteSocialId,
        dataVisita: data.dataVisita,
        tipo: data.tipoAcompanhamento,
        responsavelId: data.assistenteSocialId,
        descricao: `${data.condicoesFamiliares || ''}\n${data.necessidadesIdentificadas || ''}\n${data.acoesRealizadas || ''}`,
        proximoAcompanhamento: data.proximaVisita,
        observacoes: data.observacoes,
      } as any,
    });
  }

  async registrarPagamento(data: RegistrarPagamentoDTO) {
    const inscricao = await prisma.inscricaoProgramaSocial.findUnique({
      where: { id: data.inscricaoId },
    });

    if (!inscricao) throw new Error('Inscrição não encontrada');
    if (inscricao.status !== 'ATIVO') {
      throw new Error('Benefício não está ativo');
    }

    return await prisma.pagamentoBeneficio.create({
      data: {
        inscricaoId: data.inscricaoId,
        competencia: data.mesReferencia,
        valor: data.valor,
        comprovante: data.comprovante,
        status: 'AGUARDANDO',
      } as any,
    });
  }

  async confirmarPagamento(pagamentoId: string) {
    return await prisma.pagamentoBeneficio.update({
      where: { id: pagamentoId },
      data: {
        status: 'PAGO',
        dataPagamento: new Date(),
      },
    });
  }

  async findById(id: string) {
    return await prisma.inscricaoProgramaSocial.findUnique({
      where: { id },
      include: {
        acompanhamentos: { orderBy: { dataVisita: 'desc' } },
        pagamentos: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findByBeneficiario(beneficiarioId: string) {
    return await prisma.inscricaoProgramaSocial.findMany({
      where: { beneficiarioId },
      include: {
        acompanhamentos: true,
        pagamentos: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByFamilia(familiaId: string) {
    return await prisma.inscricaoProgramaSocial.findMany({
      where: { familiaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: ProgramaSocialStatus) {
    return await prisma.inscricaoProgramaSocial.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getRelatorio(programaId: string, dataInicio: Date, dataFim: Date) {
    const inscricoes = await prisma.inscricaoProgramaSocial.findMany({
      where: {
        programaId,
        createdAt: { gte: dataInicio, lte: dataFim },
      },
      include: { pagamentos: true },
    });

    const total = inscricoes.length;
    const ativos = inscricoes.filter((i) => i.status === 'ATIVO').length;
    const suspensos = inscricoes.filter((i) => i.status === 'SUSPENSO').length;
    const cancelados = inscricoes.filter((i) => i.status === 'CANCELADO').length;

    const totalPago = inscricoes.reduce(
      (acc, i) =>
        acc +
        i.pagamentos
          .filter((p) => p.status === 'PAGO')
          .reduce((sum, p) => sum + p.valor, 0),
      0
    );

    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      total,
      ativos,
      suspensos,
      cancelados,
      totalPago,
    };
  }
}

export default new ProgramaSocialService();
