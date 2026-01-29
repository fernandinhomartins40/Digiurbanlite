// ============================================================================
// SERVICE - AGENDA MÉDICA E DISPONIBILIDADES
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateIndisponibilidadeDTO,
  UpdateIndisponibilidadeDTO,
  BuscarDisponibilidadeDTO,
  DisponibilidadeResponse,
  TipoIndisponibilidade,
} from '../../types/saude-atendimento.types';

const prisma = new PrismaClient();

export class AgendaService {
  /**
   * Buscar disponibilidades de horários para agendamento
   */
  async buscarDisponibilidades(
    filtros: BuscarDisponibilidadeDTO
  ): Promise<DisponibilidadeResponse[]> {
    const { profissionalId, unidadeId, especialidade, dataInicio, dataFim } = filtros;

    // Buscar agendas que correspondem aos filtros
    const agendas = await prisma.agendaMedica.findMany({
      where: {
        ...(profissionalId && { profissionalId }),
        ...(unidadeId && { unidadeId }),
        isActive: true,
      },
      include: {
        consultas: {
          where: {
            dataHora: {
              gte: dataInicio,
              lte: dataFim,
            },
            status: {
              in: ['AGENDADA', 'CONFIRMADA'],
            },
          },
        },
        indisponibilidades: {
          where: {
            OR: [
              {
                dataInicio: {
                  lte: dataFim,
                },
                dataFim: {
                  gte: dataInicio,
                },
              },
            ],
          },
        },
      },
    });

    // Processar disponibilidades por agenda
    const disponibilidades: DisponibilidadeResponse[] = [];

    for (const agenda of agendas) {
      // Buscar informações do profissional
      const profissional = await prisma.profissionalSaude.findUnique({
        where: { id: agenda.profissionalId },
      });

      // Buscar informações da unidade
      const unidade = await prisma.unidadeSaude.findUnique({
        where: { id: agenda.unidadeId },
      });

      if (!profissional || !unidade) continue;

      // Filtrar por especialidade se fornecido
      if (especialidade && profissional.especialidade !== especialidade) continue;

      // Calcular horários disponíveis
      const datasDisponiveis = this.calcularHorariosDisponiveis(
        agenda,
        dataInicio,
        dataFim,
        agenda.consultas,
        agenda.indisponibilidades
      );

      disponibilidades.push({
        profissionalId: profissional.id,
        profissionalNome: profissional.nome,
        especialidade: profissional.especialidade || undefined,
        unidadeId: unidade.id,
        unidadeNome: unidade.nome,
        datasDisponiveis,
      });
    }

    return disponibilidades;
  }

  /**
   * Calcular horários disponíveis para uma agenda
   */
  private calcularHorariosDisponiveis(
    agenda: any,
    dataInicio: Date,
    dataFim: Date,
    consultasAgendadas: any[],
    indisponibilidades: any[]
  ): any[] {
    const datasDisponiveis: any[] = [];
    const currentDate = new Date(dataInicio);

    while (currentDate <= dataFim) {
      const diaSemana = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

      // Verificar se a agenda atende neste dia da semana
      if (agenda.diaSemana === diaSemana) {
        // Verificar se não há indisponibilidade nesta data
        const temIndisponibilidade = indisponibilidades.some(
          (ind) =>
            currentDate >= new Date(ind.dataInicio) &&
            currentDate <= new Date(ind.dataFim)
        );

        if (!temIndisponibilidade) {
          // Gerar horários disponíveis
          const horariosDisponiveis = this.gerarHorarios(
            agenda.horaInicio,
            agenda.horaFim,
            agenda.tempoPorConsulta,
            currentDate,
            consultasAgendadas
          );

          if (horariosDisponiveis.length > 0) {
            datasDisponiveis.push({
              data: new Date(currentDate),
              horariosDisponiveis,
            });
          }
        }
      }

      // Avançar para o próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return datasDisponiveis;
  }

  /**
   * Gerar horários disponíveis para um dia específico
   */
  private gerarHorarios(
    horaInicio: string,
    horaFim: string,
    tempoPorConsulta: number,
    data: Date,
    consultasAgendadas: any[]
  ): any[] {
    const horarios: any[] = [];
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFimNum, minFim] = horaFim.split(':').map(Number);

    let minutoAtual = horaIni * 60 + minIni;
    const minutoFinal = horaFimNum * 60 + minFim;

    while (minutoAtual + tempoPorConsulta <= minutoFinal) {
      const hora = Math.floor(minutoAtual / 60);
      const minuto = minutoAtual % 60;
      const horarioStr = `${hora.toString().padStart(2, '0')}:${minuto
        .toString()
        .padStart(2, '0')}`;

      // Verificar se já existe consulta agendada neste horário
      const dataHoraConsulta = new Date(data);
      dataHoraConsulta.setHours(hora, minuto, 0, 0);

      const jaAgendado = consultasAgendadas.some((consulta) => {
        const consultaHora = new Date(consulta.dataHora);
        return consultaHora.getTime() === dataHoraConsulta.getTime();
      });

      if (!jaAgendado) {
        horarios.push({
          hora: horarioStr,
          agendaId: consultasAgendadas[0]?.agendaId || '',
          vagas: 1,
        });
      }

      minutoAtual += tempoPorConsulta;
    }

    return horarios;
  }

  /**
   * Criar indisponibilidade (férias, licença, etc.)
   */
  async criarIndisponibilidade(data: CreateIndisponibilidadeDTO) {
    return await prisma.indisponibilidadeAgenda.create({
      data: {
        agendaId: data.agendaId,
        profissionalId: data.profissionalId,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        motivo: data.motivo,
        tipoIndisponibilidade: data.tipoIndisponibilidade,
      },
    });
  }

  /**
   * Atualizar indisponibilidade
   */
  async atualizarIndisponibilidade(id: string, data: UpdateIndisponibilidadeDTO) {
    return await prisma.indisponibilidadeAgenda.update({
      where: { id },
      data,
    });
  }

  /**
   * Excluir indisponibilidade
   */
  async excluirIndisponibilidade(id: string) {
    return await prisma.indisponibilidadeAgenda.delete({
      where: { id },
    });
  }

  /**
   * Listar indisponibilidades de um profissional
   */
  async listarIndisponibilidades(profissionalId: string, ativas: boolean = true) {
    const now = new Date();

    return await prisma.indisponibilidadeAgenda.findMany({
      where: {
        profissionalId,
        ...(ativas && {
          dataFim: {
            gte: now,
          },
        }),
      },
      include: {
        agenda: true,
        profissional: {
          select: {
            id: true,
            nome: true,
            especialidade: true,
          },
        },
      },
      orderBy: {
        dataInicio: 'asc',
      },
    });
  }

  /**
   * Verificar disponibilidade para um horário específico
   */
  async verificarDisponibilidade(
    agendaId: string,
    dataHora: Date
  ): Promise<boolean> {
    // Verificar se já existe consulta agendada
    const consultaExistente = await prisma.consultaAgendada.findFirst({
      where: {
        agendaId,
        dataHora,
        status: {
          in: ['AGENDADA', 'CONFIRMADA'],
        },
      },
    });

    if (consultaExistente) return false;

    // Verificar indisponibilidades
    const agenda = await prisma.agendaMedica.findUnique({
      where: { id: agendaId },
      include: {
        indisponibilidades: {
          where: {
            dataInicio: {
              lte: dataHora,
            },
            dataFim: {
              gte: dataHora,
            },
          },
        },
      },
    });

    return !agenda?.indisponibilidades || agenda.indisponibilidades.length === 0;
  }
}

export default new AgendaService();
