import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { CreateTurnoTrabalhoDto, UpdateTurnoTrabalhoDto } from './turnos.dto.js';

@Injectable()
export class TurnosTrabalhoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTurnoTrabalhoDto) {
    return this.prisma.turnoTrabalho.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        diasSemana: data.diasSemana,
        cor: data.cor,
        ativo: data.ativo !== undefined ? data.ativo : true,
      },
    });
  }

  async findAll(filters?: { ativo?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.ativo !== undefined) {
      where.ativo = filters.ativo;
    }

    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.turnoTrabalho.findMany({
      where,
      orderBy: [{ ativo: 'desc' }, { horaInicio: 'asc' }],
    });
  }

  async findOne(id: string) {
    const turno = await this.prisma.turnoTrabalho.findUnique({
      where: { id },
      include: {
        agendas: {
          where: { isActive: true },
          take: 10,
          orderBy: { diaSemana: 'asc' },
        },
      },
    });

    if (!turno) {
      throw new Error('Turno de Trabalho não encontrado');
    }

    return turno;
  }

  async update(id: string, data: UpdateTurnoTrabalhoDto) {
    // Verificar se existe
    await this.findOne(id);

    return this.prisma.turnoTrabalho.update({
      where: { id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.horaInicio && { horaInicio: data.horaInicio }),
        ...(data.horaFim && { horaFim: data.horaFim }),
        ...(data.diasSemana !== undefined && { diasSemana: data.diasSemana }),
        ...(data.cor !== undefined && { cor: data.cor }),
        ...(data.ativo !== undefined && { ativo: data.ativo }),
      },
    });
  }

  async remove(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Soft delete - apenas marcar como inativo
    return this.prisma.turnoTrabalho.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async hardDelete(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Hard delete - deletar permanentemente
    return this.prisma.turnoTrabalho.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, ativos] = await Promise.all([
      this.prisma.turnoTrabalho.count(),
      this.prisma.turnoTrabalho.count({ where: { ativo: true } }),
    ]);

    return {
      total,
      ativos,
      inativos: total - ativos,
    };
  }
}
