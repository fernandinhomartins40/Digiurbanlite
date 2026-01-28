# Sistema de Validação de Unicidade de Protocolos

## 📋 Visão Geral

O sistema de validação de unicidade de protocolos garante que cidadãos não possam criar múltiplos protocolos ativos para serviços que representam cadastros únicos (como identidade ou status).

**Desde a versão atual**, a configuração de unicidade é **OBRIGATÓRIA** para todos os novos serviços criados via interface administrativa.

---

## 🎯 Objetivo

Prevenir duplicatas indesejadas em serviços de cadastro permanente, garantindo que:

- Um cidadão não possa se cadastrar duas vezes como "Produtor Rural"
- Um cidadão não possa criar múltiplas solicitações de "Cadastro Único"
- Mas permita múltiplas solicitações de serviços transacionais (pedidos, inscrições, etc.)

---

## 🔧 Configuração

### Campos Obrigatórios

Ao criar um novo serviço, você **DEVE** configurar:

#### 1. `allowMultipleActiveProtocols` (boolean - obrigatório)

Define se o cidadão pode ter múltiplos protocolos ativos deste serviço simultaneamente.

- **`true`**: Permite múltiplos protocolos
  - Exemplos: Solicitações (poda, limpeza), Inscrições (cursos, eventos)

- **`false`**: Apenas 1 protocolo ativo por vez
  - Exemplos: Cadastros de identidade (Produtor Rural, Professor, MEI)

#### 2. `uniquenessScope` (string - obrigatório se allowMultipleActiveProtocols = false)

Define o escopo de validação de unicidade:

- **`CITIZEN`**: Valida por cidadão + serviceId
  - 1 protocolo ativo por cidadão para este serviço específico

- **`CUSTOM`**: Valida por cidadão + moduleType (recomendado)
  - 1 protocolo ativo por cidadão para qualquer serviço com este moduleType
  - **Mais robusto** para cadastros de identidade

- **`CITIZEN_PER_FIELD`**: Valida por cidadão + valor de campo específico
  - Permite validação por campo customizado (ex: CPF de dependente)

#### 3. `uniquenessRules` (JSON - obrigatório conforme escopo)

Regras específicas de validação conforme o escopo escolhido:

**Para CUSTOM:**
```json
{
  "moduleType": "CADASTRO_PRODUTOR",
  "validationFunction": "validateCadastroProdutor"
}
```

**Para CITIZEN_PER_FIELD:**
```json
{
  "field": "cpfDependente",
  "fieldLabel": "CPF do Dependente",
  "errorMessage": "Você já possui uma solicitação ativa para este dependente."
}
```

---

## 📊 Exemplos de Configuração

### Exemplo 1: Cadastro Único (não permite duplicatas)

```typescript
{
  name: "Cadastro de Produtor Rural",
  serviceType: "COM_DADOS",
  moduleType: "CADASTRO_PRODUTOR",

  // Configuração de unicidade
  allowMultipleActiveProtocols: false,
  uniquenessScope: "CUSTOM",
  uniquenessRules: {
    moduleType: "CADASTRO_PRODUTOR",
    validationFunction: "validateCadastroProdutor"
  }
}
```

**Comportamento**: O cidadão só pode ter 1 protocolo ativo de Cadastro de Produtor Rural. Se tentar criar outro, receberá erro.

---

### Exemplo 2: Solicitação de Poda (permite duplicatas)

```typescript
{
  name: "Solicitação de Poda de Árvore",
  serviceType: "COM_DADOS",
  moduleType: "SOLICITACAO_PODA",

  // Configuração de unicidade
  allowMultipleActiveProtocols: true,
  uniquenessScope: null,
  uniquenessRules: null
}
```

**Comportamento**: O cidadão pode criar múltiplas solicitações de poda simultaneamente (diferentes árvores, diferentes endereços).

---

### Exemplo 3: Validação por Campo (CPF de Dependente)

```typescript
{
  name: "Cadastro de Dependente",
  serviceType: "COM_DADOS",
  moduleType: "CADASTRO_DEPENDENTE",

  // Configuração de unicidade
  allowMultipleActiveProtocols: false,
  uniquenessScope: "CITIZEN_PER_FIELD",
  uniquenessRules: {
    field: "cpfDependente",
    fieldLabel: "CPF do Dependente",
    errorMessage: "Você já possui uma solicitação ativa para este dependente."
  }
}
```

**Comportamento**: O cidadão não pode criar múltiplos protocolos para o **mesmo CPF de dependente**, mas pode criar para diferentes dependentes.

---

## 🔍 Como Funciona

### Fluxo de Validação

1. **Cidadão tenta criar protocolo** via painel do cidadão
2. **Sistema busca configuração** do serviço no banco (campos: `allowMultipleActiveProtocols`, `uniquenessScope`, `uniquenessRules`)
3. **Se permite múltiplos**: Libera criação imediatamente ✅
4. **Se NÃO permite múltiplos**: Executa validação conforme escopo:
   - **CITIZEN**: Busca protocolo ativo do mesmo `serviceId` + `citizenId`
   - **CUSTOM**: Busca protocolo ativo do mesmo `moduleType` + `citizenId`
   - **CITIZEN_PER_FIELD**: Busca protocolo ativo com mesmo valor no campo especificado
5. **Se encontrar protocolo ativo**: Bloqueia criação e retorna erro com número do protocolo existente ❌
6. **Se NÃO encontrar**: Permite criação ✅

### Status Considerados "Ativos"

Um protocolo é considerado "ativo" se está em um dos seguintes status:

- `VINCULADO`
- `PROGRESSO`
- `PENDENCIA`
- `ATUALIZACAO`

Protocolos com status `CONCLUIDO`, `CANCELADO`, `REJEITADO` não bloqueiam a criação de novos.

---

## 🛠️ Interface Administrativa

### Criação de Serviço

Ao criar um novo serviço via `/admin/servicos/novo`, o wizard agora inclui o **Step 5: Configuração de Unicidade**:

1. **Step 1**: Informações Básicas
2. **Step 2**: Tipo de Serviço
3. **Step 3**: Captura de Dados (se COM_DADOS)
4. **Step 4**: Documentos
5. **✨ Step 5: Unicidade** (NOVO - obrigatório)
6. **Step 6**: Revisão

### Validações Backend

O backend valida os seguintes cenários:

1. **Campo obrigatório**: `allowMultipleActiveProtocols` não pode ser `null` ou `undefined`
2. **Escopo obrigatório**: Se `allowMultipleActiveProtocols = false`, deve ter `uniquenessScope`
3. **Escopo válido**: `uniquenessScope` deve ser `CITIZEN`, `CUSTOM` ou `CITIZEN_PER_FIELD`
4. **Regras CUSTOM**: Se escopo é `CUSTOM`, deve ter `moduleType` definido
5. **Regras CITIZEN_PER_FIELD**: Se escopo é `CITIZEN_PER_FIELD`, deve ter `uniquenessRules.field` definido

---

## 📁 Arquivos Relacionados

### Backend

- **Validação de unicidade**: `backend/src/services/protocol-uniqueness.service.ts`
- **Rotas de serviços**: `backend/src/routes/services.ts` (validação obrigatória em POST)
- **Script de atualização**: `backend/update-service-uniqueness.js` (atualiza serviços existentes)
- **Startup**: `docker/startup.sh` (executa script de atualização no deploy)

### Frontend

- **Componente de configuração**: `frontend/components/admin/services/steps/UniquenessConfigStep.tsx`
- **Página de criação**: `frontend/app/admin/servicos/novo/page.tsx`
- **Wizard**: `frontend/components/admin/services/ServiceFormWizard.tsx`

### Seeds

Todos os arquivos em `backend/prisma/seeds/services/*.seed.ts` contém configurações de unicidade nos serviços.

---

## 📝 Boas Práticas

### 1. Use CUSTOM para Cadastros de Identidade

✅ **Recomendado**:
```typescript
allowMultipleActiveProtocols: false,
uniquenessScope: "CUSTOM",
uniquenessRules: { moduleType: "CADASTRO_PRODUTOR" }
```

❌ **Não recomendado**:
```typescript
allowMultipleActiveProtocols: false,
uniquenessScope: "CITIZEN" // Valida apenas por serviceId, não por moduleType
```

**Por quê?** `CUSTOM` é mais robusto porque valida por `moduleType`, garantindo que mesmo que existam múltiplos serviços do mesmo tipo, a validação funcione corretamente.

### 2. Permita Múltiplos para Serviços Transacionais

Serviços como solicitações, pedidos e inscrições devem **sempre** permitir múltiplos:

```typescript
allowMultipleActiveProtocols: true
```

### 3. Mensagens de Erro Personalizadas

Para `CITIZEN_PER_FIELD`, personalize a mensagem de erro para melhor UX:

```typescript
uniquenessRules: {
  field: "cnpj",
  fieldLabel: "CNPJ",
  errorMessage: "Você já possui uma solicitação de licença ativa para este CNPJ (Protocolo: {number})."
}
```

---

## 🔄 Migrando Serviços Existentes

Serviços criados **antes** desta implementação foram configurados via:

1. **Seeds**: Configuração inicial em `backend/prisma/seeds/services/*.seed.ts`
2. **Script de atualização**: `backend/update-service-uniqueness.js` (executa no startup)

Para atualizar serviços existentes manualmente:

```bash
node backend/update-service-uniqueness.js
```

---

## 🐛 Troubleshooting

### Erro: "É obrigatório definir se o serviço permite múltiplos protocolos ativos"

**Causa**: Tentando criar serviço sem definir `allowMultipleActiveProtocols`.

**Solução**: No Step 5 do wizard, selecione "Sim" ou "Não" para permitir múltiplos protocolos.

---

### Erro: "Para uniquenessScope CUSTOM, é obrigatório definir um moduleType"

**Causa**: Selecionou escopo CUSTOM mas o serviço não tem `moduleType` (geralmente serviços SEM_DADOS).

**Solução**:
- Opção 1: Mude para `uniquenessScope: "CITIZEN"`
- Opção 2: Mude o serviço para `COM_DADOS` para ter `moduleType`

---

### Cidadão consegue criar protocolo duplicado mesmo com configuração

**Causa**: Configuração não foi salva corretamente ou validação não está sendo executada.

**Verificação**:
1. Consulte o serviço no banco: `SELECT allowMultipleActiveProtocols, uniquenessScope FROM ServiceSimplified WHERE id = 'xxx'`
2. Verifique se `allowMultipleActiveProtocols = false`
3. Verifique logs do backend ao tentar criar protocolo

---

## 📊 Estatísticas Atuais

- **Total de serviços**: ~404
- **Serviços únicos** (não permitem duplicatas): 20 (~5%)
- **Serviços múltiplos** (permitem duplicatas): 384 (~95%)

### Distribuição por Tipo

| Tipo de Serviço | Quantidade | Permite Múltiplos? |
|---|---|---|
| Cadastros de Identidade/Status | 20 | ❌ NÃO |
| Solicitações/Pedidos | ~60 | ✅ SIM |
| Inscrições | ~33 | ✅ SIM |
| Consultas/Emissões | ~114 | ✅ SIM |
| Cadastros Relacionais | 14 | ✅ SIM |
| Outros | ~163 | ✅ SIM |

---

## 🎓 Critério de Decisão

### ❌ NÃO permite múltiplos (allowMultipleActiveProtocols = false)

Use quando o serviço representa **identidade ou status permanente**:

- O cidadão **É** algo (Produtor Rural, Professor, MEI)
- O cidadão está **CADASTRADO** em algo único (CadÚnico, Contribuinte)
- O cadastro define um **STATUS OFICIAL** que não deve ser duplicado

**Exemplos**: Cadastro de Produtor Rural, Cadastro MEI, Cadastro de Professor, CadÚnico

### ✅ Permite múltiplos (allowMultipleActiveProtocols = true)

Use quando o serviço representa **ação transacional ou entidade múltipla**:

- O cidadão está **PEDINDO** algo (Poda, Limpeza, Reparo)
- O cidadão está **SE INSCREVENDO** em algo (Curso, Evento, Concurso)
- O cidadão está **CONSULTANDO** algo (Certidão, Protocolo)
- O cidadão pode ter **MÚLTIPLAS ENTIDADES** (Propriedades, Eventos, Grupos)

**Exemplos**: Solicitação de Poda, Inscrição em Curso, Cadastro de Propriedade Rural, Emissão de Certidão

---

## 📞 Suporte

Para dúvidas ou problemas com a configuração de unicidade, consulte:

1. Esta documentação
2. Código-fonte em `backend/src/services/protocol-uniqueness.service.ts`
3. Exemplos nos seeds em `backend/prisma/seeds/services/`
