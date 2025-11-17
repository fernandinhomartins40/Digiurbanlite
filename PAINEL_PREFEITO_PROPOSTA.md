# PAINEL DO PREFEITO - PROPOSTA COMPLETA
## Sistema DigiUrban - Dashboard Executivo em Tempo Real

---

## 📋 ÍNDICE

1. [Resumo da Implementação Atual](#1-resumo-da-implementação-atual)
2. [Análise de Gaps e Oportunidades](#2-análise-de-gaps-e-oportunidades)
3. [Proposta do Painel do Prefeito](#3-proposta-do-painel-do-prefeito)
4. [Funcionalidades em Tempo Real](#4-funcionalidades-em-tempo-real)
5. [Busca de Cidadãos e Histórico](#5-busca-de-cidadãos-e-histórico)
6. [Arquitetura Técnica](#6-arquitetura-técnica)
7. [Plano de Implementação](#7-plano-de-implementação)

---

## 1. RESUMO DA IMPLEMENTAÇÃO ATUAL

### 1.1 Módulo Gabinete do Prefeito (70% Implementado)

**Localização**: `/admin/gabinete`

#### Funcionalidades Existentes:
- ✅ **Agenda Executiva**: CRUD completo de eventos (compromissos, audiências, reuniões)
- ✅ **Mapa de Demandas**: Visualização de protocolos com geolocalização (dados prontos, mapa visual pendente)
- ✅ **Autenticação**: Restrito a role ADMIN
- ✅ **API Backend**: 8 endpoints funcionais

#### Estrutura Atual:
```
/admin/gabinete/
├── Dashboard Principal (page.tsx)
│   ├── Card: Agenda Executiva
│   └── Card: Mapa de Demandas
├── /agenda
│   └── Gestão de eventos (151 linhas)
└── /mapa-demandas
    └── Protocolos geolocalizados (148 linhas)
```

### 1.2 Dashboard Administrativo Geral

**Localização**: `/admin/dashboard`

#### Funcionalidades Existentes:
- ✅ **Estatísticas Gerais**: Total de protocolos, pendentes, concluídos, eficiência
- ✅ **Distribuição por Status**: Visualização percentual
- ✅ **Ações Rápidas**: Links para protocolos, chamados, equipe, relatórios
- ✅ **Protocolos Pendentes** (ADMIN): Lista de protocolos não concluídos com "Cobrar Agilidade"
- ✅ **Filtros por Role**: USER vê só os dele, COORDINATOR/MANAGER vê do departamento, ADMIN vê tudo

#### Recursos Especiais para ADMIN:
- 📊 Visão global de todos os protocolos do município
- 🔔 Botão "Cobrar Agilidade" para protocolos pendentes
- 📈 Taxa de eficiência e conclusão em tempo real

### 1.3 Páginas de Analytics e Relatórios

#### Analytics (`/admin/analytics`)
- ✅ **Dashboard Overview**: Métricas consolidadas
- ✅ **Tendências**: Gráficos de evolução temporal
- ✅ **Relatórios**: Filtros e exportação

#### Relatórios (`/admin/relatorios`)
- ✅ **CRUD de Relatórios**: Criar, executar, deletar
- ✅ **Tipos**: Operacional, Gerencial, Executivo, Personalizado
- ✅ **Formatos**: JSON, PDF, Excel, CSV
- ✅ **Histórico de Execuções**: Rastreamento completo

### 1.4 Sistema de Cidadãos e Protocolos

#### Cidadãos:
- ✅ **Verificação em 3 Níveis**: Bronze (PENDING), Prata (VERIFIED), Ouro (GOLD)
- ✅ **Busca por Nome/CPF**: API `/api/admin/citizens/search`
- ✅ **Composição Familiar**: Membros, dependentes, renda
- ✅ **Documentos**: Upload, aprovação, rejeição
- ✅ **Histórico Completo**: Protocolos, notificações, auditoria

#### Protocolos:
- ✅ **Ciclo de Vida Completo**: VINCULADO → PROGRESSO → CONCLUIDO
- ✅ **Sistema de Interações**: Mensagens públicas/internas
- ✅ **Pendências**: Bloqueios, prazos, resoluções
- ✅ **SLA**: Acompanhamento de prazos
- ✅ **Avaliações**: Satisfação do cidadão
- ✅ **Geolocalização**: Latitude, longitude, endereço

---

## 2. ANÁLISE DE GAPS E OPORTUNIDADES

### 2.1 O Que Está Faltando

#### Dashboard do Prefeito:
- ❌ **Painel Unificado**: Não existe um painel único com visão 360° do município
- ❌ **Tempo Real**: Dados atualizados a cada 30-60 segundos
- ❌ **Busca Rápida de Cidadão**: Campo de busca destacado com histórico completo
- ❌ **Alertas Críticos**: Notificações de protocolos urgentes/atrasados
- ❌ **Visão por Secretaria**: Performance individual de cada departamento
- ❌ **Mapa Interativo**: Visualização geoespacial com Leaflet
- ❌ **Gráficos em Tempo Real**: Charts dinâmicos com Chart.js ou Recharts

#### Funcionalidades Estratégicas:
- ❌ **Indicadores-Chave (KPIs)**: Métricas de gestão municipal
- ❌ **Comparativos Temporais**: Mês atual vs. mês anterior
- ❌ **Top 5 Setores**: Mais eficientes e menos eficientes
- ❌ **Cidadãos VIP**: Identificação de usuários frequentes ou com demandas urgentes
- ❌ **Linha do Tempo**: Histórico cronológico de eventos importantes

### 2.2 Oportunidades de Valor

#### Para o Prefeito:
1. **Tomada de Decisão Baseada em Dados**: Visualizar gargalos em tempo real
2. **Gestão de Crises**: Identificar rapidamente áreas com alta demanda
3. **Accountability**: Cobrar resultados de secretários com dados concretos
4. **Transparência**: Métricas públicas de gestão
5. **Planejamento Estratégico**: Tendências de longo prazo

#### Para a Gestão Municipal:
1. **Eficiência Operacional**: Reduzir tempo de resposta
2. **Satisfação do Cidadão**: Monitorar avaliações em tempo real
3. **Alocação de Recursos**: Direcionar equipe para áreas críticas
4. **Compliance**: Garantir cumprimento de SLAs

---

## 3. PROPOSTA DO PAINEL DO PREFEITO

### 3.1 Visão Geral

**URL**: `/admin/gabinete/painel-prefeito`

**Objetivo**: Dashboard executivo centralizado com visão 360° do município, atualização em tempo real e ferramentas de gestão estratégica.

### 3.2 Layout Proposto

```
┌─────────────────────────────────────────────────────────────────┐
│  🏛️ PAINEL DO PREFEITO - MUNICÍPIO DE [NOME]                   │
│  Atualizado: há 30 segundos | 🔴 LIVE                    [👤]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [🔍 Buscar Cidadão por Nome ou CPF...]                         │
│                                                                  │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│   MÉTRICAS GERAIS (4 Cards)                                     │
├──────────────┴──────────────┴──────────────┴──────────────────┤
│                                                                  │
│ ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│ │  📊 PROTOCOLOS EM TEMPO REAL │  │  🗺️ MAPA DE DEMANDAS     │ │
│ │  (Gráfico de Linhas 30 dias) │  │  (Mapa Interativo)       │ │
│ │                              │  │                          │ │
│ │  [Chart dinâmico]            │  │  [Leaflet com markers]   │ │
│ └──────────────────────────────┘  └──────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │  🏢 PERFORMANCE POR SECRETARIA (Tabela + Barra Progress)  │ │
│ │  ┌────────────┬──────┬──────────┬──────────┬────────────┐ │ │
│ │  │ Secretaria │Total │Concluídos│Pendentes │ Eficiência │ │ │
│ │  ├────────────┼──────┼──────────┼──────────┼────────────┤ │ │
│ │  │ Saúde      │ 145  │   120    │    25    │ ███ 82%    │ │ │
│ │  │ Educação   │  98  │    85    │    13    │ ███ 87%    │ │ │
│ │  └────────────┴──────┴──────────┴──────────┴────────────┘ │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│ │  ⚠️ ALERTAS CRÍTICOS │  │  ⭐ TOP 5 SERVIDORES DO MÊS      │ │
│ │  - 3 Atrasados >30d  │  │  1. João Silva (95% conclusão)  │ │
│ │  - 5 Urgentes        │  │  2. Maria Santos (93%)          │ │
│ │  - 2 Sem atribuição  │  │  3. Pedro Costa (91%)           │ │
│ └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │  📋 PROTOCOLOS REQUEREM SUA ATENÇÃO (Últimos 10)          │ │
│ │  [Lista com botão "Cobrar Agilidade" + "Ver Detalhes"]    │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│ │  📅 AGENDA HOJE      │  │  📈 COMPARATIVO MENSAL           │ │
│ │  (Próximos eventos)  │  │  Este mês vs. Mês anterior       │ │
│ └──────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Seções Detalhadas

#### 3.3.1 Cabeçalho com Busca
```tsx
<header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold">Painel do Prefeito</h1>
      <p className="text-sm opacity-90">Município de Palmital - SP</p>
    </div>
    <div className="flex items-center gap-4">
      <Badge variant="destructive" className="animate-pulse">
        🔴 LIVE - Atualizado há 30s
      </Badge>
      <UserAvatar />
    </div>
  </div>

  <div className="mt-6">
    <CitizenSearchBar onSearch={handleCitizenSearch} />
  </div>
</header>
```

#### 3.3.2 Métricas Gerais (4 Cards)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <MetricCard
    title="Protocolos Ativos"
    value={stats.totalActive}
    change="+12% vs. mês anterior"
    trend="up"
    icon={<FileText />}
  />
  <MetricCard
    title="Taxa de Conclusão"
    value={`${stats.completionRate}%`}
    change="+5% vs. mês anterior"
    trend="up"
    icon={<CheckCircle />}
  />
  <MetricCard
    title="Tempo Médio Resposta"
    value={`${stats.avgResponseTime}h`}
    change="-8% vs. mês anterior"
    trend="down" // down é bom aqui
    icon={<Clock />}
  />
  <MetricCard
    title="Satisfação Cidadão"
    value={`${stats.citizenSatisfaction}/5`}
    change="+0.3 vs. mês anterior"
    trend="up"
    icon={<Star />}
  />
</div>
```

#### 3.3.3 Gráfico de Protocolos em Tempo Real
```tsx
<Card>
  <CardHeader>
    <CardTitle>Evolução de Protocolos - Últimos 30 Dias</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={protocolTrends}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="novos" stroke="#3b82f6" name="Novos" />
        <Line type="monotone" dataKey="concluidos" stroke="#22c55e" name="Concluídos" />
        <Line type="monotone" dataKey="pendentes" stroke="#f59e0b" name="Pendentes" />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

#### 3.3.4 Mapa Interativo de Demandas
```tsx
<Card>
  <CardHeader>
    <CardTitle>Mapa de Demandas por Região</CardTitle>
    <CardDescription>Protocolos geolocalizados no município</CardDescription>
  </CardHeader>
  <CardContent>
    <MapContainer
      center={[-22.7889, -50.2167]} // Palmital, SP
      zoom={13}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {protocols.map(protocol => (
        <Marker
          key={protocol.id}
          position={[protocol.latitude, protocol.longitude]}
        >
          <Popup>
            <div>
              <strong>#{protocol.number}</strong>
              <p>{protocol.title}</p>
              <Badge>{protocol.status}</Badge>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  </CardContent>
</Card>
```

#### 3.3.5 Performance por Secretaria
```tsx
<Card>
  <CardHeader>
    <CardTitle>Performance por Secretaria</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Secretaria</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Concluídos</TableHead>
          <TableHead>Pendentes</TableHead>
          <TableHead>Eficiência</TableHead>
          <TableHead>Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {departmentStats.map(dept => (
          <TableRow key={dept.id}>
            <TableCell className="font-medium">{dept.name}</TableCell>
            <TableCell>{dept.total}</TableCell>
            <TableCell className="text-green-600">{dept.completed}</TableCell>
            <TableCell className="text-orange-600">{dept.pending}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={dept.efficiency} className="w-24" />
                <span className="text-sm font-medium">{dept.efficiency}%</span>
              </div>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="outline" onClick={() => viewDepartmentDetails(dept.id)}>
                Ver Detalhes
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

#### 3.3.6 Alertas Críticos
```tsx
<Card className="border-red-200 bg-red-50">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-red-700">
      <AlertTriangle className="h-5 w-5" />
      Alertas Críticos
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {criticalAlerts.map(alert => (
        <Alert key={alert.id} variant="destructive">
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>
            {alert.description}
            <Button size="sm" variant="outline" className="mt-2">
              Resolver Agora
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  </CardContent>
</Card>
```

---

## 4. FUNCIONALIDADES EM TEMPO REAL

### 4.1 Atualização Automática

#### Estratégia: Polling com SWR
```tsx
import useSWR from 'swr'

export function useLiveStats() {
  const { data, error, mutate } = useSWR(
    '/api/admin/gabinete/painel-prefeito/stats',
    fetcher,
    {
      refreshInterval: 30000, // 30 segundos
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  return {
    stats: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}
```

#### Indicador de Atualização
```tsx
<Badge variant="destructive" className="animate-pulse">
  <Circle className="h-2 w-2 fill-current mr-1" />
  LIVE - Atualizado há {lastUpdate}s
</Badge>
```

### 4.2 WebSockets (Futuro)

Para eventos críticos em tempo real:
```tsx
const socket = useWebSocket('/ws/admin/gabinete')

socket.on('protocol:urgent', (protocol) => {
  toast({
    title: "⚠️ Novo Protocolo Urgente",
    description: `#${protocol.number} - ${protocol.title}`,
    variant: "destructive"
  })
  playNotificationSound()
})

socket.on('protocol:completed', (protocol) => {
  mutate('/api/admin/gabinete/painel-prefeito/stats')
})
```

### 4.3 Notificações Push

```tsx
// Service Worker para notificações do navegador
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('DigiUrban - Alerta', {
    body: 'Protocolo #2024-00123 ultrapassou o SLA',
    icon: '/logo.png',
    badge: '/badge.png'
  })
}
```

---

## 5. BUSCA DE CIDADÃOS E HISTÓRICO

### 5.1 Componente de Busca

```tsx
'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function CitizenSearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/citizens/search?q=${encodeURIComponent(searchQuery)}`,
        { credentials: 'include' }
      )
      const data = await response.json()
      setResults(data.data || [])
    } catch (error) {
      console.error('Erro ao buscar cidadão:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Buscar cidadão por nome ou CPF..."
            className="pl-10 h-12 text-lg"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              handleSearch(e.target.value)
              setOpen(true)
            }}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-gray-400" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhum cidadão encontrado.</CommandEmpty>
            <CommandGroup heading="Resultados">
              {results.map((citizen: any) => (
                <CommandItem
                  key={citizen.id}
                  onSelect={() => {
                    setOpen(false)
                    window.location.href = `/admin/gabinete/painel-prefeito/cidadao/${citizen.id}`
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="font-medium">{citizen.name}</p>
                      <p className="text-sm text-gray-500">CPF: {citizen.cpf} | {citizen.email}</p>
                    </div>
                    <Badge variant={
                      citizen.verificationStatus === 'GOLD' ? 'default' :
                      citizen.verificationStatus === 'VERIFIED' ? 'secondary' : 'outline'
                    }>
                      {citizen.verificationStatus === 'GOLD' ? '⭐ Ouro' :
                       citizen.verificationStatus === 'VERIFIED' ? '🥈 Prata' : '🥉 Bronze'}
                    </Badge>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### 5.2 Página de Histórico do Cidadão

**URL**: `/admin/gabinete/painel-prefeito/cidadao/[id]`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, FileText, Users, Award, Calendar } from 'lucide-react'

export default function CitizenHistoryPage() {
  const params = useParams()
  const [citizen, setCitizen] = useState(null)
  const [protocols, setProtocols] = useState([])
  const [family, setFamily] = useState([])

  useEffect(() => {
    loadCitizenData()
  }, [params.id])

  const loadCitizenData = async () => {
    const response = await fetch(
      `/api/admin/citizens/${params.id}/details`,
      { credentials: 'include' }
    )
    const data = await response.json()
    setCitizen(data.data)
    setProtocols(data.data.protocols || [])
    setFamily(data.data.family || [])
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Cidadão */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold">
                {citizen?.name?.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-2xl">{citizen?.name}</CardTitle>
                <p className="text-sm text-gray-600">CPF: {citizen?.cpf}</p>
                <p className="text-sm text-gray-600">Email: {citizen?.email}</p>
                <p className="text-sm text-gray-600">Telefone: {citizen?.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={
                citizen?.verificationStatus === 'GOLD' ? 'default' :
                citizen?.verificationStatus === 'VERIFIED' ? 'secondary' : 'outline'
              } className="text-lg px-4 py-2">
                {citizen?.verificationStatus === 'GOLD' ? '⭐ Cidadão Ouro' :
                 citizen?.verificationStatus === 'VERIFIED' ? '🥈 Cidadão Prata' : '🥉 Cidadão Bronze'}
              </Badge>
              <p className="text-sm text-gray-500 mt-2">
                Cadastrado em {new Date(citizen?.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Protocolos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="text-3xl font-bold">{protocols.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-8 w-8 text-green-600" />
              <span className="text-3xl font-bold text-green-600">
                {protocols.filter(p => p.status === 'CONCLUIDO').length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-orange-600" />
              <span className="text-3xl font-bold text-orange-600">
                {protocols.filter(p => p.status !== 'CONCLUIDO' && p.status !== 'CANCELADO').length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Membros da Família</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-purple-600" />
              <span className="text-3xl font-bold text-purple-600">{family.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Conteúdo */}
      <Tabs defaultValue="protocols" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="protocols">Histórico de Protocolos</TabsTrigger>
          <TabsTrigger value="family">Composição Familiar</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="protocols" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Protocolos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {protocols.map(protocol => (
                  <div key={protocol.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <a
                          href={`/admin/protocolos/${protocol.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          #{protocol.number}
                        </a>
                        <p className="text-sm text-gray-600 mt-1">{protocol.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {protocol.service?.name} - {protocol.department?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge>{protocol.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(protocol.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family">
          <Card>
            <CardHeader>
              <CardTitle>Membros da Família</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Lista de familiares */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Timeline cronológica */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 6. ARQUITETURA TÉCNICA

### 6.1 Stack Tecnológica

#### Frontend:
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **Gráficos**: Recharts ou Chart.js
- **Mapas**: Leaflet + React-Leaflet
- **Estado**: SWR para cache e revalidação
- **Ícones**: Lucide React

#### Backend:
- **Runtime**: Node.js + Express
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (httpOnly cookies)
- **Cache**: Redis (futuro)

### 6.2 Endpoints da API

#### Novos Endpoints Necessários:

```typescript
// Estatísticas do Painel do Prefeito
GET /api/admin/gabinete/painel-prefeito/stats
Response: {
  totalActive: number
  completionRate: number
  avgResponseTime: number
  citizenSatisfaction: number
  monthComparison: {
    current: { ... },
    previous: { ... },
    change: { ... }
  }
}

// Tendências (30 dias)
GET /api/admin/gabinete/painel-prefeito/trends
Response: {
  daily: Array<{
    date: string
    novos: number
    concluidos: number
    pendentes: number
  }>
}

// Performance por Secretaria
GET /api/admin/gabinete/painel-prefeito/departments-performance
Response: {
  departments: Array<{
    id: string
    name: string
    total: number
    completed: number
    pending: number
    efficiency: number
    avgResponseTime: number
  }>
}

// Alertas Críticos
GET /api/admin/gabinete/painel-prefeito/critical-alerts
Response: {
  alerts: Array<{
    id: string
    type: 'OVERDUE' | 'URGENT' | 'UNASSIGNED' | 'SLA_BREACH'
    title: string
    description: string
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    protocols: Array<Protocol>
  }>
}

// Top Servidores
GET /api/admin/gabinete/painel-prefeito/top-servers
Response: {
  servers: Array<{
    id: string
    name: string
    completionRate: number
    totalCompleted: number
    avgResponseTime: number
  }>
}

// Histórico Completo do Cidadão
GET /api/admin/citizens/:id/complete-history
Response: {
  citizen: Citizen
  protocols: Protocol[]
  family: FamilyComposition[]
  documents: CitizenDocument[]
  timeline: Array<{
    date: string
    event: string
    type: string
    metadata: any
  }>
}
```

### 6.3 Estrutura de Arquivos

```
digiurban/frontend/
├── app/admin/gabinete/
│   ├── painel-prefeito/
│   │   ├── page.tsx                    # Dashboard principal
│   │   ├── layout.tsx
│   │   └── cidadao/
│   │       └── [id]/
│   │           └── page.tsx            # Histórico do cidadão
│   ├── agenda/
│   │   └── page.tsx                    # Agenda (existente)
│   └── mapa-demandas/
│       └── page.tsx                    # Mapa (existente)
│
├── components/admin/gabinete/
│   ├── CitizenSearchBar.tsx            # Busca de cidadãos
│   ├── LiveStatsCards.tsx              # Cards de métricas
│   ├── ProtocolTrendsChart.tsx         # Gráfico de tendências
│   ├── DemandMap.tsx                   # Mapa Leaflet
│   ├── DepartmentPerformanceTable.tsx  # Tabela de secretarias
│   ├── CriticalAlerts.tsx              # Alertas críticos
│   ├── TopServersCard.tsx              # Top servidores
│   ├── ComparisonMetrics.tsx           # Comparativo mensal
│   └── CitizenHistoryView.tsx          # Visualização de histórico
│
└── lib/services/
    └── painel-prefeito.service.ts      # Serviço HTTP

digiurban/backend/
└── src/routes/
    ├── admin-gabinete-painel.ts        # Novos endpoints
    └── admin-gabinete.ts               # Endpoints existentes
```

---

## 7. PLANO DE IMPLEMENTAÇÃO

### 7.1 Fase 1: Fundação (Sprint 1 - 1 semana)

#### Objetivos:
- ✅ Criar estrutura de páginas e rotas
- ✅ Implementar busca de cidadãos
- ✅ Configurar endpoints básicos da API

#### Tarefas:
1. **Frontend**:
   - [ ] Criar `/admin/gabinete/painel-prefeito/page.tsx`
   - [ ] Criar `/admin/gabinete/painel-prefeito/cidadao/[id]/page.tsx`
   - [ ] Implementar `CitizenSearchBar` component
   - [ ] Criar layout base com header e grid

2. **Backend**:
   - [ ] Criar `/src/routes/admin-gabinete-painel.ts`
   - [ ] Endpoint: `GET /api/admin/gabinete/painel-prefeito/stats`
   - [ ] Endpoint: `GET /api/admin/citizens/:id/complete-history`
   - [ ] Endpoint: `GET /api/admin/citizens/search` (já existe, validar)

3. **Testes**:
   - [ ] Testar busca de cidadãos
   - [ ] Validar permissões ADMIN
   - [ ] Verificar dados retornados

**Entregável**: Página básica com busca funcional + histórico de cidadão

---

### 7.2 Fase 2: Métricas e Gráficos (Sprint 2 - 1 semana)

#### Objetivos:
- ✅ Implementar cards de métricas em tempo real
- ✅ Criar gráfico de tendências
- ✅ Comparativo mensal

#### Tarefas:
1. **Frontend**:
   - [ ] Criar `LiveStatsCards` com SWR (auto-refresh 30s)
   - [ ] Implementar `ProtocolTrendsChart` com Recharts
   - [ ] Criar `ComparisonMetrics` component
   - [ ] Adicionar indicador "LIVE"

2. **Backend**:
   - [ ] Endpoint: `GET /api/admin/gabinete/painel-prefeito/trends`
   - [ ] Lógica de comparação mensal (SQL/Prisma)
   - [ ] Otimização de queries com índices

3. **Testes**:
   - [ ] Validar cálculos de métricas
   - [ ] Testar performance com 10k+ protocolos
   - [ ] Verificar auto-refresh

**Entregável**: Dashboard com métricas dinâmicas e gráficos

---

### 7.3 Fase 3: Mapa e Geolocalização (Sprint 3 - 1 semana)

#### Objetivos:
- ✅ Implementar mapa interativo com Leaflet
- ✅ Markers de protocolos por status
- ✅ Clusters para alta densidade

#### Tarefas:
1. **Frontend**:
   - [ ] Instalar `leaflet` e `react-leaflet`
   - [ ] Criar `DemandMap` component
   - [ ] Implementar markers coloridos por status
   - [ ] Adicionar popups com detalhes do protocolo
   - [ ] Implementar marker clusters

2. **Backend**:
   - [ ] Validar endpoint `/api/admin/gabinete/mapa-demandas/protocols` (já existe)
   - [ ] Adicionar filtro de bounding box (otimização)

3. **Testes**:
   - [ ] Testar com 1000+ protocolos geolocalizados
   - [ ] Validar performance do mapa
   - [ ] Verificar clusters

**Entregável**: Mapa interativo funcional

---

### 7.4 Fase 4: Performance e Alertas (Sprint 4 - 1 semana)

#### Objetivos:
- ✅ Tabela de performance por secretaria
- ✅ Sistema de alertas críticos
- ✅ Top 5 servidores

#### Tarefas:
1. **Frontend**:
   - [ ] Criar `DepartmentPerformanceTable`
   - [ ] Implementar `CriticalAlerts` com badges
   - [ ] Criar `TopServersCard`
   - [ ] Adicionar modais de detalhes

2. **Backend**:
   - [ ] Endpoint: `GET /api/admin/gabinete/painel-prefeito/departments-performance`
   - [ ] Endpoint: `GET /api/admin/gabinete/painel-prefeito/critical-alerts`
   - [ ] Endpoint: `GET /api/admin/gabinete/painel-prefeito/top-servers`
   - [ ] Lógica de cálculo de eficiência

3. **Testes**:
   - [ ] Validar cálculos de performance
   - [ ] Testar detecção de alertas
   - [ ] Verificar ranking de servidores

**Entregável**: Sistema completo de performance e alertas

---

### 7.5 Fase 5: Integração e Otimização (Sprint 5 - 1 semana)

#### Objetivos:
- ✅ Integrar agenda executiva ao painel
- ✅ Otimizar performance
- ✅ Implementar cache
- ✅ Testes end-to-end

#### Tarefas:
1. **Frontend**:
   - [ ] Integrar "Agenda Hoje" ao painel
   - [ ] Otimizar re-renders
   - [ ] Implementar skeleton loaders
   - [ ] Adicionar transições suaves

2. **Backend**:
   - [ ] Implementar cache Redis (opcional)
   - [ ] Otimizar queries com `select` e `include`
   - [ ] Adicionar índices no Prisma
   - [ ] Implementar rate limiting

3. **Testes**:
   - [ ] Testes E2E com Playwright
   - [ ] Testes de carga (k6 ou Artillery)
   - [ ] Validação de acessibilidade (WCAG)

4. **Documentação**:
   - [ ] README do painel
   - [ ] Guia de uso para o prefeito
   - [ ] Documentação da API

**Entregável**: Sistema completo, otimizado e documentado

---

### 7.6 Fase 6: Funcionalidades Avançadas (Sprint 6+ - Futuro)

#### Objetivos:
- 🚀 WebSockets para tempo real
- 🚀 Notificações push
- 🚀 Exportação de relatórios
- 🚀 IA para insights

#### Tarefas Futuras:
1. **WebSockets**:
   - [ ] Configurar Socket.io no backend
   - [ ] Eventos: `protocol:urgent`, `protocol:completed`, `alert:critical`
   - [ ] Conectar frontend ao WebSocket

2. **Notificações Push**:
   - [ ] Service Worker
   - [ ] Push API do navegador
   - [ ] Firebase Cloud Messaging (opcional)

3. **Relatórios Executivos**:
   - [ ] Botão "Exportar para PDF"
   - [ ] Geração de relatório semanal automático
   - [ ] Email com resumo executivo

4. **Inteligência Artificial**:
   - [ ] Previsão de demanda (ML)
   - [ ] Detecção de anomalias
   - [ ] Sugestões automáticas de alocação

---

## 8. ESTIMATIVAS E RECURSOS

### 8.1 Tempo Total Estimado

| Fase | Duração | Esforço (dev hours) |
|------|---------|---------------------|
| Fase 1: Fundação | 5 dias | 40h |
| Fase 2: Métricas | 5 dias | 40h |
| Fase 3: Mapa | 5 dias | 32h |
| Fase 4: Performance | 5 dias | 40h |
| Fase 5: Integração | 5 dias | 32h |
| **TOTAL** | **25 dias (5 semanas)** | **184h** |

### 8.2 Recursos Necessários

- **Desenvolvedores**: 1 fullstack ou 1 frontend + 1 backend
- **Designer**: Opcional (usar shadcn/ui)
- **QA**: Testes manuais + E2E

### 8.3 Dependências

- ✅ Prisma schema já configurado
- ✅ Autenticação JWT funcional
- ✅ Sistema de permissões implementado
- ⚠️ Leaflet (instalar: `npm install leaflet react-leaflet`)
- ⚠️ Recharts (instalar: `npm install recharts`)
- ⚠️ SWR (instalar: `npm install swr`)

---

## 9. RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Performance com muitos protocolos | Média | Alto | Implementar paginação, cache, índices |
| Latência do mapa | Baixa | Médio | Usar marker clusters, lazy loading |
| Complexidade do histórico | Baixa | Baixo | Simplificar timeline inicial |
| Mudança de requisitos | Média | Médio | Desenvolver em sprints, validar com stakeholders |

---

## 10. CRITÉRIOS DE SUCESSO

### 10.1 Métricas Técnicas
- ✅ Tempo de carregamento < 2 segundos
- ✅ Atualização automática a cada 30 segundos
- ✅ Suporte a 10.000+ protocolos sem degradação
- ✅ 99.9% uptime

### 10.2 Métricas de Negócio
- ✅ Redução de 30% no tempo de tomada de decisão
- ✅ Aumento de 50% na visibilidade de gargalos
- ✅ 100% dos alertas críticos visíveis em tempo real
- ✅ Satisfação do usuário (prefeito) > 9/10

---

## 11. PRÓXIMOS PASSOS

### Imediatos (Antes de Começar):
1. ✅ **Aprovar proposta** com stakeholders
2. ✅ **Definir prioridades**: Quais fases são MVP?
3. ✅ **Alocar recursos**: Desenvolvedores disponíveis?
4. ✅ **Configurar ambiente**: Instalar dependências

### Sprint 1 (Semana 1):
1. Criar branch: `feature/painel-prefeito`
2. Implementar Fase 1 (Fundação)
3. Code review + testes
4. Demo com stakeholders

### Evolução Contínua:
- Coletar feedback do prefeito a cada sprint
- Ajustar prioridades conforme necessidade
- Adicionar funcionalidades incrementalmente

---

## 12. CONCLUSÃO

O **Painel do Prefeito** será a ferramenta central de gestão municipal, oferecendo:

- 📊 **Visão 360°** de todos os protocolos e departamentos
- 🔍 **Busca Rápida** de cidadãos com histórico completo
- ⏱️ **Tempo Real** com atualização automática
- 🗺️ **Geolocalização** para análise territorial
- 🎯 **Alertas Críticos** para ação imediata
- 📈 **Métricas de Performance** para accountability

Com uma implementação em **5 sprints (25 dias úteis)**, o DigiUrban terá uma ferramenta de classe mundial para gestão pública moderna.

**Aguardando suas instruções para prosseguir!** 🚀
