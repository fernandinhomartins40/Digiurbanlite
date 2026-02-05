/**
 * ============================================================================
 * ROTAS: ADMIN PREFERENCES
 * ============================================================================
 * Sistema de preferências e configurações do usuário admin
 * ============================================================================
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { UAParser } from 'ua-parser-js';

const router = Router();

// ============================================================================
// VALIDAÇÃO DE SCHEMAS
// ============================================================================

const PreferencesUpdateSchema = z.object({
  // Aparência
  theme: z.enum(['light', 'dark', 'system']).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  compactMode: z.boolean().optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  highContrast: z.boolean().optional(),
  reduceMotion: z.boolean().optional(),

  // Notificações - Canais
  emailNotifications: z.boolean().optional(),
  browserNotifications: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),

  // Notificações - Tipos
  notifyNewProtocol: z.boolean().optional(),
  notifyProtocolUpdate: z.boolean().optional(),
  notifyNewCitizen: z.boolean().optional(),
  notifySystemUpdates: z.boolean().optional(),
  notifyAssignment: z.boolean().optional(),
  notifyOverdueSLA: z.boolean().optional(),
  notifyMessages: z.boolean().optional(),
  notifyDocuments: z.boolean().optional(),

  // Horário de silêncio
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),

  // Visualização
  defaultProtocolView: z.enum(['table', 'grid', 'kanban']).optional(),
  protocolsPerPage: z.number().int().min(10).max(100).optional(),
  showArchivedByDefault: z.boolean().optional(),

  // Dashboard
  dashboardLayout: z.any().optional(),

  // Localização
  timezone: z.string().optional(),
  language: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),

  // Privacidade
  showOnlineStatus: z.boolean().optional(),
  allowAnalytics: z.boolean().optional(),
  showActivityHistory: z.boolean().optional(),

  // Avançado
  developerMode: z.boolean().optional(),
});

const ProfileUpdateSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional().nullable(),
  telefoneSecundario: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  rg: z.string().optional().nullable(),
  dataNascimento: z.string().datetime().optional().nullable(),
  endereco: z.any().optional().nullable(),
});

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// ============================================================================
// CONFIGURAÇÃO DE UPLOAD DE AVATAR
// ============================================================================

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.'));
    }
  }
});

// ============================================================================
// ROTAS: PREFERÊNCIAS
// ============================================================================

/**
 * GET /api/admin/preferences
 * Buscar preferências do usuário autenticado
 */
router.get('/', adminAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    // Se não existir, criar com valores padrão
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId }
      });
    }

    res.json({ success: true, data: preferences });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao buscar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/preferences
 * Atualizar preferências do usuário
 */
router.put('/', adminAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Validar dados
    const validatedData = PreferencesUpdateSchema.parse(req.body);

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, ...validatedData },
      update: validatedData
    });

    res.json({ success: true, data: preferences });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao atualizar:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/preferences
 * Resetar preferências para os valores padrão
 */
router.delete('/', adminAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Deletar preferências existentes
    await prisma.userPreferences.deleteMany({
      where: { userId }
    });

    // Criar novas com valores padrão
    const preferences = await prisma.userPreferences.create({
      data: { userId }
    });

    res.json({ success: true, data: preferences });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao resetar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ROTAS: PERFIL DO USUÁRIO
// ============================================================================

/**
 * PUT /api/admin/preferences/profile
 * Atualizar dados pessoais do usuário
 */
router.put('/profile', adminAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Validar dados
    const validatedData = ProfileUpdateSchema.parse(req.body);

    // Converter dataNascimento de string ISO para Date se fornecido
    const dataToUpdate: any = { ...validatedData };
    if (validatedData.dataNascimento) {
      dataToUpdate.dataNascimento = new Date(validatedData.dataNascimento);
    }

    // Se email foi alterado, verificar se já não está em uso
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Este email já está em uso por outro usuário'
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        telefone: true,
        telefoneSecundario: true,
        cpf: true,
        rg: true,
        dataNascimento: true,
        endereco: true,
        cargoEfetivo: true,
        dataAdmissao: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao atualizar perfil:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ROTAS: AVATAR
// ============================================================================

/**
 * POST /api/admin/preferences/avatar
 * Upload de foto de perfil
 */
router.post('/avatar', adminAuthMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    // Obter preferências atuais para deletar avatar antigo
    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    // Deletar avatar antigo se existir
    if (preferences?.avatarUrl) {
      const oldAvatarPath = path.join(process.cwd(), preferences.avatarUrl);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (err) {
        console.warn('[PREFERENCES] Erro ao deletar avatar antigo:', err);
      }
    }

    // Construir URL relativa
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Atualizar preferências
    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, avatarUrl },
      update: { avatarUrl }
    });

    res.json({
      success: true,
      data: {
        avatarUrl: updatedPreferences.avatarUrl
      }
    });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao fazer upload do avatar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/preferences/avatar
 * Remover foto de perfil
 */
router.delete('/avatar', adminAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    if (preferences?.avatarUrl) {
      // Deletar arquivo físico
      const avatarPath = path.join(process.cwd(), preferences.avatarUrl);
      try {
        await fs.unlink(avatarPath);
      } catch (err) {
        console.warn('[PREFERENCES] Erro ao deletar avatar:', err);
      }

      // Atualizar banco
      await prisma.userPreferences.update({
        where: { userId },
        data: { avatarUrl: null }
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao remover avatar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ROTAS: SEGURANÇA
// ============================================================================

/**
 * PUT /api/admin/preferences/password
 * Alterar senha do usuário
 */
router.put('/password', adminAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Validar dados
    const validatedData = PasswordChangeSchema.parse(req.body);

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Senha atual incorreta'
      });
    }

    // Gerar hash da nova senha
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      }
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao alterar senha:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ROTAS: SESSÕES ATIVAS
// ============================================================================

/**
 * GET /api/admin/preferences/sessions
 * Listar sessões ativas do usuário
 */
router.get('/sessions', adminAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    res.json({ success: true, data: sessions });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao buscar sessões:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/preferences/sessions/:sessionId
 * Revogar uma sessão específica
 */
router.delete('/sessions/:sessionId', adminAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    // Verificar se a sessão pertence ao usuário
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Sessão não encontrada'
      });
    }

    // Desativar sessão
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Sessão revogada com sucesso'
    });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao revogar sessão:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/preferences/sessions
 * Revogar todas as sessões exceto a atual
 */
router.delete('/sessions', adminAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const currentToken = req.headers.authorization?.replace('Bearer ', '');

    // Desativar todas as sessões exceto a atual
    await prisma.userSession.updateMany({
      where: {
        userId,
        token: { not: currentToken },
        isActive: true
      },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Todas as outras sessões foram revogadas'
    });
  } catch (error: any) {
    console.error('[PREFERENCES] Erro ao revogar sessões:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// HELPER: Registrar sessão de login
// ============================================================================

export async function createUserSession(
  userId: string,
  token: string,
  req: any
): Promise<void> {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Parse user agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Calcular expiração (7 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.userSession.create({
      data: {
        userId,
        token,
        ipAddress: String(ipAddress),
        userAgent,
        device: result.device.type || 'desktop',
        browser: result.browser.name || 'unknown',
        os: result.os.name || 'unknown',
        expiresAt
      }
    });
  } catch (error) {
    console.error('[SESSION] Erro ao criar sessão:', error);
    // Não falhar o login se houver erro ao criar sessão
  }
}

export default router;
