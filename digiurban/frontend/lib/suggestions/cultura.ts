import { ServiceSuggestion } from './types';

export const culturaSuggestions: ServiceSuggestion[] = [
  {
    id: 'oficina-cultural',
    name: 'Inscrição em Oficinas Culturais',
    description: 'Oficinas de música, dança e artes',
    icon: 'Music',
    category: 'Oficinas',
    estimatedDays: 3,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'cadastro-artista',
    name: 'Cadastro de Artista Local',
    description: 'Registro de artistas municipais',
    icon: 'User',
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
    id: 'espaco-cultural',
    name: 'Reserva de Espaço Cultural',
    description: 'Reserve teatros e centros culturais',
    icon: 'Building',
    category: 'Espaços',
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
    id: 'lei-incentivo',
    name: 'Lei de Incentivo à Cultura',
    description: 'Submeta projetos culturais',
    icon: 'FileText',
    category: 'Incentivo',
    estimatedDays: 30,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'patrimonio-historico',
    name: 'Tombamento de Patrimônio',
    description: 'Solicite tombamento histórico',
    icon: 'Landmark',
    category: 'Patrimônio',
    estimatedDays: 60,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'biblioteca-municipal',
    name: 'Cadastro na Biblioteca',
    description: 'Inscreva-se para empréstimo de livros',
    icon: 'Book',
    category: 'Bibliotecas',
    estimatedDays: 1,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'museu-visita',
    name: 'Agendamento de Visita ao Museu',
    description: 'Agende visitas guiadas',
    icon: 'Building2',
    category: 'Museus',
    estimatedDays: 5,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'festival-cadastro',
    name: 'Inscrição em Festivais',
    description: 'Participe de festivais culturais',
    icon: 'Calendar',
    category: 'Eventos',
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
    id: 'grupo-teatral',
    name: 'Cadastro de Grupo Teatral',
    description: 'Registre grupos de teatro',
    icon: 'Theater',
    category: 'Cadastro',
    estimatedDays: 10,
    requiresDocuments: true,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'ponto-cultura',
    name: 'Cadastro de Ponto de Cultura',
    description: 'Registre espaços culturais comunitários',
    icon: 'MapPin',
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
    id: 'cultura-servico-11',
    name: 'Serviço Cultura 11',
    description: 'Descrição do serviço 11 da secretaria de cultura',
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
    id: 'cultura-servico-12',
    name: 'Serviço Cultura 12',
    description: 'Descrição do serviço 12 da secretaria de cultura',
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
    id: 'cultura-servico-13',
    name: 'Serviço Cultura 13',
    description: 'Descrição do serviço 13 da secretaria de cultura',
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
    id: 'cultura-servico-14',
    name: 'Serviço Cultura 14',
    description: 'Descrição do serviço 14 da secretaria de cultura',
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
    id: 'cultura-servico-15',
    name: 'Serviço Cultura 15',
    description: 'Descrição do serviço 15 da secretaria de cultura',
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
    id: 'cultura-servico-16',
    name: 'Serviço Cultura 16',
    description: 'Descrição do serviço 16 da secretaria de cultura',
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
    id: 'cultura-servico-17',
    name: 'Serviço Cultura 17',
    description: 'Descrição do serviço 17 da secretaria de cultura',
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
    id: 'cultura-servico-18',
    name: 'Serviço Cultura 18',
    description: 'Descrição do serviço 18 da secretaria de cultura',
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
    id: 'cultura-servico-19',
    name: 'Serviço Cultura 19',
    description: 'Descrição do serviço 19 da secretaria de cultura',
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
    id: 'cultura-servico-20',
    name: 'Serviço Cultura 20',
    description: 'Descrição do serviço 20 da secretaria de cultura',
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
    id: 'cultura-servico-21',
    name: 'Serviço Cultura 21',
    description: 'Descrição do serviço 21 da secretaria de cultura',
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
    id: 'cultura-servico-22',
    name: 'Serviço Cultura 22',
    description: 'Descrição do serviço 22 da secretaria de cultura',
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
    id: 'cultura-servico-23',
    name: 'Serviço Cultura 23',
    description: 'Descrição do serviço 23 da secretaria de cultura',
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
    id: 'cultura-servico-24',
    name: 'Serviço Cultura 24',
    description: 'Descrição do serviço 24 da secretaria de cultura',
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
    id: 'cultura-servico-25',
    name: 'Serviço Cultura 25',
    description: 'Descrição do serviço 25 da secretaria de cultura',
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
    id: 'cultura-servico-26',
    name: 'Serviço Cultura 26',
    description: 'Descrição do serviço 26 da secretaria de cultura',
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
    id: 'cultura-servico-27',
    name: 'Serviço Cultura 27',
    description: 'Descrição do serviço 27 da secretaria de cultura',
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
    id: 'cultura-servico-28',
    name: 'Serviço Cultura 28',
    description: 'Descrição do serviço 28 da secretaria de cultura',
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
    id: 'cultura-servico-29',
    name: 'Serviço Cultura 29',
    description: 'Descrição do serviço 29 da secretaria de cultura',
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
    id: 'cultura-servico-30',
    name: 'Serviço Cultura 30',
    description: 'Descrição do serviço 30 da secretaria de cultura',
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
    id: 'cultura-servico-31',
    name: 'Serviço Cultura 31',
    description: 'Descrição do serviço 31 da secretaria de cultura',
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
    id: 'cultura-servico-32',
    name: 'Serviço Cultura 32',
    description: 'Descrição do serviço 32 da secretaria de cultura',
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
    id: 'cultura-servico-33',
    name: 'Serviço Cultura 33',
    description: 'Descrição do serviço 33 da secretaria de cultura',
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
    id: 'cultura-servico-34',
    name: 'Serviço Cultura 34',
    description: 'Descrição do serviço 34 da secretaria de cultura',
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
    id: 'cultura-servico-35',
    name: 'Serviço Cultura 35',
    description: 'Descrição do serviço 35 da secretaria de cultura',
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
    id: 'cultura-servico-36',
    name: 'Serviço Cultura 36',
    description: 'Descrição do serviço 36 da secretaria de cultura',
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
    id: 'cultura-servico-37',
    name: 'Serviço Cultura 37',
    description: 'Descrição do serviço 37 da secretaria de cultura',
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
    id: 'cultura-servico-38',
    name: 'Serviço Cultura 38',
    description: 'Descrição do serviço 38 da secretaria de cultura',
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
    id: 'cultura-servico-39',
    name: 'Serviço Cultura 39',
    description: 'Descrição do serviço 39 da secretaria de cultura',
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
    id: 'cultura-servico-40',
    name: 'Serviço Cultura 40',
    description: 'Descrição do serviço 40 da secretaria de cultura',
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
    id: 'cultura-servico-41',
    name: 'Serviço Cultura 41',
    description: 'Descrição do serviço 41 da secretaria de cultura',
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
    id: 'cultura-servico-42',
    name: 'Serviço Cultura 42',
    description: 'Descrição do serviço 42 da secretaria de cultura',
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
    id: 'cultura-servico-43',
    name: 'Serviço Cultura 43',
    description: 'Descrição do serviço 43 da secretaria de cultura',
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
    id: 'cultura-servico-44',
    name: 'Serviço Cultura 44',
    description: 'Descrição do serviço 44 da secretaria de cultura',
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
    id: 'cultura-servico-45',
    name: 'Serviço Cultura 45',
    description: 'Descrição do serviço 45 da secretaria de cultura',
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
    id: 'cultura-servico-46',
    name: 'Serviço Cultura 46',
    description: 'Descrição do serviço 46 da secretaria de cultura',
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
    id: 'cultura-servico-47',
    name: 'Serviço Cultura 47',
    description: 'Descrição do serviço 47 da secretaria de cultura',
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
    id: 'cultura-servico-48',
    name: 'Serviço Cultura 48',
    description: 'Descrição do serviço 48 da secretaria de cultura',
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
    id: 'cultura-servico-49',
    name: 'Serviço Cultura 49',
    description: 'Descrição do serviço 49 da secretaria de cultura',
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
    id: 'cultura-servico-50',
    name: 'Serviço Cultura 50',
    description: 'Descrição do serviço 50 da secretaria de cultura',
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
