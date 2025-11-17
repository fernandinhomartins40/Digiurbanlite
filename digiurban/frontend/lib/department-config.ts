import {
  Sprout,
  Heart,
  GraduationCap,
  Trophy,
  Building2,
  Users,
  TreePine,
  Hammer,
  Landmark,
  Shield,
  Wrench,
  Palmtree,
  MapPin,
} from 'lucide-react';

export interface DepartmentConfig {
  slug: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const departmentConfig: Record<string, DepartmentConfig> = {
  agricultura: {
    slug: 'agricultura',
    name: 'Secretaria Municipal de Agricultura',
    icon: Sprout,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Desenvolvimento rural e fortalecimento da agricultura familiar',
  },
  saude: {
    slug: 'saude',
    name: 'Secretaria Municipal de Saúde',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Saúde pública e atendimento à população',
  },
  educacao: {
    slug: 'educacao',
    name: 'Secretaria Municipal de Educação',
    icon: GraduationCap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Educação infantil, fundamental e gestão escolar',
  },
  esportes: {
    slug: 'esportes',
    name: 'Secretaria Municipal de Esportes',
    icon: Trophy,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Promoção de atividades esportivas e lazer',
  },
  'assistencia-social': {
    slug: 'assistencia-social',
    name: 'Secretaria Municipal de Assistência Social',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Proteção social e programas assistenciais',
  },
  cultura: {
    slug: 'cultura',
    name: 'Secretaria Municipal de Cultura',
    icon: Palmtree,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    description: 'Promoção cultural e preservação do patrimônio',
  },
  'meio-ambiente': {
    slug: 'meio-ambiente',
    name: 'Secretaria Municipal de Meio Ambiente',
    icon: TreePine,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Preservação ambiental e sustentabilidade',
  },
  'obras-publicas': {
    slug: 'obras-publicas',
    name: 'Secretaria Municipal de Obras Públicas',
    icon: Hammer,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Infraestrutura e manutenção urbana',
  },
  'planejamento-urbano': {
    slug: 'planejamento-urbano',
    name: 'Secretaria Municipal de Planejamento Urbano',
    icon: MapPin,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    description: 'Ordenamento territorial e desenvolvimento urbano',
  },
  habitacao: {
    slug: 'habitacao',
    name: 'Secretaria Municipal de Habitação',
    icon: Building2,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    description: 'Moradia popular e regularização fundiária',
  },
  'seguranca-publica': {
    slug: 'seguranca-publica',
    name: 'Secretaria Municipal de Segurança Pública',
    icon: Shield,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Segurança pública e guarda municipal',
  },
  'servicos-publicos': {
    slug: 'servicos-publicos',
    name: 'Secretaria Municipal de Serviços Públicos',
    icon: Wrench,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    description: 'Limpeza, iluminação e manutenção de espaços públicos',
  },
  turismo: {
    slug: 'turismo',
    name: 'Secretaria Municipal de Turismo',
    icon: Landmark,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    description: 'Fomento ao turismo e desenvolvimento econômico',
  },
};

export function getDepartmentConfig(slug: string): DepartmentConfig | null {
  return departmentConfig[slug] || null;
}
