/**
 * SEED DE SERVIÇOS - SECRETARIA DE DEFESA CIVIL
 * Total: 15 serviços (6 CAPTURA_COMPLETA + 5 SOLICITACAO_SIMPLES + 4 CONSULTIVO)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const civilDefenseServices: ServiceDefinition[] = [
  // ========== COM_DADOS - CAPTURA_COMPLETA (6) ==========

  {
    name: 'Solicitação de Vistoria em Área de Risco',
    description: 'Solicite vistoria técnica em áreas com risco de deslizamento, enchente ou desabamento',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'VISTORIA_AREA_RISCO',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Residência', 'RG ou CPF', 'Fotos do Local (se possível)'],
    estimatedDays: 3,
    priority: 5,
    category: 'Vistorias',
    icon: 'AlertTriangle',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoRisco: { type: 'string', title: 'Tipo de Risco', enum: ['Deslizamento de Terra', 'Enchente/Alagamento', 'Desabamento de Imóvel', 'Queda de Árvore', 'Rachadura Estrutural', 'Outro'] },
        descricaoSituacao: { type: 'string', title: 'Descrição Detalhada da Situação', maxLength: 1000, widget: 'textarea' },
        tempoProblema: { type: 'string', title: 'Há Quanto Tempo Existe o Problema', enum: ['Menos de 1 semana', '1 a 4 semanas', '1 a 6 meses', 'Mais de 6 meses'] },
        quantidadeFamilias: { type: 'integer', title: 'Quantas Famílias São Afetadas', minimum: 1, maximum: 100 },
        urgencia: { type: 'string', title: 'Nível de Urgência', enum: ['Baixa', 'Média', 'Alta', 'Emergencial'] },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência do Local', maxLength: 200 }
      },
      required: ['tipoRisco', 'descricaoSituacao', 'quantidadeFamilias', 'urgencia']
    }
  },

  {
    name: 'Cadastro de Família em Área de Risco',
    description: 'Cadastre sua família que reside em área de risco para receber alertas e assistência',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_FAMILIA_RISCO',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Residência', 'RG ou CPF de todos os moradores', 'Documento dos Menores (se houver)'],
    estimatedDays: 5,
    priority: 5,
    category: 'Cadastros',
    icon: 'Users',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        quantidadeMoradores: { type: 'integer', title: 'Quantidade de Moradores', minimum: 1, maximum: 20 },
        menoresIdade: { type: 'integer', title: 'Quantidade de Menores de 18 anos', minimum: 0, maximum: 15 },
        idosos: { type: 'integer', title: 'Quantidade de Idosos (60+)', minimum: 0, maximum: 10 },
        deficientes: { type: 'integer', title: 'Quantidade de Pessoas com Deficiência', minimum: 0, maximum: 10 },
        tipoRiscoArea: { type: 'string', title: 'Tipo de Risco na Área', enum: ['Deslizamento', 'Enchente', 'Desabamento', 'Vários Riscos'] },
        telefoneEmergencia: { type: 'string', title: 'Telefone Adicional para Emergências', pattern: '^\\(?\\d{2}\\)?[\\s-]?\\d{4,5}-?\\d{4}$' },
        necessidadesEspeciais: { type: 'string', title: 'Necessidades Especiais da Família (mobilidade, saúde, etc)', maxLength: 500, widget: 'textarea' }
      },
      required: ['quantidadeMoradores', 'menoresIdade', 'idosos', 'deficientes', 'tipoRiscoArea', 'telefoneEmergencia']
    }
  },

  {
    name: 'Solicitação de Abrigo Temporário',
    description: 'Solicite abrigo temporário em caso de desastre natural ou situação de risco iminente',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'SOLICITACAO_ABRIGO',
    requiresDocuments: true,
    requiredDocuments: ['RG ou CPF de todos os moradores', 'Laudo Técnico (se houver)', 'Comprovante de Residência na Área Afetada'],
    estimatedDays: 1,
    priority: 5,
    category: 'Assistência',
    icon: 'Home',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', enum: ['Desabamento', 'Enchente', 'Deslizamento', 'Incêndio', 'Risco Iminente', 'Outro'] },
        quantidadePessoas: { type: 'integer', title: 'Quantidade de Pessoas', minimum: 1, maximum: 20 },
        criancas: { type: 'integer', title: 'Quantidade de Crianças (0-12 anos)', minimum: 0, maximum: 10 },
        idosos: { type: 'integer', title: 'Quantidade de Idosos (60+)', minimum: 0, maximum: 10 },
        deficientes: { type: 'integer', title: 'Pessoas com Deficiência ou Mobilidade Reduzida', minimum: 0, maximum: 10 },
        animais: { type: 'boolean', title: 'Possui Animais de Estimação' },
        quantidadeAnimais: { type: 'integer', title: 'Quantidade de Animais (se houver)', minimum: 0, maximum: 5 },
        necessidadeMedica: { type: 'boolean', title: 'Alguém Necessita de Cuidados Médicos Especiais' },
        descricaoNecessidade: { type: 'string', title: 'Descrição das Necessidades Médicas (se houver)', maxLength: 500, widget: 'textarea' },
        observacoes: { type: 'string', title: 'Observações Adicionais', maxLength: 500, widget: 'textarea' }
      },
      required: ['motivoSolicitacao', 'quantidadePessoas', 'criancas', 'idosos', 'deficientes', 'animais']
    }
  },

  {
    name: 'Inscrição em Treinamento de Defesa Civil',
    description: 'Inscreva-se em cursos e treinamentos sobre prevenção e resposta a desastres',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'TREINAMENTO_DEFESA_CIVIL',
    requiresDocuments: true,
    requiredDocuments: ['RG ou CPF', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 3,
    category: 'Capacitação',
    icon: 'GraduationCap',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_occupation'],
      properties: {
        tipoCurso: { type: 'string', title: 'Tipo de Curso', enum: ['Primeiros Socorros', 'Prevenção de Incêndios', 'Gestão de Desastres', 'Curso Básico de Defesa Civil', 'Voluntariado em Emergências', 'Outro'] },
        motivoInteresse: { type: 'string', title: 'Motivo do Interesse', enum: ['Profissional', 'Voluntariado', 'Segurança Pessoal/Familiar', 'Comunitário', 'Acadêmico'] },
        disponibilidade: { type: 'string', title: 'Disponibilidade de Horário', enum: ['Manhã (8h-12h)', 'Tarde (13h-17h)', 'Noite (18h-22h)', 'Fins de Semana', 'Flexível'] },
        experienciaAnterior: { type: 'string', title: 'Possui Experiência Anterior', enum: ['Nenhuma', 'Básica', 'Intermediária', 'Avançada'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoCurso', 'motivoInteresse', 'disponibilidade']
    }
  },

  {
    name: 'Cadastro de Voluntário da Defesa Civil',
    description: 'Cadastre-se como voluntário para atuar em situações de emergência e desastres',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'CADASTRO_VOLUNTARIO',
    requiresDocuments: true,
    requiredDocuments: ['RG', 'CPF', 'Comprovante de Residência', 'Atestado de Antecedentes Criminais', 'Certificados de Cursos (se houver)'],
    estimatedDays: 10,
    priority: 3,
    category: 'Voluntariado',
    icon: 'Heart',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_occupation'],
      properties: {
        areaAtuacao: { type: 'array', title: 'Áreas de Atuação de Interesse', items: { type: 'string', enum: ['Resgate', 'Primeiros Socorros', 'Logística', 'Comunicação', 'Apoio Psicossocial', 'Triagem', 'Distribuição de Suprimentos', 'Assistência Geral'] }, minItems: 1 },
        formacao: { type: 'string', title: 'Formação Acadêmica', maxLength: 200 },
        profissao: { type: 'string', title: 'Profissão Atual', maxLength: 200 },
        cursosRealizados: { type: 'string', title: 'Cursos Realizados na Área (Primeiros Socorros, Bombeiros, etc)', maxLength: 500, widget: 'textarea' },
        disponibilidade: { type: 'string', title: 'Disponibilidade', enum: ['Somente Emergências', 'Fins de Semana', 'Dias de Semana', 'Período Integral', 'Flexível'] },
        possuiVeiculo: { type: 'boolean', title: 'Possui Veículo Próprio' },
        tempoDisponivel: { type: 'string', title: 'Tempo Disponível para Voluntariado', enum: ['2-4 horas/semana', '4-8 horas/semana', '8-16 horas/semana', 'Mais de 16 horas/semana', 'Conforme Necessidade'] },
        habilidadesEspeciais: { type: 'string', title: 'Habilidades Especiais (idiomas, técnicas, etc)', maxLength: 500, widget: 'textarea' }
      },
      required: ['areaAtuacao', 'profissao', 'disponibilidade', 'possuiVeiculo', 'tempoDisponivel']
    }
  },

  {
    name: 'Solicitação de Doação para Desabrigados',
    description: 'Doe itens, alimentos ou recursos para famílias desabrigadas',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'DOACAO_DESABRIGADOS',
    requiresDocuments: false,
    estimatedDays: 2,
    priority: 4,
    category: 'Doações',
    icon: 'Gift',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_email', 'citizen_phone', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood'],
      properties: {
        tipoDoacao: { type: 'string', title: 'Tipo de Doação', enum: ['Alimentos Não Perecíveis', 'Água Mineral', 'Roupas', 'Cobertores', 'Produtos de Higiene', 'Medicamentos', 'Material de Limpeza', 'Móveis', 'Eletrodomésticos', 'Dinheiro', 'Outro'] },
        descricaoItens: { type: 'string', title: 'Descrição Detalhada dos Itens', maxLength: 1000, widget: 'textarea' },
        quantidade: { type: 'string', title: 'Quantidade/Volume Estimado', maxLength: 200 },
        condicaoItens: { type: 'string', title: 'Condição dos Itens', enum: ['Novos', 'Seminovos (Bom Estado)', 'Usados (Estado Regular)'] },
        necessitaColeta: { type: 'boolean', title: 'Necessita de Coleta no Local' },
        dataDisponibilidade: { type: 'string', title: 'Data de Disponibilidade', format: 'date' },
        horarioDisponibilidade: { type: 'string', title: 'Horário de Disponibilidade', enum: ['Manhã (8h-12h)', 'Tarde (13h-17h)', 'Noite (18h-20h)', 'Dia Inteiro', 'Flexível'] },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoDoacao', 'descricaoItens', 'quantidade', 'condicaoItens', 'necessitaColeta', 'dataDisponibilidade']
    }
  },

  // ========== COM_DADOS - SOLICITACAO_SIMPLES (5) ==========

  {
    name: 'Denúncia de Área de Risco',
    description: 'Denuncie áreas com potencial risco de desastres',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_AREA_RISCO',
    requiresDocuments: false,
    estimatedDays: 2,
    priority: 5,
    category: 'Denúncias',
    icon: 'AlertOctagon',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        endereco: { type: 'string', title: 'Endereço da Área de Risco', maxLength: 300 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        tipoRisco: { type: 'string', title: 'Tipo de Risco Identificado', enum: ['Deslizamento', 'Enchente', 'Desabamento', 'Árvore em Risco de Queda', 'Rachadura em Via Pública', 'Outro'] },
        descricao: { type: 'string', title: 'Descrição da Situação', maxLength: 1000, widget: 'textarea' },
        denunciaAnonima: { type: 'boolean', title: 'Desejo fazer denúncia anônima' }
      },
      required: ['endereco', 'tipoRisco', 'descricao']
    }
  },

  {
    name: 'Solicitação de Remoção Preventiva',
    description: 'Solicite remoção preventiva de família em risco iminente',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'REMOCAO_PREVENTIVA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Emergência',
    icon: 'TruckIcon',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_cpf'],
      properties: {
        endereco: { type: 'string', title: 'Endereço Completo', maxLength: 300 },
        quantidadePessoas: { type: 'integer', title: 'Quantidade de Pessoas a Remover', minimum: 1, maximum: 20 },
        motivoUrgencia: { type: 'string', title: 'Motivo da Urgência', maxLength: 500, widget: 'textarea' },
        necessitaTransporte: { type: 'boolean', title: 'Necessita de Transporte' },
        possuiBensVolumosos: { type: 'boolean', title: 'Possui Bens Volumosos a Transportar' }
      },
      required: ['endereco', 'quantidadePessoas', 'motivoUrgencia']
    }
  },

  {
    name: 'Registro de Alerta de Emergência',
    description: 'Registre situação de emergência que requer atenção imediata',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'ALERTA_EMERGENCIA',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 5,
    category: 'Emergência',
    icon: 'Siren',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        tipoEmergencia: { type: 'string', title: 'Tipo de Emergência', enum: ['Enchente em Andamento', 'Deslizamento Ocorrendo', 'Desabamento', 'Incêndio', 'Tempestade Severa', 'Outro'] },
        endereco: { type: 'string', title: 'Endereço/Localização', maxLength: 300 },
        descricaoSituacao: { type: 'string', title: 'Descrição da Situação', maxLength: 500, widget: 'textarea' },
        pessoasEmRisco: { type: 'integer', title: 'Número de Pessoas em Risco', minimum: 0, maximum: 100 },
        viasObstruidas: { type: 'boolean', title: 'Existem Vias Obstruídas' }
      },
      required: ['tipoEmergencia', 'endereco', 'descricaoSituacao']
    }
  },

  {
    name: 'Solicitação de Acionamento de Sirene de Alerta',
    description: 'Solicite acionamento de sirene de alerta em situação de risco',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'ACIONAMENTO_SIRENE',
    requiresDocuments: false,
    estimatedDays: null,
    priority: 5,
    category: 'Emergência',
    icon: 'Volume2',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_cpf'],
      properties: {
        localizacao: { type: 'string', title: 'Localização/Bairro', maxLength: 200 },
        motivoAcionamento: { type: 'string', title: 'Motivo do Acionamento', enum: ['Risco de Enchente', 'Risco de Deslizamento', 'Tempestade Severa', 'Evacuação Necessária', 'Outro'] },
        descricao: { type: 'string', title: 'Descrição da Situação', maxLength: 500, widget: 'textarea' },
        urgenciaExtrema: { type: 'boolean', title: 'Situação de Urgência Extrema' }
      },
      required: ['localizacao', 'motivoAcionamento', 'descricao']
    }
  },

  {
    name: 'Denúncia de Construção em Encosta',
    description: 'Denuncie construções irregulares em áreas de encosta ou risco',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DENUNCIA_CONSTRUCAO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Denúncias',
    icon: 'Building',
    color: '#f59e0b',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone', 'citizen_email'],
      properties: {
        endereco: { type: 'string', title: 'Endereço da Construção', maxLength: 300 },
        tipoTerreno: { type: 'string', title: 'Tipo de Terreno', enum: ['Encosta', 'Margem de Rio', 'Área Alagável', 'Solo Instável', 'Outro'] },
        estagioObra: { type: 'string', title: 'Estágio da Obra', enum: ['Terraplanagem', 'Fundação', 'Estrutura', 'Acabamento', 'Concluída'] },
        descricao: { type: 'string', title: 'Descrição Detalhada', maxLength: 1000, widget: 'textarea' },
        denunciaAnonima: { type: 'boolean', title: 'Desejo fazer denúncia anônima' }
      },
      required: ['endereco', 'tipoTerreno', 'estagioObra', 'descricao']
    }
  },

  // ========== SEM_DADOS - CONSULTIVO (4) ==========

  {
    name: 'Informações sobre Prevenção de Desastres',
    description: 'Consulte informações sobre como prevenir e se preparar para desastres',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Informações',
    icon: 'Info',
    color: '#3b82f6'
  },

  {
    name: 'Consulta de Mapa de Áreas de Risco',
    description: 'Consulte o mapa atualizado com áreas de risco do município',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 2,
    category: 'Mapas',
    icon: 'Map',
    color: '#ef4444'
  },

  {
    name: 'Alertas Meteorológicos',
    description: 'Receba alertas sobre condições meteorológicas adversas',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 3,
    category: 'Alertas',
    icon: 'Cloud',
    color: '#64748b'
  },

  {
    name: 'Consulta de Abrigos Disponíveis',
    description: 'Consulte localização e disponibilidade de abrigos temporários',
    departmentCode: 'DEFESA_CIVIL',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 3,
    category: 'Abrigos',
    icon: 'MapPin',
    color: '#10b981'
  }
];
