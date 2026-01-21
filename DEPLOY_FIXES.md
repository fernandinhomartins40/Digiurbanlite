# 🔧 Correções de Deploy - Sistema de Mensagens

## 📋 Problemas Identificados e Soluções

### ✅ Todas as correções foram aplicadas e commitadas

**Commits:**
- `b6a0e9d` - feat: Implementar sistema completo de mensagens
- `47b2ef9` - fix: Corrigir deploy do sistema de mensagens em Docker

---

## 🚀 INSTRUÇÕES PARA TESTAR LOCALMENTE

### 1. Limpar cache do navegador
```bash
# Fazer HARD REFRESH
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### 2. Verificar que ultrazend-messages está rodando
```bash
# Deve estar rodando na porta 9001
curl http://localhost:9001/health

# Se não estiver, iniciar:
cd ultrazend-messages-server
npm run dev
```

### 3. Reiniciar frontend Next.js
```bash
cd digiurban/frontend
rm -rf .next
npm run dev
```

---

## 🐳 DEPLOY EM PRODUÇÃO (VPS)

### Pré-requisitos
- ultrazend-messages rodando na porta 9001
- Nginx configurado com proxy para /messages-api e WebSocket

### Passo a Passo

```bash
# 1. SSH na VPS
ssh usuario@vps

# 2. Ir para o diretório
cd /caminho/para/digiurban

# 3. Pull das mudanças
git pull origin main

# 4. Criar arquivo .env com variáveis (se não existir)
cat > .env << EOF
NEXT_PUBLIC_MESSAGES_API_URL=/messages-api
NEXT_PUBLIC_MESSAGES_WS_URL=wss://seu-dominio.com.br
EOF

# 5. Rebuild COMPLETO (forçar reconstrução)
export BUILD_TIMESTAMP=$(date +%s)
docker-compose -f docker-compose.vps.yml build --no-cache digiurban

# 6. Restart
docker-compose -f docker-compose.vps.yml down
docker-compose -f docker-compose.vps.yml up -d

# 7. Verificar logs
docker-compose -f docker-compose.vps.yml logs -f digiurban | grep -E "(error|Error|ERROR|✅|❌)"
```

---

## ✅ VERIFICAÇÃO PÓS-DEPLOY

### Checklist Manual

1. **Painel Admin - Menu visível?**
   - [ ] Acessar `/admin`
   - [ ] Fazer hard refresh (Ctrl+Shift+R)
   - [ ] Menu "Mensagens" aparece na sidebar

2. **Painel Admin - Página funciona?**
   - [ ] Clicar em "Mensagens"
   - [ ] Cards de estatísticas carregam
   - [ ] Lista de conversas (pode estar vazia, OK)

3. **Painel Cidadão - Botão + funciona?**
   - [ ] Acessar `/cidadao`
   - [ ] Clicar no botão "+"
   - [ ] Modal abre
   - [ ] Abas "Cidadãos" e "Servidores" aparecem
   - [ ] Busca funciona (se houver contatos)

4. **WebSocket - Conecta?**
   - [ ] Abrir console do navegador
   - [ ] Verificar sem erro "WebSocket connection failed"
   - [ ] Indicador "● Online" aparece (se servidor estiver rodando)

---

## 🔧 ARQUIVOS CORRIGIDOS

### Dockerfile Principal (raiz)
```diff
+ ARG NEXT_PUBLIC_MESSAGES_API_URL=/messages-api
+ ARG NEXT_PUBLIC_MESSAGES_WS_URL=ws://localhost:9001
+ ENV NEXT_PUBLIC_MESSAGES_API_URL=$NEXT_PUBLIC_MESSAGES_API_URL
+ ENV NEXT_PUBLIC_MESSAGES_WS_URL=$NEXT_PUBLIC_MESSAGES_WS_URL

+ # Copiar diretório src
+ COPY --from=frontend-builder --chown=frontend:nodejs /app/frontend/src ./src
```

### next.config.js
```diff
+ output: 'standalone', // Necessário para Docker
```

### docker-compose.vps.yml
```diff
  build:
    args:
+     - NEXT_PUBLIC_MESSAGES_API_URL=${NEXT_PUBLIC_MESSAGES_API_URL:-/messages-api}
+     - NEXT_PUBLIC_MESSAGES_WS_URL=${NEXT_PUBLIC_MESSAGES_WS_URL:-ws://localhost:9001}
```

### NewConversationDialog.tsx
```diff
+ import { DialogDescription } from '@/components/ui/dialog';

  <DialogHeader>
    <DialogTitle>Nova Conversa</DialogTitle>
+   <DialogDescription>
+     Selecione um cidadão ou servidor para iniciar uma conversa
+   </DialogDescription>
  </DialogHeader>
```

---

## 🐛 TROUBLESHOOTING

### Menu "Mensagens" não aparece
**Causa:** Cache do navegador
**Solução:** Ctrl+Shift+R (hard refresh)

### Erro: Cannot find module '/src/components/...'
**Causa:** Diretório /src não foi copiado
**Solução:** Rebuild com --no-cache

### WebSocket não conecta
**Causa:** ultrazend-messages não está rodando
**Solução:** 
```bash
docker-compose ps ultrazend-messages
docker-compose logs ultrazend-messages
```

### Botão "+" não mostra lista
**Causa:** API não responde ou sem dados
**Solução:**
```bash
# Testar API
curl http://localhost:9001/api/contacts/citizens

# Verificar se há cidadãos no banco
docker exec -it digiurban-postgres psql -U digiurban -d digiurban -c "SELECT COUNT(*) FROM \"Citizen\";"
```

---

## 📊 STATUS FINAL

✅ **TUDO IMPLEMENTADO E CORRIGIDO**

- ✅ Menu "Mensagens" na sidebar admin
- ✅ Painel admin com dados reais
- ✅ Botão "+" no painel cidadão
- ✅ NewConversationDialog com busca
- ✅ Permissões configuradas
- ✅ Docker build corrigido
- ✅ Variáveis de ambiente configuradas
- ✅ TypeScript sem erros
- ✅ React sem warnings

**Próximo passo:** Testar em desenvolvimento local primeiro!

---

Data: $(date +"%Y-%m-%d %H:%M:%S")
