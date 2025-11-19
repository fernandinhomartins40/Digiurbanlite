import { PrismaClient, ConsultaStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateAgendaMedicaDTO {
  profissionalId: string;
  unidadeId: string;
  diaSemana: number; // 0-6 (Domingo-Sábado)
  horaInicio: string; // formato HH:mm
  horaFim: string; // formato HH:mm
  tempoPorConsulta: number; // em minutos
  vagasDisponiveis: number;
}

export interface UpdateAgendaMedicaDTO {
  horaInicio?: string;
  horaFim?: string;
  tempoPorConsulta?: number;
  vagasDisponiveis?: number;
  isActive?: boolean;
}

export interface AgendarConsultaDTO {
  agendaId: string;
  citizenId: string;
  dataHora: Date;
  motivoConsulta?: string;
  observacoes?: string;
}

export interface CancelarConsultaDTO {
  canceladoPor: string;
  motivoCancelamento: string;
}

export class AgendaMedicaService {
  /**
   * Criar nova agenda médica para um profissional
   */
  async createAgenda(data: CreateAgendaMedicaDTO) {
    // Validar horários
    if (data.horaInicio >= data.horaFim) {
      throw new Error('Hora de início deve ser anterior à hora de fim');
    }

    // Verificar conflitos de agenda
    const conflito = await prisma.agendaMedica.findFirst({
      where: {
        profissionalId: data.profissionalId,
        unidadeId: data.unidadeId,
        diaSemana: data.diaSemana,
        isActive: true,
        OR: [
          {
            AND: [
              { horaInicio: { lte: data.horaInicio } },
              { horaFim: { gt: data.horaInicio } },
            ],
          },
          {
            AND: [
              { horaInicio: { lt: data.horaFim } },
              { horaFim: { gte: data.horaFim } },
            ],
          },
        ],
      },
    });

    if (conflito) {
      throw new Error('Já existe uma agenda para este profissional neste horário');
    }

    return await prisma.agendaMedica.create({
      data,
    });
  }

  /**
   * Buscar agenda por ID
   */
  async findById(id: string) {
    return await prisma.agendaMedica.findUnique({
      where: { id },
      include: {
        consultas: {
          orderBy: { dataHora: 'asc' },
        },
      },
    });
  }

  /**
   * Buscar agendas por profissional
   */
  async findByProfissional(profissionalId: string) {
    return await prisma.agendaMedica.findMany({
      where: {
        profissionalId,
        isActive: true,
      },
      include: {
        consultas: {
          where: {
            status: {
              in: ['AGENDADA', 'CONFIRMADA'],
            },
          },
          orderBy: { dataHora: 'asc' },
        },
      },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  /**
   * Buscar agendas por unidade de saúde
   */
  async findByUnidade(unidadeId: string, diaSemana?: number) {
    return await prisma.agendaMedica.findMany({
      where: {
        unidadeId,
        isActive: true,
        ...(diaSemana !== undefined && { diaSemana }),
      },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  /**
   * Atualizar agenda
   */
  async update(id: string, data: UpdateAgendaMedicaDTO) {
    return await prisma.agendaMedica.update({
      where: { id },
      data,
    });
  }

  /**
   * Desativar agenda
   */
  async deactivate(id: string) {
    // Verificar se há consultas futuras
    const consultasFuturas = await prisma.consultaAgendada.count({
      where: {
        agendaId: id,
        dataHora: { gte: new Date() },
        status: {
          in: ['AGENDADA', 'CONFIRMADA'],
        },
      },
    });

    if (consultasFuturas > 0) {
      throw new Error(
        `Não é possível desativar agenda com ${consultasFuturas} consulta(s) futura(s)`
      );
    }

    return await prisma.agendaMedica.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Verificar disponibilidade de horários
   */
  async getHorariosDisponiveis(agendaId: string, data: Date) {
    const agenda = await prisma.agendaMedica.findUnique({
      where: { id: agendaId },
      include: {
        consultas: {
          where: {
            dataHora: {
              gte: new Date(data.setHours(0, 0, 0, 0)),
              lt: new Date(data.setHours(23, 59, 59, 999)),
            },
            status: {
              in: ['AGENDADA', 'CONFIRMADA'],
            },
          },
        },
      },
    });

    if (!agenda || !agenda.isActive) {
      throw new Error('Agenda não encontrada ou inativa');
    }

    // Verificar se o dia da semana corresponde
    if (data.getDay() !== agenda.diaSemana) {
      throw new Error('Data não corresponde ao dia da semana da agenda');
    }

    // Gerar slots de horário
    const [horaInicio, minutoInicio] = agenda.horaInicio.split(':').map(Number);
    const [horaFim, minutoFim] = agenda.horaFim.split(':').map(Number);

    const inicioMinutos = horaInicio * 60 + minutoInicio;
    const fimMinutos = horaFim * 60 + minutoFim;

    const horarios: { hora: string; disponivel: boolean }[] = [];
    const consultasAgendadas = agenda.consultas.map((c) => c.dataHora.toISOString());

    for (
      let minutos = inicioMinutos;
      minutos < fimMinutos;
      minutos += agenda.tempoPorConsulta
    ) {
      const hora = Math.floor(minutos / 60);
      const minuto = minutos % 60;
      const horarioStr = `${hora.toString().padStart(2, '0')}:${minuto
        .toString()
        .padStart(2, '0')}`;

      const dataHora = new Date(data);
      dataHora.setHours(hora, minuto, 0, 0);

      const disponivel = !consultasAgendadas.includes(dataHora.toISOString());

      horarios.push({
        hora: horarioStr,
        disponivel,
      });
    }

    return horarios;
  }

  /**
   * Agendar consulta
   */
  async agendarConsulta(data: AgendarConsultaDTO) {
    // Verificar se o horário está disponível
    const consultaExistente = await prisma.consultaAgendada.findFirst({
      where: {
        agendaId: data.agendaId,
        dataHora: data.dataHora,
        status: {
          in: ['AGENDADA', 'CONFIRMADA'],
        },
      },
    });

    if (consultaExistente) {
      throw new Error('Horário já está ocupado');
    }

    // Verificar se a agenda existe e está ativa
    const agenda = await prisma.agendaMedica.findUnique({
      where: { id: data.agendaId },
    });

    if (!agenda || !agenda.isActive) {
      throw new Error('Agenda não encontrada ou inativa');
    }

    // Verificar se o dia da semana corresponde
    if (data.dataHora.getDay() !== agenda.diaSemana) {
      throw new Error('Data não corresponde ao dia da semana da agenda');
    }

    // Verificar se o cidadão já tem consulta no mesmo dia
    const consultaMesmoDia = await prisma.consultaAgendada.findFirst({
      where: {
        citizenId: data.citizenId,
        dataHora: {
          gte: new Date(data.dataHora.setHours(0, 0, 0, 0)),
          lt: new Date(data.dataHora.setHours(23, 59, 59, 999)),
        },
        status: {
          in: ['AGENDADA', 'CONFIRMADA'],
        },
      },
    });

    if (consultaMesmoDia) {
      throw new Error('Cidadão já possui consulta agendada neste dia');
    }

    return await prisma.consultaAgendada.create({
      data: {
        agendaId: data.agendaId,
        citizenId: data.citizenId,
        dataHora: data.dataHora,
        motivoConsulta: data.motivoConsulta,
        observacoes: data.observacoes,
        status: 'AGENDADA',
      },
    });
  }

  /**
   * Confirmar consulta
   */
  async confirmarConsulta(id: string) {
    const consulta = await prisma.consultaAgendada.findUnique({
      where: { id },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    if (consulta.status !== 'AGENDADA') {
      throw new Error(`Consulta não pode ser confirmada. Status atual: ${consulta.status}`);
    }

    return await prisma.consultaAgendada.update({
      where: { id },
      data: { status: 'CONFIRMADA' },
    });
  }

  /**
   * Cancelar consulta
   */
  async cancelarConsulta(id: string, data: CancelarConsultaDTO) {
    const consulta = await prisma.consultaAgendada.findUnique({
      where: { id },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    if (consulta.status === 'REALIZADA') {
      throw new Error('Não é possível cancelar uma consulta já realizada');
    }

    if (consulta.status === 'CANCELADA') {
      throw new Error('Consulta já está cancelada');
    }

    return await prisma.consultaAgendada.update({
      where: { id },
      data: {
        status: 'CANCELADA',
        canceladoPor: data.canceladoPor,
        motivoCancelamento: data.motivoCancelamento,
      },
    });
  }

  /**
   * Marcar consulta como realizada
   */
  async marcarRealizada(id: string) {
    const consulta = await prisma.consultaAgendada.findUnique({
      where: { id },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    if (consulta.status === 'CANCELADA') {
      throw new Error('Não é possível marcar como realizada uma consulta cancelada');
    }

    return await prisma.consultaAgendada.update({
      where: { id },
      data: { status: 'REALIZADA' },
    });
  }

  /**
   * Marcar falta
   */
  async marcarFalta(id: string) {
    const consulta = await prisma.consultaAgendada.findUnique({
      where: { id },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    if (consulta.status === 'CANCELADA') {
      throw new Error('Não é possível marcar falta em uma consulta cancelada');
    }

    if (consulta.status === 'REALIZADA') {
      throw new Error('Não é possível marcar falta em uma consulta realizada');
    }

    return await prisma.consultaAgendada.update({
      where: { id },
      data: { status: 'FALTOU' },
    });
  }

  /**
   * Buscar consultas por cidadão
   */
  async findConsultasByCitizen(citizenId: string, incluirHistorico = false) {
    return await prisma.consultaAgendada.findMany({
      where: {
        citizenId,
        ...(incluirHistorico
          ? {}
          : {
              status: {
                in: ['AGENDADA', 'CONFIRMADA'],
              },
            }),
      },
      include: {
        agenda: true,
      },
      orderBy: { dataHora: 'desc' },
    });
  }

  /**
   * Buscar consultas do dia
   */
  async getConsultasDoDia(agendaId: string, data: Date) {
    return await prisma.consultaAgendada.findMany({
      where: {
        agendaId,
        dataHora: {
          gte: new Date(data.setHours(0, 0, 0, 0)),
          lt: new Date(data.setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { dataHora: 'asc' },
    });
  }

  /**
   * Relatório de taxa de ocupação
   */
  async getRelatorioOcupacao(
    profissionalId: string,
    dataInicio: Date,
    dataFim: Date
  ) {
    const agendas = await prisma.agendaMedica.findMany({
      where: {
        profissionalId,
        isActive: true,
      },
      include: {
        consultas: {
          where: {
            dataHora: {
              gte: dataInicio,
              lte: dataFim,
            },
          },
        },
      },
    });

    const relatorio = agendas.map((agenda) => {
      const total = agenda.consultas.length;
      const realizadas = agenda.consultas.filter((c) => c.status === 'REALIZADA').length;
      const canceladas = agenda.consultas.filter((c) => c.status === 'CANCELADA').length;
      const faltas = agenda.consultas.filter((c) => c.status === 'FALTOU').length;

      return {
        agendaId: agenda.id,
        diaSemana: agenda.diaSemana,
        horaInicio: agenda.horaInicio,
        horaFim: agenda.horaFim,
        totalConsultas: total,
        consultasRealizadas: realizadas,
        consultasCanceladas: canceladas,
        faltas,
        taxaOcupacao: total > 0 ? ((realizadas / total) * 100).toFixed(2) : '0',
        taxaAbsenteismo: total > 0 ? ((faltas / total) * 100).toFixed(2) : '0',
      };
    });

    return relatorio;
  }
}

export default new AgendaMedicaService();
