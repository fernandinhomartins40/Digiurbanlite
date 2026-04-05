// ============================================================
// ADMIN DYNAMIC SERVICES API - Gerenciamento de Serviços
// ============================================================
// API para admins editarem serviços com invalidação de cache e WebSocket

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { invalidateServiceCache } from './dynamic-services';
import { emitServiceUpdate } from '../socket';
import { generateSpecializedWorkflow } from '../services/workflow-template.service';
import {
  buildNoDataWorkflowTemplate,
  type NoDataServiceSubtype,
  resolveServiceSubtype,
  resolveServiceType,
  shouldAutoCreateWorkflow,
} from '../services/service-creation-policy.service';

const router = Router();
const prisma = new PrismaClient();

// ============================================================
// HELPER: Get department slug from name
// ============================================================
function departmentNameToSlug(name: string): string {
  const mapping: Record<string, string> = {
    'Agricultura': 'agricultura',
    'Saúde': 'saude',
    'Educação': 'educacao',
    'Assistência Social': 'assistencia-social',
    'Cultura': 'cultura',
    'Esportes': 'esportes',
    'Habitação': 'habitacao',
    'Meio Ambiente': 'meio-ambiente',
    'Obras Públicas': 'obras-publicas',
    'Planejamento Urbano': 'planejamento-urbano',
    'Segurança Pública': 'seguranca-publica',
    'Serviços Públicos': 'servicos-publicos',
    'Turismo': 'turismo'
  };
  return mapping[name] || name.toLowerCase().replace(/\s+/g, '-');
}

// ============================================================
// PUT /api/admin/services/:id
// Atualiza service (formSchema, flags, etc)
// Invalida cache e notifica usuários via WebSocket
// ============================================================
router.put(
  '/services/:id',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      // Validação básica
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID do serviço é obrigatório'
        });
      }

      // 1️⃣ Busca service atual para pegar department/module
      const currentService = await prisma.serviceSimplified.findUnique({
        where: { id },
        include: {
          department: {
            select: { id: true, name: true, code: true }
          }
        }
      });

      if (!currentService) {
        return res.status(404).json({
          success: false,
          error: 'Serviço não encontrado'
        });
      }

      // 2️⃣ Atualiza no PostgreSQL
      const updatedService = await prisma.serviceSimplified.update({
        where: { id },
        data: updateData,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      // 3️⃣ Invalida cache Redis
      const departmentSlug = departmentNameToSlug(updatedService.department.name);
      await invalidateServiceCache(
        departmentSlug,
        updatedService.moduleType || ''
      );

      // 4️⃣ Notifica usuários online via WebSocket
      emitServiceUpdate(
        departmentSlug,
        updatedService.moduleType || '',
        updatedService
      );

      console.log(`✅ Service atualizado: ${departmentSlug}/${updatedService.moduleType}`);

      return res.json({
        success: true,
        service: updatedService,
        message: 'Serviço atualizado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar service:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

// ============================================================
// PATCH /api/admin/services/:id/schema
// Atualiza apenas o formSchema (operação mais comum)
// ============================================================
router.patch(
  '/services/:id/schema',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { formSchema } = req.body;

    try {
      if (!formSchema) {
        return res.status(400).json({
          success: false,
          error: 'formSchema é obrigatório'
        });
      }

      // Validação básica do schema
      if (typeof formSchema !== 'object' || !formSchema.properties) {
        return res.status(400).json({
          success: false,
          error: 'formSchema inválido - deve conter propriedade "properties"'
        });
      }

      // Busca service atual
      const currentService = await prisma.serviceSimplified.findUnique({
        where: { id },
        include: {
          department: { select: { id: true, name: true, code: true } }
        }
      });

      if (!currentService) {
        return res.status(404).json({
          success: false,
          error: 'Serviço não encontrado'
        });
      }

      // Atualiza apenas o formSchema
      const updatedService = await prisma.serviceSimplified.update({
        where: { id },
        data: { formSchema },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      // Invalida cache
      const departmentSlug = departmentNameToSlug(updatedService.department.name);
      await invalidateServiceCache(
        departmentSlug,
        updatedService.moduleType || ''
      );

      // Notifica via WebSocket
      emitServiceUpdate(
        departmentSlug,
        updatedService.moduleType || '',
        updatedService
      );

      console.log(`✅ FormSchema atualizado: ${departmentSlug}/${updatedService.moduleType}`);

      return res.json({
        success: true,
        service: updatedService,
        message: 'Schema atualizado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar formSchema:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

// ============================================================
// GET /api/admin/services/:id
// Busca service completo (para edição)
// ============================================================
router.get(
  '/services/:id',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const service = await prisma.serviceSimplified.findUnique({
        where: { id },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Serviço não encontrado'
        });
      }

      return res.json({
        success: true,
        service
      });

    } catch (error) {
      console.error('❌ Erro ao buscar service:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

// ============================================================
// POST /api/admin/services
// Cria novo serviço
// ============================================================
router.post(
  '/services',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    const serviceData = req.body as Record<string, any>;

    try {
      const resolvedServiceType = resolveServiceType({
        serviceType: serviceData.serviceType,
        formSchema: serviceData.formSchema,
        moduleType: serviceData.moduleType,
      });
      const resolvedServiceSubtype = resolveServiceSubtype({
        serviceType: resolvedServiceType,
        serviceSubtype: serviceData.serviceSubtype,
        name: serviceData.name,
        description: serviceData.description,
        category: serviceData.category,
        requiresDocuments: serviceData.requiresDocuments,
        requiredDocuments: serviceData.requiredDocuments,
        formSchema: serviceData.formSchema,
        moduleType: serviceData.moduleType,
      });

      if (!serviceData.name || !serviceData.departmentId) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: name e departmentId'
        });
      }

      if (resolvedServiceType === 'COM_DADOS' && (!serviceData.moduleType || !serviceData.formSchema)) {
        return res.status(400).json({
          success: false,
          error: 'Serviços COM_DADOS exigem moduleType e formSchema'
        });
      }

      const existing = serviceData.moduleType ? await prisma.serviceSimplified.findFirst({
        where: {
          departmentId: serviceData.departmentId,
          moduleType: serviceData.moduleType
        }
      }) : null;

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Já existe um serviço com este moduleType neste departamento'
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const department = await tx.department.findUnique({
          where: { id: serviceData.departmentId },
          select: { id: true, name: true, code: true }
        });

        if (!department) {
          throw new Error('Departamento não encontrado');
        }

        let service = await tx.serviceSimplified.create({
          data: {
            name: serviceData.name,
            description: serviceData.description || null,
            category: serviceData.category || null,
            departmentId: serviceData.departmentId,
            serviceType: resolvedServiceType,
            serviceSubtype: resolvedServiceSubtype,
            requiresDocuments: Boolean(serviceData.requiresDocuments),
            requiredDocuments: serviceData.requiredDocuments || null,
            estimatedDays: serviceData.estimatedDays || null,
            priority: serviceData.priority || 1,
            icon: serviceData.icon || null,
            color: serviceData.color || null,
            moduleType: resolvedServiceType === 'COM_DADOS' ? serviceData.moduleType : null,
            formSchema: resolvedServiceType === 'COM_DADOS' ? serviceData.formSchema || null : null,
            allowMultipleActiveProtocols: serviceData.allowMultipleActiveProtocols ?? true,
            uniquenessScope:
              serviceData.allowMultipleActiveProtocols === false ? serviceData.uniquenessScope || null : null,
            uniquenessRules:
              serviceData.allowMultipleActiveProtocols === false && serviceData.uniquenessRules
                ? serviceData.uniquenessRules
                : null,
            isActive: true
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        });

        let workflow = null;

        if (resolvedServiceType === 'COM_DADOS') {
          const requiredDocs = Array.isArray(serviceData.requiredDocuments)
            ? serviceData.requiredDocuments.map((doc: any) => ({
                type: typeof doc === 'string' ? doc : doc.type,
                name: typeof doc === 'string' ? doc : (doc.name || doc.type)
              }))
            : [];

          const formFields: Array<{ id: string; label: string; required: boolean }> = [];
          if (serviceData.formSchema?.properties) {
            const required = serviceData.formSchema.required || [];
            Object.keys(serviceData.formSchema.properties).forEach((fieldId) => {
              const field = serviceData.formSchema.properties[fieldId];
              formFields.push({
                id: fieldId,
                label: field.title || fieldId,
                required: required.includes(fieldId)
              });
            });
          } else if (Array.isArray(serviceData.formSchema?.fields)) {
            serviceData.formSchema.fields.forEach((field: any) => {
              formFields.push({
                id: field.id || field.name,
                label: field.label || field.name,
                required: Boolean(field.required)
              });
            });
          }

          const workflowTemplate = generateSpecializedWorkflow({
            moduleType: serviceData.moduleType,
            serviceName: serviceData.name,
            serviceDescription: serviceData.description,
            estimatedDays: serviceData.estimatedDays,
            departmentCode: department.code || undefined,
            departmentName: department.name,
            priority: serviceData.priority || 1,
            requiredDocuments: requiredDocs,
            formFields,
          });

          workflow = await tx.moduleWorkflow.create({
            data: {
              moduleType: workflowTemplate.moduleType,
              name: workflowTemplate.name,
              description: workflowTemplate.description,
              defaultSLA: workflowTemplate.defaultSLA,
              stages: workflowTemplate.stages as any,
              rules: workflowTemplate.rules as any,
            }
          });
        } else if (shouldAutoCreateWorkflow(resolvedServiceType, resolvedServiceSubtype)) {
          const workflowTemplate = buildNoDataWorkflowTemplate({
            serviceName: serviceData.name,
            serviceDescription: serviceData.description,
            estimatedDays: serviceData.estimatedDays,
            subtype: resolvedServiceSubtype as NoDataServiceSubtype,
          });

          if (workflowTemplate) {
            const uniqueModuleType = `SEM_DADOS_${resolvedServiceSubtype}_${service.id}`;
            workflow = await tx.moduleWorkflow.create({
              data: {
                moduleType: uniqueModuleType,
                name: workflowTemplate.name,
                description: workflowTemplate.description,
                defaultSLA: workflowTemplate.defaultSLA,
                stages: workflowTemplate.stages as any,
                rules: workflowTemplate.rules as any,
              }
            });

            service = await tx.serviceSimplified.update({
              where: { id: service.id },
              data: { moduleType: uniqueModuleType },
              include: {
                department: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            });
          }
        }

        return { service, workflow };
      });

      const departmentSlug = departmentNameToSlug(result.service.department.name);
      console.log(`✅ Novo service criado: ${departmentSlug}/${result.service.moduleType}`);

      return res.status(201).json({
        success: true,
        service: result.service,
        workflow: result.workflow,
        serviceType: result.service.serviceType,
        serviceSubtype: result.service.serviceSubtype,
        message: 'Serviço criado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao criar service:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

// ============================================================
// DELETE /api/admin/services/:id
// Desativa serviço (soft delete)
// ============================================================
router.delete(
  '/services/:id',
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const service = await prisma.serviceSimplified.findUnique({
        where: { id },
        include: {
          department: { select: { id: true, name: true, code: true } }
        }
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          error: 'Serviço não encontrado'
        });
      }

      // Soft delete (marca como inativo)
      await prisma.serviceSimplified.update({
        where: { id },
        data: { isActive: false }
      });

      // Invalida cache
      const departmentSlug = departmentNameToSlug(service.department.name);
      await invalidateServiceCache(
        departmentSlug,
        service.moduleType || ''
      );

      console.log(`✅ Service desativado: ${departmentSlug}/${service.moduleType}`);

      return res.json({
        success: true,
        message: 'Serviço desativado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao desativar service:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

export default router;
