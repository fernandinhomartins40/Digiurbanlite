import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// MS-16: CONTROLE DE BENEFÍCIOS EVENTUAIS
// ============================================================================

interface CreateTipoBeneficioDTO {
  nome: string;
  descricao?: string;
  categoria: string;
  valor?: number;
}

interface CreateSolicitacaoBeneficioDTO {
  protocolId?: string;
  citizenId: string;
  tipoBeneficioId: string;
  unidadeCRASId?: string;
  justificativa: string;
  documentosAnexos?: any;
}

class BeneficioService {
  // ===== TIPOS DE BENEFÍCIO =====

  async createTipoBeneficio(data: CreateTipoBeneficioDTO) {
    return await prisma.tipoBeneficio.create({ data });
  }

  async listTiposBeneficio(categoria?: string) {
    const where: any = { isActive: true };
    if (categoria) where.categoria = categoria;
    return await prisma.tipoBeneficio.findMany({
      where,
      orderBy: { nome: 'asc' },
    });
  }

  async updateTipoBeneficio(id: string, data: Partial<CreateTipoBeneficioDTO>) {
    return await prisma.tipoBeneficio.update({ where: { id }, data });
  }

  // ===== SOLICITAÇÕES =====

  async createSolicitacao(data: CreateSolicitacaoBeneficioDTO) {
    return await prisma.solicitacaoBeneficio.create({
      data: { ...data, status: 'AGUARDANDO_ANALISE' },
      include: { tipoBeneficio: true },
    });
  }

  async findSolicitacaoById(id: string) {
    const solicitacao = await prisma.solicitacaoBeneficio.findUnique({
      where: { id },
      include: { tipoBeneficio: true },
    });
    if (!solicitacao) throw new Error('Solicitação não encontrada');
    return solicitacao;
  }

  async listSolicitacoes(status?: string, citizenId?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (citizenId) where.citizenId = citizenId;

    return await prisma.solicitacaoBeneficio.findMany({
      where,
      include: { tipoBeneficio: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async analisarSolicitacao(id: string, analisadoPor: string, deferido: boolean, motivoIndeferimento?: string, valorConcedido?: number) {
    const solicitacao = await this.findSolicitacaoById(id);

    return await prisma.solicitacaoBeneficio.update({
      where: { id },
      data: {
        status: deferido ? 'DEFERIDO' : 'INDEFERIDO',
        analisadoPor,
        dataAnalise: new Date(),
        motivoIndeferimento: deferido ? null : motivoIndeferimento,
        valorConcedido: deferido ? valorConcedido : null,
      },
    });
  }

  async registrarEntrega(id: string) {
    const solicitacao = await this.findSolicitacaoById(id);

    if (solicitacao.status !== 'DEFERIDO') {
      throw new Error('Apenas benefícios deferidos podem ser entregues');
    }

    return await prisma.solicitacaoBeneficio.update({
      where: { id },
      data: {
        status: 'ENTREGUE',
        dataEntrega: new Date(),
      },
    });
  }

  async getStatistics() {
    const total = await prisma.solicitacaoBeneficio.count();

    const porStatus = await prisma.solicitacaoBeneficio.groupBy({
      by: ['status'],
      _count: true,
    });

    const valorTotal = await prisma.solicitacaoBeneficio.aggregate({
      where: { status: 'ENTREGUE' },
      _sum: { valorConcedido: true },
    });

    return {
      total,
      porStatus: porStatus.map(s => ({ status: s.status, quantidade: s._count })),
      valorTotalConcedido: valorTotal._sum.valorConcedido || 0,
    };
  }
}

export default new BeneficioService();
