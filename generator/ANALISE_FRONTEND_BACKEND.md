# 🔍 ANÁLISE: Frontend vs Backend - Sistema de Templates

## ❓ SUA PERGUNTA

> "Ao clicar nos cards de módulos na página principal da secretaria sou levado a página que tem as 4 abas mas não mostram os dados. Esses cards e essas páginas dos módulos da página principal das secretarias já estão usando o sistema de template que implementamos ou ainda não?"

---

## ✅ RESPOSTA DIRETA

**NÃO, as páginas de módulos do frontend NÃO estão usando as rotas do sistema de templates ainda.**

Existe uma **INCOMPATIBILIDADE** entre o que o frontend espera e o que o backend novo gera.

---

## 🔴 O PROBLEMA EXPLICADO

### **1. O que o FRONTEND está tentando fazer:**

```typescript
// 📄 Arquivo: components/modules/tabs/ListTab.tsx (linha 88-90)

const [department, module] = config.apiEndpoint.split('/')
// config.apiEndpoint = 'agricultura/cadastro-produtor'
// department = 'agricultura'
// module = 'cadastro-produtor'

const url = `${baseUrl}/admin/secretarias/${department}/${module}/list?${params}`
// Tenta chamar: /api/admin/secretarias/agricultura/cadastro-produtor/list
```

**O frontend está tentando chamar:**
```
GET /api/admin/secretarias/agricultura/cadastro-produtor/list
```

### **2. O que o BACKEND NOVO gera (sistema de templates):**

```typescript
// 📄 Arquivo gerado: routes/secretarias-agricultura.ts

// Rota CORRETA que existe:
router.get('/propriedades', async (req, res) => {
  // Lista protocolos do módulo CADASTRO_PROPRIEDADE_RURAL
});

// Para produtores, a rota seria:
router.get('/cadastro-produtor', async (req, res) => {
  // Lista protocolos do módulo CADASTRO_PRODUTOR
});
```

**O backend tem a rota:**
```
GET /api/admin/secretarias/agricultura/cadastro-produtor
```

**Mas NÃO tem:**
```
GET /api/admin/secretarias/agricultura/cadastro-produtor/list  ❌
```

---

## 📊 COMPARAÇÃO: FRONTEND vs BACKEND

### **FRONTEND (Páginas de Módulos)**

```
┌─────────────────────────────────────────────────────────────┐
│  📱 ESTRUTURA DO FRONTEND                                    │
│                                                             │
│  app/admin/secretarias/agricultura/                         │
│  ├── page.tsx  ← Página principal (cards dos módulos)      │
│  ├── produtores/                                            │
│  │   └── page.tsx  ← BaseModuleView                        │
│  │       ↓ Renderiza 4 abas:                               │
│  │       • ListTab      (lista registros)                  │
│  │       • ApprovalTab  (aprovações)                       │
│  │       • DashboardTab (métricas)                         │
│  │       • ManagementTab (gestão)                          │
│  │                                                          │
│  ├── propriedades/                                          │
│  │   └── page.tsx  ← BaseModuleView                        │
│  │                                                          │
│  └── assistencia-tecnica/                                   │
│      └── page.tsx  ← BaseModuleView                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼ Tenta chamar API
┌─────────────────────────────────────────────────────────────┐
│  🔌 ROTAS QUE O FRONTEND ESPERA                             │
│                                                             │
│  GET /api/admin/secretarias/agricultura/produtores/list     │
│  GET /api/admin/secretarias/agricultura/produtores/:id      │
│  POST /api/admin/secretarias/agricultura/produtores         │
│  PUT /api/admin/secretarias/agricultura/produtores/:id      │
│  DELETE /api/admin/secretarias/agricultura/produtores/:id   │
│                                                             │
│  GET /api/admin/secretarias/agricultura/propriedades/list   │
│  GET /api/admin/secretarias/agricultura/propriedades/:id    │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

### **BACKEND (Sistema de Templates)**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️  ROTAS GERADAS PELO TEMPLATE                            │
│                                                             │
│  Arquivo: routes/secretarias-agricultura.ts                 │
│                                                             │
│  Config usado:                                              │
│  modules: [                                                 │
│    { id: 'propriedades', moduleType: 'CADASTRO_PROP...' }, │
│    { id: 'cadastro-produtor', moduleType: 'CADASTRO_P...' },│
│    { id: 'assistencia', moduleType: 'ASSISTENCIA_TEC...' } │
│  ]                                                          │
│                                                             │
│  Rotas geradas:                                             │
│  ✅ GET  /propriedades                                      │
│  ✅ GET  /propriedades/:id                                  │
│  ✅ POST /propriedades                                      │
│  ✅ PUT  /propriedades/:id                                  │
│  ✅ DELETE /propriedades/:id                                │
│  ✅ POST /propriedades/:id/approve                          │
│  ✅ POST /propriedades/:id/reject                           │
│  ✅ GET  /propriedades/:id/history                          │
│                                                             │
│  ✅ GET  /cadastro-produtor                                 │
│  ✅ GET  /cadastro-produtor/:id                             │
│  ✅ POST /cadastro-produtor                                 │
│  ...                                                        │
│                                                             │
│  ❌ NÃO TEM: /propriedades/list                             │
│  ❌ NÃO TEM: /cadastro-produtor/list                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔴 INCOMPATIBILIDADES IDENTIFICADAS

### **1. Sufixo `/list` não existe**

**Frontend espera:**
```
GET /api/admin/secretarias/agricultura/cadastro-produtor/list
```

**Backend tem:**
```
GET /api/admin/secretarias/agricultura/cadastro-produtor
```

### **2. Nome do módulo está diferente**

**Frontend usa:** `cadastro-produtor` (config: `apiEndpoint: 'agricultura/cadastro-produtor'`)

**Backend gera:** Depende do `id` no config

```typescript
// generator/configs/secretarias/agricultura.config.ts
modules: [
  { id: 'propriedades', moduleType: 'CADASTRO_PROPRIEDADE_RURAL' },
  // Se tivesse: { id: 'produtores', ... }
  // Rota seria: /produtores (não /cadastro-produtor)
]
```

### **3. Estrutura de resposta pode ser diferente**

**Frontend espera:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 25,
    "totalPages": 4
  }
}
```

**Backend retorna:**
```json
{
  "success": true,
  "data": [...],
  "total": 100
}
```

---

## 🔧 SOLUÇÕES POSSÍVEIS

### **SOLUÇÃO 1: Adaptar o Template do Backend** (Recomendado)

Adicionar rota `/list` no template que retorna a estrutura esperada pelo frontend:

```handlebars
{{!-- generator/templates/backend.hbs --}}

{{#each modules}}

// ========== MÓDULO: {{this.id}} ==========

/**
 * GET /{{this.id}}/list
 * Lista registros (formato compatível com frontend)
 */
router.get('/{{this.id}}/list', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { page = 1, limit = 25, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const department = await prisma.department.findFirst({
      where: { id: '{{../departmentId}}' }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const service = await prisma.serviceSimplified.findFirst({
      where: {
        departmentId: department.id,
        {{#if this.moduleType}}
        moduleType: '{{this.moduleType}}'
        {{else}}
        moduleType: null
        {{/if}}
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Contar total
    const total = await prisma.protocolSimplified.count({
      where: {
        serviceId: service.id,
        {{#if this.moduleType}}
        moduleType: '{{this.moduleType}}',
        {{/if}}
        ...(status && status !== 'all' ? { status: status as ProtocolStatus } : {}),
        ...(search ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      }
    });

    // Buscar dados
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        serviceId: service.id,
        {{#if this.moduleType}}
        moduleType: '{{this.moduleType}}',
        {{/if}}
        ...(status && status !== 'all' ? { status: status as ProtocolStatus } : {}),
        ...(search ? {
          OR: [
            { number: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    // Formatar resposta para o frontend
    const data = protocols.map(p => ({
      id: p.id,
      protocol: p.number,
      title: p.title || 'Sem título',
      description: p.description,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      citizen: p.citizen,
      ...p.customData // Spread dos dados dinâmicos
    }));

    res.json({
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('[{{../slug}}/{{this.id}}] Error in list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

{{/each}}
```

**Vantagens:**
- ✅ Frontend funciona sem mudanças
- ✅ Mantém compatibilidade com sistema existente
- ✅ Adiciona funcionalidades (search, pagination, etc)

**Como aplicar:**
```bash
# 1. Editar template
vim generator/templates/backend.hbs

# 2. Regenerar todas as secretarias
npm run generate -- --all --force

# 3. Testar
# Frontend deve funcionar imediatamente
```

---

### **SOLUÇÃO 2: Adaptar o Frontend**

Mudar o frontend para chamar as rotas corretas do backend:

```typescript
// components/modules/tabs/ListTab.tsx

const fetchData = async () => {
  // ANTES:
  // const url = `${baseUrl}/admin/secretarias/${department}/${module}/list?${params}`

  // DEPOIS:
  const url = `${baseUrl}/admin/secretarias/${department}/${module}?${params}`

  // Chamar rota SEM /list
}
```

**Desvantagens:**
- ❌ Requer mudanças em múltiplos componentes do frontend
- ❌ Pode quebrar outras partes do sistema
- ❌ Menos flexível para adicionar features

---

### **SOLUÇÃO 3: Criar Adapter Layer**

Criar um middleware que redireciona `/list` para a rota principal:

```typescript
// backend/src/middleware/list-adapter.ts

export function listAdapter(req: Request, res: Response, next: NextFunction) {
  // Se a URL termina com /list, remover o /list
  if (req.path.endsWith('/list')) {
    req.url = req.url.replace(/\/list$/, '');
  }
  next();
}

// Em routes/index.ts
router.use('/admin/secretarias', listAdapter);
```

**Desvantagens:**
- ❌ Gambiarra / workaround
- ❌ Pode causar confusão futura
- ❌ Não resolve diferenças na estrutura de resposta

---

## 🎯 RECOMENDAÇÃO FINAL

### **Use a SOLUÇÃO 1** (Adaptar Template do Backend)

**Por quê:**
1. ✅ Mantém frontend intacto
2. ✅ Adiciona funcionalidade real (search, filtros, pagination)
3. ✅ Consistente com padrão REST
4. ✅ Fácil de manter
5. ✅ Uma mudança resolve para TODAS as 13 secretarias

**Passos:**

1. **Adicionar rota `/list` no template**
   ```bash
   vim generator/templates/backend.hbs
   # Adicionar código da rota /list
   ```

2. **Regenerar todas as secretarias**
   ```bash
   cd generator
   npm run generate -- --all --force
   ```

3. **Verificar configs de módulos**
   Garantir que os IDs dos módulos nos configs batem com o que o frontend espera:

   ```typescript
   // Frontend espera: 'agricultura/cadastro-produtor'
   // Config deve ter: { id: 'cadastro-produtor', ... }
   ```

4. **Testar no browser**
   ```
   1. Acessar http://localhost:3000/admin/secretarias/agricultura
   2. Clicar em card "Produtores Rurais"
   3. Deve mostrar dados na aba "Listagem"
   ```

---

## 📋 CHECKLIST: O QUE FAZER

```
[ ] 1. Editar generator/templates/backend.hbs
       - Adicionar rota GET /{{module}}/list
       - Retornar formato { data, pagination }

[ ] 2. Regenerar secretarias
       npm run generate -- --all --force

[ ] 3. Verificar no backend gerado
       cat digiurban/backend/src/routes/secretarias-agricultura.ts
       # Deve ter: router.get('/cadastro-produtor/list', ...)

[ ] 4. Compilar backend
       cd digiurban/backend
       npx tsc --noEmit

[ ] 5. Reiniciar servidor backend
       npm run dev

[ ] 6. Testar no frontend
       - Acessar página de módulo
       - Verificar se dados aparecem nas abas

[ ] 7. Criar commit
       git add .
       git commit -m "feat: Adicionar rota /list compatível com frontend"
```

---

## 🎓 RESUMO

### **Status Atual:**

```
❌ Frontend NÃO está usando sistema de templates
❌ Rotas do backend não batem com o que frontend espera
❌ Abas dos módulos mostram vazio
```

### **O que acontece:**

1. **Página principal funciona** (mostra cards de módulos)
2. **Ao clicar no card** → vai para `/admin/secretarias/agricultura/produtores`
3. **BaseModuleView renderiza** → mostra 4 abas
4. **ListTab tenta buscar dados** → chama `/cadastro-produtor/list`
5. **Backend não tem essa rota** → 404 Not Found
6. **Frontend mostra vazio** → sem dados

### **Solução:**

Adicionar rota `/list` no template do backend que:
- ✅ Recebe mesmos parâmetros (page, limit, search, status)
- ✅ Retorna estrutura esperada ({ data, pagination })
- ✅ Busca dados de ProtocolSimplified
- ✅ Formata customData dinamicamente

---

**🚀 Com essa mudança, o frontend vai funcionar 100% com o sistema de templates!**
