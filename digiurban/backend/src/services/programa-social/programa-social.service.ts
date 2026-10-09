import { prisma } from '../../lib/prisma';
import {
  ProgramaSocialStatus,
  StatusPagamento,
  MeioPagamento,
} from '@prisma/client';
import workflowInstanceService from '../workflow/workflow-instance.service';
import { concludeProtocolFromApp, noteProtocolFromApp } from '../apps/app-protocol-bridge.service';

const APP_NAME = 'Assistência Social';

async function nomeDoPrograma(programaId?: string | null, fallback?: string | null) {
  if (programaId) {
    const programa = await prisma.programaSocial.findFirst({ where: { id: programaId }, select: { nome: true } });
    if (programa?.nome) return programa.nome;
  }
  return fallback || 'benefício';
}


export interface CreateInscricaoProgramaDTO {
  /** Programa e família podem faltar no pedido do portal até a análise */
  programaId?: string | null;
  familiaId?: string | null;
  beneficiarioId: string;
  /** Pedido do portal que originou a inscrição */
  protocolId?: string;
  /** O que o cidadão pediu (ex.: "Cesta Básica") */
  tipoSolicitado?: string;
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
  /** Garante a definição de workflow do tenant atual e retorna o id. */
  private async ensureWorkflowDefinition(): Promise<string> {
    const existente = await prisma.workflowDefinition.findFirst({
      where: { module: 'ASSISTENCIA_SOCIAL', name: 'Programa Social', isActive: true },
      select: { id: true },
    });
    if (existente) return existente.id;

    const criada = await prisma.workflowDefinition.create({
      data: {
        name: 'Programa Social',
        description: 'Inscrição → análise → aprovação → benefício ativo (pagamentos)',
        module: 'ASSISTENCIA_SOCIAL',
        stages: [
          { id: 'ANALISE', name: 'Análise da inscrição', role: 'USER' },
          { id: 'APROVACAO', name: 'Aprovação do gestor', role: 'COORDINATOR' },
        ],
      },
    });
    return criada.id;
  }

  async createInscricao(data: CreateInscricaoProgramaDTO) {
    const definitionId = await this.ensureWorkflowDefinition();
    const workflow = await workflowInstanceService.create({
      definitionId,
      entityType: 'INSCRICAO_PROGRAMA_SOCIAL',
      entityId: '',
      citizenId: data.beneficiarioId,
      currentStage: 'ANALISE',
      metadata: { programaId: data.programaId },
    });

    const inscricao = await prisma.inscricaoProgramaSocial.create({
      data: {
        protocolId: data.protocolId || null,
        programaId: data.programaId || null,
        familiaId: data.familiaId || null,
        beneficiarioId: data.beneficiarioId,
        tipoSolicitado: data.tipoSolicitado || null,
        observacoes: data.observacoes || null,
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
      // "Aguardando concessão": antes ia direto para APROVADO, que a tela trata
      // como benefício ativo — o passo de conceder nunca aparecia
      await prisma.inscricaoProgramaSocial.update({
        where: { id: data.inscricaoId },
        data: { status: 'AGUARDANDO_APROVACAO', analisadoPor: data.analistaId, dataAnalise: new Date(), parecerSocial: data.justificativa || null },
      });

      await workflowInstanceService.transition(
        inscricao.workflowId,
        'APROVACAO',
        'ANALISE_APROVADA',
        data.analistaId,
        undefined,
        data.justificativa
      );

      await noteProtocolFromApp({
        protocolId: inscricao.protocolId,
        app: APP_NAME,
        actorId: data.analistaId,
        message: 'O seu pedido foi aprovado na análise social. Falta a liberação do benefício pela gestão.',
      });
    } else {
      await prisma.inscricaoProgramaSocial.update({
        where: { id: data.inscricaoId },
        data: {
          status: 'INDEFERIDO',
          motivoIndeferimento: data.justificativa,
          analisadoPor: data.analistaId,
          dataAnalise: new Date(),
        },
      });

      await workflowInstanceService.cancel(
        inscricao.workflowId,
        data.analistaId,
        undefined,
        data.justificativa || 'Inscrição não aprovada na análise'
      );

      await concludeProtocolFromApp({
        protocolId: inscricao.protocolId,
        app: APP_NAME,
        actorId: data.analistaId,
        message: `Pedido não aprovado na análise social${data.justificativa ? `: ${data.justificativa}` : '.'} Procure o CRAS se quiser conversar sobre outras ajudas.`,
        outcome: 'INDEFERIDO',
      });
    }

    return await this.findById(data.inscricaoId);
  }

  async aprovarInscricao(data: AprovarInscricaoDTO) {
    const inscricao = await prisma.inscricaoProgramaSocial.findUnique({
      where: { id: data.inscricaoId },
    });

    if (!inscricao) throw new Error('Inscrição não encontrada');
    if (!['APROVADO', 'AGUARDANDO_APROVACAO', 'PARECER_FAVORAVEL', 'PARECER_PSICOLOGICO_CONCLUIDO'].includes(inscricao.status)) {
      throw new Error('Inscrição precisa estar aprovada na análise');
    }
    if (!inscricao.programaId) {
      throw new Error('Escolha o programa/benefício antes de liberar');
    }

    await prisma.inscricaoProgramaSocial.update({
      where: { id: data.inscricaoId },
      data: {
        status: 'ATIVO',
        aprovadoPor: data.gestorId,
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

    const programa = await nomeDoPrograma(inscricao.programaId, inscricao.tipoSolicitado);
    await concludeProtocolFromApp({
      protocolId: inscricao.protocolId,
      app: APP_NAME,
      actorId: data.gestorId,
      message: `${programa} liberado a partir de ${new Date(data.dataInicio).toLocaleDateString('pt-BR')}. A equipe do CRAS vai combinar a entrega/pagamento com você.`,
      outcome: 'DEFERIDO',
    });

    return await this.findById(data.inscricaoId);
  }

  /** Completa a inscrição que veio do portal: programa e/ou família do CadÚnico. */
  async completarInscricao(inscricaoId: string, data: { programaId?: string; familiaId?: string }) {
    const update: { programaId?: string; familiaId?: string } = {};
    if (data.programaId) {
      const programa = await prisma.programaSocial.findFirst({ where: { id: data.programaId }, select: { id: true } });
      if (!programa) throw new Error('Programa não encontrado');
      update.programaId = programa.id;
    }
    if (data.familiaId) {
      const familia = await prisma.cadUnicoFamilia.findFirst({ where: { id: data.familiaId }, select: { id: true } });
      if (!familia) throw new Error('Família não encontrada');
      update.familiaId = familia.id;
    }
    if (!Object.keys(update).length) throw new Error('Escolha o programa ou a família');
    await prisma.inscricaoProgramaSocial.update({ where: { id: inscricaoId }, data: update });
    return await this.findById(inscricaoId);
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
    if (inscricao.status !== 'ATIVO' && inscricao.status !== 'ATIVA') {
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
