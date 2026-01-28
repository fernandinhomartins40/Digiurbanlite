/**
 * SEED DE SERVIÇOS - SECRETARIA DE POLÍTICAS PARA MULHERES
 * Total: 15 serviços (11 CAPTURA_COMPLETA + 1 SOLICITACAO_SIMPLES + 3 CONSULTIVO)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const womenPoliciesServices: ServiceDefinition[] = [
  // ========== COM_DADOS - CAPTURA_COMPLETA (11) ==========

  {
    name: 'Denúncia de Violência contra a Mulher',
    description: 'Denuncie casos de violência doméstica, física, psicológica, sexual ou patrimonial',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'DENUNCIA_VIOLENCIA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Proteção',
    icon: 'Shield',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoViolencia: { type: 'array', title: 'Tipo(s) de Violência', items: { type: 'string', enum: ['Física', 'Psicológica', 'Sexual', 'Patrimonial', 'Moral', 'Feminicídio (Tentativa)'] }, minItems: 1 },
        relacaoAgressor: { type: 'string', title: 'Relação com o Agressor', enum: ['Companheiro(a) Atual', 'Ex-Companheiro(a)', 'Familiar', 'Conhecido', 'Desconhecido', 'Outro'] },
        frequencia: { type: 'string', title: 'Frequência da Violência', enum: ['Primeira Vez', 'Ocasional', 'Frequente', 'Diária'] },
        tempoViolencia: { type: 'string', title: 'Há Quanto Tempo Sofre Violência', enum: ['Menos de 1 mês', '1-6 meses', '6 meses-1 ano', '1-5 anos', 'Mais de 5 anos'] },
        descricao: { type: 'string', title: 'Descrição dos Fatos', maxLength: 2000, widget: 'textarea' },
        existeBoletim: { type: 'boolean', title: 'Já Registrou Boletim de Ocorrência' },
        numeroBoletim: { type: 'string', title: 'Número do Boletim de Ocorrência (se houver)', maxLength: 100 },
        necessitaAbrigo: { type: 'boolean', title: 'Necessita de Abrigo Emergencial' },
        filhosMenores: { type: 'boolean', title: 'Possui Filhos Menores de Idade' },
        quantidadeFilhos: { type: 'integer', title: 'Quantidade de Filhos (se houver)', minimum: 0, maximum: 10 },
        riscoIminente: { type: 'boolean', title: 'Está em Risco Iminente de Morte' },
        denunciaAnonima: { type: 'boolean', title: 'Desejo fazer denúncia anônima' }
      },
      required: ['tipoViolencia', 'relacaoAgressor', 'frequencia', 'descricao', 'existeBoletim', 'necessitaAbrigo', 'filhosMenores', 'riscoIminente']
    }
  },

  {
    name: 'Agendamento no Centro de Referência da Mulher',
    description: 'Agende atendimento psicológico, jurídico e de assistência social',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'AGENDAMENTO_CENTRO_REFERENCIA',
    requiresDocuments: true,
    requiredDocuments: ['RG ou CPF', 'Comprovante de Residência'],
    estimatedDays: 3,
    priority: 5,
    category: 'Atendimento',
    icon: 'Calendar',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoAtendimento: { type: 'array', title: 'Tipo de Atendimento Desejado', items: { type: 'string', enum: ['Psicológico', 'Jurídico', 'Assistência Social', 'Encaminhamento para Outros Serviços'] }, minItems: 1 },
        motivoAtendimento: { type: 'string', title: 'Motivo do Atendimento', enum: ['Violência Doméstica', 'Orientação Jurídica', 'Apoio Psicológico', 'Orientação Profissional', 'Questões Familiares', 'Outro'] },
        primeiraVez: { type: 'boolean', title: 'É Primeira Vez no Centro de Referência' },
        urgencia: { type: 'string', title: 'Nível de Urgência', enum: ['Baixa', 'Média', 'Alta', 'Emergencial'] },
        periodoPreferencia: { type: 'string', title: 'Período de Preferência', enum: ['Manhã (8h-12h)', 'Tarde (13h-17h)', 'Sem Preferência'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoAtendimento', 'motivoAtendimento', 'primeiraVez', 'urgencia']
    }
  },

  {
    name: 'Solicitação de Acolhimento em Casa Abrigo',
    description: 'Solicite acolhimento emergencial em casa abrigo para mulheres em situação de violência',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ACOLHIMENTO_CASA_ABRIGO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Boletim de Ocorrência', 'Documentos dos Filhos (se houver)'],
    estimatedDays: 1,
    priority: 5,
    category: 'Proteção',
    icon: 'Home',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary'],
      properties: {
        tipoViolencia: { type: 'array', title: 'Tipo(s) de Violência Sofrida', items: { type: 'string', enum: ['Física', 'Psicológica', 'Sexual', 'Patrimonial', 'Moral', 'Tentativa de Feminicídio'] }, minItems: 1 },
        riscoVida: { type: 'boolean', title: 'Está em Risco de Vida' },
        medidaProtetiva: { type: 'boolean', title: 'Possui Medida Protetiva' },
        boletimOcorrencia: { type: 'string', title: 'Número do Boletim de Ocorrência', maxLength: 100 },
        dataOcorrencia: { type: 'string', title: 'Data da Última Ocorrência', format: 'date' },
        possuiFilhos: { type: 'boolean', title: 'Possui Filhos' },
        quantidadeFilhos: { type: 'integer', title: 'Quantidade de Filhos (se houver)', minimum: 0, maximum: 10 },
        idadeFilhos: { type: 'string', title: 'Idade dos Filhos (se houver)', maxLength: 200 },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais (saúde, medicação, etc)', maxLength: 500, widget: 'textarea' },
        rendaFamiliar: { type: 'string', title: 'Renda Familiar Mensal', enum: ['Sem renda', 'Até 1 salário mínimo', '1-2 salários', '2-3 salários', 'Mais de 3 salários'] },
        descricaoSituacao: { type: 'string', title: 'Descrição da Situação Atual', maxLength: 2000, widget: 'textarea' }
      },
      required: ['tipoViolencia', 'riscoVida', 'medidaProtetiva', 'boletimOcorrencia', 'dataOcorrencia', 'possuiFilhos', 'rendaFamiliar', 'descricaoSituacao']
    }
  },

  {
    name: 'Inscrição em Cursos de Qualificação Profissional',
    description: 'Inscreva-se em cursos gratuitos de capacitação e qualificação profissional',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CURSOS_QUALIFICACAO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência', 'Comprovante de Escolaridade'],
    estimatedDays: 10,
    priority: 3,
    category: 'Capacitação',
    icon: 'GraduationCap',
    color: '#3b82f6',
    // Permite múltiplos: pode se inscrever em vários cursos
    allowMultipleActiveProtocols: true,
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_occupation'],
      properties: {
        areaCurso: { type: 'string', title: 'Área do Curso', enum: ['Beleza e Estética', 'Gastronomia', 'Artesanato', 'Costura e Confecção', 'Informática', 'Administração', 'Vendas e Marketing', 'Cuidadora', 'Outro'] },
        escolaridade: { type: 'string', title: 'Escolaridade', enum: ['Fundamental Incompleto', 'Fundamental Completo', 'Médio Incompleto', 'Médio Completo', 'Superior Incompleto', 'Superior Completo'] },
        situacaoEmprego: { type: 'string', title: 'Situação de Emprego', enum: ['Desempregada', 'Empregada', 'Autônoma', 'Do Lar', 'Estudante'] },
        experienciaProfissional: { type: 'string', title: 'Experiência Profissional', maxLength: 500, widget: 'textarea' },
        motivoCurso: { type: 'string', title: 'Motivo de Interesse no Curso', maxLength: 500, widget: 'textarea' },
        disponibilidade: { type: 'string', title: 'Disponibilidade de Horário', enum: ['Manhã', 'Tarde', 'Noite', 'Fins de Semana', 'Flexível'] },
        possuiFilhos: { type: 'boolean', title: 'Possui Filhos Pequenos' },
        necessitaCreche: { type: 'boolean', title: 'Necessita de Creche Durante o Curso' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['areaCurso', 'escolaridade', 'situacaoEmprego', 'motivoCurso', 'disponibilidade', 'possuiFilhos']
    }
  },

  {
    name: 'Programa de Geração de Renda',
    description: 'Cadastre-se em programas de incentivo à geração de renda e empreendedorismo feminino',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'GERACAO_RENDA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência', 'Comprovante de Renda (se houver)'],
    estimatedDays: 15,
    priority: 3,
    category: 'Empreendedorismo',
    icon: 'Briefcase',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoAtuacao: { type: 'string', title: 'Tipo de Atuação Desejada', enum: ['Artesanato', 'Costura', 'Gastronomia', 'Beleza e Estética', 'Vendas', 'Serviços Gerais', 'Digital/Online', 'Outro'] },
        possuiNegocio: { type: 'boolean', title: 'Já Possui Negócio Próprio' },
        descricaoNegocio: { type: 'string', title: 'Descrição do Negócio (se já possui)', maxLength: 500, widget: 'textarea' },
        necessidadeCapital: { type: 'boolean', title: 'Necessita de Capital Inicial' },
        valorEstimado: { type: 'string', title: 'Valor Estimado Necessário', enum: ['Até R$ 500', 'R$ 500-1000', 'R$ 1000-2000', 'R$ 2000-5000', 'Mais de R$ 5000'] },
        possuiEspacoTrabalho: { type: 'boolean', title: 'Possui Espaço para Trabalho' },
        necessitaCapacitacao: { type: 'boolean', title: 'Necessita de Capacitação' },
        areasInteresse: { type: 'array', title: 'Áreas de Interesse para Capacitação', items: { type: 'string', enum: ['Gestão Financeira', 'Marketing', 'Vendas', 'Formalização MEI', 'Redes Sociais', 'Precificação', 'Atendimento ao Cliente'] } },
        rendaAtual: { type: 'string', title: 'Renda Mensal Atual', enum: ['Sem renda', 'Até R$ 500', 'R$ 500-1000', 'R$ 1000-2000', 'Mais de R$ 2000'] },
        objetivoRenda: { type: 'string', title: 'Objetivo de Renda Mensal', enum: ['Até R$ 1000', 'R$ 1000-2000', 'R$ 2000-3000', 'Mais de R$ 3000'] },
        descricaoObjetivos: { type: 'string', title: 'Descrição dos Objetivos e Planos', maxLength: 1000, widget: 'textarea' }
      },
      required: ['tipoAtuacao', 'possuiNegocio', 'necessidadeCapital', 'possuiEspacoTrabalho', 'necessitaCapacitacao', 'rendaAtual', 'objetivoRenda']
    }
  },

  {
    name: 'Inscrição em Grupos de Apoio',
    description: 'Participe de grupos de apoio e fortalecimento da autoestima',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'GRUPOS_APOIO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Apoio',
    icon: 'Users',
    color: '#ec4899',
    // Permite múltiplos: pode participar de vários grupos de apoio
    allowMultipleActiveProtocols: true,
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary'],
      properties: {
        tipoGrupo: { type: 'string', title: 'Tipo de Grupo', enum: ['Mulheres Vítimas de Violência', 'Mães Solo', 'Saúde da Mulher', 'Autoestima e Empoderamento', 'Dependência Química', 'Luto e Perdas', 'Outro'] },
        motivoParticipacao: { type: 'string', title: 'Motivo da Participação', maxLength: 500, widget: 'textarea' },
        situacaoAtual: { type: 'string', title: 'Descrição da Situação Atual (opcional)', maxLength: 500, widget: 'textarea' },
        participouAntes: { type: 'boolean', title: 'Já Participou de Grupo de Apoio Anteriormente' },
        disponibilidade: { type: 'string', title: 'Disponibilidade', enum: ['Manhã', 'Tarde', 'Noite', 'Fins de Semana', 'Flexível'] },
        preferenciaModalidade: { type: 'string', title: 'Preferência de Modalidade', enum: ['Presencial', 'Online', 'Sem Preferência'] },
        necessitaCreche: { type: 'boolean', title: 'Necessita de Espaço Kids/Creche Durante os Encontros' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoGrupo', 'motivoParticipacao', 'participouAntes', 'disponibilidade', 'preferenciaModalidade']
    }
  },

  {
    name: 'Solicitação de Acompanhamento Social',
    description: 'Solicite acompanhamento social continuado e orientação',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'ACOMPANHAMENTO_SOCIAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência'],
    estimatedDays: 7,
    priority: 4,
    category: 'Assistência',
    icon: 'UserCheck',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        motivoSolicitacao: { type: 'array', title: 'Motivo da Solicitação', items: { type: 'string', enum: ['Violência Doméstica', 'Vulnerabilidade Social', 'Desemprego', 'Problemas Familiares', 'Dependência Química', 'Saúde Mental', 'Guarda de Filhos', 'Outro'] }, minItems: 1 },
        descricaoSituacao: { type: 'string', title: 'Descrição da Situação', maxLength: 1000, widget: 'textarea' },
        composicaoFamiliar: { type: 'integer', title: 'Composição Familiar (nº de pessoas)', minimum: 1, maximum: 15 },
        possuiFilhos: { type: 'boolean', title: 'Possui Filhos' },
        quantidadeFilhos: { type: 'integer', title: 'Quantidade de Filhos (se houver)', minimum: 0, maximum: 10 },
        situacaoMoradia: { type: 'string', title: 'Situação de Moradia', enum: ['Casa Própria', 'Alugada', 'Cedida', 'Em Área de Risco', 'Situação de Rua', 'Outro'] },
        inscritaProgramas: { type: 'boolean', title: 'Inscrita em Programas Sociais (Bolsa Família, etc)' },
        programasInscritos: { type: 'string', title: 'Quais Programas (se houver)', maxLength: 300 },
        acompanhamentoAnterior: { type: 'boolean', title: 'Já Teve Acompanhamento Social Anteriormente' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['motivoSolicitacao', 'descricaoSituacao', 'composicaoFamiliar', 'possuiFilhos', 'situacaoMoradia', 'inscritaProgramas']
    }
  },

  {
    name: 'Denúncia de Assédio no Trabalho',
    description: 'Denuncie casos de assédio moral ou sexual no ambiente de trabalho',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'DENUNCIA_ASSEDIO',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 5,
    category: 'Proteção',
    icon: 'AlertCircle',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        tipoAssedio: { type: 'array', title: 'Tipo de Assédio', items: { type: 'string', enum: ['Assédio Moral', 'Assédio Sexual', 'Discriminação de Gênero', 'Outro'] }, minItems: 1 },
        localTrabalho: { type: 'string', title: 'Local de Trabalho', maxLength: 200 },
        cargoOcupado: { type: 'string', title: 'Cargo Ocupado', maxLength: 100 },
        tempoEmpresa: { type: 'string', title: 'Tempo na Empresa', enum: ['Menos de 6 meses', '6 meses-1 ano', '1-2 anos', '2-5 anos', 'Mais de 5 anos'] },
        relacaoAssediador: { type: 'string', title: 'Relação com Assediador', enum: ['Superior Hierárquico', 'Colega de Trabalho', 'Cliente', 'Fornecedor', 'Outro'] },
        frequencia: { type: 'string', title: 'Frequência do Assédio', enum: ['Primeira Vez', 'Ocasional', 'Frequente', 'Diário'] },
        tempoAssedio: { type: 'string', title: 'Há Quanto Tempo Ocorre', enum: ['Menos de 1 mês', '1-3 meses', '3-6 meses', '6 meses-1 ano', 'Mais de 1 ano'] },
        descricao: { type: 'string', title: 'Descrição Detalhada dos Fatos', maxLength: 2000, widget: 'textarea' },
        testemunhas: { type: 'boolean', title: 'Existem Testemunhas' },
        registroInterno: { type: 'boolean', title: 'Já Fez Registro Interno na Empresa' },
        necessitaOrientacao: { type: 'boolean', title: 'Necessita de Orientação Jurídica' },
        denunciaAnonima: { type: 'boolean', title: 'Desejo fazer denúncia anônima' }
      },
      required: ['tipoAssedio', 'localTrabalho', 'relacaoAssediador', 'frequencia', 'tempoAssedio', 'descricao', 'testemunhas', 'registroInterno']
    }
  },

  {
    name: 'Inscrição em Oficinas e Workshops',
    description: 'Inscreva-se em oficinas e workshops sobre direitos, saúde e empoderamento',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'OFICINAS_WORKSHOPS',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 2,
    category: 'Eventos',
    icon: 'BookOpen',
    color: '#6366f1',
    // Permite múltiplos: pode se inscrever em várias oficinas e workshops
    allowMultipleActiveProtocols: true,
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone'],
      properties: {
        temaInteresse: { type: 'array', title: 'Temas de Interesse', items: { type: 'string', enum: ['Direitos da Mulher', 'Saúde da Mulher', 'Empoderamento Feminino', 'Violência Doméstica', 'Mercado de Trabalho', 'Empreendedorismo', 'Maternidade', 'Sexualidade', 'Autoestima', 'Outro'] }, minItems: 1 },
        disponibilidade: { type: 'string', title: 'Disponibilidade', enum: ['Manhã', 'Tarde', 'Noite', 'Fins de Semana', 'Flexível'] },
        preferenciaDuracao: { type: 'string', title: 'Preferência de Duração', enum: ['Palestra (1-2h)', 'Workshop (meio dia)', 'Curso (vários dias)', 'Sem Preferência'] },
        modalidade: { type: 'string', title: 'Modalidade Preferida', enum: ['Presencial', 'Online', 'Sem Preferência'] },
        participouAntes: { type: 'boolean', title: 'Já Participou de Atividades Anteriormente' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['temaInteresse', 'disponibilidade', 'modalidade']
    }
  },

  {
    name: 'Solicitação de Medida Protetiva de Urgência',
    description: 'Solicite orientação e encaminhamento para medida protetiva de urgência',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'MEDIDA_PROTETIVA',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Boletim de Ocorrência', 'Provas (fotos, mensagens, se houver)'],
    estimatedDays: 1,
    priority: 5,
    category: 'Proteção',
    icon: 'ShieldCheck',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        possuiBoletim: { type: 'boolean', title: 'Já Possui Boletim de Ocorrência' },
        numeroBoletim: { type: 'string', title: 'Número do Boletim (se houver)', maxLength: 100 },
        dataBoletim: { type: 'string', title: 'Data do Boletim (se houver)', format: 'date' },
        tipoViolencia: { type: 'array', title: 'Tipo(s) de Violência', items: { type: 'string', enum: ['Física', 'Psicológica', 'Sexual', 'Patrimonial', 'Moral', 'Perseguição/Stalking', 'Ameaça de Morte'] }, minItems: 1 },
        relacaoAgressor: { type: 'string', title: 'Relação com Agressor', enum: ['Companheiro(a) Atual', 'Ex-Companheiro(a)', 'Familiar', 'Conhecido', 'Outro'] },
        agressorMoraJunto: { type: 'boolean', title: 'Agressor Mora na Mesma Residência' },
        riscoVida: { type: 'boolean', title: 'Está em Risco de Vida' },
        possuiArma: { type: 'boolean', title: 'Agressor Possui Arma de Fogo' },
        filhosMenores: { type: 'boolean', title: 'Possui Filhos Menores com o Agressor' },
        quantidadeFilhos: { type: 'integer', title: 'Quantidade de Filhos (se houver)', minimum: 0, maximum: 10 },
        descricaoSituacao: { type: 'string', title: 'Descrição Detalhada da Situação Atual', maxLength: 2000, widget: 'textarea' },
        necessitaAbrigo: { type: 'boolean', title: 'Necessita de Abrigo Emergencial' },
        necessitaOrientacaoJuridica: { type: 'boolean', title: 'Necessita de Orientação Jurídica' }
      },
      required: ['possuiBoletim', 'tipoViolencia', 'relacaoAgressor', 'agressorMoraJunto', 'riscoVida', 'possuiArma', 'filhosMenores', 'descricaoSituacao', 'necessitaAbrigo']
    }
  },

  {
    name: 'Agendamento para Perícia Psicossocial',
    description: 'Agende avaliação psicossocial para processos judiciais',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'PERICIA_PSICOSSOCIAL',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Processo Judicial', 'Encaminhamento do Juizado'],
    estimatedDays: 15,
    priority: 4,
    category: 'Atendimento',
    icon: 'FileText',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        numeroProcesso: { type: 'string', title: 'Número do Processo Judicial', maxLength: 50 },
        tipoProcesso: { type: 'string', title: 'Tipo de Processo', enum: ['Violência Doméstica', 'Guarda de Filhos', 'Regulamentação de Visitas', 'Destituição de Poder Familiar', 'Outro'] },
        vara: { type: 'string', title: 'Vara Judicial', maxLength: 200 },
        finalidadePericia: { type: 'string', title: 'Finalidade da Perícia', maxLength: 500, widget: 'textarea' },
        prazoJudicial: { type: 'string', title: 'Prazo Judicial (se houver)', format: 'date' },
        urgente: { type: 'boolean', title: 'Caso Urgente' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['numeroProcesso', 'tipoProcesso', 'vara', 'finalidadePericia']
    }
  },

  // ========== COM_DADOS - SOLICITACAO_SIMPLES (1) ==========

  {
    name: 'Canal de Escuta - Acolhimento Imediato',
    description: 'Receba acolhimento e escuta qualificada em situações de vulnerabilidade',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CANAL_ESCUTA',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 5,
    category: 'Atendimento',
    icon: 'Phone',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        motivoContato: { type: 'string', title: 'Motivo do Contato', enum: ['Violência', 'Crise Emocional', 'Orientação', 'Denúncia', 'Informações', 'Outro'] },
        urgencia: { type: 'string', title: 'Nível de Urgência', enum: ['Baixa', 'Média', 'Alta', 'Emergencial'] },
        prefereAnonimato: { type: 'boolean', title: 'Prefere Atendimento Anônimo' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['motivoContato', 'urgencia']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (3) ==========

  {
    name: 'Informações sobre Direitos da Mulher',
    description: 'Consulte informações sobre direitos, leis e proteção à mulher',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Informações',
    icon: 'BookOpen',
    color: '#6366f1'
  },

  {
    name: 'Rede de Atendimento à Mulher',
    description: 'Consulte a rede de atendimento, endereços e contatos de apoio',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Informações',
    icon: 'MapPin',
    color: '#8b5cf6'
  },

  {
    name: 'Agenda de Eventos e Campanhas',
    description: 'Consulte a agenda de eventos, palestras e campanhas da secretaria',
    departmentCode: 'POLITICAS_MULHERES',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Eventos',
    icon: 'Calendar',
    color: '#ec4899'
  }
];
