# 🚀 Deploy do Sistema de Documentos Unificado

## 📋 Resumo das Mudanças

Este deploy integra o **novo sistema de documentos** (`protocol_documents`) com o fluxo de criação de protocolos, substituindo o formato antigo de `attachments` no JSON.

### ✅ O que foi implementado:

1. **Retrocompatibilidade**: Sistema lê tanto da tabela nova quanto do campo antigo
2. **Mapeamento melhorado**: Upload de documentos agora mapeia corretamente por `documentId`
3. **Criação automática**: Documentos PENDING/UPLOADED criados automaticamente
4. **Script de migração**: Converte dados antigos para novo formato

---

## 🔧 Arquivos Modificados

### Backend

1. **`src/routes/citizen-protocols.ts`**
   - ✅ Melhorado mapeamento de `documentId` no upload
   - ✅ Melhorado lógica de `createPendingDocumentsForProtocol`
   - ✅ Mais logs para debug

2. **`src/services/protocol-document.service.ts`**
   - ✅ Função `getProtocolDocuments` com retrocompatibilidade
   - ✅ Lê de `protocol_documents` primeiro
   - ✅ Fallback para `attachments`/`documents` antigos

3. **`src/scripts/migrate-attachments-to-documents.ts`** (NOVO)
   - ✅ Script de migração de dados antigos

---

## 📦 Checklist de Deploy

### 1️⃣ **Deploy do Backend**

```bash
# Na VPS, no diretório do projeto
cd /root/digiurban

# Fazer backup do banco antes
docker exec digiurban-postgres pg_dump -U digiurban digiurban > backup-before-docs-$(date +%Y%m%d-%H%M%S).sql

# Pull das mudanças
git pull origin main

# Rebuild e restart
docker-compose -f docker-compose.vps.yml down
docker-compose -f docker-compose.vps.yml up -d --build

# Verificar logs
docker-compose -f docker-compose.vps.yml logs -f backend
```

### 2️⃣ **Executar Migração de Dados**

```bash
# Entrar no container do backend
docker exec -it digiurban-backend bash

# Executar script de migração
npx ts-node src/scripts/migrate-attachments-to-documents.ts

# Verificar resultado
# Deve mostrar quantos documentos foram migrados
```

### 3️⃣ **Verificação**

```bash
# Verificar documentos migrados
docker exec digiurban-postgres psql -U digiurban -d digiurban -c \
  "SELECT COUNT(*) FROM protocol_documents;"

# Verificar protocolos com documentos
docker exec digiurban-postgres psql -U digiurban -d digiurban -c \
  "SELECT p.number, COUNT(pd.id) as docs
   FROM protocols_simplified p
   LEFT JOIN protocol_documents pd ON p.id = pd.\"protocolId\"
   GROUP BY p.number
   ORDER BY p.\"createdAt\" DESC
   LIMIT 10;"
```

---

## 🧪 Testes Após Deploy

### 1. **Teste de Upload de Novo Protocolo**

1. Acessar portal do cidadão
2. Criar novo protocolo com upload de documento
3. Verificar se documento aparece na aba "Documentos" do admin
4. Logs devem mostrar:
   ```
   ✓ Mapeado: cpf → arquivo.jpg
   ✓ Documento UPLOADED: cpf
   ✓ 1 documento(s) criado(s) para protocolo
   ```

### 2. **Teste de Retrocompatibilidade**

1. Acessar protocolo antigo com documentos (ex: 2025-000006)
2. Verificar se documentos aparecem na aba "Documentos"
3. Deve mostrar documentos do formato antigo

### 3. **Teste de Download**

1. Clicar em "Baixar" em um documento
2. Arquivo deve fazer download corretamente
3. URL deve estar acessível

---

## 🔄 Rollback (se necessário)

Se algo der errado, reverter com:

```bash
# Restaurar backup
docker exec -i digiurban-postgres psql -U digiurban digiurban < backup-before-docs-XXXXXX.sql

# Voltar para versão anterior do código
git reset --hard HEAD~1

# Rebuild
docker-compose -f docker-compose.vps.yml down
docker-compose -f docker-compose.vps.yml up -d --build
```

---

## 📊 Monitoramento

### Logs importantes:

```bash
# Ver logs de criação de protocolos
docker-compose -f docker-compose.vps.yml logs -f backend | grep "POST /api/citizen/protocols"

# Ver logs de documentos
docker-compose -f docker-compose.vps.yml logs -f backend | grep "documento"

# Ver erros
docker-compose -f docker-compose.vps.yml logs -f backend | grep "ERROR\|Erro"
```

---

## ✅ Critérios de Sucesso

- [ ] Backend inicia sem erros
- [ ] Script de migração roda com sucesso
- [ ] Protocolos antigos mostram documentos
- [ ] Novos protocolos criam documentos em `protocol_documents`
- [ ] Download de documentos funciona
- [ ] Aba "Documentos" no admin mostra arquivos

---

## 🆘 Troubleshooting

### Problema: Documentos não aparecem na aba

**Solução:**
```bash
# Verificar se tabela existe
docker exec digiurban-postgres psql -U digiurban -d digiurban -c "\dt protocol_documents"

# Verificar dados
docker exec digiurban-postgres psql -U digiurban -d digiurban -c \
  "SELECT * FROM protocol_documents LIMIT 5;"
```

### Problema: Erro ao criar protocolo

**Solução:**
```bash
# Ver logs detalhados
docker-compose -f docker-compose.vps.yml logs -f backend --tail=100

# Verificar permissões de upload
ls -la /root/digiurban/digiurban/backend/uploads/documents/
```

### Problema: Download não funciona

**Solução:**
- Verificar se `fileUrl` está correto na tabela
- Verificar se arquivo existe no disco
- Verificar nginx/configuração de arquivos estáticos

---

## 📝 Notas

- ✅ Sistema mantém **compatibilidade total** com dados antigos
- ✅ Novos uploads usam **tabela dedicada**
- ✅ Migração é **segura** (não deleta dados antigos)
- ✅ Pode rodar **múltiplas vezes** sem duplicar

---

## 🎯 Próximos Passos (Futuro)

1. Adicionar aprovação/rejeição de documentos pelo admin
2. Notificações quando documento for rejeitado
3. Versionamento de documentos
4. Expiração de documentos
5. Upload de múltiplos arquivos por tipo

---

**Data de criação:** 2025-12-05
**Autor:** Claude Code
**Status:** Pronto para deploy
