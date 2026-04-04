import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AuthenticatedRequest, SuccessResponse, ErrorResponse } from '../types';
import { validateCPF, validateStrongPassword } from '../utils/validators';
import { asyncHandler } from '../utils/express-helpers';
import { BCRYPT_ROUNDS, JWT as JWT_CONFIG } from '../config/security';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rate-limit';
import { accountLockoutMiddleware, recordFailedLogin, resetFailedAttempts } from '../middleware/account-lockout';
import { logLoginSuccess, logLoginFailed, AUDIT_EVENTS, logAuditEvent } from '../utils/audit-logger';
import { sanitizeForLog } from '../utils/logger';
import { transactionalEmailService } from '../lib/email/TransactionalEmailService';
import messageNotificationService from '../lib/messages/MessageNotificationService';
import { getSystemEmail } from '../utils/email-domain.utils';
import { syncCitizenPersonIdentity } from '../services/person-identity.service';
import { isCpfLike, normalizeCpf, normalizeEmail, normalizeNullableString } from '../utils/identity';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import facePlatformClientService from '../services/face-platform-client.service';
import { autoPromoteToGold, getCitizenAccessLevelSummary } from '../services/citizen-verification.service';

const router = Router();

// ✅ PADRONIZADO: Schemas de validação alinhados com nomenclatura do banco
const registerSchema = z.object({
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/\d/, 'Senha deve conter pelo menos um número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos um caractere especial'),
  municipioId: z.string().optional(),
  codigoIbge: z.string().optional(),
  nomeMunicipio: z.string().optional(),
  ufMunicipio: z.string().optional(),
  // ✅ Address com nomenclatura do banco (português)
  address: z
    .object({
      cep: z.string(),
      logradouro: z.string(),
      numero: z.string(),
      complemento: z.string().optional(),
      bairro: z.string(),
      cidade: z.string(),
      uf: z.string(),
      pontoReferencia: z.string().optional()
        })
    .optional()
        });

const loginSchema = z.object({
  login: z.string(), // CPF ou email
  password: z.string()
        });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Nova senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Nova senha deve conter pelo menos uma letra minúscula')
    .regex(/\d/, 'Nova senha deve conter pelo menos um número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Nova senha deve conter pelo menos um caractere especial')
        });

// POST /api/auth/citizen/register - Cadastro de cidadão (com rate limiting)
router.post('/register', registerRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('📝 Dados recebidos no cadastro:', sanitizeForLog(req.body));

    const data = registerSchema.parse(req.body);
    const cleanCpf = normalizeCpf(data.cpf);
    const normalizedEmail = normalizeEmail(data.email) || data.email;
    const normalizedName = normalizeNullableString(data.name) || data.name;
    const normalizedPhone = normalizeNullableString(data.phone);

    // Validar CPF
    if (!cleanCpf || !validateCPF(cleanCpf)) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    // Verificar se já existe cidadão com esse CPF
    const existingCitizen = await prisma.citizen.findFirst({
      where: {
        cpf: cleanCpf
        }
        });

    if (existingCitizen) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    // Verificar se já existe cidadão com esse email
    const existingEmail = await prisma.citizen.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
        }
        });

    if (existingEmail) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha com rounds padronizados (OWASP 2024)
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // Determinar municipioId
    let municipioId = data.municipioId;

    // Se não foi fornecido municipioId mas foi fornecido codigo IBGE, buscar ou criar município
    if (!municipioId && data.codigoIbge) {
      console.log('🏙️ Buscando município pelo código IBGE:', data.codigoIbge);

      // Buscar município na configuração (single tenant)
      let municipioConfig = await prisma.municipioConfig.findFirst({
        where: { codigoIbge: data.codigoIbge }
      });

      if (municipioConfig) {
        municipioId = municipioConfig.id;
        console.log('✅ Município encontrado na configuração:', municipioConfig.nomeMunicipio);
      } else {
        console.log('⚠️ Município não encontrado na configuração. Será necessário cadastro manual do município.');
      }
    }

    // Criar cidadão com status de verificação pendente (Bronze)
    const citizen = await prisma.$transaction(async (tx) => {
      const createdCitizen = await tx.citizen.create({
        data: {
          cpf: cleanCpf,
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,
          password: hashedPassword,
          address: data.address,
          municipioId: municipioId,
          isActive: true,
          verificationStatus: 'PENDING',
          registrationSource: 'SELF',
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
        rg: createdCitizen.rg,
        isActive: createdCitizen.isActive,
      });

      return createdCitizen;
    });

    // Gerar token JWT com expiração configurada
    const token = jwt.sign(
      {
        citizenId: citizen.id,
        userId: citizen.id, // Para compatibilidade com ultrazend-messages
        type: 'citizen',
        userType: 'CITIZEN' // Para compatibilidade com ultrazend-messages
      },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_CONFIG.CITIZEN_EXPIRES_IN }
    );

    // ✅ SEGURANÇA: Setar cookie httpOnly com o token
    res.cookie('digiurban_citizen_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.digiurban.com.br' : undefined
        });

    // Remover senha da resposta
    const { password: _, ...citizenData } = citizen;

    // Log de auditoria: registro de cidadão
    await logAuditEvent({
      citizenId: citizen.id,
      action: AUDIT_EVENTS.CITIZEN_REGISTERED,
      resource: '/api/auth/citizen/register',
      method: 'POST',
      details: {
        cpf: citizen.cpf,
        email: citizen.email
      },
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      success: true
        });

    // 📧 Enviar email de boas-vindas
    try {
      // Buscar EmailServer ativo
      const emailServer = await prisma.emailServer.findFirst({
        where: { isActive: true }
      });

      if (emailServer) {
        // Buscar configuração do município
        const municipioConfig = await prisma.municipioConfig.findUnique({
          where: { id: 'singleton' }
        });

        // Enviar email de boas-vindas de forma assíncrona (não bloqueia resposta)
        getSystemEmail('suporte').then(supportEmail => {
          transactionalEmailService.sendWelcomeEmail(
            emailServer.id,
            citizen.email,
            citizen.name,
            municipioConfig?.nome || 'DigiUrban',
            process.env.FRONTEND_URL || 'https://digiurban.com.br',
            process.env.SUPPORT_EMAIL || supportEmail
          ).catch(error => {
            console.error('Erro ao enviar email de boas-vindas:', error);
            // Não falhamos o cadastro por erro de email
          });
        });

        console.log('✅ Email de boas-vindas agendado para:', citizen.email);
      } else {
        console.warn('⚠️ EmailServer não configurado. Email de boas-vindas não enviado.');
      }
    } catch (error) {
      console.error('Erro ao processar email de boas-vindas:', error);
      // Não falhamos o cadastro por erro de email
    }

    // ✅ FASE 1: Enviar mensagem de boas-vindas via mensageiro
    try {
      await messageNotificationService.sendWelcomeMessage(citizen.id);
      console.log('✅ Mensagem de boas-vindas enviada via mensageiro');
    } catch (msgError) {
      console.error('Erro ao enviar mensagem de boas-vindas:', msgError);
      // Não falhamos o cadastro por erro de mensagem
    }

    // ✅ Mensagem diferenciada para cidadãos não atribuídos
    const isUnassigned = (req as any).isUnassignedCitizen;
    const requestedMunicipio = (req as any).requestedMunicipio;

    return res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      data: {
        citizen: citizenData
      }
    });
  } catch (error: unknown) {
    console.error('Erro no cadastro:', sanitizeForLog(error));

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: 'issues' in error ? error.issues : []
        });
    }

    // ✅ Tratamento específico para erros do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;

      // P2002: Unique constraint violation
      if (prismaError.code === 'P2002') {
        const fields = prismaError.meta?.target || [];
        return res.status(400).json({
          success: false,
          error: 'DUPLICATE_ENTRY',
          message: `Já existe um registro com ${fields.includes('cpf') ? 'este CPF' : fields.includes('email') ? 'este email' : 'estes dados'} neste município`,
          details: { fields }
        });
      }

      // P2003: Foreign key constraint violation
      if (prismaError.code === 'P2003') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REFERENCE',
          message: 'Município selecionado não encontrado'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'SYSTEM_ERROR',
      message: 'Erro interno do servidor'
    });
  }
}));

// POST /api/auth/citizen/login - Login INTELIGENTE de cidadão (sem precisar especificar tenant)
router.post('/login', loginRateLimiter, accountLockoutMiddleware('citizen'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const rawLogin = data.login.trim();
    const normalizedCpfLogin = isCpfLike(rawLogin) ? normalizeCpf(rawLogin) : null;
    const normalizedEmailLogin = normalizeEmail(rawLogin);
    const loginIdentifier = normalizedCpfLogin || normalizedEmailLogin || rawLogin;
    const loginConditions = [
      ...(normalizedCpfLogin ? [{ cpf: normalizedCpfLogin }] : []),
      ...(normalizedEmailLogin ? [{ email: normalizedEmailLogin }] : []),
    ];

    if (loginConditions.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Buscar cidadão
    const citizen = await prisma.citizen.findFirst({
      where: {
          OR: loginConditions,
        isActive: true
        }
        });

    if (!citizen || !citizen.password) {
      // Registrar tentativa falhada (sem tenant específico)
      await logAuditEvent({
        action: AUDIT_EVENTS.LOGIN_FAILED,
        resource: '/api/auth/citizen/login',
        method: 'POST',
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        success: false,
        details: { login: loginIdentifier, reason: 'Cidadão não encontrado' }
      });
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(data.password, citizen.password);
    if (!validPassword) {
      // Registrar tentativa falhada
      await recordFailedLogin('citizen', loginIdentifier);
      await logLoginFailed(req, loginIdentifier, 'Senha incorreta');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Resetar contador de tentativas falhadas após sucesso
    await resetFailedAttempts('citizen', citizen.id);

    // Log de auditoria: login bem-sucedido
    await logLoginSuccess(req, 'citizen', citizen.id);

    // Gerar token JWT com campos compatíveis com ultrazend-messages
    const token = jwt.sign(
      {
        citizenId: citizen.id,
        userId: citizen.id,
        type: 'citizen',
        userType: 'CITIZEN'
      },
      process.env.JWT_SECRET!,
      { expiresIn: JWT_CONFIG.CITIZEN_EXPIRES_IN }
    );

    // ✅ SEGURANÇA: Setar cookie httpOnly com o token
    res.cookie('digiurban_citizen_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.digiurban.com.br' : undefined
        });

    // Remover senha da resposta
    const { password: _, ...citizenData } = citizen;

    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      citizen: citizenData
    });
  } catch (error: unknown) {
    console.error('Erro no login:', sanitizeForLog(error));

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: 'issues' in error ? error.issues : []
        });
    }

    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}));

// GET /api/auth/citizen/me - Dados do cidadão logado
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  try {
    // ✅ Tentar obter token do cookie primeiro, depois do header (fallback)
    let token = req.cookies?.digiurban_citizen_token;

    // Fallback para header (compatibilidade temporária)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & { type: string; tenantId: string; citizenId: string };

    if (decoded.type !== 'citizen') {
      return res.status(401).json({ error: 'Token inválido para cidadão' });
    }

    // Buscar dados do cidadão
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: decoded.citizenId,
        isActive: true
      },
      include: {
        protocolsSimplified: {
          select: {
            id: true,
            number: true,
            status: true,
            createdAt: true,
            service: {
              select: {
                id: true,
                name: true
              }
            },
            department: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        familyAsHead: {
          select: {
            id: true,
            relationship: true,
            member: {
              select: {
                id: true,
                name: true,
                cpf: true
              }
            }
          }
        },
        notifications: {
          where: { isRead: false },
          select: {
            id: true,
            title: true,
            message: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!citizen) {
      return res.status(404).json({ error: 'Cidadão não encontrado' });
    }

    // Remover senha da resposta
    const { password: _, ...citizenData } = citizen;

    // Buscar informações do tenant (município)
    let tenantInfo = null;
    if (citizen.municipioId) {
      const tenant = await prisma.municipioConfig.findUnique({
        where: { id: citizen.municipioId },
        select: {
          id: true,
          nome: true,
          nomeMunicipio: true,
          ufMunicipio: true,
          codigoIbge: true,
          isActive: true
        }
      });
      // Mapear para o formato esperado pelo frontend
      if (tenant) {
        tenantInfo = {
          id: tenant.id,
          name: tenant.nome,
          nomeMunicipio: tenant.nomeMunicipio,
          ufMunicipio: tenant.ufMunicipio,
          codigoIbge: tenant.codigoIbge,
          status: tenant.isActive ? 'active' : 'inactive'
        };
      }
    }

    return res.json({
      citizen: citizenData,
      tenantId: citizen.municipioId || decoded.tenantId,
      tenant: tenantInfo
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar dados do cidadão:', error);

    if (error && typeof error === 'object' && 'name' in error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}));

// GET /api/auth/citizen/access-level - Critérios reais dos níveis do cidadão
router.get(
  '/access-level',
  citizenAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const citizenId = (req as any).citizenId as string | undefined;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    const accessLevel = await getCitizenAccessLevelSummary(citizenId);

    return res.json({
      success: true,
      data: { accessLevel },
    });
  })
);

// POST /api/auth/citizen/face-biometry - Autoatendimento de biometria facial
router.post(
  '/face-biometry',
  citizenAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const citizenId = (req as any).citizenId as string | undefined;
    const { imageBase64, embedding, modelName, modelVersion, sourceLabel, qualityScore, livenessScore, metadata } = req.body as {
      imageBase64?: string;
      embedding?: number[];
      modelName?: string;
      modelVersion?: string;
      sourceLabel?: string;
      qualityScore?: number;
      livenessScore?: number;
      metadata?: Record<string, unknown>;
    };

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'A validação facial ao vivo é obrigatória' });
    }

    const enrollment = await facePlatformClientService.createEnrollment({
      citizenId,
      sourceType: 'SELF_SERVICE',
      sourceLabel: sourceLabel?.trim() || 'Autoatendimento do cidadão por vídeo ao vivo',
      imageBase64,
      embedding: Array.isArray(embedding) ? embedding : undefined,
      qualityScore: typeof qualityScore === 'number' ? qualityScore : undefined,
      livenessScore: typeof livenessScore === 'number' ? livenessScore : undefined,
      metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
      modelName: modelName?.trim() || undefined,
      modelVersion: modelVersion?.trim() || undefined,
    });

    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        verificationStatus: true,
        verifiedBy: true,
      },
    });

    let accessLevel = await getCitizenAccessLevelSummary(citizenId);
    let promotedToGold = false;
    let promotionMessage: string | null = null;

    if (
      citizen?.verificationStatus === 'VERIFIED' &&
      citizen.verifiedBy &&
      accessLevel.goldCriteria.eligible
    ) {
      const promotion = await autoPromoteToGold(citizenId, citizen.verifiedBy);
      promotedToGold = promotion.success;
      promotionMessage = promotion.message;
      accessLevel = await getCitizenAccessLevelSummary(citizenId);
    }

    return res.status(201).json({
      success: true,
      message:
        promotedToGold
          ? 'Biometria facial validada automaticamente e nível Ouro liberado'
          : accessLevel.goldCriteria.biometricConfirmed
            ? 'Biometria facial validada automaticamente com sucesso'
            : accessLevel.goldCriteria.biometric.pendingEnrollments > 0
            ? 'Biometria facial enviada. Como a sessão não atingiu o limiar automático, ela ficou em revisão.'
            : 'Biometria facial cadastrada com sucesso',
      data: {
        enrollment,
        promotedToGold,
        promotionMessage,
        accessLevel,
      },
    });
  })
);

router.post(
  '/face-biometry/read',
  citizenAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const citizenId = (req as any).citizenId as string | undefined;
    const { imageBase64, embedding, modelName, modelVersion, qualityScore, livenessScore, metadata } = req.body as {
      imageBase64?: string;
      embedding?: number[];
      modelName?: string;
      modelVersion?: string;
      qualityScore?: number;
      livenessScore?: number;
      metadata?: Record<string, unknown>;
    };

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'A leitura facial ao vivo é obrigatória' });
    }

    if (!Array.isArray(embedding) || embedding.length === 0) {
      return res.status(400).json({ error: 'A leitura biométrica ao vivo exige embedding válido do face-api.js.' });
    }

    const result = await facePlatformClientService.readBiometry({
      imageBase64,
      expectedCitizenId: citizenId,
      sourceType: 'SELF_SERVICE_LIVE_READ',
      sourceLabel: 'Leitura biométrica ao vivo pelo painel do cidadão',
      embedding,
      qualityScore: typeof qualityScore === 'number' ? qualityScore : undefined,
      livenessScore: typeof livenessScore === 'number' ? livenessScore : undefined,
      metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
      modelName: modelName?.trim() || undefined,
      modelVersion: modelVersion?.trim() || undefined,
    });

    return res.json({
      success: true,
      message: result.recognized
        ? 'Biometria lida com sucesso'
        : 'Nenhuma biometria compatível foi encontrada nesta leitura ao vivo',
      data: result,
    });
  })
);

// POST /api/auth/citizen/change-password - Trocar senha
router.post('/change-password', asyncHandler(async (req: Request, res: Response) => {
  try {
    // ✅ Tentar obter token do cookie primeiro, depois do header (fallback)
    let token = req.cookies?.digiurban_citizen_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & { type: string; tenantId: string; citizenId: string };

    if (decoded.type !== 'citizen') {
      return res.status(401).json({ error: 'Token inválido para cidadão' });
    }

    const data = changePasswordSchema.parse(req.body);
    // Buscar cidadão
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: decoded.citizenId,
        isActive: true
      }
    });

    if (!citizen) {
      return res.status(404).json({ error: 'Cidadão não encontrado' });
    }

    // Verificar senha atual
    const validPassword = await bcrypt.compare(data.currentPassword, citizen.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Verificar se a nova senha é diferente da atual
    const isSamePassword = await bcrypt.compare(data.newPassword, citizen.password);
    if (isSamePassword) {
      return res.status(400).json({ error: 'A nova senha deve ser diferente da senha atual' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);

    // Atualizar senha
    await prisma.citizen.update({
      where: { id: citizen.id },
      data: { password: hashedPassword }
        });

    // Log de auditoria: troca de senha
    await logAuditEvent({
      citizenId: citizen.id,
      action: AUDIT_EVENTS.PASSWORD_CHANGE,
      resource: '/api/auth/citizen/change-password',
      method: 'POST',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      success: true
        });

    return res.json({
      success: true,
      message: 'Senha alterada com sucesso'
        });
  } catch (error: unknown) {
    console.error('Erro ao trocar senha:', error);

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error
        });
    }

    if (error && typeof error === 'object' && 'name' in error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}));

// PUT /api/auth/citizen/profile - Atualizar dados do perfil
// ✅ PADRONIZADO: Schema aceita null para permitir limpeza de dados
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().nullable().optional(),
  phoneSecondary: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  rg: z.string().nullable().optional(),
  motherName: z.string().nullable().optional(),
  maritalStatus: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  familyIncome: z.string().nullable().optional(),
  address: z
    .object({
      cep: z.string().optional(),
      logradouro: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
      bairro: z.string().optional(),
      cidade: z.string().optional(),
      uf: z.string().optional(),
      pontoReferencia: z.string().optional()
        })
    .optional()
        });

router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  try {
    // ✅ Tentar obter token do cookie primeiro, depois do header (fallback)
    let token = req.cookies?.digiurban_citizen_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload & { type: string; tenantId: string; citizenId: string };

    if (decoded.type !== 'citizen') {
      return res.status(401).json({ error: 'Token inválido para cidadão' });
    }

    const data = updateProfileSchema.parse(req.body);
    // Buscar cidadão
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: decoded.citizenId,
        isActive: true
      }
    });

    if (!citizen) {
      return res.status(404).json({ error: 'Cidadão não encontrado' });
    }

    // Verificar se o email já está em uso por outro cidadão do mesmo tenant
    if (data.email && data.email !== citizen.email) {
      const normalizedEmail = normalizeEmail(data.email) || data.email;
      const existingEmail = await prisma.citizen.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive'
          },
          id: { not: citizen.id }
        }
      });

      if (existingEmail) {
        return res.status(400).json({ error: 'Email já está em uso por outro cidadão' });
      }
    }

    // Preparar dados para atualização
    console.log('📝 Dados recebidos para atualização:', sanitizeForLog(data));

    const updateData: any = {};

    // ✅ Campos obrigatórios
    if (data.name) updateData.name = data.name.trim();
    if (data.email) updateData.email = normalizeEmail(data.email) || data.email;

    // ✅ Campos opcionais - aceita null para limpar valores
    if (data.phone !== undefined) updateData.phone = normalizeNullableString(data.phone) || null;
    if (data.phoneSecondary !== undefined) updateData.phoneSecondary = data.phoneSecondary || null;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.rg !== undefined) updateData.rg = normalizeNullableString(data.rg) || null;
    if (data.motherName !== undefined) updateData.motherName = data.motherName || null;
    if (data.maritalStatus !== undefined) updateData.maritalStatus = data.maritalStatus || null;
    if (data.occupation !== undefined) updateData.occupation = data.occupation || null;
    if (data.familyIncome !== undefined) updateData.familyIncome = data.familyIncome || null;

    console.log('✅ Dados preparados para Prisma:', sanitizeForLog(updateData));

    // Mesclar endereço existente com novos dados
    if (data.address) {
      updateData.address = {
        ...citizen.address as any,
        ...data.address
        };
    }

    // Atualizar cidadão
    const updatedCitizen = await prisma.$transaction(async (tx) => {
      const updated = await tx.citizen.update({
        where: { id: citizen.id },
        data: updateData
      });

      await syncCitizenPersonIdentity(tx, {
        citizenId: citizen.id,
        currentPersonId: citizen.personId,
        cpf: citizen.cpf,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        rg: updated.rg,
        birthDate: updated.birthDate,
        isActive: updated.isActive,
      });

      return updated;
    });

    // Log de auditoria: atualização de perfil
    await logAuditEvent({
      citizenId: citizen.id,
      action: AUDIT_EVENTS.CITIZEN_UPDATED,
      resource: '/api/auth/citizen/profile',
      method: 'PUT',
      details: {
        updatedFields: Object.keys(updateData)
        },
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      success: true
        });

    // Remover senha da resposta
    const { password: _, ...citizenData } = updatedCitizen;

    return res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      citizen: citizenData
        });
  } catch (error: unknown) {
    console.error('Erro ao atualizar perfil:', error);

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: 'issues' in error ? error.issues : []
        });
    }

    if (error && typeof error === 'object' && 'name' in error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}));

// POST /api/auth/citizen/logout - Logout (limpar cookie)
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // ✅ Limpar cookie httpOnly
  res.clearCookie('digiurban_citizen_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
        });

  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
}));

// ======================================================================
// RECUPERAÇÃO DE SENHA
// ======================================================================

import { PasswordResetService } from '../services/password-reset.service';
const passwordResetService = new PasswordResetService();

/**
 * POST /api/auth/citizen/forgot-password
 * Solicita recuperação de senha
 */
router.post('/forgot-password', loginRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email } = z.object({
      email: z.string().email('Email inválido')
    }).parse(req.body);

    const result = await passwordResetService.createResetToken({
      email,
      userType: 'citizen'
    });

    res.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: error.issues[0]?.message || 'Dados inválidos'
      });
      return;
    }

    console.error('Error in forgot-password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação'
    });
  }
}));

/**
 * POST /api/auth/citizen/validate-reset-token
 * Valida token de recuperação
 */
router.post('/validate-reset-token', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token } = z.object({
      token: z.string().min(1, 'Token é obrigatório')
    }).parse(req.body);

    const result = await passwordResetService.validateToken({
      token,
      userType: 'citizen'
    });

    res.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        valid: false,
        message: error.issues[0]?.message || 'Dados inválidos'
      });
      return;
    }

    console.error('Error in validate-reset-token:', error);
    res.json({ valid: false });
  }
}));

/**
 * POST /api/auth/citizen/reset-password
 * Redefine senha usando token
 */
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = z.object({
      token: z.string().min(1, 'Token é obrigatório'),
      newPassword: z.string()
        .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
        .regex(/[A-Z]/, 'Nova senha deve conter pelo menos uma letra maiúscula')
        .regex(/[a-z]/, 'Nova senha deve conter pelo menos uma letra minúscula')
        .regex(/\d/, 'Nova senha deve conter pelo menos um número')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Nova senha deve conter pelo menos um caractere especial')
    }).parse(req.body);

    const result = await passwordResetService.resetPassword({
      token: data.token,
      newPassword: data.newPassword,
      userType: 'citizen'
    });

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    // Log de auditoria
    await logAuditEvent({
      action: AUDIT_EVENTS.PASSWORD_CHANGE,
      citizenId: undefined,
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      success: true,
      details: {
        method: 'password_reset',
        userType: 'citizen'
      }
    });

    res.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: error.issues[0]?.message || 'Dados inválidos'
      });
      return;
    }

    console.error('Error in reset-password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha'
    });
  }
}));

export default router;
