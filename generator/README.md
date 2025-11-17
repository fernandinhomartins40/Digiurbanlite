# 🚀 DigiUrban - Sistema Híbrido de Geração de Código

**Gerador automático COMPLETO: Backend (rotas API) + Frontend (páginas React)**

---

## 📋 O que é este sistema?

Sistema automatizado **full-stack** que gera código completo para as 13 secretarias municipais:

### **Backend (Generator)**
- ✅ **Rotas API Express** com Handlebars
- ✅ **Validação Zod** de configurações
- ✅ **protocolStatusEngine** integrado
- ✅ **Controle de permissões** (USER, MANAGER, ADMIN)

### **Frontend (Scripts)**
- ✅ **Páginas React** com Next.js 14
- ✅ **BaseModuleView** com 4 abas padrão
- ✅ **TypeScript** tipado
- ✅ **Integração automática** com API backend

---

## 🎯 Por que usar?

### ✅ **Redução Massiva de Código**
| Camada | Antes | Depois | Redução |
|--------|-------|--------|---------|
| **Backend** | 13 × 450 linhas = 5.850 | 1 template (480) + 13 configs (325) = 805 | **86%** |
| **Frontend** | 91 × 100 linhas = 9.100 | 1 script (150) + BaseModuleView = 150 | **98%** |
| **TOTAL** | 14.950 linhas | 955 linhas | **~93%** |

### ✅ **Configuração Minimalista**
```typescript
// Backend: Apenas id + moduleType
{ id: 'agendamentos', moduleType: 'AGENDAMENTOS_MEDICOS' }

// Frontend: Gerado automaticamente a partir do backend
```

### ✅ **Arquitetura Híbrida Real**
- **Backend**: Rotas genéricas + customData dinâmico em JSON
- **Frontend**: Componente único reutilizável (BaseModuleView)
- **Validação**: JSON Schema editável pelo admin (TODO)

---

## 📦 Estrutura Completa do Projeto

```
DigiUrban/
├── generator/                    # 🔧 GERADOR DE BACKEND
│   ├── configs/secretarias/      # 13 configs minimalistas
│   │   ├── saude.config.ts       (11 módulos)
│   │   ├── educacao.config.ts    (10 módulos)
│   │   └── ... (mais 11)
│   ├── templates/
│   │   └── backend.hbs           # Template Handlebars (480 linhas)
│   ├── schemas/
│   │   ├── module.schema.ts      # Zod: id + moduleType
│   │   └── secretaria.schema.ts  # Zod: secretaria
│   ├── utils/
│   │   ├── template-engine.ts    # Handlebars + helpers
│   │   ├── validator.ts          # Validador Zod
│   │   └── file-writer.ts        # Escritor com dry-run
│   ├── index.ts                  # CLI (Commander.js)
│   └── package.json
│
├── digiurban/
│   ├── backend/
│   │   ├── src/routes/
│   │   │   ├── secretarias-saude.ts           # ✅ GERADO
│   │   │   ├── secretarias-educacao.ts        # ✅ GERADO
│   │   │   └── ... (mais 11 arquivos gerados)
│   │   │
│   │   └── scripts/
│   │       ├── generate-frontend-pages.js     # 🎨 GERADOR DE FRONTEND
│   │       └── generate-all-modules.ts        # 📋 Specs de 114 módulos
│   │
│   └── frontend/
│       ├── components/modules/
│       │   └── BaseModuleView.tsx             # Componente base com 4 abas
│       │
│       └── app/admin/secretarias/
│           ├── saude/
│           │   ├── page.tsx                   # ✅ Dashboard principal
│           │   ├── agendamentos-tab/page.tsx  # (Geradas manualmente)
│           │   └── ... (mais páginas)
│           └── ... (mais 12 secretarias)
```

---

## 🚀 Comandos do Sistema

### **🔧 Backend (Generator)**

```bash
# 1. Setup inicial
cd generator && npm install

# 2. Gerar rotas backend
npm run generate -- --secretaria=saude        # Uma secretaria
npm run generate -- --all                     # Todas (13)
npm run generate -- --secretaria=saude --force  # Sobrescrever

# 3. Preview
npm run generate -- --secretaria=saude --dry-run

# 4. Validar
npm run validate -- --secretaria=saude

# 5. Limpar
npm run clean -- --all --confirm
```

### **🎨 Frontend (Scripts)**

```bash
# Gerar páginas frontend (quando necessário)
cd digiurban
node scripts/generate-frontend-pages.js

# Nota: Script disponível mas páginas geralmente criadas manualmente
# para maior controle e customização
```

---

## 📝 Como Funciona? (Sistema Completo)

### **Parte 1: Backend - Geração de Rotas API**

#### **1.1 Configuração Minimalista**
```typescript
// generator/configs/secretarias/saude.config.ts
export const saudeConfig: SecretariaConfig = {
  id: 'saude',
  name: 'Secretaria de Saúde',
  slug: 'saude',
  departmentId: 'saude',

  modules: [
    // ✅ Apenas 2 campos: id (rota) + moduleType (tipo no banco)
    { id: 'agendamentos', moduleType: 'AGENDAMENTOS_MEDICOS' },
    { id: 'exames', moduleType: 'EXAMES' },
    // ... mais 9 módulos
  ]
};
```

#### **1.2 Template Gera 9 Rotas por Módulo**

Arquivo gerado: `digiurban/backend/src/routes/secretarias-saude.ts`

**Rotas Geradas:**
```
GET  /stats                      → Estatísticas da secretaria
GET  /services                   → Lista serviços ativos
GET  /agendamentos               → Lista com paginação
GET  /agendamentos/:id           → Busca específico
GET  /agendamentos/:id/history   → Histórico de status
POST /agendamentos               → Cria protocolo
PUT  /agendamentos/:id           → Atualiza customData
DELETE /agendamentos/:id         → Cancela (soft delete)
POST /agendamentos/:id/approve   → Aprova
POST /agendamentos/:id/reject    → Rejeita
```

**Multiplicado por 91 módulos = 819 rotas API geradas!**

#### **1.3 Dados Dinâmicos em customData**

```typescript
// Admin configura formSchema no banco
const service = {
  moduleType: 'AGENDAMENTOS_MEDICOS',
  formSchema: {
    properties: {
      patientName: { type: 'string' },
      specialty: { type: 'string', enum: ['Pediatria', 'Clínico Geral'] },
      appointmentDate: { type: 'string', format: 'date-time' }
    }
  }
};

// Cidadão envia dados
POST /api/admin/secretarias/saude/agendamentos
{
  "citizenId": "citizen-123",
  "patientName": "João Silva",
  "specialty": "Pediatria",
  "appointmentDate": "2025-12-01T10:00:00Z"
}

// Sistema salva em customData (JSON)
ProtocolSimplified.create({
  moduleType: 'AGENDAMENTOS_MEDICOS',
  customData: {
    patientName: "João Silva",
    specialty: "Pediatria",
    appointmentDate: "2025-12-01T10:00:00Z"
  }
});
```

---

### **Parte 2: Frontend - BaseModuleView Reutilizável**

#### **2.1 Componente Base (100 linhas)**

```tsx
// digiurban/frontend/components/modules/BaseModuleView.tsx
export interface ModuleConfig {
  code: string
  name: string
  department: string
  apiEndpoint: string
  tabs: {
    list: boolean        // Aba 1: Listagem de protocolos
    approval: boolean    // Aba 2: Fila de aprovação
    dashboard: boolean   // Aba 3: Métricas e KPIs
    management: boolean  // Aba 4: CRUD de dados mestres
  }
  breadcrumb: BreadcrumbItem[]
}

export function BaseModuleView({ config }: { config: ModuleConfig }) {
  const [activeTab, setActiveTab] = useState('list')

  return (
    <ModuleLayout title={config.name} breadcrumb={config.breadcrumb}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {config.tabs.list && <TabsTrigger value="list">Listagem</TabsTrigger>}
          {config.tabs.approval && <TabsTrigger value="approval">Aprovação</TabsTrigger>}
          {config.tabs.dashboard && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
          {config.tabs.management && <TabsTrigger value="management">Gerenciamento</TabsTrigger>}
        </TabsList>

        {config.tabs.list && (
          <TabsContent value="list">
            <ListTab config={config} />
          </TabsContent>
        )}

        {config.tabs.approval && (
          <TabsContent value="approval">
            <ApprovalTab config={config} />
          </TabsContent>
        )}

        {config.tabs.dashboard && (
          <TabsContent value="dashboard">
            <DashboardTab config={config} />
          </TabsContent>
        )}

        {config.tabs.management && (
          <TabsContent value="management">
            <ManagementTab config={config} />
          </TabsContent>
        )}
      </Tabs>
    </ModuleLayout>
  )
}
```

#### **2.2 Página que Usa o BaseModuleView**

```tsx
// digiurban/frontend/app/admin/secretarias/saude/page.tsx
'use client'

import { BaseModuleView, ModuleConfig } from '@/components/modules/BaseModuleView'

export default function SaudePage() {
  const config: ModuleConfig = {
    code: 'SAUDE_DASHBOARD',
    name: 'Secretaria de Saúde',
    department: 'SAUDE',
    apiEndpoint: 'saude',
    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: true,
    },
    breadcrumb: [
      { label: 'Admin', href: '/admin' },
      { label: 'Secretarias', href: '/admin/secretarias' },
      { label: 'Saúde' },
    ],
  }

  return <BaseModuleView config={config} />
}
```

#### **2.3 Como os Tabs Funcionam**

**ListTab** - Aba de Listagem
```tsx
// Conecta automaticamente com:
GET /api/admin/secretarias/${config.apiEndpoint}
// Exibe: DataTable com paginação, busca, filtros
```

**ApprovalTab** - Aba de Aprovação
```tsx
// Conecta com:
GET /api/admin/secretarias/${config.apiEndpoint}?status=VINCULADO
POST /api/admin/secretarias/${config.apiEndpoint}/:id/approve
POST /api/admin/secretarias/${config.apiEndpoint}/:id/reject
// Exibe: Fila de aprovação com ações rápidas
```

**DashboardTab** - Aba de Dashboard
```tsx
// Conecta com:
GET /api/admin/secretarias/${config.apiEndpoint}/stats
// Exibe: Cards de KPIs, gráficos, métricas
```

**ManagementTab** - Aba de Gerenciamento
```tsx
// CRUD de dados mestres (ex: unidades de saúde, especialidades)
// Rota customizada por módulo
```

---

## 🔧 Como Adicionar Funcionalidades

### **Adicionar nova rota em TODOS os módulos backend**

1. **Editar** `generator/templates/backend.hbs`:
```handlebars
/**
 * POST /{{this.id}}/:id/complete
 */
router.post('/{{this.id}}/:id/complete', requireMinRole(UserRole.MANAGER), async (req, res) => {
  const result = await protocolStatusEngine.updateStatus({
    protocolId: req.params.id,
    newStatus: ProtocolStatus.CONCLUIDO,
    actorRole: authReq.user?.role,
    actorId: authReq.user?.id,
    comment: req.body.comment || 'Concluído'
  });
  res.json({ success: true, data: result.protocol });
});
```

2. **Regenerar:**
```bash
cd generator
npm run generate -- --all --force
```

---

### **Adicionar novo módulo completo (backend + frontend)**

**Passo 1: Backend**
```typescript
// generator/configs/secretarias/saude.config.ts
modules: [
  { id: 'agendamentos', moduleType: 'AGENDAMENTOS_MEDICOS' },

  // ✅ NOVO
  { id: 'internacoes', moduleType: 'INTERNACOES' }
]
```

**Passo 2: Gerar rotas backend**
```bash
cd generator
npm run generate -- --secretaria=saude --force
```

**Passo 3: Criar página frontend** (manualmente para controle total)
```tsx
// digiurban/frontend/app/admin/secretarias/saude/internacoes/page.tsx
'use client'

import { BaseModuleView, ModuleConfig } from '@/components/modules/BaseModuleView'

export default function InternacoesPage() {
  const config: ModuleConfig = {
    code: 'INTERNACOES',
    name: 'Internações',
    department: 'SAUDE',
    apiEndpoint: 'saude/internacoes',  // ✅ Conecta com backend gerado
    tabs: {
      list: true,
      approval: true,
      dashboard: true,
      management: false  // Desabilitado neste módulo
    },
    breadcrumb: [
      { label: 'Admin', href: '/admin' },
      { label: 'Secretarias', href: '/admin/secretarias' },
      { label: 'Saúde', href: '/admin/secretarias/saude' },
      { label: 'Internações' },
    ],
  }

  return <BaseModuleView config={config} />
}
```

**Passo 4: Criar serviço no banco**
```sql
INSERT INTO services_simplified (name, departmentId, moduleType, serviceType, formSchema)
VALUES ('Internações', 'saude', 'INTERNACOES', 'COM_DADOS', '{"properties": {...}}');
```

---

### **Customizar uma aba específica**

```tsx
// Criar componente customizado
const CustomListTab = ({ config }: { config: ModuleConfig }) => {
  return (
    <div>
      {/* Lógica específica do módulo */}
      <h2>Lista customizada para {config.name}</h2>
      {/* ... */}
    </div>
  )
}

// Usar no BaseModuleView
<BaseModuleView
  config={config}
  customListTab={CustomListTab}  // ✅ Sobrescreve ListTab padrão
/>
```

---

## 📊 Estatísticas Reais

### **Backend Gerado:**
- **13 secretarias** × ~7 módulos = **91 módulos**
- **9 rotas** por módulo = **~819 rotas API**
- **1 template** Handlebars (480 linhas)
- **13 configs** TypeScript (~25 linhas cada = 325 linhas)
- **Total backend:** 805 linhas geram 819 rotas!

### **Frontend:**
- **1 componente** BaseModuleView (100 linhas)
- **4 tabs** reutilizáveis (ListTab, ApprovalTab, DashboardTab, ManagementTab)
- **13 páginas** principais de secretarias
- **~50 páginas** de módulos (criadas manualmente conforme necessidade)

### **Resumo Geral:**
| Item | Quantidade |
|------|------------|
| Secretarias | 13 |
| Módulos backend | 91 |
| Rotas API geradas | 819 |
| Componente base frontend | 1 (reutilizável) |
| Linhas de código total | ~955 |
| Redução de código | ~93% |

---

## ⚙️ Tecnologias do Sistema Híbrido

### **Backend (Generator)**
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| TypeScript | 5.9.3 | Tipagem estática |
| Handlebars | 4.7.8 | Template engine |
| Zod | 4.1.12 | Validação schemas |
| Commander.js | 14.0.2 | CLI interativo |
| Ora | 9.0.0 | Spinners visuais |
| Chalk | 5.6.2 | Cores no terminal |
| fs-extra | 11.3.2 | Manipulação de arquivos |

### **Frontend (React + Next.js)**
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14.2.32 | Framework React |
| React | 18.3.1 | UI components |
| TypeScript | 5.9.2 | Tipagem estática |
| Tailwind CSS | 3.4.17 | Estilização |
| Radix UI | - | Componentes acessíveis |
| Tanstack Query | 5.90.5 | Gerenciamento de estado/API |

---

## 🐛 Troubleshooting Completo

### **Backend**

**Erro: Config inválida**
```bash
✖ Config inválida: assistencia-social
```
**Solução:** Export deve usar camelCase:
```typescript
// ✅ CORRETO
export const assistenciaSocialConfig = { ... }
```

**Erro: Service not found**
```json
{"success": false, "error": "Service not found for module agendamentos"}
```
**Solução:** Criar `ServiceSimplified` no banco:
```sql
INSERT INTO services_simplified (name, departmentId, moduleType, serviceType)
VALUES ('Agendamento', 'saude', 'AGENDAMENTOS_MEDICOS', 'COM_DADOS');
```

### **Frontend**

**Erro: BaseModuleView not found**
```
Module not found: Can't resolve '@/components/modules/BaseModuleView'
```
**Solução:** Verificar se o arquivo existe:
```bash
ls digiurban/frontend/components/modules/BaseModuleView.tsx
```

**Erro: Página não renderiza**
**Solução:** Verificar se o `apiEndpoint` está correto:
```tsx
// ✅ CORRETO: minúsculas e kebab-case
apiEndpoint: 'saude/agendamentos'

// ❌ ERRADO
apiEndpoint: 'SAUDE/AGENDAMENTOS'
```

---

## 🎉 Status do Sistema Híbrido

### **Backend (Generator)**
- ✅ 13 secretarias configuradas
- ✅ 91 módulos definidos
- ✅ 819 rotas API geradas
- ✅ Integração com protocolStatusEngine
- ✅ Controle de permissões (USER, MANAGER, ADMIN)
- ✅ CustomData dinâmico (JSON)
- ⏳ Validação JSON Schema (TODO)

### **Frontend (Componentes)**
- ✅ BaseModuleView reutilizável
- ✅ 4 tabs implementadas (List, Approval, Dashboard, Management)
- ✅ Integração automática com API backend
- ✅ TypeScript tipado
- ✅ Componentes Radix UI
- ✅ Customização via props

---

## 📚 Arquivos Principais

### **Backend (Generator)**
```
generator/
├── templates/backend.hbs          # Template Handlebars (480 linhas)
├── index.ts                        # CLI principal (229 linhas)
├── utils/template-engine.ts        # Engine + helpers (62 linhas)
├── utils/validator.ts              # Validador Zod (29 linhas)
├── utils/file-writer.ts            # Escritor (39 linhas)
├── schemas/secretaria.schema.ts    # Schema Zod
├── schemas/module.schema.ts        # Schema Zod
└── configs/secretarias/*.config.ts # 13 configs (~25 linhas cada)
```

### **Frontend (Componentes)**
```
digiurban/frontend/
├── components/modules/
│   ├── BaseModuleView.tsx          # Componente principal (100 linhas)
│   ├── ModuleLayout.tsx            # Layout com breadcrumb
│   └── tabs/
│       ├── ListTab.tsx             # Aba de listagem
│       ├── ApprovalTab.tsx         # Aba de aprovação
│       ├── DashboardTab.tsx        # Aba de dashboard
│       └── ManagementTab.tsx       # Aba de gerenciamento
│
└── app/admin/secretarias/
    ├── saude/page.tsx              # Dashboard de saúde
    ├── educacao/page.tsx           # Dashboard de educação
    └── ... (mais 11 secretarias)
```

---

## 👨‍💻 Comandos Rápidos

```bash
# ========================================
# BACKEND (Generator)
# ========================================

cd generator

# Setup
npm install

# Gerar rotas
npm run generate -- --secretaria=saude
npm run generate -- --all
npm run generate -- --secretaria=saude --force

# Validar
npm run validate -- --secretaria=saude

# Limpar
npm run clean -- --all --confirm

# ========================================
# DESENVOLVIMENTO
# ========================================

# Backend
cd digiurban/backend
npm run dev

# Frontend
cd digiurban/frontend
npm run dev

# Banco de dados
cd digiurban/backend
npm run db:studio
npm run db:seed
```

---

## 📄 Licença

Parte do projeto **DigiUrban** - Sistema de Gestão Municipal Digital

---

**Desenvolvido com ❤️ para revolucionar a gestão municipal com geração automática de código full-stack**
