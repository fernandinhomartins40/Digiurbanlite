/**
 * SEED DE SERVIÇOS - SECRETARIA DE SAÚDE
 * Total: 20 serviços (14 COM_DADOS + 6 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const healthServices: ServiceDefinition[] = [
  // ========== COM_DADOS - CAPTURA_COMPLETA (10) ==========

  {
    name: 'Agendamento de Consulta Médica',
    description: 'Agende consultas médicas em unidades de saúde do município',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
        especialidade: { type: 'string', title: 'Especialidade', enum: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Cardiologia', 'Psicologia', 'Fisioterapia', 'Outro'] },
        unidadeSaude: { type: 'string', title: 'Unidade de Saúde Preferencial', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['cartaoSUS', 'especialidade']
    }
  },

  {
    name: 'Agendamento de Consulta Odontológica',
    description: 'Agende consultas odontológicas em unidades de saúde bucal',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AGENDAMENTO_ODONTOLOGIA',
    requiresDocuments: true,
    requiredDocuments: ['Cartão SUS', 'RG ou CPF'],
    estimatedDays: 10,
    priority: 4,
    category: 'Consultas',
    icon: 'Stethoscope',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento', enum: ['Primeira Consulta', 'Limpeza', 'Extração', 'Obturação', 'Prótese', 'Urgência/Dor'] },
        unidadeSaude: { type: 'string', title: 'Unidade de Saúde Bucal Preferencial', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['cartaoSUS', 'tipoAtendimento']
    }
  },

  {
    name: 'Solicitação de Exames',
    description: 'Solicite exames laboratoriais e de imagem com pedido médico',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    name: 'Solicitação de Medicamentos de Alto Custo',
    description: 'Solicite medicamentos especiais de alto custo não disponíveis na farmácia básica',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'MEDICAMENTOS_ALTO_CUSTO',
    requiresDocuments: true,
    requiredDocuments: ['Receita Médica Especial', 'Laudo Médico', 'Exames Complementares', 'Cartão SUS', 'RG ou CPF'],
    estimatedDays: 30,
    priority: 5,
    category: 'Medicamentos',
    icon: 'Pill',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        medicamento: { type: 'string', title: 'Medicamento Solicitado', maxLength: 200 },
        principioAtivo: { type: 'string', title: 'Princípio Ativo', maxLength: 200 },
        dosagem: { type: 'string', title: 'Dosagem', maxLength: 100 },
        diagnosticoCID: { type: 'string', title: 'CID-10 do Diagnóstico', maxLength: 10 },
        medicoSolicitante: { type: 'string', title: 'Médico Solicitante (Nome e CRM)', maxLength: 200 },
        tempoTratamento: { type: 'string', title: 'Tempo de Tratamento Previsto', maxLength: 100 }
      },
      required: ['cartaoSUS', 'medicamento', 'principioAtivo', 'dosagem', 'diagnosticoCID', 'medicoSolicitante']
    }
  },

  {
    name: 'Solicitação de Medicamentos',
    description: 'Solicite medicamentos da farmácia básica municipal',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        medicamento: { type: 'string', title: 'Medicamento Solicitado', maxLength: 200 },
        dosagem: { type: 'string', title: 'Dosagem', maxLength: 100 },
        unidadeSaude: { type: 'string', title: 'Unidade de Saúde para Retirada', maxLength: 200 },
        usoContinuo: { type: 'boolean', title: 'Uso Contínuo' }
      },
      required: ['cartaoSUS', 'medicamento', 'dosagem']
    }
  },

  {
    name: 'Agendamento de Vacinação',
    description: 'Agende vacinação de rotina ou em campanhas específicas',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    name: 'Cadastro no Programa Saúde da Família',
    description: 'Cadastre-se no Programa Saúde da Família (PSF) da sua região',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'PROGRAMA_SAUDE_FAMILIA',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Residência', 'RG ou CPF de todos os moradores', 'Cartão SUS (se possuir)'],
    estimatedDays: 15,
    priority: 4,
    category: 'Programas',
    icon: 'Users',
    color: '#16a34a',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        quantidadeMoradores: { type: 'integer', title: 'Quantidade de Moradores no Domicílio', minimum: 1, maximum: 20 },
        possuiCartaoSUS: { type: 'boolean', title: 'Já Possui Cartão SUS' },
        condicoesEspeciais: { type: 'string', title: 'Condições de Saúde Especiais na Família (Diabetes, Hipertensão, Gestante, etc)', maxLength: 500, widget: 'textarea' },
        agenteComunitario: { type: 'string', title: 'Agente Comunitário de Saúde da Região (se souber)', maxLength: 200 }
      },
      required: ['quantidadeMoradores', 'possuiCartaoSUS']
    }
  },

  {
    name: 'Inscrição em Programas de Saúde',
    description: 'Inscreva-se em programas especializados (Hiperdia, Saúde da Mulher, Saúde Mental, etc)',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    name: 'Agendamento CAPS (Saúde Mental)',
    description: 'Agende atendimento no Centro de Atenção Psicossocial',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AGENDAMENTO_CAPS',
    requiresDocuments: true,
    requiredDocuments: ['Encaminhamento Médico (se houver)', 'Cartão SUS', 'RG ou CPF'],
    estimatedDays: 7,
    priority: 5,
    category: 'Consultas',
    icon: 'Brain',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento', enum: ['Primeira Consulta', 'Acompanhamento', 'Urgência'] },
        queixaPrincipal: { type: 'string', title: 'Queixa Principal', maxLength: 500, widget: 'textarea' },
        possuiEncaminhamento: { type: 'boolean', title: 'Possui Encaminhamento Médico' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['cartaoSUS', 'tipoAtendimento', 'queixaPrincipal']
    }
  },

  {
    name: 'Transporte de Pacientes (TFD)',
    description: 'Solicite transporte para tratamento fora do domicílio',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    name: 'Solicitação de Atendimento Domiciliar',
    description: 'Solicite atendimento de saúde em domicílio para pacientes acamados ou com dificuldade de locomoção',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ATENDIMENTO_DOMICILIAR',
    requiresDocuments: true,
    requiredDocuments: ['Laudo Médico', 'Cartão SUS', 'Comprovante de Residência'],
    estimatedDays: 10,
    priority: 5,
    category: 'Atendimento',
    icon: 'Home',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        nomePaciente: { type: 'string', title: 'Nome do Paciente (se diferente do solicitante)', maxLength: 200 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', maxLength: 500, widget: 'textarea' },
        condicaoSaude: { type: 'string', title: 'Condição de Saúde Atual', maxLength: 500, widget: 'textarea' },
        mobilidadeReduzida: { type: 'boolean', title: 'Paciente com Mobilidade Reduzida' },
        acamado: { type: 'boolean', title: 'Paciente Acamado' },
        tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento Necessário', enum: ['Médico', 'Enfermagem', 'Fisioterapia', 'Multiprofissional'] }
      },
      required: ['cartaoSUS', 'motivoSolicitacao', 'condicaoSaude', 'tipoAtendimento']
    }
  },

  {
    name: 'Solicitação de Fisioterapia',
    description: 'Solicite atendimento fisioterapêutico nas unidades de saúde',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'SOLICITACAO_FISIOTERAPIA',
    requiresDocuments: true,
    requiredDocuments: ['Pedido Médico', 'Cartão SUS', 'RG ou CPF'],
    estimatedDays: 20,
    priority: 4,
    category: 'Reabilitação',
    icon: 'Activity',
    color: '#22c55e',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cartaoSUS: { type: 'string', title: 'Número do Cartão SUS', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
        diagnostico: { type: 'string', title: 'Diagnóstico Médico', maxLength: 300 },
        areaAfetada: { type: 'string', title: 'Área Afetada', enum: ['Coluna', 'Membros Superiores', 'Membros Inferiores', 'Respiratória', 'Neurológica', 'Outra'] },
        tempoLesao: { type: 'string', title: 'Tempo da Lesão/Problema', maxLength: 100 },
        medicoSolicitante: { type: 'string', title: 'Médico Solicitante', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['cartaoSUS', 'diagnostico', 'areaAfetada', 'medicoSolicitante']
    }
  },

  {
    name: 'Solicitação de Cartão SUS',
    description: 'Solicite primeira via ou segunda via do Cartão Nacional de Saúde',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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

  // ========== COM_DADOS - SOLICITACAO_SIMPLES (1) ==========

  {
    name: 'Solicitação de Ambulância (Urgência)',
    description: 'Solicite ambulância para situações de urgência ou emergência',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SOLICITACAO_AMBULANCIA',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 5,
    category: 'Urgência',
    icon: 'Siren',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        endereco: { type: 'string', title: 'Endereço Completo', maxLength: 300 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        descricaoSituacao: { type: 'string', title: 'Descrição da Situação de Urgência', maxLength: 500, widget: 'textarea' },
        pacienteConsciente: { type: 'boolean', title: 'Paciente Está Consciente' }
      },
      required: ['endereco', 'descricaoSituacao']
    }
  },

  {
    name: 'Denúncia Sanitária',
    description: 'Denuncie irregularidades sanitárias (estabelecimentos, alimentos, água, etc)',
    departmentCode: 'SAUDE',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_SANITARIA',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Vigilância Sanitária',
    icon: 'AlertTriangle',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoEstabelecimento: { type: 'string', title: 'Tipo de Estabelecimento', enum: ['Restaurante/Bar', 'Comércio de Alimentos', 'Farmácia', 'Clínica/Hospital', 'Salão de Beleza', 'Academia', 'Outro'] },
        nomeEstabelecimento: { type: 'string', title: 'Nome do Estabelecimento', maxLength: 200 },
        endereco: { type: 'string', title: 'Endereço', maxLength: 300 },
        descricaoIrregularidade: { type: 'string', title: 'Descrição da Irregularidade', maxLength: 500, widget: 'textarea' },
        denunciaAnonima: { type: 'boolean', title: 'Desejo fazer denúncia anônima' }
      },
      required: ['tipoEstabelecimento', 'endereco', 'descricaoIrregularidade']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (6) ==========

  {
    name: 'Certidão de Atendimento',
    description: 'Emita certidão comprovando atendimento em unidade de saúde',
    departmentCode: 'SAUDE',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 2,
    category: 'Certidões',
    icon: 'FileCheck',
    color: '#6366f1'
  },

  {
    name: 'Declaração de Vacinação (Carteira Digital)',
    description: 'Emita declaração comprovando vacinação realizada',
    departmentCode: 'SAUDE',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 2,
    category: 'Declarações',
    icon: 'FileSignature',
    color: '#8b5cf6'
  },

  {
    name: 'Histórico de Atendimentos',
    description: 'Consulte seu histórico completo de atendimentos no SUS municipal',
    departmentCode: 'SAUDE',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'History',
    color: '#64748b'
  },

  {
    name: 'Consulta de Disponibilidade de Medicamentos',
    description: 'Consulte quais medicamentos estão disponíveis na farmácia básica',
    departmentCode: 'SAUDE',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consultas',
    icon: 'Search',
    color: '#06b6d4'
  },

  {
    name: 'Consulta de Resultados de Exames',
    description: 'Consulte resultados de exames realizados',
    departmentCode: 'SAUDE',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'FileSearch',
    color: '#3b82f6'
  },

  {
    name: 'Segunda Via do Cartão SUS',
    description: 'Reimprima a segunda via do seu Cartão Nacional de Saúde',
    departmentCode: 'SAUDE',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 1,
    priority: 2,
    category: 'Documentação',
    icon: 'CreditCard',
    color: '#10b981'
  }
];
