// ============================================================================
// SERVICE - PRESCRIÇÕES MÉDICAS
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreatePrescricaoDTO,
  UpdatePrescricaoDTO,
  CreateItemPrescricaoDTO,
  UpdateItemPrescricaoDTO,
  PrescricaoCompletoResponse,
} from '../../types/saude-atendimento.types';

const prisma = new PrismaClient();

export class PrescricaoService {
  /**
   * Criar prescrição médica
   */
  async criarPrescricao(data: CreatePrescricaoDTO): Promise<PrescricaoCompletoResponse> {
    // Verificar se o atendimento existe e obter a consulta médica
    const atendimento = await prisma.atendimentoMedico.findUnique({
      where: { id: data.atendimentoId },
      include: {
        consulta: true,
      },
    });

    if (!atendimento) {
      throw new Error('Atendimento não encontrado');
    }

    if (!atendimento.consultaId || !atendimento.consulta) {
      throw new Error('Atendimento sem consulta médica registrada');
    }

    // Calcular data de validade
    const dataEmissao = new Date();
    const validade = new Date();
    validade.setDate(validade.getDate() + 30); // 30 dias de validade padrão

    // Preparar medicamentos como JSON
    const medicamentos = data.itens.map((item) => ({
      medicamentoId: item.medicamentoId,
      quantidade: item.quantidade,
      posologia: item.posologia,
      duracao: item.duracao,
      observacoes: item.observacoes,
    }));

    // Criar prescrição
    const prescricao = await prisma.prescricao.create({
      data: {
        consultaId: atendimento.consultaId,
        medicamentos: medicamentos as any,
        observacoes: data.observacoes,
        validade,
        dispensada: false,
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });

    return prescricao as any;
  }

  /**
   * Adicionar item à prescrição
   * Nota: No schema, medicamentos é um campo JSON, não uma relação
   */
  async adicionarItem(prescricaoId: string, data: CreateItemPrescricaoDTO) {
    const prescricao = await prisma.prescricao.findUnique({
      where: { id: prescricaoId },
    });

    if (!prescricao) {
      throw new Error('Prescrição não encontrada');
    }

    const medicamentosAtuais = (prescricao.medicamentos as any[]) || [];
    medicamentosAtuais.push({
      medicamentoId: data.medicamentoId,
      quantidade: data.quantidade,
      posologia: data.posologia,
      duracao: data.duracao,
      observacoes: data.observacoes,
    });

    return await prisma.prescricao.update({
      where: { id: prescricaoId },
      data: {
        medicamentos: medicamentosAtuais as any,
      },
    });
  }

  /**
   * Atualizar item da prescrição
   * Nota: No schema, medicamentos é um campo JSON, não uma relação
   */
  async atualizarItem(itemId: string, data: UpdateItemPrescricaoDTO) {
    // Esta funcionalidade precisa ser adaptada para trabalhar com JSON
    throw new Error('Método não implementado para campo JSON. Use atualizarPrescricao para modificar medicamentos.');
  }

  /**
   * Remover item da prescrição
   * Nota: No schema, medicamentos é um campo JSON, não uma relação
   */
  async removerItem(itemId: string) {
    // Esta funcionalidade precisa ser adaptada para trabalhar com JSON
    throw new Error('Método não implementado para campo JSON. Use atualizarPrescricao para modificar medicamentos.');
  }

  /**
   * Atualizar prescrição
   */
  async atualizarPrescricao(id: string, data: UpdatePrescricaoDTO) {
    const updateData: any = {};

    if (data.status === 'DISPENSADA') {
      updateData.dispensada = true;
    } else if (data.status === 'CANCELADA') {
      updateData.observacoes = data.observacoes || 'Prescrição cancelada';
    }

    if (data.observacoes !== undefined) {
      updateData.observacoes = data.observacoes;
    }

    return await prisma.prescricao.update({
      where: { id },
      data: updateData,
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });
  }

  /**
   * Buscar prescrição completa
   */
  async buscarPrescricao(id: string): Promise<PrescricaoCompletoResponse> {
    const prescricao = await prisma.prescricao.findUnique({
      where: { id },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
    });

    if (!prescricao) {
      throw new Error('Prescrição não encontrada');
    }

    return prescricao as any;
  }

  /**
   * Listar prescrições de um cidadão
   */
  async listarPrescricoesCidadao(citizenId: string, filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    profissionalId?: string;
  }) {
    return await prisma.prescricao.findMany({
      where: {
        consulta: {
          atendimento: {
            citizenId,
          },
        },
        ...(filtros?.dataInicio && {
          dataHora: { gte: filtros.dataInicio },
        }),
        ...(filtros?.dataFim && {
          dataHora: { lte: filtros.dataFim },
        }),
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
      orderBy: {
        dataHora: 'desc',
      },
    });
  }

  /**
   * Listar prescrições de um atendimento
   */
  async listarPrescricoesAtendimento(atendimentoId: string) {
    return await prisma.prescricao.findMany({
      where: {
        consulta: {
          atendimentoId: atendimentoId,
        },
      },
      include: {
        consulta: {
          include: {
            atendimento: true,
          },
        },
      },
      orderBy: {
        dataHora: 'desc',
      },
    });
  }

  /**
   * Verificar validade da receita
   */
  async verificarValidade(prescricaoId: string): Promise<{
    valida: boolean;
    diasRestantes: number;
    dataExpiracao: Date;
  }> {
    const prescricao = await prisma.prescricao.findUnique({
      where: { id: prescricaoId },
      select: {
        dataHora: true,
        validade: true,
      },
    });

    if (!prescricao) {
      throw new Error('Prescrição não encontrada');
    }

    const dataExpiracao = prescricao.validade;
    const hoje = new Date();
    const diasRestantes = Math.ceil((dataExpiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    return {
      valida: diasRestantes > 0,
      diasRestantes: Math.max(0, diasRestantes),
      dataExpiracao,
    };
  }

  /**
   * Buscar medicamentos disponíveis para prescrição
   */
  async buscarMedicamentosDisponiveis(filtros?: {
    nome?: string;
    principioAtivo?: string;
    unidadeId?: string;
  }) {
    return await prisma.medicamento.findMany({
      where: {
        ...(filtros?.nome && {
          nome: {
            contains: filtros.nome,
            mode: 'insensitive',
          },
        }),
        ...(filtros?.principioAtivo && {
          principioAtivo: {
            contains: filtros.principioAtivo,
            mode: 'insensitive',
          },
        }),
      },
      select: {
        id: true,
        nome: true,
        principioAtivo: true,
        concentracao: true,
        apresentacao: true,
        isControlado: true,
        ...(filtros?.unidadeId && {
          lotes: {
            where: {
              unidadeId: filtros.unidadeId,
              quantidade: {
                gt: 0,
              },
              dataValidade: {
                gte: new Date(),
              },
            },
            select: {
              quantidade: true,
            },
          },
        }),
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  /**
   * Obter estatísticas de prescrições
   */
  async obterEstatisticas(filtros: {
    unidadeId?: string;
    profissionalId?: string;
    dataInicio: Date;
    dataFim: Date;
  }) {
    const prescricoes = await prisma.prescricao.findMany({
      where: {
        dataHora: {
          gte: filtros.dataInicio,
          lte: filtros.dataFim,
        },
        ...(filtros.unidadeId && {
          consulta: {
            atendimento: {
              unidadeId: filtros.unidadeId,
            },
          },
        }),
      },
    });

    const totalPrescricoes = prescricoes.length;

    // Contar total de medicamentos prescritos
    let totalMedicamentos = 0;
    const medicamentosCount: Record<string, number> = {};

    prescricoes.forEach((p) => {
      const meds = (p.medicamentos as any[]) || [];
      totalMedicamentos += meds.length;

      meds.forEach((med) => {
        const key = med.medicamentoId;
        medicamentosCount[key] = (medicamentosCount[key] || 0) + 1;
      });
    });

    // Taxa de dispensação
    const dispensadas = prescricoes.filter((p) => p.dispensada).length;
    const taxaDispensacao = totalPrescricoes > 0 ? (dispensadas / totalPrescricoes) * 100 : 0;

    return {
      totalPrescricoes,
      totalItens: totalMedicamentos,
      mediaItensPorPrescricao: totalPrescricoes > 0 ? totalMedicamentos / totalPrescricoes : 0,
      taxaDispensacao,
      itensDispensados: dispensadas,
      itensPendentes: totalPrescricoes - dispensadas,
    };
  }

  /**
   * Cancelar prescrição
   */
  async cancelarPrescricao(id: string, motivo: string) {
    return await prisma.prescricao.update({
      where: { id },
      data: {
        observacoes: `CANCELADA: ${motivo}`,
      },
    });
  }
}

export default new PrescricaoService();
