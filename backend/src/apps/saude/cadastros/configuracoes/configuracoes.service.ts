import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { CreateConfiguracaoAtendimentoDto, UpdateConfiguracaoAtendimentoDto } from './configuracoes.dto.js';

@Injectable()
export class ConfiguracoesAtendimentoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateConfiguracaoAtendimentoDto) {
    return this.prisma.configuracaoAtendimento.create({
      data: {
        unidadeId: data.unidadeId,
        prefixoSenha: data.prefixoSenha || 'A',
        reiniciarSenhaDiariamente: data.reiniciarSenhaDiariamente !== undefined ? data.reiniciarSenhaDiariamente : true,
        senhaInicial: data.senhaInicial || 1,
        horaAberturaAtendimento: data.horaAberturaAtendimento || '07:00',
        horaFechamentoAtendimento: data.horaFechamentoAtendimento || '17:00',
        diasFuncionamento: data.diasFuncionamento,
        triagemObrigatoria: data.triagemObrigatoria !== undefined ? data.triagemObrigatoria : true,
        tempoMedioTriagem: data.tempoMedioTriagem || 10,
        permitirAgendamento: data.permitirAgendamento !== undefined ? data.permitirAgendamento : true,
        limiteAgendamentoDias: data.limiteAgendamentoDias || 30,
        permitirCancelamento: data.permitirCancelamento !== undefined ? data.permitirCancelamento : true,
        limiteCancelamentoHoras: data.limiteCancelamentoHoras || 24,
        tempoMedioConsulta: data.tempoMedioConsulta || 30,
        permitirEncaixe: data.permitirEncaixe !== undefined ? data.permitirEncaixe : true,
        limiteEncaixesDia: data.limiteEncaixesDia || 5,
        enviarSMSLembrete: data.enviarSMSLembrete || false,
        horasAntesSMSLembrete: data.horasAntesSMSLembrete || 24,
        enviarEmailConfirmacao: data.enviarEmailConfirmacao || false,
        exigirDocumentoIdentificacao: data.exigirDocumentoIdentificacao !== undefined ? data.exigirDocumentoIdentificacao : true,
        exigirCartaoSUS: data.exigirCartaoSUS !== undefined ? data.exigirCartaoSUS : true,
        toleranciaAtrasoMinutos: data.toleranciaAtrasoMinutos || 15,
        permitirFaltaSemJustificativa: data.permitirFaltaSemJustificativa !== undefined ? data.permitirFaltaSemJustificativa : true,
        limiteConsecutivoFaltas: data.limiteConsecutivoFaltas || 3,
        diasBloqueioAposFaltas: data.diasBloqueioAposFaltas || 30,
      },
    });
  }

  async findAll() {
    return this.prisma.configuracaoAtendimento.findMany({
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const configuracao = await this.prisma.configuracaoAtendimento.findUnique({
      where: { id },
      include: {
        unidade: true,
      },
    });

    if (!configuracao) {
      throw new Error('Configuração de Atendimento não encontrada');
    }

    return configuracao;
  }

  async findByUnidadeId(unidadeId: string) {
    const configuracao = await this.prisma.configuracaoAtendimento.findUnique({
      where: { unidadeId },
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
      },
    });

    if (!configuracao) {
      throw new Error('Configuração de Atendimento não encontrada para esta unidade');
    }

    return configuracao;
  }

  async update(id: string, data: UpdateConfiguracaoAtendimentoDto) {
    // Verificar se existe
    await this.findOne(id);

    return this.prisma.configuracaoAtendimento.update({
      where: { id },
      data: {
        ...(data.unidadeId && { unidadeId: data.unidadeId }),
        ...(data.prefixoSenha !== undefined && { prefixoSenha: data.prefixoSenha }),
        ...(data.reiniciarSenhaDiariamente !== undefined && { reiniciarSenhaDiariamente: data.reiniciarSenhaDiariamente }),
        ...(data.senhaInicial !== undefined && { senhaInicial: data.senhaInicial }),
        ...(data.horaAberturaAtendimento !== undefined && { horaAberturaAtendimento: data.horaAberturaAtendimento }),
        ...(data.horaFechamentoAtendimento !== undefined && { horaFechamentoAtendimento: data.horaFechamentoAtendimento }),
        ...(data.diasFuncionamento !== undefined && { diasFuncionamento: data.diasFuncionamento }),
        ...(data.triagemObrigatoria !== undefined && { triagemObrigatoria: data.triagemObrigatoria }),
        ...(data.tempoMedioTriagem !== undefined && { tempoMedioTriagem: data.tempoMedioTriagem }),
        ...(data.permitirAgendamento !== undefined && { permitirAgendamento: data.permitirAgendamento }),
        ...(data.limiteAgendamentoDias !== undefined && { limiteAgendamentoDias: data.limiteAgendamentoDias }),
        ...(data.permitirCancelamento !== undefined && { permitirCancelamento: data.permitirCancelamento }),
        ...(data.limiteCancelamentoHoras !== undefined && { limiteCancelamentoHoras: data.limiteCancelamentoHoras }),
        ...(data.tempoMedioConsulta !== undefined && { tempoMedioConsulta: data.tempoMedioConsulta }),
        ...(data.permitirEncaixe !== undefined && { permitirEncaixe: data.permitirEncaixe }),
        ...(data.limiteEncaixesDia !== undefined && { limiteEncaixesDia: data.limiteEncaixesDia }),
        ...(data.enviarSMSLembrete !== undefined && { enviarSMSLembrete: data.enviarSMSLembrete }),
        ...(data.horasAntesSMSLembrete !== undefined && { horasAntesSMSLembrete: data.horasAntesSMSLembrete }),
        ...(data.enviarEmailConfirmacao !== undefined && { enviarEmailConfirmacao: data.enviarEmailConfirmacao }),
        ...(data.exigirDocumentoIdentificacao !== undefined && { exigirDocumentoIdentificacao: data.exigirDocumentoIdentificacao }),
        ...(data.exigirCartaoSUS !== undefined && { exigirCartaoSUS: data.exigirCartaoSUS }),
        ...(data.toleranciaAtrasoMinutos !== undefined && { toleranciaAtrasoMinutos: data.toleranciaAtrasoMinutos }),
        ...(data.permitirFaltaSemJustificativa !== undefined && { permitirFaltaSemJustificativa: data.permitirFaltaSemJustificativa }),
        ...(data.limiteConsecutivoFaltas !== undefined && { limiteConsecutivoFaltas: data.limiteConsecutivoFaltas }),
        ...(data.diasBloqueioAposFaltas !== undefined && { diasBloqueioAposFaltas: data.diasBloqueioAposFaltas }),
      },
    });
  }

  async createOrUpdate(unidadeId: string, data: CreateConfiguracaoAtendimentoDto | UpdateConfiguracaoAtendimentoDto) {
    // Verificar se já existe configuração para esta unidade
    const existing = await this.prisma.configuracaoAtendimento.findUnique({
      where: { unidadeId },
    });

    if (existing) {
      // Atualizar existente
      return this.update(existing.id, data as UpdateConfiguracaoAtendimentoDto);
    } else {
      // Criar nova
      return this.create({ ...data, unidadeId } as CreateConfiguracaoAtendimentoDto);
    }
  }

  async remove(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Hard delete - não há soft delete para configurações
    return this.prisma.configuracaoAtendimento.delete({
      where: { id },
    });
  }

  async getStats() {
    const total = await this.prisma.configuracaoAtendimento.count();
    const comAgendamento = await this.prisma.configuracaoAtendimento.count({
      where: { permitirAgendamento: true },
    });
    const comTriagem = await this.prisma.configuracaoAtendimento.count({
      where: { triagemObrigatoria: true },
    });
    const comSMS = await this.prisma.configuracaoAtendimento.count({
      where: { enviarSMSLembrete: true },
    });

    return {
      total,
      comAgendamento,
      comTriagem,
      comSMS,
    };
  }
}
