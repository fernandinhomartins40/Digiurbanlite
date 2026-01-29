import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { CreateUnidadeSaudeDto, UpdateUnidadeSaudeDto } from './unidades.dto.js';

@Injectable()
export class UnidadesSaudeService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUnidadeSaudeDto) {
    return this.prisma.unidadeSaude.create({
      data: {
        nome: data.nome,
        tipo: data.tipo,
        cnes: data.cnes,
        cnpj: data.cnpj,
        endereco: data.endereco,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        telefone: data.telefone,
        email: data.email,
        horario: data.horario,
        horarioAbertura: data.horarioAbertura,
        horarioFechamento: data.horarioFechamento,
        especialidades: data.especialidades || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async findAll(filters?: { tipo?: string; isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { endereco: { contains: filters.search, mode: 'insensitive' } },
        { bairro: { contains: filters.search, mode: 'insensitive' } },
        { cnes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.unidadeSaude.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string) {
    const unidade = await this.prisma.unidadeSaude.findUnique({
      where: { id },
      include: {
        salas: {
          where: { ativa: true },
          orderBy: { nome: 'asc' },
        },
        configuracao: true,
      },
    });

    if (!unidade) {
      throw new Error('Unidade de Saúde não encontrada');
    }

    return unidade;
  }

  async update(id: string, data: UpdateUnidadeSaudeDto) {
    // Verificar se existe
    await this.findOne(id);

    return this.prisma.unidadeSaude.update({
      where: { id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.cnes !== undefined && { cnes: data.cnes }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.endereco !== undefined && { endereco: data.endereco }),
        ...(data.bairro !== undefined && { bairro: data.bairro }),
        ...(data.cidade !== undefined && { cidade: data.cidade }),
        ...(data.estado !== undefined && { estado: data.estado }),
        ...(data.cep !== undefined && { cep: data.cep }),
        ...(data.telefone !== undefined && { telefone: data.telefone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.horario !== undefined && { horario: data.horario }),
        ...(data.horarioAbertura !== undefined && { horarioAbertura: data.horarioAbertura }),
        ...(data.horarioFechamento !== undefined && { horarioFechamento: data.horarioFechamento }),
        ...(data.especialidades !== undefined && { especialidades: data.especialidades }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async remove(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Soft delete - apenas marcar como inativa
    return this.prisma.unidadeSaude.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Hard delete - deletar permanentemente
    return this.prisma.unidadeSaude.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, ativas, porTipo] = await Promise.all([
      this.prisma.unidadeSaude.count(),
      this.prisma.unidadeSaude.count({ where: { isActive: true } }),
      this.prisma.unidadeSaude.groupBy({
        by: ['tipo'],
        _count: true,
        where: { isActive: true },
      }),
    ]);

    return {
      total,
      ativas,
      inativas: total - ativas,
      porTipo,
    };
  }
}
