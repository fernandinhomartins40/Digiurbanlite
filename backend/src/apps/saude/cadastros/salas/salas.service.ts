import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { CreateSalaConsultorioDto, UpdateSalaConsultorioDto } from './salas.dto.js';

@Injectable()
export class SalasConsultoriosService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSalaConsultorioDto) {
    return this.prisma.salaConsultorio.create({
      data: {
        nome: data.nome,
        numero: data.numero,
        tipo: data.tipo,
        unidadeId: data.unidadeId,
        andar: data.andar,
        capacidade: data.capacidade,
        equipamentos: data.equipamentos,
        observacoes: data.observacoes,
        ativa: data.ativa !== undefined ? data.ativa : true,
      },
    });
  }

  async findAll(filters?: { unidadeId?: string; tipo?: string; ativa?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.unidadeId) {
      where.unidadeId = filters.unidadeId;
    }

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters?.ativa !== undefined) {
      where.ativa = filters.ativa;
    }

    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { numero: { contains: filters.search, mode: 'insensitive' } },
        { andar: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.salaConsultorio.findMany({
      where,
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
      },
      orderBy: [{ ativa: 'desc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string) {
    const sala = await this.prisma.salaConsultorio.findUnique({
      where: { id },
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            endereco: true,
          },
        },
        agendas: {
          where: { isActive: true },
          take: 10,
          orderBy: { diaSemana: 'asc' },
        },
      },
    });

    if (!sala) {
      throw new Error('Sala/Consultório não encontrada');
    }

    return sala;
  }

  async update(id: string, data: UpdateSalaConsultorioDto) {
    // Verificar se existe
    await this.findOne(id);

    return this.prisma.salaConsultorio.update({
      where: { id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.numero !== undefined && { numero: data.numero }),
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.unidadeId && { unidadeId: data.unidadeId }),
        ...(data.andar !== undefined && { andar: data.andar }),
        ...(data.capacidade !== undefined && { capacidade: data.capacidade }),
        ...(data.equipamentos !== undefined && { equipamentos: data.equipamentos }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
        ...(data.ativa !== undefined && { ativa: data.ativa }),
      },
    });
  }

  async remove(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Soft delete - apenas marcar como inativa
    return this.prisma.salaConsultorio.update({
      where: { id },
      data: { ativa: false },
    });
  }

  async hardDelete(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Hard delete - deletar permanentemente
    return this.prisma.salaConsultorio.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, ativas, porTipo, porUnidade] = await Promise.all([
      this.prisma.salaConsultorio.count(),
      this.prisma.salaConsultorio.count({ where: { ativa: true } }),
      this.prisma.salaConsultorio.groupBy({
        by: ['tipo'],
        _count: true,
        where: { ativa: true },
      }),
      this.prisma.salaConsultorio.groupBy({
        by: ['unidadeId'],
        _count: true,
        where: { ativa: true },
      }),
    ]);

    return {
      total,
      ativas,
      inativas: total - ativas,
      porTipo,
      porUnidade: porUnidade.length,
    };
  }
}
