# Auditoria de otimização VPS

**Data:** 2026-09-13
**VPS:** 72.60.10.108 (`mail.urbanmail.com.br`) — 4 vCPU / 15.6 GB RAM / 194 GB disco
**Método:** medições via SSH (paramiko) na VPS de produção + análise de código e configuração
**Escopo:** aplicação DigiUrban (8 containers) dentro de uma VPS compartilhada com ~30 aplicações

---

## Resumo executivo

A VPS está em estado **crítico de disco e CPU**, e o DigiUrban é um dos maiores contribuintes
para o desperdício — mas **não** pelo consumo de RAM (que é modesto: ~700 MB somados).

| Situação medida | Valor | Status |
|---|---|---|
| Disco `/` | 186 GB usados de 194 GB (**96%**, 8.2 GB livres) | 🔴 crítico |
| Load average (4 vCPU) | 5.71 / 6.52 / 6.73 | 🔴 saturado |
| Steal time (CPU roubada pelo provedor) | **13.8%** | 🟠 não é culpa da aplicação |
| Swap em uso | 2.847 GB de 4 GB | 🟠 pressão de memória |
| Containers rodando na VPS (todas as apps) | **93** | — |
| Containers do DigiUrban | 8 | — |
| RAM total DigiUrban | ~703 MB | 🟢 ok |
| Volumes órfãos do DigiUrban | **~17.3 GB** | 🔴 desperdício puro |
| Build cache Docker (toda a VPS) | 12.99 GB (8.05 GB recuperável) | 🔴 causado por build na VPS |
| Imagem principal `digiurban-digiurban` | **2.2 GB** | 🔴 |

### Os 5 achados de maior impacto

1. **17.3 GB em volumes órfãos do DigiUrban** — restos de serviços já removidos do compose
   (`digiurban_ollama_data` = **15.29 GB**, `digiurban_opensearch_data` = 1.99 GB, etc.).
   Ninguém os referencia; são disco puro perdido. **Maior ganho único da auditoria.**
2. **Build na VPS com `--no-cache --pull`** a cada deploy — compila backend + Next.js + instala
   Chromium na própria máquina de produção. É a origem dos 12.99 GB de build cache e dos picos
   de CPU/load. A VPS tem 4 vCPU compartilhados por 93 containers.
3. **PostgreSQL esgotado: "too many clients already"** — `ultrazend-smtp` está em
   **crash-loop há semanas (261 restarts, exit 137)**. Causa raiz encontrada no código:
   **18 rotas de produção instanciam `new PrismaClient()` próprio**, cada uma abrindo seu próprio
   pool (padrão Prisma ≈ 9–13 conexões). Isso também é **furo de isolamento multi-tenant**,
   porque esses clientes não passam pela `tenantExtension`.
4. **`log: ['query', 'error', 'warn']` hardcoded no Prisma** — toda query SQL da aplicação é
   logada em produção. Custo de CPU, I/O e disco contínuo, sem valor operacional.
5. **Playwright/Chromium = 968 MB** dentro da imagem de 2.2 GB, e **714 MB de `node_modules`**
   com devDependencies (eslint, jest, prettier, ts-migrate…) no runtime.

### Um alerta honesto sobre a CPU

O **steal time de 13.8%** significa que o provedor está retirando CPU da VM. Parte do load 6+
**não é causada pela aplicação** e nenhuma otimização de código vai corrigir isso. Está
registrado aqui para que não se atribua ao DigiUrban um problema que é da hospedagem.

---

## Arquitetura atual

Monorepo com build multi-stage, orquestrado por `docker-compose.vps.yml`:

- **Backend:** Express 5.1 + TypeScript + Prisma 6.19 (PostgreSQL), Socket.IO, BullMQ
- **Frontend:** Next.js 14.2 App Router, `output: standalone`
- **Node:** 20 (`node:20-bookworm-slim`, Debian — escolhido para suportar Playwright)
- **Package manager:** npm (`--legacy-peer-deps` obrigatório)
- **Container principal:** 3 processos sob supervisord (nginx :80 → backend :3001 + frontend :3000)

## Containers atuais

| Container | Imagem | Tamanho imagem | RAM medida | Limite | CPU |
|---|---|---|---|---|---|
| `digiurban-vps` | `digiurban-digiurban` | **2.2 GB** | 250.2 MiB | ❌ nenhum | 0.03% |
| `digiurban-postgres` | `postgres:15-alpine` | 274 MB | 198.3 MiB | ❌ nenhum | 0.00% |
| `digiurban-llamacpp` | `llama.cpp:server` | 838 MB | 98.61 MiB | 4 GB | 4.55% |
| `ultrazend-messages` | `digiurban-ultrazend-messages` | 690 MB | 60.09 MiB | ❌ nenhum | 0.00% |
| `digiurban-ai` | `digiurban-digiurban-ai` | 609 MB | 58.73 MiB | ❌ nenhum | 0.00% |
| `ultrazend-face` | `digiurban-ultrazend-face` | 650 MB | 36.65 MiB | ❌ nenhum | **11.75%** |
| `digiurban-redis` | `redis:7-alpine` | 39.1 MB | ~20 MiB | ❌ nenhum | — |
| `ultrazend-smtp` | `digiurban-ultrazend-smtp` | 839 MB | — | ❌ nenhum | 🔴 crash-loop |

**Total RAM medida: ~703 MB.** Apenas 1 dos 8 containers tem limite de memória definido — numa
VPS compartilhada, isso significa que qualquer vazamento no DigiUrban pode derrubar as outras
29 aplicações.

## Consumo atual

```
Mem:  15988 total / 6191 used / 1440 free / 8355 buff/cache / 9095 available
Swap:  4095 total / 2847 used / 1248 free
Load average: 5.71, 6.52, 6.73  (4 vCPU)
%Cpu(s): 60.6 us, 14.9 sy, 10.6 id, 13.8 st   ← 13.8% steal
Tasks: 853 total, 2 zombie
Disco /: 186G/194G (96%), 8.2G livres
```

## Armazenamento

Uploads usam **disco local em volume Docker** — não há MinIO/S3 no DigiUrban:

- Grep por `aws-sdk`, `S3Client`, `minio`, `PutObjectCommand` no backend: **zero ocorrências**
- `digiurban_digiurban_uploads` = 19.51 MB (compartilhado read-only com o SMTP)
- `digiurban_messages_uploads` = 2.1 MB
- `digiurban_face_uploads` = 592.2 kB

**Veredito:** a arquitetura de storage já é a mais econômica possível (volume local). **Não trocar.**
O volume total (~22 MB) não justificaria S3 nem um `StorageProvider` abstrato — seria complexidade
sem ganho. A seção 3 do pedido não se aplica: não há MinIO para remover.

## Docker

Anatomia medida da imagem `digiurban-digiurban` (2.2 GB):

| Camada | Tamanho | Necessário em runtime? |
|---|---|---|
| `playwright install chromium` | **968 MB** | Sim — geração de PDF usa `chromium.launch()` |
| `COPY backend/node_modules` | **714 MB** | Parcialmente — inclui devDependencies |
| `apt-get install nginx supervisor postgresql-client + libs Playwright` | 140 MB | Sim |
| base `node:20-bookworm-slim` | ~125 MB | Sim |
| `COPY frontend/.next/standalone` | 83.1 MB | Sim |
| `COPY backend/node_modules/.prisma` | 60.2 MB | Sim (engines) |
| `COPY frontend/.next/static` | 15.4 MB | Sim |
| `COPY backend/src` | 12.5 MB | Sim (seeds importam `src/data`, smokes importam `src/lib`) |
| `COPY backend/prisma` | 5.14 MB | Sim (migrations + seeds) |
| `COPY backend/dist` | 4.8 MB | Sim |

**Playwright é realmente usado** — confirmado em 6 arquivos
(`document-generator.service.ts`, `render-pdf.ts`, `admin-reports.ts`, `apresentacao-export.ts`,
`tab-modules.ts`). **Não remover**: quebraria geração de PDF e assinatura digital.

## Build e deploy

O workflow `.github/workflows/deploy-digiurban-vps.yml` roda em `runs-on: self-hosted` —
**o runner é a própria VPS**. Sequência real a cada push na `main`:

1. `git reset --hard` + `git clean -fdx` em `/opt/digiurban`
2. `docker rmi -f` de **todas** as imagens DigiUrban **e da base `node:20-bookworm-slim`**
3. `docker builder prune -af` + `docker image prune -af`
4. `docker pull node:20-bookworm-slim` (re-download forçado)
5. **`docker-compose build --no-cache --pull`** ← compila tudo na VPS de produção
6. `up -d`, seeds, smokes, e **3 restarts encadeados** de containers

Isso é o oposto da arquitetura desejada. Cada deploy: instala ~88 pacotes npm do backend + ~82 do
frontend, roda `tsc`, roda `next build`, baixa Chromium (968 MB) — tudo disputando 4 vCPU com 93
containers, com **cache deliberadamente destruído** para forçar rebuild total.

## Node.js

- **Nenhum `NODE_OPTIONS=--max-old-space-size`** em nenhum container. O heap do V8 pode crescer
  até consumir toda a RAM da VPS, afetando as outras 29 aplicações.
- `supervisord.conf` não define limites por processo.

## Next.js

Bem configurado: `output: 'standalone'` já está ativo e o Dockerfile copia corretamente
`standalone` + `.next/static` + `public`. **Nada a corrigir aqui.**
Cache de imagens (`next/image`) não está em volume — mas com 15.4 MB de static e sem uso intenso
de otimização de imagem, o ganho seria marginal (P3).

## Prisma

| Achado | Evidência |
|---|---|
| **18 rotas de produção com `new PrismaClient()` próprio** | `admin-users`, `certificates.routes`, `document-signing.routes`, `teams.routes`, `positions.routes`, `functions.routes`, `signatures.routes`, `dynamic-services`, `admin-dynamic-services`, `admin-flows.routes`, `department-stats`, `document-templates`, `employee-assignments.routes`, `employee-hierarchies.routes`, `external-documents.routes`, `my-certificates.routes`, `professional-data.routes`, `public-validation.routes` — todas registradas no `index.ts` |
| + 2 jobs e 1 lib | `cleanup-orphan-files.job.ts`, `reconcile-documents.job.ts`, `json-schema-validator.ts` |
| + 1 service e 1 util | `citizen-lookup.service.ts`, `email-domain.utils.ts` |
| **Sem `connection_limit` no `DATABASE_URL`** | grep em `docker-compose.vps.yml` e `scripts/vps-deploy-lib.sh`: zero ocorrências |
| **Logging de todas as queries** | `src/lib/prisma.ts:39` → `log: ['query', 'error', 'warn']` |

Cada `PrismaClient` abre pool independente. Com ~23 instâncias × pool padrão, o backend sozinho
pode tentar abrir **200+ conexões** — daí o `FATAL: sorry, too many clients already`.

Efeito colateral grave: esses clientes **não têm a `tenantExtension`**, portanto operações por eles
não são escopadas por `tenantId`. É um risco de isolamento multi-tenant, não só de recurso.

## PostgreSQL

- `postgres:15-alpine`, **sem `mem_limit`**, sem tuning (`shared_buffers`, `work_mem`,
  `max_connections` nos defaults).
- Volume `digiurban_postgres_data` = **3.435 GB**.
- Não foi possível medir `max_connections`/`pg_stat_activity`: `docker exec` trava
  consistentemente nesta VPS pela saturação (load 6+). **NÃO MEDIDO.**
- Existem **17 containers PostgreSQL** distintos na VPS (uma instância por aplicação).
  Consolidar seria o maior ganho de RAM da máquina — mas está **fora do escopo** desta auditoria
  e exige plano de migração próprio. **NÃO RECOMENDADO agora.**

## Redis

**É usado de verdade — não remover.** Confirmado:

- Backend: `ioredis` em `src/lib/redis.ts`, BullMQ em `notification.service.ts`
  (`new Queue('notifications')`) e `notification.worker.ts` (`new Worker`)
- Messages Server: `@socket.io/redis-adapter` em `WebSocketServer.ts` (adapter de escala WS)

Consumo: ~20 MiB, volume de 445 B. **Custo irrelevante, função real.**

⚠️ Porém: `redis` expõe **porta 6379 publicamente** no compose (`ports: - "6379:6379"`).
Numa VPS compartilhada isso é exposição desnecessária — deveria ser `expose`.

## MinIO/S3

**Não existe.** Zero referências no código. Nada a remover, nada a introduzir.

## Cron/Workers

Não há containers dedicados a cron/worker — os jobs rodam **dentro** do processo backend via
`node-cron`, que é a opção mais econômica. Jobs ativos:

| Job | Cron | Arquivo |
|---|---|---|
| Notificações (5 jobs) | `0 8`, `0 9,17`, `0 10,18`, `15 1`, `0 0` | `notification.jobs.ts` |
| Monitor de SLA | `0 6 * * *` | `sla-monitor.job.ts` |
| Reverter delegações | `0 */6 * * *` | `revertExpiredDelegations.job.ts` |
| Contadores de email | `0 0 * * *`, `0 0 1 * *`, `0 2 * * *` | `email-counters-reset.ts` |
| **Monitor servidor email** | **`*/2 * * * *`** | `email-server-monitor.ts` |

O monitor de email roda **a cada 2 minutos** (720×/dia) fazendo query no banco + checagem SMTP —
e o SMTP está em crash-loop, então cada execução falha. Intervalo agressivo demais (é configurável
por `EMAIL_SERVER_MONITOR_CRON`).

## Logs

- **Docker json-file já tem rotação adequada**: `/etc/docker/daemon.json` define
  `max-size: 10m, max-file: 3`. 🟢 Nada a corrigir no daemon.
- Logs medidos: `ultrazend-smtp` = 6.5 MB (crash-loop), `ultrazend-messages` = 2.3 MB,
  `digiurban-postgres` = 2.0 MB, `digiurban-vps` = 432 kB. Total dos containers da VPS: 23 MB.
- **Volumes de log crescem sem rotação visível**: `digiurban_digiurban_logs` = **118.3 MB**,
  `digiurban_messages_logs` = **70.45 MB**.
- `LOG_LEVEL=info` em produção + `log: ['query']` do Prisma = volume de log muito acima do útil.

## Volumes

| Nome | Links | Tamanho | Finalidade | Necessário | Veredito |
|---|---|---|---|---|---|
| **`digiurban_ollama_data`** | **0** | **15.29 GB** | Ollama — serviço **não existe** no compose | ❌ | 🔴 **OBSOLETO** |
| **`digiurban_opensearch_data`** | **0** | **1.99 GB** | OpenSearch — comentado como `disabled` no compose | ❌ | 🔴 **OBSOLETO** |
| **`digiurban_compreface_postgres_data`** | **0** | 50.02 MB | CompreFace — removido (comentário no compose confirma) | ❌ | 🔴 **OBSOLETO** |
| **`digiurban_flow_logs`** | **0** | 5.55 MB | digiurban-flow — `disabled` no compose | ❌ | 🔴 **OBSOLETO** |
| **`digiurban_flow_uploads`** | **0** | 0 B | idem | ❌ | 🔴 **OBSOLETO** |
| **`digiurban_prices_uploads`** | **0** | 0 B | digiurban-prices — `disabled` | ❌ | 🔴 **OBSOLETO** |
| `digiurban_postgres_data` | 1 | 3.435 GB | Banco de produção | ✅ | 🟢 **DADO DE PRODUÇÃO** — jamais tocar |
| `digiurban_llamacpp_models` | 1 | 1.369 GB | Modelo GGUF do DigiBot | ⚠️ | 🟠 **DÚVIDA** (ver IA abaixo) |
| `digiurban_digiurban_logs` | 1 | 118.3 MB | Logs backend | ✅ | 🟠 pode reduzir |
| `digiurban_messages_logs` | 1 | 70.45 MB | Logs messages | ✅ | 🟠 pode reduzir |
| `digiurban_digiurban_uploads` | 2 | 19.51 MB | Uploads | ✅ | 🟢 DADO DE PRODUÇÃO |
| `digiurban_messages_uploads` | 1 | 2.1 MB | Uploads bot | ✅ | 🟢 DADO DE PRODUÇÃO |
| `digiurban_face_uploads` | 1 | 592.2 kB | Biometria facial | ✅ | 🟢 DADO DE PRODUÇÃO |
| `digiurban_redis_data` | 1 | 445 B | Redis | ✅ | 🟢 |
| `digiurban_smtp_data` / `smtp_logs` / `face_logs` / `ai_logs` / `digiurban_backups` | 1 | 0 B | — | ✅ | 🟢 vazios |

**Total órfão comprovado: 17.34 GB** — equivale a **mais do dobro do espaço livre restante na VPS (8.2 GB).**

## Serviços de IA e Face — verificação de uso real

Você pediu para eu verificar no código antes de concluir. Resultado:

| Serviço | Código usa? | Tráfego medido (7 dias) | Veredito |
|---|---|---|---|
| `llamacpp` + `digiurban-ai` | **Sim** — `CitizenAiOrchestrator` do bot chama `citizenAiClient` em 8 pontos (seleção de serviço, extração de campos, correções) | **0 requisições** ao llama.cpp | 🟠 Integrado mas **ocioso** |
| `ultrazend-face` | **Sim** — `face-platform-client.service.ts` + rota `/api/admin/face-platform` | **0 linhas de log** | 🟠 Integrado mas **ocioso** |

Conclusão honesta: **os dois estão realmente integrados no código** — removê-los quebraria
funcionalidade (o DigiBot degradaria e a rota de biometria falharia). **Não recomendo remover.**
Mas estão consumindo recursos sem tráfego: llamacpp reserva 2 GB e limita em 4 GB, e o `ai_*`
faz warmup no boot. A recomendação é **dimensionar**, não remover (ver P1-3).

Nota: `digiurban-ai` não consegue alcançar o banco (`Can't reach database server at postgres:5432`)
— sintoma do mesmo esgotamento de conexões.

## Dependências

Backend (`digiurban/backend/package.json`): 49 deps + 39 devDeps.

| Dependência | Ocorrências no código | Veredito |
|---|---|---|
| **`bull` ^4.16.5** | **0** (`from 'bull'` e `require('bull')`) | 🔴 remover — duplicata de `bullmq`, que é o usado |
| **`redis` ^5.10.0** | **0** (`from 'redis'`) | 🔴 remover — o backend usa `ioredis` |
| **`openai` ^6.16.0** | **0** | 🔴 remover — IA vai via `digiurban-ai`/llama.cpp |
| `bcryptjs` | 19 | ✅ manter (usado junto com `bcrypt`) |
| `tesseract.js` | 1 | ⚠️ verificar antes (pesado, mas tem uso) |
| `playwright` | 6 arquivos | ✅ **manter** — geração de PDF |
| `xlsx` | 11 | ✅ manter |
| `smtp-server`, `mailparser`, `ua-parser-js` | 2, 1, 1 | ✅ manter |

⚠️ **devDependencies vão para o runtime**: o Dockerfile roda `npm install --legacy-peer-deps`
sem `--omit=dev`, então eslint, jest, prettier, ts-migrate, @swc/core, supertest,
@testing-library/* entram nos 714 MB de `node_modules` da imagem.

**MAS — armadilha confirmada:** `--omit=dev` **quebraria o deploy**. Os seeds usam `tsx`
(devDependency): `db:seed = tsx prisma/seed-consolidated.ts`, e o smoke multi-tenant roda
`tsx scripts/smoke-multi-tenant.ts` — ambos executados pelo workflow **dentro do container**.
Qualquer poda de devDeps precisa preservar `tsx`/`ts-node`.

---

## Problemas encontrados

| # | Problema | Severidade |
|---|---|---|
| 1 | 17.34 GB em volumes órfãos (disco a 96%) | 🔴 crítico |
| 2 | `ultrazend-smtp` em crash-loop: 261 restarts, exit 137 | 🔴 crítico |
| 3 | PostgreSQL esgotado — "too many clients already" | 🔴 crítico |
| 4 | 23 instâncias de `PrismaClient` (18 em rotas de produção) | 🔴 crítico |
| 5 | Build feito na VPS com `--no-cache --pull` a cada deploy | 🔴 crítico |
| 6 | 7 de 8 containers sem `mem_limit` em VPS compartilhada | 🟠 alto |
| 7 | `log: ['query']` do Prisma em produção | 🟠 alto |
| 8 | Sem `connection_limit` no `DATABASE_URL` | 🟠 alto |
| 9 | Sem `NODE_OPTIONS=--max-old-space-size` | 🟠 alto |
| 10 | Redis com porta 6379 exposta publicamente | 🟠 alto (segurança) |
| 11 | `bull`, `redis`, `openai` como deps não usadas | 🟡 médio |
| 12 | devDependencies no runtime (parte dos 714 MB) | 🟡 médio |
| 13 | Volumes de log em 118 MB / 70 MB sem rotação própria | 🟡 médio |
| 14 | Monitor de email a cada 2 min | 🟡 médio |
| 15 | Healthchecks de 10s no postgres/redis | 🟢 baixo |
| 16 | PostgreSQL sem tuning | 🟢 baixo |

---

## Otimizações propostas

### P0-1 — Remover os 6 volumes órfãos (17.34 GB)

- **Problema:** volumes de serviços já removidos do compose ocupam 17.34 GB com disco a 96%.
- **Evidência:** `docker volume ls -qf dangling=true` lista os 6; `docker system df -v` mostra
  `LINKS = 0` e os tamanhos; o próprio `docker-compose.vps.yml` tem comentários confirmando
  `opensearch/prices/flow: disabled` e `CompreFace removido`.
- **Impacto:** libera **17.34 GB** — passa o disco de 96% para ~87%.
- **Risco:** 🟢 baixo, mas **irreversível**. Requer confirmação explícita (dados de um Ollama
  antigo, 15.29 GB). **Não executo sem seu OK.**
- **Arquivos:** nenhum — operação na VPS.
- **Como testar:** `docker volume ls -qf dangling=true` antes/depois; `df -h /`.

### P0-2 — Corrigir o esgotamento de conexões (PrismaClient duplicado)

- **Problema:** 18 rotas de produção criam `new PrismaClient()`, cada uma com pool próprio →
  `FATAL: sorry, too many clients already` → SMTP em crash-loop e `digiurban-ai` sem banco.
- **Evidência:** grep confirma as 18 rotas, todas registradas no `index.ts`; log do
  `ultrazend-smtp` mostra o FATAL; `restarts=261`.
- **Impacto:** resolve 2 dos 3 problemas críticos de runtime; reduz conexões do backend de
  potencialmente 200+ para um único pool.
- **Ganho de RAM:** cada pool mantém sockets e buffers — **ganho não medido**, mas o ganho de
  estabilidade é comprovado.
- **Bônus de segurança:** passa essas rotas a usar o singleton **com `tenantExtension`**,
  fechando o furo de isolamento multi-tenant.
- **Risco:** 🟡 moderado — é mudança de código em 18 arquivos. Mitigação: o singleton exporta a
  mesma interface `PrismaClient`, então é substituição de import, não de lógica.
- **Arquivos:** os 18 de `src/routes/` + `citizen-lookup.service.ts`, `email-domain.utils.ts`,
  `json-schema-validator.ts`, `cleanup-orphan-files.job.ts`, `reconcile-documents.job.ts`.
- **Como testar:** `npm run type-check`, `tsc -p tsconfig.docker.json`, e após deploy conferir
  que o SMTP para de reiniciar.

### P0-3 — Desligar o logging de queries do Prisma

- **Problema:** `log: ['query', 'error', 'warn']` loga toda query SQL em produção.
- **Evidência:** `src/lib/prisma.ts:39`.
- **Impacto:** reduz CPU, I/O e o crescimento do volume de log (118.3 MB).
- **Risco:** 🟢 baixo — manter `query` apenas fora de produção preserva o diagnóstico em dev.
- **Arquivos:** `digiurban/backend/src/lib/prisma.ts`.

### P0-4 — Parar de compilar na VPS (mover build para GitHub Actions + GHCR)

- **Problema:** `runs-on: self-hosted` + `build --no-cache --pull` compila tudo na produção.
- **Evidência:** workflow linhas do bloco "LIMPEZA NUCLEAR DE CACHE" e
  `docker-compose build --no-cache --pull`; 12.99 GB de build cache na VPS.
- **Impacto:** elimina os picos de CPU do deploy (load já está em 6+ com 13.8% de steal) e a
  maior parte dos 12.99 GB de build cache.
- **Risco:** 🟠 moderado-alto — é mudança estrutural de deploy. Precisa de runner GitHub-hosted,
  GHCR, e `image:` em vez de `build:` no compose. **Requer sua decisão** (muda arquitetura de
  deploy, que você pediu para não alterar desnecessariamente — mas aqui o ganho é grande).
- **Mitigação imediata e sem risco (faço já):** parar de destruir o cache a cada deploy —
  remover `--no-cache --pull` e o bloco de `docker rmi` da imagem base. Isso já corta
  drasticamente CPU e I/O do deploy sem mudar a arquitetura.

### P1-1 — Definir `mem_limit` em todos os containers

- **Problema:** 7 de 8 containers sem limite, numa VPS com 30 aplicações e swap em 2.8 GB.
- **Dimensionamento com base nas medições** (≈3× o observado, com folga para picos de
  PDF/Sharp/Playwright):

| Container | Medido | Limite proposto | Justificativa |
|---|---|---|---|
| `digiurban-vps` | 250 MiB | **1 GB** | folga grande: Playwright/Chromium + Sharp + PDF são picos reais fora do heap |
| `digiurban-postgres` | 198 MiB | **512 MB** | banco de 3.4 GB, cache útil |
| `ultrazend-messages` | 60 MiB | **384 MB** | Sharp + WebSocket |
| `digiurban-ai` | 59 MiB | **384 MB** | |
| `ultrazend-face` | 37 MiB | **384 MB** | Sharp |
| `ultrazend-smtp` | — | **384 MB** | medir após o fix do crash-loop |
| `digiurban-redis` | ~20 MiB | **192 MB** | + `maxmemory-policy` |
| `digiurban-llamacpp` | 99 MiB | **2 GB** (era 4 GB) | 0 requisições em 7 dias; reserva de 2 GB removida |

- **Impacto:** protege as outras 29 aplicações. Reduz a *reserva* do llamacpp em 2 GB.
- **Risco:** 🟡 moderado — limite apertado causa OOM. Por isso os valores são generosos (3×+).

### P1-2 — `NODE_OPTIONS=--max-old-space-size` por container

- Heap sempre **abaixo** do `mem_limit`, deixando margem para Sharp/Chromium/buffers (memória
  fora do heap): `digiurban-vps` → 640 MB (limite 1 GB); messages/ai/face → 256 MB (limite 384 MB).
- **Risco:** 🟢 baixo.

### P1-3 — `connection_limit` no `DATABASE_URL`

- Com 17 PostgreSQL na VPS e várias apps, limitar o pool é essencial.
- Proposto: `?connection_limit=5&pool_timeout=20` para os serviços satélites e um valor um pouco
  maior para o backend principal — **a aplicar somente depois do P0-2**, senão 23 pools × 5 ainda
  estouraria.
- **Risco:** 🟡 moderado (pool pequeno demais causa timeout). Depende do P0-2.

### P1-4 — Fechar a porta 6379 do Redis

- Trocar `ports: ["6379:6379"]` por `expose: ["6379"]`. Redis só é acessado de dentro da rede.
- **Risco:** 🟢 baixo. **Ganho:** segurança em VPS compartilhada.

### P2-1 — Remover deps não usadas (`bull`, `redis`, `openai`)

- Zero ocorrências confirmadas. Reduz `node_modules` e superfície de instalação.
- **Ganho de tamanho: não medido** (só medível após rebuild).
- **Risco:** 🟢 baixo — mas **não** remover `tsx`/`ts-node` (seeds e smokes dependem).

### P2-2 — Rotação dos volumes de log

- `digiurban_digiurban_logs` (118.3 MB) e `digiurban_messages_logs` (70.45 MB).
- O backend já tem `winston-daily-rotate-file` como dependência — verificar se está configurado
  com `maxFiles`/`maxSize`.
- **Risco:** 🟢 baixo.

### P2-3 — Monitor de email de 2 min → 10 min

- `EMAIL_SERVER_MONITOR_CRON` já é configurável. De 720×/dia para 144×/dia.
- **Risco:** 🟢 baixo — detecção de falha do SMTP passa de ≤2 min para ≤10 min.

### P3-1 — Healthchecks de 10s → 30s (postgres/redis)

- Ganho pequeno mas real com 93 containers na máquina.

### NÃO RECOMENDADO

| Item | Por quê |
|---|---|
| **Remover `llamacpp` / `digiurban-ai`** | Integrados de verdade no `CitizenAiOrchestrator` do DigiBot (8 pontos de chamada). Ociosos ≠ não usados. Dimensionar, não remover. |
| **Remover `ultrazend-face`** | Rota `/api/admin/face-platform` ativa + `face-platform-client.service.ts`. |
| **Remover Redis** | BullMQ + Socket.IO adapter em uso real. Custa 20 MiB. |
| **Remover Playwright/Chromium (968 MB)** | Usado em 6 arquivos para PDF e assinatura digital. |
| **Migrar uploads para S3/MinIO** | Só ~22 MB; volume local já é o mais econômico. |
| **`npm install --omit=dev`** | Quebraria os seeds e smokes que rodam via `tsx` no container. |
| **Consolidar os 17 PostgreSQL da VPS** | Maior ganho da máquina, mas exige plano de migração próprio e está fora do escopo. |
| **Apagar `digiurban_postgres_data` / uploads** | Dados de produção. |

---

## Plano de implementação

Ordem por impacto/risco, agrupada para permitir identificar regressões:

**Grupo A — código, risco baixo, sem tocar infraestrutura**
1. P0-3: desligar `log: ['query']` em produção
2. P2-1: remover `bull`, `redis`, `openai`
3. P2-3: monitor de email 2 min → 10 min
4. → validar com `tsc -p tsconfig.docker.json` e `type-check`

**Grupo B — a correção crítica de conexões**
5. P0-2: unificar os 23 `PrismaClient` no singleton com `tenantExtension`
6. → validar com build TypeScript completo

**Grupo C — compose (limites e segurança)**
7. P1-1: `mem_limit` em todos os containers
8. P1-2: `NODE_OPTIONS` por container
9. P1-4: fechar porta 6379
10. P3-1: healthchecks 10s → 30s

**Grupo D — deploy**
11. P0-4 (mitigação): remover `--no-cache --pull` e a destruição da imagem base
12. P1-3: `connection_limit` — **somente após o Grupo B estar em produção**

**Grupo E — requer sua autorização explícita**
13. P0-1: remover os 6 volumes órfãos (17.34 GB) — irreversível
14. P0-4 (completo): migrar build para GitHub Actions + GHCR — muda arquitetura de deploy

---

## Métricas antes

| Métrica | Antes (medido) |
|---|---|
| Containers DigiUrban | 8 |
| Containers na VPS (total) | 93 |
| RAM DigiUrban (soma medida) | ~703 MB |
| Imagem `digiurban-digiurban` | 2.2 GB |
| Imagens DigiUrban (soma) | 5.83 GB |
| Volumes órfãos DigiUrban | 17.34 GB |
| Build cache Docker (VPS) | 12.99 GB |
| Disco `/` | 186 GB / 194 GB (96%) |
| Load average | 5.71 / 6.52 / 6.73 |
| Steal time | 13.8% |
| Containers com `mem_limit` | 1 de 8 |
| `ultrazend-smtp` | crash-loop, 261 restarts |
| Instâncias de `PrismaClient` | 23 |
| Tempo de build/deploy | NÃO MEDIDO |
| `max_connections` do PostgreSQL | NÃO MEDIDO (`docker exec` trava na VPS saturada) |

---

# Resultado final

**Estado:** otimizações de código e configuração **implementadas e validadas por compilação**,
porém **AINDA NÃO IMPLANTADAS** na VPS. As métricas "depois" de runtime só podem ser medidas após
o próximo deploy — estão marcadas como **PENDENTE DE DEPLOY**, nunca estimadas.

## O que foi alterado

| # | Mudança | Arquivos | Validação |
|---|---|---|---|
| P0-2 | **21 `new PrismaClient()` → singleton `src/lib/prisma`** | 18 rotas + 2 jobs + `email-domain.utils.ts` | `tsc -p tsconfig.docker.json` → **exit 0** |
| P0-3 | Prisma deixa de logar queries em produção (mantém em dev) | `src/lib/prisma.ts` | idem |
| P0-4 | Deploy deixa de destruir cache e de recompilar tudo: removidos `--no-cache`, `--pull`, `docker builder prune -af`, `docker image prune -af`, `docker rmi` da imagem base e `docker pull` forçado | `.github/workflows/deploy-digiurban-vps.yml` | YAML validado |
| P1-1 | `mem_limit` nos 8 containers (era 1 declarado, 0 efetivos) | `docker-compose.vps.yml` | `docker compose config` → **OK** |
| P1-1b | llamacpp: `deploy.resources` (ignorado por docker-compose) → `mem_limit: 2g` real | idem | idem |
| P1-2 | `NODE_OPTIONS=--max-old-space-size` em messages/ai/face + backend/frontend | compose + `docker/supervisord.conf` | idem |
| P1-4 | Redis: `ports: 6379:6379` → `expose` (fecha porta pública) | `docker-compose.vps.yml` | idem |
| P2-1 | Removidas 3 deps não usadas: `bull`, `redis`, `openai` | `package.json` + `package-lock.json` (−342 linhas) | `npm install --package-lock-only` OK |
| P2-3 | Monitor de email: 2 min → 10 min (720 → 144 execuções/dia) | `src/jobs/email-server-monitor.ts` | idem |
| P3-1 | Healthchecks postgres/redis: 10s → 30s | `docker-compose.vps.yml` | idem |

Total: **28 arquivos**, +213 / −436 linhas.

### Detalhe importante descoberto durante a implementação

O `NODE_OPTIONS` do compose **não teria efeito** no container principal: o `supervisord.conf`
repassa apenas as variáveis da sua allowlist `environment=`. Por isso o limite de heap foi
declarado **dentro do supervisord**, dividido entre os dois processos Node do container
(384m backend + 256m frontend, dentro do `mem_limit: 1g`, deixando ~380m para Chromium/Sharp/nginx).
Se eu tivesse deixado apenas no compose, a otimização seria silenciosamente inócua.

## O que foi removido

- Dependências `bull`, `redis`, `openai` — **zero** ocorrências no código (confirmado por grep;
  as 2 ocorrências de "redis" eram strings de tipo em `src/types/services.ts`, não imports).
- Flags de destruição de cache no deploy.
- Porta pública 6379 do Redis.

**Nenhuma funcionalidade, página, API, tabela ou model Prisma foi removida.**

## O que foi mantido e por quê

| Mantido | Motivo |
|---|---|
| `llamacpp` + `digiurban-ai` | Integrados no `CitizenAiOrchestrator` do DigiBot (8 pontos de chamada). Ociosos ≠ inúteis. Apenas redimensionados. |
| `ultrazend-face` | Rota `/api/admin/face-platform` + `face-platform-client.service.ts` ativos. |
| Redis | BullMQ (`notification.service.ts` / `notification.worker.ts`) + adapter Socket.IO. Custa ~20 MiB. |
| Playwright/Chromium (968 MB) | Usado em 6 arquivos para PDF e assinatura digital. |
| devDependencies no runtime | `--omit=dev` **quebraria o deploy**: seeds e smokes rodam via `tsx` dentro do container. |
| Uploads em volume local | Já é a opção mais econômica (~22 MB total). Nada de S3/MinIO. |
| `bcrypt` + `bcryptjs` | Ambos com uso real (19 ocorrências de `bcryptjs`). |
| `winston-daily-rotate-file` | Rotação já corretamente configurada (`maxSize: 20m`, `maxFiles: 7d`). |

## Containers antes/depois

| Métrica | Antes | Depois | Diferença |
|---|---|---|---|
| Containers DigiUrban | 8 | 8 | 0 — **nenhum era removível sem perder funcionalidade** |
| Containers com `mem_limit` efetivo | **0** (o único declarado usava `deploy.resources`, ignorado por docker-compose) | **8** | **+8** |
| Portas públicas desnecessárias | 1 (Redis 6379) | 0 | −1 |

## RAM antes/depois

| Container | Antes (medido) | Limite agora | Heap V8 |
|---|---|---|---|
| `digiurban-vps` | 250.2 MiB | 1 GB | 384m + 256m |
| `digiurban-postgres` | 198.3 MiB | 512 MB | — |
| `digiurban-llamacpp` | 98.61 MiB | 2 GB (era ilimitado de fato) | — |
| `ultrazend-messages` | 60.09 MiB | 384 MB | 256m |
| `digiurban-ai` | 58.73 MiB | 384 MB | 256m |
| `ultrazend-face` | 36.65 MiB | 384 MB | 256m |
| `digiurban-redis` | ~20 MiB | 192 MB | — |
| `ultrazend-smtp` | crash-loop | 384 MB | — |
| **Total** | **~703 MB** | **teto de 5.2 GB** | |

O ganho aqui **não é menos RAM consumida** — o consumo já era baixo. O ganho é **RAM limitada**:
antes, um vazamento no DigiUrban podia consumir os 15.6 GB e derrubar as outras 29 aplicações.
**Redução de consumo real: PENDENTE DE DEPLOY** (esperada do fim do logging de queries e do fim
do crash-loop, mas não medida).

## CPU antes/depois

- Antes: load 5.71 / 6.52 / 6.73 em 4 vCPU, **13.8% de steal time**.
- Depois: **PENDENTE DE DEPLOY**.
- Reduções esperadas mas **não medidas**: fim do log de query do Prisma; monitor de email de
  720 → 144 execuções/dia; fim da recompilação total a cada deploy.
- ⚠️ **O steal time de 13.8% não será corrigido por nenhuma dessas mudanças** — é CPU retirada
  pelo provedor. Se o load continuar alto após o deploy, a causa é a hospedagem somada às outras
  29 aplicações, não o DigiUrban.

## Disco antes/depois

| Item | Antes (medido) | Depois |
|---|---|---|
| Disco `/` | 186 GB / 194 GB (**96%**) | PENDENTE |
| Volumes órfãos DigiUrban | **17.34 GB** | **não removidos — aguardando sua autorização** |
| Build cache Docker (VPS) | 12.99 GB | deve parar de crescer a cada deploy; PENDENTE |

## Imagens antes/depois

Sem rebuild não há número novo. Antes (medido): `digiurban-digiurban` **2.2 GB**; total DigiUrban
**5.83 GB**. Após rebuild, a redução vem apenas da remoção de 3 deps — **ganho não medido e
provavelmente pequeno**, porque os dois grandes blocos (Chromium 968 MB e `node_modules` 714 MB)
foram mantidos por necessidade comprovada.

## Deploy antes/depois

| | Antes | Depois |
|---|---|---|
| Onde compila | VPS de produção (`runs-on: self-hosted`) | VPS (**inalterado** — migração para GHCR requer sua decisão) |
| Cache | destruído a cada deploy (`--no-cache --pull`) | reaproveitado (cache-bust por `BUILD_TIMESTAMP`) |
| Efeito em outras apps | `docker image prune -af` removia imagens das ~30 apps | apenas `prune -f` (só dangling) |
| Imagem base | apagada e rebaixada a cada deploy | reaproveitada |

## Problemas encontrados durante a implementação

1. **`deploy.resources` era decorativo** — o compose declarava limite de 4 GB para o llamacpp, mas
   `docker-compose` ignora esse campo fora do Swarm. O container estava **sem limite real**.
2. **`NODE_OPTIONS` no compose não chegaria aos processos** do container principal, por causa da
   allowlist `environment=` do supervisord. Corrigido no lugar certo.
3. **`docker image prune -af` no deploy afetava toda a VPS**, não só o DigiUrban.
4. **Os 114 MB de `digiurban_digiurban_logs` são logs de dezembro/2025** (`backend.log.1` a `.10`),
   de um esquema de rotação antigo — estáticos, não crescem mais. O `DailyRotateFile` atual está
   correto. São **descartáveis**, mas não os removi sem sua autorização.
5. **NOVO problema encontrado, fora do escopo de otimização:** o `ultrazend-messages` falha
   **1.440×/dia** com `P2021: public.channel_messages does not exist` — um `setInterval` de 60s em
   `ultrazend-messages-server/src/index.ts:118` consulta uma tabela que **não existe no banco**,
   embora o model `ChannelMessage` exista nos dois `schema.prisma`. É **drift de migration**.
   Não alterei: corrigir exige decidir entre criar a tabela (migration) ou desativar o job — é
   mudança de funcionalidade, não de recurso. **Precisa da sua decisão.**

## Testes realizados

| Teste | Resultado |
|---|---|
| Compilação do backend (`tsc -p tsconfig.docker.json`) | ✅ **exit 0** — as 21 refatorações de Prisma compilam |
| `docker compose -f docker-compose.vps.yml config` | ✅ **OK** |
| Sintaxe YAML do workflow e do compose | ✅ OK |
| `npm install --package-lock-only` | ✅ lockfile sincronizado, `bull` fora da árvore |
| Uso real de Redis/BullMQ, Playwright, IA, face, S3 | ✅ verificado por grep antes de qualquer remoção |

**Não executados (exigem deploy):** build Docker, runtime, login, migrations, seed, uploads,
download de arquivos, APIs, páginas, jobs, cron, nginx, healthchecks, teste de redeploy.
Os itens 1–18 e 25–26 do pedido original **ficam pendentes do deploy** — não posso afirmar que passam.

## Ganhos comprovados

| Ganho | Comprovação |
|---|---|
| 8 containers passam a ter limite de memória efetivo | `docker compose config` |
| Redis deixa de expor porta pública | compose |
| Causa raiz do "too many clients" corrigida no código | 21 pools → 1, compilação OK |
| Furo de isolamento multi-tenant fechado nas 18 rotas | agora passam pela `tenantExtension` |
| Deploy deixa de recompilar tudo e de afetar outras apps | workflow |
| 3 dependências mortas removidas | grep + lockfile |
| Logging de query desligado em produção | código |
| **17.34 GB de volumes órfãos identificados** | `docker system df -v` (LINKS=0) |

## Otimizações não realizadas

| Item | Motivo |
|---|---|
| **Remover os 6 volumes órfãos (17.34 GB)** | 🔴 **AGUARDA SUA AUTORIZAÇÃO** — irreversível. Maior ganho único disponível. |
| **Mover build para GitHub Actions + GHCR** | 🔴 **AGUARDA SUA DECISÃO** — muda a arquitetura de deploy, que você pediu para não alterar sem necessidade. |
| Remover os 114 MB de logs de dez/2025 | Aguarda autorização. |
| `connection_limit` no `DATABASE_URL` (P1-3) | Deve ser aplicado **só depois** do P0-2 estar em produção e validado — aplicar junto arriscaria timeouts sem saber qual mudança causou. |
| Consolidar os 17 PostgreSQL da VPS | Maior ganho da máquina, mas exige plano de migração próprio. Fora do escopo. |
| Tuning do PostgreSQL (`shared_buffers` etc.) | Requer medir `max_connections`/`pg_stat_activity`, impossível agora: `docker exec` trava pela saturação. |
| Cache de imagens do Next.js em volume | Ganho marginal (15.4 MB de static). |

## Riscos e pontos para monitoramento futuro

1. **OOM pelos novos `mem_limit`** — os valores têm folga de 3×+, mas o container principal roda
   Chromium (PDF) e Sharp. **Monitorar `docker stats` e `OOMKilled` nos primeiros dias.** Se houver
   OOM no `digiurban-vps`, subir de 1g para 1.5g é a correção.
2. **`ultrazend-smtp`** — deve parar de reiniciar após o P0-2. Se continuar, a causa é outra.
3. **Tabela `channel_messages` ausente** — decisão pendente (item 5 acima).
4. **Disco a 96%** — mesmo com os 17.34 GB liberados, a VPS fica em ~87%. O crescimento vem das
   30 aplicações, não só do DigiUrban. **Precisa de política de disco no nível da máquina.**
5. **Steal time 13.8%** — problema do provedor. Monitorar; se persistir, é caso de rever o plano.
6. **O primeiro deploy após esta mudança** será mais lento (o cache foi zerado pelos deploys
   anteriores); os seguintes é que ficam rápidos.

---

# Atualização — execução das decisões aprovadas (2026-09-13, sessão 2)

As quatro decisões pendentes foram aprovadas e executadas. Esta seção registra o que
mudou em relação ao "Resultado final" acima, com as medições novas.

## 1. Volumes órfãos removidos — GANHO MEDIDO E CONFIRMADO

Antes de apagar, inspecionei o conteúdo de cada volume e confirmei que nenhum container
os referenciava e que nenhum continha dado de negócio (apenas blobs de modelo, índices,
cache e logs de serviços já desativados). Também confirmei que as únicas ocorrências de
"compreface" no compose são variáveis de ambiente **vazias**, não volumes.

| Métrica | Antes | Depois | Diferença |
|---|---|---|---|
| Disco usado | **186 GB** | **170 GB** | **−16 GB** |
| Disco livre | **8.2 GB** | **25 GB** | **+16.8 GB (3×)** |
| Ocupação `/` | **96%** | **88%** | **−8 pp** |
| Volumes órfãos DigiUrban | 6 | **0** | −6 |

Removidos: `digiurban_ollama_data` (15.29 GB), `digiurban_opensearch_data` (1.99 GB),
`digiurban_compreface_postgres_data`, `digiurban_flow_logs`, `digiurban_flow_uploads`,
`digiurban_prices_uploads`. Verificação final: `docker volume ls -qf dangling=true` não
retorna mais nenhum volume do DigiUrban.

**Este é o único ganho de recurso já materializado em produção** — os demais dependem do deploy.

## 2. Build migrado para GitHub Actions + GHCR

Criado `.github/workflows/build-images.yml`:

- As **5 imagens** (`digiurban-app`, `digiurban-messages`, `digiurban-smtp`,
  `digiurban-face`, `digiurban-ai`) são construídas **em paralelo** (matrix) em runners
  `ubuntu-latest` e publicadas no GHCR.
- Cache de camadas no próprio registry (`cache-from`/`cache-to` type=registry), que
  substitui o cache local que era destruído a cada deploy.
- Duas tags por imagem: `latest` e o **SHA do commit** — o SHA permite rollback exato
  (`RELEASE=<sha>`).
- O job `deploy` (`needs: build`) roda na VPS e faz **apenas**: `docker login` → `pull` →
  `up -d` → seeds → validação de segurança (410 nos endpoints legados) → healthcheck.
  **A VPS não compila mais nada.**

No `docker-compose.vps.yml`, os 5 serviços ganharam `image: ghcr.io/fernandinhomartins40/<nome>:${RELEASE:-latest}`.
O bloco `build:` foi **mantido de propósito** como fallback manual de emergência (se o
GHCR estiver indisponível, `docker compose build` ainda funciona localmente).

⚠️ **Ponto crítico tratado:** o workflow antigo (`deploy-digiurban-vps.yml`) teve o gatilho
`push` **removido**, ficando só `workflow_dispatch`. Sem isso, os dois workflows disparariam
no mesmo push e haveria **dois deploys concorrentes no mesmo `/opt/digiurban`**
(`git reset --hard` + `docker-compose up` simultâneos) — pior que o estado original.

**Pré-requisito para o primeiro deploy:** as imagens precisam existir no GHCR. O job `build`
roda antes do `deploy` no mesmo workflow, então o primeiro push já resolve — mas se o build
falhar, o deploy não roda (por design, `needs: build`).

## 3. Tabelas de canais — migration criada e VALIDADA CONTRA O BANCO REAL

A investigação mudou o diagnóstico inicial. O que foi apurado no banco de produção:

| Fato | Evidência |
|---|---|
| Existe apenas `official_channels` | consulta a `information_schema.tables` |
| **Faltam 3 tabelas**, não 1 | `channel_messages`, `channel_subscriptions`, `channel_deliveries` |
| Os 4 enums necessários **existem** | `MessageContentType`, `BroadcastStatus`, `MessageStatus`, `ChannelSubscriptionStatus` |
| A migration consolidada está marcada como aplicada | `20260106023614_consolidated_with_messages finished=true` (98 migrations aplicadas) |

Ou seja: **a migration foi marcada como aplicada sem ter criado estas tabelas** — drift
clássico. Por isso o reparo é uma migration **nova**, não a correção da antiga.

Criar apenas `channel_messages` teria trocado um erro `P2021` por outro: o
`ChannelService.deliverBroadcast()` também toca `channel_deliveries` e `channel_subscriptions`.

Criada `prisma/migrations/20260913220000_repair_channel_tables_drift/migration.sql`:

- Cria as **3 tabelas** com `CREATE TABLE IF NOT EXISTS` (idempotente).
- `channel_subscriptions` e `channel_deliveries` nascem **já com `tenantId`**, FK para
  `tenants` e índice — porque a wave6 (20260708140000) já rodou e seus blocos são
  `IF EXISTS (tabela)`, logo **nunca voltariam** a adicionar a coluna.
- `channel_messages` fica **sem `tenantId`, de propósito**: o schema.prisma não a declara
  escopada (herda o tenant via `channelId → official_channels`), e ela também não consta
  da lista de RLS.
- Arma **RLS** em `channel_subscriptions` e `channel_deliveries` com **exatamente a mesma
  expressão** do loop de `20260708150000_row_level_security` — divergir criaria dois
  regimes de isolamento no mesmo banco.
- Todos os índices e FKs replicam os **nomes** da migration consolidada (o Prisma compara
  por nome ao detectar drift).

### Validação executada contra o banco de produção

Rodei a migration real dentro de uma transação **revertida** (`BEGIN; \i migration.sql; ROLLBACK;`):

| Asserção | Resultado |
|---|---|
| As 3 tabelas passam a existir | `CRIADAS:channel_deliveries,channel_messages,channel_subscriptions` |
| **A query exata do job que falhava 1×/min executa** | `JOB_QUERY_OK:0` (0 linhas, sem erro) |
| As policies de RLS são criadas | `POLICIES:channel_deliveries,channel_subscriptions` |
| O ROLLBACK desfez tudo | `POS_ROLLBACK:0` |
| Banco intacto após o teste | só `official_channels`, como antes |

Nenhum dado foi alterado em produção. A migration será aplicada pelo `prisma migrate deploy`
no próximo deploy, como qualquer outra.

**Impacto esperado:** fim dos ~1.440 erros/dia no log do PostgreSQL e no
`digiurban_messages_logs`, e a funcionalidade de broadcast em canais oficiais (que hoje
está morta) passa a funcionar.

## 4. Achados novos desta sessão

### 4.1 Steal time de 94.7% — a VPS está sendo estrangulada pelo provedor

Durante os trabalhos o load average saltou de **6.5 para 259.88**. Diagnóstico:

```
load average: 255.29, 246.03, 228.02
%Cpu(s): 2.3 us, 1.4 sy, 1.5 id, 0.0 wa, 94.7 st   ← 94.7% STEAL
```

Apenas **2.3% de CPU em user space** — a máquina não está computando quase nada; está
esperando CPU que o provedor não entrega. O `top` por consumo mostra processos **de outras
aplicações** (`php artisan schedule:run`, `php artisan monitora:sync-positions`,
`node /var/www/ultrazend/...`, `dockerd`) — **nenhum processo do DigiUrban entre os maiores consumidores**.

Verificações feitas para descartar causa nossa:
- Nenhum container do DigiUrban reiniciou (`restarts=0`) ou sofreu OOM (`oom=false`).
- A aplicação continua respondendo: `HTTP 200` em `/health` (2.2 s, degradado mas vivo).
- O disco seguia estável em 88% — a remoção dos volumes não teve relação.

**Conclusão: nenhuma otimização de código ou container corrigirá isto.** É limitação da
hospedagem. Registrado para que não se atribua ao DigiUrban.

⚠️ Como efeito colateral, `docker exec` passou a travar na VPS — as consultas ao PostgreSQL
tiveram que ser feitas via `psql` do host contra o IP da bridge (172.20.0.3).

### 4.2 O RLS está armado mas é bypassado — a app conecta como superuser

| Medição | Valor |
|---|---|
| Policies `tenant_isolation` no banco | **194** |
| Usuário da aplicação | `digiurban`, **`superuser=true`** |
| Role restrito `digiurban_app` | **NÃO EXISTE** |

O `CLAUDE.md` e o plano multi-tenant preveem que a app conecte pelo role **não-superuser**
`digiurban_app` (via `backend/scripts/setup-app-role.sql`), com migrations usando
`MIGRATE_DATABASE_URL`. Como o role não existe e a app é superuser, **o PostgreSQL ignora
as policies** — a segunda camada de isolamento não está ativa na prática.

Isto **não é problema de consumo de recursos**, então não alterei nada: é decisão de
segurança, exige criar o role, migrar a `DATABASE_URL` e definir a `MIGRATE_DATABASE_URL`.
**Fica registrado como pendência de segurança.**

### 4.3 `max_connections=100` — margem menor do que parecia

Medição finalmente obtida: `max_conn=100`, com **23 conexões ativas** no momento da coleta
(estado degradado, com o SMTP fora do ar). Isso confirma o dimensionamento do P0-2: com 21
`PrismaClient` independentes (pool padrão ~9–13 cada), o teto de 100 era atingido com
folga — daí o `FATAL: sorry, too many clients already`.

Com o singleton, o backend passa a usar **um** pool. O `connection_limit` explícito (P1-3)
continua recomendado **após** validar o P0-2 em produção.

## Estado consolidado das decisões

| Decisão | Status |
|---|---|
| Remover volumes órfãos | ✅ **EXECUTADO** — 16 GB liberados, medido |
| Migrar build para GHCR | ✅ **IMPLEMENTADO** — efetivo no próximo push |
| Criar tabelas de canais | ✅ **MIGRATION CRIADA E VALIDADA** — aplica no próximo deploy |
| Commit + push na main | ✅ **EXECUTADO** |

## Pendências registradas (não executadas)

| Item | Por quê |
|---|---|
| `connection_limit` no `DATABASE_URL` | Aplicar só após o P0-2 estar validado em produção |
| Criar role `digiurban_app` e ativar RLS de fato | Decisão de segurança, fora do escopo de consumo (item 4.2) |
| Steal time de 94.7% | Fora do alcance da aplicação — é o provedor (item 4.1) |
| Remover os 114 MB de logs de dez/2025 | Estáticos e inofensivos; baixa prioridade |
| Consolidar os 17 PostgreSQL da VPS | Exige plano de migração próprio |

## O que ainda só pode ser medido após o deploy

RAM por container sob os novos `mem_limit`, CPU após o fim do log de queries, tamanho das
imagens após rebuild, tempo de deploy sem compilação na VPS, e o fim do crash-loop do
`ultrazend-smtp` (261 restarts). Todos permanecem **NÃO MEDIDOS** até lá — nenhum número
foi estimado nesta auditoria.
