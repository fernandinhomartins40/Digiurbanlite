import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import * as forge from 'node-forge';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { decryptPrivateKey } from '../services/encryption.service';
import { addVisualSignatureToPdf, saveSignedPdf } from '../services/pdf-signature.service';

const router = Router();
// Otimização VPS (docs/VPS-OPTIMIZATION-AUDIT.md, P0-2): usar o singleton de
// src/lib/prisma — cada `new PrismaClient()` abria um pool próprio (esgotava o
// PostgreSQL) e NÃO passava pela tenantExtension (furo de isolamento multi-tenant).
import { prisma } from '../lib/prisma';

interface SignDocumentRequest {
  documentId?: string; // ID do GeneratedDocument
  externalDocumentId?: string; // ID do ExternalDocument
  certificateId: string;
  position?: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * POST /api/documents/sign
 * Assinar documento digitalmente (funciona para ambos: admin e cidadão)
 */
router.post('/sign', authenticateToken, async (req, res) => {
  try {
    const { documentId, externalDocumentId, certificateId, position }: SignDocumentRequest = req.body;
    const authenticatedUser = (req as any).user;
    const authenticatedCitizen = (req as any).citizen;

    // Validar que ao menos um tipo de documento foi fornecido
    if (!documentId && !externalDocumentId) {
      return res.status(400).json({
        success: false,
        message: 'Deve fornecer documentId ou externalDocumentId',
      });
    }

    // Validar campo obrigatório
    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: 'Certificado é obrigatório',
      });
    }

    // Buscar certificado com chave privada criptografada
    const certificate = await prisma.digitalCertificate.findUnique({
      where: { id: certificateId },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        encryptedPrivateKey: true,
        publicKey: true,
        userId: true,
        citizenId: true,
      },
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificado não encontrado',
      });
    }

    // Validar status do certificado
    if (certificate.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Certificado inativo ou revogado',
      });
    }

    if (new Date(certificate.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Certificado expirado',
      });
    }

    if (authenticatedUser && certificate.userId !== authenticatedUser.id) {
      return res.status(403).json({
        success: false,
        message: 'O certificado selecionado não pertence ao usuário autenticado',
      });
    }

    if (authenticatedCitizen && certificate.citizenId !== authenticatedCitizen.id) {
      return res.status(403).json({
        success: false,
        message: 'O certificado selecionado não pertence ao cidadão autenticado',
      });
    }

    // Descriptografar chave privada automaticamente
    let privateKey: string;
    try {
      privateKey = decryptPrivateKey(certificate.encryptedPrivateKey);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao recuperar chave privada do certificado',
      });
    }

    // Buscar documento (gerado ou externo)
    let filePath: string;
    let documentType: 'generated' | 'external';

    if (documentId) {
      const doc = await prisma.generatedDocument.findUnique({
        where: { id: documentId },
        select: {
          filePath: true,
          generatedBy: true,
          isSigned: true,
          status: true,
        },
      });

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Documento gerado não encontrado',
        });
      }

      if (!authenticatedUser) {
        return res.status(403).json({
          success: false,
          message: 'Somente servidores autenticados podem assinar documentos gerados',
        });
      }

      if (doc.generatedBy !== authenticatedUser.id) {
        return res.status(403).json({
          success: false,
          message: 'Apenas o servidor que gerou o documento pode assiná-lo',
        });
      }

      if (doc.isSigned || doc.status === 'SIGNED' || doc.status === 'PUBLISHED') {
        return res.status(400).json({
          success: false,
          message: 'O documento já foi assinado',
        });
      }

      if (doc.status === 'SUPERSEDED') {
        return res.status(400).json({
          success: false,
          message: 'O documento foi substituído por uma revisão mais recente',
        });
      }

      filePath = doc.filePath;
      documentType = 'generated';
    } else {
      const doc = await prisma.externalDocument.findUnique({
        where: { id: externalDocumentId },
        select: {
          filePath: true,
          userId: true,
          citizenId: true,
          isSigned: true,
        },
      });

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Documento externo não encontrado',
        });
      }

      if (authenticatedUser && doc.userId && doc.userId !== authenticatedUser.id) {
        return res.status(403).json({
          success: false,
          message: 'O documento externo não pertence ao usuário autenticado',
        });
      }

      if (authenticatedCitizen && doc.citizenId && doc.citizenId !== authenticatedCitizen.id) {
        return res.status(403).json({
          success: false,
          message: 'O documento externo não pertence ao cidadão autenticado',
        });
      }

      if (doc.isSigned) {
        return res.status(400).json({
          success: false,
          message: 'O documento já foi assinado',
        });
      }

      filePath = doc.filePath;
      documentType = 'external';
    }

    // Ler arquivo do documento
    const fullPath = path.join(process.cwd(), filePath);
    let fileBuffer: Buffer;

    try {
      fileBuffer = await fs.readFile(fullPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo do documento não encontrado',
      });
    }

    // Obter IP e User Agent
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Buscar informações do certificado para assinatura visual
    const certWithDetails = await prisma.digitalCertificate.findUnique({
      where: { id: certificateId },
      select: {
        commonName: true,
        email: true,
        serialNumber: true,
      },
    });

    // Se a posição foi fornecida, adicionar assinatura visual ao PDF
    let finalBuffer = fileBuffer;
    console.log('[SIGN] Position provided:', position ? 'YES' : 'NO');
    console.log('[SIGN] Cert details found:', certWithDetails ? 'YES' : 'NO');

    if (position && certWithDetails) {
      console.log('[SIGN] Adding visual signature to PDF at position:', position);
      try {
        const signedPdfBuffer = await addVisualSignatureToPdf(
          fullPath,
          position,
          {
            signerName: certWithDetails.commonName,
            signerEmail: certWithDetails.email || '',
            signedAt: new Date(),
            certificateSerialNumber: certWithDetails.serialNumber,
          }
        );

        console.log('[SIGN] Visual signature added successfully, buffer size:', signedPdfBuffer.length);

        // Salvar o PDF com a assinatura visual
        await saveSignedPdf(fullPath, signedPdfBuffer);
        console.log('[SIGN] PDF saved with visual signature');

        finalBuffer = signedPdfBuffer;
      } catch (error: any) {
        console.error('[SIGN ERROR] Failed to add visual signature:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao adicionar assinatura visual ao documento',
        });
      }
    } else {
      console.log('[SIGN] Skipping visual signature - position or cert details missing');
    }

    // Calcular hash SHA-256 do documento (com assinatura visual se houver)
    const hash = crypto.createHash('sha256').update(finalBuffer).digest();

    // Assinar o hash com a chave privada
    let signature: string;

    try {
      const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
      const md = forge.md.sha256.create();
      md.update(hash.toString('binary'), 'raw');
      const signatureBytes = privateKeyObj.sign(md);
      signature = forge.util.encode64(signatureBytes);
    } catch (error: any) {
      console.error('Erro ao assinar documento:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar assinatura criptográfica',
      });
    }

    // Criar registro de assinatura
    const signatureRecord = await prisma.signature.create({
      data: {
        documentId: documentType === 'generated' ? documentId : null,
        externalDocumentId: documentType === 'external' ? externalDocumentId : null,
        certificateId,
        signatureValue: signature,
        signatureHash: hash.toString('hex'),
        signatureAlgo: 'SHA256withRSA',
        ipAddress,
        userAgent,
        visualPosition: position ? position as Prisma.InputJsonValue : Prisma.JsonNull,
      },
      include: {
        certificate: {
          select: {
            id: true,
            commonName: true,
            email: true,
            certificateType: true,
            status: true,
          },
        },
      },
    });

    // Atualizar status do documento para "assinado"
    if (documentType === 'generated' && documentId) {
      await prisma.generatedDocument.update({
        where: { id: documentId },
        data: {
          isSigned: true,
          status: 'SIGNED',
        },
      });
    } else if (documentType === 'external' && externalDocumentId) {
      await prisma.externalDocument.update({
        where: { id: externalDocumentId },
        data: { isSigned: true },
      });
    }

    res.json({
      success: true,
      message: 'Documento assinado com sucesso',
      signature: signatureRecord,
    });
  } catch (error: any) {
    console.error('Erro ao assinar documento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao assinar documento',
    });
  }
});

/**
 * POST /api/documents/verify-signature/:signatureId
 * Verificar assinatura digital
 */
router.post('/verify-signature/:signatureId', async (req, res) => {
  try {
    const { signatureId } = req.params;

    const signature = await prisma.signature.findUnique({
      where: { id: signatureId },
      include: {
        document: true,
        externalDocument: true,
        certificate: true,
      },
    });

    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Assinatura não encontrada',
      });
    }

    // Verificar se certificado foi revogado
    const isRevoked = await prisma.certificateRevocationList.findFirst({
      where: { serialNumber: signature.certificate.serialNumber },
    });

    if (isRevoked) {
      return res.json({
        success: true,
        valid: false,
        reason: 'Certificado foi revogado',
      });
    }

    // Buscar arquivo do documento
    const filePath = signature.document?.filePath || signature.externalDocument?.filePath;

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo do documento não encontrado',
      });
    }

    const fullPath = path.join(process.cwd(), filePath);
    const fileBuffer = await fs.readFile(fullPath);
    const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Verificar se documento foi modificado
    if (currentHash !== signature.signatureHash) {
      return res.json({
        success: true,
        valid: false,
        reason: 'Documento foi modificado após assinatura',
      });
    }

    // Verificar assinatura criptográfica
    try {
      const publicKeyObj = forge.pki.publicKeyFromPem(signature.certificate.publicKey);
      const signatureBytes = forge.util.decode64(signature.signatureValue);

      const md = forge.md.sha256.create();
      md.update(Buffer.from(currentHash, 'hex').toString('binary'), 'raw');

      const verified = publicKeyObj.verify(md.digest().bytes(), signatureBytes);

      if (!verified) {
        return res.json({
          success: true,
          valid: false,
          reason: 'Assinatura criptográfica inválida',
        });
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      return res.json({
        success: true,
        valid: false,
        reason: 'Erro ao verificar assinatura criptográfica',
      });
    }

    // Atualizar contador de validações
    await prisma.signature.update({
      where: { id: signatureId },
      data: {
        validationCount: { increment: 1 },
        validatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      valid: true,
      signer: {
        name: signature.certificate.commonName,
        email: signature.certificate.email,
        department: signature.certificate.department,
      },
      signedAt: signature.signedAt,
      certificate: {
        serialNumber: signature.certificate.serialNumber,
        issuedAt: signature.certificate.issuedAt,
        expiresAt: signature.certificate.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Erro ao verificar assinatura:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao verificar assinatura',
    });
  }
});

export default router;
