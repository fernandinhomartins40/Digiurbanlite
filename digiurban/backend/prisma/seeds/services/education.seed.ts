/**
 * SEED DE SERVIÇOS - SECRETARIA DE EDUCAÇÃO
 * Total: 20 serviços (14 COM_DADOS + 6 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const educationServices: ServiceDefinition[] = [
  // ========== COM_DADOS (14) ==========

  {
    name: 'Matrícula Escolar',
    description: 'Solicitação de matrícula e rematrícula em escolas municipais',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'MATRICULA_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Certidão de Nascimento', 'RG do Responsável', 'Comprovante de Residência', 'Cartão de Vacina'],
    estimatedDays: 7,
    priority: 5,
    category: 'Matrícula',
    icon: 'GraduationCap',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        dataNascimentoAluno: { type: 'string', title: 'Data de Nascimento do Aluno', format: 'date' },
        sexoAluno: { type: 'string', title: 'Sexo do Aluno', enum: ['Masculino', 'Feminino'] },
        grauParentesco: { type: 'string', title: 'Grau de Parentesco', enum: ['Pai', 'Mãe', 'Avô/Avó', 'Tio(a)', 'Irmão(ã)', 'Tutor Legal', 'Outro'] },
        escolaPreferencial: { type: 'string', title: 'Escola Preferencial', maxLength: 200 },
        nivelEnsino: { type: 'string', title: 'Nível de Ensino', enum: ['Creche (0-3 anos)', 'Pré-Escola (4-5 anos)', 'Fundamental I (1º ao 5º)', 'Fundamental II (6º ao 9º)', 'EJA'] },
        turnoDesejado: { type: 'string', title: 'Turno Desejado', enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno'] },
        possuiNecessidadesEspeciais: { type: 'boolean', title: 'Possui Necessidades Especiais?' },
        descricaoNecessidades: { type: 'string', title: 'Descrição das Necessidades', maxLength: 500, widget: 'textarea' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeAluno', 'dataNascimentoAluno', 'sexoAluno', 'grauParentesco', 'escolaPreferencial', 'nivelEnsino', 'turnoDesejado']
    }
  },

  {
    name: 'Transferência Escolar',
    description: 'Solicitação de transferência entre escolas municipais',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'TRANSFERENCIA_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Histórico Escolar', 'Comprovante de Residência', 'Declaração de Transferência'],
    estimatedDays: 7,
    priority: 4,
    category: 'Transferência',
    icon: 'ArrowRightLeft',
    color: '#7c3aed',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        escolaOrigem: { type: 'string', title: 'Escola de Origem', maxLength: 200 },
        escolaDestino: { type: 'string', title: 'Escola de Destino', maxLength: 200 },
        anoAtual: { type: 'string', title: 'Ano Escolar Atual', maxLength: 50 },
        motivoTransferencia: { type: 'string', title: 'Motivo da Transferência', enum: ['Mudança de Endereço', 'Preferência de Turno', 'Proximidade', 'Outro'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeAluno', 'escolaOrigem', 'escolaDestino', 'anoAtual', 'motivoTransferencia']
    }
  },

  {
    name: 'Transporte Escolar',
    description: 'Solicitação de vaga em transporte escolar',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'TRANSPORTE_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Matrícula', 'Comprovante de Residência'],
    estimatedDays: 10,
    priority: 4,
    category: 'Transporte',
    icon: 'Bus',
    color: '#5b21b6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome do Aluno', minLength: 3, maxLength: 200 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', maxLength: 200 },
        serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
        turno: { type: 'string', title: 'Turno', enum: ['Matutino', 'Vespertino', 'Integral', 'Noturno'] },
        enderecoEmbarque: { type: 'string', title: 'Endereço de Embarque', minLength: 10, maxLength: 300 },
        distanciaEscola: { type: 'number', title: 'Distância até a Escola (km)', minimum: 0, maximum: 100 },
        necessitaVeiculoAdaptado: { type: 'boolean', title: 'Necessita Veículo Adaptado?' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeAluno', 'unidadeEscolar', 'serie', 'turno', 'enderecoEmbarque', 'distanciaEscola']
    }
  },

  {
    name: 'Inscrição em Cursos Livres',
    description: 'Inscrição em cursos de capacitação oferecidos pela secretaria',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'INSCRICAO_CURSO_LIVRE',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência'],
    estimatedDays: 3,
    priority: 3,
    category: 'Cursos',
    icon: 'BookOpen',
    color: '#4c1d95',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        cursoInteresse: { type: 'string', title: 'Curso de Interesse', enum: ['Informática Básica', 'Inglês', 'Artesanato', 'Culinária', 'Dança', 'Música', 'Teatro', 'Outro'] },
        nivelEscolaridade: { type: 'string', title: 'Nível de Escolaridade', enum: ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo'] },
        turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Manhã', 'Tarde', 'Noite', 'Qualquer'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['cursoInteresse', 'nivelEscolaridade', 'turnoPreferencial']
    }
  },

  {
    name: 'Solicitação de Documento Escolar',
    description: 'Solicitação de histórico, declaração ou certificado',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'Comprovante de Matrícula (se aplicável)'],
    estimatedDays: 5,
    priority: 3,
    category: 'Documentos',
    icon: 'FileText',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        vinculoComAluno: { type: 'string', title: 'Vínculo com o Aluno', enum: ['Próprio Aluno', 'Pai', 'Mãe', 'Avô/Avó', 'Tutor Legal', 'Outro'] },
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        dataNascimentoAluno: { type: 'string', title: 'Data de Nascimento do Aluno', format: 'date' },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
        tipoDocumento: { type: 'string', title: 'Tipo de Documento', enum: ['Histórico Escolar', 'Declaração de Matrícula', 'Declaração de Conclusão', 'Certificado de Conclusão', 'Boletim Escolar', 'Transferência', 'Outro'] },
        anoLetivo: { type: 'string', title: 'Ano Letivo', pattern: '^\\d{4}$' },
        finalidade: { type: 'string', title: 'Finalidade do Documento', minLength: 10, maxLength: 300 },
        formaEntrega: { type: 'string', title: 'Forma de Entrega', enum: ['Retirada Presencial', 'Correios', 'E-mail', 'Outra'] }
      },
      required: ['vinculoComAluno', 'nomeAluno', 'dataNascimentoAluno', 'unidadeEscolar', 'tipoDocumento', 'anoLetivo', 'finalidade', 'formaEntrega']
    }
  },

  {
    name: 'Consulta de Frequência e Notas',
    description: 'Consulta ao registro de frequência e notas do aluno',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CONSULTA_FREQUENCIA_NOTAS',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 2,
    category: 'Consulta',
    icon: 'ClipboardList',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        vinculoComAluno: { type: 'string', title: 'Vínculo com o Aluno', enum: ['Próprio Aluno', 'Pai', 'Mãe', 'Avô/Avó', 'Tutor Legal', 'Outro'] },
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        matricula: { type: 'string', title: 'Número da Matrícula', minLength: 5, maxLength: 50 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
        serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
        periodoConsulta: { type: 'string', title: 'Período da Consulta', enum: ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre', 'Ano Completo'] },
        anoLetivo: { type: 'string', title: 'Ano Letivo', pattern: '^\\d{4}$' }
      },
      required: ['vinculoComAluno', 'nomeAluno', 'matricula', 'unidadeEscolar', 'serie', 'periodoConsulta', 'anoLetivo']
    }
  },

  {
    name: 'Registro de Ocorrência Escolar',
    description: 'Registro de ocorrências disciplinares e comportamentais',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 3,
    category: 'Ocorrência',
    icon: 'AlertTriangle',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        matricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', minLength: 3, maxLength: 200 },
        serie: { type: 'string', title: 'Série/Ano', maxLength: 50 },
        tipoOcorrencia: { type: 'string', title: 'Tipo de Ocorrência', enum: ['Disciplinar', 'Comportamental', 'Falta', 'Violência', 'Bullying', 'Outro'] },
        dataOcorrencia: { type: 'string', title: 'Data da Ocorrência', format: 'date' },
        descricaoOcorrencia: { type: 'string', title: 'Descrição da Ocorrência', minLength: 20, maxLength: 1000, widget: 'textarea' },
        gravidadeOcorrencia: { type: 'string', title: 'Gravidade', enum: ['Leve', 'Moderada', 'Grave', 'Gravíssima'] },
        professorRelator: { type: 'string', title: 'Professor Relator', minLength: 3, maxLength: 200 }
      },
      required: ['nomeAluno', 'matricula', 'unidadeEscolar', 'serie', 'tipoOcorrencia', 'dataOcorrencia', 'descricaoOcorrencia', 'gravidadeOcorrencia', 'professorRelator']
    }
  },

  {
    name: 'Cadastro de Professores',
    description: 'Cadastro de professores para banco de talentos',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_PROFESSOR',
    requiresDocuments: true,
    requiredDocuments: ['Diploma', 'Currículo', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 3,
    category: 'Cadastro',
    icon: 'Users',
    color: '#6b21a8',
    // Validação de unicidade: um professor só pode ter um cadastro ativo
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CUSTOM',
    uniquenessRules: {
      moduleType: 'CADASTRO_PROFESSOR',
      validationFunction: 'validateCadastroProfessor'
    },
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        formacaoAcademica: { type: 'string', title: 'Formação Acadêmica', minLength: 3, maxLength: 200 },
        disciplinas: { type: 'string', title: 'Disciplinas que Leciona', maxLength: 300 },
        experienciaProfissional: { type: 'string', title: 'Experiência Profissional', maxLength: 1000, widget: 'textarea' },
        disponibilidadeHorario: { type: 'string', title: 'Disponibilidade de Horário', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['formacaoAcademica', 'disciplinas', 'experienciaProfissional', 'disponibilidadeHorario']
    }
  },

  {
    name: 'Inscrição em Creche',
    description: 'Solicitação de vaga em creche municipal para crianças de 0 a 3 anos',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'INSCRICAO_CRECHE',
    requiresDocuments: true,
    requiredDocuments: ['Certidão de Nascimento da Criança', 'RG do Responsável', 'CPF do Responsável', 'Comprovante de Residência', 'Comprovante de Trabalho dos Pais', 'Cartão de Vacina'],
    estimatedDays: 30,
    priority: 5,
    category: 'Matrícula',
    icon: 'Baby',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeCrianca: { type: 'string', title: 'Nome Completo da Criança', minLength: 3, maxLength: 200 },
        dataNascimentoCrianca: { type: 'string', title: 'Data de Nascimento da Criança', format: 'date' },
        idadeMeses: { type: 'integer', title: 'Idade em Meses', minimum: 0, maximum: 36 },
        crechePreferencial: { type: 'string', title: 'Creche Preferencial', maxLength: 200 },
        turnoDesejado: { type: 'string', title: 'Turno Desejado', enum: ['Integral', 'Matutino', 'Vespertino'] },
        necessidadesEspeciais: { type: 'boolean', title: 'Possui Necessidades Especiais?' },
        descricaoNecessidades: { type: 'string', title: 'Descrição das Necessidades', maxLength: 500, widget: 'textarea' },
        situacaoTrabalho: { type: 'string', title: 'Situação de Trabalho dos Pais', enum: ['Ambos Trabalham', 'Apenas um Trabalha', 'Nenhum Trabalha', 'Família Monoparental'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeCrianca', 'dataNascimentoCrianca', 'idadeMeses', 'crechePreferencial', 'turnoDesejado', 'situacaoTrabalho']
    }
  },

  {
    name: 'Atendimento Educacional Especializado (AEE)',
    description: 'Solicitação de atendimento especializado para alunos com necessidades especiais',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AEE',
    requiresDocuments: true,
    requiredDocuments: ['Laudo Médico', 'Relatório Pedagógico', 'Comprovante de Matrícula'],
    estimatedDays: 15,
    priority: 5,
    category: 'Educação Especial',
    icon: 'Heart',
    color: '#f97316',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome Completo do Aluno', minLength: 3, maxLength: 200 },
        dataNascimentoAluno: { type: 'string', title: 'Data de Nascimento do Aluno', format: 'date' },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', maxLength: 200 },
        serieAno: { type: 'string', title: 'Série/Ano', maxLength: 50 },
        tipoDeficiencia: { type: 'string', title: 'Tipo de Deficiência/Necessidade', enum: ['Deficiência Intelectual', 'Deficiência Física', 'Deficiência Visual', 'Deficiência Auditiva', 'TEA (Transtorno do Espectro Autista)', 'Altas Habilidades', 'TDAH', 'Outra'] },
        descricaoNecessidade: { type: 'string', title: 'Descrição da Necessidade', maxLength: 1000, widget: 'textarea' },
        atendimentoDesejado: { type: 'string', title: 'Tipo de Atendimento Desejado', enum: ['Sala de Recursos', 'Professor de Apoio', 'Intérprete de Libras', 'Material Adaptado', 'Outro'] },
        turnoAEE: { type: 'string', title: 'Turno para Atendimento AEE', enum: ['Mesmo turno da aula', 'Contraturno'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeAluno', 'dataNascimentoAluno', 'unidadeEscolar', 'serieAno', 'tipoDeficiencia', 'descricaoNecessidade', 'atendimentoDesejado']
    }
  },

  {
    name: 'Solicitação de Uniforme Escolar',
    description: 'Solicitação de uniforme escolar gratuito',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'UNIFORME_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Matrícula', 'Declaração de Baixa Renda (se aplicável)'],
    estimatedDays: 20,
    priority: 3,
    category: 'Assistência',
    icon: 'Shirt',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome do Aluno', minLength: 3, maxLength: 200 },
        matricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', maxLength: 200 },
        tamanhoCamisa: { type: 'string', title: 'Tamanho da Camisa', enum: ['PP', 'P', 'M', 'G', 'GG', 'XGG', 'Infantil 2', 'Infantil 4', 'Infantil 6', 'Infantil 8', 'Infantil 10', 'Infantil 12'] },
        tamanhoCalca: { type: 'string', title: 'Tamanho da Calça/Short', enum: ['PP', 'P', 'M', 'G', 'GG', 'XGG', 'Infantil 2', 'Infantil 4', 'Infantil 6', 'Infantil 8', 'Infantil 10', 'Infantil 12'] },
        quantidadeConjuntos: { type: 'integer', title: 'Quantidade de Conjuntos', minimum: 1, maximum: 3 }
      },
      required: ['nomeAluno', 'matricula', 'unidadeEscolar', 'tamanhoCamisa', 'tamanhoCalca', 'quantidadeConjuntos']
    }
  },

  {
    name: 'Solicitação de Material Escolar',
    description: 'Solicitação de kit de material escolar gratuito',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'MATERIAL_ESCOLAR',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Matrícula', 'Declaração de Baixa Renda (se aplicável)'],
    estimatedDays: 15,
    priority: 3,
    category: 'Assistência',
    icon: 'BookOpen',
    color: '#0ea5e9',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome do Aluno', minLength: 3, maxLength: 200 },
        matricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', maxLength: 200 },
        serieAno: { type: 'string', title: 'Série/Ano', maxLength: 50 },
        tipoKit: { type: 'string', title: 'Tipo de Kit', enum: ['Creche', 'Pré-Escola', 'Fundamental I', 'Fundamental II', 'EJA'] },
        necessidadeEspecial: { type: 'boolean', title: 'Material Adaptado (Necessidades Especiais)' }
      },
      required: ['nomeAluno', 'matricula', 'unidadeEscolar', 'serieAno', 'tipoKit']
    }
  },

  {
    name: 'Solicitação de Merenda Especial',
    description: 'Solicitação de merenda escolar adaptada para restrições alimentares',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'MERENDA_ESPECIAL',
    requiresDocuments: true,
    requiredDocuments: ['Atestado Médico', 'Comprovante de Matrícula'],
    estimatedDays: 10,
    priority: 4,
    category: 'Alimentação',
    icon: 'UtensilsCrossed',
    color: '#84cc16',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome do Aluno', minLength: 3, maxLength: 200 },
        matricula: { type: 'string', title: 'Número da Matrícula', maxLength: 50 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', maxLength: 200 },
        tipoRestricao: { type: 'string', title: 'Tipo de Restrição', enum: ['Alergia Alimentar', 'Intolerância (Lactose, Glúten)', 'Diabetes', 'Doença Celíaca', 'Vegetariana', 'Religiosa', 'Outra'] },
        descricaoRestricao: { type: 'string', title: 'Descrição da Restrição', maxLength: 1000, widget: 'textarea' },
        alimentosEvitar: { type: 'string', title: 'Alimentos a Evitar', maxLength: 500 },
        medicoPrescreveu: { type: 'string', title: 'Médico que Prescreveu', maxLength: 200 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomeAluno', 'matricula', 'unidadeEscolar', 'tipoRestricao', 'descricaoRestricao', 'alimentosEvitar']
    }
  },

  {
    name: 'Reclamação sobre Transporte Escolar',
    description: 'Registrar reclamação ou problema com transporte escolar',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'RECLAMACAO_TRANSPORTE_ESCOLAR',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 4,
    category: 'Reclamação',
    icon: 'AlertTriangle',
    color: '#ef4444',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        nomeAluno: { type: 'string', title: 'Nome do Aluno', minLength: 3, maxLength: 200 },
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar', maxLength: 200 },
        linhaOnibus: { type: 'string', title: 'Linha/Número do Ônibus', maxLength: 50 },
        tipoProblema: { type: 'string', title: 'Tipo de Problema', enum: ['Não passou no horário', 'Atraso frequente', 'Superlotação', 'Conduta do motorista', 'Veículo em má conservação', 'Falta de segurança', 'Outro'] },
        descricaoProblema: { type: 'string', title: 'Descrição do Problema', minLength: 20, maxLength: 1000, widget: 'textarea' },
        dataOcorrencia: { type: 'string', title: 'Data da Ocorrência', format: 'date' },
        horarioOcorrencia: { type: 'string', title: 'Horário da Ocorrência', maxLength: 10 }
      },
      required: ['nomeAluno', 'unidadeEscolar', 'tipoProblema', 'descricaoProblema', 'dataOcorrencia']
    }
  },

  {
    name: 'Consulta de Calendário Escolar',
    description: 'Consultar calendário escolar, feriados e eventos',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CALENDARIO_ESCOLAR',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 1,
    category: 'Consulta',
    icon: 'Calendar',
    color: '#6366f1',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_email'],
      properties: {
        unidadeEscolar: { type: 'string', title: 'Unidade Escolar (opcional)', maxLength: 200 },
        anoLetivo: { type: 'string', title: 'Ano Letivo', pattern: '^\\d{4}$' },
        tipoConsulta: { type: 'string', title: 'Tipo de Consulta', enum: ['Calendário Completo', 'Feriados e Recessos', 'Reuniões de Pais', 'Eventos Escolares', 'Período de Matrículas'] }
      },
      required: ['anoLetivo', 'tipoConsulta']
    }
  },

  {
    name: 'Inscrição em EJA (Educação de Jovens e Adultos)',
    description: 'Inscrição no programa de Educação de Jovens e Adultos',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'INSCRICAO_EJA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência', 'Histórico Escolar (se possuir)'],
    estimatedDays: 10,
    priority: 4,
    category: 'Matrícula',
    icon: 'BookUser',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        idadeAluno: { type: 'integer', title: 'Idade', minimum: 15, maximum: 120 },
        ultimaSerieCompleta: { type: 'string', title: 'Última Série Completa', enum: ['Sem Escolaridade', '1º ao 4º ano', '5º ano', '6º ano', '7º ano', '8º ano', 'Ensino Fundamental Completo'] },
        motivoInscricao: { type: 'string', title: 'Motivo da Inscrição', maxLength: 500, widget: 'textarea' },
        escolaPreferencial: { type: 'string', title: 'Escola Preferencial', maxLength: 200 },
        turnoPreferencial: { type: 'string', title: 'Turno Preferencial', enum: ['Noturno', 'Vespertino', 'Qualquer'] },
        trabalha: { type: 'boolean', title: 'Atualmente Trabalha?' },
        necessidadesEspeciais: { type: 'boolean', title: 'Possui Necessidades Especiais?' },
        descricaoNecessidades: { type: 'string', title: 'Descrição das Necessidades', maxLength: 500, widget: 'textarea' }
      },
      required: ['idadeAluno', 'ultimaSerieCompleta', 'motivoInscricao', 'escolaPreferencial', 'turnoPreferencial', 'trabalha']
    }
  },

  // ========== SEM_DADOS (6) ==========

  {
    name: 'Histórico Escolar',
    description: 'Emissão de histórico escolar completo (usa dados do perfil do cidadão)',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 7,
    priority: 4,
    category: 'Documentos',
    icon: 'ScrollText',
    color: '#2563eb'
  },

  {
    name: 'Declaração de Matrícula',
    description: 'Emissão de declaração de matrícula (usa dados do perfil do cidadão)',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 2,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#7c3aed'
  },

  {
    name: 'Declaração de Conclusão',
    description: 'Emissão de declaração de conclusão de série ou nível de ensino (usa dados do perfil do cidadão)',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 3,
    category: 'Declarações',
    icon: 'Award',
    color: '#f59e0b'
  },

  {
    name: 'Certidão de Escolaridade',
    description: 'Emissão de certidão comprovando nível de escolaridade (usa dados do perfil do cidadão)',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 2,
    category: 'Certidões',
    icon: 'FileBadge',
    color: '#06b6d4'
  },

  {
    name: 'Boletim Escolar Online',
    description: 'Consulta e emissão de boletim escolar online (usa dados do perfil do cidadão)',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 1,
    priority: 2,
    category: 'Consultas',
    icon: 'FileBarChart',
    color: '#10b981'
  },

  {
    name: 'Atestado de Frequência Escolar',
    description: 'Emissão de atestado comprovando frequência do aluno (usa dados do perfil do cidadão)',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 2,
    category: 'Atestados',
    icon: 'FileCheck2',
    color: '#3b82f6'
  }
];
