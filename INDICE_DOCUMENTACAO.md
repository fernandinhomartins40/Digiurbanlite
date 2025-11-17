# Índice de Documentação: DigiUrban - Gestão de Cidadãos e Atendimentos

## Documentação Criada (17/11/2024)

### Documentos Solicitados (Novos)

#### 1. **RELATORIO_DIGIURBAN.md** (27 KB)
Documentação completa e detalhada sobre como o sistema gerencia cidadãos e atendimentos.

**Contém:**
- Modelo de dados de Cidadão (Schema Prisma)
  - Campos disponíveis (CPF, nome, endereço, etc.)
  - Relacionamentos com protocolo, documentos, composição familiar
  - Três níveis de verificação (PENDING/VERIFIED/GOLD)
  - Sistema de autenticação e segurança

- Modelo de Atendimentos/Protocolos
  - Como são registrados os atendimentos
  - Relação com cidadãos
  - Histórico de status/interações
  - Sistema de pendências
  - Documentos e anexos

- APIs de Busca e Consulta
  - 30+ endpoints documentados
  - Buscar cidadãos por nome/CPF
  - Listar protocolos com filtros
  - Criar e gerenciar atendimentos
  - Exemplos de requisições e respostas

- Estrutura de Permissões
  - 6 níveis de roles (GUEST, USER, COORDINATOR, MANAGER, ADMIN, SUPER_ADMIN)
  - Mapeamento detalhado de permissões por role
  - Middlewares de autenticação e autorização
  - Filtro de dados por role

**Localização:** `/home/user/Digiurbanlite/RELATORIO_DIGIURBAN.md`

---

#### 2. **RESUMO_TECNICO.md** (27 KB)
Resumo visual e técnico com diagramas ASCII facilitando a compreensão.

**Contém:**
- Diagrama de relacionamentos de dados (ASCII art)
- Fluxo de verificação de cidadão (3 níveis)
- Hierarquia de permissões visual
- Estado de protocolo (máquina de estados)
- Fluxo completo: cidadão → protocolo → atendimento
- Mapeamento de permissões por endpoint
- Índice de arquivos-chave
- Códigos de resposta HTTP
- Estrutura de resposta JSON padrão

**Localização:** `/home/user/Digiurbanlite/RESUMO_TECNICO.md`

---

#### 3. **EXEMPLOS_API.md** (17 KB)
Exemplos práticos de uso das APIs em cURL, JavaScript e TypeScript.

**Contém:**
- 16 exemplos em cURL
  - Cadastro, login, criar protocolo
  - Listar, atualizar, cancelar
  - Buscas avançadas com filtros
  - Operações administrativas

- 7 exemplos em JavaScript/TypeScript
  - Funções prontas para usar
  - Tratamento de erros robusto
  - Helpers para chamadas seguras
  - Tipos TypeScript

- Tratamento de erros
  - Códigos HTTP comuns
  - Fallbacks e retry logic
  - Mensagens de erro amigáveis

**Localização:** `/home/user/Digiurbanlite/EXEMPLOS_API.md`

---

### Documentos Relacionados Existentes

#### 4. **PROPOSTA_DADOS_AUXILIARES.md** (31 KB)
Propostas de dados auxiliares (tabelas de suporte) para o sistema.

#### 5. **ANALISE_COMPLETA_DADOS_AUXILIARES.md** (43 KB)
Análise completa de todas as 25 tabelas de dados auxiliares implementadas.

#### 6. **IMPLEMENTACAO_COMPLETA_100_PERCENT.md** (13 KB)
Implementação 100% do plano de dados auxiliares.

#### 7. **ANALISE_MODULO_GABINETE_PREFEITO.md** (19 KB)
Análise específica do módulo de Gabinete do Prefeito.

#### 8. **RELATORIO_ANALISE_CAMPOS_SERVICOS.md** (20 KB)
Análise dos campos de serviços no sistema.

---

## Arquivos Técnicos do Backend

### Modelos de Dados (Prisma)

```
/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma
├─ Lines 108-147  : Model Citizen
├─ Lines 152-175  : Model CitizenDocument
├─ Lines 212-232  : Model FamilyComposition
├─ Lines 274-332  : Model ProtocolSimplified
├─ Lines 334-348  : Model ProtocolHistorySimplified
├─ Lines 367-396  : Model ProtocolInteraction
├─ Lines 470-524  : Model ProtocolPending
└─ Lines 550-580  : Model ProtocolStage
```

### Middleware e Autenticação

```
/home/user/Digiurbanlite/digiurban/backend/src/middleware/
├─ admin-auth.ts        (400 linhas) - Autenticação e permissões admin
├─ citizen-auth.ts      - Autenticação de cidadão
├─ auth.ts              - Autenticação genérica
├─ rate-limit.ts        - Limitação de requisições
└─ account-lockout.ts   - Bloqueio de conta
```

### Rotas de API

```
/home/user/Digiurbanlite/digiurban/backend/src/routes/
├─ admin-citizens.ts                 - CRUD de cidadãos
├─ citizen-auth.ts                   - Autenticação cidadão
├─ citizen-protocols.ts              - Protocolos do cidadão
├─ protocols-simplified.routes.ts    - Protocolos admin
├─ services.ts                       - Catálogo de serviços
├─ citizen-family.ts                 - Composição familiar
├─ protocol-interactions.ts          - Interações
├─ admin-dynamic-services.ts         - Serviços dinâmicos
└─ admin-citizen-documents.ts        - Documentos cidadão
```

### Serviços de Negócio

```
/home/user/Digiurbanlite/digiurban/backend/src/services/
├─ protocol-simplified.service.ts            - Lógica de protocolos
├─ protocol-status.engine.ts                 - Máquina de estados
├─ protocol-module.service.ts                - Integração módulos
├─ citizen-verification.service.ts           - Verificação cidadão
├─ citizen-lookup.service.ts                 - Busca inteligente
├─ protocol-pending.service.ts               - Pendências
├─ protocol-interaction.service.ts           - Interações
├─ protocol-sla.service.ts                   - SLA
└─ document-processing.service.ts            - Processamento documentos
```

### Tipos e Configurações

```
/home/user/Digiurbanlite/digiurban/backend/src/
├─ types/
│  ├─ roles.ts                       - Definições de roles
│  ├─ index.ts                       - Tipos globais
│  └─ protocol-status.types.ts       - Tipos de protocolo
├─ config/
│  ├─ security.ts                    - Bcrypt/JWT
│  ├─ upload.ts                      - Upload de arquivos
│  └─ database.ts                    - Conexão Prisma
└─ utils/
   ├─ validators.ts                  - Validadores
   ├─ audit-logger.ts                - Logs de auditoria
   ├─ express-helpers.ts             - Helpers Express
   └─ logger.ts                      - Sistema de logs
```

---

## Fluxo Rápido de Uso

### Para Entender a Estrutura de Cidadãos:
1. Leia: **RESUMO_TECNICO.md** (diagrama ASCII)
2. Detalhes: **RELATORIO_DIGIURBAN.md** (seção 1)
3. Código: `/home/user/Digiurbanlite/digiurban/backend/prisma/schema.prisma` (linhas 108-147)

### Para Usar as APIs de Cidadão:
1. Exemplos: **EXEMPLOS_API.md** (seções 1-3, 11-12)
2. Endpoints: **RELATORIO_DIGIURBAN.md** (seção 3.1)
3. Permissões: **RELATORIO_DIGIURBAN.md** (seção 4)

### Para Entender Protocolos/Atendimentos:
1. Modelo: **RELATORIO_DIGIURBAN.md** (seção 2)
2. Fluxo: **RESUMO_TECNICO.md** (fluxo completo)
3. Estado: **RESUMO_TECNICO.md** (máquina de estados)
4. Exemplos: **EXEMPLOS_API.md** (seções 5-15)

### Para Implementar Permissões:
1. Entender roles: **RESUMO_TECNICO.md** (hierarquia)
2. Detalhes: **RELATORIO_DIGIURBAN.md** (seção 4)
3. Código: `/home/user/Digiurbanlite/digiurban/backend/src/types/roles.ts`
4. Middleware: `/home/user/Digiurbanlite/digiurban/backend/src/middleware/admin-auth.ts`

---

## Resumo de Tabelas Principais

### Citizen (Cidadão)
- **Chave primária:** id (CUID)
- **Chaves únicas:** cpf, email (implícito)
- **Status verificação:** PENDING → VERIFIED → GOLD
- **Campos principais:** cpf, name, email, phone, birthDate, address (JSON)
- **Segurança:** password, failedLoginAttempts, lockedUntil

### ProtocolSimplified (Atendimento)
- **Chave primária:** id (CUID)
- **Chave única:** number (ex: 2024-00001)
- **Status:** VINCULADO → PROGRESSO → CONCLUIDO/CANCELADO
- **Campos principais:** number, title, status, priority
- **Rastreamento:** history, interactions, pendings, documents

### FamilyComposition (Família)
- **Chave primária:** id (CUID)
- **Chave única:** headId + memberId
- **Dados:** relationship, isDependent, monthlyIncome, occupation

### CitizenDocument (Documento)
- **Chave primária:** id (CUID)
- **Status documento:** PENDING → APPROVED/REJECTED
- **Campos:** documentType, fileName, filePath, fileSize

---

## Permissões por Endpoint (Resumo)

| Endpoint | Método | Público | Cidadão | USER | MANAGER | ADMIN |
|----------|--------|---------|---------|------|---------|-------|
| /api/services | GET | ✅ | - | - | - | - |
| /api/auth/citizen/register | POST | ✅ | - | - | - | - |
| /api/auth/citizen/login | POST | ✅ | - | - | - | - |
| /api/citizen/protocols | POST | - | ✅ | - | - | - |
| /api/admin/citizens | GET | - | - | ✅ | ✅ | ✅ |
| /api/admin/citizens | POST | - | - | - | ✅ | ✅ |
| /api/protocols-simplified | GET | - | - | ✅ | ✅ | ✅ |
| /api/protocols-simplified | POST | - | - | - | ✅ | ✅ |

---

## Estrutura de Response JSON

```json
{
  "success": true,
  "data": {
    "citizen": { ... },
    "protocol": { ... },
    ...
  },
  "message": "Descrição do resultado",
  "error": "Descrição do erro (se houver)",
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

---

## Próximas Consultas Recomendadas

Se precisar de mais informações sobre:
- **Dados Auxiliares (25 tabelas):** Consulte `PROPOSTA_DADOS_AUXILIARES.md`
- **Integração de Módulos:** Consulte `RELATORIO_DIGIURBAN.md` seção 2.1
- **Sistema de SLA e Prazos:** Consulte schema.prisma linhas 594-622
- **Análise de Campos:** Consulte `RELATORIO_ANALISE_CAMPOS_SERVICOS.md`

---

**Gerado em:** 17/11/2024
**Versão:** 1.0
**Sistema:** DigiUrban - Gestão Municipal

