import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Handlebars from 'handlebars';
import { SearchResponse } from './search.service';
import { StatisticsResult, formatStatisticsExplanation } from './statistics.service';
import { logger } from '../utils/logger';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads', 'reports');

// Registrar helpers Handlebars
Handlebars.registerHelper('formatCurrency', (value: number) => {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
});

Handlebars.registerHelper('formatDate', (value: string | Date) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('pt-BR');
});

Handlebars.registerHelper('formatDateTime', () => {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
});

Handlebars.registerHelper('truncate', (str: string, len: number) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
});

export interface ReportInput {
  query: string;
  searchResult: SearchResponse;
  format: 'pdf' | 'html';
  requestId?: string;
  includeTermoReferencia?: boolean;
  unit?: string;
  orgaoSolicitante?: string;
}

export interface ReportOutput {
  filePath: string;
  fileName: string;
  format: 'pdf' | 'html';
  auditId: string;
  generatedAt: Date;
}

export async function generatePriceReport(input: ReportInput): Promise<ReportOutput> {
  const {
    query,
    searchResult,
    format,
    requestId,
    includeTermoReferencia = false,
    unit,
    orgaoSolicitante,
  } = input;
  const auditId = requestId ?? crypto.randomBytes(8).toString('hex').toUpperCase();
  const generatedAt = new Date();
  const timestamp = generatedAt.getTime();

  // Garantir diretório
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const safeQuery = query.replace(/[^a-z0-9]/gi, '_').substring(0, 40);
  const fileName = `pesquisa_precos_${safeQuery}_${timestamp}.${format}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  // Carregar template HTML
  const templatePath = path.join(process.cwd(), 'templates', 'price-report.html');
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);

  // Preparar dados do template
  const stats = searchResult.statistics;
  const topItems = searchResult.items.slice(0, 20);

  // Gerar gráfico SVG de distribuição de preços
  const svgChart = stats ? generatePriceDistributionSvg(stats) : '';

  // Gerar Termo de Referência automático
  const termoReferencia = includeTermoReferencia && stats
    ? generateTermoReferencia({ query, stats, unit, orgaoSolicitante, auditId, generatedAt, searchResult })
    : null;

  const htmlContent = template({
    query,
    normalizedQuery: searchResult.normalizedQuery,
    generatedAt: generatedAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    auditId,
    periodFrom: searchResult.explanation.period.from,
    periodTo: searchResult.explanation.period.to,
    algorithmVersion: searchResult.explanation.algorithmVersion,
    totalResults: searchResult.total,
    validResults: stats?.count ?? 0,
    excludedResults: stats?.excludedCount ?? 0,
    filtersApplied: searchResult.explanation.filters,

    // Estatísticas
    hasSufficientData: stats !== null && stats.count >= 3,
    mean: stats?.mean,
    median: stats?.median,
    min: stats?.min,
    max: stats?.max,
    stdDev: stats?.stdDev,
    q1: stats?.q1,
    q3: stats?.q3,
    iqr: stats?.iqr,

    // Metodologia
    methodology: stats?.methodology ?? 'Dados insuficientes para análise estatística.',

    // Tabela de amostra (top 20)
    sampleItems: topItems.map((item) => ({
      description: item.description,
      unit: item.unit ?? '-',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      contractDate: item.contractDate ? new Date(item.contractDate).toLocaleDateString('pt-BR') : '-',
      uf: item.uf ?? '-',
      organization: item.organizationName ?? '-',
      source: item.source ?? '-',
      supplier: item.supplierName ?? '-',
    })),

    // Termo de Referência
    includeTermoReferencia,
    termoReferencia,

    // Gráfico SVG
    svgChart,

    // Agregações
    byUf: searchResult.aggregations.byUf.slice(0, 10),
    byUnit: searchResult.aggregations.byUnit.slice(0, 10),
  });

  if (format === 'html') {
    fs.writeFileSync(filePath, htmlContent, 'utf-8');
    logger.info('[Report] HTML report generated', { filePath, auditId });
  } else {
    // PDF via Playwright — mesma implementação do document-generator.service.ts
    await generatePdfFromHtml(htmlContent, filePath);
    logger.info('[Report] PDF report generated', { filePath, auditId });
  }

  return { filePath, fileName, format, auditId, generatedAt };
}

async function generatePdfFromHtml(html: string, outputPath: string): Promise<void> {
  const { chromium } = await import('playwright');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      displayHeaderFooter: false,
    });
  } finally {
    await browser.close();
  }
}

// Gera gráfico SVG simples de distribuição de preços
function generatePriceDistributionSvg(stats: StatisticsResult): string {
  const width = 500;
  const height = 120;
  const padding = 40;
  const innerWidth = width - 2 * padding;

  if (stats.count < 2) return '';

  const range = stats.max - stats.min;
  if (range === 0) return '';

  const toX = (v: number) => padding + ((v - stats.min) / range) * innerWidth;

  const q1X = toX(stats.q1);
  const q3X = toX(stats.q3);
  const medianX = toX(stats.median);
  const meanX = toX(stats.mean);
  const lowerX = toX(Math.max(stats.lowerFence, stats.min));
  const upperX = toX(Math.min(stats.upperFence, stats.max));

  const midY = height / 2;
  const boxY = midY - 15;
  const boxH = 30;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Linha de base -->
  <line x1="${lowerX}" y1="${midY}" x2="${upperX}" y2="${midY}" stroke="#94a3b8" stroke-width="2"/>
  <!-- Whiskers -->
  <line x1="${lowerX}" y1="${midY - 10}" x2="${lowerX}" y2="${midY + 10}" stroke="#94a3b8" stroke-width="2"/>
  <line x1="${upperX}" y1="${midY - 10}" x2="${upperX}" y2="${midY + 10}" stroke="#94a3b8" stroke-width="2"/>
  <!-- Box IQR -->
  <rect x="${q1X}" y="${boxY}" width="${q3X - q1X}" height="${boxH}" fill="#bfdbfe" stroke="#3b82f6" stroke-width="2" rx="3"/>
  <!-- Mediana -->
  <line x1="${medianX}" y1="${boxY}" x2="${medianX}" y2="${boxY + boxH}" stroke="#1d4ed8" stroke-width="3"/>
  <!-- Média -->
  <circle cx="${meanX}" cy="${midY}" r="5" fill="#dc2626"/>
  <!-- Labels -->
  <text x="${q1X}" y="${boxY - 5}" font-size="9" fill="#3b82f6" text-anchor="middle">Q1</text>
  <text x="${q3X}" y="${boxY - 5}" font-size="9" fill="#3b82f6" text-anchor="middle">Q3</text>
  <text x="${medianX}" y="${boxY + boxH + 14}" font-size="9" fill="#1d4ed8" text-anchor="middle">Mediana</text>
  <text x="${meanX}" y="${midY - 12}" font-size="9" fill="#dc2626" text-anchor="middle">Média</text>
  <!-- Valor mín/máx -->
  <text x="${padding}" y="${height - 5}" font-size="8" fill="#64748b" text-anchor="middle">R$ ${stats.min.toFixed(0)}</text>
  <text x="${width - padding}" y="${height - 5}" font-size="8" fill="#64748b" text-anchor="middle">R$ ${stats.max.toFixed(0)}</text>
</svg>`;
}

// Gera texto do Termo de Referência automático
function generateTermoReferencia(input: {
  query: string;
  stats: StatisticsResult;
  unit?: string;
  orgaoSolicitante?: string;
  auditId: string;
  generatedAt: Date;
  searchResult: SearchResponse;
}): string {
  const { query, stats, unit, orgaoSolicitante, auditId, generatedAt, searchResult } = input;

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR');
  const periodFrom = searchResult.explanation.period.from;
  const periodTo = searchResult.explanation.period.to;
  const unitStr = unit ?? 'unidade';
  const orgao = orgaoSolicitante ?? '[NOME DO ÓRGÃO]';

  const fontes = searchResult.aggregations.bySource.map((s) => s.key).join(', ') || 'PNCP';

  return `
TERMO DE REFERÊNCIA — PESQUISA DE PREÇOS
ID de Auditoria: ${auditId}
Data da Pesquisa: ${fmtDate(generatedAt)}
Órgão Solicitante: ${orgao}

1. OBJETO
Aquisição de: ${query}

2. FUNDAMENTAÇÃO LEGAL
Esta pesquisa de preços foi realizada em conformidade com:
• Lei nº 14.133/2021 — Lei de Licitações e Contratos Administrativos (art. 23)
• Instrução Normativa SEGES/ME nº 65/2021 — Pesquisa de Preços para Aquisições

3. METODOLOGIA
Foram consultadas as seguintes bases de dados públicas: ${fontes}.
O período de referência abrange ${periodFrom} a ${periodTo}.
Total de registros localizados: ${searchResult.total}.
Após aplicação de metodologia de remoção de outliers (${searchResult.explanation.methodology}),
foram considerados ${stats.count} registros válidos para cálculo estatístico.

4. RESULTADO DA PESQUISA

| Estatística          | Valor                |
|---------------------|----------------------|
| Preço médio         | ${fmt(stats.mean)}   |
| Preço mediano       | ${fmt(stats.median)} |
| Menor preço         | ${fmt(stats.min)}    |
| Maior preço         | ${fmt(stats.max)}    |
| Desvio padrão       | ${fmt(stats.stdDev)} |
| Q1 (25%)            | ${fmt(stats.q1)}     |
| Q3 (75%)            | ${fmt(stats.q3)}     |
| Registros válidos   | ${stats.count}       |
| Outliers excluídos  | ${stats.excludedCount} |

5. PREÇO DE REFERÊNCIA
Conforme o art. 5º da IN SEGES/ME nº 65/2021, o preço de referência para este processo
é o valor da MEDIANA apurada, igual a ${fmt(stats.median)} por ${unitStr}.

O valor total estimado para a contratação deverá ser calculado com base neste preço de
referência, multiplicado pela quantidade a ser adquirida.

6. DECLARAÇÃO
Declaro que os preços obtidos são compatíveis com os preços praticados no mercado público
conforme bases consultadas: ${fontes}.

________________________________
Responsável pela pesquisa de preços
Data: ${fmtDate(generatedAt)}
  `.trim();
}
