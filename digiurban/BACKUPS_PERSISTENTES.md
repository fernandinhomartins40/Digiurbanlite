# Sistema de Backups Persistentes - DigiUrban

## Problema Resolvido

Anteriormente, os backups do sistema eram armazenados em `/tmp/digiurban-backups`, um diretório temporário que:
- Era apagado automaticamente quando o container Docker era reiniciado
- Não persistia entre novos deploys
- Causava perda de todos os backups salvos

## Solução Implementada

### 1. Volume Docker Persistente

Criado volume dedicado para backups no [docker-compose.yml](docker-compose.yml):

```yaml
volumes:
  backend_backups:
    driver: local
```

### 2. Montagem do Volume

O volume é montado no container backend:

```yaml
backend:
  volumes:
    - backend_backups:/app/backups
  environment:
    - BACKUPS_DIR=/app/backups
```

### 3. Diretório com Permissões no Dockerfile

O [backend/Dockerfile](backend/Dockerfile) cria o diretório com permissões corretas:

```dockerfile
RUN mkdir -p /app/backups
RUN chown backend:nodejs /app/backups
```

### 4. Backend Atualizado

Todas as rotas de backup em [backend/src/routes/super-admin.ts](backend/src/routes/super-admin.ts) agora usam:

```typescript
const backupDir = process.env.BACKUPS_DIR || '/app/backups';
```

## Funcionalidades

### Rotas de Backup

- **POST** `/api/super-admin/system/backup` - Criar novo backup
- **GET** `/api/super-admin/system/backups` - Listar backups disponíveis
- **GET** `/api/super-admin/system/backup/:fileName` - Download de backup específico
- **DELETE** `/api/super-admin/system/backup/:fileName` - Deletar backup
- **POST** `/api/super-admin/system/backup/:fileName/restore` - Restaurar backup

### Interface Web

A página [/super-admin/operations](frontend/app/super-admin/operations/page.tsx) permite:

- Criar backups com um clique
- Visualizar lista de backups com tamanho e data
- Baixar backups para armazenamento externo
- Restaurar backups anteriores
- Deletar backups antigos

## Persistência Garantida

✅ **Backups são mantidos entre:**
- Restart do container Docker
- Rebuild da imagem Docker
- Novos deploys da aplicação
- Atualizações do código

❌ **Backups são perdidos apenas se:**
- O volume Docker for explicitamente deletado com `docker volume rm backend_backups`
- O servidor físico/VM sofrer falha catastrófica sem backup externo

## Comandos Úteis

### Visualizar volumes Docker
```bash
docker volume ls
```

### Inspecionar volume de backups
```bash
docker volume inspect digiurban_backend_backups
```

### Backup manual do volume (recomendado)
```bash
docker run --rm -v digiurban_backend_backups:/backups -v $(pwd):/backup ubuntu tar czf /backup/backups-$(date +%Y%m%d).tar.gz /backups
```

### Restaurar volume a partir de arquivo
```bash
docker run --rm -v digiurban_backend_backups:/backups -v $(pwd):/backup ubuntu tar xzf /backup/backups-YYYYMMDD.tar.gz -C /
```

## Recomendações de Segurança

1. **Backup Externo Regular**
   - Faça download dos backups críticos através da interface web
   - Armazene em cloud storage (S3, Google Cloud Storage, etc)
   - Mantenha cópias em diferentes locais físicos

2. **Rotação de Backups**
   - Mantenha apenas os últimos 30 dias de backups no servidor
   - Archive backups antigos em storage externo

3. **Testes de Restauração**
   - Teste periodicamente a restauração de backups
   - Valide a integridade dos dados restaurados

4. **Monitoramento**
   - Configure alertas se o espaço em disco estiver baixo
   - Monitore o tamanho do volume de backups

## Formato dos Backups

Os backups são salvos em formato JSON com a estrutura:

```json
{
  "metadata": {
    "timestamp": "2025-01-04T12:00:00.000Z",
    "version": "1.0",
    "database": "postgres"
  },
  "data": {
    "municipioConfig": [...],
    "user": [...],
    "citizen": [...],
    "department": [...],
    "protocolSimplified": [...],
    "service": [...],
    ...
  }
}
```

## Próximos Passos (Opcional)

- [ ] Implementar backup automático agendado (cron job)
- [ ] Compressão de backups com gzip
- [ ] Upload automático para S3/cloud storage
- [ ] Criptografia de backups sensíveis
- [ ] Notificações por email quando backup é criado
- [ ] Retenção automática (deletar backups > 30 dias)
