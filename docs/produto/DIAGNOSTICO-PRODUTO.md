# Análise de produto, UX e UI — Digiurban

Data: 2026-11-12 · Situação: para decisão do dono · Continua: [PLANO-PRODUTO.md](PLANO-PRODUTO.md)

Base da análise: leitura do código das telas, dos menus e dos textos dos três painéis e da página de venda, mais contagens no código. As telas não foram vistas rodando; onde isso limita uma conclusão, está dito.

## 1. O diagnóstico em uma frase

**As telas mostram tudo o que o sistema sabe, em vez de mostrar o próximo passo de quem está usando.**

É isso que você sente e não consegue nomear. O produto tem as funções certas e um visual de moldura bonito. O que falta é hierarquia: dentro de cada tela, quase tudo tem o mesmo peso. Tela fácil não é tela com menos função; é tela em que uma coisa manda e o resto espera.

Essa falta de hierarquia aparece em quatro camadas, da mais visível para a mais profunda:

| Camada | O que acontece hoje | Onde aparece |
|---|---|---|
| **Visual** | O vidro cobre só a moldura; o miolo de cada tela foi montado à mão | Cores, títulos, espaços e avisos diferentes de tela para tela |
| **Tela** | Várias ações com o mesmo peso, muitas abas, números que repetem as abas | Tela do protocolo, lista de protocolos, ficha do cidadão |
| **Organização** | Menus seguem os módulos internos, não as tarefas | Menu do painel, "Mais" do cidadão, menu do super-admin |
| **Mensagem** | O produto se apresenta como "completo", não como solução de um problema | Página de venda, apresentação |

As seções 2 a 5 detalham cada camada com o que foi encontrado e o que fazer.

## 2. Camada visual — o vidro para na moldura

### O que foi encontrado

| Medida | Valor |
|---|---|
| Telas que usam as classes do vidro (`lg-*`) | 12 de 242 |
| Telas montadas com cartão genérico | 182 |
| Cores fixas escritas direto nas telas | 3.653 usos, 237 variações |
| Telas do painel com fundo cinza próprio (`bg-gray-50`) | 41 |
| Tamanho do título da página | 135 telas com um, 77 com outro, 11 com outros três |
| Espaçamento da página | 98 telas com um, 36 com outro, resto variado |
| Arredondamento | 6 medidas em uso forte |
| Botões de contorno contra botões de destaque | 450 contra poucos; em muita tela nenhum botão se destaca |
| Sistemas de aviso | 2 ao mesmo tempo, mais `alert()`/`confirm()` do navegador em 86 arquivos |
| Avisos com título genérico "Sucesso" ou "Erro" | 202 |

### O que isso causa

- **Duas linguagens na mesma tela.** A barra, o Dock e as abas são de vidro sobre um fundo com luz. O conteúdo é cartão branco sobre cinza, no padrão de qualquer painel administrativo. Em 41 telas o fundo cinza próprio da página ainda cobre o fundo ambiente do vidro. O olho lê "produto novo" na moldura e "sistema antigo" no meio.
- **Cor sem significado.** Com 237 variações, a cor não comunica. Vermelho é atraso numa tela, erro em outra, botão de excluir em outra. Laranja, âmbar e amarelo se revezam para "atenção". O usuário não aprende a ler a tela pela cor.
- **Nada chama para a ação.** Quando quase todo botão é de contorno, a tela não diz o que fazer primeiro.
- **Avisos sem informação.** "Sucesso" não diz o que aconteceu; "Erro" não diz o que fazer.

### O que fazer

Criar o **sistema do miolo**, o par do vidro para o conteúdo. Pequeno e obrigatório:

1. **Superfície única de conteúdo.** Um cartão padrão do produto, com as cores do tema do vidro, sobre o fundo ambiente. Tirar os fundos cinza das páginas.
2. **Tabela de sentidos.** Cada situação tem uma cor, um ícone e uma palavra, definidos uma vez e usados no produto inteiro:

   | Situação | Cor | Palavra para o servidor | Palavra para o cidadão |
   |---|---|---|---|
   | Atrasado | vermelho | Atrasado | Atrasado |
   | Vence hoje / em 48 h | âmbar | Vence hoje | — |
   | Esperando o cidadão | laranja | Aguardando cidadão | Aguardando você |
   | Em andamento | azul | Em andamento | Em andamento |
   | Concluído | verde | Concluído | Pronto |
   | Cancelado | cinza | Cancelado | Cancelado |

   Vermelho fica reservado para atraso e para ação que apaga. Nada mais usa vermelho.
3. **Escala fixa.** Um tamanho de título de página, um de seção, um de texto. Um espaçamento de página. Dois arredondamentos (cartão e botão/campo).
4. **Regra do botão.** Um botão de destaque por tela, que é o próximo passo. O resto é contorno ou fica em "Mais opções".
5. **Um aviso só.** Um sistema de aviso, sempre com frase completa ("Pedido enviado para a Saúde", "Não foi possível salvar: o CPF já existe"). Confirmação sempre em janela do produto, nunca do navegador.
6. **Quatro moldes de página**, e toda tela é um deles:
   - **Fila** — lista de trabalho com filtro curto;
   - **Ficha** — uma coisa (pedido, cidadão, processo) com o que fazer agora;
   - **Passos** — formulário dividido em etapas (o Balcão já é assim e é a melhor tela do painel);
   - **Painel** — números para quem decide.

## 3. Camada da tela — tudo com o mesmo peso

### 3.1 Tela do protocolo (servidor) — a mais importante do painel

É onde o atendente passa o dia. Hoje ela tem, ao mesmo tempo:

- cabeçalho fixo com Aprovar, Rejeitar, Mensagem, Exportar, Atribuir (que abre Atribuir, Delegar, Encaminhar, Equipe) e "Realinhar fluxo";
- barra de progresso das etapas;
- cartão "o que fazer agora";
- até 13 abas possíveis: Resumo, Documentos, Dados, Pendências, Comunicação, Pagamento, Resumo Final, Documentos Gerados, Enviar, Timeline, Envolvidos, Atribuições;
- coluna lateral com 4 cartões: responsável, prazo, contagens (etapas, documentos, pendências, mensagens) e processos internos.

Problemas concretos:

| Problema | Detalhe |
|---|---|
| Três lugares respondem "o que eu faço?" | Cabeçalho, cartão de foco e aba Resumo competem |
| Três abas para documento | "Documentos", "Documentos Gerados" e "Enviar" são o mesmo assunto em momentos diferentes |
| Quatro verbos para "passar adiante" | Atribuir, Delegar, Encaminhar, Equipe: o servidor precisa saber a diferença antes de agir |
| Contagens repetidas | A coluna lateral repete os números que já estão nas abas |
| Clique sem saída | O cartão de prazo, ao ser clicado, só mostra o aviso "Clique para ver detalhes completos do SLA" |
| Termos técnicos | "SLA", "Timeline", "Workflow", "Resumo Final" |

**Como deve ser** (molde Ficha):

- **Topo:** número, serviço, cidadão, situação e prazo numa linha ("Vence em 2 dias").
- **Faixa "Agora":** uma frase e um botão de destaque que muda conforme a etapa ("Analisar documentos", "Responder ao cidadão", "Concluir e entregar"). Ações secundárias em "Mais opções".
- **Coluna principal:** uma linha do tempo única, do mais novo para o mais antigo, misturando mensagens, documentos, pendências e mudanças de etapa. É a história do pedido; hoje ela está espalhada em cinco abas.
- **Quatro abas no máximo:** Pedido (dados + documentos do cidadão), Conversa, Documentos da prefeitura (gerar, assinar, entregar), Histórico.
- **"Passar para…":** uma janela só, que pergunta "para quem?" (pessoa, equipe ou outra secretaria) e decide sozinha se é atribuição ou encaminhamento.
- **Coluna lateral:** só responsável e prazo.

### 3.2 Lista de protocolos

Antes da primeira linha da lista há 9 controles: 6 visões de fila, secretaria, serviço, 2 abas (fila e dados), busca, situação, prioridade e ordenação. O título é "Gestão de Protocolos".

**Como deve ser** (molde Fila): título "Protocolos"; três visões visíveis (Meus, Sem responsável, Todos) com atrasados sempre no topo; busca; um botão "Filtrar" que abre o resto. A aba "Dados dos formulários" é análise, não fila: vai para Análises.

### 3.3 Ficha do cidadão (servidor)

1.255 linhas, 5 ou mais abas. O servidor vê "Pendente / Verificado / Rejeitado"; o cidadão vê "Bronze / Prata / Ouro" para a mesma coisa. Os dois lados não falam a mesma língua no balcão.

**Como deve ser:** topo com nome, nível (mesma palavra do cidadão) e botão de destaque conforme o caso ("Conferir cadastro", "Abrir pedido para ele"). Abas: Dados, Pedidos, Documentos, Família.

### 3.4 Configurações

A tela tem 8 abas que misturam o que é **da pessoa** (perfil, aparência, notificações, privacidade, segurança) com o que é **da prefeitura** (sistema, integração, avançado). O menu ainda tem "Perfil", "Integrações" e "IA e créditos" separados.

**Como deve ser:** tudo que é da pessoa sai do menu e vai para o avatar no topo ("Minha conta"). "Prefeitura" vira uma área só, com dados do município, equipe, serviços, DigiBot, e-mail, integrações e IA.

### 3.5 Pedir um serviço (cidadão)

A tela é uma página longa: descrição, avisos, formulário, texto livre, mapa, documentos e botão. Depois de enviar, aparece um aviso rápido e a tela muda.

| Problema | Detalhe |
|---|---|
| Sem noção de tamanho | No celular, o cidadão não sabe quanto falta |
| Sem momento de conferir | Não há resumo antes de enviar |
| Sem momento de entrega | O número do pedido aparece num aviso que some em segundos |
| Erro técnico visível | Em falha, o cidadão pode ler "Erro HTTP 500: Internal Server Error" |
| Dados no registro do navegador | A tela grava no console os dados do formulário (30 registros de depuração nas telas) |

**Como deve ser** (molde Passos): 1. Sobre o pedido → 2. Onde (se o serviço pede) → 3. Documentos → 4. Conferir e enviar. Barra "passo 2 de 4". No fim, **tela de confirmação inteira**: "Pedido recebido", número grande, prazo, "o que acontece agora" em três linhas e botão "Acompanhar". Essa tela é o momento em que o cidadão sente que deu certo; hoje ela não existe.

### 3.6 Início do cidadão

O conceito está certo. Dois ajustes:

- **Ordem.** "Aguardando você" está em quarto lugar, depois da busca, das situações e das sugestões. Quando existe, é a coisa mais importante da tela: vai para o topo.
- **Peso.** São seis blocos empilhados no celular. O cartão do assistente no fim repete o botão do assistente que já está na barra de baixo: sai.

### 3.7 Balcão

É a referência. Três passos numerados, uma busca por passo, 298 linhas. As outras telas de trabalho devem parecer com ela.

## 4. Camada da organização — menus com a forma dos módulos

### 4.1 Painel da prefeitura

Hoje são 7 grupos e cerca de 30 itens. Problemas:

- O grupo **"Serviços"** contém Serviços, Processos internos, Pesquisa de preços e DigiBot: quatro coisas sem relação.
- **Cidadãos** ocupa 5 itens (Cidadãos, Pendentes, Etiquetas, Composição Familiar, Biometria Presencial) que são partes de uma tela só.
- **Mensagens** está em "Comunicação", longe de "Atendimento", embora atender seja conversar.
- **Perfil** é item de menu da prefeitura.

Proposta — 5 áreas, nomeadas pelo que a pessoa faz:

| Área | Conteúdo | Quem vê |
|---|---|---|
| **Início** | Minha mesa | Todos |
| **Atender** | Protocolos · Balcão · Mensagens · Agenda · Cidadãos (com Pendentes, Etiquetas, Família e Biometria como abas) | Todos |
| **Minha secretaria** | Apps e serviços da secretaria da pessoa · Mapa | Todos |
| **Trabalho interno** | Processos internos · Pesquisa de preços · Documentos e assinaturas | Conforme permissão |
| **Gestão** | Painel do Prefeito · Análises | Gestores |
| **Prefeitura** | Dados do município · Equipe e organograma · Serviços · DigiBot · E-mail · Integrações · IA | Administrador |

O Dock e o Ctrl+K continuam; o menu só fica mais curto e previsível.

### 4.2 App do cidadão

A barra de baixo está certa (Início, Serviços, Pedidos, Mais, assistente). O "Mais" tem 9 itens com problemas:

- duas biometrias ("Leitura biométrica" e "Biometria facial");
- "Excluir minha conta" no mesmo nível de "Meu perfil";
- existem duas rotas de documentos no código (`documentos` e `meus-documentos`).

Proposta: "Mais" vira **"Eu"**, com Meu cadastro (perfil, nível, biometria numa tela só), Minha família, Meus documentos, Ajuda. Excluir conta e termos ficam dentro de Meu cadastro, no fim.

### 4.3 Super-admin

21 itens. O grupo "Sistema" junta 9 coisas (monitoramento, backups, banco, auditoria, IA, chaves, mapas, apps, privacidade). A tela inicial é uma visão geral com números.

Proposta:

| Grupo | Conteúdo |
|---|---|
| **Hoje** | O que pede atenção: município com erro, fatura vencida, lead novo, saldo de IA baixo |
| **Clientes** | Municípios · Planos · Faturas · Leads |
| **Suporte** | Assistência remota · Equipe |
| **Plataforma** | IA e chaves · Mapas · E-mail e modelos · Apps nativos · Privacidade |
| **Saúde do sistema** | Monitoramento · Backups · Auditoria · Banco de dados |

É o painel de menor prioridade: só você usa.

### 4.4 Vocabulário

| Hoje | Problema | Proposta |
|---|---|---|
| Pendente/Verificado (servidor) × Bronze/Prata/Ouro (cidadão) | Duas línguas para a mesma coisa | Uma só, nos dois lados |
| Atribuir, Delegar, Encaminhar, Equipe | Quatro verbos | "Passar para…" |
| SLA, Workflow, Timeline, Template, Status | Jargão ou inglês ("Status" aparece 50 vezes) | Prazo, Etapas, Histórico, Modelo, Situação |
| Protocolo × Pedido | Já decidido: servidor diz protocolo, cidadão diz pedido | Manter |
| "Gestão de Protocolos", "Composição Familiar", "Biometria Presencial" | Nome de módulo | Protocolos, Família, Biometria |

## 5. Camada da mensagem — o produto não diz o que resolve

### O que foi encontrado na página de venda

- Frases principais: "Tecnologia que aproxima a prefeitura das pessoas", "Simples para o cidadão. Poderoso para o município", "Mais eficiência. Mais resultados", "Pronto para transformar o seu município?".
- São frases que qualquer concorrente pode usar. Nenhuma diz um problema, um número ou um resultado.
- A página tem "Quem usa, recomenda" e "Junte-se às cidades que já estão no Digiurban". Sem município em produção, isso precisa sair ou ser trocado: em venda para governo, uma referência que não se confirma derruba a proposta.
- A apresentação interna fala em "Os 3 Portais Integrados" e "Diferenciais Técnicos": é a visão de quem construiu, não a de quem compra.

### Quem compra e o que quer ouvir

| Pessoa | O que a move | O que mostrar |
|---|---|---|
| Prefeito | Aparecer bem, cobrar a equipe, ter o que mostrar | Painel do Prefeito, modo TV, Prefeitura em números |
| Secretário de administração | Tirar papel e fila, cumprir prazo | Mesa, protocolo com prazo, processo interno |
| Controle interno e jurídico | Rastro, LGPD, Lei 14.133 | Assinatura, histórico, licitação guiada |
| TI da prefeitura | Não dar trabalho | "No ar em um dia", sem instalar nada |

### Proposta de posicionamento

- **Uma frase:** "O cidadão pede pelo celular. A prefeitura responde no prazo. O prefeito acompanha tudo."
- **Três provas, com tela:** pedido com data prevista (cidadão) · mesa com o que está atrasado (servidor) · painel com cobrança (prefeito).
- **Porta de entrada e expansão:** o município entra por pedidos + mesa + painel. Apps das secretarias, processo interno, licitação e biometria são o segundo passo, vendidos como módulos.
- **Diferenciais que são de fato raros e hoje estão escondidos:** licitação guiada pela Lei 14.133 com pesquisa de preços automática; app único para o cidadão nas lojas; assinatura eletrônica embutida; DigiBot que entende sem IA. Cada um merece uma seção própria com tela real.

## 6. Ordem de execução recomendada

| Etapa | Entrega | Por que nesta ordem |
|---|---|---|
| 1 | Sistema do miolo (seção 2): superfície, tabela de sentidos, escala, botão, aviso, 4 moldes | Tudo depois depende dele; sem ele cada tela refeita vira mais uma variação |
| 2 | Tela do protocolo e lista de protocolos (3.1, 3.2) | É onde o servidor passa o dia e o que se mostra numa demonstração |
| 3 | Pedir serviço em passos + tela de confirmação; ajustes do Início do cidadão (3.5, 3.6) | É a primeira impressão do cidadão e do prefeito que testa no próprio celular |
| 4 | Menus dos três painéis e vocabulário (seção 4) | Mudança barata, efeito grande na sensação de ordem |
| 5 | Ficha do cidadão e Configurações (3.3, 3.4) | Segunda linha de uso |
| 6 | Página de venda e apresentação (seção 5) | Depois que as telas novas existem, para usá-las como prova |
| 7 | Espalhar os moldes pelas demais telas, por secretaria | Trabalho longo e mecânico; os apps já têm o `AppShell` como começo |

Fora desta rodada: funções novas, troca da identidade visual (o vidro fica) e acabamento do super-admin além do menu.

## 6.1 O que já foi implementado (2026-11-12)

| Etapa | Feito | Ficou para depois |
|---|---|---|
| 1 Sistema do miolo | Tabela de sentidos; um aviso só; confirmação do produto no lugar da janela do navegador (89 arquivos); título e margem de página únicos; cartão com um arredondamento | Trocar as cores fixas tela por tela (só as telas de protocolo e do cidadão leem a tabela); os quatro moldes como componentes |
| 2 Protocolo | Cabeçalho com um botão de destaque e "Mais opções"; abas em 4 assuntos; coluna lateral sem números repetidos; lista com filtros atrás de "Filtrar" | Linha do tempo única juntando mensagens, documentos e etapas (precisa de uma consulta nova no servidor) |
| 3 Cidadão | Pedir serviço em passos, conferência e tela "Pedido recebido"; "Aguardando você" no topo; "Mais" virou "Eu" | Juntar perfil e biometria numa tela só |
| 4 Menus e palavras | Painel por tarefa; Cidadãos com abas; Minha conta no avatar; super-admin em 4 frentes; Situação/Prazo/Etapas/Modelo | "Status" dentro de frases e de telas de app menos usadas |
| 5 Ficha do cidadão e Configurações | Ficha com "Abrir protocolo para esta pessoa" e níveis Bronze/Prata/Ouro; Configurações separadas em Minha conta e Prefeitura | Dividir a ficha (1.200 linhas) em arquivos |
| 6 Venda | Frase nova; saíram números de clientes, satisfação e depoimentos; três provas do produto; apresentação sem e-SUS | Telas reais do produto no lugar das ilustrações |
| 7 Espalhar | — | Aplicar os moldes às demais telas, por secretaria |

## 7. Decisões que são suas

1. **Posicionamento.** A porta de entrada "pedidos + mesa + painel" serve para o seu mercado, ou você vende por outra frente (processo interno sem papel, Saúde)?
2. **Menu do painel.** Aprova as 5 áreas da seção 4.1?
3. **Níveis do cidadão.** Mantém Bronze/Prata/Ouro nos dois lados, ou troca por palavras diretas ("Cadastro básico / conferido / completo")?
4. **Tela do protocolo.** Aprova a linha do tempo única com 4 abas no lugar das até 13?
5. **Página de venda.** Tira agora os trechos "Quem usa, recomenda" e "cidades que já estão"?
6. **Por onde começar.** Segue a ordem da seção 6, ou prefere começar pelo app do cidadão?

## 8. Limites desta análise

- Feita pelo código, não pela tela rodando: contraste, alinhamento fino, animação e comportamento no celular não foram avaliados.
- Foram lidas a fundo as telas principais (cerca de 15); as demais entraram só nas contagens.
- Concorrentes, preço e processo de contratação pública não foram pesquisados.
