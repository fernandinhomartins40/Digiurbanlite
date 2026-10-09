/**
 * Cadastro do Turismo — Secretaria de Turismo.
 * Fase 3 da auditoria de 2026-10-08 (a secretaria não tinha app).
 *
 * Prestadores (hospedagem, restaurante, guia, agência, transporte, atrativo):
 * SOLICITADO → EM_ANALISE → ATIVO (emite TUR-ano-seq com validade) |
 * INDEFERIDO; suspender/reativar/renovar. Eventos: SOLICITADO → APROVADO
 * (com o apoio concedido) → REALIZADO | INDEFERIDO | CANCELADO.
 * "Publicado" marca o que pode aparecer no guia e no calendário da cidade.
 */

import { prisma } from '../../lib/prisma';
import { concludeProtocolFromApp, noteProtocolFromApp } from '../apps/app-protocol-bridge.service';

const APP = 'Turismo';
export const TIPOS_PRESTADOR = ['ESTABELECIMENTO', 'GUIA', 'AGENCIA', 'TRANSPORTE', 'ATRACAO'];
const VALIDADE_MESES = 24;
const fmt = (date: Date) => date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const texto = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

/** Validade a partir de uma data (meses de calendário). */
export function validadeAPartirDe(inicio: Date, meses: number = VALIDADE_MESES): Date {
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + (meses > 0 ? meses : VALIDADE_MESES));
  return fim;
}

/** Situação mostrada na tela: cadastro ativo com validade passada aparece como vencido. */
export function situacaoDoCadastro(status: string, validade?: Date | null, hoje: Date = new Date()): string {
  return status === 'ATIVO' && validade && validade.getTime() < hoje.getTime() ? 'VENCIDO' : status;
}

function parseDate(value: unknown): Date | null {
  const raw = String(value || '');
  if (!raw) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00-03:00` : raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function numerosDeProtocolo(itens: Array<{ protocolId?: string | null }>) {
  const ids = itens.map((i) => i.protocolId).filter(Boolean) as string[];
  if (!ids.length) return new Map<string, string>();
  const protocolos = await prisma.protocolSimplified.findMany({ where: { id: { in: ids } }, select: { id: true, number: true } });
  return new Map(protocolos.map((p) => [p.id, p.number]));
}

class TurismoService {
  // ---------------------------------------------------------------- prestadores
  private async gerarNumero() {
    const ano = new Date().getFullYear();
    const total = await prisma.prestadorTuristico.count({ where: { numero: { startsWith: `TUR-${ano}-` } } });
    return `TUR-${ano}-${String(total + 1).padStart(4, '0')}`;
  }

  async listPrestadores(filters?: { tipo?: string; status?: string; busca?: string }) {
    const busca = filters?.busca?.trim();
    const itens = await prisma.prestadorTuristico.findMany({
      where: {
        ...(filters?.tipo ? { tipo: filters.tipo } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(busca
          ? { OR: [{ nome: { contains: busca, mode: 'insensitive' as const } }, { responsavel: { contains: busca, mode: 'insensitive' as const } }, { numero: { contains: busca, mode: 'insensitive' as const } }] }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const numeros = await numerosDeProtocolo(itens);
    return itens.map((i) => ({ ...i, situacao: situacaoDoCadastro(i.status, i.validade), protocolNumber: i.protocolId ? numeros.get(i.protocolId) || null : null }));
  }

  async savePrestador(id: string | null, data: any) {
    const nome = texto(data?.nome);
    if (!nome) throw new Error('Informe o nome');
    const tipo = TIPOS_PRESTADOR.includes(data?.tipo) ? data.tipo : 'ESTABELECIMENTO';
    const campos = {
      tipo,
      nome,
      categoria: texto(data.categoria),
      responsavel: texto(data.responsavel),
      cpfCnpj: String(data.cpfCnpj || '').replace(/\D/g, '') || null,
      citizenId: data.citizenId || null,
      telefone: texto(data.telefone),
      email: texto(data.email),
      endereco: texto(data.endereco),
      descricao: texto(data.descricao),
      cadastur: texto(data.cadastur),
      ...(data.protocolId ? { protocolId: String(data.protocolId) } : {}),
      ...(data.dados ? { dados: data.dados } : {}),
    };
    return id ? prisma.prestadorTuristico.update({ where: { id }, data: campos }) : prisma.prestadorTuristico.create({ data: campos });
  }

  private async prestador(id: string) {
    const item = await prisma.prestadorTuristico.findFirst({ where: { id } });
    if (!item) throw new Error('Cadastro não encontrado');
    return item;
  }

  async analisar(id: string, userId: string) {
    const item = await this.prestador(id);
    if (item.status !== 'SOLICITADO') throw new Error('Este cadastro já saiu da fila de entrada');
    const atualizado = await prisma.prestadorTuristico.update({ where: { id }, data: { status: 'EM_ANALISE' } });
    await noteProtocolFromApp({ protocolId: item.protocolId, app: APP, actorId: userId, message: 'O seu cadastro turístico está em análise pela Secretaria de Turismo.' });
    return atualizado;
  }

  /** Aprova: emite o número do cadastro municipal com validade. */
  async aprovar(id: string, userId: string, data?: { validadeMeses?: number; publicar?: boolean }) {
    const item = await this.prestador(id);
    if (!['SOLICITADO', 'EM_ANALISE'].includes(item.status)) throw new Error('Este cadastro já foi decidido');
    const validade = validadeAPartirDe(new Date(), Number(data?.validadeMeses) || VALIDADE_MESES);
    const numero = item.numero || (await this.gerarNumero());
    const atualizado = await prisma.prestadorTuristico.update({
      where: { id },
      data: { status: 'ATIVO', numero, emitidoEm: new Date(), validade, publicado: data?.publicar !== false, motivo: null },
    });
    await concludeProtocolFromApp({
      protocolId: item.protocolId,
      app: APP,
      actorId: userId,
      message: `Cadastro turístico aprovado: nº ${numero}, válido até ${fmt(validade)}.`,
      outcome: 'DEFERIDO',
    });
    return atualizado;
  }

  async indeferir(id: string, userId: string, motivo?: string) {
    const limpo = texto(motivo);
    if (!limpo) throw new Error('Informe o motivo (o solicitante vai ler)');
    const item = await this.prestador(id);
    if (!['SOLICITADO', 'EM_ANALISE'].includes(item.status)) throw new Error('Este cadastro já foi decidido');
    const atualizado = await prisma.prestadorTuristico.update({ where: { id }, data: { status: 'INDEFERIDO', motivo: limpo, publicado: false } });
    await concludeProtocolFromApp({ protocolId: item.protocolId, app: APP, actorId: userId, message: `Cadastro turístico não aprovado: ${limpo}`, outcome: 'INDEFERIDO' });
    return atualizado;
  }

  async renovar(id: string, meses?: number) {
    const item = await this.prestador(id);
    if (!['ATIVO', 'SUSPENSO'].includes(item.status)) throw new Error('Só cadastro ativo ou suspenso pode ser renovado');
    return prisma.prestadorTuristico.update({ where: { id }, data: { status: 'ATIVO', validade: validadeAPartirDe(new Date(), Number(meses) || VALIDADE_MESES) } });
  }

  async suspender(id: string, motivo?: string) {
    const item = await this.prestador(id);
    if (item.status !== 'ATIVO') throw new Error('Só cadastro ativo pode ser suspenso');
    return prisma.prestadorTuristico.update({ where: { id }, data: { status: 'SUSPENSO', motivo: texto(motivo), publicado: false } });
  }

  async reativar(id: string) {
    const item = await this.prestador(id);
    if (item.status !== 'SUSPENSO') throw new Error('Este cadastro não está suspenso');
    return prisma.prestadorTuristico.update({ where: { id }, data: { status: 'ATIVO', motivo: null } });
  }

  async publicar(id: string, publicado: boolean) {
    const item = await this.prestador(id);
    if (publicado && item.status !== 'ATIVO') throw new Error('Só cadastro ativo pode aparecer no guia');
    return prisma.prestadorTuristico.update({ where: { id }, data: { publicado } });
  }

  // --------------------------------------------------------------------- eventos
  async listEventos(filters?: { status?: string }) {
    const itens = await prisma.eventoTuristico.findMany({
      where: filters?.status ? { status: filters.status } : {},
      orderBy: [{ dataInicio: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    });
    const numeros = await numerosDeProtocolo(itens);
    return itens.map((i) => ({ ...i, protocolNumber: i.protocolId ? numeros.get(i.protocolId) || null : null }));
  }

  async saveEvento(id: string | null, data: any) {
    const nome = texto(data?.nome);
    if (!nome) throw new Error('Informe o nome do evento');
    const dataInicio = parseDate(data.dataInicio);
    const dataFim = parseDate(data.dataFim) || dataInicio;
    if (dataInicio && dataFim && dataFim < dataInicio) throw new Error('A data final não pode ser antes da inicial');
    const campos = {
      nome,
      tipo: texto(data.tipo),
      descricao: texto(data.descricao),
      local: texto(data.local),
      dataInicio,
      dataFim,
      organizador: texto(data.organizador),
      contato: texto(data.contato),
      publicoEstimado: data.publicoEstimado == null || data.publicoEstimado === '' ? null : Number(data.publicoEstimado),
      apoioSolicitado: texto(data.apoioSolicitado),
      citizenId: data.citizenId || null,
      ...(data.protocolId ? { protocolId: String(data.protocolId) } : {}),
      ...(data.dados ? { dados: data.dados } : {}),
      // evento criado pela própria equipe já nasce aprovado
      ...(data.status ? { status: String(data.status), publicado: data.status === 'APROVADO' } : {}),
    };
    return id ? prisma.eventoTuristico.update({ where: { id }, data: campos }) : prisma.eventoTuristico.create({ data: campos });
  }

  private async eventoPorId(id: string) {
    const item = await prisma.eventoTuristico.findFirst({ where: { id } });
    if (!item) throw new Error('Evento não encontrado');
    return item;
  }

  async aprovarEvento(id: string, userId: string, data?: { apoioConcedido?: string; publicar?: boolean }) {
    const item = await this.eventoPorId(id);
    if (item.status !== 'SOLICITADO') throw new Error('Este evento já foi decidido');
    const apoio = texto(data?.apoioConcedido);
    const atualizado = await prisma.eventoTuristico.update({
      where: { id },
      data: { status: 'APROVADO', apoioConcedido: apoio, publicado: data?.publicar !== false, motivo: null },
    });
    await concludeProtocolFromApp({
      protocolId: item.protocolId,
      app: APP,
      actorId: userId,
      message: `Evento "${item.nome}" registrado no calendário turístico${apoio ? `. Apoio da prefeitura: ${apoio}` : ''}.`,
      outcome: 'DEFERIDO',
    });
    return atualizado;
  }

  async indeferirEvento(id: string, userId: string, motivo?: string) {
    const limpo = texto(motivo);
    if (!limpo) throw new Error('Informe o motivo (o organizador vai ler)');
    const item = await this.eventoPorId(id);
    if (item.status !== 'SOLICITADO') throw new Error('Este evento já foi decidido');
    const atualizado = await prisma.eventoTuristico.update({ where: { id }, data: { status: 'INDEFERIDO', motivo: limpo, publicado: false } });
    await concludeProtocolFromApp({ protocolId: item.protocolId, app: APP, actorId: userId, message: `Pedido do evento "${item.nome}" não aprovado: ${limpo}`, outcome: 'INDEFERIDO' });
    return atualizado;
  }

  async situacaoEvento(id: string, status: 'REALIZADO' | 'CANCELADO') {
    const item = await this.eventoPorId(id);
    if (item.status !== 'APROVADO') throw new Error('Só evento aprovado pode ser marcado como realizado ou cancelado');
    return prisma.eventoTuristico.update({ where: { id }, data: { status, publicado: status === 'REALIZADO' ? item.publicado : false } });
  }

  async stats() {
    const agora = new Date();
    const em60 = new Date(agora.getTime() + 60 * 24 * 60 * 60 * 1000);
    const [aguardando, ativos, vencendo, eventosPendentes, proximosEventos] = await Promise.all([
      prisma.prestadorTuristico.count({ where: { status: { in: ['SOLICITADO', 'EM_ANALISE'] } } }),
      prisma.prestadorTuristico.count({ where: { status: 'ATIVO' } }),
      prisma.prestadorTuristico.count({ where: { status: 'ATIVO', validade: { lte: em60 } } }),
      prisma.eventoTuristico.count({ where: { status: 'SOLICITADO' } }),
      prisma.eventoTuristico.count({ where: { status: 'APROVADO', dataInicio: { gte: agora } } }),
    ]);
    return { aguardando, ativos, vencendo, eventosPendentes, proximosEventos };
  }
}

export default new TurismoService();
