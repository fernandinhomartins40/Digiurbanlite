/**
 * ============================================================================
 * DOCUMENT UPLOAD SERVICE
 * ============================================================================
 * ServiÃ§o integrado de upload de documentos com protocolo e validaÃ§Ã£o
 */

import * as path from 'path';
import * as fs from 'fs';
import { prisma } from '../lib/prisma';
import { DocumentStatus, Prisma } from '@prisma/client';
import {
  DocumentConfig,
  validateFile,
  normalizeDocumentConfigs,
  getAllowedMimeTypes,
  getAllowedExtensions
} from '../utils/document-validation';
import {
  generateSecureFilename,
  createSecureDirectory,
  checkForMaliciousContent,
  secureDeleteFile
} from '../middleware/secure-upload';
import * as documentService from './protocol-document.service';
import { matchDocumentType, resolveCanonicalDocumentType } from '../utils/document-mapping';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UploadDocumentInput {
  protocolId: string;
  files: Express.Multer.File[];
  uploadedBy: string;
  documentTypes?: string[]; // Tipos correspondentes a cada arquivo
  citizenId?: string;
}

export interface UploadResult {
  success: boolean;
  protocolId: string;
  protocolNumber?: string;
  uploadedDocuments: Array<{
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    status: DocumentStatus;
  }>;
  errors?: string[];
}

export interface ValidateServiceDocumentsInput {
  serviceId: string;
  files: Express.Multer.File[];
}

export interface DocumentRequirement {
  name: string;
  required: boolean;
  acceptedFormats: string[];
  maxSizeMB: number;
  allowCameraUpload: boolean;
}

// ============================================================================
// DOCUMENT UPLOAD SERVICE
// ============================================================================

export class DocumentUploadService {
  /**
   * Faz upload de documentos para um protocolo com validaÃ§Ã£o completa
   */
  async uploadDocumentsToProtocol(input: UploadDocumentInput): Promise<UploadResult> {
    const { protocolId, files, uploadedBy, documentTypes, citizenId } = input;
    const errors: string[] = [];
    const uploadedDocuments: any[] = [];

    try {
      // 1. Verificar se o protocolo existe
      const protocol = await prisma.protocolSimplified.findUnique({
        where: { id: protocolId },
        include: {
          service: true,
          citizen: true
        }
      });

      if (!protocol) {
        throw new Error('Protocolo nÃ£o encontrado');
      }

      // 2. Verificar permissÃ£o (se citizenId fornecido)
      if (citizenId && protocol.citizenId !== citizenId) {
        throw new Error('Acesso negado: protocolo nÃ£o pertence ao cidadÃ£o');
      }

      // 3. Obter configuraÃ§Ãµes de documentos do serviÃ§o
      const serviceDocConfigs = await this.getServiceDocumentConfigs(protocol.serviceId);

      // 4. Processar cada arquivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const requiredDocumentNames = serviceDocConfigs.map((config) => config.name);
        const rawDocumentCandidates = [
          documentTypes && documentTypes[i] ? documentTypes[i] : undefined,
          file.fieldname,
          file.originalname,
        ].filter((value): value is string => Boolean(value && String(value).trim()));

        const canonicalDocumentType =
          rawDocumentCandidates
            .map((candidate) => resolveCanonicalDocumentType(candidate, requiredDocumentNames))
            .find(Boolean) ||
          undefined;

        const documentType =
          canonicalDocumentType ||
          rawDocumentCandidates[0] ||
          `Documento ${i + 1}`;

        try {
          // 4.1 Encontrar configuracao do documento
          const docConfig = serviceDocConfigs.find(
            config => matchDocumentType(documentType, config.name)
          ) || serviceDocConfigs[0]; // Fallback para primeira configuracao


          if (docConfig) {
            // 4.2 Validar arquivo
            const validation = validateFile(file, docConfig);
            if (!validation.valid) {
              errors.push(`${file.originalname}: ${validation.error}`);
              continue;
            }
          }

          // 4.3 Verificar conteÃºdo malicioso
          if (checkForMaliciousContent(file.path)) {
            fs.unlinkSync(file.path);
            errors.push(`${file.originalname}: Arquivo suspeito detectado`);
            continue;
          }

          // 4.4 Mover arquivo para diretÃ³rio do protocolo
          const finalPath = await this.moveFileToProtocol(file, protocolId, uploadedBy);

          // 4.5 Buscar documento PENDING correspondente ou criar novo
          const existingDoc = await prisma.protocolDocument.findFirst({
            where: {
              protocolId,
              documentType,
              status: { in: [DocumentStatus.PENDING, DocumentStatus.REJECTED] }
            },
            orderBy: { createdAt: 'desc' }
          });

          let document;
          if (existingDoc) {
            // Atualizar documento PENDING â†’ UPLOADED
            document = await prisma.protocolDocument.update({
              where: { id: existingDoc.id },
              data: {
                fileName: path.basename(finalPath),
                fileUrl: finalPath,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedBy,
                uploadedAt: new Date(),
                status: DocumentStatus.UPLOADED,
                rejectionReason: null // Limpar rejeiÃ§Ã£o anterior
              }
            });
          } else {
            // Criar novo documento
            document = await this.createDocumentRecord({
              protocolId,
              documentType,
              fileName: path.basename(finalPath),
              fileUrl: finalPath,
              fileSize: file.size,
              mimeType: file.mimetype,
              uploadedBy,
              isRequired: docConfig?.required || false
            });
          }

          uploadedDocuments.push({
            id: document.id,
            documentType: document.documentType,
            fileName: document.fileName,
            fileUrl: document.fileUrl,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            status: document.status
          });

        } catch (fileError) {
          console.error(`Erro ao processar arquivo ${file.originalname}:`, fileError);
          errors.push(`${file.originalname}: ${fileError instanceof Error ? fileError.message : 'Erro desconhecido'}`);

          // Limpar arquivo temporÃ¡rio
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }

      // 5. Atualizar campo documents do protocolo (JSON)
      await this.updateProtocolDocuments(protocolId, uploadedDocuments);

      // 6. Criar entrada no histÃ³rico
      await prisma.protocolHistorySimplified.create({
        data: {
          protocolId,
          action: 'DOCUMENTOS_ENVIADOS',
          comment: `${uploadedDocuments.length} documento(s) enviado(s)${errors.length > 0 ? ` (${errors.length} erro(s))` : ''}`,
          userId: uploadedBy
        }
      });

      // 7. Verificar se todos documentos obrigatÃ³rios foram enviados
      const docCheck = await documentService.checkRequiredDocuments(protocolId);
      if (docCheck.allUploaded) {
        // Criar notificaÃ§Ã£o ou atualizar status
        await prisma.notification.create({
          data: {
            citizenId: protocol.citizenId,
            title: 'Documentos Completos',
            message: `Todos os documentos obrigatÃ³rios do protocolo ${protocol.number} foram enviados`,
            type: 'SUCCESS',
            protocolId
          }
        }).catch(err => console.error('Erro ao criar notificaÃ§Ã£o:', err));
      }

      return {
        success: uploadedDocuments.length > 0,
        protocolId,
        protocolNumber: protocol.number,
        uploadedDocuments,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('Erro no upload de documentos:', error);
      throw error;
    }
  }

  /**
   * Move arquivo para diretÃ³rio do protocolo
   */
  private async moveFileToProtocol(
    file: Express.Multer.File,
    protocolId: string,
    userId: string
  ): Promise<string> {
    // Criar diretÃ³rio: uploads/protocols/[protocolId]/
    const protocolDir = path.join(
      process.cwd(),
      'uploads',
      'protocols',
      protocolId
    );

    createSecureDirectory(protocolDir);

    // âœ… CORREÃ‡ÃƒO: Usar filename do Multer (jÃ¡ processado com timestamp e extensÃ£o)
    // originalname pode ser "blob" se vier de cÃ¢mera, filename sempre estÃ¡ correto
    const secureFilename = file.filename;
    const targetPath = path.join(protocolDir, secureFilename);

    // Mover arquivo
    fs.renameSync(file.path, targetPath);

    // Retornar caminho pÃ‡Â§blico normalizado (usado pelo static /uploads)
    const publicPath = path.posix.join('/uploads', 'protocols', protocolId, secureFilename);
    return publicPath;
  }

  /**
   * Cria registro de documento no banco
   */
  private async createDocumentRecord(data: {
    protocolId: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    isRequired: boolean;
  }) {
    return prisma.protocolDocument.create({
      data: {
        protocolId: data.protocolId,
        documentType: data.documentType,
        isRequired: data.isRequired,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        uploadedBy: data.uploadedBy,
        uploadedAt: new Date(),
        status: DocumentStatus.UPLOADED
      }
    });
  }

  /**
   * Atualiza campo documents do protocolo (JSON)
   * REMOVIDO: Agora usa apenas ProtocolDocument table
   */
  private async updateProtocolDocuments(
    protocolId: string,
    newDocuments: any[]
  ) {
    // MÃ©todo mantido por compatibilidade mas nÃ£o faz nada
    // Documentos jÃ¡ estÃ£o salvos na tabela ProtocolDocument
    return;
  }

  /**
   * ObtÃ©m configuraÃ§Ãµes de documentos do serviÃ§o
   */
  private async getServiceDocumentConfigs(serviceId: string): Promise<DocumentConfig[]> {
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      select: {
        requiredDocuments: true
      }
    });

    if (!service || !service.requiredDocuments) {
      return [];
    }

    // Parsear se for string
    let requiredDocs = service.requiredDocuments;
    if (typeof requiredDocs === 'string') {
      try {
        requiredDocs = JSON.parse(requiredDocs);
      } catch (e) {
        console.error('Erro ao parsear requiredDocuments:', e);
        return [];
      }
    }

    // Normalizar configuraÃ§Ãµes
    return normalizeDocumentConfigs(requiredDocs as any[]);
  }

  /**
   * Valida documentos contra configuraÃ§Ãµes do serviÃ§o
   */
  async validateServiceDocuments(input: ValidateServiceDocumentsInput) {
    const { serviceId, files } = input;
    const errors: string[] = [];

    const docConfigs = await this.getServiceDocumentConfigs(serviceId);

    if (docConfigs.length === 0) {
      return {
        valid: true,
        errors: [],
        warnings: ['ServiÃ§o sem configuraÃ§Ãµes de documentos definidas']
      };
    }

    // Validar cada arquivo
    for (const file of files) {
      const docConfig = docConfigs[0]; // Usar configuraÃ§Ã£o padrÃ£o
      const validation = validateFile(file, docConfig);

      if (!validation.valid) {
        errors.push(`${file.originalname}: ${validation.error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      documentConfigs: docConfigs
    };
  }

  /**
   * Remove documento de um protocolo
   */
  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      const document = await prisma.protocolDocument.findUnique({
        where: { id: documentId },
        include: {
          protocol: true
        }
      });

      if (!document) {
        throw new Error('Documento nÃ£o encontrado');
      }

      // Verificar se o protocolo permite remoÃ§Ã£o
      if (document.protocol.status === 'CONCLUIDO') {
        throw new Error('NÃ£o Ã© possÃ­vel remover documentos de protocolos concluÃ­dos');
      }

      // Deletar arquivo fÃ­sico
      if (document.fileUrl) {
        secureDeleteFile(document.fileUrl);
      }

      // Deletar registro
      await prisma.protocolDocument.delete({
        where: { id: documentId }
      });

      // Criar histÃ³rico
      await prisma.protocolHistorySimplified.create({
        data: {
          protocolId: document.protocolId,
          action: 'DOCUMENTO_REMOVIDO',
          comment: `Documento "${document.documentType}" removido`,
          userId
        }
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw error;
    }
  }

  /**
   * ObtÃ©m requisitos de documentos de um serviÃ§o
   */
  async getServiceDocumentRequirements(serviceId: string): Promise<DocumentRequirement[]> {
    const configs = await this.getServiceDocumentConfigs(serviceId);

    return configs.map(config => ({
      name: config.name,
      required: config.required,
      acceptedFormats: config.acceptedFormats,
      maxSizeMB: config.maxSizeMB,
      allowCameraUpload: config.allowCameraUpload
    }));
  }

  /**
   * Verifica se protocolo tem todos documentos necessÃ¡rios
   */
  async checkProtocolDocumentsComplete(protocolId: string): Promise<{
    complete: boolean;
    total: number;
    uploaded: number;
    pending: number;
    missingDocuments: string[];
  }> {
    const check = await documentService.checkRequiredDocuments(protocolId);

    // Obter nomes dos documentos pendentes
    const requiredDocs = await prisma.protocolDocument.findMany({
      where: {
        protocolId,
        isRequired: true,
        status: DocumentStatus.PENDING
      },
      select: {
        documentType: true
      }
    });

    return {
      complete: check.allUploaded,
      total: check.total,
      uploaded: check.uploaded,
      pending: check.pending,
      missingDocuments: requiredDocs.map(doc => doc.documentType)
    };
  }
}

// Exportar instÃ¢ncia singleton
export const documentUploadService = new DocumentUploadService();
