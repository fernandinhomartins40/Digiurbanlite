# Documentação Completa: Sistema de Cidadãos e Atendimentos - DigiUrban

## ÍNDICE
1. [Modelo de Dados de Cidadão](#1-modelo-de-dados-de-cidadão)
2. [Modelo de Atendimentos/Protocolos](#2-modelo-de-atendimentosprotocolos)
3. [APIs de Busca e Consulta](#3-apis-de-busca-e-consulta)
4. [Estrutura de Permissões](#4-estrutura-de-permissões)

---

## 1. MODELO DE DADOS DE CIDADÃO

### 1.1 Schema do Prisma - Tabela `Citizen`

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma` (linhas 108-147)

#### Campos Principais

```prisma
model Citizen {
  id                  String             @id @default(cuid())
  cpf                 String             @unique        // Chave única
  name                String
  email               String
  phone               String?
  birthDate           DateTime?
  
  // Endereço (JSON flexível)
  address             Json?
  
  // Dados complementares
  rg                  String?
  phoneSecondary      String?
  motherName          String?
  maritalStatus       String?
  occupation          String?
  familyIncome        String?
  
  // Segurança e Autenticação
  password            String
  isActive            Boolean            @default(true)
  failedLoginAttempts Int                @default(0)
  lockedUntil         DateTime?
  
  // Verificação (3 níveis: Bronze, Prata, Ouro)
  verificationStatus  VerificationStatus @default(PENDING)
  verifiedAt          DateTime?
  verifiedBy          String?
  verificationNotes   String?
  registrationSource  String             @default("SELF")
  
  // Timestamps
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  lastLogin           DateTime?
  
  // Relacionamentos
  protocolsSimplified ProtocolSimplified[]
  familyAsHead        FamilyComposition[]      @relation("FamilyHead")
  familyAsMember      FamilyComposition[]      @relation("FamilyMember")
  notifications       Notification[]
  documents           CitizenDocument[]        @relation("CitizenDocuments")
  auditLogs           AuditLog[]
  transferRequests    CitizenTransferRequest[]
}

// Enum de Status de Verificação
enum VerificationStatus {
  PENDING    // Bronze: Cadastro novo, pendente validação
  VERIFIED   // Prata: Cadastro validado pelo admin
  GOLD       // Ouro: Cadastro completo com documentação extra
  REJECTED   // Rejeitado
}
```

#### Estrutura de Endereço (JSON)
```json
{
  "cep": "12345-678",
  "logradouro": "Rua das Flores",
  "numero": "123",
  "complemento": "Apt 456",
  "bairro": "Centro",
  "cidade": "Palmital",
  "uf": "SP",
  "pontoReferencia": "Próximo ao parque"
}
```

### 1.2 Documentos do Cidadão

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma` (linhas 152-175)

```prisma
model CitizenDocument {
  id              String               @id @default(cuid())
  citizenId       String
  documentType    String               // RG, CPF, Comprovante Residência
  fileName        String
  filePath        String
  fileSize        Int
  mimeType        String
  status          DocumentStatus       @default(PENDING)
  notes           String?
  uploadedAt      DateTime             @default(now())
  reviewedBy      String?
  reviewedAt      DateTime?
  rejectionReason String?
  
  citizen         Citizen              @relation("CitizenDocuments")
  
  @@index([citizenId])
  @@index([status])
}

enum DocumentStatus {
  PENDING      // Aguardando revisão
  UPLOADED     // Enviado
  UNDER_REVIEW // Sob análise
  APPROVED     // Aprovado
  REJECTED     // Rejeitado
  EXPIRED      // Expirado
}
```

### 1.3 Composição Familiar

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma` (linhas 212-232)

```prisma
model FamilyComposition {
  id            String               @id @default(cuid())
  headId        String               // Responsável
  memberId      String               // Membro da família
  relationship  FamilyRelationship
  isDependent   Boolean              @default(false)
  
  // Sprint 2 - Dados complementares
  monthlyIncome Decimal?
  occupation    String?
  education     String?
  hasDisability Boolean?
  
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
  
  member        Citizen              @relation("FamilyMember")
  head          Citizen              @relation("FamilyHead")
  
  @@unique([headId, memberId])
}

enum FamilyRelationship {
  SPOUSE, SON, DAUGHTER, FATHER, MOTHER, BROTHER, SISTER
  GRANDFATHER, GRANDMOTHER, GRANDSON, GRANDDAUGHTER, OTHER
}
```

---

## 2. MODELO DE ATENDIMENTOS/PROTOCOLOS

### 2.1 Protocolo Simplificado

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma` (linhas 274-332)

```prisma
model ProtocolSimplified {
  id          String         @id @default(cuid())
  number      String         @unique    // Ex: 2024-00001
  title       String
  description String?
  status      ProtocolStatus @default(VINCULADO)
  priority    Int            @default(3)
  
  // Relacionamentos principais
  citizenId    String
  serviceId    String
  departmentId String
  
  // Dados capturados (para serviços COM_DADOS)
  customData  Json?          // Dados estruturados do formulário
  moduleType  String?        // ATENDIMENTOS_SAUDE, MATRICULA_ALUNO, etc
  
  // Geolocalização
  latitude    Float?
  longitude   Float?
  address     String?
  
  // Documentos e Anexos
  documents   Json?
  attachments String?
  
  // Gestão
  assignedUserId String?
  createdById    String?
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  dueDate     DateTime?
  concludedAt DateTime?
  
  // Relacionamentos
  citizen      Citizen                           @relation(fields: [citizenId])
  service      ServiceSimplified                 @relation(fields: [serviceId])
  department   Department                        @relation(fields: [departmentId])
  assignedUser User?                             @relation("AssignedUserSimplified")
  createdBy    User?                             @relation("CreatedByUserSimplified")
  
  // Sistema de rastreamento
  history      ProtocolHistorySimplified[]
  evaluations  ProtocolEvaluationSimplified[]
  interactions ProtocolInteraction[]
  documentFiles ProtocolDocument[]
  pendings     ProtocolPending[]
  stages       ProtocolStage[]
  sla          ProtocolSLA?
  
  @@index([status])
  @@index([createdAt])
  @@index([moduleType, status])
  @@index([departmentId, status])
  @@index([citizenId])
}

enum ProtocolStatus {
  VINCULADO    // Novo, vinculado ao sistema
  PROGRESSO    // Em andamento
  ATUALIZACAO  // Aguardando atualização
  CONCLUIDO    // Finalizado
  PENDENCIA    // Tem pendência
  CANCELADO    // Cancelado
}
```

### 2.2 Histórico de Protocolos

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma` (linhas 334-348)

```prisma
model ProtocolHistorySimplified {
  id         String   @id @default(cuid())
  action     String   // "Protocolo criado", "Status atualizado"
  comment    String?
  oldStatus  String?
  newStatus  String?
  metadata   Json?
  timestamp  DateTime @default(now())
  userId     String?
  protocolId String
  
  protocol ProtocolSimplified @relation(fields: [protocolId])
  
  @@map("protocol_history_simplified")
}
```

### 2.3 Interações (Mensagens)

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma` (linhas 367-396)

```prisma
model ProtocolInteraction {
  id         String          @id @default(cuid())
  protocolId String
  type       InteractionType
  
  // Autor
  authorType String // CITIZEN, SERVER, SYSTEM
  authorId   String?
  authorName String
  
  // Conteúdo
  message    String?
  metadata   Json?
  
  // Visibilidade
  isInternal Boolean   @default(false) // Visível apenas para servidores
  isRead     Boolean   @default(false)
  readAt     DateTime?
  
  // Anexos
  attachments Json?
  
  createdAt DateTime @default(now())
  
  protocol ProtocolSimplified @relation(fields: [protocolId])
  
  @@index([protocolId, createdAt])
  @@index([protocolId])
}

enum InteractionType {
  MESSAGE
  DOCUMENT_REQUEST
  DOCUMENT_UPLOAD
  PENDING_CREATED
  PENDING_RESOLVED
  STATUS_CHANGED
  ASSIGNED
  INSPECTION_SCHEDULED
  INSPECTION_COMPLETED
  APPROVAL
  REJECTION
  CANCELLATION
  NOTE
}
```

### 2.4 Sistema de Pendências

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma` (linhas 470-524)

```prisma
model ProtocolPending {
  id         String @id @default(cuid())
  protocolId String
  
  // Tipo e descrição
  type        PendingType
  title       String
  description String
  
  // Prazo
  dueDate DateTime?
  
  // Status
  status     PendingStatus @default(OPEN)
  resolvedAt DateTime?
  resolvedBy String?
  resolution String?
  
  // Bloqueio
  blocksProgress Boolean @default(true)
  
  // Metadados
  metadata Json?
  
  // Criação
  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  protocol ProtocolSimplified @relation(fields: [protocolId])
  
  @@index([protocolId, status])
}

enum PendingType {
  DOCUMENT    // Documentação
  INFORMATION // Informação
  CORRECTION  // Correção
  VALIDATION  // Validação
  PAYMENT     // Pagamento
  INSPECTION  // Inspeção
  APPROVAL    // Aprovação
  OTHER
}

enum PendingStatus {
  OPEN        // Aberta
  IN_PROGRESS // Em andamento
  RESOLVED    // Resolvida
  EXPIRED     // Expirada
  CANCELLED   // Cancelada
}
```

---

## 3. APIs DE BUSCA E CONSULTA

### 3.1 APIs de Cidadão

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/routes/admin-citizens.ts`

#### GET /api/admin/citizens/search - Buscar cidadão por nome/CPF
```typescript
GET /api/admin/citizens/search?q=João&cpf=12345678900

// Resposta
{
  "success": true,
  "data": [
    {
      "id": "cuid1",
      "name": "João Silva",
      "cpf": "12345678900",
      "email": "joao@email.com",
      "phone": "11999999999",
      "address": {...},
      "birthDate": "1990-05-15T00:00:00.000Z",
      "verificationStatus": "PENDING" | "VERIFIED" | "GOLD" | "REJECTED",
      "registrationSource": "SELF" | "ADMIN"
    }
  ]
}
```

#### GET /api/admin/citizens - Listar cidadãos com paginação
```typescript
GET /api/admin/citizens?page=1&limit=50&status=VERIFIED&search=João

Filtros disponíveis:
- page: número da página (padrão: 1)
- limit: itens por página (padrão: 50)
- status: PENDING, VERIFIED, GOLD, REJECTED
- search: nome, CPF ou email
```

#### GET /api/admin/citizens/:id - Detalhes do cidadão
```typescript
GET /api/admin/citizens/cuid1

Inclui:
- Protocolos do cidadão (últimos 10)
- Composição familiar (cabeça e membros)
- Contagem: protocolos, familiares, notificações, documentos
```

#### GET /api/admin/citizens/:id/details - Detalhes completos
```typescript
GET /api/admin/citizens/cuid1/details

Inclui:
- Composição familiar completa
- Últimos 10 protocolos com serviço e departamento
- Documentos com status (PENDING, APPROVED, REJECTED, etc)
- Contadores de relacionamentos
```

#### POST /api/admin/citizens - Criar cidadão (administrativo)
```typescript
POST /api/admin/citizens
{
  "cpf": "12345678900",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "birthDate": "1990-05-15",
  "password": "Senha@123456",
  "address": {
    "cep": "12345-678",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "bairro": "Centro",
    "cidade": "Palmital",
    "uf": "SP"
  }
}

// Status criado: VERIFIED (Prata)
```

#### PUT /api/admin/citizens/:id/verify - Aprovar cidadão (Bronze → Prata)
```typescript
PUT /api/admin/citizens/cuid1/verify
{
  "notes": "Documentação validada"
}

// Status: VERIFIED (Prata)
```

#### PUT /api/admin/citizens/:id/promote-gold - Promover (Prata → Ouro)
```typescript
PUT /api/admin/citizens/cuid1/promote-gold
{
  "notes": "Documentação completa validada"
}

// Status: GOLD (Ouro)
```

#### GET /api/admin/citizens/:id/family - Composição familiar
```typescript
GET /api/admin/citizens/cuid1/family

Retorna:
[
  {
    "id": "family1",
    "headId": "cuid1",
    "relationship": "SPOUSE" | "SON" | "DAUGHTER" | ...
    "isDependent": true,
    "monthlyIncome": "1500.00",
    "occupation": "Vendedor",
    "education": "Ensino Médio",
    "hasDisability": false,
    "member": {
      "id": "cuid2",
      "name": "Maria Silva",
      "cpf": "98765432100",
      "email": "maria@email.com"
    }
  }
]
```

#### POST /api/admin/citizens/:id/family - Adicionar membro
```typescript
POST /api/admin/citizens/cuid1/family
{
  "memberId": "cuid2",
  "relationship": "SPOUSE",
  "isDependent": false,
  "monthlyIncome": "2500.00",
  "occupation": "Professora",
  "education": "Ensino Superior",
  "hasDisability": false
}
```

### 3.2 APIs de Autenticação de Cidadão

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/routes/citizen-auth.ts`

#### POST /api/auth/citizen/register - Cadastro de cidadão
```typescript
POST /api/auth/citizen/register
{
  "cpf": "12345678900",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "password": "Senha@123456",
  "address": {
    "cep": "12345-678",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "bairro": "Centro",
    "cidade": "Palmital",
    "uf": "SP"
  }
}

// Status criado: PENDING (Bronze)
// Requer validação de admin para ativar funcionalidades completas
```

#### POST /api/auth/citizen/login - Login do cidadão
```typescript
POST /api/auth/citizen/login
{
  "login": "joao@email.com" or "12345678900",  // CPF ou Email
  "password": "Senha@123456"
}

// Resposta
{
  "success": true,
  "citizen": {
    "id": "cuid1",
    "name": "João Silva",
    "cpf": "12345678900",
    "email": "joao@email.com",
    "verificationStatus": "PENDING"
  }
}

// Token armazenado em cookie httpOnly: digiurban_citizen_token
```

#### GET /api/auth/citizen/me - Dados do cidadão logado
```typescript
GET /api/auth/citizen/me
Headers: Cookie: digiurban_citizen_token=<token>

// Inclui últimos 10 protocolos e notificações não lidas
```

#### PUT /api/auth/citizen/profile - Atualizar perfil
```typescript
PUT /api/auth/citizen/profile
{
  "name": "João Silva",
  "email": "joao.novo@email.com",
  "phone": "11988888888",
  "birthDate": "1990-05-15",
  "rg": "123456789",
  "motherName": "Mãe Silva",
  "maritalStatus": "Casado",
  "occupation": "Engenheiro",
  "familyIncome": "5000.00",
  "address": {...}
}

// Aceita null para limpar valores
```

### 3.3 APIs de Protocolos do Cidadão

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/routes/citizen-protocols.ts`

#### POST /api/citizen/protocols - Criar novo protocolo
```typescript
POST /api/citizen/protocols
Content-Type: multipart/form-data
Authorization: Cookie: digiurban_citizen_token=<token>

{
  "serviceId": "service1",
  "moduleType": "ATENDIMENTOS_SAUDE",
  "programId": "program1",
  "programName": "Programa X",
  "formData": {
    "campo1": "valor1",
    "campo2": "valor2"
  },
  "documents": [arquivo1.pdf, arquivo2.jpg]
}

// Resposta
{
  "success": true,
  "protocol": {
    "id": "protocol1",
    "number": "2024-00001",
    "title": "Nome do Serviço",
    "status": "VINCULADO",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "service": {...},
    "department": {...}
  }
}
```

#### GET /api/citizen/protocols - Listar protocolos do cidadão
```typescript
GET /api/citizen/protocols?page=1&limit=100&status=VINCULADO

Filtros:
- page: número da página
- limit: itens por página
- status: filtro opcional de status
```

#### GET /api/citizen/protocols/:id - Detalhes do protocolo
```typescript
GET /api/citizen/protocols/protocol1

Inclui:
- Histórico completo do protocolo
- Serviço e departamento
- Dados do cidadão
- Usuário atribuído
```

#### GET /api/citizen/protocols/:id/interactions - Listar interações
```typescript
GET /api/citizen/protocols/protocol1/interactions

Retorna: Array de interações públicas (não visíveis para cidadão: as internas)
```

#### POST /api/citizen/protocols/:id/interactions - Adicionar mensagem
```typescript
POST /api/citizen/protocols/protocol1/interactions
{
  "message": "Qual é o status do meu pedido?",
  "type": "MESSAGE"
}
```

#### POST /api/citizen/protocols/:id/cancel - Cancelar protocolo
```typescript
POST /api/citizen/protocols/protocol1/cancel
{
  "reason": "Não preciso mais"
}

// Pode ser cancelado apenas se:
// - Status: VINCULADO ou PROGRESSO
// - Sem interações de servidor
// - Sem pendências
```

### 3.4 APIs Administrativas de Protocolos

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/routes/protocols-simplified.routes.ts`

#### POST /api/protocols-simplified - Criar protocolo (admin)
```typescript
POST /api/protocols-simplified
{
  "serviceId": "service1",
  "citizenData": {
    "cpf": "12345678900",
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "11999999999"
  },
  "formData": {
    "campo1": "valor1"
  },
  "latitude": -25.5095,
  "longitude": -49.3160,
  "address": "Rua das Flores, 123"
}

// Cria cidadão se não existir (com status PENDING)
// Cria protocolo vinculado automaticamente a módulo se serviceType = COM_DADOS
```

#### GET /api/protocols-simplified - Listar protocolos (admin)
```typescript
GET /api/protocols-simplified?page=1&limit=50&status=VINCULADO&search=João&departmentId=dept1&serviceIds=service1,service2

Filtros por role:
- USER: vê apenas protocolos atribuídos a ele
- COORDINATOR/MANAGER: vê protocolos do seu departamento
- ADMIN: vê todos os protocolos
```

#### GET /api/protocols-simplified/:id - Detalhes (admin)
```typescript
GET /api/protocols-simplified/protocol1

Inclui tudo + histórico, avaliações, estágios, SLA
```

#### PATCH /api/protocols-simplified/:id/status - Atualizar status
```typescript
PATCH /api/protocols-simplified/protocol1/status
{
  "newStatus": "PROGRESSO" | "CONCLUIDO" | "CANCELADO",
  "comment": "Processamento iniciado",
  "metadata": {...}
}

Valores possíveis:
- VINCULADO: Novo
- PROGRESSO: Em andamento
- ATUALIZACAO: Aguardando atualização
- CONCLUIDO: Finalizado
- CANCELADO: Cancelado
```

#### POST /api/protocols-simplified/:id/comments - Adicionar comentário (admin)
```typescript
POST /api/protocols-simplified/protocol1/comments
{
  "message": "Documentação recebida",
  "isInternal": false  // true = visível apenas para servidores
}
```

#### PATCH /api/protocols-simplified/:id/assign - Atribuir protocolo
```typescript
PATCH /api/protocols-simplified/protocol1/assign
{
  "assignedUserId": "user1"
}
```

#### PUT /api/protocols-simplified/:id/approve - Aprovar protocolo
```typescript
PUT /api/protocols-simplified/protocol1/approve
{
  "comment": "Aprovado com sucesso"
}

// Requer role MANAGER ou superior
```

#### PUT /api/protocols-simplified/:id/reject - Rejeitar protocolo
```typescript
PUT /api/protocols-simplified/protocol1/reject
{
  "reason": "Documentação incompleta"
}

// Requer role MANAGER ou superior
```

---

## 4. ESTRUTURA DE PERMISSÕES

### 4.1 Sistema de Roles

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/types/roles.ts`

#### Hierarquia de Roles

```typescript
enum UserRole {
  GUEST: 0        // Visitante (não usar para equipe)
  USER: 1         // Servidor(a) - Operacional
  COORDINATOR: 2  // Diretor(a) - Tático
  MANAGER: 3      // Secretário(a) - Estratégico
  ADMIN: 4        // Prefeito(a) - Administrativo
  SUPER_ADMIN: 5  // Suporte Técnico DigiUrban
}
```

#### Mapeamento de Permissões

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/middleware/admin-auth.ts` (linhas 285-373)

```typescript
USER (Servidor)
├─ protocols:read
├─ protocols:update
├─ protocols:comment
├─ citizens:read
├─ citizens:create
├─ citizens:verify
├─ citizens:update
├─ social-assistance:read
├─ social-assistance:create
└─ social-assistance:update

COORDINATOR (Diretor)
├─ [Todas do USER]
├─ protocols:assign
├─ team:read
├─ team:metrics
├─ department:read
└─ [+ permissões de citizens e social-assistance]

MANAGER (Secretário)
├─ [Todas do COORDINATOR]
├─ services:create
├─ services:update
├─ team:manage
├─ reports:department
├─ department:manage
├─ citizens:manage
└─ [+ permissões sociais]

ADMIN (Prefeito)
├─ protocols:* (todos)
├─ services:* (criar, atualizar, deletar)
├─ team:* (gerenciar)
├─ citizens:* (gerenciar)
├─ chamados:create
├─ reports:full
├─ departments:read
└─ analytics:full

SUPER_ADMIN (Suporte)
└─ * (Acesso total)
```

### 4.2 Verificação de Permissões

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/middleware/admin-auth.ts`

#### Middleware requirePermission
```typescript
// Uso
router.post('/admin/citizens/:id/verify',
  requirePermission('citizens:verify'),
  handler
)

// Verifica se usuário tem a permissão específica
// Retorna 403 se negado
```

#### Middleware requireMinRole
```typescript
// Uso
router.post('/api/protocols-simplified',
  requireMinRole(UserRole.USER),
  handler
)

// Verifica nível hierárquico mínimo
// USER (1) < COORDINATOR (2) < MANAGER (3) < ADMIN (4)
```

#### Middleware requireAnyPermission
```typescript
// Uso
router.get('/dashboard',
  requireAnyPermission(['protocols:read', 'reports:full']),
  handler
)

// Usuário precisa ter PELO MENOS UMA das permissões
```

### 4.3 Filtro de Dados por Role

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/middleware/admin-auth.ts` (linhas 240-280)

```typescript
USER:
  └─ Vê apenas protocolos atribuídos a si mesmo
     (filter: assignedUserId = userId)

COORDINATOR / MANAGER:
  └─ Veem apenas protocolos do seu departamento
     (filter: departmentId = user.departmentId)

ADMIN / SUPER_ADMIN:
  └─ Veem todos os protocolos do tenant
     (sem filtro adicional)

GUEST:
  └─ Sem acesso (filter: id = 'no-access')
```

### 4.4 Middleware de Autenticação

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/middleware/admin-auth.ts` (linhas 16-101)

```typescript
adminAuthMiddleware
├─ Verifica token no cookie ou header Authorization
├─ Valida JWT
├─ Busca usuário no banco
├─ Adiciona à requisição:
│  ├─ req.userId
│  ├─ req.user (com dados completos)
│  └─ req.userRole
└─ Retorna 401/403 se falhar

// Token armazenado em:
// Cookie: digiurban_admin_token (httpOnly)
// Header: Authorization: Bearer <token>
```

### 4.5 Autenticação de Cidadão

**Arquivo**: `/home/user/Digiurbanlite/digiurban/backend/src/middleware/citizen-auth.ts`

```typescript
citizenAuthMiddleware
├─ Verifica token JWT do cidadão
├─ Adiciona à requisição:
│  ├─ req.citizen (cidadão logado)
│  └─ req.citizen.id
└─ Retorna 401 se falhar

// Token armazenado em:
// Cookie: digiurban_citizen_token (httpOnly)
```

---

## RESUMO DE ESTRUTURAS-CHAVE

### Fluxo de Criação de Protocolo (por Cidadão)

```
1. POST /api/auth/citizen/register
   └─ Cria Citizen (PENDING - Bronze)

2. POST /api/auth/citizen/login
   └─ Autentica cidadão
   └─ Gera JWT token

3. POST /api/citizen/protocols
   └─ Cria ProtocolSimplified
   └─ Status: VINCULADO
   └─ Cria ProtocolHistorySimplified
   └─ Cria ProtocolInteraction inicial

4. GET /api/citizen/protocols
   └─ Lista protocolos do cidadão

5. GET /api/citizen/protocols/:id/interactions
   └─ Visualiza comunicações (apenas públicas)

6. POST /api/citizen/protocols/:id/interactions
   └─ Envia mensagem
```

### Fluxo Administrativo

```
1. POST /api/admin/citizens
   └─ Cria Citizen (VERIFIED - Prata)

2. PUT /api/admin/citizens/:id/verify
   └─ Aprova PENDING → VERIFIED

3. PUT /api/admin/citizens/:id/promote-gold
   └─ Promove VERIFIED → GOLD

4. GET /api/admin/citizens/:id/family
   └─ Gerencia composição familiar

5. POST /api/protocols-simplified
   └─ Cria protocolo administrativo

6. PATCH /api/protocols-simplified/:id/status
   └─ Atualiza status do protocolo

7. POST /api/protocols-simplified/:id/comments
   └─ Adiciona comentários (int/ext)

8. PATCH /api/protocols-simplified/:id/assign
   └─ Atribui a um servidor
```

---

## ÍNDICE DE ARQUIVOS

```
Backend Structure:
├── prisma/
│   └── schema.prisma                    (Modelos de dados)
├── src/
│   ├── middleware/
│   │   ├── admin-auth.ts               (Autenticação/Permissões admin)
│   │   ├── citizen-auth.ts             (Autenticação cidadão)
│   │   ├── auth.ts                     (Auth genérica)
│   │   └── rate-limit.ts               (Limitação de requisições)
│   ├── routes/
│   │   ├── admin-citizens.ts           (CRUD de cidadãos)
│   │   ├── citizen-auth.ts             (Autenticação cidadão)
│   │   ├── citizen-protocols.ts        (Protocolos do cidadão)
│   │   ├── protocols-simplified.routes.ts (Protocolos admin)
│   │   ├── services.ts                 (Catálogo de serviços)
│   │   ├── citizen-family.ts           (Composição familiar)
│   │   └── protocol-interactions.ts    (Interações)
│   ├── services/
│   │   ├── protocol-simplified.service.ts     (Lógica de protocolos)
│   │   ├── protocol-status.engine.ts          (Motor de status)
│   │   ├── protocol-module.service.ts         (Integração módulos)
│   │   ├── citizen-verification.service.ts   (Verificação cidadão)
│   │   ├── citizen-lookup.service.ts         (Busca cidadão)
│   │   ├── protocol-pending.service.ts       (Pendências)
│   │   ├── protocol-interaction.service.ts   (Interações)
│   │   ├── protocol-sla.service.ts           (SLA)
│   │   └── document-processing.service.ts    (Processamento docs)
│   ├── types/
│   │   ├── roles.ts                    (Definições de roles)
│   │   ├── index.ts                    (Tipos globais)
│   │   └── protocol-status.types.ts    (Tipos de protocolo)
│   ├── config/
│   │   ├── security.ts                 (Configurações bcrypt/JWT)
│   │   ├── upload.ts                   (Upload de arquivos)
│   │   └── database.ts                 (Conexão Prisma)
│   └── utils/
│       ├── validators.ts               (Validadores CPF, etc)
│       ├── audit-logger.ts             (Logs de auditoria)
│       ├── express-helpers.ts          (Helpers Express)
│       └── logger.ts                   (Sistema de logs)
```

