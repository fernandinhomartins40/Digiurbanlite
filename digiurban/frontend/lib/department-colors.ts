/**
 * Sistema de cores por Secretaria/Departamento
 * Cada secretaria tem uma paleta de cores única para melhor diferenciação visual
 */

export interface DepartmentTheme {
  id: string;
  name: string;
  primary: string;      // Cor primária para badges/ícones
  light: string;        // Cor de fundo suave
  border: string;       // Cor da borda
  textClass: string;    // Classe Tailwind para texto
  bgClass: string;      // Classe Tailwind para background
  borderClass: string;  // Classe Tailwind para borda
}

export const DEPARTMENT_THEMES: Record<string, DepartmentTheme> = {
  // Saúde - Verde/Teal (discreto)
  'saude': {
    id: 'saude',
    name: 'Saúde',
    primary: '#14b8a6',
    light: '#f0fdfa',
    border: '#99f6e4',
    textClass: 'text-teal-600',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200'
  },

  // Educação - Azul (discreto)
  'educacao': {
    id: 'educacao',
    name: 'Educação',
    primary: '#3b82f6',
    light: '#eff6ff',
    border: '#bfdbfe',
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200'
  },

  // Assistência Social - Rosa (discreto)
  'assistencia-social': {
    id: 'assistencia-social',
    name: 'Assistência Social',
    primary: '#ec4899',
    light: '#fdf2f8',
    border: '#fbcfe8',
    textClass: 'text-pink-600',
    bgClass: 'bg-pink-50',
    borderClass: 'border-pink-200'
  },

  // Obras Públicas - Laranja (discreto)
  'obras-publicas': {
    id: 'obras-publicas',
    name: 'Obras Públicas',
    primary: '#f97316',
    light: '#fff7ed',
    border: '#fed7aa',
    textClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200'
  },

  // Meio Ambiente - Verde (discreto)
  'meio-ambiente': {
    id: 'meio-ambiente',
    name: 'Meio Ambiente',
    primary: '#22c55e',
    light: '#f0fdf4',
    border: '#bbf7d0',
    textClass: 'text-green-600',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200'
  },

  // Cultura - Roxo (discreto)
  'cultura': {
    id: 'cultura',
    name: 'Cultura',
    primary: '#a855f7',
    light: '#faf5ff',
    border: '#e9d5ff',
    textClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200'
  },

  // Esportes - Vermelho (discreto)
  'esportes': {
    id: 'esportes',
    name: 'Esportes',
    primary: '#ef4444',
    light: '#fef2f2',
    border: '#fecaca',
    textClass: 'text-red-600',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200'
  },

  // Agricultura - Verde Lima (discreto)
  'agricultura': {
    id: 'agricultura',
    name: 'Agricultura',
    primary: '#84cc16',
    light: '#f7fee7',
    border: '#d9f99d',
    textClass: 'text-lime-600',
    bgClass: 'bg-lime-50',
    borderClass: 'border-lime-200'
  },

  // Segurança Pública - Cinza (discreto)
  'seguranca-publica': {
    id: 'seguranca-publica',
    name: 'Segurança Pública',
    primary: '#64748b',
    light: '#f8fafc',
    border: '#cbd5e1',
    textClass: 'text-slate-600',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200'
  },

  // Habitação - Âmbar (discreto)
  'habitacao': {
    id: 'habitacao',
    name: 'Habitação',
    primary: '#f59e0b',
    light: '#fffbeb',
    border: '#fde68a',
    textClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },

  // Turismo - Ciano (discreto)
  'turismo': {
    id: 'turismo',
    name: 'Turismo',
    primary: '#06b6d4',
    light: '#ecfeff',
    border: '#a5f3fc',
    textClass: 'text-cyan-600',
    bgClass: 'bg-cyan-50',
    borderClass: 'border-cyan-200'
  },

  // Urbanismo - Azul Céu (discreto)
  'urbanismo': {
    id: 'urbanismo',
    name: 'Urbanismo e Planejamento',
    primary: '#0284c7',
    light: '#f0f9ff',
    border: '#bae6fd',
    textClass: 'text-sky-600',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200'
  },

  // Padrão - Cinza (discreto)
  'default': {
    id: 'default',
    name: 'Outros',
    primary: '#6b7280',
    light: '#f9fafb',
    border: '#d1d5db',
    textClass: 'text-gray-600',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200'
  }
};

/**
 * Mapeia nome do departamento para ID do tema
 */
export function getDepartmentThemeId(departmentName: string): string {
  const normalized = departmentName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('saude') || normalized.includes('saúde')) return 'saude';
  if (normalized.includes('educacao') || normalized.includes('educação')) return 'educacao';
  if (normalized.includes('assistencia') || normalized.includes('social')) return 'assistencia-social';
  if (normalized.includes('obras')) return 'obras-publicas';
  if (normalized.includes('ambiente') || normalized.includes('ambiental')) return 'meio-ambiente';
  if (normalized.includes('cultura')) return 'cultura';
  if (normalized.includes('esporte')) return 'esportes';
  if (normalized.includes('agricultura') || normalized.includes('rural')) return 'agricultura';
  if (normalized.includes('seguranca') || normalized.includes('segurança')) return 'seguranca-publica';
  if (normalized.includes('habitacao') || normalized.includes('habitação')) return 'habitacao';
  if (normalized.includes('turismo')) return 'turismo';
  if (normalized.includes('urbanismo') || normalized.includes('planejamento')) return 'urbanismo';

  return 'default';
}

/**
 * Retorna o tema de cores para um departamento
 */
export function getDepartmentTheme(departmentName: string): DepartmentTheme {
  const themeId = getDepartmentThemeId(departmentName);
  return DEPARTMENT_THEMES[themeId] || DEPARTMENT_THEMES.default;
}

/**
 * Paleta de cores para categorias - 8 variações sutis
 * Cada categoria recebe uma cor diferente da paleta principal
 */
export const CATEGORY_COLORS = [
  { textClass: 'text-blue-600', bgClass: 'bg-blue-50', borderClass: 'border-blue-200', primary: '#3b82f6' },
  { textClass: 'text-emerald-600', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200', primary: '#10b981' },
  { textClass: 'text-purple-600', bgClass: 'bg-purple-50', borderClass: 'border-purple-200', primary: '#a855f7' },
  { textClass: 'text-rose-600', bgClass: 'bg-rose-50', borderClass: 'border-rose-200', primary: '#f43f5e' },
  { textClass: 'text-amber-600', bgClass: 'bg-amber-50', borderClass: 'border-amber-200', primary: '#f59e0b' },
  { textClass: 'text-cyan-600', bgClass: 'bg-cyan-50', borderClass: 'border-cyan-200', primary: '#06b6d4' },
  { textClass: 'text-indigo-600', bgClass: 'bg-indigo-50', borderClass: 'border-indigo-200', primary: '#6366f1' },
  { textClass: 'text-teal-600', bgClass: 'bg-teal-50', borderClass: 'border-teal-200', primary: '#14b8a6' },
];

/**
 * Retorna cor para uma categoria baseado em hash do nome
 * Garante que a mesma categoria sempre tenha a mesma cor
 */
export function getCategoryColor(categoryName: string) {
  // Hash simples do nome da categoria
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) - hash) + categoryName.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Usar hash para selecionar cor da paleta
  const index = Math.abs(hash) % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[index];
}
