# ANÁLISE COMPLETA DO MÓDULO "GABINETE DO PREFEITO" - DIGIURBAN

## SUMÁRIO EXECUTIVO

O módulo **Gabinete do Prefeito** é um subsistema administrativo especializado do DigiUrban, destinado exclusivamente a usuários com role **ADMIN**. Ele oferece ferramentas estratégicas para gestão executiva municipal, com foco em:

1. **Agenda Executiva** - Gerenciamento de compromissos, audiências e eventos oficiais
2. **Mapa de Demandas** - Visualização geoespacial de protocolos e demandas municipais

---

## 1. ESTRUTURA DE DIRETÓRIOS

### 1.1 FRONTEND

```
/home/user/Digiurbanlite/digiurban/frontend/
├── app/admin/gabinete/
│   ├── page.tsx                    (Dashboard principal do Gabinete)
│   ├── agenda/
│   │   └── page.tsx               (Listagem e gestão de eventos)
│   └── mapa-demandas/
│       └── page.tsx               (Visualização de protocolos geolocalizados)
│
└── lib/services/
    └── gabinete.service.ts        (Serviços HTTP para comunicação com backend)
```

### 1.2 BACKEND

```
/home/user/Digiurbanlite/digiurban/backend/
├── src/
│   ├── routes/
│   │   └── admin-gabinete.ts      (Endpoints REST da API)
│   ├── middleware/
│   │   └── admin-auth.ts          (Autenticação e autorização)
│   └── lib/
│       └── prisma.ts              (Cliente Prisma para BD)
│
└── prisma/
    └── schema.prisma              (Modelo de dados - AgendaEvent)
```

---

## 2. PÁGINAS E COMPONENTES FRONTEND

### 2.1 Dashboard Principal: `/admin/gabinete`
**Arquivo**: `/home/user/Digiurbanlite/digiurban/frontend/app/admin/gabinete/page.tsx`

**Características**:
- Página inicial do módulo Gabinete do Prefeito
- Apresentação de dois cards principais de navegação
- Restrito apenas a usuários com role `ADMIN`
- Componentes UI: Card, CardContent, CardDescription, CardHeader, CardTitle

**Seções**:
1. **Header**: Título "Gabinete do Prefeito" com descrição
2. **Card - Agenda Executiva**: 
   - Link: `/admin/gabinete/agenda`
   - Ícone: Calendar (lucide-react)
   - Descrição: Gerencie compromissos oficiais, audiências públicas e eventos
   - Features:
     - Calendário de compromissos
     - Audiências públicas
     - Reuniões externas
     - Eventos oficiais

3. **Card - Mapa de Demandas**:
   - Link: `/admin/gabinete/mapa-demandas`
   - Ícone: Map (lucide-react)
   - Descrição: Visualização geoespacial das solicitações municipais
   - Features:
     - Mapa de calor de demandas
     - Análise por região
     - Estatísticas territoriais
     - Indicadores por bairro

4. **Informações Adicionais**: Card explicativo sobre o propósito do módulo

### 2.2 Agenda Executiva: `/admin/gabinete/agenda`
**Arquivo**: `/home/user/Digiurbanlite/digiurban/frontend/app/admin/gabinete/agenda/page.tsx`

**Tamanho**: 151 linhas

**Características**:
- Cliente (use client)
- Gerenciamento completo de eventos da agenda
- Estados: eventos, loading
- Busca e filtro de eventos

**Funcionalidades Implementadas**:
1. **Listar Eventos**
   - GET `/admin/gabinete/agenda`
   - Filtros: startDate, endDate, tipo, status
   - Apresentação em cards com informações estruturadas

2. **Marcar como Realizado**
   - PATCH `/admin/gabinete/agenda/{id}/realize`
   - Botão com ícone Check
   - Status visual com cores (verde para realizado)

3. **Editar Evento**
   - Botão Edit (não totalmente implementado - apenas UI)
   - PUT `/admin/gabinete/agenda/{id}`

4. **Deletar Evento**
   - DELETE `/admin/gabinete/agenda/{id}`
   - Confirmação antes de deletar
   - Botão destructive (vermelho)

**Estrutura de Evento Exibida**:
```typescript
interface AgendaEvent {
  id: string
  titulo: string
  tipo: string
  dataHoraInicio: Date | string
  dataHoraFim: Date | string
  descricao?: string
  local?: string
  participantes?: string
  status: string // AGENDADO, CONFIRMADO, REALIZADO, CANCELADO
  observacoes?: string
  createdBy?: { name, email }
}
```

**Status Visuais**:
- REALIZADO: bg-green-100, text-green-800
- CONFIRMADO: bg-blue-100, text-blue-800
- CANCELADO: bg-red-100, text-red-800
- Padrão (AGENDADO): bg-yellow-100, text-yellow-800

### 2.3 Mapa de Demandas: `/admin/gabinete/mapa-demandas`
**Arquivo**: `/home/user/Digiurbanlite/digiurban/frontend/app/admin/gabinete/mapa-demandas/page.tsx`

**Tamanho**: 148 linhas

**Características**:
- Cliente (use client)
- Exibição de protocolos com geolocalização
- Estatísticas agregadas
- Layout de 3 colunas com métricas

**Funcionalidades**:
1. **Buscar Protocolos Geolocalizados**
   - GET `/admin/gabinete/mapa-demandas/protocols`
   - Filtros: categoria, status, startDate, endDate
   - Busca apenas protocolos com latitude/longitude

2. **Obter Estatísticas**
   - GET `/admin/gabinete/mapa-demandas/stats`
   - Total com localização
   - Agrupamento por status
   - Agrupamento por categoria

**Métricas Exibidas**:
1. **Total com Localização**: Contagem de protocolos geolocalizados
2. **Protocolos no Mapa**: Quantidade de registros retornados
3. **Categorias**: Quantidade de categorias únicas

**Cards de Protocolo**:
- Número e título
- Endereço (ou latitude/longitude)
- Serviço e departamento
- Status com cores:
  - CONCLUIDO: verde
  - PROGRESSO: azul
  - Padrão: amarelo

**Nota**: O mapa interativo com Leaflet é planejado mas ainda não implementado

---

## 3. API E ROTAS BACKEND

### 3.1 Arquivo Principal de Rotas
**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/routes/admin-gabinete.ts`

**Tamanho**: 378 linhas

**Estrutura Geral**:
```
POST   /admin/gabinete/agenda              - Criar evento
GET    /admin/gabinete/agenda              - Listar eventos com filtros
GET    /admin/gabinete/agenda/:id          - Obter evento específico
PUT    /admin/gabinete/agenda/:id          - Atualizar evento
DELETE /admin/gabinete/agenda/:id          - Deletar evento
PATCH  /admin/gabinete/agenda/:id/realize  - Marcar como realizado

GET    /admin/gabinete/mapa-demandas/protocols - Buscar protocolos com localização
GET    /admin/gabinete/mapa-demandas/stats     - Obter estatísticas
```

### 3.2 ENDPOINTS DETALHADOS

#### 3.2.1 AGENDA EXECUTIVA

##### GET `/admin/gabinete/agenda`
**Descrição**: Listar todos os eventos com filtros opcionais

**Middlewares**: 
- `adminAuthMiddleware` (autenticação)
- `requireAdmin` (autorização)

**Query Parameters**:
```typescript
{
  startDate?: string    // ISO date - data inicial (gte)
  endDate?: string      // ISO date - data final (lte)
  tipo?: string         // Tipo do evento
  status?: string       // Status: AGENDADO, CONFIRMADO, REALIZADO, CANCELADO
}
```

**Resposta**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "tipo": "string",
      "titulo": "string",
      "descricao": "string|null",
      "dataHoraInicio": "DateTime",
      "dataHoraFim": "DateTime",
      "local": "string|null",
      "participantes": "string|null",
      "status": "string",
      "observacoes": "string|null",
      "anexos": "string|null",
      "createdById": "string",
      "createdAt": "DateTime",
      "updatedAt": "DateTime",
      "createdBy": {
        "id": "string",
        "name": "string",
        "email": "string"
      }
    }
  ]
}
```

**Ordenação**: `dataHoraInicio ASC`

---

##### GET `/admin/gabinete/agenda/:id`
**Descrição**: Obter um evento específico pelo ID

**Path Parameters**:
- `id`: string (ID do evento)

**Resposta**:
```json
{
  "success": true,
  "data": { /* evento completo */ }
}
```

**Erros**:
- 404: Evento não encontrado

---

##### POST `/admin/gabinete/agenda`
**Descrição**: Criar novo evento na agenda

**Body**:
```json
{
  "tipo": "string (required)",
  "titulo": "string (required)",
  "descricao": "string|null",
  "dataHoraInicio": "DateTime (required)",
  "dataHoraFim": "DateTime (required)",
  "local": "string|null",
  "participantes": "string|null",
  "observacoes": "string|null",
  "anexos": "Array<string>|null"
}
```

**Validações**:
- tipo, titulo, dataHoraInicio, dataHoraFim são obrigatórios
- Anexos são convertidos para JSON string para armazenamento

**Resposta**: 201 Created
```json
{
  "success": true,
  "data": { /* evento criado */ }
}
```

**Automático**:
- status: "AGENDADO" (padrão)
- createdById: ID do usuário autenticado
- createdAt, updatedAt: timestamps

---

##### PUT `/admin/gabinete/agenda/:id`
**Descrição**: Atualizar evento existente

**Path Parameters**:
- `id`: string (ID do evento)

**Body**: (todos os campos são opcionais)
```json
{
  "tipo": "string",
  "titulo": "string",
  "descricao": "string",
  "dataHoraInicio": "DateTime",
  "dataHoraFim": "DateTime",
  "local": "string",
  "participantes": "string",
  "status": "string",
  "observacoes": "string",
  "anexos": "Array<string>"
}
```

**Lógica**:
- Utiliza operador spread (`...`) para apenas incluir campos não-null
- Valida se evento existe antes de atualizar

**Resposta**: 200 OK
```json
{
  "success": true,
  "data": { /* evento atualizado */ }
}
```

---

##### DELETE `/admin/gabinete/agenda/:id`
**Descrição**: Deletar evento

**Path Parameters**:
- `id`: string (ID do evento)

**Validação**: Verifica existência antes de deletar

**Resposta**: 200 OK
```json
{
  "success": true,
  "message": "Evento excluído com sucesso"
}
```

**Erro**: 404 se evento não existe

---

##### PATCH `/admin/gabinete/agenda/:id/realize`
**Descrição**: Marcar evento como realizado

**Path Parameters**:
- `id`: string (ID do evento)

**Behavior**:
- Atualiza `status` para "REALIZADO"
- Verifica existência do evento antes

**Resposta**: 200 OK
```json
{
  "success": true,
  "data": { /* evento com status REALIZADO */ }
}
```

---

#### 3.2.2 MAPA DE DEMANDAS

##### GET `/admin/gabinete/mapa-demandas/protocols`
**Descrição**: Buscar protocolos com geolocalização

**Query Parameters**:
```typescript
{
  categoria?: string        // Categoria do serviço
  status?: string          // Status do protocolo
  startDate?: string       // Data inicial
  endDate?: string         // Data final
}
```

**Filtros Sempre Aplicados**:
- `latitude NOT NULL`
- `longitude NOT NULL`

**Select/Retorno**:
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "number": "string",
      "title": "string",
      "status": "string",
      "latitude": "number",
      "longitude": "number",
      "address": "string|null",
      "createdAt": "DateTime",
      "service": {
        "name": "string",
        "category": "string"
      },
      "department": {
        "name": "string"
      },
      "citizen": {
        "name": "string"
      }
    }
  ]
}
```

**Ordenação**: `createdAt DESC`

---

##### GET `/admin/gabinete/mapa-demandas/stats`
**Descrição**: Obter estatísticas agregadas dos protocolos

**Resposta**:
```json
{
  "success": true,
  "data": {
    "totalWithLocation": 42,
    "byStatus": [
      {
        "status": "PROGRESSO",
        "_count": {
          "status": 15
        }
      },
      {
        "status": "CONCLUIDO",
        "_count": {
          "status": 27
        }
      }
    ],
    "byCategory": {
      "Saúde": 18,
      "Educação": 12,
      "Assistência Social": 8,
      "Obras": 4
    }
  }
}
```

**Cálculos**:
- `totalWithLocation`: Count de protocolos com latitude e longitude
- `byStatus`: GroupBy status com contagem
- `byCategory`: Agregação por categoria com tratamento de nulos

---

### 3.3 MIDDLEWARE DE AUTENTICAÇÃO

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/middleware/admin-auth.ts`

**Middleware Aplicado**: `adminAuthMiddleware`

**Middleware Personalizado no Gabinete**:
```typescript
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito ao Gabinete do Prefeito' })
    return
  }
  next()
}
```

**Autorização**:
- Apenas usuários com role `ADMIN` podem acessar
- Retorna 403 Forbidden para outros roles
- Usuário deve estar autenticado (validação do token JWT)

**Fluxo**:
1. adminAuthMiddleware extrai e valida token JWT
2. Busca usuário no banco de dados
3. Adiciona usuário à request
4. requireAdmin verifica se role === 'ADMIN'

---

## 4. MODELOS DE DADOS

### 4.1 AgendaEvent Schema (Prisma)

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma` (linhas 1413-1433)

```prisma
model AgendaEvent {
  id             String   @id @default(cuid())
  tipo           String
  titulo         String
  descricao      String?
  dataHoraInicio DateTime
  dataHoraFim    DateTime
  local          String?
  participantes  String?
  status         String   @default("AGENDADO")
  observacoes    String?
  anexos         String?           // JSON serializado
  createdById    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  createdBy      User     @relation("AgendaEventCreator", fields: [createdById], references: [id])

  @@index([dataHoraInicio])
  @@index([status])
  @@map("agenda_events")
}
```

**Tipos de Dados**:
| Campo | Tipo | Obrigatório | Default | Índice | Descrição |
|-------|------|------------|---------|--------|-----------|
| id | String (CUID) | Sim | gerado | PK | ID único |
| tipo | String | Sim | - | - | Tipo de evento |
| titulo | String | Sim | - | - | Título do evento |
| descricao | String | Não | NULL | - | Descrição detalhada |
| dataHoraInicio | DateTime | Sim | - | Sim | Início do evento |
| dataHoraFim | DateTime | Sim | - | - | Fim do evento |
| local | String | Não | NULL | - | Local do evento |
| participantes | String | Não | NULL | - | Lista de participantes |
| status | String | Sim | "AGENDADO" | Sim | Status do evento |
| observacoes | String | Não | NULL | - | Observações |
| anexos | String | Não | NULL | - | Arquivos (JSON) |
| createdById | String | Sim | - | FK | Quem criou |
| createdAt | DateTime | Sim | now() | - | Criação |
| updatedAt | DateTime | Sim | - | - | Última atualização |

**Relacionamentos**:
```
AgendaEvent.createdBy -> User.id (1:N)
  - Foreign Key: createdById
  - Relation: "AgendaEventCreaker"
  - Campos selecionados: id, name, email
```

**Índices**:
1. `dataHoraInicio` - Para filtro de data
2. `status` - Para filtro de status
3. Composite index `(createdById, dataHoraInicio)` seria útil mas não foi definido

**Possíveis Valores de Status**:
- AGENDADO (padrão)
- CONFIRMADO
- REALIZADO
- CANCELADO

---

### 4.2 Modelo ProtocolSimplified (Referenciado no Mapa)

Embora não seja exclusivo do Gabinete, é utilizado no Mapa de Demandas.

**Campos Relevantes**:
```prisma
model ProtocolSimplified {
  // Geolocalização
  latitude  Float?
  longitude Float?
  address   String?
  
  // Relacionamentos
  service    ServiceSimplified @relation(fields: [serviceId], references: [id])
  department Department        @relation(fields: [departmentId], references: [id])
  citizen    Citizen           @relation(fields: [citizenId], references: [id])
  createdBy  User?             @relation("CreatedByUserSimplified", fields: [createdById], references: [id])
  
  // Status
  status    ProtocolStatus @default(VINCULADO)
  createdAt DateTime       @default(now())
}
```

---

## 5. SERVIÇOS DISPONÍVEIS

### 5.1 Frontend Service: `gabinete.service.ts`

**Arquivo**: `/home/user/Digiurbanlite/digiurban/frontend/lib/services/gabinete.service.ts`

**Configuração**:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const tenant = 'cmhav73z00000cblg3uhyri24' // Single Tenant
const headers = {
  'Content-Type': 'application/json',
  'X-Tenant-ID': tenant
}
```

#### Serviço: `agendaService`

```typescript
agendaService = {
  async getEvents(filters?: { 
    startDate?: string
    endDate?: string
    tipo?: string
    status?: string 
  })
  // GET /admin/gabinete/agenda?params
  
  async getEventById(id: string)
  // GET /admin/gabinete/agenda/{id}
  
  async createEvent(data: AgendaEvent)
  // POST /admin/gabinete/agenda
  
  async updateEvent(id: string, data: Partial<AgendaEvent>)
  // PUT /admin/gabinete/agenda/{id}
  
  async deleteEvent(id: string)
  // DELETE /admin/gabinete/agenda/{id}
  
  async markAsRealized(id: string)
  // PATCH /admin/gabinete/agenda/{id}/realize
}
```

#### Serviço: `mapaDemandasService`

```typescript
mapaDemandasService = {
  async getProtocolsWithLocation(filters?: { 
    categoria?: string
    status?: string
    startDate?: string
    endDate?: string 
  })
  // GET /admin/gabinete/mapa-demandas/protocols?params
  
  async getStats()
  // GET /admin/gabinete/mapa-demandas/stats
}
```

**Tipos Definidos**:
```typescript
interface AgendaEvent {
  id?: string
  tipo: string
  titulo: string
  descricao?: string
  dataHoraInicio: Date | string
  dataHoraFim: Date | string
  local?: string
  participantes?: string
  status?: string
  observacoes?: string
  anexos?: string[]
}

interface Protocol {
  id: string
  number: string
  title: string
  status: string
  latitude: number
  longitude: number
  endereco?: string
  createdAt: string
  service?: { name: string; category: string }
  department?: { name: string }
  citizen?: { name: string }
}
```

---

### 5.2 Integração de Rotas

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/routes/index.ts` (linhas 106-127)

```typescript
export const loadAdminRoutes = () => {
  const router = Router()
  
  const adminGabineteRoutes = require('./admin-gabinete').default
  
  router.use('/admin/gabinete', adminGabineteRoutes)
  
  return router
}
```

---

## 6. NAVEGAÇÃO E INTEGRAÇÃO

### 6.1 Sidebar Navigation

**Arquivo**: `/home/user/Digiurbanlite/digiurban/frontend/components/admin/AdminSidebar.tsx` (linhas 128-142)

```typescript
{
  title: 'Gabinete do Prefeito',
  items: [
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
}
```

**Visibilidade**: Somente usuários com role >= `ADMIN` veem estas opções

---

## 7. RESUMO TÉCNICO

### Endpoints da API
```
/api/admin/gabinete/agenda
├── GET    - Listar com filtros
├── POST   - Criar novo
├── :id
│   ├── GET      - Obter um
│   ├── PUT      - Atualizar
│   ├── DELETE   - Deletar
│   └── /realize
│       └── PATCH - Marcar realizado

/api/admin/gabinete/mapa-demandas
├── /protocols
│   └── GET - Buscar protocolos geolocalizados
└── /stats
    └── GET - Estatísticas agregadas
```

### Arquivos-Chave
| Caminho | Tipo | Linhas | Descrição |
|---------|------|--------|-----------|
| backend/src/routes/admin-gabinete.ts | Router | 378 | Endpoints |
| frontend/lib/services/gabinete.service.ts | Service | 135 | Cliente HTTP |
| frontend/app/admin/gabinete/page.tsx | Page | 113 | Dashboard |
| frontend/app/admin/gabinete/agenda/page.tsx | Page | 151 | Agenda |
| frontend/app/admin/gabinete/mapa-demandas/page.tsx | Page | 148 | Mapa |
| backend/prisma/schema.prisma | Schema | - | Modelo AgendaEvent |

### Permissões Necessárias
- Role mínimo: `ADMIN`
- Função de usuário criador: Registrada para auditoria

