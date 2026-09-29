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
| **3. Destino explícito do Serviço** | Campo *destino* + catálogo de apps; migração dos 404 serviços; o assistente mostra o destino | Acaba com a ligação escondida; pré-requisito do Balcão | médio |
| **4. Balcão** | Atendimento presencial em 3 passos, gerando protocolo | Une 4 fluxos espalhados | médio |
| **5. Espaço da secretaria** | Modelo único com 4 abas; as 21 páginas viram configuração; menu "Apps" | Organiza o dia a dia da equipe | médio |
| **6. Portal do cidadão** | Início "Do que você precisa?", "Meus pedidos", assistente no lugar da home de chat | Maior impacto em usuários leigos | médio |
| **7. Consolidações e limpeza** | Demandas do Gabinete, Documentos em abas, Serviços (catálogo + desempenho), Relatórios; remover páginas de módulo, piloto, esboços e órfãos confirmados; desmembrar o `moduleType` | Só depois de tudo validado | baixo |

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
