// ============================================================================
// SERVICE - PRONTUÁRIO ELETRÔNICO
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateAlergiaCidadaoDTO,
  UpdateAlergiaCidadaoDTO,
  CreateComorbidadeCidadaoDTO,
  UpdateComorbidadeCidadaoDTO,
  CreateAnexoProntuarioDTO,
  UpdateAnexoProntuarioDTO,
  CreateImunizacaoCidadaoDTO,
  UpdateImunizacaoCidadaoDTO,
  ProntuarioCompletoResponse,
} from '../../types/saude-atendimento.types';

const prisma = new PrismaClient();

export class ProntuarioService {
  /**
   * Obter prontuário completo do cidadão
   */
  async obterProntuarioCompleto(citizenId: string): Promise<ProntuarioCompletoResponse> {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        id: true,
        name: true,
        cpf: true,
        birthDate: true,
      },
    });

    if (!citizen) {
      throw new Error('Cidadão não encontrado');
    }

    // Buscar alergias
    const alergias = await prisma.alergiasCidadao.findMany({
      where: { citizenId },
      orderBy: { dataRegistro: 'desc' },
    });

    // Buscar comorbidades
    const comorbidades = await prisma.comorbidadesCidadao.findMany({
      where: { citizenId },
      orderBy: { dataRegistro: 'desc' },
    });

    // Buscar imunizações
    const imunizacoes = await prisma.imunizacaoCidadao.findMany({
      where: { citizenId },
      include: {
        unidade: {
          select: { nome: true },
        },
        profissional: {
          select: { nome: true },
        },
      },
      orderBy: { dataAplicacao: 'desc' },
    });

    // Buscar anexos
    const anexos = await prisma.anexoProntuario.findMany({
      where: { citizenId },
      orderBy: { dataUpload: 'desc' },
    });

    // Buscar histórico de atendimentos
    const historico = await prisma.atendimentoMedico.findMany({
      where: { citizenId },
      include: {
        consulta: {
          select: {
            diagnosticosSecund: true,
          },
        },
      },
      orderBy: { dataAtendimento: 'desc' },
      take: 50,
    });

    return {
      citizen: {
        id: citizen.id,
        name: citizen.name,
        cpf: citizen.cpf,
        birthDate: citizen.birthDate || undefined,
      },
      alergias: alergias.map((a) => ({
        id: a.id,
        alergia: a.alergia,
        gravidade: a.gravidade as any,
        observacoes: a.observacoes || undefined,
        dataRegistro: a.dataRegistro,
      })),
      comorbidades: comorbidades.map((c) => ({
        id: c.id,
        cid10: c.cid10,
        descricao: c.descricao,
        dataInicio: c.dataInicio || undefined,
        dataFim: c.dataFim || undefined,
        ativo: c.ativo,
        observacoes: c.observacoes || undefined,
      })),
      imunizacoes: imunizacoes.map((i) => ({
        id: i.id,
        vacina: i.vacina,
        dose: i.dose,
        lote: i.lote || undefined,
        dataAplicacao: i.dataAplicacao,
        unidade: i.unidade?.nome,
        profissional: i.profissional?.nome,
      })),
      anexos: anexos.map((a) => ({
        id: a.id,
        tipoDocumento: a.tipoDocumento as any,
        nomeArquivo: a.nomeArquivo,
        descricao: a.descricao || undefined,
        dataUpload: a.dataUpload,
      })),
      historico: historico.map((h) => ({
        id: h.id,
        dataAtendimento: h.dataAtendimento,
        tipo: h.tipo,
        unidade: h.unidadeId,
        profissional: h.profissionalId || undefined,
        diagnostico: (h.consulta?.diagnosticosSecund as any)?.principal?.descricao || undefined,
      })),
    };
  }

  // ============================================================================
  // ALERGIAS
  // ============================================================================

  async criarAlergia(data: CreateAlergiaCidadaoDTO) {
    return await prisma.alergiasCidadao.create({
      data,
    });
  }

  async atualizarAlergia(id: string, data: UpdateAlergiaCidadaoDTO) {
    return await prisma.alergiasCidadao.update({
      where: { id },
      data,
    });
  }

  async excluirAlergia(id: string) {
    return await prisma.alergiasCidadao.delete({
      where: { id },
    });
  }

  async listarAlergias(citizenId: string) {
    return await prisma.alergiasCidadao.findMany({
      where: { citizenId },
      include: {
        usuario: {
          select: { name: true },
        },
      },
      orderBy: { dataRegistro: 'desc' },
    });
  }

  // ============================================================================
  // COMORBIDADES
  // ============================================================================

  async criarComorbidade(data: CreateComorbidadeCidadaoDTO) {
    return await prisma.comorbidadesCidadao.create({
      data,
    });
  }

  async atualizarComorbidade(id: string, data: UpdateComorbidadeCidadaoDTO) {
    return await prisma.comorbidadesCidadao.update({
      where: { id },
      data,
    });
  }

  async excluirComorbidade(id: string) {
    return await prisma.comorbidadesCidadao.delete({
      where: { id },
    });
  }

  async listarComorbidades(citizenId: string, apenasAtivas: boolean = true) {
    return await prisma.comorbidadesCidadao.findMany({
      where: {
        citizenId,
        ...(apenasAtivas && { ativo: true }),
      },
      include: {
        usuario: {
          select: { name: true },
        },
      },
      orderBy: { dataRegistro: 'desc' },
    });
  }

  // ============================================================================
  // ANEXOS
  // ============================================================================

  async criarAnexo(data: CreateAnexoProntuarioDTO) {
    return await prisma.anexoProntuario.create({
      data,
    });
  }

  async atualizarAnexo(id: string, data: UpdateAnexoProntuarioDTO) {
    return await prisma.anexoProntuario.update({
      where: { id },
      data,
    });
  }

  async excluirAnexo(id: string) {
    return await prisma.anexoProntuario.delete({
      where: { id },
    });
  }

  async listarAnexos(citizenId: string, atendimentoId?: string) {
    return await prisma.anexoProntuario.findMany({
      where: {
        citizenId,
        ...(atendimentoId && { atendimentoId }),
      },
      include: {
        usuario: {
          select: { name: true },
        },
        atendimento: {
          select: {
            dataAtendimento: true,
            tipo: true,
          },
        },
      },
      orderBy: { dataUpload: 'desc' },
    });
  }

  // ============================================================================
  // IMUNIZAÇÕES
  // ============================================================================

  async criarImunizacao(data: CreateImunizacaoCidadaoDTO) {
    return await prisma.imunizacaoCidadao.create({
      data,
    });
  }

  async atualizarImunizacao(id: string, data: UpdateImunizacaoCidadaoDTO) {
    return await prisma.imunizacaoCidadao.update({
      where: { id },
      data,
    });
  }

  async excluirImunizacao(id: string) {
    return await prisma.imunizacaoCidadao.delete({
      where: { id },
    });
  }

  async listarImunizacoes(citizenId: string) {
    return await prisma.imunizacaoCidadao.findMany({
      where: { citizenId },
      include: {
        unidade: {
          select: { nome: true },
        },
        profissional: {
          select: { nome: true },
        },
      },
      orderBy: { dataAplicacao: 'desc' },
    });
  }

  /**
   * Buscar histórico de atendimentos com filtros
   */
  async buscarHistorico(
    citizenId: string,
    filtros?: {
      dataInicio?: Date;
      dataFim?: Date;
      unidadeId?: string;
      profissionalId?: string;
      tipo?: string;
    }
  ) {
    return await prisma.atendimentoMedico.findMany({
      where: {
        citizenId,
        ...(filtros?.dataInicio && {
          dataAtendimento: { gte: filtros.dataInicio },
        }),
        ...(filtros?.dataFim && {
          dataAtendimento: { lte: filtros.dataFim },
        }),
        ...(filtros?.unidadeId && { unidadeId: filtros.unidadeId }),
        ...(filtros?.profissionalId && { profissionalId: filtros.profissionalId }),
        ...(filtros?.tipo && { tipo: filtros.tipo as any }),
      },
      include: {
        triagem: true,
        consulta: true,
      },
      orderBy: { dataAtendimento: 'desc' },
    });
  }

  /**
   * Gerar timeline de eventos do prontuário
   */
  async gerarTimeline(citizenId: string) {
    const eventos: any[] = [];

    // Atendimentos
    const atendimentos = await prisma.atendimentoMedico.findMany({
      where: { citizenId },
      orderBy: { dataAtendimento: 'desc' },
      take: 50,
    });

    eventos.push(
      ...atendimentos.map((a) => ({
        tipo: 'ATENDIMENTO',
        data: a.dataAtendimento,
        descricao: `Atendimento - ${a.tipo}`,
        id: a.id,
      }))
    );

    // Prescrições
    const prescricoes = await prisma.prescricao.findMany({
      where: {
        consulta: {
          atendimento: {
            citizenId,
          },
        },
      },
      include: {
        consulta: {
          include: {
            atendimento: {
              select: { dataAtendimento: true },
            },
          },
        },
      },
      orderBy: { dataHora: 'desc' },
      take: 50,
    });

    eventos.push(
      ...prescricoes.map((p) => ({
        tipo: 'PRESCRICAO',
        data: p.dataHora,
        descricao: 'Prescrição médica',
        id: p.id,
      }))
    );

    // Exames
    const exames = await prisma.exameSolicitado.findMany({
      where: {
        consulta: {
          atendimento: {
            citizenId,
          },
        },
      },
      include: {
        consulta: {
          include: {
            atendimento: {
              select: { dataAtendimento: true },
            },
          },
        },
      },
      orderBy: { dataHora: 'desc' },
      take: 50,
    });

    eventos.push(
      ...exames.map((e) => ({
        tipo: 'EXAME',
        data: e.dataHora,
        descricao: `Exame solicitado - ${e.tipoExame}`,
        id: e.id,
      }))
    );

    // Imunizações
    const imunizacoes = await prisma.imunizacaoCidadao.findMany({
      where: { citizenId },
      orderBy: { dataAplicacao: 'desc' },
      take: 50,
    });

    eventos.push(
      ...imunizacoes.map((i) => ({
        tipo: 'IMUNIZACAO',
        data: i.dataAplicacao,
        descricao: `${i.vacina} - ${i.dose}`,
        id: i.id,
      }))
    );

    // Ordenar eventos por data decrescente
    return eventos.sort((a, b) => b.data.getTime() - a.data.getTime());
  }
}

export default new ProntuarioService();
