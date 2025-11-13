# 🎯 PROPOSTA CONSOLIDADA FINAL: Sistema Completo de Roles e Departamentos

## ⚠️ ATENÇÃO CRÍTICA

**Esta proposta consolida 3 implementações interdependentes:**
1. ✅ Sistema de Roles Centralizado (IMPLEMENTADO)
2. 🔄 Controle de Acesso por Departamento (PENDENTE)
3. 🔄 Múltiplos Departamentos por Usuário (PENDENTE)

**RISCO: O campo `departmentId` aparece em 706 ocorrências em 55 arquivos!**

**Estratégia: MIGRAÇÃO PROGRESSIVA SEM BREAKING CHANGES**

---

## 📊 ANÁLISE PROFUNDA DO BANCO DE DADOS

### **Relacionamentos Críticos Identificados:**

```prisma
// ========================================
// RELACIONAMENTOS ATUAIS (1:N)
// ========================================

User {
  departmentId String?          // ❌ Campo único - 706 ocorrências!
  department   Department?

  // Relações que DEPENDEM de departmentId:
  assignedProtocolsSimplified[]  // Protocolos atribuídos
  createdProtocolsSimplified[]   // Protocolos criados
  auditLogs[]                    // Logs de auditoria
  agendaEvents[]                 // Eventos da agenda
}

Department {
  users[]                         // Usuários do departamento
  protocolsSimplified[]          // Protocolos do departamento
  servicesSimplified[]           // Serviços do departamento
}

ProtocolSimplified {
  departmentId String            // ❌ CRÍTICO - define departamento do protocolo
  assignedUserId String?         // Usuário responsável
  createdById String?            // Quem criou

  // Relacionamentos:
  department Department
  assignedUser User?
  createdBy User?
}

ServiceSimplified {
  departmentId String            // ❌ CRÍTICO - serviço pertence a 1 departamento
  department Department
}
```

### **⚠️ PONTOS CRÍTICOS DE ATENÇÃO:**

1. **ProtocolSimplified.departmentId**: Protocolo pertence a APENAS 1 departamento
2. **ServiceSimplified.departmentId**: Serviço pertence a APENAS 1 departamento
3. **User.departmentId**: Atualmente 1 departamento, queremos N departamentos
4. **706 ocorrências**: Alterar sem cuidado = quebra total do sistema

---

## 🏗️ ARQUITETURA DA SOLUÇÃO SEGURA

### **FASE 1: ADICIONAR sem REMOVER (Backward Compatible)**

```prisma
// ========================================
// SCHEMA ATUALIZADO - FASE 1
// ========================================

model User {
  id                          String   @id @default(cuid())
  email                       String   @unique
  name                        String
  password                    String
  role                        UserRole @default(USER)
  isActive                    Boolean  @default(true)

  // ✅ MANTÉM campo antigo (compatibilidade)
  departmentId                String?

  // ✅ ADICIONA relacionamento N:N NOVO
  userDepartments             UserDepartment[]

  // Relações existentes (mantidas)
  department                  Department?              @relation("UserPrimaryDepartment", fields: [departmentId], references: [id])
  createdProtocolsSimplified  ProtocolSimplified[]     @relation("CreatedByUserSimplified")
  assignedProtocolsSimplified ProtocolSimplified[]     @relation("AssignedUserSimplified")
  auditLogs                   AuditLog[]
  agendaEvents                AgendaEvent[]            @relation("AgendaEventCreator")
  reviewedTransferRequests    CitizenTransferRequest[]

  @@map("users")
}

// ✅ NOVA TABELA - Relacionamento N:N
model UserDepartment {
  id           String   @id @default(cuid())
  userId       String
  departmentId String

  // Metadados
  isPrimary    Boolean  @default(false)  // Departamento principal
  isActive     Boolean  @default(true)   // Pode desativar específico

  // ⚠️ NÃO adicionar role por departamento (complexidade demais)
  // Manter apenas user.role global

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relacionamentos
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  department   Department @relation("UserDepartments", fields: [departmentId], references: [id], onDelete: Cascade)

  @@unique([userId, departmentId])
  @@index([userId])
  @@index([departmentId])
  @@index([userId, isPrimary])  // ✅ Índice para buscar primary rapidamente
  @@map("user_departments")
}

model Department {
  id                  String   @id @default(cuid())
  name                String   @unique
  code                String?  @unique
  description         String?
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // ✅ MANTÉM relação antiga (compatibilidade)
  users               User[]   @relation("UserPrimaryDepartment")

  // ✅ ADICIONA relação nova (N:N)
  userDepartments     UserDepartment[] @relation("UserDepartments")

  // Relações existentes (mantidas)
  protocolsSimplified ProtocolSimplified[]
  servicesSimplified  ServiceSimplified[]

  @@map("departments")
}
```

---

## 🔄 MIGRATION SEGURA (SQL)

```sql
-- ========================================
-- MIGRATION: Adicionar Múltiplos Departamentos
-- FASE 1: ADICIONAR SEM REMOVER
-- ========================================

-- Criar tabela intermediária N:N
CREATE TABLE "user_departments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Criar índices de performance
CREATE UNIQUE INDEX "user_departments_userId_departmentId_key"
  ON "user_departments"("userId", "departmentId");

CREATE INDEX "user_departments_userId_idx"
  ON "user_departments"("userId");

CREATE INDEX "user_departments_departmentId_idx"
  ON "user_departments"("departmentId");

CREATE INDEX "user_departments_userId_isPrimary_idx"
  ON "user_departments"("userId", "isPrimary");

-- Adicionar foreign keys
ALTER TABLE "user_departments"
  ADD CONSTRAINT "user_departments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_departments"
  ADD CONSTRAINT "user_departments_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- MIGRAÇÃO DE DADOS (CRÍTICO!)
-- ========================================

-- Migrar usuários com departmentId para user_departments
-- Marca como isPrimary = true (departamento principal)
INSERT INTO "user_departments" (
  "id",
  "userId",
  "departmentId",
  "isPrimary",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,  -- ID único
  "id",                      -- userId
  "departmentId",            -- departmentId
  true,                      -- isPrimary (marcar como principal)
  true,                      -- isActive
  NOW(),
  NOW()
FROM "users"
WHERE "departmentId" IS NOT NULL;

-- ========================================
-- VERIFICAÇÃO (IMPORTANTE!)
-- ========================================

-- Contar usuários com departamento no schema antigo
SELECT COUNT(*) as users_with_dept FROM "users" WHERE "departmentId" IS NOT NULL;

-- Contar registros migrados
SELECT COUNT(*) as migrated_users FROM "user_departments" WHERE "isPrimary" = true;

-- ⚠️ Os dois números DEVEM ser iguais!
-- Se não forem, NÃO prosseguir com a migration!

-- ========================================
-- ⚠️ NÃO REMOVER departmentId AINDA!
-- Manter para compatibilidade por 30-60 dias
-- ========================================

-- ALTER TABLE "users" DROP COLUMN "departmentId"; -- ❌ NÃO FAZER AINDA!
```

---

## 💻 IMPLEMENTAÇÃO BACKEND

### **Helper Functions (Compatibilidade Dupla)**

```typescript
// backend/src/types/user-departments.ts

import { prisma } from '../lib/prisma';

export interface UserWithDepartments {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;

  // ✅ Campo antigo (deprecated mas mantido)
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code: string | null;
  } | null;

  // ✅ Campo novo (N:N)
  userDepartments?: Array<{
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
}

/**
 * ✅ Helper SEGURO: Obter departamento principal
 * Funciona com schema antigo E novo
 */
export function getPrimaryDepartment(user: UserWithDepartments) {
  // Tentar schema novo primeiro
  if (user.userDepartments && user.userDepartments.length > 0) {
    const primary = user.userDepartments.find(ud => ud.isPrimary && ud.isActive);
    if (primary) return primary.department;

    // Fallback: primeiro departamento ativo
    const firstActive = user.userDepartments.find(ud => ud.isActive);
    if (firstActive) return firstActive.department;
  }

  // Fallback: schema antigo
  if (user.department) {
    return user.department;
  }

  return null;
}

/**
 * ✅ Helper SEGURO: Obter todos os departamentos do usuário
 * Funciona com schema antigo E novo
 */
export function getUserDepartments(user: UserWithDepartments) {
  // Schema novo
  if (user.userDepartments && user.userDepartments.length > 0) {
    return user.userDepartments
      .filter(ud => ud.isActive)
      .map(ud => ud.department);
  }

  // Fallback: schema antigo
  if (user.department) {
    return [user.department];
  }

  return [];
}

/**
 * ✅ Helper SEGURO: Obter IDs dos departamentos
 */
export function getUserDepartmentIds(user: UserWithDepartments): string[] {
  // Schema novo
  if (user.userDepartments && user.userDepartments.length > 0) {
    return user.userDepartments
      .filter(ud => ud.isActive)
      .map(ud => ud.departmentId);
  }

  // Fallback: schema antigo
  if (user.departmentId) {
    return [user.departmentId];
  }

  return [];
}

/**
 * ✅ Helper SEGURO: Verificar acesso a departamento
 */
export function hasAccessToDepartment(
  user: UserWithDepartments,
  targetDepartmentId: string
): boolean {
  const userDeptIds = getUserDepartmentIds(user);
  return userDeptIds.includes(targetDepartmentId);
}

/**
 * ✅ Helper: Sincronizar departmentId com userDepartments
 * Mantém compatibilidade bidirecional
 */
export async function syncUserDepartments(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userDepartments: true
    }
  });

  if (!user) return;

  // Obter departamento primary
  const primary = user.userDepartments.find(ud => ud.isPrimary && ud.isActive);

  // Sincronizar departmentId (campo antigo) com primary
  if (primary && user.departmentId !== primary.departmentId) {
    await prisma.user.update({
      where: { id: userId },
      data: { departmentId: primary.departmentId }
    });
  } else if (!primary && user.departmentId) {
    // Se não há primary, limpar departmentId
    await prisma.user.update({
      where: { id: userId },
      data: { departmentId: null }
    });
  }
}
```

---

### **Atualizar Rota GET /admin/team**

```typescript
// backend/src/routes/admin-management.ts

import { getUserDepartments, getPrimaryDepartment } from '../types/user-departments';

router.get('/team', requirePermission('team:read'), async (req, res) => {
  const { user } = req;

  try {
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

        // ✅ Schema antigo (mantém compatibilidade)
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },

        // ✅ Schema novo (múltiplos departamentos)
        userDepartments: {
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

    // ✅ Adicionar campos computed usando helpers seguros
    const membersWithDepartments = teamMembers.map(member => ({
      ...member,
      departments: getUserDepartments(member),
      primaryDepartment: getPrimaryDepartment(member)
    }));

    res.json({
      success: true,
      data: { teamMembers: membersWithDepartments }
    });

  } catch (error) {
    console.error('Erro ao buscar equipe:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro ao buscar equipe'
    });
  }
});
```

---

### **Atualizar Rota POST /admin/team**

```typescript
// backend/src/routes/admin-management.ts

import { syncUserDepartments } from '../types/user-departments';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: strongPasswordSchema,
  role: z.enum(['USER', 'COORDINATOR', 'MANAGER', 'ADMIN']),

  // ✅ ACEITA AMBOS: antigo e novo
  departmentId: z.string().optional(),      // Schema antigo (1 dept)
  departmentIds: z.array(z.string()).optional(),  // Schema novo (N depts)
  primaryDepartmentId: z.string().optional()      // Qual é o principal
});

router.post('/team', requirePermission('team:manage'), async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    const { user } = req;

    // Validações de hierarquia (mantidas)
    if (data.role === 'GUEST' || !isTeamRole(data.role)) {
      return res.status(400).json({
        error: 'INVALID_ROLE',
        message: 'Role inválido para equipe'
      });
    }

    if (!canManageRole(user.role, data.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Você não pode criar usuários com o cargo ${ROLE_DISPLAY_NAMES[data.role]}`
      });
    }

    // ✅ Determinar departamentos (novo ou antigo)
    let departmentIds: string[] = [];
    let primaryDeptId: string | undefined;

    if (data.departmentIds && data.departmentIds.length > 0) {
      // Schema novo: múltiplos departamentos
      departmentIds = data.departmentIds;
      primaryDeptId = data.primaryDepartmentId || departmentIds[0];
    } else if (data.departmentId) {
      // Schema antigo: 1 departamento
      departmentIds = [data.departmentId];
      primaryDeptId = data.departmentId;
    }

    // Validar todos os departamentos
    for (const deptId of departmentIds) {
      const isValid = await validateDepartment(deptId);
      if (!isValid) {
        return res.status(400).json({
          error: 'INVALID_DEPARTMENT',
          message: `Departamento ${deptId} inválido`
        });
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

        // ✅ DUPLA ESCRITA: antigo e novo
        departmentId: primaryDeptId,  // Schema antigo

        userDepartments: {
          create: departmentIds.map((deptId) => ({
            departmentId: deptId,
            isPrimary: deptId === primaryDeptId,
            isActive: true
          }))
        }
      },
      include: {
        department: true,
        userDepartments: {
          include: {
            department: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Usuário criado com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao criar usuário'
    });
  }
});
```

---

### **Atualizar Rota PUT /admin/team/:id**

```typescript
// backend/src/routes/admin-management.ts

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['USER', 'COORDINATOR', 'MANAGER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),

  // ✅ ACEITA AMBOS
  departmentId: z.string().optional(),
  departmentIds: z.array(z.string()).optional(),
  primaryDepartmentId: z.string().optional()
});

router.put('/team/:id', requirePermission('team:manage'), async (req, res) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const userId = req.params.id;

    // Validações (mantidas)
    // ...

    // ✅ Atualizar departamentos se fornecido
    let primaryDeptId: string | undefined;

    if (data.departmentIds !== undefined) {
      // Schema novo: múltiplos departamentos

      // Validar todos
      for (const deptId of data.departmentIds) {
        const isValid = await validateDepartment(deptId);
        if (!isValid) {
          return res.status(400).json({
            error: 'INVALID_DEPARTMENT',
            message: `Departamento ${deptId} inválido`
          });
        }
      }

      primaryDeptId = data.primaryDepartmentId || data.departmentIds[0];

      // Remover departamentos antigos
      await prisma.userDepartment.deleteMany({
        where: { userId }
      });

      // Adicionar novos
      await prisma.userDepartment.createMany({
        data: data.departmentIds.map((deptId) => ({
          userId,
          departmentId: deptId,
          isPrimary: deptId === primaryDeptId,
          isActive: true
        }))
      });

    } else if (data.departmentId !== undefined) {
      // Schema antigo: 1 departamento
      primaryDeptId = data.departmentId;

      // Sincronizar com schema novo
      await prisma.userDepartment.deleteMany({
        where: { userId }
      });

      if (data.departmentId) {
        await prisma.userDepartment.create({
          data: {
            userId,
            departmentId: data.departmentId,
            isPrimary: true,
            isActive: true
          }
        });
      }
    }

    // Atualizar dados básicos
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        departmentId: primaryDeptId  // ✅ Sincronizar campo antigo
      },
      include: {
        department: true,
        userDepartments: {
          include: {
            department: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Usuário atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Erro ao atualizar usuário'
    });
  }
});
```

---

## 🎨 IMPLEMENTAÇÃO FRONTEND

### **UserManagementModal - Seleção Múltipla**

```tsx
// frontend/components/admin/UserManagementModal.tsx

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserData {
  id?: string
  name: string
  email: string
  role: string
  isActive?: boolean

  // ✅ SUPORTA AMBOS: antigo e novo
  departmentId?: string           // Schema antigo
  departmentIds?: string[]        // Schema novo
  primaryDepartmentId?: string    // Qual é o principal
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

  // ✅ Compatibilidade: inicializar com dados antigos ou novos
  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive ?? true,

        // ✅ Se tem userDepartments (novo), usar
        departmentIds: user.userDepartments?.map(ud => ud.departmentId) ||
                      // Senão, usar departmentId (antigo)
                      (user.departmentId ? [user.departmentId] : []),

        primaryDepartmentId: user.userDepartments?.find(ud => ud.isPrimary)?.departmentId ||
                            user.departmentId ||
                            undefined
      })
    }
  }, [user])

  // Toggle departamento (adicionar/remover)
  const toggleDepartment = (departmentId: string) => {
    const currentIds = formData.departmentIds || []

    if (currentIds.includes(departmentId)) {
      // Remover
      const newIds = currentIds.filter(id => id !== departmentId)
      setFormData({
        ...formData,
        departmentIds: newIds,
        // Se remover o primary, definir outro
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

  // Departamentos selecionados
  const selectedDepartments = departments.filter(d =>
    formData.departmentIds?.includes(d.id)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações...

    const body = isEditMode
      ? {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          departmentIds: formData.departmentIds,          // ✅ Novo
          primaryDepartmentId: formData.primaryDepartmentId
        }
      : {
          name: formData.name,
          email: formData.email,
          password: password,
          role: formData.role,
          departmentIds: formData.departmentIds,          // ✅ Novo
          primaryDepartmentId: formData.primaryDepartmentId
        }

    // API call...
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Edite as informações do usuário'
              : 'Crie um novo usuário. Você pode vincular a múltiplos departamentos.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Nome, Email, Senha... (mantidos) */}

          {/* ✅ NOVA SEÇÃO: Seleção Múltipla de Departamentos */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Departamentos
              </Label>
              {selectedDepartments.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {selectedDepartments.length} selecionado(s)
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Selecione um ou mais departamentos onde o usuário atuará.
              O primeiro será marcado como principal automaticamente.
            </p>

            {/* Lista de departamentos */}
            <div className="border rounded-lg divide-y max-h-[280px] overflow-y-auto">
              {loadingDepartments ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Carregando departamentos...
                </div>
              ) : departments.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum departamento disponível
                </div>
              ) : (
                departments.map((dept) => {
                  const isSelected = formData.departmentIds?.includes(dept.id)
                  const isPrimary = formData.primaryDepartmentId === dept.id

                  return (
                    <div
                      key={dept.id}
                      className={cn(
                        'flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors',
                        isSelected && 'bg-accent'
                      )}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleDepartment(dept.id)}
                        disabled={loading}
                        id={`dept-${dept.id}`}
                      />

                      {/* Nome do departamento */}
                      <label
                        htmlFor={`dept-${dept.id}`}
                        className="flex-1 text-sm font-medium cursor-pointer"
                      >
                        {dept.name}
                      </label>

                      {/* Badge Primary ou botão para definir */}
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          {isPrimary ? (
                            <Badge variant="default" className="text-xs gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              Principal
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setPrimaryDepartment(dept.id)}
                              className="h-7 text-xs"
                            >
                              Definir como principal
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Resumo de selecionados */}
            {selectedDepartments.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Selecionados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedDepartments.map((dept) => {
                    const isPrimary = formData.primaryDepartmentId === dept.id

                    return (
                      <Badge
                        key={dept.id}
                        variant={isPrimary ? 'default' : 'secondary'}
                        className="flex items-center gap-1.5 pr-1"
                      >
                        {isPrimary && <Star className="h-3 w-3 fill-current" />}
                        <span className="text-xs">
                          {dept.name.replace('Secretaria de ', '')}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleDepartment(dept.id)}
                          className="ml-1 hover:bg-white/20 rounded-sm p-0.5"
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
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Apenas administradores podem vincular usuários a múltiplos departamentos
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Botões de ação */}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (formData.departmentIds?.length === 0 && currentUserRole !== 'ADMIN')}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🔒 CONTROLE DE ACESSO POR DEPARTAMENTO

### **Middleware Backend - requireDepartmentAccess()**

```typescript
// backend/src/middleware/department-access.ts

import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { getUserDepartmentIds } from '../types/user-departments';
import { getDepartmentSlug } from '../types/roles';

/**
 * Middleware: Verificar se usuário pode acessar departamento da rota
 *
 * Uso:
 * router.get('/secretarias/:department/services', requireDepartmentAccess(), ...)
 */
export const requireDepartmentAccess = (): RequestHandler => {
  return async (req, res, next) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Usuário não autenticado'
      });
    }

    // ✅ ADMIN e SUPER_ADMIN têm acesso a tudo
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Extrair slug do departamento da rota
    const departmentSlug = req.params.department || req.query.department;

    if (!departmentSlug) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Departamento não especificado na rota'
      });
    }

    try {
      // Buscar departamento pelo slug
      const department = await prisma.department.findFirst({
        where: {
          OR: [
            { code: departmentSlug },
            { name: { contains: departmentSlug.replace('-', ' '), mode: 'insensitive' } }
          ],
          isActive: true
        }
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Departamento não encontrado'
        });
      }

      // ✅ Buscar departamentos do usuário (compatível com ambos schemas)
      const userWithDepts = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          department: true,
          userDepartments: {
            where: { isActive: true },
            include: { department: true }
          }
        }
      });

      if (!userWithDepts) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        });
      }

      // ✅ Obter IDs dos departamentos (helper seguro)
      const userDeptIds = getUserDepartmentIds(userWithDepts as any);

      // Verificar se usuário tem acesso a ESTE departamento
      const hasAccess = userDeptIds.includes(department.id);

      if (!hasAccess) {
        // Buscar nomes dos departamentos do usuário para mensagem
        const userDepartments = userWithDepts.userDepartments.length > 0
          ? userWithDepts.userDepartments.map(ud => ud.department.name)
          : userWithDepts.department
            ? [userWithDepts.department.name]
            : [];

        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: `Acesso negado a ${department.name}. ` +
                   `Você tem acesso apenas a: ${userDepartments.join(', ') || 'nenhum departamento'}`
        });
      }

      // ✅ Anexar departamento à requisição
      (req as any).targetDepartment = department;

      next();

    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Erro ao verificar permissões'
      });
    }
  };
};
```

---

### **HOC Frontend - ProtectedDepartmentPage**

```tsx
// frontend/components/admin/ProtectedDepartmentPage.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { getUserDepartments, getPrimaryDepartment } from '@/lib/user-departments'
import { getDepartmentSlug } from '@/types/roles'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProtectedDepartmentPageProps {
  departmentSlug: string
  children: React.ReactNode
}

export function ProtectedDepartmentPage({
  departmentSlug,
  children
}: ProtectedDepartmentPageProps) {
  const { user, loading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || !user) return;

    // ADMIN vê tudo
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return;

    // ✅ Obter departamentos do usuário (helper seguro)
    const userDepartments = getUserDepartments(user as any)
    const userDeptSlugs = userDepartments.map(d => getDepartmentSlug(d.name))

    // Verificar se usuário tem acesso a este departamento
    if (!userDeptSlugs.includes(departmentSlug)) {
      // Redirecionar para seu departamento principal
      const primary = getPrimaryDepartment(user as any)
      if (primary) {
        const primarySlug = getDepartmentSlug(primary.name)
        router.replace(`/admin/secretarias/${primarySlug}`)
      } else {
        router.replace('/admin')
      }
    }
  }, [user, loading, departmentSlug, router])

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Não autenticado
  if (!user) return null;

  // ADMIN sempre tem acesso
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // ✅ Verificar acesso em tempo real
  const userDepartments = getUserDepartments(user as any)
  const userDeptSlugs = userDepartments.map(d => getDepartmentSlug(d.name))

  if (!userDeptSlugs.includes(departmentSlug)) {
    const primary = getPrimaryDepartment(user as any)

    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta secretaria.
            {userDepartments.length > 0 && (
              <>
                <br />
                <span className="font-medium">Seus departamentos:</span>{' '}
                {userDepartments.map(d => d.name).join(', ')}
              </>
            )}
          </AlertDescription>
          {primary && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push(`/admin/secretarias/${getDepartmentSlug(primary.name)}`)}
            >
              Ir para {primary.name}
            </Button>
          )}
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
```

**Uso nas páginas:**

```tsx
// frontend/app/admin/secretarias/[department]/page.tsx

import { ProtectedDepartmentPage } from '@/components/admin/ProtectedDepartmentPage'

export default function SecretariaPage({
  params
}: {
  params: { department: string }
}) {
  return (
    <ProtectedDepartmentPage departmentSlug={params.department}>
      {/* Conteúdo da secretaria */}
    </ProtectedDepartmentPage>
  );
}
```

---

### **AdminSidebar - Mostrar Múltiplos Departamentos**

```tsx
// frontend/components/admin/AdminSidebar.tsx

import { getUserDepartments } from '@/lib/user-departments'
import { getDepartmentSlug, getSecretariaIcon } from '@/types/roles'
import { Star } from 'lucide-react'

export function AdminSidebar() {
  const { user } = useAdminAuth()

  // ✅ Obter departamentos do usuário (helper seguro)
  const userDepartments = user ? getUserDepartments(user as any) : []

  // Criar itens de menu das secretarias
  const secretariaNavigation: NavSection = {
    title: 'Secretarias',
    items: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
      ? ALL_SECRETARIAS_ITEMS  // ADMIN vê todas as 13
      : userDepartments.map((dept, index) => {
          const slug = getDepartmentSlug(dept.name)
          const isPrimary = index === 0  // Primeiro é o primary (ordenado)

          return {
            title: dept.name.replace('Secretaria de ', ''),
            href: `/admin/secretarias/${slug}`,
            icon: getSecretariaIcon(slug),
            minRole: 'USER',
            badge: isPrimary ? 'Principal' : undefined  // ✅ Badge visual
          }
        })
  }

  // Renderizar...
}

// Lista completa das 13 secretarias (para ADMIN)
const ALL_SECRETARIAS_ITEMS: NavItem[] = [
  { title: 'Agricultura', href: '/admin/secretarias/agricultura', icon: Sprout },
  { title: 'Assistência Social', href: '/admin/secretarias/assistencia-social', icon: HandHeart },
  { title: 'Cultura', href: '/admin/secretarias/cultura', icon: Palette },
  { title: 'Educação', href: '/admin/secretarias/educacao', icon: GraduationCap },
  { title: 'Esportes', href: '/admin/secretarias/esportes', icon: Trophy },
  { title: 'Habitação', href: '/admin/secretarias/habitacao', icon: Home },
  { title: 'Meio Ambiente', href: '/admin/secretarias/meio-ambiente', icon: TreePine },
  { title: 'Obras Públicas', href: '/admin/secretarias/obras-publicas', icon: Truck },
  { title: 'Planejamento Urbano', href: '/admin/secretarias/planejamento-urbano', icon: MapPin },
  { title: 'Saúde', href: '/admin/secretarias/saude', icon: Heart },
  { title: 'Segurança Pública', href: '/admin/secretarias/seguranca-publica', icon: Shield },
  { title: 'Serviços Públicos', href: '/admin/secretarias/servicos-publicos', icon: Settings },
  { title: 'Turismo', href: '/admin/secretarias/turismo', icon: Camera }
];
```

---

## 📊 PLANO DE IMPLEMENTAÇÃO SEGURO

### **FASE 1: Preparação (Dia 1)**
- [ ] ✅ Criar branch `feature/multiple-departments`
- [ ] ✅ Fazer backup completo do banco de dados
- [ ] ✅ Criar migration do Prisma (tabela `user_departments`)
- [ ] ✅ Adicionar helpers em `types/user-departments.ts`
- [ ] ✅ NÃO remover `departmentId` ainda

### **FASE 2: Backend (Dias 2-3)**
- [ ] ✅ Executar migration em ambiente de desenvolvimento
- [ ] ✅ Verificar que dados foram migrados corretamente
- [ ] ✅ Atualizar rotas GET/POST/PUT `/admin/team`
- [ ] ✅ Atualizar `AdminAuthContext` no backend
- [ ] ✅ Criar middleware `requireDepartmentAccess()`
- [ ] ✅ Testar API com Postman/Insomnia

### **FASE 3: Frontend (Dias 4-5)**
- [ ] ✅ Atualizar `UserManagementModal` com seleção múltipla
- [ ] ✅ Criar HOC `ProtectedDepartmentPage`
- [ ] ✅ Atualizar `AdminSidebar` para mostrar múltiplos departamentos
- [ ] ✅ Atualizar `AdminAuthContext` no frontend
- [ ] ✅ Testar UI extensivamente

### **FASE 4: Testes (Dias 6-7)**
- [ ] ✅ Testar criação de usuário com 1 departamento (compatibilidade)
- [ ] ✅ Testar criação de usuário com 2+ departamentos (novo)
- [ ] ✅ Testar edição de departamentos
- [ ] ✅ Testar acesso a secretarias permitidas
- [ ] ✅ Testar bloqueio de secretarias não permitidas
- [ ] ✅ Testar sincronização `departmentId` ↔ `userDepartments`

### **FASE 5: Deploy Gradual (Dias 8-14)**
- [ ] ✅ Deploy em ambiente de staging
- [ ] ✅ Testes com usuários beta (1 semana)
- [ ] ✅ Coletar feedback e ajustar
- [ ] ✅ Deploy em produção (com rollback pronto)

### **FASE 6: Limpeza (Dias 30-60)**
- [ ] ⚠️ Após 30 dias sem problemas, considerar remover `departmentId`
- [ ] ⚠️ Criar migration para remover campo antigo
- [ ] ⚠️ Atualizar código para remover dupla escrita

---

## ⚠️ PONTOS CRÍTICOS DE ATENÇÃO

### **1. Protocolos e Serviços**
- **ProtocolSimplified.departmentId**: Permanece ÚNICO (protocolo pertence a 1 departamento)
- **ServiceSimplified.departmentId**: Permanece ÚNICO (serviço pertence a 1 departamento)
- Usuário com múltiplos departamentos pode VER protocolos de todos eles
- Ao criar protocolo, deve escolher EM QUAL departamento criar

### **2. Performance**
- Índices criados:
  - `user_departments(userId, departmentId)` UNIQUE
  - `user_departments(userId)` INDEX
  - `user_departments(departmentId)` INDEX
  - `user_departments(userId, isPrimary)` INDEX
- Queries com `include: { userDepartments }` podem ser pesadas
- Considerar cache de departamentos por usuário

### **3. Sincronização Bidirecional**
- `user.departmentId` DEVE estar sincronizado com departamento primary
- Usar helper `syncUserDepartments()` após operações
- Logs de auditoria rastreiam mudanças

### **4. Rollback**
- Se necessário reverter:
  1. Manter migration de criação de `user_departments`
  2. Os dados migrados permanecem intactos
  3. Código volta a usar apenas `departmentId`
  4. Nenhuma perda de dados

### **5. Testes Obrigatórios**
```typescript
// ✅ Verificar após migration
const usersWithOldDept = await prisma.user.count({
  where: { departmentId: { not: null } }
});

const userDeptRecords = await prisma.userDepartment.count({
  where: { isPrimary: true }
});

console.log('Usuários com dept (antigo):', usersWithOldDept);
console.log('Registros primary (novo):', userDeptRecords);
// DEVEM SER IGUAIS!
```

---

## 🎯 RESULTADO FINAL ESPERADO

### **Exemplo 1: Secretária de Agricultura e Meio Ambiente**
```json
{
  "id": "user-123",
  "name": "Maria Silva",
  "role": "MANAGER",
  "departmentId": "dept-agri",  // ✅ Campo antigo (compatibilidade)
  "userDepartments": [
    {
      "departmentId": "dept-agri",
      "isPrimary": true,
      "department": { "name": "Secretaria de Agricultura" }
    },
    {
      "departmentId": "dept-meio-ambiente",
      "isPrimary": false,
      "department": { "name": "Secretaria de Meio Ambiente" }
    }
  ]
}

// Menu mostra:
// - Agricultura (Principal) ⭐
// - Meio Ambiente
```

### **Exemplo 2: Servidor em 3 Secretarias**
```json
{
  "id": "user-456",
  "name": "João Santos",
  "role": "USER",
  "departmentId": "dept-saude",  // ✅ Primary sincronizado
  "userDepartments": [
    {
      "departmentId": "dept-saude",
      "isPrimary": true,
      "department": { "name": "Secretaria de Saúde" }
    },
    {
      "departmentId": "dept-assist-social",
      "isPrimary": false,
      "department": { "name": "Secretaria de Assistência Social" }
    },
    {
      "departmentId": "dept-educacao",
      "isPrimary": false,
      "department": { "name": "Secretaria de Educação" }
    }
  ]
}

// João acessa:
// - Saúde (Principal) ⭐
// - Assistência Social
// - Educação
```

### **Exemplo 3: Prefeito (ADMIN)**
```json
{
  "id": "user-789",
  "name": "Carlos Prefeito",
  "role": "ADMIN",
  "departmentId": null,  // ADMIN não precisa de departamento
  "userDepartments": []  // Acessa TODAS as 13 secretarias
}

// Menu mostra TODAS as 13 secretarias
```

---

## ✅ CHECKLIST FINAL DE VALIDAÇÃO

### **Banco de Dados:**
- [ ] Tabela `user_departments` criada
- [ ] Índices criados e funcionando
- [ ] Dados migrados de `users.departmentId`
- [ ] Contagem de registros bate (antigo = novo)
- [ ] Campo `departmentId` ainda existe (não removido)

### **Backend:**
- [ ] Helpers em `types/user-departments.ts` funcionam
- [ ] GET `/admin/team` retorna `userDepartments` e `department`
- [ ] POST `/admin/team` aceita `departmentIds` e `departmentId`
- [ ] PUT `/admin/team/:id` atualiza ambos schemas
- [ ] Middleware `requireDepartmentAccess()` funciona
- [ ] Sincronização `departmentId` ↔ primary funciona

### **Frontend:**
- [ ] `UserManagementModal` mostra seleção múltipla
- [ ] Checkbox para múltiplos departamentos funciona
- [ ] Badge "Principal" aparece corretamente
- [ ] `AdminSidebar` mostra departamentos do usuário
- [ ] HOC `ProtectedDepartmentPage` bloqueia acesso
- [ ] Mensagens de erro claras

### **Testes:**
- [ ] Criar usuário com 1 departamento (antigo)
- [ ] Criar usuário com 2+ departamentos (novo)
- [ ] Editar departamentos de usuário
- [ ] Definir novo departamento como primary
- [ ] Remover departamento
- [ ] Acessar secretaria permitida (200)
- [ ] Acessar secretaria não permitida (403)
- [ ] ADMIN acessa todas as secretarias

---

## 🚀 COMANDO PARA INICIAR

```bash
# 1. Criar branch
git checkout -b feature/multiple-departments

# 2. Fazer backup do banco
pg_dump digiurban_db > backup_$(date +%Y%m%d).sql

# 3. Aplicar migration
cd digiurban/backend
npx prisma migrate dev --name add_user_departments

# 4. Verificar dados migrados
npx prisma studio
# Verificar tabela user_departments
# Verificar que departmentId ainda existe

# 5. Gerar Prisma Client
npx prisma generate

# 6. Reiniciar backend
npm run dev

# 7. Testar API
curl http://localhost:3001/api/admin/team \
  -H "Authorization: Bearer YOUR_TOKEN"

# 8. Verificar frontend
cd ../frontend
npm run dev
```

---

**📄 PROPOSTA CONSOLIDADA CRIADA!**

**Inclui:**
- ✅ 3 propostas consolidadas (Roles + Acesso + Múltiplos Departamentos)
- ✅ Schema Prisma SEGURO (adiciona sem remover)
- ✅ Migration SQL COMPLETA (migração de dados incluída)
- ✅ Helpers backend com compatibilidade dupla
- ✅ Middleware de controle de acesso
- ✅ Frontend com seleção múltipla
- ✅ HOC de proteção de páginas
- ✅ Plano de implementação em 6 fases
- ✅ Checklist de validação (40+ itens)
- ✅ Zero breaking changes
- ✅ Rollback possível

**Aguardando suas instruções para prosseguir!** 🎯
