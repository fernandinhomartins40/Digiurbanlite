// ============================================================================
// SERVICE - VIAGENS TFD
// ============================================================================

import { prisma } from '../../lib/prisma';
import {
  CreateViagemTFDDTO,
  UpdateViagemTFDDTO,
  CreatePassageiroViagemDTO,
  CreatePrestacaoContasDTO,
  UpdatePrestacaoContasDTO,
  ViagemTFDCompletoResponse,
  StatusViagemTFD,
  StatusPrestacaoContas,
} from '../../types/saude-tfd.types';


export class ViagensTFDService {
  // ============================================================================
  // VIAGENS
  // ============================================================================

  /**
   * Criar viagem TFD
   */
  async criarViagem(data: CreateViagemTFDDTO): Promise<ViagemTFDCompletoResponse> {
    // Verificar se a solicitação está agendada
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: data.solicitacaoId },
      include: {
        agendamentosExternos: {
          where: { confirmado: true },
          take: 1,
        },
      },
    });

    if (!solicitacao) {
      throw new Error('Solicitação TFD não encontrada');
    }

    if (!solicitacao.agendamentosExternos.length) {
      throw new Error('Solicitação não possui agendamento externo confirmado');
    }

    // Criar viagem
    const viagem = await prisma.viagemTFD.create({
      data: {
        solicitacaoTFDId: data.solicitacaoId,
        veiculoId: data.veiculoId,
        motoristaId: data.motoristaId,
        tipo: 'IDA_E_VOLTA',
        dataViagem: data.dataIda,
        horarioSaida: data.horaIda,
        horarioChegada: data.horaVolta,
        dataRetornoReal: data.dataVolta,
        observacoes: data.observacoes,
        status: 'PLANEJADA',
      },
      include: {
        solicitacao: {
          include: {
            agendamentosExternos: {
              where: { confirmado: true },
              take: 1,
            },
          },
        },
        veiculo: {
          select: {
            placa: true,
            modelo: true,
            capacidade: true,
          },
        },
        motorista: {
          select: {
            nome: true,
            telefone: true,
          },
        },
        passageiros: true,
      },
    });

    // Atualizar status da solicitação
    await prisma.solicitacaoTFD.update({
      where: { id: data.solicitacaoId },
      data: {
        status: 'AGUARDANDO_VIAGEM',
      },
    });

    return viagem as any;
  }

  /**
   * Atualizar viagem
   */
  async atualizarViagem(id: string, data: UpdateViagemTFDDTO) {
    const updateData: any = {};

    if (data.veiculoId !== undefined) updateData.veiculoId = data.veiculoId;
    if (data.motoristaId !== undefined) updateData.motoristaId = data.motoristaId;
    if (data.dataIda !== undefined) updateData.dataViagem = data.dataIda;
    if (data.horaIda !== undefined) updateData.horarioSaida = data.horaIda;
    if (data.dataVolta !== undefined) updateData.dataRetornoReal = data.dataVolta;
    if (data.horaVolta !== undefined) updateData.horarioChegada = data.horaVolta;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
    if (data.status !== undefined) updateData.status = data.status;

    return await prisma.viagemTFD.update({
      where: { id },
      data: updateData,
      include: {
        veiculo: true,
        motorista: true,
        passageiros: true,
      },
    });
  }

  /**
   * Buscar viagem completa
   */
  async buscarViagem(id: string): Promise<ViagemTFDCompletoResponse> {
    const viagem = await prisma.viagemTFD.findUnique({
      where: { id },
      include: {
        solicitacao: {
          include: {
            agendamentosExternos: {
              where: {
                confirmado: true,
              },
              take: 1,
            },
          },
        },
        veiculo: {
          select: {
            id: true,
            placa: true,
            modelo: true,
            capacidade: true,
          },
        },
        motorista: {
          select: {
            id: true,
            nome: true,
            telefone: true,
          },
        },
        passageiros: true,
        prestacaoContas: true,
      },
    });

    if (!viagem) {
      throw new Error('Viagem TFD não encontrada');
    }

    return viagem as any;
  }

  /**
   * Listar viagens
   */
  async listarViagens(filtros: {
    solicitacaoId?: string;
    veiculoId?: string;
    motoristaId?: string;
    status?: StatusViagemTFD;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    const whereClause: any = {};

    if (filtros.solicitacaoId) whereClause.solicitacaoTFDId = filtros.solicitacaoId;
    if (filtros.veiculoId) whereClause.veiculoId = filtros.veiculoId;
    if (filtros.motoristaId) whereClause.motoristaId = filtros.motoristaId;
    if (filtros.status) whereClause.status = filtros.status;

    if (filtros.dataInicio && filtros.dataFim) {
      whereClause.dataViagem = {
        gte: filtros.dataInicio,
        lte: filtros.dataFim,
      };
    } else if (filtros.dataInicio) {
      whereClause.dataViagem = { gte: filtros.dataInicio };
    } else if (filtros.dataFim) {
      whereClause.dataViagem = { lte: filtros.dataFim };
    }

    return await prisma.viagemTFD.findMany({
      where: whereClause,
      include: {
        solicitacao: true,
        veiculo: {
          select: {
            placa: true,
            modelo: true,
          },
        },
        motorista: {
          select: {
            nome: true,
          },
        },
        passageiros: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        dataViagem: 'desc',
      },
    });
  }

  /**
   * Atualizar status da viagem
   */
  async atualizarStatus(viagemId: string, status: string, observacoes?: string) {
    const dataUpdate: any = { status };

    if (observacoes) {
      dataUpdate.observacoes = observacoes;
    }

    return await prisma.viagemTFD.update({
      where: { id: viagemId },
      data: dataUpdate,
    });
  }

  /**
   * Confirmar viagem
   */
  async confirmarViagem(viagemId: string) {
    return await prisma.viagemTFD.update({
      where: { id: viagemId },
      data: { status: 'PLANEJADA' },
    });
  }

  /**
   * Iniciar viagem
   */
  async iniciarViagem(viagemId: string) {
    return await this.atualizarStatus(viagemId, 'EM_ANDAMENTO');
  }

  /**
   * Concluir viagem
   */
  async concluirViagem(viagemId: string, observacoes?: string) {
    return await this.atualizarStatus(viagemId, 'CONCLUIDA', observacoes);
  }

  /**
   * Cancelar viagem
   */
  async cancelarViagem(viagemId: string, motivo: string) {
    return await this.atualizarStatus(viagemId, 'CANCELADA', `CANCELADA: ${motivo}`);
  }

  // ============================================================================
  // PASSAGEIROS
  // ============================================================================

  /**
   * Adicionar passageiro à viagem
   */
  async adicionarPassageiro(data: CreatePassageiroViagemDTO) {
    // Verificar capacidade do veículo
    const viagem = await prisma.viagemTFD.findUnique({
      where: { id: data.viagemId },
      include: {
        veiculo: true,
        passageiros: true,
      },
    });

    if (!viagem) {
      throw new Error('Viagem não encontrada');
    }

    if (viagem.veiculo && viagem.passageiros.length >= viagem.veiculo.capacidade) {
      throw new Error('Veículo já está com capacidade máxima');
    }

    // Buscar solicitação para obter citizenId
    const solicitacao = await prisma.solicitacaoTFD.findUnique({
      where: { id: data.solicitacaoId },
    });

    if (!solicitacao) {
      throw new Error('Solicitação não encontrada');
    }

    return await prisma.passageiroViagemTFD.create({
      data: {
        viagemId: data.viagemId,
        solicitacaoId: data.solicitacaoId,
        citizenId: solicitacao.citizenId,
        acompanhante: !!data.acompanhanteId,
        observacoes: data.observacoes,
      },
      include: {
        solicitacao: true,
        citizen: {
          select: {
            name: true,
            cpf: true,
          },
        },
      },
    });
  }

  /**
   * Remover passageiro
   */
  async removerPassageiro(id: string) {
    return await prisma.passageiroViagemTFD.delete({
      where: { id },
    });
  }

  /**
   * Listar passageiros de uma viagem
   */
  async listarPassageiros(viagemId: string) {
    return await prisma.passageiroViagemTFD.findMany({
      where: { viagemId },
      include: {
        solicitacao: {
          include: {
            agendamentosExternos: {
              where: {
                confirmado: true,
              },
              select: {
                dataHoraConsulta: true,
                hospitalDestino: true,
              },
              take: 1,
            },
          },
        },
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Agrupar solicitações compatíveis para viagem
   */
  async agruparSolicitacoesCompativeis(filtros: {
    cidadeDestino: string;
    estadoDestino: string;
    dataInicio: Date;
    dataFim: Date;
  }): Promise<any[]> {
    // Buscar agendamentos na mesma cidade e período
    const agendamentos = await prisma.agendamentoExternoTFD.findMany({
      where: {
        dataHoraConsulta: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
        confirmado: true,
        solicitacao: {
          cidadeDestino: filtros.cidadeDestino,
          estadoDestino: filtros.estadoDestino,
          status: { in: ['APROVADO_PARA_AGENDAMENTO', 'AGENDADO'] },
          viagens: {
            none: {},
          },
        },
      },
      include: {
        solicitacao: true,
      },
      orderBy: {
        dataHoraConsulta: 'asc',
      },
    });

    // Agrupar por data
    const grupos: Record<string, any[]> = {};
    agendamentos.forEach((ag) => {
      const dataKey = ag.dataHoraConsulta.toISOString().split('T')[0];
      if (!grupos[dataKey]) {
        grupos[dataKey] = [];
      }
      grupos[dataKey].push({
        agendamentoId: ag.id,
        solicitacaoId: ag.solicitacaoId,
        dataAgendamento: ag.dataHoraConsulta,
        localAtendimento: ag.hospitalDestino,
      });
    });

    return Object.entries(grupos).map(([data, agendamentos]) => ({
      data,
      totalPassageiros: agendamentos.length,
      agendamentos,
    }));
  }

  // ============================================================================
  // PRESTAÇÃO DE CONTAS
  // ============================================================================

  /**
   * Criar prestação de contas
   */
  async criarPrestacaoContas(data: CreatePrestacaoContasDTO) {
    // Verificar se a viagem está concluída
    const viagem = await prisma.viagemTFD.findUnique({
      where: { id: data.viagemId },
    });

    if (!viagem) {
      throw new Error('Viagem não encontrada');
    }

    if (viagem.status !== 'CONCLUIDA') {
      throw new Error('Só é possível criar prestação de contas para viagens concluídas');
    }

    const totalKm = data.kmFinal - data.kmInicial;
    const totalGasto =
      (data.valorCombustivel || 0) +
      (data.pedagios || 0) +
      (data.alimentacao || 0) +
      (data.hospedagem || 0) +
      (data.outrosGastos || 0);

    return await prisma.prestacaoContasTFD.create({
      data: {
        viagemId: data.viagemId,
        combustivelLitros: data.combustivelGasto || 0,
        combustivelValor: data.valorCombustivel || 0,
        pedagioQuantidade: 0, // TODO: adicionar no DTO
        pedagioValor: data.pedagios || 0,
        alimentacaoValor: data.alimentacao,
        hospedagemDiarias: 0, // TODO: adicionar no DTO
        hospedagemValor: data.hospedagem,
        outrosCustos: data.outrosGastos ? { outros: data.outrosGastos } : undefined,
        valorTotal: totalGasto,
        observacoes: data.observacoes,
        usuarioPrestacao: 'SYSTEM', // TODO: Pegar do contexto
        status: 'PENDENTE',
      },
      include: {
        viagem: {
          include: {
            solicitacao: true,
            veiculo: {
              select: {
                placa: true,
                modelo: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Atualizar prestação de contas
   */
  async atualizarPrestacaoContas(id: string, data: UpdatePrestacaoContasDTO) {
    const prestacao = await prisma.prestacaoContasTFD.findUnique({
      where: { id },
    });

    if (!prestacao) {
      throw new Error('Prestação de contas não encontrada');
    }

    const updateData: any = {};

    if (data.kmInicial !== undefined) updateData.kmInicial = data.kmInicial;
    if (data.kmFinal !== undefined) updateData.kmFinal = data.kmFinal;
    if (data.combustivelGasto !== undefined) updateData.combustivelLitros = data.combustivelGasto;
    if (data.valorCombustivel !== undefined) updateData.combustivelValor = data.valorCombustivel;
    if (data.pedagios !== undefined) updateData.pedagioValor = data.pedagios;
    if (data.alimentacao !== undefined) updateData.alimentacaoValor = data.alimentacao;
    if (data.hospedagem !== undefined) updateData.hospedagemValor = data.hospedagem;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;

    // Recalcular total
    if (data.valorCombustivel !== undefined || data.pedagios !== undefined ||
        data.alimentacao !== undefined || data.hospedagem !== undefined ||
        data.outrosGastos !== undefined) {
      updateData.valorTotal =
        (data.valorCombustivel ?? prestacao.combustivelValor) +
        (data.pedagios ?? prestacao.pedagioValor) +
        (data.alimentacao ?? prestacao.alimentacaoValor ?? 0) +
        (data.hospedagem ?? prestacao.hospedagemValor ?? 0);
    }

    return await prisma.prestacaoContasTFD.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Aprovar prestação de contas
   */
  async aprovarPrestacaoContas(id: string, aprovadoPorId: string, observacoes?: string) {
    return await prisma.prestacaoContasTFD.update({
      where: { id },
      data: {
        status: 'APROVADA',
        usuarioAprovacao: aprovadoPorId,
        dataAprovacao: new Date(),
        observacoes,
      },
    });
  }

  /**
   * Reprovar prestação de contas
   */
  async reprovarPrestacaoContas(id: string, aprovadoPorId: string, motivo: string) {
    return await prisma.prestacaoContasTFD.update({
      where: { id },
      data: {
        status: 'REJEITADA',
        usuarioAprovacao: aprovadoPorId,
        dataAprovacao: new Date(),
        observacoes: `REPROVADA: ${motivo}`,
      },
    });
  }

  /**
   * Buscar prestação de contas
   */
  async buscarPrestacaoContas(id: string) {
    return await prisma.prestacaoContasTFD.findUnique({
      where: { id },
      include: {
        viagem: {
          include: {
            solicitacao: true,
            veiculo: {
              select: {
                placa: true,
                modelo: true,
              },
            },
            motorista: {
              select: {
                nome: true,
              },
            },
          },
        },
        usuarioAprov: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  /**
   * Listar prestações de contas
   */
  async listarPrestacoesContas(filtros: {
    viagemId?: string;
    status?: StatusPrestacaoContas;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    const whereClause: any = {};

    if (filtros.viagemId) whereClause.viagemId = filtros.viagemId;
    if (filtros.status) whereClause.status = filtros.status;

    if (filtros.dataInicio && filtros.dataFim) {
      whereClause.dataPrestacao = {
        gte: filtros.dataInicio,
        lte: filtros.dataFim,
      };
    } else if (filtros.dataInicio) {
      whereClause.dataPrestacao = { gte: filtros.dataInicio };
    } else if (filtros.dataFim) {
      whereClause.dataPrestacao = { lte: filtros.dataFim };
    }

    return await prisma.prestacaoContasTFD.findMany({
      where: whereClause,
      include: {
        viagem: {
          include: {
            veiculo: {
              select: {
                placa: true,
                modelo: true,
              },
            },
            motorista: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataPrestacao: 'desc',
      },
    });
  }

  // ============================================================================
  // ESTATÍSTICAS E RELATÓRIOS
  // ============================================================================

  /**
   * Obter estatísticas de viagens
   */
  async obterEstatisticas(filtros: {
    dataInicio: Date;
    dataFim: Date;
  }) {
    const viagens = await prisma.viagemTFD.findMany({
      where: {
        dataViagem: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
      },
      include: {
        passageiros: true,
        prestacaoContas: true,
      },
    });

    const total = viagens.length;

    // Por status
    const porStatus: Record<string, number> = {};
    viagens.forEach((v) => {
      porStatus[v.status] = (porStatus[v.status] || 0) + 1;
    });

    // Total de pacientes transportados
    const totalPacientes = viagens.reduce(
      (acc, v) => acc + v.passageiros.length,
      0
    );

    // Média de passageiros por viagem
    const mediaPassageiros = total > 0 ? totalPacientes / total : 0;

    // Gastos totais
    const gastosTotal = viagens.reduce(
      (acc, v) => acc + (v.prestacaoContas?.valorTotal || 0),
      0
    );

    // KM total
    const kmTotal = viagens.reduce(
      (acc, v) => acc + (v.kmTotal || 0),
      0
    );

    return {
      total,
      totalPacientes,
      mediaPassageiros: Math.round(mediaPassageiros * 100) / 100,
      porStatus: Object.entries(porStatus).map(([status, count]) => ({ status, count })),
      gastosTotal,
      kmTotal,
    };
  }

  /**
   * Listar próximas viagens
   */
  async listarProximasViagens(diasProximos: number = 7) {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasProximos);

    return await prisma.viagemTFD.findMany({
      where: {
        dataViagem: {
          gte: hoje,
          lte: dataLimite,
        },
        status: { in: ['PLANEJADA'] },
      },
      include: {
        solicitacao: {
          include: {
            agendamentosExternos: {
              where: {
                confirmado: true,
              },
              take: 1,
            },
          },
        },
        veiculo: {
          select: {
            placa: true,
            modelo: true,
          },
        },
        motorista: {
          select: {
            nome: true,
            telefone: true,
          },
        },
        passageiros: {
          include: {
            solicitacao: true,
            citizen: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataViagem: 'asc',
      },
    });
  }
}

export default new ViagensTFDService();
