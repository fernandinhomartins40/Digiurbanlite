/**
 * Rotas do Bot com Sistema de Fluxos Programados
 * Substitui as rotas antigas do bot
 */

import express, { Request, Response } from 'express';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { FlowEngine } from '../services/bot/flow/FlowEngine';
import { actionHandlers } from '../services/bot/flow/ActionHandlers';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';

const router = express.Router();

// Extend Request type to include citizenId
interface AuthenticatedRequest extends Request {
  citizenId?: string;
}

// Configuração de upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/bot-temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${randomUUID()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
});

// Instancia o FlowEngine
const flowEngine = new FlowEngine(actionHandlers);

/**
 * Middleware híbrido: aceita JWT do cidadão OU header X-Citizen-Id do UltraZend
 */
const hybridAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: any) => {
  // Se tem X-Citizen-Id no header (vindo do UltraZend Messages)
  const citizenIdHeader = req.headers['x-citizen-id'] as string;

  if (citizenIdHeader) {
    // Valida token do serviço UltraZend
    const serviceToken = req.headers['authorization']?.replace('Bearer ', '');
    const expectedToken = process.env.MESSAGES_SERVICE_TOKEN || 'ultrazend-messages-service-token-change-in-production';

    if (serviceToken === expectedToken) {
      req.citizenId = citizenIdHeader;
      return next();
    }
  }

  // Caso contrário, usa autenticação normal do cidadão
  return citizenAuthMiddleware(req, res, next);
};

/**
 * POST /api/bot-flow/message
 * Processa mensagem do usuário no fluxo
 */
router.post('/message', hybridAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizenId!;
    const { message, conversationId } = req.body;

    if (!message && message !== '') {
      return res.status(400).json({
        success: false,
        error: 'Mensagem é obrigatória',
      });
    }

    const response = await flowEngine.processMessage(citizenId, message, conversationId);

    res.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('Erro ao processar mensagem do bot:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar mensagem',
    });
  }
});

/**
 * POST /api/bot-flow/start
 * Inicia um fluxo específico
 */
router.post('/start', hybridAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizenId!;
    const { flowName, conversationId } = req.body;

    if (!flowName) {
      return res.status(400).json({
        success: false,
        error: 'Nome do fluxo é obrigatório',
      });
    }

    const response = await flowEngine.startFlow(citizenId, flowName, conversationId);

    res.json({
      success: true,
      response,
    });
  } catch (error: any) {
    console.error('Erro ao iniciar fluxo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao iniciar fluxo',
    });
  }
});

/**
 * POST /api/bot-flow/upload
 * Upload de arquivos durante o fluxo
 */
router.post(
  '/upload',
  citizenAuthMiddleware,
  upload.array('files', 5),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const citizenId = req.citizenId!;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado',
        });
      }

      // Mapeia arquivos para formato esperado
      const uploadedFiles = files.map((file) => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        documentType: 'OTHER',
      }));

      // Processa arquivos no fluxo
      const response = await flowEngine.processMessage(
        citizenId,
        uploadedFiles,
        req.body.conversationId
      );

      res.json({
        success: true,
        files: uploadedFiles,
        response,
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload de arquivos:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erro ao fazer upload',
      });
    }
  }
);

/**
 * GET /api/bot-flow/active-execution
 * Obtém execução ativa do cidadão
 */
router.get('/active-execution', citizenAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizenId!;
    const execution = await flowEngine.getActiveExecution(citizenId);

    res.json({
      success: true,
      execution,
    });
  } catch (error: any) {
    console.error('Erro ao buscar execução ativa:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar execução',
    });
  }
});

/**
 * POST /api/bot-flow/cancel
 * Cancela fluxo ativo do cidadão
 */
router.post('/cancel', citizenAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizenId!;
    await flowEngine.cancelActiveFlow(citizenId);

    res.json({
      success: true,
      message: 'Fluxo cancelado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao cancelar fluxo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao cancelar fluxo',
    });
  }
});

/**
 * POST /api/bot-flow/reset
 * Reseta conversa e volta ao menu principal
 */
router.post('/reset', citizenAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const citizenId = req.citizenId!;
    const { conversationId } = req.body;

    // Cancela fluxo ativo
    await flowEngine.cancelActiveFlow(citizenId);

    // Inicia menu principal
    const response = await flowEngine.startFlow(citizenId, 'menu_principal', conversationId);

    res.json({
      success: true,
      message: 'Conversa resetada',
      response,
    });
  } catch (error: any) {
    console.error('Erro ao resetar conversa:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao resetar conversa',
    });
  }
});

/**
 * GET /api/bot-flow/health
 * Health check do sistema de fluxos
 */
router.get('/health', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: 'Flow-Based Bot Engine',
    version: '1.0.0',
  });
});

export default router;
