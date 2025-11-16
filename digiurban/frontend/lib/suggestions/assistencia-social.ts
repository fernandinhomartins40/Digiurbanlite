import { ServiceSuggestion } from './types';

export const assistenciasocialSuggestions: ServiceSuggestion[] = [
  {
    id: 'bolsa-familia',
    name: 'Cadastro Bolsa Família',
    description: 'Cadastro e atualização cadastral no Programa Bolsa Família',
    icon: 'Users',
    category: 'Transferência de Renda',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar Mensal (R$)', required: true },
    ]
  },
  {
    id: 'cesta-basica',
    name: 'Solicitação de Cesta Básica',
    description: 'Solicite cestas básicas de alimentos',
    icon: 'ShoppingBasket',
    category: 'Segurança Alimentar',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_pessoas_familia', type: 'number', label: 'Número de Pessoas na Família', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'situacao_vulnerabilidade', type: 'textarea', label: 'Descrição da Situação de Vulnerabilidade', required: true },
    ]
  },
  {
    id: 'bpc',
    name: 'Benefício de Prestação Continuada (BPC)',
    description: 'Cadastro para BPC - idosos e pessoas com deficiência',
    icon: 'HandHeart',
    category: 'Benefícios',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_beneficio', type: 'select', label: 'Tipo de Benefício', required: true },
      { name: 'possui_deficiencia', type: 'checkbox', label: 'Possui Deficiência', required: false },
      { name: 'idoso_65_mais', type: 'checkbox', label: 'Idoso com 65 anos ou mais', required: false },
      { name: 'renda_per_capita', type: 'number', label: 'Renda Per Capita Familiar (R$)', required: true },
    ]
  },
  {
    id: 'passe-livre',
    name: 'Passe Livre para Pessoas com Deficiência',
    description: 'Solicitação de passe livre no transporte público',
    icon: 'Bus',
    category: 'Transporte',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_deficiencia', type: 'select', label: 'Tipo de Deficiência', required: true },
      { name: 'laudo_medico', type: 'checkbox', label: 'Anexar Laudo Médico', required: true },
      { name: 'necessita_acompanhante', type: 'checkbox', label: 'Necessita Acompanhante', required: false },
    ]
  },
  {
    id: 'aluguel-social',
    name: 'Auxílio Aluguel Social',
    description: 'Auxílio financeiro para pagamento de aluguel',
    icon: 'Home',
    category: 'Habitação',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_atual', type: 'text', label: 'Endereço Atual', required: true },
      { name: 'valor_aluguel', type: 'number', label: 'Valor do Aluguel (R$)', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
      { name: 'motivo_solicitacao', type: 'textarea', label: 'Motivo da Solicitação', required: true },
    ]
  },
  {
    id: 'atendimento-psicologo',
    name: 'Atendimento Psicológico',
    description: 'Agende sessões com psicólogo do CRAS',
    icon: 'Brain',
    category: 'Atendimento Psicossocial',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'motivo_atendimento', type: 'textarea', label: 'Motivo do Atendimento', required: true },
      { name: 'cras_referencia', type: 'select', label: 'CRAS de Referência', required: true },
      { name: 'urgente', type: 'checkbox', label: 'Situação Urgente', required: false },
    ]
  },
  {
    id: 'cadastro-unico',
    name: 'Cadastro Único (CadÚnico)',
    description: 'Cadastramento no Cadastro Único para Programas Sociais',
    icon: 'FileText',
    category: 'Cadastro',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_membros_familia', type: 'number', label: 'Número de Membros da Família', required: true },
      { name: 'renda_total', type: 'number', label: 'Renda Total Familiar (R$)', required: true },
    ]
  },
  {
    id: 'acolhimento-institucional',
    name: 'Acolhimento Institucional',
    description: 'Solicitação de acolhimento para crianças, adolescentes ou idosos',
    icon: 'Home',
    category: 'Proteção',
    estimatedDays: 2,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'tipo_acolhimento', type: 'select', label: 'Tipo de Acolhimento', required: true },
      { name: 'motivo', type: 'textarea', label: 'Motivo do Acolhimento', required: true },
      { name: 'situacao_emergencia', type: 'checkbox', label: 'Situação de Emergência', required: false },
    ]
  },
  {
    id: 'programa-crianca-feliz',
    name: 'Programa Criança Feliz',
    description: 'Cadastro no programa de primeira infância',
    icon: 'Baby',
    category: 'Primeira Infância',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cadastro_unico', type: 'checkbox', label: 'Possui Cadastro Único', required: true },
    ]
  },
  {
    id: 'creas-atendimento',
    name: 'Atendimento CREAS',
    description: 'Atendimento especializado para situações de violação de direitos',
    icon: 'ShieldAlert',
    category: 'Proteção Especial',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: false },
      { name: 'tipo_violacao', type: 'select', label: 'Tipo de Violação', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição da Situação', required: true },
      { name: 'anonimo', type: 'checkbox', label: 'Denúncia Anônima', required: false },
      { name: 'urgente', type: 'checkbox', label: 'Situação Urgente', required: false },
    ]
  },
  {
    id: 'auxilio-natalidade',
    name: 'Auxílio Natalidade',
    description: 'Benefício eventual para nascimento de criança',
    icon: 'Baby',
    category: 'Benefícios Eventuais',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_mae', type: 'cpf', label: 'CPF da Mãe', required: true },
      { name: 'data_nascimento_bebe', type: 'date', label: 'Data de Nascimento do Bebê', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
    ]
  },
  {
    id: 'auxilio-funeral',
    name: 'Auxílio Funeral',
    description: 'Benefício eventual para despesas de funeral',
    icon: 'Heart',
    category: 'Benefícios Eventuais',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'data_obito', type: 'date', label: 'Data do Óbito', required: true },
      { name: 'parentesco', type: 'select', label: 'Parentesco com o Falecido', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
    ]
  },
  {
    id: 'cursos-qualificacao',
    name: 'Cursos de Qualificação Profissional',
    description: 'Inscrição em cursos gratuitos de capacitação',
    icon: 'BookOpen',
    category: 'Qualificação',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'escolaridade', type: 'select', label: 'Escolaridade', required: true },
      { name: 'curso_interesse', type: 'select', label: 'Curso de Interesse', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'idoso-convivencia',
    name: 'Centro de Convivência do Idoso',
    description: 'Cadastro em centro de convivência para idosos',
    icon: 'Users',
    category: 'Idoso',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'atividades_interesse', type: 'textarea', label: 'Atividades de Interesse', required: false },
      { name: 'restricao_saude', type: 'textarea', label: 'Restrições de Saúde', required: false },
    ]
  },
  {
    id: 'abrigo-temporario',
    name: 'Abrigo Temporário',
    description: 'Solicitação de abrigo temporário em situação de emergência',
    icon: 'Home',
    category: 'Emergência',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'num_pessoas', type: 'number', label: 'Número de Pessoas', required: true },
      { name: 'tem_criancas', type: 'checkbox', label: 'Há Crianças no Grupo', required: false },
      { name: 'tem_idosos', type: 'checkbox', label: 'Há Idosos no Grupo', required: false },
      { name: 'motivo_emergencia', type: 'textarea', label: 'Motivo da Emergência', required: true },
    ]
  },
  {
    id: 'violencia-domestica',
    name: 'Denúncia de Violência Doméstica',
    description: 'Registro e encaminhamento de casos de violência doméstica',
    icon: 'ShieldAlert',
    category: 'Proteção à Mulher',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_violencia', type: 'select', label: 'Tipo de Violência', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição da Situação', required: true },
      { name: 'tem_criancas', type: 'checkbox', label: 'Há Crianças Envolvidas', required: false },
      { name: 'situacao_risco', type: 'checkbox', label: 'Situação de Risco Imediato', required: false },
      { name: 'denuncia_anonima', type: 'checkbox', label: 'Denúncia Anônima', required: false },
    ]
  },
  {
    id: 'tarifa-social-energia',
    name: 'Tarifa Social de Energia Elétrica',
    description: 'Cadastro para desconto na conta de energia',
    icon: 'Zap',
    category: 'Tarifas Sociais',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'numero_instalacao', type: 'text', label: 'Número da Instalação (Conta de Luz)', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
      { name: 'cadastro_unico', type: 'text', label: 'NIS - Cadastro Único', required: true },
    ]
  },
  {
    id: 'minha-casa-minha-vida',
    name: 'Minha Casa Minha Vida',
    description: 'Cadastro para programa habitacional',
    icon: 'Home',
    category: 'Habitação',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_dependentes', type: 'number', label: 'Número de Dependentes', required: true },
      { name: 'imovel_proprio', type: 'checkbox', label: 'Possui Imóvel Próprio', required: false },
    ]
  },
  {
    id: 'atendimento-assistente-social',
    name: 'Atendimento com Assistente Social',
    description: 'Agendamento de atendimento individual ou familiar',
    icon: 'UserCheck',
    category: 'Atendimento',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'motivo_atendimento', type: 'textarea', label: 'Motivo do Atendimento', required: true },
      { name: 'cras_preferencia', type: 'select', label: 'CRAS de Preferência', required: true },
      { name: 'urgente', type: 'checkbox', label: 'Situação Urgente', required: false },
    ]
  },
  {
    id: 'programa-leite',
    name: 'Programa do Leite',
    description: 'Distribuição de leite para crianças e gestantes',
    icon: 'Milk',
    category: 'Segurança Alimentar',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_criancas_0_6', type: 'number', label: 'Crianças de 0 a 6 anos', required: true },
      { name: 'gestante', type: 'checkbox', label: 'Há Gestante na Família', required: false },
      { name: 'renda_per_capita', type: 'number', label: 'Renda Per Capita (R$)', required: true },
    ]
  },
  {
    id: 'banco-alimentos',
    name: 'Banco de Alimentos',
    description: 'Cadastro para recebimento de alimentos do banco de alimentos',
    icon: 'ShoppingBasket',
    category: 'Segurança Alimentar',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_pessoas_familia', type: 'number', label: 'Número de Pessoas na Família', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
    ]
  },
  {
    id: 'familia-acolhedora',
    name: 'Programa Família Acolhedora',
    description: 'Cadastro para ser família acolhedora',
    icon: 'Heart',
    category: 'Acolhimento',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'motivacao', type: 'textarea', label: 'Motivação para Acolher', required: true },
    ]
  },
  {
    id: 'adolescente-aprendiz',
    name: 'Programa Jovem Aprendiz',
    description: 'Cadastro de adolescentes no programa aprendiz',
    icon: 'Briefcase',
    category: 'Trabalho',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'escolaridade', type: 'select', label: 'Escolaridade', required: true },
      { name: 'area_interesse', type: 'select', label: 'Área de Interesse', required: true },
      { name: 'turno_escola', type: 'select', label: 'Turno da Escola', required: true },
    ]
  },
  {
    id: 'auxilio-vulnerabilidade',
    name: 'Auxílio Vulnerabilidade Temporária',
    description: 'Benefício emergencial para situações de vulnerabilidade',
    icon: 'AlertCircle',
    category: 'Benefícios Eventuais',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'situacao_vulnerabilidade', type: 'textarea', label: 'Descrição da Situação', required: true },
      { name: 'num_pessoas_afetadas', type: 'number', label: 'Número de Pessoas Afetadas', required: true },
      { name: 'renda_atual', type: 'number', label: 'Renda Atual (R$)', required: true },
    ]
  },
  {
    id: 'central-interprete-libras',
    name: 'Intérprete de Libras',
    description: 'Solicitação de intérprete de Libras',
    icon: 'Hand',
    category: 'Acessibilidade',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'finalidade', type: 'select', label: 'Finalidade', required: true },
      { name: 'data_necessidade', type: 'date', label: 'Data da Necessidade', required: true },
      { name: 'horario', type: 'text', label: 'Horário', required: true },
      { name: 'local', type: 'text', label: 'Local do Atendimento', required: true },
    ]
  },
  {
    id: 'documentacao-basica',
    name: 'Emissão de Documentação Básica',
    description: 'Auxílio para emissão de RG, CPF e outros documentos',
    icon: 'FileText',
    category: 'Documentação',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'documento_solicitado', type: 'select', label: 'Documento a Solicitar', required: true },
      { name: 'primeira_via', type: 'checkbox', label: 'Primeira Via', required: false },
      { name: 'motivo_solicitacao', type: 'textarea', label: 'Motivo da Solicitação', required: false },
    ]
  },
  {
    id: 'cadastro-isentos',
    name: 'Cadastro de Isentos (Concursos)',
    description: 'Declaração de hipossuficiência para isenção de taxas',
    icon: 'Award',
    category: 'Documentação',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'concurso_prova', type: 'text', label: 'Concurso/Prova', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'num_dependentes', type: 'number', label: 'Número de Dependentes', required: true },
    ]
  },
  {
    id: 'servico-convivencia-crianca',
    name: 'Serviço de Convivência para Crianças',
    description: 'Atividades socioeducativas para crianças de 6 a 14 anos',
    icon: 'Users',
    category: 'Convivência',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'turno_disponivel', type: 'select', label: 'Turno Disponível', required: true },
    ]
  },
  {
    id: 'servico-convivencia-adolescente',
    name: 'Serviço de Convivência para Adolescentes',
    description: 'Atividades para adolescentes de 15 a 17 anos',
    icon: 'Users',
    category: 'Convivência',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'escolaridade', type: 'select', label: 'Escolaridade', required: true },
      { name: 'atividades_interesse', type: 'textarea', label: 'Atividades de Interesse', required: false },
    ]
  },
  {
    id: 'acessuas-trabalho',
    name: 'Acessuas Trabalho',
    description: 'Programa de transporte para trabalho',
    icon: 'Bus',
    category: 'Trabalho',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_residencia', type: 'text', label: 'Endereço de Residência', required: true },
      { name: 'endereco_trabalho', type: 'text', label: 'Endereço do Trabalho', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'horario_trabalho', type: 'text', label: 'Horário de Trabalho', required: true },
    ]
  },
  {
    id: 'cadastro-artesao',
    name: 'Cadastro de Artesão',
    description: 'Registro de artesão para programas de economia solidária',
    icon: 'Palette',
    category: 'Economia Solidária',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_artesanato', type: 'select', label: 'Tipo de Artesanato', required: true },
      { name: 'tempo_atuacao', type: 'number', label: 'Tempo de Atuação (anos)', required: false },
      { name: 'interesse_cooperativa', type: 'checkbox', label: 'Interesse em Cooperativa', required: false },
    ]
  },
  {
    id: 'mediacao-conflitos',
    name: 'Mediação de Conflitos Familiares',
    description: 'Serviço de mediação para conflitos familiares',
    icon: 'Users',
    category: 'Mediação',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_conflito', type: 'select', label: 'Tipo de Conflito', required: true },
      { name: 'descricao_breve', type: 'textarea', label: 'Descrição Breve', required: true },
      { name: 'num_envolvidos', type: 'number', label: 'Número de Pessoas Envolvidas', required: false },
    ]
  },
  {
    id: 'inclusao-produtiva',
    name: 'Programa de Inclusão Produtiva',
    description: 'Encaminhamento para cursos e mercado de trabalho',
    icon: 'Briefcase',
    category: 'Trabalho',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'escolaridade', type: 'select', label: 'Escolaridade', required: true },
      { name: 'experiencia_profissional', type: 'textarea', label: 'Experiência Profissional', required: false },
      { name: 'area_interesse', type: 'select', label: 'Área de Interesse', required: true },
    ]
  },
  {
    id: 'cuidador-idoso',
    name: 'Programa Cuidador de Idoso',
    description: 'Cadastro para curso e programa de cuidadores',
    icon: 'Heart',
    category: 'Idoso',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'escolaridade', type: 'select', label: 'Escolaridade', required: true },
      { name: 'experiencia_anterior', type: 'checkbox', label: 'Possui Experiência Anterior', required: false },
      { name: 'disponibilidade', type: 'select', label: 'Disponibilidade de Horário', required: true },
    ]
  },
  {
    id: 'protecao-animais',
    name: 'Denúncia de Maus-Tratos a Animais',
    description: 'Registro de denúncia de maus-tratos',
    icon: 'Dog',
    category: 'Proteção',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_animal', type: 'select', label: 'Tipo de Animal', required: true },
      { name: 'local_ocorrencia', type: 'text', label: 'Local da Ocorrência', required: true },
      { name: 'descricao', type: 'textarea', label: 'Descrição da Situação', required: true },
      { name: 'denuncia_anonima', type: 'checkbox', label: 'Denúncia Anônima', required: false },
    ]
  },
  {
    id: 'orientacao-juridica',
    name: 'Orientação Jurídica Gratuita',
    description: 'Atendimento jurídico para famílias de baixa renda',
    icon: 'Scale',
    category: 'Jurídico',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'area_direito', type: 'select', label: 'Área do Direito', required: true },
      { name: 'descricao_caso', type: 'textarea', label: 'Descrição do Caso', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
    ]
  },
  {
    id: 'cadastro-defeso',
    name: 'Cadastro Seguro Defeso',
    description: 'Cadastro de pescadores para seguro defeso',
    icon: 'Fish',
    category: 'Trabalho',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'rg_pescador', type: 'text', label: 'RG de Pescador Profissional', required: true },
      { name: 'colonia_pescadores', type: 'text', label: 'Colônia de Pescadores', required: false },
    ]
  },
  {
    id: 'doacao-sangue-cadastro',
    name: 'Cadastro de Doador de Sangue',
    description: 'Cadastro para campanhas de doação de sangue',
    icon: 'Droplet',
    category: 'Saúde',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_sanguineo', type: 'select', label: 'Tipo Sanguíneo', required: false },
      { name: 'peso', type: 'number', label: 'Peso (kg)', required: true },
      { name: 'ja_doou_antes', type: 'checkbox', label: 'Já Doou Antes', required: false },
    ]
  },
  {
    id: 'programa-cisternas',
    name: 'Programa de Cisternas',
    description: 'Cadastro para construção de cisternas',
    icon: 'Droplets',
    category: 'Infraestrutura',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'endereco_imovel', type: 'text', label: 'Endereço do Imóvel', required: true },
      { name: 'area_terreno', type: 'number', label: 'Área do Terreno (m²)', required: true },
      { name: 'possui_poco', type: 'checkbox', label: 'Possui Poço', required: false },
      { name: 'num_moradores', type: 'number', label: 'Número de Moradores', required: true },
    ]
  },
  {
    id: 'grupo-gestantes',
    name: 'Grupo de Gestantes',
    description: 'Inscrição em grupo de apoio para gestantes',
    icon: 'Baby',
    category: 'Saúde',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_prevista_parto', type: 'date', label: 'Data Prevista do Parto', required: true },
      { name: 'primeira_gestacao', type: 'checkbox', label: 'Primeira Gestação', required: false },
      { name: 'cras_referencia', type: 'select', label: 'CRAS de Referência', required: true },
    ]
  },
  {
    id: 'inclusao-digital',
    name: 'Curso de Inclusão Digital',
    description: 'Curso gratuito de informática básica',
    icon: 'Monitor',
    category: 'Qualificação',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'escolaridade', type: 'select', label: 'Escolaridade', required: true },
      { name: 'nivel_conhecimento', type: 'select', label: 'Nível de Conhecimento em Informática', required: true },
      { name: 'turno_preferencia', type: 'select', label: 'Turno de Preferência', required: true },
    ]
  },
  {
    id: 'oficinas-artesanato',
    name: 'Oficinas de Artesanato',
    description: 'Inscrição em oficinas gratuitas de artesanato',
    icon: 'Scissors',
    category: 'Convivência',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_oficina', type: 'select', label: 'Tipo de Oficina', required: true },
      { name: 'nivel_experiencia', type: 'select', label: 'Nível de Experiência', required: true },
      { name: 'turno_disponibilidade', type: 'select', label: 'Turno de Disponibilidade', required: true },
    ]
  },
  {
    id: 'reconhecimento-paternidade',
    name: 'Reconhecimento de Paternidade',
    description: 'Encaminhamento para reconhecimento de paternidade',
    icon: 'Users',
    category: 'Jurídico',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_mae', type: 'cpf', label: 'CPF da Mãe', required: true },
      { name: 'data_nascimento_crianca', type: 'date', label: 'Data de Nascimento da Criança', required: true },
    ]
  },
  {
    id: 'acompanhamento-egressos',
    name: 'Acompanhamento de Egressos do Sistema Prisional',
    description: 'Programa de reintegração social',
    icon: 'UserCheck',
    category: 'Reintegração',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'data_saida', type: 'date', label: 'Data de Saída do Sistema', required: true },
      { name: 'tem_familia', type: 'checkbox', label: 'Possui Família de Referência', required: false },
      { name: 'necessidades', type: 'textarea', label: 'Necessidades Principais', required: true },
    ]
  },
  {
    id: 'crianca-desaparecida',
    name: 'Registro de Criança Desaparecida',
    description: 'Registro e encaminhamento de casos de desaparecimento',
    icon: 'AlertTriangle',
    category: 'Proteção',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'caracteristicas', type: 'textarea', label: 'Características Físicas', required: true },
      { name: 'local_desaparecimento', type: 'text', label: 'Local do Desaparecimento', required: true },
      { name: 'data_desaparecimento', type: 'date', label: 'Data do Desaparecimento', required: true },
    ]
  },
  {
    id: 'programa-bolsa-universitaria',
    name: 'Bolsa Universitária Municipal',
    description: 'Solicitação de bolsa para estudantes universitários',
    icon: 'GraduationCap',
    category: 'Educação',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'instituicao', type: 'text', label: 'Instituição de Ensino', required: true },
      { name: 'curso', type: 'text', label: 'Curso', required: true },
      { name: 'semestre', type: 'number', label: 'Semestre Atual', required: true },
      { name: 'renda_familiar', type: 'number', label: 'Renda Familiar (R$)', required: true },
      { name: 'num_dependentes', type: 'number', label: 'Número de Dependentes', required: true },
    ]
  },
  {
    id: 'atestado-residencia',
    name: 'Atestado de Residência',
    description: 'Emissão de atestado de residência',
    icon: 'Home',
    category: 'Documentação',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tempo_residencia', type: 'text', label: 'Tempo de Residência no Endereço', required: true },
      { name: 'finalidade', type: 'text', label: 'Finalidade do Atestado', required: true },
    ]
  }
];
