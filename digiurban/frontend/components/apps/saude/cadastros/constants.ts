/**
 * CONSTANTES - Tipos, Status e Configurações dos Selectors
 *
 * Este arquivo centraliza as constantes utilizadas nos componentes selectors
 * para facilitar manutenção e garantir consistência.
 */

// ============================================================================
// TIPOS DE UNIDADES DE SAÚDE
// ============================================================================

export const TIPOS_UNIDADE = {
  UBS: 'UBS',
  UPA: 'UPA',
  HOSPITAL: 'HOSPITAL',
  CLINICA: 'CLINICA',
  PRONTO_SOCORRO: 'PRONTO_SOCORRO',
  CAPS: 'CAPS',
  LABORATORIO: 'LABORATORIO',
} as const;

export const TIPOS_UNIDADE_LABELS: Record<string, string> = {
  [TIPOS_UNIDADE.UBS]: 'UBS',
  [TIPOS_UNIDADE.UPA]: 'UPA',
  [TIPOS_UNIDADE.HOSPITAL]: 'Hospital',
  [TIPOS_UNIDADE.CLINICA]: 'Clínica',
  [TIPOS_UNIDADE.PRONTO_SOCORRO]: 'Pronto Socorro',
  [TIPOS_UNIDADE.CAPS]: 'CAPS',
  [TIPOS_UNIDADE.LABORATORIO]: 'Laboratório',
};

export const TIPOS_UNIDADE_COLORS: Record<string, string> = {
  [TIPOS_UNIDADE.UBS]: 'bg-green-100 text-green-800 border-green-200',
  [TIPOS_UNIDADE.UPA]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TIPOS_UNIDADE.HOSPITAL]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TIPOS_UNIDADE.CLINICA]: 'bg-purple-100 text-purple-800 border-purple-200',
  [TIPOS_UNIDADE.PRONTO_SOCORRO]: 'bg-red-100 text-red-800 border-red-200',
  [TIPOS_UNIDADE.CAPS]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [TIPOS_UNIDADE.LABORATORIO]: 'bg-pink-100 text-pink-800 border-pink-200',
};

// ============================================================================
// CATEGORIAS DE PROFISSIONAIS DE SAÚDE
// ============================================================================

export const CATEGORIAS_PROFISSIONAL = {
  MEDICO: 'MEDICO',
  ENFERMEIRO: 'ENFERMEIRO',
  TECNICO_ENFERMAGEM: 'TECNICO_ENFERMAGEM',
  DENTISTA: 'DENTISTA',
  PSICOLOGO: 'PSICOLOGO',
  FISIOTERAPEUTA: 'FISIOTERAPEUTA',
  NUTRICIONISTA: 'NUTRICIONISTA',
  FARMACEUTICO: 'FARMACEUTICO',
  ASSISTENTE_SOCIAL: 'ASSISTENTE_SOCIAL',
  AGENTE_SAUDE: 'AGENTE_SAUDE',
} as const;

export const CATEGORIAS_PROFISSIONAL_LABELS: Record<string, string> = {
  [CATEGORIAS_PROFISSIONAL.MEDICO]: 'Médico(a)',
  [CATEGORIAS_PROFISSIONAL.ENFERMEIRO]: 'Enfermeiro(a)',
  [CATEGORIAS_PROFISSIONAL.TECNICO_ENFERMAGEM]: 'Téc. Enfermagem',
  [CATEGORIAS_PROFISSIONAL.DENTISTA]: 'Dentista',
  [CATEGORIAS_PROFISSIONAL.PSICOLOGO]: 'Psicólogo(a)',
  [CATEGORIAS_PROFISSIONAL.FISIOTERAPEUTA]: 'Fisioterapeuta',
  [CATEGORIAS_PROFISSIONAL.NUTRICIONISTA]: 'Nutricionista',
  [CATEGORIAS_PROFISSIONAL.FARMACEUTICO]: 'Farmacêutico(a)',
  [CATEGORIAS_PROFISSIONAL.ASSISTENTE_SOCIAL]: 'Assistente Social',
  [CATEGORIAS_PROFISSIONAL.AGENTE_SAUDE]: 'Agente de Saúde',
};

// ============================================================================
// STATUS DE PROFISSIONAIS
// ============================================================================

export const STATUS_PROFISSIONAL = {
  ATIVO: 'ATIVO',
  FERIAS: 'FERIAS',
  AFASTADO: 'AFASTADO',
  LICENCA: 'LICENCA',
  INATIVO: 'INATIVO',
} as const;

export const STATUS_PROFISSIONAL_LABELS: Record<string, string> = {
  [STATUS_PROFISSIONAL.ATIVO]: 'Ativo',
  [STATUS_PROFISSIONAL.FERIAS]: 'Férias',
  [STATUS_PROFISSIONAL.AFASTADO]: 'Afastado',
  [STATUS_PROFISSIONAL.LICENCA]: 'Licença',
  [STATUS_PROFISSIONAL.INATIVO]: 'Inativo',
};

export const STATUS_PROFISSIONAL_COLORS: Record<string, string> = {
  [STATUS_PROFISSIONAL.ATIVO]: 'bg-green-100 text-green-800 border-green-200',
  [STATUS_PROFISSIONAL.FERIAS]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [STATUS_PROFISSIONAL.AFASTADO]: 'bg-red-100 text-red-800 border-red-200',
  [STATUS_PROFISSIONAL.LICENCA]: 'bg-orange-100 text-orange-800 border-orange-200',
  [STATUS_PROFISSIONAL.INATIVO]: 'bg-gray-100 text-gray-800 border-gray-200',
};

// ============================================================================
// ÁREAS DE ESPECIALIDADES
// ============================================================================

export const AREAS_ESPECIALIDADE = {
  CLINICA_MEDICA: 'CLINICA_MEDICA',
  CIRURGIA: 'CIRURGIA',
  PEDIATRIA: 'PEDIATRIA',
  GINECOLOGIA: 'GINECOLOGIA',
  SAUDE_MENTAL: 'SAUDE_MENTAL',
  DIAGNOSTICO: 'DIAGNOSTICO',
  ODONTOLOGIA: 'ODONTOLOGIA',
} as const;

export const AREAS_ESPECIALIDADE_COLORS: Record<string, string> = {
  [AREAS_ESPECIALIDADE.CLINICA_MEDICA]: 'bg-blue-100 text-blue-800 border-blue-200',
  [AREAS_ESPECIALIDADE.CIRURGIA]: 'bg-red-100 text-red-800 border-red-200',
  [AREAS_ESPECIALIDADE.PEDIATRIA]: 'bg-pink-100 text-pink-800 border-pink-200',
  [AREAS_ESPECIALIDADE.GINECOLOGIA]: 'bg-purple-100 text-purple-800 border-purple-200',
  [AREAS_ESPECIALIDADE.SAUDE_MENTAL]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [AREAS_ESPECIALIDADE.DIAGNOSTICO]: 'bg-green-100 text-green-800 border-green-200',
  [AREAS_ESPECIALIDADE.ODONTOLOGIA]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

// ============================================================================
// TIPOS DE SALAS
// ============================================================================

export const TIPOS_SALA = {
  CONSULTORIO: 'CONSULTORIO',
  CIRURGICA: 'CIRURGICA',
  EMERGENCIA: 'EMERGENCIA',
  EXAME: 'EXAME',
  INTERNACAO: 'INTERNACAO',
  PROCEDIMENTO: 'PROCEDIMENTO',
  OBSERVACAO: 'OBSERVACAO',
  ENFERMAGEM: 'ENFERMAGEM',
  ODONTOLOGIA: 'ODONTOLOGIA',
  VACINA: 'VACINA',
} as const;

export const TIPOS_SALA_LABELS: Record<string, string> = {
  [TIPOS_SALA.CONSULTORIO]: 'Consultório',
  [TIPOS_SALA.CIRURGICA]: 'Cirúrgica',
  [TIPOS_SALA.EMERGENCIA]: 'Emergência',
  [TIPOS_SALA.EXAME]: 'Exames',
  [TIPOS_SALA.INTERNACAO]: 'Internação',
  [TIPOS_SALA.PROCEDIMENTO]: 'Procedimentos',
  [TIPOS_SALA.OBSERVACAO]: 'Observação',
  [TIPOS_SALA.ENFERMAGEM]: 'Enfermagem',
  [TIPOS_SALA.ODONTOLOGIA]: 'Odontologia',
  [TIPOS_SALA.VACINA]: 'Vacinação',
};

export const TIPOS_SALA_COLORS: Record<string, string> = {
  [TIPOS_SALA.CONSULTORIO]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TIPOS_SALA.CIRURGICA]: 'bg-red-100 text-red-800 border-red-200',
  [TIPOS_SALA.EMERGENCIA]: 'bg-orange-100 text-orange-800 border-orange-200',
  [TIPOS_SALA.EXAME]: 'bg-green-100 text-green-800 border-green-200',
  [TIPOS_SALA.INTERNACAO]: 'bg-purple-100 text-purple-800 border-purple-200',
  [TIPOS_SALA.PROCEDIMENTO]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TIPOS_SALA.OBSERVACAO]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [TIPOS_SALA.ENFERMAGEM]: 'bg-pink-100 text-pink-800 border-pink-200',
  [TIPOS_SALA.ODONTOLOGIA]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  [TIPOS_SALA.VACINA]: 'bg-teal-100 text-teal-800 border-teal-200',
};

// ============================================================================
// STATUS DE SALAS
// ============================================================================

export const STATUS_SALA = {
  DISPONIVEL: 'DISPONIVEL',
  EM_USO: 'EM_USO',
  MANUTENCAO: 'MANUTENCAO',
  DESATIVADA: 'DESATIVADA',
} as const;

export const STATUS_SALA_LABELS: Record<string, string> = {
  [STATUS_SALA.DISPONIVEL]: 'Disponível',
  [STATUS_SALA.EM_USO]: 'Em Uso',
  [STATUS_SALA.MANUTENCAO]: 'Manutenção',
  [STATUS_SALA.DESATIVADA]: 'Desativada',
};

export const STATUS_SALA_COLORS: Record<string, string> = {
  [STATUS_SALA.DISPONIVEL]: 'bg-green-100 text-green-800 border-green-200',
  [STATUS_SALA.EM_USO]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [STATUS_SALA.MANUTENCAO]: 'bg-red-100 text-red-800 border-red-200',
  [STATUS_SALA.DESATIVADA]: 'bg-gray-100 text-gray-800 border-gray-200',
};

// ============================================================================
// CONFIGURAÇÕES DE BUSCA
// ============================================================================

export const SEARCH_CONFIG = {
  MIN_CHARS_DEFAULT: 3,
  MIN_CHARS_ESPECIALIDADE: 2,
  DEBOUNCE_DELAY: 500,
  MAX_RESULTS: 50,
} as const;

// ============================================================================
// ÍCONES DE TURNOS
// ============================================================================

export const getTurnoIcone = (
  nomeTurno: string
): 'manha' | 'tarde' | 'noite' | 'madrugada' | 'padrao' => {
  const lower = nomeTurno.toLowerCase();
  if (lower.includes('manha') || lower.includes('man\u00e3')) return 'manha';
  if (lower.includes('tarde')) return 'tarde';
  if (lower.includes('noite')) return 'noite';
  if (lower.includes('madrugada')) return 'madrugada';
  return 'padrao';
};
// CORES PADRÃO DE TURNOS
// ============================================================================

export const TURNO_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  pink: 'bg-pink-100 text-pink-800 border-pink-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Formata CPF: 12345678900 -> 123.456.789-00
 */
export const formatCPF = (cpf?: string): string => {
  if (!cpf) return '';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNES: 1234567
 */
export const formatCNES = (cnes?: string): string => {
  if (!cnes) return '';
  return cnes.replace(/(\d{7})/, '$1');
};

/**
 * Formata CNS: 123456789012345 -> 123 4567 8901 2345
 */
export const formatCNS = (cns?: string): string => {
  if (!cns) return '';
  return cns.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
};

/**
 * Formata hora: HH:mm:ss -> HH:mm
 */
export const formatHora = (hora: string): string => {
  return hora.substring(0, 5);
};

/**
 * Formata tempo em minutos para string legível
 */
export const formatTempo = (minutos?: number): string => {
  if (!minutos) return '';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
};

/**
 * Calcula idade a partir de data de nascimento
 */
export const calculateAge = (birthDate?: string): string => {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} anos`;
};
