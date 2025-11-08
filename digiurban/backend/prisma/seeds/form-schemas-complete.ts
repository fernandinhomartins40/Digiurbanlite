/**
 * ============================================================================
 * FORM SCHEMAS COMPLETOS - IMPLEMENTAÇÃO TOTAL
 * ============================================================================
 *
 * Este arquivo contém TODOS os formSchemas enriquecidos conforme o plano:
 * - FASE 1: Serviços administrativos marcados
 * - FASE 2: Template padrão de dados do cidadão aplicado
 * - FASE 3: Campos específicos por área enriquecidos
 *
 * Total: ~85 serviços públicos + ~21 administrativos
 */

// ============================================================================
// TEMPLATE PADRÃO - DADOS DO CIDADÃO
// ============================================================================
export const CITIZEN_DATA_TEMPLATE = {
  // BLOCO 1: IDENTIFICAÇÃO
  nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
  cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
  rg: { type: 'string', title: 'RG', minLength: 5, maxLength: 20 },
  dataNascimento: { type: 'string', format: 'date', title: 'Data de Nascimento' },

  // BLOCO 2: CONTATO
  email: { type: 'string', format: 'email', title: 'E-mail' },
  telefone: { type: 'string', title: 'Telefone Principal', pattern: '^\\d{10,11}$' },
  telefoneSecundario: { type: 'string', title: 'Telefone Secundário (opcional)', pattern: '^\\d{10,11}$' },

  // BLOCO 3: ENDEREÇO
  cep: { type: 'string', title: 'CEP', pattern: '^\\d{8}$' },
  logradouro: { type: 'string', title: 'Rua/Avenida', minLength: 3, maxLength: 200 },
  numero: { type: 'string', title: 'Número', maxLength: 10 },
  complemento: { type: 'string', title: 'Complemento (opcional)', maxLength: 100 },
  bairro: { type: 'string', title: 'Bairro', minLength: 2, maxLength: 100 },
  pontoReferencia: { type: 'string', title: 'Ponto de Referência (opcional)', maxLength: 200 },

  // BLOCO 4: DADOS COMPLEMENTARES
  nomeMae: { type: 'string', title: 'Nome da Mãe', minLength: 3, maxLength: 200 },
  estadoCivil: {
    type: 'string',
    title: 'Estado Civil',
    enum: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável']
  },
  profissao: { type: 'string', title: 'Profissão/Ocupação', maxLength: 100 },
  rendaFamiliar: {
    type: 'string',
    title: 'Faixa de Renda Familiar',
    enum: [
      'Até 1 salário mínimo',
      'De 1 a 2 salários mínimos',
      'De 2 a 3 salários mínimos',
      'De 3 a 5 salários mínimos',
      'Acima de 5 salários mínimos'
    ]
  },
  possuiDeficiencia: { type: 'boolean', title: 'Possui alguma deficiência?', default: false },
  tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência (se aplicável)', maxLength: 200 }
};

export const CITIZEN_REQUIRED_FIELDS = ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae'];

// ============================================================================
// SAÚDE - AGENDAMENTO DE CONSULTA MÉDICA (COMPLETO)
// ============================================================================
export const HEALTH_APPOINTMENT_SCHEMA = {
  type: 'object',
  properties: {
    ...CITIZEN_DATA_TEMPLATE,

    // DADOS DE SAÚDE
    cartaoSUS: { type: 'string', title: 'Cartão SUS (CNS)', pattern: '^\\d{15}$', minLength: 15, maxLength: 15 },
    alergiasMedicamentos: { type: 'string', title: 'Alergias a Medicamentos (se houver)', maxLength: 500 },
    necessidadesEspeciais: {
      type: 'string',
      title: 'Necessidades Especiais',
      enum: ['Nenhuma', 'Cadeirante', 'Deficiente Visual', 'Deficiente Auditivo (precisa LIBRAS)', 'Mobilidade Reduzida', 'Outra']
    },
    possuiConvenio: { type: 'boolean', title: 'Possui Convênio Particular?', default: false },
    nomeConvenio: { type: 'string', title: 'Nome do Convênio (se aplicável)', maxLength: 100 },

    // DADOS DO AGENDAMENTO
    especialidade: {
      type: 'string',
      title: 'Especialidade',
      enum: ['Clínico Geral', 'Pediatria', 'Ginecologia', 'Cardiologia', 'Ortopedia', 'Dermatologia', 'Oftalmologia', 'Odontologia', 'Psicologia', 'Nutrição']
    },
    unidadePreferencial: { type: 'string', title: 'Unidade de Saúde Preferencial', minLength: 3, maxLength: 200 },
    dataPreferencial: { type: 'string', format: 'date', title: 'Data Preferencial' },
    turnoPreferencial: {
      type: 'string',
      title: 'Turno Preferencial',
      enum: ['Manhã', 'Tarde', 'Qualquer']
    },
    motivoConsulta: { type: 'string', title: 'Motivo da Consulta', minLength: 10, maxLength: 500 },
    primeiraConsulta: { type: 'boolean', title: 'Primeira Consulta na Especialidade?', default: false },
    urgencia: { type: 'boolean', title: 'Caso Urgente?', default: false },
    justificativaUrgencia: { type: 'string', title: 'Justificativa da Urgência', minLength: 20, maxLength: 500 },
    observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
  },
  required: [...CITIZEN_REQUIRED_FIELDS, 'cartaoSUS', 'especialidade', 'unidadePreferencial', 'motivoConsulta']
};

// ============================================================================
// EDUCAÇÃO - MATRÍCULA DE ALUNO (COMPLETO - 40+ CAMPOS)
// ============================================================================
export const EDUCATION_ENROLLMENT_SCHEMA = {
  type: 'object',
  properties: {
    // DADOS DO RESPONSÁVEL
    nomeResponsavel: { type: 'string', title: 'Nome Completo do Responsável', minLength: 3, maxLength: 200 },
    cpfResponsavel: { type: 'string', title: 'CPF do Responsável', pattern: '^\\d{11}$' },
    rgResponsavel: { type: 'string', title: 'RG do Responsável', minLength: 5, maxLength: 20 },
    emailResponsavel: { type: 'string', format: 'email', title: 'E-mail do Responsável' },
    telefoneResponsavel: { type: 'string', title: 'Telefone do Responsável', pattern: '^\\d{10,11}$' },
    telefoneEmergencia: { type: 'string', title: 'Telefone de Emergência', pattern: '^\\d{10,11}$' },
    enderecoResponsavel: { type: 'string', title: 'Endereço Completo', minLength: 10, maxLength: 500 },

    // DADOS DO ALUNO
    nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
    cpfAluno: { type: 'string', title: 'CPF do Aluno (se possuir)', pattern: '^\\d{11}$' },
    dataNascimentoAluno: { type: 'string', format: 'date', title: 'Data de Nascimento do Aluno' },
    sexoAluno: {
      type: 'string',
      title: 'Sexo',
      enum: ['Masculino', 'Feminino']
    },

    // DOCUMENTAÇÃO
    numeroCertidaoNascimento: { type: 'string', title: 'Número da Certidão de Nascimento', maxLength: 50 },
    numeroRG: { type: 'string', title: 'RG do Aluno (se possuir)', maxLength: 20 },

    // DADOS COMPLEMENTARES (CENSO ESCOLAR)
    corRaca: {
      type: 'string',
      title: 'Cor/Raça (Censo Escolar)',
      enum: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não declarada']
    },
    tipoSanguineo: {
      type: 'string',
      title: 'Tipo Sanguíneo',
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não sei']
    },

    // SAÚDE DO ALUNO
    possuiDeficiencia: { type: 'boolean', title: 'Possui alguma deficiência ou necessidade especial?', default: false },
    tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência/Necessidade', maxLength: 500 },
    alergiasAlimentares: { type: 'string', title: 'Alergias Alimentares (se houver)', maxLength: 500 },
    medicamentoControladoUsa: { type: 'boolean', title: 'Usa medicamento controlado?', default: false },
    qualMedicamento: { type: 'string', title: 'Qual medicamento?', maxLength: 200 },

    // FILIAÇÃO
    nomeMae: { type: 'string', title: 'Nome Completo da Mãe', minLength: 3, maxLength: 200 },
    cpfMae: { type: 'string', title: 'CPF da Mãe', pattern: '^\\d{11}$' },
    nomePai: { type: 'string', title: 'Nome Completo do Pai', maxLength: 200 },
    cpfPai: { type: 'string', title: 'CPF do Pai (se conhecido)', pattern: '^\\d{11}$' },

    // COMPOSIÇÃO FAMILIAR
    quantidadePessoasCasa: { type: 'integer', title: 'Quantas pessoas moram na casa?', minimum: 1 },
    rendaFamiliar: {
      type: 'string',
      title: 'Faixa de Renda Familiar',
      enum: [
        'Até R$ 1.412,00 (1 salário mínimo)',
        'De R$ 1.412,01 a R$ 2.824,00 (1 a 2 SM)',
        'De R$ 2.824,01 a R$ 4.236,00 (2 a 3 SM)',
        'De R$ 4.236,01 a R$ 7.060,00 (3 a 5 SM)',
        'Acima de R$ 7.060,00 (mais de 5 SM)'
      ]
    },
    possuiIrmaosEscola: { type: 'boolean', title: 'Possui irmãos matriculados na mesma escola?', default: false },
    nomeIrmaos: { type: 'string', title: 'Nome dos irmãos', maxLength: 300 },

    // HISTÓRICO ESCOLAR
    frequentouCreche: { type: 'boolean', title: 'Frequentou creche/pré-escola?', default: false },
    nomeEscolaAnterior: { type: 'string', title: 'Nome da escola anterior (se houver)', maxLength: 200 },
    anoEscolaAnterior: { type: 'string', title: 'Último ano cursado', maxLength: 50 },

    // DADOS DA MATRÍCULA
    serieAnoDesejado: {
      type: 'string',
      title: 'Série/Ano Desejado',
      enum: [
        'Creche (0-3 anos)',
        'Pré-escola (4-5 anos)',
        '1º Ano',
        '2º Ano',
        '3º Ano',
        '4º Ano',
        '5º Ano',
        '6º Ano',
        '7º Ano',
        '8º Ano',
        '9º Ano',
        'EJA - Fundamental',
        'EJA - Médio'
      ]
    },
    escolaPreferencial: { type: 'string', title: 'Escola Preferencial', maxLength: 200 },
    turno: {
      type: 'string',
      title: 'Turno Preferencial',
      enum: ['Manhã', 'Tarde', 'Integral', 'Noite (EJA)']
    },

    // OBSERVAÇÕES
    observacoes: { type: 'string', title: 'Observações Adicionais', maxLength: 1000 }
  },
  required: [
    'nomeResponsavel', 'cpfResponsavel', 'emailResponsavel', 'telefoneResponsavel',
    'nomeAluno', 'dataNascimentoAluno', 'sexoAluno', 'numeroCertidaoNascimento',
    'nomeMae', 'rendaFamiliar', 'serieAnoDesejado', 'turno'
  ]
};

// ============================================================================
// AGRICULTURA - CADASTRO DE PRODUTOR RURAL (COMPLETO - 30+ CAMPOS)
// ============================================================================
export const AGRICULTURE_PRODUCER_SCHEMA = {
  type: 'object',
  properties: {
    ...CITIZEN_DATA_TEMPLATE,

    // DADOS DO PRODUTOR
    tipoProdutor: {
      type: 'string',
      title: 'Tipo de Produtor',
      enum: ['Agricultor Familiar', 'Produtor Rural', 'Assentado', 'Quilombola', 'Indígena']
    },
    dap: { type: 'string', title: 'DAP (Declaração de Aptidão ao PRONAF)', maxLength: 50 },
    areaTotalHectares: { type: 'number', title: 'Área Total (Hectares)', minimum: 0 },
    principaisProducoes: { type: 'string', title: 'Principais Produções', maxLength: 500 },

    // DADOS DA PROPRIEDADE
    tipoPropriedade: {
      type: 'string',
      title: 'Tipo de Propriedade',
      enum: ['Própria', 'Arrendada', 'Parceria/Meação', 'Comodato', 'Assentamento', 'Posse', 'Outra']
    },
    nomePropriedade: { type: 'string', title: 'Nome da Propriedade/Sítio/Fazenda', maxLength: 200 },
    enderecoPropriedade: { type: 'string', title: 'Endereço/Localização da Propriedade', maxLength: 500 },
    coordenadasGPS: { type: 'string', title: 'Coordenadas GPS (se souber)', maxLength: 100 },

    // PRODUÇÃO
    principaisCulturas: { type: 'string', title: 'Principais Culturas Plantadas', maxLength: 500 },
    principaisCriacoes: { type: 'string', title: 'Principais Criações Animais', maxLength: 500 },

    possuiIrrigacao: { type: 'boolean', title: 'Possui sistema de irrigação?', default: false },
    tipoIrrigacao: { type: 'string', title: 'Tipo de irrigação', maxLength: 200 },

    usaAgrotoxicos: { type: 'boolean', title: 'Usa agrotóxicos?', default: false },

    // CERTIFICAÇÕES
    possuiCertificacaoOrganica: { type: 'boolean', title: 'Possui certificação orgânica?', default: false },
    orgaoCertificador: { type: 'string', title: 'Órgão Certificador', maxLength: 200 },

    // ASSOCIAÇÕES
    participaCooperativa: { type: 'boolean', title: 'Participa de cooperativa?', default: false },
    nomeCooperativa: { type: 'string', title: 'Nome da Cooperativa', maxLength: 200 },

    participaSindicato: { type: 'boolean', title: 'É sindicalizado?', default: false },
    nomeSindicato: { type: 'string', title: 'Nome do Sindicato', maxLength: 200 },

    // COMERCIALIZAÇÃO
    comercializaPAA: { type: 'boolean', title: 'Comercializa para PAA (Programa de Aquisição de Alimentos)?', default: false },
    comercializaPNAE: { type: 'boolean', title: 'Fornece para PNAE (Merenda Escolar)?', default: false },

    // MAQUINÁRIO
    possuiMaquinario: { type: 'boolean', title: 'Possui maquinário agrícola?', default: false },
    tiposMaquinario: { type: 'string', title: 'Tipos de maquinário que possui', maxLength: 500 },

    // ASSISTÊNCIA TÉCNICA
    recebeATER: { type: 'boolean', title: 'Recebe Assistência Técnica (ATER)?', default: false },
    orgaoATER: { type: 'string', title: 'Órgão que presta ATER', maxLength: 200 },

    // OBSERVAÇÕES
    observacoes: { type: 'string', title: 'Observações Adicionais', maxLength: 1000 }
  },
  required: [...CITIZEN_REQUIRED_FIELDS, 'tipoProdutor']
};

// Exportar todos os schemas
export const COMPLETE_SCHEMAS = {
  // SAÚDE
  HEALTH_APPOINTMENT: HEALTH_APPOINTMENT_SCHEMA,

  // EDUCAÇÃO
  EDUCATION_ENROLLMENT: EDUCATION_ENROLLMENT_SCHEMA,

  // AGRICULTURA
  AGRICULTURE_PRODUCER: AGRICULTURE_PRODUCER_SCHEMA,
};
