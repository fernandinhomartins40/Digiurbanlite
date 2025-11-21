/**
 * 🎯 ENUMS DINÂMICOS - Endpoint para Dropdown/Select Dinâmicos
 *
 * Este endpoint permite que formulários busquem opções dinamicamente
 * das tabelas de Micro Sistemas, implementando o conceito enumSource.
 *
 * Exemplo de uso:
 * GET /api/enums/MS_TURMAS → Retorna turmas ativas
 * GET /api/enums/MS_UNIDADES_EDUCACAO → Retorna escolas ativas
 * GET /api/enums/MS_PROFISSIONAIS_SAUDE → Retorna profissionais de saúde
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(adminAuthMiddleware);

/**
 * GET /api/enums/:source
 * Retorna lista de opções baseado na fonte especificada
 */
router.get('/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const { departmentId, search, limit = '100' } = req.query;

    console.log(`[Enums] Buscando: ${source}`);

    let data: any[] = [];

    switch (source) {
      // ==================== EDUCAÇÃO ====================

      case 'MS_UNIDADES_EDUCACAO':
      case 'UNIDADES_EDUCACAO':
        data = await prisma.unidadeEducacao.findMany({
          where: {
            isActive: true,
            nome: search ? { contains: search as string, mode: 'insensitive' } : undefined
          },
          select: { id: true, nome: true, bairro: true, tipo: true },
          take: parseInt(limit as string),
          orderBy: { nome: 'asc' }
        });
        break;

      case 'MS_TURMAS':
      case 'TURMAS':
        data = await prisma.turma.findMany({
          where: {
            isActive: true,
            codigo: search ? { contains: search as string, mode: 'insensitive' } : undefined
          },
          select: {
            id: true,
            codigo: true,
            serie: true,
            turno: true,
            sala: true,
            capacidade: true
          },
          take: parseInt(limit as string),
          orderBy: { codigo: 'asc' }
        });
        // Formatar para incluir nome composto
        data = data.map(t => ({
          id: t.id,
          nome: `${t.codigo} - ${t.serie} ${t.turno}`,
          codigo: t.codigo,
          serie: t.serie,
          turno: t.turno
        }));
        break;

      case 'MS_ROTAS_ESCOLARES':
      case 'ROTAS_ESCOLARES':
        data = await prisma.rotaEscolar.findMany({
          where: { isActive: true },
          select: {
            id: true,
            nome: true,
            turno: true,
            horarioSaida: true
          },
          take: parseInt(limit as string),
          orderBy: { nome: 'asc' }
        });
        break;

      case 'MS_VEICULOS_ESCOLARES':
      case 'VEICULOS_ESCOLARES':
        data = await prisma.veiculoEscolar.findMany({
          where: { isActive: true, status: 'DISPONIVEL' },
          select: {
            id: true,
            placa: true,
            modelo: true,
            capacidade: true
          },
          take: parseInt(limit as string),
          orderBy: { placa: 'asc' }
        });
        data = data.map(v => ({
          id: v.id,
          nome: `${v.placa} - ${v.modelo} (${v.capacidade} lugares)`,
          placa: v.placa
        }));
        break;

      // ==================== SAÚDE ====================

      case 'MS_UNIDADES_SAUDE':
      case 'UNIDADES_SAUDE':
        data = await prisma.unidadeSaude.findMany({
          where: {
            isActive: true,
            nome: search ? { contains: search as string, mode: 'insensitive' } : undefined
          },
          select: { id: true, nome: true, tipo: true, bairro: true },
          take: parseInt(limit as string),
          orderBy: { nome: 'asc' }
        });
        break;

      case 'MS_PROFISSIONAIS_SAUDE':
      case 'PROFISSIONAIS_SAUDE':
        data = await prisma.profissionalSaude.findMany({
          where: {
            isActive: true,
            nome: search ? { contains: search as string, mode: 'insensitive' } : undefined
          },
          select: {
            id: true,
            nome: true,
            especialidade: true,
            categoria: true,
            registroProfissional: true
          },
          take: parseInt(limit as string),
          orderBy: { nome: 'asc' }
        });
        data = data.map(p => ({
          id: p.id,
          nome: `${p.nome} - ${p.especialidade || p.categoria}`,
          especialidade: p.especialidade
        }));
        break;

      case 'MS_MEDICAMENTOS':
      case 'MEDICAMENTOS':
        data = await prisma.medicamento.findMany({
          where: {
            isActive: true,
            nome: search ? { contains: search as string, mode: 'insensitive' } : undefined
          },
          select: {
            id: true,
            nome: true,
            principioAtivo: true,
            concentracao: true,
            apresentacao: true
          },
          take: parseInt(limit as string),
          orderBy: { nome: 'asc' }
        });
        data = data.map(m => ({
          id: m.id,
          nome: m.concentracao ? `${m.nome} ${m.concentracao} - ${m.apresentacao}` : `${m.nome} - ${m.apresentacao}`,
          principioAtivo: m.principioAtivo
        }));
        break;

      // ==================== ASSISTÊNCIA SOCIAL ====================

      case 'MS_UNIDADES_CRAS':
      case 'UNIDADES_CRAS':
        data = await prisma.unidadeCRAS.findMany({
          where: {
            isActive: true,
            nome: search ? { contains: search as string, mode: 'insensitive' } : undefined
          },
          select: { id: true, nome: true, bairro: true, tipo: true },
          take: parseInt(limit as string),
          orderBy: { nome: 'asc' }
        });
        break;

      case 'MS_PROGRAMAS_SOCIAIS':
      case 'PROGRAMAS_SOCIAIS':
        data = await prisma.programaSocial.findMany({
          where: {
            isActive: true,
            nome: search ? { contains: search as string, mode: 'insensitive' } : undefined
          },
          select: { id: true, nome: true, descricao: true, tipo: true },
          take: parseInt(limit as string),
          orderBy: { nome: 'asc' }
        });
        break;

      // ==================== AGRICULTURA ====================
      // REMOVIDO: MS_MAQUINAS_AGRICOLAS (model deletado)

      // ==================== CULTURA ====================
      // REMOVIDO: MS_ESPACOS_CULTURAIS (model deletado)

      // ==================== ESPORTES ====================

      case 'MS_MODALIDADES_ESPORTIVAS':
      case 'MODALIDADES':
        data = await prisma.modalidadeEsportiva.findMany({
          where: {
            isActive: true,
            nome: search ? { contains: search as string, mode: 'insensitive' } : undefined
          },
          select: { id: true, nome: true, categoria: true },
          take: parseInt(limit as string),
          orderBy: { nome: 'asc' }
        });
        break;

      // ==================== HABITAÇÃO ====================

      case 'MS_CONJUNTOS_HABITACIONAIS':
      case 'CONJUNTOS':
        data = await prisma.conjuntoHabitacional.findMany({
          where: {
            isActive: true,
            nome: search ? { contains: search as string, mode: 'insensitive' } : undefined
          },
          select: { id: true, nome: true, bairro: true, totalUnidades: true },
          take: parseInt(limit as string),
          orderBy: { nome: 'asc' }
        });
        break;

      // ==================== TURISMO ====================
      // REMOVIDO: MS_PONTOS_TURISTICOS (model deletado)

      // ==================== GENÉRICO ====================

      default:
        return res.status(404).json({
          success: false,
          error: `Fonte de enum não encontrada: ${source}`,
          availableSources: [
            'MS_UNIDADES_EDUCACAO', 'MS_TURMAS', 'MS_ROTAS_ESCOLARES', 'MS_VEICULOS_ESCOLARES',
            'MS_UNIDADES_SAUDE', 'MS_PROFISSIONAIS_SAUDE', 'MS_MEDICAMENTOS',
            'MS_UNIDADES_CRAS', 'MS_PROGRAMAS_SOCIAIS',
            'MS_MAQUINAS_AGRICOLAS',
            'MS_ESPACOS_CULTURAIS', 'MS_MODALIDADES_ESPORTIVAS',
            'MS_CONJUNTOS_HABITACIONAIS', 'MS_PONTOS_TURISTICOS'
          ]
        });
    }

    return res.json({
      success: true,
      data,
      count: data.length,
      source
    });

  } catch (error: any) {
    console.error('[Enums] Erro:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar enums'
    });
  }
});

export default router;
