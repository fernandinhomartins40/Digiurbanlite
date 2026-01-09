/**
 * SEED DE SERVIÇOS - SECRETARIA DE ASSISTÊNCIA SOCIAL
 * Total: 10 serviços (7 COM_DADOS + 3 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const socialServices: ServiceDefinition[] = [
  // ========== COM_DADOS (7) ==========

  {
    name: 'Cadastro Único (CadÚnico)',
    description: 'Inscrição ou atualização no Cadastro Único para Programas Sociais',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_UNICO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência', 'Comprovante de Renda'],
    estimatedDays: 10,
    priority: 5,
    category: 'Benefícios',
    icon: 'Users',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nisExistente: { type: 'string', title: 'NIS (se já possui)', pattern: '^\\d{11}$', maxLength: 11 },
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantidade de Pessoas na Família', minimum: 1, maximum: 30 },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal Total (R$)', minimum: 0 },
        beneficiosRecebidos: { type: 'string', title: 'Benefícios Já Recebidos', maxLength: 500 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['quantidadePessoasFamilia', 'rendaFamiliarMensal']
    }
  },

  {
    name: 'Solicitação de Benefício Social',
    description: 'Solicitação de benefícios sociais (BPC, Bolsa Família, Auxílio Emergencial)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'SOLICITACAO_BENEFICIO',
    requiresDocuments: true,
    requiredDocuments: ['CadÚnico', 'Documentos Pessoais', 'Comprovante de Renda'],
    estimatedDays: 15,
    priority: 5,
    category: 'Benefícios',
    icon: 'Wallet',
    color: '#b91c1c',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        possuiCadUnico: { type: 'boolean', title: 'Possui Cadastro Único (CadÚnico)?' },
        nisCadUnico: { type: 'string', title: 'NIS do CadÚnico', maxLength: 20 },
        tipoBeneficio: { type: 'string', title: 'Tipo de Benefício Solicitado', enum: ['BPC (Idoso)', 'BPC (Pessoa com Deficiência)', 'Bolsa Família', 'Auxílio Emergencial', 'Cesta Básica', 'Tarifa Social de Energia', 'Outro'] },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', minLength: 20, maxLength: 1000, widget: 'textarea' },
        situacaoVulnerabilidade: { type: 'string', title: 'Situação de Vulnerabilidade', enum: ['Extrema Pobreza', 'Desemprego', 'Doença/Deficiência', 'Idoso sem Renda', 'Situação de Rua', 'Violência Doméstica', 'Outro'] },
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantidade de Pessoas na Família', minimum: 1, maximum: 30 },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        urgente: { type: 'boolean', title: 'Caso Urgente?' }
      },
      required: ['tipoBeneficio', 'motivoSolicitacao', 'situacaoVulnerabilidade', 'quantidadePessoasFamilia', 'rendaFamiliarMensal']
    }
  },

  {
    name: 'Agendamento de Atendimento Social',
    description: 'Agendamento de atendimento com assistente social no CRAS/CREAS',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'ATENDIMENTO_CRAS',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência'],
    estimatedDays: 3,
    priority: 4,
    category: 'Atendimento',
    icon: 'Home',
    color: '#991b1b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        unidadeCRAS: { type: 'string', title: 'Unidade CRAS/CREAS Preferencial', minLength: 3, maxLength: 200 },
        tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento', enum: ['Primeira Vez', 'Retorno', 'Orientação', 'Acompanhamento', 'Emergência', 'Outro'] },
        motivoAtendimento: { type: 'string', title: 'Motivo do Atendimento', minLength: 10, maxLength: 500, widget: 'textarea' },
        dataPreferencial: { type: 'string', title: 'Data Preferencial', format: 'date' },
        turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] },
        urgente: { type: 'boolean', title: 'Caso Urgente?' }
      },
      required: ['unidadeCRAS', 'tipoAtendimento', 'motivoAtendimento', 'turnoPreferencial']
    }
  },

  {
    name: 'Auxílio Emergencial (Cesta Básica)',
    description: 'Solicitação de auxílio emergencial e cestas básicas',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'AUXILIO_EMERGENCIAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Endereço', 'Declaração de Vulnerabilidade (se aplicável)'],
    estimatedDays: 3,
    priority: 5,
    category: 'Emergencial',
    icon: 'Package',
    color: '#7f1d1d',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoAjuda: { type: 'string', title: 'Tipo de Ajuda Necessária', enum: ['Cesta Básica', 'Auxílio Alimentação', 'Kit Higiene', 'Medicamentos', 'Outro'] },
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantas Pessoas Moram na Casa?', minimum: 1, maximum: 30 },
        quantidadeCriancas: { type: 'integer', title: 'Quantas Crianças (0-12 anos)?', minimum: 0, maximum: 20 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação Emergencial', minLength: 20, maxLength: 1000, widget: 'textarea' },
        situacaoEmergencial: { type: 'string', title: 'Situação Emergencial', enum: ['Desemprego Recente', 'Doença na Família', 'Perda de Moradia', 'Calamidade (incêndio, enchente)', 'Fome/Extrema Necessidade', 'Outro'] },
        urgente: { type: 'boolean', title: 'Caso URGENTE (risco de fome)?' }
      },
      required: ['tipoAjuda', 'quantidadePessoasFamilia', 'motivoSolicitacao', 'situacaoEmergencial']
    }
  },

  {
    name: 'Visita Domiciliar',
    description: 'Solicitação de visita técnica domiciliar',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'VISITA_DOMICILIAR',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Endereço'],
    estimatedDays: 7,
    priority: 4,
    category: 'Atendimento',
    icon: 'MapPin',
    color: '#f97316',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        motivoVisita: { type: 'string', title: 'Motivo da Visita', minLength: 20, maxLength: 1000, widget: 'textarea' },
        dataPreferencial: { type: 'string', title: 'Data Preferencial', format: 'date' },
        turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] },
        urgente: { type: 'boolean', title: 'Caso Urgente?' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['motivoVisita']
    }
  },

  {
    name: 'Inscrição em Grupo ou Oficina Social',
    description: 'Inscrição em grupos e oficinas do CRAS/CREAS',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_GRUPO_OFICINA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Endereço'],
    estimatedDays: 5,
    priority: 3,
    category: 'Programas',
    icon: 'Users',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoAtividade: { type: 'string', title: 'Tipo de Atividade', enum: ['Oficina de Artesanato', 'Oficina de Informática', 'Grupo de Idosos', 'Grupo de Mulheres', 'Grupo de Jovens', 'Reforço Escolar', 'Oficina Cultural', 'Esporte e Lazer', 'Outro'] },
        nomeGrupoOficina: { type: 'string', title: 'Nome do Grupo/Oficina', minLength: 3, maxLength: 200 },
        unidadeCRAS: { type: 'string', title: 'Unidade CRAS/CREAS', minLength: 3, maxLength: 200 },
        turnoPreferido: { type: 'string', title: 'Turno Preferido', enum: ['Manhã', 'Tarde', 'Noite', 'Qualquer'] },
        motivoInteresse: { type: 'string', title: 'Motivo do Interesse', minLength: 10, maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoAtividade', 'nomeGrupoOficina', 'unidadeCRAS', 'motivoInteresse']
    }
  },

  {
    name: 'Inscrição em Programa Social',
    description: 'Inscrição em programas sociais municipais',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_SOCIAL',
    requiresDocuments: true,
    requiredDocuments: ['CadÚnico', 'Documentos Pessoais'],
    estimatedDays: 10,
    priority: 4,
    category: 'Programas',
    icon: 'FileCheck',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nisCadUnico: { type: 'string', title: 'NIS do CadÚnico', maxLength: 20 },
        nomePrograma: { type: 'string', title: 'Nome do Programa', minLength: 3, maxLength: 200 },
        tipoPrograma: { type: 'string', title: 'Tipo de Programa', enum: ['Programa de Transferência de Renda', 'Programa para Idosos', 'Programa para Crianças', 'Programa para Mulheres', 'Programa de Capacitação', 'Outro'] },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        quantidadePessoasFamilia: { type: 'integer', title: 'Pessoas na Família', minimum: 1, maximum: 30 },
        motivoInscricao: { type: 'string', title: 'Motivo da Inscrição', minLength: 20, maxLength: 500, widget: 'textarea' }
      },
      required: ['nomePrograma', 'tipoPrograma', 'motivoInscricao']
    }
  },

  // ========== SEM_DADOS (3) ==========

  {
    name: 'Certidão de CadÚnico',
    description: 'Emissão de certidão de inscrição no Cadastro Único (usa dados do perfil do cidadão)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#dc2626'
  },

  {
    name: 'Declaração de Benefício',
    description: 'Emissão de declaração de recebimento de benefício social (usa dados do perfil do cidadão)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 3,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#dc2626'
  },

  {
    name: 'Laudo Social',
    description: 'Emissão de laudo técnico social (usa dados do perfil do cidadão)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 15,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#dc2626'
  }
];
