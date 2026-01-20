/**
 * SEED DE SERVIÇOS - SECRETARIA DE SERVIÇOS PÚBLICOS
 * Total: 20 serviços (17 COM_DADOS + 3 SEM_DADOS)
 */

import { ServiceDefinition, ServiceSubtype } from './types';

export const publicServices: ServiceDefinition[] = [
  {
    name: 'Iluminação Pública (Poste Queimado)',
    description: 'Solicitação de reparo de iluminação pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'ILUMINACAO_PUBLICA',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 4,
    category: 'Iluminação',
    icon: 'Lightbulb',
    color: '#facc15',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        enderecoPoste: { type: 'string', title: 'Endereço do Poste', maxLength: 300 },
        numeroPoste: { type: 'string', title: 'Número do Poste (se visível)', maxLength: 50 },
        tipoProblema: { type: 'string', title: 'Tipo de Problema', enum: ['Lâmpada Queimada', 'Poste Danificado', 'Fiação Exposta', 'Acende Durante o Dia', 'Outro'] },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoPoste', 'tipoProblema']
    }
  },

  {
    name: 'Limpeza Urbana e Coleta de Lixo',
    description: 'Solicitações relacionadas a limpeza urbana e coleta de lixo',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'LIMPEZA_URBANA',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Limpeza',
    icon: 'Trash2',
    color: '#84cc16',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Coleta Não Realizada', 'Coleta Especial (Entulho)', 'Coleta de Móveis', 'Limpeza de Terreno', 'Outro'] },
        enderecoProblema: { type: 'string', title: 'Endereço', maxLength: 300 },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoSolicitacao', 'enderecoProblema']
    }
  },

  {
    name: 'Solicitação de Capina e Roçagem',
    description: 'Solicitação de capina e limpeza de terrenos públicos',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CAPINA_ROCAGEM',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 3,
    category: 'Limpeza',
    icon: 'Shovel',
    color: '#65a30d',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoArea: { type: 'string', title: 'Tipo de Área', enum: ['Terreno Baldio', 'Calçada', 'Praça', 'Via Pública', 'Outro'] },
        enderecoArea: { type: 'string', title: 'Endereço da Área', maxLength: 300 },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoArea', 'enderecoArea']
    }
  },

  {
    name: 'Desobstrução de Bueiro',
    description: 'Solicitação de limpeza e desobstrução de bueiros',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DESOBSTRUCAO_BUEIRO',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 4,
    category: 'Drenagem',
    icon: 'Droplet',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        enderecoBueiro: { type: 'string', title: 'Endereço do Bueiro', maxLength: 300 },
        gravidade: { type: 'string', title: 'Gravidade', enum: ['Normal', 'Urgente (Alagamento)'] },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoBueiro', 'gravidade']
    }
  },

  {
    name: 'Registro de Problema com Foto',
    description: 'Registro geral de problemas em serviços públicos com anexo de foto',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'REGISTRO_PROBLEMA_FOTO',
    requiresDocuments: true,
    requiredDocuments: ['Foto do Problema'],
    estimatedDays: 10,
    priority: 3,
    category: 'Geral',
    icon: 'Camera',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        categoriaProblema: { type: 'string', title: 'Categoria do Problema', enum: ['Iluminação', 'Limpeza', 'Via Pública', 'Drenagem', 'Sinalização', 'Outro'] },
        enderecoProblema: { type: 'string', title: 'Endereço do Problema', maxLength: 300 },
        descricaoProblema: { type: 'string', title: 'Descrição do Problema', minLength: 20, maxLength: 1000, widget: 'textarea' }
      },
      required: ['categoriaProblema', 'enderecoProblema', 'descricaoProblema']
    }
  },

  {
    name: 'Coleta de Lixo Eletrônico',
    description: 'Solicitação de coleta especial de lixo eletrônico e equipamentos',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'COLETA_ELETRONICO',
    requiresDocuments: false,
    estimatedDays: 7,
    priority: 3,
    category: 'Coleta Especial',
    icon: 'Laptop',
    color: '#6366f1',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_phone'],
      properties: {
        enderecoColeta: { type: 'string', title: 'Endereço para Coleta', maxLength: 300 },
        tipoEquipamento: { type: 'string', title: 'Tipo de Equipamento', enum: ['Computador/Notebook', 'TV', 'Celular/Tablet', 'Impressora', 'Eletrodomésticos', 'Cabos e Acessórios', 'Baterias', 'Outro'] },
        quantidadeItens: { type: 'integer', title: 'Quantidade de Itens', minimum: 1, maximum: 50 },
        descricao: { type: 'string', title: 'Descrição dos Itens', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoColeta', 'tipoEquipamento', 'quantidadeItens']
    }
  },

  {
    name: 'Pintura de Meio-Fio',
    description: 'Solicitação de pintura de meio-fio',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'PINTURA_MEIO_FIO',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 2,
    category: 'Manutenção',
    icon: 'PaintBucket',
    color: '#a855f7',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        enderecoRua: { type: 'string', title: 'Endereço da Rua', maxLength: 300 },
        trechoInicio: { type: 'string', title: 'Trecho Inicial', maxLength: 200 },
        trechoFim: { type: 'string', title: 'Trecho Final', maxLength: 200 },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoRua']
    }
  },

  {
    name: 'Limpeza de Feira Livre',
    description: 'Solicitação de limpeza pós-feira livre',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'LIMPEZA_FEIRA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 4,
    category: 'Limpeza',
    icon: 'Store',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        localFeira: { type: 'string', title: 'Local da Feira', maxLength: 300 },
        diaFeira: { type: 'string', title: 'Dia da Feira', enum: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] },
        descricaoProblema: { type: 'string', title: 'Descrição do Problema', maxLength: 500, widget: 'textarea' }
      },
      required: ['localFeira', 'diaFeira', 'descricaoProblema']
    }
  },

  {
    name: 'Manutenção de Jardim Público',
    description: 'Solicitação de manutenção em jardins e áreas verdes públicas',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'MANUTENCAO_JARDIM',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 3,
    category: 'Jardinagem',
    icon: 'Trees',
    color: '#22c55e',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        localJardim: { type: 'string', title: 'Local do Jardim', maxLength: 300 },
        tipoServico: { type: 'string', title: 'Tipo de Serviço', enum: ['Poda', 'Plantio', 'Irrigação', 'Limpeza Geral', 'Outro'] },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['localJardim', 'tipoServico']
    }
  },

  {
    name: 'Solicitação de Ecoponto',
    description: 'Informações sobre ecopontos e descarte correto de resíduos',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'ECOPONTO',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 2,
    category: 'Coleta Seletiva',
    icon: 'Recycle',
    color: '#059669',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_email'],
      properties: {
        enderecoPesquisa: { type: 'string', title: 'Endereço de Referência', maxLength: 300 },
        tipoMaterial: { type: 'string', title: 'Tipo de Material', enum: ['Recicláveis (papel, plástico, metal)', 'Entulho', 'Eletrônicos', 'Óleo de Cozinha', 'Pneus', 'Outro'] },
        duvida: { type: 'string', title: 'Dúvida ou Solicitação', maxLength: 500, widget: 'textarea' }
      },
      required: ['tipoMaterial']
    }
  },

  {
    name: 'Calendário de Coleta Seletiva',
    description: 'Consulta de dias e horários da coleta seletiva',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CALENDARIO_COLETA',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 1,
    category: 'Coleta Seletiva',
    icon: 'CalendarDays',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_email'],
      properties: {
        bairro: { type: 'string', title: 'Bairro', maxLength: 200 },
        endereco: { type: 'string', title: 'Endereço (opcional)', maxLength: 300 }
      },
      required: ['bairro']
    }
  },

  {
    name: 'Solicitação de Contentor de Lixo',
    description: 'Solicitação de instalação ou manutenção de lixeira pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CONTENTOR_LIXO',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 3,
    category: 'Infraestrutura',
    icon: 'BinRecycle',
    color: '#78716c',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        enderecoSolicitacao: { type: 'string', title: 'Endereço', maxLength: 300 },
        tipoSolicitacao: { type: 'string', title: 'Tipo de Solicitação', enum: ['Nova Instalação', 'Manutenção/Reparo', 'Substituição', 'Limpeza'] },
        motivoSolicitacao: { type: 'string', title: 'Motivo', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoSolicitacao', 'tipoSolicitacao', 'motivoSolicitacao']
    }
  },

  {
    name: 'Limpeza de Boca de Lobo',
    description: 'Solicitação de limpeza de boca de lobo entupida',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'LIMPEZA_BOCA_LOBO',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 4,
    category: 'Drenagem',
    icon: 'Droplets',
    color: '#0284c7',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        enderecoBocaLobo: { type: 'string', title: 'Endereço da Boca de Lobo', maxLength: 300 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        urgente: { type: 'boolean', title: 'Situação Urgente (alagamento)?' },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoBocaLobo']
    }
  },

  {
    name: 'Varrição de Rua',
    description: 'Solicitação de varrição de rua',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'VARRICAO_RUA',
    requiresDocuments: false,
    estimatedDays: 5,
    priority: 3,
    category: 'Limpeza',
    icon: 'Broom',
    color: '#a16207',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        enderecoRua: { type: 'string', title: 'Endereço da Rua', maxLength: 300 },
        trechoInicio: { type: 'string', title: 'Trecho Inicial (opcional)', maxLength: 200 },
        trechoFim: { type: 'string', title: 'Trecho Final (opcional)', maxLength: 200 },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoRua']
    }
  },

  {
    name: 'Dedetização e Controle de Pragas',
    description: 'Solicitação de dedetização em áreas públicas',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'DEDETIZACAO',
    requiresDocuments: false,
    estimatedDays: 10,
    priority: 4,
    category: 'Saúde Pública',
    icon: 'Bug',
    color: '#dc2626',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        localProblema: { type: 'string', title: 'Local do Problema', maxLength: 300 },
        tipoPraga: { type: 'string', title: 'Tipo de Praga', enum: ['Mosquitos', 'Ratos', 'Baratas', 'Escorpiões', 'Outros Insetos', 'Outro'] },
        descricao: { type: 'string', title: 'Descrição do Problema', maxLength: 500, widget: 'textarea' },
        urgente: { type: 'boolean', title: 'Situação Urgente?' }
      },
      required: ['localProblema', 'tipoPraga', 'descricao']
    }
  },

  {
    name: 'Remoção de Animal Morto',
    description: 'Solicitação de remoção de animal morto em via pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'REMOCAO_ANIMAL',
    requiresDocuments: false,
    estimatedDays: 1,
    priority: 5,
    category: 'Limpeza',
    icon: 'AlertTriangle',
    color: '#b91c1c',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        enderecoLocal: { type: 'string', title: 'Endereço', maxLength: 300 },
        pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
        tipoAnimal: { type: 'string', title: 'Tipo de Animal', enum: ['Cachorro', 'Gato', 'Ave', 'Animal Silvestre', 'Outro'] },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoLocal', 'tipoAnimal']
    }
  },

  {
    name: 'Poda de Árvore em Canteiro',
    description: 'Solicitação de poda de árvore em canteiro central ou área pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'PODA_CANTEIRO',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 3,
    category: 'Jardinagem',
    icon: 'TreeDeciduous',
    color: '#15803d',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        enderecoArvore: { type: 'string', title: 'Endereço da Árvore', maxLength: 300 },
        localizacao: { type: 'string', title: 'Localização', enum: ['Canteiro Central', 'Calçada', 'Praça', 'Parque', 'Outro'] },
        motivoPoda: { type: 'string', title: 'Motivo da Poda', enum: ['Risco de Queda', 'Obstrução de Fiação', 'Obstrução de Sinalização', 'Galhos Baixos', 'Manutenção Preventiva', 'Outro'] },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoArvore', 'localizacao', 'motivoPoda']
    }
  },

  {
    name: 'Conserto de Calçamento',
    description: 'Solicitação de reparo em calçamento público',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'CONSERTO_CALCAMENTO',
    requiresDocuments: false,
    estimatedDays: 20,
    priority: 3,
    category: 'Pavimentação',
    icon: 'HardHat',
    color: '#78350f',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        enderecoProblema: { type: 'string', title: 'Endereço', maxLength: 300 },
        tipoProblema: { type: 'string', title: 'Tipo de Problema', enum: ['Buraco', 'Rachadura', 'Afundamento', 'Bloco Solto', 'Outro'] },
        tamanhoAproximado: { type: 'string', title: 'Tamanho Aproximado', maxLength: 100 },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoProblema', 'tipoProblema']
    }
  },

  {
    name: 'Recuperação de Praça',
    description: 'Solicitação de manutenção e recuperação de praça pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.CAPTURA_COMPLETA,
    moduleType: 'RECUPERACAO_PRACA',
    requiresDocuments: false,
    estimatedDays: 30,
    priority: 3,
    category: 'Infraestrutura',
    icon: 'Fence',
    color: '#7c3aed',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomePraca: { type: 'string', title: 'Nome da Praça', maxLength: 200 },
        enderecoPraca: { type: 'string', title: 'Endereço da Praça', maxLength: 300 },
        tipoServico: { type: 'string', title: 'Tipo de Serviço Necessário', enum: ['Limpeza Geral', 'Poda de Árvores', 'Reparo de Bancos', 'Conserto de Iluminação', 'Revitalização Completa', 'Pintura', 'Outro'] },
        descricaoProblema: { type: 'string', title: 'Descrição do Problema', maxLength: 1000, widget: 'textarea' },
        sugestaoMelhoria: { type: 'string', title: 'Sugestão de Melhoria (opcional)', maxLength: 500, widget: 'textarea' }
      },
      required: ['nomePraca', 'enderecoPraca', 'tipoServico', 'descricaoProblema']
    }
  },

  {
    name: 'Limpeza de Terreno Abandonado',
    description: 'Denúncia e solicitação de limpeza de terreno abandonado',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
    serviceSubtype: ServiceSubtype.SOLICITACAO_SIMPLES,
    moduleType: 'LIMPEZA_TERRENO_ABANDONADO',
    requiresDocuments: false,
    estimatedDays: 15,
    priority: 4,
    category: 'Limpeza',
    icon: 'MapPin',
    color: '#ea580c',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_phone'],
      properties: {
        enderecoTerreno: { type: 'string', title: 'Endereço do Terreno', maxLength: 300 },
        problemaIdentificado: { type: 'string', title: 'Problema Identificado', enum: ['Mato Alto', 'Acúmulo de Lixo', 'Entulho', 'Foco de Mosquito', 'Animais Peçonhentos', 'Vários Problemas'] },
        tempoAbandonado: { type: 'string', title: 'Tempo Aproximado de Abandono', enum: ['Menos de 1 mês', '1 a 3 meses', '3 a 6 meses', 'Mais de 6 meses', 'Mais de 1 ano'] },
        descricao: { type: 'string', title: 'Descrição', maxLength: 500, widget: 'textarea' }
      },
      required: ['enderecoTerreno', 'problemaIdentificado', 'tempoAbandonado']
    }
  },

  // ========== SEM_DADOS (3) ==========

  {
    name: 'Calendário de Coleta Regular',
    description: 'Consulta de horários de coleta regular de lixo (usa dados de endereço do perfil)',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consulta',
    icon: 'Calendar',
    color: '#84cc16'
  },

  {
    name: 'Mapa de Serviços Públicos',
    description: 'Consulta de mapa com locais de serviços públicos próximos (usa dados de endereço do perfil)',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consulta',
    icon: 'Map',
    color: '#3b82f6'
  },

  {
    name: 'Histórico de Solicitações',
    description: 'Consulta histórico de solicitações de serviços públicos (usa dados do perfil)',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'SEM_DADOS',
    serviceSubtype: ServiceSubtype.CONSULTIVO,
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: null,
    priority: 1,
    category: 'Consulta',
    icon: 'History',
    color: '#64748b'
  }
];
