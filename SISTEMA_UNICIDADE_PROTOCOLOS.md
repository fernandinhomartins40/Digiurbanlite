# 🎯 Sistema de Validação de Unicidade de Protocolos

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Problema que Resolve](#problema-que-resolve)
3. [Arquitetura](#arquitetura)
4. [Escopos de Validação](#escopos-de-validação)
5. [Instalação](#instalação)
6. [Configuração de Serviços](#configuração-de-serviços)
7. [Exemplos de Uso](#exemplos-de-uso)
8. [API](#api)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **Sistema de Validação de Unicidade de Protocolos** impede que cidadãos criem solicitações duplicadas para determinados tipos de serviços, garantindo integridade operacional e evitando processamento redundante.

### Características Principais

✅ **Configurável por Serviço**: Cada serviço pode ter suas próprias regras
✅ **Múltiplos Escopos**: CITIZEN, CUSTOM, CITIZEN_PER_FIELD
✅ **Backward Compatible**: Serviços existentes continuam funcionando (padrão: permite duplicatas)
✅ **Validação Inteligente**: Considera apenas protocolos em estados não-terminais
✅ **Extensível**: Fácil adicionar novas validações customizadas

---

## 🔍 Problema que Resolve

### Cenário Problema

**Antes do Sistema:**

1. Cidadão solicita "Cadastro de Produtor Rural" → Aprovado
2. Sistema categoriza cidadão como "Produtor Rural"
3. Cidadão solicita "Cadastro de Produtor Rural" **NOVAMENTE** → Sistema permite ❌
4. Servidores processam solicitação duplicada → Desperdício de recursos

**Depois do Sistema:**

1. Cidadão solicita "Cadastro de Produtor Rural" → Aprovado
2. Sistema categoriza cidadão como "Produtor Rural"
3. Cidadão tenta solicitar novamente → **Sistema bloqueia** ✅
4. Mensagem: _"Você já possui um cadastro de produtor rural em andamento (Protocolo: 2024-12345)"_

### Casos de Uso

| Tipo de Serviço | Permite Duplicatas? | Motivo |
|-----------------|---------------------|--------|
| Cadastro de Produtor Rural | ❌ Não | Um cidadão só pode ter um cadastro ativo |
| Licença de Funcionamento | ❌ Não | Um CNPJ só pode ter uma licença ativa |
| Matrícula Escolar | ❌ Não (por aluno) | Um aluno não pode ter múltiplas matrículas ativas |
| Agendamento Médico | ✅ Sim | Cidadão pode ter múltiplos agendamentos |
| Solicitação de Iluminação | ✅ Sim | Cidadão pode reportar múltiplos pontos |

---

## 🏗️ Arquitetura

### Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                      CRIAÇÃO DE PROTOCOLO                    │
│                   (Cidadão ou Admin)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ validateProtocolUniqueness()│
            │   (protocol-uniqueness.service)│
            └────────────┬───────────┘
                         │
         ┌───────────────┴────────────────┐
         │ Buscar configuração do serviço │
         │ (allowMultipleActiveProtocols,  │
         │  uniquenessScope, uniquenessRules)│
         └───────────────┬────────────────┘
                         │
        ┌────────────────┴─────────────────┐
        │ allowMultipleActiveProtocols?    │
        └───┬─────────────────────┬────────┘
            │ Sim                 │ Não
            ▼                     ▼
     ✅ PERMITE           ┌──────────────┐
     CRIAÇÃO             │ Validar escopo│
                         └───────┬──────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
   ┌─────────┐           ┌─────────┐            ┌──────────┐
   │ CITIZEN │           │ CUSTOM  │            │ CITIZEN_ │
   │         │           │         │            │PER_FIELD │
   └────┬────┘           └────┬────┘            └────┬─────┘
        │                     │                      │
        ▼                     ▼                      ▼
   Protocolo ativo?     Lógica customizada    Campo duplicado?
        │                     │                      │
        ├─Sim→ ❌ BLOQUEIA    ├─Sim→ ❌ BLOQUEIA    ├─Sim→ ❌ BLOQUEIA
        └─Não→ ✅ PERMITE     └─Não→ ✅ PERMITE     └─Não→ ✅ PERMITE
```

### Fluxo de Validação

1. **Requisição de Criação** → `POST /api/citizen/protocols` ou `POST /api/protocols-simplified`
2. **Validação de Unicidade** → `validateProtocolUniqueness(citizenId, serviceId, formData)`
3. **Consulta de Configuração** → Buscar campos do serviço no banco
4. **Decisão de Escopo** → Rotear para validação apropriada
5. **Resposta** → `{ canCreate: boolean, errorMessage?: string }`

---

## 📊 Escopos de Validação

### 1️⃣ CITIZEN (Simples)

**Regra**: 1 protocolo ativo por cidadão para o serviço

**Quando Usar**: Serviços de cadastro único, auxílios, benefícios

**Exemplo**:
```typescript
{
  allowMultipleActiveProtocols: false,
  uniquenessScope: 'CITIZEN',
  uniquenessRules: null
}
```

**Query SQL**:
```sql
SELECT * FROM protocols_simplified
WHERE citizenId = ? AND serviceId = ?
  AND status IN ('VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO')
```

**Exemplos de Serviços**:
- Cadastro de Produtor Rural
- Cartão SUS
- Auxílio Alimentação
- Bolsa Família Municipal

---

### 2️⃣ CUSTOM (Lógica Customizada)

**Regra**: Validação específica implementada no código

**Quando Usar**: Regras complexas que dependem de múltiplos fatores

**Exemplo**:
```typescript
{
  allowMultipleActiveProtocols: false,
  uniquenessScope: 'CUSTOM',
  uniquenessRules: {
    moduleType: 'CADASTRO_PRODUTOR',
    validationFunction: 'validateCadastroProdutor',
    errorMessage: 'Você já possui um cadastro de produtor rural em andamento'
  }
}
```

**Função de Validação**:
```typescript
async function validateCadastroProdutor(
  citizenId: string,
  serviceId: string,
  serviceName: string
): Promise<UniquenessValidationResult> {
  // Buscar qualquer cadastro ativo de produtor (mesmo que seja outro serviço do módulo)
  const activeProtocol = await prisma.protocolSimplified.findFirst({
    where: {
      citizenId,
      moduleType: 'CADASTRO_PRODUTOR',
      status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'] }
    }
  });

  if (activeProtocol) {
    return {
      canCreate: false,
      reason: 'ACTIVE_PRODUCER_REGISTRATION',
      errorMessage: `Você já possui um cadastro ativo (Protocolo: ${activeProtocol.number})`,
      existingProtocolNumber: activeProtocol.number
    };
  }

  return { canCreate: true };
}
```

**Exemplos de Serviços**:
- Cadastro de Produtor Rural (verifica qualquer cadastro do módulo)
- Cadastro de Propriedade Rural (verifica por endereço)
- Licença de Funcionamento (verifica por CNPJ)

---

### 3️⃣ CITIZEN_PER_FIELD (Campo Específico)

**Regra**: 1 protocolo ativo por valor de campo do formulário

**Quando Usar**: Serviços que envolvem dependentes, CPF de terceiros, endereços específicos

**Exemplo**:
```typescript
{
  allowMultipleActiveProtocols: false,
  uniquenessScope: 'CITIZEN_PER_FIELD',
  uniquenessRules: {
    field: 'cpfAluno',
    fieldLabel: 'CPF do aluno',
    errorMessage: 'Este aluno já possui uma solicitação de matrícula em andamento'
  }
}
```

**Query SQL** (usando JSONB):
```sql
SELECT * FROM protocols_simplified
WHERE citizenId = ? AND serviceId = ?
  AND status IN ('VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO')
  AND customData @> '{"cpfAluno": "12345678900"}'
```

**Exemplos de Serviços**:
- Matrícula Escolar (por CPF do aluno)
- Transferência Escolar (por CPF do aluno)
- Alvará de Construção (por endereço da obra)

---

## 🛠️ Instalação

### 1. Executar Migration

```bash
cd digiurban/backend
npx prisma migrate deploy
```

**Migration criada**: `20260127120000_add_protocol_uniqueness_fields`

**Campos adicionados à tabela `services_simplified`**:
- `allowMultipleActiveProtocols` (Boolean, default: true)
- `uniquenessScope` (String, nullable)
- `uniquenessRules` (JSONB, nullable)

### 2. Executar Seed (Opcional)

```bash
npx ts-node prisma/seeds/service-uniqueness-rules.seed.ts
```

**O que faz**:
- Configura regras de unicidade para 20+ serviços pré-cadastrados
- Categoriza serviços em: Cadastros, Licenças, Matrículas, Agendamentos, etc.
- Define escopos apropriados para cada tipo

### 3. Verificar Instalação

```sql
-- Verificar campos foram adicionados
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'services_simplified'
  AND column_name IN ('allowMultipleActiveProtocols', 'uniquenessScope', 'uniquenessRules');

-- Ver serviços configurados
SELECT
  name,
  "allowMultipleActiveProtocols",
  "uniquenessScope",
  "uniquenessRules"
FROM services_simplified
WHERE "allowMultipleActiveProtocols" = false;
```

---

## ⚙️ Configuração de Serviços

### Via API (Criação de Serviço)

```typescript
POST /api/services

{
  "name": "Cadastro de Produtor Rural",
  "departmentId": "...",
  "serviceType": "COM_DADOS",
  "moduleType": "CADASTRO_PRODUTOR",

  // ✅ Configuração de unicidade
  "allowMultipleActiveProtocols": false,
  "uniquenessScope": "CUSTOM",
  "uniquenessRules": {
    "moduleType": "CADASTRO_PRODUTOR",
    "validationFunction": "validateCadastroProdutor",
    "errorMessage": "Você já possui um cadastro de produtor rural em andamento"
  }
}
```

### Via SQL (Atualização Manual)

```sql
-- CITIZEN (simples)
UPDATE services_simplified
SET
  "allowMultipleActiveProtocols" = false,
  "uniquenessScope" = 'CITIZEN',
  "uniquenessRules" = NULL
WHERE name = 'Cartão SUS';

-- CUSTOM (lógica customizada)
UPDATE services_simplified
SET
  "allowMultipleActiveProtocols" = false,
  "uniquenessScope" = 'CUSTOM',
  "uniquenessRules" = '{"moduleType": "LICENCA_FUNCIONAMENTO", "validationFunction": "validateLicencaFuncionamento"}'::jsonb
WHERE name = 'Licença de Funcionamento';

-- CITIZEN_PER_FIELD (campo específico)
UPDATE services_simplified
SET
  "allowMultipleActiveProtocols" = false,
  "uniquenessScope" = 'CITIZEN_PER_FIELD',
  "uniquenessRules" = '{"field": "cpfAluno", "fieldLabel": "CPF do aluno"}'::jsonb
WHERE name = 'Matrícula Escolar';
```

### Via Seed (Recomendado)

Edite `prisma/seeds/service-uniqueness-rules.seed.ts`:

```typescript
const UNIQUENESS_CONFIGS: ServiceUniquenessConfig[] = [
  {
    serviceName: 'Meu Novo Serviço',
    moduleType: 'MEU_MODULO',
    allowMultipleActiveProtocols: false,
    uniquenessScope: 'CITIZEN',
    uniquenessRules: null
  },
  // ... mais configurações
];
```

Execute:
```bash
npx ts-node prisma/seeds/service-uniqueness-rules.seed.ts
```

---

## 📝 Exemplos de Uso

### Exemplo 1: Cadastro Simples (CITIZEN)

**Cenário**: Serviço "Auxílio Transporte" - 1 por cidadão

**Configuração**:
```typescript
{
  allowMultipleActiveProtocols: false,
  uniquenessScope: 'CITIZEN',
  uniquenessRules: null
}
```

**Fluxo**:
1. Cidadão solicita "Auxílio Transporte" → ✅ Criado (Protocolo: 2024-001)
2. Status muda para "EM_PROGRESSO"
3. Cidadão tenta solicitar novamente → ❌ Bloqueado
4. Mensagem: _"Você já possui uma solicitação ativa de Auxílio Transporte (Protocolo: 2024-001)"_
5. Protocolo 2024-001 é concluído → Status: "CONCLUIDO"
6. Cidadão solicita novamente → ✅ Permitido (protocolo anterior foi concluído)

---

### Exemplo 2: Validação por Módulo (CUSTOM)

**Cenário**: "Cadastro de Propriedade Rural" - 1 por endereço

**Configuração**:
```typescript
{
  allowMultipleActiveProtocols: false,
  uniquenessScope: 'CUSTOM',
  uniquenessRules: {
    moduleType: 'CADASTRO_PROPRIEDADE',
    validationFunction: 'validateCadastroPropriedade'
  }
}
```

**Lógica de Validação**:
```typescript
async function validateCadastroPropriedade(
  citizenId: string,
  serviceId: string,
  serviceName: string,
  customData?: any
): Promise<UniquenessValidationResult> {
  if (!customData?.enderecoPropriedade) {
    return { canCreate: true };
  }

  const endereco = customData.enderecoPropriedade;

  const existingProtocol = await prisma.protocolSimplified.findFirst({
    where: {
      citizenId,
      moduleType: 'CADASTRO_PROPRIEDADE',
      status: { in: ACTIVE_STATUSES },
      customData: { path: ['enderecoPropriedade'], equals: endereco }
    }
  });

  if (existingProtocol) {
    return {
      canCreate: false,
      reason: 'DUPLICATE_PROPERTY_ADDRESS',
      errorMessage: `Você já possui um cadastro ativo para a propriedade no endereço "${endereco}"`,
      existingProtocolNumber: existingProtocol.number
    };
  }

  return { canCreate: true };
}
```

**Fluxo**:
1. Cidadão cadastra propriedade "Fazenda São João, Km 10" → ✅ Criado
2. Cidadão tenta cadastrar mesma propriedade → ❌ Bloqueado
3. Cidadão cadastra propriedade diferente "Chácara Vista Alegre, Km 5" → ✅ Permitido

---

### Exemplo 3: Validação por Campo (CITIZEN_PER_FIELD)

**Cenário**: "Matrícula Escolar" - 1 por aluno (CPF)

**Configuração**:
```typescript
{
  allowMultipleActiveProtocols: false,
  uniquenessScope: 'CITIZEN_PER_FIELD',
  uniquenessRules: {
    field: 'cpfAluno',
    fieldLabel: 'CPF do aluno',
    errorMessage: 'Este aluno já possui uma solicitação de matrícula em andamento'
  }
}
```

**Fluxo**:
1. Responsável solicita matrícula do filho (CPF: 123.456.789-00) → ✅ Criado
2. Responsável tenta solicitar matrícula do mesmo filho → ❌ Bloqueado
3. Responsável solicita matrícula de outro filho (CPF: 987.654.321-00) → ✅ Permitido

---

## 🔌 API

### `validateProtocolUniqueness()`

```typescript
import { validateProtocolUniqueness } from '../services/protocol-uniqueness.service';

const validation = await validateProtocolUniqueness(
  citizenId: string,
  serviceId: string,
  customData?: any
);

// Retorno
interface UniquenessValidationResult {
  canCreate: boolean;
  reason?: string;
  errorMessage?: string;
  existingProtocolNumber?: string;
}
```

**Exemplo de Uso**:
```typescript
// Antes de criar protocolo
const validation = await validateProtocolUniqueness(
  'citizen-123',
  'service-456',
  { cpfAluno: '12345678900' }
);

if (!validation.canCreate) {
  return res.status(400).json({
    success: false,
    error: validation.errorMessage,
    existingProtocolNumber: validation.existingProtocolNumber
  });
}

// Prosseguir com criação...
```

### Estados Considerados "Ativos"

```typescript
const ACTIVE_STATUSES = [
  'VINCULADO',     // Aguardando processamento
  'PROGRESSO',     // Em andamento
  'PENDENCIA',     // Aguardando resposta do cidadão
  'ATUALIZACAO'    // Aguardando atualização
];

const TERMINAL_STATUSES = [
  'CONCLUIDO',     // Finalizado com sucesso
  'CANCELADO'      // Cancelado
];
```

**Nota**: Protocolos com status terminal (CONCLUIDO/CANCELADO) não bloqueiam novas solicitações.

---

## 🔧 Troubleshooting

### Problema: Validação não está bloqueando duplicatas

**Verificações**:

1. **Serviço está configurado corretamente?**
```sql
SELECT
  name,
  "allowMultipleActiveProtocols",
  "uniquenessScope"
FROM services_simplified
WHERE id = 'SEU_SERVICE_ID';
```

2. **Migration foi aplicada?**
```sql
SELECT * FROM _prisma_migrations
WHERE migration_name LIKE '%uniqueness%';
```

3. **Validação está sendo chamada?**
Verificar logs no console do backend:
```
🔍 Validando unicidade do protocolo...
   ✓ Validação de unicidade passou
```

---

### Problema: Erro "VALIDATION_ERROR" ao criar protocolo

**Possíveis Causas**:

1. **Erro na função de validação customizada**
   - Verificar logs do backend para stack trace
   - Validação retorna `canCreate: true` em caso de erro (fail-safe)

2. **Regras JSON malformadas**
```sql
SELECT
  name,
  "uniquenessRules"
FROM services_simplified
WHERE "uniquenessRules" IS NOT NULL;
```

---

### Problema: Bloqueio indevido (falso positivo)

**Causas Comuns**:

1. **Protocolo antigo não foi concluído**
```sql
-- Ver protocolos ativos do cidadão
SELECT number, status, "createdAt"
FROM protocols_simplified
WHERE "citizenId" = 'CITIZEN_ID'
  AND "serviceId" = 'SERVICE_ID'
  AND status IN ('VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO');
```

**Solução**: Concluir ou cancelar protocolo antigo

2. **Escopo muito restritivo**
   - Revisar configuração do serviço
   - Considerar mudar de `CITIZEN` para `CITIZEN_PER_FIELD`

---

### Problema: Duplicatas ainda são permitidas

**Verificações**:

1. **allowMultipleActiveProtocols está false?**
```sql
SELECT "allowMultipleActiveProtocols"
FROM services_simplified
WHERE id = 'SERVICE_ID';
```

2. **Validação está integrada nas rotas?**
   - Verificar `citizen-protocols.ts` linha ~230
   - Verificar `protocols-simplified.routes.ts` linha ~85

---

## 📊 Consultas Úteis

### Ver todos os serviços com validação de unicidade

```sql
SELECT
  name,
  "moduleType",
  "allowMultipleActiveProtocols",
  "uniquenessScope",
  "uniquenessRules"
FROM services_simplified
WHERE "allowMultipleActiveProtocols" = false
ORDER BY name;
```

### Ver protocolos bloqueados (últimas 24h)

```sql
-- Requer logging de tentativas (não implementado por padrão)
-- Consulta exemplo:
SELECT
  c.name as citizen_name,
  s.name as service_name,
  COUNT(*) as blocked_attempts
FROM validation_logs v
JOIN citizens c ON c.id = v."citizenId"
JOIN services_simplified s ON s.id = v."serviceId"
WHERE v."canCreate" = false
  AND v."createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY c.name, s.name
ORDER BY blocked_attempts DESC;
```

### Protocolos ativos por serviço

```sql
SELECT
  s.name as service,
  COUNT(*) as active_protocols
FROM protocols_simplified p
JOIN services_simplified s ON s.id = p."serviceId"
WHERE p.status IN ('VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO')
GROUP BY s.name
ORDER BY active_protocols DESC;
```

---

## 🎓 Boas Práticas

### 1. Defina Regras no Momento da Criação

Ao criar um novo serviço, sempre configure:
```typescript
{
  name: "Novo Serviço",
  // ... outros campos
  allowMultipleActiveProtocols: false, // ou true
  uniquenessScope: "CITIZEN", // ou null
  uniquenessRules: null // ou regras JSON
}
```

### 2. Use o Escopo Mais Simples Possível

- **CITIZEN** é suficiente para 80% dos casos
- Use **CUSTOM** apenas quando necessário lógica complexa
- Use **CITIZEN_PER_FIELD** para dependentes/terceiros

### 3. Mensagens de Erro Claras

```typescript
uniquenessRules: {
  errorMessage: "Você já possui um cadastro ativo (aguarde conclusão)"
}
```

### 4. Teste Cenários de Borda

- Protocolo cancelado → Deve permitir novo
- Protocolo concluído → Deve permitir novo
- Múltiplos dependentes → Cada um deve ter validação independente

### 5. Documente Validações Customizadas

Ao adicionar nova função em `protocol-uniqueness.service.ts`:
```typescript
/**
 * MODULO_X: Validação específica
 *
 * Regra: [Descrever regra]
 * Exemplo: [Dar exemplo]
 */
async function validateModuloX(...) { ... }
```

---

## 📞 Suporte

Para dúvidas ou problemas:

1. ✅ Consultar esta documentação
2. ✅ Verificar logs do backend
3. ✅ Testar queries SQL acima
4. ✅ Revisar configuração do serviço

---

**🎉 Sistema instalado e documentado com sucesso!**
