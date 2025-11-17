# 📱 Guia Visual - Layout Mobile do Portal do Cidadão

## 🎨 Antes vs Depois

### **ANTES (Layout Desktop em Mobile)**
```
┌─────────────────────────────────┐
│ ☰  Logo  Município        🔔👤│  ← Header grande
├─────────────────────────────────┤
│                                 │
│  [Sidebar mobile overlay]       │  ← Menu hambúrguer
│                                 │
│  Conteúdo comprimido            │  ← Difícil de usar
│  Grid de cards pequenos         │
│                                 │
└─────────────────────────────────┘
```

### **DEPOIS (Layout de App)**
```
┌─────────────────────────────────┐
│ 🏛️ Portal • Município      🔔  │  ← Barra compacta
├─────────────────────────────────┤
│                                 │
│  Conteúdo otimizado             │  ← Fácil de usar
│  Cards grandes e tocáveis       │  ← Mobile-friendly
│  Sem sidebar                    │
│                                 │
│                                 │
├─────────────────────────────────┤
│  🏠  📄   📋   👤   ☰          │  ← Navegação fixa
│       ↑ FAB DESTACADO           │
└─────────────────────────────────┘
```

---

## 🎯 Bottom Navigation - Detalhamento

### **Layout Completo**

```
┌───────────────────────────────────────────┐
│                                           │
│            CONTEÚDO DA PÁGINA             │
│                                           │
├───────────────────────────────────────────┤
│                   ╱────╲                  │
│  🏠      📄      │ 📋  │     👤      ☰   │
│ Início  Prot.   │SERV │   Perfil  Mais  │
│                  ╲────╱                  │
│                                           │
│  72px altura + safe-area-inset-bottom     │
└───────────────────────────────────────────┘
```

### **Especificações**

| Elemento | Tamanho | Cor | Comportamento |
|----------|---------|-----|---------------|
| **Bottom Bar** | 72px altura | Branco | Fixa no bottom |
| **Botões normais** | 48x48px | Cinza/Azul | Scale 0.95 ao tocar |
| **FAB Central** | 64x64px | Gradiente azul | Elevado -24px, scale 1.05 quando ativo |
| **Ícones normais** | 24x24px | Cinza-500/Blue-600 | Transição de cor |
| **Ícone FAB** | 28x28px | Branco | Drop shadow |
| **Labels** | 11px | Cinza-500/Blue-600 | Font-weight 500/600 |

---

## 🌈 Paleta de Cores Mobile

### **FAB (Floating Action Button)**
```css
/* Normal */
background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)
border: 4px solid #ffffff
shadow: 0 8px 16px rgba(37, 99, 235, 0.3)

/* Ativo/Selecionado */
background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)
shadow: 0 12px 24px rgba(37, 99, 235, 0.4)
scale: 1.05
```

### **Dashboard Header Mobile**
```css
background: linear-gradient(135deg, #2563eb, #1d4ed8)
color: #ffffff
shadow: 0 4px 12px rgba(37, 99, 235, 0.2)
```

### **Card "Nova Solicitação"**
```css
background: linear-gradient(135deg, #2563eb, #1d4ed8)
button-bg: #ffffff
button-color: #2563eb
shadow: 0 8px 16px rgba(37, 99, 235, 0.15)
```

---

## 📐 Anatomia do FAB

### **Camadas (de baixo para cima)**

```
5. Glow (pulse)
   ├─ 72x72px
   ├─ radial-gradient
   └─ animate-pulse-glow

4. Shadow principal
   ├─ 0 8px 16px rgba(blue, 0.3)
   └─ Multi-layer

3. Border branca
   ├─ 4px solid white
   └─ Contraste com fundo

2. Gradiente azul
   ├─ linear-gradient 135deg
   └─ from-blue-600 to-blue-700

1. Ícone branco
   ├─ FileText 28x28px
   └─ drop-shadow
```

### **Estados do FAB**

| Estado | Transform | Shadow | Background |
|--------|-----------|--------|------------|
| **Normal** | `translateY(-24px)` | 8px blur | Blue-600→700 |
| **Hover** | `translateY(-24px)` | 8px blur | Blue-600→700 |
| **Active** | `translateY(-20px) scale(0.95)` | 4px blur | Blue-700→800 |
| **Selected** | `translateY(-28px) scale(1.05)` | 12px blur | Blue-700→800 |

---

## 🎬 Animações

### **Entrada da Página**
```css
.page-enter {
  animation: fade-in 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### **FAB Glow**
```css
.fab-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.1);
  }
}
```

### **Botão Pressionado**
```css
.nav-button:active {
  transform: scale(0.95);
  transition: transform 0.1s ease;
}
```

---

## 📱 Páginas do App

### **1. Dashboard (Início)**

**Mobile:**
```
┌─────────────────────────────────┐
│ 🌅 Bom dia, João          🔔   │  ← Gradiente azul
│ Portal do Cidadão         👤   │
├─────────────────────────────────┤
│ 📊 [3] [5] [0]                 │  ← Stats compactos
│    Ativos Concl Notif          │
├─────────────────────────────────┤
│ 🎯 Acesso Rápido               │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ 📋 Solicitar Serviço    ┃  │  ← DESTACADO
│ ┃ Acesse o catálogo   ➜   ┃  │  (gradiente azul)
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                 │
│ ┌─────────────────────────────┐│
│ │ 🔍 Ver Protocolos       ➜  ││
│ └─────────────────────────────┘│
│                                 │
│ ⭐ Serviços Mais Usados         │
│ ← [Card1] [Card2] [Card3] →    │  ← Scroll horizontal
└─────────────────────────────────┘
```

**Desktop:** Layout preservado (sem mudanças)

---

### **2. Serviços (FAB Central)**

**Mobile:**
```
┌─────────────────────────────────┐
│ 📋 Catálogo de Serviços    🔍  │
├─────────────────────────────────┤
│ 🔍 [Buscar serviços...]        │  ← Busca sempre visível
├─────────────────────────────────┤
│ 🏷️ [Todos][Saúde][Educação]... │  ← Filtros rápidos
├─────────────────────────────────┤
│                                 │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ 📄 Alvará de Construção ┃  │  ← Card grande
│ ┃ 🏛️ Obras Públicas        ┃  │  (fácil de tocar)
│ ┃ ⏱ 15 dias • 📋 3 docs   ┃  │
│ ┃                          ┃  │
│ ┃  [Solicitar Agora] ➜    ┃  │  ← CTA claro
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                 │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ ...                     ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└─────────────────────────────────┘
```

---

### **3. Protocolos**

**Mobile:**
```
┌─────────────────────────────────┐
│ 📄 Meus Protocolos         🔍  │
├─────────────────────────────────┤
│ 📊 [3] [5] [1] [0]              │  ← Stats inline
│    Total Concl And Canc         │
├─────────────────────────────────┤
│ 🏷️ [Todos][Ativos][Concluídos]  │  ← Chips
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐│
│ │🟡 PROT-2024-001            ││  ← Bolinha colorida
│ │   Alvará de Construção     ││  de status
│ │   📅 15/01 • ⏱ Em Andamento││
│ │   Obras Públicas     [Ver] ││  ← Botão compacto
│ └─────────────────────────────┘│
│                                 │
│ ┌─────────────────────────────┐│
│ │🟢 PROT-2024-002            ││
│ │   ...                      ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

### **4. Perfil**

**Mobile:**
```
┌─────────────────────────────────┐
│ 👤 Meu Perfil              ⚙️  │
├─────────────────────────────────┤
│         ┌─────────┐             │
│         │   👤    │             │  ← Avatar grande
│         │  J.S.   │             │
│         └─────────┘             │
│                                 │
│        João Silva               │
│     CPF: ***.456.789-**        │
│    🏅 Verificado - Prata       │
├─────────────────────────────────┤
│                                 │
│ ┌─ 👤 Dados Pessoais ──────[✏️]┐│  ← Sections
│ │ Nome: João Silva            ││  colapsáveis
│ │ Email: joao@email.com       ││
│ │ ▼ Ver mais...               ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─ 📄 Meus Documentos ──────[+]┐│
│ │ ✅ RG Frente                ││
│ │ ✅ RG Verso                 ││
│ │ ▼ Ver todos...              ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

### **5. Mais (Menu)**

**Mobile:**
```
┌─────────────────────────────────┐
│ ☰ Menu                          │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐│
│ │ 👤 João Silva              ││  ← User card
│ │ CPF: ***.456.789-**     ➜  ││  destacado
│ └─────────────────────────────┘│
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐│
│ │ 📄 Meus Documentos      ➜  ││  ← Itens do menu
│ │ Gerenciar documentos        ││  (grandes e tocáveis)
│ └─────────────────────────────┘│
│                                 │
│ ┌─────────────────────────────┐│
│ │ 🔔 Notificações     [3] ➜  ││  ← Badge de
│ │ 3 não lidas                 ││  notificação
│ └─────────────────────────────┘│
│                                 │
│ ┌─────────────────────────────┐│
│ │ ⚙️ Configurações         ➜  ││
│ └─────────────────────────────┘│
│                                 │
│ ─────────────────────────────── │
│                                 │
│ ┌─────────────────────────────┐│
│ │ 🚪 Sair                 ➜  ││  ← Danger zone
│ │ Encerrar sessão             ││  (vermelho)
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

## 🎯 Áreas de Toque (Touch Targets)

### **Recomendações WCAG**

| Nível | Tamanho Mínimo | Elemento |
|-------|----------------|----------|
| **AAA** | 44x44px | FAB Central (64x64) ✅ |
| **AA** | 24x24px | Botões Bottom Nav (48x48) ✅ |
| **A** | - | Cards e botões (min 48px) ✅ |

### **Espaçamento entre Elementos**

```css
/* Bottom Navigation */
gap: 0px (justify-around compensa)

/* Cards de Ação */
gap: 12px (3 no mobile, 4 no desktop)

/* Listas */
gap: 8px (2 entre cards)
```

---

## 🌐 Suporte a Notch (iOS)

```css
/* Bottom Navigation */
padding-bottom: env(safe-area-inset-bottom);

/* Garante que a barra não seja cortada em iPhones com notch */
```

---

## 🔄 Estados de Navegação

### **Visual Feedback**

| Estado | Visual |
|--------|--------|
| **Normal** | Ícone cinza, label cinza |
| **Hover** | Sem mudança (mobile) |
| **Active/Pressed** | `scale(0.95)` por 100ms |
| **Selected** | Ícone azul, label azul (peso 600) |
| **FAB Selected** | Elevação extra + glow + scale 1.05 |

---

## 📸 Screenshots de Referência

### **Inspirações (padrão de mercado)**

1. **WhatsApp** - Bottom nav com 4 itens
2. **Instagram** - FAB central de criação
3. **Google Maps** - Bottom sheet e FAB
4. **Telegram** - Bottom nav flutuante

### **Diferencial do nosso app**

- ✅ FAB central MAIOR (64px vs 56px padrão)
- ✅ Glow animado (feedback visual único)
- ✅ Elevação mais pronunciada (-24px vs -16px)
- ✅ Gradiente no card de serviços (CTA destacado)

---

## ✅ Checklist Visual

### **Mobile (< 1024px)**
- [ ] Bottom Nav aparece na parte inferior
- [ ] FAB central está elevado 24px acima da barra
- [ ] FAB tem glow pulsante
- [ ] Mobile Top Bar é compacta e funcional
- [ ] Sidebar desktop não aparece
- [ ] Navegação ativa destaca botão correto
- [ ] Dashboard tem header azul gradiente
- [ ] Card de serviços está destacado
- [ ] Todas as páginas têm padding-bottom de 80px

### **Desktop (>= 1024px)**
- [ ] Bottom Nav está oculta
- [ ] Mobile Top Bar está oculta
- [ ] Sidebar aparece à esquerda
- [ ] Header desktop aparece no topo
- [ ] Dashboard tem header branco (original)
- [ ] Layout preservado 100%

---

## 🎨 Customização Futura

### **Temas**

```css
/* Possível implementação de temas */
--theme-primary: #2563eb (azul padrão)
--theme-primary: #059669 (verde)
--theme-primary: #dc2626 (vermelho)
```

### **Cores alternativas para FAB**

```css
/* Azul (atual) */
from-blue-600 to-blue-700

/* Verde */
from-green-600 to-green-700

/* Roxo */
from-purple-600 to-purple-700
```

---

**Este guia visual deve ser usado como referência para entender o design mobile implementado.**
