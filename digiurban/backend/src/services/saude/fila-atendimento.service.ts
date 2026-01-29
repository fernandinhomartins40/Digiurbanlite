import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  async chamarProximo(unidadeId: string, profissionalId: string) {
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
    });

    if (proximo) {
      return await this.atualizarStatus(proximo.id, 'EM_CONSULTA');
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
}

export default new FilaAtendimentoService();
