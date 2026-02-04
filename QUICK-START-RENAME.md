# 🚀 Quick Start - RENAME Medicamentos

## ⚡ Instalação em 3 Passos

### 1️⃣ Popular o Banco de Dados (Backend)

```bash
cd backend
npm run db:seed:rename
```

✅ Aguarde a mensagem: `🎉 Seed de medicamentos RENAME concluído com sucesso!`

### 2️⃣ Verificar Backend Rodando

```bash
npm run dev
```

✅ Servidor deve estar em: `http://localhost:3001`

### 3️⃣ Verificar Frontend Rodando

```bash
cd ../frontend
npm run dev
```

✅ Aplicação deve estar em: `http://localhost:3000`

---

## 🎯 Teste Rápido

### 1. Acessar Interface
```
http://localhost:3000/admin/apps/saude/farmacia/estoque/novo
```

### 2. Usar RENAME Mode
1. Selecione **"Medicamento da RENAME"**
2. Digite: **"paracetamol"**
3. Selecione: **"Paracetamol 500mg"**
4. Preencha:
   - Lote: `LOT001`
   - Validade: `2026-12-31`
   - Quantidade: `1000`
   - Estoque Mínimo: `100`
5. Clique **"Cadastrar no Estoque"**

✅ **Sucesso!** Medicamento cadastrado em menos de 1 minuto!

---

## 🧪 Testar API Diretamente

### Buscar Medicamentos
```bash
curl "http://localhost:3001/api/saude/farmacia/medicamentos/rename/search?q=paracetamol"
```

### Listar Todos
```bash
curl "http://localhost:3001/api/saude/farmacia/medicamentos/rename/list?page=1&limit=10"
```

---

## 📊 Verificar Dados no Banco

### Via Prisma Studio
```bash
cd backend
npx prisma studio
```

Abra `http://localhost:5555` e navegue até a tabela **`Medicamento`**.

Filtro: `isRename = true`

Você verá os 100+ medicamentos da RENAME!

---

## 🐛 Problemas Comuns

### Erro: "Medicamento RENAME não encontrado"
```bash
# Re-executar seed
cd backend
npm run db:seed:rename
```

### Erro: Port 3001 already in use
```bash
# Parar processo
killall node
# ou no Windows
taskkill /F /IM node.exe
```

### Erro: Cannot find module
```bash
# Reinstalar dependências
npm install
```

---

## 📚 Documentação Completa

Ver: `IMPLEMENTACAO-RENAME-MEDICAMENTOS.md`

---

## ✅ Checklist de Implementação

- [x] Dados da RENAME extraídos e estruturados
- [x] Script de seed criado
- [x] Endpoints de API implementados
- [x] Componente de autocomplete criado
- [x] Página refatorada com modo híbrido
- [x] Tipos TypeScript atualizados
- [x] Documentação completa
- [x] Quick Start Guide

**Status**: 🎉 **100% CONCLUÍDO**

---

## 📞 Suporte

Dúvidas? Consulte `IMPLEMENTACAO-RENAME-MEDICAMENTOS.md` ou contate a equipe de desenvolvimento.
