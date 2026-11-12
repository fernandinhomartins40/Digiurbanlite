# O que falta para enviar o iPhone à revisão da Apple (rascunho, 12/11/2026)

Conferido pela API do App Store Connect em 12/11/2026. App: **DigiUrban** (id 6833740939),
versão **1.0.0**, situação "Preparar para envio".

## Já está pronto

| Item | Situação |
|---|---|
| Build | **build 8** (ícone novo), processado, ligado à versão 1.0.0 |
| Criptografia | declarada isenta (só HTTPS) |
| Nome, subtítulo, descrição, palavras-chave | preenchidos (textos de `FICHAS-LOJAS.md`) |
| Links | suporte, site e política de privacidade |
| Copyright | 2026 FUSE AGENCIA LTDA |
| Categorias | Utilidades / Estilo de vida |
| Classificação etária | respondida |
| Direitos de conteúdo | não usa conteúdo de terceiros |
| Preço e países | grátis, só Brasil |
| Contato da revisão | nome, e-mail e telefone |
| Notas para o revisor | em inglês (falta trocar os marcadores de CPF/senha) |
| Páginas legais no ar | privacidade (com a empresa e o CNPJ), termos, excluir conta, suporte |
| Exclusão de conta no app | pronta e alinhada à política |

## Falta — em ordem

### 1. Município de demonstração com dados (bloqueia os itens 2 e 3)
Hoje o "Município Demonstração" tem **0 serviços e 0 pedidos**. O revisor entraria num app vazio,
o que dá recusa por app incompleto (Apple 2.1) ou por "só abre um site" (4.2).
- Aplicar o catálogo de serviços nesse município (Super-admin › município › "Atualizar catálogo de serviços").
- Criar **2 cidadãos de teste**: um para usar, outro para o revisor testar a exclusão de conta.
- No 1º cidadão: 2 ou 3 pedidos (um com foto e local no mapa), um documento assinado e uma conversa.
- Sem nome, CPF ou foto de pessoa real. O município já tem 1 cidadão cadastrado: conferir quem é antes de mexer.
- **Grava na produção** — Claude só faz com o seu "pode".

### 2. Conta de teste na ficha
Em "Informações para a revisão": CPF e senha do 1º cidadão. Nas notas, trocar `[CPF DE TESTE]`,
`[SENHA]`, `[CPF 2]` e `[SENHA 2]` pelos dados reais das duas contas de teste.
Claude faz pela API assim que as contas existirem.

### 3. Mais capturas de tela (recomendado)
Hoje há **2** (entrada e conferir documento), 1320×2868. O mínimo da Apple é 1, então já dá para
enviar, mas para a revisão (4.2) é melhor mostrar o app de verdade, de 6 a 8 telas: início, serviços,
novo pedido com mapa, câmera de documento, lista de pedidos, conversa, documento assinado.
Depende do item 1. Claude tira e envia.
As capturas são do WebKit (o mesmo motor do iPhone), não do simulador da Apple.

### 4. Privacidade do app — **só você**
App Store Connect › app › **Privacidade do app**. Respostas prontas em `FICHAS-LOJAS.md`,
parte "Apple — Privacidade do app". A API da Apple não deixa preencher isso.
Precisa bater com o manifesto do app (`PrivacyInfo.xcprivacy`, já atualizado).

### 5. Testar no iPhone pelo TestFlight — **você**
Não existe grupo de teste ainda. TestFlight › Testes internos › **+** › adicione-se e instale pelo
app TestFlight. Conferir:
- entrar, fazer um pedido com foto e local;
- receber um aviso;
- baixar um PDF;
- anexar um arquivo escolhendo "gravar vídeo" (o app não pode fechar);
- tela sem internet (modo avião).
A chave dos avisos (APNs) já está no painel.

### 6. Enviar para revisão — você ou Claude
Com 1 a 5 feitos: versão 1.0.0 › **Adicionar para revisão** › Enviar.
Resposta da Apple: em geral de 1 a 3 dias.

## Opcional
- **Carta de autorização** de uma prefeitura cliente (PDF) nos anexos da revisão: reduz o risco de a
  Apple perguntar se o app é "de governo".
- **Texto promocional** (aparece acima da descrição; pode mudar sem nova revisão): hoje vazio.
- **Ícone do site** (`frontend/public/icon*`): ainda é o antigo. O app abre o site, então o ícone
  antigo aparece em algumas telas.
- **Anexos de conversa** apagados na exclusão de conta: os arquivos continuam no disco do servidor de
  mensagens (só some a ligação com a conversa).

## Riscos que continuam
- **Apple 4.2 (app que só abre um site)**: risco nº 1. Defesas: avisos nativos, câmera com recorte,
  localização, compartilhar/abrir PDF, tela sem internet. Mais capturas reais ajudam.
- **Links que abrem o app** (e-mail → app): o arquivo do iPhone já tem o Team ID; falta testar no
  aparelho. A nota ao revisor não cita esse recurso, de propósito.
