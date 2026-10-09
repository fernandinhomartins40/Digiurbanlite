/**
 * Balcão de Empregos — Desenvolvimento Econômico.
 * Fase 3 da auditoria de 2026-10-08 (a secretaria não tinha app).
 *
 * Currículos (do portal ou do balcão) × vagas das empresas. Para cada vaga o
 * sistema SUGERE candidatos por uma nota simples e explicável (sem IA): área,
 * escolaridade e palavras em comum. Quem encaminha é a equipe; o trabalhador
 * recebe o aviso com o contato da empresa.
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

const ESCOLARIDADES = [
  'Fundamental Incompleto',
  'Fundamental Completo',
  'Médio Incompleto',
  'Médio Completo',
  'Superior Incompleto',
  'Superior Completo',
  'Pós-Graduação',
];

const norm = (value?: string | null) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const PALAVRAS_VAZIAS = new Set(['para', 'com', 'sem', 'que', 'uma', 'por', 'dos', 'das', 'nos', 'nas', 'the', 'and', 'area', 'experiencia', 'vaga', 'empresa', 'trabalho', 'trabalhar', 'servico', 'servicos']);

/** Palavras úteis de um texto (≥ 4 letras, sem acento, sem palavras de enchimento). */
export function palavras(texto?: string | null): string[] {
  return Array.from(new Set(norm(texto).split(/[^a-z0-9]+/).filter((p) => p.length >= 4 && !PALAVRAS_VAZIAS.has(p))));
}

/** Posição da escolaridade na escada (-1 = não informada) */
export function nivelEscolaridade(valor?: string | null): number {
  const alvo = norm(valor);
  return alvo ? ESCOLARIDADES.findIndex((e) => norm(e) === alvo) : -1;
}

export interface VagaLike {
  titulo?: string | null;
  descricao?: string | null;
  area?: string | null;
  escolaridadeMinima?: string | null;
  pcd?: boolean | null;
}
export interface CurriculoLike {
  areaInteresse?: string | null;
  experiencia?: string | null;
  habilidades?: string | null;
  escolaridade?: string | null;
  disponibilidade?: boolean | null;
  pcd?: boolean | null;
}

/**
 * Nota de 0 a 100 de um currículo para uma vaga, com os motivos em português.
 * Escolaridade abaixo da mínima zera a nota (a vaga exige).
 */
export function notaDoCandidato(vaga: VagaLike, curriculo: CurriculoLike): { nota: number; motivos: string[] } {
  const motivos: string[] = [];
  const minimo = nivelEscolaridade(vaga.escolaridadeMinima);
  const tem = nivelEscolaridade(curriculo.escolaridade);
  if (minimo >= 0 && tem >= 0 && tem < minimo) return { nota: 0, motivos: ['Escolaridade abaixo da pedida'] };

  let nota = 0;
  const daVaga = new Set([...palavras(vaga.titulo), ...palavras(vaga.area), ...palavras(vaga.descricao)]);
  const interesse = palavras(curriculo.areaInteresse);
  const vivencia = [...palavras(curriculo.experiencia), ...palavras(curriculo.habilidades)];

  const interesseComum = interesse.filter((p) => daVaga.has(p));
  if (interesseComum.length) {
    nota += 45;
    motivos.push(`Quer trabalhar com: ${interesseComum.slice(0, 3).join(', ')}`);
  }
  const vivenciaComum = Array.from(new Set(vivencia.filter((p) => daVaga.has(p))));
  if (vivenciaComum.length) {
    nota += Math.min(30, vivenciaComum.length * 10);
    motivos.push(`Experiência em: ${vivenciaComum.slice(0, 3).join(', ')}`);
  }
  if (minimo >= 0 && tem >= minimo) {
    nota += 15;
    motivos.push('Tem a escolaridade pedida');
  }
  if (curriculo.disponibilidade) {
    nota += 5;
    motivos.push('Pode começar já');
  }
  if (vaga.pcd && curriculo.pcd) {
    nota += 5;
    motivos.push('Vaga para pessoa com deficiência');
  }
  return { nota: Math.min(100, nota), motivos };
}

const texto = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

class EmpregoService {
  // ------------------------------------------------------------------ currículos
  async listCurriculos(filters?: { status?: string; busca?: string }) {
    const busca = filters?.busca?.trim();
    return prisma.curriculoTrabalhador.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(busca
          ? {
              OR: [
                { nome: { contains: busca, mode: 'insensitive' as const } },
                { areaInteresse: { contains: busca, mode: 'insensitive' as const } },
                { experiencia: { contains: busca, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { encaminhamentos: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  /** Um currículo ativo por pessoa: novo cadastro da mesma pessoa atualiza o que existe. */
  async saveCurriculo(id: string | null, data: any) {
    const nome = texto(data?.nome);
    if (!nome) throw new Error('Informe o nome');
    const cpf = String(data?.cpf || '').replace(/\D/g, '') || null;
    const campos = {
      nome,
      cpf,
      citizenId: data.citizenId || null,
      telefone: texto(data.telefone),
      email: texto(data.email),
      escolaridade: texto(data.escolaridade),
      areaInteresse: texto(data.areaInteresse),
      experiencia: texto(data.experiencia),
      habilidades: texto(data.habilidades),
      disponibilidade: data.disponibilidade !== false,
      pcd: data.pcd === true,
      observacoes: texto(data.observacoes),
      ...(data.status ? { status: String(data.status) } : {}),
      ...(data.protocolId ? { protocolId: String(data.protocolId) } : {}),
    };
    if (id) return prisma.curriculoTrabalhador.update({ where: { id }, data: campos });
    const existente =
      (campos.citizenId && (await prisma.curriculoTrabalhador.findFirst({ where: { citizenId: campos.citizenId } }))) ||
      (cpf && (await prisma.curriculoTrabalhador.findFirst({ where: { cpf } }))) ||
      null;
    if (existente) {
      const { protocolId: _p, ...semProtocolo } = campos as any;
      return prisma.curriculoTrabalhador.update({
        where: { id: existente.id },
        data: { ...semProtocolo, status: 'ATIVO', ...(existente.protocolId ? {} : campos.protocolId ? { protocolId: campos.protocolId } : {}) },
      });
    }
    return prisma.curriculoTrabalhador.create({ data: campos });
  }

  // ----------------------------------------------------------------------- vagas
  async listVagas(filters?: { status?: string }) {
    return prisma.vagaEmprego.findMany({
      where: filters?.status ? { status: filters.status } : {},
      include: { _count: { select: { encaminhamentos: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    });
  }

  async saveVaga(id: string | null, data: any) {
    const empresa = texto(data?.empresa);
    const titulo = texto(data?.titulo);
    if (!empresa || !titulo) throw new Error('Informe a empresa e o nome da vaga');
    const campos = {
      empresa,
      titulo,
      descricao: texto(data.descricao),
      area: texto(data.area),
      escolaridadeMinima: texto(data.escolaridadeMinima),
      salario: texto(data.salario),
      quantidade: Number(data.quantidade) > 0 ? Number(data.quantidade) : 1,
      tipoContrato: texto(data.tipoContrato),
      local: texto(data.local),
      contato: texto(data.contato),
      pcd: data.pcd === true,
      ...(data.status ? { status: String(data.status) } : {}),
    };
    return id ? prisma.vagaEmprego.update({ where: { id }, data: campos }) : prisma.vagaEmprego.create({ data: campos });
  }

  /** Vaga com quem já foi encaminhado e a lista de candidatos sugeridos (maior nota primeiro). */
  async vagaComCandidatos(id: string) {
    const vaga = await prisma.vagaEmprego.findFirst({
      where: { id },
      include: { encaminhamentos: { include: { curriculo: true }, orderBy: { createdAt: 'desc' } } },
    });
    if (!vaga) throw new Error('Vaga não encontrada');
    const jaEncaminhados = new Set(vaga.encaminhamentos.map((e) => e.curriculoId));
    const ativos = await prisma.curriculoTrabalhador.findMany({ where: { status: 'ATIVO' }, take: 2000 });
    const sugestoes = ativos
      .filter((c) => !jaEncaminhados.has(c.id))
      .map((curriculo) => ({ curriculo, ...notaDoCandidato(vaga, curriculo) }))
      .filter((s) => s.nota > 0)
      .sort((a, b) => b.nota - a.nota)
      .slice(0, 30);
    return { ...vaga, sugestoes };
  }

  // ------------------------------------------------------------ encaminhamentos
  async encaminhar(vagaId: string, curriculoId: string, userId: string) {
    const [vaga, curriculo] = await Promise.all([
      prisma.vagaEmprego.findFirst({ where: { id: vagaId } }),
      prisma.curriculoTrabalhador.findFirst({ where: { id: curriculoId } }),
    ]);
    if (!vaga || !curriculo) throw new Error('Vaga ou currículo não encontrado');
    if (vaga.status !== 'ABERTA') throw new Error('Esta vaga não está mais aberta');
    if (await prisma.encaminhamentoEmprego.findFirst({ where: { vagaId, curriculoId }, select: { id: true } })) {
      throw new Error('Esta pessoa já foi encaminhada para esta vaga');
    }
    const encaminhamento = await prisma.encaminhamentoEmprego.create({ data: { vagaId, curriculoId, criadoPor: userId } });

    // Aviso no portal para o trabalhador (não-fatal; sem e-mail)
    if (curriculo.citizenId) {
      try {
        const { default: notificationService } = await import('../notification.service');
        await notificationService.notify({
          recipientType: 'citizen',
          recipientId: curriculo.citizenId,
          type: 'PROTOCOL_MESSAGE' as any,
          title: 'Balcão de Empregos: você foi indicado para uma vaga',
          message: `Vaga de ${vaga.titulo} na empresa ${vaga.empresa}${vaga.local ? ` (${vaga.local})` : ''}.${vaga.contato ? ` Procure: ${vaga.contato}.` : ' Procure o Balcão de Empregos para saber como se apresentar.'}`,
          data: { url: '/cidadao' },
          priority: 'normal',
        } as any);
      } catch (error) {
        logger.warn('[emprego] falha ao avisar o trabalhador (não-fatal)', error);
      }
    }
    return encaminhamento;
  }

  /** Resultado do encaminhamento. Contratado = currículo sai da busca e a vaga fecha quando todas forem preenchidas. */
  async resultado(encaminhamentoId: string, status: string, observacao?: string) {
    if (!['CONTRATADO', 'NAO_SELECIONADO', 'NAO_COMPARECEU', 'ENCAMINHADO'].includes(status)) throw new Error('Resultado inválido');
    const encaminhamento = await prisma.encaminhamentoEmprego.findFirst({ where: { id: encaminhamentoId } });
    if (!encaminhamento) throw new Error('Encaminhamento não encontrado');
    const atualizado = await prisma.encaminhamentoEmprego.update({
      where: { id: encaminhamentoId },
      data: { status, observacao: texto(observacao) },
    });
    if (status === 'CONTRATADO') {
      await prisma.curriculoTrabalhador.update({ where: { id: encaminhamento.curriculoId }, data: { status: 'EMPREGADO' } });
      const [vaga, contratados] = await Promise.all([
        prisma.vagaEmprego.findFirst({ where: { id: encaminhamento.vagaId } }),
        prisma.encaminhamentoEmprego.count({ where: { vagaId: encaminhamento.vagaId, status: 'CONTRATADO' } }),
      ]);
      if (vaga && contratados >= vaga.quantidade && vaga.status === 'ABERTA') {
        await prisma.vagaEmprego.update({ where: { id: vaga.id }, data: { status: 'PREENCHIDA' } });
      }
    }
    return atualizado;
  }

  async stats() {
    const [curriculosAtivos, empregados, vagasAbertas, encaminhados, contratados] = await Promise.all([
      prisma.curriculoTrabalhador.count({ where: { status: 'ATIVO' } }),
      prisma.curriculoTrabalhador.count({ where: { status: 'EMPREGADO' } }),
      prisma.vagaEmprego.count({ where: { status: 'ABERTA' } }),
      prisma.encaminhamentoEmprego.count(),
      prisma.encaminhamentoEmprego.count({ where: { status: 'CONTRATADO' } }),
    ]);
    return { curriculosAtivos, empregados, vagasAbertas, encaminhados, contratados };
  }
}

export const ESCOLARIDADES_EMPREGO = ESCOLARIDADES;
export default new EmpregoService();
