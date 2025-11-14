import { ServiceSuggestion } from './types';

export const agriculturaSuggestions: ServiceSuggestion[] = [
  {
    id: 'cadastro-produtor-rural',
    name: 'Cadastro de Produtor Rural',
    description: 'Registre produtores rurais do município',
    icon: 'Users',
    category: 'Cadastro',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'cadastro-maquinas-agricolas',
    name: 'Cadastro de Máquinas Agrícolas',
    description: 'Cadastre tratores e máquinas',
    icon: 'Tractor',
    category: 'Cadastro',
    estimatedDays: 3,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'cadastro-cooperativa',
    name: 'Cadastro de Cooperativa Rural',
    description: 'Registre cooperativas rurais',
    icon: 'Users',
    category: 'Cadastro',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'cadastro-agroindustria',
    name: 'Cadastro de Agroindústria',
    description: 'Registre agroindústrias familiares',
    icon: 'Factory',
    category: 'Cadastro',
    estimatedDays: 20,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'cadastro-apicultor',
    name: 'Cadastro de Apicultor',
    description: 'Registre produtores de mel',
    icon: 'Bee',
    category: 'Cadastro',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'licenca-uso-agua',
    name: 'Licença para Uso de Água',
    description: 'Autorização para captação de água',
    icon: 'Droplet',
    category: 'Licenciamento',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'licenca-poco',
    name: 'Licença para Poço Artesiano',
    description: 'Autorização para perfuração de poços',
    icon: 'Droplets',
    category: 'Licenciamento',
    estimatedDays: 25,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'selo-inspecao',
    name: 'Selo de Inspeção Municipal',
    description: 'Certificação sanitária SIM',
    icon: 'Shield',
    category: 'Licenciamento',
    estimatedDays: 45,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'assistencia-tecnica',
    name: 'Assistência Técnica Rural',
    description: 'Solicite orientação técnica',
    icon: 'Wrench',
    category: 'Assistência',
    estimatedDays: 7,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'analise-solo',
    name: 'Análise de Solo',
    description: 'Análise para correção e adubação',
    icon: 'TestTube',
    category: 'Assistência',
    estimatedDays: 15,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-11',
    name: 'Serviço Agricultura 11',
    description: 'Descrição do serviço 11 da secretaria de agricultura',
    icon: 'Award',
    category: 'Autorização',
    estimatedDays: 16,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-12',
    name: 'Serviço Agricultura 12',
    description: 'Descrição do serviço 12 da secretaria de agricultura',
    icon: 'FileText',
    category: 'Cadastro',
    estimatedDays: 17,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-13',
    name: 'Serviço Agricultura 13',
    description: 'Descrição do serviço 13 da secretaria de agricultura',
    icon: 'Users',
    category: 'Solicitação',
    estimatedDays: 18,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-14',
    name: 'Serviço Agricultura 14',
    description: 'Descrição do serviço 14 da secretaria de agricultura',
    icon: 'FileCheck',
    category: 'Licença',
    estimatedDays: 19,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-15',
    name: 'Serviço Agricultura 15',
    description: 'Descrição do serviço 15 da secretaria de agricultura',
    icon: 'FileBarChart',
    category: 'Consulta',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-16',
    name: 'Serviço Agricultura 16',
    description: 'Descrição do serviço 16 da secretaria de agricultura',
    icon: 'Shield',
    category: 'Certificado',
    estimatedDays: 21,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-17',
    name: 'Serviço Agricultura 17',
    description: 'Descrição do serviço 17 da secretaria de agricultura',
    icon: 'Award',
    category: 'Autorização',
    estimatedDays: 22,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-18',
    name: 'Serviço Agricultura 18',
    description: 'Descrição do serviço 18 da secretaria de agricultura',
    icon: 'FileText',
    category: 'Cadastro',
    estimatedDays: 23,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-19',
    name: 'Serviço Agricultura 19',
    description: 'Descrição do serviço 19 da secretaria de agricultura',
    icon: 'Users',
    category: 'Solicitação',
    estimatedDays: 24,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-20',
    name: 'Serviço Agricultura 20',
    description: 'Descrição do serviço 20 da secretaria de agricultura',
    icon: 'FileCheck',
    category: 'Licença',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-21',
    name: 'Serviço Agricultura 21',
    description: 'Descrição do serviço 21 da secretaria de agricultura',
    icon: 'FileBarChart',
    category: 'Consulta',
    estimatedDays: 6,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-22',
    name: 'Serviço Agricultura 22',
    description: 'Descrição do serviço 22 da secretaria de agricultura',
    icon: 'Shield',
    category: 'Certificado',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-23',
    name: 'Serviço Agricultura 23',
    description: 'Descrição do serviço 23 da secretaria de agricultura',
    icon: 'Award',
    category: 'Autorização',
    estimatedDays: 8,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-24',
    name: 'Serviço Agricultura 24',
    description: 'Descrição do serviço 24 da secretaria de agricultura',
    icon: 'FileText',
    category: 'Cadastro',
    estimatedDays: 9,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-25',
    name: 'Serviço Agricultura 25',
    description: 'Descrição do serviço 25 da secretaria de agricultura',
    icon: 'Users',
    category: 'Solicitação',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-26',
    name: 'Serviço Agricultura 26',
    description: 'Descrição do serviço 26 da secretaria de agricultura',
    icon: 'FileCheck',
    category: 'Licença',
    estimatedDays: 11,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-27',
    name: 'Serviço Agricultura 27',
    description: 'Descrição do serviço 27 da secretaria de agricultura',
    icon: 'FileBarChart',
    category: 'Consulta',
    estimatedDays: 12,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-28',
    name: 'Serviço Agricultura 28',
    description: 'Descrição do serviço 28 da secretaria de agricultura',
    icon: 'Shield',
    category: 'Certificado',
    estimatedDays: 13,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-29',
    name: 'Serviço Agricultura 29',
    description: 'Descrição do serviço 29 da secretaria de agricultura',
    icon: 'Award',
    category: 'Autorização',
    estimatedDays: 14,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-30',
    name: 'Serviço Agricultura 30',
    description: 'Descrição do serviço 30 da secretaria de agricultura',
    icon: 'FileText',
    category: 'Cadastro',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-31',
    name: 'Serviço Agricultura 31',
    description: 'Descrição do serviço 31 da secretaria de agricultura',
    icon: 'Users',
    category: 'Solicitação',
    estimatedDays: 16,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-32',
    name: 'Serviço Agricultura 32',
    description: 'Descrição do serviço 32 da secretaria de agricultura',
    icon: 'FileCheck',
    category: 'Licença',
    estimatedDays: 17,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-33',
    name: 'Serviço Agricultura 33',
    description: 'Descrição do serviço 33 da secretaria de agricultura',
    icon: 'FileBarChart',
    category: 'Consulta',
    estimatedDays: 18,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-34',
    name: 'Serviço Agricultura 34',
    description: 'Descrição do serviço 34 da secretaria de agricultura',
    icon: 'Shield',
    category: 'Certificado',
    estimatedDays: 19,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-35',
    name: 'Serviço Agricultura 35',
    description: 'Descrição do serviço 35 da secretaria de agricultura',
    icon: 'Award',
    category: 'Autorização',
    estimatedDays: 20,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-36',
    name: 'Serviço Agricultura 36',
    description: 'Descrição do serviço 36 da secretaria de agricultura',
    icon: 'FileText',
    category: 'Cadastro',
    estimatedDays: 21,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-37',
    name: 'Serviço Agricultura 37',
    description: 'Descrição do serviço 37 da secretaria de agricultura',
    icon: 'Users',
    category: 'Solicitação',
    estimatedDays: 22,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-38',
    name: 'Serviço Agricultura 38',
    description: 'Descrição do serviço 38 da secretaria de agricultura',
    icon: 'FileCheck',
    category: 'Licença',
    estimatedDays: 23,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-39',
    name: 'Serviço Agricultura 39',
    description: 'Descrição do serviço 39 da secretaria de agricultura',
    icon: 'FileBarChart',
    category: 'Consulta',
    estimatedDays: 24,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-40',
    name: 'Serviço Agricultura 40',
    description: 'Descrição do serviço 40 da secretaria de agricultura',
    icon: 'Shield',
    category: 'Certificado',
    estimatedDays: 5,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-41',
    name: 'Serviço Agricultura 41',
    description: 'Descrição do serviço 41 da secretaria de agricultura',
    icon: 'Award',
    category: 'Autorização',
    estimatedDays: 6,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-42',
    name: 'Serviço Agricultura 42',
    description: 'Descrição do serviço 42 da secretaria de agricultura',
    icon: 'FileText',
    category: 'Cadastro',
    estimatedDays: 7,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-43',
    name: 'Serviço Agricultura 43',
    description: 'Descrição do serviço 43 da secretaria de agricultura',
    icon: 'Users',
    category: 'Solicitação',
    estimatedDays: 8,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-44',
    name: 'Serviço Agricultura 44',
    description: 'Descrição do serviço 44 da secretaria de agricultura',
    icon: 'FileCheck',
    category: 'Licença',
    estimatedDays: 9,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-45',
    name: 'Serviço Agricultura 45',
    description: 'Descrição do serviço 45 da secretaria de agricultura',
    icon: 'FileBarChart',
    category: 'Consulta',
    estimatedDays: 10,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-46',
    name: 'Serviço Agricultura 46',
    description: 'Descrição do serviço 46 da secretaria de agricultura',
    icon: 'Shield',
    category: 'Certificado',
    estimatedDays: 11,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-47',
    name: 'Serviço Agricultura 47',
    description: 'Descrição do serviço 47 da secretaria de agricultura',
    icon: 'Award',
    category: 'Autorização',
    estimatedDays: 12,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-48',
    name: 'Serviço Agricultura 48',
    description: 'Descrição do serviço 48 da secretaria de agricultura',
    icon: 'FileText',
    category: 'Cadastro',
    estimatedDays: 13,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-49',
    name: 'Serviço Agricultura 49',
    description: 'Descrição do serviço 49 da secretaria de agricultura',
    icon: 'Users',
    category: 'Solicitação',
    estimatedDays: 14,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'agricultura-servico-50',
    name: 'Serviço Agricultura 50',
    description: 'Descrição do serviço 50 da secretaria de agricultura',
    icon: 'FileCheck',
    category: 'Licença',
    estimatedDays: 15,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  }
];
