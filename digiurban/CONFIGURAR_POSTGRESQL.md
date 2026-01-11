# 🐘 CONFIGURAR POSTGRESQL - 2 MINUTOS

PostgreSQL 16 está instalado em: `C:\Program Files\PostgreSQL\16`

## Opção 1: Via pgAdmin (MAIS FÁCIL) ⭐

1. **Abrir pgAdmin 4** (foi instalado junto com PostgreSQL)
   - Procurar "pgAdmin" no menu Iniciar

2. **Conectar ao servidor local**
   - Clicar em "Servers" → "PostgreSQL 16"
   - Senha: `digiurban_dev_2025` (ou a que você definiu na instalação)

3. **Criar database**
   - Botão direito em "Databases" → "Create" → "Database"
   - Name: `digiurban`
   - Owner: `postgres`
   - Save

4. **Criar usuário**
   - Botão direito em "Login/Group Roles" → "Create" → "Login/Group Role"
   - General tab → Name: `digiurban`
   - Definition tab → Password: `digiurban_dev_2025`
   - Privileges tab → Marcar "Can login?"
   - Save

5. **Dar privilégios**
   - Botão direito no database `digiurban` → "Properties"
   - Security tab → Add → Select `digiurban`
   - Privileges: ALL
   - Save

## Opção 2: Via SQL Shell (psql)

1. **Abrir SQL Shell (psql)** do menu Iniciar

2. **Conectar** (pressionar Enter para valores padrão):
   ```
   Server [localhost]:          (Enter)
   Database [postgres]:         (Enter)
   Port [5432]:                 (Enter)
   Username [postgres]:         (Enter)
   Password:                    digiurban_dev_2025
   ```

3. **Executar comandos SQL**:
   ```sql
   CREATE USER digiurban WITH PASSWORD 'digiurban_dev_2025';
   CREATE DATABASE digiurban OWNER digiurban;
   GRANT ALL PRIVILEGES ON DATABASE digiurban TO digiurban;
   \c digiurban
   GRANT ALL ON SCHEMA public TO digiurban;
   \q
   ```

## ✅ Testar Conexão

Depois de configurar, testar:

```bash
cd digiurban/backend
npx prisma db push
```

Se conectar com sucesso, está pronto! 🎉

## ⚠️ Problemas?

**Erro: "Connection refused"**
- Verificar se serviço PostgreSQL está rodando:
  - Services.msc → Procurar "postgresql" → Iniciar

**Erro: "password authentication failed"**
- Verificar senha do usuário postgres
- Recriar usuário digiurban com senha correta

## 📝 String de Conexão

Depois de configurar, usar no `.env`:

```
DATABASE_URL="postgresql://digiurban:digiurban_dev_2025@localhost:5432/digiurban"
```
