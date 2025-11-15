'use client';

import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import {
  FileCheck,
  Bell,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  User,
  Shield,
  MessageSquare
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: number | string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

export default function MaisPage() {
  const router = useRouter();
  const { logout, citizen } = useCitizenAuth();

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair?')) {
      await logout();
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'documents',
      label: 'Meus Documentos',
      description: 'Gerenciar documentos digitalizados',
      icon: FileCheck,
      href: '/cidadao/documentos',
    },
    {
      id: 'notifications',
      label: 'Notificações',
      description: 'Central de notificações',
      icon: Bell,
      badge: 3,
      href: '/cidadao/notificacoes',
    },
    {
      id: 'settings',
      label: 'Configurações',
      description: 'Preferências e ajustes do app',
      icon: Settings,
      href: '/cidadao/configuracoes',
    },
    {
      id: 'help',
      label: 'Ajuda e Suporte',
      description: 'Dúvidas frequentes e tutoriais',
      icon: HelpCircle,
      href: '/cidadao/ajuda',
    },
    {
      id: 'feedback',
      label: 'Enviar Feedback',
      description: 'Ajude-nos a melhorar o app',
      icon: MessageSquare,
      href: '/cidadao/feedback',
    },
    {
      id: 'about',
      label: 'Sobre o App',
      description: 'Versão 1.0.0',
      icon: Info,
      href: '/cidadao/sobre',
    },
  ];

  const dangerItems: MenuItem[] = [
    {
      id: 'logout',
      label: 'Sair',
      description: 'Encerrar sessão',
      icon: LogOut,
      onClick: handleLogout,
      variant: 'danger',
    },
  ];

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
          <p className="text-gray-600 mt-1">Configurações e opções adicionais</p>
        </div>

        {/* User Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">
                  {citizen?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{citizen?.name}</p>
                <p className="text-sm text-gray-600 truncate">
                  CPF: {citizen?.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.$3-**')}
                </p>
              </div>
              <button
                onClick={() => router.push('/cidadao/perfil')}
                className="text-blue-600 hover:text-blue-700"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => item.onClick ? item.onClick() : item.href && router.push(item.href)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 p-2.5 rounded-lg flex-shrink-0">
                    <Icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{item.label}</p>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="border-t border-gray-200" />

        {/* Danger Items */}
        <div className="space-y-2">
          {dangerItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => item.onClick ? item.onClick() : item.href && router.push(item.href)}
                className="w-full bg-white border border-red-200 rounded-lg p-4 hover:bg-red-50 active:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-2.5 rounded-lg flex-shrink-0">
                    <Icon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-red-600">{item.label}</p>
                    <p className="text-sm text-red-500 truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-red-400 flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {/* App Info */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-700">Portal do Cidadão</p>
            </div>
            <p className="text-xs text-gray-500">Versão 1.0.0</p>
            <p className="text-xs text-gray-400 mt-1">
              © {new Date().getFullYear()} - Todos os direitos reservados
            </p>
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  );
}
