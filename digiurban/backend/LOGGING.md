# 📝 Sistema de Logging DigiUrban

## Visão Geral

O DigiUrban usa **Winston** para logging profissional com os seguintes recursos:

✅ **Logs estruturados** em formato JSON
✅ **Persistência em arquivos rotativos** (7 dias de histórico)
✅ **Separação por tipo** (error, combined, http)
✅ **Sanitização automática** de dados sensíveis
✅ **Timestamps** em todas as entradas
✅ **Metadados contextuais** (usuário, IP, requisição)

---

## 📂 Estrutura de Logs

```
logs/
├── error-2025-12-11.log          # Apenas erros (level: error)
├── combined-2025-12-11.log       # Todos os logs (error, warn, info, debug)
├── http-2025-12-11.log           # Requisições HTTP
├── exceptions-2025-12-11.log     # Exceções não capturadas
└── rejections-2025-12-11.log     # Promises rejeitadas
```

**Rotação automática:**
- Logs são rotacionados diariamente
- Máximo 20MB por arquivo
- Mantidos por 7 dias (error/combined) ou 3 dias (http)

---

## 🔍 Como Acessar os Logs

### 1. **Ambiente Local (Desenvolvimento)**

Os logs ficam em `digiurban/backend/logs/`:

```bash
# Ver últimos erros
tail -f digiurban/backend/logs/error-2025-12-11.log

# Ver todas as requisições HTTP
tail -f digiurban/backend/logs/http-2025-12-11.log

# Ver logs combinados
tail -f digiurban/backend/logs/combined-2025-12-11.log

# Buscar erro específico
grep "Erro ao criar chamado" logs/error-*.log

# Ver logs com jq (formato JSON bonito)
tail -f logs/combined-2025-12-11.log | jq .
```

### 2. **Ambiente Docker (Produção VPS)**

#### **Método 1: Acessar logs do volume Docker**

```bash
# SSH no servidor
ssh root@digiurban.com.br

# Listar volumes
docker volume ls | grep backend_logs

# Inspecionar volume para encontrar caminho
docker volume inspect digiurban_backend_logs

# Acessar logs diretamente
cd /var/lib/docker/volumes/digiurban_backend_logs/_data

# Ver logs em tempo real
tail -f error-2025-12-11.log
tail -f http-2025-12-11.log
tail -f combined-2025-12-11.log
```

#### **Método 2: Usar docker exec**

```bash
# SSH no servidor
ssh root@digiurban.com.br

# Acessar container
docker exec -it digiurban-vps sh

# Navegar para logs
cd /app/backend/logs

# Ver logs
tail -f error-2025-12-11.log
tail -f http-2025-12-11.log

# Sair do container
exit
```

#### **Método 3: Copiar logs do container**

```bash
# SSH no servidor
ssh root@digiurban.com.br

# Copiar logs para o host
docker cp digiurban-vps:/app/backend/logs ./logs-backup

# Download via SCP
scp -r root@digiurban.com.br:~/logs-backup ./local-logs
```

---

## 📊 Níveis de Log

| Nível | Uso | Arquivo |
|-------|-----|---------|
| `error` | Erros críticos, exceções | error-*.log |
| `warn` | Avisos, problemas não críticos | combined-*.log |
| `info` | Informações gerais, sucesso | combined-*.log |
| `debug` | Debugging detalhado | combined-*.log |
| `http` | Requisições HTTP | http-*.log |

**Configuração do nível:** Variável `LOG_LEVEL` (padrão: `info`)

```env
LOG_LEVEL=debug    # Desenvolvimento
LOG_LEVEL=info     # Produção
LOG_LEVEL=warn     # Produção silenciosa
```

---

## 🔎 Exemplos de Busca

### **1. Encontrar erro específico**

```bash
# Buscar por erro 500
grep '"statusCode":500' logs/error-*.log | jq .

# Buscar erros de um usuário específico
grep '"userId":"abc123"' logs/error-*.log | jq .

# Buscar erros em uma rota específica
grep '/api/admin/chamados' logs/error-*.log | jq .
```

### **2. Analisar requisições HTTP**

```bash
# Ver todas as requisições com erro (status >= 400)
grep '"statusCode":4' logs/http-*.log | jq .
grep '"statusCode":5' logs/http-*.log | jq .

# Ver requisições lentas (> 1000ms)
grep -E '"responseTime":"[0-9]{4,}ms"' logs/http-*.log | jq .

# Ver requisições de um IP específico
grep '"ip":"192.168.1.1"' logs/http-*.log | jq .
```

### **3. Monitorar em tempo real**

```bash
# Monitorar erros em tempo real
tail -f logs/error-*.log | jq .

# Monitorar HTTP com filtro
tail -f logs/http-*.log | grep 'POST' | jq .

# Monitorar múltiplos arquivos
tail -f logs/*.log
```

---

## 🛠️ Como Usar no Código

### **Importar o logger**

```typescript
import { log } from '../config/logger.config';
```

### **Usar nos controllers/rotas**

```typescript
// Info: Operação bem-sucedida
log.info('Chamado criado com sucesso', {
  ticketId: ticket.id,
  userId: req.user.id,
  departmentId: ticket.departmentId
});

// Warn: Situação anormal mas não crítica
log.warn('Cidadão não encontrado', {
  citizenId: data.citizenId,
  userId: req.user.id
});

// Error: Erro crítico
log.error('Falha ao criar chamado', {
  error: error.message,
  stack: error.stack,
  userId: req.user.id
});

// Debug: Informação detalhada
log.debug('Validação passou', { data });
```

### **Logging de requisições HTTP (automático)**

O middleware `requestLoggerMiddleware` já loga automaticamente:
- Método, URL, status code
- Tempo de resposta
- IP do cliente
- User Agent
- Usuário autenticado (se houver)

**Não é necessário logar requisições manualmente!**

---

## 🔒 Segurança e LGPD

O sistema **sanitiza automaticamente** dados sensíveis:

**Campos removidos:**
- `password`, `oldPassword`, `newPassword`
- `token`, `accessToken`, `refreshToken`
- `authorization`, `secret`, `apiKey`

**Campos mascarados:**
- Email: `jo***@example.com`
- CPF: `123.***.***-**`
- Telefone: `(11) *****-****`

---

## 📈 Monitoramento de Produção

### **Script de monitoramento contínuo**

Criar `monitor-logs.sh` no servidor:

```bash
#!/bin/bash
# Script para monitorar logs em produção

LOG_DIR="/var/lib/docker/volumes/digiurban_backend_logs/_data"

echo "🔍 Monitorando logs DigiUrban..."
echo "📂 Diretório: $LOG_DIR"
echo ""

# Contador de erros nos últimos 5 minutos
echo "🔥 Erros recentes (últimos 5min):"
find $LOG_DIR -name "error-*.log" -mmin -5 -exec tail -100 {} \; | wc -l

# Últimos 10 erros
echo ""
echo "📋 Últimos 10 erros:"
tail -10 $LOG_DIR/error-$(date +%Y-%m-%d).log | jq -r '.message'

# Requisições com erro (status >= 400)
echo ""
echo "⚠️  Requisições com erro (últimos 10):"
grep -E '"statusCode":(4|5)[0-9]{2}' $LOG_DIR/http-$(date +%Y-%m-%d).log | tail -10 | jq -r '"\(.timestamp) - \(.method) \(.url) - \(.statusCode)"'
```

### **Alertas automáticos**

Configurar cronjob para alertas:

```bash
# Verificar logs a cada 5 minutos
*/5 * * * * /root/scripts/check-errors.sh
```

---

## 🚀 Comandos Úteis para VPS

### **Verificar tamanho dos logs**

```bash
du -sh /var/lib/docker/volumes/digiurban_backend_logs/_data
```

### **Limpar logs antigos manualmente**

```bash
# Remover logs com mais de 7 dias
find /var/lib/docker/volumes/digiurban_backend_logs/_data -name "*.log" -mtime +7 -delete
```

### **Backup de logs**

```bash
# Criar backup compactado
tar -czf logs-backup-$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/digiurban_backend_logs/_data

# Download do backup
scp root@digiurban.com.br:~/logs-backup-*.tar.gz ./
```

---

## 📝 Exemplo de Log

### **Log de Erro (error-2025-12-11.log)**

```json
{
  "level": "error",
  "message": "Application Error",
  "error": {
    "name": "ValidationError",
    "message": "Dados inválidos",
    "stack": "Error: Dados inválidos\n    at createChamado (/app/routes/admin-chamados.ts:172)"
  },
  "request": {
    "method": "POST",
    "url": "/api/admin/chamados",
    "ip": "192.168.1.100",
    "userId": "user123"
  },
  "timestamp": "2025-12-11T14:30:45.123Z"
}
```

### **Log HTTP (http-2025-12-11.log)**

```json
{
  "level": "info",
  "message": "HTTP Success",
  "method": "POST",
  "url": "/api/admin/chamados",
  "statusCode": 201,
  "responseTime": "245ms",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "userId": "user123",
  "userRole": "ADMIN",
  "timestamp": "2025-12-11T14:30:45.123Z"
}
```

---

## 🎯 Troubleshooting

### **Problema: Logs não estão sendo criados**

**Solução:**
```bash
# Verificar permissões
docker exec digiurban-vps ls -la /app/backend/logs

# Criar diretório se não existir
docker exec digiurban-vps mkdir -p /app/backend/logs

# Verificar variável de ambiente
docker exec digiurban-vps printenv LOG_LEVEL
```

### **Problema: Disco cheio**

**Solução:**
```bash
# Verificar uso de disco
df -h

# Verificar tamanho dos logs
du -sh /var/lib/docker/volumes/digiurban_backend_logs/_data

# Limpar logs antigos
find /var/lib/docker/volumes/digiurban_backend_logs/_data -name "*.log" -mtime +3 -delete
```

---

## 📚 Referências

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Winston Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
- [Best Practices for Logging](https://www.loggly.com/ultimate-guide/node-logging-basics/)

---

**🎉 Agora você tem logs profissionais para investigar qualquer problema!**
