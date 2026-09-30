# PROMPT GENÉRICO — Auditoria e otimização de aplicação Docker em VPS compartilhada

> **Como usar:** copie tudo abaixo da linha e cole como primeira mensagem na aplicação que quer
> otimizar. Funciona com qualquer stack (Node, PHP, Python, Go, Java, Ruby…), desde que rode em
> Docker. Preencha o bloco `CONTEXTO DESTA APLICAÇÃO` antes de enviar.

---

# AUDITORIA E OTIMIZAÇÃO PARA VPS COMPARTILHADA

## CONTEXTO DESTA APLICAÇÃO

> Preencha o que souber. Onde não souber, escreva `DESCOBRIR` — faz parte da auditoria.

- **Aplicação:** `<nome / o que faz / quem usa>`
- **Stack principal:** `<DESCOBRIR ou descreva>`
- **Ambiente-alvo:** VPS com `<N>` vCPU, `<N>` GB RAM, `<N>` GB disco
- **Outras aplicações no mesmo Docker Host:** `<quantas / DESCOBRIR>`
- **Acesso à VPS nesta sessão:** `<sim: como / não>`
- **Deploy hoje:** `<CI, script manual, build na VPS, DESCOBRIR>`
- **Commit dispara deploy automático?** `<sim / não / DESCOBRIR>` ⚠️ decisivo
- **Janela de manutenção / risco aceitável:** `<pode ter downtime? tem backup?>`
- **Suíte de testes:** `<existe? roda? DESCOBRIR>`

---

## O QUE EU QUERO

Esta aplicação consome mais recursos da VPS do que deveria. Quero uma auditoria técnica completa
e depois uma otimização real, com um objetivo maior: **descobrir um padrão sustentável para rodar
muitas aplicações Docker na mesma VPS sem sobrecarregar o servidor.**

A VPS não é exclusiva desta aplicação. Pense sempre em **capacidade acumulada**: uma solução que
funciona isolada mas quebra quando há 10, 20 ou 30 apps no mesmo host não serve.

### A regra que não pode ser quebrada

**Nenhuma funcionalidade pode ser removida para economizar recursos.**

A meta é: *consumir menos recursos mantendo a mesma capacidade funcional.*

Reduzir números destruindo funcionalidade é **falha grave**, não sucesso parcial. Prefiro
terminar com menos economia e tudo funcionando do que com ótimos números e algo quebrado.

---

## PARTE 1 — COMO VOCÊ DEVE TRABALHAR

Estas regras valem para todas as etapas. São as mais importantes deste prompt: sem elas, o
resultado parece bom e está errado.

### 1.1 Nunca apresente suposição como fato

Marque **toda** afirmação numérica com sua origem:

- **MEDIDO** — você executou o comando e viu o resultado. Diga qual comando.
- **ESTIMADO** — raciocínio, não medição. Diga em que se baseia.
- **NÃO MEDIDO** — desconhecido. É uma resposta aceitável; inventar não é.

Nunca converta ESTIMADO em MEDIDO na conclusão. Se não pôde medir, diga por quê.

### 1.2 "Não encontrei" não é prova de que não existe

Antes de concluir que algo não tem uso, **prove que procurou no lugar certo**:

1. Descubra a estrutura real do projeto primeiro (onde ficam rotas, páginas, serviços).
2. Busque a partir da raiz, não de uma subpasta que você presumiu.
3. Considere formas indiretas: cliente HTTP com baseURL, alias de import, injeção de dependência,
   geração dinâmica de rota, chamada por reflexão, configuração externa.
4. Só então conclua — e mostre onde procurou.

> Isto vem de um erro real: numa auditoria, a busca foi feita em `src/` enquanto o código vivia em
> `app/`. A conclusão foi "zero consumidores" para três funcionalidades **ativas e em produção**.
> Removê-las teria quebrado o sistema em nome de otimização.

### 1.3 Corrija-se em voz alta

Se descobrir que algo que você afirmou estava errado, **diga explicitamente**: o que afirmou, por
que estava errado, e qual é a conclusão correta. Corrija também nos documentos já escritos.

Um relatório que esconde o próprio erro é pior que um relatório incompleto.

### 1.4 Distinga os cinco estados antes de tocar em qualquer coisa

| Estado | Significado | Ação |
|---|---|---|
| **Necessário** | Em uso, insubstituível | Não mexer |
| **Necessário mas otimizável** | Em uso, pode custar menos | Otimizar |
| **Opcional** | Funciona, raramente usado | Dimensionar ou tornar sob demanda |
| **Obsoleto** | Sem função real | Remover **com evidência** |
| **Duplicado** | Outra coisa faz o mesmo | Consolidar |

⚠️ **Ocioso ≠ obsoleto.** Serviço com tráfego zero mas integrado ao código é **Opcional**.
Dimensione; não remova.

### 1.5 Funcionalidade quebrada não é código morto

Se algo aponta para um serviço que não existe mais **mas tem consumidor no código**, isso não é
lixo a remover: é **uma funcionalidade quebrada**. Remover apaga o rastro do defeito e torna a
perda permanente e silenciosa.

O certo é: fazer falhar **rápido e explicitamente** (em vez de pendurar até timeout) e **reportar
como decisão pendente** — restaurar, repontar para outro destino, ou descontinuar de verdade
(removendo também a interface que o usuário enxerga).

### 1.6 Verifique antes de aplicar "boa prática"

Toda recomendação genérica tem exceção nesta aplicação. Antes de aplicar, verifique se algo no
projeto depende do comportamento atual. Para cada prática responda: **que problema resolve, qual
impacto, que custo introduz, e faz sentido aqui?**

Exemplos de armadilha (verifique, não presuma):
- Podar dependências de desenvolvimento pode quebrar deploy, se o processo de deploy invocar uma
  ferramenta de desenvolvimento dentro do container (migrations, seeds, geradores).
- Trocar imagem base por uma menor pode quebrar dependência que exige biblioteca de sistema.
- Limitar memória de banco **sem ajustar a configuração dele junto** faz o processo ser morto por
  falta de memória sob carga — pior que não limitar.

### 1.7 Pesquise práticas atuais, com ceticismo

Não dependa só de conhecimento interno. Pesquise práticas correntes para os temas relevantes
(limites de recurso, tamanho de imagem, cache de build, logging, retenção, banco em container,
deploy, rollback, limpeza segura, observabilidade de baixo custo, segurança de container).

Prefira documentação oficial. **Use a pesquisa também para auditar suas próprias decisões** — se
uma referência contradiz algo que você já propôs, revise e diga que revisou.

### 1.8 Pare e pergunte em vez de decidir sozinho

Pergunte quando: for decisão de produto (uma funcionalidade continua existindo ou não?), quando a
ação for irreversível (apagar dados/volumes), ou quando envolver risco que não dá para validar.

Não pergunte o que dá para descobrir lendo o código.

---

## PARTE 2 — AUDITORIA (não altere nada ainda)

Investigue e produza diagnóstico. **Nenhuma alteração nesta etapa.**

### 2.1 Comece pelo que está em uso de verdade

Antes de qualquer análise, descubra **qual arquivo de configuração realmente vale**. É comum
existirem múltiplos Dockerfiles, composes e scripts de deploy, com apenas um em uso — e auditar o
arquivo errado invalida tudo que vier depois.

- Que arquivo o deploy/CI referencia de fato?
- Qual a estrutura real de diretórios? (não presuma convenção)
- **O estado atual compila/valida?** Estabeleça a linha de base *antes* de mudar qualquer coisa,
  senão não há como saber se você quebrou algo.
- Existe trabalho anterior (auditoria, plano, documentação)? Leia antes de repetir esforço.

### 2.2 Aplicação

Mapeie: linguagem, framework, arquitetura, frontend, backend, banco, ORM/camada de dados, filas,
cache, workers, jobs agendados, websockets, integrações externas, IA, processamento pesado
(imagem, PDF, vídeo, OCR), autenticação, uploads, relatórios.

Procure desperdício: processos duplicados, polling agressivo, tarefas rodando mais vezes do que o
necessário, trabalho síncrono que poderia ser sob demanda, cache mal usado, geração excessiva de
arquivos, log em excesso, vazamento de memória, conexões não liberadas.

⚠️ **Preste atenção especial a recurso criado por requisição** — cliente de banco, pool, conexão
ou worker instanciado dentro de um handler em vez de compartilhado. É uma das causas mais comuns
e mais graves de esgotamento em produção, e passa despercebido em leitura superficial.

### 2.3 Docker

Containers (quantidade e necessidade real de cada um), imagens e tamanhos, camadas, Dockerfiles,
multi-stage, imagem base, dependências de build versus runtime, volumes, bind mounts, redes,
healthchecks, política de restart, **limites de CPU / memória / PIDs**, logs e retenção,
contexto de build, cache, imagens antigas, volumes órfãos, containers órfãos.

Para cada container pergunte: *isto tem ciclo de vida próprio?* Se não, provavelmente pertence a
outro processo.

> Não junte tudo num container só para reduzir números, nem separe por elegância de diagrama.

### 2.4 Dependências

Não usadas, duplicadas (duas bibliotecas para a mesma função), só de build indo para o runtime,
ferramentas pesadas que poderiam ser substituídas, e — importante — **ferramentas de linha de
comando declaradas como dependência de produção**. Verifique se o runtime realmente as invoca;
muitas vezes só o build precisa, e elas carregam dezenas ou centenas de MB de transitivas.

### 2.5 Banco de dados

Tamanho, tabelas grandes, índices ausentes ou desnecessários, consultas pesadas ou repetitivas,
problema de N+1, retorno de dados em excesso, ausência de paginação, dados históricos sem política
de retenção, logs acumulando indefinidamente, **pool e limite de conexões**, migrations.

🔴 **Nunca apague dados de produção.** Retenção/arquivamento é **proposta separada**, com impacto
explicado, jamais executada por iniciativa própria.

### 2.6 Infraestrutura e produção

CPU, RAM, disco, I/O, processos, consumo em ociosidade versus pico, crescimento ao longo do tempo,
configuração de runtime, proxy reverso, e o processo de deploy.

⚠️ **Verifique CPU roubada (steal time) antes de culpar a aplicação.** Se o provedor não entrega a
CPU contratada, o load alto não vem do seu código e nenhuma otimização vai resolver. Registre isso
com clareza para não atribuir à aplicação um problema de hospedagem.

### 2.7 Armazenamento

Para cada categoria (imagens, containers, volumes, banco, uploads, logs, cache, temporários,
artefatos de build, dependências instaladas, backups, arquivos gerados): **quanto ocupa, por que
existe, é necessário, qual a política de retenção, dá para reduzir.**

⚠️ **Volumes órfãos são o maior desperdício silencioso** — restos de serviços removidos meses
antes, que ninguém referencia e ninguém percebe. Sempre confira.

### 2.8 Entregável da auditoria

Crie `docs/AUDITORIA-OTIMIZACAO-VPS.md` com: resumo executivo (por que consome tanto), arquitetura
atual, inventário de containers com a classificação da §1.4, dependências, banco, armazenamento
por categoria, problemas ordenados por severidade, **o que já está correto e não deve ser mexido**,
e linha de base de métricas com as marcas MEDIDO / ESTIMADO / NÃO MEDIDO.

---

## PARTE 3 — PLANO

Crie `docs/PLANO-OTIMIZACAO-VPS.md`. Classifique cada item como **CRÍTICA / ALTA / MÉDIA / BAIXA**
e, para cada um: problema, solução, impacto esperado (marcado), risco, arquivos afetados,
dependências entre itens, como testar, como medir, como reverter.

Inclua obrigatoriamente uma seção **"NÃO FAZER"** — o que foi considerado e recusado, com
justificativa. Ela é tão valiosa quanto a lista do que fazer: evita que a próxima pessoa (ou o
próximo agente) refaça a análise e cometa o erro.

Ordene por **impacto ÷ risco**, respeitando dependências. Itens que precisam de validação em
produção vêm depois, não antes.

---

## PARTE 4 — IMPLEMENTAÇÃO

Só depois do plano. Durante:

- Não remova funcionalidade, não quebre contrato de API, não altere dados destrutivamente.
- Comente **o porquê** de cada mudança não óbvia, referenciando o item do plano. Quem ler daqui a
  seis meses precisa entender o motivo, não só o efeito.
- Valide a cada bloco de mudanças, contra a linha de base da §2.1.
- **Se introduzir um defeito, diga.** Confira o resultado da sua própria alteração — não presuma
  que funcionou porque o comando não deu erro.

### Sequência recomendada

1. **Desbloquear** — o que impede qualquer outra coisa de funcionar.
2. **Código, risco baixo** — validável por compilação/teste local.
3. **Build e imagem** — contexto, camadas, dependências.
4. **Infraestrutura** — limites, configuração, deploy.
5. **Depois de produção estável** — o que exige medição real primeiro.
6. **Requer autorização explícita** — irreversível ou que muda o produto.

### Limites de recurso — como dimensionar

Todo container deve ter limite de **memória**, **CPU** e **PIDs**. Sem limite não é padrão seguro,
é proteção ausente: um vazamento derruba as outras aplicações do host.

Para dimensionar: meça o consumo em **pico** (não em ociosidade), defina o limite com folga real
sobre o pico, e **ajuste a configuração interna do processo para caber dentro do limite** — runtime
com heap próprio, banco com buffers e conexões, pool de workers. Limite externo sem ajuste interno
provoca morte por falta de memória exatamente sob carga.

Justifique cada valor com o número medido. Sem chute.

---

## PARTE 5 — TESTES

Execute o que existir. E **verifique se a suíte de testes realmente existe e roda** — é comum
haver scripts declarados apontando para diretórios vazios ou inexistentes. Se for o caso, **diga
com todas as letras**: sem rede de segurança automatizada, o primeiro deploy é o primeiro teste
funcional real, e isso muda o nível de cuidado necessário.

Valide, no mínimo: compilação/lint, validade dos arquivos de configuração, build real da imagem,
sintaxe de scripts, inicialização do container, healthcheck, e os fluxos críticos.

**Documente o que não pôde ser testado e por quê.** Não descreva como validado o que você não
validou.

---

## PARTE 6 — COMPARAÇÃO

Compare antes × depois usando **o mesmo método nas duas medições** — medir de formas diferentes
produz números não comparáveis e conclusões falsas.

Cubra: containers, tamanho e quantidade de imagens, volumes, contexto de build, CPU, RAM, disco,
tempo de build, tempo de inicialização, tempo de resposta, consumo em ociosidade e sob carga,
tamanho do banco.

Separe claramente **RESULTADO MEDIDO** de **RESULTADO ESTIMADO**. O que só a produção pode
responder fica marcado como pendente — nunca preenchido com estimativa disfarçada.

---

## PARTE 7 — DEPLOY E ENTREGA

⚠️ **Antes de commitar, confirme se `push` dispara deploy automático.** Se disparar, o commit não é
um marco de trabalho: é uma implantação em produção. Combine o momento comigo antes.

Antes do commit: revise todo o diff, confirme que não entra segredo, `.env`, credencial, dump,
artefato de build ou arquivo temporário. Escreva mensagem que explique **o porquê**, não só o quê —
incluindo o que ficou pendente de decisão.

Documente em `docs/DEPLOY.md` um procedimento reproduzível: pré-requisitos, variáveis, volumes,
redes, deploy, atualização, **rollback testado**, limpeza segura, diagnóstico.

### Regras de deploy limpo

- **Build fora da máquina de produção.** Compilar em produção disputa CPU com os usuários.
- **Versione por identificador imutável** (hash do commit), não só por tag móvel — é isso que
  torna rollback uma troca de variável em vez de um rebuild sob pressão.
- **Deploy idempotente**: rodar duas vezes não deve acumular lixo.
- **Remova órfãos explicitamente** — serviço retirado da configuração não some sozinho.
- 🔴 **Limpeza sempre com escopo restrito.** Em host compartilhado, comando de limpeza global
  atinge as outras aplicações. Prefira remoção de artefatos sem referência e filtros por idade ou
  rótulo. Entenda exatamente o que cada comando apaga antes de executá-lo.

---

## PARTE 8 — PADRÃO REUTILIZÁVEL

Ao final, crie `docs/PADRAO-VPS-MULTI-APPS.md` — regras práticas para as próximas aplicações,
derivadas do que **esta** auditoria mostrou, não de teoria genérica.

Responda: como estruturar uma aplicação nova; como deve ser o Dockerfile; como deve ser a
orquestração; quando criar container separado e quando não; como tratar banco, volumes, logs,
cache; como limitar recursos; como fazer deploy, atualização e rollback; como limpar sem afetar
outras apps; como evitar crescimento infinito de disco; como monitorar; como diagnosticar.

Inclua:
- **Checklist acionável** para aplicação nova e para revisão periódica.
- **Checklist de remoção de serviço** (ver §8.1).
- **Seção "não faça"**, com o porquê.
- **Status de validação de cada regra**: comprovada por medição, ou ainda não validada em produção.

### 8.1 Checklist: remover um serviço

Remoção pela metade deixa a aplicação **pior** do que antes — com o custo da configuração morta e
sem nenhum benefício. Ao remover, percorra tudo:

- [ ] Definição do serviço na orquestração
- [ ] Volumes e redes associados *(cuidado: remover a chave e esquecer o resto invalida o arquivo)*
- [ ] Variáveis de ambiente
- [ ] **Geradores de configuração** — se algo reescreve o arquivo de ambiente a cada deploy, a
      configuração morta ressuscita sozinha
- [ ] Dependências declaradas por outros serviços
- [ ] Pipeline de build e passos de deploy
- [ ] **Rotas/proxies que apontam para ele**
- [ ] **Clientes que chamam essas rotas**
- [ ] **Telas que usam esses clientes**
- [ ] Validações de build que exigem seus artefatos
- [ ] Volumes e containers órfãos no host
- [ ] Ajustes de sistema feitos por causa dele

**Se a funcionalidade continua existindo no produto, não é remoção — é migração**, e precisa de
destino definido antes de desligar o antigo.

---

## CRITÉRIO DE SUCESSO

Não considere concluído só porque compila, sobe ou os testes passam. O trabalho é bem-sucedido se:

1. Todas as funcionalidades continuam operando;
2. O consumo caiu **onde havia desperdício comprovado**;
3. O número de containers é racional e justificado;
4. O armazenamento tem política de retenção;
5. Deploys não acumulam lixo;
6. Uma aplicação não consegue comprometer todo o host;
7. Dá para **medir** o consumo;
8. Dá para **reproduzir** o deploy;
9. Dá para **reverter**;
10. As decisões viraram padrão aplicável às próximas aplicações.

---

## COMECE ASSIM

1. Confirme o que entendeu do objetivo e aponte o que falta no `CONTEXTO`.
2. **Audite primeiro** — nenhuma alteração.
3. Entregue a auditoria e **pare** para minha leitura.
4. Só então o plano; **pare** de novo.
5. Implemente o aprovado, validando a cada bloco.
6. Meça, compare, documente.
7. Combine comigo o momento do commit (ver Parte 7).

**Audite primeiro. Planeje depois. Implemente só após validação. Não pule etapas.**

Se em qualquer momento você perceber que uma afirmação anterior sua estava errada, **diga
imediatamente** — inclusive se isso invalidar trabalho já feito.
