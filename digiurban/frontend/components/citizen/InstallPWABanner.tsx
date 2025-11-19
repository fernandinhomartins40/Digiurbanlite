'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Detectar se já está instalado (modo standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Se já estiver instalado, não mostrar banner
    if (standalone) {
      return;
    }

    // Verificar se o banner foi dispensado recentemente (últimas 7 dias)
    const dismissedAt = localStorage.getItem('pwa_banner_dismissed_at');
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Android: Capturar evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS: Mostrar banner se não estiver instalado
    if (iOS && !standalone) {
      // Dar um delay de 3 segundos para não ser intrusivo
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar prompt de instalação
    deferredPrompt.prompt();

    // Aguardar escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA instalado com sucesso');
      setShowBanner(false);
    }

    // Limpar o prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed_at', new Date().toISOString());
  };

  // Não mostrar se estiver em standalone ou se foi dispensado
  if (!showBanner || isStandalone) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-50 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-xl animate-fade-in">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Instalar App</h3>
              <p className="text-xs text-gray-600">Acesso rápido pelo celular</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Dispensar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          // Instruções para iOS
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Para instalar o app no seu iPhone ou iPad:
            </p>
            <ol className="text-xs text-gray-600 space-y-2 pl-4 list-decimal">
              <li className="flex items-start gap-2">
                <span className="flex-1">
                  Toque no botão <Share className="inline w-3 h-3 mx-1" /> <strong>Compartilhar</strong> (na barra inferior do Safari)
                </span>
              </li>
              <li>
                Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
              </li>
              <li>
                Toque em <strong>"Adicionar"</strong> no canto superior direito
              </li>
            </ol>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Download className="w-3 h-3" />
                Após instalado, o app aparecerá na sua tela inicial
              </p>
            </div>
          </div>
        ) : (
          // Botão de instalação para Android/Desktop
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Instale o app e tenha acesso rápido aos serviços municipais direto da tela inicial do seu celular.
            </p>
            <Button
              onClick={handleInstallClick}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar App
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Funciona offline • Sem ocupar espaço • Grátis
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
