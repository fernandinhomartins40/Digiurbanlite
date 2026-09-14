# Procedimento de deploy — DigiUrban em VPS

**ETAPA 7 do plano de otimização.** Procedimento reproduzível para implantar em VPS limpa,
**considerando que outras aplicações rodam no mesmo Docker Host**.

Referências: `docs/AUDITORIA-OTIMIZACAO-VPS.md`, `docs/PLANO-OTIMIZACAO-VPS.md`,
`docs/PADRAO-VPS-MULTI-APPS.md`.

---

## 1. Pré-requisitos

| Requisito | Versão | Verificar |
|---|---|---|
| Docker Engine | ≥ 24 | `docker --version` |
| Docker Compose | v2 (`docker compose`) | `docker compose version` |
| Git | qualquer | `git --version` |
| Portas livres no host | 3060, 9001, 9006, 25, 587 | `ss -ltnp \| grep -E ':(3060\|9001\|9006\|25\|587)'` |
| Disco livre | ≥ 10 GB | `df -h /` |
| RAM livre | ≥ 3 GB | `free -m` |

> ⚠️ **Portas 25/587 são exclusivas do host.** Se outra aplicação já usa SMTP, há conflito —
> resolva antes.

### Rotação global de log (uma vez por VPS, beneficia todas as apps)

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3", "compress": "true" } }
EOF
sudo systemctl restart docker
```

---

## 2. Instalação inicial

```bash
sudo mkdir -p /opt/digiurban && cd /opt/digiurban
git clone https://github.com/fernandinhomartins40/Digiurbanlite.git .
```

### Variáveis de ambiente

O `.env` é **gerado** por `scripts/vps-deploy-lib.sh` (`write_vps_env_file`) a cada deploy, que
**preserva** do arquivo anterior: `DATABASE_URL`, `MIGRATE_DATABASE_URL`, `JWT_SECRET`, os
service tokens e as flags `TENANT_*`. Demais valores são reescritos.

> ⚠️ Ajuste manual em variável **não preservada** é perdido no próximo deploy. Para tornar algo
> permanente, edite o gerador.

Mínimo para subir:

```bash
cat > /opt/digiurban/.env <<'EOF'
DATABASE_URL=postgresql://digiurban:TROQUE_ESTA_SENHA@postgres:5432/digiurban
POSTGRES_USER=digiurban
POSTGRES_PASSWORD=TROQUE_ESTA_SENHA
POSTGRES_DB=digiurban
JWT_SECRET=<openssl rand -hex 32>
MESSAGES_SERVICE_TOKEN=<openssl rand -hex 32>
AI_SERVICE_TOKEN=<openssl rand -hex 32>
EOF
chmod 600 /opt/digiurban/.env
```

🔴 **Troque `JWT_SECRET` e `POSTGRES_PASSWORD`.** O compose tem defaults
(`digiurban-super-secret-change-in-production`, `digiurban2024`) que servem só para não quebrar
o boot — **nunca** use em produção.

### Variáveis opcionais

| Variável | Efeito se ausente |
|---|---|
| `AI_API_URL` | `/api/ai` responde **503 imediato** (IA indisponível, sem timeout) |
| `CITIZEN_AI_COMPLETIONS_URL` | Bot usa fluxo determinístico, sem IA |
| `PRICES_API_URL` | `/api/prices` responde 503 |
| `FLOW_API_URL` | `/api/flow` responde 503 |
| `MIGRATE_DATABASE_URL` | Migrations usam a `DATABASE_URL` normal |

---

## 3. Arquitetura implantada

| Container | Porta host | Limites | Função |
|---|---|---|---|
| `digiurban-vps` | 3060→80 | 1g / 2.0 cpu / 512 pids | nginx + backend + frontend |
| `ultrazend-messages` | 9001 | 384m / 1.0 cpu / 256 pids | WebSocket + bot |
| `ultrazend-smtp` | 25, 587 | 384m / 0.5 cpu / 128 pids | MX + submission |
| `ultrazend-face` | 9006 | 384m / 1.0 cpu / 256 pids | Biometria |
| `digiurban-postgres` | — (interna) | 512m / 1.0 cpu / 256 pids | Banco |
| `digiurban-redis` | — (interna) | 192m / 0.5 cpu / 128 pids | Filas + adapter WS |

**Teto de RAM: ~2.6 GB.** Rede própria `digiurban_network` (bridge), isolada das outras apps.

### Volumes (11)

`postgres_data` `redis_data` `digiurban_uploads` `digiurban_logs` `digiurban_backups`
`smtp_data` `smtp_logs` `messages_uploads` `messages_logs` `face_uploads` `face_logs`

🔴 **Dados de produção:** `postgres_data`, `digiurban_uploads`, `messages_uploads`, `face_uploads`.
Nunca remover.

---

## 4. Deploy

### Automático (recomendado)

`push` na `main` → `.github/workflows/build-images.yml`:
1. 4 imagens construídas **em paralelo** em runners GitHub-hosted, com cache no GHCR;
2. VPS (runner self-hosted) faz `pull` e sobe. **A VPS nunca compila.**

### Manual

```bash
cd /opt/digiurban
git fetch --prune origin main && git reset --hard origin/main
echo "<TOKEN_GHCR>" | docker login ghcr.io -u <USUARIO> --password-stdin

docker compose -f docker-compose.vps.yml config >/dev/null || { echo "compose inválido"; exit 1; }

RELEASE=<sha> docker compose -f docker-compose.vps.yml pull
RELEASE=<sha> docker compose -f docker-compose.vps.yml up -d --remove-orphans
docker image prune -f
```

> **Sempre valide o compose antes de subir.** Um `driver:` órfão deixou este projeto sem deploy
> por um commit inteiro.

### Verificação

```bash
docker compose -f docker-compose.vps.yml ps         # todos "healthy"
curl -fsS http://localhost:3060/health              # aplicação
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3060/api/super-admin/tenants  # deve ser 410
```

O primeiro boot roda migrations e seed via `docker/startup.sh` — pode levar **2–3 min**.

---

## 5. Atualização

Igual ao deploy: `pull` + `up -d --remove-orphans`. Idempotente — não acumula lixo.

- `RELEASE=` é limpo antes de reescrito (nunca acumula linhas);
- `--remove-orphans` derruba serviços retirados do compose;
- `image prune -f` remove só dangling, **sem tocar nas outras aplicações**.

---

## 6. Rollback

```bash
cd /opt/digiurban
docker images --filter reference='ghcr.io/*/digiurban-app' --format '{{.Tag}}' | head -10
RELEASE=<sha-anterior> docker compose -f docker-compose.vps.yml up -d
curl -fsS http://localhost:3060/health
```

⚠️ **Rollback reverte código, não banco.** Se a versão aplicou migration destrutiva, o rollback
do código não a desfaz. Antes de deploy com migration de risco:

```bash
docker exec digiurban-postgres pg_dump -U digiurban digiurban | gzip > /opt/backups/pre-deploy-$(date +%F-%H%M).sql.gz
```

---

## 7. Limpeza segura

🔴 **Nunca** `docker system prune -a` nem `docker volume prune` nesta VPS — atingem todas as apps.

```bash
docker image prune -f                              # dangling; seguro
docker builder prune -f --filter until=168h        # cache >7d; seguro
docker volume ls -qf dangling=true                 # LISTA (não remove)
docker volume rm <nome-exato>                      # um a um, conferindo
```

Trimestral: confira órfãos e `docker system df`.

---

## 8. Diagnóstico

```bash
docker compose -f docker-compose.vps.yml ps
docker stats --no-stream
docker logs digiurban-vps --tail=100
docker exec digiurban-vps supervisorctl status     # backend/frontend/nginx
docker system df && df -h /
top -bn1 | head -3                                 # coluna 'st' = steal time
```

| Sintoma | Verificação |
|---|---|
| Container reinicia | `docker inspect <c> --format '{{.State.OOMKilled}}'` |
| "too many clients" | `docker exec digiurban-postgres psql -U digiurban -c "SELECT count(*) FROM pg_stat_activity"` |
| `/api/ai` retorna 503 | Esperado sem `AI_API_URL` |
| Lentidão geral, app parada | `top` → `st` alto = provedor, não a aplicação |
| Compose recusa subir | `docker compose config` |

---

## 9. Primeiro deploy após esta otimização

⚠️ **Esta aplicação não tem suíte de testes automatizados** (ver ETAPA 4). O primeiro deploy é o
primeiro teste funcional real.

- [ ] Backup do banco **antes**
- [ ] `docker compose config` valida
- [ ] Acompanhar `docker logs -f` dos 6 containers nos primeiros 5 min
- [ ] Verificar OOM: `docker inspect <c> --format '{{.State.OOMKilled}}'` — os limites de CPU/PIDs
      e o tuning do Postgres **nunca rodaram em produção**
- [ ] Confirmar que `ultrazend-smtp` para de reiniciar (estava em crash-loop, 261 restarts)
- [ ] `/health` responde 200
- [ ] Login admin e login cidadão funcionam
- [ ] Abrir um protocolo com formulário customizado (exercita o fix C2)
- [ ] Gerar um PDF (exercita Playwright/Chromium sob o novo `pids_limit`)
- [ ] Rollback pronto: anotar o SHA anterior **antes** de começar

Se algo falhar: `RELEASE=<sha-anterior> docker compose up -d`.
