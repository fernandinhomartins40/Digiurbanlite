# Resumo Técnico: Gestão de Cidadãos e Atendimentos - DigiUrban

## Diagrama de Relacionamentos de Dados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODELO DE CIDADÃO E FAMÍLIA                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │     Citizen      │
                              ├──────────────────┤
                              │ id (CUID)        │
                              │ cpf (UNIQUE)     │
                              │ name             │
                              │ email            │
                              │ phone            │
                              │ birthDate        │
                              │ address (JSON)   │
                              │ rg               │
                              │ motherName       │
                              │ maritalStatus    │
                              │ occupation       │
                              │ familyIncome     │
                              │ verificationStatus
                              │   ├─ PENDING     │ ← Bronze (novo)
                              │   ├─ VERIFIED    │ ← Prata (validado)
                              │   ├─ GOLD        │ ← Ouro (completo)
                              │   └─ REJECTED    │ ← Rejeitado
                              │ registrationSource
                              │   ├─ SELF        │ (auto-cadastro)
                              │   └─ ADMIN       │ (cadastro admin)
                              │ password         │
                              │ isActive         │
                              │ createdAt        │
                              │ updatedAt        │
                              │ lastLogin        │
                              └──────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
         ┌──────────────────┐ ┌────────────────┐ ┌──────────────────┐
         │ FamilyComposition│ │CitizenDocument │ │ProtocolSimplified│
         ├──────────────────┤ ├────────────────┤ ├──────────────────┤
         │ id               │ │ id             │ │ id               │
         │ headId ──────────┼─┤ citizenId ─────┼─│ citizenId        │
         │ memberId         │ │ documentType   │ │ number (UNIQUE)  │
         │ relationship     │ │ fileName       │ │ title            │
         │ isDependent      │ │ filePath       │ │ description      │
         │ monthlyIncome    │ │ fileSize       │ │ status           │
         │ occupation       │ │ mimeType       │ │  ├─ VINCULADO    │
         │ education        │ │ status         │ │  ├─ PROGRESSO    │
         │ hasDisability    │ │  ├─ PENDING    │ │  ├─ ATUALIZACAO  │
         └──────────────────┘ │  ├─ UPLOADED   │ │  ├─ CONCLUIDO    │
                              │  ├─ UNDER_REV  │ │  ├─ PENDENCIA    │
                              │  ├─ APPROVED   │ │  └─ CANCELADO    │
                              │  ├─ REJECTED   │ │ priority         │
                              │  └─ EXPIRED    │ │ customData (JSON)│
                              │ uploadedAt     │ │ moduleType       │
                              │ reviewedBy     │ │ latitude         │
                              │ rejectedReason │ │ longitude        │
                              │ createdAt      │ │ address          │
                              │ updatedAt      │ │ documents (JSON) │
                              └────────────────┘ │ attachments      │
                                                 │ assignedUserId   │
                                                 │ createdById      │
                                                 │ dueDate          │
                                                 │ concludedAt      │
                                                 │ createdAt        │
                                                 │ updatedAt        │
                                                 └──────────────────┘
                                                          │
                              ┌───────────────────────────┼──────────────────┐
                              │                           │                  │
                              ▼                           ▼                  ▼
                    ┌──────────────────┐    ┌──────────────────┐  ┌─────────────────┐
                    │ProtocolHistory   │    │ProtocolInteraction
                    ├──────────────────┤    ├──────────────────┤  ├─────────────────┤
                    │ id               │    │ id               │  │ProtocolPending  │
                    │ protocolId       │    │ protocolId       │  ├─────────────────┤
                    │ action           │    │ type             │  │ id              │
                    │ comment          │    │ authorType       │  │ protocolId      │
                    │ oldStatus        │    │  ├─ CITIZEN      │  │ type            │
                    │ newStatus        │    │  ├─ SERVER       │  │ title           │
                    │ metadata (JSON)  │    │  └─ SYSTEM       │  │ description     │
                    │ timestamp        │    │ authorId         │  │ status          │
                    │ userId           │    │ authorName       │  │ dueDate         │
                    └──────────────────┘    │ message          │  │ resolvedAt      │
                                            │ isInternal       │  │ resolution      │
                                            │ isRead           │  │ blocksProgress  │
                                            │ attachments      │  └─────────────────┘
                                            │ createdAt        │
                                            └──────────────────┘
```

---

## Fluxo de Verificação de Cidadão (3 Níveis)

```
┌────────────────────────────────────────────────────────────────┐
│ Fluxo de Verificação e Status de Cidadão                       │
└────────────────────────────────────────────────────────────────┘

   ┌─────────┐
   │ PENDING │  (Bronze)
   │ ─────── │  • Novo cadastro
   │  BRONZE │  • Aguardando validação admin
   └────┬────┘  • Funcionalidades limitadas
        │
        │ PUT /api/admin/citizens/:id/verify
        │ (Admin com permissão citizens:verify)
        │
        ▼
   ┌──────────┐
   │ VERIFIED │  (Prata)
   │ ─────────│  • Cadastro validado
   │  PRATA   │  • Acesso completo a serviços
   └────┬─────┘  • Pode solicitar atendimentos
        │
        │ PUT /api/admin/citizens/:id/promote-gold
        │ (Admin com permissão citizens:verify)
        │
        ▼
   ┌──────┐
   │ GOLD │  (Ouro)
   │ ──── │  • Documentação completa
   │ OURO │  • Acesso prioritário
   └──────┘  • Beneficiários de programas
```

---

## Hierarquia de Permissões e Roles

```
┌─────────────────────────────────────────────────────────────┐
│                    HIERARCHY OF ROLES                        │
└─────────────────────────────────────────────────────────────┘

                        ┌─────────────┐
                        │ SUPER_ADMIN │  Level 5
                        │  (Suporte)  │  * (Todas)
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │   ADMIN     │  Level 4
                        │ (Prefeito)  │  protocols:*, services:*, team:*
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │   MANAGER   │  Level 3
                        │(Secretário) │  services:create, team:manage
                        └──────┬──────┘
                               │
                        ┌──────▼──────────┐
                        │  COORDINATOR   │  Level 2
                        │   (Diretor)    │  protocols:assign, team:read
                        └──────┬──────────┘
                               │
                        ┌──────▼──────┐
                        │    USER     │  Level 1
                        │ (Servidor)  │  protocols:read, citizens:read
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │   GUEST     │  Level 0
                        │(Visitante)  │  (Sem permissões)
                        └─────────────┘

Regra: Um usuário SÓ pode gerenciar usuários com nível INFERIOR ao seu
```

---

## Estado de Protocolo (Máquina de Estados)

```
┌──────────────────────────────────────────────────────────────────┐
│          PROTOCOL STATUS FLOW (Estado do Protocolo)              │
└──────────────────────────────────────────────────────────────────┘

                         POST /api/citizen/protocols
                         ↓
                  ┌─────────────────┐
                  │   VINCULADO     │  (Novo, vinculado ao sistema)
                  │ "STATUS_INITIAL"│
                  └────────┬────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         │        PATCH /status          POST /cancel
         │                 │                 │
         │                 ▼                 ▼
         │        ┌──────────────────┐   ┌──────────┐
         │        │  PROGRESSO       │   │CANCELADO │
         │        │"Em andamento"    │   └──────────┘
         │        └────────┬─────────┘
         │                 │
         │        ┌────────┴─────────┐
         │        │                  │
         │   PATCH /status       POST /comments
         │        │                  │
         │        ▼                  ▼
         │   ┌──────────┐        ┌────────────┐
         │   │ATUALIZACAO       │  PENDENCIA  │
         │   │"Aguardando       │  "Tem       │
         │   │atualização"      │  pendências"│
         │   └────────┬─────────┘└────────┬───┘
         │            │                   │
         │            │   (após resolver) │
         │            └───────┬───────────┘
         │                    │
         │            PATCH /status
         │                    │
         └────────────┬───────┘
                      │
                      ▼
              ┌──────────────┐
              │   CONCLUIDO  │  (Finalizado)
              │  "Terminado" │
              └──────────────┘
```

---

## Fluxo Completo: Cidadão Solicita Atendimento

```
┌────────────────────────────────────────────────────────────────────┐
│         FLUXO COMPLETO: CIDADÃO → PROTOCOLO → ATENDIMENTO          │
└────────────────────────────────────────────────────────────────────┘

ETAPA 1: REGISTRO E AUTENTICAÇÃO
════════════════════════════════
  1. POST /api/auth/citizen/register
     ├─ Validar CPF
     ├─ Validar senha forte
     ├─ Verificar CPF único
     └─ CRIAR Citizen (status: PENDING/Bronze)
         └─ Requer verificação admin para funcionalidades completas

  2. POST /api/auth/citizen/login
     ├─ CPF ou Email
     ├─ Validar senha
     ├─ Reset contador de tentativas
     └─ Gerar JWT token (cookie httpOnly)

  3. GET /api/auth/citizen/me
     └─ Buscar dados do cidadão logado

ETAPA 2: SELECIONAR SERVIÇO E SOLICITAR
═════════════════════════════════════════
  4. GET /api/services (público, sem autenticação)
     ├─ Filtrar por departamento
     ├─ Filtrar por search
     └─ Listar serviços ativos

  5. GET /api/services/:id (público)
     ├─ Detalhes do serviço
     ├─ Documentos obrigatórios
     └─ Configurações do formulário

  6. POST /api/citizen/protocols (autenticado)
     ├─ Enviar formData JSON
     ├─ Upload de documentos (multipart)
     ├─ Se serviceType = COM_DADOS:
     │  └─ Vincular automaticamente ao módulo (ATENDIMENTOS_SAUDE, etc)
     └─ CRIAR ProtocolSimplified (status: VINCULADO)
         ├─ Gerar número único (ex: 2024-00001)
         ├─ CRIAR ProtocolHistorySimplified (action: "Protocolo criado")
         └─ CRIAR ProtocolInteraction (type: MESSAGE, author: CITIZEN)

ETAPA 3: ACOMPANHAR PROTOCOLO
══════════════════════════════
  7. GET /api/citizen/protocols (autenticado)
     ├─ Filtrar por status
     └─ Listar todos os protocolos do cidadão

  8. GET /api/citizen/protocols/:id (autenticado)
     ├─ Detalhes completo do protocolo
     ├─ Histórico de mudanças
     ├─ Serviço e departamento
     └─ Usuário atribuído

  9. GET /api/citizen/protocols/:id/interactions (autenticado)
     └─ Listar mensagens públicas (não internas)

  10. POST /api/citizen/protocols/:id/interactions (autenticado)
      ├─ Enviar mensagem
      └─ CRIAR ProtocolInteraction (type: MESSAGE, isInternal: false)

  11. GET /api/citizen/protocols/:id/can-cancel (autenticado)
      ├─ Verificar se pode cancelar
      └─ Validações:
         ├─ Não está em CANCELADO/CONCLUIDO
         ├─ Sem interações de servidor
         └─ Sem pendências

  12. POST /api/citizen/protocols/:id/cancel (autenticado)
      └─ Cancelar (se validações passarem)
          └─ CRIAR ProtocolInteraction (type: CANCELLATION)

ETAPA 4: PROCESSAMENTO ADMINISTRATIVO
══════════════════════════════════════
  13. GET /api/protocols-simplified (admin autenticado)
      ├─ Filtros por role:
      │  ├─ USER: apenas atribuídos a ele
      │  ├─ COORDINATOR/MANAGER: seu departamento
      │  └─ ADMIN: todos
      └─ Paginação, busca, status

  14. PATCH /api/protocols-simplified/:id/status (admin)
      ├─ Atualizar status (PROGRESSO, CONCLUIDO, etc)
      ├─ CRIAR ProtocolHistorySimplified
      └─ CRIAR ProtocolInteraction (type: STATUS_CHANGED)

  15. POST /api/protocols-simplified/:id/comments (admin)
      ├─ Adicionar comentário
      ├─ isInternal: true = visível só para servidores
      └─ CRIAR ProtocolInteraction

  16. PATCH /api/protocols-simplified/:id/assign (admin)
      ├─ Atribuir a um servidor
      ├─ Update ProtocolSimplified.assignedUserId
      └─ CRIAR ProtocolInteraction (type: ASSIGNED)

  17. PUT /api/protocols-simplified/:id/approve (manager+)
      ├─ Aprovar protocolo
      └─ CRIAR ProtocolInteraction (type: APPROVAL)

  18. PUT /api/protocols-simplified/:id/reject (manager+)
      ├─ Rejeitar protocolo
      └─ CRIAR ProtocolInteraction (type: REJECTION)
```

---

## Mapeamento de Permissões por Endpoint

```
┌──────────────────────────────────────────────────────────────────┐
│              PERMISSÕES REQUERIDAS POR ENDPOINT                  │
└──────────────────────────────────────────────────────────────────┘

CIDADÃO (Sem autenticação específica de permissões)
═══════════════════════════════════════════════════
  GET  /api/services                   [PÚBLICO]
  GET  /api/services/:id               [PÚBLICO]
  POST /api/auth/citizen/register      [PÚBLICO]
  POST /api/auth/citizen/login         [PÚBLICO]
  GET  /api/auth/citizen/me            [AUTENTICADO]
  PUT  /api/auth/citizen/profile       [AUTENTICADO]
  POST /api/auth/citizen/change-password [AUTENTICADO]
  POST /api/citizen/protocols          [AUTENTICADO]
  GET  /api/citizen/protocols          [AUTENTICADO]
  GET  /api/citizen/protocols/:id      [AUTENTICADO]
  GET  /api/citizen/protocols/:id/interactions  [AUTENTICADO]
  POST /api/citizen/protocols/:id/interactions  [AUTENTICADO]
  POST /api/citizen/protocols/:id/cancel        [AUTENTICADO]

SERVIDOR (Role: USER)
═════════════════════════════════════════════════════
  requireMinRole(USER)
  ├─ protocols:read
  ├─ protocols:update
  ├─ protocols:comment
  ├─ citizens:read
  ├─ citizens:create
  ├─ citizens:verify
  └─ citizens:update

  GET  /api/protocols-simplified       [requireMinRole(USER)]
  GET  /api/protocols-simplified/:id   [requireMinRole(USER)]
  POST /api/protocols-simplified/:id/comments [requireMinRole(USER)]

COORDENADOR (Role: COORDINATOR)
═══════════════════════════════════════════════════════
  [TUDO de USER +]
  ├─ protocols:assign
  ├─ team:read
  ├─ team:metrics
  └─ department:read

  PATCH /api/protocols-simplified/:id/assign [requireMinRole(COORDINATOR)]

SECRETÁRIO (Role: MANAGER)
═════════════════════════════════════════════════════════
  [TUDO de COORDINATOR +]
  ├─ services:create
  ├─ services:update
  ├─ team:manage
  ├─ reports:department
  ├─ department:manage
  └─ citizens:manage

  PUT /api/protocols-simplified/:id/approve  [requireMinRole(MANAGER)]
  PUT /api/protocols-simplified/:id/reject   [requireMinRole(MANAGER)]
  POST /api/admin/citizens                   [requirePermission(citizens:create)]
  PUT /api/admin/citizens/:id/verify         [requirePermission(citizens:verify)]
  PUT /api/admin/citizens/:id/promote-gold   [requirePermission(citizens:verify)]
  POST /api/admin/citizens/:id/family        [requirePermission(citizens:update)]

PREFEITO (Role: ADMIN)
═════════════════════════════════════════════════════════
  [TUDO]
  ├─ protocols:*
  ├─ services:*
  ├─ team:*
  ├─ citizens:*
  ├─ chamados:create
  ├─ reports:full
  ├─ departments:read
  └─ analytics:full

SUPORTE (Role: SUPER_ADMIN)
═════════════════════════════════════════════════════════
  * (Acesso total a tudo)
```

---

## Índice de Arquivos-Chave

```
ARQUIVOS PRINCIPAIS DO BACKEND
═══════════════════════════════

Modelos de Dados
├─ /home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma
│  └─ Defines: Citizen, ProtocolSimplified, FamilyComposition, etc.

Autenticação e Permissões
├─ src/middleware/admin-auth.ts
│  ├─ adminAuthMiddleware
│  ├─ requirePermission()
│  ├─ requireMinRole()
│  └─ getRolePermissions()
├─ src/middleware/citizen-auth.ts
│  └─ citizenAuthMiddleware
└─ src/types/roles.ts
   ├─ UserRole enum
   ├─ ROLE_HIERARCHY
   ├─ ROLE_PERMISSIONS
   └─ Helper functions

APIs de Cidadão
├─ src/routes/admin-citizens.ts
│  ├─ POST   /api/admin/citizens
│  ├─ GET    /api/admin/citizens
│  ├─ GET    /api/admin/citizens/search
│  ├─ GET    /api/admin/citizens/:id
│  ├─ PUT    /api/admin/citizens/:id/verify
│  └─ PUT    /api/admin/citizens/:id/promote-gold
├─ src/routes/citizen-auth.ts
│  ├─ POST   /api/auth/citizen/register
│  ├─ POST   /api/auth/citizen/login
│  ├─ GET    /api/auth/citizen/me
│  └─ PUT    /api/auth/citizen/profile
└─ src/routes/citizen-family.ts
   └─ GET/POST /api/admin/citizens/:id/family

APIs de Protocolo
├─ src/routes/citizen-protocols.ts
│  ├─ POST   /api/citizen/protocols
│  ├─ GET    /api/citizen/protocols
│  ├─ GET    /api/citizen/protocols/:id
│  ├─ GET    /api/citizen/protocols/:id/interactions
│  └─ POST   /api/citizen/protocols/:id/interactions
├─ src/routes/protocols-simplified.routes.ts
│  ├─ POST   /api/protocols-simplified
│  ├─ GET    /api/protocols-simplified
│  ├─ GET    /api/protocols-simplified/:id
│  ├─ PATCH  /api/protocols-simplified/:id/status
│  ├─ POST   /api/protocols-simplified/:id/comments
│  ├─ PATCH  /api/protocols-simplified/:id/assign
│  ├─ PUT    /api/protocols-simplified/:id/approve
│  └─ PUT    /api/protocols-simplified/:id/reject
└─ src/routes/protocol-interactions.ts
   └─ Interações de protocolo

APIs de Serviço
├─ src/routes/services.ts
│  ├─ GET    /api/services
│  └─ GET    /api/services/:id
└─ src/routes/admin-dynamic-services.ts
   └─ Serviços dinâmicos

Lógica de Negócio (Services)
├─ src/services/protocol-simplified.service.ts
│  └─ ProtocolServiceSimplified class
├─ src/services/protocol-status.engine.ts
│  └─ protocolStatusEngine (máquina de estados)
├─ src/services/protocol-module.service.ts
│  └─ Integração com módulos (SAUDE, EDUCACAO, etc)
├─ src/services/citizen-verification.service.ts
│  └─ Lógica de verificação de cidadão
├─ src/services/citizen-lookup.service.ts
│  └─ Busca inteligente de cidadão
└─ src/services/protocol-pending.service.ts
   └─ Gestão de pendências
```

---

## Quick Reference: Códigos de Resposta HTTP

```
200 OK                    ✅ Sucesso
201 CREATED               ✅ Recurso criado
204 NO CONTENT           ✅ Sucesso sem conteúdo
400 BAD REQUEST          ❌ Dados inválidos
401 UNAUTHORIZED         ❌ Não autenticado (sem token)
403 FORBIDDEN            ❌ Sem permissão
404 NOT FOUND            ❌ Recurso não encontrado
409 CONFLICT             ❌ CPF/Email já existe
422 UNPROCESSABLE ENTITY ❌ Validação falhou
500 INTERNAL SERVER ERROR ❌ Erro do servidor
```

---

## Estrutura de Resposta JSON Padrão

```json
{
  "success": true | false,
  "data": {
    "citizen": { ... } | "protocol": { ... } | ...
  },
  "message": "Descrição do resultado",
  "error": "Descrição do erro (se houver)",
  "details": { ... }
}
```

---

## Versionamento e Compatibilidade

**Versão Atual**: Sistema Simplificado
- Banco: PostgreSQL com Prisma ORM
- Autenticação: JWT (cookies httpOnly)
- Cidadão: 3 níveis (PENDING/VERIFIED/GOLD/REJECTED)
- Protocolos: 6 estados (VINCULADO, PROGRESSO, ATUALIZACAO, CONCLUIDO, PENDENCIA, CANCELADO)
- Roles: 6 níveis (GUEST, USER, COORDINATOR, MANAGER, ADMIN, SUPER_ADMIN)

