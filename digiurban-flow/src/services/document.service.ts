/**
 * PDF document generation service via Playwright.
 */
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { config } from '../config/config';
import { FlowAuthContext } from '../middleware/auth.middleware';
import { assertProcessAccess } from './access-control.service';

export interface GenerateFlowDocumentInput {
  processId: string;
  templateName: string;
  generatedBy: string;
  generatedByName: string;
  additionalData?: Record<string, unknown>;
}

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(date: Date | string | null | undefined): string {
  const parsed = parseDate(date);
  if (!parsed) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(parsed);
}

function formatDateTime(date: Date | string | null | undefined): string {
  const parsed = parseDate(date);
  if (!parsed) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed);
}

function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return cpf;
}

Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatDateTime', formatDateTime);
Handlebars.registerHelper('formatCPF', formatCPF);
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('exists', (value: unknown) => value !== null && value !== undefined && value !== '');
Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase() || '');

async function loadTemplate(templateName: string): Promise<string> {
  const templatePaths = [
    path.join(process.cwd(), 'templates', `${templateName}.html`),
    path.join(__dirname, '..', '..', 'templates', `${templateName}.html`),
    path.join('/app', 'templates', `${templateName}.html`),
  ];

  for (const templatePath of templatePaths) {
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch {
      // try next path
    }
  }

  throw new Error(`Template nao encontrado: ${templateName}.html`);
}

async function generateDocumentHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export async function generateFlowDocument(input: GenerateFlowDocumentInput, auth: FlowAuthContext) {
  const { processId, templateName, generatedBy, generatedByName, additionalData = {} } = input;
  await assertProcessAccess(prisma, processId, auth);

  const process = await prisma.internalProcess.findUnique({
    where: { id: processId },
    include: {
      type: true,
      history: { orderBy: { createdAt: 'desc' } },
      dispatches: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!process) throw new Error('Processo nao encontrado');

  const templateHtml = await loadTemplate(templateName);

  const variables = {
    processNumber: process.number,
    processSubject: process.subject,
    processDescription: process.description || '',
    processStatus: process.status,
    processPriority: process.priority,
    processType: process.type.name,
    processTypePrefix: process.type.prefix,
    processSigilo: process.sigilo,
    processCreatedAt: formatDate(process.createdAt),
    processCreatedAtFull: formatDateTime(process.createdAt),
    processDueAt: process.dueAt ? formatDate(process.dueAt) : '-',
    processConcludedAt: process.concludedAt ? formatDate(process.concludedAt) : null,
    originOrganizationalUnitName: process.originOrganizationalUnitName,
    currentOrganizationalUnitName: process.currentOrganizationalUnitName,
    originDepartmentId: process.originDepartmentId || '',
    currentDepartmentId: process.currentDepartmentId || '',
    createdByName: process.createdByName,
    currentUserName: process.currentUserName || 'Nao atribuido',
    history: process.history.map((item) => ({
      date: formatDateTime(item.createdAt),
      action: item.action,
      description: item.description,
      note: item.note || '',
      userName: item.userName,
      fromOrganizationalUnitName: item.fromOrganizationalUnitName || '',
      toOrganizationalUnitName: item.toOrganizationalUnitName || '',
      fromDepartmentId: item.fromDepartmentId || '',
      toDepartmentId: item.toDepartmentId || '',
    })),
    hasHistory: process.history.length > 0,
    dispatches: process.dispatches.map((dispatch) => ({
      date: formatDateTime(dispatch.createdAt),
      action: dispatch.action,
      fromOrganizationalUnitName: dispatch.fromOrganizationalUnitName,
      toOrganizationalUnitName: dispatch.toOrganizationalUnitName,
      fromUserName: dispatch.fromUserName,
      note: dispatch.note || '',
      fromDepartmentId: dispatch.fromDepartmentId || '',
      toDepartmentId: dispatch.toDepartmentId || '',
    })),
    hasDispatches: process.dispatches.length > 0,
    tags: process.tags,
    hasTags: process.tags.length > 0,
    generatedAt: formatDateTime(new Date()),
    generatedAtDate: formatDate(new Date()),
    generatedByName,
    ...additionalData,
  };

  const compiled = Handlebars.compile(templateHtml);
  const html = compiled(variables);

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.6; color: #333; }
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
        .font-bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        table td, table th { padding: 8px; text-align: left; }
        table th { font-weight: bold; background-color: #f5f5f5; }
        table tr { border-bottom: 1px solid #e0e0e0; }
        @page { margin: 0; }
        .page-content { padding: 40px; }
      </style>
    </head>
    <body>
      <div class="page-content">
        ${html}
      </div>
    </body>
    </html>
  `;

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    const timestamp = Date.now();
    const fileName = `${process.number}_${templateName}_${timestamp}.pdf`;
    const uploadsDir = path.join(config.uploadDir, 'flow', processId);
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, fileName);

    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });

    const stats = await fs.stat(filePath);
    const documentHash = await generateDocumentHash(filePath);

    const document = await prisma.processDocument.create({
      data: {
        processId,
        documentType: templateName,
        name: `${process.type.name} - ${process.number}`,
        fileName,
        filePath: `/uploads/flow/${processId}/${fileName}`,
        fileSize: stats.size,
        mimeType: 'application/pdf',
        isGenerated: true,
        templateUsed: templateName,
        generatedBy,
        documentHash,
      },
    });

    logger.info(`Documento gerado para processo ${process.number}`, { documentId: document.id });
    return document;
  } finally {
    await browser.close();
  }
}

export async function listProcessDocuments(processId: string, auth: FlowAuthContext) {
  await assertProcessAccess(prisma, processId, auth);
  return prisma.processDocument.findMany({
    where: { processId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createDocumentRecord(
  data: {
    processId: string;
    documentType: string;
    name: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    generatedBy: string;
  },
  auth: FlowAuthContext,
) {
  await assertProcessAccess(prisma, data.processId, auth);

  return prisma.processDocument.create({
    data: {
      ...data,
      isGenerated: false,
    },
  });
}
