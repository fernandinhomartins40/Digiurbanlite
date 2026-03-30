/**
 * Rotas Internas - API para chamadas de serviços internos (UltraZend)
 */

import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { internalAuthMiddleware } from '../middleware/internal-auth';
import { ensureProtocolDir, getProtocolFileUrl, uploadDocuments } from '../config/upload';
import { prisma } from '../lib/prisma';
import { validateServiceFormData } from '../lib/json-schema-validator';
import { DocumentUploadService } from '../services/document-upload.service';
import { validateProtocolUniqueness } from '../services/protocol-uniqueness.service';
import { ensureRequiredProtocolDocuments } from '../services/required-protocol-documents.service';
import { protocolModuleService } from '../services/protocol-module.service';
import { syncCitizenPersonIdentity } from '../services/person-identity.service';
import notificationService from '../services/notification.service';
import {
  getProtocolDocuments as getProtocolDocumentsForProtocol,
  uploadDocument as uploadProtocolDocument,
} from '../services/protocol-document.service';
import * as pendingService from '../services/protocol-pending.service';
import * as dataFieldService from '../services/protocol-data-field.service';
import { sanitizeDocumentId, mapUploadedFilesToDocuments } from '../utils/document-mapping';
import { normalizeEmail, normalizeNullableString } from '../utils/identity';
import fs from 'fs';
import path from 'path';

const router = Router();
const documentUploadService = new DocumentUploadService();

// Aplicar middleware de autenticação em todas as rotas
router.use(internalAuthMiddleware);

const coerceObject = (value: any) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  return {};
};

const parseInternalPendingResolution = (rawResolution: unknown) => {
  if (typeof rawResolution !== 'string') {
    return { text: '', payload: null as Record<string, any> | null };
  }

  const trimmed = rawResolution.trim();
  if (!trimmed) {
    return { text: '', payload: null as Record<string, any> | null };
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { text: trimmed, payload: parsed as Record<string, any> };
    }
  } catch {
    // texto simples
  }

  return { text: trimmed, payload: null as Record<string, any> | null };
};

const getPendingFieldRequests = (pending: any) => {
  const metadata = pending?.metadata && typeof pending.metadata === 'object'
    ? pending.metadata as Record<string, any>
    : {};

  if (Array.isArray(metadata.fields) && metadata.fields.length > 0) {
    return metadata.fields.map((field: any) => ({
      fieldId: typeof field?.id === 'string' ? field.id : undefined,
      fieldKey: typeof field?.key === 'string' ? field.key : undefined,
      fieldLabel: typeof field?.label === 'string' ? field.label : undefined,
      fieldType: typeof field?.type === 'string' ? field.type : undefined,
      required: field?.required !== false,
    }));
  }

  if (metadata.fieldId || metadata.fieldKey || metadata.fieldLabel) {
    return [{
      fieldId: typeof metadata.fieldId === 'string' ? metadata.fieldId : undefined,
      fieldKey: typeof metadata.fieldKey === 'string' ? metadata.fieldKey : undefined,
      fieldLabel: typeof metadata.fieldLabel === 'string' ? metadata.fieldLabel : undefined,
      fieldType: typeof metadata.fieldType === 'string' ? metadata.fieldType : undefined,
      required: true,
    }];
  }

  return [];
};

const getPendingDocumentRequests = (pending: any) => {
  const metadata = pending?.metadata && typeof pending.metadata === 'object'
    ? pending.metadata as Record<string, any>
    : {};

  if (Array.isArray(metadata.documentRequests) && metadata.documentRequests.length > 0) {
    return metadata.documentRequests.map((document: any, index: number) => ({
      id: String(document?.id || document?.documentId || document?.documentType || document?.name || `document-${index}`),
      documentId: typeof document?.documentId === 'string' ? document.documentId : undefined,
      documentType: String(document?.documentType || document?.name || pending.title || `Documento ${index + 1}`),
      label: String(document?.label || document?.name || document?.documentType || pending.title || `Documento ${index + 1}`),
      required: document?.required !== false,
    }));
  }

  return [{
    id: String(metadata.documentId || metadata.documentType || pending.id),
    documentId: typeof metadata.documentId === 'string' ? metadata.documentId : undefined,
    documentType: String(metadata.documentType || pending.title || 'DOCUMENTO_PENDENCIA'),
    label: String(metadata.documentLabel || metadata.documentType || pending.title || 'Documento solicitado'),
    required: true,
  }];
};

const parsePendingUploadMetadata = (rawMetadata: unknown, filesCount: number) => {
  if (!rawMetadata || typeof rawMetadata !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(rawMetadata);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.slice(0, filesCount).map((item: any) => ({
      documentId: item?.docId || item?.documentId || undefined,
      documentType: item?.documentType || item?.name || undefined,
      required: item?.required !== false,
    }));
  } catch {
    return [];
  }
};

// ========================================
// CITIZENS
// ========================================

// GET /api/internal/citizens/:citizenId - Buscar cidadão por ID
router.get('/citizens/:citizenId', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;

    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        phoneSecondary: true,
        birthDate: true,
        address: true,
        municipioId: true,
        isActive: true,
        verificationStatus: true,
        rg: true,
        motherName: true,
        maritalStatus: true,
        occupation: true,
        familyIncome: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!citizen) {
      return res.status(404).json({ error: 'Citizen not found' });
    }

    res.json(citizen);
  } catch (error) {
    console.error('[internal.routes] Error in GET /citizens/:citizenId', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/internal/citizens/:citizenId - Atualizar perfil do cidadão
router.put('/citizens/:citizenId', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;
    const updates = req.body;

    // Campos permitidos para atualização
    const allowedFields = [
      'name', 'email', 'phone', 'phoneSecondary', 'birthDate',
      'address', 'rg', 'motherName', 'maritalStatus', 'occupation', 'familyIncome'
    ];

    const dataToUpdate: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        dataToUpdate[field] = updates[field];
      }
    }

    // Endereço é um JSON: fazer merge com o endereço atual para permitir atualizações parciais
    // e suportar "pular" no complemento (fluxo envia sem o campo em vez de sobrescrever com "pular").
    if (dataToUpdate.address !== undefined) {
      const incomingAddress = coerceObject(dataToUpdate.address);

      if (incomingAddress && Object.keys(incomingAddress).length > 0) {
        const existing = await prisma.citizen.findUnique({
          where: { id: citizenId },
          select: { address: true },
        });

        const baseAddress = coerceObject(existing?.address);
        dataToUpdate.address = {
          ...(baseAddress as any),
          ...(incomingAddress as any),
        };
      } else {
        // Evita sobrescrever com objeto vazio
        delete dataToUpdate.address;
      }
    }

    const citizen = await prisma.$transaction(async (tx) => {
      const updatedCitizen = await tx.citizen.update({
        where: { id: citizenId },
        data: {
          ...dataToUpdate,
          name:
            dataToUpdate.name !== undefined
              ? normalizeNullableString(dataToUpdate.name) || dataToUpdate.name
              : dataToUpdate.name,
          email:
            dataToUpdate.email !== undefined
              ? normalizeEmail(dataToUpdate.email) || dataToUpdate.email
              : dataToUpdate.email,
          phone:
            dataToUpdate.phone !== undefined
              ? normalizeNullableString(dataToUpdate.phone) || null
              : dataToUpdate.phone,
          rg:
            dataToUpdate.rg !== undefined
              ? normalizeNullableString(dataToUpdate.rg) || null
              : dataToUpdate.rg,
        },
      });

      await syncCitizenPersonIdentity(tx, {
        citizenId,
        currentPersonId: updatedCitizen.personId,
        cpf: updatedCitizen.cpf,
        name: updatedCitizen.name,
        email: updatedCitizen.email,
        phone: updatedCitizen.phone,
        rg: updatedCitizen.rg,
        birthDate: updatedCitizen.birthDate,
        isActive: updatedCitizen.isActive,
      });

      return updatedCitizen;
    });

    res.json(citizen);
  } catch (error) {
    console.error('[internal.routes] Error in PUT /citizens/:citizenId', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/citizens/:citizenId/family - Composição familiar
router.get('/citizens/:citizenId/family', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;

    const familyMembers = await prisma.familyComposition.findMany({
      where: {
        OR: [
          { headId: citizenId },
          { memberId: citizenId },
        ],
      },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            cpf: true,
            birthDate: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            cpf: true,
            birthDate: true,
          },
        },
      },
    });

    res.json(familyMembers);
  } catch (error) {
    console.error('[internal.routes] Error in GET /citizens/:citizenId/family', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// SERVICES
// ========================================

// GET /api/internal/services/search - Buscar serviços
router.get('/services/search', async (req: Request, res: Response) => {
  try {
    const { query, category, limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    let services;
    const selectFields = {
      id: true,
      name: true,
      description: true,
      category: true,
      estimatedDays: true,
      requiresDocuments: true,
      requiredDocuments: true,
      formSchema: true,
      formFieldsConfig: true,
      enabledFields: true,
      moduleType: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    };

    if (query) {
      // Busca por query (texto)
      services = await prisma.serviceSimplified.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query as string, mode: 'insensitive' } },
            { description: { contains: query as string, mode: 'insensitive' } },
          ],
        },
        take: limitNum,
        orderBy: { name: 'asc' },
        select: selectFields,
      });
    } else if (category) {
      // Busca por categoria
      services = await prisma.serviceSimplified.findMany({
        where: {
          isActive: true,
          category: category as string,
        },
        take: limitNum,
        orderBy: { name: 'asc' },
        select: selectFields,
      });
    } else {
      // Listar serviços populares
      services = await prisma.serviceSimplified.findMany({
        where: { isActive: true },
        take: limitNum,
        orderBy: { name: 'asc' },
        select: selectFields,
      });
    }

    res.json(services);
  } catch (error) {
    console.error('[internal.routes] Error in GET /services/search', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/services - Listar serviços
router.get('/services', async (req: Request, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    console.log('[internal.routes] GET /services - limit:', limitNum);

    const services = await prisma.serviceSimplified.findMany({
      where: { isActive: true },
      take: limitNum,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        estimatedDays: true,
        requiresDocuments: true,
        requiredDocuments: true,
        formSchema: true,
        formFieldsConfig: true,
        enabledFields: true,
        moduleType: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('[internal.routes] GET /services - found:', services.length, 'services');

    if (services.length === 0) {
      console.warn('[internal.routes] GET /services - AVISO: Nenhum serviço ativo encontrado no banco!');
    }

    res.json(services);
  } catch (error) {
    console.error('[internal.routes] Error in GET /services', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/services/categories - Listar categorias
router.get('/services/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.serviceSimplified.findMany({
      where: { isActive: true },
      distinct: ['category'],
      select: { category: true },
    });

    const categoryList = categories
      .map(c => c.category)
      .filter(c => c !== null && c !== '')
      .sort();

    res.json(categoryList);
  } catch (error) {
    console.error('[internal.routes] Error in GET /services/categories', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/services/:serviceId - Obter serviço
router.get('/services/:serviceId', async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      include: {
        department: true,
      },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('[internal.routes] Error in GET /services/:serviceId', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// PROTOCOLS
// ========================================

// POST /api/internal/protocols - Criar protocolo
router.post(
  '/protocols',
  (req, res, next) => {
    uploadDocuments(req, res, (err) => {
      if (err) {
        console.error('[internal.routes] Multer error in POST /protocols:', err);
        return res.status(400).json({
          error: 'Erro ao processar upload de arquivos',
          details: err.message,
        });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const { citizenId, serviceId, description, customData } = req.body as any;

      if (!citizenId || !serviceId) {
        return res.status(400).json({ error: 'citizenId and serviceId are required' });
      }

      const service = await prisma.serviceSimplified.findUnique({
        where: { id: serviceId },
        include: { department: true },
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Extrair e limpar dados do formulário (description é campo separado)
      const baseCustomData = coerceObject(customData);
      const cleanedCustomData: Record<string, any> = { ...(baseCustomData as any) };
      delete cleanedCustomData.description;
      delete cleanedCustomData.descricao;

      // Validar formData contra o JSON Schema do serviço (se houver)
      if (Object.keys(cleanedCustomData).length > 0) {
        const validation = validateServiceFormData(service as any, cleanedCustomData);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Dados do formulário inválidos',
            details: validation.errors,
          });
        }
      }

      const moduleFormData = {
        citizenId,
        ...cleanedCustomData,
      };

      // Validação de unicidade (mesma regra do painel do cidadão)
      const uniquenessValidation = await validateProtocolUniqueness(
        citizenId,
        serviceId,
        moduleFormData
      );

      if (!uniquenessValidation.canCreate) {
        return res.status(400).json({
          error: uniquenessValidation.errorMessage || 'Não é possível criar este protocolo',
          reason: uniquenessValidation.reason,
          existingProtocolNumber: uniquenessValidation.existingProtocolNumber,
        });
      }

      // Criar protocolo usando o mesmo pipeline do painel do cidadão
      const result = await protocolModuleService.createProtocolWithModule({
        citizenId,
        serviceId,
        formData: moduleFormData,
        description: description || '',
        createdById: undefined,
      });

      const uploadedFiles = ((req as any).files || []) as Express.Multer.File[];

      let documentTypes: string[] = [];
      if ((req.body as any).documentTypes) {
        const raw = (req.body as any).documentTypes;
        if (Array.isArray(raw)) {
          documentTypes = raw;
        } else if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            documentTypes = Array.isArray(parsed) ? parsed : [raw];
          } catch {
            documentTypes = [raw];
          }
        }
      }

      let uploadedDocsResult: any[] = [];
      let uploadErrors: string[] = [];

      if (uploadedFiles.length > 0) {
        try {
          const uploadResult = await documentUploadService.uploadDocumentsToProtocol({
            protocolId: result.protocol.id,
            files: uploadedFiles,
            uploadedBy: citizenId,
            documentTypes,
          });
          uploadedDocsResult = uploadResult.uploadedDocuments || [];
          uploadErrors = uploadResult.errors || [];
        } catch (docErr: any) {
          console.error('[internal.routes] Error uploading protocol documents:', docErr);
          uploadErrors = [docErr?.message || 'Erro ao salvar documentos do protocolo'];
        }
      }

      // Criar pendentes para documentos obrigatórios que não foram enviados
      await ensureRequiredProtocolDocuments(result.protocol.id, service as any, uploadedDocsResult);

      const fullProtocol = await prisma.protocolSimplified.findUnique({
        where: { id: result.protocol.id },
        include: { service: true, department: true },
      });

      // Registrar uma interação pública no protocolo (visível ao cidadão)
      // Isso ajuda a manter o histórico consistente no painel.
      try {
        const citizen = await prisma.citizen.findUnique({
          where: { id: citizenId },
          select: { name: true },
        });

        await prisma.protocolInteraction.create({
          data: {
            protocolId: result.protocol.id,
            type: 'MESSAGE',
            authorType: 'CITIZEN',
            authorId: citizenId,
            authorName: citizen?.name || 'Cidadão',
            message: `Protocolo ${result.protocol.number} criado via DigiBot`,
            isInternal: false,
            isRead: false,
          },
        });
      } catch (interactionErr) {
        console.warn('[internal.routes] Failed to create protocol interaction:', interactionErr);
      }

      const warnings = uploadErrors.filter(Boolean);
      if (warnings.length > 0) {
        console.warn('[internal.routes] Protocol created with warnings:', warnings);
      }

      res.json({ protocol: fullProtocol, warnings });
    } catch (error) {
      console.error('[internal.routes] Error in POST /protocols', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/internal/protocols - Listar protocolos do cidadão
router.get('/protocols', async (req: Request, res: Response) => {
  try {
    const { citizenId, limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    console.log('[internal.routes] GET /protocols - citizenId:', citizenId, 'limit:', limitNum);

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    const protocols = await prisma.protocolSimplified.findMany({
      where: { citizenId: citizenId as string },
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            estimatedDays: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('[internal.routes] GET /protocols - found:', protocols.length, 'protocols');

    if (protocols.length === 0) {
      console.warn('[internal.routes] GET /protocols - AVISO: Nenhum protocolo encontrado para o cidadão');
    }

    res.json(protocols);
  } catch (error) {
    console.error('[internal.routes] Error in GET /protocols', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/protocols/number/:protocolNumber - Buscar por número
router.get('/protocols/number/:protocolNumber', async (req: Request, res: Response) => {
  try {
    const { protocolNumber } = req.params;
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        number: protocolNumber,
        citizenId: citizenId as string,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            estimatedDays: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        stages: {
          orderBy: { stageOrder: 'asc' },
          select: {
            id: true,
            stageName: true,
            stageOrder: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        },
        sla: {
          select: {
            expectedEndDate: true,
            isOverdue: true,
            daysOverdue: true,
          },
        },
        _count: {
          select: {
            pendings: {
              where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                type: { in: ['DOCUMENT', 'INFORMATION', 'CORRECTION', 'VALIDATION', 'PAYMENT'] },
              },
            },
          },
        },
      },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    res.json(protocol);
  } catch (error) {
    console.error('[internal.routes] Error in GET /protocols/number/:protocolNumber', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/protocols/:protocolId/pendings - Pendencias do protocolo para o bot/canais internos
router.get('/protocols/:protocolId/pendings', async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    const { citizenId } = req.query;

    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        ...(citizenId ? { citizenId: citizenId as string } : {}),
      },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const pendings = await pendingService.getCitizenPendings(protocolId);
    res.json({ pendings });
  } catch (error) {
    console.error('[internal.routes] Error in GET /protocols/:protocolId/pendings', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/internal/protocols/:protocolId/pendings/:pendingId/resolve - Resolver pendencia textual
router.post('/protocols/:protocolId/pendings/:pendingId/resolve', async (req: Request, res: Response) => {
  try {
    const { protocolId, pendingId } = req.params;
    const { citizenId, resolution } = req.body;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const pending = await prisma.protocolPending.findFirst({
      where: { id: pendingId, protocolId },
    });

    if (!pending) {
      return res.status(404).json({ error: 'Pending not found' });
    }

    if (!['OPEN', 'IN_PROGRESS'].includes(pending.status)) {
      return res.status(400).json({
        error: pending.status === 'UNDER_REVIEW'
          ? 'Pending already submitted and awaiting review'
          : 'Pending already resolved or cancelled'
      });
    }

    const parsed = parseInternalPendingResolution(resolution);
    const fieldRequests = getPendingFieldRequests(pending);

    if (fieldRequests.length > 0) {
      const submittedFields = fieldRequests.map((field, index) => {
        const candidateValue =
          typeof parsed.payload?.[String(field.fieldId || '')] === 'string' ? parsed.payload?.[String(field.fieldId || '')] :
          typeof parsed.payload?.[String(field.fieldKey || '')] === 'string' ? parsed.payload?.[String(field.fieldKey || '')] :
          fieldRequests.length === 1 && typeof parsed.payload?.value === 'string' ? parsed.payload.value :
          fieldRequests.length === 1 ? parsed.text :
          '';

        return {
          ...field,
          value: candidateValue?.trim(),
          index,
        };
      });

      const missingFields = submittedFields.filter((field) => field.required !== false && !field.value);
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `resolution is required for: ${missingFields.map((field) => field.fieldLabel || field.fieldKey || `field ${field.index + 1}`).join(', ')}`
        });
      }

      await dataFieldService.applyPendingFieldResponses(
        submittedFields
          .filter((field) => field.value)
          .map((field) => ({
            protocolId,
            fieldId: field.fieldId,
            fieldKey: field.fieldKey,
            fieldLabel: field.fieldLabel,
            fieldType: field.fieldType,
            value: String(field.value),
            correctedBy: citizenId,
            required: field.required,
          }))
      );

      const summary = submittedFields
        .filter((field) => field.value)
        .map((field) => `${field.fieldLabel || field.fieldKey || 'Campo'}: ${field.value}`)
        .join('\n');

      await pendingService.submitPendingResponse(pendingId, citizenId, summary, {
        fields: submittedFields.map((field) => ({
          id: field.fieldId || field.fieldKey,
          key: field.fieldKey || field.fieldId,
          label: field.fieldLabel || field.fieldKey || 'Campo',
          type: field.fieldType || 'text',
          required: field.required !== false,
        })),
        submittedFields: submittedFields
          .filter((field) => field.value)
          .map((field) => ({
            id: field.fieldId || field.fieldKey,
            key: field.fieldKey || field.fieldId,
            label: field.fieldLabel || field.fieldKey || 'Campo',
            value: field.value,
          })),
      });
    } else {
      if (!parsed.text) {
        return res.status(400).json({ error: 'resolution is required' });
      }

      await pendingService.submitPendingResponse(pendingId, citizenId, parsed.text);
    }

    const updatedPending = await prisma.protocolPending.findUnique({ where: { id: pendingId } });

    res.json({ pending: updatedPending ? pendingService.serializePendingForCitizen(updatedPending as any) : null });
  } catch (error) {
    console.error('[internal.routes] Error in POST /protocols/:protocolId/pendings/:pendingId/resolve', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/internal/protocols/:protocolId/pendings/:pendingId/resolve-document - Resolver pendencia com documento
router.post('/protocols/:protocolId/pendings/:pendingId/resolve-document', uploadDocuments, async (req: Request, res: Response) => {
  try {
    const { protocolId, pendingId } = req.params;
    const citizenId = String(req.body?.citizenId || '');
    const files = Array.isArray(req.files) ? req.files as Express.Multer.File[] : [];

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    if (files.length === 0) {
      return res.status(400).json({ error: 'document is required' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const pending = await prisma.protocolPending.findFirst({
      where: { id: pendingId, protocolId },
    });

    if (!pending) {
      return res.status(404).json({ error: 'Pending not found' });
    }

    if (!['OPEN', 'IN_PROGRESS'].includes(pending.status)) {
      return res.status(400).json({
        error: pending.status === 'UNDER_REVIEW'
          ? 'Pending already submitted and awaiting review'
          : 'Pending already resolved or cancelled'
      });
    }

    if (pending.type !== 'DOCUMENT') {
      return res.status(400).json({ error: 'Pending does not accept document upload' });
    }

    const requestedDocuments = getPendingDocumentRequests(pending);
    const uploadMetadata = parsePendingUploadMetadata(req.body?.fileMetadata, files.length);
    const mapping = mapUploadedFilesToDocuments(
      files.map((file, index) => ({
        documentId: sanitizeDocumentId(
          String(
            uploadMetadata[index]?.documentId ||
            uploadMetadata[index]?.documentType ||
            file.originalname
          )
        ),
        name: file.originalname,
      })),
      requestedDocuments.map((document) => ({
        id: sanitizeDocumentId(document.id || document.documentType || document.label),
        name: document.label,
        required: document.required !== false,
      }))
    );

    if (mapping.missingRequired.length > 0) {
      return res.status(400).json({
        error: `Missing required documents: ${mapping.missingRequired.join(', ')}`
      });
    }

    const protocolDir = ensureProtocolDir(protocolId);
    const uploadedDocuments: Array<{ id: string; documentType: string; fileName: string }> = [];

    for (const requestedDocument of requestedDocuments) {
      const requiredId = sanitizeDocumentId(requestedDocument.id || requestedDocument.documentType || requestedDocument.label);
      const fileIndex = mapping.mapped.get(requiredId);
      if (fileIndex === undefined) {
        continue;
      }

      const file = files[fileIndex];
      const newPath = path.join(protocolDir, file.filename);
      fs.renameSync(file.path, newPath);

      let targetDocumentId = requestedDocument.documentId;
      if (!targetDocumentId) {
        const existingDocument = await prisma.protocolDocument.findFirst({
          where: { protocolId, documentType: requestedDocument.documentType },
          orderBy: { createdAt: 'asc' },
        });

        if (existingDocument) {
          targetDocumentId = existingDocument.id;
        } else {
          const createdDocument = await prisma.protocolDocument.create({
            data: {
              protocolId,
              documentType: requestedDocument.documentType,
              isRequired: requestedDocument.required !== false,
              status: 'PENDING',
            },
          });
          targetDocumentId = createdDocument.id;
        }
      }

      const updatedDocument = await uploadProtocolDocument(targetDocumentId, {
        fileName: file.originalname,
        fileUrl: getProtocolFileUrl(protocolId, file.filename),
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: citizenId,
      }, {
        skipPendingSubmission: true,
      });

      uploadedDocuments.push({
        id: updatedDocument.id,
        documentType: updatedDocument.documentType,
        fileName: updatedDocument.fileName || file.originalname,
      });
    }

    const resolutionText = uploadedDocuments.length === 1
      ? `Documento enviado: ${uploadedDocuments[0].documentType}`
      : `Documentos enviados: ${uploadedDocuments.map((document) => document.documentType).join(', ')}`;

    await pendingService.submitPendingResponse(pendingId, citizenId, resolutionText, {
      documentRequests: requestedDocuments,
      submittedDocuments: uploadedDocuments,
    });

    const updatedPending = await prisma.protocolPending.findUnique({ where: { id: pendingId } });
    res.json({ pending: updatedPending ? pendingService.serializePendingForCitizen(updatedPending as any) : null });
  } catch (error) {
    console.error('[internal.routes] Error in POST /protocols/:protocolId/pendings/:pendingId/resolve-document', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// POST /api/internal/protocols/:protocolId/comments - Adicionar comentário
router.post('/protocols/:protocolId/comments', async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    const { citizenId, comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'comment is required' });
    }

    // Atualizar protocolo com comentário no metadata ou criar sistema de comentários
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      select: { customData: true },
    });

    const existingCustomData = coerceObject(protocol?.customData);
    const existingComments = Array.isArray((existingCustomData as any).comments)
      ? (existingCustomData as any).comments
      : [];

    const newComment = {
      citizenId,
      comment,
      createdAt: new Date().toISOString(),
    };

    const updatedCustomData = {
      ...existingCustomData,
      comments: [...existingComments, newComment],
    };

    const updated = await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        customData: updatedCustomData,
      },
    });

    await prisma.protocolInteraction.create({
      data: {
        protocolId,
        type: 'MESSAGE',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: 'Cidadao',
        message: comment,
        isInternal: false,
        isRead: false,
      },
    });

    res.json({ success: true, protocol: updated, comment: newComment });
  } catch (error) {
    console.error('[internal.routes] Error in POST /protocols/:protocolId/comments', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// NOTIFICATIONS
// ========================================

// GET /api/internal/notifications - Listar notificações
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { citizenId, unreadOnly = 'false', limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    const where: any = { citizenId: citizenId as string };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications);
  } catch (error) {
    console.error('[internal.routes] Error in GET /notifications', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/internal/notifications/read - Marcar como lidas
router.put('/notifications/read', async (req: Request, res: Response) => {
  try {
    const { citizenId, notificationIds } = req.body;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    const where: any = { citizenId };
    if (notificationIds && Array.isArray(notificationIds)) {
      where.id = { in: notificationIds };
    }

    await prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[internal.routes] Error in PUT /notifications/read', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/internal/notifications/dispatch - Enfileirar notificação interna
router.post('/notifications/dispatch', async (req: Request, res: Response) => {
  try {
    const { recipientType, recipientId, type, title, message, data, channels, priority } = req.body || {};

    if (!recipientType || !recipientId || !type || !title || !message) {
      return res.status(400).json({
        error: 'recipientType, recipientId, type, title and message are required',
      });
    }

    if (recipientType !== 'user' && recipientType !== 'citizen') {
      return res.status(400).json({ error: 'recipientType must be user or citizen' });
    }

    await notificationService.notify({
      recipientType,
      recipientId,
      type,
      title,
      message,
      data,
      channels,
      priority,
    });

    res.status(202).json({ success: true });
  } catch (error) {
    console.error('[internal.routes] Error in POST /notifications/dispatch', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// PROTOCOL INTERACTIONS
// ========================================

// GET /api/internal/protocols/:protocolId/interactions - Histórico de interações
router.get('/protocols/:protocolId/interactions', async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId: citizenId as string },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const interactions = await prisma.protocolInteraction.findMany({
      where: {
        protocolId,
        isInternal: false, // Não mostrar interações internas ao cidadão
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(interactions);
  } catch (error) {
    console.error('[internal.routes] Error in GET /protocols/:protocolId/interactions', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// DOCUMENTS
// ========================================

// GET /api/internal/citizens/:citizenId/documents - Documentos do cidadão
router.get('/citizens/:citizenId/documents', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;
    const { limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    console.log('[internal.routes] GET /citizens/:citizenId/documents - citizenId:', citizenId, 'limit:', limitNum);

    const documents = await prisma.protocolDocument.findMany({
      where: {
        protocol: {
          citizenId,
        },
      },
      include: {
        protocol: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      take: limitNum,
    });

    console.log('[internal.routes] GET /citizens/:citizenId/documents - found:', documents.length, 'documents');

    if (documents.length === 0) {
      console.warn('[internal.routes] GET /citizens/:citizenId/documents - AVISO: Nenhum documento encontrado para o cidadão');
    }

    res.json(documents);
  } catch (error) {
    console.error('[internal.routes] Error in GET /citizens/:citizenId/documents', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/protocols/:protocolId/documents - Documentos de um protocolo
router.get('/protocols/:protocolId/documents', async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId: citizenId as string },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const documents = await getProtocolDocumentsForProtocol(protocolId);

    res.json(documents);
  } catch (error) {
    console.error('[internal.routes] Error in GET /protocols/:protocolId/documents', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// EVALUATIONS
// ========================================

// GET /api/internal/evaluations/pending - Protocolos concluídos sem avaliação
router.get('/evaluations/pending', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    // Buscar protocolos concluídos do cidadão que ainda não foram avaliados
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        citizenId: citizenId as string,
        status: 'CONCLUIDO',
        evaluations: {
          none: {},
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { concludedAt: 'desc' },
    });

    res.json(protocols);
  } catch (error) {
    console.error('[internal.routes] Error in GET /evaluations/pending', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/internal/evaluations - Submeter avaliação
router.post('/evaluations', async (req: Request, res: Response) => {
  try {
    const { protocolId, citizenId, rating, comment } = req.body;

    if (!protocolId || !citizenId || rating === undefined) {
      return res.status(400).json({ error: 'protocolId, citizenId and rating are required' });
    }

    // Verificar se o protocolo pertence ao cidadão e está concluído
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId,
        status: 'CONCLUIDO',
      },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found or not completed' });
    }

    // Verificar se já existe avaliação
    const existingEval = await prisma.protocolEvaluationSimplified.findFirst({
      where: { protocolId },
    });

    if (existingEval) {
      return res.status(400).json({ error: 'Protocol already evaluated' });
    }

    const evaluation = await prisma.protocolEvaluationSimplified.create({
      data: {
        protocolId,
        rating: Math.min(5, Math.max(0, parseInt(String(rating), 10))),
        comment: comment || '',
      },
    });

    res.json(evaluation);
  } catch (error) {
    console.error('[internal.routes] Error in POST /evaluations', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// DEPARTMENTS
// ========================================

// GET /api/internal/departments - Listar departamentos (apenas os que têm serviços ativos)
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      where: {
        isActive: true,
        servicesSimplified: {
          some: { isActive: true },
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            servicesSimplified: true,
          },
        },
      },
    });

    res.json(departments);
  } catch (error) {
    console.error('[internal.routes] Error in GET /departments', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/departments/:deptId/services - Serviços de um departamento agrupados por categoria
router.get('/departments/:deptId/services', async (req: Request, res: Response) => {
  try {
    const { deptId } = req.params;

    const department = await prisma.department.findUnique({
      where: { id: deptId },
      select: { id: true, name: true, description: true },
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const services = await prisma.serviceSimplified.findMany({
      where: {
        departmentId: deptId,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { priority: 'desc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        estimatedDays: true,
        requiresDocuments: true,
        requiredDocuments: true,
        formSchema: true,
        formFieldsConfig: true,
        enabledFields: true,
        moduleType: true,
        serviceType: true,
        icon: true,
        color: true,
        requiresSpecificLocation: true,
        locationLabel: true,
      },
    });

    // Agrupar por categoria
    const grouped: Record<string, any[]> = {};
    for (const service of services) {
      const cat = service.category || 'Geral';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(service);
    }

    const categories = Object.entries(grouped).map(([name, items]) => ({
      name,
      count: items.length,
      services: items,
    }));

    res.json({
      department,
      totalServices: services.length,
      categories,
    });
  } catch (error) {
    console.error('[internal.routes] Error in GET /departments/:deptId/services', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
