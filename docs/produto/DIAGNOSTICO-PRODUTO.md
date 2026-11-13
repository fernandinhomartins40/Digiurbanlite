# Diagnóstico de produto — o que falta para o Digiurban deslanchar

Data: 2026-11-12 · Situação: para decisão do dono · Continua: [PLANO-PRODUTO.md](PLANO-PRODUTO.md)

## 1. Resposta curta

O que falta não é mais uma técnica de UX nem mais uma função. Faltam três coisas, nesta ordem:

1. **Uma pessoa de verdade usando.** O produto foi construído de dentro para fora, sem ninguém de fora observado usando. Toda decisão de "isto é fácil" foi tomada por quem construiu.
2. **Profundidade em poucos caminhos, em vez de largura em tudo.** São 255 telas. Ninguém consegue deixar 255 telas excelentes; dá para deixar 5 caminhos excelentes, e é por eles que o produto é julgado.
3. **Um padrão para o miolo das telas.** O vidro (Glass) cuida da moldura: barra, Dock, abas. O conteúdo dentro da moldura foi montado à mão, tela por tela, e é aí que mora a sensação de "desalinhado".

O Plano de Produto de novembro (mesa, busca, primeiros passos) mexeu na porta de entrada. Estava certo, mas era a parte fácil. Este documento trata do que ficou atrás da porta.

## 2. O que foi medido

Números tirados do código em 2026-11-12. Não são opinião.

| Medida | Valor | O que significa |
|---|---|---|
| Telas | 255 (199 do painel, 20 do cidadão, 23 do super-admin) | Largura enorme para um produto sem usuário em produção |
| Commits | 1.489 em 12 meses | Ritmo de construção muito alto; nenhum ritmo de validação |
| Medição de uso | nenhuma | Não há como saber qual tela é usada, onde a pessoa desiste, quanto demora |
| Testes de tela | nenhum | Ninguém (nem máquina) percorre os caminhos do começo ao fim |
| Telas que usam as classes do vidro (`lg-*`) | 12 de 242 | O vidro está na moldura; o miolo não tem sistema |
| Telas montadas com `Card` genérico | 182 | Cada tela compõe o seu próprio visual |
| Cores fixas escritas direto nas telas | 3.653 usos, 237 variações | Não existe "a cor de atrasado", "a cor de concluído": cada tela escolheu a sua |
| Tamanho do título da página | 135 telas com um tamanho, 77 com outro | A hierarquia muda de tela para tela |
| Espaçamento da página | 98 telas com um, 36 com outro, o resto variado | Idem |
| Arredondamento dos cantos | 6 medidas em uso forte | Idem |
| `alert()`/`confirm()` do navegador | 86 arquivos | Janela cinza do navegador no meio de um produto de vidro |
| Sistemas de aviso (toast) | 2 em uso ao mesmo tempo | Avisos aparecem em lugares e formatos diferentes |
| Telas que buscam dados "à mão" | 151 (contra 2 com a ferramenta padrão do projeto) | Carregando, erro e vazio são diferentes em cada tela; erro vira lista vazia |
| Formulários feitos "à mão" | 39 (contra 2 com a ferramenta padrão) | Validação e mensagem de erro diferentes em cada formulário |
| Arquivos com janelas (modais) no painel | 74 | Trabalho importante acontece em janelas, não em páginas |
| Maiores telas | 1.200 a 1.860 linhas (Cultura, Esportes, Trânsito, Mensagens, ficha do cidadão) | Uma tela tentando ser um sistema inteiro |

Limite desta análise: ela foi feita lendo o código. **Ninguém abriu o sistema rodando**, nem nesta análise, nem na implementação do plano anterior. Isso é, por si só, o achado principal.

## 3. Os sete problemas

### 3.1 Falta o usuário

Em um ano foram 1.489 commits e nenhuma sessão observada com um servidor ou um cidadão. Não existe produção. Não existe medição. O produto nunca recebeu um "não entendi" de alguém de fora.

É por isso que a sensação é de estar perdido: sem usuário, toda melhoria é palpite, e palpite não converge. Cada rodada de "melhorar o UX" troca um palpite por outro. Nenhuma técnica resolve isso; cinco pessoas usando por 30 minutos resolvem.

### 3.2 Largura em vez de profundidade

O produto cobre 21 secretarias, cerca de 404 serviços, dezenas de apps, licitação, pesquisa de preços, biometria, assinatura, bot, IA. Cada parte funciona. Nenhuma foi polida até ficar óbvia, porque o esforço sempre foi para a parte seguinte.

Quem avalia um produto de prefeitura não percorre 255 telas. Percorre três ou quatro caminhos e decide. Hoje esses caminhos têm o mesmo acabamento do resto.

### 3.3 O vidro é só a moldura

O vidro foi desenhado para a navegação, e ali está bom. Mas a pessoa passa 95% do tempo olhando o miolo, e o miolo não tem sistema: são 182 telas compostas à mão com cartão genérico, 237 variações de cor e dois tamanhos de título.

O resultado é a sensação que você descreveu: nada está quebrado, mas nada combina. O olho percebe a falta de padrão antes de a pessoa saber dizer o que é. Falta o equivalente do vidro para o conteúdo: poucas peças, sempre iguais.

### 3.4 Telas organizadas por cadastro, não por tarefa

A maior parte das telas é "a tela da tabela X": lista, filtro, botão Novo, janela de edição. É a forma do banco de dados, não a forma do trabalho.

O servidor não pensa "vou abrir a tabela de protocolos". Pensa "tenho que responder a Dona Maria". Uma tela fácil responde uma pergunta e oferece uma ação principal. Telas de 1.800 linhas com cinco abas e vários botões de mesmo peso fazem a pessoa procurar.

Sinais no código: 450 botões de contorno contra poucos botões principais (em muita tela nada se destaca como "o próximo passo"), 74 arquivos com janelas, erro de carregamento que aparece como lista vazia.

### 3.5 Três públicos tratados com a mesma receita

| Quem | Como usa | O que precisa | Hoje |
|---|---|---|---|
| Cidadão | Raro, no celular, ansioso, muitas vezes com pouca leitura | Uma coisa por tela, letra grande, saber "e agora?" | Bom rumo (Início, pedido com data), mas formulário de pedido longo e nunca testado com um cidadão real |
| Atendente | O dia inteiro, repetitivo | Velocidade: fila, atender, próximo. Teclado. Nada de procurar | Mesa nova ajuda; a tela de atender o pedido ainda é densa |
| Gestor e prefeito | Poucos minutos por dia | Ver, cobrar, mostrar resultado | Painel do Prefeito existe e é o melhor argumento de venda |
| Administrador do município | Na implantação e em ajustes | Pôr no ar sem chamar suporte | Primeiros passos é novo; o resto são 8 abas de configuração |
| Operador da plataforma (você) | Diário, técnico | Ver problemas, criar município | 23 telas misturando negócio (municípios, faturas, leads) com infraestrutura (banco, chaves, backups) |

Quem **compra** (prefeito, secretário) não é quem **usa** (atendente). O produto precisa convencer o primeiro em 10 minutos e não cansar o segundo em 8 horas. São dois desenhos diferentes.

### 3.6 Não existe história de venda

"Plataforma completa de governo digital" não vende, porque obriga o comprador a acreditar em tudo de uma vez e trocar tudo de uma vez. Os concorrentes que cresceram no setor entraram por uma porta estreita (protocolo e memorando sem papel, por exemplo) e alargaram depois.

Falta decidir a porta de entrada do Digiurban: uma frase, um público, um resultado em 30 dias. O candidato natural, pelo que já existe: **"O cidadão pede pelo celular, a prefeitura responde no prazo, o prefeito vê tudo"** — pedidos + mesa + Painel do Prefeito + Prefeitura em números. O resto (apps das secretarias, licitação, biometria) vira expansão depois que o município já usa.

Também falta o material de venda: um município de demonstração com dados que parecem reais, um roteiro de 10 minutos, e um primeiro município piloto que vire caso.

### 3.7 Não há como aprender

Sem medição, sem piloto e sem teste de caminho, o produto não tem como melhorar sozinho. Cada melhoria depende de alguém ter uma ideia. Produtos que ficam fáceis ficam assim por repetição: medir, observar, corrigir, de novo.

## 4. O que fazer

### Princípio

Parar de alargar. Nenhum módulo novo até cinco caminhos estarem bons de verdade, vistos por gente de fora.

### Os cinco caminhos de ouro

| # | Quem | Caminho | Pronto quando |
|---|---|---|---|
| 1 | Cidadão | Entrar pela primeira vez → achar o serviço → pedir → acompanhar → receber a resposta | Uma pessoa que nunca viu faz sozinha, no celular, em menos de 5 minutos |
| 2 | Atendente | Abrir a mesa → pegar um pedido → pedir um documento ou responder → concluir → próximo | Atende 5 pedidos seguidos sem usar o menu |
| 3 | Atendente | Balcão: identificar o cidadão → abrir o pedido por ele | Menos de 2 minutos com o cidadão na frente |
| 4 | Prefeito | Abrir o painel → ver o que está atrasado → cobrar | Entende a tela em 30 segundos, sem explicação |
| 5 | Administrador | Município novo → primeiros passos → primeiro pedido de teste | Põe no ar em um dia sem chamar o suporte |

### Etapa 1 — Ver com os olhos (1 semana, sem código novo)

- Abrir o sistema na VPS de teste e percorrer os cinco caminhos tela por tela, com captura de cada passo, contando cliques, campos e pontos de dúvida. Isso eu consigo fazer; ainda não foi feito.
- Você faz o mesmo com 3 a 5 pessoas de fora (um parente como cidadão, alguém que trabalha ou trabalhou em prefeitura como atendente). Regra: não explicar nada, só pedir a tarefa e anotar onde a pessoa para.
- Resultado: uma lista curta e ordenada de travas reais, por caminho.

### Etapa 2 — Kit do miolo (o "vidro" do conteúdo)

Um conjunto pequeno de peças obrigatórias, e nada fora delas nos caminhos de ouro:

- **Quatro moldes de página:** fila (lista de trabalho), ficha (uma coisa e suas ações), formulário em passos, painel (números).
- **Peças:** cabeçalho de página (um tamanho de título), linha de lista, selo de situação (uma cor por situação, definida uma vez), botão principal único por tela, estados de carregando/vazio/erro (o `AppShell` já começou isso), confirmação e aviso (um só de cada; fim do `alert()` do navegador), campo de formulário com erro padrão.
- **Tabela de sentidos:** atrasado, vence hoje, aguardando cidadão, concluído — cor, ícone e palavra fixos no produto inteiro.

### Etapa 3 — Refazer os cinco caminhos com o kit

Só os cinco. Tela por tela, com a regra: uma pergunta, uma ação principal, o resto em "mais opções". Corrigir as travas da Etapa 1. As outras ~230 telas ficam como estão por enquanto.

### Etapa 4 — Medir e pilotar

- Medição simples e própria (sem serviço externo, por causa da LGPD): tela aberta, pedido iniciado, pedido enviado, pedido concluído, tempo entre eles. Só contagem, sem dado pessoal.
- Um município piloto, mesmo pequeno, mesmo de graça. É o que transforma o produto e gera o caso de venda.
- Município de demonstração com dados realistas e roteiro de 10 minutos.

### Etapa 5 — Espalhar o padrão

Com os caminhos validados, aplicar os moldes ao resto, começando pelas telas que a medição mostrar como mais usadas. Telas que ninguém usa em 60 dias de piloto são candidatas a sair do menu.

### O que não fazer agora

- Módulo, app ou integração nova.
- Redesenhar o vidro ou trocar a identidade visual. O vidro fica.
- Polir o super-admin. É ferramenta sua; funciona. Só separar o menu em "Negócio" e "Infraestrutura" quando sobrar tempo.
- Reescrever as 255 telas de uma vez.

## 5. Decisões que são suas

1. **A porta de entrada.** Concorda com "pedidos do cidadão + mesa + Painel do Prefeito" como a história de venda, ou o seu mercado pede outra (por exemplo, processo interno sem papel, ou Saúde)?
2. **Piloto.** Existe uma prefeitura, mesmo pequena, com quem você tenha abertura para testar?
3. **Pessoas para observar.** Consegue 3 a 5 pessoas de fora nas próximas duas semanas?
4. **Congelar a largura.** Aceita ficar sem função nova até os cinco caminhos estarem validados?
5. **Etapa 1.** Autoriza percorrer os caminhos na VPS de teste (só navegando, sem escrever nada fora de dados de teste)?

## 6. O que este diagnóstico não cobre

- Preço, contrato e processo de compra pública (como a prefeitura contrata).
- Concorrentes em detalhe: a comparação aqui é de memória do setor, não de pesquisa.
- Acessibilidade medida (contraste, leitor de tela): precisa do sistema rodando.
- Desempenho em celular fraco e internet ruim, que pesa muito para o cidadão.
