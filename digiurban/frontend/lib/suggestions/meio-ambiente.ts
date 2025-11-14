import { ServiceSuggestion } from './types';

export const meioambienteSuggestions: ServiceSuggestion[] = [
  {
    id: 'licenca-ambiental',
    name: 'Licença Ambiental',
    description: 'Licenciamento de atividades',
    icon: 'FileCheck',
    category: 'Licenciamento',
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
    id: 'poda-arvore',
    name: 'Solicitação de Poda de Árvore',
    description: 'Poda em vias públicas',
    icon: 'TreeDeciduous',
    category: 'Manutenção',
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
    id: 'denuncia-ambiental',
    name: 'Denúncia Ambiental',
    description: 'Denuncie crimes ambientais',
    icon: 'AlertTriangle',
    category: 'Fiscalização',
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
    id: 'coleta-seletiva-cadastro',
    name: 'Cadastro em Coleta Seletiva',
    description: 'Participe da coleta seletiva',
    icon: 'Recycle',
    category: 'Reciclagem',
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
    id: 'aterro-sanitario',
    name: 'Descarte em Aterro Sanitário',
    description: 'Autorização para descarte',
    icon: 'Trash2',
    category: 'Resíduos',
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
    id: 'arborizacao-urbana',
    name: 'Plantio de Árvores',
    description: 'Solicitação de plantio de árvores',
    icon: 'TreePine',
    category: 'Arborização',
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
    id: 'autorizacao-queimada',
    name: 'Autorização para Queimada Controlada',
    description: 'Licença para queimada controlada',
    icon: 'Flame',
    category: 'Autorização',
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
    id: 'recuperacao-nascente',
    name: 'Programa de Recuperação de Nascentes',
    description: 'Adesão ao programa de recuperação',
    icon: 'Droplet',
    category: 'Conservação',
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
    id: 'compostagem',
    name: 'Programa de Compostagem',
    description: 'Participe do programa de compostagem',
    icon: 'Leaf',
    category: 'Sustentabilidade',
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
    id: 'educacao-ambiental',
    name: 'Educação Ambiental',
    description: 'Palestras e oficinas ambientais',
    icon: 'BookOpen',
    category: 'Educação',
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
    id: 'meio-ambiente-servico-11',
    name: 'Serviço Meio-ambiente 11',
    description: 'Descrição do serviço 11 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-12',
    name: 'Serviço Meio-ambiente 12',
    description: 'Descrição do serviço 12 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-13',
    name: 'Serviço Meio-ambiente 13',
    description: 'Descrição do serviço 13 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-14',
    name: 'Serviço Meio-ambiente 14',
    description: 'Descrição do serviço 14 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-15',
    name: 'Serviço Meio-ambiente 15',
    description: 'Descrição do serviço 15 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-16',
    name: 'Serviço Meio-ambiente 16',
    description: 'Descrição do serviço 16 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-17',
    name: 'Serviço Meio-ambiente 17',
    description: 'Descrição do serviço 17 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-18',
    name: 'Serviço Meio-ambiente 18',
    description: 'Descrição do serviço 18 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-19',
    name: 'Serviço Meio-ambiente 19',
    description: 'Descrição do serviço 19 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-20',
    name: 'Serviço Meio-ambiente 20',
    description: 'Descrição do serviço 20 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-21',
    name: 'Serviço Meio-ambiente 21',
    description: 'Descrição do serviço 21 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-22',
    name: 'Serviço Meio-ambiente 22',
    description: 'Descrição do serviço 22 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-23',
    name: 'Serviço Meio-ambiente 23',
    description: 'Descrição do serviço 23 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-24',
    name: 'Serviço Meio-ambiente 24',
    description: 'Descrição do serviço 24 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-25',
    name: 'Serviço Meio-ambiente 25',
    description: 'Descrição do serviço 25 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-26',
    name: 'Serviço Meio-ambiente 26',
    description: 'Descrição do serviço 26 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-27',
    name: 'Serviço Meio-ambiente 27',
    description: 'Descrição do serviço 27 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-28',
    name: 'Serviço Meio-ambiente 28',
    description: 'Descrição do serviço 28 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-29',
    name: 'Serviço Meio-ambiente 29',
    description: 'Descrição do serviço 29 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-30',
    name: 'Serviço Meio-ambiente 30',
    description: 'Descrição do serviço 30 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-31',
    name: 'Serviço Meio-ambiente 31',
    description: 'Descrição do serviço 31 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-32',
    name: 'Serviço Meio-ambiente 32',
    description: 'Descrição do serviço 32 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-33',
    name: 'Serviço Meio-ambiente 33',
    description: 'Descrição do serviço 33 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-34',
    name: 'Serviço Meio-ambiente 34',
    description: 'Descrição do serviço 34 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-35',
    name: 'Serviço Meio-ambiente 35',
    description: 'Descrição do serviço 35 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-36',
    name: 'Serviço Meio-ambiente 36',
    description: 'Descrição do serviço 36 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-37',
    name: 'Serviço Meio-ambiente 37',
    description: 'Descrição do serviço 37 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-38',
    name: 'Serviço Meio-ambiente 38',
    description: 'Descrição do serviço 38 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-39',
    name: 'Serviço Meio-ambiente 39',
    description: 'Descrição do serviço 39 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-40',
    name: 'Serviço Meio-ambiente 40',
    description: 'Descrição do serviço 40 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-41',
    name: 'Serviço Meio-ambiente 41',
    description: 'Descrição do serviço 41 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-42',
    name: 'Serviço Meio-ambiente 42',
    description: 'Descrição do serviço 42 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-43',
    name: 'Serviço Meio-ambiente 43',
    description: 'Descrição do serviço 43 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-44',
    name: 'Serviço Meio-ambiente 44',
    description: 'Descrição do serviço 44 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-45',
    name: 'Serviço Meio-ambiente 45',
    description: 'Descrição do serviço 45 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-46',
    name: 'Serviço Meio-ambiente 46',
    description: 'Descrição do serviço 46 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-47',
    name: 'Serviço Meio-ambiente 47',
    description: 'Descrição do serviço 47 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-48',
    name: 'Serviço Meio-ambiente 48',
    description: 'Descrição do serviço 48 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-49',
    name: 'Serviço Meio-ambiente 49',
    description: 'Descrição do serviço 49 da secretaria de meio-ambiente',
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
    id: 'meio-ambiente-servico-50',
    name: 'Serviço Meio-ambiente 50',
    description: 'Descrição do serviço 50 da secretaria de meio-ambiente',
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
