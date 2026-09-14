# Padrão VPS Multi-Apps

**Padrão oficial para novas aplicações Docker em VPS compartilhada.**
Derivado do projeto-piloto DigiUrban (2026-09-14) — cada regra abaixo veio de um problema real
medido, não de teoria. A origem está citada em cada uma.

**Alvo:** VPS ~4 vCPU, RAM limitada, disco limitado, **10–30 aplicações independentes** no mesmo
Docker Host.

---

## As 10 regras, em ordem de importância

| # | Regra | Custa | Evita |
|---|---|---|---|
| 1 | Todo container com `mem_limit`, `cpus` e `pids_limit` | 5 min | Uma app derrubar a VPS inteira |
| 2 | Todo serviço Node com `--max-old-space-size` ≈ 66% do `mem_limit` | 2 min | OOM em vez de GC |
| 3 | Banco com limite **e** tuning coerente com esse limite | 10 min | OOM killer no banco sob carga |
| 4 | `logging: json-file, max-size 10m, max-file 3` em todo serviço | 2 min | Log encher o disco |
| 5 | Build **fora** da VPS (CI + registry), VPS só faz `pull` | 1 h | Deploy competindo por CPU com produção |
| 6 | Limpeza **específica**: `image prune -f`, nunca `system prune -a` | 1 min | Apagar imagens de outras apps |
| 7 | `.dockerignore` desde o primeiro commit | 5 min | Contexto inchado a cada build |
| 8 | Tag por SHA + `latest` — rollback é trocar uma variável | 10 min | Rollback impossível |
| 9 | Observabilidade = `docker stats` + cron + CSV | 15 min | Stack pesando mais que a app |
| 10 | Remover serviço tem checklist (§9) | 20 min | Config morta com custo e sem benefício |

---

## 1. Estrutura mínima de uma aplicação nova

```
minha-app/
├── .dockerignore          ← desde o PRIMEIRO commit (regra 7)
├── Dockerfile             ← UM só. Nunca dois. (§8)
├── docker-compose.yml     ← UM só, com limites (regra 1)
├── .env.example           ← nomes das variáveis, nunca valores reais
├── scripts/
│   ├── deploy-lib.sh      ← helpers idempotentes
│   └── metrics.sh         ← regra 9
└── docs/
    └── DEPLOY.md          ← procedimento reproduzível (§7)
```

**Regra dos arquivos únicos.** No piloto havia **3** arquivos de orquestração e **2** Dockerfiles;
só um de cada estava em uso. O risco não é o disco — é alguém editar o arquivo errado e concluir
que "o build ignora a mudança". Um `Dockerfile`, um `docker-compose.yml`. Variação de ambiente é
`profiles:` ou override, nunca cópia.

---

## 2. Dockerfile

### Esqueleto obrigatório

```dockerfile
# ---------- builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                         # ci, não install: respeita o lock
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init   # PID 1 que repassa sinais
COPY package*.json ./
RUN npm ci --omit=dev              # ⚠️ ver a armadilha abaixo
COPY --from=builder /app/dist ./dist
USER node                          # NUNCA root
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1))"
ENTRYPOINT ["dumb-init","--"]
CMD ["node","dist/index.js"]
```

### Regras

1. **Multi-stage sempre.** Compilador e toolchain não vão para o runtime.
2. **Base slim/alpine** — exceto quando uma dependência exigir glibc. No piloto, o Debian foi
   escolhido **porque o Playwright/Chromium exige**; trocar por Alpine quebraria a geração de PDF.
   *Escolha a base pela dependência mais exigente, não pelo tamanho.*
3. **`npm ci`, não `npm install`.**
4. **Usuário não-root** (`USER node`).
5. **`HEALTHCHECK` sempre** — todo padrão de deploy sem downtime depende dele.
6. **Nada de trabalho de build no `ENTRYPOINT`.** `prisma generate` no boot é build feito em
   produção, gastando CPU a cada restart (piloto, item M3).

### ⚠️ A armadilha do `--omit=dev`

`--omit=dev` é a recomendação padrão, **mas verifique antes** se o deploy invoca alguma
devDependency dentro do container. No piloto, os seeds rodam via `tsx` (devDependency) **no job de
deploy** — `--omit=dev` quebraria tudo.

**Regra:** antes de podar devDeps, `grep` por `tsx|ts-node|prisma|jest` nos scripts de deploy,
entrypoints e no `package.json`.

### ⚠️ CLI pesado como dependência de produção

**MEDIDO no piloto:** a imagem do messages tem **1.03 GB**, dos quais ~208 MB são Prisma:

| Pacote | Tamanho | Necessário em runtime? |
|---|---|---|
| `@prisma/client` | 74 MB | ✅ |
| `@prisma/engines` | 36 MB | ✅ |
| `.prisma` (gerado) | 46 MB | ✅ |
| `prisma` (CLI) | 51 MB | **só se o entrypoint rodar `migrate deploy`** |
| `effect` | 34 MB | ❌ transitiva **apenas** do CLI |

Dos 4 serviços do piloto, 2 invocam o CLI em runtime (migrations) e 2 não — nesses, 85 MB é peso
morto. **Regra:** CLI em `dependencies` só se o container o executar. Caso contrário,
`devDependencies`.

---

## 3. docker-compose.yml

```yaml
services:
  app:
    image: ghcr.io/org/minha-app:${RELEASE:-latest}   # regra 8
    container_name: minha-app
    restart: unless-stopped

    # regra 1 — os três, sempre
    mem_limit: 512m
    cpus: 1.0
    pids_limit: 256

    # regra 4
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "3" }

    environment:
      - NODE_ENV=production
      - NODE_OPTIONS=--max-old-space-size=340   # regra 2: ~66% de 512m
      - DATABASE_URL=${DATABASE_URL}

    healthcheck:
      test: ["CMD","node","-e","require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    labels:
      - "app=minha-app"        # regra 6 — permite limpeza por escopo

    networks: [minha_app_net]

networks:
  minha_app_net:
    driver: bridge            # rede PRÓPRIA, nunca a default compartilhada
```

### Como dimensionar (não chute)

1. Suba **sem limite**, exercite a app.
2. `docker stats --no-stream` no **pico**, não em idle.
3. `mem_limit` = **2–3× o pico**. `cpus` = teto generoso, não a média.
4. `--max-old-space-size` = **66% do `mem_limit`**.

> A soma dos `cpus` **pode** exceder os vCPU do host. `cpus` é teto, não reserva — particionar
> 4 vCPU entre 6 serviços ociosos desperdiça mais do que protege.

### Portas: publique o mínimo

Só publique no host o que o mundo precisa alcançar. Serviço que só conversa com outro container
usa `expose`. No piloto o Redis publicava `6379` sem necessidade — superfície de ataque grátis
numa VPS compartilhada.

---

## 4. Banco de dados

**Regra 3, aprendida no piloto:** limitar memória de banco **sem ajustar a configuração dele** é
pior do que não limitar. Se `shared_buffers + work_mem × max_connections` passar do `mem_limit`,
o OOM killer derruba o banco sob carga — exatamente quando ele é mais necessário.

Para `mem_limit: 512m`:

```yaml
postgres:
  image: postgres:15-alpine
  mem_limit: 512m
  cpus: 1.0
  pids_limit: 256
  command: >
    postgres
    -c shared_buffers=128MB          # 25% do limite
    -c effective_cache_size=256MB    # 50% do limite
    -c work_mem=4MB
    -c maintenance_work_mem=32MB
    -c max_connections=50            # conexão = processo: mantenha baixo
  expose: ["5432"]                   # NUNCA publicar no host
```

### Pool de conexões da aplicação

Um pool por processo, não por módulo. **No piloto, 21 arquivos faziam `new PrismaClient()`**, cada
um com pool próprio, esgotando `max_connections=100` e derrubando serviços com
`too many clients already`.

**Regra:** um singleton exportado, importado por todo o resto. E `?connection_limit=N` explícito
na URL — sem isso o default é derivado de CPU e imprevisível.

**Pior variante, também vista no piloto:** `new PrismaClient()` **dentro de um middleware**, ou
seja, um pool novo **por requisição**, nunca desconectado. Procure por `new .*Client()` dentro de
funções de request.

### Uma instância por app ou compartilhada?

O piloto tem **17 PostgreSQL** na mesma VPS — maior consumo de RAM da máquina. Consolidar seria o
maior ganho possível, mas exige plano de migração próprio.

**Para apps novas:** uma instância compartilhada com **um database por aplicação** é mais
econômico. Instância dedicada só quando houver exigência de isolamento, versão ou tuning
incompatível.

---

## 5. Volumes, logs e disco

### Volumes

- **Nomeados** para dados (`postgres_data`), não bind mounts com caminho absoluto do host.
- **Prefixo por aplicação** — o compose já faz isso pelo nome do projeto.
- **Nunca** `docker volume prune` em automação: apaga dados de qualquer app.

⚠️ **Volume órfão é o maior desperdício silencioso.** No piloto havia **17.3 GB** em volumes de
serviços removidos meses antes (`ollama_data` sozinho: 15.29 GB), com o disco a 96%.

Auditoria trimestral:
```bash
docker volume ls -qf dangling=true            # candidatos (LINKS=0)
docker system df -v | grep -A50 "VOLUME NAME" # tamanhos
```
Remova **um a um**, conferindo o nome. Nunca em lote automático.

### Logs — duas camadas

1. **Docker** (regra 4): teto de 30 MB por container.
2. **Aplicação**: se escreve log em arquivo, rotação própria. O piloto usa
   `winston-daily-rotate-file` com `maxSize: 20m, maxFiles: 7d` — correto.

Sem a camada 2, o volume de logs cresce sozinho (118 MB no piloto).

### Contexto de build

`.dockerignore` desde o primeiro commit. **MEDIDO no piloto: 87 MB → 65 MB (−25%)** só excluindo
o que o build não usa.

```
**/node_modules
**/.git
**/dist
**/.next
**/*.md
**/.env*
# + diretórios de OUTROS serviços, material não-código, artefatos de depuração
```

> Para medir de verdade: `COPY . /c` + `du -sm /c` dentro de um container. O `du` no disco com
> exclusões manuais **não** reflete o que o Docker envia — erro que cometi no piloto.

---

## 6. Deploy

### Arquitetura obrigatória

```
push → CI (runner externo) → build → push p/ registry → VPS faz PULL
```

**A VPS nunca compila.** No piloto, o deploy rodava `docker-compose build --no-cache` na própria
máquina de produção, com 4 vCPU disputados por 93 containers — a maior fonte de pico de CPU e de
12.99 GB de build cache.

```yaml
- uses: docker/build-push-action@v6
  with:
    push: true
    tags: |
      ghcr.io/org/app:latest
      ghcr.io/org/app:${{ github.sha }}     # regra 8 — rollback
    cache-from: type=registry,ref=ghcr.io/org/app:buildcache
    cache-to: type=registry,ref=ghcr.io/org/app:buildcache,mode=max
    provenance: false                        # sem isto, manifests extras por imagem
    sbom: false
```

`mode=max` é essencial: sem ele só o estágio final entra no cache e os intermediários recompilam
sempre.

### Deploy idempotente

```bash
set -e
cd /opt/minha-app
git fetch --prune origin main && git reset --hard origin/main

sed -i '/^RELEASE=/d' .env            # idempotente: nunca acumula
echo "RELEASE=${SHA}" >> .env

docker compose pull
docker compose up -d --remove-orphans  # serviço removido some de verdade
docker image prune -f                  # SÓ dangling (regra 6)
```

**`--remove-orphans` é obrigatório.** Sem ele, um serviço retirado do compose continua rodando
para sempre, segurando RAM. No piloto, dois containers de IA removidos precisaram de
`docker rm -f` explícito no script.

### ⚠️ `.env` regenerado

Se o deploy regenera o `.env` do zero, ele **é** a fonte da verdade e apaga qualquer ajuste
manual. No piloto, o script reescrevia 20+ variáveis de um serviço removido a cada deploy —
a configuração morta ressuscitava sozinha.

**Regra:** ou o `.env` é gerado (e o gerador é a fonte), ou é manual e preservado. Nunca meio-termo.

### Rollback

```bash
RELEASE=<sha-anterior> docker compose up -d
```

Funciona porque cada build publicou a tag por SHA. Sem isso, rollback vira rebuild — e rebuild
sob incidente é a pior hora possível.

---

## 7. Limpeza segura em host compartilhado

**Nunca** `docker system prune -a`: apaga imagens sem container **de todas as aplicações**,
forçando rebuild de apps que você nem tocou.

| Comando | Escopo | Seguro? |
|---|---|---|
| `docker image prune -f` | só dangling (`<none>`) | ✅ |
| `docker builder prune -f --filter until=168h` | cache antigo | ✅ |
| `docker container prune -f --filter label=app=minha-app` | escopo da app | ✅ |
| `docker image prune -a -f --filter until=720h` | imagens antigas sem container | ⚠️ revisar |
| `docker system prune -a` | **tudo de todos** | 🔴 nunca |
| `docker volume prune` | volumes de todos | 🔴 nunca automatizado |

O `labels: app=minha-app` do §3 é o que torna a limpeza por escopo possível. Adote desde o início.

---

## 8. Quando criar um container separado

**Crie** quando: for processo de longa duração com ciclo próprio; precisar escalar
independentemente; usar runtime diferente; ou exigir isolamento de segurança.

**Não crie** quando: for um cron (use o scheduler dentro do processo); for um worker de baixo
volume; existir só para "separar responsabilidades" no diagrama.

**Exemplo bom do piloto:** o container principal roda **3 processos** (nginx + backend + frontend)
sob supervisord. Separar custaria mais RAM base e mais complexidade de rede, sem ganho — e o
supervisord já isola por usuário. **Mantido de propósito.**

**Contraexemplo:** jobs via `node-cron` dentro do backend, em vez de um container de cron. Mais
econômico e simples.

> Não junte tudo num container só para reduzir números. Nem separe tudo por elegância.
> A pergunta é: *este processo tem ciclo de vida próprio?*

### Serviço ocioso

Serviço integrado mas com tráfego zero: **dimensione, não remova**. Se for realmente opcional,
`profiles:` mantém o código e tira do `up` padrão. Remover quebra funcionalidade — e é o erro que
o §9 previne.

---

## 9. Checklist: remover um serviço

**Esta é a lição mais transferível do piloto.** A remoção da IA local parou no meio e deixou a
aplicação **pior** do que antes: com o custo da configuração morta e sem nenhum benefício —
compose quebrado, deploy parado, três áreas do produto falhando com timeout de 150 s.

Ao remover um serviço, **todos** os itens:

- [ ] Bloco `services:` do compose
- [ ] Bloco `volumes:` — ⚠️ comentar a chave e **esquecer o `driver:` abaixo** quebra o YAML inteiro
- [ ] Variáveis de ambiente no compose
- [ ] Variáveis no gerador de `.env` (senão voltam no próximo deploy)
- [ ] `depends_on` de outros serviços
- [ ] Matriz de build do CI
- [ ] Passos do deploy que citam o serviço
- [ ] **Rotas/proxies no backend que apontam para ele**
- [ ] **Clientes no frontend que chamam essas rotas**
- [ ] **Páginas/telas que usam esses clientes**
- [ ] Validações de build que exigem os arquivos compilados
- [ ] Volumes órfãos no host (`docker volume ls -qf dangling=true`)
- [ ] Containers órfãos (`docker compose up -d --remove-orphans`)
- [ ] Ajustes de sysctl feitos por causa dele

**Se a funcionalidade continua no produto**, não é remoção — é **migração**, e precisa de destino
(serviço externo, outro provedor) antes de tirar o antigo.

### Como procurar consumidores sem se enganar

Erro real que cometi no piloto: procurei em `frontend/src` e concluí "zero consumidores". O App
Router estava em `frontend/app` — **280 páginas** que meu grep nunca veria. Quase removi três
funcionalidades vivas.

```bash
# 1. Descubra a estrutura ANTES
find . -name "page.tsx" -not -path "*/node_modules/*" | head
# 2. Só então procure, na raiz do projeto
grep -rn "/api/meu-servico" . --include=*.ts --include=*.tsx \
     --exclude-dir=node_modules --exclude-dir=.next
```

> **"grep não encontrou" não é prova de que não existe.** Só vale depois de confirmar que você
> procurou no lugar certo.

---

## 10. Observabilidade proporcional

Prometheus + Grafana custariam mais RAM que a maioria das apps. Comece com o que já existe:

```bash
#!/bin/bash
# scripts/metrics.sh — cron: 0 * * * *
OUT=/var/log/minha-app-metrics.csv
[ -f "$OUT" ] || echo "ts,container,cpu,mem,mem_pct" > "$OUT"
docker stats --no-stream --format '{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}' \
  --filter label=app=minha-app \
  | while IFS= read -r l; do echo "$(date -Is),$l" >> "$OUT"; done
tail -n 2000 "$OUT" > "$OUT.tmp" && mv "$OUT.tmp" "$OUT"   # retenção
```

Custo: ~0. `docker stats` lê do cgroups, que o Docker já usa para controle de recursos.

**Perguntas que isso responde:** a app cresce em memória sem carga (vazamento)? Qual container
consome mais? Os volumes crescem? Quanto disco sobra?

```bash
docker system df                  # imagens, containers, volumes, cache
docker stats --no-stream          # instantâneo
df -h /                           # disco do host
docker volume ls -qf dangling=true # órfãos
```

Só suba stack dedicada quando essas perguntas deixarem de ser respondidas. Se precisar,
**Beszel** (agente <10 MB) antes de Prometheus.

---

## 11. Diagnóstico rápido

| Sintoma | Primeiro comando | Causa provável |
|---|---|---|
| App morre sozinha | `docker inspect <c> \| grep -i oom` | `mem_limit` baixo ou heap > limite |
| "too many clients" | `SELECT count(*) FROM pg_stat_activity` | Pools duplicados (§4) |
| Disco enchendo | `docker system df` | Volumes órfãos ou log sem rotação |
| Deploy lento | Onde roda o build? | Compilando na VPS (§6) |
| Container não fica healthy | `docker logs <c> --tail=100` | Healthcheck antes do `start_period` |
| Compose recusa subir | `docker compose config` | YAML inválido — **valide sempre antes** |
| Load alto, app parada | `top` → coluna `st` | **Steal time**: é o provedor, não você |

> **Sobre steal time:** no piloto foram medidos 13.8%, com pico de **94.7%** e load 259 — com
> apenas 2.3% de CPU em user space e nenhum processo da aplicação entre os maiores consumidores.
> **Nenhuma otimização corrige isso.** Verifique `st` antes de atribuir lentidão à sua aplicação.

---

## 12. Checklist para toda aplicação nova

**Antes do primeiro deploy:**

- [ ] `.dockerignore` existe e exclui `node_modules`, `.git`, `dist`, `.env`
- [ ] Dockerfile multi-stage, base justificada pela dependência mais exigente
- [ ] `USER` não-root
- [ ] `HEALTHCHECK` definido
- [ ] Nenhum trabalho de build no entrypoint
- [ ] `mem_limit`, `cpus`, `pids_limit` nos **todos** os serviços
- [ ] `--max-old-space-size` ≈ 66% do `mem_limit` em **todo** serviço Node
- [ ] Banco com tuning coerente com seu `mem_limit`
- [ ] `logging` com `max-size`/`max-file` em todos
- [ ] Só as portas necessárias publicadas
- [ ] Rede própria
- [ ] `labels: app=<nome>`
- [ ] Build no CI, VPS só faz `pull`
- [ ] Tags `latest` **e** `:${SHA}`
- [ ] `provenance: false` / `sbom: false`
- [ ] Deploy usa `--remove-orphans` e `image prune -f` (nunca `system prune -a`)
- [ ] `RELEASE=` idempotente no `.env`
- [ ] `docker compose config` valida
- [ ] Rollback documentado e **testado uma vez**
- [ ] `scripts/metrics.sh` no cron
- [ ] `docs/DEPLOY.md` com o procedimento

**Trimestral, por aplicação:**

- [ ] `docker volume ls -qf dangling=true` — órfãos?
- [ ] `docker system df` — cache crescendo?
- [ ] CSV de métricas — memória cresce sem carga?
- [ ] Alguma config aponta para serviço que não existe mais?

---

## O que este padrão NÃO manda fazer

| Não faça | Por quê |
|---|---|
| Trocar framework por um "mais leve" | Custo de reescrita ≫ ganho; nenhuma fonte de 2026 justifica |
| Kubernetes/Swarm numa VPS | Overkill absoluto; o Compose resolve |
| Migrar uploads para S3 por padrão | Volume local é mais barato em escala pequena (22 MB no piloto) |
| Remover Redis "porque é mais um container" | ~20 MiB; filas e adapter WebSocket reais |
| Juntar tudo num container para reduzir números | Isolamento importa (§8) |
| `--omit=dev` sem verificar | Quebra deploys que usam `tsx`/`prisma` no container |
| `docker system prune -a` no deploy | Afeta todas as outras aplicações |
| Remover serviço "ocioso" sem checklist | §9 — foi o erro mais caro do piloto |

---

## Status de validação deste padrão

**Honestidade sobre o que está e o que não está comprovado:**

| Regra | Estado |
|---|---|
| 7 (`.dockerignore`) | ✅ **MEDIDO** — 87 MB → 65 MB no piloto |
| 6 (limpeza específica) | ✅ **MEDIDO** — 17.3 GB de volumes órfãos encontrados |
| 4 (rotação de log) | ✅ **MEDIDO** — 118 MB de volume de log sem rotação própria |
| §4 (pool único) | ✅ **MEDIDO** — 21 clientes duplicados, `max_connections=100` esgotado |
| §9 (checklist de remoção) | ✅ **MEDIDO** — deploy quebrado por remoção incompleta |
| 1, 2, 3 (limites e tuning) | ⏸️ **aplicados, NÃO validados em produção** |
| 5, 8 (CI + rollback) | ⏸️ implementados, rollback **não exercitado** ainda |
| 9 (observabilidade) | ⏸️ proposto, script **não escrito** ainda |

As regras marcadas ⏸️ serão confirmadas ou corrigidas na ETAPA 8 (validação real na VPS). Este
documento deve ser **atualizado com o que a realidade mostrar** — inclusive se contrariar alguma
regra acima.
