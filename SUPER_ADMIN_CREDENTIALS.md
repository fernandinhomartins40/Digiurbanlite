# 🔐 Credenciais de Acesso - Super Admin

## ✅ Super Admin Criado com Sucesso!

O usuário Super Admin foi criado automaticamente no banco de dados.

---

## 📋 CREDENCIAIS DE ACESSO

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email:    superadmin@digiurban.com
🔑 Senha:    DigiUrban@2024!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🌐 URLs de Acesso

### **Desenvolvimento (Local)**
```
http://localhost:3000/super-admin/login
```

### **Produção**
```
https://seudominio.com/super-admin/login
```

---

## 🚀 Como Acessar

1. Navegue até a página inicial: `http://localhost:3000`
2. No **footer** da página, clique no botão **"Painel Super Admin"** (ícone de escudo)
3. Faça login com as credenciais acima
4. **IMPORTANTE:** Altere a senha no primeiro acesso!

---

## 🔄 Recriar Super Admin

Se precisar recriar o usuário super admin:

```bash
cd digiurban/backend
npm run db:seed:superadmin
```

Ou executar manualmente:

```bash
cd digiurban/backend
npx tsx scripts/create-super-admin.ts
```

---

## 🎯 Funcionalidades do Painel Super Admin

### **Dashboard**
- Visão geral do sistema
- Métricas de uso
- Status dos serviços

### **Email Server**
- ✅ Dashboard geral com métricas em tempo real
- ✅ Configuração do servidor SMTP
- ✅ Gerenciamento de domínios
- ✅ Verificação DNS automática
- ✅ Geração de chaves DKIM
- ✅ Logs do servidor

### **Município**
- Configurações do município
- Informações gerais

### **Usuários Admin**
- Gerenciamento de administradores
- Controle de permissões

### **Monitoramento**
- Status dos serviços
- Performance do sistema

### **Auditoria**
- Logs de auditoria
- Histórico de ações

### **Operações**
- Tarefas administrativas
- Manutenção do sistema

### **Configurações**
- Sistema
- Database Schema

---

## 🔒 Segurança

- ✅ Senha forte com caracteres especiais
- ✅ Hash bcrypt com 12 rounds
- ✅ Role SUPER_ADMIN atribuída
- ✅ Autenticação JWT
- ✅ Middleware de autorização

⚠️ **IMPORTANTE:**
1. Altere a senha padrão imediatamente após o primeiro login
2. Não compartilhe as credenciais
3. Use uma senha forte e única
4. Ative autenticação de dois fatores se disponível

---

## 📝 Notas

- O super admin é criado automaticamente ao executar `npm run db:seed`
- Se o usuário já existir, o script não sobrescreve (segurança)
- O script está incluído no processo de deploy (Docker)
- O botão de acesso está no footer da landing page

---

## 🛠️ Desenvolvimento

### **Arquivos Relacionados**

```
digiurban/
├── backend/
│   ├── scripts/
│   │   └── create-super-admin.ts     # Script de criação
│   └── package.json                  # Script npm adicionado
│
├── frontend/
│   └── app/
│       ├── landing/page.tsx          # Botão no footer
│       └── super-admin/
│           ├── login/page.tsx        # Página de login
│           ├── page.tsx              # Dashboard
│           └── email-server/         # Sistema de email
│
└── docker/
    └── startup.sh                    # Deploy automático
```

---

## ✨ Pronto!

Seu sistema DigiUrban está configurado com acesso Super Admin completo.

**Bom uso!** 🚀
