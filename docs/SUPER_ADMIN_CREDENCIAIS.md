# 👑 CREDENCIAIS SUPER ADMIN - DigiUrban Single Tenant

## Super Administrador
**Acesso total ao sistema, incluindo gerenciamento do município**

- **Email:** `superadmin@digiurban.com.br`
- **Senha:** `SuperAdmin@2025`
- **Role:** `SUPER_ADMIN`

### URLs de Acesso:
- **Login:** http://localhost:3000/admin/login
- **Painel Super Admin:** http://localhost:3000/admin/super-admin

---

## Funcionalidades do Super Admin:

✅ Gerenciar configurações do município
✅ Suspender/Ativar município
✅ Controlar limites de usuários e cidadãos
✅ Gerenciar planos de assinatura
✅ Definir status de pagamento
✅ Visualizar estatísticas gerais do sistema
✅ Configurar features habilitadas

---

## Outros Usuários do Sistema:

### Administrador Municipal
- **Email:** `admin@demo.gov.br`
- **Senha:** `Admin@123`
- **Role:** `ADMIN`

### Gerente Municipal
- **Email:** `gerente@demo.gov.br`
- **Senha:** `Gerente@123`
- **Role:** `MANAGER`

### Usuário Teste
- **Email:** `user@demo.gov.br`
- **Senha:** `User@123`
- **Role:** `USER`

### Cidadão Teste
- **Email:** `jose.silva@example.com`
- **CPF:** `12345678901`
- **Senha:** `Cidadao@123`

---

## Configuração do Município (Atual):

- **Nome:** Município Demonstração
- **CNPJ:** 00000000000191
- **Código IBGE:** 0000000
- **UF:** SP
- **Plano:** Professional
- **Validade:** 1 ano a partir de hoje
- **Max Usuários:** 50
- **Max Cidadãos:** 50.000
- **Status:** Ativo
- **Pagamento:** Em dia

---

## Segurança:

⚠️ **IMPORTANTE:**
- Altere estas senhas em produção
- Nunca compartilhe as credenciais do Super Admin
- Use senhas fortes com letras maiúsculas, minúsculas, números e caracteres especiais
- Habilite autenticação de dois fatores (se disponível)

---

**Data de geração:** $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
