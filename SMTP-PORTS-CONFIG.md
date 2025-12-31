# Configuração de Portas do Servidor SMTP

## Problema: Porta 25 em Uso

A porta 25 (SMTP padrão) geralmente já está em uso no servidor VPS por serviços como:
- Postfix
- Sendmail
- Exim
- Outros MTAs (Mail Transfer Agents)

## Solução: Portas Alternativas

### Mapeamento de Portas Docker

```yaml
ultrazend-smtp:
  ports:
    - "2525:25"    # MX Server (receber emails)
    - "2587:587"   # Submission Server (enviar emails)
```

### Explicação

**Porta Externa (Host VPS) : Porta Interna (Container)**

- `2525:25` - Requisições externas na porta 2525 são encaminhadas para porta 25 do container
- `2587:587` - Requisições externas na porta 2587 são encaminhadas para porta 587 do container

### Comunicação Interna Entre Containers

O backend DigiUrban se conecta ao SMTP usando **comunicação interna Docker**:

```typescript
// Seed do EmailServer
{
  hostname: 'ultrazend-smtp',  // Nome do container (não IP!)
  submissionPort: 587,          // Porta INTERNA (não 2587!)
  mxPort: 25                    // Porta INTERNA (não 2525!)
}
```

**Importante**: Containers na mesma rede Docker se comunicam usando:
- Nome do serviço como hostname
- Portas internas (não as portas mapeadas)

### Diagrama de Comunicação

```
┌─────────────────────────────────────────────────┐
│ VPS (Host - 72.60.10.108)                       │
│                                                 │
│  Porta 2525 ──┐                                 │
│               │  Docker Network (bridge)        │
│               │  ┌──────────────────────────┐   │
│               └─►│ ultrazend-smtp:25        │   │
│                  │                          │   │
│                  │ Container SMTP           │   │
│  Porta 2587 ──┐  │                          │   │
│               └─►│ ultrazend-smtp:587       │   │
│                  └──────────────────────────┘   │
│                          ▲                       │
│                          │ Comunicação Interna   │
│                          │ (porta 587)           │
│  ┌──────────────────────┴──────────────────┐    │
│  │ digiurban-vps (Backend)                 │    │
│  │                                         │    │
│  │ TransactionalEmailService               │    │
│  │   → ultrazend-smtp:587                  │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## Configuração DNS (Quando Necessário)

Se quiser receber emails REAIS de outros servidores (não apenas emails internos):

### Opção 1: Configurar Reverse Proxy (Recomendado)

```nginx
# /etc/nginx/sites-available/smtp-proxy
stream {
    upstream smtp_mx {
        server localhost:2525;
    }

    upstream smtp_submission {
        server localhost:2587;
    }

    server {
        listen 25;
        proxy_pass smtp_mx;
    }

    server {
        listen 587;
        proxy_pass smtp_submission;
    }
}
```

### Opção 2: Parar Serviço MTA Padrão

⚠️ **CUIDADO**: Isso pode afetar outros serviços!

```bash
# Verificar qual serviço está usando porta 25
sudo netstat -tulpn | grep ':25'

# Parar Postfix (exemplo)
sudo systemctl stop postfix
sudo systemctl disable postfix

# Liberar porta 25 no docker-compose.vps.yml
# Mudar de "2525:25" para "25:25"
```

### Opção 3: Usar Apenas Portas Alternativas (Atual)

✅ **Mais Seguro** - Mantém portas 2525 e 2587

**Limitação**: Não recebe emails externos de outros servidores (que usam porta 25)

**Vantagens**:
- Sem conflito com MTAs existentes
- Sistema de recuperação de senha funciona perfeitamente
- Envio de emails transacionais funcional

## Testando a Configuração

### 1. Teste de Conectividade Interna (Backend → SMTP)

```bash
# Entrar no container do backend
docker exec -it digiurban-vps sh

# Testar conexão SMTP
nc -zv ultrazend-smtp 587
# Deve retornar: ultrazend-smtp (172.x.x.x:587) open
```

### 2. Teste de Envio de Email

```bash
# Via API de recuperação de senha
curl -X POST http://localhost:3060/api/auth/admin/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com"}'
```

### 3. Verificar Logs

```bash
# Logs do SMTP
docker logs ultrazend-smtp

# Logs do Backend
docker logs digiurban-vps
```

## Resumo

| Item | Valor | Uso |
|------|-------|-----|
| **Porta Externa MX** | 2525 | Acesso externo ao servidor (se configurar reverse proxy) |
| **Porta Externa Submission** | 2587 | Acesso externo ao servidor (se configurar reverse proxy) |
| **Porta Interna MX** | 25 | Comunicação entre containers Docker |
| **Porta Interna Submission** | 587 | Comunicação entre containers Docker |
| **Hostname no Seed** | `ultrazend-smtp` | Nome do container Docker |

✅ **Status Atual**: Funcionando com portas alternativas (2525/2587) sem conflitos!
