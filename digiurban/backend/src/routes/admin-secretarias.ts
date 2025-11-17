/**
 * ROTAS ADMIN SECRETARIAS
 * Conforme PLANO_IMPLEMENTACAO_COMPLETO.md Fase 8.2
 *
 * ATUALIZADO: Após migração para entidades virtuais, todos os dados agora
 * são acessados através de ProtocolSimplified.customData
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { ProtocolStatus } from '@prisma/client';

const router = Router();

// ============================================================
// HELPER: Buscar protocolos por módulo
// ============================================================

interface GetProtocolsByModuleParams {
  moduleType: string;
  status?: string;
  page?: number;
  limit?: number;
}

async function getProtocolsByModule({
  moduleType,
  status,
  page = 1,
  limit = 20
}: GetProtocolsByModuleParams) {
  const where: any = {
    moduleType: moduleType.toUpperCase()
  };

  if (status && status !== 'all') {
    where.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [total, protocols] = await Promise.all([
    prisma.protocolSimplified.count({ where }),
    prisma.protocolSimplified.findMany({
      where,
      skip,
      take,
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true
          }
        },
        service: true
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Transformar protocolos para formato legado (compatibilidade)
  const data = protocols.map(p => ({
    id: p.id,
    protocolNumber: p.number,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    citizen: p.citizen,
    service: p.service,
    ...p.customData as object
  }));

  return { data, total, page: Number(page), limit: Number(limit) };
}

// ============================================================
// EDUCAÇÃO
// ============================================================

router.get('/educacao/matriculas',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, source, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'CADASTRO_ESTUDANTE',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/educacao/transportes',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'TRANSPORTE_ESCOLAR',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/educacao/merenda',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'MERENDA_ESCOLAR',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// SAÚDE
// ============================================================

router.get('/saude/consultas',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'AGENDAMENTO_CONSULTA',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/saude/exames',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_EXAME',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/saude/medicamentos',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_MEDICAMENTO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/saude/vacinas',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'VACINACAO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// ASSISTÊNCIA SOCIAL
// ============================================================

router.get('/assistencia-social/beneficios',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_BENEFICIO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/assistencia-social/programas',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/assistencia-social/visitas',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'VISITA_DOMICILIAR',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// CULTURA
// ============================================================

router.get('/cultura/eventos',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'EVENTO_CULTURAL',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/cultura/espacos',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'ESPACO_CULTURAL',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/cultura/projetos',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'PROJETO_CULTURAL',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// ESPORTES
// ============================================================

router.get('/esportes/inscricoes',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'INSCRICAO_ESCOLINHA',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/esportes/reservas',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'RESERVA_ESPACO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// TURISMO
// ============================================================

router.get('/turismo/atrativos',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'CADASTRO_ATRATIVO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/turismo/eventos',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'EVENTO_TURISTICO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// HABITAÇÃO
// ============================================================

router.get('/habitacao/lotes',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'INSCRICAO_FILA_HABITACAO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/habitacao/mcmv',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'PROGRAMA_HABITACIONAL',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/habitacao/regularizacao',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'REGULARIZACAO_FUNDIARIA',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// OBRAS PÚBLICAS
// ============================================================

router.get('/obras-publicas/problemas',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'REGISTRO_PROBLEMA_INFRAESTRUTURA',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/obras-publicas/manutencao',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_MANUTENCAO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// SERVIÇOS PÚBLICOS
// ============================================================

router.get('/servicos-publicos/limpeza',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_LIMPEZA',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/servicos-publicos/poda',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_PODA_ARVORES',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/servicos-publicos/entulho',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_COLETA_ESPECIAL',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// MEIO AMBIENTE
// ============================================================

router.get('/meio-ambiente/licencas',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_LICENCA_AMBIENTAL',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/meio-ambiente/arvores',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_PODA_CORTE',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/meio-ambiente/denuncias',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'DENUNCIA_AMBIENTAL',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// AGRICULTURA
// ============================================================

router.get('/agricultura/assistencias',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'ASSISTENCIA_TECNICA_RURAL',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/agricultura/sementes',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'DISTRIBUICAO_SEMENTES',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// PLANEJAMENTO URBANO
// ============================================================

router.get('/planejamento-urbano/alvaras',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_ALVARA_CONSTRUCAO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/planejamento-urbano/certidoes',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_CERTIDAO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/planejamento-urbano/numeracao',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_NUMERACAO',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================
// SEGURANÇA PÚBLICA
// ============================================================

router.get('/seguranca-publica/ocorrencias',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'REGISTRO_OCORRENCIA',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/seguranca-publica/rondas',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'SOLICITACAO_RONDA',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get('/seguranca-publica/denuncias',
  adminAuthMiddleware,
  async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await getProtocolsByModule({
        moduleType: 'DENUNCIA_ANONIMA',
        status,
        page,
        limit
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
