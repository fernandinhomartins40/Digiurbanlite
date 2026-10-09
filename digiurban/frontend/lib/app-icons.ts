/**
 * Ícone e cor de cada app (tela Apps e atalhos da barra inferior).
 * Chave = endereço do app (o mesmo do catálogo do backend e de EXTRA_APP_SCREENS).
 * App novo sem entrada aqui aparece com o ícone genérico.
 */

import type { LucideIcon } from 'lucide-react'
import {
  Ambulance,
  Briefcase,
  Building2,
  Bus,
  CalendarClock,
  CarFront,
  ClipboardList,
  Cross,
  Dumbbell,
  GraduationCap,
  HardHat,
  HeartHandshake,
  Home,
  IdCard,
  LayoutGrid,
  MapPinned,
  Palette,
  Pill,
  School,
  ScanFace,
  Shield,
  ShieldAlert,
  Sprout,
  Stethoscope,
  Store,
  Trees,
  Users,
  Wrench,
} from 'lucide-react'

export interface AppVisual {
  icon: LucideIcon
  /** cor de fundo do ícone (hex) */
  color: string
}

// Paleta no tom do Dock (mesmas cores das seções do menu + algumas a mais)
const C = {
  blue: '#0A7CFF',
  green: '#2FB84F',
  teal: '#14B8A6',
  amber: '#FF9F0A',
  orange: '#FF8A1F',
  red: '#FF3B30',
  rose: '#FF375F',
  violet: '#AF52DE',
  indigo: '#5856D6',
  cyan: '#32ADE6',
  brown: '#A2845E',
  slate: '#636366',
}

export const APP_VISUALS: Record<string, AppVisual> = {
  // Saúde
  '/admin/apps/saude/tfd': { icon: Ambulance, color: C.red },
  '/admin/apps/saude/atendimento': { icon: Stethoscope, color: C.rose },
  '/admin/apps/saude/farmacia': { icon: Pill, color: C.teal },
  '/admin/apps/saude/cadastros': { icon: ClipboardList, color: C.slate },
  // Educação
  '/admin/apps/educacao': { icon: School, color: C.blue },
  '/admin/apps/educacao/transporte': { icon: Bus, color: C.amber },
  '/admin/apps/seguranca-escolar': { icon: ScanFace, color: C.indigo },
  // Assistência social
  '/admin/apps/assistencia-social': { icon: HeartHandshake, color: C.rose },
  '/admin/apps/assistencia-social/familias': { icon: Users, color: C.violet },
  '/admin/apps/assistencia-social/beneficios': { icon: HeartHandshake, color: C.orange },
  '/admin/apps/assistencia-social/unidades': { icon: Building2, color: C.indigo },
  // Cidade
  '/admin/apps/servicos-publicos': { icon: Wrench, color: C.orange },
  '/admin/apps/licenciamento': { icon: HardHat, color: C.amber },
  '/admin/apps/meio-ambiente': { icon: Trees, color: C.green },
  '/admin/apps/habitacao': { icon: Home, color: C.cyan },
  '/admin/apps/defesa-civil': { icon: ShieldAlert, color: C.red },
  '/admin/apps/transportes-transito': { icon: CarFront, color: C.indigo },
  '/admin/apps/mobilidade-urbana': { icon: IdCard, color: C.cyan },
  '/admin/apps/seguranca-publica': { icon: Shield, color: C.slate },
  '/admin/apps/cemiterios': { icon: Cross, color: C.brown },
  // Pessoas e economia
  '/admin/apps/politicas-mulheres': { icon: HeartHandshake, color: C.violet },
  '/admin/apps/esportes': { icon: Dumbbell, color: C.green },
  '/admin/apps/cultura': { icon: Palette, color: C.violet },
  '/admin/apps/agricultura': { icon: Sprout, color: C.green },
  '/admin/apps/desenvolvimento-economico': { icon: Briefcase, color: C.blue },
  '/admin/apps/turismo': { icon: MapPinned, color: C.teal },
  '/admin/apps/agenda-atendimentos': { icon: CalendarClock, color: C.indigo },
  '/admin/apps/cursos': { icon: GraduationCap, color: C.blue },
  '/admin/apps/feiras-mercados': { icon: Store, color: C.orange },
}

const FALLBACK: AppVisual = { icon: LayoutGrid, color: C.slate }

export function appVisual(route: string): AppVisual {
  return APP_VISUALS[route] || FALLBACK
}
