import { ServiceSuggestion } from './types';

export const obraspublicasSuggestions: ServiceSuggestion[] = [
  {
    id: 'tapa-buraco',
    name: 'Solicitação de Tapa-Buraco',
    description: 'Reparo de buracos em vias',
    icon: 'Construction',
    category: 'Manutenção',
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
    id: 'iluminacao-publica',
    name: 'Manutenção de Iluminação Pública',
    description: 'Reparo ou instalação de iluminação',
    icon: 'Lightbulb',
    category: 'Iluminação',
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
    id: 'limpeza-via-publica',
    name: 'Limpeza de Via Pública',
    description: 'Solicitação de limpeza urbana',
    icon: 'Trash',
    category: 'Limpeza',
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
    id: 'calcada-cidada',
    name: 'Programa Calçada Cidadã',
    description: 'Regularização de calçadas',
    icon: 'Footprints',
    category: 'Acessibilidade',
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
    id: 'drenagem-pluvial',
    name: 'Manutenção de Drenagem',
    description: 'Limpeza e reparo de drenagem',
    icon: 'Droplets',
    category: 'Drenagem',
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
    id: 'pavimentacao',
    name: 'Solicitação de Pavimentação',
    description: 'Pedido de pavimentação de ruas',
    icon: 'Route',
    category: 'Pavimentação',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'sinalizacao-viaria',
    name: 'Sinalização Viária',
    description: 'Solicitação de placas e sinalização',
    icon: 'SignpostBig',
    category: 'Trânsito',
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
    id: 'ponte-pontilhao',
    name: 'Manutenção de Pontes',
    description: 'Reparo em pontes e pontilhões',
    icon: 'Bridge',
    category: 'Infraestrutura',
    estimatedDays: 30,
    requiresDocuments: false,
    suggestedFields: [
      { name: 'nome_completo', type: 'text', label: 'Nome Completo', required: true },
      { name: 'cpf', type: 'cpf', label: 'CPF', required: true },
      { name: 'telefone', type: 'tel', label: 'Telefone', required: true },
      { name: 'email', type: 'email', label: 'E-mail', required: false },
    ]
  },
  {
    id: 'meio-fio',
    name: 'Instalação de Meio-Fio',
    description: 'Solicitação de meio-fio e sarjeta',
    icon: 'Construction',
    category: 'Infraestrutura',
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
    id: 'praca-manutencao',
    name: 'Manutenção de Praças',
    description: 'Reforma e manutenção de praças',
    icon: 'Trees',
    category: 'Áreas Verdes',
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
    id: 'obras-publicas-servico-11',
    name: 'Serviço Obras-publicas 11',
    description: 'Descrição do serviço 11 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-12',
    name: 'Serviço Obras-publicas 12',
    description: 'Descrição do serviço 12 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-13',
    name: 'Serviço Obras-publicas 13',
    description: 'Descrição do serviço 13 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-14',
    name: 'Serviço Obras-publicas 14',
    description: 'Descrição do serviço 14 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-15',
    name: 'Serviço Obras-publicas 15',
    description: 'Descrição do serviço 15 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-16',
    name: 'Serviço Obras-publicas 16',
    description: 'Descrição do serviço 16 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-17',
    name: 'Serviço Obras-publicas 17',
    description: 'Descrição do serviço 17 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-18',
    name: 'Serviço Obras-publicas 18',
    description: 'Descrição do serviço 18 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-19',
    name: 'Serviço Obras-publicas 19',
    description: 'Descrição do serviço 19 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-20',
    name: 'Serviço Obras-publicas 20',
    description: 'Descrição do serviço 20 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-21',
    name: 'Serviço Obras-publicas 21',
    description: 'Descrição do serviço 21 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-22',
    name: 'Serviço Obras-publicas 22',
    description: 'Descrição do serviço 22 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-23',
    name: 'Serviço Obras-publicas 23',
    description: 'Descrição do serviço 23 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-24',
    name: 'Serviço Obras-publicas 24',
    description: 'Descrição do serviço 24 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-25',
    name: 'Serviço Obras-publicas 25',
    description: 'Descrição do serviço 25 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-26',
    name: 'Serviço Obras-publicas 26',
    description: 'Descrição do serviço 26 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-27',
    name: 'Serviço Obras-publicas 27',
    description: 'Descrição do serviço 27 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-28',
    name: 'Serviço Obras-publicas 28',
    description: 'Descrição do serviço 28 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-29',
    name: 'Serviço Obras-publicas 29',
    description: 'Descrição do serviço 29 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-30',
    name: 'Serviço Obras-publicas 30',
    description: 'Descrição do serviço 30 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-31',
    name: 'Serviço Obras-publicas 31',
    description: 'Descrição do serviço 31 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-32',
    name: 'Serviço Obras-publicas 32',
    description: 'Descrição do serviço 32 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-33',
    name: 'Serviço Obras-publicas 33',
    description: 'Descrição do serviço 33 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-34',
    name: 'Serviço Obras-publicas 34',
    description: 'Descrição do serviço 34 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-35',
    name: 'Serviço Obras-publicas 35',
    description: 'Descrição do serviço 35 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-36',
    name: 'Serviço Obras-publicas 36',
    description: 'Descrição do serviço 36 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-37',
    name: 'Serviço Obras-publicas 37',
    description: 'Descrição do serviço 37 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-38',
    name: 'Serviço Obras-publicas 38',
    description: 'Descrição do serviço 38 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-39',
    name: 'Serviço Obras-publicas 39',
    description: 'Descrição do serviço 39 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-40',
    name: 'Serviço Obras-publicas 40',
    description: 'Descrição do serviço 40 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-41',
    name: 'Serviço Obras-publicas 41',
    description: 'Descrição do serviço 41 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-42',
    name: 'Serviço Obras-publicas 42',
    description: 'Descrição do serviço 42 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-43',
    name: 'Serviço Obras-publicas 43',
    description: 'Descrição do serviço 43 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-44',
    name: 'Serviço Obras-publicas 44',
    description: 'Descrição do serviço 44 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-45',
    name: 'Serviço Obras-publicas 45',
    description: 'Descrição do serviço 45 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-46',
    name: 'Serviço Obras-publicas 46',
    description: 'Descrição do serviço 46 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-47',
    name: 'Serviço Obras-publicas 47',
    description: 'Descrição do serviço 47 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-48',
    name: 'Serviço Obras-publicas 48',
    description: 'Descrição do serviço 48 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-49',
    name: 'Serviço Obras-publicas 49',
    description: 'Descrição do serviço 49 da secretaria de obras-publicas',
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
    id: 'obras-publicas-servico-50',
    name: 'Serviço Obras-publicas 50',
    description: 'Descrição do serviço 50 da secretaria de obras-publicas',
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
