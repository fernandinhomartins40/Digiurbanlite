import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger.config';

/**
 * App Espaços & Oficinas Culturais (Fase 3, blueprints B5 + B6 + B4-lite)
 * — Secretaria de Cultura.
 *
 * B6 Oficinas: oficina (categoria/vagas/horários) ← matrícula (de protocolo ou
 * manual; INSCRITA → MATRICULADA com controle de vagas | LISTA_ESPERA) +
 * frequência por aula (1 registro por oficina+dia, presentes = matriculaIds).
 * B5 Reservas: compartilha ReservaEspaco com Esportes (area = CULTURA);
 * o conflito de horário é verificado GLOBALMENTE por espaço/dia — um espaço
 * confirmado para qualquer área bloqueia o horário.
 * B4-lite Editais: edital ← projeto (de protocolo ou manual) com pareceres;
 * aprovação/reprovação conclui o protocolo de origem (NÃO-FATAL).
 * B3-lite Empréstimos: solicitação → emprestado → devolvido.
 */

const CATEGORIAS_OFICINA = [
  'MUSICA',
  'DANCA',
  'TEATRO',
  'ARTES_VISUAIS',
  'ARTESANATO',
  'LITERATURA',
  'AUDIOVISUAL',
  'OUTRA',
];

class CulturaService {
  // ---------------------------------------------------------------- oficinas

  async listOficinas(incluirInativas = false) {
    const oficinas = await prisma.oficinaCultural.findMany({
      where: incluirInativas ? {} : { isActive: true },
      include: { _count: { select: { matriculas: { where: { status: 'MATRICULADA' } } } } },
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    });
    const espacoIds = Array.from(new Set(oficinas.map((o) => o.espacoId).filter(Boolean))) as string[];
    const espacos = espacoIds.length
      ? await prisma.espacoPublico.findMany({
          where: { id: { in: espacoIds } },
          select: { id: true, nome: true },
        })
      : [];
    const espacoPorId = new Map(espacos.map((e) => [e.id, e]));
    return oficinas.map((o) => ({
      ...o,
      matriculados: o._count.matriculas,
      espaco: o.espacoId ? espacoPorId.get(o.espacoId) || null : null,
    }));
  }

  async createOficina(data: any) {
    if (!data?.nome) throw new Error('nome é obrigatório');
    if (!data?.categoria || !CATEGORIAS_OFICINA.includes(data.categoria)) {
      throw new Error(`categoria é obrigatória (${CATEGORIAS_OFICINA.join(', ')})`);
    }
    const jaExiste = await prisma.oficinaCultural.findFirst({ where: { nome: data.nome } });
    if (jaExiste) throw new Error(`Já existe oficina "${data.nome}"`);
    return prisma.oficinaCultural.create({
      data: {
        nome: data.nome,
        categoria: data.categoria,
        atividade: data.atividade,
        instrutor: data.instrutor,
        espacoId: data.espacoId,
        diasHorarios: data.diasHorarios,
        vagas: data.vagas != null ? Number(data.vagas) : null,
      },
    });
  }

  async updateOficina(id: string, data: any) {
    const oficina = await prisma.oficinaCultural.findFirst({ where: { id } });
    if (!oficina) throw new Error('Oficina não encontrada');
    return prisma.oficinaCultural.update({
      where: { id: oficina.id },
      data: {
        ...(data.nome ? { nome: data.nome } : {}),
        ...(data.categoria && CATEGORIAS_OFICINA.includes(data.categoria)
          ? { categoria: data.categoria }
          : {}),
        ...(data.atividade !== undefined ? { atividade: data.atividade } : {}),
        ...(data.instrutor !== undefined ? { instrutor: data.instrutor } : {}),
        ...(data.espacoId !== undefined ? { espacoId: data.espacoId || null } : {}),
        ...(data.diasHorarios !== undefined ? { diasHorarios: data.diasHorarios } : {}),
        ...(data.vagas !== undefined ? { vagas: data.vagas != null ? Number(data.vagas) : null } : {}),
        ...(data.isActive !== undefined ? { isActive: !!data.isActive } : {}),
      },
    });
  }

  // -------------------------------------------------------------- matrículas

  async listMatriculas(filters?: { oficinaId?: string; status?: string; busca?: string }) {
    return prisma.matriculaOficina.findMany({
      where: {
        ...(filters?.oficinaId ? { oficinaId: filters.oficinaId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.busca
          ? {
              OR: [
                { nome: { contains: filters.busca, mode: 'insensitive' as const } },
                { responsavelNome: { contains: filters.busca, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: { oficina: { select: { id: true, nome: true, categoria: true } } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async createMatricula(data: any) {
    return prisma.matriculaOficina.create({
      data: {
        protocolId: data.protocolId,
        oficinaId: data.oficinaId,
        atividadePretendida: data.atividadePretendida,
        nome: data.nome,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
        responsavelNome: data.responsavelNome,
        telefone: data.telefone,
        citizenId: data.citizenId,
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
  }

  private async vagasDisponiveis(oficinaId: string) {
    const oficina = await prisma.oficinaCultural.findFirst({ where: { id: oficinaId } });
    if (!oficina) throw new Error('Oficina não encontrada');
    if (oficina.vagas == null) return { oficina, disponiveis: null };
    const ocupadas = await prisma.matriculaOficina.count({
      where: { oficinaId, status: 'MATRICULADA' },
    });
    return { oficina, disponiveis: oficina.vagas - ocupadas };
  }

  /** Matricula na oficina respeitando vagas; sem vaga vai para LISTA_ESPERA. */
  async matricular(matriculaId: string, oficinaId: string) {
    const matricula = await prisma.matriculaOficina.findFirst({ where: { id: matriculaId } });
    if (!matricula) throw new Error('Matrícula não encontrada');
    if (['CANCELADA', 'DESLIGADA'].includes(matricula.status)) {
      throw new Error('Matrícula encerrada');
    }
    const { disponiveis } = await this.vagasDisponiveis(oficinaId);
    const semVaga = disponiveis != null && disponiveis <= 0;
    const atualizada = await prisma.matriculaOficina.update({
      where: { id: matricula.id },
      data: { oficinaId, status: semVaga ? 'LISTA_ESPERA' : 'MATRICULADA' },
    });
    if (!semVaga) {
      await this.concluirProtocolo(atualizada.protocolId, 'Participante matriculado');
    }
    return atualizada;
  }

  async atualizarMatricula(id: string, data: any) {
    const matricula = await prisma.matriculaOficina.findFirst({ where: { id } });
    if (!matricula) throw new Error('Matrícula não encontrada');
    return prisma.matriculaOficina.update({
      where: { id: matricula.id },
      data: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.responsavelNome !== undefined ? { responsavelNome: data.responsavelNome } : {}),
        ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
        ...(data.status && ['DESLIGADA', 'CANCELADA'].includes(data.status)
          ? { status: data.status }
          : {}),
      },
    });
  }

  // -------------------------------------------------------------- frequência

  /** Registra (ou substitui) a chamada de uma oficina num dia. */
  async registrarFrequencia(
    oficinaId: string,
    params: { data: string; presentes: string[]; registradoPor?: string }
  ) {
    const oficina = await prisma.oficinaCultural.findFirst({ where: { id: oficinaId } });
    if (!oficina) throw new Error('Oficina não encontrada');
    if (!params?.data) throw new Error('data é obrigatória');
    const dia = new Date(`${params.data}T00:00:00.000Z`);
    const presentes = Array.isArray(params.presentes) ? params.presentes.map(String) : [];
    const existente = await prisma.frequenciaOficina.findFirst({
      where: { oficinaId, data: dia },
    });
    if (existente) {
      return prisma.frequenciaOficina.update({
        where: { id: existente.id },
        data: { presentes, registradoPor: params.registradoPor },
      });
    }
    return prisma.frequenciaOficina.create({
      data: { oficinaId, data: dia, presentes, registradoPor: params.registradoPor },
    });
  }

  async listFrequencias(oficinaId: string) {
    return prisma.frequenciaOficina.findMany({
      where: { oficinaId },
      orderBy: { data: 'desc' },
      take: 60,
    });
  }

  // ------------------------------------------------------------------ espaços

  async listEspacos() {
    return prisma.espacoPublico.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' },
    });
  }

  // ----------------------------------------------------------------- reservas

  async listReservas(filters?: { espacoId?: string; status?: string; data?: string }) {
    const reservas = await prisma.reservaEspaco.findMany({
      where: {
        area: 'CULTURA',
        ...(filters?.espacoId ? { espacoId: filters.espacoId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.data ? { data: new Date(`${filters.data}T00:00:00.000Z`) } : {}),
      },
      orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      take: 500,
    });
    const espacoIds = Array.from(new Set(reservas.map((r) => r.espacoId).filter(Boolean))) as string[];
    const espacos = espacoIds.length
      ? await prisma.espacoPublico.findMany({
          where: { id: { in: espacoIds } },
          select: { id: true, nome: true },
        })
      : [];
    const espacoPorId = new Map(espacos.map((e) => [e.id, e]));
    return reservas.map((r) => ({
      ...r,
      espaco: r.espacoId ? espacoPorId.get(r.espacoId) || null : null,
    }));
  }

  async createReserva(data: any) {
    return prisma.reservaEspaco.create({
      data: {
        protocolId: data.protocolId,
        area: 'CULTURA',
        espacoId: data.espacoId,
        solicitanteNome: data.solicitanteNome,
        citizenId: data.citizenId,
        data: data.data ? new Date(`${String(data.data).slice(0, 10)}T00:00:00.000Z`) : null,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        finalidade: data.finalidade,
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
  }

  async atualizarReserva(id: string, data: any) {
    const reserva = await prisma.reservaEspaco.findFirst({ where: { id, area: 'CULTURA' } });
    if (!reserva) throw new Error('Reserva não encontrada');
    if (['RECUSADA', 'CANCELADA'].includes(reserva.status)) throw new Error('Reserva encerrada');
    return prisma.reservaEspaco.update({
      where: { id: reserva.id },
      data: {
        ...(data.espacoId !== undefined ? { espacoId: data.espacoId || null } : {}),
        ...(data.data !== undefined
          ? { data: data.data ? new Date(`${String(data.data).slice(0, 10)}T00:00:00.000Z`) : null }
          : {}),
        ...(data.horaInicio !== undefined ? { horaInicio: data.horaInicio } : {}),
        ...(data.horaFim !== undefined ? { horaFim: data.horaFim } : {}),
        ...(data.finalidade !== undefined ? { finalidade: data.finalidade } : {}),
        ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
      },
    });
  }

  /**
   * Confirma reserva, recusando conflito de horário no mesmo espaço/dia.
   * O conflito é GLOBAL (qualquer área): espaço confirmado está ocupado.
   */
  async confirmarReserva(id: string) {
    const reserva = await prisma.reservaEspaco.findFirst({ where: { id, area: 'CULTURA' } });
    if (!reserva) throw new Error('Reserva não encontrada');
    if (reserva.status !== 'SOLICITADA') throw new Error('Somente reservas solicitadas podem ser confirmadas');
    if (!reserva.espacoId || !reserva.data || !reserva.horaInicio || !reserva.horaFim) {
      throw new Error('Defina espaço, data e horário antes de confirmar');
    }
    const confirmadas = await prisma.reservaEspaco.findMany({
      where: { espacoId: reserva.espacoId, data: reserva.data, status: 'CONFIRMADA' },
      select: { id: true, horaInicio: true, horaFim: true },
    });
    const conflito = confirmadas.find(
      (c) =>
        c.horaInicio &&
        c.horaFim &&
        reserva.horaInicio! < c.horaFim &&
        c.horaInicio < reserva.horaFim!
    );
    if (conflito) {
      throw new Error(
        `Conflito de horário: já existe reserva confirmada ${conflito.horaInicio}-${conflito.horaFim} neste espaço`
      );
    }
    const atualizada = await prisma.reservaEspaco.update({
      where: { id: reserva.id },
      data: { status: 'CONFIRMADA' },
    });
    await this.concluirProtocolo(atualizada.protocolId, 'Reserva confirmada');
    return atualizada;
  }

  async recusarReserva(id: string, motivo?: string) {
    const reserva = await prisma.reservaEspaco.findFirst({ where: { id, area: 'CULTURA' } });
    if (!reserva) throw new Error('Reserva não encontrada');
    const atualizada = await prisma.reservaEspaco.update({
      where: { id: reserva.id },
      data: { status: 'RECUSADA', ...(motivo ? { observacoes: motivo } : {}) },
    });
    await this.concluirProtocolo(atualizada.protocolId, 'Reserva recusada');
    return atualizada;
  }

  async cancelarReserva(id: string, motivo?: string) {
    const reserva = await prisma.reservaEspaco.findFirst({ where: { id, area: 'CULTURA' } });
    if (!reserva) throw new Error('Reserva não encontrada');
    return prisma.reservaEspaco.update({
      where: { id: reserva.id },
      data: { status: 'CANCELADA', ...(motivo ? { observacoes: motivo } : {}) },
    });
  }

  // ------------------------------------------------------------------ editais

  async listEditais() {
    const editais = await prisma.editalCultural.findMany({
      include: { _count: { select: { projetos: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return editais.map((e) => ({ ...e, totalProjetos: e._count.projetos }));
  }

  async createEdital(data: any) {
    if (!data?.nome) throw new Error('nome é obrigatório');
    const jaExiste = await prisma.editalCultural.findFirst({ where: { nome: data.nome } });
    if (jaExiste) throw new Error(`Já existe edital "${data.nome}"`);
    return prisma.editalCultural.create({
      data: {
        nome: data.nome,
        categoria: data.categoria,
        descricao: data.descricao,
        dataInicioInscricoes: data.dataInicioInscricoes ? new Date(data.dataInicioInscricoes) : null,
        dataFimInscricoes: data.dataFimInscricoes ? new Date(data.dataFimInscricoes) : null,
      },
    });
  }

  async atualizarEdital(id: string, data: any) {
    const edital = await prisma.editalCultural.findFirst({ where: { id } });
    if (!edital) throw new Error('Edital não encontrado');
    return prisma.editalCultural.update({
      where: { id: edital.id },
      data: {
        ...(data.nome ? { nome: data.nome } : {}),
        ...(data.categoria !== undefined ? { categoria: data.categoria } : {}),
        ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
        ...(data.status &&
        ['INSCRICOES_ABERTAS', 'EM_ANALISE', 'RESULTADO_PUBLICADO', 'ENCERRADO', 'CANCELADO'].includes(
          data.status
        )
          ? { status: data.status }
          : {}),
      },
    });
  }

  // ----------------------------------------------------------------- projetos

  async listProjetos(filters?: { editalId?: string; status?: string; busca?: string }) {
    return prisma.projetoCultural.findMany({
      where: {
        ...(filters?.editalId ? { editalId: filters.editalId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.busca
          ? {
              OR: [
                { titulo: { contains: filters.busca, mode: 'insensitive' as const } },
                { proponente: { contains: filters.busca, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: {
        edital: { select: { id: true, nome: true } },
        pareceres: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async createProjeto(data: any) {
    return prisma.projetoCultural.create({
      data: {
        protocolId: data.protocolId,
        editalId: data.editalId,
        titulo: data.titulo,
        proponente: data.proponente,
        citizenId: data.citizenId,
        telefone: data.telefone,
        categoria: data.categoria,
        descricao: data.descricao,
        valorSolicitado: data.valorSolicitado != null ? Number(data.valorSolicitado) : null,
        dados: data.dados,
      },
    });
  }

  async atualizarProjeto(id: string, data: any) {
    const projeto = await prisma.projetoCultural.findFirst({ where: { id } });
    if (!projeto) throw new Error('Projeto não encontrado');
    if (['APROVADO', 'REPROVADO', 'CANCELADO'].includes(projeto.status)) {
      throw new Error('Projeto com situação encerrada');
    }
    return prisma.projetoCultural.update({
      where: { id: projeto.id },
      data: {
        ...(data.editalId !== undefined ? { editalId: data.editalId || null } : {}),
        ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
        ...(data.proponente !== undefined ? { proponente: data.proponente } : {}),
        ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
        ...(data.categoria !== undefined ? { categoria: data.categoria } : {}),
        ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
        ...(data.valorSolicitado !== undefined
          ? { valorSolicitado: data.valorSolicitado != null ? Number(data.valorSolicitado) : null }
          : {}),
      },
    });
  }

  async iniciarAnaliseProjeto(id: string) {
    const projeto = await prisma.projetoCultural.findFirst({ where: { id } });
    if (!projeto) throw new Error('Projeto não encontrado');
    if (projeto.status !== 'RECEBIDO') throw new Error('Somente projetos recebidos podem entrar em análise');
    return prisma.projetoCultural.update({
      where: { id: projeto.id },
      data: { status: 'EM_ANALISE' },
    });
  }

  async adicionarParecer(
    projetoId: string,
    params: { texto: string; recomendacao?: string; autorId?: string; autorNome?: string }
  ) {
    const projeto = await prisma.projetoCultural.findFirst({ where: { id: projetoId } });
    if (!projeto) throw new Error('Projeto não encontrado');
    if (!params?.texto) throw new Error('texto do parecer é obrigatório');
    return prisma.parecerProjetoCultural.create({
      data: {
        projetoId: projeto.id,
        texto: params.texto,
        recomendacao:
          params.recomendacao && ['APROVAR', 'REPROVAR', 'AJUSTES'].includes(params.recomendacao)
            ? params.recomendacao
            : null,
        autorId: params.autorId,
        autorNome: params.autorNome,
      },
    });
  }

  /** Aprova o projeto (vinculando ao edital, se informado) e conclui o protocolo. */
  async aprovarProjeto(id: string, editalId?: string) {
    const projeto = await prisma.projetoCultural.findFirst({ where: { id } });
    if (!projeto) throw new Error('Projeto não encontrado');
    if (!['RECEBIDO', 'EM_ANALISE'].includes(projeto.status)) {
      throw new Error('Projeto com situação encerrada');
    }
    const atualizado = await prisma.projetoCultural.update({
      where: { id: projeto.id },
      data: { status: 'APROVADO', ...(editalId ? { editalId } : {}) },
    });
    await this.concluirProtocolo(atualizado.protocolId, 'Projeto aprovado');
    return atualizado;
  }

  async reprovarProjeto(id: string, motivo?: string) {
    const projeto = await prisma.projetoCultural.findFirst({ where: { id } });
    if (!projeto) throw new Error('Projeto não encontrado');
    if (!['RECEBIDO', 'EM_ANALISE'].includes(projeto.status)) {
      throw new Error('Projeto com situação encerrada');
    }
    if (motivo) {
      await prisma.parecerProjetoCultural.create({
        data: { projetoId: projeto.id, texto: motivo, recomendacao: 'REPROVAR' },
      });
    }
    const atualizado = await prisma.projetoCultural.update({
      where: { id: projeto.id },
      data: { status: 'REPROVADO' },
    });
    await this.concluirProtocolo(atualizado.protocolId, 'Projeto reprovado');
    return atualizado;
  }

  async cancelarProjeto(id: string) {
    const projeto = await prisma.projetoCultural.findFirst({ where: { id } });
    if (!projeto) throw new Error('Projeto não encontrado');
    return prisma.projetoCultural.update({
      where: { id: projeto.id },
      data: { status: 'CANCELADO' },
    });
  }

  // -------------------------------------------------------------- empréstimos

  async listEmprestimos(filters?: { status?: string }) {
    return prisma.emprestimoEquipamentoCultural.findMany({
      where: { ...(filters?.status ? { status: filters.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async createEmprestimo(data: any) {
    return prisma.emprestimoEquipamentoCultural.create({
      data: {
        protocolId: data.protocolId,
        item: data.item,
        quantidade: data.quantidade != null ? Number(data.quantidade) : 1,
        solicitanteNome: data.solicitanteNome,
        citizenId: data.citizenId,
        telefone: data.telefone,
        dataPrevistaDevolucao: data.dataPrevistaDevolucao
          ? new Date(data.dataPrevistaDevolucao)
          : null,
        observacoes: data.observacoes,
        dados: data.dados,
      },
    });
  }

  async emprestar(id: string, dataPrevistaDevolucao?: string) {
    const emprestimo = await prisma.emprestimoEquipamentoCultural.findFirst({ where: { id } });
    if (!emprestimo) throw new Error('Empréstimo não encontrado');
    if (emprestimo.status !== 'SOLICITADO') throw new Error('Somente solicitações podem ser emprestadas');
    return prisma.emprestimoEquipamentoCultural.update({
      where: { id: emprestimo.id },
      data: {
        status: 'EMPRESTADO',
        dataEmprestimo: new Date(),
        ...(dataPrevistaDevolucao
          ? { dataPrevistaDevolucao: new Date(dataPrevistaDevolucao) }
          : {}),
      },
    });
  }

  async devolver(id: string) {
    const emprestimo = await prisma.emprestimoEquipamentoCultural.findFirst({ where: { id } });
    if (!emprestimo) throw new Error('Empréstimo não encontrado');
    if (emprestimo.status !== 'EMPRESTADO') throw new Error('Equipamento não está emprestado');
    const atualizado = await prisma.emprestimoEquipamentoCultural.update({
      where: { id: emprestimo.id },
      data: { status: 'DEVOLVIDO', dataDevolucao: new Date() },
    });
    await this.concluirProtocolo(atualizado.protocolId, 'Equipamento devolvido');
    return atualizado;
  }

  async cancelarEmprestimo(id: string, motivo?: string) {
    const emprestimo = await prisma.emprestimoEquipamentoCultural.findFirst({ where: { id } });
    if (!emprestimo) throw new Error('Empréstimo não encontrado');
    return prisma.emprestimoEquipamentoCultural.update({
      where: { id: emprestimo.id },
      data: { status: 'CANCELADO', ...(motivo ? { observacoes: motivo } : {}) },
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
      logger.warn(`Cultura: falha ao concluir protocolo ${protocolId} (não-fatal) — ${motivo}`, error);
    }
  }

  async getStatistics() {
    const [matriculados, aguardando, reservasPendentes, projetosEmAnalise, emprestados, editaisAbertos] =
      await Promise.all([
        prisma.matriculaOficina.count({ where: { status: 'MATRICULADA' } }),
        prisma.matriculaOficina.count({ where: { status: { in: ['INSCRITA', 'LISTA_ESPERA'] } } }),
        prisma.reservaEspaco.count({ where: { area: 'CULTURA', status: 'SOLICITADA' } }),
        prisma.projetoCultural.count({ where: { status: { in: ['RECEBIDO', 'EM_ANALISE'] } } }),
        prisma.emprestimoEquipamentoCultural.count({ where: { status: 'EMPRESTADO' } }),
        prisma.editalCultural.count({ where: { status: 'INSCRICOES_ABERTAS' } }),
      ]);
    return {
      participantesMatriculados: matriculados,
      inscricoesAguardando: aguardando,
      reservasPendentes,
      projetosEmAnalise,
      equipamentosEmprestados: emprestados,
      editaisComInscricoesAbertas: editaisAbertos,
    };
  }
}

export default new CulturaService();
