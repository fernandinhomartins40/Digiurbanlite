import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requirePermission } from '../middleware/admin-auth';
import { asyncHandler } from '../utils/express-helpers';
import type { AuthenticatedRequest } from '../types';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../config/security';
import { syncCitizenPersonIdentity } from '../services/person-identity.service';
import { normalizeCpf, normalizeEmail, normalizeNullableString } from '../utils/identity';

const router = Router();

// Apply middleware
router.use(adminAuthMiddleware);

const PERSONAL_DOCUMENT_WHERE = {
  AND: [
    {
      OR: [{ sourceType: null }, { sourceType: 'UPLOAD' }],
    },
    {
      NOT: {
        documentType: {
          startsWith: 'Protocolo:',
        },
      },
    },
  ],
};

// POST /api/admin/citizens - Criar cidadÃ£o administrativamente (Prata/Verificado)
router.post(
  '/',
  requirePermission('citizens:create'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { cpf, name, email, phone, birthDate, password, address } = authReq.body;

    // ValidaÃ§Ãµes bÃ¡sicas
    if (!cpf || !name || !email) {
      res.status(400).json({
        success: false,
        error: 'CPF, nome e email sÃ£o obrigatÃ³rios'
        });
      return;
    }

    // Limpar CPF (remover pontos e traÃ§os)
    const cleanCpf = normalizeCpf(cpf);
    const normalizedEmail = normalizeEmail(email);
    const normalizedName = normalizeNullableString(name);
    const normalizedPhone = normalizeNullableString(phone);

    if (!cleanCpf || cleanCpf.length !== 11) {
      res.status(400).json({
        success: false,
        error: 'CPF invÃ¡lido'
        });
      return;
    }

    // Verificar se CPF jÃ¡ existe
    const existingCitizen = await prisma.citizen.findFirst({
      where: {
        cpf: cleanCpf
        }
        });

    if (existingCitizen) {
      res.status(400).json({
        success: false,
        error: 'CPF jÃ¡ cadastrado'
        });
      return;
    }

    // Verificar se email jÃ¡ existe
    const existingEmail = await prisma.citizen.findFirst({
      where: {
          email: {
            equals: normalizedEmail || email,
            mode: 'insensitive'
          }
        }
        });

    if (existingEmail) {
      res.status(400).json({
        success: false,
        error: 'Email jÃ¡ cadastrado'
        });
      return;
    }

    // Gerar senha hash (ou senha temporÃ¡ria se nÃ£o fornecida)
    let hashedPassword: string;
    if (password && password.length >= 8) {
      hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    } else {
      // Senha temporÃ¡ria aleatÃ³ria (cidadÃ£o pode redefinir depois)
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
    }

    // Criar cidadÃ£o
    const newCitizen = await prisma.$transaction(async (tx) => {
      const createdCitizen = await tx.citizen.create({
        data: {
          cpf: cleanCpf,
          name: normalizedName || name,
          email: normalizedEmail || email,
          phone: normalizedPhone,
          birthDate: birthDate ? new Date(birthDate) : null,
          password: hashedPassword,
          address: address || null,
          verificationStatus: 'VERIFIED',
          registrationSource: 'ADMIN',
          verifiedAt: new Date(),
          verifiedBy: authReq.user.id,
          isActive: true
        },
        select: {
          id: true,
          personId: true,
          cpf: true,
          name: true,
          email: true,
          phone: true,
          birthDate: true,
          address: true,
          verificationStatus: true,
          registrationSource: true,
          createdAt: true
        }
      });

      await syncCitizenPersonIdentity(tx, {
        citizenId: createdCitizen.id,
        currentPersonId: createdCitizen.personId,
        cpf: createdCitizen.cpf,
        name: createdCitizen.name,
        email: createdCitizen.email,
        phone: createdCitizen.phone,
        birthDate: createdCitizen.birthDate,
        isActive: true,
      });

      return createdCitizen;
    });

    res.status(201).json({
      success: true,
      message: 'CidadÃ£o cadastrado como Prata (Verificado)',
      data: { citizen: newCitizen }
        });
  })
);

// GET /api/admin/citizens/search - Buscar cidadÃ£os por nome ou CPF
router.get(
  '/search',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { q } = authReq.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      res.json({
        success: true,
        data: []
        });
      return;
    }

    const searchTerm = q.trim();
    const cleanCpf = searchTerm.replace(/\D/g, ''); // Remove pontuaÃ§Ã£o do CPF

    console.log(`ðŸ” [CITIZEN-SEARCH] Buscando por: "${searchTerm}" | CPF limpo: "${cleanCpf}"`);

    // Construir condiÃ§Ãµes de busca
    const searchConditions: any[] = [];

    // Buscar por nome (case-insensitive)
    if (searchTerm.length >= 2) {
      searchConditions.push({
        name: {
          contains: searchTerm,
          mode: 'insensitive' as const
        }
      });
    }

    // Buscar por CPF (se tiver nÃºmeros)
    if (cleanCpf.length > 0) {
      searchConditions.push({
        cpf: {
          contains: cleanCpf
        }
      });
    }

    // Buscar por email (se parecer um email)
    if (searchTerm.includes('@') || searchTerm.length >= 3) {
      searchConditions.push({
        email: {
          contains: searchTerm,
          mode: 'insensitive' as const
        }
      });
    }

    const citizens = await prisma.citizen.findMany({
      where: {
        isActive: true,
        OR: searchConditions
        },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        address: true,
        // âœ… CRÃTICO: Adicionar todos os campos para prÃ©-preenchimento no admin
        birthDate: true,
        rg: true,
        phoneSecondary: true,
        motherName: true,
        maritalStatus: true,
        occupation: true,
        familyIncome: true,
        verificationStatus: true
        },
      take: 10,
      orderBy: { name: 'asc' }
        });

    console.log(`âœ… [CITIZEN-SEARCH] Encontrados ${citizens.length} resultados`);
    if (citizens.length > 0) {
      console.log(`   Primeiros resultados: ${citizens.slice(0, 3).map(c => c.name).join(', ')}`);
    }

    res.json({
      success: true,
      data: citizens
        });
  })
);

// GET /api/admin/citizens - Listar TODOS os cidadÃ£os (para pÃ¡gina principal)
router.get(
  '/',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { page = '1', limit = '50', status, search } = authReq.query;

    console.log('ðŸ“‹ [CITIZENS] Listando cidadÃ£os:', { page, limit, status, search });

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where: any = {};

    if (status) {
      where.verificationStatus = status;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [citizens, total] = await Promise.all([
        prisma.citizen.findMany({
          where,
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            address: true,
            isActive: true,
            verificationStatus: true,
            registrationSource: true,
            verifiedAt: true,
            verifiedBy: true,
            createdAt: true,
            _count: {
              select: {
                documents: true,
                protocolsSimplified: true
              }
            }
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' }
          }),
        prisma.citizen.count({ where }),
      ]);

      console.log(`[CITIZENS] Retornando ${citizens.length} cidadaos de ${total} total`);

      const citizenIds = citizens.map((citizen) => citizen.id);
      const pendingDocumentCounts =
        citizenIds.length > 0
          ? await prisma.citizenDocument.groupBy({
              by: ['citizenId'],
              where: {
                citizenId: { in: citizenIds },
                status: {
                  in: ['PENDING', 'UNDER_REVIEW'],
                },
                ...PERSONAL_DOCUMENT_WHERE,
              },
              _count: {
                _all: true,
              },
            })
          : [];

      const pendingDocumentCountByCitizenId = new Map(
        pendingDocumentCounts.map((item) => [item.citizenId, item._count._all])
      );

      const normalizedCitizens = citizens.map((citizen) => ({
        ...citizen,
        _count: {
          ...citizen._count,
          documents: pendingDocumentCountByCitizenId.get(citizen.id) || 0,
        },
      }));

      res.json({
        success: true,
        citizens: normalizedCitizens,        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
          }
          });
    } catch (error) {
      console.error('âŒ [CITIZENS] Erro ao buscar cidadÃ£os:', error);
      throw error; // asyncHandler vai pegar e retornar erro 500
    }
  })
);

// GET /api/admin/citizens/pending - Listar cidadÃ£os aguardando verificaÃ§Ã£o
router.get(
  '/pending',
  requirePermission('citizens:verify'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    const pendingCitizens = await prisma.citizen.findMany({
      where: {
        verificationStatus: 'PENDING',
        isActive: true
        },
      select: {
        id: true,
        cpf: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        birthDate: true,
        registrationSource: true,
        createdAt: true,
        _count: {
          select: {
            protocolsSimplified: true,
            familyAsHead: true
        }
      }
        },
      orderBy: { createdAt: 'asc' }
        });

    res.json({
      success: true,
      data: {
        citizens: pendingCitizens,
        total: pendingCitizens.length
        }
        });
  })
);

// GET /api/admin/citizens/:id - Buscar cidadÃ£o por ID
router.get(
  '/:id',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;

    const citizen = await prisma.citizen.findFirst({
      where: {
        id
      },
      include: {
        protocolsSimplified: {
          include: {
            service: true,
            department: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        familyAsHead: {
          include: {
            member: true
          }
        },
        familyAsMember: {
          include: {
            head: true
          }
        }
      }
    });

    if (!citizen) {
      res.status(404).json({
        success: false,
        error: 'CidadÃ£o nÃ£o encontrado'
      });
      return;
    }

    // Remover senha da resposta
    const { password: _, ...citizenData } = citizen;

    res.json({
      success: true,
      data: { citizen: citizenData }
    });
  })
);

// PUT /api/admin/citizens/:id/verify - Aprovar cidadÃ£o (Bronze â†’ Prata)
router.put(
  '/:id/verify',
  requirePermission('citizens:verify'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const { notes } = authReq.body;

    // ValidaÃ§Ã£o de seguranÃ§a: cidadÃ£o existe
    const citizen = await prisma.citizen.findFirst({
      where: {
        id,
        verificationStatus: 'PENDING'
        }
        });

    if (!citizen) {
      res.status(404).json({
        success: false,
        error: 'CidadÃ£o nÃ£o encontrado ou jÃ¡ verificado'
        });
      return;
    }

    // TransaÃ§Ã£o para garantir integridade
    const updatedCitizen = await prisma.$transaction(async (tx) => {
      // 1. Atualizar status do cidadÃ£o
      const updated = await tx.citizen.update({
        where: { id },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: authReq.user.id,
          verificationNotes: notes
        },
        select: {
          id: true,
          name: true,
          cpf: true,
          email: true,
          verificationStatus: true,
          verifiedAt: true
        }
      });

      // 2. Criar notificaÃ§Ã£o para o cidadÃ£o
      await tx.notification.create({
        data: {
          citizenId: id,
          title: 'Cadastro Aprovado! ðŸŽ‰',
          message:
            'Seu cadastro foi verificado e aprovado pela administraÃ§Ã£o. Agora vocÃª tem acesso completo a todos os serviÃ§os municipais.',
          type: 'VERIFICATION_APPROVED',
          isRead: false
        }
        });

      return updated;
    });

    res.json({
      success: true,
      message: 'CidadÃ£o verificado com sucesso',
      data: { citizen: updatedCitizen }
        });
  })
);

// PUT /api/admin/citizens/:id/reject - Rejeitar cadastro
router.put(
  '/:id/reject',
  requirePermission('citizens:verify'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const { reason } = authReq.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Motivo da rejeiÃ§Ã£o Ã© obrigatÃ³rio'
        });
      return;
    }

    const citizen = await prisma.citizen.findFirst({
      where: {
        id,
        verificationStatus: 'PENDING'
        }
        });

    if (!citizen) {
      res.status(404).json({
        success: false,
        error: 'CidadÃ£o nÃ£o encontrado'
        });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Atualizar status
      await tx.citizen.update({
        where: { id },
        data: {
          verificationStatus: 'REJECTED',
          verifiedAt: new Date(),
          verifiedBy: authReq.user.id,
          verificationNotes: reason,
          isActive: false, // Desativa o cadastro
        }
        });

      // 2. Notificar cidadÃ£o
      await tx.notification.create({
        data: {
          citizenId: id,
          title: 'Cadastro NÃ£o Aprovado',
          message: `Seu cadastro nÃ£o foi aprovado. Motivo: ${reason}. Por favor, entre em contato com a prefeitura para mais informaÃ§Ãµes.`,
          type: 'VERIFICATION_REJECTED',
          isRead: false
        }
        });
    });

    res.json({
      success: true,
      message: 'Cadastro rejeitado'
        });
  })
);

// PUT /api/admin/citizens/:id/promote-gold - Promover cidadÃ£o para nÃ­vel GOLD
router.put(
  '/:id/promote-gold',
  requirePermission('citizens:verify'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const { notes } = authReq.body;

    // ValidaÃ§Ã£o: cidadÃ£o deve estar no status VERIFIED (Prata)
    const citizen = await prisma.citizen.findFirst({
      where: {
        id,
        verificationStatus: 'VERIFIED'
        }
        });

    if (!citizen) {
      res.status(404).json({
        success: false,
        error: 'CidadÃ£o nÃ£o encontrado ou nÃ£o possui nÃ­vel Prata'
        });
      return;
    }

    // TransaÃ§Ã£o para garantir integridade
    const updatedCitizen = await prisma.$transaction(async (tx) => {
      // 1. Promover para GOLD
      const updated = await tx.citizen.update({
        where: { id },
        data: {
          verificationStatus: 'GOLD',
          verificationNotes: notes
        },
        select: {
          id: true,
          name: true,
          cpf: true,
          email: true,
          verificationStatus: true
        }
      });

      // 2. Criar notificaÃ§Ã£o para o cidadÃ£o
      await tx.notification.create({
        data: {
          citizenId: id,
          title: 'Cadastro Promovido para Ouro! ðŸ¥‡',
          message:
            'ParabÃ©ns! Seu cadastro foi promovido para o nÃ­vel OURO. Agora vocÃª tem acesso prioritÃ¡rio mÃ¡ximo a todos os serviÃ§os e programas municipais.',
          type: 'VERIFICATION_UPGRADED',
          isRead: false
        }
        });

      return updated;
    });

    res.json({
      success: true,
      message: 'CidadÃ£o promovido para nÃ­vel GOLD com sucesso',
      data: { citizen: updatedCitizen }
        });
  })
);

// GET /api/admin/citizens/:id/details - Detalhes completos do cidadÃ£o
router.get(
  '/:id/details',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;

    const citizen = await prisma.citizen.findFirst({
      where: {
        id
        },
      include: {
        familyAsHead: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                cpf: true
        }
      }
        }
        },
        protocolsSimplified: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            service: { select: { name: true } },
            department: { select: { name: true } },
            documentFiles: {
              orderBy: { uploadedAt: 'desc' },
              select: {
                id: true,
                documentType: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                status: true,
                uploadedAt: true,
                validatedAt: true,
                validatedBy: true,
                rejectedAt: true,
                rejectionReason: true,
                version: true
              }
            }
        }
        },
        documents: {
          where: {
            AND: [
              {
                OR: [
                  { sourceType: null },
                  { sourceType: 'UPLOAD' }
                ]
              },
              {
                NOT: {
                  documentType: {
                    startsWith: 'Protocolo:'
                  }
                }
              }
            ]
          },
          orderBy: { uploadedAt: 'desc' },
          select: {
            id: true,
            documentType: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            status: true,
            notes: true,
            uploadedAt: true,
            reviewedBy: true,
            reviewedAt: true,
            rejectionReason: true,
            sourceType: true
          }
        },
        _count: {
          select: {
            protocolsSimplified: true,
            familyAsHead: true,
            notifications: true,
            documents: true
        }
      }
        }
        });

    if (!citizen) {
      res.status(404).json({
        success: false,
        error: 'CidadÃ£o nÃ£o encontrado'
        });
      return;
    }

    // Buscar documentos gerados por protocolos separadamente
    const generatedDocuments = await prisma.citizenDocument.findMany({
      where: {
        citizenId: id,
        OR: [
          { sourceType: 'PROTOCOL' },
          {
            documentType: {
              startsWith: 'Protocolo:'
            }
          }
        ]
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        status: true,
        notes: true,
        uploadedAt: true,
        reviewedBy: true,
        reviewedAt: true,
        rejectionReason: true,
        sourceType: true,
        sourceDocumentId: true
      }
    });

    const normalizedGeneratedDocuments = generatedDocuments.map((doc) => ({
      ...doc,
      status: (doc.status === 'PENDING' || doc.status === 'UNDER_REVIEW' || doc.status === 'UPLOADED')
        ? 'APPROVED'
        : doc.status
    }));

    // Mapear campos dos protocolos para o formato esperado pelo frontend
    const protocols = (citizen as any).protocolsSimplified?.map((p: any) => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      createdAt: p.createdAt,
      service: p.service,
      department: p.department,
      documentFiles: p.documentFiles
    })) || [];

    res.json({
      success: true,
      data: {
        citizen: {
          ...citizen,
          _count: {
            ...citizen._count,
            documents: citizen.documents.length
          },
          protocols,
          generatedDocuments: normalizedGeneratedDocuments,
          protocolsSimplified: undefined
        }
      }
        });
  })
);

// GET /api/admin/citizens/:id/family - ComposiÃ§Ã£o familiar
router.get(
  '/:id/family',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;

    const family = await prisma.familyComposition.findMany({
      where: {
        headId: id
        },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            birthDate: true
        }
      }
        },
      orderBy: { createdAt: 'asc' }
        });

    res.json({
      success: true,
      data: { family }
        });
  })
);

// GET /api/admin/citizens/:id/family/invites - Lista de convites de famÃ­lia
router.get(
  '/:id/family/invites',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;

    const invites = await prisma.familyInvite.findMany({
      where: {
        headId: id
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { invites }
    });
  })
);

// POST /api/admin/citizens/:id/family - Adicionar membro (REFATORADO - USA SERVIÃ‡O CENTRALIZADO)
router.post(
  '/:id/family',
  requirePermission('citizens:update'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const { memberId, relationship, isDependent, monthlyIncome, occupation, education, hasDisability } = authReq.body;

    // Importar serviÃ§o centralizado
    const { familyService } = require('../services/family.service');

    const result = await familyService.addFamilyMember(id, {
      memberId,
      relationship,
      isDependent: isDependent || false,
      monthlyIncome,
      occupation,
      education,
      hasDisability
    });

    if (!result.success) {
      const statusCode = result.error?.includes('nÃ£o encontrado') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Membro adicionado com sucesso',
      data: {
        member: result.data,
        warnings: result.warnings
      }
    });
  })
);

// DELETE /api/admin/citizens/:id/family/:memberId - Remover membro (REFATORADO)
router.delete(
  '/:id/family/:memberId',
  requirePermission('citizens:update'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { memberId } = authReq.params;

    const { familyService } = require('../services/family.service');

    const result = await familyService.removeFamilyMember(memberId);

    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      message: 'Membro removido com sucesso'
    });
  })
);

// POST /api/admin/citizens/:id/vulnerability - Adicionar vulnerabilidade
router.post(
  '/:id/vulnerability',
  requirePermission('social-assistance:create'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const {
      familyCode,
      memberCount,
      monthlyIncome,
      riskLevel,
      vulnerabilityType,
      socialWorker,
      observations
        } = authReq.body;

    // Funcionalidade de vulnerabilidade foi removida do schema
    res.status(501).json({
      success: false,
      error: 'Funcionalidade de vulnerabilidade nÃ£o implementada'
    });
    return;

    /* CÃ“DIGO COMENTADO - MODELO vulnerableFamily REMOVIDO DO SCHEMA
    const citizen = await prisma.citizen.findFirst({
      where: {
        id
        },
      include: { vulnerableFamilyData: true }
      });

    if (!citizen) {
      res.status(404).json({
        success: false,
        error: 'CidadÃ£o nÃ£o encontrado'
        });
      return;
    }

    if (citizen.vulnerableFamilyData) {
      res.status(400).json({
        success: false,
        error: 'CidadÃ£o jÃ¡ possui registro de vulnerabilidade'
        });
      return;
    }

    const vulnerability = await prisma.vulnerableFamily.create({
      data: {
        citizenId: id,
        familyCode,
        memberCount,
        monthlyIncome,
        riskLevel: riskLevel || 'LOW',
        vulnerabilityType,
        socialWorker,
        observations,
        status: 'ACTIVE'
        },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            address: true
        }
      }
        }
        });

    res.status(201).json({
      success: true,
      message: 'Dados de vulnerabilidade adicionados',
      data: { vulnerability }
        });
    */
  })
);

// PUT /api/admin/citizens/:id/vulnerability - Atualizar vulnerabilidade
router.put(
  '/:id/vulnerability',
  requirePermission('social-assistance:update'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    // Funcionalidade de vulnerabilidade foi removida do schema
    res.status(501).json({
      success: false,
      error: 'Funcionalidade de vulnerabilidade nÃ£o implementada'
    });
    return;

    /* CÃ“DIGO COMENTADO - MODELO vulnerableFamily REMOVIDO DO SCHEMA
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const updateData = authReq.body;

    const vulnerability = await prisma.vulnerableFamily.findFirst({
      where: {
        citizenId: id
        }
        });

    if (!vulnerability) {
      res.status(404).json({
        success: false,
        error: 'Dados de vulnerabilidade nÃ£o encontrados'
        });
      return;
    }

    const updated = await prisma.vulnerableFamily.update({
      where: { id: vulnerability.id },
      data: {
        ...updateData,
        updatedAt: new Date()
        }
        });

    res.json({
      success: true,
      message: 'Dados atualizados',
      data: { vulnerability: updated }
        });
    */
  })
);

// GET /api/admin/citizens/vulnerable - Listar famÃ­lias vulnerÃ¡veis
router.get(
  '/vulnerable',
  requirePermission('social-assistance:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    // Funcionalidade de vulnerabilidade foi removida do schema
    res.status(501).json({
      success: false,
      error: 'Funcionalidade de vulnerabilidade nÃ£o implementada'
    });
    return;

    /* CÃ“DIGO COMENTADO - MODELO vulnerableFamily REMOVIDO DO SCHEMA
    const authReq = req as AuthenticatedRequest;
    const { riskLevel, status } = authReq.query;

    const where: any = {};
    if (riskLevel) where.riskLevel = riskLevel;
    if (status) where.status = status;

    const vulnerableFamilies = await prisma.vulnerableFamily.findMany({
      where,
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            address: true,
            familyAsHead: {
              select: {
                relationship: true,
                isDependent: true,
                member: {
                  select: {
                    name: true
        }
      }
        }
        }
        }
        },
        benefitRequests: {
          where: { status: { in: ['PENDING', 'APPROVED'] } }
        },
        homeVisits: {
          orderBy: { visitDate: 'desc' },
          take: 1
        }
        },
      orderBy: [{ riskLevel: 'desc' }, { updatedAt: 'desc' }]
        });

    res.json({
      success: true,
      data: {
        families: vulnerableFamilies,
        total: vulnerableFamilies.length
        }
        });
    */
  })
);

export default router;
