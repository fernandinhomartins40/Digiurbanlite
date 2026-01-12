'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { useSidebar } from '@/hooks/use-sidebar'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  BarChart3,
  AlertCircle,
  Building2,
  UserPlus,
  UserCheck,
  Heart,
  GraduationCap,
  HandHeart,
  Palette,
  Shield,
  MapPin,
  Sprout,
  Trophy,
  Camera,
  Home,
  TreePine,
  Truck,
  House,
  Calendar,
  Map,
  GitBranch,
  Crown,
  TrendingUp,
  Award,
  Mail,
  Send,
  Inbox,
  UserCircle,
  MailOpen,
  Trash2,
  ScrollText,
  X
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permissions?: string[]
  minRole?: 'GUEST' | 'USER' | 'COORDINATOR' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function AdminSidebar() {
  const { user, stats } = useAdminAuth()
  const { hasPermission, hasMinRole } = useAdminPermissions()
  const pathname = usePathname()
  const { isOpen, isMobile, close } = useSidebar()

  // Fechar sidebar ao mudar de rota em mobile (apenas quando já estiver aberta)
  useEffect(() => {
    console.log('[SIDEBAR DEBUG] useEffect disparado. isMobile:', isMobile, 'isOpen:', isOpen, 'pathname:', pathname)
    if (isMobile && isOpen) {
      console.log('[SIDEBAR DEBUG] Fechando sidebar devido a mudança de rota')
      close()
    }
  }, [pathname, isMobile, isOpen, close])

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
      title: 'Gestão',
      items: [
        {
          title: 'Catálogo de Serviços',
          href: '/admin/servicos',
          icon: Settings,
          permissions: ['services:create', 'services:update']
        },
        {
          title: 'Templates de Documentos',
          href: '/admin/templates-documentos',
          icon: ScrollText,
          minRole: 'ADMIN'
        },
        {
          title: 'Workflows',
          href: '/admin/workflows',
          icon: GitBranch,
          minRole: 'ADMIN'
        },
        {
          title: 'Estatísticas',
          href: '/admin/gerenciamento-servicos',
          icon: TrendingUp,
          permissions: ['services:read']
        },
        {
          title: 'Relatórios',
          href: '/admin/relatorios',
          icon: BarChart3,
          permissions: ['reports:department', 'reports:full']
        }
      ]
    },
    {
      title: 'Pessoas',
      items: [
        {
          title: 'Equipe',
          href: '/admin/equipe',
          icon: Users,
          permissions: ['team:read']
        },
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
        }
      ]
    },
    {
      title: 'Email',
      items: [
        {
          title: 'Dashboard',
          href: '/admin/email',
          icon: Mail,
          minRole: 'ADMIN'
        },
        {
          title: 'Caixa de Entrada',
          href: '/admin/email/inbox',
          icon: Inbox,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Escrever Email',
          href: '/admin/email/compose',
          icon: Send,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Enviados',
          href: '/admin/email/sent',
          icon: MailOpen,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Rascunhos',
          href: '/admin/email/drafts',
          icon: FileText,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Templates',
          href: '/admin/email/templates',
          icon: ScrollText,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Lixeira',
          href: '/admin/email/trash',
          icon: Trash2,
          minRole: 'COORDINATOR'
        },
        {
          title: 'Contas',
          href: '/admin/email-accounts',
          icon: UserCircle,
          minRole: 'ADMIN'
        },
        {
          title: 'Configurações',
          href: '/admin/email-service',
          icon: Settings,
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
      }
    ]
  }

  // Navegação específica para Super Admin
  const superAdminNavigation: NavSection = {
    title: 'Super Admin',
    items: [
      {
        title: 'Tenants',
        href: '/super-admin/tenants',
        icon: Building2,
        minRole: 'SUPER_ADMIN'
      },
      {
        title: 'Analytics Global',
        href: '/super-admin/analytics',
        icon: BarChart3,
        minRole: 'SUPER_ADMIN'
      },
      {
        title: 'Configurações Sistema',
        href: '/super-admin/settings',
        icon: Settings,
        minRole: 'SUPER_ADMIN'
      }
    ]
  }

  const shouldShowItem = (item: NavItem) => {
    // Verificar permissões específicas
    if (item.permissions && !item.permissions.some(hasPermission)) {
      return false
    }

    // Verificar nível mínimo
    if (item.minRole && !hasMinRole(item.minRole)) {
      return false
    }

    return true
  }

  const renderNavSection = (section: NavSection) => {
    const visibleItems = section.items.filter(shouldShowItem)

    if (visibleItems.length === 0) return null

    return (
      <div key={section.title} className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {section.title}
        </h3>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            // Para o link "Início" (/admin), só ativa se for exatamente essa rota
            // Para outros links, ativa se for a rota exata ou subrotas
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'flex-shrink-0 mr-3 h-5 w-5',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
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
    <>
      {/* Backdrop para mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out",
          // Aplicar apenas UMA classe translate por vez para evitar conflitos
          isMobile
            ? (isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")
            : "translate-x-0"
        )}
      >
        {/* Logo e botão fechar (mobile) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-primary" />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">DigiUrban</h1>
              <p className="text-xs text-gray-500">Portal Admin</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={close}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Navegação */}
        <div className="flex-1 overflow-y-auto py-6 px-3">
          {mainNavigation.map(renderNavSection)}
          {renderNavSection(secretariaNavigation)}
          {hasMinRole('SUPER_ADMIN') && renderNavSection(superAdminNavigation)}
        </div>

        {/* Informações do usuário na parte inferior */}
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <div className="font-medium">{user.name || user.email || 'Usuário'}</div>
            {user.departments && user.departments.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {user.departments.map((dept) => {
                  const isPrimary = user.primaryDepartment?.id === dept.id;
                  return (
                    <div key={dept.id} className={`truncate ${isPrimary ? 'font-semibold' : ''}`}>
                      {isPrimary && '★ '}{dept.name}
                    </div>
                  );
                })}
              </div>
            ) : user.department ? (
              <div className="truncate">{user.department.name}</div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}