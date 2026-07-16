import { prisma } from '../../lib/prisma';


export class FilaAtendimentoService {
  async adicionarNaFila(data: {
    citizenId: string;
    profissionalId: string;
    equipeId?: string;
    tipoAtendimento: string;
    motivoBusca: string;
    vacinacao: boolean;
    unidadeId: string;
  }) {
    return await prisma.filaAtendimento.create({
      data: {
        citizenId: data.citizenId,
        profissionalId: data.profissionalId,
        equipeId: data.equipeId,
        tipoAtendimento: data.tipoAtendimento as any,
        motivoBusca: data.motivoBusca,
        status: 'AGUARDANDO',
        prioridade: 'NORMAL',
        dataHoraChegada: new Date(),
        vacinacao: data.vacinacao,
        unidadeId: data.unidadeId,
      },
      include: {
        citizen: true,
        profissional: true,
        equipe: true,
      },
    });
  }

  async listarFilaPorUnidade(unidadeId: string, data?: Date) {
    const startOfDay = data ? new Date(data.setHours(0, 0, 0, 0)) : new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = data ? new Date(data.setHours(23, 59, 59, 999)) : new Date(new Date().setHours(23, 59, 59, 999));

    return await prisma.filaAtendimento.findMany({
      where: {
        unidadeId,
        dataHoraChegada: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        citizen: true,
        profissional: true,
        equipe: true,
      },
      orderBy: [
        { prioridade: 'desc' },
        { dataHoraChegada: 'asc' },
      ],
    });
  }

  async atualizarStatus(id: string, status: string) {
    return await prisma.filaAtendimento.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'EM_CONSULTA' && { dataHoraInicio: new Date() }),
        ...(status === 'FINALIZADO' && { dataHoraFim: new Date() }),
      },
    });
  }

  async chamarProximo(unidadeId: string, profissionalId: string, consultorio?: string) {
    const proximo = await prisma.filaAtendimento.findFirst({
      where: {
        unidadeId,
        profissionalId,
        status: 'AGUARDANDO',
      },
      orderBy: [
        { prioridade: 'desc' },
        { dataHoraChegada: 'asc' },
      ],
      include: {
        citizen: { select: { name: true } },
      },
    });

    if (proximo) {
      const atualizado = await this.atualizarStatus(proximo.id, 'EM_CONSULTA');

      // Registra a chamada no painel da unidade (não-fatal: o painel nunca
      // pode impedir o atendimento de prosseguir)
      try {
        await prisma.chamadaPainel.create({
          data: {
            unidadeId,
            filaId: proximo.id,
            consultorio: consultorio || 'Consultório',
            nomePaciente: proximo.citizen?.name || 'Paciente',
          },
        });
      } catch (painelError) {
        console.error('Erro ao registrar chamada no painel:', painelError);
      }

      return atualizado;
    }

    return null;
  }

  async obterEstatisticas(unidadeId: string, dataInicio: Date, dataFim: Date) {
    const total = await prisma.filaAtendimento.count({
      where: {
        unidadeId,
        dataHoraChegada: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
    });

    const porStatus = await prisma.filaAtendimento.groupBy({
      by: ['status'],
      where: {
        unidadeId,
        dataHoraChegada: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _count: true,
    });

    return { total, porStatus };
  }

  async buscarPorId(id: string) {
    return await prisma.filaAtendimento.findUnique({
      where: { id },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            birthDate: true,
          },
        },
        profissional: {
          select: {
            id: true,
            name: true,
          },
        },
        equipe: {
          select: {
            id: true,
            nome: true,
            ine: true,
          },
        },
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            fluxoAtendimento: true,
          },
        },
      },
    });
  }

  async classificarRisco(
    id: string,
    data: {
      classificacaoRisco: string;
      queixaPrincipal: string;
      sinaisVitais: any;
    }
  ) {
    // Mapear classificação de risco para prioridade
    const prioridadeMap: Record<string, string> = {
      VERMELHO: 'EMERGENCIA',
      LARANJA: 'MUITO_URGENTE',
      AMARELO: 'URGENTE',
      VERDE: 'NORMAL',
      AZUL: 'NORMAL',
    };

    return await prisma.filaAtendimento.update({
      where: { id },
      data: {
        classificacaoRisco: data.classificacaoRisco as any,
        queixaPrincipal: data.queixaPrincipal,
        sinaisVitais: data.sinaisVitais,
        dataClassificacaoRisco: new Date(),
        prioridade: prioridadeMap[data.classificacaoRisco] as any || 'NORMAL',
        status: 'AGUARDANDO_ATENDIMENTO',
      },
      include: {
        citizen: true,
        profissional: true,
      },
    });
  }

  async realizarAcolhimento(
    id: string,
    data: {
      condutaAcolhimento: string;
      observacoes?: string;
    }
  ) {
    // Mapear conduta para status
    const statusMap: Record<string, string> = {
      RESOLVER_ACOLHIMENTO: 'RESOLVIDO_ACOLHIMENTO',
      ENCAMINHAR_MEDICO: 'AGUARDANDO_ATENDIMENTO',
      ENCAMINHAR_ENFERMEIRO: 'AGUARDANDO_ATENDIMENTO',
      ENCAMINHAR_PROCEDIMENTO: 'EM_PROCEDIMENTO',
      AGENDAR_CONSULTA: 'FINALIZADO',
      ENCAMINHAR_EXTERNO: 'ENCAMINHADO_EXTERNO',
      ORIENTACAO: 'RESOLVIDO_ACOLHIMENTO',
    };

    const resolvidoNoAcolhimento = [
      'RESOLVER_ACOLHIMENTO',
      'ORIENTACAO',
    ].includes(data.condutaAcolhimento);

    return await prisma.filaAtendimento.update({
      where: { id },
      data: {
        condutaAcolhimento: data.condutaAcolhimento as any,
        dataAcolhimento: new Date(),
        resolvidoAcolhimento: resolvidoNoAcolhimento,
        status: statusMap[data.condutaAcolhimento] as any || 'AGUARDANDO_ATENDIMENTO',
        ...(data.observacoes && { observacoes: data.observacoes }),
        ...(resolvidoNoAcolhimento && { dataHoraFim: new Date() }),
      },
      include: {
        citizen: true,
        profissional: true,
        equipe: true,
      },
    });
  }
}

export default new FilaAtendimentoService();
