# 🔐 PROPOSTA: Controle de Acesso por Departamento e Role

## 📋 Análise da Situação Atual

### ✅ **O que já funciona bem:**

1. **Sistema de Roles Hierárquico**
   - Hierarquia: GUEST(0) → USER(1) → COORDINATOR(2) → MANAGER(3) → ADMIN(4) → SUPER_ADMIN(5)
   - Helpers centralizados em `types/roles.ts`
   - Validações no backend e frontend

2. **Sistema de Permissões**
   - Permissões definidas em `ROLE_PERMISSIONS`
   - Middleware `requirePermission()` no backend
   - Hook `useAdminPermissions()` no frontend

3. **Navegação com Controle de Acesso**
   - `AdminSidebar.tsx` já filtra itens por `minRole` e `permissions`
   - Função `shouldShowItem()` valida visibilidade

### ❌ **Problemas Identificados:**

1. **Todas as 13 Secretarias Visíveis para Todos**
   - Usuário de Agricultura vê links de Saúde, Educação, etc.
   - Não há filtro por `user.departmentId`
   - `minRole: 'COORDINATOR'` permite acesso a TODAS as secretarias

2. **Falta de Validação de Departamento nas Rotas**
   - Usuário pode acessar `/admin/secretarias/saude` mesmo sendo de Agricultura
   - Não há middleware de verificação de departamento

3. **Permissões Genéricas**
   - `protocols:read` permite ver todos os protocolos
   - Não há escopo por departamento: `protocols:read:own_department`

---

## 🎯 PROPOSTA DE SOLUÇÃO

### **Objetivo:**
Usuários que não são ADMIN devem ver apenas:
- ✅ Páginas gerais (Início, Protocolos, Catálogo de Serviços, Equipe, Relatórios)
- ✅ Sua própria secretaria (baseado em `user.departmentId`)
- ❌ Outras secretarias (bloqueadas)

---

## 🏗️ Arquitetura da Solução

### **1. Páginas com Níveis de Acesso**

```typescript
// Classificação de páginas
type PageAccessLevel =
  | 'PUBLIC'           // Qualquer usuário autenticado
  | 'DEPARTMENT_ONLY'  // Apenas da própria secretaria
  | 'ADMIN_ONLY'       // Apenas ADMIN/SUPER_ADMIN
```

#### **Páginas Gerais (PUBLIC)** - Todos veem
- `/admin` - Início
- `/admin/dashboard` - Dashboard geral
- `/admin/protocolos` - Protocolos (filtrados por departamento)
- `/admin/servicos` - Catálogo de Serviços
- `/admin/equipe` - Gestão de Equipe
- `/admin/relatorios` - Relatórios (filtrados por departamento)
- `/admin/gerenciamento-servicos` - Estatísticas de Serviços

#### **Páginas de Secretarias (DEPARTMENT_ONLY)** - Apenas da própria secretaria
- `/admin/secretarias/agricultura` → Apenas quem tem `departmentId === "agricultura_id"`
- `/admin/secretarias/saude` → Apenas quem tem `departmentId === "saude_id"`
- ... (13 secretarias)

#### **Páginas Restritas (ADMIN_ONLY)** - Apenas Prefeito
- `/admin/gabinete/*` - Gabinete do Prefeito
- `/admin/cidadaos` - Gestão de Cidadãos (ADMIN vê todos)
- `/admin/cidadaos/pendentes` - Validação de Cidadãos
- `/admin/chamados` - Sistema de Chamados
- `/admin/modulos-customizados` - Módulos Personalizados
- `/admin/integracoes` - Integrações

---

## 💻 Implementação Proposta

### **Passo 1: Atualizar `types/roles.ts`**

Adicionar permissões específicas de departamento:

```typescript
// backend/src/types/roles.ts

export const ROLE_PERMISSIONS = {
  GUEST: [],

  USER: [
    'protocols:read:own',              // Apenas seus protocolos
    'protocols:create',
    'protocols:update:own',
    'services:read:department',        // Serviços do departamento
    'department:read:own'              // Apenas seu departamento
  ],

  COORDINATOR: [
    'protocols:read:department',       // Protocolos do departamento
    'protocols:create',
    'protocols:update:department',
    'protocols:assign:department',
    'services:read:department',
    'services:create:department',
    'team:read:department',            // Equipe do departamento
    'departments:read:own',
    'reports:read:department'
  ],

  MANAGER: [
    'protocols:*:department',          // Tudo de protocolos no depto
    'services:*:department',
    'team:*:department',
    'departments:read:own',
    'reports:*:department'
  ],

  ADMIN: [
    'protocols:*',                     // Tudo sem restrição
    'services:*',
    'team:*',
    'departments:*',
    'reports:*',
    'citizens:*',
    'chamados:*',
    'modules:*'
  ],

  SUPER_ADMIN: ['*']
};

// Helper: Verificar se usuário pode acessar departamento
export function canAccessDepartment(
  userRole: string,
  userDepartmentId: string | undefined,
  targetDepartmentId: string
): boolean {
  // ADMIN e SUPER_ADMIN veem tudo
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
    return true;
  }

  // Outros roles só veem seu próprio departamento
  return userDepartmentId === targetDepartmentId;
}

// Helper: Obter slug do departamento pelo ID
export function getDepartmentSlug(departmentName: string): string {
  const slugMap: Record<string, string> = {
    'Secretaria de Agricultura': 'agricultura',
    'Secretaria de Saúde': 'saude',
    'Secretaria de Educação': 'educacao',
    'Secretaria de Assistência Social': 'assistencia-social',
    'Secretaria de Cultura': 'cultura',
    'Secretaria de Esportes': 'esportes',
    'Secretaria de Habitação': 'habitacao',
    'Secretaria de Meio Ambiente': 'meio-ambiente',
    'Secretaria de Obras Públicas': 'obras-publicas',
    'Secretaria de Planejamento Urbano': 'planejamento-urbano',
    'Secretaria de Segurança Pública': 'seguranca-publica',
    'Secretaria de Serviços Públicos': 'servicos-publicos',
    'Secretaria de Turismo': 'turismo'
  };

  return slugMap[departmentName] || '';
}
```

---

### **Passo 2: Atualizar `AdminSidebar.tsx`**

Filtrar secretarias baseado no departamento do usuário:

```typescript
// frontend/components/admin/AdminSidebar.tsx

import { canAccessDepartment, getDepartmentSlug } from '@/types/roles'

export function AdminSidebar() {
  const { user } = useAdminAuth()
  const { hasMinRole } = useAdminPermissions()

  // ✅ Filtrar secretarias dinamicamente
  const secretariaNavigation: NavSection = {
    title: 'Secretarias',
    items: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
      ? ALL_SECRETARIAS_ITEMS  // ADMIN vê todas
      : user?.department
        ? [getSingleDepartmentItem(user.department)]  // Outros veem só a sua
        : []  // Sem departamento = não vê nada
  }

  // Helper: Criar item de menu para um departamento
  const getSingleDepartmentItem = (department: { id: string, name: string }): NavItem => {
    const slug = getDepartmentSlug(department.name);

    return {
      title: department.name.replace('Secretaria de ', ''),
      href: `/admin/secretarias/${slug}`,
      icon: getSecretariaIcon(slug),
      minRole: 'USER'  // Qualquer role pode acessar sua própria secretaria
    };
  }

  // Lista completa (apenas para ADMIN)
  const ALL_SECRETARIAS_ITEMS: NavItem[] = [
    { title: 'Agricultura', href: '/admin/secretarias/agricultura', icon: Sprout },
    { title: 'Assistência Social', href: '/admin/secretarias/assistencia-social', icon: HandHeart },
    // ... todas as 13
  ];
}
```

---

### **Passo 3: Criar Middleware de Verificação de Departamento**

Middleware para proteger rotas de secretarias:

```typescript
// backend/src/middleware/department-access.ts

import { RequestHandler } from 'express';
import { canAccessDepartment, getDepartmentSlug } from '../types/roles';
import { prisma } from '../lib/prisma';

/**
 * Middleware: Verificar se usuário pode acessar o departamento da rota
 * Uso: requireDepartmentAccess() em rotas de secretarias
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

    // ADMIN e SUPER_ADMIN têm acesso a tudo
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Extrair departmentSlug da URL
    const departmentSlug = req.params.department || req.query.department;

    if (!departmentSlug) {
      return res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Departamento não especificado na rota'
      });
    }

    // Buscar departamento pelo slug
    const department = await prisma.department.findFirst({
      where: {
        // Converter slug para nome (ex: 'agricultura' -> 'Secretaria de Agricultura')
        name: {
          contains: departmentSlug.replace('-', ' '),
          mode: 'insensitive'
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Departamento não encontrado'
      });
    }

    // Verificar se usuário pertence a este departamento
    if (!canAccessDepartment(user.role, user.departmentId, department.id)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Você não tem permissão para acessar ${department.name}. Acesso permitido apenas para ${user.department?.name || 'seu departamento'}.`
      });
    }

    // Anexar departamento à requisição para uso posterior
    (req as any).targetDepartment = department;

    next();
  };
};
```

---

### **Passo 4: Aplicar Middleware nas Rotas de Secretarias**

```typescript
// backend/src/routes/secretarias-[nome].ts

import { requireDepartmentAccess } from '../middleware/department-access';

// ✅ Adicionar middleware em todas as rotas de secretarias
router.get(
  '/secretarias/:department/services',
  authenticateToken,
  requireDepartmentAccess(),  // ✅ Novo middleware
  async (req, res) => {
    // Lógica da rota
  }
);
```

---

### **Passo 5: Criar HOC de Proteção de Rota no Frontend**

```typescript
// frontend/components/admin/ProtectedDepartmentPage.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { canAccessDepartment, getDepartmentSlug } from '@/types/roles'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'

interface ProtectedDepartmentPageProps {
  departmentSlug: string
  children: React.ReactNode
}

export function ProtectedDepartmentPage({
  departmentSlug,
  children
}: ProtectedDepartmentPageProps) {
  const { user } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) return;

    // ADMIN vê tudo
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return;

    // Verificar se usuário pertence a este departamento
    const userDepartmentSlug = user.department
      ? getDepartmentSlug(user.department.name)
      : '';

    if (userDepartmentSlug !== departmentSlug) {
      // Redirecionar para sua própria secretaria
      router.replace(`/admin/secretarias/${userDepartmentSlug}`);
    }
  }, [user, departmentSlug, router]);

  // Verificação em tempo real
  if (!user) return null;

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    const userDepartmentSlug = user.department
      ? getDepartmentSlug(user.department.name)
      : '';

    if (userDepartmentSlug !== departmentSlug) {
      return (
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para acessar esta secretaria.
              Você só pode acessar: <strong>{user.department?.name}</strong>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return <>{children}</>;
}
```

**Uso nas páginas de secretarias:**

```tsx
// frontend/app/admin/secretarias/[department]/page.tsx

import { ProtectedDepartmentPage } from '@/components/admin/ProtectedDepartmentPage'

export default function SecretariaPage({ params }: { params: { department: string } }) {
  return (
    <ProtectedDepartmentPage departmentSlug={params.department}>
      {/* Conteúdo da página */}
    </ProtectedDepartmentPage>
  );
}
```

---

## 📊 Resumo da Proposta

### **O que muda:**

| Antes | Depois |
|-------|--------|
| Todas as 13 secretarias no menu | Apenas a secretaria do usuário (ou todas para ADMIN) |
| Qualquer COORDINATOR acessa qualquer secretaria | COORDINATOR só acessa sua secretaria |
| Sem validação de departamento nas rotas | Middleware valida departamento no backend |
| Sem proteção nas páginas | HOC protege páginas no frontend |

### **Páginas Afetadas:**

✅ **Permanecem acessíveis a todos:**
- Início, Dashboard, Protocolos (filtrados), Catálogo de Serviços, Equipe, Relatórios

🔒 **Ficam restritas ao departamento:**
- `/admin/secretarias/[department]/*`

🔐 **Ficam restritas ao ADMIN:**
- Gabinete, Cidadãos, Chamados, Módulos Customizados, Integrações

---

## ✅ Checklist de Implementação

### **Backend:**
- [ ] Atualizar `ROLE_PERMISSIONS` em `types/roles.ts`
- [ ] Adicionar helpers `canAccessDepartment()` e `getDepartmentSlug()`
- [ ] Criar middleware `requireDepartmentAccess()`
- [ ] Aplicar middleware em rotas de secretarias
- [ ] Testar acesso não autorizado (deve retornar 403)

### **Frontend:**
- [ ] Atualizar `types/roles.ts` com helpers
- [ ] Modificar `AdminSidebar.tsx` para filtrar secretarias
- [ ] Criar componente `ProtectedDepartmentPage`
- [ ] Envolver páginas de secretarias com HOC
- [ ] Testar navegação e redirecionamentos

### **Testes:**
- [ ] Login como USER de Agricultura → deve ver só Agricultura
- [ ] Login como COORDINATOR de Saúde → deve ver só Saúde
- [ ] Login como ADMIN → deve ver todas as 13 secretarias
- [ ] Tentar acessar `/admin/secretarias/saude` sendo de Agricultura → deve bloquear
- [ ] Verificar que páginas gerais continuam acessíveis

---

## 🚨 Considerações Importantes

### **Casos Especiais:**

1. **Usuário sem departamento:**
   - Não vê nenhuma secretaria no menu
   - Pode acessar apenas páginas gerais

2. **MANAGER (Secretário) vs ADMIN (Prefeito):**
   - MANAGER: acessa apenas sua secretaria
   - ADMIN: acessa todas as secretarias

3. **Protocolos e Serviços:**
   - Devem ser filtrados por departamento automaticamente
   - Queries no backend devem adicionar `WHERE departmentId = user.departmentId`

4. **Relatórios:**
   - ADMIN vê relatórios de todas as secretarias
   - Outros roles veem apenas relatórios de seu departamento

---

## 🎯 Resultado Esperado

**Usuário: João (Servidor da Secretaria de Agricultura)**
```
Menu visível:
✅ Início
✅ Dashboard (geral)
✅ Protocolos (filtrados por Agricultura)
✅ Catálogo de Serviços
✅ Equipe (da Agricultura)
✅ Relatórios (da Agricultura)
✅ Agricultura (sua secretaria)
❌ Saúde (bloqueada)
❌ Educação (bloqueada)
❌ ... outras 11 secretarias (bloqueadas)
❌ Gabinete do Prefeito (bloqueado)
```

**Usuário: Maria (Prefeita - ADMIN)**
```
Menu visível:
✅ Início
✅ Dashboard
✅ Protocolos (todos)
✅ Catálogo de Serviços
✅ Equipe (todos)
✅ Relatórios (todos)
✅ Gabinete do Prefeito
✅ Agricultura
✅ Saúde
✅ Educação
✅ ... todas as 13 secretarias
✅ Cidadãos
✅ Chamados
✅ Integrações
```

---

**Aguardando suas instruções para prosseguir com a implementação!**
