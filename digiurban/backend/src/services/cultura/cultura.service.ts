import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// CULTURA (MS-25 a MS-32)
// ============================================================================

class CulturaService {
  // ===== MS-25: ESPAÇOS CULTURAIS =====

  async createEspacoCultural(data: any) {
    return await prisma.espacoCultural.create({ data });
  }

  async listEspacosCulturais(tipo?: string) {
    const where: any = { isActive: true };
    if (tipo) where.tipo = tipo;
    return await prisma.espacoCultural.findMany({ where });
  }

  async findEspacoCulturalById(id: string) {
    const espaco = await prisma.espacoCultural.findUnique({
      where: { id },
      include: { reservas: true },
    });
    if (!espaco) throw new Error('Espaço cultural não encontrado');
    return espaco;
  }

  async updateEspacoCultural(id: string, data: any) {
    await this.findEspacoCulturalById(id);
    return await prisma.espacoCultural.update({ where: { id }, data });
  }

  async deleteEspacoCultural(id: string) {
    return await this.updateEspacoCultural(id, { isActive: false });
  }

  // ===== MS-26: RESERVA DE ESPAÇOS =====

  async createReservaEspaco(data: any) {
    return await prisma.reservaEspacoCultural.create({ data });
  }

  async listReservas(espacoId?: string, citizenId?: string, status?: string) {
    const where: any = {};
    if (espacoId) where.espacoId = espacoId;
    if (citizenId) where.citizenId = citizenId;
    if (status) where.status = status;

    return await prisma.reservaEspacoCultural.findMany({
      where,
      include: { espaco: true },
      orderBy: { dataReserva: 'desc' },
    });
  }

  async updateReserva(id: string, data: any) {
    return await prisma.reservaEspacoCultural.update({ where: { id }, data });
  }

  async aprovarReserva(id: string) {
    return await this.updateReserva(id, { status: 'APROVADA' });
  }

  async rejeitarReserva(id: string, motivo?: string) {
    return await this.updateReserva(id, { status: 'REJEITADA', observacoes: motivo });
  }

  // ===== MS-27: CADASTRO DE ARTISTAS =====

  async createArtista(data: any) {
    return await prisma.artista.create({ data });
  }

  async listArtistas(categoria?: string) {
    const where: any = { isActive: true };
    if (categoria) where.categoria = categoria;
    return await prisma.artista.findMany({ where });
  }

  async findArtistaById(id: string) {
    const artista = await prisma.artista.findUnique({ where: { id } });
    if (!artista) throw new Error('Artista não encontrado');
    return artista;
  }

  async updateArtista(id: string, data: any) {
    await this.findArtistaById(id);
    return await prisma.artista.update({ where: { id }, data });
  }

  async deleteArtista(id: string) {
    return await this.updateArtista(id, { isActive: false });
  }

  // ===== MS-28: AGENDA CULTURAL =====

  async createEventoCultural(data: any) {
    return await prisma.eventoCultural.create({ data });
  }

  async listEventosCulturais(categoria?: string, status?: string) {
    const where: any = { isActive: true };
    if (categoria) where.categoria = categoria;
    if (status) where.status = status;

    return await prisma.eventoCultural.findMany({
      where,
      orderBy: { dataInicio: 'asc' },
    });
  }

  async findEventoCulturalById(id: string) {
    const evento = await prisma.eventoCultural.findUnique({ where: { id } });
    if (!evento) throw new Error('Evento cultural não encontrado');
    return evento;
  }

  async updateEventoCultural(id: string, data: any) {
    await this.findEventoCulturalById(id);
    return await prisma.eventoCultural.update({ where: { id }, data });
  }

  async cancelarEvento(id: string) {
    return await this.updateEventoCultural(id, { status: 'CANCELADO' });
  }

  async getAgendaMensal(ano: number, mes: number) {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    return await prisma.eventoCultural.findMany({
      where: {
        isActive: true,
        dataInicio: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      orderBy: { dataInicio: 'asc' },
    });
  }

  // ===== MS-29: EDITAIS CULTURAIS =====

  async createEditalCultural(data: any) {
    return await prisma.editalCultural.create({ data });
  }

  async listEditaisCulturais(status?: string) {
    const where: any = { isActive: true };
    if (status) where.status = status;

    return await prisma.editalCultural.findMany({
      where,
      orderBy: { dataPublicacao: 'desc' },
    });
  }

  async findEditalCulturalById(id: string) {
    const edital = await prisma.editalCultural.findUnique({ where: { id } });
    if (!edital) throw new Error('Edital cultural não encontrado');
    return edital;
  }

  async updateEditalCultural(id: string, data: any) {
    await this.findEditalCulturalById(id);
    return await prisma.editalCultural.update({ where: { id }, data });
  }

  async publicarEdital(id: string) {
    return await this.updateEditalCultural(id, {
      status: 'ABERTO',
      dataPublicacao: new Date(),
    });
  }

  async encerrarEdital(id: string) {
    return await this.updateEditalCultural(id, { status: 'ENCERRADO' });
  }

  // ===== MS-30: BIBLIOTECA PÚBLICA =====

  async createLivroBiblioteca(data: any) {
    return await prisma.livroBiblioteca.create({ data });
  }

  async listLivrosBiblioteca(categoria?: string, disponivel?: boolean) {
    const where: any = { isActive: true };
    if (categoria) where.categoria = categoria;
    if (disponivel !== undefined) where.disponivel = disponivel;

    return await prisma.livroBiblioteca.findMany({ where });
  }

  async findLivroBibliotecaById(id: string) {
    const livro = await prisma.livroBiblioteca.findUnique({
      where: { id },
      include: { emprestimos: true },
    });
    if (!livro) throw new Error('Livro não encontrado');
    return livro;
  }

  async updateLivroBiblioteca(id: string, data: any) {
    await this.findLivroBibliotecaById(id);
    return await prisma.livroBiblioteca.update({ where: { id }, data });
  }

  // ===== MS-31: EMPRÉSTIMO DE LIVROS =====

  async createEmprestimo(data: any) {
    // Verifica se o livro está disponível
    const livro = await this.findLivroBibliotecaById(data.livroId);
    if (!livro.disponivel) {
      throw new Error('Livro não está disponível para empréstimo');
    }

    // Cria empréstimo e marca livro como indisponível
    const emprestimo = await prisma.emprestimoBiblioteca.create({ data });
    await this.updateLivroBiblioteca(data.livroId, { disponivel: false });

    return emprestimo;
  }

  async listEmprestimos(citizenId?: string, status?: string) {
    const where: any = {};
    if (citizenId) where.citizenId = citizenId;
    if (status) where.status = status;

    return await prisma.emprestimoBiblioteca.findMany({
      where,
      include: { livro: true },
      orderBy: { dataEmprestimo: 'desc' },
    });
  }

  async devolverLivro(id: string) {
    const emprestimo = await prisma.emprestimoBiblioteca.update({
      where: { id },
      data: {
        status: 'DEVOLVIDO',
        dataDevolucao: new Date(),
      },
    });

    // Marca livro como disponível
    await this.updateLivroBiblioteca(emprestimo.livroId, { disponivel: true });

    return emprestimo;
  }

  async renovarEmprestimo(id: string, novaDataPrevista: Date) {
    return await prisma.emprestimoBiblioteca.update({
      where: { id },
      data: { dataPrevistaDevolucao: novaDataPrevista },
    });
  }

  // ===== MS-32: PATRIMÔNIO CULTURAL =====

  async createPatrimonioCultural(data: any) {
    return await prisma.patrimonioCultural.create({ data });
  }

  async listPatrimoniosCulturais(tipo?: string, status?: string) {
    const where: any = { isActive: true };
    if (tipo) where.tipo = tipo;
    if (status) where.statusConservacao = status;

    return await prisma.patrimonioCultural.findMany({ where });
  }

  async findPatrimonioCulturalById(id: string) {
    const patrimonio = await prisma.patrimonioCultural.findUnique({ where: { id } });
    if (!patrimonio) throw new Error('Patrimônio cultural não encontrado');
    return patrimonio;
  }

  async updatePatrimonioCultural(id: string, data: any) {
    await this.findPatrimonioCulturalById(id);
    return await prisma.patrimonioCultural.update({ where: { id }, data });
  }

  async registrarVisita(patrimonioId: string) {
    const patrimonio = await this.findPatrimonioCulturalById(patrimonioId);
    return await this.updatePatrimonioCultural(patrimonioId, {
      visitantes: (patrimonio.visitantes || 0) + 1,
    });
  }

  // ===== ESTATÍSTICAS GERAIS =====

  async getEstatisticasCultura() {
    const [
      totalEspacos,
      totalArtistas,
      totalEventos,
      totalEditais,
      totalLivros,
      totalPatrimonios,
    ] = await Promise.all([
      prisma.espacoCultural.count({ where: { isActive: true } }),
      prisma.artista.count({ where: { isActive: true } }),
      prisma.eventoCultural.count({ where: { isActive: true, status: 'AGENDADO' } }),
      prisma.editalCultural.count({ where: { isActive: true, status: 'ABERTO' } }),
      prisma.livroBiblioteca.count({ where: { isActive: true } }),
      prisma.patrimonioCultural.count({ where: { isActive: true } }),
    ]);

    return {
      totalEspacos,
      totalArtistas,
      totalEventos,
      totalEditais,
      totalLivros,
      totalPatrimonios,
    };
  }
}

export default new CulturaService();
