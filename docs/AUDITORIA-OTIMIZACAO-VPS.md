# Auditoria de otimização para VPS — projeto-piloto DigiUrban

**Data:** 2026-09-14
**Commit auditado:** `30c75b60` (= `origin/main`, árvore limpa)
**Escopo:** aplicação DigiUrban inteira (monorepo, 4 serviços Docker + Postgres + Redis)
**Objetivo:** servir de laboratório para um padrão de execução de muitas aplicações Docker
numa VPS compartilhada de 4 vCPU.

> **Nenhuma alteração foi feita no código nesta etapa.** Este documento é só a auditoria
> (ETAPA 1). O plano priorizado está em `docs/PLANO-OTIMIZACAO-VPS.md` (ETAPA 2).

---

## Nota de método: o que é medido e o que não é

Esta auditoria distingue rigorosamente três origens de número:

| Marca | Significado |
|---|---|
| **MEDIDO (local)** | Medido nesta máquina de desenvolvimento, agora, por mim. |
| **MEDIDO (VPS, 2026-09-13)** | Medido na VPS de produção pela auditoria anterior (`docs/VPS-OPTIMIZATION-AUDIT.md`), via SSH. **Não re-verificado hoje** — a VPS não foi acessada nesta sessão. |
| **NÃO MEDIDO** | Desconhecido. Nunca substituído por estimativa. |

Não há acesso à VPS nesta sessão. Todo número de runtime (RAM, CPU, disco, tamanho de imagem)
vem da auditoria de 2026-09-13 e **pode estar desatualizado** — inclusive porque mudanças
importantes foram implantadas depois dela. Isso está sinalizado onde aparece.

---

## Resumo executivo

O DigiUrban **já passou por uma rodada de otimização** em 2026-09-13/14 (auditoria anterior,
commits `3dfb9fa1`, `043e290b`, `30c75b60`). Boa parte do desperdício grosseiro foi atacada:
build saiu da VPS e foi para o GHCR, `mem_limit` e limites de heap foram definidos, 21
`PrismaClient` duplicados foram unificados, 16 GB de volumes órfãos foram removidos e a IA
local (llama.cpp + `digiurban-ai`, ~2.4 GB de RAM) foi retirada do compose.

**O achado mais importante desta auditoria é que a última dessas mudanças quebrou o deploy.**

### Achado bloqueante: o `docker-compose.vps.yml` é rejeitado pelo Docker

O commit `043e290b` comentou a chave `ai_logs:` no bloco `volumes:` mas **deixou o
`driver: local` órfão logo abaixo** (linha 433). Isso torna o `driver` uma chave duplicada
dentro de `face_logs`, e o parser do Docker rejeita o arquivo inteiro:

```
$ docker compose -f docker-compose.vps.yml config --services
failed to parse docker-compose.vps.yml: yaml: unmarshal errors:
  line 1: line 433: mapping key "driver" already defined at line 427
```

**MEDIDO (local).** Reproduzido tanto no `docker compose` v2 (Docker 29.1.3) quanto no
`docker-compose` v1 — que é o binário usado pelo job de deploy. Removendo apenas a linha 433,
o arquivo volta a validar e lista corretamente os 6 serviços (verificado).

Consequência: **todo comando `docker-compose` do job de deploy falha** — `pull`, `up -d`,
`restart`. O deploy do commit `30c75b60` não pode ter subido. Correção de uma linha, prioridade
máxima.

> Correção de um erro meu durante a apuração: cheguei a registrar que o arquivo era "YAML
> inválido". Não é — `yaml.safe_load` aceita. O defeito é chave duplicada, que só o parser
> estrito do Docker rejeita. O efeito prático (deploy quebrado) é o mesmo; a causa que eu havia
> descrito não era a correta.

### Os outros achados de maior impacto

1. **Deploy bloqueado** pelo compose inválido (acima).
2. **A remoção da IA local ficou pela metade**: o `scripts/vps-deploy-lib.sh` ainda **reescreve
   o `.env` a cada deploy** com 20+ variáveis de llama.cpp (`AI_LLAMACPP_BASE_URL`,
   `CITIZEN_AI_COMPLETIONS_URL=http://digiurban-ai:9004/...`), apontando para containers que não
   existem mais. Como o `.env` é regenerado do zero, isso é reintroduzido em todo deploy.
3. **Três áreas do produto estão quebradas**, não obsoletas: `/api/prices`, `/api/flow` e
   `/api/ai` têm clientes vivos no frontend (`lib/prices-client.ts`, `lib/flow-client.ts`,
   `lib/services/ai-platform.service.ts` + página `/super-admin/ia`), mas os serviços de destino
   (`digiurban-prices:9002`, `digiurban-flow:9003`, `digiurban-ai:9004`) **não existem no compose
   nem no CI**. `/api/ai` pendura a requisição por **150 s** antes de falhar.
   (Ver a correção registrada na seção "Os três proxies" — minha primeira leitura deste ponto
   estava errada.)
4. **`.dockerignore` não cobre o lixo da raiz**: `anjoinovador/` (7.1 MB de PDFs/DOCX),
   `WORKFLOWS_COMPLETOS.ts` (509 KB), `deploy-log-templates.txt` (584 KB), `ai-training/`,
   `digiurban-ai/`, `digiurban-prices/`, `digiurban-flow/`, `backend/`, `frontend/`, `generator/`
   — todos entram no contexto de build da imagem principal (`context: .`).
5. **Sem limite de CPU nem de PIDs** em nenhum container. `mem_limit` existe; `cpus` e
   `pids_limit` não. Numa VPS compartilhada, um laço quente ou fork bomb aqui afeta as outras
   aplicações.

### O que já está bom — e não deve ser mexido

Registrado para evitar "otimização cega" numa segunda passada:

| Item | Estado | Veredito |
|---|---|---|
| Next.js `output: 'standalone'` | Ativo, Dockerfile copia corretamente | 🟢 nada a fazer |
| Rotação de log do Winston | `maxSize: 20m`, `maxFiles: 7d` (3d p/ HTTP) — **já configurado** | 🟢 nada a fazer |
| Rotação de log do Docker | `max-size: 10m, max-file: 3` nos 6 serviços | 🟢 nada a fazer |
| Monitor de e-mail | Já em `*/10 * * * *` (não mais 2 min) | 🟢 já corrigido |
| `log: ['query']` do Prisma | Já desligado em produção | 🟢 já corrigido |
| Build no GHCR | `build-images.yml` publica 4 imagens; VPS só faz `pull` | 🟢 já corrigido |
| Uploads em volume local | ~22 MB total; sem S3/MinIO | 🟢 mais econômico possível |
| Redis | BullMQ + adapter Socket.IO, ~20 MiB | 🟢 uso real |
| Playwright/Chromium (968 MB) | Usado em 6 arquivos p/ PDF e assinatura | 🟢 não remover |

---

## Arquitetura atual

Monorepo, orquestrado por `docker-compose.vps.yml`. **6 serviços** (era 8 antes da remoção da IA):

| Serviço | Container | Imagem | Portas expostas | Função |
|---|---|---|---|---|
| `digiurban` | `digiurban-vps` | GHCR `digiurban-app` | `3060:80` | nginx + backend + frontend (3 processos sob supervisord) |
| `ultrazend-messages` | `ultrazend-messages` | GHCR `digiurban-messages` | `9001:9001` | WebSocket + bot |
| `ultrazend-smtp` | `ultrazend-smtp` | GHCR `digiurban-smtp` | `25`, `587` | MX + submission |
| `ultrazend-face` | `ultrazend-face` | GHCR `digiurban-face` | `9006:9006` | biometria facial |
| `postgres` | `digiurban-postgres` | `postgres:15-alpine` | interna | banco |
| `redis` | `digiurban-redis` | `redis:7-alpine` | interna | filas + adapter WS |

**Stack:** Express 5.1 + Prisma 6.19 + PostgreSQL / Next.js 14.2 App Router / Socket.IO / BullMQ.
Node 20 (Debian slim) na imagem principal; Node 22 (Alpine) nos três satélites.

### O container principal tem 3 processos sob supervisord

`nginx :80` → `backend :3001` + `frontend :3000`. Heap limitado por processo em
`docker/supervisord.conf` (384 MB backend + 256 MB frontend), dentro de `mem_limit: 1g`.

**Veredito sobre essa escolha:** é a decisão certa para este caso. Separar em 3 containers
custaria mais RAM base e mais complexidade de rede sem ganho real, e o supervisord já isola os
processos por usuário (`backend`/`frontend`, uid 1001/1002). **Não alterar.**

---

## Containers — classificação pedida (necessário / otimizável / opcional / obsoleto / duplicado)

| Serviço | Classe | Justificativa |
|---|---|---|
| `digiurban` | **1. Necessário** | É a aplicação. |
| `postgres` | **1. Necessário** | Banco de produção (3.4 GB de dados). |
| `redis` | **1. Necessário** | BullMQ + adapter Socket.IO, uso comprovado em código. |
| `ultrazend-messages` | **2. Necessário, otimizável** | Bot + WebSocket em uso. Roda `prisma migrate deploy` a cada boot. |
| `ultrazend-smtp` | **2. Necessário, otimizável** | MX/submission real. Estava em crash-loop (261 restarts) por esgotamento de conexões; o fix foi aplicado mas **não validado em produção**. |
| `ultrazend-face` | **3. Opcional** | Integrado (`face-platform-client.service.ts` + rota admin), mas **0 linhas de log em 7 dias** na medição da VPS. Candidato a `profiles:` do compose. |
| `digiurban-llamacpp` | **4. Obsoleto** | Removido do compose. Container é derrubado no deploy. |
| `digiurban-ai` | **4. Obsoleto** | Idem — mas o proxy `/api/ai` e as env vars continuam no código. |

Não encontrei nenhum caso da classe **5. Duplicado** entre containers.

---

## Dependências

**MEDIDO (local):** pacotes instalados em `node_modules` — backend 741, frontend 819,
messages 419. Frontend `node_modules` = **1.064 MB**.

Da rodada anterior, `bull`, `redis` e `openai` já foram removidos do backend (confirmado: não
estão mais no `package.json`).

### Ainda pendente

| Dependência | Situação | Veredito |
|---|---|---|
| `tesseract.js` (backend) | 1 uso (`document-processing.service.ts`) | ⚠️ pesado, mas **tem uso real** — manter |
| devDependencies no runtime | Dockerfile roda `npm install` sem `--omit=dev` | ⚠️ **armadilha**: os seeds (`db:seed`) e o smoke multi-tenant rodam via `tsx`, que é devDependency, **dentro do container**. `--omit=dev` quebra o deploy. Ver plano. |
| `@tensorflow/tfjs` + `face-api.js` + `@mediapipe/tasks-vision` (frontend) | Reconhecimento facial no browser | Pesados; verificar se entram no bundle inicial ou só sob demanda — **NÃO MEDIDO** |

---

## Prisma e banco

### Estado do fix de conexões (P0-2 da rodada anterior)

**MEDIDO (local):** 39 ocorrências de `new PrismaClient(` em `src/`. Decomposição:

| Onde | Qtd | Avaliação |
|---|---|---|
| `src/scripts/` (scripts avulsos, rodados à mão) | 13 | 🟢 **inofensivo** — processo efêmero, não roda em produção contínua |
| `src/lib/prisma.ts` | 1 | 🟢 o singleton legítimo |
| `src/middleware/prisma-cascade-delete.middleware.ts` | 1 | 🟢 ocorrência em **comentário** de documentação |
| `src/services/citizen-lookup.service.ts:32` | 1 | 🟠 `prisma \|\| new PrismaClient()` — fallback que ainda pode abrir pool próprio |
| `src/lib/json-schema-validator.ts:277` | 1 | 🟠 cria cliente dentro de função |
| 18 rotas + 2 jobs + `email-domain.utils.ts` | 21 | 🟢 **já convertidas** — a ocorrência é o comentário explicando a conversão |

**Conclusão:** o fix foi aplicado corretamente. Restam **2 casos reais** em caminho de produção
(`citizen-lookup.service.ts` e `json-schema-validator.ts`), não 18. Risco baixo, mas vale fechar.

### Outros pontos

- **`connection_limit` continua ausente** — `grep` em `src/`, `scripts/` e no compose: zero
  ocorrências. Era a pendência declarada da rodada anterior, condicionada a validar o fix em
  produção. Como o deploy está bloqueado, **ainda não foi validado**.
- `max_connections` do PostgreSQL = 100 (MEDIDO na VPS, 2026-09-13).
- **RLS armado mas bypassado**: 194 policies `tenant_isolation` existem, mas a app conecta como
  `digiurban` com `superuser=true`, e o role `digiurban_app` **não existe** (MEDIDO na VPS,
  2026-09-13). É pendência de **segurança**, não de consumo — registrada, fora do escopo deste
  trabalho.

---

## Código morto e configuração órfã

### Os três proxies sem destino

**MEDIDO (local).** Registrados em `src/index.ts:219/222/225`:

| Rota | Destino | Serviço existe? | Timeout | Consumidor no frontend |
|---|---|---|---|---|
| `/api/prices` | `http://digiurban-prices:9002/api/v1` | ❌ não está no compose nem no CI | 30 s | ✅ `lib/prices-client.ts` |
| `/api/flow` | `http://digiurban-flow:9003/api/v1` | ❌ idem | 30 s | ✅ `lib/flow-client.ts` |
| `/api/ai` | `http://digiurban-ai:9004/api/v1` | ❌ removido em `043e290b` | **150 s** | ✅ `lib/services/ai-platform.service.ts` + página `/super-admin/ia` |

> ⚠️ **CORREÇÃO DE UM ERRO MEU NESTA AUDITORIA.** Numa primeira passagem registrei que estas três
> rotas não tinham **nenhum** consumidor. **Isso estava errado.** Eu havia feito os greps em
> `digiurban/frontend/src`, mas o App Router deste projeto fica em `digiurban/frontend/app` —
> **280 páginas em `app/`, ZERO em `src/app/`** (`src/` contém apenas `components/`, `hooks/`,
> `services/`, `types/`, `utils/`). Varri o diretório errado e concluí ausência a partir de uma
> busca que jamais encontraria os arquivos.
>
> A conclusão correta: **os três proxies têm consumidores vivos.** A página `/super-admin/ia`
> está inclusive compilada no build (`.next/server/app/super-admin/ia/page.js`). O alias
> `@/*` resolve para `./*` (raiz do frontend), não para `src/`.

**Consequência real, e é o oposto do que eu havia escrito:** estas rotas não são código morto —
são **funcionalidades vivas apontando para serviços que não existem mais**. Quem abrir
`/super-admin/ia` hoje recebe erro após o timeout. O problema não é remover código inútil; é que
três áreas do produto (IA, Pesquisa de Preços, Processos Internos) estão **quebradas** desde a
remoção dos containers.

⚠️ O `digiurban/Dockerfile` **exige** que `dist/routes/prices-proxy.routes.js` exista, senão o
build falha. Qualquer remoção precisa ajustar essa validação junto.

### O chat com IA hoje

O `CitizenAiClient` do bot decide disponibilidade por `available() { return Boolean(serviceToken) }`
— **o token, não a URL**. E `AI_SERVICE_TOKEN` tem valor default no compose
(`${AI_SERVICE_TOKEN:-digiurban-ai-service-token}`). Com `CITIZEN_AI_COMPLETIONS_URL` comentado,
o cliente cai no default `http://localhost:9004/...`, que dentro do container não é ninguém.

Resultado: o cliente **se considera configurado** e tenta chamar um host morto a cada turno de
conversa, em vez de degradar limpo. **NÃO MEDIDO** qual é a latência real do fallback — depende
de o TCP dar `ECONNREFUSED` rápido (provável) ou pendurar até o timeout de 30 s.

### CompreFace

`COMPREFACE_API_URL=` vazio no compose, mas o `CompreFaceClient.ts` usa
`process.env.COMPREFACE_API_URL || 'http://compreface-ui:80'` — mesmo padrão de fallback para
host inexistente.

---

## Docker: imagem, contexto e build

### Anatomia da imagem principal (MEDIDO na VPS, 2026-09-13 — 2.2 GB)

| Camada | Tamanho | Runtime? |
|---|---|---|
| `playwright install chromium` | 968 MB | ✅ PDF/assinatura |
| `COPY backend/node_modules` | 714 MB | ⚠️ inclui devDeps |
| `apt-get` (nginx, supervisor, psql-client, libs) | 140 MB | ✅ |
| base `node:20-bookworm-slim` | ~125 MB | ✅ |
| `.next/standalone` | 83.1 MB | ✅ |
| `.prisma` | 60.2 MB | ✅ |
| resto (`static`, `src`, `prisma`, `dist`) | ~38 MB | ✅ |

### Contexto de build (MEDIDO local)

A imagem principal usa `context: .` (raiz do monorepo). O `.dockerignore` **não exclui**:

```
anjoinovador/ (7.1 MB)   WORKFLOWS_COMPLETOS.ts (509 KB)   WORKFLOWS_GERADOS.ts (264 KB)
ai-training/ (448 KB)    deploy-log-templates.txt (584 KB) digiurban-ai/ (1.1 MB)
digiurban-prices/        digiurban-flow/                   generator/  apresentacao/
backend/  frontend/  src/ (diretórios legados na raiz, separados de digiurban/)
```

Contexto real do build: **87 MB** — MEDIDO com `COPY . /c` + `du -sm` dentro de um container,
que é o tamanho efetivamente enviado ao daemon a cada build.

> **Correção de um número meu.** Numa primeira passagem registrei "58 MB" aqui. Esse valor veio
> de um `du` no disco com exclusões manuais (`--exclude=node_modules --exclude=.git`), que **não
> é** o que o Docker envia — o `.dockerignore` tem regras próprias. Refiz a medição pelo método
> correto, idêntico antes e depois: **87 MB**.

### Dockerfile duplicado

Existe um `Dockerfile` na raiz **e** um `digiurban/Dockerfile`. **Só o segundo é usado**
(compose linha 262 e CI). O da raiz é uma versão antiga divergente (copia `node_modules` do
frontend inteiro em vez do `standalone`, tem validações diferentes). **Classe 4: obsoleto** —
confunde e é um risco de alguém editar o arquivo errado.

### Migrations a cada boot

`ultrazend-messages` roda `prisma migrate deploy` no entrypoint (com fallback que aplica SQL
statement a statement engolindo erros); `ultrazend-face` roda `prisma generate` **em runtime**, a
cada start — trabalho de build feito no boot, custando CPU na VPS.

---

## Deploy

Pipeline atual (`build-images.yml`): 4 imagens construídas **em paralelo** em runners
GitHub-hosted, com cache de camadas no GHCR, e a VPS apenas faz `pull` + `up -d`. Essa parte
está **arquiteturalmente correta**.

Problemas remanescentes:

| # | Problema | Efeito |
|---|---|---|
| D1 | Compose inválido | **Deploy 100% bloqueado** |
| D2 | `vps-deploy-lib.sh` reescreve `.env` com config de llama.cpp | Config morta reintroduzida todo deploy |
| D3 | `RELEASE=${SHA}` é **anexado** ao `.env` a cada deploy (`>> .env`) | `.env` cresce indefinidamente com linhas `RELEASE=` repetidas |
| D4 | `deploy-digiurban-vps.yml` (fallback manual) ainda tem `ensure_vm_max_map_count` para OpenSearch, removido há tempos | Ajusta sysctl do host sem necessidade |
| D5 | Limpeza = `docker image prune -f` (só dangling) | 🟢 **correto** para VPS compartilhada — não toca em outras apps |

**Sobre o D5, vale registrar como acerto:** o pipeline **não** usa `docker system prune -a`.
Usa `docker image prune -f` (só dangling) e, no fallback, `docker builder prune --filter until=168h`.
Essa é exatamente a política segura para Docker Host compartilhado.

---

## Limites de recurso

**MEDIDO (local)** no compose:

| Limite | Estado |
|---|---|
| `mem_limit` | ✅ nos 6 serviços (512m/192m/384m/384m/384m/1g) |
| `NODE_OPTIONS=--max-old-space-size` | ✅ messages/face (256m) + supervisord (384m/256m) |
| **`cpus`** | ❌ **nenhum container** |
| **`pids_limit`** | ❌ **nenhum container** |
| `restart: unless-stopped` | ✅ todos |
| healthchecks | ✅ todos, `interval: 30s` |
| logging json-file | ✅ todos, `10m × 3` |

A ausência de `cpus` é a lacuna mais relevante para o objetivo de "muitas apps na mesma VPS":
`mem_limit` impede que a app coma toda a RAM, mas nada impede que consuma todos os 4 vCPU.

---

## Armazenamento

| Categoria | Tamanho | Origem | Política atual | Ação |
|---|---|---|---|---|
| `postgres_data` | 3.435 GB | VPS 09-13 | — | 🟢 dado de produção |
| Volumes órfãos | **0** (eram 17.34 GB) | VPS 09-13 | removidos | 🟢 resolvido |
| `digiurban_logs` | 118.3 MB | VPS 09-13 | Winston 7d/20m ✅ | 🟠 114 MB são logs de dez/2025, estáticos |
| `messages_logs` | 70.45 MB | VPS 09-13 | — | 🟠 idem |
| Uploads (3 volumes) | ~22 MB | VPS 09-13 | — | 🟢 |
| `.git` (repo) | **63 MB** | local | — | 🟢 ok |
| `digiurban/backend/node_modules` | **833 MB** | local | — | dev only |
| `digiurban/frontend/node_modules` | **1.064 MB** (~1.04 GiB) | local | — | dev only |
| `digiurban-ai/node_modules` | **356 MB** | local | — | 🔴 **serviço removido** — dependências de um container que não existe mais, ocupando disco local e entrando no contexto de build (ver #6) |
| `node_modules/` da raiz | **0** | local | — | `package.json` da raiz declara `better-sqlite3` + `sqlite3` e **nunca foi instalado** — resíduo da era SQLite |
| Arquivos mortos versionados | ~2 MB | local | — | `WORKFLOWS_*.ts`, `deploy-log-*.txt`, `*.backup` |

**Disco da VPS:** 96% na medição de 09-13, ~88% após a remoção dos volumes órfãos. **Estado
atual NÃO MEDIDO.**

---

## Observabilidade

Não há stack de monitoramento — e, para esta escala, **é a decisão certa**. Prometheus/Grafana
custariam mais RAM do que a aplicação inteira consome.

O que existe: healthchecks em todos os containers, `/health` no backend, logs rotacionados.

O que falta para responder "esta app está crescendo anormalmente?": nada automatizado. Não há
script de coleta periódica de `docker stats` / `docker system df`. Proposta no plano — via `cron`
+ arquivo CSV, sem container adicional.

---

## Segurança (registrado, fora do escopo de consumo)

| Achado | Gravidade |
|---|---|
| RLS armado (194 policies) mas app conecta como **superuser** → policies ignoradas | 🔴 alto |
| Defaults fracos no compose: `JWT_SECRET:-digiurban-super-secret-change-in-production`, `POSTGRES_PASSWORD:-digiurban2024` | 🟠 |
| `.env.production` **versionado no git** (só URLs públicas + Google Site Verification — **sem segredo real**, verificado) | 🟢 aceitável |
| Portas `9001` e `9006` publicadas no host sem necessidade aparente (nginx já faz proxy interno de `/messages-api`) | 🟠 |

---

## CPU: o alerta honesto que precisa ser repetido

**MEDIDO na VPS, 2026-09-13:** steal time de **13.8%**, chegando a **94.7%** durante um pico, com
load average de 259. No pico, apenas 2.3% de CPU em user space, e **nenhum processo do DigiUrban**
entre os maiores consumidores — os maiores eram `php artisan` de outras aplicações.

**Nenhuma otimização neste repositório corrige isso.** É limitação da hospedagem. Registro aqui
para que o resultado do experimento não seja lido como "a otimização não funcionou" quando o
gargalo é o provedor.

---

## Problemas encontrados — consolidado

| # | Problema | Severidade | Classe |
|---|---|---|---|
| 1 | `docker-compose.vps.yml` rejeitado pelo Docker (`driver` duplicado, linha 433) | 🔴 **bloqueante** | — |
| 2 | `vps-deploy-lib.sh` reintroduz config de llama.cpp a cada deploy | 🟠 alto | 4. Obsoleto |
| 3 | `/api/ai` — **funcionalidade viva** (`/super-admin/ia`) apontando para serviço removido; timeout 150 s | 🔴 **crítico** | 1. Necessário (quebrado) |
| 4 | `/api/prices` e `/api/flow` — idem, com clientes vivos em `lib/` | 🔴 **crítico** | 1. Necessário (quebrado) |
| 5 | Sem `cpus` / `pids_limit` em VPS compartilhada | 🟠 alto | 2. Otimizável |
| 6 | `.dockerignore` não cobre lixo da raiz (87 MB de contexto) | 🟡 médio | 2. Otimizável |
| 7 | `Dockerfile` da raiz duplicado e obsoleto | 🟡 médio | 5. Duplicado |
| 8 | `RELEASE=` anexado ao `.env` a cada deploy (crescimento infinito) | 🟡 médio | 2. Otimizável |
| 9 | 2 `PrismaClient` residuais em caminho de produção | 🟡 médio | 2. Otimizável |
| 10 | `connection_limit` ausente (pendência não fechada) | 🟡 médio | 2. Otimizável |
| 11 | `ultrazend-face` roda `prisma generate` a cada boot | 🟡 médio | 2. Otimizável |
| 12 | devDeps no runtime, mas `--omit=dev` quebraria os seeds | 🟡 médio | 2. Otimizável |
| 13 | `CitizenAiClient.available()` checa token, não URL → chama host morto | 🟡 médio | 2. Otimizável |
| 14 | `ensure_vm_max_map_count` (OpenSearch) no fallback de deploy | 🟢 baixo | 4. Obsoleto |
| 15 | Portas 9001/9006 publicadas sem necessidade | 🟢 baixo | 2. Otimizável |
| 16 | RLS bypassado (app é superuser) | 🔴 segurança | fora de escopo |

---

## Baselines de compilação (MEDIDO local, antes de qualquer alteração)

| Verificação | Resultado |
|---|---|
| `backend: tsc -p tsconfig.docker.json --noEmit` | ✅ **exit 0**, zero erros |
| `messages-server: tsc --noEmit` | ✅ **exit 0**, zero erros |
| `frontend: tsc --noEmit` | ⚠️ erros **pré-existentes** (tipos gerados em `.next/types` + 1 erro real em `DocumentScanner.tsx:237`) — não bloqueiam o build: `next.config.js` tem `ignoreBuildErrors: true` |
| `docker compose config` | ❌ **falha** (achado #1) |

Estes são o ponto de partida: qualquer alteração minha deve manter backend e messages em exit 0.

---

## Métricas "antes" (para a comparação da ETAPA 5)

| Métrica | Valor | Origem |
|---|---|---|
| Serviços no compose | 6 | MEDIDO local |
| Containers com `mem_limit` | 6 de 6 | MEDIDO local |
| Containers com limite de CPU | **0 de 6** | MEDIDO local |
| Contexto de build (imagem principal) | **87 MB** | MEDIDO local (`COPY . /c` + `du -sm`) |
| `.git` | 63 MB | MEDIDO local |
| `node_modules` backend / frontend | 833 MB / 1.064 MB | MEDIDO local |
| `node_modules` de serviço removido (`digiurban-ai/`) | 356 MB | MEDIDO local |
| Pacotes instalados (back/front/msg) | 741 / 819 / 419 | MEDIDO local |
| `new PrismaClient()` em produção | 2 reais (de 39 ocorrências) | MEDIDO local |
| Imagem principal | 2.2 GB | VPS 2026-09-13 ⚠️ desatualizado |
| RAM somada dos containers | ~703 MB (8 containers) | VPS 2026-09-13 ⚠️ eram 8, hoje são 6 |
| Disco `/` da VPS | 96% → ~88% pós-limpeza | VPS 2026-09-13 ⚠️ |
| Tempo de build/deploy | **NÃO MEDIDO** | — |
| RAM/CPU com os novos limites | **NÃO MEDIDO** | nunca implantado (deploy bloqueado) |
| Tamanho das imagens no GHCR | **NÃO MEDIDO** | sem credencial de leitura |

---

## Conclusão da ETAPA 1

A aplicação **não é um caso de desperdício grosseiro** — a rodada anterior já resolveu o grosso.
O que resta é de outra natureza: **resíduo de mudanças incompletas**. Uma remoção de serviço que
parou no meio do caminho deixou um compose quebrado, um script que ressuscita a configuração
removida, três proxies apontando para o vazio e variáveis de ambiente de um serviço que não existe.

Isso é, por si só, o aprendizado mais transferível para o padrão da ETAPA 9: **remover um serviço
de uma aplicação Docker tem uma lista de verificação**, e pular qualquer item deixa a aplicação
num estado pior do que antes — porque agora ela carrega o custo da configuração morta sem nenhum
dos benefícios.

Nada foi alterado. O plano priorizado está em `docs/PLANO-OTIMIZACAO-VPS.md`.
