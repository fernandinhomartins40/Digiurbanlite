// ============================================================================
// ADMIN-REPORTS.TS - ROTAS DE RELATÓRIOS ADMINISTRATIVOS
// ============================================================================

import { Router, Response, Request } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import type { AuthenticatedRequest } from '../types';
import * as XLSX from 'xlsx';

// ====================== TIPOS DE RESPOSTA ======================

interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
  [key: string]: unknown;
}

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
}

// ====================== HELPER: HTML ESCAPE ======================

function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ====================== HELPER: CONSTRUIR WHERE BASEADO EM FILTROS ======================

function buildProtocolWhere(
  filters: Record<string, unknown>,
  config: Record<string, unknown>
): Prisma.ProtocolSimplifiedWhereInput {
  const where: Prisma.ProtocolSimplifiedWhereInput = {};

  // Filtros do config do relatório (defaults definidos na criação)
  const configFilters = (config?.defaultFilters as Record<string, unknown>) || {};

  // Merge: filtros de execução sobrescrevem o config
  const merged = { ...configFilters, ...filters };

  if (merged.status) {
    const statuses = Array.isArray(merged.status) ? merged.status : [merged.status];
    where.status = { in: statuses as any[] };
  }

  if (merged.departmentId) {
    where.departmentId = merged.departmentId as string;
  }

  if (merged.serviceId) {
    where.serviceId = merged.serviceId as string;
  }

  if (merged.startDate || merged.endDate) {
    where.createdAt = {} as any;
    if (merged.startDate) {
      (where.createdAt as any).gte = new Date(merged.startDate as string);
    }
    if (merged.endDate) {
      (where.createdAt as any).lte = new Date(merged.endDate as string);
    }
  }

  if (merged.priority !== undefined) {
    where.priority = merged.priority as number;
  }

  return where;
}

// ====================== SCHEMAS DE VALIDAÇÃO ======================

const createReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['OPERATIONAL', 'MANAGERIAL', 'EXECUTIVE', 'CUSTOM']),
  category: z.string(),
  config: z.record(z.string(), z.unknown()),
  template: z.string().optional(),
  schedule: z.record(z.string(), z.unknown()).optional(),
  accessLevel: z.number().int().min(0),
  departments: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false)
});

const executeReportSchema = z.object({
  parameters: z.record(z.string(), z.unknown()).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).default('JSON')
});

const updateReportSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['OPERATIONAL', 'MANAGERIAL', 'EXECUTIVE', 'CUSTOM']).optional(),
  category: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  template: z.string().optional(),
  schedule: z.record(z.string(), z.unknown()).optional(),
  accessLevel: z.number().int().min(0).optional(),
  departments: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional()
});

// ====================== ROUTER ======================

const router = Router();

// Aplicar middlewares em todas as rotas
router.use(adminAuthMiddleware);

// ====================== ROTAS DE RELATÓRIOS ======================

// GET /api/admin/relatorios - Listar todos os relatórios
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, category, isActive } = req.query;

    const where: Prisma.ReportWhereInput = {};

    if (type && typeof type === 'string') {
      where.type = type as Prisma.EnumReportTypeFilter;
    }

    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        _count: {
          select: { executions: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: reports
    } as SuccessResponse<typeof reports>);

  } catch (error) {
    console.error('Erro ao listar relatórios:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao listar relatórios'
    } as ErrorResponse);
  }
});

// GET /api/admin/relatorios/:id - Buscar relatório específico
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: { id },
      include: {
        executions: {
          take: 10,
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado'
      } as ErrorResponse);
      return;
    }

    res.json({
      success: true,
      data: report
    } as SuccessResponse<typeof report>);

  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao buscar relatório'
    } as ErrorResponse);
  }
});

// POST /api/admin/relatorios - Criar novo relatório
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { user } = authReq;

    const validatedData = createReportSchema.parse(req.body);

    const report = await prisma.report.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        category: validatedData.category,
        config: validatedData.config as Prisma.InputJsonValue,
        template: validatedData.template,
        schedule: validatedData.schedule as Prisma.InputJsonValue | undefined,
        accessLevel: validatedData.accessLevel,
        departments: validatedData.departments || [],
        isPublic: validatedData.isPublic,
        createdBy: user.id
      }
    });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Relatório criado com sucesso'
    } as SuccessResponse<typeof report>);

  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Dados inválidos',
        details: error.issues
      } as ErrorResponse);
      return;
    }

    console.error('Erro ao criar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao criar relatório'
    } as ErrorResponse);
  }
});

// PUT /api/admin/relatorios/:id - Atualizar relatório
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const validatedData = updateReportSchema.parse(req.body);

    const report = await prisma.report.findFirst({
      where: { id }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado'
      } as ErrorResponse);
      return;
    }

    const updateData: Prisma.ReportUpdateInput = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.config !== undefined) updateData.config = validatedData.config as Prisma.InputJsonValue;
    if (validatedData.template !== undefined) updateData.template = validatedData.template;
    if (validatedData.schedule !== undefined) updateData.schedule = validatedData.schedule as Prisma.InputJsonValue;
    if (validatedData.accessLevel !== undefined) updateData.accessLevel = validatedData.accessLevel;
    if (validatedData.departments !== undefined) updateData.departments = validatedData.departments;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic;

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedReport,
      message: 'Relatório atualizado com sucesso'
    } as SuccessResponse<typeof updatedReport>);

  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Dados inválidos',
        details: error.issues
      } as ErrorResponse);
      return;
    }

    console.error('Erro ao atualizar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao atualizar relatório'
    } as ErrorResponse);
  }
});

// DELETE /api/admin/relatorios/:id - Deletar relatório
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: { id }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado'
      } as ErrorResponse);
      return;
    }

    await prisma.report.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Relatório deletado com sucesso'
    } as SuccessResponse<undefined>);

  } catch (error) {
    console.error('Erro ao deletar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao deletar relatório'
    } as ErrorResponse);
  }
});

// POST /api/admin/relatorios/:id/execute - Executar relatório
router.post('/:id/execute', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { user } = authReq;
    const { id } = req.params;

    const validatedData = executeReportSchema.parse(req.body);

    const report = await prisma.report.findFirst({
      where: { id, isActive: true }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado ou inativo'
      } as ErrorResponse);
      return;
    }

    // Criar execução do relatório
    const execution = await prisma.reportExecution.create({
      data: {
        reportId: id,
        parameters: (validatedData.parameters || {}) as Prisma.InputJsonValue,
        filters: (validatedData.filters || {}) as Prisma.InputJsonValue,
        format: validatedData.format,
        executedBy: user.id,
        status: 'GENERATING'
      }
    });

    // Atualizar lastRun do relatório
    await prisma.report.update({
      where: { id },
      data: { lastRun: new Date() }
    });

    try {
      const reportConfig = (report.config as Record<string, unknown>) || {};
      const executionFilters = (validatedData.filters || {}) as Record<string, unknown>;

      // Determinar limit pelo config (padrão 1000)
      const limit = Math.min((reportConfig.limit as number) || 1000, 5000);

      // Construir where com filtros reais
      const protocolWhere = buildProtocolWhere(executionFilters, reportConfig);

      // Determinar quais includes usar baseado no config
      const configFields = (reportConfig.fields as string[]) || [];
      const includeCitizen = configFields.length === 0 || configFields.includes('citizen');
      const includeService = configFields.length === 0 || configFields.includes('service');
      const includeDepartment = configFields.length === 0 || configFields.includes('department');
      const includeStages = configFields.includes('stages');
      const includePendings = configFields.includes('pendings');

      // Buscar protocolos com filtros aplicados
      const protocols = await prisma.protocolSimplified.findMany({
        where: protocolWhere,
        include: {
          citizen: includeCitizen,
          service: includeService,
          department: includeDepartment,
          stages: includeStages,
          pendings: includePendings
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      // ---- Gerar dados do relatório ----
      let reportData: any = {};

      reportData.totalProtocols = protocols.length;
      reportData.appliedFilters = { ...executionFilters };

      reportData.byStatus = protocols.reduce((acc: any, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});

      reportData.byDepartment = protocols.reduce((acc: any, p) => {
        const deptName = (p as any).department?.name || 'Sem departamento';
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {});

      reportData.byService = protocols.reduce((acc: any, p) => {
        const serviceName = (p as any).service?.name || 'Sem serviço';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {});

      reportData.byPriority = protocols.reduce((acc: any, p) => {
        const label = p.priority <= 1 ? 'Alta' : p.priority <= 2 ? 'Média' : 'Baixa';
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});

      // Estatísticas de tempo
      const completedProtocols = protocols.filter(p => p.concludedAt);
      reportData.completedCount = completedProtocols.length;
      if (completedProtocols.length > 0) {
        const avgTime = completedProtocols.reduce((sum, p) => {
          const days = Math.floor((new Date(p.concludedAt!).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / completedProtocols.length;
        reportData.avgCompletionDays = Math.round(avgTime);
      }

      // Protocolos vencidos (dueDate < agora e não concluídos)
      const now = new Date();
      reportData.overdueCount = protocols.filter(p => p.dueDate && new Date(p.dueDate) < now && !p.concludedAt).length;

      // Lista detalhada de protocolos (para CSV/EXCEL)
      reportData.protocolsList = protocols.map(p => ({
        numero: p.number,
        titulo: p.title,
        status: p.status,
        prioridade: p.priority <= 1 ? 'Alta' : p.priority <= 2 ? 'Média' : 'Baixa',
        departamento: (p as any).department?.name || 'N/A',
        servico: (p as any).service?.name || 'N/A',
        cidadao: (p as any).citizen ? `${(p as any).citizen.name || ''} ${(p as any).citizen.cpf || ''}`.trim() : 'N/A',
        criado: p.createdAt.toLocaleString('pt-BR'),
        conclusao: p.concludedAt ? p.concludedAt.toLocaleString('pt-BR') : 'Pendente',
        vencimento: p.dueDate ? p.dueDate.toLocaleString('pt-BR') : 'Sem prazo'
      }));

      // ---- Gerar arquivo baseado no formato ----
      const safeName = report.name.replace(/[^a-zA-Z0-9_\-]/g, '_');

      if (validatedData.format === 'PDF') {
        const { chromium } = require('playwright');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // Status labels traduzidos
        const statusLabels: Record<string, string> = {
          VINCULADO: 'Vinculado',
          PROGRESSO: 'Em Progresso',
          ATUALIZACAO: 'Atualização',
          CONCLUIDO: 'Concluído',
          PENDENCIA: 'Pendência',
          CANCELADO: 'Cancelado'
        };

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; color: #1f2937; }
              h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
              h2 { color: #1e40af; margin-top: 30px; }
              .header { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
              .kpi-box { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
              .kpi-value { font-size: 28px; font-weight: bold; color: #2563eb; }
              .kpi-label { font-size: 11px; color: #6b7280; margin-top: 8px; }
              .kpi-box.alert .kpi-value { color: #dc2626; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #2563eb; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
              td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
              tr:nth-child(even) { background: #f9fafb; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
              .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
              .badge-VINCULADO { background: #dbeafe; color: #1e40af; }
              .badge-PROGRESSO { background: #fef3c7; color: #92400e; }
              .badge-ATUALIZACAO { background: #e0e7ff; color: #4338ca; }
              .badge-CONCLUIDO { background: #d1fae5; color: #065f46; }
              .badge-PENDENCIA { background: #fee2e2; color: #991b1b; }
              .badge-CANCELADO { background: #f3f4f6; color: #6b7280; }
            </style>
          </head>
          <body>
            <h1>${escapeHtml(report.name)}</h1>

            <div class="header">
              <p><strong>Tipo:</strong> ${escapeHtml(report.type)}</p>
              <p><strong>Categoria:</strong> ${escapeHtml(report.category)}</p>
              <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              ${report.description ? `<p><strong>Descrição:</strong> ${escapeHtml(report.description)}</p>` : ''}
              ${Object.keys(reportData.appliedFilters).length > 0 ? `<p><strong>Filtros aplicados:</strong> ${escapeHtml(JSON.stringify(reportData.appliedFilters))}</p>` : ''}
            </div>

            <h2>Indicadores Principais</h2>
            <div class="kpis">
              <div class="kpi-box">
                <div class="kpi-value">${reportData.totalProtocols}</div>
                <div class="kpi-label">Total de Protocolos</div>
              </div>
              <div class="kpi-box">
                <div class="kpi-value">${reportData.completedCount}</div>
                <div class="kpi-label">Concluídos</div>
              </div>
              <div class="kpi-box">
                <div class="kpi-value">${reportData.avgCompletionDays !== undefined ? reportData.avgCompletionDays + ' dias' : 'N/A'}</div>
                <div class="kpi-label">Média Conclusão</div>
              </div>
              <div class="kpi-box ${reportData.overdueCount > 0 ? 'alert' : ''}">
                <div class="kpi-value">${reportData.overdueCount}</div>
                <div class="kpi-label">Vencidos</div>
              </div>
            </div>

            <h2>Distribuição por Status</h2>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Quantidade</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(reportData.byStatus).map(([status, count]: [string, any]) => `
                  <tr>
                    <td><span class="badge badge-${status}">${escapeHtml(statusLabels[status] || status)}</span></td>
                    <td>${count}</td>
                    <td>${reportData.totalProtocols > 0 ? Math.round((count / reportData.totalProtocols) * 100) : 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h2>Distribuição por Departamento</h2>
            <table>
              <thead>
                <tr>
                  <th>Departamento</th>
                  <th>Quantidade</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(reportData.byDepartment).sort((a: any, b: any) => b[1] - a[1]).map(([dept, count]: [string, any]) => `
                  <tr>
                    <td>${escapeHtml(dept)}</td>
                    <td>${count}</td>
                    <td>${reportData.totalProtocols > 0 ? Math.round((count / reportData.totalProtocols) * 100) : 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h2>Top 10 Serviços Mais Solicitados</h2>
            <table>
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Quantidade</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(reportData.byService)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([service, count]: [string, any]) => `
                    <tr>
                      <td>${escapeHtml(service)}</td>
                      <td>${count}</td>
                      <td>${reportData.totalProtocols > 0 ? Math.round((count / reportData.totalProtocols) * 100) : 0}%</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>

            <h2>Distribuição por Prioridade</h2>
            <table>
              <thead>
                <tr>
                  <th>Prioridade</th>
                  <th>Quantidade</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(reportData.byPriority).sort((a: any, b: any) => b[1] - a[1]).map(([prio, count]: [string, any]) => `
                  <tr>
                    <td>${escapeHtml(prio)}</td>
                    <td>${count}</td>
                    <td>${reportData.totalProtocols > 0 ? Math.round((count / reportData.totalProtocols) * 100) : 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${reportData.protocolsList.length > 0 ? `
            <h2>Lista de Protocolos</h2>
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Título</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                  <th>Departamento</th>
                  <th>Serviço</th>
                  <th>Criado</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.protocolsList.slice(0, 100).map((p: any) => `
                  <tr>
                    <td>${escapeHtml(p.numero)}</td>
                    <td>${escapeHtml(p.titulo)}</td>
                    <td><span class="badge badge-${p.status.toUpperCase()}">${escapeHtml(statusLabels[p.status] || p.status)}</span></td>
                    <td>${escapeHtml(p.prioridade)}</td>
                    <td>${escapeHtml(p.departamento)}</td>
                    <td>${escapeHtml(p.servico)}</td>
                    <td>${escapeHtml(p.criado)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : ''}

            <div class="footer">
              <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
              <p>Sistema DigiUrban - Relatórios Administrativos</p>
            </div>
          </body>
          </html>
        `;

        await page.setContent(html);
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });

        await browser.close();

        await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            data: reportData as Prisma.InputJsonValue,
            completedAt: new Date()
          }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${safeName}_${Date.now()}.pdf"`);
        res.send(pdfBuffer);
        return;

      } else if (validatedData.format === 'EXCEL') {
        // Gerar Excel real com xlsx
        const wb = XLSX.utils.book_new();

        // Sheet 1: Indicadores
        const indicadoresData = [
          ['INDICADORES PRINCIPAIS'],
          ['Métrica', 'Valor'],
          ['Total de Protocolos', reportData.totalProtocols],
          ['Concluídos', reportData.completedCount],
          ['Média de Dias para Conclusão', reportData.avgCompletionDays !== undefined ? reportData.avgCompletionDays : 'N/A'],
          ['Protocolos Vencidos', reportData.overdueCount],
          [],
          ['DISTRIBUIÇÃO POR STATUS'],
          ['Status', 'Quantidade', 'Percentual'],
          ...Object.entries(reportData.byStatus).map(([status, count]: [string, any]) => [
            status,
            count,
            reportData.totalProtocols > 0 ? `${Math.round((count / reportData.totalProtocols) * 100)}%` : '0%'
          ]),
          [],
          ['DISTRIBUIÇÃO POR DEPARTAMENTO'],
          ['Departamento', 'Quantidade', 'Percentual'],
          ...Object.entries(reportData.byDepartment).sort((a: any, b: any) => b[1] - a[1]).map(([dept, count]: [string, any]) => [
            dept,
            count,
            reportData.totalProtocols > 0 ? `${Math.round((count / reportData.totalProtocols) * 100)}%` : '0%'
          ]),
          [],
          ['TOP 10 SERVIÇOS'],
          ['Serviço', 'Quantidade', 'Percentual'],
          ...Object.entries(reportData.byService).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10).map(([svc, count]: [string, any]) => [
            svc,
            count,
            reportData.totalProtocols > 0 ? `${Math.round((count / reportData.totalProtocols) * 100)}%` : '0%'
          ])
        ];
        const wsIndicadores = XLSX.utils.aoa_to_sheet(indicadoresData);
        wsIndicadores['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, wsIndicadores, 'Indicadores');

        // Sheet 2: Lista de Protocolos
        if (reportData.protocolsList.length > 0) {
          const headers = ['Número', 'Título', 'Status', 'Prioridade', 'Departamento', 'Serviço', 'Cidadão', 'Criado', 'Conclusão', 'Vencimento'];
          const rows = reportData.protocolsList.map((p: any) => [
            p.numero, p.titulo, p.status, p.prioridade, p.departamento, p.servico, p.cidadao, p.criado, p.conclusao, p.vencimento
          ]);
          const wsProtocolos = XLSX.utils.aoa_to_sheet([headers, ...rows]);
          wsProtocolos['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
          XLSX.utils.book_append_sheet(wb, wsProtocolos, 'Protocolos');
        }

        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            data: reportData as Prisma.InputJsonValue,
            completedAt: new Date(),
            fileSize: excelBuffer.length
          }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${safeName}_${Date.now()}.xlsx"`);
        res.send(excelBuffer);
        return;

      } else if (validatedData.format === 'CSV') {
        const statusLabels: Record<string, string> = {
          VINCULADO: 'Vinculado', PROGRESSO: 'Em Progresso', ATUALIZACAO: 'Atualização',
          CONCLUIDO: 'Concluído', PENDENCIA: 'Pendência', CANCELADO: 'Cancelado'
        };

        const rows: string[][] = [
          [report.name],
          ['Gerado em', new Date().toLocaleString('pt-BR')],
          [],
          ['INDICADORES PRINCIPAIS'],
          ['Métrica', 'Valor'],
          ['Total de Protocolos', reportData.totalProtocols.toString()],
          ['Concluídos', reportData.completedCount.toString()],
          ['Média de Dias para Conclusão', (reportData.avgCompletionDays !== undefined ? reportData.avgCompletionDays : 'N/A').toString()],
          ['Protocolos Vencidos', reportData.overdueCount.toString()],
          [],
          ['DISTRIBUIÇÃO POR STATUS'],
          ['Status', 'Quantidade', 'Percentual'],
          ...Object.entries(reportData.byStatus).map(([status, count]: [string, any]) => [
            statusLabels[status] || status,
            count.toString(),
            reportData.totalProtocols > 0 ? `${Math.round((count / reportData.totalProtocols) * 100)}%` : '0%'
          ]),
          [],
          ['DISTRIBUIÇÃO POR DEPARTAMENTO'],
          ['Departamento', 'Quantidade', 'Percentual'],
          ...Object.entries(reportData.byDepartment).sort((a: any, b: any) => b[1] - a[1]).map(([dept, count]: [string, any]) => [
            dept,
            count.toString(),
            reportData.totalProtocols > 0 ? `${Math.round((count / reportData.totalProtocols) * 100)}%` : '0%'
          ]),
          [],
          ['LISTA DE PROTOCOLOS'],
          ['Número', 'Título', 'Status', 'Prioridade', 'Departamento', 'Serviço', 'Cidadão', 'Criado', 'Conclusão', 'Vencimento'],
          ...reportData.protocolsList.map((p: any) => [
            p.numero, p.titulo, statusLabels[p.status] || p.status, p.prioridade,
            p.departamento, p.servico, p.cidadao, p.criado, p.conclusao, p.vencimento
          ])
        ];

        // Escapar campos com ponto e vírgula ou aspas no CSV
        const csv = rows.map(row =>
          row.map(cell => {
            const s = String(cell);
            if (s.includes(';') || s.includes('"') || s.includes('\n')) {
              return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
          }).join(';')
        ).join('\n');

        await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            data: reportData as Prisma.InputJsonValue,
            completedAt: new Date()
          }
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${safeName}_${Date.now()}.csv"`);
        res.send('\ufeff' + csv);
        return;

      } else {
        // JSON
        await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            data: reportData as Prisma.InputJsonValue,
            completedAt: new Date()
          }
        });

        res.json({
          success: true,
          data: {
            execution: {
              id: execution.id,
              status: 'COMPLETED',
              format: 'JSON'
            },
            reportData: reportData
          },
          message: 'Relatório executado com sucesso'
        } as SuccessResponse<any>);
      }

    } catch (generateError) {
      console.error('Erro ao gerar relatório:', generateError);
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorMessage: generateError instanceof Error ? generateError.message : 'Erro desconhecido',
          data: {
            error: generateError instanceof Error ? generateError.message : 'Erro desconhecido'
          } as Prisma.InputJsonValue,
          completedAt: new Date()
        }
      });

      res.status(500).json({
        success: false,
        error: 'Report Generation Error',
        message: 'Erro ao gerar relatório'
      } as ErrorResponse);
      return;
    }

  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Dados inválidos',
        details: error.issues
      } as ErrorResponse);
      return;
    }

    console.error('Erro ao executar relatório:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao executar relatório'
    } as ErrorResponse);
  }
});

// GET /api/admin/relatorios/:id/executions - Listar execuções de um relatório
router.get('/:id/executions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findFirst({
      where: { id }
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Relatório não encontrado'
      } as ErrorResponse);
      return;
    }

    const executions = await prisma.reportExecution.findMany({
      where: { reportId: id },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: executions
    } as SuccessResponse<typeof executions>);

  } catch (error) {
    console.error('Erro ao listar execuções:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Erro ao listar execuções'
    } as ErrorResponse);
  }
});

export default router;
