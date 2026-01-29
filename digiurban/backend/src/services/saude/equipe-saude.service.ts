import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EquipeSaudeService {
  async criar(data: {
    ine: string;
    nome: string;
    tipo: string;
    unidadeId: string;
  }) {
    return await prisma.equipeSaude.create({
      data: {
        ine: data.ine,
        nome: data.nome,
        tipo: data.tipo as any,
        unidadeId: data.unidadeId,
        ativo: true,
      },
    });
  }

  async listar(unidadeId?: string) {
    return await prisma.equipeSaude.findMany({
      where: {
        ...(unidadeId && { unidadeId }),
        ativo: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    return await prisma.equipeSaude.findUnique({
      where: { id },
      include: {
        microareas: true,
      },
    });
  }

  async atualizar(id: string, data: any) {
    return await prisma.equipeSaude.update({
      where: { id },
      data,
    });
  }

  async desativar(id: string) {
    return await prisma.equipeSaude.update({
      where: { id },
      data: { ativo: false },
    });
  }

  // Microáreas
  async criarMicroarea(data: {
    numero: string;
    descricao?: string;
    equipeId: string;
    acsId?: string;
  }) {
    return await prisma.microarea.create({
      data: {
        numero: data.numero,
        descricao: data.descricao,
        equipeId: data.equipeId,
        acsId: data.acsId,
        ativo: true,
      },
    });
  }

  async listarMicroareas(equipeId: string) {
    return await prisma.microarea.findMany({
      where: {
        equipeId,
        ativo: true,
      },
      orderBy: { numero: 'asc' },
    });
  }
}

export default new EquipeSaudeService();
