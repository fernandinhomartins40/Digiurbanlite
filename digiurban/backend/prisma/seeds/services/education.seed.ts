/**
 * SEED DE SERVIÇOS - SECRETARIA DE EDUCAÇÃO
 * Total: 12 serviços (8 COM_DADOS + 4 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const educationServices: ServiceDefinition[] = [
  // ========== COM_DADOS (8) ==========

  {
    name: 'Matrícula Escolar',
    description: 'Solicitação de matrícula e rematrícula em escolas municipais',
    departmentCode: 'EDUCACAO',
    serviceType: 'COM_DADOS',
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
    moduleType: 'CADASTRO_PROFESSOR',
    requiresDocuments: true,
    requiredDocuments: ['Diploma', 'Currículo', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 3,
    category: 'Cadastro',
    icon: 'Users',
    color: '#6b21a8',
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

  // ========== SEM_DADOS (4) ==========

  {
    name: 'Histórico Escolar',
    description: 'Emissão de histórico escolar completo',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['RG do Responsável', 'RG do Aluno (se possuir)'],
    estimatedDays: 7,
    priority: 4,
    category: 'Documentos',
    icon: 'ScrollText',
    color: '#2563eb'
  },

  {
    name: 'Declaração de Matrícula',
    description: 'Emissão de declaração de matrícula',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['RG ou CPF', 'Nome do Aluno'],
    estimatedDays: 3,
    priority: 2,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#7c3aed'
  },

  {
    name: 'Declaração de Conclusão',
    description: 'Emissão de declaração de conclusão de série ou nível de ensino',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['RG do Responsável', 'Comprovante de Conclusão'],
    estimatedDays: 5,
    priority: 3,
    category: 'Declarações',
    icon: 'Award',
    color: '#f59e0b'
  },

  {
    name: 'Certidão de Escolaridade',
    description: 'Emissão de certidão comprovando nível de escolaridade',
    departmentCode: 'EDUCACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['RG do Responsável', 'RG do Aluno (se possuir)'],
    estimatedDays: 5,
    priority: 2,
    category: 'Certidões',
    icon: 'FileBadge',
    color: '#06b6d4'
  }
];
