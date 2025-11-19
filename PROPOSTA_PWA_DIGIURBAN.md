# 📱 Proposta PWA - DigiUrban Portal do Cidadão

## 📊 Análise de Viabilidade

### 1. Estado Atual do Sistema

#### Tecnologia Base
- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **Estado**: React Context API + TanStack Query

#### Estrutura do Painel do Cidadão
```
/cidadao
├── /login (página pública)
├── /page.tsx (dashboard)
├── /servicos (catálogo de serviços)
├── /protocolos (acompanhamento)
├── /documentos (gestão de documentos)
├── /perfil (dados pessoais)
└── /mais (menu adicional)
```

#### Interface Mobile Atual
✅ **Já possui otimizações mobile:**
- Bottom Navigation com FAB (Floating Action Button)
- Mobile Top Bar responsiva
- Layout adaptativo (lg breakpoint)
- Touch-friendly components
- Safe area insets (iOS)

### 2. Requisitos PWA - Compatibilidade iOS (2025)

#### ✅ Requisitos Técnicos Essenciais

**a) Servidor HTTPS**
- ✅ **Pronto**: Sistema já roda em HTTPS (necessário para produção)

**b) Web App Manifest**
- ❌ **Pendente**: Arquivo `manifest.json` não encontrado
- **Necessário criar** com:
  - `name`, `short_name`
  - `icons` (192px, 512px, apple-touch-icon)
  - `display: "standalone"`
  - `start_url`
  - `scope`
  - `theme_color`, `background_color`

**c) Service Worker**
- ❌ **Pendente**: Service Worker não implementado
- **Necessário** para:
  - Cache de assets
  - Funcionalidade offline básica
  - Estratégias de cache (Network First, Cache First)

**d) Meta Tags iOS**
- ❌ **Pendente**: Meta tags específicas iOS
- **Necessário**:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="DigiUrban">
  <link rel="apple-touch-icon" href="/icons/icon-180x180.png">
  ```

### 3. Limitações iOS a Considerar

#### ⚠️ Restrições Conhecidas (iOS 2025)

1. **Instalação Manual**
   - iOS não mostra prompt automático
   - Usuário precisa usar "Compartilhar > Adicionar à Tela Inicial"
   - **Solução**: Banner educativo no app

2. **Storage Limitado**
   - Máximo 50MB para cache
   - Dados podem ser limpos após 7 dias sem uso
   - **Impacto**: Cache conservador, apenas assets essenciais

3. **Push Notifications**
   - Suporte limitado (requer iOS 16.4+)
   - Precisa permissão do usuário
   - Não funciona em background total
   - **Recomendação**: Implementar em fase 2

4. **Service Worker Limitado**
   - Sem background sync verdadeiro
   - Sem background fetch
   - **Impacto**: Funcionalidade offline limitada

5. **Scope Obrigatório**
   - Navegação fora do scope abre Safari
   - **Solução**: Definir scope correto no manifest

### 4. Compatibilidade Android

#### ✅ Suporte Completo (Chrome 100+)

1. **Instalação**
   - Prompt automático "Adicionar à tela inicial"
   - Também pode ser manual

2. **Service Worker**
   - Suporte completo
   - Background sync
   - Push notifications nativas

3. **Storage**
   - Limites maiores (>50MB)
   - Persistência garantida se app for usado

## 🎯 Proposta de Implementação

### Fase 1: PWA Básico (2-3 dias) ⭐ RECOMENDADO

#### 1.1. Configuração do Manifest
```json
{
  "name": "DigiUrban - Portal do Cidadão",
  "short_name": "DigiUrban",
  "description": "Acesse serviços municipais pelo celular",
  "start_url": "/cidadao",
  "scope": "/cidadao",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0f6fbe",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### 1.2. Service Worker (Estratégia Cache-First para Assets)
```javascript
// service-worker.js
const CACHE_NAME = 'digiurban-v1';
const ASSETS_TO_CACHE = [
  '/cidadao',
  '/cidadao/servicos',
  '/cidadao/protocolos',
  '/offline.html',
  // Icons, CSS, JS críticos
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Fetch - Network First para API, Cache First para assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network First para API
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/offline.html'))
    );
  } else {
    // Cache First para assets
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

#### 1.3. Meta Tags no Layout
```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: 'DigiUrban - Portal do Cidadão',
  description: 'Acesse serviços municipais',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DigiUrban',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png' },
      { url: '/icons/icon-512x512.png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/icon-180x180.png', sizes: '180x180' },
    ],
  },
  themeColor: '#0f6fbe',
};
```

#### 1.4. Banner de Instalação PWA

**Componente: `InstallPWABanner.tsx`**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Detectar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Android: Capturar evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS: Mostrar banner se não estiver instalado
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem('pwa_banner_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!showBanner || isStandalone) return null;

  return (
    <Card className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-xl">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Instalar App</h3>
              <p className="text-xs text-gray-600">Acesso rápido pelo celular</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          // Instruções iOS
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Para instalar o app no iPhone:
            </p>
            <ol className="text-xs text-gray-600 space-y-1 pl-4 list-decimal">
              <li>Toque no botão <Share className="inline w-3 h-3" /> <strong>Compartilhar</strong></li>
              <li>Role e toque em <strong>"Adicionar à Tela de Início"</strong></li>
              <li>Toque em <strong>"Adicionar"</strong></li>
            </ol>
          </div>
        ) : (
          // Botão Android
          <Button
            onClick={handleInstallClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Instalar App
          </Button>
        )}
      </div>
    </Card>
  );
}
```

**Onde adicionar:**
1. **Página de Login** (`/cidadao/login`)
2. **Dashboard** (`/cidadao`)

#### 1.5. Pacote next-pwa (Alternativa Automatizada)

**Opção Recomendada**: Usar pacote `@ducanh2912/next-pwa` (fork atualizado)

```bash
npm install @ducanh2912/next-pwa
```

```javascript
// next.config.js
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\/api\/.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutos
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
          },
        },
      },
    ],
  },
});

module.exports = withPWA({
  // ... configuração existente
});
```

### Fase 2: Recursos Avançados (Futuro)

1. **Push Notifications**
   - Web Push API
   - Notificações de atualizações de protocolo
   - Alertas do município

2. **Sincronização em Background**
   - Background Sync API (Android)
   - Fila de ações offline

3. **Share API**
   - Compartilhar protocolos
   - Compartilhar documentos

4. **Página Offline Customizada**
   - Dashboard offline com cache
   - Mensagens pendentes
   - Dados sincronizados

## 📋 Checklist de Implementação

### ✅ Pré-requisitos
- [x] Next.js 14 instalado
- [x] Interface mobile responsiva
- [x] HTTPS em produção
- [ ] Criar ícones PWA (todos os tamanhos)
- [ ] Criar apple-touch-icon

### 🔧 Implementação Básica
- [ ] Instalar `@ducanh2912/next-pwa`
- [ ] Configurar `next.config.js`
- [ ] Criar `manifest.json`
- [ ] Adicionar meta tags no `layout.tsx`
- [ ] Criar ícones em `/public/icons/`
- [ ] Criar componente `InstallPWABanner`
- [ ] Adicionar banner na página de login
- [ ] Adicionar banner no dashboard
- [ ] Testar instalação iOS
- [ ] Testar instalação Android

### 🧪 Testes
- [ ] Lighthouse PWA Score (target: 90+)
- [ ] Teste em iPhone (Safari)
- [ ] Teste em Android (Chrome)
- [ ] Funcionalidade offline básica
- [ ] Performance de cache
- [ ] Navegação standalone

### 📱 Ícones Necessários

**Tamanhos a criar:**
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 180x180 (Apple)
- 192x192 (Android)
- 384x384
- 512x512 (Android)

**Formato:**
- PNG com fundo sólido (tema do app)
- Versão maskable (ícone centralizado com padding)

## 🎨 Design do Ícone PWA

**Sugestão:**
- Fundo: Gradiente azul (#0f6fbe → #193642)
- Símbolo: Letra "D" estilizada + ícone de cidade
- Cores: Branco + Verde accent (#0fffbf)

## 📊 Estimativa de Esforço

| Fase | Tarefa | Tempo | Prioridade |
|------|--------|-------|------------|
| 1 | Criar ícones PWA | 2h | Alta |
| 1 | Configurar next-pwa | 1h | Alta |
| 1 | Manifest + Meta tags | 1h | Alta |
| 1 | Banner de instalação | 3h | Alta |
| 1 | Testes iOS/Android | 2h | Alta |
| 2 | Push Notifications | 8h | Média |
| 2 | Offline avançado | 6h | Baixa |

**Total Fase 1**: ~9 horas (2 dias úteis)

## ✅ Viabilidade Final

### 🟢 VIÁVEL - Altamente Recomendado

**Justificativas:**
1. ✅ Base técnica sólida (Next.js 14)
2. ✅ Interface mobile já otimizada
3. ✅ Implementação rápida (2-3 dias)
4. ✅ Compatibilidade iOS/Android confirmada
5. ✅ Baixo custo de manutenção
6. ✅ Melhora experiência do usuário
7. ✅ Aumenta engajamento (+40% em média)
8. ✅ Reduz dependência de lojas de apps

**Benefícios:**
- 📱 App nativo sem custos de desenvolvimento iOS/Android
- 🚀 Instalação instantânea
- 💾 Funciona parcialmente offline
- 🔔 Notificações (fase 2)
- 📈 Analytics de instalação
- 🎯 Ícone na tela inicial do usuário

**Riscos Baixos:**
- ⚠️ iOS requer instalação manual (mitigado com banner educativo)
- ⚠️ Cache limitado 50MB iOS (suficiente para assets essenciais)
- ⚠️ Dados podem ser limpos (usuário pode reinstalar facilmente)

## 🚀 Próximos Passos Recomendados

1. ✅ **Aprovar proposta**
2. 🎨 **Criar ícones PWA** (usar ferramenta pwa-asset-generator)
3. ⚙️ **Implementar Fase 1** (seguir checklist)
4. 🧪 **Testar em devices reais**
5. 📊 **Monitorar métricas de instalação**
6. 🔔 **Planejar Fase 2** (push notifications)

---

**Conclusão**: A implementação de PWA no DigiUrban é **altamente viável** e **recomendada**. O sistema já possui uma base sólida mobile-first, e a adição de PWA trará benefícios significativos com investimento mínimo de tempo e recursos.