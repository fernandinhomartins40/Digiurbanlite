/**
 * Pedidos de sementes, mudas, adubo e calcário feitos no portal (2026-10-09).
 *
 * O estoque e a entrega já existiam (Sementes e Mudas), mas o pedido do
 * cidadão ficava na fila do protocolo. Agora chega aqui; "Entregar" baixa do
 * estoque (mesma regra da distribuição: não entrega mais do que tem), liga ao
 * produtor (cria o cadastro básico se a pessoa ainda não tem) e encerra o pedido.
 */

import { prisma } from '../../lib/prisma';
import { concludeProtocolFromApp } from '../apps/app-protocol-bridge.service';
import { campo, origemDoPedido } from '../apps-gerais/common';
import agriculturaService from './agricultura.service';

const APP = 'Sementes e Mudas';
export const TIPOS_INSUMO = ['SEMENTE', 'MUDA', 'ADUBO', 'CALCARIO', 'OUTRO'];

function semAcento(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Tipo do insumo pelo nome do serviço ou pelo que a pessoa escreveu. */
export function tipoDoInsumo(texto: string): string {
  const n = semAcento(texto || '');
  if (/calcario/.test(n)) return 'CALCARIO';
  if (/adubo|esterco|fertiliz|composto/.test(n)) return 'ADUBO';
  if (/\bmudas?\b/.test(n)) return 'MUDA';
  if (/sement/.test(n)) return 'SEMENTE';
  return 'OUTRO';
}

class PedidoInsumoService {
  async fromPortal(protocol: { id: string; citizenId?: string | null; customData?: any }) {
    if (await prisma.pedidoInsumoAgricola.findFirst({ where: { protocolId: protocol.id }, select: { id: true } })) return;
    const origem = await origemDoPedido(protocol.id);
    const data = protocol.customData || {};
    const item = campo(data, 'tipoSemente', 'tipoMuda', 'especieDesejada', 'item', 'insumo', 'cultura', 'tipoInsumo');
    const produtor = protocol.citizenId ? await prisma.produtorRural.findFirst({ where: { citizenId: protocol.citizenId }, select: { id: true } }) : null;
    const area = Number(String(campo(data, 'areaPlantio', 'areaHectares', 'area') || '').replace(',', '.'));
    await prisma.pedidoInsumoAgricola.create({
      data: {
        protocolId: protocol.id,
        citizenId: protocol.citizenId || null,
        produtorId: produtor?.id || null,
        nome: origem.citizen?.name || 'Produtor',
        telefone: campo(data, 'telefone') || origem.citizen?.phone || null,
        tipo: tipoDoInsumo(`${origem.servico} ${item || ''}`),
        item: [item, campo(data, 'especieDesejada') !== item ? campo(data, 'especieDesejada') : undefined].filter(Boolean).join(' — ') || null,
        quantidade: campo(data, 'quantidadeDesejada', 'quantidadeMudas', 'quantidade'),
        areaHectares: Number.isFinite(area) && area > 0 ? area : null,
        finalidade: campo(data, 'finalidade', 'epocaPlantio', 'observacoes'),
      },
    });
  }

  async list(filters: { status?: string; pendentes?: boolean }) {
    const itens = await prisma.pedidoInsumoAgricola.findMany({
      where: filters.pendentes ? { status: 'AGUARDANDO' } : filters.status ? { status: filters.status } : {},
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    const ids = itens.map((i) => i.protocolId).filter(Boolean) as string[];
    const protocolos = ids.length ? await prisma.protocolSimplified.findMany({ where: { id: { in: ids } }, select: { id: true, number: true } }) : [];
    const numero = new Map(protocolos.map((p) => [p.id, p.number]));
    return itens.map((i) => ({ ...i, protocolNumber: i.protocolId ? numero.get(i.protocolId) || null : null }));
  }

  /** Produtor do pedido; quem ainda não tem cadastro ganha o básico (nome, CPF, telefone). */
  private async produtorDoPedido(pedido: { produtorId: string | null; citizenId: string | null; nome: string; telefone: string | null }) {
    if (pedido.produtorId) return pedido.produtorId;
    if (!pedido.citizenId) throw new Error('Pedido sem cidadão: cadastre o produtor antes de entregar');
    const existente = await prisma.produtorRural.findFirst({ where: { citizenId: pedido.citizenId }, select: { id: true } });
    if (existente) return existente.id;
    const citizen = await prisma.citizen.findFirst({ where: { id: pedido.citizenId }, select: { cpf: true, email: true } });
    if (!citizen?.cpf) throw new Error('Cidadão sem CPF: cadastre o produtor antes de entregar');
    const criado = await prisma.produtorRural.create({
      data: { citizenId: pedido.citizenId, cpf: citizen.cpf, nome: pedido.nome, celular: pedido.telefone, email: citizen.email || null, observacoes: 'Cadastro básico criado na entrega de insumos' },
    });
    return criado.id;
  }

  async entregar(id: string, userId: string, data: { estoqueId?: string; quantidade?: number; mensagem?: string }) {
    const pedido = await prisma.pedidoInsumoAgricola.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status !== 'AGUARDANDO') throw new Error('Este pedido já foi decidido');
    if (!data.estoqueId) throw new Error('Escolha o item do estoque');
    const quantidade = Number(data.quantidade);
    if (!(quantidade > 0)) throw new Error('Informe a quantidade entregue');
    const produtorId = await this.produtorDoPedido(pedido);
    const distribuicao = await agriculturaService.createDistribuicao({
      estoqueId: data.estoqueId,
      produtorId,
      quantidade,
      responsavelId: userId,
      protocolId: pedido.protocolId,
      observacoes: `Pedido do portal${pedido.item ? `: ${pedido.item}` : ''}`,
    });
    const estoque = await prisma.estoqueSemente.findFirst({ where: { id: data.estoqueId }, select: { cultura: true, variedade: true, unidadeMedida: true } });
    const oQue = `${quantidade} ${estoque?.unidadeMedida || ''} de ${[estoque?.cultura, estoque?.variedade].filter(Boolean).join(' ')}`.replace(/\s+/g, ' ').trim();
    const resposta = [`Entregue: ${oQue}.`, String(data.mensagem || '').trim()].filter(Boolean).join(' ');
    const atualizado = await prisma.pedidoInsumoAgricola.update({ where: { id }, data: { status: 'ENTREGUE', produtorId, distribuicaoId: distribuicao.id, resposta } });
    await concludeProtocolFromApp({ protocolId: pedido.protocolId, app: APP, actorId: userId, message: resposta, outcome: 'DEFERIDO' });
    return atualizado;
  }

  async recusar(id: string, userId: string, mensagem: string) {
    const pedido = await prisma.pedidoInsumoAgricola.findFirst({ where: { id } });
    if (!pedido) throw new Error('Pedido não encontrado');
    if (pedido.status !== 'AGUARDANDO') throw new Error('Este pedido já foi decidido');
    const texto = String(mensagem || '').trim();
    if (!texto) throw new Error('Escreva o motivo para o cidadão');
    const atualizado = await prisma.pedidoInsumoAgricola.update({ where: { id }, data: { status: 'RECUSADO', resposta: texto } });
    await concludeProtocolFromApp({ protocolId: pedido.protocolId, app: APP, actorId: userId, message: texto, outcome: 'INDEFERIDO' });
    return atualizado;
  }
}

export default new PedidoInsumoService();
