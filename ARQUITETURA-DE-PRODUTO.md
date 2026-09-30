# Arquitetura de Produto — Digiurban

> Como manter a plataforma tão completa quanto é hoje, só que simples para quem usa.
> Análise feita sobre o código real (setembro/2026). Cada problema citado tem evidência no repositório.
> Decisões do produto já tomadas estão na seção 9.

---

## 0. Resumo em um minuto

A Digiurban já tem as peças de um ecossistema completo:
- **404 serviços** no catálogo;
- **protocolos** com etapas, pendências, prazo e documentos;
- **14 apps especializados** (TFD, farmácia, matrículas, habitação, licenciamento…);
- um motor de dados (Registry) que indexa tudo o que os formulários coletam.

O problema não é falta de funcionalidade. É que **as mesmas coisas aparecem com nomes diferentes, em lugares diferentes, construídas em épocas diferentes**, e o usuário precisa entender a arquitetura interna para trabalhar.

A proposta tem três movimentos:

1. **Quatro conceitos, e só quatro**: **Serviço, Protocolo, App e Etiqueta**. Os "módulos" (com dados e sem dados) **deixam de existir**. Tudo o que eles mostram passa a ser visto numa **única página de Gestão de Protocolos** (seção 10 mostra que é viável sem perder nada).
2. **Uma regra única de circulação**: o Serviço define *para onde o pedido vai*. **Todo pedido gera um Protocolo**, seja pelo portal, pelo bot ou pelo balcão, e ele é o recibo e o canal com o cidadão. O App é *a mesa de trabalho especializada* da secretaria e opera os casos que recebe dos protocolos.
3. **Cinco perguntas, cinco lugares**:

| Pergunta | Lugar |
|---|---|
| Onde **solicitar**? | Serviços (portal, bot ou Balcão) |
| Onde **acompanhar**? | Meus pedidos (cidadão) / Gestão de Protocolos (servidor) |
| Onde **analisar**? | Gestão de Protocolos, ou o App quando o serviço é especializado |
| Onde **executar**? | No App, ou no próprio protocolo quando o serviço é simples |
| Onde **administrar**? | Configurar |

Nenhuma funcionalidade é removida. O que sai são **caminhos duplicados, telas repetidas e ligações escondidas no código**.

---

## 1. Diagnóstico: por que parece grande e complexo

### Números

| Item | Hoje |
|---|---|
| Páginas do painel e do portal | 281 |
| Páginas de secretaria (21 arquivos quase iguais) | 7.501 linhas |
| Páginas de apps | 87 |
| Serviços no catálogo padrão | 404 |
| Arquivos do backend que dependem de `moduleType` | 43 |
| Arquivos do frontend sem uso aparente | ~300 |

### Os 8 nós de confusão (com evidência)

**1. "Módulo" significa três coisas diferentes, que convivem ao mesmo tempo**

| Geração | O que é | Onde |
|---|---|---|
| 1ª | Uma página **por serviço com dados**: protocolos daquele serviço + "Dados consolidados" + "Nova solicitação" | `/admin/secretarias/[dept]/[module]` (`DynamicModuleView`, substituiu 91 arquivos) |
| 1ª | Uma página **"Serviços Gerais" por secretaria** com os protocolos dos serviços sem dados | `/secretarias/[dept]/servicos-gerais` (`NoDataServicesView`) |
| 2ª | "Módulos gerais": Protocolos + Dados (Registry com widgets) | `SecretariaModulosSection`, presente nas 21 secretarias |
| 3ª | Apps: sistemas com tabelas próprias | `/admin/apps/*` |

Tudo aparece na mesma página de secretaria, além de uma página-piloto (`/admin/secretaria-modulos`). **Todos os "módulos" são vistas sobre a mesma tabela de protocolos.** Nenhum tem dados próprios.

**2. A ligação Serviço → App está escondida no código e é frágil**
- Quando alguém cria um serviço, o `moduleType` é **gerado a partir do nome** (`servicos/novo/page.tsx:368`).
- O encaminhamento para o app compara esse código com **48 códigos fixos** em `protocol-to-app.service.ts`.
- Consequência: quem cria o serviço não vê para onde o pedido vai. Um nome diferente faz o pedido **simplesmente não chegar ao app**, sem erro e sem aviso.
- O mesmo campo acumula pelo menos 6 funções: encaminhar para o app, atribuir etiqueta ao cidadão, validar unicidade, escolher o fluxo de etapas, montar a URL do módulo e indexar dados.

**3. O TFD inventa protocolos no atendimento presencial**
- A criação presencial no app grava `protocolId = "TFD-<hora>"` (`solicitacoes.service.ts`), um identificador que não existe.
- A coluna tem chave estrangeira para o protocolo, então **o atendimento presencial de TFD falha**.
- O cidadão atendido no balcão também não recebe número nem acompanhamento.

**4. Os apps não têm porta de entrada própria**
- Não há item "Apps" no menu. O único caminho é o card na página da secretaria.
- **Agricultura**: as 5 telas do app ficam em `/admin/agricultura/*`, fora de `/admin/apps`. **Nenhuma página ou menu leva até elas**, e os botões "ver/editar produtor" levam a páginas que não existem.

**5. A página da secretaria mistura seis finalidades**

Numa única página ficam:
- chamados do prefeito;
- indicadores;
- ações rápidas;
- módulos;
- **sugestões de serviços para criar** (tarefa de configuração);
- cards de apps.

Quem vai atender encontra ferramentas de configuração no caminho. E são 21 arquivos escritos à mão para o que deveria ser um único modelo.

**6. A mesma tarefa aparece em vários lugares**

| Tarefa | Lugares onde existe hoje |
|---|---|
| Ver protocolos | `/admin/protocolos`, módulo Protocolos da secretaria, página por serviço, "Serviços Gerais", `PendingProtocolsList` |
| Ver os dados dos formulários | "Dados consolidados" (6 vistas por heurística no frontend) **e** "Dados" do Registry (widgets por arquétipo no backend): **duas implementações da mesma ideia** |
| Chamados do prefeito | `/admin/chamados`, `/chamados/lista`, `/secretarias/[dept]/chamados-recebidos`, bloco na página da secretaria |
| Serviços | "Catálogo de Serviços" (a página se chama *Gerenciamento de Serviços*) e "Gestão de Serviços" (a página se chama *Estatísticas*) |
| Biometria presencial | `/admin/atendimento-presencial/biometria-facial` e `/admin/cidadaos/biometria-facial` |
| Análises | Analytics, Relatórios, IA, Painel do Prefeito |
| Documentos do cidadão (portal) | `/cidadao/documentos` e `/cidadao/meus-documentos`, **ambas com o título "Meus Documentos"** |

**7. Caminhos que levam a lugar nenhum**
- A tela "Mais" do portal do cidadão leva a **5 páginas inexistentes**: notificações, configurações, ajuda, feedback e sobre.
- Páginas de 6 linhas (`/admin/workflows`, `/admin/processos-internos`) ficam fora do menu.
- `routes/index.ts` do backend nunca é carregado, então as rotas de categorias de cidadão não existem.

**8. O vocabulário é interno**

A interface expõe termos técnicos: "COM_DADOS", "SEM_DADOS", "moduleType", "Módulos", "Micro Sistemas", "Serviços Gerais". Para um servidor leigo, eles não dizem **o que fazer**.

---

## 2. Vocabulário oficial: quatro conceitos

| Conceito | É | Não é | Exemplo | Quem vê |
|---|---|---|---|---|
| **Serviço** | O que a prefeitura **oferece**. Define quem pode pedir, o que informar e anexar, o prazo e **para onde o pedido vai**. | Um processo nem uma tela de trabalho. | "Tratamento Fora do Domicílio", "2ª via de IPTU" | Cidadão (vitrine); gestor (configura) |
| **Protocolo** | O **pedido registrado**: número, situação, prazo, mensagens, pendências, documentos, **os dados do formulário** e a avaliação. Igual para todo serviço. | O lugar do trabalho especializado. | "Pedido nº 2026-000777" | Cidadão ("Meus pedidos"); servidor (Gestão de Protocolos) |
| **App** | A **mesa de trabalho especializada** da secretaria, com operação própria: filas, agenda, estoque, frota, pareceres. | Uma etapa do protocolo nem um módulo. | TFD, Farmácia, Matrículas, Habitação | Equipe da secretaria |
| **Etiqueta** | Uma **marca** no cidadão ganha ao ser atendido. | Um cadastro nem um app. | "Produtor Rural", "Beneficiário do Bolsa-Aluguel" | Servidores (ficha do cidadão, filtro de cidadãos) |

**O que deixa de existir na interface:**
- **"Módulo"**, "Serviços com dados", "Serviços sem dados", "Serviços Gerais" e "Dados consolidados".
- Para o usuário existe um só tipo de pedido. Se o serviço tem formulário, os dados aparecem **no próprio protocolo** e, quando se quer ver muitos, na **vista de dados da Gestão de Protocolos**.
- O Registry continua existindo **como motor**: indexa, busca e agrega os dados dos formulários. Ele não é mais um lugar onde o usuário precisa ir.

---

## 3. Como tudo se liga

```
            PORTAS DE ENTRADA (todas geram protocolo)
  ┌──────────────────────────────────────────────────┐
  │  Portal do cidadão  ·  Bot  ·  Balcão presencial  │
  └───────────────────────┬──────────────────────────┘
                          │ escolhe um SERVIÇO
                          ▼
                ┌───────────────────┐
                │     SERVIÇO       │  declara o destino:
                │ (define o destino)│  FILA  ou  APP (+ ação)
                └─────────┬─────────┘
                          │ gera sempre
                          ▼
                ┌───────────────────┐   entrega o caso    ┌──────────────────┐
                │    PROTOCOLO      │ ──────────────────▶ │       APP        │
                │ pedido + dados +  │                     │ mesa de trabalho │
                │ canal c/ cidadão  │ ◀────────────────── │ (TFD, Farmácia…) │
                └─────────┬─────────┘  devolve situação,  └──────────────────┘
                          │            pendências e documentos
                          ▼
            Ao concluir: ETIQUETA no cidadão · dados indexados (Registry)
```

**Regras de circulação:**
1. **Todo pedido gera um Protocolo**, venha do portal, do bot ou do balcão. É o recibo do cidadão e o registro de prestação de contas. O **canal** de origem fica registrado no protocolo.
2. **O Serviço declara o destino**, que é explícito e visível na configuração:
   - **Fila**: o serviço é analisado e concluído no próprio protocolo (certidões, declarações, solicitações gerais, cadastros);
   - **App**: o protocolo entrega o caso ao app e passa a mostrar ao cidadão a situação vinda dele.
3. **O App opera o caso até o fim** (viagens, estoque, agenda, pareceres) e devolve ao protocolo, por um mecanismo único, as mudanças de situação, as pendências para o cidadão e os documentos emitidos.
4. **Atendimento presencial também gera protocolo.** Um app como o TFD, ao registrar um atendimento de balcão, cria o protocolo pelo serviço correspondente, em nome do cidadão. Acabam os identificadores inventados.
5. **Etiqueta e indexação são consequências automáticas** da conclusão do atendimento. Ninguém preenche nada à mão.

---

## 4. Onde cada coisa acontece

| | Cidadão | Servidor (atendimento) | Equipe da secretaria | Gestor/Prefeito | Administrador |
|---|---|---|---|---|---|
| **Solicitar** | Portal › **Serviços** (ou bot) | **Balcão**: pede *em nome* do cidadão (gera protocolo) | Balcão, ou dentro do **App**, que também gera protocolo | — | — |
| **Acompanhar** | Portal › **Meus pedidos** | **Gestão de Protocolos** › Minha fila | Gestão de Protocolos (filtrada pela secretaria) | Painel do Prefeito | — |
| **Analisar** | — | **Protocolo** (serviço de fila) | **App** (serviço especializado) | — | — |
| **Executar** | Responde pendências em *Meus pedidos* | Protocolo | **App** | — | — |
| **Consultar dados dos formulários** | — | Protocolo (1 pedido) | **Gestão de Protocolos › vista Dados** (muitos pedidos, com mapa, agenda e exportação) | **Relatórios** | — |
| **Administrar** | — | — | Secretaria › **Configurar** | — | **Configurações** (plataforma) |

---

## 5. Nova organização das telas

### 5.1 Menu do servidor (organizado por tarefa, não por estrutura interna)

```
Início                   ← "Sua fila hoje": atrasados, vencendo, sem responsável, aguardando cidadão
Atendimento
  ├─ Gestão de Protocolos ← página ÚNICA: fila + filtros por secretaria/serviço + vista Dados (seção 10)
  ├─ Balcão              ← NOVO: identificar cidadão → escolher serviço → protocolo gerado
  └─ Cidadãos            ← ficha única (dados, pedidos, etiquetas, família, documentos, biometria)
Minhas secretarias       ← só as do servidor (já implementado)
  └─ <Secretaria>        ← espaço com 4 abas fixas (5.2)
Apps                     ← NOVO atalho: os apps a que o servidor tem acesso
Comunicação              ← Mensagens · E-mail
Documentos               ← Meus documentos · Modelos · Assinaturas · Certificados (abas de uma tela)
Gestão (gestores)        ← Painel do Prefeito · Demandas do Gabinete · Mapa · Relatórios
Configurações (admin)    ← Serviços · Apps · Equipe e organograma · Bot · Integrações · Município
```

### 5.2 Espaço da secretaria: um modelo, quatro abas, as mesmas em todas

| Aba | Conteúdo | Substitui |
|---|---|---|
| **Visão geral** | Indicadores reais do app + protocolos em aberto (`SecretariaKpiCards`, já feito), demandas do gabinete, atalhos | cabeçalho, KPIs, "Ações rápidas", bloco de chamados |
| **Protocolos** | A **Gestão de Protocolos** já filtrada pela secretaria, incluindo a vista Dados por serviço | módulo por serviço, "Serviços Gerais", módulo Protocolos, módulo Dados, `PendingProtocolsList` |
| **Apps** | Cards dos apps da secretaria (TFD, Farmácia…) | cards soltos no fim da página |
| **Configurar** | Serviços da secretaria, sugestões de novos serviços, equipe, parâmetros dos apps | sugestões de serviços misturadas à operação |

As 21 páginas escritas à mão (7.501 linhas) passam a ser **um modelo + uma configuração por secretaria**.

### 5.3 Portal do cidadão (decidido)

| Hoje | Novo |
|---|---|
| Início = chat | Início = **"Do que você precisa?"** (busca de serviços) + **"Aguardando você"** + situação dos pedidos; o chat vira **assistente disponível em todas as telas** |
| Menu "Protocolos" | "**Meus pedidos**" (o número do protocolo continua visível em cada pedido) |
| Duas telas "Meus Documentos" | Uma: **Meus documentos** (enviados e recebidos da prefeitura) |
| "Mais" com 5 links quebrados | Só o que existe: Família, Perfil, Biometria, Ajuda (real) |

### 5.4 Balcão: atendimento presencial (decidido: sempre gera protocolo)

1. **Identificar** o cidadão (CPF, biometria ou cadastro rápido);
2. **Escolher o serviço** e preencher o formulário junto com ele;
3. **Concluir**: o protocolo é gerado (canal *Balcão*) e segue o destino do serviço. Se o destino for um app, o caso aparece lá. O cidadão sai com o número do pedido e pode acompanhar em "Meus pedidos".

O mesmo mecanismo é usado **dentro dos apps**: o "Nova solicitação" do TFD passa a gerar o protocolo pelo serviço de TFD, em vez de inventar um identificador. Hoje essas peças estão em quatro lugares: `cidadaos/novo`, biometria (em duas rotas), `servicos/[id]/solicitar` e "Novo Protocolo".

---

## 6. O que muda por baixo (a complexidade vai para a tecnologia)

### 6.1 Serviço com destino explícito, no lugar do `moduleType` gerado pelo nome
- Novo campo no serviço: **destino** = `FILA` ou `APP` + **ação do app** (ex.: `tfd.solicitacao`, `esportes.matricula`, `habitacao.inscricao`).
- No assistente de criação, o campo aparece como uma escolha simples: *"O que acontece depois do pedido? ◯ Analisado no protocolo ◯ Vai para o app TFD (solicitação de tratamento)"*.
- O conversor protocolo→app passa a consultar o destino, não o nome. A tabela de 48 códigos vira **dados**; os 404 serviços são migrados por script, com o mapeamento atual.
- O `moduleType` continua como identificador técnico estável, mas **deixa de ser derivado do nome** e de acumular funções.

### 6.2 Catálogo de Apps (registro único)
Uma configuração com, para cada app:
- código, nome, secretaria(s), feature do plano e rota;
- **ações de entrada** que ele aceita;
- regra de acesso: equipe da secretaria + ADMIN, já implementada em `requireDepartmentAccess`.

O menu "Apps", a aba Apps da secretaria e o campo "destino" do serviço **leem desse catálogo**.

### 6.3 Contrato Protocolo ↔ App (igual para todos)
- Todo caso de app referencia o protocolo que o originou. Os 13 apps novos já têm `protocolId`. O TFD deixa de inventar identificadores: seu cadastro presencial gera o protocolo pelo Balcão.
- O protocolo ganha o campo **canal** (`PORTAL | BOT | BALCAO`).
- Uma **ponte única** (`app-protocol-bridge`) para o app avisar o protocolo: situação, pendência para o cidadão e documento emitido. Hoje cada app conclui o protocolo do seu jeito ("não-fatal", espalhado).

### 6.4 Gestão de Protocolos: uma página, um detalhe
Ver seção 10.

### 6.5 Espaço da secretaria como modelo
`SecretariaWorkspace` + configuração por secretaria: nome, ícone, apps (vindos do catálogo), indicadores (já em `SecretariaKpiCards`) e serviços sugeridos.

---

## 7. Mapa de consolidação: nada se perde

| Hoje (onde está) | Vai para | Observação |
|---|---|---|
| `/secretarias/[dept]/[module]` (módulo por serviço com dados) | Gestão de Protocolos, filtrada pelo serviço (**vista Dados**) | a URL antiga redireciona já filtrada |
| `/secretarias/[dept]/servicos-gerais` (serviços sem dados) | Gestão de Protocolos, filtrada pela secretaria | idem |
| "Dados consolidados" (6 vistas) + módulo "Dados" do Registry (widgets) | **vista Dados** da Gestão de Protocolos (uma implementação só) | seção 10 |
| "Nova solicitação" dentro do módulo | **Balcão** / "Novo protocolo" | |
| Sugestões de serviços na página da secretaria | Secretaria › Configurar | |
| Cards de apps no fim da página | Secretaria › Apps + menu Apps | |
| `/admin/agricultura/*` | `/admin/apps/agricultura/*` | hoje inalcançável |
| `/admin/servicos` + `/admin/gerenciamento-servicos` | Configurações › Serviços (abas Catálogo · Desempenho) | |
| `/admin/chamados`, `/chamados/lista`, `/secretarias/[dept]/chamados-recebidos` | **Demandas do Gabinete** | |
| Biometria em duas rotas | Ficha do cidadão + Balcão | |
| `cidadaos/novo`, `servicos/[id]/solicitar`, "Novo Protocolo", "Nova solicitação" do TFD | **Balcão** | |
| Analytics · Relatórios · IA | Gestão › Relatórios (com abas) | a IA vira assistente contextual |
| Templates · Assinaturas · Certificados · Meus documentos | Documentos (abas) | |
| Portal: `/documentos` + `/meus-documentos` | **Meus documentos** | |
| Portal: "Protocolos" | **Meus pedidos** | |
| Portal: 5 links quebrados em "Mais" | removidos (ou criados: Ajuda, Notificações) | |
| `/admin/workflows`, `/admin/processos-internos` (esboços) | Configurações › Serviços › etapas | já fora do menu |

---

## 8. Plano de transição

Todas as fases são reversíveis e entram sem perder funcionalidade: URLs antigas redirecionam, e nada é apagado antes de o substituto estar no ar.

| Fase | Entrega | Por que primeiro | Esforço |
|---|---|---|---|
| **1. Gestão de Protocolos única** ✅ | Filtros por secretaria e serviço + **vista Dados** por serviço; módulos redirecionam para ela; "Módulo" sai da interface | É a maior fonte de confusão e é tecnicamente a mais madura (seção 10) | **concluída** (ver 10.1) |
| **2. Fundamentos do contrato** ✅ | Protocolo com *canal*; TFD presencial gerando protocolo; ponte única App→Protocolo; Agricultura em `/apps`; portal sem links quebrados e com uma só tela de documentos | Corrige defeitos reais e fixa a regra | baixo |
| **3. Destino explícito do Serviço** ✅ | Campo *destino* + catálogo de apps; migração dos 404 serviços; o assistente mostra o destino | Acaba com a ligação escondida; pré-requisito do Balcão | médio |
| **4. Balcão** ✅ | Atendimento presencial em 3 passos, gerando protocolo | Une 4 fluxos espalhados | médio |
| **5. Espaço da secretaria** ✅ | Modelo único com 4 abas; as 21 páginas viram configuração; menu "Apps" | Organiza o dia a dia da equipe | médio |
| **6. Portal do cidadão** ✅ | Início "Do que você precisa?", "Meus pedidos", assistente no lugar da home de chat | Maior impacto em usuários leigos | médio |
| **7. Consolidações e limpeza** ✅ | Demandas do Gabinete, Documentos em abas, Serviços (catálogo + desempenho), Relatórios; remover páginas de módulo, piloto, esboços e órfãos confirmados; desmembrar o `moduleType` | Só depois de tudo validado | baixo |

**Como medir:**
- itens de menu do servidor: de ~30 para ~12;
- lugares para ver protocolos: de 5 para 1;
- implementações de "vista de dados": de 2 para 1;
- páginas de secretaria mantidas à mão: de 21 para 0;
- serviços com destino desconhecido: 0;
- links quebrados: 0.

---

## 9. Decisões do produto

| Tema | Decisão |
|---|---|
| Início do portal do cidadão | **Busca de serviços + "Aguardando você" + situação dos pedidos**; o chat vira assistente em todas as telas |
| Módulos com dados e sem dados | **Deixam de existir**; uma única página de Gestão de Protocolos, sem confundir com os Apps (viabilidade na seção 10) |
| Nome no portal | **"Meus pedidos"**, com o número do protocolo visível |
| Balcão / atendimento presencial | **Sempre gera protocolo**, inclusive quando o registro é feito dentro de um app |

---

## 10. Viabilidade: uma única página de Gestão de Protocolos (sem módulos)

### Conclusão: **viável, sem perda de funcionalidade, com risco baixo**

Todo "módulo" existente é **uma vista sobre a mesma tabela de protocolos** (`ProtocolSimplified` + os dados do formulário em `customData`). Nenhum tem dados próprios. Juntar os módulos é unir **vistas**, não sistemas. Os Apps, que têm tabelas e operação próprias, **não entram** nessa junção.

### O que cada módulo faz hoje e onde fica na página única

| Funcionalidade atual | Onde está hoje | Na Gestão de Protocolos | Já existe? |
|---|---|---|---|
| Lista de protocolos de um serviço | módulo por serviço | filtro **Serviço** | ✅ backend (`serviceId`, `serviceIds`) |
| Lista de protocolos dos serviços sem dados da secretaria | "Serviços Gerais" | filtro **Secretaria** (sem serviço escolhido) | ✅ (`departmentCode`, implementado nesta rodada) |
| Busca e filtro de status | módulo e Serviços Gerais | busca, status, prioridade | ✅ |
| Contadores (total, pendentes, em análise, concluídos) | cabeçalho do módulo | visões com contadores (em aberto, atrasados, vencendo, sem responsável…) | ✅ (`queue-summary`) |
| Prazo, responsável, atribuir, delegar, encaminhar | parcialmente | na fila | ✅ |
| "Nova solicitação" em nome do cidadão | botão do módulo | "Novo protocolo" / **Balcão** | ✅ (seletor de serviço) |
| **Dados consolidados**: tabela com os campos do formulário | aba do módulo | **vista Dados**: ao escolher um serviço com formulário, as colunas viram os campos dele | 🔶 a construir (motor pronto) |
| Vistas automáticas: mapa de denúncias, agenda de agendamentos, linha do tempo de licenças, inscrições, cadastro | aba do módulo (heurística no frontend) | modos da vista Dados, escolhidos automaticamente pelo tipo de campo | 🔶 reaproveitar os 6 componentes existentes |
| Widgets, painel e consultas salvas | módulo "Dados" (Registry) | "personalizar" da vista Dados | 🔶 reaproveitar `DataWorkspace` |
| Exportar CSV | módulo "Dados" | botão Exportar | 🔶 reaproveitar |
| Aprovar e rejeitar | detalhe | detalhe do protocolo (como hoje) | ✅ |

### Como fica a página

```
Gestão de Protocolos
[ Em aberto 34 | Minha fila 8 | Sem responsável 5 | Atrasados 3 | Vencem em 48h 4 | Todos ]
Secretaria: [Todas ▾]   Serviço: [Todos ▾]   Busca...   Status ▾   Ordenar ▾

(sem serviço escolhido)                 (serviço com formulário escolhido)
┌──────────────────────────────┐       ┌──────────────────────────────────────────────┐
│ Fila de protocolos (cards)   │       │ Vista:  ● Fila   ○ Dados                     │
│ prazo · responsável · ações  │       │ Dados: tabela com os campos do formulário   │
└──────────────────────────────┘       │ + mapa / agenda / linha do tempo (automático)│
                                       │ + filtros por campo · Exportar · Personalizar │
                                       └──────────────────────────────────────────────┘
```

- Sem serviço escolhido, a página é a fila de sempre, **igual para qualquer serviço**. O usuário nunca precisa saber se o serviço "tem dados" ou não.
- Ao escolher um serviço que tem formulário, aparece a alternância **Fila / Dados**. Os dados do formulário deixam de ser um "lugar" e viram uma **forma de olhar** os mesmos pedidos.

### O que muda por baixo

1. **Uma só implementação de vista de dados.** Hoje há duas: a heurística do frontend (`consolidated-data-intelligence` + 6 vistas) e os widgets do Registry (`deriveWidgets` no backend). A proposta mantém o **Registry como motor**, porque ele filtra e agrega no servidor e aguenta volume, e reaproveita os componentes visuais das 6 vistas. A heurística duplicada é aposentada.
2. **O serviço aponta para o seu tipo de dado.** O Registry já liga o tipo de dado ao serviço (`EntityType.code = moduleType`). Com o destino explícito (fase 3) essa ligação vira um campo próprio.
3. **Redirecionamentos.** `/secretarias/[dept]/[module]` → `/admin/protocolos?departamento=…&servico=…&vista=dados`; `/servicos-gerais` → `/admin/protocolos?departamento=…`. Links salvos continuam funcionando.
4. **Backend de módulos aposentado depois.** `tab-modules.ts` (1.924 linhas), `MANAGEMENT_CONFIGS` e o `switch` de `analyzeCustomData`, já marcados como obsoletos no plano do Registry, são removidos só depois da validação.

### Riscos e como tratar

| Risco | Tratamento |
|---|---|
| O Registry ainda não foi ativado em produção (os scripts de importação e backfill nunca rodaram) | Ativar antes da vista Dados (`import-configs --apply` → `backfill --apply`). Enquanto isso, a vista Dados lê o `customData` direto dos protocolos do serviço, como a aba atual já faz |
| Serviço com muitos protocolos | Paginação no servidor via Registry, em vez de carregar tudo no navegador como faz hoje o "Dados consolidados" |
| Usuário acostumado ao caminho antigo | URLs antigas redirecionam já filtradas; a aba Protocolos da secretaria abre a mesma página |
| Perder alguma vista específica | As 6 vistas atuais são portadas uma a uma; a página de módulo só é removida quando todas estiverem na vista Dados |

### Esforço estimado (fase 1)
- **Backend:** filtro `serviceId` na fila (já existe); endpoint de colunas do serviço (a partir do `formSchema`); paginação e filtro por campo via Registry.
- **Frontend:** seletores Secretaria/Serviço na fila; alternância Fila/Dados; porte das 6 vistas; redirecionamentos.
- Da ordem de alguns dias de trabalho, entregável em partes: primeiro filtros e redirecionamentos (os módulos somem da interface), depois a vista Dados.

### 10.1 Status da implementação (Fase 1 — concluída)

**Backend**
- `GET /api/protocols/filter-options`: secretarias visíveis ao usuário (ADMIN: todas; equipe: as suas) e serviços da secretaria escolhida, indicando se têm formulário. Também resolve URLs antigas de módulo, tanto pelo `moduleType` quanto pelo nome em slug.
- `GET /api/protocols/service-data`: dados dos formulários de **todos** os pedidos do serviço, no escopo do usuário, até 2.000. Os antigos módulos só viam os 50 mais recentes.
- A fila e os contadores (`queue-summary`) respeitam secretaria e serviço.
- Correção: o cache Redis da busca de serviço por módulo não incluía o município (risco de vazamento entre municípios).

**Frontend**
- `/admin/protocolos` passou a se chamar "Gestão de Protocolos":
  - seletores Secretaria e Serviço;
  - alternância "Fila de pedidos / Dados dos formulários";
  - os filtros da fila ficam ocultos na vista Dados.
- `ServiceDataView`: reaproveita as 6 vistas automáticas e, quando o serviço tem tipo de dado no Registry, oferece o **Painel personalizável** (widgets). Nada do antigo módulo "Dados" se perdeu.
- `/secretarias/[dept]/[module]` e `/secretarias/[dept]/servicos-gerais` redirecionam para a Gestão de Protocolos já filtrada.
- O bloco "Protocolos e Dados" das 21 secretarias virou a entrada "Pedidos da secretaria", com atalhos para os dados de cada serviço.
- Termos técnicos ("COM_DADOS", "Módulos de Gestão") saíram das páginas das secretarias.

**Validação**
- Endpoints testados com perfis reais: ADMIN, secretário da própria secretaria e de outra secretaria. O escopo não vaza.
- Navegador (Playwright, build de produção):
  - fila da secretaria;
  - redirecionamento da URL antiga para a vista Dados;
  - alternância entre fila e dados;
  - redirecionamento de "Serviços Gerais";
  - entrada na página da secretaria;
  - celular com 390 px sem rolagem lateral;
  - nenhum erro de console ou de API.

**Pendente para as próximas fases**
- Remover fisicamente `DynamicModuleView`, `NoDataServicesView`, `tab-modules.ts` e a heurística duplicada (fase 7, após validação em produção).
- Ativar o Registry em produção, para que o Painel personalizável apareça.
- Indicadores da página de Agricultura (junto com a mudança do app para `/apps`, fase 2).

### 10.2 Status da implementação (Fase 2 — concluída)

**Canal do pedido.** O protocolo ganhou `channel` (PORTAL | BOT | BALCAO), gravado em cada porta de entrada:
- portal do cidadão = PORTAL;
- bot = BOT;
- servidor pedindo em nome do cidadão = BALCAO.

A migration `20260929120000_protocol_channel` é aditiva e idempotente, validada em banco com e sem a coluna.

**TFD: dois defeitos graves corrigidos.**
- **Pedido digital nunca chegava ao app.** A conversão protocolo→TFD gravava `protocolId` = id do fluxo (chave estrangeira inválida), omitia campos obrigatórios e usava a prioridade `NORMAL`, que não existe no enum. Falhava sempre, em silêncio. Agora a solicitação nasce vinculada ao protocolo real, com todos os campos.
- **Atendimento presencial inventava protocolo** (`TFD-<hora>`). Agora gera o protocolo pelo serviço de TFD do município (canal BALCAO, em nome do cidadão), e a tela mostra ao servidor o número a entregar ao cidadão.
- Concluir uma viagem agora marca como realizadas as solicitações do paciente e dos passageiros. Antes, elas ficavam abertas para sempre.

**Ponte única App → Protocolo** (`services/apps/app-protocol-bridge.service.ts`).
- Substitui 10 cópias de `concluirProtocolo`: licenciamento, meio ambiente, habitação, defesa civil, mulheres, esportes, cultura, trânsito, mobilidade e OS de serviços públicos. Essas cópias gravavam o status direto no banco.
- Agora tudo passa pelo **motor de status**: histórico com o motivo que o cidadão vê, SLA encerrado e notificação.
- No TFD, a documentação aprovada coloca o pedido em "Em progresso", e o indeferimento (regulação ou gestão) e a realização concluem o pedido com o motivo.
- No caso de Políticas para Mulheres, que é sigiloso, a mensagem ao cidadão não expõe detalhes.

**Agricultura.** O app foi para `/admin/apps/agricultura`:
- tem tela inicial com as 5 áreas;
- as URLs antigas redirecionam;
- a página da secretaria ganhou o card do app e indicadores reais de produtores;
- "ver produtor" abre o pedido de origem ou a ficha do cidadão. Antes levava a páginas que não existiam.

**Portal do cidadão.**
- "Meus pedidos" no menu lateral, no menu inferior, no início e no título.
- Uma só tela "Meus documentos", com as abas "Documentos pessoais" e "Assinaturas digitais". A antiga `/meus-documentos` abre a aba certa.
- "Mais" perdeu os 5 links para páginas inexistentes e o contador fixo "3" de notificações.

**Validação.**
- Backend real: pedido digital de TFD (PORTAL, caso criado com prioridade e destino); pedido presencial (BALCAO, criador = médico); ciclo documentação → regulação → gestão → viagem, com histórico `CRIACAO → INICIO_EXECUCAO → CONCLUSAO` e os motivos; indeferimento com motivo.
- Playwright no build de produção: redirecionamento e tela inicial da Agricultura; card e indicadores da secretaria; "Meus pedidos"; abas de documentos; redirecionamento de `/meus-documentos`; "Mais" sem links quebrados. Nenhum erro.

**Registrado para depois.** A atribuição de servidor e o início de fluxo de etapas ainda gravam `PROGRESSO` direto no protocolo (são fluxos internos do protocolo, não de apps).

### 10.3 Status da implementação (Fase 3 — concluída)

**Catálogo de Apps** (`backend/src/config/app-catalog.ts`): fonte única com os 16 apps (nome, secretarias, rota e **62 ações de entrada**). Os códigos das ações são os mesmos do conversor protocolo→app, então nada mudou de comportamento. `GET /api/app-catalog?departmentCode=…` alimenta o painel.

**Serviço com destino explícito**
- Campos `destination` (FILA | APP) e `appAction` em `ServiceSimplified`.
- A migration `20260929180000_service_destination` é aditiva e idempotente e preenche os serviços existentes com o mapeamento atual: código de app vai para APP; variações de TFD vão para o app de TFD; o resto vai para FILA.
- O encaminhamento (criação e aprovação) passa a usar o destino declarado:
  - **FILA nunca vai para app**, mesmo que o código "pareça" de app;
  - **APP usa a ação escolhida, independente do nome do serviço**;
  - serviço sem destino gravado mantém o comportamento legado.
- A API de serviços valida o destino (a ação precisa existir e ser de um app da secretaria do serviço) e devolve o **destino efetivo**. Assim, serviços criados por seed ou provisionamento aparecem corretamente e não são rebaixados a FILA ao salvar.

**Telas**
- Assistente de criação: passo novo "Depois do pedido".
- Edição: bloco "O que acontece depois do pedido?".
- Catálogo: cada serviço mostra "Depois do pedido: App X" ou "Analisado no protocolo".

**Validação**
- 26 testes unitários, incluindo uma **trava de paridade**: o teste lê o conversor e falha se algum código tratado por ele não estiver no catálogo, ou se o catálogo tiver ação sem conversor.
- Backend real:
  - migration de preenchimento e idempotência;
  - serviço de **nome livre** apontado para o app de Carteiras gerou a carteira;
  - serviço com código de app, mas destino FILA, **não** gerou caso;
  - app de outra secretaria recusado;
  - destino efetivo de serviço sem destino gravado.
- Playwright: catálogo, edição e assistente. Nenhum erro.

### 10.4 Status da implementação (Fase 4 — concluída)

**Balcão** (`/admin/balcao`, no menu Atendimento e no botão "Novo atendimento" da Gestão de Protocolos). O atendimento presencial tem 3 passos:
1. **Quem está sendo atendido?** Busca por nome ou CPF (CPF mascarado), com atalhos para cadastrar a pessoa ou identificá-la por biometria.
2. **Qual serviço?** O servidor vê os serviços das suas secretarias (ADMIN vê todos). Cada serviço mostra para onde o pedido vai ("Vai para: App X" ou "Analisado no protocolo").
3. **Preencher e concluir.** Usa o formulário do serviço com a pessoa já escolhida. Ao concluir, aparece o **número do pedido** em destaque, com três botões: "Imprimir comprovante", "Outro serviço para esta pessoa" e "Atender outra pessoa".

**Regras**
- Todo atendimento de balcão gera protocolo com canal `BALCAO` e registra o servidor que atendeu (`createdById`). Se o destino do serviço for um app, o caso aparece nele, como nos pedidos do portal.
- **Permissões de interface unificadas.** O `/me` devolvia um mapa de permissões antigo e diferente do que o backend aplica, e escondia de quem atende o cadastro de cidadão e o próprio Balcão. Agora ele devolve a união com o mapa do middleware. Além disso, `protocols:create` passou a valer para USER, COORDINATOR e MANAGER, como já estava no mapa canônico `types/roles.ts`. O backend não checa essa permissão, que só libera telas.

**Validação**
- Playwright com uma coordenadora de Mobilidade, cobrindo o fluxo inteiro:
  - o menu e o botão "Novo atendimento" abrem o Balcão;
  - a busca "Maria" encontra a cidadã;
  - só aparece o serviço da secretaria dela, com o destino;
  - o formulário é preenchido e enviado, e aparece o número;
  - "Outro serviço para esta pessoa" volta ao Balcão com a pessoa já escolhida.
- Nenhum erro no navegador nem na API.
- No banco: protocolo `2026-000001`, canal `BALCAO`, `createdById` = atendente e carteira criada no app de Carteiras & Gratuidades.

### 10.5 Status da implementação (Fase 5 — concluída)

**Espaço da secretaria.** Um modelo (`SecretariaWorkspace`) e uma rota (`/admin/secretarias/[department]`) substituem as 21 páginas escritas à mão e as 21 cópias da página de sugestões (−11 mil linhas). As URLs continuam as mesmas. A aba ativa fica na URL (`?aba=protocolos`), então dá para compartilhar o link.

| Aba | Conteúdo |
|---|---|
| **Visão geral** | Indicadores reais (`SecretariaKpiCards`), atalhos para Novo atendimento (Balcão), Pedidos e Apps, e as demandas do gabinete |
| **Protocolos** | Contadores da fila da secretaria (em aberto, atrasados, vencendo, sem responsável, comigo). Cada contador abre a Gestão de Protocolos já filtrada. Também tem os atalhos para os dados dos formulários por serviço |
| **Apps** | Apps do catálogo e as telas de apoio da secretaria. Se a secretaria não tiver app, a aba diz isso claramente |
| **Configurar** | Só para gestores (`services:create`). Mostra os serviços com o destino ("Depois do pedido: App X" ou "Analisado no protocolo"), as sugestões de novos serviços e a equipe |

**Outras mudanças**
- **Indicadores reais para mais 5 secretarias:** Saúde, Mobilidade, Trânsito, Defesa Civil e Políticas para Mulheres. A página antiga da Saúde lia campos que o backend não devolve e mostrava sempre 0.
- **Menu "Apps"** (`/admin/apps`): mostra os apps que o servidor pode abrir, agrupados por secretaria. `GET /api/app-catalog?mine=true` usa a mesma regra do `requireDepartmentAccess`.
- **Telas de apoio fora do catálogo** (Cadastros da Saúde, Transporte e Segurança Escolar, Famílias, Benefícios e Unidades da Assistência Social) ficam listadas em `lib/app-catalog-client.ts`.
- **Correções em componentes compartilhados:**
  - `Button asChild` passou a funcionar. Antes ele renderizava `<button><a>`, que é HTML inválido, e clicar fora do texto não navegava; afetava 15 telas.
  - `Tabs` ganhou `role=tab/tablist/tabpanel`, `aria-selected` e `data-state`. Por isso, os estilos de aba ativa já escritos no login e nas abas de protocolo do cidadão passaram a funcionar.

**Validação**
- Playwright com três papéis, 13 passos, sem erros no navegador nem na API:
  - **Coordenadora:** vê as 3 abas, sem Configurar. Os contadores batem com os 2 pedidos em aberto. Nas abas Protocolos e Apps, a URL acompanha a aba. `?aba=configurar` sem permissão volta para a Visão geral. O menu Apps mostra só o app de Mobilidade.
  - **Gestora:** vê a aba Configurar com o destino de cada serviço e as sugestões. "Ver todas" abre a página de sugestões e volta para Configurar.
  - **Administrador:** a Saúde mostra os indicadores reais e os 3 apps mais Cadastros. Finanças mostra o aviso de secretaria sem app. Um endereço inválido mostra "Secretaria não encontrada". A URL antiga de módulo continua redirecionando.
- 26 testes unitários passam, e o build de produção passa.

### 10.6 Status da implementação (Fase 6 — concluída)

**Nova tela inicial do cidadão** (`/cidadao`). Antes o portal abria direto no chat. Agora mostra, de cima para baixo:
1. **"Do que você precisa?"**: busca nos serviços enquanto a pessoa digita. Cada resultado leva direto a pedir. Sem resultado, sugere perguntar ao assistente ou ver todos os serviços.
2. **"Aguardando você"**: só aparece quando há pendências (documento, informação, correção…). Cada pedido tem o botão "Responder".
3. **"Seus pedidos"**: os 5 mais recentes, com número, data e situação em palavras simples (Recebido, Em andamento, Aguardando você, Concluído).
4. **"Prefere conversar?"**: atalho para o assistente.

**O chat virou o Assistente** (`/cidadao/assistente`), acessível de todas as telas:
- no computador, pelo botão flutuante "Assistente" (que antes aparecia até na tela de login);
- no celular, pelo botão central da barra inferior.

`/cidadao/mensagens` e `/cidadao/super-app` levam ao assistente.

**Menus**
- Barra inferior do celular: Início · Serviços · Assistente · Pedidos · Mais. O defeito que deixava o "Chat" marcado em todas as telas foi corrigido.
- Menu lateral: Início e Assistente no lugar de "Chat".
- A tela "Mais" ganhou "Meu perfil" e "Minha família".

**Validação**
- Playwright no computador, no celular e sem login, 11 passos, sem erros no navegador nem na API:
  - saudação, "Aguardando você (1)" com a pendência criada e os 2 pedidos;
  - busca com e sem resultado;
  - "Responder" abre o pedido;
  - o botão do assistente aparece nas telas, some dentro do assistente e na tela de login;
  - os endereços antigos redirecionam;
  - barra inferior com o item certo marcado;
  - tela "Mais" completa.

### 10.7 Status da implementação (Fase 7 — primeira rodada concluída)

**Consolidações**
- **Demandas do Gabinete** (`/admin/chamados`): "Criar Chamado" e "Meus Chamados" viraram uma página com as abas **Nova demanda** e **Acompanhar**. Ao enviar uma demanda, a página abre "Acompanhar". O endereço `/admin/chamados/lista` leva a essa aba, e o menu e os atalhos passaram a se chamar "Demandas do Gabinete". A tela `/secretarias/[dept]/chamados-recebidos`, que não tinha nenhum link, leva ao espaço da secretaria, onde as demandas recebidas já aparecem na Visão geral.
- **Serviços:** "Catálogo de Serviços" e "Gestão de Serviços" (cuja página se chamava "Estatísticas") viraram um item de menu, **Serviços**, com as abas **Catálogo** e **Desempenho**.
- **Biometria:** passou a ter um endereço só, `/admin/cidadaos/biometria-facial`. `/admin/atendimento-presencial/biometria-facial` redireciona para ele.
- **Aba Apps:** o card de Segurança Escolar só aparece quando a funcionalidade estiver ligada (`FEATURE_FLAGS.SEGURANCA_ESCOLAR`). Hoje ela está desligada e o link levava a "página não encontrada".

**Limpeza**
- **284 arquivos sem uso removidos do frontend (≈90 mil linhas).** Um mapa de imports que parte das páginas, layouts e rotas do Next mostrou que nenhuma tela chegava a eles. Depois da remoção, o mapa foi refeito e mostra zero órfãos.
- Entre os removidos estão: páginas "old", "simple" e "enhanced"; os modelos de página por área, que a Fase 5 substituiu; o sistema antigo de módulos (`module-configs`, `components/modules`, `components/core`); os hooks de estatística das páginas de secretaria antigas; e serviços que ninguém chama.
- A lista completa, com o comando para restaurar qualquer arquivo, está em `docs/LIMPEZA-FASE7-ARQUIVOS-REMOVIDOS.md`.
- **Preservado de propósito:** as telas desligadas por `lib/feature-flags.ts` (Pesquisa de Preços, Processos Internos, Workflows, Segurança Escolar) e tudo o que elas usam.

**Validação**
- Verificação de tipos sem erro novo. Build de produção sem erro novo; os avisos da biblioteca `face-api.js` já existiam antes.
- Playwright, 7 passos das consolidações, todos OK.
- Varredura de 33 telas (servidor e cidadão), cada uma numa aba isolada: todas abrem sem erro no navegador nem na API.

**Segunda rodada**
- **Documentos:** Meus Documentos, Templates, Assinaturas Digitais e Certificados Digitais viraram um item de menu, **Documentos**, com as abas Meus documentos · Assinaturas · Modelos · Certificados.
- **Análises:** Analytics, Relatórios e IA Centralizada viraram **Análises e relatórios**, com as abas Painel · Relatórios · Assistente de IA.
- **Mesmas regras de acesso:** cada aba mantém a regra que o item tinha no menu. Quem só tem acesso a uma aba não vê a barra de abas.
- **Menu:** as seções "Documentos" e "Análises" viraram uma só, "Documentos e análises". O item do menu fica marcado em qualquer aba da seção.
- **Como foi feito:** grupos de rota do Next (`app/admin/(documentos)` e `app/admin/(analises)`). Os endereços não mudaram, e as telas internas (editor de modelo) não mostram as abas. O componente `SectionTabs` também passou a ser usado nas abas de Serviços.
- **Backend:** foram removidos o carregador antigo `src/routes/index.ts`, que apontava para 11 arquivos que já não existiam, e 9 arquivos de rota que o servidor nunca carregava (`admin-secretarias`, `alerts`, `citizen-categories*`, `citizen-links-validation`, `enums`, `module-workflows`, `unified-protocols`, `admin-email-service`). Nenhum desses endereços respondia antes, então nada muda para quem usa.
- **Defeito corrigido:** no primeiro acesso de um servidor, a tela inicial pedia as preferências em paralelo, a segunda requisição falhava (erro 500, atalhos vazios). Agora usa `upsert`.
- **Validação:**
  - Playwright com administrador, coordenadora e servidor, 7 passos: as abas certas para cada papel, a navegação entre abas, o item do menu marcado e os itens antigos fora do menu. Sem erros, fora a IA indisponível, que no ambiente de teste é esperado.
  - Backend: verificação de tipos e 26 testes unitários passam.
  - Build de produção sem erro novo.

**Fica para uma próxima rodada**
- Desmembrar o `moduleType`.
