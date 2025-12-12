/**
 * SEED DE SERVIÇOS - SECRETARIA DE TURISMO
 * Total: 6 serviços (3 COM_DADOS + 3 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const tourismServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (3) ==========

  {
    name: 'Cadastro de Estabelecimento Turístico',
    description: 'Cadastro de hotéis, pousadas, restaurantes e outros estabelecimentos turísticos',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CNPJ', 'Alvará de Funcionamento', 'Contrato Social'],
    estimatedDays: 15,
    priority: 4,
    category: 'Cadastros',
    icon: 'Building',
    color: '#06b6d4',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoEstabelecimento: { type: 'string', title: 'Tipo de Estabelecimento', enum: ['Hotel', 'Pousada', 'Hostel', 'Restaurante', 'Agência de Turismo', 'Atração Turística', 'Outro'] },
        nomeEstabelecimento: { type: 'string', title: 'Nome do Estabelecimento', maxLength: 200 },
        cnpj: { type: 'string', title: 'CNPJ', pattern: '^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$', maxLength: 18 },
        enderecoEstabelecimento: { type: 'string', title: 'Endereço Completo', maxLength: 300 },
        capacidade: { type: 'integer', title: 'Capacidade de Atendimento', minimum: 1 },
        descricaoServicos: { type: 'string', title: 'Descrição dos Serviços', maxLength: 1000, widget: 'textarea' }
      },
      required: ['tipoEstabelecimento', 'nomeEstabelecimento', 'cnpj', 'enderecoEstabelecimento', 'descricaoServicos']
    }
  },

  {
    name: 'Cadastro de Guia Turístico',
    description: 'Cadastro oficial de guias turísticos do município',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_GUIA_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Certificado de Guia Turístico', 'Foto 3x4'],
    estimatedDays: 10,
    priority: 4,
    category: 'Cadastros',
    icon: 'UserCheck',
    color: '#8b5cf6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        numeroCadtur: { type: 'string', title: 'Número CADASTUR (se possuir)', maxLength: 50 },
        idiomas: { type: 'string', title: 'Idiomas que Domina', maxLength: 200 },
        especialidades: { type: 'string', title: 'Especialidades (tipos de turismo)', maxLength: 300 },
        experiencia: { type: 'string', title: 'Experiência Profissional', maxLength: 500, widget: 'textarea' }
      },
      required: ['idiomas', 'especialidades']
    }
  },

  {
    name: 'Registro de Evento Turístico',
    description: 'Registro de eventos, festas e atrações turísticas do município',
    departmentCode: 'TURISMO',
    serviceType: 'COM_DADOS',
    moduleType: 'REGISTRO_EVENTO_TURISTICO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'Projeto do Evento', 'Autorizações Necessárias'],
    estimatedDays: 20,
    priority: 4,
    category: 'Eventos',
    icon: 'PartyPopper',
    color: '#ec4899',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeEvento: { type: 'string', title: 'Nome do Evento', maxLength: 200 },
        tipoEvento: { type: 'string', title: 'Tipo de Evento', enum: ['Festa Popular', 'Festival Cultural', 'Evento Gastronômico', 'Evento Esportivo', 'Exposição', 'Outro'] },
        dataEvento: { type: 'string', format: 'date', title: 'Data do Evento' },
        localEvento: { type: 'string', title: 'Local do Evento', maxLength: 300 },
        publicoEstimado: { type: 'integer', title: 'Público Estimado', minimum: 1 },
        descricaoEvento: { type: 'string', title: 'Descrição do Evento', maxLength: 1000, widget: 'textarea' }
      },
      required: ['nomeEvento', 'tipoEvento', 'dataEvento', 'localEvento', 'descricaoEvento']
    }
  },

  // ========== SERVIÇOS SEM_DADOS (3) ==========

  {
    name: 'Guia Turístico da Cidade',
    description: 'Consulta ao guia turístico oficial do município',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Map',
    color: '#94a3b8'
  },

  {
    name: 'Certidão de Cadastro Turístico',
    description: 'Emissão de certidão de cadastro turístico',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'CNPJ (se empresa)'],
    estimatedDays: 7,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#06b6d4'
  },

  {
    name: 'Declaração de Apoio a Evento Turístico',
    description: 'Emissão de declaração de apoio municipal a evento turístico',
    departmentCode: 'TURISMO',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Projeto do Evento'],
    estimatedDays: 10,
    priority: 3,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#8b5cf6'
  }
];
