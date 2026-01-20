/**
 * SEED DE SERVIÇOS - SECRETARIA DE ASSISTÊNCIA SOCIAL
 * Total: 20 serviços (14 COM_DADOS + 6 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const socialServices: ServiceDefinition[] = [
  // ========== COM_DADOS (14) ==========

  {
    name: 'Cadastro Único (CadÚnico)',
    description: 'Inscrição ou atualização no Cadastro Único para Programas Sociais',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
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
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
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

  {
    name: 'Inscrição Bolsa Família Municipal',
    description: 'Inscrição no programa Bolsa Família complementar do município',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'BOLSA_FAMILIA_MUNICIPAL',
    requiresDocuments: true,
    requiredDocuments: ['CadÚnico', 'CPF', 'RG', 'Comprovante de Residência', 'Comprovante de Renda Familiar'],
    estimatedDays: 20,
    priority: 5,
    category: 'Benefícios',
    icon: 'DollarSign',
    color: '#059669',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nisCadUnico: { type: 'string', title: 'NIS do CadÚnico', pattern: '^\\d{11}$', maxLength: 11 },
        recebeBolsaFamiliaFederal: { type: 'boolean', title: 'Recebe Bolsa Família Federal?' },
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantidade de Pessoas na Família', minimum: 1, maximum: 30 },
        quantidadeCriancasAdolescentes: { type: 'integer', title: 'Quantidade de Crianças e Adolescentes (0-17 anos)', minimum: 0, maximum: 20 },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal Total (R$)', minimum: 0 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', maxLength: 500, widget: 'textarea' },
        situacaoVulnerabilidade: { type: 'string', title: 'Situação de Vulnerabilidade', enum: ['Extrema Pobreza', 'Desemprego', 'Família Monoparental', 'Idoso sem Renda', 'Crianças em Idade Escolar', 'Outra'] }
      },
      required: ['nisCadUnico', 'quantidadePessoasFamilia', 'quantidadeCriancasAdolescentes', 'rendaFamiliarMensal', 'motivoSolicitacao', 'situacaoVulnerabilidade']
    }
  },

  {
    name: 'Auxílio Aluguel',
    description: 'Solicitação de auxílio financeiro para pagamento de aluguel',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUXILIO_ALUGUEL',
    requiresDocuments: true,
    requiredDocuments: ['Contrato de Aluguel', 'CPF', 'RG', 'Comprovante de Renda', 'Declaração de Vulnerabilidade'],
    estimatedDays: 15,
    priority: 5,
    category: 'Benefícios',
    icon: 'Home',
    color: '#0284c7',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        valorAluguel: { type: 'number', title: 'Valor do Aluguel (R$)', minimum: 0 },
        nomeProprietario: { type: 'string', title: 'Nome do Proprietário', maxLength: 200 },
        tempoResidencia: { type: 'string', title: 'Tempo de Residência no Imóvel', maxLength: 100 },
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantidade de Pessoas na Família', minimum: 1, maximum: 30 },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', maxLength: 1000, widget: 'textarea' },
        situacaoEmergencial: { type: 'boolean', title: 'Situação Emergencial (risco de despejo)?' }
      },
      required: ['valorAluguel', 'nomeProprietario', 'tempoResidencia', 'quantidadePessoasFamilia', 'rendaFamiliarMensal', 'motivoSolicitacao']
    }
  },

  {
    name: 'Solicitação de Cesta Básica',
    description: 'Solicitação de cesta básica de alimentos',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CESTA_BASICA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Comprovante de Residência'],
    estimatedDays: 5,
    priority: 5,
    category: 'Emergencial',
    icon: 'ShoppingBasket',
    color: '#ea580c',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantas Pessoas na Família?', minimum: 1, maximum: 30 },
        quantidadeCriancas: { type: 'integer', title: 'Quantas Crianças (0-12 anos)?', minimum: 0, maximum: 20 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', maxLength: 500, widget: 'textarea' },
        situacaoEmergencial: { type: 'string', title: 'Situação', enum: ['Desemprego', 'Doença na Família', 'Extrema Necessidade', 'Calamidade', 'Outra'] },
        jaRecebeuAnteriormente: { type: 'boolean', title: 'Já Recebeu Cesta Básica Anteriormente?' }
      },
      required: ['quantidadePessoasFamilia', 'motivoSolicitacao', 'situacaoEmergencial']
    }
  },

  {
    name: 'Inscrição Casa Lar para Idoso',
    description: 'Solicitação de vaga em casa de repouso ou abrigo para idosos',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CASA_LAR_IDOSO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Atestado Médico', 'Laudo Social (se houver)', 'Comprovante de Renda (se houver)'],
    estimatedDays: 30,
    priority: 5,
    category: 'Acolhimento',
    icon: 'HomeHeart',
    color: '#7c2d12',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeIdoso: { type: 'string', title: 'Nome do Idoso (se diferente do solicitante)', maxLength: 200 },
        idadeIdoso: { type: 'integer', title: 'Idade do Idoso', minimum: 60, maximum: 120 },
        grauDependencia: { type: 'string', title: 'Grau de Dependência', enum: ['Independente', 'Parcialmente Dependente', 'Totalmente Dependente'] },
        condicaoSaude: { type: 'string', title: 'Condição de Saúde', maxLength: 1000, widget: 'textarea' },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', maxLength: 1000, widget: 'textarea' },
        temFamilia: { type: 'boolean', title: 'Possui Família?' },
        descricaoSituacaoFamiliar: { type: 'string', title: 'Descrição da Situação Familiar', maxLength: 500, widget: 'textarea' },
        urgente: { type: 'boolean', title: 'Caso Urgente (abandono, risco)?' }
      },
      required: ['idadeIdoso', 'grauDependencia', 'condicaoSaude', 'motivoSolicitacao', 'temFamilia']
    }
  },

  {
    name: 'Atendimento CRAS',
    description: 'Solicitação de atendimento no Centro de Referência de Assistência Social',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'ATENDIMENTO_CRAS_GERAL',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 4,
    category: 'Atendimento',
    icon: 'Users',
    color: '#be123c',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        tipoAtendimento: { type: 'string', title: 'Tipo de Atendimento', enum: ['Cadastro CadÚnico', 'Orientação sobre Benefícios', 'Participação em Grupo/Oficina', 'Acompanhamento Familiar', 'Outro'] },
        motivoAtendimento: { type: 'string', title: 'Motivo do Atendimento', maxLength: 500, widget: 'textarea' },
        dataPreferencial: { type: 'string', title: 'Data Preferencial (opcional)', format: 'date' },
        turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Qualquer'] }
      },
      required: ['tipoAtendimento', 'motivoAtendimento', 'turnoPreferencial']
    }
  },

  {
    name: 'Programa Primeira Infância',
    description: 'Inscrição em programa de apoio à primeira infância (0-6 anos)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'PROGRAMA_PRIMEIRA_INFANCIA',
    requiresDocuments: true,
    requiredDocuments: ['Certidão de Nascimento da Criança', 'CPF dos Pais', 'Comprovante de Residência', 'Cartão de Vacina'],
    estimatedDays: 10,
    priority: 4,
    category: 'Programas',
    icon: 'Baby',
    color: '#db2777',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeCrianca: { type: 'string', title: 'Nome da Criança', maxLength: 200 },
        dataNascimentoCrianca: { type: 'string', title: 'Data de Nascimento da Criança', format: 'date' },
        idadeMeses: { type: 'integer', title: 'Idade em Meses', minimum: 0, maximum: 72 },
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantidade de Pessoas na Família', minimum: 1, maximum: 30 },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        criancaFrequentaCreche: { type: 'boolean', title: 'Criança Frequenta Creche/Escola?' },
        interesseAtividades: { type: 'string', title: 'Interesse em Atividades', enum: ['Apoio Nutricional', 'Acompanhamento Pedagógico', 'Apoio Psicossocial', 'Todas as Opções'] }
      },
      required: ['nomeCrianca', 'dataNascimentoCrianca', 'idadeMeses', 'quantidadePessoasFamilia', 'rendaFamiliarMensal', 'interesseAtividades']
    }
  },

  {
    name: 'Documentação Civil Gratuita',
    description: 'Solicitação de auxílio para emissão de documentos civis (RG, CPF, Certidão)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DOCUMENTACAO_CIVIL',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 3,
    category: 'Documentação',
    icon: 'FileText',
    color: '#0369a1',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        tipoDocumento: { type: 'string', title: 'Tipo de Documento', enum: ['RG (Primeira Via)', 'RG (Segunda Via)', 'CPF', 'Certidão de Nascimento', 'Certidão de Casamento', 'Carteira de Trabalho', 'Outro'] },
        nomeCompleto: { type: 'string', title: 'Nome Completo', maxLength: 200 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', maxLength: 500, widget: 'textarea' },
        situacaoVulnerabilidade: { type: 'boolean', title: 'Situação de Vulnerabilidade Social?' }
      },
      required: ['tipoDocumento', 'nomeCompleto', 'motivoSolicitacao']
    }
  },

  {
    name: 'Benefício Eventual',
    description: 'Solicitação de benefício eventual (auxílio natalidade, funeral, calamidade)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'BENEFICIO_EVENTUAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Documentos Comprobatórios (dependendo do tipo)'],
    estimatedDays: 5,
    priority: 5,
    category: 'Benefícios',
    icon: 'HandCoins',
    color: '#b91c1c',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoBeneficio: { type: 'string', title: 'Tipo de Benefício', enum: ['Auxílio Natalidade', 'Auxílio Funeral', 'Auxílio por Calamidade (incêndio, enchente)', 'Auxílio Vulnerabilidade Temporária', 'Outro'] },
        descricaoSituacao: { type: 'string', title: 'Descrição da Situação', maxLength: 1000, widget: 'textarea' },
        dataSituacao: { type: 'string', title: 'Data da Situação/Ocorrência', format: 'date' },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        valorSolicitado: { type: 'number', title: 'Valor Estimado Solicitado (R$)', minimum: 0 },
        urgente: { type: 'boolean', title: 'Caso Urgente?' }
      },
      required: ['tipoBeneficio', 'descricaoSituacao', 'dataSituacao', 'rendaFamiliarMensal']
    }
  },

  {
    name: 'Solicitação de Tarifa Social de Energia',
    description: 'Solicitação de inscrição na tarifa social de energia elétrica',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'TARIFA_SOCIAL_ENERGIA',
    requiresDocuments: true,
    requiredDocuments: ['CadÚnico', 'CPF', 'Conta de Luz', 'Comprovante de Renda'],
    estimatedDays: 10,
    priority: 3,
    category: 'Benefícios',
    icon: 'Zap',
    color: '#ca8a04',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        nisCadUnico: { type: 'string', title: 'NIS do CadÚnico', pattern: '^\\d{11}$', maxLength: 11 },
        numeroInstalacao: { type: 'string', title: 'Número da Instalação (Conta de Luz)', maxLength: 50 },
        nomeConstaNaConta: { type: 'string', title: 'Nome que Consta na Conta', maxLength: 200 },
        quantidadePessoasFamilia: { type: 'integer', title: 'Quantidade de Pessoas na Família', minimum: 1, maximum: 30 },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        jaRecebeTarifaSocial: { type: 'boolean', title: 'Já Recebe Tarifa Social?' }
      },
      required: ['nisCadUnico', 'numeroInstalacao', 'nomeConstaNaConta', 'quantidadePessoasFamilia', 'rendaFamiliarMensal']
    }
  },

  {
    name: 'Isenção de Tarifa de Transporte',
    description: 'Solicitação de isenção ou desconto na tarifa de transporte público',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ISENCAO_TRANSPORTE',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Residência', 'Laudo Médico (se for por deficiência)', 'Comprovante de Renda'],
    estimatedDays: 15,
    priority: 3,
    category: 'Benefícios',
    icon: 'TicketPercent',
    color: '#047857',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        motivoIsencao: { type: 'string', title: 'Motivo da Isenção', enum: ['Idoso (60+ anos)', 'Pessoa com Deficiência', 'Estudante de Baixa Renda', 'Desempregado', 'Tratamento Médico', 'Outro'] },
        descricaoMotivo: { type: 'string', title: 'Descrição do Motivo', maxLength: 500, widget: 'textarea' },
        rendaFamiliarMensal: { type: 'number', title: 'Renda Familiar Mensal (R$)', minimum: 0 },
        tipoPasseDesejado: { type: 'string', title: 'Tipo de Passe Desejado', enum: ['Gratuito', 'Meia Tarifa', 'Desconto Especial'] },
        necessitaAcompanhante: { type: 'boolean', title: 'Necessita Acompanhante? (PCD)' }
      },
      required: ['motivoIsencao', 'descricaoMotivo', 'rendaFamiliarMensal', 'tipoPasseDesejado']
    }
  },

  // ========== SEM_DADOS (6) ==========

  {
    name: 'Certidão de CadÚnico',
    description: 'Emissão de certidão de inscrição no Cadastro Único (usa dados do perfil do cidadão)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
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
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 15,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#dc2626'
  },

  {
    name: 'Consulta de Benefícios Ativos',
    description: 'Consulta de benefícios sociais ativos do cidadão (usa dados do perfil)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Search',
    color: '#dc2626'
  },

  {
    name: 'Declaração de Atendimento Social',
    description: 'Emissão de declaração de atendimento no CRAS/CREAS (usa dados do perfil)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 2,
    category: 'Declarações',
    icon: 'FileSignature',
    color: '#dc2626'
  },

  {
    name: 'Relatório de Acompanhamento Familiar',
    description: 'Emissão de relatório de acompanhamento familiar (usa dados do perfil)',
    departmentCode: 'ASSISTENCIA_SOCIAL',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 7,
    priority: 3,
    category: 'Relatórios',
    icon: 'FileSpreadsheet',
    color: '#dc2626'
  }
];
