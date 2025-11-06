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

const router = Router();

// Schemas de validação com senha forte
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
  address: z
    .object({
      street: z.string(),
      number: z.string(),
      neighborhood: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string()
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

    // Validar CPF
    if (!validateCPF(data.cpf)) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    // Verificar se já existe cidadão com esse CPF
    const existingCitizen = await prisma.citizen.findFirst({
      where: {
        cpf: data.cpf
        }
        });

    if (existingCitizen) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    // Verificar se já existe cidadão com esse email
    const existingEmail = await prisma.citizen.findFirst({
      where: {
        email: data.email
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
    const citizen = await prisma.citizen.create({
      data: {
        cpf: data.cpf,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        address: data.address,
        municipioId: municipioId,
        isActive: true,
        verificationStatus: 'PENDING', // Bronze - pendente de validação administrativa
        registrationSource: 'SELF', // Auto-cadastro pelo portal do cidadão
      }
        });

    // Gerar token JWT com expiração configurada
    const token = jwt.sign(
      {
        citizenId: citizen.id,
        type: 'citizen'
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

    // Buscar cidadão
    const citizen = await prisma.citizen.findFirst({
      where: {
          OR: [{ cpf: data.login }, { email: data.login }],
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
        details: { login: data.login, reason: 'Cidadão não encontrado' }
      });
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(data.password, citizen.password);
    if (!validPassword) {
      // Registrar tentativa falhada
      await recordFailedLogin('citizen', data.login);
      await logLoginFailed(req, data.login, 'Senha incorreta');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Resetar contador de tentativas falhadas após sucesso
    await resetFailedAttempts('citizen', citizen.id);

    // Log de auditoria: login bem-sucedido
    await logLoginSuccess(req, 'citizen', citizen.id);

    // Gerar token JWT com tenantId do cidadão
    const token = jwt.sign(
      {
        citizenId: citizen.id,
        type: 'citizen'
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
      citizen: citizenData,
      // Single tenant: tenantId removido
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
        notifications: {
          where: { isRead: false },
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

    return res.json({
      citizen: citizenData
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar dados do cidadão:', error);

    if (error && typeof error === 'object' && 'name' in error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}));

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
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional()
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
      const existingEmail = await prisma.citizen.findFirst({
        where: {
          email: data.email,
          id: { not: citizen.id }
        }
      });

      if (existingEmail) {
        return res.status(400).json({ error: 'Email já está em uso por outro cidadão' });
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;

    // Mesclar endereço existente com novos dados
    if (data.address) {
      updateData.address = {
        ...citizen.address as any,
        ...data.address
        };
    }

    // Atualizar cidadão
    const updatedCitizen = await prisma.citizen.update({
      where: { id: citizen.id },
      data: updateData
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

export default router;
