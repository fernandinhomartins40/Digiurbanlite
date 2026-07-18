import { randomBytes } from 'crypto';
import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Carteiras & Gratuidades (Fase 3, blueprint carteirinha)
 * — Secretaria de Mobilidade Urbana.
 *
 * Carteiras (estudante/idoso/PcD/transporte/passe livre/vaga especial):
 * SOLICITADA → EM_ANALISE → ATIVA (emite CTR-ano-seq + código de validação
 * pública para QR, com validade) | INDEFERIDA; renovação estende a validade;
 * 2ª via mantém número e código e incrementa o contador de vias;
 * suspensão/reativação administrativas. Emissão/indeferimento concluem o
 * protocolo de origem (NÃO-FATAL).
 */

const TIPOS_CARTEIRA = ['ESTUDANTE', 'IDOSO', 'PCD', 'TRANSPORTE', 'PASSE_LIVRE', 'VAGA_ESPECIAL'];
const VALIDADE_MESES_DEFAULT = 12;

class MobilidadeService {
  private async gerarNumeroCarteira() {
    const ano = new Date().getFullYear();
    const total = await prisma.carteiraGratuidade.count({
      where: { numeroCarteira: { startsWith: `CTR-${ano}-` } },
    });
    return `CTR-${ano}-${String(total + 1).padStart(4, '0')}`;
  }

  // ---------------------------------------------------------------- carteiras

  async listCarteiras(filters?: { tipo?: string; status?: string; busca?: string }) {
    return prisma.carteiraGratuidade.findMany({
      where: {
        ...(filters?.tipo ? { tipo: filters.tipo } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.busca
          ? {
              OR: [
                { titularNome: { contains: filters.busca, mode: 'insensitive' as const } },
                { cpf: { contains: filters.busca.replace(/\D/g, '') || filters.busca } },
                { numeroCarteira: { contains: filters.busca, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async createCarteira(data: any) {
    if (!data?.tipo || !TIPOS_CARTEIRA.includes(data.tipo)) {
      throw new Error(`tipo é obrigatório (${TIPOS_CARTEIRA.join(', ')})`);
    }
    return prisma.carteiraGratuidade.create({
      data: {
        protocolId: data.protocolId,
        tipo: data.tipo,
        titularNome: data.titularNome,
        cpf: data.cpf ? String(data.cpf).replace(/\D/g, '') : null,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
        citizenId: data.citizenId,
        telefone: data.telefone,
        instituicao: data.instituicao,
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
  }

  async atualizarCarteira(id: string, data: any) {
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { id } });
    if (!carteira) throw new Error('Carteira não encontrada');
    return prisma.carteiraGratuidade.update({
      where: { id: carteira.id },
      data: {
        ...(data.titularNome !== undefined ? { titularNome: data.titularNome } : {}),
        ...(data.cpf !== undefined
          ? { cpf: data.cpf ? String(data.cpf).replace(/\D/g, '') : null }
          : {}),
        ...(data.dataNascimento !== undefined
          ? { dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null }
          : {}),
        ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
        ...(data.instituicao !== undefined ? { instituicao: data.instituicao } : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
      },
    });
  }

  async iniciarAnalise(id: string) {
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { id } });
    if (!carteira) throw new Error('Carteira não encontrada');
    if (carteira.status !== 'SOLICITADA') {
      throw new Error('Somente solicitações podem entrar em análise');
    }
    return prisma.carteiraGratuidade.update({
      where: { id: carteira.id },
      data: { status: 'EM_ANALISE' },
    });
  }

  /** Emite a carteira (CTR-ano-seq + código de validação) e conclui o protocolo. */
  async emitirCarteira(id: string, validadeMeses?: number) {
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { id } });
    if (!carteira) throw new Error('Carteira não encontrada');
    if (!['SOLICITADA', 'EM_ANALISE'].includes(carteira.status)) {
      throw new Error('Carteira com situação encerrada');
    }
    if (!carteira.titularNome) throw new Error('Informe o titular antes de emitir');
    const meses = Number(validadeMeses) > 0 ? Number(validadeMeses) : VALIDADE_MESES_DEFAULT;
    const validade = new Date();
    validade.setMonth(validade.getMonth() + meses);
    const atualizada = await prisma.carteiraGratuidade.update({
      where: { id: carteira.id },
      data: {
        status: 'ATIVA',
        numeroCarteira: carteira.numeroCarteira || (await this.gerarNumeroCarteira()),
        codigoValidacao: carteira.codigoValidacao || randomBytes(16).toString('hex'),
        validade,
        emitidaEm: new Date(),
        viasEmitidas: { increment: 1 },
      },
    });
    await this.concluirProtocolo(atualizada.protocolId, 'Carteira emitida');
    return atualizada;
  }

  async indeferirCarteira(id: string, motivo?: string) {
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { id } });
    if (!carteira) throw new Error('Carteira não encontrada');
    if (!['SOLICITADA', 'EM_ANALISE'].includes(carteira.status)) {
      throw new Error('Carteira com situação encerrada');
    }
    const atualizada = await prisma.carteiraGratuidade.update({
      where: { id: carteira.id },
      data: { status: 'INDEFERIDA', ...(motivo ? { observacoes: motivo } : {}) },
    });
    await this.concluirProtocolo(atualizada.protocolId, 'Carteira indeferida');
    return atualizada;
  }

  /** Renova carteira ativa (ou suspensa) estendendo a validade a partir de hoje. */
  async renovarCarteira(id: string, validadeMeses?: number) {
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { id } });
    if (!carteira) throw new Error('Carteira não encontrada');
    if (!['ATIVA', 'SUSPENSA'].includes(carteira.status)) {
      throw new Error('Somente carteiras ativas ou suspensas podem ser renovadas');
    }
    const meses = Number(validadeMeses) > 0 ? Number(validadeMeses) : VALIDADE_MESES_DEFAULT;
    const validade = new Date();
    validade.setMonth(validade.getMonth() + meses);
    return prisma.carteiraGratuidade.update({
      where: { id: carteira.id },
      data: { status: 'ATIVA', validade },
    });
  }

  /** 2ª via: mantém número e código, registra a nova emissão. */
  async segundaVia(id: string) {
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { id } });
    if (!carteira) throw new Error('Carteira não encontrada');
    if (carteira.status !== 'ATIVA') throw new Error('Somente carteiras ativas têm 2ª via');
    return prisma.carteiraGratuidade.update({
      where: { id: carteira.id },
      data: { viasEmitidas: { increment: 1 }, emitidaEm: new Date() },
    });
  }

  async suspenderCarteira(id: string, motivo?: string) {
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { id } });
    if (!carteira) throw new Error('Carteira não encontrada');
    if (carteira.status !== 'ATIVA') throw new Error('Somente carteiras ativas podem ser suspensas');
    return prisma.carteiraGratuidade.update({
      where: { id: carteira.id },
      data: { status: 'SUSPENSA', ...(motivo ? { observacoes: motivo } : {}) },
    });
  }

  async reativarCarteira(id: string) {
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { id } });
    if (!carteira) throw new Error('Carteira não encontrada');
    if (carteira.status !== 'SUSPENSA') throw new Error('Somente carteiras suspensas podem ser reativadas');
    return prisma.carteiraGratuidade.update({
      where: { id: carteira.id },
      data: { status: 'ATIVA' },
    });
  }

  async cancelarCarteira(id: string, motivo?: string) {
    const carteira = await prisma.carteiraGratuidade.findFirst({ where: { id } });
    if (!carteira) throw new Error('Carteira não encontrada');
    return prisma.carteiraGratuidade.update({
      where: { id: carteira.id },
      data: { status: 'CANCELADA', ...(motivo ? { observacoes: motivo } : {}) },
    });
  }

  /**
   * Validação pública (QR): retorna situação da carteira SEM dados sensíveis
   * (nome parcialmente mascarado, sem CPF).
   */
  async validarPorCodigo(codigo: string) {
    if (!codigo || codigo.length < 8) throw new Error('Código inválido');
    const carteira = await prisma.carteiraGratuidade.findFirst({
      where: { codigoValidacao: codigo },
      select: {
        tipo: true,
        titularNome: true,
        numeroCarteira: true,
        status: true,
        validade: true,
      },
    });
    if (!carteira) return { valida: false, motivo: 'Carteira não encontrada' };
    const vencida = carteira.validade ? new Date(carteira.validade) < new Date() : false;
    const nome = carteira.titularNome || '';
    const partes = nome.trim().split(/\s+/);
    const mascarado =
      partes.length > 1
        ? `${partes[0]} ${partes
            .slice(1)
            .map((p) => `${p[0]}.`)
            .join(' ')}`
        : nome;
    return {
      valida: carteira.status === 'ATIVA' && !vencida,
      motivo:
        carteira.status !== 'ATIVA'
          ? `Carteira ${carteira.status.toLowerCase()}`
          : vencida
            ? 'Carteira vencida'
            : undefined,
      tipo: carteira.tipo,
      titular: mascarado,
      numeroCarteira: carteira.numeroCarteira,
      validade: carteira.validade,
    };
  }

  // -------------------------------------------------------------------- geral

  /** Retroalimenta o protocolo de origem (NÃO-FATAL). */
  private async concluirProtocolo(protocolId: string | null | undefined, motivo: string) {
    if (!protocolId) return;
    try {
      await prisma.protocolSimplified.update({
        where: { id: protocolId },
        data: { status: 'CONCLUIDO' as any, concludedAt: new Date() },
      });
    } catch (error) {
      logger.warn(`Mobilidade: falha ao concluir protocolo ${protocolId} (não-fatal) — ${motivo}`, error);
    }
  }

  async getStatistics() {
    const hoje = new Date();
    const em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [ativas, emAnalise, vencendo, porTipo] = await Promise.all([
      prisma.carteiraGratuidade.count({ where: { status: 'ATIVA' } }),
      prisma.carteiraGratuidade.count({ where: { status: { in: ['SOLICITADA', 'EM_ANALISE'] } } }),
      prisma.carteiraGratuidade.count({
        where: { status: 'ATIVA', validade: { gte: hoje, lte: em30dias } },
      }),
      prisma.carteiraGratuidade.groupBy({
        by: ['tipo'],
        where: { status: 'ATIVA' },
        _count: { _all: true },
      }),
    ]);
    return {
      carteirasAtivas: ativas,
      solicitacoesEmAnalise: emAnalise,
      carteirasVencendo30d: vencendo,
      ativasPorTipo: porTipo.map((t) => ({ tipo: t.tipo, total: t._count._all })),
    };
  }
}

export default new MobilidadeService();
