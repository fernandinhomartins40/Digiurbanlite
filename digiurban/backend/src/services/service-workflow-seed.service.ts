/**
 * ============================================================================
 * SERVICE WORKFLOW SEED SERVICE
 * ============================================================================
 *
 * Lógica de seed de workflows extraída para o código do backend
 * para funcionar em produção (build compilado)
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import * as serviceWorkflowService from './service-workflow.service';

/**
 * Workflows específicos por moduleType
 */
const specificWorkflows: Record<string, {
  moduleType: string;
  name: string;
  description: string;
  defaultSLA: number;
  stages: any[];
}> = {
  // ========== SAÚDE ==========
  ENCAMINHAMENTOS_TFD: {
    moduleType: 'ENCAMINHAMENTOS_TFD',
    name: 'Workflow - Tratamento Fora do Domicílio',
    description: 'Fluxo para encaminhamentos TFD',
    defaultSLA: 7,
    stages: [
      {
        name: 'Análise Documental',
        order: 1,
        description: 'Verificação de documentos obrigatórios (laudos, atestados, exames)',
        slaDays: 2,
        requiredDocumentTypes: ['Atestado Médico', 'Exames', 'Guia de Encaminhamento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Regulação Médica',
        order: 2,
        description: 'Avaliação técnica pela regulação médica',
        slaDays: 3,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Aprovação Gestão',
        order: 3,
        description: 'Aprovação final pela gestão',
        slaDays: 1,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Agendamento Transporte',
        order: 4,
        description: 'Agendamento do transporte para o paciente',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  TRANSPORTE_PACIENTES: {
    moduleType: 'TRANSPORTE_PACIENTES',
    name: 'Workflow - Transporte de Pacientes',
    description: 'Fluxo para solicitação de transporte de pacientes',
    defaultSLA: 10,
    stages: [
      {
        name: 'Análise de Solicitação',
        order: 1,
        description: 'Verificação da solicitação e documentos',
        slaDays: 2,
        requiredDocumentTypes: ['Atestado Médico', 'Comprovante de Endereço', 'Cartão SUS'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Avaliação Técnica',
        order: 2,
        description: 'Avaliação do tipo de transporte necessário',
        slaDays: 3,
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 3,
        description: 'Agendamento do transporte',
        slaDays: 3,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 4,
        description: 'Confirmação com o paciente',
        slaDays: 2,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  AGENDAMENTOS_MEDICOS: {
    moduleType: 'AGENDAMENTOS_MEDICOS',
    name: 'Workflow - Agendamentos Médicos',
    description: 'Fluxo para agendamento de consultas',
    defaultSLA: 3,
    stages: [
      {
        name: 'Recebimento',
        order: 1,
        description: 'Recebimento da solicitação de agendamento',
        slaDays: 1,
        requiredDocumentTypes: ['Cartão SUS', 'Encaminhamento Médico'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Agendamento',
        order: 2,
        description: 'Agendamento da consulta conforme disponibilidade',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Confirmação',
        order: 3,
        description: 'Confirmação com o paciente',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== EDUCAÇÃO ==========
  MATRICULA_ESCOLAR: {
    moduleType: 'MATRICULA_ESCOLAR',
    name: 'Workflow - Matrícula Escolar',
    description: 'Fluxo para matrícula de alunos',
    defaultSLA: 5,
    stages: [
      {
        name: 'Análise de Documentos',
        order: 1,
        description: 'Verificação de documentos obrigatórios',
        slaDays: 2,
        requiredDocumentTypes: ['Certidão de Nascimento', 'Comprovante de Residência', 'Cartão de Vacina'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 2,
        description: 'Verificação de disponibilidade de vagas',
        slaDays: 1,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Efetivação Matrícula',
        order: 3,
        description: 'Efetivação da matrícula no sistema',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega de Documentos',
        order: 4,
        description: 'Entrega de comprovante e orientações',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  TRANSFERENCIA_ESCOLAR: {
    moduleType: 'TRANSFERENCIA_ESCOLAR',
    name: 'Workflow - Transferência Escolar',
    description: 'Fluxo para transferência entre escolas',
    defaultSLA: 7,
    stages: [
      {
        name: 'Análise de Solicitação',
        order: 1,
        description: 'Análise da solicitação de transferência',
        slaDays: 2,
        requiredDocumentTypes: ['Declaração de Transferência', 'Histórico Escolar'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Verificação de Vagas',
        order: 2,
        description: 'Verificação de vagas na escola destino',
        slaDays: 2,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Processamento',
        order: 3,
        description: 'Processamento da transferência',
        slaDays: 2,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Finalização',
        order: 4,
        description: 'Emissão de documentos finais',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== ASSISTÊNCIA SOCIAL ==========
  SOLICITACAO_BENEFICIO: {
    moduleType: 'SOLICITACAO_BENEFICIO',
    name: 'Workflow - Solicitação de Benefícios',
    description: 'Fluxo para solicitação de benefícios sociais',
    defaultSLA: 10,
    stages: [
      {
        name: 'Triagem',
        order: 1,
        description: 'Triagem inicial e verificação de elegibilidade',
        slaDays: 2,
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Renda', 'Comprovante de Residência'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Socioeconômica',
        order: 2,
        description: 'Análise detalhada da situação socioeconômica',
        slaDays: 3,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Visita Domiciliar',
        order: 3,
        description: 'Visita domiciliar se necessário',
        slaDays: 3,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: true
      },
      {
        name: 'Aprovação Final',
        order: 4,
        description: 'Aprovação final do benefício',
        slaDays: 1,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Concessão',
        order: 5,
        description: 'Concessão do benefício',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  CADASTRO_UNICO: {
    moduleType: 'CADASTRO_UNICO',
    name: 'Workflow - Cadastro Único',
    description: 'Fluxo para cadastro no CadÚnico',
    defaultSLA: 5,
    stages: [
      {
        name: 'Recepção',
        order: 1,
        description: 'Recepção e verificação de documentos',
        slaDays: 1,
        requiredDocumentTypes: ['RG', 'CPF', 'Comprovante de Residência', 'Certidão de Nascimento'],
        allowedActions: ['APPROVE', 'REQUEST_INFO'],
        canSkip: false
      },
      {
        name: 'Entrevista',
        order: 2,
        description: 'Entrevista e preenchimento do formulário',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Inclusão no Sistema',
        order: 3,
        description: 'Inclusão dos dados no sistema CadÚnico',
        slaDays: 2,
        allowedActions: ['APPROVE'],
        canSkip: false
      },
      {
        name: 'Entrega de Comprovante',
        order: 4,
        description: 'Entrega do comprovante de cadastro',
        slaDays: 1,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  // ========== PLANEJAMENTO URBANO ==========
  ALVARA_CONSTRUCAO: {
    moduleType: 'ALVARA_CONSTRUCAO',
    name: 'Workflow - Alvará de Construção',
    description: 'Fluxo para emissão de alvará de construção',
    defaultSLA: 20,
    stages: [
      {
        name: 'Protocolo',
        order: 1,
        description: 'Protocolo da documentação',
        slaDays: 2,
        requiredDocumentTypes: ['Projeto Arquitetônico', 'Matrícula do Imóvel', 'ART', 'Comprovante de Propriedade'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Técnica',
        order: 2,
        description: 'Análise técnica do projeto',
        slaDays: 10,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria do terreno',
        slaDays: 5,
        allowedActions: ['APPROVE', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão de Alvará',
        order: 4,
        description: 'Emissão do alvará de construção',
        slaDays: 3,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  },

  ALVARA_FUNCIONAMENTO: {
    moduleType: 'ALVARA_FUNCIONAMENTO',
    name: 'Workflow - Alvará de Funcionamento',
    description: 'Fluxo para emissão de alvará de funcionamento',
    defaultSLA: 15,
    stages: [
      {
        name: 'Protocolo',
        order: 1,
        description: 'Protocolo da solicitação',
        slaDays: 2,
        requiredDocumentTypes: ['CNPJ', 'Contrato Social', 'IPTU', 'Projeto de Prevenção contra Incêndio'],
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Análise Documental',
        order: 2,
        description: 'Análise da documentação apresentada',
        slaDays: 5,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Vistoria',
        order: 3,
        description: 'Vistoria do estabelecimento',
        slaDays: 5,
        allowedActions: ['APPROVE', 'REQUEST_INFO', 'REJECT'],
        canSkip: false
      },
      {
        name: 'Emissão',
        order: 4,
        description: 'Emissão do alvará de funcionamento',
        slaDays: 3,
        allowedActions: ['APPROVE'],
        canSkip: false
      }
    ]
  }
};

/**
 * Workflow genérico para serviços SEM_DADOS
 */
const genericWorkflowStages = [
  {
    name: 'Recebimento',
    order: 1,
    description: 'Protocolo recebido e aguardando análise inicial',
    slaDays: 2,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false
  },
  {
    name: 'Análise',
    order: 2,
    description: 'Análise da solicitação',
    slaDays: 3,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false
  },
  {
    name: 'Processamento',
    order: 3,
    description: 'Processamento da solicitação',
    slaDays: 5,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE', 'REQUEST_INFO'],
    canSkip: false
  },
  {
    name: 'Aprovação',
    order: 4,
    description: 'Aprovação final',
    slaDays: 2,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE', 'REJECT'],
    canSkip: false
  },
  {
    name: 'Conclusão',
    order: 5,
    description: 'Emissão de documento ou conclusão do atendimento',
    slaDays: 1,
    requiredDocumentTypes: [],
    requiredFormFieldIds: [],
    allowedActions: ['APPROVE'],
    canSkip: false
  }
];

/**
 * Criar workflows para todos os serviços sem workflow
 */
export async function seedAllServiceWorkflows() {
  console.log('🌱 Criando workflows para serviços sem workflow...');

  let created = 0;
  let skipped = 0;

  // Buscar todos os serviços ativos
  const services = await prisma.serviceSimplified.findMany({
    where: {
      isActive: true
    },
    include: {
      department: true
    }
  });

  console.log(`   → Encontrados ${services.length} serviços ativos`);

  // Processar cada serviço
  for (const service of services) {
    try {
      // Verificar se já tem workflow
      const existingWorkflow = await prisma.serviceWorkflow.findUnique({
        where: { serviceId: service.id }
      });

      if (existingWorkflow) {
        console.log(`   ⏭️  ${service.name} - já possui workflow`);
        skipped++;
        continue;
      }

      // Determinar qual workflow usar
      let workflowData: {
        serviceId: string;
        name: string;
        description: string;
        stages: any[];
        defaultSLA: number;
      };

      if (service.moduleType && specificWorkflows[service.moduleType]) {
        // Serviço COM_DADOS com workflow específico
        const specificWorkflow = specificWorkflows[service.moduleType];
        workflowData = {
          serviceId: service.id,
          name: specificWorkflow.name,
          description: specificWorkflow.description,
          stages: specificWorkflow.stages,
          defaultSLA: specificWorkflow.defaultSLA
        };
        console.log(`   ✅ ${service.name} - workflow ESPECÍFICO (${service.moduleType})`);
      } else if (service.serviceType === 'SEM_DADOS' || !service.moduleType) {
        // Serviço SEM_DADOS - usa workflow genérico
        workflowData = {
          serviceId: service.id,
          name: `Workflow - ${service.name}`,
          description: `Workflow genérico para ${service.name}`,
          stages: genericWorkflowStages,
          defaultSLA: service.estimatedDays || 13
        };
        console.log(`   ✅ ${service.name} - workflow GENÉRICO (SEM_DADOS)`);
      } else {
        // Serviço COM_DADOS sem workflow específico ainda - usa genérico
        workflowData = {
          serviceId: service.id,
          name: `Workflow - ${service.name}`,
          description: `Workflow genérico para ${service.name} (aguardando workflow específico)`,
          stages: genericWorkflowStages,
          defaultSLA: service.estimatedDays || 13
        };
        console.log(`   ⚠️  ${service.name} - workflow GENÉRICO TEMPORÁRIO (COM_DADOS sem workflow específico)`);
      }

      // Criar o workflow usando o service
      await serviceWorkflowService.createServiceWorkflow(workflowData);

      created++;
    } catch (error) {
      console.error(`   ❌ Erro ao processar ${service.name}:`, error);
    }
  }

  console.log(`\n✅ ServiceWorkflows: ${created} criados, ${skipped} já existiam`);
  return { created, skipped };
}
