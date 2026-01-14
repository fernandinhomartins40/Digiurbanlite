// ============================================================================
// ADMIN-REPORTS.TS - ROTAS DE RELATÓRIOS ADMINISTRATIVOS
// ============================================================================

import { Router, Response, Request } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import type { AuthenticatedRequest } from '../types';

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
      // Gerar dados do relatório baseado no tipo
      let reportData: any = {};

      // Buscar protocolos para análise
      const protocols = await prisma.protocolSimplified.findMany({
        include: {
          citizen: true,
          service: true,
          department: true,
          stages: true,
          documentFiles: true,
          pendings: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Limitar para performance
      });

      // Estatísticas gerais
      reportData.totalProtocols = protocols.length;
      reportData.byStatus = protocols.reduce((acc: any, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});

      reportData.byDepartment = protocols.reduce((acc: any, p) => {
        const deptName = p.department?.name || 'Sem departamento';
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {});

      reportData.byService = protocols.reduce((acc: any, p) => {
        const serviceName = p.service?.name || 'Sem serviço';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {});

      // Estatísticas de tempo
      const completedProtocols = protocols.filter(p => p.concludedAt);
      if (completedProtocols.length > 0) {
        const avgTime = completedProtocols.reduce((sum, p) => {
          const days = Math.floor((new Date(p.concludedAt!).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / completedProtocols.length;
        reportData.avgCompletionDays = Math.round(avgTime);
      }

      // Gerar arquivo baseado no formato
      if (validatedData.format === 'PDF') {
        const { chromium } = require('playwright');
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
              h2 { color: #1e40af; margin-top: 30px; }
              .header { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
              .kpi-box { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
              .kpi-value { font-size: 32px; font-weight: bold; color: #2563eb; }
              .kpi-label { font-size: 12px; color: #6b7280; margin-top: 8px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #2563eb; color: white; padding: 12px; text-align: left; }
              td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <h1>${report.name}</h1>

            <div class="header">
              <p><strong>Tipo:</strong> ${report.type}</p>
              <p><strong>Categoria:</strong> ${report.category}</p>
              <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
              ${report.description ? `<p><strong>Descrição:</strong> ${report.description}</p>` : ''}
            </div>

            <h2>Indicadores Principais</h2>
            <div class="kpis">
              <div class="kpi-box">
                <div class="kpi-value">${reportData.totalProtocols}</div>
                <div class="kpi-label">Total de Protocolos</div>
              </div>
              <div class="kpi-box">
                <div class="kpi-value">${reportData.avgCompletionDays || 'N/A'}</div>
                <div class="kpi-label">Média de Dias para Conclusão</div>
              </div>
              <div class="kpi-box">
                <div class="kpi-value">${Object.keys(reportData.byDepartment).length}</div>
                <div class="kpi-label">Departamentos Ativos</div>
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
                    <td>${status.replace(/_/g, ' ')}</td>
                    <td>${count}</td>
                    <td>${Math.round((count / reportData.totalProtocols) * 100)}%</td>
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
                    <td>${dept}</td>
                    <td>${count}</td>
                    <td>${Math.round((count / reportData.totalProtocols) * 100)}%</td>
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
                </tr>
              </thead>
              <tbody>
                ${Object.entries(reportData.byService)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([service, count]: [string, any]) => `
                    <tr>
                      <td>${service}</td>
                      <td>${count}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>

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

        // Salvar PDF temporariamente ou retornar direto
        const completedExecution = await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            data: reportData as Prisma.InputJsonValue,
            completedAt: new Date()
          }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${report.name.replace(/\s+/g, '_')}_${Date.now()}.pdf"`);
        return res.send(pdfBuffer);

      } else if (validatedData.format === 'JSON') {
        const completedExecution = await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            data: reportData as Prisma.InputJsonValue,
            completedAt: new Date()
          }
        });

        res.json({
          success: true,
          data: completedExecution,
          reportData: reportData,
          message: 'Relatório executado com sucesso'
        } as SuccessResponse<typeof completedExecution>);

      } else if (validatedData.format === 'CSV' || validatedData.format === 'EXCEL') {
        // Gerar CSV
        const csv = [
          [report.name],
          ['Gerado em', new Date().toLocaleString('pt-BR')],
          [],
          ['INDICADORES PRINCIPAIS'],
          ['Métrica', 'Valor'],
          ['Total de Protocolos', reportData.totalProtocols.toString()],
          ['Média de Dias para Conclusão', (reportData.avgCompletionDays || 'N/A').toString()],
          [],
          ['DISTRIBUIÇÃO POR STATUS'],
          ['Status', 'Quantidade', 'Percentual'],
          ...Object.entries(reportData.byStatus).map(([status, count]: [string, any]) => [
            status.replace(/_/g, ' '),
            count.toString(),
            `${Math.round((count / reportData.totalProtocols) * 100)}%`
          ]),
          [],
          ['DISTRIBUIÇÃO POR DEPARTAMENTO'],
          ['Departamento', 'Quantidade', 'Percentual'],
          ...Object.entries(reportData.byDepartment).map(([dept, count]: [string, any]) => [
            dept,
            count.toString(),
            `${Math.round((count / reportData.totalProtocols) * 100)}%`
          ])
        ].map(row => row.join(';')).join('\n');

        const completedExecution = await prisma.reportExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            data: reportData as Prisma.InputJsonValue,
            completedAt: new Date()
          }
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${report.name.replace(/\s+/g, '_')}_${Date.now()}.csv"`);
        return res.send('\ufeff' + csv);
      }

    } catch (generateError) {
      console.error('Erro ao gerar relatório:', generateError);
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
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
