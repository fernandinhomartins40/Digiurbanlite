import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AtividadeColetivaService {
  async criar(data: any) {
    return await prisma.atividadeColetiva.create({
      data: {
        tipo: data.tipo,
        tema: data.tema,
        descricao: data.descricao,
        dataHora: new Date(data.dataHora),
        duracao: data.duracao,
        local: data.local,
        unidadeId: data.unidadeId,
        publicoAlvo: data.publicoAlvo,
        faixaEtariaInicio: data.faixaEtariaInicio,
        faixaEtariaFim: data.faixaEtariaFim,
        numeroParticipantes: data.numeroParticipantes,
        praticasSaude: data.praticasSaude,
        status: 'PLANEJADA',
        avaliacoesRealizadas: data.avaliacoesRealizadas || false,
        observacoes: data.observacoes,
      },
    });
  }

  async adicionarProfissional(atividadeId: string, profissionalId: string, funcao?: string) {
    return await prisma.profissionalAtividade.create({
      data: {
        atividadeId,
        profissionalId,
        funcao,
      },
    });
  }

  async adicionarParticipante(atividadeId: string, participanteData: any) {
    return await prisma.participanteAtividade.create({
      data: {
        atividadeId,
        citizenId: participanteData.citizenId,
        pressaoArterial: participanteData.pressaoArterial,
        glicemia: participanteData.glicemia,
        peso: participanteData.peso,
        avaliacaoAlterada: participanteData.avaliacaoAlterada || false,
        observacoes: participanteData.observacoes,
      },
    });
  }

  async listar(filtros: { unidadeId?: string; tipo?: string; status?: string; dataInicio?: Date; dataFim?: Date }) {
    return await prisma.atividadeColetiva.findMany({
      where: {
        ...(filtros.unidadeId && { unidadeId: filtros.unidadeId }),
        ...(filtros.tipo && { tipo: filtros.tipo as any }),
        ...(filtros.status && { status: filtros.status as any }),
        ...(filtros.dataInicio &&
          filtros.dataFim && {
            dataHora: {
              gte: filtros.dataInicio,
              lte: filtros.dataFim,
            },
          }),
      },
      include: {
        profissionais: {
          include: {
            profissional: true,
          },
        },
        participantes: {
          include: {
            citizen: true,
          },
        },
      },
      orderBy: { dataHora: 'desc' },
    });
  }

  async buscarPorId(id: string) {
    return await prisma.atividadeColetiva.findUnique({
      where: { id },
      include: {
        profissionais: {
          include: {
            profissional: true,
          },
        },
        participantes: {
          include: {
            citizen: true,
          },
        },
      },
    });
  }

  async atualizarStatus(id: string, status: string) {
    return await prisma.atividadeColetiva.update({
      where: { id },
      data: { status: status as any },
    });
  }
}

export default new AtividadeColetivaService();
