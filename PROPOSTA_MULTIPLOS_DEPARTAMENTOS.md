# 🏛️ PROPOSTA: Usuários com Múltiplos Departamentos

## 📋 Análise da Situação Atual

### **Relacionamento Atual (1:N - Um departamento por usuário)**

```prisma
model User {
  id           String      @id @default(cuid())
  email        String      @unique
  name         String
  role         UserRole    @default(USER)
  departmentId String?     // ❌ Campo único - apenas 1 departamento

  department   Department? @relation(fields: [departmentId], references: [id])
}

model Department {
  id    String @id @default(cuid())
  name  String @unique
  users User[] // Relação reversa
}
```

**Problema:**
- ✅ Funciona para municípios simples
- ❌ Não suporta secretário com 2+ secretarias
- ❌ Não suporta servidor atuando em múltiplas secretarias
- ❌ Campo `departmentId` limita a apenas 1 departamento

---

## 🎯 Solução Proposta: Relacionamento N:N

### **Novo Relacionamento (N:N - Múltiplos departamentos por usuário)**

```prisma
model User {
  id                          String                   @id @default(cuid())
  email                       String                   @unique
  name                        String
  role                        UserRole                 @default(USER)

  // ✅ REMOVIDO: departmentId String?
  // ✅ NOVO: Relacionamento N:N via tabela intermediária
  departments                 UserDepartment[]

  // Mantém relações existentes
  createdProtocolsSimplified  ProtocolSimplified[]     @relation("CreatedByUserSimplified")
  assignedProtocolsSimplified ProtocolSimplified[]     @relation("AssignedUserSimplified")
}

// ✅ NOVA TABELA: Relacionamento N:N com metadados
model UserDepartment {
  id           String     @id @default(cuid())
  userId       String
  departmentId String

  // ✅ Metadados adicionais
  isPrimary    Boolean    @default(false)  // Departamento principal
  role         UserRole?  // Role específico neste departamento (opcional)
  isActive     Boolean    @default(true)   // Pode desativar em um dept específico

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  department   Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)

  @@unique([userId, departmentId])  // Previne duplicatas
  @@index([userId])
  @@index([departmentId])
  @@map("user_departments")
}

model Department {
  id                  String             @id @default(cuid())
  name                String             @unique
  code                String?            @unique
  description         String?
  isActive            Boolean            @default(true)

  // ✅ NOVO: Relacionamento N:N
  users               UserDepartment[]

  protocolsSimplified ProtocolSimplified[]
  servicesSimplified  ServiceSimplified[]
}
```

---

## 💡 Benefícios da Nova Estrutura

### ✅ **Flexibilidade Total:**
- Usuário pode ter 1, 2, 3+ departamentos
- Secretário gerencia múltiplas secretarias simultaneamente
- Servidor trabalha em vários departamentos conforme necessidade

### ✅ **Departamento Principal:**
- Campo `isPrimary` marca o departamento principal do usuário
- Usado como fallback em operações que precisam de um único departamento

### ✅ **Roles por Departamento (Opcional):**
- Usuário pode ser MANAGER em Agricultura e USER em Saúde
- Permite granularidade de permissões por secretaria

### ✅ **Controle Granular:**
- Pode desativar usuário em um departamento específico (`isActive`)
- Auditoria: rastreia quando usuário foi adicionado/removido de departamentos

---

## 🔧 Implementação em 6 Passos

### **Passo 1: Migration do Prisma**

```prisma
// digiurban/backend/prisma/migrations/xxx_add_multiple_departments/migration.sql

-- Criar tabela intermediária
CREATE TABLE "user_departments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "role" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_departments_userId_departmentId_unique" UNIQUE ("userId", "departmentId")
);

-- Migrar dados existentes (usuários com departmentId)
INSERT INTO "user_departments" ("id", "userId", "departmentId", "isPrimary", "isActive", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  "id",
  "departmentId",
  true,  -- Marcar como primary
  true,
  NOW(),
  NOW()
FROM "users"
WHERE "departmentId" IS NOT NULL;

-- Criar índices
CREATE INDEX "user_departments_userId_idx" ON "user_departments"("userId");
CREATE INDEX "user_departments_departmentId_idx" ON "user_departments"("departmentId");

-- Adicionar foreign keys
ALTER TABLE "user_departments"
  ADD CONSTRAINT "user_departments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_departments"
  ADD CONSTRAINT "user_departments_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ⚠️ Remover campo antigo (após migração bem-sucedida)
-- ALTER TABLE "users" DROP COLUMN "departmentId";
```

---

### **Passo 2: Atualizar Schema Prisma**

```prisma
// digiurban/backend/prisma/schema.prisma

model User {
  id                          String                   @id @default(cuid())
  email                       String                   @unique
  name                        String
  password                    String
  role                        UserRole                 @default(USER)
  isActive                    Boolean                  @default(true)

  // ✅ REMOVIDO: departmentId String?
  // ✅ NOVO: Relacionamento N:N
  departments                 UserDepartment[]

  failedLoginAttempts         Int                      @default(0)
  lockedUntil                 DateTime?
  mustChangePassword          Boolean                  @default(false)
  createdAt                   DateTime                 @default(now())
  updatedAt                   DateTime                 @updatedAt
  lastLogin                   DateTime?

  agendaEvents                AgendaEvent[]            @relation("AgendaEventCreator")
  auditLogs                   AuditLog[]
  reviewedTransferRequests    CitizenTransferRequest[]
  createdProtocolsSimplified  ProtocolSimplified[]     @relation("CreatedByUserSimplified")
  assignedProtocolsSimplified ProtocolSimplified[]     @relation("AssignedUserSimplified")

  // ✅ REMOVIDO: department Department?

  @@map("users")
}

model UserDepartment {
  id           String     @id @default(cuid())
  userId       String
  departmentId String
  isPrimary    Boolean    @default(false)
  role         UserRole?  // Role específico neste departamento (opcional)
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  department   Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)

  @@unique([userId, departmentId])
  @@index([userId])
  @@index([departmentId])
  @@map("user_departments")
}

model Department {
  id                  String               @id @default(cuid())
  name                String               @unique
  code                String?              @unique
  description         String?
  isActive            Boolean              @default(true)
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  // ✅ NOVO: Relacionamento N:N
  users               UserDepartment[]

  protocolsSimplified ProtocolSimplified[]
  servicesSimplified  ServiceSimplified[]

  @@map("departments")
}
```

---

### **Passo 3: Atualizar Backend (Queries e API)**

#### **Helper Functions:**

```typescript
// backend/src/types/user-departments.ts

export interface UserWithDepartments {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  departments: Array<{
    id: string;
    departmentId: string;
    isPrimary: boolean;
    isActive: boolean;
    department: {
      id: string;
      name: string;
      code: string | null;
    };
  }>;
  primaryDepartment?: {
    id: string;
    name: string;
    code: string | null;
  };
}

/**
 * Helper: Obter departamento principal do usuário
 */
export function getPrimaryDepartment(user: UserWithDepartments) {
  const primary = user.departments.find(d => d.isPrimary && d.isActive);
  return primary?.department || user.departments[0]?.department || null;
}

/**
 * Helper: Obter IDs de todos os departamentos ativos do usuário
 */
export function getUserDepartmentIds(user: UserWithDepartments): string[] {
  return user.departments
    .filter(d => d.isActive)
    .map(d => d.departmentId);
}

/**
 * Helper: Verificar se usuário tem acesso a um departamento
 */
export function hasAccessToDepartment(
  user: UserWithDepartments,
  departmentId: string
): boolean {
  return user.departments.some(
    d => d.departmentId === departmentId && d.isActive
  );
}
```

#### **Atualizar Rota GET /team:**

```typescript
// backend/src/routes/admin-management.ts

router.get('/team', requirePermission('team:read'), async (req, res) => {
  const { user } = req;

  const teamMembers = await prisma.user.findMany({
    where: {
      role: { not: 'SUPER_ADMIN' }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLogin: true,

      // ✅ NOVO: Incluir múltiplos departamentos
      departments: {
        where: { isActive: true },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: [
          { isPrimary: 'desc' },  // Primary primeiro
          { createdAt: 'asc' }
        ]
      },

      _count: {
        select: {
          assignedProtocolsSimplified: true
        }
      }
    }
  });

  // Adicionar campo computed 'primaryDepartment'
  const membersWithPrimary = teamMembers.map(member => ({
    ...member,
    primaryDepartment: member.departments.find(d => d.isPrimary)?.department ||
                       member.departments[0]?.department ||
                       null
  }));

  res.json({ success: true, data: { teamMembers: membersWithPrimary } });
});
```

#### **Atualizar Rota POST /team:**

```typescript
// backend/src/routes/admin-management.ts

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: strongPasswordSchema,
  role: z.enum(['USER', 'COORDINATOR', 'MANAGER', 'ADMIN']),

  // ✅ NOVO: Array de departamentos
  departmentIds: z.array(z.string()).optional(),
  primaryDepartmentId: z.string().optional()  // Qual é o principal
});

router.post('/team', requirePermission('team:manage'), async (req, res) => {
  const data = createUserSchema.parse(req.body);

  // Validar departamentos
  if (data.departmentIds && data.departmentIds.length > 0) {
    for (const deptId of data.departmentIds) {
      const isValid = await validateDepartment(deptId);
      if (!isValid) {
        return res.status(400).json({
          error: 'INVALID_DEPARTMENT',
          message: `Departamento ${deptId} inválido`
        });
      }
    }
  }

  // Criar usuário
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      isActive: true,
      mustChangePassword: true,

      // ✅ NOVO: Criar relações com departamentos
      departments: {
        create: data.departmentIds?.map((deptId, index) => ({
          departmentId: deptId,
          isPrimary: deptId === data.primaryDepartmentId || index === 0,
          isActive: true
        })) || []
      }
    },
    include: {
      departments: {
        include: {
          department: {
            select: { id: true, name: true, code: true }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: newUser,
    message: 'Usuário criado com sucesso'
  });
});
```

#### **Atualizar Rota PUT /team/:id:**

```typescript
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER', 'COORDINATOR', 'MANAGER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),

  // ✅ NOVO: Atualizar departamentos
  departmentIds: z.array(z.string()).optional(),
  primaryDepartmentId: z.string().optional()
});

router.put('/team/:id', requirePermission('team:manage'), async (req, res) => {
  const data = updateUserSchema.parse(req.body);
  const userId = req.params.id;

  // Se está atualizando departamentos
  if (data.departmentIds !== undefined) {
    // Validar todos os departamentos
    for (const deptId of data.departmentIds) {
      const isValid = await validateDepartment(deptId);
      if (!isValid) {
        return res.status(400).json({
          error: 'INVALID_DEPARTMENT',
          message: `Departamento ${deptId} inválido`
        });
      }
    }

    // Remover departamentos antigos
    await prisma.userDepartment.deleteMany({
      where: { userId }
    });

    // Adicionar novos departamentos
    await prisma.userDepartment.createMany({
      data: data.departmentIds.map((deptId, index) => ({
        userId,
        departmentId: deptId,
        isPrimary: deptId === data.primaryDepartmentId || index === 0,
        isActive: true
      }))
    });
  }

  // Atualizar dados básicos do usuário
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: data.isActive
    },
    include: {
      departments: {
        include: {
          department: {
            select: { id: true, name: true, code: true }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    data: updatedUser,
    message: 'Usuário atualizado com sucesso'
  });
});
```

---

### **Passo 4: Atualizar Frontend (UserManagementModal)**

```tsx
// frontend/components/admin/UserManagementModal.tsx

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface UserData {
  id?: string
  name: string
  email: string
  role: string
  isActive?: boolean

  // ✅ NOVO: Múltiplos departamentos
  departmentIds?: string[]
  primaryDepartmentId?: string
}

export function UserManagementModal({ ... }) {
  const [formData, setFormData] = useState<UserData>({
    name: '',
    email: '',
    role: 'USER',
    departmentIds: [],
    primaryDepartmentId: undefined,
    isActive: true
  })

  const [departments, setDepartments] = useState<Department[]>([])

  // Departamentos selecionados
  const selectedDepartments = departments.filter(d =>
    formData.departmentIds?.includes(d.id)
  )

  // Toggle departamento
  const toggleDepartment = (departmentId: string) => {
    const currentIds = formData.departmentIds || []

    if (currentIds.includes(departmentId)) {
      // Remover
      const newIds = currentIds.filter(id => id !== departmentId)
      setFormData({
        ...formData,
        departmentIds: newIds,
        // Se remover o primary, definir outro como primary
        primaryDepartmentId: formData.primaryDepartmentId === departmentId
          ? newIds[0]
          : formData.primaryDepartmentId
      })
    } else {
      // Adicionar
      const newIds = [...currentIds, departmentId]
      setFormData({
        ...formData,
        departmentIds: newIds,
        // Se é o primeiro, marcar como primary
        primaryDepartmentId: formData.primaryDepartmentId || departmentId
      })
    }
  }

  // Definir como departamento principal
  const setPrimaryDepartment = (departmentId: string) => {
    setFormData({
      ...formData,
      primaryDepartmentId: departmentId
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        {/* ... outros campos ... */}

        {/* ✅ NOVO: Seleção múltipla de departamentos */}
        <div className="space-y-3">
          <Label>Departamentos (múltipla seleção)</Label>
          <p className="text-xs text-muted-foreground">
            Selecione um ou mais departamentos onde o usuário atuará
          </p>

          {/* Lista de departamentos disponíveis */}
          <div className="border rounded-md p-3 max-h-[250px] overflow-y-auto space-y-2">
            {departments.map((dept) => {
              const isSelected = formData.departmentIds?.includes(dept.id)
              const isPrimary = formData.primaryDepartmentId === dept.id

              return (
                <div
                  key={dept.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition',
                    isSelected && 'bg-blue-50 border border-blue-200'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleDepartment(dept.id)}
                      disabled={loading}
                    />
                    <span className="text-sm font-medium">{dept.name}</span>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2">
                      {isPrimary ? (
                        <Badge variant="default" className="text-xs">
                          Principal
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPrimaryDepartment(dept.id)}
                          className="text-xs"
                        >
                          Definir como principal
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Departamentos selecionados (resumo) */}
          {selectedDepartments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">
                Selecionados ({selectedDepartments.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedDepartments.map((dept) => {
                  const isPrimary = formData.primaryDepartmentId === dept.id

                  return (
                    <Badge
                      key={dept.id}
                      variant={isPrimary ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {dept.name.replace('Secretaria de ', '')}
                      {isPrimary && <span className="text-xs">(Principal)</span>}
                      <button
                        type="button"
                        onClick={() => toggleDepartment(dept.id)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN' && (
            <p className="text-xs text-amber-600">
              ⚠️ Apenas administradores podem vincular a múltiplos departamentos
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### **Passo 5: Atualizar AdminSidebar (Mostrar Múltiplos Departamentos)**

```tsx
// frontend/components/admin/AdminSidebar.tsx

export function AdminSidebar() {
  const { user } = useAdminAuth()

  // ✅ Departamentos do usuário
  const userDepartments = user?.departments || []
  const userDepartmentIds = userDepartments.map(d => d.departmentId)

  // Filtrar secretarias
  const secretariaNavigation: NavSection = {
    title: 'Secretarias',
    items: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
      ? ALL_SECRETARIAS_ITEMS  // ADMIN vê todas
      : userDepartments.map(ud => ({
          title: ud.department.name.replace('Secretaria de ', ''),
          href: `/admin/secretarias/${getDepartmentSlug(ud.department.name)}`,
          icon: getSecretariaIcon(getDepartmentSlug(ud.department.name)),
          minRole: 'USER',
          // ✅ Badge se for departamento principal
          badge: ud.isPrimary ? 'Principal' : undefined
        }))
  }

  // ...
}
```

---

### **Passo 6: Atualizar Controle de Acesso**

#### **Middleware Backend:**

```typescript
// backend/src/middleware/department-access.ts

export const requireDepartmentAccess = (): RequestHandler => {
  return async (req, res, next) => {
    const user = (req as any).user;

    // ADMIN sempre tem acesso
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return next();
    }

    const departmentSlug = req.params.department;

    // Buscar departamento
    const department = await prisma.department.findFirst({
      where: {
        name: { contains: departmentSlug.replace('-', ' '), mode: 'insensitive' }
      }
    });

    if (!department) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Departamento não encontrado'
      });
    }

    // ✅ NOVO: Verificar se usuário tem acesso a ESTE departamento
    const hasAccess = await prisma.userDepartment.findFirst({
      where: {
        userId: user.id,
        departmentId: department.id,
        isActive: true
      }
    });

    if (!hasAccess) {
      // Obter departamentos do usuário para mensagem de erro
      const userDepts = await prisma.userDepartment.findMany({
        where: { userId: user.id, isActive: true },
        include: { department: true }
      });

      const userDeptNames = userDepts.map(ud => ud.department.name).join(', ');

      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Acesso negado a ${department.name}. Você tem acesso apenas a: ${userDeptNames}`
      });
    }

    next();
  };
};
```

---

## 📊 Impacto e Migração

### **Compatibilidade Reversa:**

**✅ Estratégia de Migração Segura:**
1. Criar tabela `user_departments` sem remover `departmentId`
2. Migrar dados existentes para a nova tabela
3. Testar exaustivamente (1-2 semanas)
4. Após validação, remover campo `departmentId` do schema

### **Rollback:**
- Se necessário, reverter migration e restaurar `departmentId`
- Dados não são perdidos durante a migração

---

## 🎯 Exemplos de Uso

### **Exemplo 1: Secretário com 2 Secretarias**

```typescript
// Maria é Secretária de Agricultura (principal) e Meio Ambiente (secundária)

{
  id: "user-123",
  name: "Maria Silva",
  role: "MANAGER",
  departments: [
    {
      id: "ud-1",
      departmentId: "dept-agricultura",
      isPrimary: true,  // ✅ Principal
      isActive: true,
      department: { name: "Secretaria de Agricultura" }
    },
    {
      id: "ud-2",
      departmentId: "dept-meio-ambiente",
      isPrimary: false,
      isActive: true,
      department: { name: "Secretaria de Meio Ambiente" }
    }
  ]
}

// Sidebar mostra:
// - Agricultura (Principal)
// - Meio Ambiente
```

### **Exemplo 2: Servidor em 3 Secretarias**

```typescript
// João atua em Saúde, Assistência Social e Educação

{
  id: "user-456",
  name: "João Santos",
  role: "USER",
  departments: [
    { departmentId: "dept-saude", isPrimary: true },
    { departmentId: "dept-assistencia-social", isPrimary: false },
    { departmentId: "dept-educacao", isPrimary: false }
  ]
}

// João vê no menu:
// - Saúde (Principal)
// - Assistência Social
// - Educação
```

---

## ✅ Checklist de Implementação

### **Database:**
- [ ] Criar migration `user_departments`
- [ ] Migrar dados de `users.departmentId` para `user_departments`
- [ ] Validar integridade dos dados migrados
- [ ] Testar queries com novos relacionamentos

### **Backend:**
- [ ] Atualizar schema Prisma
- [ ] Criar helpers em `types/user-departments.ts`
- [ ] Atualizar rota GET `/admin/team`
- [ ] Atualizar rota POST `/admin/team`
- [ ] Atualizar rota PUT `/admin/team/:id`
- [ ] Atualizar middleware `requireDepartmentAccess()`
- [ ] Atualizar queries de protocolos e serviços

### **Frontend:**
- [ ] Atualizar `UserManagementModal` com seleção múltipla
- [ ] Atualizar `AdminSidebar` para mostrar múltiplos departamentos
- [ ] Atualizar `AdminAuthContext` (incluir `departments` no user)
- [ ] Atualizar páginas de equipe (exibir múltiplos departamentos)
- [ ] Criar componente de badges para departamentos

### **Testes:**
- [ ] Criar usuário com 1 departamento
- [ ] Criar usuário com 2+ departamentos
- [ ] Marcar departamento principal
- [ ] Editar departamentos de usuário existente
- [ ] Verificar acesso a secretarias permitidas
- [ ] Bloquear acesso a secretarias não permitidas
- [ ] Testar filtros de protocolos por departamento

---

## 🚨 Considerações Críticas

### **1. Performance:**
- Adicionar índices em `user_departments(userId)` e `user_departments(departmentId)`
- Queries com `include: { departments }` podem ser pesadas para muitos usuários
- Considerar cache de departamentos por usuário

### **2. Permissões:**
- Definir se role em `user_departments.role` sobrescreve `user.role` global
- Recomendação: usar apenas `user.role` global inicialmente

### **3. Protocolos:**
- Decidir: protocolo vinculado a qual departamento quando usuário tem múltiplos?
- Solução: campo `departmentId` em `ProtocolSimplified` permanece (1 protocolo = 1 departamento)

### **4. UI/UX:**
- Interface precisa deixar claro qual é o departamento principal
- Badge "Principal" ajuda a identificar visualmente

---

**Aguardando suas instruções para prosseguir com a implementação!** 🚀
