import { ServiceSuggestion } from './types';

export const segurancapublicaSuggestions: ServiceSuggestion[] = [
  {
    id: 'boletim-ocorrencia',
    name: 'Boletim de Ocorrência Online',
    description: 'Registre BO online',
    icon: 'FileText',
    category: 'Ocorrências',
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
    id: 'videomonitoramento',
    name: 'Solicitação de Imagens',
    description: 'Acesso a imagens de câmeras',
    icon: 'Camera',
    category: 'Videomonitoramento',
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
    id: 'cadastro-veiculo',
    name: 'Cadastro de Veículo na Guarda',
    description: 'Registre seu veículo',
    icon: 'Car',
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
    id: 'ronda-escolar',
    name: 'Solicitação de Ronda Escolar',
    description: 'Pedido de ronda em escolas',
    icon: 'School',
    category: 'Rondas',
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
    id: 'patrulha-comunitaria',
    name: 'Patrulha Comunitária',
    description: 'Solicitação de patrulha no bairro',
    icon: 'Shield',
    category: 'Patrulhamento',
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
    id: 'denuncia-anonima',
    name: 'Denúncia Anônima',
    description: 'Canal de denúncias sigilosas',
    icon: 'AlertTriangle',
    category: 'Denúncias',
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
    id: 'autorizacao-evento',
    name: 'Autorização para Evento',
    description: 'Autorização de segurança para eventos',
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
    id: 'objeto-perdido',
    name: 'Achados e Perdidos',
    description: 'Registro de objetos perdidos ou achados',
    icon: 'Search',
    category: 'Achados',
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
    id: 'fiscalizacao-transito',
    name: 'Solicitação de Fiscalização',
    description: 'Pedido de fiscalização de trânsito',
    icon: 'TrafficCone',
    category: 'Trânsito',
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
    id: 'alarme-comunitario',
    name: 'Cadastro em Alarme Comunitário',
    description: 'Participação em sistema de alarme',
    icon: 'Bell',
    category: 'Segurança',
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
    id: 'seguranca-publica-servico-11',
    name: 'Serviço Seguranca-publica 11',
    description: 'Descrição do serviço 11 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-12',
    name: 'Serviço Seguranca-publica 12',
    description: 'Descrição do serviço 12 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-13',
    name: 'Serviço Seguranca-publica 13',
    description: 'Descrição do serviço 13 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-14',
    name: 'Serviço Seguranca-publica 14',
    description: 'Descrição do serviço 14 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-15',
    name: 'Serviço Seguranca-publica 15',
    description: 'Descrição do serviço 15 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-16',
    name: 'Serviço Seguranca-publica 16',
    description: 'Descrição do serviço 16 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-17',
    name: 'Serviço Seguranca-publica 17',
    description: 'Descrição do serviço 17 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-18',
    name: 'Serviço Seguranca-publica 18',
    description: 'Descrição do serviço 18 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-19',
    name: 'Serviço Seguranca-publica 19',
    description: 'Descrição do serviço 19 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-20',
    name: 'Serviço Seguranca-publica 20',
    description: 'Descrição do serviço 20 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-21',
    name: 'Serviço Seguranca-publica 21',
    description: 'Descrição do serviço 21 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-22',
    name: 'Serviço Seguranca-publica 22',
    description: 'Descrição do serviço 22 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-23',
    name: 'Serviço Seguranca-publica 23',
    description: 'Descrição do serviço 23 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-24',
    name: 'Serviço Seguranca-publica 24',
    description: 'Descrição do serviço 24 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-25',
    name: 'Serviço Seguranca-publica 25',
    description: 'Descrição do serviço 25 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-26',
    name: 'Serviço Seguranca-publica 26',
    description: 'Descrição do serviço 26 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-27',
    name: 'Serviço Seguranca-publica 27',
    description: 'Descrição do serviço 27 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-28',
    name: 'Serviço Seguranca-publica 28',
    description: 'Descrição do serviço 28 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-29',
    name: 'Serviço Seguranca-publica 29',
    description: 'Descrição do serviço 29 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-30',
    name: 'Serviço Seguranca-publica 30',
    description: 'Descrição do serviço 30 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-31',
    name: 'Serviço Seguranca-publica 31',
    description: 'Descrição do serviço 31 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-32',
    name: 'Serviço Seguranca-publica 32',
    description: 'Descrição do serviço 32 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-33',
    name: 'Serviço Seguranca-publica 33',
    description: 'Descrição do serviço 33 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-34',
    name: 'Serviço Seguranca-publica 34',
    description: 'Descrição do serviço 34 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-35',
    name: 'Serviço Seguranca-publica 35',
    description: 'Descrição do serviço 35 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-36',
    name: 'Serviço Seguranca-publica 36',
    description: 'Descrição do serviço 36 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-37',
    name: 'Serviço Seguranca-publica 37',
    description: 'Descrição do serviço 37 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-38',
    name: 'Serviço Seguranca-publica 38',
    description: 'Descrição do serviço 38 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-39',
    name: 'Serviço Seguranca-publica 39',
    description: 'Descrição do serviço 39 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-40',
    name: 'Serviço Seguranca-publica 40',
    description: 'Descrição do serviço 40 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-41',
    name: 'Serviço Seguranca-publica 41',
    description: 'Descrição do serviço 41 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-42',
    name: 'Serviço Seguranca-publica 42',
    description: 'Descrição do serviço 42 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-43',
    name: 'Serviço Seguranca-publica 43',
    description: 'Descrição do serviço 43 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-44',
    name: 'Serviço Seguranca-publica 44',
    description: 'Descrição do serviço 44 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-45',
    name: 'Serviço Seguranca-publica 45',
    description: 'Descrição do serviço 45 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-46',
    name: 'Serviço Seguranca-publica 46',
    description: 'Descrição do serviço 46 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-47',
    name: 'Serviço Seguranca-publica 47',
    description: 'Descrição do serviço 47 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-48',
    name: 'Serviço Seguranca-publica 48',
    description: 'Descrição do serviço 48 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-49',
    name: 'Serviço Seguranca-publica 49',
    description: 'Descrição do serviço 49 da secretaria de seguranca-publica',
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
    id: 'seguranca-publica-servico-50',
    name: 'Serviço Seguranca-publica 50',
    description: 'Descrição do serviço 50 da secretaria de seguranca-publica',
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
