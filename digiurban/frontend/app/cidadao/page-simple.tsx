'use client';

import { useState } from 'react';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  User,
  FileText,
  Folder,
  FileCheck,
  LogOut,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BottomNavigation } from '@/components/citizen/mobile/BottomNavigation';
import { MessagesInterface } from '@/src/components/Messages/MessagesInterface';
import { getInitials } from '@/src/utils/conversationHelpers';

export default function CitizenDashboard() {
  const { citizen, isLoading: authLoading, logout } = useCitizenAuth();
  const router = useRouter();

  const [showSidebar, setShowSidebar] = useState(false);

  // Itens do menu lateral
  const menuItems = [
    { name: 'Chat', href: '/cidadao', icon: MessageCircle },
    { name: 'Serviços', href: '/cidadao/servicos', icon: FileText },
    { name: 'Protocolos', href: '/cidadao/protocolos', icon: Folder },
    { name: 'Documentos', href: '/cidadao/documentos', icon: FileCheck },
    { name: 'Perfil', href: '/cidadao/perfil', icon: User },
    { name: 'Configurações', href: '/cidadao/mais', icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!citizen) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Overlay mobile */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-72 bg-white border-r z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header do sidebar */}
          <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">DigiUrban</h2>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-white hover:bg-white/20"
                onClick={() => setShowSidebar(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-white text-blue-600 font-semibold">
                  {getInitials(citizen.name || 'Cidadão')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-white text-sm">
                  {citizen.name || 'Cidadão'}
                </p>
                <p className="text-xs text-white/80">🟢 Online</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      item.href === '/cidadao'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    onClick={() => setShowSidebar(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header mobile */}
        <div className="md:hidden p-4 bg-white border-b flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-gray-900">Chat</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Componente de mensagens unificado */}
        <MessagesInterface
          userId={citizen.id}
          userType="CITIZEN"
          mode="citizen"
        />

        {/* Bottom navigation (mobile) */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
}
