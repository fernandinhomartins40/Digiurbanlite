# Instruções para o orquestrador — Plano de Produto

Você é o orquestrador. Seu trabalho é executar o [PLANO-PRODUTO.md](PLANO-PRODUTO.md) lançando subagentes por ondas, conferindo o resultado de cada onda e fazendo os commits. Você não implementa os movimentos; implementa só os arquivos compartilhados (abaixo) e os consertos de integração.

## Antes de começar

1. Leia inteiros: `CLAUDE.md` (raiz), [PLANO-PRODUTO.md](PLANO-PRODUTO.md) e as seções 5 e 9 de `ARQUITETURA-DE-PRODUTO.md`.
2. Confirme `git status` limpo na `main`. Se não estiver, pare e avise o dono.
3. Rode a linha de base e guarde o resultado, para distinguir erro novo de erro antigo:
   - `digiurban/backend`: `npm run type-check` e `npx jest __tests__/unit`
   - `digiurban/frontend`: `npm run type-check`

## Regras de orquestração

- **Tudo na `main`, sem branch e sem worktree** (regra do projeto). Os agentes de uma onda trabalham na mesma pasta, por isso cada um tem **arquivos próprios** e não toca em mais nada.
- **Agentes não fazem commit, push, nem rodam `git add`/`git stash`/`git checkout`.** Só você.
- **Arquivos compartilhados são seus**, nunca dos agentes:
  - `digiurban/backend/src/index.ts` (registro de rotas com `loadRoute`)
  - `digiurban/backend/prisma/schema.prisma` e migrations (e a cópia em `ultrazend-messages-server/prisma/schema.prisma`, se o modelo alterado existir lá)
  - `digiurban/frontend/components/admin/navigation/admin-nav-config.ts`
  - `digiurban/frontend/components/admin/AdminLayout.tsx`
  - `CLAUDE.md`
  
  O agente que precisar de mudança num deles **descreve a mudança exata no relatório final** e você aplica depois da onda. O plano foi desenhado para não precisar de tabela nova; se um agente pedir alteração de schema, confira antes se não há lugar existente.
- Lance todos os agentes de uma onda **na mesma mensagem** (paralelo). Só lance a onda seguinte depois de conferir e fazer o commit da anterior.
- Tipo de agente: `general-purpose`. Não defina modelo nem esforço (herdam os seus).

### O que todo briefing de agente deve conter

Copie o bloco do agente (seção "Agentes") e acrescente sempre este texto comum:

> Projeto DigiUrban (monorepo em `c:\FuseDev\Digiurbanlite`). Leia `CLAUDE.md` na raiz antes de qualquer coisa: as convenções dele são obrigatórias (multi-município com `tenantId`, erros `{ error }`, lógica em `src/services`, usuários leigos, textos em português com acentos, visual `lg-*`, `/api/*` é sempre do backend).
> Leia a seção do seu movimento em `docs/produto/PLANO-PRODUTO.md`: ela define a entrega e o "pronto quando".
> Outros agentes estão trabalhando ao mesmo tempo na mesma pasta. Altere **somente** os arquivos listados como seus (pode criar arquivos novos dentro das pastas indicadas). Não altere `backend/src/index.ts`, `prisma/schema.prisma`, `admin-nav-config.ts`, `AdminLayout.tsx` nem `CLAUDE.md`: se precisar, descreva a mudança exata no relatório. Não use git para alterar nada (sem commit, add, stash, checkout).
> Reaproveite serviços, hooks e componentes existentes; não duplique consultas nem crie dependência nova. Não remova função existente.
> Lógica nova com regra (ordenação, filtro de escopo, cálculo) leva um teste unitário pequeno em `digiurban/backend/__tests__/unit/`.
> Ao terminar, rode `npm run type-check` na(s) pasta(s) que alterou e os testes que criou. Erros em arquivos que não são seus: ignore e cite.
> Relatório final (curto): arquivos criados/alterados; rotas novas com o caminho de montagem pretendido; mudanças pedidas em arquivos compartilhados; resultado do type-check e dos testes; o que ficou de fora ou não foi conferido.

### Depois de cada onda

1. Leia os relatórios. Aplique as mudanças pedidas nos arquivos compartilhados (registrar rotas em `index.ts` no padrão `loadRoute`, montar componentes no layout).
2. Rode de novo type-check (backend e frontend) e `npx jest __tests__/unit` no backend. Compare com a linha de base; erro novo você conserta ou devolve ao agente responsável com `SendMessage`.
3. Confira com `git status`/`git diff --stat` se algum agente saiu dos seus arquivos. Se saiu, revise a mudança antes de aceitar.
4. Um commit por movimento (mensagem em português, no estilo do histórico: `feat(produto): ...`), depois `git push origin main`. O push dispara o deploy na VPS de teste; não há produção, pode seguir.
5. Diga ao dono, em poucas linhas, o que entrou e o que ficou pendente. Siga para a próxima onda sem esperar resposta, a menos que haja decisão que só ele pode tomar.

Não acesse a VPS para escrever nada. Não rode migrations em banco nenhum.

## Agentes

### Onda 1 (paralelo: A1, A2, A3, A4, A5)

**A1 — Mesa (backend)** · movimento M1, parte de backend
- Seus arquivos: `digiurban/backend/src/services/workbench/**` (novo), `digiurban/backend/src/routes/workbench.routes.ts` (novo), `digiurban/backend/__tests__/unit/workbench*.test.ts` (novo).
- Rota pretendida: `GET /api/admin/workbench` com `adminAuthMiddleware`.
- Atenção: o escopo é o ponto crítico — use `buildProtocolScopeWhere`/`protocol-access.service`, o escopo do processo interno e as permissões existentes; nunca monte filtro de secretaria à mão. Consultas em paralelo, no máx. 20 itens por fonte, fonte que falha volta vazia. Documente o formato da resposta no topo do arquivo de rota (o agente B1 vai consumir).

**A2 — Buscar e fazer** · movimento M2
- Seus arquivos: `digiurban/frontend/components/admin/command/**` (novo), `digiurban/backend/src/routes/admin-search.routes.ts` e `digiurban/backend/src/services/admin-search.service.ts` (novos), teste unitário próprio.
- Rota pretendida: `GET /api/admin/search?q=`.
- Entregue o componente `CommandPalette` pronto para ser montado uma vez no layout do painel (o orquestrador monta) e um botão `CommandPaletteButton` para o topo/Dock. **Não** altere `app/admin/page.tsx` (é do agente B1) nem o `SearchBar` existente.
- Telas vêm de `admin-nav-config.ts` (somente leitura) com os mesmos filtros de permissão do menu (`useAdminNavigation.ts`).

**A3 — Para você** · movimento M3
- Seus arquivos: `digiurban/backend/src/catalog/life-situations.ts` (novo), teste unitário próprio, `digiurban/backend/src/routes/citizen-services.ts` (acrescentar rotas), `digiurban/frontend/app/cidadao/page.tsx`, `digiurban/frontend/app/cidadao/servicos/page.tsx`, `digiurban/frontend/components/citizen/home/**` (novo).
- Atenção: itens só de informação (`isInformationOnly`) não abrem pedido; nível mínimo do serviço continua valendo. Na lista de pedidos do Início, deixe um lugar para a data prevista (o agente A4 cuida da tela do pedido; se o dado já vier na resposta, mostre).

**A4 — Pedido como entrega** · movimento M4
- Seus arquivos: `digiurban/frontend/app/cidadao/protocolos/**`, `digiurban/frontend/components/citizen/CitizenProtocolHeader.tsx`, `CitizenWorkflowProgress.tsx`, `CitizenStageFocusCard.tsx`, `digiurban/frontend/app/cidadao/servicos/[id]/solicitar/page.tsx`, `digiurban/frontend/hooks/useFormPrefill.*`, `digiurban/backend/src/routes/citizen-protocols.ts` (só se faltar dado na resposta).
- Comece auditando o que já existe; este movimento é completar. Nunca exponha nome de servidor ao cidadão. Reaproveitar documento só do próprio cidadão (ou de familiar com vínculo ACTIVE via `canActForFamilyMember`) e só documento aprovado.

**A5 — Primeiros passos** · movimento M5
- Seus arquivos: `digiurban/backend/src/services/activation/**` (novo), `digiurban/backend/src/routes/activation.routes.ts` (novo), teste unitário próprio, `digiurban/frontend/app/admin/primeiros-passos/**` (novo), `digiurban/frontend/components/admin/activation/**` (novo: `ActivationCard`, `WelcomeCard`).
- Rota pretendida: `GET /api/admin/activation` (ADMIN). Sem tabela nova: calcule dos dados existentes; "dispensar" usa as preferências do usuário já existentes (`/api/admin/preferences`).
- **Não** altere `app/admin/page.tsx`: entregue os cartões prontos e diga no relatório como montá-los (o agente B1 monta).

### Onda 2 (paralelo: B1, B2, B3)

**B1 — Início do servidor (tela)** · movimento M1, parte de tela
- Passe no briefing: o formato de resposta documentado pelo A1, e os nomes/props dos componentes entregues por A2 (`CommandPaletteButton`) e A5 (`ActivationCard`, `WelcomeCard`).
- Seus arquivos: `digiurban/frontend/app/admin/page.tsx` (reescrever), `digiurban/frontend/components/admin/workbench/**` (novo).
- Remover `getSearchItems` e o uso do `SearchBar` nesta página (não apagar o componente: o Painel do Prefeito usa). Manter os atalhos mais usados (lógica atual de `shortcuts`). Textos com acentos; `ADMIN` = "Administrador". Esqueletos no lugar de "Carregando...".

**B2 — Moldura dos apps** · movimento M6, parte 1
- Seus arquivos: `digiurban/frontend/components/apps/AppShell.tsx` (novo), `digiurban/frontend/app/admin/apps/page.tsx`, e as páginas de `agenda-atendimentos`, `cursos`, `feiras-mercados`, `cemiterios` em `digiurban/frontend/app/admin/apps/`.
- Só invólucro: cabeçalho, abas, vazio/erro/carregando. Nenhuma mudança de lógica. No relatório, escreva um guia de 10 linhas "como aplicar o AppShell" (vai para os agentes C1 e C2).

**B3 — Prova de valor** · movimento M7
- Seus arquivos: `digiurban/backend/src/services/city-numbers/**` (novo), `digiurban/backend/src/routes/public-city-numbers.routes.ts` (novo), `digiurban/backend/src/jobs/weekly-summary.job.ts` (novo), teste unitário próprio, `digiurban/frontend/app/prefeitura-em-numeros/**` (novo), e o ponto da tela de configurações onde entra o liga/desliga (dizer qual no relatório antes de alterar se for arquivo grande compartilhado).
- Atenção: rota pública resolve o município pelo endereço como as outras rotas públicas e usa `runAsTenant(id, async () => ...)`; só agregados, nenhum dado pessoal; página desligada responde 404. O job usa `forEachActiveTenant`, horário de Brasília, e não repete o aviso na mesma semana. Aviso pelo `notification.service` (sem e-mail). Se precisar de coluna nova ou de ligar o job na inicialização, peça no relatório.

### Onda 3

Primeiro, em paralelo, com o guia do B2 no briefing:

**C1 — Moldura: apps A–L** · arquivos: páginas de `agricultura`, `assistencia-social`, `cultura`, `defesa-civil`, `desenvolvimento-economico`, `educacao`, `esportes`, `habitacao`, `licenciamento` em `digiurban/frontend/app/admin/apps/`.

**C2 — Moldura: apps M–Z** · arquivos: páginas de `meio-ambiente`, `mobilidade-urbana`, `politicas-mulheres`, `saude`, `seguranca-publica`, `servicos-publicos`, `transportes-transito`, `turismo` em `digiurban/frontend/app/admin/apps/`. (`seguranca-escolar` está desligado por flag: não tocar.)

Para C1 e C2: só a página de entrada de cada app e suas abas principais; se um app já tem cabeçalho próprio (`HealthAppHeader`), faça o cabeçalho próprio usar o `AppShell` em vez de trocar tela por tela. Página que não encaixar sem mexer em lógica: deixar como está e citar.

Depois do commit de C1/C2, **sozinho**:

**C3 — Textos** · movimento M6, parte 2
- Pode alterar qualquer arquivo de `digiurban/frontend/app/admin/**` e `digiurban/frontend/components/admin/**`, **somente textos visíveis** (acentos, "Administrador", "Carregando..." → esqueleto quando for troca simples). Não renomear variáveis, rotas, chaves nem valores enviados à API. Vocabulário conforme M6. Relatar quantos arquivos mudou e o que deixou de fora.

## Encerramento

1. Type-check (backend e frontend), `npx jest __tests__/unit` (backend) e `npm run build` no frontend.
2. Atualize o `CLAUDE.md` com uma seção curta "Produto: mesa, busca e primeiros passos (2026-11)" no estilo das demais (onde fica cada coisa e as regras que quem vier depois precisa saber: Mesa lê os serviços existentes; telas da busca vêm do menu; situações de vida em `catalog/life-situations.ts`; app novo usa `AppShell`).
3. Commit e push finais.
4. Relatório ao dono: o que entrou por movimento, o que ficou de fora, o que não foi testado em tela (ninguém abriu o sistema rodando — diga isso) e o que ele deve conferir à mão na VPS de teste.
