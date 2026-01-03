import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { asyncHandler } from '../utils/express-helpers';
import { transactionalEmailService } from '../lib/email/TransactionalEmailService';

const router = Router();

// Schema de validação para template
const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  htmlContent: z.string().min(1, 'Conteúdo HTML é obrigatório'),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

/**
 * GET /api/email-templates
 * Lista todos os templates de email
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: templates
  });
}));

/**
 * GET /api/email-templates/:id
 * Busca um template específico
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const template = await prisma.emailTemplate.findUnique({
    where: { id }
  });

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template não encontrado'
    });
  }

  res.json({
    success: true,
    data: template
  });
}));

/**
 * POST /api/email-templates
 * Cria um novo template
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = templateSchema.parse(req.body);

  // Verificar se já existe template com esse nome
  const existing = await prisma.emailTemplate.findFirst({
    where: { name: data.name }
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Já existe um template com este nome'
    });
  }

  const template = await prisma.emailTemplate.create({
    data: {
      name: data.name,
      subject: data.subject,
      htmlContent: data.htmlContent,
      textContent: data.textContent || '',
      variables: data.variables || [],
      category: data.category || 'custom',
      isActive: data.isActive ?? true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Template criado com sucesso',
    data: template
  });
}));

/**
 * PUT /api/email-templates/:id
 * Atualiza um template existente
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = templateSchema.partial().parse(req.body);

  // Verificar se template existe
  const existing = await prisma.emailTemplate.findUnique({
    where: { id }
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Template não encontrado'
    });
  }

  // Se está mudando o nome, verificar se não conflita
  if (data.name && data.name !== existing.name) {
    const nameConflict = await prisma.emailTemplate.findFirst({
      where: {
        name: data.name,
        id: { not: id }
      }
    });

    if (nameConflict) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um template com este nome'
      });
    }
  }

  const template = await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.subject && { subject: data.subject }),
      ...(data.htmlContent && { htmlContent: data.htmlContent }),
      ...(data.textContent !== undefined && { textContent: data.textContent }),
      ...(data.variables && { variables: data.variables }),
      ...(data.category && { category: data.category }),
      ...(data.isActive !== undefined && { isActive: data.isActive })
    }
  });

  res.json({
    success: true,
    message: 'Template atualizado com sucesso',
    data: template
  });
}));

/**
 * DELETE /api/email-templates/:id
 * Deleta um template
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verificar se template existe
  const existing = await prisma.emailTemplate.findUnique({
    where: { id }
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Template não encontrado'
    });
  }

  // Verificar se é um template do sistema (não pode deletar)
  const systemTemplates = ['user-confirmation', 'password-recovery', 'protocol-confirmation', 'protocol-update', 'citizen-welcome'];
  if (systemTemplates.includes(existing.name)) {
    return res.status(400).json({
      success: false,
      message: 'Templates do sistema não podem ser deletados. Você pode desativá-los.'
    });
  }

  await prisma.emailTemplate.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Template deletado com sucesso'
  });
}));

/**
 * POST /api/email-templates/:id/test
 * Envia email de teste
 */
router.post('/:id/test', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, variables } = z.object({
    email: z.string().email('Email inválido'),
    variables: z.record(z.string(), z.any()).optional()
  }).parse(req.body);

  const template = await prisma.emailTemplate.findUnique({
    where: { id }
  });

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template não encontrado'
    });
  }

  // Buscar EmailServer ativo
  const emailServer = await prisma.emailServer.findFirst({
    where: { isActive: true }
  });

  if (!emailServer) {
    return res.status(400).json({
      success: false,
      message: 'Servidor de email não configurado'
    });
  }

  // Enviar email de teste
  const result = await transactionalEmailService.sendEmail({
    emailServerId: emailServer.id,
    templateName: template.name,
    to: email,
    variables: (variables || {}) as any,
    tags: ['test']
  });

  if (result.success) {
    res.json({
      success: true,
      message: 'Email de teste enviado com sucesso',
      messageId: result.messageId
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email de teste',
      error: result.error
    });
  }
}));

/**
 * POST /api/email-templates/:id/duplicate
 * Duplica um template
 */
router.post('/:id/duplicate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const original = await prisma.emailTemplate.findUnique({
    where: { id }
  });

  if (!original) {
    return res.status(404).json({
      success: false,
      message: 'Template não encontrado'
    });
  }

  // Gerar nome único
  let newName = `${original.name}-copy`;
  let counter = 1;
  while (await prisma.emailTemplate.findFirst({ where: { name: newName } })) {
    newName = `${original.name}-copy-${counter}`;
    counter++;
  }

  const duplicate = await prisma.emailTemplate.create({
    data: {
      name: newName,
      subject: original.subject,
      htmlContent: original.htmlContent,
      textContent: original.textContent,
      variables: original.variables as any,
      category: 'custom',
      isActive: false // Começa desativado
    }
  });

  res.status(201).json({
    success: true,
    message: 'Template duplicado com sucesso',
    data: duplicate
  });
}));

export default router;
