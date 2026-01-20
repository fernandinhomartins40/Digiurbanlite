/**
 * SEED DE SERVIÇOS - SECRETARIA DE MOBILIDADE URBANA
 * Total: 15 serviços (8 CAPTURA_COMPLETA + 4 SOLICITACAO_SIMPLES + 3 CONSULTIVO)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const urbanMobilityServices: ServiceDefinition[] = [
  // ========== COM_DADOS - CAPTURA_COMPLETA (8) ==========

  {
    name: 'Solicitação de Cartão Transporte',
    description: 'Solicite cartão de transporte público municipal',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CARTAO_TRANSPORTE',
    requiresDocuments: true,
    requiredDocuments: ['RG ou CPF', 'Foto 3x4 recente', 'Comprovante de Residência'],
    estimatedDays: 10,
    priority: 5,
    category: 'Cartões',
    icon: 'CreditCard',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoCartao: { type: 'string', title: 'Tipo de Cartão', enum: ['Comum', 'Estudante', 'Idoso', 'Pessoa com Deficiência', 'Trabalhador'] },
        localRetirada: { type: 'string', title: 'Local Preferencial para Retirada', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['tipoCartao']
    }
  },

  {
    name: 'Passe Livre Interestadual (PCD)',
    description: 'Solicite passe livre para viagens interestaduais (pessoas com deficiência)',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'PASSE_LIVRE_INTERESTADUAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Laudo Médico (modelo específico)', 'Foto 3x4 recente', 'Comprovante de Residência', 'Declaração de Renda'],
    estimatedDays: 30,
    priority: 5,
    category: 'Benefícios',
    icon: 'Ticket',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_familyincome'],
      properties: {
        tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência', enum: ['Física', 'Visual', 'Auditiva', 'Mental', 'Múltipla'] },
        necessitaAcompanhante: { type: 'boolean', title: 'Necessita Acompanhante' },
        cid: { type: 'string', title: 'CID-10 do Laudo Médico', maxLength: 10 },
        dataLaudo: { type: 'string', title: 'Data do Laudo Médico', format: 'date' },
        medicoResponsavel: { type: 'string', title: 'Médico Responsável (Nome e CRM)', maxLength: 200 },
        rendaMensal: { type: 'number', title: 'Renda Mensal per Capita (R$)', minimum: 0 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoDeficiencia', 'necessitaAcompanhante', 'cid', 'dataLaudo', 'medicoResponsavel', 'rendaMensal']
    }
  },

  {
    name: 'Isenção de Tarifa para Idosos',
    description: 'Solicite isenção de tarifa de transporte público para idosos acima de 60 anos',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ISENCAO_IDOSO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Foto 3x4 recente', 'Comprovante de Residência'],
    estimatedDays: 7,
    priority: 5,
    category: 'Benefícios',
    icon: 'Users',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        idade: { type: 'integer', title: 'Idade', minimum: 60, maximum: 120 },
        localRetiradaCartao: { type: 'string', title: 'Local Preferencial para Retirada do Cartão', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 300, widget: 'textarea' }
      },
      required: ['idade']
    }
  },

  {
    name: 'Cartão Transporte para Pessoa com Deficiência',
    description: 'Solicite cartão de transporte gratuito para pessoas com deficiência',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CARTAO_PCD',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Laudo Médico', 'Foto 3x4 recente', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 5,
    category: 'Benefícios',
    icon: 'Heart',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência', enum: ['Física', 'Visual', 'Auditiva', 'Intelectual', 'Múltipla', 'Transtorno do Espectro Autista'] },
        cid: { type: 'string', title: 'CID-10 do Laudo Médico', maxLength: 10 },
        dataLaudo: { type: 'string', title: 'Data do Laudo Médico', format: 'date' },
        medicoResponsavel: { type: 'string', title: 'Médico Responsável (Nome e CRM)', maxLength: 200 },
        necessitaAcompanhante: { type: 'boolean', title: 'Necessita Acompanhante no Transporte' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoDeficiencia', 'cid', 'dataLaudo', 'medicoResponsavel', 'necessitaAcompanhante']
    }
  },

  {
    name: 'Cartão Estudante (Meia Passagem)',
    description: 'Solicite cartão estudante para meia passagem no transporte público',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CARTAO_ESTUDANTE',
    requiresDocuments: true,
    requiredDocuments: ['RG ou CPF', 'Declaração de Matrícula', 'Foto 3x4 recente', 'Comprovante de Residência'],
    estimatedDays: 10,
    priority: 5,
    category: 'Benefícios',
    icon: 'GraduationCap',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        instituicaoEnsino: { type: 'string', title: 'Nome da Instituição de Ensino', maxLength: 200 },
        nivelEnsino: { type: 'string', title: 'Nível de Ensino', enum: ['Fundamental', 'Médio', 'Técnico', 'Superior', 'Pós-Graduação'] },
        turno: { type: 'string', title: 'Turno', enum: ['Matutino', 'Vespertino', 'Noturno', 'Integral'] },
        curso: { type: 'string', title: 'Curso', maxLength: 200 },
        anoSerie: { type: 'string', title: 'Ano/Série/Período', maxLength: 50 },
        localRetiradaCartao: { type: 'string', title: 'Local Preferencial para Retirada do Cartão', maxLength: 200 }
      },
      required: ['instituicaoEnsino', 'nivelEnsino', 'turno', 'curso', 'anoSerie']
    }
  },

  {
    name: 'Solicitação de Vaga Especial para PCD',
    description: 'Solicite vaga de estacionamento especial para pessoa com deficiência',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'VAGA_ESPECIAL_PCD',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'CNH (se condutor)', 'Laudo Médico', 'Documento do Veículo', 'Comprovante de Residência'],
    estimatedDays: 20,
    priority: 4,
    category: 'Estacionamento',
    icon: 'Car',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência', enum: ['Física', 'Visual', 'Mobilidade Reduzida', 'Outra'] },
        cid: { type: 'string', title: 'CID-10 do Laudo Médico', maxLength: 10 },
        condutor: { type: 'boolean', title: 'É o Condutor do Veículo' },
        placaVeiculo: { type: 'string', title: 'Placa do Veículo', pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', maxLength: 7 },
        modeloVeiculo: { type: 'string', title: 'Modelo do Veículo', maxLength: 100 },
        localVaga: { type: 'string', title: 'Local Desejado para a Vaga (Endereço)', maxLength: 300 },
        justificativa: { type: 'string', title: 'Justificativa da Necessidade', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoDeficiencia', 'cid', 'condutor', 'placaVeiculo', 'modeloVeiculo', 'localVaga', 'justificativa']
    }
  },

  {
    name: 'Autorização para Transporte Escolar',
    description: 'Solicite autorização para operação de transporte escolar',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AUTORIZACAO_TRANSPORTE_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['CNH categoria D ou superior', 'Certidão de Antecedentes Criminais', 'Documento do Veículo', 'Vistoria do Veículo', 'Seguro do Veículo'],
    estimatedDays: 30,
    priority: 4,
    category: 'Autorizações',
    icon: 'Bus',
    color: '#eab308',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        cnpj: { type: 'string', title: 'CNPJ (se empresa)', maxLength: 14 },
        cnhNumero: { type: 'string', title: 'Número da CNH', maxLength: 20 },
        cnhCategoria: { type: 'string', title: 'Categoria da CNH', enum: ['D', 'E'] },
        placaVeiculo: { type: 'string', title: 'Placa do Veículo', pattern: '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$', maxLength: 7 },
        modeloVeiculo: { type: 'string', title: 'Modelo do Veículo', maxLength: 100 },
        anoVeiculo: { type: 'integer', title: 'Ano do Veículo', minimum: 2000, maximum: 2030 },
        capacidadePassageiros: { type: 'integer', title: 'Capacidade de Passageiros', minimum: 1, maximum: 100 },
        rotaPretendida: { type: 'string', title: 'Rota Pretendida', maxLength: 500, widget: 'textarea' }
      },
      required: ['cnhNumero', 'cnhCategoria', 'placaVeiculo', 'modeloVeiculo', 'anoVeiculo', 'capacidadePassageiros', 'rotaPretendida']
    }
  },

  {
    name: 'Solicitação de Transporte Escolar Gratuito',
    description: 'Solicite transporte escolar gratuito para estudante da rede pública',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'TRANSPORTE_ESCOLAR_GRATUITO',
    requiresDocuments: true,
    requiredDocuments: ['RG ou Certidão de Nascimento', 'CPF', 'Declaração de Matrícula', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 5,
    category: 'Transporte Escolar',
    icon: 'School',
    color: '#14b8a6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome do Aluno', maxLength: 200 },
        cpfAluno: { type: 'string', title: 'CPF do Aluno', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
        escola: { type: 'string', title: 'Nome da Escola', maxLength: 200 },
        nivelEnsino: { type: 'string', title: 'Nível de Ensino', enum: ['Educação Infantil', 'Ensino Fundamental', 'Ensino Médio'] },
        turno: { type: 'string', title: 'Turno', enum: ['Matutino', 'Vespertino', 'Noturno', 'Integral'] },
        distanciaEscola: { type: 'number', title: 'Distância da Residência até a Escola (km)', minimum: 0 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais (se houver)', maxLength: 300, widget: 'textarea' }
      },
      required: ['nomeAluno', 'cpfAluno', 'escola', 'nivelEnsino', 'turno', 'distanciaEscola']
    }
  },

  // ========== COM_DADOS - SOLICITACAO_SIMPLES (4) ==========

  {
    name: 'Reclamação sobre Transporte Público',
    description: 'Registre reclamação sobre ônibus, motorista ou condições de transporte',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'RECLAMACAO_TRANSPORTE',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Reclamações',
    icon: 'AlertCircle',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoReclamacao: { type: 'string', title: 'Tipo de Reclamação', enum: ['Atraso/Não Comparecimento', 'Motorista/Cobrador', 'Condições do Veículo', 'Superlotação', 'Outra'] },
        linha: { type: 'string', title: 'Número/Nome da Linha', maxLength: 100 },
        dataOcorrencia: { type: 'string', title: 'Data da Ocorrência', format: 'date' },
        horarioOcorrencia: { type: 'string', title: 'Horário da Ocorrência', maxLength: 10 },
        descricao: { type: 'string', title: 'Descrição da Reclamação', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoReclamacao', 'linha', 'dataOcorrencia', 'descricao']
    }
  },

  {
    name: 'Sugestão de Nova Linha de Ônibus',
    description: 'Sugira criação ou alteração de linha de transporte público',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SUGESTAO_LINHA',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 2,
    category: 'Sugestões',
    icon: 'MapPin',
    color: '#22c55e',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoSugestao: { type: 'string', title: 'Tipo de Sugestão', enum: ['Nova Linha', 'Alteração de Itinerário', 'Novo Horário', 'Novo Ponto de Parada'] },
        bairroOrigem: { type: 'string', title: 'Bairro de Origem', maxLength: 100 },
        bairroDestino: { type: 'string', title: 'Bairro de Destino', maxLength: 100 },
        justificativa: { type: 'string', title: 'Justificativa da Necessidade', maxLength: 500, widget: 'textarea' },
        descricaoSugestao: { type: 'string', title: 'Descrição Detalhada da Sugestão', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoSugestao', 'justificativa', 'descricaoSugestao']
    }
  },

  {
    name: 'Solicitação de Ponto de Ônibus',
    description: 'Solicite instalação ou manutenção de ponto de ônibus',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'SOLICITACAO_PONTO_ONIBUS',
    requiresDocuments: false,
    estimatedDays: 20,
    priority: 3,
    category: 'Infraestrutura',
    icon: 'MapPin',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Novo Ponto de Ônibus', 'Manutenção/Reparo', 'Cobertura', 'Sinalização'] },
        endereco: { type: 'string', title: 'Endereço do Local', maxLength: 300 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        justificativa: { type: 'string', title: 'Justificativa', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoSolicitacao', 'endereco', 'justificativa']
    }
  },

  {
    name: 'Denúncia de Transporte Clandestino',
    description: 'Denuncie transporte irregular ou clandestino',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_TRANSPORTE_CLANDESTINO',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 4,
    category: 'Denúncias',
    icon: 'AlertTriangle',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        tipoVeiculo: { type: 'string', title: 'Tipo de Veículo', enum: ['Van', 'Ônibus', 'Automóvel', 'Outro'] },
        placaVeiculo: { type: 'string', title: 'Placa do Veículo (se souber)', maxLength: 7 },
        localAtividade: { type: 'string', title: 'Local onde Atua', maxLength: 300 },
        descricao: { type: 'string', title: 'Descrição da Irregularidade', maxLength: 500, widget: 'textarea' },
        denunciaAnonima: { type: 'boolean', title: 'Desejo fazer denúncia anônima' }
      },
      required: ['tipoVeiculo', 'localAtividade', 'descricao']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (3) ==========

  {
    name: 'Consulta de Horários de Ônibus',
    description: 'Consulte horários de todas as linhas de ônibus',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Clock',
    color: '#3b82f6'
  },

  {
    name: 'Consulta de Itinerários',
    description: 'Consulte itinerários e rotas das linhas de ônibus',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Consultas',
    icon: 'Map',
    color: '#10b981'
  },

  {
    name: 'Informações sobre Tarifas',
    description: 'Consulte valores de tarifas e descontos do transporte público',
    departmentCode: 'MOBILIDADE_URBANA',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consultas',
    icon: 'DollarSign',
    color: '#f59e0b'
  }
];
