/**
 * SEED DE SERVIÇOS - SECRETARIA DE SERVIÇOS PÚBLICOS
 * Total: 5 serviços (5 COM_DADOS + 0 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const publicServicesServices: ServiceDefinition[] = [
  {
    name: 'Iluminação Pública (Poste Queimado)',
    description: 'Solicitação de reparo de iluminação pública',
    departmentCode: 'SERVICOS_PUBLICOS',
    serviceType: 'COM_DADOS',
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
  }
];
