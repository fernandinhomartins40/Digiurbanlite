import { PrioridadeFila } from '@prisma/client';
import { prisma } from '../../lib/prisma';


export class TriagemEnfermagemService {
  async criar(data: any) {
    const triagem = await prisma.triagemEnfermagem.create({
      data: {
        filaAtendimentoId: data.filaAtendimentoId,
        enfermeiroId: data.enfermeiroId,
        pressaoArterial: data.pressaoArterial,
        temperatura: data.temperatura,
        frequenciaCardiaca: data.frequenciaCardiaca,
        frequenciaRespiratoria: data.frequenciaRespiratoria,
        saturacaoO2: data.saturacaoO2,
        dor: data.dor,
        peso: data.peso,
        altura: data.altura,
        imc: data.imc,
        perimetroCefalico: data.perimetroCefalico,
        circunferenciaAbdominal: data.circunferenciaAbdominal,
        glicemiaCapilar: data.glicemiaCapilar,
        momentoGlicemia: data.momentoGlicemia,
        queixaPrincipal: data.queixaPrincipal,
        historiaDoencaAtual: data.historiaDoencaAtual,
        alergiasConhecidas: data.alergiasConhecidas,
        medicamentosUso: data.medicamentosUso,
        comorbidades: data.comorbidades,
        classificacaoRisco: data.classificacaoRisco,
        discriminadorUtilizado: data.discriminadorUtilizado,
        profissionalEncaminhadoId: data.profissionalEncaminhadoId,
        observacoes: data.observacoes,
        unidadeId: data.unidadeId,
      },
      include: {
        enfermeiro: true,
        profissionalEncaminhado: true,
      },
    });

    // Atualizar status da fila
    await prisma.filaAtendimento.update({
      where: { id: data.filaAtendimentoId },
      data: {
        status: 'EM_TRIAGEM',
        prioridade: this.mapearPrioridadeManchester(data.classificacaoRisco),
      },
    });

    return triagem;
  }

  private mapearPrioridadeManchester(classificacao: string): PrioridadeFila {
    switch (classificacao) {
      case 'VERMELHO':
      case 'EMERGENCIA':
        return PrioridadeFila.EMERGENCIA;
      case 'LARANJA':
      case 'MUITO_URGENTE':
        return PrioridadeFila.MUITO_URGENTE;
      case 'AMARELO':
      case 'URGENTE':
        return PrioridadeFila.URGENTE;
      default:
        return PrioridadeFila.NORMAL;
    }
  }

  async buscarPorFila(filaAtendimentoId: string) {
    return await prisma.triagemEnfermagem.findUnique({
      where: { filaAtendimentoId },
      include: {
        enfermeiro: true,
        profissionalEncaminhado: true,
      },
    });
  }

  async listar(filtros: { unidadeId?: string; dataInicio?: Date; dataFim?: Date }) {
    return await prisma.triagemEnfermagem.findMany({
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
        enfermeiro: true,
        filaAtendimento: {
          include: {
            citizen: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obterEstatisticasClassificacao(unidadeId: string, dataInicio: Date, dataFim: Date) {
    const porClassificacao = await prisma.triagemEnfermagem.groupBy({
      by: ['classificacaoRisco'],
      where: {
        unidadeId,
        createdAt: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _count: true,
    });

    return porClassificacao;
  }
}

export default new TriagemEnfermagemService();
