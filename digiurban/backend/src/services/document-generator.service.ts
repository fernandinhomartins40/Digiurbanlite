/**
 * ============================================================================
 * DOCUMENT GENERATOR SERVICE
 * ============================================================================
 * Serviço responsável por gerar documentos (PDF, DOCX, HTML) a partir de
 * templates Handlebars e enviar por email.
 */

import { PrismaClient } from '@prisma/client';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import {
  generateUniqueValidationCode,
  generateDocumentHash
} from '../utils/validation-code.utils';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES
// ============================================================================

interface GenerateDocumentInput {
  templateId: string;
  protocolId: string;
  generatedBy: string;
  additionalData?: Record<string, any>;
  certificateInfo?: {
    serialNumber: string;
    commonName: string;
    issuer: string;
    issuedAt: Date;
    expiresAt: Date;
    thumbprint: string;
  };
}

interface SendDocumentInput {
  documentId: string;
  recipientEmail: string;
  recipientName: string;
  subject?: string;
  message?: string;
  sentBy: string;
}

// ============================================================================
// HELPERS DE FORMATAÇÃO
// ============================================================================

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(date));
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return cpf;
}

// ============================================================================
// REGISTRAR HELPERS DO HANDLEBARS
// ============================================================================

Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatDateTime', formatDateTime);
Handlebars.registerHelper('formatCurrency', formatCurrency);
Handlebars.registerHelper('formatPhone', formatPhone);
Handlebars.registerHelper('formatCPF', formatCPF);

// Helper para comparações
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// Helper para verificar se existe
Handlebars.registerHelper('exists', function(value) {
  return value !== null && value !== undefined && value !== '';
});

// ============================================================================
// FUNÇÃO PRINCIPAL: GERAR DOCUMENTO
// ============================================================================

export async function generateDocument(input: GenerateDocumentInput) {
  const { templateId, protocolId, generatedBy, additionalData = {} } = input;

  console.log(`📄 Gerando documento: template=${templateId}, protocol=${protocolId}`);

  // 1. Gerar código de validação ANTES de gerar o PDF
  console.log('   → Gerando código de validação...');
  const validationCode = await generateUniqueValidationCode(prisma);
  console.log(`   ✓ Código de validação: ${validationCode}`);

  // 2. Buscar template
  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId }
  });

  if (!template) {
    throw new Error('Template não encontrado');
  }

  if (!template.isActive) {
    throw new Error('Template inativo');
  }

  // 2. Buscar dados do protocolo
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: {
      dataFields: {
        where: { status: 'APPROVED' },
        orderBy: { fieldLabel: 'asc' }
      },
      documentFiles: {
        where: { status: 'APPROVED' },
        orderBy: { uploadedAt: 'desc' }
      },
      stages: {
        orderBy: { stageOrder: 'asc' }
      },
      history: {
        orderBy: { id: 'asc' }
      }
    }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // Buscar dados relacionados
  const [citizen, service, department, assignedUser] = await Promise.all([
    prisma.citizen.findUnique({ where: { id: protocol.citizenId } }),
    prisma.serviceSimplified.findUnique({ where: { id: protocol.serviceId } }),
    prisma.department.findUnique({ where: { id: protocol.departmentId } }),
    protocol.assignedUserId
      ? prisma.user.findUnique({ where: { id: protocol.assignedUserId } })
      : Promise.resolve(null)
  ]);

  // 3. Preparar variáveis para o template
  const variables = {
    // ===== PROTOCOLO =====
    protocolNumber: protocol.number || '-',
    protocolTitle: protocol.title || '-',
    protocolDescription: protocol.description || '-',
    protocolStatus: protocol.status || '-',
    protocolPriority: protocol.priority || 0,
    protocolCreatedAt: formatDate(protocol.createdAt),
    protocolCreatedAtFull: formatDateTime(protocol.createdAt),
    protocolUpdatedAt: formatDate(protocol.updatedAt),
    protocolConcludedAt: protocol.concludedAt ? formatDate(protocol.concludedAt) : null,
    protocolConcludedAtFull: protocol.concludedAt ? formatDateTime(protocol.concludedAt) : null,
    protocolDueDate: protocol.dueDate ? formatDate(protocol.dueDate) : null,

    // ===== CIDADÃO =====
    citizenName: citizen?.name || '-',
    citizenCpf: formatCPF(citizen?.cpf),
    citizenEmail: citizen?.email || '-',
    citizenPhone: formatPhone(citizen?.phone),
    citizenAddress: citizen?.address || '-',
    citizenNeighborhood: '-',
    citizenCity: '-',
    citizenState: '-',
    citizenZipCode: '-',
    citizenBirthDate: citizen?.birthDate ? formatDate(citizen.birthDate) : '-',

    // ===== SERVIÇO =====
    serviceName: service?.name || '-',
    serviceDescription: service?.description || '-',
    serviceEstimatedDays: service?.estimatedDays || '-',

    // ===== DEPARTAMENTO =====
    departmentName: department?.name || '-',
    departmentDescription: department?.description || '-',

    // ===== RESPONSÁVEL =====
    assignedUserName: assignedUser?.name || 'Não atribuído',
    assignedUserEmail: assignedUser?.email || '-',

    // ===== CAMPOS APROVADOS =====
    dataFields: protocol.dataFields.map(f => ({
      label: f.fieldLabel,
      value: f.fieldValue,
      type: f.fieldType,
      isRequired: f.isRequired
    })),
    hasDataFields: protocol.dataFields.length > 0,

    // ===== DOCUMENTOS APROVADOS =====
    documents: protocol.documentFiles.map(d => ({
      type: d.documentType,
      fileName: d.fileName,
      uploadedAt: formatDate(d.uploadedAt),
      approvedAt: formatDate(d.validatedAt)
    })),
    hasDocuments: protocol.documentFiles.length > 0,

    // ===== HISTÓRICO =====
    history: protocol.history.map(h => ({
      date: formatDateTime(h.timestamp),
      action: h.action,
      comment: h.comment || '',
      actorName: 'Sistema'
    })),
    hasHistory: protocol.history.length > 0,

    // ===== ETAPAS =====
    stages: protocol.stages.map(s => ({
      name: s.stageName,
      order: s.stageOrder,
      status: s.status,
      startedAt: s.startedAt ? formatDateTime(s.startedAt) : null,
      completedAt: s.completedAt ? formatDateTime(s.completedAt) : null,
      notes: s.notes || '',
      isCompleted: s.status === 'COMPLETED',
      isPending: s.status === 'PENDING',
      isInProgress: s.status === 'IN_PROGRESS'
    })),
    hasStages: protocol.stages.length > 0,

    // ===== GEOLOCALIZAÇÃO =====
    hasLocation: !!protocol.latitude && !!protocol.longitude,
    latitude: protocol.latitude,
    longitude: protocol.longitude,
    address: protocol.address || '-',
    specificLocation: protocol.specificLocation || '-',

    // ===== METADADOS DE GERAÇÃO =====
    generatedAt: formatDateTime(new Date()),
    generatedAtDate: formatDate(new Date()),
    generatedBy: generatedBy,
    templateName: template.name,
    templateCode: template.code,

    // ===== CÓDIGO DE VALIDAÇÃO =====
    validationCode: validationCode,
    validationCodeFormatted: validationCode.replace(/-/g, ' - '),

    // ===== CERTIFICADO DIGITAL (se fornecido) =====
    hasCertificate: !!input.certificateInfo,
    certificateSerialNumber: input.certificateInfo?.serialNumber || '',
    certificateCommonName: input.certificateInfo?.commonName || '',
    certificateIssuer: input.certificateInfo?.issuer || '',
    certificateIssuedAt: input.certificateInfo ? formatDateTime(input.certificateInfo.issuedAt) : '',
    certificateExpiresAt: input.certificateInfo ? formatDate(input.certificateInfo.expiresAt) : '',
    certificateThumbprint: input.certificateInfo?.thumbprint || '',

    // ===== DADOS ADICIONAIS =====
    ...additionalData
  };

  console.log(`   ✓ Variáveis preparadas: ${Object.keys(variables).length} variáveis`);

  // 4. Compilar template Handlebars
  const compiledTemplate = Handlebars.compile(template.htmlTemplate);
  const html = compiledTemplate(variables);

  // Compilar header/footer se existirem
  const header = template.headerHtml
    ? Handlebars.compile(template.headerHtml)(variables)
    : undefined;
  const footer = template.footerHtml
    ? Handlebars.compile(template.footerHtml)(variables)
    : undefined;

  console.log('   ✓ Template compilado');

  // 5. Gerar PDF com Playwright
  const { chromium } = await import('playwright');

  console.log(`   → Playwright procurando browsers em: ${process.env.PLAYWRIGHT_BROWSERS_PATH || 'padrão'}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  console.log('   ✓ Playwright iniciado');

  try {
    const page = await browser.newPage();

    // Injetar HTML completo
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${template.cssStyles || ''}

          /* Reset básico */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
          }

          /* Utilitários */
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-justify { text-align: justify; }
          .mt-1 { margin-top: 8px; }
          .mt-2 { margin-top: 16px; }
          .mt-3 { margin-top: 24px; }
          .mt-4 { margin-top: 32px; }
          .mb-1 { margin-bottom: 8px; }
          .mb-2 { margin-bottom: 16px; }
          .mb-3 { margin-bottom: 24px; }
          .mb-4 { margin-bottom: 32px; }
          .font-bold { font-weight: bold; }

          /* Tabelas */
          table { width: 100%; border-collapse: collapse; }
          table td, table th { padding: 8px; text-align: left; }
          table th { font-weight: bold; background-color: #f5f5f5; }
          table tr { border-bottom: 1px solid #e0e0e0; }

          /* Página */
          @page { margin: 0; }
          .page-content { padding: 40px; padding-bottom: ${input.certificateInfo ? '120px' : '40px'}; }

          /* Assinatura Digital */
          .digital-signature {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-top: 3px solid #1976d2;
            padding: 15px 40px;
            font-size: 9pt;
            color: #0d47a1;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          }
          .digital-signature h4 {
            margin: 0 0 8px 0;
            font-size: 10pt;
            color: #0d47a1;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .digital-signature .cert-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            margin-top: 8px;
          }
          .digital-signature .cert-info span {
            font-size: 8pt;
          }
          .digital-signature .cert-info strong {
            color: #1565c0;
          }
          .digital-signature .shield-icon {
            display: inline-block;
            width: 16px;
            height: 16px;
            background: #1976d2;
            color: white;
            border-radius: 3px;
            text-align: center;
            line-height: 16px;
            font-weight: bold;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        <div class="page-content">
          ${html}
        </div>
        ${input.certificateInfo ? `
        <div class="digital-signature">
          <h4>
            <span class="shield-icon">🔐</span>
            DOCUMENTO ASSINADO DIGITALMENTE
          </h4>
          <div class="cert-info">
            <span><strong>Assinado por:</strong> ${variables.certificateCommonName}</span>
            <span><strong>Emissor:</strong> ${variables.certificateIssuer}</span>
            <span><strong>Certificado Nº:</strong> ${variables.certificateSerialNumber}</span>
            <span><strong>Validade:</strong> ${variables.certificateIssuedAt} até ${variables.certificateExpiresAt}</span>
            <span style="grid-column: 1 / -1; font-size: 7pt;"><strong>Identificador (Thumbprint):</strong> ${variables.certificateThumbprint.substring(0, 40)}...</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 7pt; text-align: center; color: #546e7a;">
            Este documento foi assinado eletronicamente e possui validade jurídica conforme MP 2.200-2/2001 e Lei 14.063/2020.
            Verifique a autenticidade em: https://digiurban.com.br/validar-documento usando o código ${variables.validationCode}
          </p>
        </div>
        ` : ''}
      </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    // Configurar margens
    const margins = (template.margins as any) || {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    };

    // Definir nome do arquivo
    const timestamp = Date.now();
    const fileName = `${protocol.number}_${template.code}_${timestamp}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'generated', protocolId);

    // Criar diretório se não existir
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);

    console.log(`   ✓ Gerando PDF: ${fileName}`);

    // Gerar PDF
    await page.pdf({
      path: filePath,
      format: template.pageSize as any,
      landscape: template.orientation === 'landscape',
      margin: margins,
      displayHeaderFooter: !!header || !!footer,
      headerTemplate: header || '<div></div>',
      footerTemplate: footer || '<div></div>',
      printBackground: true
    });

    await browser.close();

    console.log('   ✓ PDF gerado com sucesso');

    // 6. Obter tamanho do arquivo
    const stats = await fs.stat(filePath);

    // 7. Calcular hash SHA-256 do documento (já contém o código de validação)
    console.log('   → Calculando hash SHA-256 do documento...');
    const documentHash = await generateDocumentHash(filePath);
    console.log(`   ✓ Hash: ${documentHash.substring(0, 16)}...`);

    // 8. Calcular data de expiração (se o template tiver)
    let expiresAt: Date | null = null;
    if ((template as any).expirationDays) {
      const days = (template as any).expirationDays;
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      console.log(`   ✓ Data de expiração: ${expiresAt.toISOString()} (${days} dias)`);
    }

    // 9. Salvar registro no banco com validação
    const generatedDoc = await prisma.generatedDocument.create({
      data: {
        protocolId,
        templateId,
        fileName,
        filePath: `/uploads/generated/${protocolId}/${fileName}`,
        fileSize: stats.size,
        mimeType: 'application/pdf',
        generatedBy,
        templateVersion: template.version,
        variablesUsed: variables as any,
        // SISTEMA DE VALIDAÇÃO
        validationCode,
        documentHash,
        expiresAt,
        validatedCount: 0
      }
    });

    console.log(`✅ Documento gerado: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
    console.log(`   🔐 Código de validação: ${validationCode}`);

    return generatedDoc;

  } catch (error) {
    await browser.close();
    throw error;
  }
}

// ============================================================================
// FUNÇÃO: ENVIAR DOCUMENTO POR EMAIL
// ============================================================================

export async function sendDocumentByEmail(input: SendDocumentInput) {
  const { documentId, recipientEmail, recipientName, subject, message, sentBy } = input;

  console.log(`📧 Enviando documento ${documentId} para ${recipientEmail}`);

  // 1. Buscar documento
  const doc = await prisma.generatedDocument.findUnique({
    where: { id: documentId },
    include: {
      protocol: {
        include: { citizen: true, service: true }
      },
      template: true
    }
  });

  if (!doc) {
    throw new Error('Documento não encontrado');
  }

  // 2. Preparar email
  const emailSubject = subject || `Documento do Protocolo ${doc.protocol.number}`;
  const emailMessage = message || `
    <p>Olá <strong>${recipientName}</strong>,</p>
    <br>
    <p>Segue em anexo o documento referente ao protocolo <strong>${doc.protocol.number}</strong> - <strong>${doc.protocol.service.name}</strong>.</p>
    <br>
    <p>Atenciosamente,<br>
    Equipe de Atendimento</p>
  `;

  // 3. Enviar via serviço de email (usando nodemailer direto)
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'ultrazend-smtp',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    tls: {
      rejectUnauthorized: false
    }
  });

  const filePath = path.join(process.cwd(), doc.filePath);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@digiurban.com',
    to: recipientEmail,
    subject: emailSubject,
    html: emailMessage,
    attachments: [{
      filename: doc.fileName,
      path: filePath
    }]
  });

  // 4. Atualizar registro
  await prisma.generatedDocument.update({
    where: { id: documentId },
    data: {
      wasSent: true,
      sentAt: new Date(),
      sentBy,
      sentTo: recipientEmail
    }
  });

  console.log(`✅ Documento enviado para ${recipientEmail}`);

  return { success: true };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Listar templates disponíveis para um serviço
 */
export async function getTemplatesForService(serviceId: string) {
  const templates = await prisma.documentTemplate.findMany({
    where: {
      isActive: true,
      OR: [
        { isGlobal: true },
        { serviceIds: { array_contains: [serviceId] } }
      ]
    },
    orderBy: { name: 'asc' }
  });

  return templates;
}

/**
 * Listar documentos gerados de um protocolo
 */
export async function getGeneratedDocuments(protocolId: string) {
  const documents = await prisma.generatedDocument.findMany({
    where: {
      protocolId,
      isActive: true
    },
    include: {
      template: {
        select: {
          name: true,
          code: true,
          documentType: true
        }
      }
    },
    orderBy: { generatedAt: 'desc' }
  });

  // Mapear os documentos para o formato esperado pelo frontend (mesmo formato do cidadão)
  return documents.map(doc => {
    // Montar nome descritivo do documento
    let displayName = doc.template.name || doc.fileName || 'Documento';

    // Se tiver código do template, adicionar ao final
    if (doc.template.code && !displayName.includes(doc.template.code)) {
      displayName += ` (${doc.template.code})`;
    }

    return {
      id: doc.id,
      // Campo usado pelo componente admin
      documentType: doc.template.documentType || doc.template.name || 'Documento',
      // Campos adicionais para compatibilidade e informação completa
      name: displayName,
      type: doc.template.documentType || 'DOCUMENTO',
      fileUrl: doc.fileUrl,
      filePath: doc.filePath,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      // Importante: usar "createdAt" que é o esperado pelo componente admin
      createdAt: doc.generatedAt.toISOString(),
      generatedAt: doc.generatedAt.toISOString(),
      // Informações de envio
      wasSent: doc.wasSent,
      sentAt: doc.sentAt?.toISOString(),
      sentTo: doc.sentTo,
      // Informações de validação
      validationCode: (doc as any).validationCode || null,
      expiresAt: (doc as any).expiresAt?.toISOString() || null,
      // Template info
      template: doc.template,
      metadata: {
        template: doc.template.name,
        templateCode: doc.template.code
      }
    };
  });
}

/**
 * Obter estatísticas de documentos
 */
export async function getDocumentStats(protocolId?: string) {
  const where = protocolId ? { protocolId, isActive: true } : { isActive: true };

  const [total, sent, notSent] = await Promise.all([
    prisma.generatedDocument.count({ where }),
    prisma.generatedDocument.count({ where: { ...where, wasSent: true } }),
    prisma.generatedDocument.count({ where: { ...where, wasSent: false } })
  ]);

  return {
    total,
    sent,
    notSent,
    sentPercentage: total > 0 ? ((sent / total) * 100).toFixed(1) : '0'
  };
}
