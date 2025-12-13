/**
 * SEED DE SERVIÇOS - SECRETARIA DE SAÚDE
 * Total: 10 serviços (7 COM_DADOS + 3 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const healthServices: ServiceDefinition[] = [
  // ========== COM_DADOS (7) ==========

  {
    name: 'Agendamento de Consulta Médica',
    description: 'Agendamento de consultas em unidades de saúde do município',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'AGENDAMENTO_CONSULTA',
    requiresDocuments: true,
    requiredDocuments: ['Cartão SUS', 'RG ou CPF'],
    estimatedDays: 7,
    priority: 5,
    category: 'Consultas',
    icon: 'Calendar',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        especialidade: { type: 'string', title: 'Especialidade', enum: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Cardiologia', 'Odontologia', 'Psicologia', 'Fisioterapia', 'Outro'] },
        unidadeSaude: { type: 'string', title: 'Unidade de Saúde Preferencial', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['cartaoSUS', 'especialidade']
    }
  },

  {
    name: 'Solicitação de Exames',
    description: 'Solicitação de exames laboratoriais e de imagem',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_EXAMES',
    requiresDocuments: true,
    requiredDocuments: ['Pedido Médico', 'Cartão SUS', 'RG ou CPF'],
    estimatedDays: 15,
    priority: 4,
    category: 'Exames',
    icon: 'FileText',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        tipoExame: { type: 'string', title: 'Tipo de Exame', enum: ['Laboratorial (Sangue, Urina)', 'Imagem (Raio-X, Ultrassom)', 'Outros Exames'] },
        exameSolicitado: { type: 'string', title: 'Exame Solicitado', maxLength: 300 },
        medicoSolicitante: { type: 'string', title: 'Médico Solicitante', maxLength: 200 }
      },
      required: ['cartaoSUS', 'tipoExame', 'exameSolicitado']
    }
  },

  {
    name: 'Controle de Medicamentos',
    description: 'Solicitação de medicamentos da farmácia básica municipal',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CONTROLE_MEDICAMENTOS',
    requiresDocuments: true,
    requiredDocuments: ['Receita Médica', 'Cartão SUS', 'RG ou CPF'],
    estimatedDays: 3,
    priority: 5,
    category: 'Medicamentos',
    icon: 'Pill',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        medicamento: { type: 'string', title: 'Medicamento Solicitado', maxLength: 200 },
        dosagem: { type: 'string', title: 'Dosagem', maxLength: 100 },
        unidadeSaude: { type: 'string', title: 'Unidade de Saúde para Retirada', maxLength: 200 },
        usoConti​nuo: { type: 'boolean', title: 'Uso Contínuo' }
      },
      required: ['cartaoSUS', 'medicamento', 'dosagem']
    }
  },

  {
    name: 'Campanhas de Vacinação',
    description: 'Cadastro e participação em campanhas de vacinação',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CAMPANHAS_VACINACAO',
    requiresDocuments: true,
    requiredDocuments: ['Cartão de Vacina (se possuir)', 'RG ou CPF'],
    estimatedDays: 1,
    priority: 5,
    category: 'Vacinação',
    icon: 'Shield',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoVacina: { type: 'string', title: 'Tipo de Vacina', enum: ['COVID-19', 'Influenza (Gripe)', 'Tríplice Viral', 'Hepatite B', 'Febre Amarela', 'Outra'] },
        grupoAlvo: { type: 'string', title: 'Grupo Alvo', enum: ['Criança', 'Adolescente', 'Adulto', 'Idoso', 'Gestante', 'Profissional de Saúde'] },
        unidadeSaude: { type: 'string', title: 'Unidade de Saúde Preferencial', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['tipoVacina', 'grupoAlvo']
    }
  },

  {
    name: 'Programas de Saúde',
    description: 'Inscrição em programas de saúde (Hiperdia, Saúde da Mulher, etc)',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'PROGRAMAS_SAUDE',
    requiresDocuments: true,
    requiredDocuments: ['Laudo Médico (se aplicável)', 'Cartão SUS', 'RG ou CPF'],
    estimatedDays: 15,
    priority: 3,
    category: 'Programas',
    icon: 'Heart',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        programa: { type: 'string', title: 'Programa de Saúde', enum: ['Hiperdia (Hipertensão/Diabetes)', 'Saúde da Mulher', 'Saúde do Idoso', 'Saúde Mental', 'Programa de Nutrição', 'Outro'] },
        condicaoSaude: { type: 'string', title: 'Condição de Saúde', maxLength: 300, widget: 'textarea' },
        unidadeSaude: { type: 'string', title: 'Unidade de Saúde', maxLength: 200 }
      },
      required: ['cartaoSUS', 'programa']
    }
  },

  {
    name: 'Transporte de Pacientes (TFD)',
    description: 'Solicitação de transporte para tratamento fora do domicílio',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'TRANSPORTE_PACIENTES',
    requiresDocuments: true,
    requiredDocuments: ['Atestado Médico', 'Comprovante de Endereço', 'Cartão SUS', 'RG ou CPF'],
    estimatedDays: 10,
    priority: 5,
    category: 'Transporte',
    icon: 'Ambulance',
    color: '#f97316',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        tipoTransporte: { type: 'string', title: 'Tipo de Transporte', enum: ['Ambulância', 'Veículo Adaptado', 'Transporte Coletivo'] },
        destino: { type: 'string', title: 'Cidade de Destino', maxLength: 200 },
        finalidade: { type: 'string', title: 'Finalidade do Transporte', maxLength: 300, widget: 'textarea' },
        dataIda: { type: 'string', title: 'Data de Ida', format: 'date' },
        dataRetorno: { type: 'string', title: 'Data de Retorno (se aplicável)', format: 'date' },
        acompanhante: { type: 'boolean', title: 'Necessita Acompanhante' }
      },
      required: ['cartaoSUS', 'tipoTransporte', 'destino', 'finalidade', 'dataIda']
    }
  },

  {
    name: 'Solicitação de Cartão SUS',
    description: 'Solicitação de primeira via ou segunda via do Cartão Nacional de Saúde',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    moduleType: 'CARTAO_SUS',
    requiresDocuments: true,
    requiredDocuments: ['RG ou CNH', 'CPF', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 4,
    category: 'Documentação',
    icon: 'CreditCard',
    color: '#14b8a6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Primeira Via', 'Segunda Via (Perda/Roubo)', 'Atualização de Dados'] },
        unidadeSaudeRetirada: { type: 'string', title: 'Unidade de Saúde para Retirada', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['tipoSolicitacao']
    }
  },

  // ========== SEM_DADOS (3) ==========

  {
    name: 'Certidão de Atendimento',
    description: 'Certidão de atendimento em unidade de saúde',
    departmentCode: 'SAUDE',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['RG ou CPF', 'Cartão SUS'],
    estimatedDays: 5,
    priority: 2,
    category: 'Certidões',
    icon: 'FileCheck',
    color: '#6366f1'
  },

  {
    name: 'Declaração de Vacinação',
    description: 'Declaração comprovando vacinação realizada',
    departmentCode: 'SAUDE',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['Cartão de Vacina', 'RG ou CPF'],
    estimatedDays: 3,
    priority: 2,
    category: 'Declarações',
    icon: 'FileSignature',
    color: '#8b5cf6'
  },

  {
    name: 'Histórico de Atendimentos',
    description: 'Consulta ao histórico de atendimentos do cidadão',
    departmentCode: 'SAUDE',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['RG ou CPF', 'Cartão SUS'],
    estimatedDays: 5,
    priority: 2,
    category: 'Consultas',
    icon: 'History',
    color: '#64748b'
  }
];
