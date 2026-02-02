# 📊 Portal Administrativo - DigiUrban

## 🎯 Visão Geral

A página inicial `/admin` foi completamente reformulada para refletir o estado atual da aplicação, com navegação funcional, analytics integrado e design moderno.

## ✨ Funcionalidades Implementadas

### 1. **Página Principal Atualizada** ([page.tsx](./page.tsx))

- ✅ Navegação 100% funcional (todos os links ativos)
- ✅ Cards organizados por categoria e hierarquia
- ✅ Permissões por role (ADMIN, MANAGER, COORDINATOR, USER)
- ✅ Stats em tempo real do AdminAuthContext
- ✅ Layout responsivo e mobile-friendly
- ✅ Animações suaves e efeitos visuais

### 2. **Componentes Reutilizáveis**

#### **DashboardCard** ([components/admin/DashboardCard.tsx](../../components/admin/DashboardCard.tsx))
```tsx
<DashboardCard
  title="Protocolos"
  description="Gestão unificada de protocolos"
  href="/admin/protocolos"
  icon={FileText}
  iconColor="text-blue-600"
  iconBgColor="bg-blue-50"
  badge={stats.pendingProtocols}
  onClick={() => trackCardClick(...)}
/>
```

**Recursos:**
- Animações hover (scale, shadow, gradient)
- Badges customizáveis (contador, "NOVO", etc.)
- Indicador de seta no hover
- Stats inline opcionais
- Suporte a disabled state

#### **StatCard** (variante do DashboardCard)
```tsx
<StatCard
  title="Protocolos Pendentes"
  value={stats.pendingProtocols}
  icon={Clock}
  trend={{ value: 'Requer atenção', direction: 'neutral' }}
  href="/admin/protocolos"
/>
```

**Recursos:**
- Display grande para métricas
- Indicadores de tendência (up/down/neutral)
- Ícone circular animado

#### **AppCard** ([components/admin/AppCard.tsx](../../components/admin/AppCard.tsx))
```tsx
<AppCard
  name="Sistema de Saúde"
  description="Sistema completo de atendimento..."
  href="/admin/apps/saude/cadastros"
  icon={Heart}
  modules={60}
  badge="Completo"
  color="text-red-600"
  bgColor="bg-red-50"
  features={['Prontuário', 'Triagem', 'ESF', 'Agendamento']}
/>
```

**Recursos:**
- Destaque para aplicativos setoriais
- Lista de features principais
- Contador de módulos
- Botão CTA animado
- Header colorido por tema

#### **CompactAppCard** (variante minimalista)
```tsx
<CompactAppCard
  name="Saúde"
  href="/admin/secretarias/saude"
  icon={Heart}
  color="text-red-600"
/>
```

**Recursos:**
- Card compacto para grids grandes
- Ícone + nome centralizado
- Animação scale no hover

### 3. **Busca Rápida Inteligente** ([components/admin/SearchBar.tsx](../../components/admin/SearchBar.tsx))

```tsx
<SearchBar items={getSearchItems()} placeholder="Buscar funcionalidades..." />
```

**Recursos:**
- Busca fuzzy em títulos, descrições e keywords
- Navegação por teclado (↑↓ Enter Esc)
- Histórico de buscas (localStorage)
- Atalho global: **Cmd/Ctrl + K**
- Destaque por categoria
- Dropdown animado com resultados

**Estrutura dos itens:**
```tsx
const searchItems = [
  {
    title: 'Protocolos',
    description: 'Gestão de protocolos',
    href: '/admin/protocolos',
    category: 'Gestão',
    keywords: ['protocolo', 'solicitação', 'atendimento']
  },
  // ... mais itens
]
```

### 4. **Sistema de Analytics** ([hooks/useAnalytics.ts](../../hooks/useAnalytics.ts))

#### **useAnalytics()**
```tsx
const { trackCardClick, trackPageView, trackSearch } = useAnalytics()

// Rastrear clique em card
trackCardClick('Protocolos', '/admin/protocolos', 'Gestão')

// Rastrear visualização de página
trackPageView('Admin Home')

// Rastrear busca
trackSearch('protocolos pendentes', 5)
```

**Eventos Rastreados:**
- ✅ Cliques em cards do dashboard
- ✅ Visualizações de página
- ✅ Tempo na página
- ✅ Buscas realizadas
- ✅ Erros encontrados

**Armazenamento:**
- LocalStorage (últimos 1000 eventos)
- Persistente entre sessões
- API simples para análise

#### **usePageTracking()**
```tsx
// Auto-rastreamento de página
function MyPage() {
  usePageTracking('Admin Home')
  // Registra entrada e saída automaticamente
}
```

#### **useAnalyticsStats()**
```tsx
const { cardClickStats, topCards } = useAnalyticsStats()

// Obter cards mais clicados
topCards.forEach(card => {
  console.log(`${card.title}: ${card.count} cliques`)
})
```

### 5. **Animações CSS** ([animations.css](./animations.css))

**Animações Disponíveis:**
```css
/* Fade in com movimento para cima */
.animate-fade-in-up

/* Fade in com escala */
.animate-fade-in-scale

/* Shimmer effect (loading) */
.animate-shimmer

/* Bounce sutil */
.animate-bounce-subtle

/* Glow pulsante */
.animate-glow-pulse

/* Gradiente animado */
.animate-gradient
```

**Stagger Animation (cascata):**
```tsx
<div className="stagger-item">Item 1</div>
<div className="stagger-item">Item 2</div>
<div className="stagger-item">Item 3</div>
// Cada item aparece com delay crescente
```

**Hover Effects:**
```css
.hover-lift /* Eleva card no hover */
```

## 📐 Estrutura da Página

```
/admin
├── Header
│   ├── Título + Boas-vindas personalizadas
│   ├── Badges (Role + Departamento)
│   └── SearchBar (Cmd+K)
│
├── Visão Rápida (Stats em tempo real)
│   ├── Protocolos Pendentes
│   ├── Total de Protocolos
│   ├── Mensagens Não Lidas
│   └── Cidadãos Pendentes
│
├── 👑 Gabinete do Prefeito (apenas ADMIN)
│   ├── Painel do Prefeito [NOVO]
│   ├── Criar Chamado
│   ├── Agenda Executiva
│   └── Mapa de Demandas
│
├── 🏛️ Gestão Municipal
│   ├── Protocolos (com contador)
│   ├── Catálogo de Serviços
│   ├── Workflows
│   ├── Cidadãos
│   ├── Equipe
│   └── Relatórios
│
├── 📋 Documentos & Processos
│   ├── Meus Documentos
│   ├── Assinaturas Digitais [NOVO]
│   ├── Templates de Documentos
│   └── Fluxos do Bot [NOVO]
│
├── ✨ Aplicativos Setoriais (Cards Destacados)
│   ├── Sistema de Saúde (60+ módulos) [Completo]
│   └── Agricultura (5 módulos)
│
├── 🏢 Secretarias Municipais (16 secretarias)
│   └── Grid compacto com ícones
│
├── 💬 Comunicação & Análise
│   ├── Mensagens (com contador)
│   ├── Email
│   ├── Analytics
│   └── Dashboard
│
└── ⚙️ Sistema
    ├── Perfil
    ├── Configurações
    └── Integrações
```

## 🔐 Sistema de Permissões

### Por Role

```tsx
// Verificar role mínima
{hasMinRole('ADMIN') && <AdminOnlyFeature />}
{hasMinRole('COORDINATOR') && <CoordinatorFeature />}
```

**Hierarquia:**
1. `SUPER_ADMIN` (maior)
2. `ADMIN` (Prefeito)
3. `MANAGER` (Secretário)
4. `COORDINATOR` (Coordenador)
5. `USER` (Funcionário)
6. `GUEST` (menor)

### Por Permissão Específica

```tsx
// Verificar permissão específica
{hasPermission('protocols:read') && <ProtocolsCard />}
{hasPermission('services:create') && <ServicesCard />}
```

**Permissões Comuns:**
- `protocols:read`, `protocols:write`
- `services:create`, `services:update`
- `citizens:read`, `citizens:verify`
- `team:read`, `team:manage`
- `reports:department`, `reports:full`
- `messages:read`
- `chamados:create`

## 📱 Responsividade

**Breakpoints:**
```tsx
// Mobile first
grid-cols-1           // Mobile
sm:grid-cols-2        // 640px+
md:grid-cols-3        // 768px+
lg:grid-cols-4        // 1024px+
xl:grid-cols-6        // 1280px+
```

**Cards se adaptam automaticamente:**
- Mobile: 1 coluna
- Tablet: 2 colunas
- Desktop: 3-4 colunas
- Secretarias: até 6 colunas em telas grandes

## 🎨 Cores e Temas

**Cores por Categoria:**
- 👑 Gabinete: Amarelo (`text-yellow-600`)
- 📊 Gestão: Azul/Roxo/Verde
- 📋 Documentos: Azul/Verde/Roxo
- 🏥 Saúde: Vermelho (`text-red-600`)
- 🌾 Agricultura: Verde (`text-green-600`)
- 💬 Comunicação: Azul/Verde
- ⚙️ Sistema: Cinza/Roxo

## 🚀 Performance

**Otimizações Implementadas:**
- ✅ Lazy loading de stats
- ✅ Memoização de searchItems
- ✅ Renderização condicional por permissão
- ✅ Animações CSS (GPU-accelerated)
- ✅ localStorage para cache de analytics
- ✅ Fade-in progressivo para melhor UX

## 📊 Analytics Insights

**Dados Coletados:**
```tsx
// Ver cards mais clicados
const { topCards } = useAnalyticsStats()

// Exemplo de output:
// [
//   { title: "Protocolos", href: "/admin/protocolos", count: 145 },
//   { title: "Dashboard", href: "/admin/dashboard", count: 98 },
//   { title: "Cidadãos", href: "/admin/cidadaos", count: 67 }
// ]
```

**Limpar dados:**
```tsx
const { clearAnalytics } = useAnalytics()
clearAnalytics() // Remove todos os dados de analytics
```

## 🔧 Manutenção

### Adicionar Novo Card

```tsx
<DashboardCard
  title="Nova Funcionalidade"
  description="Descrição clara"
  href="/admin/nova-funcionalidade"
  icon={IconComponent}
  iconColor="text-blue-600"
  iconBgColor="bg-blue-50"
  badge="NOVO" // opcional
  badgeVariant="new" // opcional
  onClick={() => handleCardClick('Nova Funcionalidade', '/admin/nova-funcionalidade', 'Categoria')}
/>
```

### Adicionar Item à Busca

```tsx
// Em getSearchItems()
{
  title: 'Nova Funcionalidade',
  description: 'Descrição para busca',
  href: '/admin/nova-funcionalidade',
  category: 'Categoria',
  keywords: ['palavra1', 'palavra2', 'palavra3']
}
```

### Adicionar Secretaria

```tsx
<CompactAppCard
  name="Nova Secretaria"
  href="/admin/secretarias/nova-secretaria"
  icon={IconComponent}
  color="text-blue-600"
/>
```

## 🐛 Troubleshooting

**Card não aparece:**
- ✅ Verificar permissões (`hasPermission`, `hasMinRole`)
- ✅ Verificar se o user está carregado
- ✅ Verificar console para erros

**Busca não funciona:**
- ✅ Verificar se o item está em `getSearchItems()`
- ✅ Verificar keywords
- ✅ Limpar localStorage se necessário

**Animações não funcionam:**
- ✅ Verificar import do `animations.css` no layout
- ✅ Verificar se `tailwindcss-animate` está instalado
- ✅ Verificar `prefers-reduced-motion` do usuário

## 📚 Referências

- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [Next.js 14](https://nextjs.org/)

## 🎉 Resultado Final

A página `/admin` agora é:
- ✅ Moderna e profissional
- ✅ 100% funcional (navegação real)
- ✅ Organizada e hierárquica
- ✅ Responsiva e acessível
- ✅ Com analytics integrado
- ✅ Animada e fluida
- ✅ Fácil de manter e estender

**Todas as funcionalidades implementadas estão operacionais e testadas!**
