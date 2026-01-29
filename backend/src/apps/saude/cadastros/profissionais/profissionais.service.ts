import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { CreateProfissionalSaudeDto, UpdateProfissionalSaudeDto } from './profissionais.dto.js';

@Injectable()
export class ProfissionaisSaudeService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProfissionalSaudeDto) {
    return this.prisma.profissionalSaude.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        rg: data.rg,
        registroProfissional: data.registroProfissional,
        tipoRegistro: data.tipoRegistro,
        especialidade: data.especialidade,
        especialidades: data.especialidades || [],
        categoria: data.categoria,
        unidadesAtendimento: data.unidadesAtendimento || [],
        telefone: data.telefone,
        email: data.email,
        horarioAtendimento: data.horarioAtendimento,
        diasSemana: data.diasSemana || [],
        tempoMedioConsulta: data.tempoMedioConsulta,
        aceitaAgendamento: data.aceitaAgendamento !== undefined ? data.aceitaAgendamento : true,
        status: data.status || 'ATIVO',
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async findAll(filters?: {
    categoria?: string;
    status?: string;
    especialidade?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.categoria) {
      where.categoria = filters.categoria;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.especialidade) {
      where.especialidade = filters.especialidade;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { cpf: { contains: filters.search, mode: 'insensitive' } },
        { registroProfissional: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.profissionalSaude.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { status: 'asc' }, { nome: 'asc' }],
    });
  }

  async findOne(id: string) {
    const profissional = await this.prisma.profissionalSaude.findUnique({
      where: { id },
      include: {
        indisponibilidades: {
          where: { ativo: true },
          orderBy: { dataInicio: 'asc' },
        },
        imunizacoes: {
          orderBy: { dataAplicacao: 'desc' },
          take: 10,
        },
      },
    });

    if (!profissional) {
      throw new Error('Profissional de Saúde não encontrado');
    }

    return profissional;
  }

  async update(id: string, data: UpdateProfissionalSaudeDto) {
    // Verificar se existe
    await this.findOne(id);

    return this.prisma.profissionalSaude.update({
      where: { id },
      data: {
        ...(data.nome && { nome: data.nome }),
        ...(data.cpf && { cpf: data.cpf }),
        ...(data.rg !== undefined && { rg: data.rg }),
        ...(data.registroProfissional && { registroProfissional: data.registroProfissional }),
        ...(data.tipoRegistro !== undefined && { tipoRegistro: data.tipoRegistro }),
        ...(data.especialidade !== undefined && { especialidade: data.especialidade }),
        ...(data.especialidades !== undefined && { especialidades: data.especialidades }),
        ...(data.categoria && { categoria: data.categoria }),
        ...(data.unidadesAtendimento !== undefined && { unidadesAtendimento: data.unidadesAtendimento }),
        ...(data.telefone !== undefined && { telefone: data.telefone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.horarioAtendimento !== undefined && { horarioAtendimento: data.horarioAtendimento }),
        ...(data.diasSemana !== undefined && { diasSemana: data.diasSemana }),
        ...(data.tempoMedioConsulta !== undefined && { tempoMedioConsulta: data.tempoMedioConsulta }),
        ...(data.aceitaAgendamento !== undefined && { aceitaAgendamento: data.aceitaAgendamento }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async remove(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Soft delete - apenas marcar como inativo
    return this.prisma.profissionalSaude.update({
      where: { id },
      data: { isActive: false, status: 'INATIVO' },
    });
  }

  async hardDelete(id: string) {
    // Verificar se existe
    await this.findOne(id);

    // Hard delete - deletar permanentemente
    return this.prisma.profissionalSaude.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, ativos, porCategoria, porStatus] = await Promise.all([
      this.prisma.profissionalSaude.count(),
      this.prisma.profissionalSaude.count({ where: { isActive: true } }),
      this.prisma.profissionalSaude.groupBy({
        by: ['categoria'],
        _count: true,
        where: { isActive: true },
      }),
      this.prisma.profissionalSaude.groupBy({
        by: ['status'],
        _count: true,
        where: { isActive: true },
      }),
    ]);

    return {
      total,
      ativos,
      inativos: total - ativos,
      porCategoria,
      porStatus,
    };
  }
}
