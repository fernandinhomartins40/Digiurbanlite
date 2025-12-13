/**
 * SEED DE SERVIÇOS - SECRETARIA DE HABITAÇÃO
 * Total: 8 serviços (5 COM_DADOS + 3 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const housingServices: ServiceDefinition[] = [
  // ========== COM_DADOS (5) ==========

  {
    name: 'Regularização Fundiária',
    description: 'Solicitação de regularização de imóvel',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGULARIZACAO_FUNDIARIA',
    requiresDocuments: true,
    requiredDocuments: ['Escritura (se possuir)', 'IPTU', 'Comprovante de Residência'],
    estimatedDays: 60,
    priority: 5,
    category: 'Regularização',
    icon: 'Home',
    color: '#0891b2',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        matriculaImovel: { type: 'string', title: 'Matrícula do Imóvel (se possuir)', maxLength: 50 },
        areaConstruida: { type: 'number', title: 'Área Construída (m²)', minimum: 1 },
        areaTerreno: { type: 'number', title: 'Área do Terreno (m²)', minimum: 1 },
        tempoResidencia: { type: 'number', title: 'Tempo de Residência (anos)', minimum: 0 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 1000, widget: 'textarea' }
      },
      required: ['areaConstruida', 'areaTerreno', 'tempoResidencia']
    }
  },

  {
    name: 'Inscrição em Programa Habitacional',
    description: 'Inscrição em programas habitacionais (Minha Casa Minha Vida, Casa Verde e Amarela)',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Renda', 'CadÚnico', 'Comprovante de Endereço'],
    estimatedDays: 30,
    priority: 5,
    category: 'Programas',
    icon: 'Building',
    color: '#0e7490',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        programaInteresse: { type: 'string', title: 'Programa de Interesse', enum: ['Minha Casa Minha Vida', 'Casa Verde e Amarela', 'Regularização Fundiária', 'Lotes Urbanizados', 'Outro'] },
        rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
        situacaoAtual: { type: 'string', title: 'Situação Atual de Moradia', enum: ['Alugada', 'Cedida', 'Ocupação Irregular', 'Situação de Rua', 'Própria (precária)', 'Outro'] },
        tempoResidencia: { type: 'string', title: 'Tempo de Residência no Município', enum: ['Menos de 1 ano', '1-3 anos', '3-5 anos', '5-10 anos', 'Mais de 10 anos'] },
        possuiImovel: { type: 'boolean', title: 'Possui Imóvel?' },
        inscritoCadUnico: { type: 'boolean', title: 'Inscrito no CadÚnico?' },
        nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
        deficienciaFamilia: { type: 'boolean', title: 'Há Pessoa com Deficiência na Família?' },
        idosoFamilia: { type: 'boolean', title: 'Há Idoso na Família?' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['programaInteresse', 'rendaFamiliarTotal', 'numeroMoradores', 'situacaoAtual', 'possuiImovel', 'inscritoCadUnico']
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
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        rendaFamiliarTotal: { type: 'number', title: 'Renda Familiar Total (R$)', minimum: 0 },
        numeroMoradores: { type: 'integer', title: 'Número de Moradores', minimum: 1 },
        numeroDependentes: { type: 'integer', title: 'Número de Dependentes', minimum: 0 },
        motivoSolicitacao: { type: 'string', title: 'Motivo da Solicitação', enum: ['Desabrigado por Calamidade', 'Despejo', 'Remoção por Obra Pública', 'Vulnerabilidade Social', 'Violência Doméstica', 'Outro'] },
        descricaoSituacao: { type: 'string', title: 'Descrição da Situação', minLength: 30, maxLength: 1000, widget: 'textarea' },
        valorAluguel: { type: 'number', title: 'Valor do Aluguel Atual/Pretendido (R$)', minimum: 0 },
        inscritoCadUnico: { type: 'boolean', title: 'Inscrito no CadÚnico?' },
        nisCadUnico: { type: 'string', title: 'NIS (CadÚnico)', maxLength: 20 },
        deficienciaFamilia: { type: 'boolean', title: 'Há Pessoa com Deficiência na Família?' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['rendaFamiliarTotal', 'numeroMoradores', 'motivoSolicitacao', 'descricaoSituacao', 'inscritoCadUnico']
    }
  },

  {
    name: 'Autorização para Construção',
    description: 'Autorização para construção em lote regularizado',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'AUTORIZACAO_CONSTRUCAO',
    requiresDocuments: true,
    requiredDocuments: ['Projeto Arquitetônico', 'ART (Anotação de Responsabilidade Técnica)', 'Matrícula do Imóvel'],
    estimatedDays: 30,
    priority: 4,
    category: 'Construção',
    icon: 'Hammer',
    color: '#0e7490',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        numeroLote: { type: 'string', title: 'Número do Lote', maxLength: 50 },
        areaConstruir: { type: 'number', title: 'Área a Construir (m²)', minimum: 1 },
        tipoConstrucao: { type: 'string', title: 'Tipo de Construção', enum: ['Residencial', 'Comercial', 'Misto'] },
        numeroAndares: { type: 'integer', title: 'Número de Andares', minimum: 1, maximum: 10 },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['numeroLote', 'areaConstruir', 'tipoConstrucao']
    }
  },

  {
    name: 'Vistoria Habitacional',
    description: 'Solicitação de vistoria técnica para laudo habitacional',
    departmentCode: 'HABITACAO',
    serviceType: 'COM_DADOS',
    moduleType: 'VISTORIA_HABITACIONAL',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço'],
    estimatedDays: 20,
    priority: 4,
    category: 'Vistoria',
    icon: 'ClipboardCheck',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        enderecoImovel: { type: 'string', title: 'Endereço do Imóvel (se diferente do cadastro)', maxLength: 300 },
        motivoVistoria: { type: 'string', title: 'Motivo da Vistoria', enum: ['Regularização', 'Programa Habitacional', 'Laudo Técnico', 'Condições de Habitabilidade', 'Outro'] },
        descricaoSolicitacao: { type: 'string', title: 'Descrição da Solicitação', minLength: 20, maxLength: 1000, widget: 'textarea' },
        dataPreferencial: { type: 'string', title: 'Data Preferencial', format: 'date' },
        observacoes: { type: 'string', title: 'Observações', maxLength: 500, widget: 'textarea' }
      },
      required: ['motivoVistoria', 'descricaoSolicitacao']
    }
  },

  // ========== SEM_DADOS (3) ==========

  {
    name: 'Certidão de Regularidade Fundiária',
    description: 'Emissão de certidão de regularidade fundiária',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Matrícula do Imóvel'],
    estimatedDays: 10,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#0891b2'
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
    color: '#0891b2'
  },

  {
    name: 'Laudo de Vistoria Habitacional',
    description: 'Emissão de laudo técnico de vistoria',
    departmentCode: 'HABITACAO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Comprovante de Endereço do Imóvel'],
    estimatedDays: 20,
    priority: 4,
    category: 'Laudos',
    icon: 'ClipboardCheck',
    color: '#0891b2'
  }
];
