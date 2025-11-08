import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { uploadDocuments } from '../config/upload';
import { AuthenticatedRequest, SuccessResponse, ErrorResponse, WhereCondition } from '../types';
// REMOVED: generateProtocolNumber - agora usa protocolModuleService.createProtocolWithModule
// REMOVED: ModuleHandler - agora usa protocolModuleService.createProtocolWithModule

// FASE 2 - Interface para serviços de cidadãos
// WhereClause interface removida - usando WhereCondition do sistema centralizado

// Classe de erro para validações de negócio
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const router = Router();

// GET /api/services - Listar serviços ativos
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 1000 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: WhereCondition = {
      isActive: true
        };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    // Buscar serviços com paginação
    const [services, total] = await Promise.all([
      prisma.serviceSimplified.findMany({
        where,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              description: true
        }
      }
        },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
        skip,
        take: Number(limit)
        }),
      prisma.serviceSimplified.count({ where }),
    ]);

    return res.json({
      services,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
        }
        });
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/categories - Listar categorias de serviços
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.serviceSimplified.findMany({
      where: {
        isActive: true,
        category: { not: null }
        },
      select: {
        category: true
        },
      distinct: ['category'],
      orderBy: {
        category: 'asc'
        }
        });

    const categoriesWithCount = await Promise.all(
      categories.map(async cat => {
        const count = await prisma.serviceSimplified.count({
          where: {
            isActive: true,
            category: cat.category
        }
        });

        return {
          name: cat.category,
          count
        };
      })
    );

    return res.json({
      categories: categoriesWithCount
        });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/popular - Serviços mais utilizados
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Buscar serviços com mais protocolos
    const popularServices = await prisma.serviceSimplified.findMany({
      where: {
        isActive: true
        },
      include: {
        department: {
          select: {
            id: true,
            name: true
        }
      },
        _count: {
          select: {
            protocols: true
        }
      }
        },
      orderBy: {
        protocols: {
          _count: 'desc'
        }
        },
      take: Number(limit)
        });

    return res.json({
      services: popularServices
        });
  } catch (error) {
    console.error('Erro ao buscar serviços populares:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/:id - Detalhes de um serviço específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id,
        isActive: true
        },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            description: true
        }
      },
        _count: {
          select: {
            protocols: true
        }
      }
        }
        });

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Buscar estatísticas do serviço
    const stats = await prisma.protocolSimplified.groupBy({
      by: ['status'],
      where: {
        serviceId: id
        },
      _count: {
        status: true
        }
        });

    // Calcular tempo médio de conclusão
    const completedProtocols = await prisma.protocolSimplified.findMany({
      where: {
        serviceId: id,
        status: 'CONCLUIDO',
        concludedAt: { not: null }
        },
      select: {
        createdAt: true,
        concludedAt: true
        }
      });

    let averageCompletionDays = null;
    if (completedProtocols.length > 0) {
      const totalDays = completedProtocols.reduce((acc, protocol) => {
        const diffTime = protocol.concludedAt!.getTime() - protocol.createdAt.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return acc + diffDays;
      }, 0);
      averageCompletionDays = Math.round(totalDays / completedProtocols.length);
    }

    // Converter formSchema de JSON Schema para formato fields[] do frontend
    let formSchemaConverted = service.formSchema;
    if (service.formSchema && typeof service.formSchema === 'object' && 'properties' in service.formSchema) {
      const properties = (service.formSchema as any).properties || {};
      const required = (service.formSchema as any).required || [];

      const fields = Object.entries(properties).map(([id, prop]: [string, any]) => ({
        id,
        label: prop.title || id,
        type: prop.enum ? 'select' : (prop.type === 'number' ? 'number' : 'text'),
        required: required.includes(id),
        placeholder: prop.description,
        options: prop.enum || undefined,
        mask: prop.mask || undefined
        }));

      formSchemaConverted = { fields };
    }

    return res.json({
      service: {
        ...service,
        formSchema: formSchemaConverted,
        stats: {
          protocolsCount: service._count?.protocols || 0,
          statusDistribution: stats,
          averageCompletionDays
        }
        }
        });
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/:id/requirements - Requisitos do serviço
router.get('/:id/requirements', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id,
        isActive: true
        },
      select: {
        id: true,
        name: true,
        requiredDocuments: true,
        estimatedDays: true
        }
      });

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    return res.json({
      service: {
        id: service.id,
        name: service.name,
        requiredDocuments: service.requiredDocuments || [],
        estimatedDays: service.estimatedDays
        }
        });
  } catch (error) {
    console.error('Erro ao buscar requisitos do serviço:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/:id/similar - Serviços similares
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    // Buscar o serviço atual
    const currentService = await prisma.serviceSimplified.findFirst({
      where: {
        id,
        isActive: true
        },
      select: {
        category: true,
        departmentId: true
        }
      });

    if (!currentService) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // Buscar serviços similares (mesma categoria ou departamento)
    const similarServices = await prisma.serviceSimplified.findMany({
      where: {
        isActive: true,
        id: { not: id },
        OR: [{ category: currentService.category }, { departmentId: currentService.departmentId }]
        },
      include: {
        department: {
          select: {
            id: true,
            name: true
        }
      },
        _count: {
          select: {
            protocols: true
        }
      }
        },
      orderBy: {
        protocols: {
          _count: 'desc'
        }
        },
      take: Number(limit)
        });

    return res.json({
      services: similarServices
        });
  } catch (error) {
    console.error('Erro ao buscar serviços similares:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de autenticação para rota de solicitação (outras rotas não precisam de auth)
// POST /api/services/:id/request - Solicitar um serviço
// IMPORTANTE: Aplicar middlewares na ordem: upload -> auth
router.post('/:id/request', uploadDocuments, citizenAuthMiddleware, async (req, res) => {
  try {
    const { id: serviceId } = req.params;
    const citizenId = (req as any).citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id: serviceId,
        isActive: true
      }
      });

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado ou inativo' });
    }

    // Processar arquivos enviados (se houver)
    const uploadedFiles = (req as any).files || [];
    const documentIds = req.body.documentIds || [];

    console.log('📎 Arquivos recebidos:', uploadedFiles.length);
    console.log('📋 Document IDs:', documentIds);

    // Mapear arquivos para estrutura de attachments
    const attachments = uploadedFiles.map((file: Express.Multer.File, index: number) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      documentId: Array.isArray(documentIds) ? documentIds[index] : documentIds
        }));

    console.log('📦 Attachments processados:', attachments.length);

    // Parse customFormData se for string (vindo de FormData)
    let customFormData = req.body.customFormData;
    if (typeof customFormData === 'string') {
      try {
        customFormData = JSON.parse(customFormData);
      } catch (e) {
        console.warn('Erro ao parsear customFormData:', e);
        customFormData = {};
      }
    }

    const {
      description,
      locationData,
      schedulingData,
      priority = 3
        } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }
    const { protocolModuleService } = await import('../services/protocol-module.service');

    // Preparar formData com citizenId
    const moduleFormData = {
      citizenId,
      ...customFormData
        };

    console.log('📥 Dados recebidos do frontend:');
    console.log('  - citizenId:', citizenId);
    console.log('  - serviceId:', serviceId);
    console.log('  - customFormData:', JSON.stringify(customFormData, null, 2));
    console.log('  - moduleFormData (com citizenId):', JSON.stringify(moduleFormData, null, 2));

    const result = await protocolModuleService.createProtocolWithModule({
      citizenId,
      serviceId,
      formData: moduleFormData,
      createdById: undefined, // Cidadão criando
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      address: locationData?.address,
      attachments: attachments as any
        });

    console.log(`✅ Protocolo ${result.protocol.number} criado ${result.hasModule ? 'COM módulo' : 'SEM módulo'}`);
    if (result.hasModule && result.moduleEntity) {
      console.log(`   Entidade do módulo criada: ${result.protocol.moduleType}`);
    }

    // Buscar protocolo completo
    const fullProtocol = await prisma.protocolSimplified.findUnique({
      where: { id: result.protocol.id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            estimatedDays: true
        }
      },
        department: {
          select: {
            id: true,
            name: true
        }
      }
      }
        });

    return res.status(201).json({
      success: true,
      message: `Protocolo ${result.protocol.number} gerado com sucesso!`,
      protocol: fullProtocol
        });
  } catch (error) {
    console.error('Erro ao solicitar serviço:', error);

    // Verificar se é erro de validação de negócio
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Erros de duplicação/validação devem retornar 400 (Bad Request) ou 409 (Conflict)
      if (
        errorMessage.includes('já está cadastrado') ||
        errorMessage.includes('já existe') ||
        errorMessage.includes('duplicado') ||
        errorMessage.includes('não encontrado') ||
        errorMessage.includes('obrigatório') ||
        errorMessage.includes('inválido')
      ) {
        return res.status(400).json({
          error: error.message,
          details: 'Erro de validação'
        });
      }
    }

    // Outros erros são 500
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

// POST /api/services/:id/favorite - Favoritar serviço (futuro)
router.post('/:id/favorite', async (req, res) => {
  try {
    // Implementação futura para favoritos
    res.json({ message: 'Funcionalidade de favoritos em desenvolvimento' });
  } catch (error) {
    console.error('Erro ao favoritar serviço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcula distância entre dois pontos (fórmula de Haversine)
 * Retorna distância em km
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default router;
