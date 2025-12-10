# PAINEL DO PREFEITO - PROPOSTA ATUALIZADA
## Sistema DigiUrban - Dashboard Executivo em Tempo Real

**Data da Análise**: 10/12/2025
**Status**: Proposta Finalizada - Pronta para Implementação

---

## 📋 RESUMO EXECUTIVO

Após análise completa do sistema DigiUrban atual, identifiquei que:

- ✅ **70% da infraestrutura base já existe** (Agenda, Dashboard Admin, APIs de protocolos)
- ❌ **Falta o Painel Unificado do Prefeito** com visão 360° e tempo real
- ✅ **Sistema de busca de cidadãos já funcional** (`/api/admin/citizens/search`)
- ❌ **Falta visualizações avançadas**: Mapa Leaflet, gráficos Recharts, alertas críticos

**Proposta**: Implementar em **4 fases (20 dias)** um painel executivo completo com busca de cidadãos, histórico, métricas em tempo real, gráficos e alertas.

---

## 1. ANÁLISE DO ESTADO ATUAL

### 1.1 ✅ O Que JÁ ESTÁ IMPLEMENTADO

#### Módulo Gabinete ([/admin/gabinete](digiurban/frontend/app/admin/gabinete/))
- ✅ **Página principal** com cards de navegação
- ✅ **Agenda Executiva** (`/admin/gabinete/agenda`):
  - CRUD completo de eventos (compromissos, audiências, reuniões)
  - Status: CONFIRMADO, REALIZADO, CANCELADO, PENDENTE
  - Botão "Marcar como Realizado"

- ✅ **Mapa de Demandas** (`/admin/gabinete/mapa-demandas`):
  - Busca protocolos com geolocalização
  - Estatísticas: Total, por categoria, por status
  - **Placeholder de mapa** (dados prontos, visualização pendente)

#### Backend API Gabinete ([admin-gabinete.ts](digiurban/backend/src/routes/admin-gabinete.ts))
8 endpoints funcionais:
```
✅ GET    /api/admin/gabinete/agenda
✅ GET    /api/admin/gabinete/agenda/:id
✅ POST   /api/admin/gabinete/agenda
✅ PUT    /api/admin/gabinete/agenda/:id
✅ DELETE /api/admin/gabinete/agenda/:id
✅ PATCH  /api/admin/gabinete/agenda/:id/realize
✅ GET    /api/admin/gabinete/mapa-demandas/protocols
✅ GET    /api/admin/gabinete/mapa-demandas/stats
```

#### Dashboard Administrativo ([/admin/dashboard](digiurban/frontend/app/admin/dashboard/))
Dashboard geral com recursos para ADMIN:
- ✅ **4 Cards de métricas**: Total, Pendentes, Concluídos, Eficiência
- ✅ **Distribuição por Status**: Visualização percentual
- ✅ **Protocolos que Requerem Atenção**: Lista com botão "Cobrar Agilidade"
- ✅ **Filtros por Role**: ADMIN vê todo o município

#### Sistema de Cidadãos
- ✅ **API de busca funcionando**: `/api/admin/citizens/search`
- ✅ **Verificação 3 níveis**: PENDING (Bronze), VERIFIED (Prata), GOLD (Ouro)
- ✅ **CRUD completo**: Criar, editar, buscar, listar cidadãos

#### Sistema de Protocolos
- ✅ **Status do sistema**:
  ```prisma
  enum ProtocolStatus {
    VINCULADO    // Protocolo criado
    PROGRESSO    // Em andamento
    ATUALIZACAO  // Precisa atualização
    CONCLUIDO    // Finalizado
    PENDENCIA    // Com pendência
  }
  ```
- ✅ **Prioridade**: Campo `priority` (INT 1-5)
- ✅ **Geolocalização**: Campos `latitude`, `longitude`, `address`
- ✅ **Histórico completo**: Interações, pendências, avaliações

---

### 1.2 ❌ O Que FALTA IMPLEMENTAR

#### Painel Unificado do Prefeito
❌ Não existe `/admin/gabinete/painel-prefeito`
- Falta dashboard executivo centralizado
- Falta visão 360° em tempo real
- Falta busca destacada no topo da página

#### Funcionalidades de Tempo Real
❌ Atualização automática (SWR não configurado no gabinete)
❌ Indicador "LIVE" visual
❌ WebSockets para eventos críticos (futuro)

#### Visualizações Avançadas
❌ **Mapa Interativo Leaflet**: Apenas placeholder
❌ **Gráficos de Tendências**: Evolução de protocolos (30 dias)
❌ **Comparativo Mensal**: Este mês vs. anterior

#### Performance e Alertas
❌ Tabela de performance por secretaria
❌ Ranking de servidores (Top 5)
❌ Sistema de alertas críticos (atrasados, urgentes, sem atribuição)

#### Histórico Completo do Cidadão
❌ Página dedicada `/admin/gabinete/painel-prefeito/cidadao/[id]`
❌ Timeline cronológica de eventos
❌ Visualização de composição familiar
❌ Todos os protocolos em um só lugar

#### Endpoints Backend Faltantes
```
❌ GET /api/admin/gabinete/painel-prefeito/stats
❌ GET /api/admin/gabinete/painel-prefeito/trends
❌ GET /api/admin/gabinete/painel-prefeito/departments-performance
❌ GET /api/admin/gabinete/painel-prefeito/critical-alerts
❌ GET /api/admin/gabinete/painel-prefeito/top-servers
❌ GET /api/admin/citizens/:id/complete-history
```

---

## 2. PROPOSTA DE IMPLEMENTAÇÃO

### 2.1 Visão Geral do Painel

**URL**: `/admin/gabinete/painel-prefeito`

**Objetivo**: Dashboard executivo centralizado com visão 360° do município, atualização em tempo real e ferramentas de gestão estratégica.

### 2.2 Layout do Painel

```
┌─────────────────────────────────────────────────────────────────┐
│  🏛️ PAINEL DO PREFEITO - MUNICÍPIO                              │
│  🔴 LIVE - Atualizado há 30s                             [👤]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [🔍 Buscar Cidadão por Nome ou CPF...]                         │
│                                                                  │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│ 📊 Protocolos│ ✅ Taxa      │ ⏱️ Tempo     │ ⭐ Satisfação    │
│    Ativos    │   Conclusão  │   Resposta   │   Cidadão        │
│    150       │    85%       │    24h       │   4.5/5          │
├──────────────┴──────────────┴──────────────┴──────────────────┤
│                                                                  │
│ ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│ │ 📊 EVOLUÇÃO - 30 DIAS        │  │ 🏢 PERFORMANCE           │ │
│ │ [Gráfico de Linhas]          │  │ [Tabela Secretarias]     │ │
│ └──────────────────────────────┘  └──────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ⚠️ ALERTAS CRÍTICOS                                        │ │
│ │ • 3 Protocolos atrasados >30 dias                          │ │
│ │ • 5 Protocolos urgentes (prioridade alta)                  │ │
│ │ • 2 Protocolos sem atribuição                              │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ 📋 PROTOCOLOS QUE REQUEREM SUA ATENÇÃO                     │ │
│ │ [Lista com botão "Cobrar Agilidade"]                       │ │
│ └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. PLANO DE IMPLEMENTAÇÃO

### FASE 1: PAINEL BASE + BUSCA (5 dias) 🎯 MVP

#### Frontend
1. Criar `/admin/gabinete/painel-prefeito/page.tsx`
2. Criar componente `CitizenSearchBar` com busca em tempo real
3. Criar 4 cards de métricas principais
4. Implementar indicador "LIVE" com SWR (auto-refresh 30s)

#### Backend
1. Criar `/src/routes/admin-gabinete-painel.ts`
2. Endpoint `GET /api/admin/gabinete/painel-prefeito/stats`:
   ```typescript
   {
     totalActive: number        // Protocolos não concluídos
     completionRate: number     // Taxa de conclusão (%)
     avgResponseTime: number    // Tempo médio em horas
     citizenSatisfaction: number // Média das avaliações (1-5)
   }
   ```

#### Entregável
✅ Página principal funcional com busca de cidadãos e métricas em tempo real

---

### FASE 2: HISTÓRICO DO CIDADÃO (5 dias)

#### Frontend
1. Criar `/admin/gabinete/painel-prefeito/cidadao/[id]/page.tsx`
2. Criar componente `CitizenHistoryView` com abas:
   - Histórico de Protocolos
   - Composição Familiar
   - Timeline Cronológica
3. Cards de estatísticas do cidadão (Total, Concluídos, Em andamento, Família)

#### Backend
1. Endpoint `GET /api/admin/citizens/:id/complete-history`:
   ```typescript
   {
     citizen: Citizen            // Dados completos
     protocols: Protocol[]       // Todos os protocolos
     family: FamilyComposition[] // Membros da família
     timeline: TimelineEvent[]   // Eventos cronológicos
   }
   ```

#### Entregável
✅ Página de histórico completo do cidadão funcionando

---

### FASE 3: GRÁFICOS DE TENDÊNCIAS (5 dias)

#### Frontend
1. Instalar dependências: `npm install recharts`
2. Criar componente `ProtocolTrendsChart`:
   - Gráfico de linhas com 3 séries (Novos, Concluídos, Pendentes)
   - Últimos 30 dias
   - Responsivo

#### Backend
1. Endpoint `GET /api/admin/gabinete/painel-prefeito/trends`:
   ```typescript
   {
     daily: Array<{
       date: string      // "2025-12-10"
       novos: number
       concluidos: number
       pendentes: number
     }>
   }
   ```

#### Entregável
✅ Gráfico de tendências funcional mostrando evolução dos protocolos

---

### FASE 4: PERFORMANCE + ALERTAS (5 dias)

#### Frontend
1. Criar componente `DepartmentPerformanceTable`:
   - Tabela com colunas: Secretaria, Total, Concluídos, Pendentes, Eficiência
   - Barra de progresso visual
2. Criar componente `CriticalAlerts`:
   - Lista de alertas com badges de severidade
   - Botões de ação rápida

#### Backend
1. Endpoint `GET /api/admin/gabinete/painel-prefeito/departments-performance`:
   ```typescript
   {
     departments: Array<{
       id: string
       name: string
       total: number
       completed: number
       pending: number
       efficiency: number        // Porcentagem de conclusão
       avgResponseTime: number   // Em horas
     }>
   }
   ```

2. Endpoint `GET /api/admin/gabinete/painel-prefeito/critical-alerts`:
   ```typescript
   {
     alerts: Array<{
       type: 'OVERDUE' | 'URGENT' | 'UNASSIGNED'
       title: string
       count: number
       protocols: Protocol[]     // Primeiros 5
     }>
   }
   ```

3. Endpoint `GET /api/admin/gabinete/painel-prefeito/top-servers`:
   ```typescript
   {
     servers: Array<{
       id: string
       name: string
       completionRate: number
       totalCompleted: number
     }>
   }
   ```

#### Entregável
✅ Sistema completo com performance por secretaria e alertas críticos

---

## 4. ARQUITETURA TÉCNICA

### 4.1 Stack Tecnológica

#### Frontend
- **Framework**: Next.js 14 (App Router) ✅ Já configurado
- **UI**: shadcn/ui + Tailwind CSS ✅ Já configurado
- **Gráficos**: Recharts ⚠️ Instalar
- **Estado**: SWR para cache e auto-refresh ⚠️ Instalar
- **Ícones**: Lucide React ✅ Já configurado

#### Backend
- **Runtime**: Node.js + Express ✅ Já configurado
- **ORM**: Prisma ✅ Já configurado
- **Database**: PostgreSQL ✅ Já configurado
- **Auth**: JWT (httpOnly cookies) ✅ Já configurado

### 4.2 Estrutura de Arquivos

```
digiurban/
├── frontend/
│   ├── app/admin/gabinete/
│   │   ├── painel-prefeito/
│   │   │   ├── page.tsx                    # ⚠️ CRIAR
│   │   │   └── cidadao/[id]/page.tsx       # ⚠️ CRIAR
│   │   ├── agenda/page.tsx                 # ✅ EXISTE
│   │   └── mapa-demandas/page.tsx          # ✅ EXISTE
│   │
│   ├── components/admin/gabinete/
│   │   ├── CitizenSearchBar.tsx            # ⚠️ CRIAR
│   │   ├── LiveStatsCards.tsx              # ⚠️ CRIAR
│   │   ├── ProtocolTrendsChart.tsx         # ⚠️ CRIAR
│   │   ├── DepartmentPerformanceTable.tsx  # ⚠️ CRIAR
│   │   ├── CriticalAlerts.tsx              # ⚠️ CRIAR
│   │   └── CitizenHistoryView.tsx          # ⚠️ CRIAR
│   │
│   └── lib/services/
│       └── painel-prefeito.service.ts      # ⚠️ CRIAR
│
└── backend/
    └── src/routes/
        ├── admin-gabinete-painel.ts        # ⚠️ CRIAR (Novos endpoints)
        └── admin-gabinete.ts               # ✅ EXISTE (8 endpoints)
```

### 4.3 Novos Endpoints da API

Arquivo: `backend/src/routes/admin-gabinete-painel.ts`

```typescript
// Estatísticas gerais do painel
GET /api/admin/gabinete/painel-prefeito/stats

// Tendências dos últimos 30 dias
GET /api/admin/gabinete/painel-prefeito/trends

// Performance por secretaria
GET /api/admin/gabinete/painel-prefeito/departments-performance

// Alertas críticos
GET /api/admin/gabinete/painel-prefeito/critical-alerts

// Top 5 servidores
GET /api/admin/gabinete/painel-prefeito/top-servers

// Histórico completo do cidadão
GET /api/admin/citizens/:id/complete-history
```

---

## 5. IMPLEMENTAÇÃO DE TEMPO REAL

### 5.1 Hook SWR Customizado

```typescript
// hooks/useLiveStats.ts
import useSWR from 'swr'

export function useLiveStats() {
  const { data, error, mutate } = useSWR(
    '/api/admin/gabinete/painel-prefeito/stats',
    fetcher,
    {
      refreshInterval: 30000,      // Auto-refresh a cada 30s
      revalidateOnFocus: true,     // Recarregar ao focar janela
      revalidateOnReconnect: true  // Recarregar ao reconectar
    }
  )

  return {
    stats: data?.data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}
```

### 5.2 Indicador LIVE

```tsx
<Badge variant="destructive" className="animate-pulse">
  <Circle className="h-2 w-2 fill-current mr-1" />
  LIVE - Atualizado há {lastUpdate}s
</Badge>
```

---

## 6. CRONOGRAMA E ESTIMATIVAS

| Fase | Duração | Esforço | Status |
|------|---------|---------|--------|
| **Fase 1: Painel Base** | 5 dias | 40h | ⚠️ Pendente |
| **Fase 2: Histórico Cidadão** | 5 dias | 40h | ⚠️ Pendente |
| **Fase 3: Gráficos** | 5 dias | 32h | ⚠️ Pendente |
| **Fase 4: Performance** | 5 dias | 40h | ⚠️ Pendente |
| **TOTAL** | **20 dias úteis** | **152h** | - |

### MVP Recomendado
✅ **Fase 1 + Fase 2** = Painel funcional com busca e histórico (10 dias)

### Sistema Completo
✅ **Todas as fases** = Sistema completo de gestão executiva (20 dias)

---

## 7. DEPENDÊNCIAS

### Já Instaladas ✅
- Next.js 14
- shadcn/ui
- Tailwind CSS
- Lucide React
- Prisma
- Express

### A Instalar ⚠️
```bash
# Frontend
cd digiurban/frontend
npm install swr recharts

# Se implementar mapa (futuro)
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

---

## 8. CRITÉRIOS DE SUCESSO

### Técnicos
- ✅ Tempo de carregamento < 2 segundos
- ✅ Atualização automática a cada 30 segundos
- ✅ Busca de cidadãos com resposta < 500ms
- ✅ Suporte a 10.000+ protocolos sem degradação

### Negócio
- ✅ Prefeito tem visão 360° do município em tempo real
- ✅ Busca rápida de histórico completo de qualquer cidadão
- ✅ Identificação imediata de gargalos e alertas críticos
- ✅ Métricas de performance de cada secretaria visíveis

---

## 9. PRÓXIMOS PASSOS

### ✅ Aprovação Recebida - Iniciar Implementação

#### Passo 1: Preparação (Agora)
- [x] Análise completa do sistema ✅
- [x] Proposta atualizada criada ✅
- [ ] Instalar dependências (swr, recharts)
- [ ] Criar branch `feature/painel-prefeito`

#### Passo 2: Implementação (Sequencial)
1. Fase 1: Painel base + Busca (5 dias)
2. Fase 2: Histórico do cidadão (5 dias)
3. Fase 3: Gráficos de tendências (5 dias)
4. Fase 4: Performance + Alertas (5 dias)

#### Passo 3: Validação
- [ ] Testes com dados reais
- [ ] Review de código
- [ ] Ajustes de UX
- [ ] Merge para main

---

## 10. CONCLUSÃO

O **Painel do Prefeito** será implementado em **4 fases incrementais (20 dias)**, aproveitando 70% da infraestrutura já existente no DigiUrban.

**Principais Benefícios:**
- 📊 Visão executiva 360° em tempo real
- 🔍 Busca instantânea de cidadãos com histórico completo
- 📈 Métricas de performance por secretaria
- ⚠️ Alertas críticos para ação imediata
- 🎯 Base sólida para expansões futuras (mapa, IA, WebSockets)

**Status**: ✅ Pronto para iniciar implementação

---

**Documento atualizado em**: 10/12/2025
**Próxima ação**: Instalar dependências e iniciar Fase 1
