import { prisma } from '../../lib/prisma';


export class EscutaInicialService {
  async criar(data: any) {
    const escuta = await prisma.escutaInicial.create({
      data: {
        filaAtendimentoId: data.filaAtendimentoId,
        profissionalId: data.profissionalId,
        equipeId: data.equipeId,
        motivoBusca: data.motivoBusca,
        historiaBreve: data.historiaBreve,
        tempoEvolucao: data.tempoEvolucao,
        tentativasAnteriores: data.tentativasAnteriores,
        pressaoArterial: data.pressaoArterial,
        temperatura: data.temperatura,
        frequenciaCardiaca: data.frequenciaCardiaca,
        observacoesVisuais: data.observacoesVisuais,
        riscoEsperado: data.riscoEsperado,
        vulnerabilidadeSocial: data.vulnerabilidadeSocial,
        condutaDefinida: data.condutaDefinida,
        profissionalEncaminhadoId: data.profissionalEncaminhadoId,
        dataAgendamento: data.dataAgendamento,
        orientacoes: data.orientacoes,
        unidadeId: data.unidadeId,
      },
      include: {
        profissional: true,
        profissionalEncaminhado: true,
      },
    });

    // Atualizar status da fila
    await prisma.filaAtendimento.update({
      where: { id: data.filaAtendimentoId },
      data: { status: 'EM_ESCUTA_INICIAL' },
    });

    return escuta;
  }

  async buscarPorFila(filaAtendimentoId: string) {
    return await prisma.escutaInicial.findUnique({
      where: { filaAtendimentoId },
      include: {
        profissional: true,
        profissionalEncaminhado: true,
      },
    });
  }

  async listar(filtros: { unidadeId?: string; dataInicio?: Date; dataFim?: Date }) {
    return await prisma.escutaInicial.findMany({
      where: {
        ...(filtros.unidadeId && { unidadeId: filtros.unidadeId }),
        ...(filtros.dataInicio &&
          filtros.dataFim && {
            createdAt: {
              gte: filtros.dataInicio,
              lte: filtros.dataFim,
            },
          }),
      },
      include: {
        profissional: true,
        filaAtendimento: {
          include: {
            citizen: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new EscutaInicialService();
