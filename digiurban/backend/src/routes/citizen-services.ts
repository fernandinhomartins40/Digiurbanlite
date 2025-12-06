import { Router, Response } from 'express';
export default router;
    // Persistir documentos reais na tabela protocol_documents
    if (uploadedFiles.length > 0) {
      try {
        await documentUploadService.uploadDocumentsToProtocol({
          protocolId: result.protocol.id,
          files: uploadedFiles,
          uploadedBy: citizenId,
          documentTypes
        });
        console.log(`Documentos salvos em protocol_documents para o protocolo ${result.protocol.id}`);
      } catch (docErr) {
        console.error('Erro ao salvar documentos do protocolo:', docErr);
      }
    }

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { uploadDocuments } from '../config/upload';
import { AuthenticatedRequest, SuccessResponse, ErrorResponse, WhereCondition } from '../types';
// REMOVED: generateProtocolNumber - agora usa protocolModuleService.createProtocolWithModule
// REMOVED: ModuleHandler - agora usa protocolModuleService.createProtocolWithModule

// FASE 2 - Interface para serviÃ§os de cidadÃ£os
// WhereClause interface removida - usando WhereCondition do sistema centralizado

// Classe de erro para validaÃ§Ãµes de negÃ³cio
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const router = Router();


// GET /api/services - Listar serviÃ§os ativos
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

    // Buscar serviÃ§os com paginaÃ§Ã£o
    const [services, total] = await Promise.all([
      prisma.serviceSimplified.findMany({
        where,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
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
    console.error('Erro ao buscar serviÃ§os:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/categories - Listar categorias de serviÃ§os
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

// GET /api/services/popular - ServiÃ§os mais utilizados
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Buscar serviÃ§os com mais protocolos
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
    console.error('Erro ao buscar serviÃ§os populares:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/citizen/services/departments/:department/no-data - Buscar serviÃ§os SEM_DADOS de um departamento
router.get('/departments/:department/no-data', async (req, res) => {
  try {
    const { department } = req.params;

    // Converter slug para code (saude â†’ SAUDE, assistencia-social â†’ ASSISTENCIA_SOCIAL)
    const departmentCode = department.toUpperCase().replace(/-/g, '_');

    // Buscar departamento pelo code
    const dept = await prisma.department.findUnique({
      where: { code: departmentCode }
    });

    if (!dept) {
      return res.status(404).json({
        success: false,
        error: 'Departamento nÃ£o encontrado'
      });
    }

    // Buscar serviÃ§os SEM_DADOS do departamento
    const services = await prisma.serviceSimplified.findMany({
      where: {
        departmentId: dept.id,
        serviceType: 'SEM_DADOS',
        isActive: true
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Erro ao buscar serviÃ§os SEM_DADOS:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/services/:id - Detalhes de um serviÃ§o especÃ­fico
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
      return res.status(404).json({ error: 'ServiÃ§o nÃ£o encontrado' });
    }

    // Buscar estatÃ­sticas do serviÃ§o
    const stats = await prisma.protocolSimplified.groupBy({
      by: ['status'],
      where: {
        serviceId: id
        },
      _count: {
        status: true
        }
        });

    // Calcular tempo mÃ©dio de conclusÃ£o
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

      // Filtrar campos habilitados se formFieldsConfig existir
      let enabledFieldIds: string[] | null = null;
      if (service.formFieldsConfig && Array.isArray(service.formFieldsConfig)) {
        // Se tiver formFieldsConfig, usar apenas campos com enabled: true
        enabledFieldIds = (service.formFieldsConfig as any[])
          .filter((field: any) => field.enabled === true)
          .map((field: any) => field.id);
        console.log('ðŸ” [Schema Conversion] formFieldsConfig encontrado, campos habilitados:', enabledFieldIds);
      } else if (service.enabledFields && Array.isArray(service.enabledFields)) {
        // Fallback: usar enabledFields se existir
        enabledFieldIds = service.enabledFields as string[];
        console.log('ðŸ” [Schema Conversion] enabledFields encontrado:', enabledFieldIds);
      } else {
        console.log('ðŸ” [Schema Conversion] Nenhuma configuraÃ§Ã£o de campos encontrada, mostrando todos');
      }

      // âœ… SEPARAR: citizen fields de custom fields para evitar duplicaÃ§Ã£o
      const citizenFields: string[] = [];
      const customFields: any[] = [];

      // Lista completa de campos citizen (legacy + prefixados)
      const citizenFieldNames = [
        // Formato legacy (sem prefixo)
        'nome', 'cpf', 'rg', 'dataNascimento', 'email', 'telefone',
        'telefoneSecundario', 'cep', 'logradouro', 'numero', 'complemento',
        'bairro', 'cidade', 'uf', 'nomeMae', 'estadoCivil', 'profissao', 'rendaFamiliar',
        // Formato com prefixo citizen_*
        'citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate',
        'citizen_email', 'citizen_phone', 'citizen_phonesecondary',
        'citizen_zipcode', 'citizen_address', 'citizen_addressnumber',
        'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_city',
        'citizen_state', 'citizen_mothername', 'citizen_maritalstatus',
        'citizen_occupation', 'citizen_familyincome'
      ];

      Object.entries(properties)
        .filter(([id]) => {
          // Aplicar filtro de campos habilitados se existir
          if (!enabledFieldIds) return true;
          return enabledFieldIds.includes(id);
        })
        .forEach(([id, prop]: [string, any]) => {
          const lowerCaseId = id.toLowerCase();

          // âœ… SEPARAÃ‡ÃƒO: Identificar se Ã© campo citizen (legacy OU prefixado)
          if (lowerCaseId.startsWith('citizen_') || citizenFieldNames.includes(lowerCaseId)) {
            citizenFields.push(id);
            console.log(`ðŸ” [Schema Conversion] Campo citizen identificado: ${id}`);
          } else {
            // Campo customizado do serviÃ§o
            customFields.push({
              id,
              label: prop.title || id,
              type: prop.enum ? 'select' : (prop.type === 'number' ? 'number' : (prop.type === 'string' ? 'text' : prop.type)),
              required: required.includes(id),
              placeholder: prop.description,
              options: prop.enum || undefined,
              mask: prop.mask || undefined,
              // âœ… Incluir regras de validaÃ§Ã£o para o frontend
              minLength: prop.minLength,
              maxLength: prop.maxLength,
              min: prop.minimum,
              max: prop.maximum,
              pattern: prop.pattern
            });
          }
        });

      // âœ… FORMATO FINAL: Separado e sem duplicaÃ§Ã£o
      // citizenFields pode vir de properties OU de formSchema.citizenFields (formato legado)
      const legacyCitizenFields = (service.formSchema as any).citizenFields || [];
      const allCitizenFields = Array.from(new Set([...citizenFields, ...legacyCitizenFields]));

      formSchemaConverted = {
        fields: customFields,  // âœ… Apenas campos customizados do serviÃ§o
        citizenFields: allCitizenFields  // âœ… Lista unificada de citizen_* (sem duplicaÃ§Ã£o)
      };

      console.log('âœ… [Schema Conversion] Schema convertido:', {
        customFieldsCount: customFields.length,
        citizenFieldsCount: allCitizenFields.length,
        customFields: customFields.map(f => f.id),
        citizenFields: allCitizenFields
      });
    }

    // Normalizar requiredDocuments para array
    let normalizedRequiredDocuments = service.requiredDocuments
    if (typeof service.requiredDocuments === 'string') {
      try {
        normalizedRequiredDocuments = JSON.parse(service.requiredDocuments)
      } catch (e) {
        console.error('Erro ao parsear requiredDocuments:', e)
        normalizedRequiredDocuments = []
      }
    }

    console.log('ðŸ“„ [Backend] Retornando serviÃ§o:', {
      name: service.name,
      requiresDocuments: service.requiresDocuments,
      requiredDocuments: normalizedRequiredDocuments,
      typeOfRequiredDocs: typeof normalizedRequiredDocuments,
      isArray: Array.isArray(normalizedRequiredDocuments)
    });

    return res.json({
      service: {
        ...service,
        requiredDocuments: normalizedRequiredDocuments,
        formSchema: formSchemaConverted,
        stats: {
          protocolsCount: service._count?.protocols || 0,
          statusDistribution: stats,
          averageCompletionDays
        }
        }
        });
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviÃ§o:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/:id/requirements - Requisitos do serviÃ§o
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
      return res.status(404).json({ error: 'ServiÃ§o nÃ£o encontrado' });
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
    console.error('Erro ao buscar requisitos do serviÃ§o:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/:id/similar - ServiÃ§os similares
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    // Buscar o serviÃ§o atual
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
      return res.status(404).json({ error: 'ServiÃ§o nÃ£o encontrado' });
    }

    // Buscar serviÃ§os similares (mesma categoria ou departamento)
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
    console.error('Erro ao buscar serviÃ§os similares:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware de autenticaÃ§Ã£o para rota de solicitaÃ§Ã£o (outras rotas nÃ£o precisam de auth)
// POST /api/services/:id/request - Solicitar um serviÃ§o
// IMPORTANTE: Aplicar middlewares na ordem: upload -> auth -> validaÃ§Ã£o
import { validateServiceFormData } from '../lib/json-schema-validator';
import { DocumentUploadService } from '../services/document-upload.service';

const documentUploadService = new DocumentUploadService();

router.post('/:id/request', uploadDocuments, citizenAuthMiddleware, async (req, res) => {
  try {
    const { id: serviceId } = req.params;
    const citizenId = (req as any).citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃ£o nÃ£o autenticado' });
    }

    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id: serviceId,
        isActive: true
      }
      });

    if (!service) {
      return res.status(404).json({ error: 'ServiÃ§o nÃ£o encontrado ou inativo' });
    }

    // Processar arquivos enviados (se houver)
    const uploadedFiles = (req as any).files || [];
    const documentIds = req.body.documentIds || [];

    // Extrair documentTypes enviados no FormData (documents[0][id], documents[0][documentId], etc)
    const documentTypes: string[] = uploadedFiles.map((_, index: number) => {
      const idField = (req.body as any)[`documents[${index}][id]`] || (req.body as any)[`documents[${index}][documentId]`];
      if (idField) return idField;
      if (Array.isArray(documentIds) && documentIds[index]) return documentIds[index];
      return `Documento ${index + 1}`;
    });

    console.log('ðŸ“Ž Arquivos recebidos:', uploadedFiles.length);
    console.log('ðŸ“‹ Document IDs:', documentIds);

    // Mapear arquivos para estrutura de attachments
    const attachments = uploadedFiles.map((file: Express.Multer.File, index: number) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      documentId: Array.isArray(documentIds) ? documentIds[index] : documentIds || documentTypes[index]
        }));

    console.log('ðŸ“¦ Attachments processados:', attachments.length);

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

    console.log('ðŸ“‹ [Service Request] customFormData recebido:', {
      fields: Object.keys(customFormData || {}),
      data: customFormData,
      hasData: customFormData && Object.keys(customFormData).length > 0
    });

    // ============================================================================
    // DOCUMENTAÃ‡ÃƒO: Estrutura do customFormData
    // ============================================================================
    // customFormData deve conter APENAS:
    // 1. Campos especÃ­ficos do serviÃ§o (ex: cartaoSUS, tipoAtendimento, descricao)
    // 2. programId (se for inscriÃ§Ã£o em programa)
    // 3. linkedCitizens (se houver vinculaÃ§Ã£o de cidadÃ£os estruturada)
    //    Formato: [{ linkedCitizenId, linkType, role, contextData }]
    //
    // customFormData NÃƒO deve conter:
    // - citizen_name, citizen_cpf, citizen_email, etc. (preenchidos automaticamente pelo backend via citizenId)
    // - Dados do cidadÃ£o autenticado (vÃªm do token JWT httpOnly)
    //
    // O backend enriquece automaticamente com:
    // - citizenId (do token de autenticaÃ§Ã£o)
    // - Dados de composiÃ§Ã£o familiar (familyStatsService)
    // ============================================================================

    // Validar customFormData contra o JSON Schema do serviÃ§o (se houver)
    if (customFormData && Object.keys(customFormData).length > 0) {
      const validation = validateServiceFormData(service, customFormData);

      if (!validation.valid) {
        console.warn('âŒ [Service Request] ValidaÃ§Ã£o falhou:', {
          errors: validation.errors,
          receivedFields: Object.keys(customFormData),
          serviceName: service.name,
          serviceId: service.id
        });

        return res.status(400).json({
          error: 'Dados do formulÃ¡rio invÃ¡lidos',
          details: validation.errors,
          // âœ… DEBUG INFO: Ajuda a identificar qual campo estÃ¡ falhando
          debug: process.env.NODE_ENV === 'development' ? {
            receivedFields: Object.keys(customFormData),
            failedFields: validation.errors
              .map(e => e.match(/'([^']+)'/)?.[1])
              .filter(Boolean),
            serviceName: service.name
          } : undefined
        });
      }

      console.log('âœ… [Service Request] ValidaÃ§Ã£o OK - campos vÃ¡lidos:', Object.keys(customFormData));
    } else {
      console.log('â„¹ï¸ [Service Request] Nenhum customFormData enviado (serviÃ§o SEM_DADOS ou apenas description)');
    }

    const {
      description,
      locationData,
      schedulingData,
      priority = 3
        } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'DescriÃ§Ã£o Ã© obrigatÃ³ria' });
    }
    const { protocolModuleService } = await import('../services/protocol-module.service');

    // Preparar formData com citizenId
    const moduleFormData = {
      citizenId,
      ...customFormData
        };

    console.log('ðŸ“¥ Dados recebidos do frontend:');
    console.log('  - citizenId:', citizenId);
    console.log('  - serviceId:', serviceId);
    console.log('  - customFormData:', JSON.stringify(customFormData, null, 2));
    console.log('  - moduleFormData (com citizenId):', JSON.stringify(moduleFormData, null, 2));

    const result = await protocolModuleService.createProtocolWithModule({
      citizenId,
      serviceId,
      formData: moduleFormData,
      description, // DescriÃ§Ã£o fornecida pelo cidadÃ£o
      createdById: undefined, // CidadÃ£o criando
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      address: locationData?.address,
      attachments: attachments as any
        });

    console.log(`âœ… Protocolo ${result.protocol.number} criado ${result.hasModule ? 'COM mÃ³dulo' : 'SEM mÃ³dulo'}`);
    if (result.hasModule) {
      console.log(`   Protocolo vinculado ao mÃ³dulo: ${result.protocol.moduleType}`);
    }

    // Persistir documentos reais na tabela protocol_documents
    if (uploadedFiles.length > 0) {
      try {
        await documentUploadService.uploadDocumentsToProtocol({
          protocolId: result.protocol.id,
          files: uploadedFiles,
          uploadedBy: citizenId,
          documentTypes
        });
        console.log(`Documentos salvos em protocol_documents para o protocolo ${result.protocol.id}`);
      } catch (docErr) {
        console.error('Erro ao salvar documentos do protocolo:', docErr);
      }
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
    console.error('Erro ao solicitar serviÃ§o:', error);

    // Verificar se Ã© erro de validaÃ§Ã£o de negÃ³cio
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Erros de duplicaÃ§Ã£o/validaÃ§Ã£o devem retornar 400 (Bad Request) ou 409 (Conflict)
      if (
        errorMessage.includes('jÃ¡ estÃ¡ cadastrado') ||
        errorMessage.includes('jÃ¡ existe') ||
        errorMessage.includes('duplicado') ||
        errorMessage.includes('nÃ£o encontrado') ||
        errorMessage.includes('obrigatÃ³rio') ||
        errorMessage.includes('invÃ¡lido')
      ) {
        return res.status(400).json({
          error: error.message,
          details: 'Erro de validaÃ§Ã£o'
        });
      }
    }

    // Outros erros sÃ£o 500
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

// POST /api/services/:id/favorite - Favoritar serviÃ§o (futuro)
router.post('/:id/favorite', async (req, res) => {
  try {
    // ImplementaÃ§Ã£o futura para favoritos
    res.json({ message: 'Funcionalidade de favoritos em desenvolvimento' });
  } catch (error) {
    console.error('Erro ao favoritar serviÃ§o:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcula distÃ¢ncia entre dois pontos (fÃ³rmula de Haversine)
 * Retorna distÃ¢ncia em km
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
