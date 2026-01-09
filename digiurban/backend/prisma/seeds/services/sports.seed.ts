/**
 * SEED DE SERVIÇOS - SECRETARIA DE ESPORTES
 * Total: 7 serviços (4 COM_DADOS + 3 SEM_DADOS)
 */

import { ServiceDefinition } from './types';

export const sportsServices: ServiceDefinition[] = [
  // ========== SERVIÇOS COM_DADOS (4) ==========

  {
    name: 'Inscrição em Escolinha Esportiva',
    description: 'Inscrição em escolinhas e programas esportivos municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_ESCOLINHA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico'],
    estimatedDays: 7,
    priority: 4,
    category: 'Inscrições',
    icon: 'Trophy',
    color: '#f97316',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        modalidade: { type: 'string', title: 'Modalidade Esportiva', enum: ['Futebol', 'Vôlei', 'Basquete', 'Handebol', 'Natação', 'Judô', 'Karatê', 'Atletismo', 'Outro'] },
        turno: { type: 'string', title: 'Turno de Preferência', enum: ['Manhã', 'Tarde', 'Noite'] },
        nivelExperiencia: { type: 'string', title: 'Nível de Experiência', enum: ['Iniciante', 'Intermediário', 'Avançado'] }
      },
      required: ['modalidade', 'turno', 'nivelExperiencia']
    }
  },

  {
    name: 'Reserva de Espaço Esportivo',
    description: 'Reserva de quadras, campos e espaços esportivos municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'RESERVA_ESPACO_ESPORTIVO',
    requiresDocuments: false,
    estimatedDays: 3,
    priority: 3,
    category: 'Reservas',
    icon: 'CalendarCheck',
    color: '#10b981',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        tipoEspaco: { type: 'string', title: 'Tipo de Espaço', enum: ['Quadra de Futebol', 'Quadra Poliesportiva', 'Campo de Futebol', 'Ginásio', 'Pista de Atletismo', 'Outro'] },
        dataReserva: { type: 'string', format: 'date', title: 'Data da Reserva' },
        horarioInicio: { type: 'string', title: 'Horário de Início', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        horarioFim: { type: 'string', title: 'Horário de Término', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
        finalidade: { type: 'string', title: 'Finalidade', maxLength: 300 }
      },
      required: ['tipoEspaco', 'dataReserva', 'horarioInicio', 'horarioFim', 'finalidade']
    }
  },

  {
    name: 'Inscrição em Competição',
    description: 'Inscrição em competições e torneios municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'INSCRICAO_COMPETICAO',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico', 'Foto 3x4'],
    estimatedDays: 10,
    priority: 4,
    category: 'Competições',
    icon: 'Medal',
    color: '#eab308',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        nomeCompeticao: { type: 'string', title: 'Nome da Competição', maxLength: 200 },
        modalidade: { type: 'string', title: 'Modalidade', maxLength: 100 },
        categoria: { type: 'string', title: 'Categoria', enum: ['Infantil', 'Juvenil', 'Adulto', 'Master', 'Livre'] },
        tipoParticipacao: { type: 'string', title: 'Tipo de Participação', enum: ['Individual', 'Equipe'] },
        nomeEquipe: { type: 'string', title: 'Nome da Equipe (se aplicável)', maxLength: 200 }
      },
      required: ['nomeCompeticao', 'modalidade', 'categoria', 'tipoParticipacao']
    }
  },

  {
    name: 'Cadastro de Atleta Municipal',
    description: 'Cadastro oficial de atletas do município',
    departmentCode: 'ESPORTES',
    serviceType: 'COM_DADOS',
    moduleType: 'CADASTRO_ATLETA',
    requiresDocuments: true,
    requiredDocuments: ['CPF', 'RG', 'Atestado Médico', 'Foto 3x4', 'Comprovante de Residência'],
    estimatedDays: 15,
    priority: 4,
    category: 'Cadastros',
    icon: 'User',
    color: '#3b82f6',
    formSchema: {
      type: 'object',
      citizenFields: ['citizen_name', 'citizen_cpf', 'citizen_rg', 'citizen_birthdate', 'citizen_email', 'citizen_phone', 'citizen_phonesecondary', 'citizen_zipcode', 'citizen_address', 'citizen_addressnumber', 'citizen_addresscomplement', 'citizen_neighborhood', 'citizen_mothername', 'citizen_maritalstatus', 'citizen_occupation', 'citizen_familyincome'],
      properties: {
        modalidadePrincipal: { type: 'string', title: 'Modalidade Principal', maxLength: 100 },
        nivelCompetitivo: { type: 'string', title: 'Nível Competitivo', enum: ['Iniciante', 'Amador', 'Profissional'] },
        equipesAtuais: { type: 'string', title: 'Equipes/Clubes Atuais', maxLength: 300 },
        conquistas: { type: 'string', title: 'Principais Conquistas', maxLength: 500, widget: 'textarea' }
      },
      required: ['modalidadePrincipal', 'nivelCompetitivo']
    }
  },

  // ========== SERVIÇOS SEM_DADOS (3) ==========

  {
    name: 'Certidão de Atleta Municipal',
    description: 'Emissão de certidão comprovando cadastro como atleta municipal (usa dados do perfil do cidadão)',
    departmentCode: 'ESPORTES',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 5,
    priority: 3,
    category: 'Certidões',
    icon: 'FileText',
    color: '#f97316'
  },

  {
    name: 'Declaração de Participação em Competição',
    description: 'Emissão de declaração de participação em evento esportivo (usa dados do perfil do cidadão)',
    departmentCode: 'ESPORTES',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    requiredDocuments: [],
    estimatedDays: 3,
    priority: 2,
    category: 'Declarações',
    icon: 'FileCheck',
    color: '#10b981'
  },

  {
    name: 'Calendário Esportivo',
    description: 'Consulta ao calendário de eventos esportivos municipais',
    departmentCode: 'ESPORTES',
    serviceType: 'SEM_DADOS',
    moduleType: null,
    requiresDocuments: false,
    estimatedDays: null,
    priority: 1,
    category: 'Informativo',
    icon: 'Calendar',
    color: '#94a3b8'
  }
];
