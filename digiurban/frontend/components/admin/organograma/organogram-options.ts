export const TIPO_UNIDADE_OPTIONS = [
  'DIRETORIA',
  'COORDENADORIA',
  'DIVISAO',
  'SETOR',
  'NUCLEO',
  'GERENCIA',
  'UNIDADE_ESPECIAL',
  'DEPARTAMENTO',
  'ASSESSORIA',
] as const;

export const TIPO_UNIDADE_LABELS: Record<string, string> = {
  SECRETARIA: 'Secretaria',
  DIRETORIA: 'Diretoria',
  COORDENADORIA: 'Coordenadoria',
  DIVISAO: 'Divisao',
  SETOR: 'Setor',
  NUCLEO: 'Nucleo',
  GERENCIA: 'Gerencia',
  UNIDADE_ESPECIAL: 'Unidade especial',
  DEPARTAMENTO: 'Departamento',
  ASSESSORIA: 'Assessoria',
};

export const TIPO_UNIDADE_COLORS: Record<string, string> = {
  SECRETARIA: 'bg-blue-100 text-blue-800 border-blue-300',
  DIRETORIA: 'bg-purple-100 text-purple-800 border-purple-300',
  COORDENADORIA: 'bg-green-100 text-green-800 border-green-300',
  DIVISAO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  SETOR: 'bg-gray-100 text-gray-700 border-gray-300',
  NUCLEO: 'bg-pink-100 text-pink-800 border-pink-300',
  GERENCIA: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  UNIDADE_ESPECIAL: 'bg-teal-100 text-teal-800 border-teal-300',
  DEPARTAMENTO: 'bg-orange-100 text-orange-800 border-orange-300',
  ASSESSORIA: 'bg-cyan-100 text-cyan-800 border-cyan-300',
};

export const NIVEL_BY_TIPO: Record<string, number> = {
  SECRETARIA: 1,
  DIRETORIA: 2,
  COORDENADORIA: 3,
  DIVISAO: 4,
  SETOR: 5,
  NUCLEO: 6,
  GERENCIA: 3,
  UNIDADE_ESPECIAL: 4,
  DEPARTAMENTO: 2,
  ASSESSORIA: 3,
};

export const TIPO_CARGO_OPTIONS = [
  'EFETIVO',
  'COMISSIONADO',
  'TEMPORARIO',
  'CONTRATADO',
  'ESTAGIARIO',
  'VOLUNTARIO',
] as const;

export const TIPO_CARGO_LABELS: Record<string, string> = {
  EFETIVO: 'Efetivo',
  COMISSIONADO: 'Comissionado',
  TEMPORARIO: 'Temporario',
  CONTRATADO: 'Contratado',
  ESTAGIARIO: 'Estagiario',
  VOLUNTARIO: 'Voluntario',
};

export const TIPO_CARGO_COLORS: Record<string, string> = {
  EFETIVO: 'bg-blue-100 text-blue-800 border-blue-300',
  COMISSIONADO: 'bg-purple-100 text-purple-800 border-purple-300',
  TEMPORARIO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONTRATADO: 'bg-green-100 text-green-800 border-green-300',
  ESTAGIARIO: 'bg-orange-100 text-orange-800 border-orange-300',
  VOLUNTARIO: 'bg-pink-100 text-pink-800 border-pink-300',
};

export const NIVEL_CARGO_OPTIONS = [
  'OPERACIONAL',
  'TECNICO',
  'ANALISTA',
  'ESPECIALISTA',
  'COORDENACAO',
  'GERENCIA',
  'DIRECAO',
  'SECRETARIADO',
] as const;

export const NIVEL_CARGO_LABELS: Record<string, string> = {
  OPERACIONAL: 'Operacional',
  TECNICO: 'Tecnico',
  ANALISTA: 'Analista',
  ESPECIALISTA: 'Especialista',
  COORDENACAO: 'Coordenacao',
  GERENCIA: 'Gerencia',
  DIRECAO: 'Direcao',
  SECRETARIADO: 'Secretariado',
};

export const NIVEL_CARGO_COLORS: Record<string, string> = {
  OPERACIONAL: 'bg-gray-100 text-gray-700 border-gray-300',
  TECNICO: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  ANALISTA: 'bg-blue-100 text-blue-800 border-blue-300',
  ESPECIALISTA: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  COORDENACAO: 'bg-violet-100 text-violet-800 border-violet-300',
  GERENCIA: 'bg-purple-100 text-purple-800 border-purple-300',
  DIRECAO: 'bg-rose-100 text-rose-800 border-rose-300',
  SECRETARIADO: 'bg-amber-100 text-amber-800 border-amber-300',
};

export const TIPO_FUNCAO_OPTIONS = [
  'GRATIFICADA',
  'COMISSIONADA',
  'DESIGNACAO',
  'REPRESENTACAO',
] as const;

export const TIPO_FUNCAO_LABELS: Record<string, string> = {
  GRATIFICADA: 'Gratificada',
  COMISSIONADA: 'Comissionada',
  DESIGNACAO: 'Designacao',
  REPRESENTACAO: 'Representacao',
};

export const TIPO_FUNCAO_COLORS: Record<string, string> = {
  GRATIFICADA: 'bg-green-100 text-green-800 border-green-300',
  COMISSIONADA: 'bg-blue-100 text-blue-800 border-blue-300',
  DESIGNACAO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  REPRESENTACAO: 'bg-purple-100 text-purple-800 border-purple-300',
};
