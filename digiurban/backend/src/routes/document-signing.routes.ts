import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticateAdmin, authenticateCitizen } from '../middleware/auth';
import * as forge from 'node-forge';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { decryptPrivateKey } from '../services/encryption.service';
import { addVisualSignatureToPdf, saveSignedPdf } from '../services/pdf-signature.service';

const router = Router();
const prisma = new PrismaClient();

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
router.post('/sign', async (req, res) => {
  try {
    const { documentId, externalDocumentId, certificateId, position }: SignDocumentRequest = req.body;

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
        select: { filePath: true },
      });

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Documento gerado não encontrado',
        });
      }

      filePath = doc.filePath;
      documentType = 'generated';
    } else {
      const doc = await prisma.externalDocument.findUnique({
        where: { id: externalDocumentId },
        select: { filePath: true },
      });

      if (!doc) {
        return res.status(404).json({
          success: false,
          message: 'Documento externo não encontrado',
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
