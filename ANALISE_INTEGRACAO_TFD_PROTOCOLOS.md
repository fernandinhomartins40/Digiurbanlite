# 📋 ANÁLISE COMPLETA: INTEGRAÇÃO TFD ↔ SISTEMA DE PROTOCOLOS

**Data:** 26/11/2025
**Autor:** Claude Code
**Status:** Aguardando Aprovação

---

## 🎯 OBJETIVO DA ANÁLISE

Analisar o APP TFD implementado e identificar desalinhamentos com o sistema de serviços/protocolos do DigiUrban, propondo uma arquitetura de integração completa.

---

## 📊 SITUAÇÃO ATUAL DO APP TFD

### ✅ O QUE FOI IMPLEMENTADO

#### Backend (100%)
- ✅ **Models Prisma:** `SolicitacaoTFD`, `ViagemTFD`, `VeiculoTFD`, `MotoristaTFD`
- ✅ **Services:**
  - `tfd.service.ts` (CRUD completo)
  - `tfd-montador.service.ts` (algoritmo montador de listas)
  - `protocol-to-tfd.service.ts` (integração com protocolos)
- ✅ **Rotas API:** 18 endpoints em `/api/tfd/*`

#### Frontend (100%)
- ✅ **11 páginas React/Next.js**
  - Dashboard principal
  - Listagem de solicitações
  - Formulário "Nova Solicitação"
  - 3 filas de trabalho
  - Gestão de viagens
  - Montador de listas
  - Gestão de frota (veículos e motoristas)

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **Criação de Solicitação Paralela ao Sistema de Protocolos**

**Problema:**
A página `/admin/apps/saude/tfd/solicitacoes/nova` cria solicitações TFD diretamente via `POST /api/tfd/solicitacoes`, sem passar pelo sistema de protocolos.

**Código Atual (INCORRETO):**
```tsx
// frontend/app/admin/apps/saude/tfd/solicitacoes/nova/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  // ❌ Cria TFD diretamente, sem protocolo
  const response = await fetch('/api/tfd/solicitacoes', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
};
```

**Impacto:**
- ❌ Solicitações TFD não geram protocolos
- ❌ Não aparecem no sistema unificado de protocolos
- ❌ Não têm rastreamento via número de protocolo
- ❌ Não passam pelo workflow engine
- ❌ Não integram com citizen links

---

### 2. **Dados Mock no Dashboard e Listagens**

**Problema:**
Todas as páginas do TFD usam dados mockados (hardcoded) ao invés de consumir a API real.

**Código Atual (INCORRETO):**
```tsx
// frontend/app/admin/apps/saude/tfd/page.tsx (Dashboard)
const loadStats = async () => {
  // TODO: Implementar chamada real à API
  // const response = await fetch('/api/tfd/dashboard/stats');

  // ❌ Mock data temporário
  setStats({
    totalSolicitacoes: 156,
    aguardandoAnalise: 12,
    // ... dados fake
  });
};
```

**Impacto:**
- ❌ Interface não reflete dados reais do banco
- ❌ Impossível testar o sistema funcionando
- ❌ Usuários veem dados falsos

---

### 3. **Falta de Serviço COM_DADOS no Seed**

**Problema:**
Não existe um serviço `COM_DADOS` com `moduleType: 'ENCAMINHAMENTOS_TFD'` no seed da Secretaria de Saúde.

**Impacto:**
- ❌ Cidadãos não conseguem solicitar TFD pelo portal
- ❌ Não há formulário estruturado para TFD
- ❌ Não há validação de campos obrigatórios

---

### 4. **Service `protocol-to-tfd.service.ts` Não é Utilizado**

**Problema:**
O serviço de conversão `protocol → TFD` existe, mas não há chamadas automáticas ou manuais para ele.

**Código Existente (NÃO UTILIZADO):**
```typescript
// backend/src/services/tfd/protocol-to-tfd.service.ts
async convertProtocolToTFD(protocolId: string) {
  // ✅ Código implementado
  // ❌ Nunca é chamado
}
```

**Impacto:**
- ❌ Protocolos criados manualmente não viram solicitações TFD
- ❌ Integração protocolo ↔ TFD não funciona

---

## 🏗️ ARQUITETURA PROPOSTA: INTEGRAÇÃO COMPLETA

### PADRÃO 1: Sistema de Abas Genérico (RECOMENDADO)

#### Vantagens:
- ✅ Reutiliza infraestrutura existente
- ✅ Integração automática com protocolos
- ✅ Menos código para manter
- ✅ Padrão consistente com outros módulos

#### Desvantagens:
- ⚠️ Interface genérica (menos customização visual)
- ⚠️ Funcionalidades avançadas precisam de extensions

---

### PADRÃO 2: APP Específico Integrado (RECOMENDADO PARA TFD)

#### Vantagens:
- ✅ Interface 100% customizada
- ✅ Funcionalidades avançadas (montador de listas)
- ✅ Tabelas auxiliares próprias (veículos, motoristas)
- ✅ Lógica de negócio complexa específica

#### Desvantagens:
- ⚠️ Mais código para manter
- ⚠️ Precisa integrar manualmente com protocolos

---

## 🔧 PROPOSTA DE IMPLEMENTAÇÃO

### FASE 1: Criar Serviço COM_DADOS para TFD

**Arquivo:** `backend/prisma/seeds/services/health.seed.ts`

```typescript
{
  name: 'Encaminhamento TFD (Tratamento Fora do Domicílio)',
  description: 'Solicitação de tratamento médico em outras cidades',
  serviceType: 'COM_DADOS',
  moduleType: 'ENCAMINHAMENTOS_TFD',  // ⭐ Chave de roteamento
  category: 'Assistência à Saúde',
  requiresDocuments: true,
  requiredDocuments: [
    { id: 'encaminhamento_medico', name: 'Encaminhamento Médico', required: true },
    { id: 'exames', name: 'Exames Médicos', required: false }
  ],
  estimatedDays: 30,

  formSchema: {
    citizenFields: [
      'citizen_name', 'citizen_cpf', 'citizen_rg',
      'citizen_birthdate', 'citizen_phone', 'citizen_email'
    ],
    fields: [
      // DADOS MÉDICOS
      {
        id: 'especialidade',
        label: 'Especialidade Médica',
        type: 'select',
        required: true,
        options: [
          'Cardiologia', 'Oncologia', 'Neurologia',
          'Ortopedia', 'Oftalmologia', 'Nefrologia', 'Outras'
        ]
      },
      {
        id: 'especialidadeOutra',
        label: 'Qual especialidade?',
        type: 'text',
        required: false,
        visibleWhen: { field: 'especialidade', value: 'Outras' }
      },
      {
        id: 'procedimento',
        label: 'Procedimento/Tratamento Necessário',
        type: 'textarea',
        required: true,
        placeholder: 'Descreva o procedimento necessário'
      },
      {
        id: 'justificativaMedica',
        label: 'Justificativa Médica',
        type: 'textarea',
        required: true,
        placeholder: 'Justifique a necessidade do tratamento fora do domicílio'
      },
      {
        id: 'medicoSolicitante',
        label: 'Nome do Médico Solicitante',
        type: 'text',
        required: true
      },
      {
        id: 'crmMedico',
        label: 'CRM do Médico',
        type: 'text',
        required: true,
        pattern: '^\\d{4,8}$'
      },
      {
        id: 'cid10',
        label: 'CID-10',
        type: 'text',
        required: false,
        placeholder: 'Ex: C50.9'
      },

      // DESTINO
      {
        id: 'cidadeDestino',
        label: 'Cidade de Destino',
        type: 'text',
        required: true,
        placeholder: 'Ex: São Paulo'
      },
      {
        id: 'estadoDestino',
        label: 'Estado de Destino',
        type: 'select',
        required: true,
        options: ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE']
      },
      {
        id: 'hospitalDestino',
        label: 'Hospital/Clínica de Destino',
        type: 'text',
        required: false
      },

      // PRIORIDADE
      {
        id: 'prioridade',
        label: 'Prioridade',
        type: 'select',
        required: true,
        options: ['EMERGENCIA', 'ALTA', 'MEDIA', 'ROTINA'],
        default: 'MEDIA'
      },

      // ACOMPANHANTE
      {
        id: 'necessitaAcompanhante',
        label: 'Necessita Acompanhante?',
        type: 'checkbox',
        required: false,
        default: false
      },
      {
        id: 'justificativaAcompanhante',
        label: 'Justificativa para Acompanhante',
        type: 'textarea',
        required: false,
        visibleWhen: { field: 'necessitaAcompanhante', value: true }
      },
      {
        id: 'nomeAcompanhante',
        label: 'Nome do Acompanhante',
        type: 'text',
        required: false,
        visibleWhen: { field: 'necessitaAcompanhante', value: true }
      },
      {
        id: 'cpfAcompanhante',
        label: 'CPF do Acompanhante',
        type: 'text',
        required: false,
        pattern: '^\\d{11}$',
        visibleWhen: { field: 'necessitaAcompanhante', value: true }
      },

      // OUTROS
      {
        id: 'observacoes',
        label: 'Observações Adicionais',
        type: 'textarea',
        required: false
      }
    ]
  },

  // CONFIGURAÇÃO DE CITIZEN LINKS
  linkedCitizensConfig: {
    enabled: true,
    links: [
      {
        linkType: 'COMPANION',
        role: 'COMPANION',
        label: 'Acompanhante',
        required: false,
        mapFromLegacyFields: {
          name: 'nomeAcompanhante',
          cpf: 'cpfAcompanhante'
        },
        onlyIfCondition: {
          field: 'necessitaAcompanhante',
          value: true
        }
      }
    ]
  }
}
```

**Resultado:**
- ✅ Serviço aparece no portal do cidadão
- ✅ Formulário estruturado e validado
- ✅ Cria protocolo automaticamente
- ✅ Citizen link com acompanhante

---

### FASE 2: Automatizar Conversão Protocolo → TFD

#### Opção A: Hook Automático (RECOMENDADO)

**Arquivo:** `backend/src/services/protocol-module.service.ts`

```typescript
async createProtocolWithModule(input: CreateProtocolWithModuleInput) {
  // ... código existente ...

  const result = await prisma.$transaction(async (tx) => {
    // Criar protocolo
    const protocol = await tx.protocolSimplified.create({...});

    // ... resto do código ...

    return { protocol, isComDados, hasModule };
  });

  // ⭐ NOVO: Hook automático para TFD
  if (result.protocol.moduleType === 'ENCAMINHAMENTOS_TFD') {
    try {
      await protocolToTFDService.convertProtocolToTFD(result.protocol.id);
      console.log(`✅ Protocolo ${result.protocol.number} convertido automaticamente para TFD`);
    } catch (error) {
      console.error('❌ Erro ao converter protocolo para TFD:', error);
      // Não falha a criação do protocolo
    }
  }

  return result;
}
```

**Resultado:**
- ✅ Protocolo criado pelo cidadão → Solicitação TFD automática
- ✅ Zero intervenção manual
- ✅ Dados migrados de `customData` → `SolicitacaoTFD`

---

#### Opção B: Botão Manual de Conversão

**Frontend:** Adicionar botão na listagem de protocolos TFD

```tsx
// app/admin/protocolos/page.tsx
<Button
  onClick={async () => {
    await fetch(`/api/tfd/convert-protocol/${protocol.id}`, {
      method: 'POST'
    });
    toast.success('Protocolo convertido para TFD!');
  }}
>
  Converter para TFD
</Button>
```

**Resultado:**
- ✅ Admin escolhe quando converter
- ⚠️ Requer ação manual

---

### FASE 3: Alinhar Dashboard do APP TFD com Dados Reais

#### 3.1. Criar Endpoints de Dashboard

**Arquivo:** `backend/src/routes/tfd.routes.ts`

```typescript
// ⭐ NOVO: Endpoint de estatísticas para dashboard
router.get('/dashboard/stats', async (req, res) => {
  const stats = await tfdService.getDashboardStats();
  res.json(stats);
});
```

**Service:**

```typescript
// backend/src/services/tfd/tfd.service.ts
async getDashboardStats() {
  const [
    totalSolicitacoes,
    aguardandoAnalise,
    aguardandoRegulacao,
    aguardandoGestao,
    agendados,
    emViagem,
    realizados,
    cancelados,
    viagensHoje,
    veiculosDisponiveis,
    motoristasDisponiveis
  ] = await Promise.all([
    prisma.solicitacaoTFD.count(),
    prisma.solicitacaoTFD.count({ where: { status: 'AGUARDANDO_ANALISE_DOCUMENTAL' } }),
    prisma.solicitacaoTFD.count({ where: { status: 'AGUARDANDO_REGULACAO_MEDICA' } }),
    prisma.solicitacaoTFD.count({ where: { status: 'AGUARDANDO_APROVACAO_GESTAO' } }),
    prisma.solicitacaoTFD.count({ where: { status: 'AGENDADO' } }),
    prisma.solicitacaoTFD.count({ where: { status: 'EM_VIAGEM' } }),
    prisma.solicitacaoTFD.count({ where: { status: 'REALIZADO' } }),
    prisma.solicitacaoTFD.count({ where: { status: 'CANCELADO' } }),
    prisma.viagemTFD.count({
      where: {
        dataViagem: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    }),
    prisma.veiculoTFD.count({ where: { status: 'DISPONIVEL' } }),
    prisma.motoristaTFD.count({ where: { status: 'DISPONIVEL' } })
  ]);

  // Calcular despesas do mês
  const despesasMes = await prisma.viagemTFD.aggregate({
    where: {
      dataViagem: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: {
      valorDespesas: true
    }
  });

  return {
    totalSolicitacoes,
    aguardandoAnalise,
    aguardandoRegulacao,
    aguardandoGestao,
    agendados,
    emViagem,
    realizados,
    cancelados,
    viagensHoje,
    despesasMes: despesasMes._sum.valorDespesas || 0,
    veiculosDisponiveis,
    motoristasDisponiveis
  };
}
```

#### 3.2. Atualizar Frontend para Consumir API Real

**Arquivo:** `frontend/app/admin/apps/saude/tfd/page.tsx`

```tsx
const loadStats = async () => {
  try {
    setLoading(true);

    // ✅ Chamada real à API
    const response = await fetch('/api/tfd/dashboard/stats');
    const data = await response.json();

    setStats(data);
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    toast({
      title: 'Erro',
      description: 'Não foi possível carregar as estatísticas.',
      variant: 'destructive'
    });
  } finally {
    setLoading(false);
  }
};
```

**Resultado:**
- ✅ Dashboard mostra dados reais do banco
- ✅ Métricas atualizadas em tempo real

---

### FASE 4: Remover Página "Nova Solicitação" do APP

**Ação:**
Deletar ou desabilitar `/admin/apps/saude/tfd/solicitacoes/nova/page.tsx`

**Motivo:**
Solicitações devem ser criadas via:
1. **Portal do Cidadão** → Serviço "Encaminhamento TFD" → Protocolo → TFD automático
2. **Admin** → Botão "Novo Protocolo" → Selecionar serviço TFD → Protocolo → TFD automático

**Alternativa:**
Redirecionar o botão "Nova Solicitação" para a página de criar protocolo:

```tsx
// frontend/app/admin/apps/saude/tfd/page.tsx
<Button
  onClick={() => router.push('/admin/servicos?search=TFD')}
>
  <Plus /> Nova Solicitação (via Protocolo)
</Button>
```

**Resultado:**
- ✅ Fluxo único de criação (via protocolos)
- ✅ Sem código duplicado

---

### FASE 5: Alinhar Listagem de Solicitações com Protocolos

#### 5.1. Atualizar Endpoint de Listagem

**Arquivo:** `backend/src/routes/tfd.routes.ts`

```typescript
router.get('/solicitacoes', async (req, res) => {
  const { status, prioridade, search } = req.query;

  const solicitacoes = await prisma.solicitacaoTFD.findMany({
    where: {
      ...(status && status !== 'all' && { status: status as TFDStatus }),
      ...(prioridade && prioridade !== 'all' && { prioridade: prioridade as PrioridadeTFD }),
      ...(search && {
        OR: [
          { protocolId: { contains: search as string } },
          { // Buscar no protocolo relacionado
            // TODO: Implementar join com ProtocolSimplified
          }
        ]
      })
    },
    include: {
      // ⭐ Incluir dados do protocolo relacionado
      // TODO: Adicionar relação no schema Prisma
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ data: solicitacoes });
});
```

#### 5.2. Atualizar Frontend

```tsx
// frontend/app/admin/apps/saude/tfd/solicitacoes/page.tsx
const loadSolicitacoes = async () => {
  try {
    let url = '/api/tfd/solicitacoes?';
    if (statusFilter !== 'all') url += `status=${statusFilter}&`;
    if (prioridadeFilter !== 'all') url += `prioridade=${prioridadeFilter}&`;
    if (searchTerm) url += `search=${searchTerm}`;

    const response = await fetch(url);
    const data = await response.json();

    setSolicitacoes(data.data);
  } catch (error) {
    console.error('Erro ao carregar solicitações:', error);
  } finally {
    setLoading(false);
  }
};
```

**Resultado:**
- ✅ Listagem mostra dados reais
- ✅ Filtros funcionam
- ✅ Busca por protocolo/nome/CPF

---

## 📐 ARQUITETURA FINAL PROPOSTA

```
┌─────────────────────────────────────────────────────────────┐
│                    PORTAL DO CIDADÃO                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Cidadão acessa serviço "Encaminhamento TFD"             │
│ 2. Preenche formulário estruturado                          │
│ 3. Anexa encaminhamento médico + exames                     │
│ 4. Submete solicitação                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND: protocol-module.service               │
├─────────────────────────────────────────────────────────────┤
│ ✅ Cria ProtocolSimplified                                  │
│   - number: "2025-SAUDE-00123"                             │
│   - moduleType: "ENCAMINHAMENTOS_TFD"                      │
│   - customData: {...formData, _meta: {...}}               │
│   - status: VINCULADO                                      │
│                                                             │
│ ✅ Processa Citizen Links                                   │
│   - Cria link com Acompanhante (se informado)             │
│                                                             │
│ ✅ Aplica Workflow                                          │
│   - Cria etapas: Análise → Regulação → Aprovação          │
│                                                             │
│ ⭐ Hook Automático: convertProtocolToTFD()                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           BACKEND: protocol-to-tfd.service                  │
├─────────────────────────────────────────────────────────────┤
│ ✅ Extrai dados de customData                               │
│ ✅ Cria SolicitacaoTFD                                      │
│   - protocolId: link com o protocolo                       │
│   - workflowId: link com workflow                          │
│   - status: AGUARDANDO_ANALISE_DOCUMENTAL                  │
│   - todos os campos médicos                                │
│                                                             │
│ ✅ Atualiza protocolo                                       │
│   - customData._meta.tfdSolicitacaoId: "uuid"             │
│   - customData._meta.convertedToTFD: true                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 ADMIN: APP TFD (Frontend)                   │
├─────────────────────────────────────────────────────────────┤
│ Dashboard:                                                  │
│   - GET /api/tfd/dashboard/stats → métricas reais          │
│                                                             │
│ Listagem de Solicitações:                                  │
│   - GET /api/tfd/solicitacoes → dados do banco            │
│   - Busca, filtros, paginação                             │
│                                                             │
│ Filas de Trabalho:                                          │
│   - Análise Documental                                     │
│   - Regulação Médica                                       │
│   - Aprovação Gestão                                       │
│                                                             │
│ Gestão de Viagens:                                          │
│   - Montador automático de listas                         │
│   - Alocação de veículos e motoristas                     │
│                                                             │
│ Gestão de Frota:                                            │
│   - CRUD veículos                                          │
│   - CRUD motoristas                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: Serviço COM_DADOS
- [ ] Adicionar serviço "Encaminhamento TFD" no `health.seed.ts`
- [ ] Rodar seed: `npx prisma db seed`
- [ ] Verificar serviço no banco: `SELECT * FROM services_simplified WHERE moduleType = 'ENCAMINHAMENTOS_TFD'`

### FASE 2: Hook Automático
- [ ] Adicionar hook em `protocol-module.service.ts`
- [ ] Testar criação de protocolo via portal
- [ ] Verificar solicitação TFD criada automaticamente

### FASE 3: Dashboard com Dados Reais
- [ ] Criar endpoint `/api/tfd/dashboard/stats`
- [ ] Implementar `getDashboardStats()` no service
- [ ] Atualizar frontend para consumir API real
- [ ] Testar métricas no dashboard

### FASE 4: Remover "Nova Solicitação"
- [ ] Deletar `/admin/apps/saude/tfd/solicitacoes/nova/page.tsx`
- [ ] Redirecionar botão para criação de protocolo
- [ ] Testar fluxo completo

### FASE 5: Listagem com Dados Reais
- [ ] Atualizar endpoint `/api/tfd/solicitacoes`
- [ ] Atualizar frontend da listagem
- [ ] Testar filtros e busca

### FASE 6: Adicionar Relação Prisma
- [ ] Adicionar campo `protocolId` como FK em `SolicitacaoTFD`
- [ ] Adicionar relação em `ProtocolSimplified`
- [ ] Rodar migration: `npx prisma migrate dev`

---

## 🚀 RESULTADO ESPERADO

### Fluxo Completo Integrado:

1. **Cidadão** solicita TFD pelo portal
2. **Sistema** cria protocolo automaticamente
3. **Sistema** converte protocolo em solicitação TFD (hook automático)
4. **Admin** visualiza no APP TFD com dados reais
5. **Admin** processa nas filas de trabalho
6. **Admin** monta listas de viagens
7. **Admin** gerencia frota
8. **Sistema** sincroniza status protocolo ↔ TFD

### Benefícios:

✅ **Zero duplicação:** Um único ponto de entrada (protocolos)
✅ **Rastreabilidade:** Todos TFDs têm número de protocolo
✅ **Consistência:** Dados reais em todos os lugares
✅ **Integração:** Citizen links, workflows, SLA funcionando
✅ **Escalabilidade:** Padrão reutilizável para outros APPS

---

## ❓ DÚVIDAS PARA O CLIENTE

1. **Conversão automática ou manual?**
   - Opção A: Protocolo TFD → Solicitação TFD automática (RECOMENDADO)
   - Opção B: Admin clica em "Converter para TFD" manualmente

2. **Manter página "Nova Solicitação"?**
   - Opção A: Deletar e forçar criação via protocolo (RECOMENDADO)
   - Opção B: Manter como atalho, mas criar protocolo por trás

3. **Prioridade das fases?**
   - Implementar todas as 6 fases ou começar por alguma específica?

---

## 📝 CONCLUSÃO

O APP TFD está **100% implementado** em termos de funcionalidades, mas está **desconectado do sistema de protocolos**.

A proposta de integração mantém todas as funcionalidades avançadas do APP (montador de listas, gestão de frota) enquanto alinha com a arquitetura unificada de protocolos do DigiUrban.

**Aguardando aprovação para prosseguir com a implementação.**

---

**Próximos passos após aprovação:**
1. Implementar FASE 1 (Serviço COM_DADOS)
2. Implementar FASE 2 (Hook automático)
3. Implementar FASE 3 (Dashboard com dados reais)
4. Testar fluxo completo end-to-end
5. Documentar mudanças

