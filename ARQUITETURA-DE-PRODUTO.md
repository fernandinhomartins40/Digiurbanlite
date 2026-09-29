# Arquitetura de Produto — Digiurban

> Como manter a plataforma tão completa quanto é hoje, só que simples para quem usa.
> Análise feita sobre o código real (setembro/2026). Cada problema citado tem evidência no repositório.

---

## 0. Resumo em um minuto

A Digiurban já tem as peças de um ecossistema completo:
- **404 serviços** no catálogo;
- **protocolos** com etapas, pendências, prazo e documentos;
- **14 apps especializados** (TFD, farmácia, matrículas, habitação, licenciamento…);
- um **motor de dados** (Registry) que dispensa programação para serviço novo.

O problema não é falta de funcionalidade. É que **as mesmas coisas aparecem com nomes diferentes, em lugares diferentes, construídas em épocas diferentes**. O usuário precisa entender a arquitetura interna para trabalhar.

A proposta tem três movimentos:

1. **Um vocabulário oficial com 5 conceitos**: Serviço, Protocolo, App, Cadastro e Etiqueta. A palavra "Módulo" sai da interface.
2. **Uma regra única de circulação**: o Serviço define *para onde o pedido vai*. O Protocolo é *o recibo e o canal com o cidadão*. O App é *a mesa de trabalho da secretaria* e aceita pedidos vindos do protocolo, do balcão presencial ou de dentro do próprio app.
3. **Cinco perguntas, cinco lugares**:

| Pergunta | Lugar |
|---|---|
| Onde **solicitar**? | Serviços (portal, bot ou balcão) |
| Onde **acompanhar**? | Protocolos |
| Onde **analisar e executar**? | No App, ou no próprio protocolo quando o serviço é simples |
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
| 1ª | Uma página por serviço, que lista os protocolos daquele serviço | `/admin/secretarias/[dept]/[module]` (`DynamicModuleView`, substituiu 91 arquivos) |
| 2ª | "Módulos gerais": Protocolos + Dados (Registry com widgets) | `SecretariaModulosSection`, presente nas 21 secretarias |
| 3ª | Apps: sistemas com tabelas próprias | `/admin/apps/*` |

As três aparecem na mesma página de secretaria. Há ainda uma página-piloto (`/admin/secretaria-modulos`) e uma página "Serviços Gerais" (`/secretarias/[dept]/servicos-gerais`) que agrega os serviços sem dados.

**2. A ligação Serviço → App está escondida no código e é frágil**
- Quando alguém cria um serviço, o `moduleType` é **gerado a partir do nome** (`servicos/novo/page.tsx:368`).
- O encaminhamento para o app compara esse código com **48 códigos fixos** em `protocol-to-app.service.ts`.
- Consequência: quem cria o serviço não vê para onde o pedido vai. Um nome diferente faz o pedido **simplesmente não chegar ao app**, sem erro e sem aviso.
- O mesmo campo acumula pelo menos 6 funções: encaminhar para o app, atribuir etiqueta ao cidadão, validar unicidade, escolher o fluxo de etapas, montar a URL do módulo e indexar dados.

**3. O TFD depende estruturalmente do protocolo (o contrário do que ele deve ser)**
- `SolicitacaoTFD.protocolId` é **obrigatório** e tem chave estrangeira para o protocolo com `ON DELETE CASCADE`.
- A criação presencial no app grava um identificador inventado (`protocolId = "TFD-<hora>"`, em `solicitacoes.service.ts`). Esse valor **viola a chave estrangeira**, então **atendimento presencial de TFD não funciona**.
- Apagar o protocolo apagaria o caso de TFD.
- Os **13 apps mais novos já fazem certo**: `protocolId String?`, com o comentário "quando nasce de protocolo". O padrão correto já existe; falta formalizá-lo e alinhar o TFD.

**4. Os apps não têm porta de entrada própria**
- Não há item "Apps" no menu. O único caminho é o card dentro da página da secretaria.
- **Agricultura**: as 5 telas do app ficam em `/admin/agricultura/*`, fora de `/admin/apps`. **Nenhuma página ou menu leva até elas**, e os botões "ver/editar produtor" levam a páginas que não existem.

**5. A página da secretaria mistura seis finalidades**

Numa única página ficam:
- chamados do prefeito;
- indicadores;
- ações rápidas;
- módulos gerais;
- **sugestões de serviços para criar** (tarefa de configuração);
- cards de apps.

Quem vai atender um pedido encontra ferramentas de configuração no caminho, e quem vai configurar encontra filas de trabalho. E são 21 arquivos escritos à mão para o que deveria ser um único modelo.

**6. A mesma tarefa aparece em vários lugares**

| Tarefa | Lugares onde existe hoje |
|---|---|
| Ver a lista de protocolos | `/admin/protocolos`, módulo Protocolos da secretaria, página por serviço, `PendingProtocolsList`, listas dentro dos apps |
| Chamados do prefeito | `/admin/chamados`, `/admin/chamados/lista`, `/secretarias/[dept]/chamados-recebidos`, bloco na página da secretaria |
| Serviços | "Catálogo de Serviços" (a página se chama *Gerenciamento de Serviços*) e "Gestão de Serviços" (a página se chama *Estatísticas*) |
| Biometria presencial | `/admin/atendimento-presencial/biometria-facial` e `/admin/cidadaos/biometria-facial` |
| Análises | Analytics, Relatórios, IA, Painel do Prefeito |
| Documentos do cidadão (portal) | `/cidadao/documentos` e `/cidadao/meus-documentos`, **ambas com o título "Meus Documentos"** |

**7. Caminhos que levam a lugar nenhum**
- A tela "Mais" do portal do cidadão leva a **5 páginas inexistentes**: notificações, configurações, ajuda, feedback e sobre.
- Páginas de 6 linhas (`/admin/workflows`, `/admin/processos-internos`) ficam fora do menu.
- `routes/index.ts` do backend nunca é carregado, então as rotas de categorias de cidadão não existem.

**8. O vocabulário é interno**

A interface expõe termos técnicos: "COM_DADOS", "SEM_DADOS", "moduleType", "Workflows", "Micro Sistemas", "Serviços Gerais". Para um servidor leigo, eles não dizem **o que fazer**.

---

## 2. Vocabulário oficial: cinco conceitos

| Conceito | É | Não é | Exemplo | Quem vê |
|---|---|---|---|---|
| **Serviço** | O que a prefeitura **oferece**. Define quem pode pedir, o que informar e anexar, o prazo e **para onde o pedido vai**. | Um processo nem uma tela de trabalho. | "Tratamento Fora do Domicílio", "2ª via de IPTU" | Cidadão (vitrine); gestor (configura) |
| **Protocolo** | O **recibo e o canal** de um pedido: número, situação, prazo, mensagens, pendências, documentos e avaliação. Igual para todo serviço. | O lugar do trabalho especializado. | "Protocolo 2026-000777" | Cidadão (acompanha); servidor (triagem e resposta) |
| **App** | A **mesa de trabalho especializada** da secretaria, com operação própria: filas, agenda, estoque, frota, pareceres. | Uma etapa do protocolo nem um módulo. | TFD, Farmácia, Matrículas, Habitação | Equipe da secretaria |
| **Cadastro** (hoje "Dados"/"Módulo") | Os **registros** que os serviços com formulário geram. Consultáveis, filtráveis e com painel. | Um app (não tem operação própria). | "Produtores rurais cadastrados", "Feirantes" | Equipe da secretaria |
| **Etiqueta** | Uma **marca** no cidadão ganha ao ser atendido. | Um cadastro nem um app. | "Produtor Rural", "Beneficiário do Bolsa-Aluguel" | Servidores (na ficha do cidadão) |

**Regra de ouro:** a palavra **"Módulo" sai da interface**. O que hoje se chama "módulo" vira **Protocolos** (a fila) ou **Cadastros** (os registros), conforme o caso.

---

## 3. Como tudo se liga

```
              PORTAS DE ENTRADA                          QUEM TRABALHA
  ┌───────────────────────────────────┐
  │ Portal do cidadão · Bot · Balcão  │
  └───────────────┬───────────────────┘
                  │ escolhe um SERVIÇO
                  ▼
        ┌───────────────────┐   destino do serviço
        │     SERVIÇO       │─────────────────────────┐
        │ (define o destino)│                          │
        └─────────┬─────────┘                          │
                  │ gera sempre                         │
                  ▼                                     ▼
        ┌───────────────────┐   entrega o caso   ┌──────────────────┐
        │    PROTOCOLO      │ ─────────────────▶ │       APP        │◀── Balcão presencial
        │ recibo + canal    │                    │ mesa de trabalho │◀── Criação interna
        │ com o cidadão     │ ◀───────────────── │ (TFD, Farmácia…) │◀── Importação
        └─────────┬─────────┘  devolve situação  └──────────────────┘
                  │            e documentos
                  ▼
        CADASTRO (registros dos formulários) · ETIQUETA (marca no cidadão)
```

**Regras de circulação:**
1. **Todo pedido digital gera um Protocolo.** É o recibo do cidadão e o registro de prestação de contas.
2. **O Serviço declara o destino**, que é explícito e visível na configuração:
   - **Fila de protocolos**: serviços simples (certidões, declarações, solicitações gerais), analisados e concluídos no próprio protocolo;
   - **App**: serviços com operação especializada. O protocolo entrega o caso ao app e passa a mostrar ao cidadão a situação vinda dele.
3. **O App aceita casos de qualquer origem**: protocolo, balcão presencial, criação interna ou importação. Cada caso guarda sua **origem**. Quando nasce de protocolo, mantém o vínculo; quando não nasce, funciona do mesmo jeito.
4. **O App devolve ao Protocolo** (quando existir) as mudanças de situação, pendências para o cidadão e documentos emitidos, por um único mecanismo compartilhado.
5. **Cadastro e Etiqueta são consequências automáticas** da conclusão do atendimento. Ninguém precisa preenchê-los à mão.

---

## 4. Onde cada coisa acontece

| | Cidadão | Servidor (atendimento) | Equipe da secretaria | Gestor/Prefeito | Administrador |
|---|---|---|---|---|---|
| **Solicitar** | Portal › **Serviços** (ou bot) | **Balcão**: pede *em nome* do cidadão | Dentro do **App** (caso presencial) | — | — |
| **Acompanhar** | Portal › **Meus pedidos** | **Protocolos** › Minha fila | Secretaria › **Protocolos** | Painel do Prefeito | — |
| **Analisar** | — | **Protocolo** (serviço simples) | **App** (serviço especializado) | — | — |
| **Executar** | Responde pendências em *Meus pedidos* | Protocolo | **App** | — | — |
| **Consultar dados** | — | Ficha do **Cidadão** | Secretaria › **Cadastros** | **Relatórios** | — |
| **Administrar** | — | — | Secretaria › **Configurar** | — | **Configurações** (plataforma) |

---

## 5. Nova organização das telas

### 5.1 Menu do servidor (organizado por tarefa, não por estrutura interna)

```
Início                ← "Sua fila hoje": atrasados, vencendo, sem responsável, aguardando cidadão
Atendimento
  ├─ Protocolos       ← fila única (visões, prazos, filtros por secretaria/serviço/cidadão)
  ├─ Balcão           ← NOVO: identificar cidadão → pedir serviço ou abrir caso no app
  └─ Cidadãos         ← ficha única (dados, pedidos, etiquetas, família, documentos, biometria)
Minhas secretarias    ← só as do servidor (já implementado)
  └─ <Secretaria>     ← espaço com 5 abas fixas (5.2)
Apps                  ← NOVO atalho: os apps a que o servidor tem acesso
Comunicação           ← Mensagens · E-mail
Documentos            ← Meus documentos · Modelos · Assinaturas · Certificados (abas de uma tela)
Gestão (gestores)     ← Painel do Prefeito · Demandas do Gabinete · Mapa · Relatórios
Configurações (admin) ← Serviços · Apps · Equipe e organograma · Bot · Integrações · Município
```

### 5.2 Espaço da secretaria: um modelo, cinco abas, as mesmas em todas

| Aba | Conteúdo | Substitui |
|---|---|---|
| **Visão geral** | Indicadores reais do app + protocolos em aberto (`SecretariaKpiCards`, já feito), demandas do gabinete, atalhos | cabeçalho, KPIs, "Ações rápidas", bloco de chamados |
| **Protocolos** | A fila única, já filtrada pela secretaria | módulo Protocolos, página por serviço, "Serviços Gerais", `PendingProtocolsList` |
| **Apps** | Cards dos apps da secretaria (TFD, Farmácia…) | cards soltos no fim da página |
| **Cadastros** | Registros dos serviços com formulário (Registry: tabela, mapa, painel, widgets) | módulo "Dados", páginas de módulo por serviço |
| **Configurar** | Serviços da secretaria, sugestões de novos serviços, equipe, parâmetros dos apps | sugestões de serviços misturadas à operação |

As 21 páginas escritas à mão (7.501 linhas) passam a ser **um modelo + uma configuração por secretaria**. Secretaria nova sem programar, mesma lógica do Registry para os serviços.

### 5.3 Portal do cidadão

| Hoje | Proposta |
|---|---|
| Início = chat | Início = **"Do que você precisa?"** (busca de serviços) + **"Aguardando você"** + situação dos pedidos; o chat vira assistente acessível em todas as telas |
| "Protocolos" | "**Meus pedidos**" (a palavra protocolo aparece como número, não como menu) |
| Duas telas "Meus Documentos" | Uma: **Meus documentos** (enviados e recebidos da prefeitura) |
| "Mais" com 5 links quebrados | Só o que existe: Família, Perfil, Biometria, Ajuda (real) |

### 5.4 Balcão (atendimento presencial)

Uma tela para o servidor que atende pessoalmente:
1. **Identificar** o cidadão (CPF, biometria ou cadastro rápido);
2. **Escolher o serviço**. O sistema segue o destino do serviço: abre protocolo *em nome do cidadão* ou abre o caso direto no app;
3. **Concluir**. O cidadão sai com o número do pedido.

Hoje essas peças estão em quatro lugares: `cidadaos/novo`, biometria (em duas rotas), `servicos/[id]/solicitar` e "Novo Protocolo".

---

## 6. O que muda por baixo (a complexidade vai para a tecnologia)

### 6.1 Serviço com destino explícito, no lugar do `moduleType` gerado pelo nome
- Novo campo no serviço: **destino** = `FILA` ou `APP` + **ação do app** (ex.: `tfd.solicitacao`, `esportes.matricula`, `habitacao.inscricao`).
- No assistente de criação, o campo aparece como uma escolha simples: *"O que acontece depois do pedido? ◯ Analisado no protocolo ◯ Vai para o app TFD (solicitação de tratamento)"*.
- O conversor protocolo→app passa a consultar o destino, não o nome. A tabela de 48 códigos vira **dados**; os serviços existentes são migrados por script.
- O `moduleType` continua existindo como identificador técnico estável, mas **deixa de ser derivado do nome** e de acumular funções. Encaminhamento, etiqueta, unicidade e cadastro ganham campos próprios.

### 6.2 Catálogo de Apps (registro único)
Uma tabela ou configuração com, para cada app:
- código, nome, secretaria(s), feature do plano e rota;
- **ações de entrada** que ele aceita, com os campos esperados;
- regra de acesso: equipe da secretaria + ADMIN, já implementada em `requireDepartmentAccess`.

O menu "Apps", a aba Apps da secretaria e o campo "destino" do serviço **leem desse catálogo**. App novo aparece em todos os lugares sem editar telas.

### 6.3 Contrato Protocolo ↔ App (igual para todos)
- Todo caso de app: `origem` (`PROTOCOLO | PRESENCIAL | INTERNO | IMPORTACAO`) + `protocolId` **opcional** + `ON DELETE SET NULL`. Os 13 apps novos já estão quase assim; o **TFD precisa ser alinhado** (hoje o presencial quebra).
- Uma **ponte única** (`app-protocol-bridge`) para o app avisar o protocolo: situação, pendência para o cidadão e documento emitido. Hoje cada app conclui o protocolo do seu jeito ("não-fatal", espalhado).

### 6.4 Uma lista de protocolos, um detalhe de protocolo
Os filtros por secretaria, serviço e cidadão, e as visões por prazo, já estão implementados na fila (`/admin/protocolos`). As demais listas passam a ser **a mesma fila com filtro aplicado**.

### 6.5 Espaço da secretaria como modelo
`SecretariaWorkspace` + configuração por secretaria: nome, ícone, apps (vindos do catálogo), indicadores (já em `SecretariaKpiCards`) e serviços sugeridos.

---

## 7. Mapa de consolidação: nada se perde

| Hoje (onde está) | Vai para | Observação |
|---|---|---|
| `/secretarias/[dept]/[module]` (página por serviço) | Secretaria › Protocolos (filtro por serviço) + Cadastros | redirecionamento automático da URL antiga |
| `/secretarias/[dept]/servicos-gerais` | Secretaria › Protocolos | idem |
| `/admin/secretaria-modulos` (piloto) | removida | já coberta pela aba Cadastros |
| Módulo "Dados" (Registry + widgets) | Secretaria › **Cadastros** | só o nome muda |
| Sugestões de serviços na página da secretaria | Secretaria › Configurar | |
| Cards de apps no fim da página | Secretaria › Apps + menu Apps | |
| `/admin/agricultura/*` | `/admin/apps/agricultura/*` | hoje inalcançável |
| `/admin/servicos` + `/admin/gerenciamento-servicos` | Configurações › Serviços (abas Catálogo · Desempenho) | |
| `/admin/chamados`, `/chamados/lista`, `/secretarias/[dept]/chamados-recebidos` | **Demandas do Gabinete** (criar no gabinete, caixa de entrada na secretaria) | |
| Biometria em duas rotas | Ficha do cidadão + Balcão | |
| `cidadaos/novo`, `servicos/[id]/solicitar`, "Novo Protocolo" | **Balcão** | |
| Analytics · Relatórios · IA | Gestão › Relatórios (com abas) | a IA vira assistente contextual |
| Templates · Assinaturas · Certificados · Meus documentos | Documentos (abas) | |
| Portal: `/documentos` + `/meus-documentos` | **Meus documentos** | |
| Portal: 5 links quebrados em "Mais" | removidos (ou páginas criadas: Ajuda, Notificações) | |
| `/admin/workflows`, `/admin/processos-internos` (esboços) | Configurações › Serviços › etapas | já fora do menu |

---

## 8. Plano de transição

Todas as fases são reversíveis e entram sem perder funcionalidade: URLs antigas redirecionam, e nada é apagado antes de o substituto estar no ar.

| Fase | Entrega | Por que primeiro | Esforço |
|---|---|---|---|
| **1. Fundamentos do contrato** | TFD com `protocolId` opcional + `origem` (presencial passa a funcionar); ponte única App→Protocolo; Agricultura em `/apps` e alcançável; portal sem links quebrados e com uma só tela de documentos | Corrige defeitos reais e fixa a regra que todo o resto usa | baixo |
| **2. Destino explícito do Serviço** | Campo *destino* + ação do app; catálogo de apps; migração dos 404 serviços pelo mapeamento atual; o assistente mostra o destino | Acaba com a ligação escondida e frágil; é pré-requisito do Balcão | médio |
| **3. Espaço da secretaria** | Modelo único com 5 abas; as 21 páginas viram configuração; "Módulo" sai da interface; menu "Apps" | É onde o servidor mais se perde | médio |
| **4. Balcão** | Atendimento presencial em 3 passos, usando o destino do serviço | Une 4 fluxos espalhados | médio |
| **5. Consolidações de apoio** | Demandas do Gabinete, Documentos em abas, Serviços (catálogo + desempenho), Gestão › Relatórios | Reduz o menu | baixo |
| **6. Portal do cidadão** | Início "Do que você precisa?", "Meus pedidos", assistente no lugar da home de chat | Maior impacto em usuários leigos | médio |
| **7. Limpeza** | Remover páginas por serviço, piloto, esboços e os ~300 arquivos órfãos confirmados; desmembrar o `moduleType` | Só depois de tudo validado | baixo |

**Como medir:**
- itens de menu do servidor: de ~30 para ~12;
- caminhos para "ver protocolos": de 5 para 1;
- páginas de secretaria mantidas à mão: de 21 para 0;
- serviços com destino desconhecido: de "não se sabe" para 0;
- links quebrados: 0.

---

## 9. Decisões que dependem de você

1. **Início do portal do cidadão.** Trocar a home de chat por "Do que você precisa?", com o chat como assistente sempre disponível? (Recomendo sim: o leigo reconhece uma busca mais rápido do que uma conversa.)
2. **Nome do conceito "Cadastros".** "Cadastros", "Registros" ou "Dados da secretaria"?
3. **Nome para o cidadão.** "Meus pedidos" em vez de "Protocolos" no portal? (O número do protocolo continua visível.)
4. **Balcão.** O servidor que atende presencialmente pode abrir casos direto em qualquer app da secretaria dele, ou só pelo serviço (sempre gerando protocolo)? Recomendo *pelo serviço, gerando protocolo*, salvo nos apps em que o registro presencial é a rotina (TFD, farmácia, atendimento de saúde).
