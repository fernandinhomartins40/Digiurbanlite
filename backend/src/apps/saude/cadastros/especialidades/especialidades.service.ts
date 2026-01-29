import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { CreateEspecialidadeMedicaDto, UpdateEspecialidadeMedicaDto } from './especialidades.dto.js';

@Injectable()
export class EspecialidadesMedicasService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEspecialidadeMedicaDto) {
    return this.prisma.especialidadeMedica.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        area: data.area,
        tempoMedioConsulta: data.tempoMedioConsulta,
        cor: data.cor,
        requisitosPaciente: data.requisitosPaciente,
        examesComuns: data.examesComuns,
        unidadesQueOferecem: data.unidadesQueOferecem,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async findAll(filters?: { area?: string; isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.area) {
      where.area = filters.area;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
        { area: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.especialidadeMedica.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { area: 'asc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string) {
    const especialidade = await this.prisma.especialidadeMedica.findUnique({
      where: { id },
      include: {
        agendas: {
          where: { isActive: true },
          take: 10,
          orderBy: { diaSemana: 'asc' },
        },
        solicitacoesTFD: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!especialidade) {
      throw new Error('Especialidade Médica não encontrada');
    }

    return especialidade;
  }

  async update(id: string, data: UpdateEspecialidadeMedicaDto) {
    // Verificar se existe
    await this.findOne(id);

    return this.prisma.especialidadeMedica.update({
      where: { id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.area !== undefined && { area: data.area }),
        ...(data.tempoMedioConsulta !== undefined && { tempoMedioConsulta: data.tempoMedioConsulta }),
        ...(data.cor !== undefined && { cor: data.cor }),
        ...(data.requisitosPaciente !== undefined && { requisitosPaciente: data.requisitosPaciente }),
        ...(data.examesComuns !== undefined && { examesComuns: data.examesComuns }),
        ...(data.unidadesQueOferecem !== undefined && { unidadesQueOferecem: data.unidadesQueOferecem }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async remove(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Soft delete - apenas marcar como inativa
    return this.prisma.especialidadeMedica.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Hard delete - deletar permanentemente
    return this.prisma.especialidadeMedica.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, ativas, porArea] = await Promise.all([
      this.prisma.especialidadeMedica.count(),
      this.prisma.especialidadeMedica.count({ where: { isActive: true } }),
      this.prisma.especialidadeMedica.groupBy({
        by: ['area'],
        _count: true,
        where: { isActive: true },
      }),
    ]);

    return {
      total,
      ativas,
      inativas: total - ativas,
      porArea,
    };
  }
}
