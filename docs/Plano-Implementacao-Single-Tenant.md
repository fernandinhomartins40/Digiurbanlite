# Plano de Implementação: Single Tenant (Direto)

## DigiUrban - Migração Completa e Imediata

**Abordagem:** Deletar todo código multitenancy de uma vez
**Tempo:** 4 dias úteis
**Sem:** Backups, dual-mode, suporte legado

---

## DIA 1: BANCO DE DADOS

### 1.1 Backup Único Inicial (Opcional)
```bash
# Apenas para referência, não para rollback
cp digiurban/backend/prisma/schema.prisma schema.prisma.backup
```

### 1.2 Modificar Schema Prisma

**Arquivo:** `digiurban/backend/prisma/schema.prisma`

#### Passo 1: Adicionar MunicipioConfig

Adicionar NO INÍCIO do arquivo (após datasource):

```prisma
// ============================================
// CONFIGURAÇÃO DO MUNICÍPIO (SINGLETON)
// ============================================
model MunicipioConfig {
  id              String   @id @default("singleton")
  nome            String
  cnpj            String   @unique
  codigoIbge      String?
  nomeMunicipio   String
  ufMunicipio     String
  brasao          String?
  corPrimaria     String?
  configuracoes   Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("municipio_config")
}
```

#### Passo 2: Deletar Model Tenant

Encontrar e **DELETAR COMPLETAMENTE**:
```prisma
model Tenant {
  // DELETAR TODO O BLOCO (linhas 10-183 aproximadamente)
}
```

#### Passo 3: Remover tenantId de TODOS os Models

**Buscar e deletar em TODOS os 150+ models:**

```prisma
// ❌ DELETAR estas linhas:
tenantId   String
tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

// ❌ DELETAR índices com tenantId:
@@unique([tenantId, email])
@@unique([tenantId, cpf])
@@index([tenantId, status])
@@index([tenantId, createdAt])

// ✅ SUBSTITUIR por índices simples:
@@unique([email])
@@unique([cpf])
@@index([status])
@@index([createdAt])
```

**USAR BUSCA/REPLACE NO VSCODE:**

1. **Remover campo tenantId:**
   - Buscar (Regex): `^\s*tenantId\s+String.*$`
   - Substituir: (vazio)

2. **Remover relação tenant:**
   - Buscar (Regex): `^\s*tenant\s+Tenant.*$`
   - Substituir: (vazio)

3. **Ajustar índices únicos (manual):**
   - Buscar: `@@unique([tenantId,`
   - Substituir manualmente removendo `tenantId,`

4. **Ajustar índices (manual):**
   - Buscar: `@@index([tenantId`
   - Substituir manualmente removendo `tenantId` ou linha inteira se só tiver tenantId

### 1.3 Formatar e Validar

```bash
cd digiurban/backend

# Formatar schema
npx prisma format

# Validar (não deve ter erros)
npx prisma validate
```

### 1.4 Criar e Aplicar Migration

```bash
# Gerar migration
npx prisma migrate dev --name remove_multitenancy_complete

# Aplicar (já aplica automaticamente no comando acima)
```

### 1.5 Criar Seed Inicial para MunicipioConfig

**Arquivo:** `digiurban/backend/prisma/seed.ts`

Adicionar no início da função `main()`:

```typescript
// Criar configuração do município
await prisma.municipioConfig.upsert({
  where: { id: 'singleton' },
  update: {},
  create: {
    id: 'singleton',
    nome: 'Município Demo',
    cnpj: '00000000000000',
    codigoIbge: '0000000',
    nomeMunicipio: 'Demo',
    ufMunicipio: 'DF',
    brasao: null,
    corPrimaria: '#0066cc',
  },
})

console.log('✅ MunicipioConfig criado')
```

Executar seed:
```bash
npx prisma db seed
```

**✅ DIA 1 COMPLETO**

---

## DIA 2: BACKEND - MIDDLEWARES E AUTENTICAÇÃO

### 2.1 Deletar Arquivos Completos

```bash
cd digiurban/backend/src

# Deletar middleware de tenant
rm middleware/tenant.ts

# Deletar rotas de super admin (se não forem necessárias)
rm routes/super-admin.ts
rm routes/tenants.ts
rm routes/super-admin-email.ts
```

### 2.2 Atualizar index.ts

**Arquivo:** `digiurban/backend/src/index.ts`

**Remover imports:**
```typescript
// ❌ DELETAR
import { tenantMiddleware, planLimitsMiddleware } from './middleware/tenant'
import tenantRoutes from './routes/tenants'
import superAdminRoutes from './routes/super-admin'
import superAdminEmailRoutes from './routes/super-admin-email'
```

**Remover uso de middlewares:**
```typescript
// ❌ DELETAR estas linhas
app.use(tenantMiddleware)
app.use(planLimitsMiddleware)
app.use('/api/tenants', tenantRoutes)
app.use('/api/super-admin', superAdminRoutes)
app.use('/api/super-admin/email', superAdminEmailRoutes)
```

### 2.3 Criar Rota de Configuração do Município

**Criar:** `digiurban/backend/src/routes/municipio.ts`

```typescript
import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/municipio - Retorna config pública
router.get('/', async (_req, res) => {
  try {
    const config = await prisma.municipioConfig.findUnique({
      where: { id: 'singleton' },
      select: {
        nome: true,
        nomeMunicipio: true,
        ufMunicipio: true,
        brasao: true,
        corPrimaria: true,
      },
    })

    if (!config) {
      return res.status(404).json({ error: 'Configuração não encontrada' })
    }

    res.json(config)
  } catch (error) {
    console.error('Erro ao buscar config:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
})

export default router
```

Adicionar em `index.ts`:
```typescript
import municipioRoutes from './routes/municipio'
app.use('/api/municipio', municipioRoutes)
```

### 2.4 Atualizar Middleware de Autenticação Admin

**Arquivo:** `digiurban/backend/src/middleware/admin-auth.ts`

**Modificar função `adminAuthMiddleware`:**

```typescript
export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.digiurban_admin_token
    const authHeader = req.headers.authorization

    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token) {
      res.status(401).json({ error: 'Token necessário' })
      return
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      res.status(500).json({ error: 'JWT_SECRET não configurado' })
      return
    }

    // ✅ JWT SEM tenantId
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string
      role: string
      type?: string
    }

    if (decoded.type && decoded.type !== 'admin') {
      res.status(401).json({ error: 'Token inválido para admin' })
      return
    }

    // ✅ Buscar usuário SEM filtro de tenantId
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        isActive: true,
      },
      include: {
        department: true,
      },
    })

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' })
      return
    }

    // ✅ Adicionar à request SEM tenantId
    (req as AuthenticatedRequest).userId = user.id
    (req as AuthenticatedRequest).user = user
    (req as AuthenticatedRequest).userRole = user.role

    next()
  } catch (error: unknown) {
    console.error('Erro na autenticação:', error)

    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ error: 'Token inválido' })
        return
      }
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ error: 'Token expirado' })
        return
      }
    }

    res.status(500).json({ error: 'Erro interno' })
  }
}
```

**Deletar funções relacionadas a tenant** (se existirem):
- `validateTenantRequired`
- `planLimitsMiddleware`
- `tenantRateLimit`

### 2.5 Atualizar Middleware de Autenticação Cidadão

**Arquivo:** `digiurban/backend/src/middleware/citizen-auth.ts`

Aplicar as mesmas mudanças:
- Remover `tenantId` do JWT
- Remover filtro `tenantId` na query
- Remover validação de tenant

```typescript
// ✅ JWT sem tenantId
const decoded = jwt.verify(token, jwtSecret) as {
  citizenId: string
  type: string
}

// ✅ Query sem tenantId
const citizen = await prisma.citizen.findFirst({
  where: {
    id: decoded.citizenId,
    isActive: true,
  },
})
```

### 2.6 Atualizar Rotas de Login Admin

**Arquivo:** `digiurban/backend/src/routes/admin-auth.ts`

```typescript
// Endpoint de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // ✅ Buscar usuário SEM tenantId (email é único)
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    // Validar senha
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    // ✅ JWT SEM tenantId
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        type: 'admin',
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '8h' }
    )

    // Cookie httpOnly
    res.cookie('digiurban_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    })

    // ✅ Retornar SEM tenant
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ error: 'Erro interno' })
  }
})
```

### 2.7 Atualizar Rotas de Login Cidadão

**Arquivo:** `digiurban/backend/src/routes/citizen-auth.ts`

Aplicar mesmas mudanças:
- Buscar cidadão por CPF (único)
- JWT sem `tenantId`
- Retornar sem `tenant`

**✅ DIA 2 COMPLETO**

---

## DIA 3: BACKEND - REFATORAR QUERIES (PARTE 1)

### 3.1 Estratégia de Refatoração

**Buscar e substituir em TODOS os arquivos `.ts` em `src/`:**

#### Busca 1: Remover filtro tenantId em where
```typescript
// Buscar (Regex):
tenantId:\s*req\.tenantId,?\s*

// Substituir por:
(vazio)
```

#### Busca 2: Remover tenantId em create/update data
```typescript
// Buscar (Regex):
tenantId:\s*req\.tenantId,?\s*

// Substituir por:
(vazio)
```

### 3.2 Arquivos Críticos para Revisar Manualmente

**IMPORTANTE:** Após busca/replace automática, revisar MANUALMENTE:

#### 1. Gestão de Usuários
**Arquivo:** `src/routes/admin-management.ts`

```typescript
// ❌ ANTES
router.get('/users', adminAuthMiddleware, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { tenantId: req.tenantId },
    include: { department: true },
  })
  res.json({ users })
})

// ✅ DEPOIS
router.get('/users', adminAuthMiddleware, async (req, res) => {
  const users = await prisma.user.findMany({
    include: { department: true },
  })
  res.json({ users })
})
```

```typescript
// ❌ ANTES
router.post('/users', adminAuthMiddleware, async (req, res) => {
  const user = await prisma.user.create({
    data: {
      ...req.body,
      tenantId: req.tenantId,
    },
  })
  res.json({ user })
})

// ✅ DEPOIS
router.post('/users', adminAuthMiddleware, async (req, res) => {
  const user = await prisma.user.create({
    data: req.body,
  })
  res.json({ user })
})
```

#### 2. Cidadãos
**Arquivo:** `src/routes/citizens.ts` e `src/routes/admin-citizens.ts`

Remover todos os filtros de `tenantId`:
```typescript
// ✅ ANTES
where: { tenantId: req.tenantId, cpf: req.body.cpf }

// ✅ DEPOIS
where: { cpf: req.body.cpf }
```

#### 3. Protocolos
**Arquivo:** `src/routes/protocols-simplified.routes.ts`

```typescript
// ❌ ANTES
router.get('/', adminAuthMiddleware, async (req, res) => {
  const protocols = await prisma.protocolSimplified.findMany({
    where: {
      tenantId: req.tenantId,
      status: req.query.status,
    },
  })
  res.json({ protocols })
})

// ✅ DEPOIS
router.get('/', adminAuthMiddleware, async (req, res) => {
  const protocols = await prisma.protocolSimplified.findMany({
    where: {
      status: req.query.status,
    },
  })
  res.json({ protocols })
})
```

#### 4. Serviços
**Arquivo:** `src/routes/services.ts`

Mesma lógica: remover `tenantId` de todos os métodos.

### 3.3 Atualizar Services

**Arquivo:** `src/services/protocol-simplified.service.ts`

```typescript
class ProtocolService {
  // ❌ ANTES
  async create(data: any, tenantId: string) {
    return prisma.protocolSimplified.create({
      data: { ...data, tenantId },
    })
  }

  async findAll(tenantId: string, filters: any) {
    return prisma.protocolSimplified.findMany({
      where: { tenantId, ...filters },
    })
  }

  // ✅ DEPOIS
  async create(data: any) {
    return prisma.protocolSimplified.create({
      data,
    })
  }

  async findAll(filters: any) {
    return prisma.protocolSimplified.findMany({
      where: filters,
    })
  }
}
```

**✅ DIA 3 COMPLETO**

---

## DIA 4: BACKEND - REFATORAR QUERIES (PARTE 2) + TESTES

### 4.1 Continuar Refatoração

#### Secretarias (15 arquivos)
Arquivos em `src/routes/secretarias-*.ts`:
- `secretarias-saude.ts`
- `secretarias-educacao.ts`
- `secretarias-assistencia-social.ts`
- etc.

**Para CADA arquivo:**
1. Remover `tenantId` de todas queries
2. Remover parâmetro `tenantId` de funções

#### Handlers (50+ arquivos)
Arquivos em `src/modules/handlers/` e `src/core/handlers/`:

**Aplicar busca/replace global:**
```bash
# No VSCode, buscar em: src/modules/handlers/ e src/core/handlers/
# Buscar: tenantId: req.tenantId
# Substituir: (vazio)
```

### 4.2 Atualizar Types

**Arquivo:** `src/types/globals.ts` ou `src/types/index.ts`

```typescript
// ❌ REMOVER
declare global {
  namespace Express {
    interface Request {
      tenantId?: string
      tenant?: TenantWithMeta
    }
  }
}

// ✅ MANTER (se existir)
declare global {
  namespace Express {
    interface Request {
      userId?: string
      user?: UserWithRelations
      citizen?: CitizenWithData
    }
  }
}
```

### 4.3 Atualizar Testes

**Arquivos de teste:** `__tests__/**/*.test.ts`

```typescript
// ❌ ANTES
describe('User API', () => {
  let testTenantId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Test', cnpj: '00000000000000' },
    })
    testTenantId = tenant.id
  })

  it('deve criar usuário com tenantId', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        name: 'Test',
        password: 'hash',
        tenantId: testTenantId,
      },
    })
    expect(user.tenantId).toBe(testTenantId)
  })
})

// ✅ DEPOIS
describe('User API', () => {
  beforeAll(async () => {
    // Garantir que MunicipioConfig existe
    await prisma.municipioConfig.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        id: 'singleton',
        nome: 'Test',
        cnpj: '00000000000000',
        nomeMunicipio: 'Test',
        ufMunicipio: 'DF',
      },
    })
  })

  it('deve criar usuário', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        name: 'Test',
        password: 'hash',
      },
    })
    expect(user.email).toBe('test@test.com')
  })
})
```

### 4.4 Executar Testes

```bash
# Rodar todos os testes
npm run test

# Se houver erros, corrigir um por um
# Focar em remover expectativas de tenantId
```

### 4.5 Validação Final

```bash
# 1. Compilar TypeScript
npm run build

# 2. Verificar erros
# Devem ser zero erros de compilação

# 3. Buscar referências restantes
grep -r "tenantId" src --include="*.ts" | wc -l
# Deve retornar 0 ou apenas comentários

# 4. Iniciar servidor
npm run dev

# 5. Testar endpoints principais
curl http://localhost:3001/health
curl http://localhost:3001/api/municipio
```

**✅ DIA 4 COMPLETO**

---

## PÓS-IMPLEMENTAÇÃO: VALIDAÇÃO E DOCUMENTAÇÃO

### Checklist Final

- [ ] Schema Prisma sem `tenantId`
- [ ] Migration aplicada com sucesso
- [ ] MunicipioConfig criado
- [ ] Arquivos de tenant deletados
- [ ] Middlewares atualizados
- [ ] Login funciona (admin e cidadão)
- [ ] Queries sem `tenantId`
- [ ] Compilação TypeScript sem erros
- [ ] Testes passando
- [ ] Servidor inicia sem erros
- [ ] Endpoints funcionando

### Atualizar .env

```bash
# REMOVER
DEFAULT_TENANT=demo

# ADICIONAR
MUNICIPIO_NOME=Salvador
MUNICIPIO_CNPJ=13927931000137
CODIGO_IBGE=2927408
```

### Atualizar README.md

```markdown
## Arquitetura

**Single Tenant** - Cada município tem instância dedicada.

## Configuração

Configurar município em `MunicipioConfig`:
\`\`\`sql
UPDATE municipio_config SET
  nome = 'Salvador',
  cnpj = '13927931000137'
WHERE id = 'singleton';
\`\`\`
```

---

## CONCLUSÃO

**Migração completa em 4 dias:**
- ✅ Dia 1: Banco de dados
- ✅ Dia 2: Middlewares e auth
- ✅ Dia 3: Queries (parte 1)
- ✅ Dia 4: Queries (parte 2) + testes

**Resultado:**
- Código 30% mais simples
- Performance melhor
- Sem complexidade de multitenancy
- Pronto para produção single tenant

**Próximo passo:** Executar!
