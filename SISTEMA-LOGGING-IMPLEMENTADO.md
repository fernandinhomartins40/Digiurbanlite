# ✅ Sistema de Logging Profissional Implementado

## 🎯 Problema Identificado

**Você estava certo!** Sempre que investigávamos problemas na VPS, não tínhamos logs para diagnóstico, dificultando correções rápidas.

## 🚀 Solução Implementada

Implementamos um **sistema de logging profissional completo** usando **Winston** (industry standard).

---

## 📦 Arquivos Criados/Modificados

### **Novos Arquivos:**

1. **`backend/src/config/logger.config.ts`**
   - Configuração completa do Winston
   - Logs rotativos diários (7 dias de histórico)
   - Separação por tipo (error, combined, http)
   - Sanitização automática de dados sensíveis
   - Formato JSON estruturado

2. **`backend/src/middleware/request-logger.middleware.ts`**
   - Middleware que captura TODAS as requisições HTTP
   - Registra: método, URL, status, tempo de resposta, IP, user agent, usuário
   - Logs detalhados para erros (status >= 400)

3. **`backend/LOGGING.md`**
   - Documentação completa de como usar o sistema de logs
   - Exemplos de comandos para acessar logs na VPS
   - Guia de troubleshooting

### **Arquivos Modificados:**

4. **`backend/src/index.ts`**
   - Adicionado middleware de logging HTTP
   - Log de inicialização do servidor

5. **`backend/src/middleware/error-handler.ts`**
   - Integrado com Winston para logar erros com contexto completo
   - Stack traces completos salvos em arquivo

6. **`backend/src/routes/admin-chamados.ts`**
   - Adicionado logs estruturados em pontos críticos
   - Log de criação, validação e erros de chamados

7. **`backend/Dockerfile`**
   - Criado diretório `/app/logs` com permissões corretas

8. **`docker-compose.yml`**
   - Adicionado volume `backend_logs` para persistir logs

9. **`backend/package.json`**
   - Instalado: `winston` e `winston-daily-rotate-file`

---

## 📂 Estrutura de Logs

```
backend/logs/
├── error-2025-12-11.log          # Apenas erros (level: error)
├── combined-2025-12-11.log       # Todos os logs
├── http-2025-12-11.log           # Requisições HTTP
├── exceptions-2025-12-11.log     # Exceções não capturadas
└── rejections-2025-12-11.log     # Promises rejeitadas
```

**Características:**
- ✅ Rotação automática diária
- ✅ Máximo 20MB por arquivo
- ✅ Logs mantidos por 7 dias (error/combined) ou 3 dias (http)
- ✅ Formato JSON para parsing fácil
- ✅ Timestamps em todas as entradas
- ✅ Metadados contextuais (userId, IP, departmentId, etc)

---

## 🔍 Como Acessar os Logs na VPS

### **Método Rápido (Recomendado):**

```bash
# SSH no servidor
ssh root@digiurban.com.br

# Acessar volume de logs
cd /var/lib/docker/volumes/digiurban_backend_logs/_data

# Ver erros em tempo real
tail -f error-2025-12-11.log

# Ver requisições HTTP
tail -f http-2025-12-11.log

# Buscar erro específico
grep "Erro ao criar chamado" error-*.log | jq .
```

### **Método Alternativo (Docker Exec):**

```bash
# SSH no servidor
ssh root@digiurban.com.br

# Acessar container
docker exec -it digiurban-vps sh

# Ver logs
cd /app/backend/logs
tail -f error-2025-12-11.log
```

---

## 📊 O Que É Logado Automaticamente

### **1. Requisições HTTP (http-*.log)**
```json
{
  "method": "POST",
  "url": "/api/admin/chamados",
  "statusCode": 201,
  "responseTime": "245ms",
  "ip": "192.168.1.100",
  "userId": "user123",
  "userRole": "ADMIN",
  "timestamp": "2025-12-11T14:30:45.123Z"
}
```

### **2. Erros da Aplicação (error-*.log)**
```json
{
  "level": "error",
  "message": "Application Error",
  "error": {
    "name": "ValidationError",
    "message": "Dados inválidos",
    "stack": "Error: Dados inválidos\n    at createChamado..."
  },
  "request": {
    "method": "POST",
    "url": "/api/admin/chamados",
    "ip": "192.168.1.100",
    "userId": "user123"
  },
  "statusCode": 400,
  "body": { "citizenId": "abc123", "serviceId": "xyz" },
  "timestamp": "2025-12-11T14:30:45.123Z"
}
```

### **3. Eventos Importantes (combined-*.log)**
```json
{
  "level": "info",
  "message": "✅ Chamado administrativo criado com sucesso",
  "ticketId": "ticket123",
  "ticketNumber": "CH-2025-00001",
  "citizenName": "João Silva",
  "serviceName": "Solicitação de Alvará",
  "departmentName": "Obras e Urbanismo",
  "requestedByName": "Maria Admin",
  "priority": 3,
  "status": "PENDING",
  "timestamp": "2025-12-11T14:30:45.123Z"
}
```

---

## 🔒 Segurança (LGPD)

O sistema **sanitiza automaticamente** dados sensíveis:

**Removidos:**
- Senhas (`password`, `oldPassword`, `newPassword`)
- Tokens (`token`, `accessToken`, `authorization`)
- Segredos (`secret`, `apiKey`, `privateKey`)

**Mascarados:**
- Email: `jo***@example.com`
- CPF: `123.***.***-**`
- Telefone: `(11) *****-****`

---

## 🎯 Benefícios

### **Antes (Problema):**
❌ Nenhum log persistido
❌ Impossível investigar erros após o fato
❌ Debugging dependia de reproduzir o erro
❌ Sem rastreabilidade de requisições
❌ Sem contexto sobre falhas

### **Agora (Solução):**
✅ **Logs persistidos** em arquivos rotativos
✅ **Histórico completo** de 7 dias
✅ **Stack traces completos** para debugging
✅ **Rastreabilidade total** (quem fez o quê, quando)
✅ **Contexto rico** (usuário, IP, departamento, etc)
✅ **Busca fácil** com grep/jq
✅ **Monitoramento em tempo real** possível
✅ **Segurança LGPD** com sanitização automática

---

## 📝 Exemplo de Uso no Código

```typescript
import { log } from '../config/logger.config';

// Info: Operação bem-sucedida
log.info('Chamado criado com sucesso', {
  ticketId: ticket.id,
  userId: req.user.id
});

// Warn: Situação anormal
log.warn('Cidadão não encontrado', {
  citizenId: data.citizenId
});

// Error: Erro crítico
log.error('Falha ao criar chamado', {
  error: error.message,
  stack: error.stack
});
```

---

## 🚀 Próximos Passos

### **Para Deploy na VPS:**

1. **Fazer push das mudanças:**
```bash
git add .
git commit -m "feat: Implementa sistema de logging profissional com Winston"
git push
```

2. **Atualizar VPS:**
```bash
ssh root@digiurban.com.br
cd /root/digiurban/digiurban
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

3. **Verificar logs funcionando:**
```bash
# Aguardar 30 segundos para inicialização
sleep 30

# Verificar se logs estão sendo criados
docker exec digiurban-vps ls -la /app/backend/logs

# Ver logs em tempo real
cd /var/lib/docker/volumes/digiurban_backend_logs/_data
tail -f combined-$(date +%Y-%m-%d).log
```

4. **Testar criação de chamado e verificar logs**

---

## 📚 Documentação Completa

Consulte **`backend/LOGGING.md`** para:
- Guia completo de comandos
- Exemplos de busca e filtros
- Scripts de monitoramento
- Troubleshooting
- Alertas automáticos

---

## 🎉 Resultado

**Agora você tem visibilidade completa de tudo que acontece no backend!**

Quando ocorrer um erro:
1. SSH na VPS
2. `cd /var/lib/docker/volumes/digiurban_backend_logs/_data`
3. `tail -f error-2025-12-11.log | jq .`
4. **Ver exatamente o que aconteceu**, com contexto completo!

**Problema resolvido! 🎯**
