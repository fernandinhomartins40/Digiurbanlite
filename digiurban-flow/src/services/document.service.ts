/**
 * Serviço de geração de documentos PDF via Playwright
 * MESMO PADRÃO do document-generator.service.ts do backend principal
 */
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { config } from '../config/config';

// ============================================================================
// INTERFACES
// ============================================================================

export interface GenerateFlowDocumentInput {
  processId: string;
  templateName: string;  // "despacho", "memorando", "oficio", "capa-processo"
  generatedBy: string;
  generatedByName: string;
  additionalData?: Record<string, unknown>;
}

// ============================================================================
// HELPERS HANDLEBARS (mesmo padrão do backend)
// ============================================================================

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return cpf;
}

// Registrar helpers Handlebars
Handlebars.registerHelper('formatDate', formatDate);
Handlebars.registerHelper('formatDateTime', formatDateTime);
Handlebars.registerHelper('formatCPF', formatCPF);
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper('exists', (value: unknown) => value !== null && value !== undefined && value !== '');
Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase() || '');

// ============================================================================
// CARREGAR TEMPLATE HTML
// ============================================================================

async function loadTemplate(templateName: string): Promise<string> {
  // Tentar carregar do diretório de templates
  const templatePaths = [
    path.join(process.cwd(), 'templates', `${templateName}.html`),
    path.join(__dirname, '..', '..', 'templates', `${templateName}.html`),
    path.join('/app', 'templates', `${templateName}.html`),
  ];

  for (const tplPath of templatePaths) {
    try {
      const content = await fs.readFile(tplPath, 'utf-8');
      logger.info(`Template carregado: ${tplPath}`);
      return content;
    } catch {
      // Tentar próximo path
    }
  }

  throw new Error(`Template não encontrado: ${templateName}.html`);
}

// ============================================================================
// CALCULAR HASH SHA-256
// ============================================================================

async function generateDocumentHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

// ============================================================================
// GERAR DOCUMENTO PDF — PLAYWRIGHT (MESMO PADRÃO DO BACKEND)
// ============================================================================

export async function generateFlowDocument(input: GenerateFlowDocumentInput) {
  const { processId, templateName, generatedBy, generatedByName, additionalData = {} } = input;

  logger.info(`Gerando documento: template=${templateName}, process=${processId}`);

  // 1. Buscar processo
  const process = await prisma.internalProcess.findUnique({
    where: { id: processId },
    include: {
      type: true,
      history: { orderBy: { createdAt: 'desc' } },
      dispatches: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!process) throw new Error('Processo não encontrado');

  // 2. Carregar template HTML
  const templateHtml = await loadTemplate(templateName);

  // 3. Preparar variáveis Handlebars
  const variables = {
    // Processo
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

    // Setores
    originSectorName: process.originSectorName,
    currentSectorName: process.currentSectorName,

    // Pessoas
    createdByName: process.createdByName,
    currentUserName: process.currentUserName || 'Não atribuído',

    // Histórico
    history: process.history.map((h) => ({
      date: formatDateTime(h.createdAt),
      action: h.action,
      description: h.description,
      note: h.note || '',
      userName: h.userName,
      fromSectorName: h.fromSectorName || '',
      toSectorName: h.toSectorName || '',
    })),
    hasHistory: process.history.length > 0,

    // Despachos
    dispatches: process.dispatches.map((d) => ({
      date: formatDateTime(d.createdAt),
      action: d.action,
      fromSectorName: d.fromSectorName,
      toSectorName: d.toSectorName,
      fromUserName: d.fromUserName,
      note: d.note || '',
    })),
    hasDispatches: process.dispatches.length > 0,

    // Tags
    tags: process.tags,
    hasTags: process.tags.length > 0,

    // Metadados de geração
    generatedAt: formatDateTime(new Date()),
    generatedAtDate: formatDate(new Date()),
    generatedByName,

    // Dados adicionais
    ...additionalData,
  };

  logger.info(`Variáveis preparadas: ${Object.keys(variables).length}`);

  // 4. Compilar template Handlebars
  const compiled = Handlebars.compile(templateHtml);
  const html = compiled(variables);

  // 5. Montar HTML completo
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #333;
        }
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

  // 6. Gerar PDF com Playwright
  const { chromium } = await import('playwright');

  logger.info(`Playwright browsers path: ${config.playwrightBrowsersPath || 'default'}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    // Definir nome e path do arquivo
    const timestamp = Date.now();
    const fileName = `${process.number}_${templateName}_${timestamp}.pdf`;
    const uploadsDir = path.join(config.uploadDir, 'flow', processId);
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, fileName);

    logger.info(`Gerando PDF: ${fileName}`);

    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });

    await browser.close();
    logger.info('PDF gerado com sucesso');

    // 7. Obter tamanho e hash
    const stats = await fs.stat(filePath);
    const documentHash = await generateDocumentHash(filePath);

    // 8. Salvar registro no banco
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

    logger.info(`Documento salvo: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
    return document;

  } catch (error) {
    await browser.close();
    throw error;
  }
}

// ============================================================================
// LISTAR DOCUMENTOS DE UM PROCESSO
// ============================================================================

export async function listProcessDocuments(processId: string) {
  return prisma.processDocument.findMany({
    where: { processId },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================================
// UPLOAD DE DOCUMENTO (anexo manual)
// ============================================================================

export async function createDocumentRecord(data: {
  processId: string;
  documentType: string;
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  generatedBy: string;
}) {
  return prisma.processDocument.create({
    data: {
      ...data,
      isGenerated: false,
    },
  });
}
