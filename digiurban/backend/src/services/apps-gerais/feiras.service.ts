/**
 * Feiras e Mercados (app geral, 2026-10-09).
 *
 * Boxes do mercado municipal, bancas de feira livre e inscrição em feiras
 * (produtor, artesanato, empreendedores). A equipe cadastra os espaços; o
 * pedido do portal chega aguardando; conceder liga a pessoa a um espaço livre
 * com validade (o espaço fica ocupado) e encerra o pedido com o número da
 * permissão. Relocação troca o espaço e libera o antigo. Revogar libera o espaço.
 */

import { prisma } from '../../lib/prisma';
import { parseBrasiliaDateTime } from '../agenda-medica/brasilia-time';
import { concludeProtocolFromApp } from '../apps/app-protocol-bridge.service';
import { AppScope, campo, comEvento, dataBrasilia, numerosDosPedidos, origemDoPedido, pickDepartment, proximoNumero, scopeWhere } from './common';

const APP = 'Feiras e Mercados';

export const FEIRAS_DEPARTMENTS = ['SERVICOS_PUBLICOS', 'DESENVOLVIMENTO_ECONOMICO', 'AGRICULTURA'];
export const TIPOS_ESPACO = ['BOX', 'BANCA', 'QUIOSQUE', 'PONTO'];

/** Porta do app → tipo de pedido */
export const TIPO_PEDIDO_FEIRA: Record<string, string> = {
  PERMISSAO_ESPACO_FEIRA: 'PERMISSAO',
  INSCRICAO_FEIRA: 'INSCRICAO_FEIRA',
  RELOCACAO_PONTO_FEIRA: 'RELOCACAO',
};

/** Situação que a tela mostra: permissão ativa com validade passada = vencida. */
export function situacaoDaPermissao(status: string, validade: Date | null, agora = new Date()): string {
  if (status === 'ATIVA' && validade && validade.getTime() < agora.getTime()) return 'VENCIDA';
  return status;
}

/** Inscrição em feira não precisa de espaço fixo; permissão e relocação precisam. */
export function precisaDeEspaco(tipoPedido: string): boolean {
  return tipoPedido !== 'INSCRICAO_FEIRA';
}

class FeirasService {
  private async permissao(id: string, scope: AppScope) {
    const atual = await prisma.permissaoUsoEspaco.findFirst({ where: { id, ...scopeWhere(scope) }, include: { espaco: true } });
    if (!atual) throw new Error('Pedido não encontrado');
    return atual;
  }

  async fromPortal(protocol: { id: string; citizenId?: string | null; customData?: any }, action: string) {
    if (await prisma.permissaoUsoEspaco.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
    const origem = await origemDoPedido(protocol.id);
    const data = protocol.customData || {};
    await prisma.permissaoUsoEspaco.create({
      data: {
        protocolId: protocol.id,
        numero: await proximoNumero('permissaoUsoEspaco', 'PUE'),
        departmentCode: FEIRAS_DEPARTMENTS.includes(origem.departmentCode) ? origem.departmentCode : FEIRAS_DEPARTMENTS[0],
        tipoPedido: TIPO_PEDIDO_FEIRA[action] || 'PERMISSAO',
        localDesejado: campo(data, 'localDesejado', 'feira', 'mercado', 'nomeFeira', 'local') || origem.servico,
        citizenId: protocol.citizenId || null,
        titularNome: origem.citizen?.name || campo(data, 'nome', 'nomeCompleto') || 'Cidadão',
        documento: campo(data, 'cnpj', 'cpf') || origem.citizen?.cpf || null,
        telefone: campo(data, 'telefone') || origem.citizen?.phone || null,
        atividade: campo(data, 'atividade', 'produtos', 'tipoProduto', 'oQueVende', 'descricao'),
        historico: comEvento(null, 'Pedido recebido') as any,
      },
    });
  }

  // ----------------------------------------------------------------- espaços
  async listEspacos(scope: AppScope) {
    return prisma.espacoComercial.findMany({
      where: { ...scopeWhere(scope), status: { not: 'INATIVO' } },
      include: { permissoes: { where: { status: 'ATIVA' }, select: { id: true, numero: true, titularNome: true, validade: true, atividade: true } } },
      orderBy: [{ local: 'asc' }, { identificacao: 'asc' }],
      take: 1000,
    });
  }

  async saveEspaco(scope: AppScope, id: string | null, data: any) {
    const local = String(data?.local || '').trim();
    const identificacao = String(data?.identificacao || '').trim();
    if (!local || !identificacao) throw new Error('Informe a feira/mercado e a identificação (ex.: Box 12)');
    const campos = {
      local,
      identificacao,
      tipo: TIPOS_ESPACO.includes(data.tipo) ? data.tipo : 'BOX',
      diaFuncionamento: data.diaFuncionamento || null,
      observacoes: data.observacoes || null,
    };
    if (id) {
      const atual = await prisma.espacoComercial.findFirst({ where: { id, ...scopeWhere(scope) } });
      if (!atual) throw new Error('Espaço não encontrado');
      const desativar = data.status === 'INATIVO';
      if (desativar && atual.status === 'OCUPADO') throw new Error('Revogue a permissão antes de desativar o espaço');
      return prisma.espacoComercial.update({ where: { id }, data: { ...campos, ...(desativar ? { status: 'INATIVO' } : {}) } });
    }
    const repetido = await prisma.espacoComercial.findFirst({ where: { local, identificacao, status: { not: 'INATIVO' } }, select: { id: true } });
    if (repetido) throw new Error(`Já existe "${identificacao}" em ${local}`);
    return prisma.espacoComercial.create({ data: { ...campos, departmentCode: pickDepartment(scope, FEIRAS_DEPARTMENTS, data?.departmentCode) } });
  }

  // -------------------------------------------------------------- permissões
  async listPermissoes(scope: AppScope, filters: { status?: string; pendentes?: boolean }) {
    const agora = new Date();
    const itens = await prisma.permissaoUsoEspaco.findMany({
      where: {
        ...scopeWhere(scope),
        ...(filters.pendentes ? { status: 'AGUARDANDO' } : filters.status === 'VENCIDA' ? { status: 'ATIVA', validade: { lt: agora } } : filters.status ? { status: filters.status } : {}),
      },
      include: { espaco: { select: { id: true, local: true, identificacao: true, tipo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    const numeros = await numerosDosPedidos(itens.map((i) => i.protocolId));
    return itens.map((i) => ({ ...i, situacao: situacaoDaPermissao(i.status, i.validade, agora), protocolNumber: i.protocolId ? numeros.get(i.protocolId) || null : null }));
  }

  async conceder(id: string, scope: AppScope, userId: string, data: { espacoId?: string; validade?: string; mensagem?: string }) {
    const pedido = await this.permissao(id, scope);
    if (pedido.status !== 'AGUARDANDO') throw new Error('Este pedido já foi decidido');
    if (!data.validade) throw new Error('Informe até quando vale');
    const validade = parseBrasiliaDateTime(String(data.validade));
    if (Number.isNaN(validade.getTime()) || validade.getTime() < Date.now()) throw new Error('A validade tem de ser uma data futura');

    let espaco: { id: string; local: string; identificacao: string } | null = null;
    if (data.espacoId) {
      const encontrado = await prisma.espacoComercial.findFirst({ where: { id: data.espacoId, ...scopeWhere(scope) } });
      if (!encontrado) throw new Error('Espaço não encontrado');
      if (encontrado.status !== 'LIVRE') throw new Error(`${encontrado.identificacao} não está livre`);
      espaco = encontrado;
    } else if (precisaDeEspaco(pedido.tipoPedido)) {
      throw new Error('Escolha o espaço (box, banca ou ponto)');
    }

    // relocação: encerra a permissão atual da pessoa e libera o espaço antigo
    let anterior: string | null = null;
    if (pedido.tipoPedido === 'RELOCACAO' && pedido.citizenId) {
      const atual = await prisma.permissaoUsoEspaco.findFirst({ where: { citizenId: pedido.citizenId, status: 'ATIVA', id: { not: id } }, include: { espaco: true } });
      if (atual) {
        await prisma.permissaoUsoEspaco.update({ where: { id: atual.id }, data: { status: 'ENCERRADA', historico: comEvento(atual.historico, `Trocado para ${espaco?.identificacao || 'outro espaço'}`, userId) as any } });
        if (atual.espacoId) await prisma.espacoComercial.update({ where: { id: atual.espacoId }, data: { status: 'LIVRE' } });
        anterior = atual.espaco ? `${atual.espaco.identificacao} (${atual.espaco.local})` : null;
      }
    }

    if (espaco) await prisma.espacoComercial.update({ where: { id: espaco.id }, data: { status: 'OCUPADO' } });
    const onde = espaco ? `${espaco.identificacao} — ${espaco.local}` : pedido.localDesejado || 'a feira';
    const atualizado = await prisma.permissaoUsoEspaco.update({
      where: { id },
      data: { status: 'ATIVA', espacoId: espaco?.id || null, validade, historico: comEvento(pedido.historico, `Concedida: ${onde} até ${dataBrasilia(validade)}`, userId) as any },
    });
    const base =
      pedido.tipoPedido === 'INSCRICAO_FEIRA'
        ? `Inscrição aprovada para ${onde}, válida até ${dataBrasilia(validade)}.`
        : pedido.tipoPedido === 'RELOCACAO'
          ? `Mudança de ponto aprovada: agora você está em ${onde}${anterior ? ` (antes: ${anterior})` : ''}, válida até ${dataBrasilia(validade)}.`
          : `Permissão de uso concedida: ${onde}, válida até ${dataBrasilia(validade)}.`;
    await concludeProtocolFromApp({
      protocolId: pedido.protocolId,
      app: APP,
      actorId: userId,
      outcome: 'DEFERIDO',
      message: [base, `Número da permissão: ${pedido.numero}.`, String(data.mensagem || '').trim()].filter(Boolean).join(' '),
    });
    return atualizado;
  }

  async recusar(id: string, scope: AppScope, userId: string, mensagem: string) {
    const pedido = await this.permissao(id, scope);
    if (pedido.status !== 'AGUARDANDO') throw new Error('Este pedido já foi decidido');
    const texto = String(mensagem || '').trim();
    if (!texto) throw new Error('Escreva o motivo para o cidadão');
    const atualizado = await prisma.permissaoUsoEspaco.update({ where: { id }, data: { status: 'RECUSADA', historico: comEvento(pedido.historico, `Recusada: ${texto}`, userId) as any } });
    await concludeProtocolFromApp({ protocolId: pedido.protocolId, app: APP, actorId: userId, message: texto, outcome: 'INDEFERIDO' });
    return atualizado;
  }

  /** Tira a permissão (desistência, irregularidade) e libera o espaço. */
  async revogar(id: string, scope: AppScope, userId: string, motivo: string) {
    const permissao = await this.permissao(id, scope);
    if (permissao.status !== 'ATIVA') throw new Error('Só dá para revogar uma permissão ativa');
    const texto = String(motivo || '').trim();
    if (!texto) throw new Error('Escreva o motivo');
    if (permissao.espacoId) await prisma.espacoComercial.update({ where: { id: permissao.espacoId }, data: { status: 'LIVRE' } });
    return prisma.permissaoUsoEspaco.update({ where: { id }, data: { status: 'REVOGADA', historico: comEvento(permissao.historico, `Revogada: ${texto}`, userId) as any } });
  }

  /** Renova a validade de uma permissão ativa (vencida ou não). */
  async renovar(id: string, scope: AppScope, userId: string, validadeTexto: string) {
    const permissao = await this.permissao(id, scope);
    if (permissao.status !== 'ATIVA') throw new Error('Só dá para renovar uma permissão ativa');
    const validade = parseBrasiliaDateTime(String(validadeTexto || ''));
    if (Number.isNaN(validade.getTime()) || validade.getTime() < Date.now()) throw new Error('A nova validade tem de ser uma data futura');
    return prisma.permissaoUsoEspaco.update({ where: { id }, data: { validade, historico: comEvento(permissao.historico, `Renovada até ${dataBrasilia(validade)}`, userId) as any } });
  }

  async stats(scope: AppScope) {
    const escopo = scopeWhere(scope);
    const agora = new Date();
    const [aguardando, ativas, vencidas, livres, ocupados] = await Promise.all([
      prisma.permissaoUsoEspaco.count({ where: { ...escopo, status: 'AGUARDANDO' } }),
      prisma.permissaoUsoEspaco.count({ where: { ...escopo, status: 'ATIVA', OR: [{ validade: null }, { validade: { gte: agora } }] } }),
      prisma.permissaoUsoEspaco.count({ where: { ...escopo, status: 'ATIVA', validade: { lt: agora } } }),
      prisma.espacoComercial.count({ where: { ...escopo, status: 'LIVRE' } }),
      prisma.espacoComercial.count({ where: { ...escopo, status: 'OCUPADO' } }),
    ]);
    return { aguardando, ativas, vencidas, espacosLivres: livres, espacosOcupados: ocupados };
  }
}

export default new FeirasService();
