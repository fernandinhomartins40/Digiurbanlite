# 📚 Exemplos Práticos - Portal Administrativo

## 🎯 Casos de Uso Reais

### 1. Adicionar Nova Funcionalidade ao Portal

**Cenário:** Você desenvolveu um novo módulo de "Ouvidoria" e quer adicioná-lo à página inicial.

#### Passo 1: Adicionar Card à Página

```tsx
// Em digiurban/frontend/app/admin/page.tsx

// Na seção "Gestão Municipal", adicione:
<DashboardCard
  title="Ouvidoria"
  description="Gerenciar reclamações e sugestões"
  href="/admin/ouvidoria"
  icon={MessageSquare} // Importe de lucide-react
  iconColor="text-purple-600"
  iconBgColor="bg-purple-50"
  badge={stats.pendingComplaints} // se existir no stats
  onClick={() => handleCardClick('Ouvidoria', '/admin/ouvidoria', 'Gestão')}
/>
```

#### Passo 2: Adicionar à Busca

```tsx
// Na função getSearchItems(), adicione:
{
  title: 'Ouvidoria',
  description: 'Gerenciar reclamações e sugestões dos cidadãos',
  href: '/admin/ouvidoria',
  category: 'Gestão',
  keywords: ['ouvidoria', 'reclamação', 'sugestão', 'denúncia', 'elogio']
}
```

#### Passo 3: Adicionar Permissão (se necessário)

```tsx
// Envolver com verificação de permissão:
{hasPermission('ouvidoria:read') && (
  <DashboardCard ... />
)}
```

---

### 2. Criar Seção Exclusiva para Super Admin

**Cenário:** Você quer adicionar uma seção "Configurações Avançadas" visível apenas para SUPER_ADMIN.

```tsx
{/* Em digiurban/frontend/app/admin/page.tsx */}

{hasMinRole('SUPER_ADMIN') && (
  <>
    <Separator />

    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          Configurações Avançadas
        </h2>
        <p className="text-sm text-muted-foreground">
          Ferramentas de super administrador
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Tenants"
          description="Gerenciar prefeituras"
          href="/super-admin/tenants"
          icon={Building2}
          iconColor="text-red-600"
          iconBgColor="bg-red-50"
          onClick={() => handleCardClick('Tenants', '/super-admin/tenants', 'Super Admin')}
        />

        <DashboardCard
          title="Logs do Sistema"
          description="Auditoria completa"
          href="/super-admin/logs"
          icon={FileText}
          iconColor="text-yellow-600"
          iconBgColor="bg-yellow-50"
          onClick={() => handleCardClick('Logs', '/super-admin/logs', 'Super Admin')}
        />
      </div>
    </section>
  </>
)}
```

---

### 3. Adicionar Novo Aplicativo Setorial

**Cenário:** Você desenvolveu um app de "Educação" completo.

```tsx
{/* Na seção "Aplicativos Setoriais" */}

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Apps existentes */}
  <AppCard name="Sistema de Saúde" ... />
  <AppCard name="Agricultura" ... />

  {/* NOVO App de Educação */}
  <AppCard
    name="Sistema de Educação"
    description="Gestão escolar completa, matrículas e acompanhamento pedagógico"
    href="/admin/apps/educacao"
    icon={GraduationCap}
    modules={45}
    badge="Novo"
    color="text-blue-600"
    bgColor="bg-blue-50"
    features={[
      'Matrículas Online',
      'Diário Eletrônico',
      'Gestão de Merenda',
      'Acompanhamento Pedagógico'
    ]}
  />
</div>
```

---

### 4. Personalizar Stats da Visão Rápida

**Cenário:** Você quer mostrar diferentes stats dependendo do role do usuário.

```tsx
{/* Visão Rápida Customizada */}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Para TODOS os usuários */}
  <StatCard
    title="Meus Protocolos"
    value={stats.myProtocols || 0}
    icon={FileText}
    href="/admin/protocolos?filter=assigned-to-me"
  />

  {/* Apenas para ADMIN */}
  {user.role === 'ADMIN' && (
    <StatCard
      title="Setores Atrasados"
      value={stats.delayedDepartments || 0}
      icon={AlertCircle}
      trend={{ value: 'Requer atenção', direction: 'down' }}
      href="/admin/gabinete/painel-prefeito"
    />
  )}

  {/* Apenas para COORDINATOR/MANAGER */}
  {(user.role === 'COORDINATOR' || user.role === 'MANAGER') && (
    <StatCard
      title="Equipe Online"
      value={stats.onlineTeamMembers || 0}
      icon={Users}
      trend={{ value: 'Agora', direction: 'up' }}
      href="/admin/equipe"
    />
  )}

  {/* Para usuários com permissão específica */}
  {hasPermission('reports:full') && (
    <StatCard
      title="Eficiência Geral"
      value={`${stats.overallEfficiency || 0}%`}
      icon={TrendingUp}
      href="/admin/analytics"
    />
  )}
</div>
```

---

### 5. Implementar Ação Customizada em Card

**Cenário:** Você quer que um card execute uma ação (modal, toast) em vez de navegar.

```tsx
const [showModal, setShowModal] = useState(false)

<DashboardCard
  title="Backup do Sistema"
  description="Iniciar backup completo"
  icon={Database}
  iconColor="text-orange-600"
  iconBgColor="bg-orange-50"
  onClick={() => {
    // Rastrear clique
    trackCardClick('Backup', 'action:backup', 'Sistema')

    // Abrir modal de confirmação
    setShowModal(true)
  }}
/>

{/* Modal de confirmação */}
{showModal && (
  <ConfirmModal
    title="Confirmar Backup"
    message="Deseja iniciar o backup completo do sistema?"
    onConfirm={async () => {
      await startBackup()
      setShowModal(false)
      toast.success('Backup iniciado!')
    }}
    onCancel={() => setShowModal(false)}
  />
)}
```

---

### 6. Criar Badge Dinâmico Customizado

**Cenário:** Badge que muda de cor baseado no valor.

```tsx
{/* Badge condicional */}
<DashboardCard
  title="Protocolos Urgentes"
  description="Requerem atenção imediata"
  href="/admin/protocolos?priority=urgent"
  icon={AlertCircle}
  badge={stats.urgentProtocols}
  badgeVariant={
    stats.urgentProtocols > 10 ? 'destructive' :
    stats.urgentProtocols > 5 ? 'default' :
    'secondary'
  }
/>
```

---

### 7. Usar Analytics para Mostrar "Favoritos"

**Cenário:** Mostrar cards mais acessados pelo usuário.

```tsx
import { useAnalyticsStats } from '@/hooks/useAnalytics'

function FavoriteSection() {
  const { topCards } = useAnalyticsStats()

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-500" />
        Seus Favoritos (Mais Acessados)
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.slice(0, 4).map((card) => (
          <div key={card.href} className="relative">
            {/* Badge com número de acessos */}
            <div className="absolute -top-2 -right-2 z-10">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {card.count}x
              </Badge>
            </div>

            {/* Reconstruir card baseado no href */}
            <DashboardCard
              title={card.title}
              href={card.href}
              icon={getIconByHref(card.href)} // função helper
              iconColor="text-yellow-600"
              iconBgColor="bg-yellow-50"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
```

---

### 8. Busca com Ações Customizadas

**Cenário:** Adicionar ações rápidas aos resultados de busca.

```tsx
// Estender SearchItem com ações
const searchItemsWithActions = [
  {
    title: 'Criar Novo Protocolo',
    description: 'Abrir protocolo para cidadão',
    href: '/admin/protocolos/novo',
    category: 'Ação Rápida',
    keywords: ['novo', 'criar', 'protocolo'],
    icon: <Plus className="h-4 w-4" />,
    action: () => {
      // Lógica customizada
      router.push('/admin/protocolos/novo?quickAction=true')
    }
  },
  // ... mais itens
]
```

---

### 9. Loading States Personalizados

**Cenário:** Mostrar skeleton enquanto carrega stats.

```tsx
{loading ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="p-6">
        <div className="skeleton-loading h-4 w-20 mb-2" />
        <div className="skeleton-loading h-8 w-12 mb-1" />
        <div className="skeleton-loading h-3 w-32" />
      </Card>
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Stats reais */}
  </div>
)}
```

---

### 10. Animação de Entrada Personalizada

**Cenário:** Cards aparecem um por vez (stagger).

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {cards.map((card, index) => (
    <div
      key={card.id}
      className="stagger-item"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <DashboardCard {...card} />
    </div>
  ))}
</div>

{/* Ou usando CSS in JS */}
<DashboardCard
  className="animate-fade-in-up"
  style={{ animationDelay: '100ms' }}
  {...props}
/>
```

---

### 11. Notificações em Cards

**Cenário:** Badge pulsante para itens novos.

```tsx
<DashboardCard
  title="Mensagens"
  description="Central de mensagens"
  href="/admin/mensagens"
  icon={MessageCircle}
  badge={stats.unreadMessages}
  badgeVariant="destructive"
  className={stats.unreadMessages > 0 ? "animate-glow-pulse" : ""}
/>
```

---

### 12. Card Desabilitado Temporariamente

**Cenário:** Feature em manutenção.

```tsx
<DashboardCard
  title="Relatórios Avançados"
  description="Em manutenção - retorna em breve"
  icon={BarChart3}
  disabled
  badge="Manutenção"
  className="opacity-60 cursor-not-allowed"
/>

{/* Com tooltip explicativo */}
<Tooltip content="Esta funcionalidade está temporariamente indisponível">
  <DashboardCard disabled ... />
</Tooltip>
```

---

## 🎨 Dicas de Design

### Cores Recomendadas por Categoria

```tsx
// Gestão e Administração
iconColor="text-blue-600"
iconBgColor="bg-blue-50"

// Urgente/Crítico
iconColor="text-red-600"
iconBgColor="bg-red-50"

// Sucesso/Completo
iconColor="text-green-600"
iconBgColor="bg-green-50"

// Avisos
iconColor="text-yellow-600"
iconBgColor="bg-yellow-50"

// Informação
iconColor="text-purple-600"
iconBgColor="bg-purple-50"

// Neutro/Sistema
iconColor="text-gray-600"
iconBgColor="bg-gray-50"
```

### Quando Usar Cada Tipo de Card

```tsx
// StatCard - Para métricas numéricas simples
<StatCard title="Total" value={100} />

// DashboardCard - Para navegação e ações
<DashboardCard title="Protocolos" href="/protocolos" />

// AppCard - Para aplicativos completos
<AppCard name="Saúde" modules={60} features={[...]} />

// CompactAppCard - Para grids grandes
<CompactAppCard name="Educação" href="/educacao" />
```

---

## 🚀 Performance Tips

1. **Lazy load stats pesadas**
```tsx
const [heavyStats, setHeavyStats] = useState(null)

useEffect(() => {
  loadHeavyStats().then(setHeavyStats)
}, [])
```

2. **Memoizar componentes pesados**
```tsx
const MemoizedAppCard = React.memo(AppCard)
```

3. **Virtualizar listas longas**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'
```

---

## 🔒 Segurança

**SEMPRE verificar permissões antes de exibir:**

```tsx
// ❌ ERRADO - mostra card mas link não funciona
<DashboardCard href="/admin/super-secret" />

// ✅ CORRETO - só mostra se tiver permissão
{hasPermission('secret:read') && (
  <DashboardCard href="/admin/super-secret" />
)}
```

---

## 📱 Responsividade

**Grid responsivo completo:**

```tsx
<div className="
  grid
  grid-cols-1           /* Mobile: 1 coluna */
  sm:grid-cols-2        /* Small: 2 colunas (640px+) */
  md:grid-cols-3        /* Medium: 3 colunas (768px+) */
  lg:grid-cols-4        /* Large: 4 colunas (1024px+) */
  xl:grid-cols-5        /* XL: 5 colunas (1280px+) */
  2xl:grid-cols-6       /* 2XL: 6 colunas (1536px+) */
  gap-4
">
  {/* Cards */}
</div>
```

---

Estes exemplos cobrem 90% dos casos de uso reais! 🎉
