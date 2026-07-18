import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Credenciamentos & Vistorias (Fase 3, blueprint B4-lite + carteirinha)
 * — Secretaria de Transportes e Trânsito.
 *
 * Credenciais (táxi/mototáxi/transporte escolar): SOLICITADA → EM_ANALISE →
 * ATIVA (emite CRD-ano-seq com validade) | INDEFERIDA; renovação estende a
 * validade; suspensão/reativação/cassação administrativas.
 * Vistorias veiculares: solicitada → agendada → realizada (resultado
 * APROVADO/REPROVADO/CONDICIONAL).
 * Defesas de autuação: RECEBIDA → EM_ANALISE → DEFERIDA/INDEFERIDA com
 * parecer JARI. Desfechos concluem o protocolo de origem (NÃO-FATAL).
 */

const TIPOS_CREDENCIAL = ['TAXI', 'MOTOTAXI', 'TRANSPORTE_ESCOLAR'];
const VALIDADE_MESES_DEFAULT = 12;

class TransitoService {
  private async gerarNumeroCredencial() {
    const ano = new Date().getFullYear();
    const total = await prisma.credencialTransporte.count({
      where: { numeroCredencial: { startsWith: `CRD-${ano}-` } },
    });
    return `CRD-${ano}-${String(total + 1).padStart(4, '0')}`;
  }

  // -------------------------------------------------------------- credenciais

  async listCredenciais(filters?: { tipo?: string; status?: string; busca?: string }) {
    return prisma.credencialTransporte.findMany({
      where: {
        ...(filters?.tipo ? { tipo: filters.tipo } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.busca
          ? {
              OR: [
                { titularNome: { contains: filters.busca, mode: 'insensitive' as const } },
                { cpf: { contains: filters.busca.replace(/\D/g, '') || filters.busca } },
                { veiculoPlaca: { contains: filters.busca, mode: 'insensitive' as const } },
                { numeroCredencial: { contains: filters.busca, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: { vistorias: { orderBy: { createdAt: 'desc' }, take: 3 } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async createCredencial(data: any) {
    if (!data?.tipo || !TIPOS_CREDENCIAL.includes(data.tipo)) {
      throw new Error(`tipo é obrigatório (${TIPOS_CREDENCIAL.join(', ')})`);
    }
    return prisma.credencialTransporte.create({
      data: {
        protocolId: data.protocolId,
        tipo: data.tipo,
        titularNome: data.titularNome,
        cpf: data.cpf ? String(data.cpf).replace(/\D/g, '') : null,
        citizenId: data.citizenId,
        telefone: data.telefone,
        veiculoPlaca: data.veiculoPlaca ? String(data.veiculoPlaca).toUpperCase() : null,
        veiculoModelo: data.veiculoModelo,
        veiculoAno: data.veiculoAno != null ? Number(data.veiculoAno) : null,
        ponto: data.ponto,
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
  }

  async atualizarCredencial(id: string, data: any) {
    const credencial = await prisma.credencialTransporte.findFirst({ where: { id } });
    if (!credencial) throw new Error('Credencial não encontrada');
    return prisma.credencialTransporte.update({
      where: { id: credencial.id },
      data: {
        ...(data.titularNome !== undefined ? { titularNome: data.titularNome } : {}),
        ...(data.cpf !== undefined
          ? { cpf: data.cpf ? String(data.cpf).replace(/\D/g, '') : null }
          : {}),
        ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
        ...(data.veiculoPlaca !== undefined
          ? { veiculoPlaca: data.veiculoPlaca ? String(data.veiculoPlaca).toUpperCase() : null }
          : {}),
        ...(data.veiculoModelo !== undefined ? { veiculoModelo: data.veiculoModelo } : {}),
        ...(data.veiculoAno !== undefined
          ? { veiculoAno: data.veiculoAno != null ? Number(data.veiculoAno) : null }
          : {}),
        ...(data.ponto !== undefined ? { ponto: data.ponto } : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
      },
    });
  }

  async iniciarAnaliseCredencial(id: string) {
    const credencial = await prisma.credencialTransporte.findFirst({ where: { id } });
    if (!credencial) throw new Error('Credencial não encontrada');
    if (credencial.status !== 'SOLICITADA') {
      throw new Error('Somente solicitações podem entrar em análise');
    }
    return prisma.credencialTransporte.update({
      where: { id: credencial.id },
      data: { status: 'EM_ANALISE' },
    });
  }

  /** Emite a credencial (CRD-ano-seq + validade) e conclui o protocolo. */
  async emitirCredencial(id: string, validadeMeses?: number) {
    const credencial = await prisma.credencialTransporte.findFirst({ where: { id } });
    if (!credencial) throw new Error('Credencial não encontrada');
    if (!['SOLICITADA', 'EM_ANALISE'].includes(credencial.status)) {
      throw new Error('Credencial com situação encerrada');
    }
    if (!credencial.titularNome) throw new Error('Informe o titular antes de emitir');
    const meses = Number(validadeMeses) > 0 ? Number(validadeMeses) : VALIDADE_MESES_DEFAULT;
    const validade = new Date();
    validade.setMonth(validade.getMonth() + meses);
    const atualizada = await prisma.credencialTransporte.update({
      where: { id: credencial.id },
      data: {
        status: 'ATIVA',
        numeroCredencial: credencial.numeroCredencial || (await this.gerarNumeroCredencial()),
        validade,
        emitidaEm: new Date(),
      },
    });
    await this.concluirProtocolo(atualizada.protocolId, 'Credencial emitida');
    return atualizada;
  }

  async indeferirCredencial(id: string, motivo?: string) {
    const credencial = await prisma.credencialTransporte.findFirst({ where: { id } });
    if (!credencial) throw new Error('Credencial não encontrada');
    if (!['SOLICITADA', 'EM_ANALISE'].includes(credencial.status)) {
      throw new Error('Credencial com situação encerrada');
    }
    const atualizada = await prisma.credencialTransporte.update({
      where: { id: credencial.id },
      data: { status: 'INDEFERIDA', ...(motivo ? { observacoes: motivo } : {}) },
    });
    await this.concluirProtocolo(atualizada.protocolId, 'Credencial indeferida');
    return atualizada;
  }

  /** Renova credencial ativa (ou suspensa) estendendo a validade a partir de hoje. */
  async renovarCredencial(id: string, validadeMeses?: number) {
    const credencial = await prisma.credencialTransporte.findFirst({ where: { id } });
    if (!credencial) throw new Error('Credencial não encontrada');
    if (!['ATIVA', 'SUSPENSA'].includes(credencial.status)) {
      throw new Error('Somente credenciais ativas ou suspensas podem ser renovadas');
    }
    const meses = Number(validadeMeses) > 0 ? Number(validadeMeses) : VALIDADE_MESES_DEFAULT;
    const validade = new Date();
    validade.setMonth(validade.getMonth() + meses);
    return prisma.credencialTransporte.update({
      where: { id: credencial.id },
      data: { status: 'ATIVA', validade },
    });
  }

  async suspenderCredencial(id: string, motivo?: string) {
    const credencial = await prisma.credencialTransporte.findFirst({ where: { id } });
    if (!credencial) throw new Error('Credencial não encontrada');
    if (credencial.status !== 'ATIVA') throw new Error('Somente credenciais ativas podem ser suspensas');
    return prisma.credencialTransporte.update({
      where: { id: credencial.id },
      data: { status: 'SUSPENSA', ...(motivo ? { observacoes: motivo } : {}) },
    });
  }

  async reativarCredencial(id: string) {
    const credencial = await prisma.credencialTransporte.findFirst({ where: { id } });
    if (!credencial) throw new Error('Credencial não encontrada');
    if (credencial.status !== 'SUSPENSA') throw new Error('Somente credenciais suspensas podem ser reativadas');
    return prisma.credencialTransporte.update({
      where: { id: credencial.id },
      data: { status: 'ATIVA' },
    });
  }

  async cancelarCredencial(id: string, motivo?: string) {
    const credencial = await prisma.credencialTransporte.findFirst({ where: { id } });
    if (!credencial) throw new Error('Credencial não encontrada');
    return prisma.credencialTransporte.update({
      where: { id: credencial.id },
      data: { status: 'CANCELADA', ...(motivo ? { observacoes: motivo } : {}) },
    });
  }

  // ---------------------------------------------------------------- vistorias

  async listVistorias(filters?: { status?: string; credencialId?: string }) {
    return prisma.vistoriaVeiculo.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.credencialId ? { credencialId: filters.credencialId } : {}),
      },
      include: {
        credencial: {
          select: { id: true, numeroCredencial: true, tipo: true, titularNome: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async createVistoria(data: any) {
    return prisma.vistoriaVeiculo.create({
      data: {
        protocolId: data.protocolId,
        credencialId: data.credencialId,
        veiculoPlaca: data.veiculoPlaca ? String(data.veiculoPlaca).toUpperCase() : null,
        solicitanteNome: data.solicitanteNome,
        citizenId: data.citizenId,
        agendadaPara: data.agendadaPara ? new Date(data.agendadaPara) : null,
        ...(data.agendadaPara ? { status: 'AGENDADA' } : {}),
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
  }

  async agendarVistoria(id: string, agendadaPara: string, credencialId?: string) {
    const vistoria = await prisma.vistoriaVeiculo.findFirst({ where: { id } });
    if (!vistoria) throw new Error('Vistoria não encontrada');
    if (!['SOLICITADA', 'AGENDADA'].includes(vistoria.status)) {
      throw new Error('Vistoria já realizada ou cancelada');
    }
    if (!agendadaPara) throw new Error('Informe a data do agendamento');
    return prisma.vistoriaVeiculo.update({
      where: { id: vistoria.id },
      data: {
        status: 'AGENDADA',
        agendadaPara: new Date(agendadaPara),
        ...(credencialId ? { credencialId } : {}),
      },
    });
  }

  /** Registra o resultado da vistoria e conclui o protocolo de origem. */
  async registrarResultadoVistoria(
    id: string,
    params: { resultado: string; itens?: string; vistoriador?: string; observacoes?: string }
  ) {
    const vistoria = await prisma.vistoriaVeiculo.findFirst({ where: { id } });
    if (!vistoria) throw new Error('Vistoria não encontrada');
    if (!['SOLICITADA', 'AGENDADA'].includes(vistoria.status)) {
      throw new Error('Vistoria já realizada ou cancelada');
    }
    if (!params?.resultado || !['APROVADO', 'REPROVADO', 'CONDICIONAL'].includes(params.resultado)) {
      throw new Error('resultado é obrigatório (APROVADO, REPROVADO, CONDICIONAL)');
    }
    const atualizada = await prisma.vistoriaVeiculo.update({
      where: { id: vistoria.id },
      data: {
        status: 'REALIZADA',
        resultado: params.resultado,
        itens: params.itens,
        vistoriador: params.vistoriador,
        realizadaEm: new Date(),
        ...(params.observacoes ? { observacoes: params.observacoes } : {}),
      },
    });
    await this.concluirProtocolo(atualizada.protocolId, `Vistoria ${params.resultado.toLowerCase()}`);
    return atualizada;
  }

  async cancelarVistoria(id: string, motivo?: string) {
    const vistoria = await prisma.vistoriaVeiculo.findFirst({ where: { id } });
    if (!vistoria) throw new Error('Vistoria não encontrada');
    return prisma.vistoriaVeiculo.update({
      where: { id: vistoria.id },
      data: { status: 'CANCELADA', ...(motivo ? { observacoes: motivo } : {}) },
    });
  }

  // ------------------------------------------------------------------ defesas

  async listDefesas(filters?: { status?: string; busca?: string }) {
    return prisma.defesaAutuacao.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.busca
          ? {
              OR: [
                { requerenteNome: { contains: filters.busca, mode: 'insensitive' as const } },
                { numeroAutuacao: { contains: filters.busca, mode: 'insensitive' as const } },
                { veiculoPlaca: { contains: filters.busca, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async createDefesa(data: any) {
    return prisma.defesaAutuacao.create({
      data: {
        protocolId: data.protocolId,
        numeroAutuacao: data.numeroAutuacao,
        requerenteNome: data.requerenteNome,
        cpf: data.cpf ? String(data.cpf).replace(/\D/g, '') : null,
        citizenId: data.citizenId,
        veiculoPlaca: data.veiculoPlaca ? String(data.veiculoPlaca).toUpperCase() : null,
        motivo: data.motivo,
        dados: data.dados,
      },
    });
  }

  async iniciarAnaliseDefesa(id: string) {
    const defesa = await prisma.defesaAutuacao.findFirst({ where: { id } });
    if (!defesa) throw new Error('Defesa não encontrada');
    if (defesa.status !== 'RECEBIDA') throw new Error('Somente defesas recebidas podem entrar em análise');
    return prisma.defesaAutuacao.update({
      where: { id: defesa.id },
      data: { status: 'EM_ANALISE' },
    });
  }

  /** Julga a defesa (parecer JARI) e conclui o protocolo de origem. */
  async julgarDefesa(id: string, params: { decisao: string; parecer?: string }) {
    const defesa = await prisma.defesaAutuacao.findFirst({ where: { id } });
    if (!defesa) throw new Error('Defesa não encontrada');
    if (!['RECEBIDA', 'EM_ANALISE'].includes(defesa.status)) {
      throw new Error('Defesa já julgada ou cancelada');
    }
    if (!params?.decisao || !['DEFERIDA', 'INDEFERIDA'].includes(params.decisao)) {
      throw new Error('decisao é obrigatória (DEFERIDA, INDEFERIDA)');
    }
    const atualizada = await prisma.defesaAutuacao.update({
      where: { id: defesa.id },
      data: {
        status: params.decisao,
        parecerJari: params.parecer,
        julgadaEm: new Date(),
      },
    });
    await this.concluirProtocolo(atualizada.protocolId, `Defesa ${params.decisao.toLowerCase()}`);
    return atualizada;
  }

  async cancelarDefesa(id: string) {
    const defesa = await prisma.defesaAutuacao.findFirst({ where: { id } });
    if (!defesa) throw new Error('Defesa não encontrada');
    return prisma.defesaAutuacao.update({
      where: { id: defesa.id },
      data: { status: 'CANCELADA' },
    });
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
      logger.warn(`Trânsito: falha ao concluir protocolo ${protocolId} (não-fatal) — ${motivo}`, error);
    }
  }

  async getStatistics() {
    const hoje = new Date();
    const em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [ativas, emAnalise, vistoriasPendentes, defesasPendentes, vencendo] = await Promise.all([
      prisma.credencialTransporte.count({ where: { status: 'ATIVA' } }),
      prisma.credencialTransporte.count({ where: { status: { in: ['SOLICITADA', 'EM_ANALISE'] } } }),
      prisma.vistoriaVeiculo.count({ where: { status: { in: ['SOLICITADA', 'AGENDADA'] } } }),
      prisma.defesaAutuacao.count({ where: { status: { in: ['RECEBIDA', 'EM_ANALISE'] } } }),
      prisma.credencialTransporte.count({
        where: { status: 'ATIVA', validade: { gte: hoje, lte: em30dias } },
      }),
    ]);
    return {
      credenciaisAtivas: ativas,
      solicitacoesEmAnalise: emAnalise,
      vistoriasPendentes,
      defesasPendentes,
      credenciaisVencendo30d: vencendo,
    };
  }
}

export default new TransitoService();
