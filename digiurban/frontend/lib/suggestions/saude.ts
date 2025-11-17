import { ServiceSuggestion } from './types';

export const saudeSuggestions: ServiceSuggestion[] = [
  {
    id: 'agendamento-consulta',
    name: 'Agendamento de Consulta',
    description: 'Agende consultas médicas em unidades básicas de saúde',
    icon: 'Stethoscope',
    category: 'Agendamento',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'especialidade', type: 'select', label: 'Especialidade', required: true },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde Preferida', required: true },
      { name: 'periodo_preferencia', type: 'select', label: 'Período de Preferência', required: false },
      { name: 'observacoes', type: 'textarea', label: 'Observações', required: false },
    ]
  },
  {
    id: 'solicitacao-medicamento',
    name: 'Solicitação de Medicamento',
    description: 'Solicite medicamentos da farmácia municipal',
    icon: 'Pill',
    category: 'Farmácia',
    estimatedDays: 3,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cartao_sus', type: 'text', label: 'Número do Cartão SUS', required: true },
      { name: 'medicamento', type: 'text', label: 'Nome do Medicamento', required: true },
      { name: 'dosagem', type: 'text', label: 'Dosagem Prescrita', required: true },
      { name: 'medico_prescritor', type: 'text', label: 'Nome do Médico Prescritor', required: true },
      { name: 'uso_continuo', type: 'checkbox', label: 'Uso Contínuo', required: false },
    ]
  },
  {
    id: 'cadastro-gestante',
    name: 'Cadastro de Gestante',
    description: 'Inscrição no programa de pré-natal',
    icon: 'Baby',
    category: 'Pré-Natal',
    estimatedDays: 2,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'data_ultima_menstruacao', type: 'date', label: 'Data da Última Menstruação (DUM)', required: true },
      { name: 'primeira_gestacao', type: 'checkbox', label: 'Primeira Gestação', required: false },
      { name: 'unidade_preferencia', type: 'select', label: 'Unidade de Saúde para Pré-Natal', required: true },
    ]
  },
  {
    id: 'vacinacao-agendamento',
    name: 'Agendamento de Vacinação',
    description: 'Agende vacinas e imunização',
    icon: 'Syringe',
    category: 'Vacinação',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_vacina', type: 'select', label: 'Tipo de Vacina', required: true },
      { name: 'posto_vacinacao', type: 'select', label: 'Posto de Vacinação', required: true },
      { name: 'carteira_vacinacao', type: 'text', label: 'Número da Carteira de Vacinação', required: false },
    ]
  },
  {
    id: 'exames-laboratoriais',
    name: 'Solicitação de Exames',
    description: 'Solicite exames laboratoriais',
    icon: 'TestTube',
    category: 'Exames',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cartao_sus', type: 'text', label: 'Cartão SUS', required: true },
      { name: 'tipo_exame', type: 'select', label: 'Tipo de Exame', required: true },
      { name: 'medico_solicitante', type: 'text', label: 'Médico Solicitante', required: true },
      { name: 'laboratorio_preferencia', type: 'select', label: 'Laboratório de Preferência', required: false },
      { name: 'jejum_necessario', type: 'checkbox', label: 'Exame Requer Jejum', required: false },
    ]
  },
  {
    id: 'tratamento-especial',
    name: 'Tratamento Fora de Domicílio (TFD)',
    description: 'Solicite TFD para tratamento especializado em outro município',
    icon: 'Ambulance',
    category: 'TFD',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cartao_sus', type: 'text', label: 'Cartão SUS', required: true },
      { name: 'tipo_tratamento', type: 'text', label: 'Tipo de Tratamento Necessário', required: true },
      { name: 'cidade_destino', type: 'text', label: 'Cidade de Destino', required: true },
      { name: 'medico_referencia', type: 'text', label: 'Médico de Referência', required: true },
      { name: 'acompanhante', type: 'checkbox', label: 'Necessita Acompanhante', required: false },
      { name: 'transporte', type: 'checkbox', label: 'Necessita Transporte', required: false },
    ],
    linkedCitizensConfig: {
      enabled: true,
      links: [{
        linkType: 'COMPANION',
        role: 'COMPANION',
        label: 'Acompanhante',
        required: false,
        mapFromLegacyFields: {
          name: 'nomeAcompanhante',
          cpf: 'cpfAcompanhante'
        },
        contextFields: [
          { id: 'parentescoAcompanhante', sourceField: 'parentescoAcompanhante' }
        ],
        expectedRelationships: ['SPOUSE', 'SON', 'DAUGHTER', 'MOTHER', 'FATHER', 'SIBLING']
      }]
    }
  },
  {
    id: 'programa-hiperdia',
    name: 'Programa Hiperdia',
    description: 'Cadastro para hipertensos e diabéticos',
    icon: 'Heart',
    category: 'Programas',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'hipertensao', type: 'checkbox', label: 'Hipertensão', required: false },
      { name: 'diabetes', type: 'checkbox', label: 'Diabetes', required: false },
      { name: 'unidade_acompanhamento', type: 'select', label: 'Unidade para Acompanhamento', required: true },
    ]
  },
  {
    id: 'saude-bucal',
    name: 'Consulta Odontológica',
    description: 'Agende consultas no dentista',
    icon: 'Smile',
    category: 'Odontologia',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_atendimento', type: 'select', label: 'Tipo de Atendimento', required: true },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
      { name: 'primeira_consulta', type: 'checkbox', label: 'Primeira Consulta', required: false },
      { name: 'urgencia', type: 'checkbox', label: 'Urgência/Dor', required: false },
    ]
  },
  {
    id: 'fisioterapia',
    name: 'Sessões de Fisioterapia',
    description: 'Solicitação de fisioterapia',
    icon: 'Activity',
    category: 'Reabilitação',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_tratamento', type: 'select', label: 'Tipo de Tratamento', required: true },
      { name: 'medico_solicitante', type: 'text', label: 'Médico Solicitante', required: true },
      { name: 'diagnostico', type: 'textarea', label: 'Diagnóstico', required: true },
      { name: 'sessoes_semana', type: 'number', label: 'Sessões por Semana', required: false },
      { name: 'mobilidade_reduzida', type: 'checkbox', label: 'Mobilidade Reduzida', required: false },
    ]
  },
  {
    id: 'psicologia-saude',
    name: 'Atendimento Psicológico',
    description: 'Agende sessões com psicólogo',
    icon: 'Brain',
    category: 'Saúde Mental',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_atendimento', type: 'select', label: 'Tipo de Atendimento', required: true },
      { name: 'caps_referencia', type: 'select', label: 'CAPS de Referência', required: false },
      { name: 'primeira_vez', type: 'checkbox', label: 'Primeira Vez em Atendimento Psicológico', required: false },
      { name: 'emergencia', type: 'checkbox', label: 'Situação de Emergência', required: false },
    ]
  },
  {
    id: 'cartao-sus',
    name: 'Emissão de Cartão SUS',
    description: 'Solicite a emissão ou segunda via do Cartão SUS',
    icon: 'CreditCard',
    category: 'Documentação',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'municipio_nascimento', type: 'text', label: 'Município de Nascimento', required: true },
      { name: 'segunda_via', type: 'checkbox', label: 'Segunda Via', required: false },
    ]
  },
  {
    id: 'atestado-saude',
    name: 'Atestado de Saúde Ocupacional (ASO)',
    description: 'Emissão de atestado de saúde para trabalho',
    icon: 'FileText',
    category: 'Atestados',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'empresa_destino', type: 'text', label: 'Empresa/Órgão de Destino', required: true },
      { name: 'funcao', type: 'text', label: 'Função a Exercer', required: true },
      { name: 'tipo_aso', type: 'select', label: 'Tipo de ASO', required: true },
      { name: 'unidade_atendimento', type: 'select', label: 'Unidade de Atendimento', required: true },
    ]
  },
  {
    id: 'planejamento-familiar',
    name: 'Programa de Planejamento Familiar',
    description: 'Cadastro em programa de planejamento familiar',
    icon: 'Users',
    category: 'Programas',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'num_filhos', type: 'number', label: 'Número de Filhos', required: false },
      { name: 'metodo_interesse', type: 'select', label: 'Método de Interesse', required: false },
      { name: 'unidade_referencia', type: 'select', label: 'Unidade de Referência', required: true },
    ]
  },
  {
    id: 'teste-covid',
    name: 'Teste de COVID-19',
    description: 'Agendamento de teste para COVID-19',
    icon: 'TestTube',
    category: 'Exames',
    estimatedDays: 2,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_sintomas', type: 'date', label: 'Data de Início dos Sintomas', required: false },
      { name: 'sintomas', type: 'textarea', label: 'Sintomas Apresentados', required: false },
      { name: 'tipo_teste', type: 'select', label: 'Tipo de Teste', required: true },
      { name: 'contato_confirmado', type: 'checkbox', label: 'Teve Contato com Caso Confirmado', required: false },
      { name: 'posto_coleta', type: 'select', label: 'Posto de Coleta', required: true },
    ]
  },
  {
    id: 'home-care',
    name: 'Atendimento Domiciliar (Home Care)',
    description: 'Solicitação de atendimento médico em domicílio',
    icon: 'Home',
    category: 'Atendimento',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'condicao_saude', type: 'textarea', label: 'Condição de Saúde/Diagnóstico', required: true },
      { name: 'idade_paciente', type: 'number', label: 'Idade do Paciente', required: true },
      { name: 'acamado', type: 'checkbox', label: 'Paciente Acamado', required: false },
      { name: 'cuidador', type: 'text', label: 'Nome do Cuidador/Responsável', required: true },
    ]
  },
  {
    id: 'mamografia',
    name: 'Agendamento de Mamografia',
    description: 'Agende exame de mamografia preventiva',
    icon: 'Activity',
    category: 'Exames',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'primeira_mamografia', type: 'checkbox', label: 'Primeira Mamografia', required: false },
      { name: 'historico_familiar', type: 'checkbox', label: 'Histórico Familiar de Câncer de Mama', required: false },
      { name: 'data_ultima_mamografia', type: 'date', label: 'Data da Última Mamografia', required: false },
      { name: 'unidade_preferencia', type: 'select', label: 'Unidade de Preferência', required: true },
    ]
  },
  {
    id: 'preventivo',
    name: 'Exame Preventivo (Papanicolau)',
    description: 'Agendamento de exame preventivo ginecológico',
    icon: 'FileCheck',
    category: 'Exames',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_ultimo_preventivo', type: 'date', label: 'Data do Último Preventivo', required: false },
      { name: 'primeira_vez', type: 'checkbox', label: 'Primeira Vez', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'nutricao',
    name: 'Consulta Nutricional',
    description: 'Agendamento com nutricionista',
    icon: 'Apple',
    category: 'Consultas',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'peso', type: 'number', label: 'Peso Atual (kg)', required: false },
      { name: 'altura', type: 'number', label: 'Altura (cm)', required: false },
      { name: 'objetivo', type: 'select', label: 'Objetivo da Consulta', required: true },
      { name: 'doenca_cronica', type: 'checkbox', label: 'Possui Doença Crônica', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'nebulizacao',
    name: 'Nebulização',
    description: 'Solicitação de nebulização em unidade de saúde',
    icon: 'Wind',
    category: 'Procedimentos',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'prescricao_medica', type: 'checkbox', label: 'Possui Prescrição Médica', required: true },
      { name: 'medicamento', type: 'text', label: 'Medicamento a ser Nebulizado', required: true },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
      { name: 'crianca', type: 'checkbox', label: 'Paciente é Criança (menor de 12 anos)', required: false },
    ]
  },
  {
    id: 'curativos',
    name: 'Curativos',
    description: 'Agendamento para realização de curativos',
    icon: 'Bandage',
    category: 'Procedimentos',
    estimatedDays: 2,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_ferida', type: 'select', label: 'Tipo de Ferida', required: true },
      { name: 'localizacao', type: 'text', label: 'Localização da Ferida', required: true },
      { name: 'frequencia_troca', type: 'select', label: 'Frequência de Troca', required: true },
      { name: 'diabetico', type: 'checkbox', label: 'Paciente Diabético', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'aferimento-pressao',
    name: 'Aferição de Pressão',
    description: 'Aferição de pressão arterial',
    icon: 'Activity',
    category: 'Procedimentos',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'hipertenso', type: 'checkbox', label: 'Paciente Hipertenso', required: false },
      { name: 'medicacao_controlada', type: 'checkbox', label: 'Faz Uso de Medicação Controlada', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'teste-glicemia',
    name: 'Teste de Glicemia',
    description: 'Teste de glicemia (medição de açúcar no sangue)',
    icon: 'Droplet',
    category: 'Exames',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'diabetico', type: 'checkbox', label: 'Paciente Diabético', required: false },
      { name: 'jejum', type: 'checkbox', label: 'Em Jejum', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'insulina',
    name: 'Fornecimento de Insulina',
    description: 'Solicitação de insulina para diabéticos',
    icon: 'Syringe',
    category: 'Farmácia',
    estimatedDays: 3,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cartao_sus', type: 'text', label: 'Cartão SUS', required: true },
      { name: 'tipo_insulina', type: 'select', label: 'Tipo de Insulina', required: true },
      { name: 'dosagem_diaria', type: 'text', label: 'Dosagem Diária Prescrita', required: true },
      { name: 'medico_prescritor', type: 'text', label: 'Médico Prescritor', required: true },
      { name: 'tipo_diabetes', type: 'select', label: 'Tipo de Diabetes', required: true },
    ]
  },
  {
    id: 'cadeira-rodas',
    name: 'Empréstimo de Cadeira de Rodas',
    description: 'Solicitação de empréstimo de cadeira de rodas',
    icon: 'Accessibility',
    category: 'Equipamentos',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'motivo', type: 'textarea', label: 'Motivo da Necessidade', required: true },
      { name: 'periodo_uso', type: 'select', label: 'Período de Uso Estimado', required: true },
      { name: 'laudo_medico', type: 'checkbox', label: 'Possui Laudo Médico', required: true },
    ]
  },
  {
    id: 'muletas',
    name: 'Empréstimo de Muletas',
    description: 'Solicitação de empréstimo de muletas',
    icon: 'Crutch',
    category: 'Equipamentos',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'altura_paciente', type: 'number', label: 'Altura do Paciente (cm)', required: true },
      { name: 'tipo_muleta', type: 'select', label: 'Tipo de Muleta', required: true },
      { name: 'motivo', type: 'text', label: 'Motivo da Necessidade', required: true },
      { name: 'periodo_uso', type: 'select', label: 'Período Estimado de Uso', required: true },
    ]
  },
  {
    id: 'fraldas-geriatricas',
    name: 'Fornecimento de Fraldas Geriátricas',
    description: 'Solicitação de fraldas geriátricas',
    icon: 'Package',
    category: 'Insumos',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'idade_paciente', type: 'number', label: 'Idade do Paciente', required: true },
      { name: 'tamanho', type: 'select', label: 'Tamanho da Fralda', required: true },
      { name: 'quantidade_mensal', type: 'number', label: 'Quantidade Mensal Necessária', required: true },
      { name: 'laudo_medico', type: 'checkbox', label: 'Possui Laudo Médico', required: true },
      { name: 'acamado', type: 'checkbox', label: 'Paciente Acamado', required: false },
    ]
  },
  {
    id: 'eletrocardiograma',
    name: 'Eletrocardiograma (ECG)',
    description: 'Agendamento de eletrocardiograma',
    icon: 'Activity',
    category: 'Exames',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'medico_solicitante', type: 'text', label: 'Médico Solicitante', required: true },
      { name: 'sintomas', type: 'textarea', label: 'Sintomas Apresentados', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'ultrassom',
    name: 'Ultrassonografia',
    description: 'Agendamento de exame de ultrassom',
    icon: 'ScanLine',
    category: 'Exames',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_ultrassom', type: 'select', label: 'Tipo de Ultrassom', required: true },
      { name: 'medico_solicitante', type: 'text', label: 'Médico Solicitante', required: true },
      { name: 'gestante', type: 'checkbox', label: 'Paciente Gestante', required: false },
      { name: 'semanas_gestacao', type: 'number', label: 'Semanas de Gestação (se aplicável)', required: false },
      { name: 'unidade_referencia', type: 'select', label: 'Unidade de Referência', required: true },
    ]
  },
  {
    id: 'raio-x',
    name: 'Raio-X',
    description: 'Agendamento de exame de raio-x',
    icon: 'Radiation',
    category: 'Exames',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'regiao_corpo', type: 'select', label: 'Região do Corpo', required: true },
      { name: 'medico_solicitante', type: 'text', label: 'Médico Solicitante', required: true },
      { name: 'motivo', type: 'text', label: 'Motivo do Exame', required: true },
      { name: 'gestante', type: 'checkbox', label: 'Paciente Gestante', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'saude-mental-caps',
    name: 'CAPS - Centro de Atenção Psicossocial',
    description: 'Cadastro para atendimento em CAPS',
    icon: 'Heart',
    category: 'Saúde Mental',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'tipo_atendimento', type: 'select', label: 'Tipo de Atendimento', required: true },
      { name: 'caps_unidade', type: 'select', label: 'Unidade CAPS', required: true },
      { name: 'emergencia', type: 'checkbox', label: 'Situação de Emergência', required: false },
    ]
  },
  {
    id: 'programa-tabagismo',
    name: 'Programa de Combate ao Tabagismo',
    description: 'Inscrição em programa para parar de fumar',
    icon: 'Cigarette',
    category: 'Programas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'anos_fumante', type: 'number', label: 'Há quantos anos fuma?', required: true },
      { name: 'cigarros_dia', type: 'number', label: 'Cigarros por dia', required: true },
      { name: 'tentativas_anteriores', type: 'number', label: 'Tentativas Anteriores de Parar', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'alongamento-terceira-idade',
    name: 'Grupo de Alongamento - Terceira Idade',
    description: 'Inscrição em grupo de alongamento para idosos',
    icon: 'Users',
    category: 'Atividades',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'restricao_medica', type: 'checkbox', label: 'Possui Restrição Médica', required: false },
      { name: 'descricao_restricao', type: 'textarea', label: 'Descrição da Restrição', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'atendimento-fonoaudiologo',
    name: 'Atendimento Fonoaudiológico',
    description: 'Agendamento com fonoaudiólogo',
    icon: 'Mic',
    category: 'Consultas',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_problema', type: 'select', label: 'Tipo de Problema', required: true },
      { name: 'medico_encaminhamento', type: 'text', label: 'Médico que Encaminhou', required: false },
      { name: 'crianca', type: 'checkbox', label: 'Paciente é Criança', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'terapia-ocupacional',
    name: 'Terapia Ocupacional',
    description: 'Atendimento em terapia ocupacional',
    icon: 'Puzzle',
    category: 'Reabilitação',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'diagnostico', type: 'textarea', label: 'Diagnóstico', required: true },
      { name: 'medico_solicitante', type: 'text', label: 'Médico Solicitante', required: true },
      { name: 'deficiencia', type: 'checkbox', label: 'Possui Deficiência', required: false },
      { name: 'unidade_referencia', type: 'select', label: 'Unidade de Referência', required: true },
    ]
  },
  {
    id: 'teste-orelhinha',
    name: 'Teste da Orelhinha',
    description: 'Agendamento de triagem auditiva neonatal',
    icon: 'Baby',
    category: 'Exames',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento_bebe', type: 'date', label: 'Data de Nascimento do Bebê', required: true },
      { name: 'peso_nascimento', type: 'number', label: 'Peso ao Nascer (gramas)', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'teste-pezinho',
    name: 'Teste do Pezinho',
    description: 'Agendamento de triagem neonatal (teste do pezinho)',
    icon: 'Baby',
    category: 'Exames',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento_bebe', type: 'date', label: 'Data de Nascimento do Bebê', required: true },
      { name: 'idade_bebe_dias', type: 'number', label: 'Idade do Bebê (em dias)', required: true },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'acompanhamento-puericultura',
    name: 'Acompanhamento de Puericultura',
    description: 'Acompanhamento do desenvolvimento infantil',
    icon: 'Baby',
    category: 'Programas',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento_crianca', type: 'date', label: 'Data de Nascimento da Criança', required: true },
      { name: 'peso_atual', type: 'number', label: 'Peso Atual (kg)', required: false },
      { name: 'altura_atual', type: 'number', label: 'Altura Atual (cm)', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'atestado-acompanhante',
    name: 'Atestado para Acompanhante',
    description: 'Emissão de atestado para acompanhante de paciente',
    icon: 'FileText',
    category: 'Atestados',
    estimatedDays: 2,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'cpf_acompanhante', type: 'cpf', label: 'CPF do Acompanhante', required: true },
      { name: 'relacao', type: 'select', label: 'Relação com o Paciente', required: true },
      { name: 'data_atendimento', type: 'date', label: 'Data do Atendimento', required: true },
      { name: 'periodo_acompanhamento', type: 'select', label: 'Período de Acompanhamento', required: true },
    ],
    linkedCitizensConfig: {
      enabled: true,
      links: [{
        linkType: 'COMPANION',
        role: 'COMPANION',
        label: 'Acompanhante',
        required: true,
        mapFromLegacyFields: {
          cpf: 'cpf_acompanhante'
        },
        contextFields: [
          { id: 'relacao', sourceField: 'relacao' },
          { id: 'dataAtendimento', sourceField: 'data_atendimento' },
          { id: 'periodoAcompanhamento', sourceField: 'periodo_acompanhamento' }
        ],
        expectedRelationships: ['SPOUSE', 'SON', 'DAUGHTER', 'MOTHER', 'FATHER', 'SIBLING', 'OTHER']
      }]
    }
  },
  {
    id: 'programa-obesidade',
    name: 'Programa de Combate à Obesidade',
    description: 'Inscrição em programa multidisciplinar para obesidade',
    icon: 'Scale',
    category: 'Programas',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'peso', type: 'number', label: 'Peso Atual (kg)', required: true },
      { name: 'altura', type: 'number', label: 'Altura (cm)', required: true },
      { name: 'doenca_associada', type: 'checkbox', label: 'Possui Doença Associada (diabetes, hipertensão)', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'saude-bucal-crianca',
    name: 'Primeira Consulta Odontológica Infantil',
    description: 'Primeira consulta odontológica para crianças',
    icon: 'Smile',
    category: 'Odontologia',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'data_nascimento_crianca', type: 'date', label: 'Data de Nascimento da Criança', required: true },
      { name: 'idade_crianca', type: 'number', label: 'Idade da Criança (anos)', required: true },
      { name: 'primeira_consulta', type: 'checkbox', label: 'Primeira Consulta ao Dentista', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'aplicacao-injecao',
    name: 'Aplicação de Injeção',
    description: 'Aplicação de medicamentos injetáveis',
    icon: 'Syringe',
    category: 'Procedimentos',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'medicamento', type: 'text', label: 'Nome do Medicamento', required: true },
      { name: 'via_administracao', type: 'select', label: 'Via de Administração', required: true },
      { name: 'prescricao_medica', type: 'checkbox', label: 'Possui Prescrição Médica', required: true },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'circuncisao',
    name: 'Cirurgia de Fimose (Circuncisão)',
    description: 'Solicitação de cirurgia de fimose',
    icon: 'Scissors',
    category: 'Cirurgias',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'idade_paciente', type: 'number', label: 'Idade do Paciente', required: true },
      { name: 'medico_encaminhamento', type: 'text', label: 'Médico que Encaminhou', required: true },
      { name: 'grau_fimose', type: 'select', label: 'Grau da Fimose', required: false },
    ]
  },
  {
    id: 'retirada-pontos',
    name: 'Retirada de Pontos',
    description: 'Agendamento para retirada de pontos cirúrgicos',
    icon: 'Scissors',
    category: 'Procedimentos',
    estimatedDays: 2,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'local_pontos', type: 'text', label: 'Local dos Pontos', required: true },
      { name: 'data_cirurgia', type: 'date', label: 'Data da Cirurgia', required: true },
      { name: 'quantidade_pontos', type: 'number', label: 'Quantidade de Pontos (aproximada)', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'atestado-sanidade',
    name: 'Atestado de Sanidade Mental',
    description: 'Emissão de atestado de sanidade mental',
    icon: 'FileCheck',
    category: 'Atestados',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'finalidade', type: 'text', label: 'Finalidade do Atestado', required: true },
      { name: 'orgao_destino', type: 'text', label: 'Órgão de Destino', required: true },
    ]
  },
  {
    id: 'coleta-preventivo-homem',
    name: 'Exame de Próstata (PSA)',
    description: 'Agendamento de exame PSA e consulta urológica',
    icon: 'Activity',
    category: 'Exames',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'idade', type: 'number', label: 'Idade', required: true },
      { name: 'historico_familiar', type: 'checkbox', label: 'Histórico Familiar de Câncer de Próstata', required: false },
      { name: 'primeiro_exame', type: 'checkbox', label: 'Primeiro Exame', required: false },
      { name: 'unidade_saude', type: 'select', label: 'Unidade de Saúde', required: true },
    ]
  },
  {
    id: 'solicitacao-oxigenio',
    name: 'Fornecimento de Oxigênio Domiciliar',
    description: 'Solicitação de cilindro de oxigênio para uso domiciliar',
    icon: 'Wind',
    category: 'Equipamentos',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'diagnostico', type: 'textarea', label: 'Diagnóstico Médico', required: true },
      { name: 'medico_responsavel', type: 'text', label: 'Médico Responsável', required: true },
      { name: 'fluxo_oxigenio', type: 'text', label: 'Fluxo de Oxigênio Prescrito', required: true },
      { name: 'uso_continuo', type: 'checkbox', label: 'Uso Contínuo (24h)', required: false },
    ]
  },
  {
    id: 'programa-hanseniase',
    name: 'Programa de Controle da Hanseníase',
    description: 'Cadastro e acompanhamento de hanseníase',
    icon: 'Shield',
    category: 'Programas',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_caso', type: 'select', label: 'Tipo de Caso', required: true },
      { name: 'contatos_domiciliares', type: 'number', label: 'Número de Contatos Domiciliares', required: false },
      { name: 'unidade_referencia', type: 'select', label: 'Unidade de Referência', required: true },
    ]
  },
  {
    id: 'programa-tuberculose',
    name: 'Programa de Controle da Tuberculose',
    description: 'Cadastro e acompanhamento de tuberculose',
    icon: 'Lungs',
    category: 'Programas',
    estimatedDays: 3,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'tipo_tuberculose', type: 'select', label: 'Tipo de Tuberculose', required: true },
      { name: 'tratamento_supervisionado', type: 'checkbox', label: 'Necessita Tratamento Supervisionado', required: false },
      { name: 'unidade_referencia', type: 'select', label: 'Unidade de Referência', required: true },
    ]
  }
];
