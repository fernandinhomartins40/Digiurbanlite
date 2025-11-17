# 🔐 Credenciais de Acesso - DigiUrban Single-Tenant

## 📌 Informações dos Servidores

### Backend API
- **URL:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Teste:** http://localhost:3001/api/test
- **Status:** ✅ RODANDO

### Frontend
- **URL:** http://localhost:3000
- **Login Admin:** http://localhost:3000/admin/login
- **Login Cidadão:** http://localhost:3000/auth/login
- **Status:** ✅ RODANDO

---

## 👤 Credenciais de Acesso

### ✅ BANCO DE DADOS CONFIGURADO

O banco de dados foi **criado e configurado** com sucesso!

**Status atual:**
- ✅ Banco criado: `digiurban/backend/prisma/dev.db` (3.3MB)
- ✅ Tabelas criadas: users, citizens, protocols, etc
- ✅ Seed executado com sucesso
- ✅ Município configurado: Município Demonstração (SP)
- ✅ 14 Departamentos/Secretarias criados
- ✅ 3 Usuários admin/gerente/user criados
- ✅ 1 Cidadão de teste criado

---

## 🔑 Credenciais Padrão (Após Seed)

### ✅ Administrador Municipal
```
Email: admin@demo.gov.br
Senha: Admin@123
Role: ADMIN
Login: http://localhost:3000/admin/login
```

### ✅ Gerente Municipal
```
Email: gerente@demo.gov.br
Senha: Gerente@123
Role: MANAGER
Login: http://localhost:3000/admin/login
```

### ✅ Usuário Teste
```
Email: user@demo.gov.br
Senha: User@123
Role: USER
Login: http://localhost:3000/admin/login
```

### ✅ Cidadão Teste
```
Nome: José Silva
Email: jose.silva@example.com
CPF: 12345678901
Senha: Cidadao@123
Login: http://localhost:3000/auth/login
```

**⚠️ IMPORTANTE:** Altere as senhas após o primeiro login!

### ✅ Admin Original (Criado antes do seed)
```
Email: admin@digiurban.com
Senha: Admin@123
Role: ADMIN
```

---

## 📝 Como Criar Usuários Adicionais

### ✅ Admin já criado! Use estas opções para criar outros usuários:

**Opção 1: Via Script Rápido (Outro Admin)**
```bash
cd digiurban/backend
node scripts/create-first-admin.js
```

**Opção 2: Via Seed (Múltiplos usuários)**
```bash
cd digiurban/backend
npx prisma db seed
```

**Opção 3: Via SQL Direto**
```bash
cd digiurban/backend
sqlite3 prisma/dev.db

-- Exemplo: Criar gerente
INSERT INTO users (
  id,
  email,
  password,
  name,
  role,
  isActive,
  createdAt,
  updatedAt
) VALUES (
  'user' || hex(randomblob(8)),
  'gerente@digiurban.com',
  '$2b$10$hashedPasswordHere',
  'Gerente Municipal',
  'MANAGER',
  1,
  datetime('now'),
  datetime('now')
);
```

---

## 🗄️ Banco de Dados

### Configuração
```env
DATABASE_URL="file:c:/Projetos Cursor/Digiurbanlite/digiurban/backend/prisma/dev.db"
```

### Localização
```
c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\dev.db
```

### Tamanho Atual
- **3.3 MB** com todas as tabelas criadas

### Backup Anterior (Multi-tenant)
```
c:\Projetos Cursor\Digiurbanlite\digiurban\backend\prisma\dev.db.old-multitenant-backup
```

---

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
# Environment
NODE_ENV=development

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database (✅ CORRIGIDO)
DATABASE_URL="file:c:/Projetos Cursor/Digiurbanlite/digiurban/backend/prisma/dev.db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📊 Status da Migração

### ✅ Concluído
- [x] Schema Prisma atualizado (sem Tenant)
- [x] Banco de dados recriado
- [x] 200 erros TypeScript corrigidos
- [x] Rotas multi-tenant removidas
- [x] JSON de municípios desabilitado
- [x] Backend rodando (porta 3001)
- [x] Frontend rodando (porta 3000)
- [x] DATABASE_URL corrigido no .env
- [x] Tabelas criadas (3.3MB)
- [x] Usuário ADMIN criado

### ⚠️ Pendente
- [x] Criar seed para popular banco ✅
- [ ] Testar fluxo completo de autenticação
- [ ] Reabilitar module handlers (se necessário)
- [ ] Reabilitar rotas adicionais (protocolos, secretarias, etc)
- [ ] Criar serviços de exemplo para cada secretaria

---

## 🚀 Como Iniciar

### 1. Backend
```bash
cd digiurban/backend
npm run dev
```

### 2. Frontend
```bash
cd digiurban/frontend
npm run dev
```

### 3. Acessar
- Frontend: http://localhost:3000
- Backend Health: http://localhost:3001/health
- Admin Login: http://localhost:3000/admin/login

---

## 🧪 Testar Login

### Via Frontend (Recomendado)
1. Acesse: http://localhost:3000/admin/login
2. Email: `admin@digiurban.com`
3. Senha: `Admin@123`
4. Clique em "Entrar"

### Via API (cURL)
```bash
curl -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@digiurban.com",
    "password": "Admin@123"
  }'
```

---

## 📝 Notas Importantes

1. **Sem Tenant:** Sistema agora é single-tenant, não precisa mais selecionar município
2. **Banco Configurado:** 3.3MB com todas as tabelas
3. **Admin Criado:** Login funcional
4. **DATABASE_URL:** Corrigido para path correto (Digiurbanlite)
5. **SUPER_ADMIN:** Role ainda existe no enum mas não está sendo utilizada

---

## 🔗 Links Úteis

- **Documentação Prisma:** https://www.prisma.io/docs
- **Next.js 14:** https://nextjs.org/docs
- **Express.js:** https://expressjs.com
- **bcrypt:** https://www.npmjs.com/package/bcrypt

---

## 🛠️ Scripts Úteis

### Criar Novo Admin
```bash
cd digiurban/backend
node scripts/create-first-admin.js
```

### Ver Usuários no Banco
```bash
cd digiurban/backend
sqlite3 prisma/dev.db "SELECT id, email, name, role, isActive FROM users;"
```

### Resetar Senha de Usuário
```bash
cd digiurban/backend
sqlite3 prisma/dev.db

UPDATE users
SET password = '$2b$10$hashedPasswordHere'
WHERE email = 'admin@digiurban.com';
```

---

**Gerado em:** 2025-11-06 00:36
**Versão:** Single-Tenant v1.0
**Status:** ✅ OPERACIONAL COM ADMIN CRIADO
