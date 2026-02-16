'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// Importar os mesmos ícones que AdminSidebar usa
import {
  House,
  LayoutDashboard,
  FileText,
  Crown,
  AlertCircle,
  Calendar,
  Map,
  Users,
  Users as UsersGroup,
  Settings,
  Mail,
  Sprout,
  HandHeart,
  Palette,
  GraduationCap,
  Trophy,
  Home,
  TreePine,
  Truck,
  MapPin,
  Shield,
  Heart,
  Camera,
  Building2 as Building,
  BarChart3,
  UserPlus,
  UserCheck,
  GitBranch,
  TrendingUp,
  UserCircle,
  ScrollText,
  Network,
  Bot,
  FileSignature,
  Award,
  MessageCircle,
  Cpu,
  DollarSign,
  ShieldAlert,
  Car,
  Bus,
  FolderTree,
  Briefcase,
  UserCog,
  Link2
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  permissions?: string[]
  minRole?: 'GUEST' | 'USER' | 'COORDINATOR' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname()
  const { user, stats } = useAdminAuth()
  const { hasPermission, hasMinRole } = useAdminPermissions()

  if (!user) return null

  const mainNavigation: NavSection[] = [
    {
      title: 'Principal',
      items: [
        {
          title: 'Início',
          href: '/admin',
          icon: House
        },
        {
          title: 'Dashboard',
          href: '/admin/dashboard',
          icon: LayoutDashboard
        },
        {
          title: 'Protocolos',
          href: '/admin/protocolos',
          icon: FileText,
          permissions: ['protocols:read'],
          badge: stats?.pendingProtocols?.toString()
        }
      ]
    },
    {
      title: 'Gabinete do Prefeito',
      items: [
        {
          title: 'Painel do Prefeito',
          href: '/admin/gabinete/painel-prefeito',
          icon: Crown,
          minRole: 'ADMIN',
          badge: 'NOVO'
        },
        {
          title: 'Criar Chamado',
          href: '/admin/chamados',
          icon: AlertCircle,
          minRole: 'ADMIN'
        },
        {
          title: 'Agenda Executiva',
          href: '/admin/gabinete/agenda',
          icon: Calendar,
          minRole: 'ADMIN'
        },
        {
          title: 'Mapa de Demandas',
          href: '/admin/gabinete/mapa-demandas',
          icon: Map,
          minRole: 'ADMIN'
        }
      ]
    },
    {
      title: 'Serviços',
      items: [
        {
          title: 'Catálogo de Serviços',
          href: '/admin/servicos',
          icon: Settings,
          permissions: ['services:create', 'services:update']
        },
        {
          title: 'Estatísticas',
          href: '/admin/gerenciamento-servicos',
          icon: TrendingUp,
          permissions: ['services:read']
        }
      ]
    },
    {
      title: 'Gestão de Processos',
      items: [
        {
          title: 'Workflows',
          href: '/admin/workflows',
          icon: GitBranch,
          minRole: 'ADMIN'
        },
        {
          title: 'Fluxos do Bot',
          href: '/admin/bot-flows',
          icon: Bot,
          minRole: 'ADMIN',
          badge: 'NOVO'
        },
        {
          title: 'Templates de Documentos',
          href: '/admin/templates-documentos',
          icon: ScrollText,
          minRole: 'ADMIN'
        }
      ]
    },
    {
      title: 'Documentos & Assinaturas',
      items: [
        {
          title: 'Meus Documentos',
          href: '/admin/meus-documentos',
          icon: FileText,
          minRole: 'USER'
        },
        {
          title: 'Assinaturas Digitais',
          href: '/admin/assinaturas-digitais',
          icon: FileSignature,
          minRole: 'COORDINATOR',
          badge: 'NOVO'
        },
        {
          title: 'Certificados Digitais',
          href: '/admin/certificados-digitais',
          icon: Award,
          minRole: 'ADMIN'
        }
      ]
    },
    {
      title: 'Pessoas',
      items: [
        {
          title: 'Cidadãos',
          href: '/admin/cidadaos',
          icon: UserPlus,
          permissions: ['citizens:read']
        },
        {
          title: 'Cidadãos Pendentes',
          href: '/admin/cidadaos/pendentes',
          icon: UserCheck,
          permissions: ['citizens:verify'],
          badge: stats?.pendingCitizens?.toString()
        },
        {
          title: 'Composição Familiar',
          href: '/admin/composicao-familiar',
          icon: UsersGroup,
          permissions: ['citizens:read']
        },
        {
          title: 'Equipe',
          href: '/admin/servidores/equipe',
          icon: Users,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Organograma',
          href: '/admin/organograma',
          icon: Network,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Unidades Org.',
          href: '/admin/organograma/unidades',
          icon: FolderTree,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Cargos',
          href: '/admin/organograma/cargos',
          icon: Briefcase,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Lotações',
          href: '/admin/organograma/lotacoes',
          icon: UserCog,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Equipes/Grupos',
          href: '/admin/organograma/equipes',
          icon: UsersGroup,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Hierarquias',
          href: '/admin/organograma/hierarquias',
          icon: GitBranch,
          minRole: 'ADMIN'
        },
        {
          title: 'Mapeamento',
          href: '/admin/organograma/mapeamento',
          icon: Link2,
          minRole: 'ADMIN',
          badge: 'NOVO'
        }
      ]
    },
    {
      title: 'Comunicação',
      items: [
        {
          title: 'Mensagens',
          href: '/admin/mensagens',
          icon: MessageCircle,
          permissions: ['messages:read'],
          badge: stats?.unreadMessages?.toString()
        },
        {
          title: 'Email',
          href: '/admin/email',
          icon: Mail,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Contas de Email',
          href: '/admin/email-accounts',
          icon: UserCircle,
          minRole: 'ADMIN'
        }
      ]
    },
    {
      title: 'Análise & Relatórios',
      items: [
        {
          title: 'Analytics',
          href: '/admin/analytics',
          icon: BarChart3,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Relatórios',
          href: '/admin/relatorios',
          icon: FileText,
          permissions: ['reports:department', 'reports:full']
        }
      ]
    },
    {
      title: 'Configurações',
      items: [
        {
          title: 'Perfil',
          href: '/admin/perfil',
          icon: UserCircle,
          minRole: 'USER'
        },
        {
          title: 'Configurações',
          href: '/admin/configuracoes',
          icon: Settings,
          minRole: 'ADMIN'
        },
        {
          title: 'Integrações',
          href: '/admin/integracoes',
          icon: Cpu,
          minRole: 'ADMIN'
        }
      ]
    }
  ]

  const secretariaNavigation: NavSection = {
    title: 'Secretarias',
    items: [
      {
        title: 'Agricultura',
        href: '/admin/secretarias/agricultura',
        icon: Sprout,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Assistência Social',
        href: '/admin/secretarias/assistencia-social',
        icon: HandHeart,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Cultura',
        href: '/admin/secretarias/cultura',
        icon: Palette,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Educação',
        href: '/admin/secretarias/educacao',
        icon: GraduationCap,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Esportes',
        href: '/admin/secretarias/esportes',
        icon: Trophy,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Habitação',
        href: '/admin/secretarias/habitacao',
        icon: Home,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Meio Ambiente',
        href: '/admin/secretarias/meio-ambiente',
        icon: TreePine,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Obras Públicas',
        href: '/admin/secretarias/obras-publicas',
        icon: Truck,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Planejamento Urbano',
        href: '/admin/secretarias/planejamento-urbano',
        icon: MapPin,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Saúde',
        href: '/admin/secretarias/saude',
        icon: Heart,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Segurança Pública',
        href: '/admin/secretarias/seguranca-publica',
        icon: Shield,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Serviços Públicos',
        href: '/admin/secretarias/servicos-publicos',
        icon: Settings,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Turismo',
        href: '/admin/secretarias/turismo',
        icon: Camera,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Administração',
        href: '/admin/secretarias/administracao',
        icon: Building,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Defesa Civil',
        href: '/admin/secretarias/defesa-civil',
        icon: ShieldAlert,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Desenvolvimento Econômico',
        href: '/admin/secretarias/desenvolvimento-economico',
        icon: TrendingUp,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Finanças',
        href: '/admin/secretarias/financas',
        icon: DollarSign,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Mobilidade Urbana',
        href: '/admin/secretarias/mobilidade-urbana',
        icon: Bus,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Políticas para Mulheres',
        href: '/admin/secretarias/politicas-mulheres',
        icon: Users,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Tecnologia e Inovação',
        href: '/admin/secretarias/tecnologia-inovacao',
        icon: Cpu,
        minRole: 'COORDINATOR'
      },
      {
        title: 'Transportes e Trânsito',
        href: '/admin/secretarias/transportes-transito',
        icon: Car,
        minRole: 'COORDINATOR'
      }
    ]
  }

  const superAdminNavigation: NavSection = {
    title: 'Super Admin',
    items: [
      { title: 'Tenants', href: '/super-admin/tenants', icon: Building, minRole: 'SUPER_ADMIN' },
      { title: 'Analytics Global', href: '/super-admin/analytics', icon: BarChart3, minRole: 'SUPER_ADMIN' },
      { title: 'Configurações Sistema', href: '/super-admin/settings', icon: Settings, minRole: 'SUPER_ADMIN' }
    ]
  }

  const shouldShowItem = (item: NavItem) => {
    if (item.permissions && !item.permissions.some(hasPermission)) return false
    if (item.minRole && !hasMinRole(item.minRole)) return false
    return true
  }

  const renderNavSection = (section: NavSection) => {
    const visibleItems = section.items.filter(shouldShowItem)
    if (visibleItems.length === 0) return null

    return (
      <div key={section.title} className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
          {section.title}
        </h3>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            // Para o link "Início" (/admin), só ativa se for exatamente essa rota
            // Para outros links, ativa se for a rota exata ou subrotas
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className={cn(
                    'ml-2 inline-block py-0.5 px-2 text-xs font-semibold rounded-full',
                    isActive
                      ? 'bg-primary-foreground text-primary'
                      : item.badge === 'NOVO'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white animate-pulse'
                      : 'bg-red-100 text-red-800'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <SheetTitle className="text-lg font-semibold text-gray-900">DigiUrban</SheetTitle>
                <p className="text-xs text-gray-500">Portal Admin</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation - área com scroll */}
        <div className="flex-1 overflow-y-auto py-6 px-3">
          {mainNavigation.map(renderNavSection)}
          {renderNavSection(secretariaNavigation)}
          {hasMinRole('SUPER_ADMIN') && renderNavSection(superAdminNavigation)}
        </div>

        {/* User Info */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <div className="font-medium">{user.name || user.email || 'Usuário'}</div>
            {user.departments && user.departments.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {user.departments.map((dept) => {
                  const isPrimary = user.primaryDepartment?.id === dept.id
                  return (
                    <div key={dept.id} className={`truncate ${isPrimary ? 'font-semibold' : ''}`}>
                      {isPrimary && '★ '}{dept.name}
                    </div>
                  )
                })}
              </div>
            ) : user.department ? (
              <div className="truncate">{user.department.name}</div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
