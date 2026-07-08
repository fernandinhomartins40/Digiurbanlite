import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { uploadDocuments } from '../config/upload';
import { AuthenticatedRequest, SuccessResponse, ErrorResponse, WhereCondition } from '../types';
import { validateServiceFormData } from '../lib/json-schema-validator';
import { DocumentUploadService } from '../services/document-upload.service';
import { validateProtocolUniqueness } from '../services/protocol-uniqueness.service';
import { ensureRequiredProtocolDocuments } from '../services/required-protocol-documents.service';

// REMOVED: generateProtocolNumber - agora usa protocolModuleService.createProtocolWithModule
// REMOVED: ModuleHandler - agora usa protocolModuleService.createProtocolWithModule

// FASE 2 - Interface para servi+ºos de cidad+úos
// WhereClause interface removida - usando WhereCondition do sistema centralizado

// Classe de erro para valida+º+Áes de neg+¦cio
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const router = Router();
const documentUploadService = new DocumentUploadService();


// GET /api/services - Listar servi+ºos ativos
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

    // Buscar servi+ºos com pagina+º+úo
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
    console.error('Erro ao buscar servi+ºos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/categories - Listar categorias de servi+ºos
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

// GET /api/services/popular - Servi+ºos mais utilizados
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Buscar servi+ºos com mais protocolos
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
    console.error('Erro ao buscar servi+ºos populares:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/citizen/services/departments/:department/no-data - Buscar servi+ºos SEM_DADOS de um departamento
router.get('/departments/:department/no-data', async (req, res) => {
  try {
    const { department } = req.params;

    // Converter slug para code (saude  SAUDE, assistencia-social  ASSISTENCIA_SOCIAL)
    const departmentCode = department.toUpperCase().replace(/-/g, '_');

    // Buscar departamento pelo code
    // findFirst: unique agora é composta [tenantId, code]; a extension escopa pelo tenant
    const dept = await prisma.department.findFirst({
      where: { code: departmentCode }
    });

    if (!dept) {
      return res.status(404).json({
        success: false,
        error: 'Departamento n+úo encontrado'
      });
    }

    // Buscar servi+ºos SEM_DADOS do departamento
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
    console.error('Erro ao buscar servi+ºos SEM_DADOS:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/services/:id - Detalhes de um servi+ºo espec+¡fico
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
      return res.status(404).json({ error: 'Servi+ºo n+úo encontrado' });
    }

    // Buscar estat+¡sticas do servi+ºo
    const stats = await prisma.protocolSimplified.groupBy({
      by: ['status'],
      where: {
        serviceId: id
        },
      _count: {
        status: true
        }
        });

    // Calcular tempo m+®dio de conclus+úo
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
        console.log('­ƒöì [Schema Conversion] formFieldsConfig encontrado, campos habilitados:', enabledFieldIds);
      } else if (service.enabledFields && Array.isArray(service.enabledFields)) {
        // Fallback: usar enabledFields se existir
        enabledFieldIds = service.enabledFields as string[];
        console.log('­ƒöì [Schema Conversion] enabledFields encontrado:', enabledFieldIds);
      } else {
        console.log('­ƒöì [Schema Conversion] Nenhuma configura+º+úo de campos encontrada, mostrando todos');
      }

      // Ô£à SEPARAR: citizen fields de custom fields para evitar duplica+º+úo
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

          // Ô£à SEPARA+ç+âO: Identificar se +® campo citizen (legacy OU prefixado)
          if (lowerCaseId.startsWith('citizen_') || citizenFieldNames.includes(lowerCaseId)) {
            citizenFields.push(id);
            console.log(`­ƒöì [Schema Conversion] Campo citizen identificado: ${id}`);
          } else {
            // Campo customizado do servi+ºo
            customFields.push({
              id,
              label: prop.title || id,
              type: prop.enum ? 'select' : (prop.type === 'number' ? 'number' : (prop.type === 'string' ? 'text' : prop.type)),
              required: required.includes(id),
              placeholder: prop.description,
              options: prop.enum || undefined,
              mask: prop.mask || undefined,
              // Ô£à Incluir regras de valida+º+úo para o frontend
              minLength: prop.minLength,
              maxLength: prop.maxLength,
              min: prop.minimum,
              max: prop.maximum,
              pattern: prop.pattern
            });
          }
        });

      // Ô£à FORMATO FINAL: Separado e sem duplica+º+úo
      // citizenFields pode vir de properties OU de formSchema.citizenFields (formato legado)
      const legacyCitizenFields = (service.formSchema as any).citizenFields || [];
      const allCitizenFields = Array.from(new Set([...citizenFields, ...legacyCitizenFields]));

      formSchemaConverted = {
        fields: customFields,  // Ô£à Apenas campos customizados do servi+ºo
        citizenFields: allCitizenFields  // Ô£à Lista unificada de citizen_* (sem duplica+º+úo)
      };

      console.log(' [Schema Conversion] Schema convertido:', {
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

    console.log('­ƒôä [Backend] Retornando servi+ºo:', {
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
    console.error('Erro ao buscar detalhes do servi+ºo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/:id/requirements - Requisitos do servi+ºo
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
      return res.status(404).json({ error: 'Servi+ºo n+úo encontrado' });
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
    console.error('Erro ao buscar requisitos do servi+ºo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/services/:id/similar - Servi+ºos similares
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    // Buscar o servi+ºo atual
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
      return res.status(404).json({ error: 'Servi+ºo n+úo encontrado' });
    }

    // Buscar servi+ºos similares (mesma categoria ou departamento)
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
    console.error('Erro ao buscar servi+ºos similares:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * ============================================================================
 * PILAR 3: SUGESTÕES PERSONALIZADAS DE SERVIÇOS
 * ============================================================================
 * GET /api/services/suggestions - Sugestões baseadas no perfil do cidadão
 *
 * Retorna serviços relevantes baseado em:
 * 1. Categorias atribuídas ao cidadão
 * 2. Departamentos relacionados às categorias
 * 3. Serviços ainda não solicitados
 * 4. Popularidade dos serviços
 */
router.get('/suggestions', citizenAuthMiddleware, async (req, res) => {
  try {
    const { citizenId } = req as any;
    const { limit = 5 } = req.query;

    console.log(`[SUGGESTIONS] Gerando sugestões para cidadão ${citizenId}`);

    // 1. Buscar categorias do cidadão
    const citizenCategories = await prisma.citizenCategoryAssignment.findMany({
      where: {
        citizenId,
        active: true
      },
      include: {
        category: {
          select: {
            code: true,
            department: true
          }
        }
      }
    });

    const categoryCodes = citizenCategories.map(c => c.category.code);
    const departments = [...new Set(citizenCategories.map(c => c.category.department))];
    // triggerServices field doesn't exist in schema - removed
    const relatedModuleTypes: string[] = [];

    console.log(`[SUGGESTIONS] Cidadão possui ${categoryCodes.length} categorias:`, categoryCodes);
    console.log(`[SUGGESTIONS] Departamentos relacionados:`, departments);

    // 2. Buscar protocolos já solicitados pelo cidadão
    const userProtocols = await prisma.protocolSimplified.findMany({
      where: { citizenId },
      select: {
        serviceId: true,
        moduleType: true
      },
      distinct: ['serviceId']
    });

    const usedServiceIds = userProtocols.map(p => p.serviceId).filter(Boolean);
    console.log(`[SUGGESTIONS] Cidadão já solicitou ${usedServiceIds.length} serviços`);

    // 3. Gerar sugestões inteligentes
    let suggestions = [];

    if (categoryCodes.length > 0) {
      // Cidadão TEM categorias: sugestões personalizadas
      suggestions = await prisma.serviceSimplified.findMany({
        where: {
          isActive: true,
          id: { notIn: usedServiceIds }, // Não repetir serviços já solicitados
          OR: [
            // Serviços do mesmo departamento
            {
              department: {
                name: { in: departments }
              }
            },
            // Serviços cujo moduleType está relacionado às categorias
            {
              moduleType: { in: relatedModuleTypes }
            }
          ]
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          _count: {
            select: {
              protocols: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },          // Prioridade primeiro
          { protocols: { _count: 'desc' } }, // Depois popularidade
          { name: 'asc' }
        ],
        take: Number(limit)
      });
    } else {
      // Cidadão NÃO TEM categorias: sugestões genéricas por popularidade
      console.log(`[SUGGESTIONS] Cidadão sem categorias, sugerindo serviços populares`);

      suggestions = await prisma.serviceSimplified.findMany({
        where: {
          isActive: true,
          id: { notIn: usedServiceIds }
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          _count: {
            select: {
              protocols: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { protocols: { _count: 'desc' } },
          { name: 'asc' }
        ],
        take: Number(limit)
      });
    }

    console.log(`[SUGGESTIONS] Retornando ${suggestions.length} sugestões`);

    return res.json({
      success: true,
      suggestions,
      metadata: {
        basedOn: {
          categories: categoryCodes,
          categoryCount: categoryCodes.length,
          departments,
          departmentCount: departments.length,
          usedServicesCount: usedServiceIds.length,
          suggestionsCount: suggestions.length
        },
        strategy: categoryCodes.length > 0 ? 'PERSONALIZED' : 'POPULAR',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[SUGGESTIONS] Erro ao gerar sugestões:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao gerar sugestões',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Middleware de autentica+º+úo para rota de solicita+º+úo (outras rotas n+úo precisam de auth)
// POST /api/services/:id/request - Solicitar um servi+ºo
// IMPORTANTE: Aplicar middlewares na ordem: upload -> auth -> valida+º+úo

router.post('/:id/request', (req, res, next) => {
  uploadDocuments(req, res, (err) => {
    if (err) {
      console.error('Erro no Multer:', err);
      return res.status(400).json({
        error: 'Erro ao processar upload de arquivos',
        details: err.message
      });
    }
    next();
  });
}, citizenAuthMiddleware, async (req, res) => {
  try {
    const { id: serviceId } = req.params;
    // ✅ SUPORTE ADMIN: Aceitar adminCitizenId quando admin cria protocolo para cidadão
    let citizenId = (req as any).citizen?.id;
    const adminCitizenId = req.body.adminCitizenId;

    // Se é admin criando para cidadão, usar o adminCitizenId
    if (adminCitizenId && (req as any).user) {
      citizenId = adminCitizenId;
      console.log('🔐 Admin criando protocolo para cidadão:', citizenId);
    }

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidad+úo n+úo autenticado' });
    }

    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id: serviceId,
        isActive: true
      }
      });

    if (!service) {
      return res.status(404).json({ error: 'Servi+ºo n+úo encontrado ou inativo' });
    }

    // Processar arquivos enviados (se houver)
    const uploadedFiles = (req as any).files || [];

    console.log('\n========== POST /api/citizen/services/:id/request ==========');
    console.log('Service ID:', serviceId);
    console.log('Citizen ID:', citizenId);
    console.log('Files received:', uploadedFiles.length);

    // Debug detalhado de arquivos
    if (uploadedFiles && uploadedFiles.length > 0) {
      console.log('📁 Arquivos processados pelo Multer:');
      uploadedFiles.forEach((file: Express.Multer.File, idx: number) => {
        console.log(`  [${idx}] ${file.originalname} - ${file.size} bytes - ${file.mimetype}`);
        console.log(`      fieldname: ${file.fieldname}`);
        console.log(`      path: ${file.path}`);
      });
    } else {
      console.log('⚠️  NENHUM arquivo recebido pelo Multer!');
      console.log('   req.files:', (req as any).files);
      console.log('   req.file:', (req as any).file);
    }

    console.log('📋 req.body keys:', Object.keys(req.body));

    // ✅ EXTRAÇÃO ROBUSTA: Aceitar múltiplos formatos
    let documentTypes: string[] = [];

    // Formato 1: Array documentTypes (preferido)
    if (req.body.documentTypes) {
      documentTypes = typeof req.body.documentTypes === 'string'
        ? JSON.parse(req.body.documentTypes)
        : req.body.documentTypes;
    }
    // Formato 2: Indexed fields documents[i][id]
    else if (uploadedFiles.length > 0) {
      documentTypes = uploadedFiles.map((_: Express.Multer.File, index: number) =>
        (req.body as any)[`documents[${index}][id]`] ||
        (req.body as any)[`documents[${index}][documentId]`] ||
        ''
      ).filter(Boolean);
    }

    console.log('🏷️  Document Types extraídos:', documentTypes);
    console.log('📦 Total de arquivos:', uploadedFiles.length);

    // Mapear arquivos para estrutura de attachments
    const attachments = uploadedFiles.map((file: Express.Multer.File, index: number) => {
      const documentType = documentTypes[index];

      if (!documentType) {
        console.warn(`   ⚠️  Arquivo ${index} (${file.originalname}) SEM documentType definido!`);
      }

      console.log(`   → Arquivo ${index}: ${file.originalname} → Tipo: ${documentType || 'INDEFINIDO'}`);

      return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        documentId: documentType || file.originalname
      };
    });

    console.log('­ƒôª Attachments processados:', attachments.length);

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

    console.log('­ƒôï [Service Request] customFormData recebido:', {
      fields: Object.keys(customFormData || {}),
      data: customFormData,
      hasData: customFormData && Object.keys(customFormData).length > 0
    });

    // ============================================================================
    // DOCUMENTA+ç+âO: Estrutura do customFormData
    // ============================================================================
    // customFormData deve conter APENAS:
    // 1. Campos espec+¡ficos do servi+ºo (ex: cartaoSUS, tipoAtendimento, descricao)
    // 2. programId (se for inscri+º+úo em programa)
    // 3. linkedCitizens (se houver vincula+º+úo de cidad+úos estruturada)
    //    Formato: [{ linkedCitizenId, linkType, role, contextData }]
    //
    // customFormData N+âO deve conter:
    // - citizen_name, citizen_cpf, citizen_email, etc. (preenchidos automaticamente pelo backend via citizenId)
    // - Dados do cidad+úo autenticado (v+¬m do token JWT httpOnly)
    //
    // O backend enriquece automaticamente com:
    // - citizenId (do token de autentica+º+úo)
    // - Dados de composi+º+úo familiar (familyStatsService)
    // ============================================================================

    // Validar customFormData contra o JSON Schema do servi+ºo (se houver)
    if (customFormData && Object.keys(customFormData).length > 0) {
      const validation = validateServiceFormData(service, customFormData);

      if (!validation.valid) {
        console.warn('ÔØî [Service Request] Valida+º+úo falhou:', {
          errors: validation.errors,
          receivedFields: Object.keys(customFormData),
          serviceName: service.name,
          serviceId: service.id
        });

        return res.status(400).json({
          error: 'Dados do formul+írio inv+ílidos',
          details: validation.errors,
          // Ô£à DEBUG INFO: Ajuda a identificar qual campo est+í falhando
          debug: process.env.NODE_ENV === 'development' ? {
            receivedFields: Object.keys(customFormData),
            failedFields: validation.errors
              .map(e => e.match(/'([^']+)'/)?.[1])
              .filter(Boolean),
            serviceName: service.name
          } : undefined
        });
      }

      console.log('Ô£à [Service Request] Valida+º+úo OK - campos v+ílidos:', Object.keys(customFormData));
    } else {
      console.log('Ô䦴©Å [Service Request] Nenhum customFormData enviado (servi+ºo SEM_DADOS ou apenas description)');
    }

    const {
      description,
      schedulingData,
      priority = 3
        } = req.body;

    // Parse locationData se for string (vindo de FormData)
    let locationData = req.body.locationData;
    if (typeof locationData === 'string') {
      try {
        locationData = JSON.parse(locationData);
      } catch (e) {
        console.warn('Erro ao parsear locationData:', e);
        locationData = undefined;
      }
    }
    console.log('📍 [Service Request] locationData parseado:', locationData);

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'Descri+º+úo +® obrigat+¦ria' });
    }
    const { protocolModuleService } = await import('../services/protocol-module.service');

    // Preparar formData com citizenId
    const moduleFormData = {
      citizenId,
      ...customFormData
        };

    console.log('­ƒôÑ Dados recebidos do frontend:');
    console.log('  - citizenId:', citizenId);
    console.log('  - serviceId:', serviceId);
    console.log('  - customFormData:', JSON.stringify(customFormData, null, 2));
    console.log('  - moduleFormData (com citizenId):', JSON.stringify(moduleFormData, null, 2));

    // ✅ VALIDAÇÃO DE UNICIDADE: Verificar se cidadão pode criar este protocolo
    console.log('🔍 Validando unicidade do protocolo...');
    const uniquenessValidation = await validateProtocolUniqueness(
      citizenId,
      serviceId,
      moduleFormData
    );

    if (!uniquenessValidation.canCreate) {
      console.log(`   ❌ Validação falhou: ${uniquenessValidation.reason}`);
      return res.status(400).json({
        error: uniquenessValidation.errorMessage || 'Não é possível criar este protocolo',
        reason: uniquenessValidation.reason,
        existingProtocolNumber: uniquenessValidation.existingProtocolNumber
      });
    }

    console.log('   ✓ Validação de unicidade passou');

    const result = await protocolModuleService.createProtocolWithModule({
      citizenId,
      serviceId,
      formData: moduleFormData,
      description, // Descri+º+úo fornecida pelo cidad+úo
      createdById: undefined, // Cidad+úo criando
      latitude: locationData?.latitude,
      longitude: locationData?.longitude,
      address: locationData?.address,
      attachments: attachments as any
        });

    console.log(`Ô£à Protocolo ${result.protocol.number} criado ${result.hasModule ? 'COM m+¦dulo' : 'SEM m+¦dulo'}`);
    if (result.hasModule) {
      console.log(`   Protocolo vinculado ao m+¦dulo: ${result.protocol.moduleType}`);
    }

    console.log(`Protocolo ${result.protocol.number} criado ${result.hasModule ? 'COM módulo' : 'SEM módulo'}`);
    if (result.hasModule) {
      console.log(`   Protocolo vinculado ao módulo: ${result.protocol.moduleType}`);
    }

    // Persistir documentos reais na tabela protocol_documents
    let uploadedDocsResult: any[] = [];
    if (uploadedFiles.length > 0) {
      try {
        const uploadResult = await documentUploadService.uploadDocumentsToProtocol({
          protocolId: result.protocol.id,
          files: uploadedFiles,
          uploadedBy: citizenId,
          documentTypes
        });
        uploadedDocsResult = uploadResult.uploadedDocuments || [];
        console.log(`Documentos salvos em protocol_documents para o protocolo ${result.protocol.id}`);
      } catch (docErr) {
        console.error('Erro ao salvar documentos do protocolo:', docErr);
      }
    }

    // Criar pendentes para documentos obrigatórios que não foram enviados
    await ensureRequiredProtocolDocuments(result.protocol.id, service, uploadedDocsResult);

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
    console.error('Erro ao solicitar servi+ºo:', error);

    // Verificar se +® erro de valida+º+úo de neg+¦cio
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Erros de duplica+º+úo/valida+º+úo devem retornar 400 (Bad Request) ou 409 (Conflict)
      if (
        errorMessage.includes('j+í est+í cadastrado') ||
        errorMessage.includes('j+í existe') ||
        errorMessage.includes('duplicado') ||
        errorMessage.includes('n+úo encontrado') ||
        errorMessage.includes('obrigat+¦rio') ||
        errorMessage.includes('inv+ílido')
      ) {
        return res.status(400).json({
          error: error.message,
          details: 'Erro de valida+º+úo'
        });
      }
    }

    // Outros erros s+úo 500
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

// POST /api/services/:id/favorite - Favoritar servi+ºo (futuro)
router.post('/:id/favorite', async (req, res) => {
  try {
    // Implementa+º+úo futura para favoritos
    res.json({ message: 'Funcionalidade de favoritos em desenvolvimento' });
  } catch (error) {
    console.error('Erro ao favoritar servi+ºo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcula dist+óncia entre dois pontos (f+¦rmula de Haversine)
 * Retorna dist+óncia em km
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






