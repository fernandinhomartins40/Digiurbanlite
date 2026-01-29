import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { CreateAgendaMedicaDto, UpdateAgendaMedicaDto } from './agendas.dto.js';

@Injectable()
export class AgendasMedicasService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAgendaMedicaDto) {
    return this.prisma.agendaMedica.create({
      data: {
        profissionalId: data.profissionalId,
        unidadeId: data.unidadeId,
        especialidadeId: data.especialidadeId,
        salaId: data.salaId,
        turnoId: data.turnoId,
        diaSemana: data.diaSemana,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        tempoPorConsulta: data.tempoPorConsulta,
        vagasDisponiveis: data.vagasDisponiveis,
        dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
        dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async findAll(filters?: {
    profissionalId?: string;
    unidadeId?: string;
    especialidadeId?: string;
    salaId?: string;
    turnoId?: string;
    diaSemana?: number;
    isActive?: boolean;
  }) {
    const where: any = {};

    if (filters?.profissionalId) {
      where.profissionalId = filters.profissionalId;
    }

    if (filters?.unidadeId) {
      where.unidadeId = filters.unidadeId;
    }

    if (filters?.especialidadeId) {
      where.especialidadeId = filters.especialidadeId;
    }

    if (filters?.salaId) {
      where.salaId = filters.salaId;
    }

    if (filters?.turnoId) {
      where.turnoId = filters.turnoId;
    }

    if (filters?.diaSemana !== undefined) {
      where.diaSemana = filters.diaSemana;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.agendaMedica.findMany({
      where,
      include: {
        especialidade: {
          select: {
            id: true,
            nome: true,
            cor: true,
          },
        },
        sala: {
          select: {
            id: true,
            nome: true,
            numero: true,
            tipo: true,
          },
        },
        turno: {
          select: {
            id: true,
            nome: true,
            cor: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async findOne(id: string) {
    const agenda = await this.prisma.agendaMedica.findUnique({
      where: { id },
      include: {
        especialidade: true,
        sala: {
          include: {
            unidade: {
              select: {
                id: true,
                nome: true,
                tipo: true,
              },
            },
          },
        },
        turno: true,
        consultas: {
          take: 20,
          orderBy: { dataConsulta: 'desc' },
        },
        indisponibilidades: {
          where: { ativo: true },
          orderBy: { dataInicio: 'asc' },
        },
      },
    });

    if (!agenda) {
      throw new Error('Agenda Médica não encontrada');
    }

    return agenda;
  }

  async update(id: string, data: UpdateAgendaMedicaDto) {
    // Verificar se existe
    await this.findOne(id);

    return this.prisma.agendaMedica.update({
      where: { id },
      data: {
        ...(data.profissionalId && { profissionalId: data.profissionalId }),
        ...(data.unidadeId && { unidadeId: data.unidadeId }),
        ...(data.especialidadeId !== undefined && { especialidadeId: data.especialidadeId }),
        ...(data.salaId !== undefined && { salaId: data.salaId }),
        ...(data.turnoId !== undefined && { turnoId: data.turnoId }),
        ...(data.diaSemana !== undefined && { diaSemana: data.diaSemana }),
        ...(data.horaInicio && { horaInicio: data.horaInicio }),
        ...(data.horaFim && { horaFim: data.horaFim }),
        ...(data.tempoPorConsulta !== undefined && { tempoPorConsulta: data.tempoPorConsulta }),
        ...(data.vagasDisponiveis !== undefined && { vagasDisponiveis: data.vagasDisponiveis }),
        ...(data.dataInicio !== undefined && { dataInicio: data.dataInicio ? new Date(data.dataInicio) : null }),
        ...(data.dataFim !== undefined && { dataFim: data.dataFim ? new Date(data.dataFim) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async remove(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Soft delete - apenas marcar como inativa
    return this.prisma.agendaMedica.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Hard delete - deletar permanentemente
    return this.prisma.agendaMedica.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, ativas, porDiaSemana, porUnidade] = await Promise.all([
      this.prisma.agendaMedica.count(),
      this.prisma.agendaMedica.count({ where: { isActive: true } }),
      this.prisma.agendaMedica.groupBy({
        by: ['diaSemana'],
        _count: true,
        where: { isActive: true },
      }),
      this.prisma.agendaMedica.groupBy({
        by: ['unidadeId'],
        _count: true,
        where: { isActive: true },
      }),
    ]);

    return {
      total,
      ativas,
      inativas: total - ativas,
      porDiaSemana,
      porUnidade: porUnidade.length,
    };
  }
}
