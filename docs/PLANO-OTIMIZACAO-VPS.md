# Plano de otimização para VPS — DigiUrban

**Data:** 2026-09-14
**Base:** `docs/AUDITORIA-OTIMIZACAO-VPS.md` (ETAPA 1)
**Commit de partida:** `30c75b60`

Cada item traz: problema, solução, impacto esperado, risco, arquivos, dependências, como testar,
como medir. Impacto marcado como **ESTIMADO** nunca é apresentado como resultado — a comparação
real vai para a ETAPA 5.

---

## Princípios que guiam este plano

1. **Nenhuma funcionalidade removida.** Só sai o que comprovadamente não tem consumidor.
2. **Nada de rewrite.** Sem troca de framework, de banco ou de arquitetura.
3. **Limpeza específica por aplicação.** Nada de `docker system prune -a`, que afetaria as
   outras ~30 apps da VPS.
4. **Limite antes de otimizar.** Numa VPS compartilhada, impedir que a app monopolize a máquina
   vale mais do que economizar 100 MB de imagem.
5. **Medir depois, não estimar antes.**

---

## Visão geral por prioridade

| ID | Item | Prioridade | Risco |
|---|---|---|---|
| C1 | Corrigir o compose inválido (deploy bloqueado) | 🔴 CRÍTICA | 🟢 baixo |
| C2 | `PrismaClient` por requisição no validador de schema | 🔴 CRÍTICA | 🟢 baixo |
| C3 | Parar de reinjetar config de llama.cpp no `.env` | 🔴 CRÍTICA | 🟡 médio |
| A1 | Limites de CPU e PIDs nos 6 serviços | 🟠 ALTA | 🟡 médio |
| A2 | Fazer os 3 proxies sem destino falharem rápido (503 em vez de 150 s) | 🟠 ALTA | 🟢 baixo |
| A2b | **Decisão de produto:** restaurar / repontar / descontinuar IA, Preços e Flow | 🟠 ALTA | — |
| A3 | `.dockerignore` da raiz + criar nos 2 satélites sem ele | 🟠 ALTA | 🟢 baixo |
| A4 | `connection_limit` no `DATABASE_URL` | 🟠 ALTA | 🟡 médio |
| M1 | Apagar os 2 composes mortos e o Dockerfile duplicado | 🟡 MÉDIA | 🟢 baixo |
| M2 | `RELEASE=` deixa de ser anexado ao `.env` | 🟡 MÉDIA | 🟢 baixo |
| M3 | `ultrazend-face` não roda `prisma generate` em runtime | 🟡 MÉDIA | 🟡 médio |
| M4 | `CitizenAiClient` degrada limpo sem IA configurada | 🟡 MÉDIA | 🟢 baixo |
| M5 | Script de observabilidade leve (sem container novo) | 🟡 MÉDIA | 🟢 baixo |
| B1 | Fechar portas 9001/9006 do host | 🔵 BAIXA | 🟡 médio |
| B2 | Remover `ensure_vm_max_map_count` (OpenSearch) | 🔵 BAIXA | 🟢 baixo |
| B3 | Limpar arquivos mortos versionados | 🔵 BAIXA | 🟢 baixo |
| B4 | `ultrazend-face` sob `profiles:` | 🔵 BAIXA | 🟠 alto |

**Não fazer** (justificado no fim): `--omit=dev`, remover Playwright, remover Redis, migrar para
S3, consolidar os 17 PostgreSQL da VPS, trocar supervisord por 3 containers.

---

# 🔴 CRÍTICA

## C1 — Corrigir o `docker-compose.vps.yml` inválido

- **Problema:** a linha 433 tem um `driver: local` órfão, restante da chave `ai_logs:` comentada
  em `043e290b`. Vira `driver` duplicado dentro de `face_logs` e o Docker rejeita o arquivo
  inteiro. **MEDIDO:** falha no `docker compose` v2 **e** no `docker-compose` v1 (o do deploy).
- **Efeito atual:** todo `pull`/`up -d`/`restart` do job de deploy falha. **O deploy está parado.**
- **Solução:** remover a linha 433. Uma linha.
- **Impacto:** restabelece o deploy. Sem isso, nenhum outro item deste plano chega à produção.
- **Risco:** 🟢 baixo — verificado localmente que a remoção faz o compose validar e listar os 6
  serviços.
- **Arquivos:** `docker-compose.vps.yml`
- **Dependências:** nenhuma. **É o primeiro item.**
- **Como testar:** `docker compose -f docker-compose.vps.yml config --services` → deve listar
  `postgres redis ultrazend-face ultrazend-messages ultrazend-smtp digiurban`.
- **Como medir:** binário — valida ou não.

## C2 — `new PrismaClient()` a cada requisição no validador de schema

- **Problema:** `src/lib/json-schema-validator.ts:277` faz `new PrismaClient()` **dentro do
  middleware**, a cada requisição com `customFormData`. Usado por `citizen-services.ts` e
  `internal.routes.ts` — ambos em produção. Cada chamada abre um pool novo (≈9–13 conexões) que
  nunca é desconectado, contra um `max_connections=100`.
- **Por que passou despercebido:** a rodada anterior converteu 21 arquivos, mas contou este como
  já resolvido. É o **único** vazamento real que restou — o outro caso suspeito
  (`citizen-lookup.service.ts:32`) **nunca dispara**, porque as 5 chamadas de
  `getCitizenLookupService(prisma)` sempre injetam o singleton (verificado).
- **Bônus de segurança:** esse cliente não tem a `tenantExtension`, então a query de validação
  **não é escopada por tenant** — é furo de isolamento multi-tenant, não só de recurso.
- **Solução:** trocar o import dinâmico pelo singleton `src/lib/prisma`.
- **Impacto:** elimina a fonte residual do `too many clients already`. **ESTIMADO** — só
  mensurável sob carga real.
- **Risco:** 🟢 baixo — troca de import, mesma interface.
- **Arquivos:** `digiurban/backend/src/lib/json-schema-validator.ts`
- **Dependências:** nenhuma.
- **Como testar:** `tsc -p tsconfig.docker.json --noEmit` (baseline: exit 0); abrir um protocolo
  com formulário customizado.
- **Como medir:** `SELECT count(*) FROM pg_stat_activity` antes/depois sob carga.

## C3 — O `.env` ressuscita a IA local a cada deploy

- **Problema:** `scripts/vps-deploy-lib.sh` **regenera o `.env` do zero** (`cat > "${env_path}"`)
  e escreve 20+ variáveis de llama.cpp, incluindo
  `CITIZEN_AI_COMPLETIONS_URL=http://digiurban-ai:9004/...` e `AI_API_URL`, apontando para
  containers removidos em `043e290b`. Como é reescrito todo deploy, a config morta volta sempre.
- **Solução:** remover o bloco `# AI Platform (digiurban-ai)` do heredoc, preservando
  `AI_SERVICE_TOKEN` (ainda usado pelo `internal-auth` entre serviços) e
  `DIGIBOT_INACTIVITY_TIMEOUT_MS` (usado pelo bot, sem relação com IA).
- **Impacto:** a remoção da IA local passa a ser efetiva. Prepara a entrada da API DeepSeek com
  um `.env` limpo.
- **Risco:** 🟡 médio — é preciso separar o que é de IA do que só tem nome parecido. Mitigação:
  remover apenas as chaves `AI_LLAMACPP_*`, `AI_EMBEDDINGS_*`, `AI_WEB_SEARCH_*`, `AI_API_URL`,
  `CITIZEN_AI_COMPLETIONS_URL`, `AI_DEFAULT_TENANT_ID`, `CITIZEN_AI_TENANT_ID`.
- **Arquivos:** `scripts/vps-deploy-lib.sh`
- **Dependências:** melhor aplicar junto com A2 e M4 (mesmo assunto).
- **Como testar:** rodar `write_vps_env_file` num diretório temporário e conferir o `.env` gerado.
- **Como medir:** contagem de variáveis órfãs no `.env` (hoje: 20+; meta: 0).

---

# 🟠 ALTA

## A1 — Limites de CPU e PIDs

- **Problema:** **MEDIDO:** nenhum dos 6 serviços tem `cpus` ou `pids_limit`. O `mem_limit` já
  existe. Numa VPS de 4 vCPU com ~30 apps, um laço quente ou um `next build` acidental consome
  todos os núcleos e degrada todas as outras aplicações — que é exatamente o incidente que
  motivou este trabalho.
- **Solução:** `cpus` e `pids_limit` por serviço, dimensionados com folga sobre o consumo medido
  em 2026-09-13:

| Serviço | CPU medido (09-13) | `cpus` proposto | `pids_limit` | Justificativa |
|---|---|---|---|---|
| `digiurban` | 0.03% | **2.0** | 512 | 3 processos + Chromium (picos reais de PDF) |
| `postgres` | 0.00% | **1.0** | 256 | |
| `ultrazend-messages` | 0.00% | **1.0** | 256 | Sharp + WebSocket |
| `ultrazend-face` | **11.75%** | **1.0** | 256 | maior consumidor medido |
| `ultrazend-smtp` | não medido (crash-loop) | **0.5** | 128 | revisar após validar |
| `redis` | — | **0.5** | 128 | |

  Soma dos tetos = 6.0 vCPU em 4 físicos: é **deliberado**. `cpus` é teto, não reserva; o objetivo
  é impedir monopólio, não particionar a máquina.
- **Impacto:** nenhuma app do DigiUrban consegue sozinha tomar a VPS. **ESTIMADO.**
- **Risco:** 🟡 médio — teto apertado causa lentidão, não crash (diferente de OOM). Por isso os
  valores são generosos. `pids_limit` baixo demais quebraria o Chromium: 512 é folgado.
- **Arquivos:** `docker-compose.vps.yml`
- **Dependências:** **C1** (o compose precisa validar primeiro).
- **Como testar:** `docker compose config`; após deploy, `docker stats` sob geração de PDF.
- **Como medir:** `docker stats --no-stream` antes/depois; `nproc`-normalizado.

## A2 — Fazer os 3 proxies sem destino degradarem rápido

> ⚠️ **Este item mudou de natureza depois de uma correção.** A versão anterior propunha
> **remover** as três rotas por serem "código morto sem consumidor". **Estava errado:** eu havia
> feito os greps em `digiurban/frontend/src`, mas o App Router fica em `digiurban/frontend/app`
> (280 páginas em `app/`, zero em `src/app/`). **Os três têm consumidores vivos.** Remover as
> rotas teria quebrado três áreas do produto de forma permanente.

- **Problema:** `/api/prices` → `digiurban-prices:9002`, `/api/flow` → `digiurban-flow:9003`,
  `/api/ai` → `digiurban-ai:9004`. Os três serviços **não existem** no compose nem no CI, mas os
  três têm **clientes vivos** no frontend:

| Rota | Cliente | Página |
|---|---|---|
| `/api/ai` | `lib/services/ai-platform.service.ts` | `/super-admin/ia` (compilada no build) |
| `/api/prices` | `lib/prices-client.ts` | Pesquisa de Preços |
| `/api/flow` | `lib/flow-client.ts` | Processos Internos |

  Ou seja: **três funcionalidades do produto estão quebradas**, e a de IA pendura a requisição por
  **150 s** antes de falhar — prendendo conexão e worker do backend esse tempo todo.
- **Solução (só a onda 1 — a remoção sai de cena):** reduzir o timeout de `/api/ai` de 150 s para
  15 s e fazer os três proxies responderem **503 imediato e explícito** quando a env var de
  destino não estiver configurada. A funcionalidade continua quebrada (o serviço não existe), mas
  falha em 1 s com mensagem clara em vez de pendurar por 150 s.
- **O que NÃO fazer:** remover as rotas ou os arquivos. Seria destruir a funcionalidade em vez de
  restaurá-la — exatamente o tipo de "otimização cega" que o escopo proíbe.
- **Impacto:** elimina requisições penduradas por até 150 s. **ESTIMADO.**
- **Risco:** 🟢 baixo — só muda o caminho de erro, que hoje já é erro.
- **Arquivos:** `src/routes/{ai,prices,flow}-proxy.routes.ts`
- **Dependências:** nenhuma.
- **Como testar:** `curl -i localhost:3060/api/ai/health` → 503 rápido, não timeout de 150 s.
- **Como medir:** tempo de resposta do endpoint, antes/depois.

## A2b — DECISÃO PENDENTE: o destino dessas três funcionalidades

Os três módulos precisam de uma decisão de produto, não de infraestrutura. Para cada um:

| Opção | Consequência |
|---|---|
| **Restaurar o serviço** | Volta ao compose (custo de RAM/CPU) e a funcionalidade funciona |
| **Repontar para serviço externo** | É o caminho já planejado da IA (API DeepSeek) — só trocar a URL |
| **Descontinuar de verdade** | Aí sim remover rotas, clientes **e as páginas do frontend**, para o usuário não encontrar tela que erra |

  ⚠️ Se a escolha for descontinuar: o `digiurban/Dockerfile:51` **falha o build** se
  `dist/routes/prices-proxy.routes.js` não existir — precisa sair junto.

  **Não implemento nenhuma das três sem sua decisão.**

## A3 — `.dockerignore`

- **Problema:** **MEDIDO:** a imagem principal usa `context: .` e o `.dockerignore` não exclui
  `anjoinovador/` (7.1 MB), `WORKFLOWS_COMPLETOS.ts` (509 KB), `WORKFLOWS_GERADOS.ts` (264 KB),
  `deploy-log-templates.txt` (584 KB), `ai-training/`, `digiurban-ai/`, `digiurban-prices/`,
  `digiurban-flow/`, `generator/`, `apresentacao/`, `backend/`, `frontend/`, `src/`.
  Contexto real: **87 MB** (a regra genérica `**/node_modules` do `.dockerignore` já poupa os
  **356 MB** de `digiurban-ai/node_modules` — MEDIDO —, mas o diretório em si continua entrando).
  Além disso, `ultrazend-smtp-server` e `ultrazend-face-server` **não têm `.dockerignore` nenhum**.
- **Solução:** adicionar as exclusões na raiz; criar os dois arquivos faltantes espelhando o do
  messages-server.
- **Impacto:** contexto menor a cada build, cache mais estável. **ESTIMADO** — medível comparando
  o "transferring context" do log de build.
- **Risco:** 🟢 baixo. ⚠️ Cuidado: `digiurban/` **não** pode ser excluído (é a aplicação), e
  `digiurban/shared` é copiado pelo Dockerfile.
- **Arquivos:** `.dockerignore`, `ultrazend-smtp-server/.dockerignore` (novo),
  `ultrazend-face-server/.dockerignore` (novo)
- **Dependências:** nenhuma.
- **Como testar:** `docker build` e ler a linha `transferring context`.
- **Como medir:** MB de contexto antes/depois — **número real, não estimado.**

## A4 — `connection_limit` no `DATABASE_URL`

- **Problema:** **MEDIDO:** zero ocorrências de `connection_limit` no repositório. Com
  `max_connections=100` no PostgreSQL e 4 serviços conectando ao mesmo banco, o pool padrão do
  Prisma (derivado de núcleos) é imprevisível.
- **Solução:** `?connection_limit=10&pool_timeout=20` para o backend principal e
  `connection_limit=5` para messages/face/smtp, aplicado no `write_vps_env_file`.
- **Impacto:** teto previsível de ~30 conexões contra 100 disponíveis. **ESTIMADO.**
- **Risco:** 🟡 médio — pool pequeno demais gera `pool_timeout` sob carga.
- **Dependências:** **só depois de C2 em produção.** Era a pendência declarada da rodada anterior,
  e continua condicionada: limitar o pool antes de estancar o vazamento troca um erro por outro.
- **Arquivos:** `scripts/vps-deploy-lib.sh`, `docker-compose.vps.yml`
- **Como testar:** `SELECT count(*), application_name FROM pg_stat_activity GROUP BY 2`.
- **Como medir:** conexões ativas em pico, antes/depois.

---

# 🟡 MÉDIA

## M1 — Apagar composes e Dockerfile mortos

- **Problema:** **três** arquivos de orquestração, só um em uso:
  - `Dockerfile` (raiz) — divergente do real, **não referenciado** por compose ou CI;
  - `digiurban/docker-compose.yml` — Postgres **16** (produção usa 15), senha
    `digiurban_dev_2025`, porta 5432 publicada. Não referenciado por nada;
  - `digiurban/Dockerfile` — **este é o real.**
- **Risco de manter:** alguém edita o arquivo errado e conclui que o build ignora a mudança.
- **Solução:** remover os dois mortos. O real permanece.
- **Impacto:** clareza. Zero impacto em runtime.
- **Risco:** 🟢 baixo — confirmado por grep que nada os referencia.
- **Arquivos:** `Dockerfile`, `digiurban/docker-compose.yml`
- **Como testar:** `docker compose config` + build do CI continuam funcionando.

## M2 — `RELEASE=` para de ser anexado ao `.env`

- **Problema:** `build-images.yml:126` faz `echo "RELEASE=${RELEASE}" >> .env` a **cada** deploy.
  O `write_vps_env_file` reescreve o arquivo com `>`, então na prática só sobrevive o último — mas
  se a ordem mudar, acumula. É frágil por construção.
- **Solução:** incluir `RELEASE` no heredoc do `write_vps_env_file`, ou usar
  `grep -v '^RELEASE=' .env` antes de anexar.
- **Impacto:** deploy idempotente de verdade.
- **Risco:** 🟢 baixo.
- **Arquivos:** `.github/workflows/build-images.yml`, `scripts/vps-deploy-lib.sh`
- **Como medir:** `grep -c '^RELEASE=' .env` após 3 deploys → deve ser 1.

## M3 — `ultrazend-face`: `prisma generate` sai do runtime

- **Problema:** `ultrazend-face-server/docker-entrypoint.sh` roda `prisma generate` **a cada
  boot** — trabalho de build feito em produção, gastando CPU numa VPS saturada.
- **Solução:** o Dockerfile já roda `prisma generate` no builder e copia `.prisma`/`@prisma`.
  O do entrypoint é redundante: remover.
- **Impacto:** boot mais rápido, menos CPU por restart. **ESTIMADO.**
- **Risco:** 🟡 médio — se a cópia do builder estiver incompleta, o serviço não sobe. Testar o
  boot do container antes de aceitar.
- **Arquivos:** `ultrazend-face-server/docker-entrypoint.sh`
- **Como testar:** `docker compose up ultrazend-face` e conferir o healthcheck em `:9006/health`.
- **Como medir:** tempo entre `start` e `healthy`.

## M4 — `CitizenAiClient` degrada limpo

- **Problema:** `available()` retorna `Boolean(serviceToken)` — checa o **token**, não a URL. E o
  token tem default no compose. Com `CITIZEN_AI_COMPLETIONS_URL` comentado, o cliente cai no
  default `http://localhost:9004/...` (ninguém, dentro do container) e **se considera
  configurado**, tentando chamar host morto a cada turno de conversa.
- **Solução:** `available()` passa a exigir que a URL tenha sido **explicitamente** configurada.
- **Impacto:** o bot usa o caminho determinístico sem tentativa inútil de rede. Prepara a troca
  pela API DeepSeek — que só precisará definir a URL.
- **Risco:** 🟢 baixo — quando a IA voltar (DeepSeek), basta setar a variável.
- **Arquivos:** `ultrazend-messages-server/src/bot/ai/CitizenAiClient.ts`
- **Como testar:** `tsc --noEmit` (baseline exit 0); conversar com o bot e conferir que não há
  erro de conexão no log.

## M5 — Observabilidade leve, sem container novo

- **Problema:** não há como responder "esta app cresceu?" sem SSH manual. Instalar
  Prometheus/Grafana custaria mais RAM que a aplicação inteira — desproporcional.
- **Solução:** um script `scripts/vps-metrics.sh` que anexa uma linha CSV com `docker stats
  --no-stream` (só containers do projeto), `docker system df` e `df -h`, rodado por `cron` de
  hora em hora, com rotação por `logrotate` ou `tail -n`.
- **Impacto:** série histórica para detectar vazamento e crescimento de volume, a custo ~zero.
- **Risco:** 🟢 baixo.
- **Arquivos:** `scripts/vps-metrics.sh` (novo)
- **Como medir:** é o próprio instrumento de medição das ETAPAS 5 e 8.

---

# 🔵 BAIXA

## B1 — Fechar as portas 9001 e 9006

`ultrazend-messages` publica `9001:9001` e `ultrazend-face` publica `9006:9006` no host. O nginx
já faz proxy interno de `/messages-api` e `/socket.io`. **Risco 🟡:** o
`NEXT_PUBLIC_MESSAGES_WS_URL` pode apontar direto para a porta em algum ambiente — **verificar
antes**. Ganho: menos superfície exposta.

## B2 — Remover `ensure_vm_max_map_count`

`scripts/vps-deploy-lib.sh` ajusta `vm.max_map_count=262144` **no host** e cria
`/etc/sysctl.d/99-digiurban-opensearch.conf` — para um OpenSearch que não existe mais. Alterar
sysctl do host compartilhado por causa de serviço removido é efeito colateral indesejado.

## B3 — Arquivos mortos versionados

`WORKFLOWS_COMPLETOS.ts` (509 KB), `WORKFLOWS_GERADOS.ts` (264 KB), `deploy-log-templates.txt`
(584 KB), `*.seed.backup.ts` (~1.5 MB), `backend-errors.txt`, `frontend-errors.txt`. Não afetam
runtime (A3 já os tira do contexto), mas poluem o repositório. Remoção cosmética — fazer por
último e em commit separado.

Incluir aqui também o **`package.json` da raiz**: declara `better-sqlite3` + `sqlite3` (resíduo
da era SQLite, antes do PostgreSQL) e **nunca foi instalado** — `node_modules/` da raiz está
vazio (MEDIDO). Não quebra nada hoje, mas é uma armadilha: um `npm install` acidental na raiz
compilaria dois módulos nativos sem função alguma.

## B4 — `ultrazend-face` sob `profiles:`

**MEDIDO na VPS (09-13):** 0 linhas de log em 7 dias, mas **11.75% de CPU** — o maior consumidor
relativo. Colocá-lo sob `profiles: [face]` o tiraria do `up` padrão. **Risco 🟠 alto:** a rota
`/api/admin/face-platform` passaria a falhar, e o `digiurban` tem `depends_on` dele. Só com
decisão explícita de que a biometria fica indisponível. **Não implementar sem autorização.**

---

## Não fazer — e por quê

| Item | Motivo |
|---|---|
| `npm install --omit=dev` | **Quebraria o deploy.** Os seeds (`db:seed`) e o smoke multi-tenant rodam via `tsx`, que é devDependency, **dentro do container**, no job de deploy. |
| Remover Playwright/Chromium (968 MB) | Usado em 6 arquivos para PDF e assinatura digital. |
| Remover Redis | BullMQ + adapter Socket.IO, uso comprovado. Custa ~20 MiB. |
| Migrar uploads para S3/MinIO | ~22 MB no total. Volume local é mais econômico. |
| Trocar supervisord por 3 containers | Mais RAM base e mais complexidade, sem ganho. |
| Consolidar os 17 PostgreSQL da VPS | Maior ganho da **máquina**, mas exige plano de migração próprio e afeta outras apps. Fora do escopo. |
| `docker system prune -a` no deploy | Removeria imagens das outras ~30 apps. O pipeline atual já usa `image prune -f` (só dangling) — **está correto**. |
| Trocar Debian por Alpine na imagem principal | Debian foi escolhido **por causa do Playwright**. Reverter quebraria o Chromium. |

---

## Ordem de execução

**Bloco 1 — desbloquear (imediato)**
1. C1 (compose) → sem isso nada chega à produção.

**Bloco 2 — código, risco baixo, validável por compilação**
2. C2 (PrismaClient por request)
3. M4 (`CitizenAiClient`)
4. A2 onda 1 (timeouts e 503 dos proxies)
5. → validar: `tsc -p tsconfig.docker.json` e `tsc --noEmit` do messages (baseline: exit 0)

**Bloco 3 — build e contexto**
6. A3 (`.dockerignore` ×3)
7. M1 (apagar mortos)
8. M3 (`prisma generate` fora do runtime)

**Bloco 4 — compose e deploy**
9. A1 (`cpus` + `pids_limit`)
10. C3 (`.env` sem llama.cpp)
11. M2 (`RELEASE=`)
12. B2 (`vm.max_map_count`)
13. M5 (script de métricas)

**Bloco 5 — só depois de produção estável**
14. A4 (`connection_limit`) — **requer C2 validado em produção**
15. A2 onda 2 (remover as rotas) — **requer tráfego zero confirmado por M5**
16. B1, B3

**Bloco 6 — requer autorização explícita**
17. B4 (`face` sob profile) — deixa a biometria indisponível.

---

## Como a ETAPA 5 vai comparar

Métricas coletáveis **localmente**, sem VPS (números reais):

| Métrica | Antes (MEDIDO) | Instrumento |
|---|---|---|
| Contexto de build | **87 MB** | `COPY . /c` + `du -sm` dentro do container |
| Compose válido | ❌ não | `docker compose config` |
| Serviços no compose | 6 | idem |
| Containers com limite de CPU | 0 de 6 | idem |
| `PrismaClient` por request | 1 ocorrência | grep |
| Arquivos de orquestração | 3 (2 mortos) | `ls` |
| `tsc` backend / messages | exit 0 / exit 0 | `tsc --noEmit` |

Métricas que **só a VPS pode dar** (ETAPA 8, marcadas NÃO MEDIDO até lá): RAM e CPU por
container sob os novos limites, tamanho real das imagens no GHCR, tempo de build e de deploy,
crescimento dos volumes, comportamento após dias.

---

# STATUS DE IMPLEMENTAÇÃO (ETAPA 3)

**Diretriz do dono do projeto:** *não commitar até a aplicação estar de fato otimizada*, porque
`push` na `main` dispara `build-images.yml` → build + deploy automático. Tudo abaixo está
**implementado e validado localmente, aguardando um commit único.**

Isso mudou a ordem do plano: o C1 deixou de ser "urgência para destravar o deploy" e virou mais
uma correção no lote — o que é melhor, porque um deploy com o compose consertado mas **sem** os
limites de CPU levaria a produção de volta ao estado que derrubou a VPS.

## Itens adicionados APÓS a pesquisa de boas práticas 2026

A pesquisa (seção própria, no fim deste documento) expôs **quatro falhas nos meus próprios
números**. Três já corrigidas, uma pendente de decisão:

| ID | Achado | Como apareceu | Status |
|---|---|---|---|
| **A1b** | `ultrazend-smtp` era o **único serviço Node sem teto de heap** | Regra "heap = 60–75% do `mem_limit`": conferi os 6 e o smtp não tinha `NODE_OPTIONS` | ✅ corrigido (256m/384m = 66%) |
| **A1c** | Postgres com `mem_limit: 512m` mas **nos defaults** | Fonte alerta: se `shared_buffers + work_mem × max_connections` > `mem_limit`, o OOM killer derruba o banco | ✅ corrigido (`shared_buffers=128MB`, `max_connections=50`, `work_mem=4MB`) |
| **A5** | CI sem `provenance: false` / `sbom: false` | Build local mostrou "exporting attestation manifest" por imagem | ✅ corrigido |
| **A6** | **~208 MB de Prisma** na imagem do messages | Build real + `docker history` + `du` dentro da imagem | ⏸️ ver abaixo |

### A6 — Prisma CLI como dependência de produção nos 4 serviços

**MEDIDO** (build real do `ultrazend-messages-server`, imagem de **1.03 GB**):

| Item | Tamanho | Removível? |
|---|---|---|
| `@prisma/client` | 74 MB | ❌ é o cliente da aplicação |
| `prisma` (CLI) | 51 MB | depende do serviço |
| `@prisma/engines` | 36 MB (1 binário `libquery_engine` de 17 MB) | ❌ |
| `.prisma` (client gerado) | 45.8 MB | ❌ |
| `effect` | 34 MB | 🔴 **transitiva só do CLI** (`prisma` → `@prisma/config` → `effect`) |

O CLI é `dependencies` (não `devDependencies`) nos **quatro** serviços. Verifiquei quem o
invoca em runtime:

| Serviço | Invoca o CLI? | Evidência |
|---|---|---|
| `digiurban` (backend) | ✅ **sim** | `docker/startup.sh:135` → `$PRISMA_BIN generate`, `migrate deploy` |
| `ultrazend-messages` | ✅ **sim** | `docker-entrypoint.sh:40` → `$PRISMA_BIN migrate deploy` |
| `ultrazend-face` | ❌ **não** (após o M3) | entrypoint agora só faz `exec node dist/index.js` |
| `ultrazend-smtp` | ❌ **não** | `CMD ["node", "start-server-production.js"]`, que usa `dist/index.prisma.js` |

**Conclusão honesta:** nos dois primeiros o CLI **não pode sair** — removê-lo quebraria as
migrations no deploy. Nos dois últimos, `prisma` + `effect` (~85 MB) é peso morto.

### A6 — IMPLEMENTADO E MEDIDO ✅

`prisma` (CLI) movido de `dependencies` para `devDependencies` no `ultrazend-face-server` e no
`ultrazend-smtp-server`. O CLI continua disponível no estágio *builder* (que instala tudo e roda
`prisma generate`); some apenas do runtime, que instala com `--omit=dev`.

**MEDIDO — build real antes e depois, mesmo método:**

| Imagem | Antes | Depois | Redução |
|---|---|---|---|
| `ultrazend-face` | **968 MB** | **688 MB** | **−280 MB (−29%)** |
| `ultrazend-smtp` | **1.24 GB** | **836 MB** | **−404 MB (−33%)** |

**Validação de que nada quebrou:**

| Teste | Resultado |
|---|---|
| `@prisma/client` carrega e instancia no runtime (face) | ✅ OK |
| `@prisma/client` + `dist/index.prisma.js` carregam (smtp) | ✅ OK |
| CLI realmente ausente das imagens | ✅ `node_modules/prisma` não existe |
| `node_modules` final | face 178 MB · smtp 148 MB |
| `package-lock.json` regenerado nos dois | ✅ OK |

⚠️ **Sobre o erro `P1012` observado no boot do face:** ele aparece **igual na imagem ANTES da
mudança** — é a ausência de `DATABASE_URL` (o `schema.prisma` a exige via `env()`). Com a variável
definida vira `P1001` (não alcança o host `postgres`), que é o esperado ao rodar fora do compose.
**Não é regressão do A6** — confirmado executando a mesma chamada nas duas imagens.

**Por que o backend e o messages ficaram de fora:** ambos invocam o CLI em runtime
(`startup.sh:135` → `prisma generate`; `docker-entrypoint.sh:40` → `migrate deploy`). Remover
quebraria as migrations no deploy.

---

| ID | Item | Status | Validação |
|---|---|---|---|
| C1 | Linha 433 órfã do compose | ✅ feito | `docker compose config` lista os 6 serviços |
| C2 | `PrismaClient` por requisição → singleton | ✅ feito | `tsc -p tsconfig.docker.json` **exit 0** |
| C3 | `.env` sem config de llama.cpp | ✅ feito | `.env` gerado: **0** variáveis órfãs (era 20+) |
| A1 | `cpus` + `pids_limit` nos 6 serviços | ✅ feito | `docker compose config` mostra os 6 |
| A2 | 503 rápido nos 3 proxies + timeout 150s→15s | ✅ feito | guards presentes nos 3 arquivos |
| A3 | `.dockerignore` raiz + 2 novos | ✅ feito | contexto **87 MB → 65 MB** (medido) |
| M1 | `Dockerfile` e `digiurban/docker-compose.yml` mortos | ✅ removidos | `digiurban/Dockerfile` intacto |
| M2 | `RELEASE=` idempotente no `.env` | ✅ feito | `sed -i '/^RELEASE=/d'` antes do append |
| M3 | `prisma generate` fora do runtime do face | ✅ feito | `sh -n` OK |
| M4 | `CitizenAiClient` exige URL explícita | ✅ feito | `tsc --noEmit` **exit 0** |
| B2 | `ensure_vm_max_map_count` (OpenSearch) | ✅ removido | `bash -n` OK |
| A1b | `NODE_OPTIONS` no smtp (heap 66% do limite) | ✅ feito | `docker compose config` |
| A1c | Tuning do Postgres p/ caber no `mem_limit` | ✅ feito | `docker compose config` renderiza o `command` |
| A5 | `provenance: false` + `sbom: false` no CI | ✅ feito | YAML válido |
| A6 | Prisma CLI → devDeps em face/smtp | ✅ feito | **−280 MB e −404 MB**, build real + boot testado |
| M5 | `scripts/vps-metrics.sh` (observabilidade leve) | ✅ feito | `bash -n` OK, executável |

---

# ETAPA 4 — TESTES

## Resultado: a aplicação NÃO TEM suíte de testes

Este é um achado, não uma omissão minha. **MEDIDO:**

| Verificação | Resultado |
|---|---|
| `npx jest --listTests` (backend) | **vazio** — nenhum teste encontrado |
| `digiurban/backend/__tests__/` | **não existe** |
| `playwright.config.ts` → `testDir: './tests/e2e'` | **diretório não existe** |
| Arquivos `*.test.ts` / `*.spec.ts` rastreados no git | **5**, todos em `digiurban-prices/` (módulo fora do build) |
| Testes em messages / face / smtp / frontend | **0** |

O `package.json` do backend declara 11 scripts de teste (`test:unit`, `test:integration`,
`test:e2e`, `test:coverage`…) que apontam para diretórios inexistentes. **Nenhum deles roda.**

Registro isto com franqueza porque muda o peso das minhas validações: não há rede de segurança
automatizada nesta aplicação. O que validei, e como:

| Validação | Método | Resultado |
|---|---|---|
| Compilação backend | `tsc -p tsconfig.docker.json --noEmit` | ✅ **exit 0** (= baseline) |
| Compilação messages | `tsc --noEmit` | ✅ **exit 0** (= baseline) |
| Compose | `docker compose config` | ✅ 6 serviços, limites aplicados |
| **Docker build real** | `docker build` do messages-server | ✅ **exit 0**, imagem gerada |
| Scripts shell | `sh -n` / `bash -n` | ✅ sintaxe OK |
| Geração do `.env` | `write_vps_env_file` em dir temporário | ✅ 0 variáveis órfãs, sem duplicata |
| `.dockerignore` não quebra o build | build de teste copiando `backend/src`, `shared`, `docker/` | ✅ chegam ao contexto |

## O que NÃO pôde ser testado aqui (documentado, conforme pedido)

| Item | Por quê |
|---|---|
| Inicialização e healthcheck reais | Exigem PostgreSQL + Redis + `.env` de produção |
| Autenticação, fluxos, integrações | Exigem banco populado |
| Build da imagem principal (2.2 GB) | Baixa Chromium (968 MB); inviável nesta máquina/tempo |
| Migrations | Só contra banco real |
| Comportamento sob os novos limites | Só na VPS (ETAPA 8) |

⚠️ **Consequência para o deploy:** sem testes automatizados, o primeiro deploy é o primeiro teste
funcional real. Recomendo fortemente acompanhar `docker logs` dos 6 containers nos primeiros
minutos e ter o rollback pronto (ETAPA 7).

**Regressão que eu introduzi e corrigi:** ao editar o `vps-deploy-lib.sh`, dupliquei
`AI_SERVICE_TOKEN` no `.env` gerado (ele já existia no bloco "Service tokens"). Detectei ao
conferir o arquivo gerado; corrigido — hoje aparece exatamente 1 vez.

## Resultados medidos até aqui (local)

| Métrica | Antes | Depois | Método |
|---|---|---|---|
| Contexto de build | **87 MB** | **65 MB** (−25%) | `COPY . /c` + `du -sm`, idêntico nos dois |
| Compose válido | ❌ rejeitado | ✅ 6 serviços | `docker compose config` |
| Serviços com limite de CPU | 0 de 6 | **6 de 6** | idem |
| Variáveis de IA morta no `.env` | 20+ | **0** | `write_vps_env_file` em dir temporário |
| Arquivos de orquestração | 3 (2 mortos) | 1 | `ls` |
| `tsc` backend / messages | exit 0 | **exit 0** | sem regressão |

Tudo o que depende da VPS (RAM, CPU real, tamanho de imagem, tempo de deploy) segue
**NÃO MEDIDO** — e só sai na ETAPA 8, após o deploy que você autorizar.

---

# PESQUISA DE BOAS PRÁTICAS 2026

Conforme pedido, não baseei as decisões só em conhecimento interno. Para cada prática:
qual problema resolve, qual o impacto, que custo introduz, se faz sentido **aqui**, e se vira
padrão para as outras aplicações.

### 1. Limites de recurso em host compartilhado

> *"Um único processo descontrolado pode consumir toda a CPU ou memória disponível, derrubando
> o host inteiro."* — [Docker Docs — Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/), [OneUptime](https://oneuptime.com/blog/post/2026-01-16-docker-limit-cpu-memory/view)

Fórmula de produção encontrada: `recursos do host = soma dos limites + 25–40% de folga + SO`,
reservando ≥1 GB para o Linux/Docker. E o alerta central: *"um limite ausente não é um padrão
seguro, é um padrão faltando"*.

- **Problema que resolve:** exatamente o incidente que derrubou sua VPS.
- **Custo:** limite apertado causa lentidão (CPU) ou OOM (memória).
- **Faz sentido aqui:** ✅ é o item A1. **Vira padrão: SIM — regra nº 1.**
- **Divergência que encontrei:** a soma dos meus tetos de CPU (6.0) excede os 4 vCPU. Mantive
  **de propósito** — `cpus` é teto, não reserva; particionar 4 vCPU entre 6 serviços ociosos
  desperdiçaria mais do que protegeria.

### 2. Heap do Node vs limite do container

> *"Aloque 60–75% do limite de memória do container para o heap do V8, deixando o resto para
> buffers e memória nativa."* — [HireNodeJS 2026](https://www.hirenodejs.com/blog/nodejs-docker-production-2026), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/docker/memory-limit.french.md)

Conferi os 6 serviços contra essa regra — e **achei um erro meu**: o `ultrazend-smtp` era o
único sem `NODE_OPTIONS`. Corrigido (A1b). Os demais estavam em 66%, dentro da faixa.

- **Custo:** heap baixo demais = GC excessivo.
- **Vira padrão: SIM** — todo serviço Node com `mem_limit` **e** `--max-old-space-size` ≈ 66%.

### 3. PostgreSQL em container com pouca memória

> *"Se o limite de memória do container for menor que `shared_buffers + work_mem × max_connections`,
> o OOM killer vai terminar o PostgreSQL sob carga."* — [usulnet](https://articles.usulnet.com/articles/postgresql-docker-production), [Coding Steve](https://stevenpg.com/posts/postgres-on-less-than-150mb-of-memory/)

Isto expôs a **segunda falha minha**: pus `mem_limit: 512m` no Postgres e deixei os defaults.
Com `max_connections=100` default e `work_mem` padrão, o pior caso ultrapassa 512 MB. Corrigido
(A1c) com valores dimensionados **para** o limite.

- **Vira padrão: SIM** — nunca limitar memória de um banco sem ajustar a configuração dele junto.

### 4. Limpeza sem afetar outras aplicações

> *"Em hosts de produção, rodar `docker system prune -a` é um erro. Use `docker image prune -a -f`
> com filtros como `until=240h`."* — [Netdata](https://www.netdata.cloud/guides/docker/docker-image-cleanup/), [CloudCops](https://resources.cloudcops.com/blogs/docker-system-prune)

Também recomendam **estratégia por label** (`--filter "label=..."`) e nunca usar `--volumes`
em automação.

- **Faz sentido aqui:** ✅ o pipeline **já** usa `docker image prune -f` (só dangling) e
  `builder prune --filter until=168h`. **Estava certo antes de eu chegar.**
- **Vira padrão: SIM** — e a evolução natural é rotular por aplicação (proposto no padrão).

### 5. Cache de build em registry

> *"Sem `mode=max`, só o estágio final é cacheado e os intermediários recompilam do zero."*
> *"Um cache externo é quase essencial em CI/CD com pouca ou nenhuma persistência."*
> — [OneUptime](https://oneuptime.com/blog/post/2026-02-20-docker-build-cache-optimization/view), [Valters IT](https://www.valtersit.com/vault/2026/04/github_actions_docker_build/accelerated-docker-builds-with-ghcr-registry-cache-2d188f/)

- **Faz sentido aqui:** ✅ o CI **já** usa `cache-from`/`cache-to` com `mode=max` no GHCR.
  Também correto antes de eu chegar.
- **O que faltava:** `provenance`/`sbom`, que o buildx anexa por padrão (item A5).

### 6. Rotação de log

> `max-size: 10m, max-file: 3` (30 MB/container) como configuração típica, mais `compress`.
> — [SigNoz](https://signoz.io/blog/docker-log-rotation/), [OneUptime](https://oneuptime.com/blog/post/2026-01-06-docker-log-rotation/view)

- **Faz sentido aqui:** ✅ já aplicado nos 6 serviços, exatamente nesses valores.
- **Melhoria possível:** `compress: "true"`, não usado. Ganho pequeno; não alterei.

### 7. Observabilidade proporcional

> *"`docker stats` tem overhead mínimo porque lê do cgroups, que o Docker já usa para controle
> de recursos."* — [Last9](https://last9.io/blog/container-resource-monitoring-with-docker-stats/), [Maintenant](https://maintenant.dev/blog/docker-monitoring-without-prometheus/)

Alternativa leve citada: **Beszel** (agente <10 MB de RAM).

- **Faz sentido aqui:** ✅ confirma o item M5 — `docker stats` + cron + CSV, sem container novo.
  Um Prometheus custaria mais RAM que a aplicação inteira.
- **Vira padrão: SIM** — comece com `docker stats`; só suba stack se ele não bastar.

### 8. Deploy e rollback

> *"O Docker Compose não tem comando de rollback. Para reverter: fixe a tag/digest anterior e
> rode `docker compose up -d`."* — [Temps](https://temps.sh/blog/how-to-add-zero-downtime-deployments-docker), [docker-rollout](https://github.com/wowu/docker-rollout)

- **Faz sentido aqui:** ✅ o pipeline **já** tagueia por SHA (`RELEASE=${{ github.sha }}`), o que
  torna o rollback um `RELEASE=<sha-anterior> docker compose up -d`. Documentado na ETAPA 7.

### 9. Segurança de container

> `no-new-privileges:true`, `read_only` onde possível, `cap_drop: ALL`, usuário não-root.
> — [Panelica](https://panelica.com/blog/docker-security-best-practices-rootless-read-only-and-scanning), [Byte Guard](https://blog.byte-guard.net/docker-security-best-practices/)

- **Faz sentido aqui:** parcialmente. Backend/frontend já rodam como não-root (uid 1001/1002) e o
  smtp como `node`. `read_only` **não** se aplica direto (uploads, logs, Chromium precisam
  escrever). `no-new-privileges` é ganho barato — **proposto, não aplicado** (é mudança de
  segurança, não de consumo; fora do escopo que você definiu).

### O que a pesquisa NÃO mudou

Nenhuma fonte justificou trocar framework, migrar banco, adotar Kubernetes/Swarm ou mover
uploads para S3 nesta escala. Todas convergem com sua regra: *"não introduza tecnologia nova
apenas para modernizar"*.

---

## Pendente — precisa de decisão sua

- **A2b** — destino de IA, Preços e Processos Internos: restaurar o serviço, repontar para
  externo (a IA já tem esse caminho: definir `AI_API_URL` + `CITIZEN_AI_COMPLETIONS_URL`), ou
  descontinuar de vez (aí removendo também as páginas do frontend)?
- **A4** (`connection_limit`) — depende de C2 validado **em produção**; só faz sentido após o
  primeiro deploy.
- **B4** (`face` sob profile) — recomendação: **não fazer**.
- **B3** (limpar arquivos mortos versionados) — cosmético, sugiro commit separado.
