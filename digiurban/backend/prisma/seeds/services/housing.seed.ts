/**
 * SEED DE SERVIÇOS - SECRETARIA DE HABITAÇÃO
 * Total: 7 serviços
 */

import { ServiceDefinition } from './types';

export const housingServices: ServiceDefinition[] = [
  {
    name: 'Regularização Fundiária',
    description: 'Solicitação de regularização de imóvel',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGULARIZACAO_FUNDIARIA',
    requiresDocuments: true,
    requiredDocuments: ['Escritura', 'IPTU', 'Comprovante de Residência'],
    estimatedDays: 60,
    priority: 5,
    category: 'Regularização',
    icon: 'Home',
    color: '#0891b2',
    formSchema: {
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'matriculaImovel',
          label: 'Matrícula do Imóvel',
          type: 'text',
          maxLength: 50,
          required: false
        },
        {
          id: 'areaConstruida',
          label: 'Área Construída (m²)',
          type: 'number',
          minimum: 1,
          required: true
        },
        {
          id: 'tempoResidencia',
          label: 'Tempo de Residência (anos)',
          type: 'number',
          minimum: 0,
          required: true
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 1000,
          required: false
        }
      ]
    }
  },
  {
    name: 'Programa Minha Casa Minha Vida',
    description: 'Inscrição no programa habitacional',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'MINHA_CASA',
    requiresDocuments: true,
    requiredDocuments: ['Comprovante de Renda', 'RG', 'CPF', 'Certidão de Casamento'],
    estimatedDays: 90,
    priority: 5,
    category: 'Programas',
    icon: 'Building',
    color: '#0e7490',
    formSchema: {
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'rendaFamiliar',
          label: 'Renda Familiar Mensal',
          type: 'number',
          minimum: 0,
          required: true
        },
        {
          id: 'possuiImovel',
          label: 'Possui Imóvel Próprio?',
          type: 'checkbox',
          defaultValue: false,
          required: true
        },
        {
          id: 'quantidadeFilhos',
          label: 'Quantidade de Filhos',
          type: 'number',
          minimum: 0,
          required: true
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
    name: 'Mapa de Lotes',
    description: 'Visualização de lotes disponíveis',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8',
  },
  {
    name: 'Certidão de Regularidade Fundiária',
    description: 'Emissão de certidão de regularidade',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Matrícula'],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#0891b2',
  },
  {
    name: 'Declaração de Residência',
    description: 'Emissão de declaração de residência',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço'],
    estimatedDays: 5,
    priority: 2,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#0891b2',
  },
  {
    name: 'Laudo de Vistoria Habitacional',
    description: 'Emissão de laudo técnico de vistoria',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Endereço do Imóvel'],
    estimatedDays: 20,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#0891b2',
  },
  {
    name: 'Autorização para Construção',
    description: 'Autorização para construção em lote',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'AUTORIZACAO_CONSTRUCAO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto', 'ART', 'Matrícula'],
    estimatedDays: 30,
    priority: 4,
    category: 'Construção',
    icon: 'Hammer',
    color: '#0e7490',
    formSchema: {
      citizenFields: [
        'citizen_name',
        'citizen_cpf',
        'citizen_rg',
        'citizen_birthdate',
        'citizen_email',
        'citizen_phone',
        'citizen_phonesecondary',
        'citizen_zipcode',
        'citizen_address',
        'citizen_addressnumber',
        'citizen_addresscomplement',
        'citizen_neighborhood',
        'citizen_mothername',
        'citizen_maritalstatus',
        'citizen_occupation',
        'citizen_familyincome'
      ],
      fields: [
        {
          id: 'pontoReferencia',
          label: 'Ponto de Referência',
          type: 'text',
          maxLength: 200,
          required: false
        },
        {
          id: 'lote',
          label: 'Número do Lote',
          type: 'text',
          maxLength: 50,
          required: true
        },
        {
          id: 'areaConstruir',
          label: 'Área a Construir (m²)',
          type: 'number',
          minimum: 1,
          required: true
        },
        {
          id: 'tipoConstrucao',
          label: 'Tipo de Construção',
          type: 'select',
          options: ['Residencial', 'Comercial', 'Misto'],
          required: true
        },
        {
          id: 'observacoes',
          label: 'Observações',
          type: 'textarea',
          maxLength: 500,
          required: false
        }
      ]
    }
  },
  {
      name: 'Atendimentos - Habitação',
      description: 'Registro geral de atendimentos na área habitacional',
      departmentCode: 'HABITACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'ATENDIMENTOS_HABITACAO',
      requiresDocuments: false,
      estimatedDays: 1,
      priority: 3,
      category: 'Atendimento',
      icon: 'Home',
      color: '#06b6d4',
      formSchema: {
        type: 'object',
          citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          motivoAtendimento: { type: 'string', title: 'Motivo do Atendimento', enum: ['Informações sobre Programas', 'Inscrição em Programa', 'Regularização Fundiária', 'Auxílio Aluguel', 'Situação de Moradia', 'Reclamação', 'Outro'] },
          descricaoAtendimento: { type: 'string', title: 'Descrição do Atendimento', minLength: 10, maxLength: 1000 },
          situacaoMoradia: { type: 'string', title: 'Situação Atual de Moradia', enum: ['Própria', 'Alugada', 'Cedida', 'Ocupação Irregular', 'Situação de Rua', 'Outro'] },
          numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'motivoAtendimento', 'descricaoAtendimento', 'situacaoMoradia']
      }
    },
  {
      name: 'Inscrição em Programa Habitacional',
      description: 'Inscrição em programas habitacionais (Minha Casa Minha Vida)',
      departmentCode: 'HABITACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço'],
      estimatedDays: 30,
      priority: 5,
      category: 'Programas',
      icon: 'Building',
      color: '#0891b2',
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          programaInteresse: { type: 'string', title: 'Programa de Interesse', enum: ['Minha Casa Minha Vida', 'Casa Verde e Amarela', 'Regularização Fundiária', 'Lotes Urbanizados', 'Outro'] },
          rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
          numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
          numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
          situacaoAtual: { type: 'string', title: 'Situação Atual de Moradia', enum: ['Própria', 'Alugada', 'Cedida', 'Ocupação Irregular', 'Situação de Rua'] },
          tempoResidencia: { type: 'string', title: 'Tempo de Residência no Município', enum: ['Menos de 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Mais de 10 anos'] },
          possuiImovel: { type: 'boolean', title: 'Possui Imóvel?', default: false },
          inscritoCadUnico: { type: 'boolean', title: 'Inscrito no CadÚnico?', default: false },
          nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
          deficienciaFamilia: { type: 'boolean', title: 'Há pessoa com deficiência na família?', default: false },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'programaInteresse', 'rendaFamiliarTotal', 'numeroMoradores', 'situacaoAtual', 'possuiImovel', 'inscritoCadUnico']
      }
    },
  {
      name: 'Solicitação de Auxílio Aluguel',
      description: 'Solicitação de auxílio moradia temporário',
      departmentCode: 'HABITACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL',
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'Declaração de Vulnerabilidade'],
      estimatedDays: 15,
      priority: 5,
      category: 'Auxílio',
      icon: 'DollarSign',
      color: '#155e75',
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
          numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
          numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
          motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', enum: ['Desabrigado por Calamidade', 'Despejo', 'Remoção por Obra Pública', 'Vulnerabilidade Social', 'Violência Doméstica', 'Outro'] },
          descricaoSituacao: { type: 'string', title: 'Descrição da Situação', minLength: 30, maxLength: 1000 },
          valorAluguel: { type: 'number', title: 'Valor do Aluguel Atual/Pretendido (R$)', minimum: 0 },
          inscritoCadUnico: { type: 'boolean', title: 'Inscrito no CadÚnico?', default: false },
          nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
          deficienciaFamilia: { type: 'boolean', title: 'Há pessoa com deficiência na família?', default: false },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'rendaFamiliarTotal', 'numeroMoradores', 'motivoSolicitacao', 'descricaoSituacao', 'inscritoCadUnico']
      }
    },
  {
      name: 'Cadastro de Unidade Habitacional',
      description: 'Cadastro de imóveis no programa habitacional',
      departmentCode: 'HABITACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'CADASTRO_UNIDADE_HABITACIONAL',
      requiresDocuments: true,
      requiredDocuments: ['Matrícula do Imóvel', 'Planta', 'Documentação do Proprietário'],
      estimatedDays: 20,
      priority: 3,
      category: 'Cadastro',
      icon: 'MapPin',
      color: '#06b6d4',
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          enderecoImovel: { type: 'string', title: 'Endereço Completo do Imóvel', minLength: 10, maxLength: 300 },
          cepImovel: { type: 'string', title: 'CEP do Imóvel', pattern: '^\\d{8}$' },
          tipoImovel: { type: 'string', title: 'Tipo de Imóvel', enum: ['Casa', 'Apartamento', 'Sobrado', 'Kitnet', 'Lote', 'Outro'] },
          numeroQuartos: { type: 'integer', title: 'Número de Quartos', minimum: 0 },
          numeroBanheiros: { type: 'integer', title: 'Número de Banheiros', minimum: 0 },
          areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 0 },
          areaConstruida: { type: 'number', title: 'Área Construída (m²)', minimum: 0 },
          matriculaImovel: { type: 'string', title: 'Matrícula do Imóvel', maxLength: 50 },
          inscricaoIPTU: { type: 'string', title: 'Inscrição IPTU', maxLength: 50 },
          situacaoImovel: { type: 'string', title: 'Situação do Imóvel', enum: ['Ocupado', 'Desocupado', 'Em Construção', 'Reforma'] },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'enderecoImovel', 'cepImovel', 'tipoImovel', 'areaTerreno', 'situacaoImovel']
      }
    },
  {
      name: 'Inscrição na Fila de Habitação',
      description: 'Inscrição em lista de espera para moradia popular',
      departmentCode: 'HABITACAO',
      serviceType: 'COM_DADOS',
      moduleType: 'INSCRICAO_FILA_HABITACAO',
      requiresDocuments: true,
      requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico'],
      estimatedDays: 7,
      priority: 4,
      category: 'Inscrição',
      icon: 'List',
      color: '#0891b2',
      formSchema: {
        type: 'object',
        citizenFields: [
            'citizen_name',
            'citizen_cpf',
            'citizen_rg',
            'citizen_birthdate',
            'citizen_email',
            'citizen_phone',
            'citizen_phonesecondary',
            'citizen_zipcode',
            'citizen_address',
            'citizen_addressnumber',
            'citizen_addresscomplement',
            'citizen_neighborhood',
            'citizen_mothername',
            'citizen_maritalstatus',
            'citizen_occupation',
            'citizen_familyincome'
          ],
        properties: {
          pontoReferencia: { type: 'string', title: 'Ponto de Referência', maxLength: 200 },
          rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
          numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
          numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
          situacaoAtual: { type: 'string', title: 'Situação Atual de Moradia', enum: ['Alugada', 'Cedida', 'Ocupação Irregular', 'Situação de Rua', 'Outro'] },
          tempoResidencia: { type: 'string', title: 'Tempo de Residência no Município', enum: ['Menos de 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Mais de 10 anos'] },
          inscritoCadUnico: { type: 'boolean', title: 'Inscrito no CadÚnico?', default: false },
          nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
          deficienciaFamilia: { type: 'boolean', title: 'Há pessoa com deficiência na família?', default: false },
          idosoFamilia: { type: 'boolean', title: 'Há idoso na família?', default: false },
          observacoes: { type: 'string', title: 'Observações', maxLength: 500 }
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'nomeMae', 'rendaFamiliarTotal', 'numeroMoradores', 'situacaoAtual', 'tempoResidencia', 'inscritoCadUnico']
      }
    },
  {
      name: 'Consulta de Programas Habitacionais',
      description: 'Informações sobre programas habitacionais disponíveis',
      departmentCode: 'HABITACAO',
      serviceType: 'SEM_DADOS',
      moduleType: null,
      requiresDocuments: false,
      estimatedDays: null,
      priority: 1,
      category: 'Informativo',
      icon: 'Info',
      color: '#94a3b8',
    },
  {name: 'Certidão de Inscrição Habitacional', description: 'Certidão comprovando inscrição em programas habitacionais', departmentCode: 'HABITACAO', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda'], estimatedDays: 5, priority: 3, category: 'Certidões', icon: 'FileText', color: '#f59e0b'},
  {name: 'Declaração de Moradia', description: 'Declaração de situação de moradia', departmentCode: 'HABITACAO', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço'], estimatedDays: 3, priority: 3, category: 'Certidões', icon: 'Home', color: '#10b981'},
  {name: 'Atestado de Regularização Fundiária', description: 'Atestado do processo de regularização fundiária', departmentCode: 'HABITACAO', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF', 'Documentos do Imóvel'], estimatedDays: 7, priority: 4, category: 'Certidões', icon: 'FileCheck', color: '#3b82f6'},
  {name: 'Consulta de Situação no Programa', description: 'Consulta de situação em programas habitacionais', departmentCode: 'HABITACAO', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF'], estimatedDays: 2, priority: 2, category: 'Consultas', icon: 'Search', color: '#8b5cf6'},
  {name: 'Segunda Via de Contrato Habitacional', description: 'Reemissão de contrato habitacional', departmentCode: 'HABITACAO', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF', 'RG'], estimatedDays: 5, priority: 2, category: 'Documentos', icon: 'Copy', color: '#6b7280'},
  {name: 'Comprovante de Cadastro Habitacional', description: 'Comprovante oficial de cadastro habitacional', departmentCode: 'HABITACAO', serviceType: 'SEM_DADOS', moduleType: null, requiresDocuments: true, requiredDocuments: ['CPF'], estimatedDays: 2, priority: 3, category: 'Documentos', icon: 'FileText', color: '#ec4899'}
];
