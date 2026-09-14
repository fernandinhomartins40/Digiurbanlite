/**
 * ============================================================================
 * ROTAS PÚBLICAS DE VALIDAÇÃO DE DOCUMENTOS
 * ============================================================================
 * Endpoints públicos (sem autenticação) para validação de documentos oficiais
 * gerados pelo sistema.
 *
 * SEGURANÇA:
 * - Endpoints públicos mas com rate limiting
 * - Nenhum dado sensível é exposto
 * - Apenas informações públicas do documento
 */

import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import multer from 'multer';
import {
  validateChecksum,
  generateDocumentHashFromBuffer
} from '../utils/validation-code.utils';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

// Configurar multer para upload temporário de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  },
});

// ============================================================================
// GET /api/public/validate/document/:code
// Valida um código de validação e retorna informações públicas do documento
// ============================================================================

router.get('/document/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    console.log(`[PublicValidation] Validando código: ${code}`);

    // 1. Validar formato e checksum do código
    if (!validateChecksum(code)) {
      console.warn(`[PublicValidation] Código com formato inválido: ${code}`);
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Código de validação inválido. Verifique se digitou corretamente.',
        error: 'INVALID_FORMAT'
      });
    }

    // 2. Buscar documento no banco
    const document = await prisma.generatedDocument.findUnique({
      where: { validationCode: code },
      include: {
        protocol: {
          select: {
            number: true,
            title: true,
            status: true,
            createdAt: true,
            service: {
              select: {
                name: true,
                description: true
              }
            },
            citizen: {
              select: {
                name: true
                // NÃO incluir: CPF, email, telefone, endereço
              }
            },
            department: {
              select: {
                name: true
              }
            }
          }
        },
        template: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    if (!document) {
      console.warn(`[PublicValidation] Documento não encontrado: ${code}`);
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Documento não encontrado. Verifique o código de validação.',
        error: 'NOT_FOUND'
      });
    }

    // 3. Verificar se documento foi excluído (soft delete)
    if (!document.isActive || document.deletedAt) {
      console.warn(`[PublicValidation] Documento inativo/excluído: ${code}`);
      return res.status(410).json({
        success: false,
        valid: false,
        message: 'Documento foi revogado ou excluído.',
        error: 'DOCUMENT_REVOKED'
      });
    }

    // 4. Verificar expiração
    const now = new Date();
    const isExpired = document.expiresAt && new Date(document.expiresAt) < now;

    if (isExpired) {
      console.warn(`[PublicValidation] Documento expirado: ${code}`);
      return res.status(410).json({
        success: false,
        valid: false,
        expired: true,
        message: `Documento expirado em ${new Date(document.expiresAt!).toLocaleDateString('pt-BR')}.`,
        error: 'DOCUMENT_EXPIRED',
        expiresAt: document.expiresAt
      });
    }

    // 5. Incrementar contador de validações
    await prisma.generatedDocument.update({
      where: { id: document.id },
      data: {
        validatedCount: { increment: 1 },
        lastValidatedAt: new Date()
      }
    });

    console.log(`[PublicValidation] Documento válido: ${code} (${document.validatedCount + 1}ª validação)`);

    // 6. Retornar informações públicas (SEM DADOS SENSÍVEIS)
    return res.json({
      success: true,
      valid: true,
      message: 'Documento autêntico e válido.',
      document: {
        // Informações do documento
        type: document.template.name,
        typeCode: document.template.code,
        fileName: document.fileName,
        generatedAt: document.generatedAt,
        expiresAt: document.expiresAt,
        fileSize: document.fileSize,

        // Informações do protocolo
        protocolNumber: document.protocol.number,
        protocolTitle: document.protocol.title,
        protocolStatus: document.protocol.status,
        protocolCreatedAt: document.protocol.createdAt,

        // Informações do serviço
        serviceName: document.protocol.service.name,

        // Informações do cidadão (APENAS NOME - SEM CPF)
        citizenName: document.protocol.citizen.name,

        // Departamento
        departmentName: document.protocol.department.name
      },
      validation: {
        code: document.validationCode,
        validatedAt: new Date(),
        validatedCount: document.validatedCount + 1,
        isExpired: false,
        expiresAt: document.expiresAt
      }
    });

  } catch (error) {
    console.error('[PublicValidation] Erro ao validar documento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao validar documento. Tente novamente.',
      error: 'INTERNAL_ERROR'
    });
  }
});

// ============================================================================
// POST /api/public/validate/verify-integrity
// Verifica integridade de um arquivo PDF comparando com hash armazenado
// ============================================================================

router.post('/verify-integrity', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { validationCode } = req.body;
    const file = req.file;

    if (!validationCode || !file) {
      return res.status(400).json({
        success: false,
        message: 'Código de validação e arquivo são obrigatórios.',
        error: 'MISSING_PARAMS'
      });
    }

    console.log(`[PublicValidation] Verificando integridade: ${validationCode}`);

    // 1. Validar formato do código
    if (!validateChecksum(validationCode)) {
      return res.status(400).json({
        success: false,
        message: 'Código de validação inválido.',
        error: 'INVALID_CODE'
      });
    }

    // 2. Buscar documento
    const document = await prisma.generatedDocument.findUnique({
      where: { validationCode: validationCode },
      select: {
        id: true,
        documentHash: true,
        fileName: true,
        isActive: true,
        deletedAt: true,
        expiresAt: true
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado.',
        error: 'NOT_FOUND'
      });
    }

    if (!document.isActive || document.deletedAt) {
      return res.status(410).json({
        success: false,
        message: 'Documento foi revogado.',
        error: 'DOCUMENT_REVOKED'
      });
    }

    // 3. Calcular hash do arquivo enviado
    const uploadedHash = generateDocumentHashFromBuffer(file.buffer);

    // 4. Comparar hashes
    const isIntact = uploadedHash === document.documentHash;

    console.log(`[PublicValidation] Integridade: ${isIntact ? 'OK' : 'FALHOU'}`);
    console.log(`   Hash esperado:  ${document.documentHash?.substring(0, 16)}...`);
    console.log(`   Hash recebido:  ${uploadedHash.substring(0, 16)}...`);

    // 5. Retornar resultado
    return res.json({
      success: true,
      valid: isIntact,
      message: isIntact
        ? 'Documento autêntico. O arquivo não foi modificado.'
        : 'ATENÇÃO: O arquivo foi modificado ou não corresponde ao documento original.',
      integrity: {
        isIntact,
        uploadedHash: uploadedHash.substring(0, 32) + '...', // Mostrar apenas parte do hash
        storedHash: document.documentHash?.substring(0, 32) + '...',
        fileName: document.fileName,
        uploadedFileName: file.originalname,
        uploadedSize: file.size,
        validationCode
      }
    });

  } catch (error) {
    console.error('[PublicValidation] Erro ao verificar integridade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar integridade do arquivo.',
      error: 'INTERNAL_ERROR'
    });
  }
});

// ============================================================================
// GET /api/public/validate/stats
// Retorna estatísticas públicas do sistema de validação (opcional)
// ============================================================================

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalDocuments = await prisma.generatedDocument.count({
      where: {
        isActive: true,
        validationCode: { not: null }
      }
    });

    const totalValidations = await prisma.generatedDocument.aggregate({
      where: {
        isActive: true,
        validationCode: { not: null }
      },
      _sum: {
        validatedCount: true
      }
    });

    const documentsWithValidation = await prisma.generatedDocument.count({
      where: {
        isActive: true,
        validationCode: { not: null },
        validatedCount: { gt: 0 }
      }
    });

    return res.json({
      success: true,
      stats: {
        totalDocumentsWithValidation: totalDocuments,
        totalValidations: totalValidations._sum.validatedCount || 0,
        documentsValidatedAtLeastOnce: documentsWithValidation,
        averageValidationsPerDocument: totalDocuments > 0
          ? ((totalValidations._sum.validatedCount || 0) / totalDocuments).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('[PublicValidation] Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas.',
      error: 'INTERNAL_ERROR'
    });
  }
});

export default router;
