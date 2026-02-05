import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requirePermission } from '../middleware/admin-auth';
import { asyncHandler } from '../utils/express-helpers';
import type { AuthenticatedRequest } from '../types';
import * as bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../config/security';

const router = Router();

// Apply middleware
router.use(adminAuthMiddleware);

// POST /api/admin/citizens - Criar cidadão administrativamente (Prata/Verificado)
router.post(
  '/',
  requirePermission('citizens:create'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { cpf, name, email, phone, birthDate, password, address } = authReq.body;

    // Validações básicas
    if (!cpf || !name || !email) {
      res.status(400).json({
        success: false,
        error: 'CPF, nome e email são obrigatórios'
        });
      return;
    }

    // Limpar CPF (remover pontos e traços)
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      res.status(400).json({
        success: false,
        error: 'CPF inválido'
        });
      return;
    }

    // Verificar se CPF já existe
    const existingCitizen = await prisma.citizen.findFirst({
      where: {
        cpf: cleanCpf
        }
        });

    if (existingCitizen) {
      res.status(400).json({
        success: false,
        error: 'CPF já cadastrado'
        });
      return;
    }

    // Verificar se email já existe
    const existingEmail = await prisma.citizen.findFirst({
      where: {
          email: email.toLowerCase()
        }
        });

    if (existingEmail) {
      res.status(400).json({
        success: false,
        error: 'Email já cadastrado'
        });
      return;
    }

    // Gerar senha hash (ou senha temporária se não fornecida)
    let hashedPassword: string;
    if (password && password.length >= 8) {
      hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    } else {
      // Senha temporária aleatória (cidadão pode redefinir depois)
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
    }

    // Criar cidadão
    const newCitizen = await prisma.citizen.create({
      data: {
        cpf: cleanCpf,
        name,
        email: email.toLowerCase(),
        phone: phone || null,
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

    res.status(201).json({
      success: true,
      message: 'Cidadão cadastrado como Prata (Verificado)',
      data: { citizen: newCitizen }
        });
  })
);

// GET /api/admin/citizens/search - Buscar cidadãos por nome ou CPF
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
    const cleanCpf = searchTerm.replace(/\D/g, ''); // Remove pontuação do CPF

    console.log(`🔍 [CITIZEN-SEARCH] Buscando por: "${searchTerm}" | CPF limpo: "${cleanCpf}"`);

    // Construir condições de busca
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

    // Buscar por CPF (se tiver números)
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
        // ✅ CRÍTICO: Adicionar todos os campos para pré-preenchimento no admin
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

    console.log(`✅ [CITIZEN-SEARCH] Encontrados ${citizens.length} resultados`);
    if (citizens.length > 0) {
      console.log(`   Primeiros resultados: ${citizens.slice(0, 3).map(c => c.name).join(', ')}`);
    }

    res.json({
      success: true,
      data: citizens
        });
  })
);

// GET /api/admin/citizens - Listar TODOS os cidadãos (para página principal)
router.get(
  '/',
  requirePermission('citizens:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { page = '1', limit = '50', status, search } = authReq.query;

    console.log('📋 [CITIZENS] Listando cidadãos:', { page, limit, status, search });

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

      console.log(`✅ [CITIZENS] Retornando ${citizens.length} cidadãos de ${total} total`);

      res.json({
        success: true,
        citizens,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
          }
          });
    } catch (error) {
      console.error('❌ [CITIZENS] Erro ao buscar cidadãos:', error);
      throw error; // asyncHandler vai pegar e retornar erro 500
    }
  })
);

// GET /api/admin/citizens/pending - Listar cidadãos aguardando verificação
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

// GET /api/admin/citizens/:id - Buscar cidadão por ID
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
        error: 'Cidadão não encontrado'
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

// PUT /api/admin/citizens/:id/verify - Aprovar cidadão (Bronze → Prata)
router.put(
  '/:id/verify',
  requirePermission('citizens:verify'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const { notes } = authReq.body;

    // Validação de segurança: cidadão existe
    const citizen = await prisma.citizen.findFirst({
      where: {
        id,
        verificationStatus: 'PENDING'
        }
        });

    if (!citizen) {
      res.status(404).json({
        success: false,
        error: 'Cidadão não encontrado ou já verificado'
        });
      return;
    }

    // Transação para garantir integridade
    const updatedCitizen = await prisma.$transaction(async (tx) => {
      // 1. Atualizar status do cidadão
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

      // 2. Criar notificação para o cidadão
      await tx.notification.create({
        data: {
          citizenId: id,
          title: 'Cadastro Aprovado! 🎉',
          message:
            'Seu cadastro foi verificado e aprovado pela administração. Agora você tem acesso completo a todos os serviços municipais.',
          type: 'VERIFICATION_APPROVED',
          isRead: false
        }
        });

      return updated;
    });

    res.json({
      success: true,
      message: 'Cidadão verificado com sucesso',
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
        error: 'Motivo da rejeição é obrigatório'
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
        error: 'Cidadão não encontrado'
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

      // 2. Notificar cidadão
      await tx.notification.create({
        data: {
          citizenId: id,
          title: 'Cadastro Não Aprovado',
          message: `Seu cadastro não foi aprovado. Motivo: ${reason}. Por favor, entre em contato com a prefeitura para mais informações.`,
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

// PUT /api/admin/citizens/:id/promote-gold - Promover cidadão para nível GOLD
router.put(
  '/:id/promote-gold',
  requirePermission('citizens:verify'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const { notes } = authReq.body;

    // Validação: cidadão deve estar no status VERIFIED (Prata)
    const citizen = await prisma.citizen.findFirst({
      where: {
        id,
        verificationStatus: 'VERIFIED'
        }
        });

    if (!citizen) {
      res.status(404).json({
        success: false,
        error: 'Cidadão não encontrado ou não possui nível Prata'
        });
      return;
    }

    // Transação para garantir integridade
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

      // 2. Criar notificação para o cidadão
      await tx.notification.create({
        data: {
          citizenId: id,
          title: 'Cadastro Promovido para Ouro! 🥇',
          message:
            'Parabéns! Seu cadastro foi promovido para o nível OURO. Agora você tem acesso prioritário máximo a todos os serviços e programas municipais.',
          type: 'VERIFICATION_UPGRADED',
          isRead: false
        }
        });

      return updated;
    });

    res.json({
      success: true,
      message: 'Cidadão promovido para nível GOLD com sucesso',
      data: { citizen: updatedCitizen }
        });
  })
);

// GET /api/admin/citizens/:id/details - Detalhes completos do cidadão
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
            OR: [
              { sourceType: null },
              { sourceType: 'UPLOAD' }
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
        error: 'Cidadão não encontrado'
        });
      return;
    }

    // Buscar documentos gerados por protocolos separadamente
    const generatedDocuments = await prisma.citizenDocument.findMany({
      where: {
        citizenId: id,
        sourceType: 'PROTOCOL'
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
          protocols,
          generatedDocuments,
          protocolsSimplified: undefined
        }
      }
        });
  })
);

// GET /api/admin/citizens/:id/family - Composição familiar
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

// POST /api/admin/citizens/:id/family - Adicionar membro (REFATORADO - USA SERVIÇO CENTRALIZADO)
router.post(
  '/:id/family',
  requirePermission('citizens:update'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const { id } = authReq.params;
    const { memberId, relationship, isDependent, monthlyIncome, occupation, education, hasDisability } = authReq.body;

    // Importar serviço centralizado
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
      const statusCode = result.error?.includes('não encontrado') ? 404 : 400;
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
      error: 'Funcionalidade de vulnerabilidade não implementada'
    });
    return;

    /* CÓDIGO COMENTADO - MODELO vulnerableFamily REMOVIDO DO SCHEMA
    const citizen = await prisma.citizen.findFirst({
      where: {
        id
        },
      include: { vulnerableFamilyData: true }
      });

    if (!citizen) {
      res.status(404).json({
        success: false,
        error: 'Cidadão não encontrado'
        });
      return;
    }

    if (citizen.vulnerableFamilyData) {
      res.status(400).json({
        success: false,
        error: 'Cidadão já possui registro de vulnerabilidade'
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
      error: 'Funcionalidade de vulnerabilidade não implementada'
    });
    return;

    /* CÓDIGO COMENTADO - MODELO vulnerableFamily REMOVIDO DO SCHEMA
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
        error: 'Dados de vulnerabilidade não encontrados'
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

// GET /api/admin/citizens/vulnerable - Listar famílias vulneráveis
router.get(
  '/vulnerable',
  requirePermission('social-assistance:read'),
  asyncHandler(async (req, res: Response): Promise<void> => {
    // Funcionalidade de vulnerabilidade foi removida do schema
    res.status(501).json({
      success: false,
      error: 'Funcionalidade de vulnerabilidade não implementada'
    });
    return;

    /* CÓDIGO COMENTADO - MODELO vulnerableFamily REMOVIDO DO SCHEMA
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
