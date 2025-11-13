# 📋 PLANO REALINHADO - Sistema de Templates para Secretarias

## 🎯 OBJETIVO
Criar um sistema de templates que **GERA rotas CRUD genéricas** para módulos, mantendo 100% de compatibilidade com:
- ✅ ServiceSimplified (formSchema editável)
- ✅ ProtocolSimplified (customData + motor de status)
- ✅ Sistema de upload de documentos
- ✅ Layout e visual das páginas das secretarias
- ✅ Todos os recursos avançados já implementados

## 🔍 ANÁLISE DO SISTEMA EXISTENTE

### 1. **Estrutura de Serviços**
```typescript
ServiceSimplified {
  serviceType: 'COM_DADOS' | 'SEM_DADOS'
  moduleType: string | null  // Ex: 'AGENDAMENTOS_MEDICOS'
  formSchema: Json | null    // ✅ EDITÁVEL pelo admin
  formFieldsConfig: Json | null
  requiresDocuments: boolean
  requiredDocuments: Json | null
  // + 8 feature flags:
  hasCustomForm, hasLocation, hasScheduling, hasSurvey,
  hasCustomWorkflow, hasCustomFields, hasAdvancedDocs, hasNotifications
}
```

**IMPORTANTE:**
- O `formSchema` é **dinâmico e editável** no painel admin
- Os módulos devem **consumir** esse schema, não definir campos fixos
- Cada serviço pode ter recursos avançados ativados/desativados

### 2. **Estrutura de Protocolos**
```typescript
ProtocolSimplified {
  id, number, status
  serviceId → ServiceSimplified
  moduleType: string | null  // Vincula ao módulo
  customData: Json           // ✅ Dados do formulário salvos aqui
  departmentId
  citizenId
  // Motor de status gerencia transições
}
```

**IMPORTANTE:**
- `customData` armazena os dados do formulário dinamicamente
- `protocol-status.engine.ts` gerencia TODAS as mudanças de status
- Hooks de módulo são executados nas transições de status

### 3. **Motor de Protocolos (protocol-status.engine.ts)**
```typescript
class ProtocolStatusEngine {
  async updateStatus(input) {
    // 1. Validar transição
    // 2. Atualizar protocolo (transação)
    // 3. Registrar histórico
    // 4. Executar hooks de módulo
    // 5. Enviar notificações
  }
}
```

**IMPORTANTE:**
- É o ÚNICO ponto de mudança de status
- Executa hooks específicos por `moduleType`
- NÃO PODE SER MODIFICADO ou substituído

### 4. **Página de Edição de Serviços (Admin)**
**Abas disponíveis:**
1. **Informações Básicas** - Nome, desc, categoria, departamento, prioridade, icon, color
2. **Documentos** - requiresDocuments, requiredDocuments
3. **Formulário** - formFieldsConfig, enabledFields (campos pré-preenchidos do cidadão)
4. **Recursos** - 8 feature flags
5. **Campos do Formulário** (se hasCustomForm=true) - formSchema completo
6. **Localização** (se hasLocation=true)
7. **Agendamento** (se hasScheduling=true)
8. **Pesquisa** (se hasSurvey=true)
9. **Workflow** (se hasCustomWorkflow=true)
10. **Docs Inteligentes** (se hasAdvancedDocs=true)
11. **Notificações** (se hasNotifications=true)

**IMPORTANTE:**
- Tudo é configurável pelo admin
- O `formSchema` é um JSON Schema completo e editável
- Não podemos substituir isso por campos fixos!

## 🚫 O QUE ESTÁ ERRADO NO APPROACH ATUAL

### ❌ Problema 1: Campos Fixos
```typescript
// ERRADO - Estou definindo campos fixos no config
fields: [
  { name: 'patientName', type: 'string', required: true },
  { name: 'patientCpf', type: 'cpf', required: true }
]
```
**Por quê?** Isso ignora o `formSchema` editável do ServiceSimplified!

### ❌ Problema 2: Sistema Paralelo
```typescript
// ERRADO - Criando sistema paralelo de validação
const template = Handlebars.compile(templateContent);
return template(data); // Gera código com campos hardcoded
```
**Por quê?** Cria duplicação e conflito com o sistema existente!

### ❌ Problema 3: Ignora Recursos Avançados
O template atual não considera:
- hasCustomForm, hasLocation, hasScheduling, etc.
- formFieldsConfig (campos pré-preenchidos)
- Sistema de documentos configurável
- Hooks do motor de protocolos

## ✅ SOLUÇÃO CORRETA: Templates Genéricos

### Princípios do Novo Approach:
1. **Templates geram rotas CRUD 100% genéricas**
2. **Rotas consomem ServiceSimplified.formSchema em runtime**
3. **Respeitam 100% o motor de protocolos existente**
4. **Mantêm compatibilidade com todos os recursos avançados**
5. **Não duplicam lógica - apenas organizam o código existente**

### Nova Estrutura de Config (MINIMALISTA):
```typescript
// generator/configs/secretarias/saude.config.ts
export const saudeConfig = {
  id: 'saude',
  name: 'Secretaria de Saúde',
  slug: 'saude',
  departmentId: 'saude',
  modules: [
    // Apenas mapeia moduleType → rotas CRUD
    { id: 'agendamentos', moduleType: 'AGENDAMENTOS_MEDICOS' },
    { id: 'exames', moduleType: 'EXAMES' },
    { id: 'vacinacao', moduleType: 'VACINACAO' },
    // ... todos os 11 módulos
    { id: 'servicos', moduleType: null } // Serviços gerais (SEM_DADOS)
  ]
};
```

**SEM CAMPOS FIXOS!** O template vai buscar do ServiceSimplified.

### Novo Template (backend.hbs):
```handlebars
{{#each modules}}
// ========== MÓDULO: {{this.moduleType}} ==========

// GET /{{../slug}}/{{this.id}}
router.get('/{{this.id}}', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    // 1. Buscar service com este moduleType
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: '{{../departmentId}}',
        moduleType: {{#if this.moduleType}}'{{this.moduleType}}'{{else}}null{{/if}}
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    // 2. Buscar protocolos deste módulo
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        serviceId: service.id,
        {{#if this.moduleType}}moduleType: '{{this.moduleType}}'{{/if}}
      },
      include: { citizen: true }
    });

    // 3. Retornar dados de customData
    const data = protocols.map(p => ({
      id: p.id,
      protocolNumber: p.number,
      status: p.status,
      citizen: p.citizen,
      ...p.customData // ✅ Dados dinâmicos do formSchema
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /{{../slug}}/{{this.id}}
router.post('/{{this.id}}', async (req, res) => {
  try {
    // 1. Buscar service
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: '{{../departmentId}}',
        moduleType: {{#if this.moduleType}}'{{this.moduleType}}'{{else}}null{{/if}}
      }
    });

    // 2. Validar com formSchema do service
    if (service.formSchema) {
      // TODO: Validar req.body com service.formSchema
    }

    // 3. Criar protocolo com customData
    const protocol = await prisma.protocolSimplified.create({
      data: {
        serviceId: service.id,
        citizenId: req.body.citizenId,
        departmentId: '{{../departmentId}}',
        {{#if this.moduleType}}moduleType: '{{this.moduleType}}',{{/if}}
        customData: req.body, // ✅ Dados dinâmicos
        status: 'VINCULADO'
      }
    });

    res.json({ success: true, protocol });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /{{../slug}}/{{this.id}}/:id
router.put('/{{this.id}}/:id', async (req, res) => {
  // ... Similar: busca service, valida formSchema, atualiza customData
});

// DELETE /{{../slug}}/{{this.id}}/:id
router.delete('/{{this.id}}/:id', async (req, res) => {
  // Usa protocolStatusEngine.updateStatus() para CANCELAR
  await protocolStatusEngine.updateStatus({
    protocolId: req.params.id,
    newStatus: 'CANCELADO',
    actorRole: req.user.role,
    actorId: req.user.id
  });
});

// POST /{{../slug}}/{{this.id}}/:id/approve
router.post('/{{this.id}}/:id/approve', async (req, res) => {
  // ✅ USA O MOTOR DE PROTOCOLOS
  await protocolStatusEngine.updateStatus({
    protocolId: req.params.id,
    newStatus: 'PROGRESSO',
    actorRole: req.user.role,
    actorId: req.user.id
  });
});

// ... Outras rotas CRUD genéricas
{{/each}}
```

## 📦 ESTRUTURA FINAL DO GENERATOR

```
generator/
├── configs/
│   └── secretarias/
│       ├── saude.config.ts           # 11 módulos (apenas moduleType)
│       ├── agricultura.config.ts     # 6 módulos
│       ├── educacao.config.ts        # 10 módulos
│       ├── assistencia-social.config.ts # 9 módulos
│       ├── cultura.config.ts         # 8 módulos
│       ├── esportes.config.ts        # 8 módulos
│       ├── habitacao.config.ts       # 6 módulos
│       ├── meio-ambiente.config.ts   # 7 módulos
│       ├── obras-publicas.config.ts  # 4 módulos
│       ├── planejamento-urbano.config.ts # 6 módulos
│       ├── seguranca-publica.config.ts # 10 módulos
│       ├── servicos-publicos.config.ts # 9 módulos
│       └── turismo.config.ts         # 7 módulos
├── templates/
│   └── backend.hbs                   # Template GENÉRICO (sem campos fixos)
├── schemas/
│   └── secretaria.schema.ts          # Validação Zod SIMPLIFICADA
├── utils/
│   ├── template-engine.ts            # Handlebars engine
│   └── validator.ts                  # Validação de configs
└── index.ts                          # CLI

TOTAL: 13 secretarias × ~7 módulos = ~90 módulos
```

## 🎯 BENEFÍCIOS DO NOVO APPROACH

### ✅ Mantém 100% de Compatibilidade
- Usa ServiceSimplified.formSchema (editável)
- Usa ProtocolSimplified.customData (dinâmico)
- Usa protocolStatusEngine (sem modificar)
- Respeita todos os feature flags

### ✅ Reduz Complexidade
- Configs minimalistas (só moduleType)
- Template único e genérico
- Elimina duplicação de lógica
- Fácil manutenção

### ✅ Flexibilidade Total
- Admin pode editar formSchema a qualquer momento
- Novos campos adicionados dinamicamente
- Recursos avançados ativados/desativados por serviço
- Upload de documentos configurável

### ✅ Mantém Layout/Visual
- Não muda frontend
- Páginas das secretarias continuam iguais
- Apenas melhora organização do backend

## 🚀 PRÓXIMOS PASSOS

1. ✅ **Simplificar schemas** - Remover `fields`, manter só `moduleType`
2. ✅ **Reescrever template backend.hbs** - Rotas 100% genéricas que consomem ServiceSimplified
3. ✅ **Criar configs para 13 secretarias** - Apenas lista de moduleTypes
4. ✅ **Gerar código** - `npm run generate --all`
5. ✅ **Testar** - Verificar que tudo funciona com sistema existente
6. ✅ **Deletar legado** - Remover arquivos antigos após validação

## 📝 EXEMPLO DE FLUXO COMPLETO

### 1. Admin configura serviço no painel:
```
Serviço: "Agendamento de Consulta"
moduleType: "AGENDAMENTOS_MEDICOS"
formSchema: {
  properties: {
    patientName: { type: 'string', required: true },
    patientCpf: { type: 'string', pattern: '^\\d{11}$' },
    specialty: { type: 'string', enum: ['clinico', 'pediatria'] },
    appointmentDate: { type: 'string', format: 'date-time' }
  }
}
requiresDocuments: true
requiredDocuments: ['Cartão SUS', 'RG']
hasScheduling: true
```

### 2. Cidadão solicita serviço:
```
POST /api/admin/secretarias/saude/agendamentos
Body: {
  citizenId: "...",
  patientName: "João Silva",
  patientCpf: "12345678901",
  specialty: "pediatria",
  appointmentDate: "2025-12-01T10:00:00Z"
}
```

### 3. Rota gerada pelo template:
1. Busca `ServiceSimplified` com `moduleType='AGENDAMENTOS_MEDICOS'`
2. Valida body com `service.formSchema`
3. Cria `ProtocolSimplified`:
   ```typescript
   {
     serviceId: service.id,
     citizenId: "...",
     moduleType: "AGENDAMENTOS_MEDICOS",
     customData: {
       patientName: "João Silva",
       patientCpf: "12345678901",
       specialty: "pediatria",
       appointmentDate: "2025-12-01T10:00:00Z"
     },
     status: "VINCULADO"
   }
   ```
4. Retorna protocolo criado

### 4. Servidor aprova:
```
POST /api/admin/secretarias/saude/agendamentos/:id/approve
```
- Usa `protocolStatusEngine.updateStatus()`
- Status: VINCULADO → PROGRESSO
- Hook de módulo é executado (se existir)
- Notificações enviadas

### 5. Admin pode mudar formSchema depois:
- Adiciona campo `healthUnit`
- Novas solicitações incluem o campo
- Antigas continuam funcionando (customData é flexível)

## 🎓 CONCLUSÃO

O novo approach **NÃO substitui** o sistema existente - ele **ORGANIZA** o código em um padrão de template, mantendo 100% de compatibilidade com:
- ✅ Serviços configuráveis
- ✅ Formulários editáveis
- ✅ Motor de protocolos
- ✅ Upload de documentos
- ✅ Recursos avançados
- ✅ Layout das páginas

É uma **refatoração organizacional**, não uma reescrita funcional!
