/**
 * ============================================================================
 * DOCUMENT UPLOAD SERVICE
 * ============================================================================
 * Serviço integrado de upload de documentos com protocolo e validação
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
   * Faz upload de documentos para um protocolo com validação completa
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
        throw new Error('Protocolo não encontrado');
      }

      // 2. Verificar permissão (se citizenId fornecido)
      if (citizenId && protocol.citizenId !== citizenId) {
        throw new Error('Acesso negado: protocolo não pertence ao cidadão');
      }

      // 3. Obter configurações de documentos do serviço
      const serviceDocConfigs = await this.getServiceDocumentConfigs(protocol.serviceId);

      // 4. Processar cada arquivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const documentType = documentTypes && documentTypes[i]
          ? documentTypes[i]
          : file.fieldname || `Documento ${i + 1}`;

        try {
          // 4.1 Encontrar configuração do documento
          const docConfig = serviceDocConfigs.find(
            config => config.name === documentType ||
                     config.name.toLowerCase().replace(/\s+/g, '_') === documentType
          ) || serviceDocConfigs[0]; // Fallback para primeira configuração

          if (docConfig) {
            // 4.2 Validar arquivo
            const validation = validateFile(file, docConfig);
            if (!validation.valid) {
              errors.push(`${file.originalname}: ${validation.error}`);
              continue;
            }
          }

          // 4.3 Verificar conteúdo malicioso
          if (checkForMaliciousContent(file.path)) {
            fs.unlinkSync(file.path);
            errors.push(`${file.originalname}: Arquivo suspeito detectado`);
            continue;
          }

          // 4.4 Mover arquivo para diretório do protocolo
          const finalPath = await this.moveFileToProtocol(file, protocolId, uploadedBy);

          // 4.5 Criar registro no ProtocolDocument
          const document = await this.createDocumentRecord({
            protocolId,
            documentType,
            fileName: path.basename(finalPath),
            fileUrl: finalPath,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy,
            isRequired: docConfig?.required || false
          });

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

          // Limpar arquivo temporário
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        }
      }

      // 5. Atualizar campo documents do protocolo (JSON)
      await this.updateProtocolDocuments(protocolId, uploadedDocuments);

      // 6. Criar entrada no histórico
      await prisma.protocolHistorySimplified.create({
        data: {
          protocolId,
          action: 'DOCUMENTOS_ENVIADOS',
          comment: `${uploadedDocuments.length} documento(s) enviado(s)${errors.length > 0 ? ` (${errors.length} erro(s))` : ''}`,
          userId: uploadedBy
        }
      });

      // 7. Verificar se todos documentos obrigatórios foram enviados
      const docCheck = await documentService.checkRequiredDocuments(protocolId);
      if (docCheck.allUploaded) {
        // Criar notificação ou atualizar status
        await prisma.notification.create({
          data: {
            citizenId: protocol.citizenId,
            title: 'Documentos Completos',
            message: `Todos os documentos obrigatórios do protocolo ${protocol.number} foram enviados`,
            type: 'SUCCESS',
            protocolId
          }
        }).catch(err => console.error('Erro ao criar notificação:', err));
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
   * Move arquivo para diretório do protocolo
   */
  private async moveFileToProtocol(
    file: Express.Multer.File,
    protocolId: string,
    userId: string
  ): Promise<string> {
    // Criar diretório: uploads/protocols/[protocolId]/
    const protocolDir = path.join(
      process.cwd(),
      'uploads',
      'protocols',
      protocolId
    );

    createSecureDirectory(protocolDir);

    // Gerar nome seguro
    const secureFilename = generateSecureFilename(file.originalname, userId);
    const targetPath = path.join(protocolDir, secureFilename);

    // Mover arquivo
    fs.renameSync(file.path, targetPath);

    // Retornar caminho relativo
    return path.relative(process.cwd(), targetPath);
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
   */
  private async updateProtocolDocuments(
    protocolId: string,
    newDocuments: any[]
  ) {
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId }
    });

    if (!protocol) return;

    // Obter documentos atuais
    const currentDocs = Array.isArray(protocol.documents)
      ? (protocol.documents as any[])
      : [];

    // Adicionar novos documentos
    const updatedDocs = [...currentDocs, ...newDocuments.map(doc => ({
      originalName: doc.fileName,
      filename: doc.fileName,
      mimetype: doc.mimeType,
      size: doc.fileSize,
      path: doc.fileUrl,
      uploadedAt: new Date(),
      documentType: doc.documentType
    }))];

    // Atualizar protocolo
    await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        documents: updatedDocs as unknown as Prisma.InputJsonValue
      }
    });
  }

  /**
   * Obtém configurações de documentos do serviço
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

    // Normalizar configurações
    return normalizeDocumentConfigs(requiredDocs as any[]);
  }

  /**
   * Valida documentos contra configurações do serviço
   */
  async validateServiceDocuments(input: ValidateServiceDocumentsInput) {
    const { serviceId, files } = input;
    const errors: string[] = [];

    const docConfigs = await this.getServiceDocumentConfigs(serviceId);

    if (docConfigs.length === 0) {
      return {
        valid: true,
        errors: [],
        warnings: ['Serviço sem configurações de documentos definidas']
      };
    }

    // Validar cada arquivo
    for (const file of files) {
      const docConfig = docConfigs[0]; // Usar configuração padrão
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
        throw new Error('Documento não encontrado');
      }

      // Verificar se o protocolo permite remoção
      if (document.protocol.status === 'CONCLUIDO') {
        throw new Error('Não é possível remover documentos de protocolos concluídos');
      }

      // Deletar arquivo físico
      if (document.fileUrl) {
        secureDeleteFile(document.fileUrl);
      }

      // Deletar registro
      await prisma.protocolDocument.delete({
        where: { id: documentId }
      });

      // Criar histórico
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
   * Obtém requisitos de documentos de um serviço
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
   * Verifica se protocolo tem todos documentos necessários
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

// Exportar instância singleton
export const documentUploadService = new DocumentUploadService();
