// ============================================================================
// SERVICE - FILA DE ATENDIMENTO
// ============================================================================

import { PrismaClient } from '@prisma/client';
import {
  CreateFilaAtendimentoDTO,
  UpdateFilaAtendimentoDTO,
  ChamarPacienteDTO,
  FilaStatus,
  FilaAtendimentoResponse,
} from '../../types/saude-atendimento.types';

const prisma = new PrismaClient();

export class FilaService {
  /**
   * Realizar check-in do paciente (entrada na fila)
   */
  async realizarCheckIn(data: CreateFilaAtendimentoDTO): Promise<FilaAtendimentoResponse> {
    // Verificar se a consulta existe
    const consulta = await prisma.consultaAgendada.findUnique({
      where: { id: data.consultaId },
      include: {
        agenda: true,
      },
    });

    if (!consulta) {
      throw new Error('Consulta não encontrada');
    }

    // Verificar se já existe entrada na fila para esta consulta
    const filaExistente = await prisma.filaAtendimento.findFirst({
      where: { consultaId: data.consultaId },
    });

    if (filaExistente) {
      throw new Error('Paciente já está na fila');
    }

    // Calcular ordem e prioridade
    const ultimaOrdem = await prisma.filaAtendimento.findFirst({
      where: {
        unidadeId: data.unidadeId,
        status: {
          in: [FilaStatus.AGUARDANDO, FilaStatus.CHAMADO],
        },
      },
      orderBy: {
        ordem: 'desc',
      },
    });

    const ordem = (ultimaOrdem?.ordem || 0) + 1;

    // Calcular prioridade (0=Normal, 1=Preferencial, 2=Urgente)
    const prioridade = data.prioridade !== undefined ? data.prioridade : 0;

    // Criar entrada na fila
    const fila = await prisma.filaAtendimento.create({
      data: {
        unidadeId: data.unidadeId,
        consultaId: data.consultaId,
        ordem,
        prioridade,
        status: FilaStatus.AGUARDANDO,
        consultorio: data.consultorio,
        observacoes: data.observacoes,
      },
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        consulta: {
          select: {
            id: true,
            citizenId: true,
            dataHora: true,
          },
        },
      },
    });

    return fila as any;
  }

  /**
   * Chamar próximo paciente
   */
  async chamarProximo(unidadeId: string, consultorio: string): Promise<FilaAtendimentoResponse | null> {
    // Buscar próximo paciente por prioridade e ordem
    const proximoNaFila = await prisma.filaAtendimento.findFirst({
      where: {
        unidadeId,
        status: FilaStatus.AGUARDANDO,
      },
      orderBy: [
        { prioridade: 'desc' },
        { ordem: 'asc' },
      ],
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        consulta: {
          select: {
            id: true,
            citizenId: true,
            dataHora: true,
          },
        },
      },
    });

    if (!proximoNaFila) {
      return null;
    }

    // Atualizar status para CHAMADO
    const filaChamada = await prisma.filaAtendimento.update({
      where: { id: proximoNaFila.id },
      data: {
        status: FilaStatus.CHAMADO,
        chamadaEm: new Date(),
        consultorio,
      },
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        consulta: {
          select: {
            id: true,
            citizenId: true,
            dataHora: true,
          },
        },
      },
    });

    // Buscar informações do cidadão
    const citizen = await prisma.citizen.findUnique({
      where: { id: filaChamada.consulta.citizenId },
      select: {
        id: true,
        name: true,
        cpf: true,
      },
    });

    if (citizen) {
      // Criar registro de chamada no painel
      await prisma.chamadaPainel.create({
        data: {
          unidadeId,
          filaId: filaChamada.id,
          consultorio,
          nomePaciente: citizen.name,
          mensagem: `${citizen.name} - Consultório ${consultorio}`,
        },
      });
    }

    return filaChamada as any;
  }

  /**
   * Chamar paciente específico
   */
  async chamarPaciente(data: ChamarPacienteDTO): Promise<FilaAtendimentoResponse> {
    const fila = await prisma.filaAtendimento.findUnique({
      where: { id: data.filaId },
      include: {
        consulta: {
          select: {
            citizenId: true,
          },
        },
      },
    });

    if (!fila) {
      throw new Error('Paciente não encontrado na fila');
    }

    // Atualizar status
    const filaChamada = await prisma.filaAtendimento.update({
      where: { id: data.filaId },
      data: {
        status: FilaStatus.CHAMADO,
        chamadaEm: new Date(),
        consultorio: data.consultorio,
      },
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        consulta: {
          select: {
            id: true,
            citizenId: true,
            dataHora: true,
          },
        },
      },
    });

    // Buscar informações do cidadão
    const citizen = await prisma.citizen.findUnique({
      where: { id: fila.consulta.citizenId },
      select: {
        name: true,
      },
    });

    if (citizen) {
      // Criar registro de chamada no painel
      await prisma.chamadaPainel.create({
        data: {
          unidadeId: fila.unidadeId,
          filaId: fila.id,
          consultorio: data.consultorio,
          nomePaciente: citizen.name,
          mensagem: data.mensagem || `${citizen.name} - Consultório ${data.consultorio}`,
        },
      });
    }

    return filaChamada as any;
  }

  /**
   * Atualizar status na fila
   */
  async atualizarStatus(filaId: string, data: UpdateFilaAtendimentoDTO) {
    const dataToUpdate: any = { ...data };

    // Se estiver finalizando, registrar horário
    if (data.status === FilaStatus.FINALIZADO || data.status === FilaStatus.CANCELADO) {
      dataToUpdate.atendidoEm = new Date();
    }

    return await prisma.filaAtendimento.update({
      where: { id: filaId },
      data: dataToUpdate,
      include: {
        unidade: true,
        consulta: true,
      },
    });
  }

  /**
   * Listar fila de uma unidade
   */
  async listarFila(unidadeId: string, status?: FilaStatus) {
    return await prisma.filaAtendimento.findMany({
      where: {
        unidadeId,
        ...(status && { status }),
      },
      include: {
        unidade: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        consulta: {
          select: {
            id: true,
            citizenId: true,
            dataHora: true,
          },
        },
      },
      orderBy: [
        { prioridade: 'desc' },
        { ordem: 'asc' },
      ],
    });
  }

  /**
   * Obter posição na fila
   */
  async obterPosicao(filaId: string): Promise<{ posicao: number; total: number; tempoEstimado: number }> {
    const fila = await prisma.filaAtendimento.findUnique({
      where: { id: filaId },
    });

    if (!fila) {
      throw new Error('Registro não encontrado na fila');
    }

    // Contar quantas pessoas estão à frente (mesma unidade, prioridade e ordem)
    const pessoasAFrente = await prisma.filaAtendimento.count({
      where: {
        unidadeId: fila.unidadeId,
        status: {
          in: [FilaStatus.AGUARDANDO, FilaStatus.CHAMADO],
        },
        OR: [
          { prioridade: { gt: fila.prioridade } },
          {
            AND: [
              { prioridade: fila.prioridade },
              { ordem: { lt: fila.ordem } },
            ],
          },
        ],
      },
    });

    // Contar total de pessoas na fila
    const totalNaFila = await prisma.filaAtendimento.count({
      where: {
        unidadeId: fila.unidadeId,
        status: {
          in: [FilaStatus.AGUARDANDO, FilaStatus.CHAMADO, FilaStatus.EM_ATENDIMENTO],
        },
      },
    });

    // Estimar tempo (assumindo 15 minutos por atendimento)
    const tempoEstimado = pessoasAFrente * 15;

    return {
      posicao: pessoasAFrente + 1,
      total: totalNaFila,
      tempoEstimado,
    };
  }

  /**
   * Obter chamadas recentes do painel
   */
  async obterChamadasRecentes(unidadeId: string, limite: number = 10) {
    return await prisma.chamadaPainel.findMany({
      where: { unidadeId },
      orderBy: {
        exibidoEm: 'desc',
      },
      take: limite,
      include: {
        fila: {
          include: {
            consulta: true,
          },
        },
      },
    });
  }

  /**
   * Cancelar entrada na fila
   */
  async cancelarFila(filaId: string, observacoes?: string) {
    return await prisma.filaAtendimento.update({
      where: { id: filaId },
      data: {
        status: FilaStatus.CANCELADO,
        observacoes,
        atendidoEm: new Date(),
      },
    });
  }
}

export default new FilaService();
