/**
 * Ocorrências de Segurança — Segurança Pública (Guarda Municipal).
 * Fase 3 da auditoria de 2026-10-08 (a secretaria não tinha app).
 *
 * Ocorrências, denúncias, pedidos de patrulhamento e pontos críticos numa fila
 * única por prioridade, com mapa. Denúncia anônima NÃO guarda quem fez nem
 * mostra na tela. Assumir / registrar providência / resolver / arquivar voltam
 * ao pedido do cidadão.
 */

import { prisma } from '../../lib/prisma';
import { concludeProtocolFromApp, noteProtocolFromApp } from '../apps/app-protocol-bridge.service';

const APP = 'Segurança Pública';
export const TIPOS_OCORRENCIA = ['OCORRENCIA', 'PATRULHAMENTO', 'DENUNCIA', 'PONTO_CRITICO', 'ALERTA', 'PATRULHA_ESCOLAR', 'GUARDA_PATRIMONIAL'];
export const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
const PESO: Record<string, number> = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };

/** Ordem de atendimento: prioridade primeiro, depois a mais antiga. */
export function ordenarPorUrgencia<T extends { prioridade: string; createdAt: Date }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => (PESO[a.prioridade] ?? 9) - (PESO[b.prioridade] ?? 9) || a.createdAt.getTime() - b.createdAt.getTime());
}

/** Tira da resposta o que identifica quem fez uma denúncia anônima. */
export function semDenunciante<T extends Record<string, any>>(ocorrencia: T): T {
  if (!ocorrencia.anonima) return ocorrencia;
  return { ...ocorrencia, citizenId: null, solicitanteNome: null, telefone: null, citizen: null };
}

type Evento = { em: string; por?: string | null; texto: string };

class SegurancaService {
  private async gerarNumero() {
    const ano = new Date().getFullYear();
    const total = await prisma.ocorrenciaSeguranca.count({ where: { numero: { startsWith: `OCS-${ano}-` } } });
    return `OCS-${ano}-${String(total + 1).padStart(5, '0')}`;
  }

  private async comDetalhes(itens: any[]) {
    const citizenIds = itens.filter((i) => !i.anonima && i.citizenId).map((i) => i.citizenId);
    const protocolIds = itens.map((i) => i.protocolId).filter(Boolean);
    const [pessoas, protocolos] = await Promise.all([
      citizenIds.length ? prisma.citizen.findMany({ where: { id: { in: citizenIds } }, select: { id: true, name: true, phone: true } }) : [],
      protocolIds.length ? prisma.protocolSimplified.findMany({ where: { id: { in: protocolIds } }, select: { id: true, number: true } }) : [],
    ]);
    const pessoaPorId = new Map(pessoas.map((p) => [p.id, p]));
    const numeroPorId = new Map(protocolos.map((p) => [p.id, p.number]));
    return itens.map((i) =>
      semDenunciante({
        ...i,
        citizen: i.citizenId ? pessoaPorId.get(i.citizenId) || null : null,
        protocolNumber: i.protocolId ? numeroPorId.get(i.protocolId) || null : null,
      })
    );
  }

  async list(filters?: { status?: string; tipo?: string; abertas?: boolean }) {
    const itens = await prisma.ocorrenciaSeguranca.findMany({
      where: {
        ...(filters?.abertas ? { status: { in: ['ABERTA', 'EM_ATENDIMENTO'] } } : filters?.status ? { status: filters.status } : {}),
        ...(filters?.tipo ? { tipo: filters.tipo } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return this.comDetalhes(ordenarPorUrgencia(itens));
  }

  /** Pontos para o mapa (só o que tem coordenada; nunca quem pediu). */
  async mapa() {
    const itens = await prisma.ocorrenciaSeguranca.findMany({
      where: { latitude: { not: null }, longitude: { not: null }, status: { in: ['ABERTA', 'EM_ATENDIMENTO'] } },
      select: { id: true, numero: true, tipo: true, natureza: true, local: true, bairro: true, latitude: true, longitude: true, prioridade: true, status: true, createdAt: true },
      take: 1000,
    });
    return itens;
  }

  async create(data: any, userId?: string) {
    const tipo = TIPOS_OCORRENCIA.includes(data?.tipo) ? data.tipo : 'OCORRENCIA';
    const descricao = String(data?.descricao || '').trim();
    if (!descricao) throw new Error('Descreva o que aconteceu');
    const anonima = data.anonima === true;
    const criada = await prisma.ocorrenciaSeguranca.create({
      data: {
        protocolId: data.protocolId || null,
        numero: await this.gerarNumero(),
        tipo,
        natureza: data.natureza || null,
        anonima,
        // denúncia anônima não guarda quem fez
        citizenId: anonima ? null : data.citizenId || null,
        solicitanteNome: anonima ? null : data.solicitanteNome || null,
        telefone: anonima ? null : data.telefone || null,
        descricao,
        local: data.local || null,
        bairro: data.bairro || null,
        latitude: data.latitude == null || data.latitude === '' ? null : Number(data.latitude),
        longitude: data.longitude == null || data.longitude === '' ? null : Number(data.longitude),
        dataOcorrencia: data.dataOcorrencia ? new Date(data.dataOcorrencia) : null,
        prioridade: PRIORIDADES.includes(data.prioridade) ? data.prioridade : 'MEDIA',
        historico: [{ em: new Date().toISOString(), por: userId || null, texto: 'Registrada' }] as any,
      },
    });
    return criada;
  }

  private async evento(id: string, userId: string, texto: string, extra: Record<string, unknown> = {}) {
    const atual = await prisma.ocorrenciaSeguranca.findFirst({ where: { id } });
    if (!atual) throw new Error('Ocorrência não encontrada');
    const historico = [...((atual.historico as Evento[] | null) || []), { em: new Date().toISOString(), por: userId, texto }];
    const atualizada = await prisma.ocorrenciaSeguranca.update({ where: { id }, data: { historico: historico as any, ...extra } });
    return { anterior: atual, atualizada };
  }

  private async exigirAberta(id: string) {
    const atual = await prisma.ocorrenciaSeguranca.findFirst({ where: { id }, select: { status: true } });
    if (!atual) throw new Error('Ocorrência não encontrada');
    if (['RESOLVIDA', 'ARQUIVADA'].includes(atual.status)) throw new Error('Esta ocorrência já foi encerrada');
  }

  async assumir(id: string, userId: string, equipe?: string) {
    await this.exigirAberta(id);
    const { anterior, atualizada } = await this.evento(id, userId, `Em atendimento${equipe ? ` pela equipe ${equipe}` : ''}`, {
      status: 'EM_ATENDIMENTO',
      responsavelId: userId,
      equipe: equipe || null,
    });
    await noteProtocolFromApp({
      protocolId: anterior.protocolId,
      app: APP,
      actorId: userId,
      message: `O seu registro ${anterior.numero || ''} está em atendimento pela Guarda Municipal.`,
    });
    return atualizada;
  }

  async definirPrioridade(id: string, userId: string, prioridade: string) {
    if (!PRIORIDADES.includes(prioridade)) throw new Error('Prioridade inválida');
    return (await this.evento(id, userId, `Prioridade: ${prioridade}`, { prioridade })).atualizada;
  }

  /** Anotação interna do que foi feito (não vai para o cidadão). */
  async registrarProvidencia(id: string, userId: string, texto: string) {
    const limpo = String(texto || '').trim();
    if (!limpo) throw new Error('Escreva o que foi feito');
    return (await this.evento(id, userId, limpo, { providencias: limpo })).atualizada;
  }

  async encerrar(id: string, userId: string, data: { resultado: 'RESOLVIDA' | 'ARQUIVADA'; mensagem?: string }) {
    const mensagem = String(data.mensagem || '').trim();
    if (!mensagem) throw new Error('Escreva a resposta para o cidadão');
    await this.exigirAberta(id);
    const status = data.resultado === 'ARQUIVADA' ? 'ARQUIVADA' : 'RESOLVIDA';
    const { anterior, atualizada } = await this.evento(id, userId, `${status === 'RESOLVIDA' ? 'Resolvida' : 'Arquivada'}: ${mensagem}`, {
      status,
      resolvidaEm: new Date(),
    });
    await concludeProtocolFromApp({
      protocolId: anterior.protocolId,
      app: APP,
      actorId: userId,
      message: mensagem,
      outcome: status === 'RESOLVIDA' ? 'DEFERIDO' : 'INDEFERIDO',
    });
    return atualizada;
  }

  async stats() {
    const itens = await prisma.ocorrenciaSeguranca.groupBy({ by: ['status', 'prioridade'], _count: { _all: true } });
    const soma = (filtro: (i: (typeof itens)[number]) => boolean) => itens.filter(filtro).reduce((total, i) => total + i._count._all, 0);
    const porBairro = await prisma.ocorrenciaSeguranca.groupBy({
      by: ['bairro'],
      where: { bairro: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { bairro: 'desc' } },
      take: 5,
    });
    return {
      abertas: soma((i) => i.status === 'ABERTA'),
      emAtendimento: soma((i) => i.status === 'EM_ATENDIMENTO'),
      urgentes: soma((i) => i.prioridade === 'URGENTE' && ['ABERTA', 'EM_ATENDIMENTO'].includes(i.status)),
      resolvidas: soma((i) => i.status === 'RESOLVIDA'),
      bairros: porBairro.map((b) => ({ bairro: b.bairro, total: b._count._all })),
    };
  }
}

export default new SegurancaService();
