import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { LeadSource } from '@prisma/client';
import { AuthenticatedRequest, SuccessResponse, ErrorResponse } from '../types';
import { LeadNotificationService } from '../lib/email/LeadNotificationService';
import {
  convertLeadToService,
  convertTrialToService,
  safeString,
  safeStringWithDefault,
  DEFAULT_VALUES,
  LeadData
        } from '../types';
import { z } from 'zod';

// ✅ SEGURANÇA: Schema de senha forte
const strongPasswordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/\d/, 'Senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Senha deve conter pelo menos um caractere especial');

const router = Router();
const leadNotificationService = new LeadNotificationService();

/**
 * POST /api/leads/demo
 * Solicitar demonstração
 */
router.post('/demo', async (req, res) => {
  try {
    const { name, email, phone, company, position, message } = req.body;

    if (!name || !email || !company) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Nome, email e empresa são obrigatórios'
        });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || undefined,
        company,
        position: position || undefined,
        source: LeadSource.DEMO_REQUEST,
        message: message || undefined,
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString()
        }
        }
        });

    // Enviar notificação para equipe de vendas
    try {
      await leadNotificationService.notifyDemoRequest(convertLeadToService(lead as any));
    } catch (emailError) {
      console.error('Erro ao enviar notificação de demo:', emailError);
      // Não falha o request se o email falhar
    }

    // Adicionar à automação de marketing
    try {
      await leadNotificationService.addToMarketingAutomation(convertLeadToService(lead as any));
    } catch (marketingError) {
      console.error('Erro ao adicionar lead à automação de marketing:', marketingError);
      // Não falha o request se a automação falhar
    }

    return res.status(201).json({
      message: 'Solicitação de demo recebida com sucesso',
      leadId: lead.id
        });
  } catch (error) {
    console.error('Demo request error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * POST /api/leads/trial
 * Iniciar trial gratuito
 */
router.post('/trial', async (req, res) => {
  try {
    const {
      // Dados do lead
      name,
      email,
      phone,
      position,

      // Dados da prefeitura
      companyName,
      cnpj,
      population,
      domain,

      // Dados do usuário admin
      adminPassword
        } = req.body;

    if (!name || !email || !companyName || !cnpj) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Nome, email, nome da prefeitura e CNPJ são obrigatórios'
        });
    }

    // ✅ SEGURANÇA: Validar senha forte se fornecida
    if (!adminPassword) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Senha do administrador é obrigatória'
        });
    }

    try {
      strongPasswordSchema.parse(adminPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Senha não atende aos requisitos de segurança',
          details: error.issues.map(issue => issue.message)
        });
      }
    }

    // DIA 3: DISABLED - tenant model removed - mock
    const existingTenant = null; // Mock - tenant não existe mais

    if (existingTenant) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Este CNPJ já possui uma conta no sistema'
        });
    }

    // ❌ REMOVIDO: Validação de domain (não usamos mais subdomínios)
    // Verificação removida - identificação via JWT apenas

    if (false) { // Código desabilitado
      const existingDomain = null; // Removido

      if (existingDomain) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Este domínio já está em uso'
        });
      }
    }

    // Criar lead
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || undefined,
        company: companyName,
        position: position || undefined,
        source: LeadSource.TRIAL_SIGNUP,
        status: 'CONVERTED',
        metadata: {
          cnpj,
          population,
          domain,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString()
        }
        }
        });

    // DIA 3: DISABLED - tenant model removed - endpoint desabilitado
    return res.status(501).json({
      error: 'Not Implemented',
      message: 'Criação de trials temporariamente desabilitada'
        });

    // DIA 3: DISABLED - código comentado abaixo (tenant removido)
    // await prisma.lead.update({
    //   where: { id: lead.id },
    //   data: { tenantId: tenant.id },
    // });
    //
    // const bcrypt = require('bcryptjs');
    // const hashedPassword = await bcrypt.hash(adminPassword, 12);
    //
    // const user = await prisma.user.create({
    //   data: {
    //     email,
    //     name,
    //     password: hashedPassword,
    //     role: 'ADMIN',
    //     tenantId: tenant.id,
    //     mustChangePassword: false,
    //   },
    // });
    //
    // try {
    //   await leadNotificationService.setupTrialExpiration(tenant.id, 30);
    // } catch (trialError) {
    //   console.error('Erro ao configurar expiração do trial:', trialError);
    // }
    //
    // try {
    //   const loginUrl = 'https://digiurban.com.br/admin/login';
    //   await leadNotificationService.sendTrialWelcomeEmail(
    //     convertTrialToService({
    //       id: lead.id,
    //       name: lead.name,
    //       email: lead.email,
    //       company: lead.company || '',
    //       phone: lead.phone || null,
    //       position: lead.position || null,
    //       message: null,
    //       source: String(lead.source),
    //       createdAt: lead.createdAt,
    //       tenantId: tenant.id,
    //       tenantName: tenant.name,
    //       cnpj: tenant.cnpj,
    //       population: tenant.population || null,
    //       loginUrl,
    //       temporaryPassword: adminPassword || '123456',
    //     })
    //   );
    // } catch (emailError) {
    //   console.error('Erro ao enviar email de boas-vindas:', emailError);
    // }
    //
    // return res.status(201).json({
    //   message: 'Trial criado com sucesso',
    //   tenant: {
    //     id: tenant.id,
    //     name: tenant.name,
    //     status: tenant.status,
    //   },
    //   user: {
    //     id: user.id,
    //     email: user.email,
    //     name: user.name,
    //     role: user.role,
    //   },
    //   accessInfo: {
    //     loginUrl: 'https://digiurban.com.br/login',
    //     email: user.email,
    //     temporaryPassword: adminPassword || '123456',
    //   },
    // });
  } catch (error) {
    console.error('Trial signup error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * POST /api/leads/newsletter
 * Inscrição na newsletter
 */
router.post('/newsletter', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Email é obrigatório'
        });
    }

    // Verificar se já está inscrito
    const existingLead = await prisma.lead.findFirst({
      where: {
        email,
        source: LeadSource.NEWSLETTER
        }
        });

    if (existingLead) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Este email já está inscrito na newsletter'
        });
    }

    const lead = await prisma.lead.create({
      data: {
        name: safeString(name),
        email,
        company: '', // Valor padrão para newsletter
        source: LeadSource.NEWSLETTER,
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString()
        }
        }
        });

    // Adicionar à lista de email marketing (newsletter)
    try {
      await leadNotificationService.addToMarketingAutomation(
        convertLeadToService({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: null,
          company: lead.company,
          position: null,
          source: lead.source,
          message: null,
          createdAt: lead.createdAt
        } as LeadData)
      );
    } catch (marketingError) {
      console.error('Erro ao adicionar lead de newsletter à automação:', marketingError);
      // Não falha o request se a automação falhar
    }

    return res.status(201).json({
      message: 'Inscrição realizada com sucesso',
      leadId: lead.id
        });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

/**
 * POST /api/leads/contact
 * Formulário de contato geral
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, company, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Nome, email e mensagem são obrigatórios'
        });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || undefined,
        company: company || null,
        source: LeadSource.CONTACT_FORM,
        message,
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString()
        }
        }
        });

    // Enviar notificação para a equipe de suporte
    try {
      await leadNotificationService.notifyContactForm(
        convertLeadToService({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          company: lead.company || '',
          phone: lead.phone || null,
          position: lead.position || null,
          message: lead.message || null,
          source: String(lead.source),
          createdAt: lead.createdAt
        })
      );
    } catch (emailError) {
      console.error('Erro ao enviar notificação de contato:', emailError);
      // Não falha o request se o email falhar
    }

    return res.status(201).json({
      message: 'Mensagem enviada com sucesso',
      leadId: lead.id
        });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor'
        });
  }
});

export default router;
