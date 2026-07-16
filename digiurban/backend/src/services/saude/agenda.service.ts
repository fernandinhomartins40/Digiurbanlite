import { prisma } from '../../lib/prisma';


export class AgendaService {
  async configurar(data: any) {
    return await prisma.configuracaoAgenda.create({
      data: {
        profissionalId: data.profissionalId,
        unidadeId: data.unidadeId,
        diaSemana: data.diaSemana,
        turno: data.turno,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        duracaoConsulta: data.duracaoConsulta,
        tiposAceitos: data.tiposAceitos,
        vagasTotais: data.vagasTotais,
        permiteOnline: data.permiteOnline || false,
        ativo: true,
      },
    });
  }

  async listar(filtros: { profissionalId?: string; unidadeId?: string; diaSemana?: number }) {
    return await prisma.configuracaoAgenda.findMany({
      where: {
        ...(filtros.profissionalId && { profissionalId: filtros.profissionalId }),
        ...(filtros.unidadeId && { unidadeId: filtros.unidadeId }),
        ...(filtros.diaSemana !== undefined && { diaSemana: filtros.diaSemana }),
        ativo: true,
      },
      include: {
        profissional: true,
      },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async marcarIndisponibilidade(data: {
    profissionalId: string;
    tipo: string;
    dataInicio: Date;
    dataFim: Date;
    motivo?: string;
  }) {
    return await prisma.indisponibilidadeProfissional.create({
      data: {
        profissionalId: data.profissionalId,
        tipo: data.tipo as any,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        motivo: data.motivo,
      },
    });
  }

  async listarIndisponibilidades(profissionalId: string, dataInicio?: Date, dataFim?: Date) {
    return await prisma.indisponibilidadeProfissional.findMany({
      where: {
        profissionalId,
        ...(dataInicio &&
          dataFim && {
            OR: [
              {
                dataInicio: {
                  gte: dataInicio,
                  lte: dataFim,
                },
              },
              {
                dataFim: {
                  gte: dataInicio,
                  lte: dataFim,
                },
              },
            ],
          }),
      },
      orderBy: { dataInicio: 'asc' },
    });
  }

  async calcularVagasDisponiveis(configuracaoId: string, data: Date) {
    // TODO: Implementar cálculo de vagas disponíveis baseado em agendamentos
    return 0;
  }
}

export default new AgendaService();
