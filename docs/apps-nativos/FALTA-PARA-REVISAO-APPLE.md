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

> **Enviado para revisão em 12/11/2026, 11h56 (Brasília)** — situação "Aguardando revisão".
> Publicação automática ao aprovar. Privacidade do app publicada (o rascunho do envio aceitou a versão sem pendências).

## Feito em 12/11/2026

- **Município de demonstração com dados**: catálogo aplicado (404 serviços, 14 etiquetas); 2 cidadãos
  de teste fictícios, sem e-mail (Ana Teste Revisão, nível Prata, com 3 pedidos, o 2026-000001 com foto
  e ponto no mapa; Bruno Teste Exclusão, para o revisor testar a exclusão). CPFs e senhas ficam SÓ em
  `Documents\DigiUrban-chaves-apps\contas-teste-revisao.json` e na ficha da Apple.
- **Conta de teste e notas** preenchidas na ficha (caminhos dos menus conferidos com o app).
- **9 capturas** na ficha (1320×2868, `make-store-images.js`): início, serviços, meus pedidos,
  assistente, conferir documento, entrada, ajuda, excluir conta, esqueci a senha. Nenhuma mostra o
  CPF da conta de teste. São do WebKit (o mesmo motor do iPhone), não do simulador da Apple.
- **Texto promocional** preenchido.

## Falta — em ordem

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
- **Ícone do site** (`frontend/public/icon*`): ainda é o antigo. O app abre o site, então o ícone
  antigo aparece em algumas telas.
- **Anexos de conversa** apagados na exclusão de conta: os arquivos continuam no disco do servidor de
  mensagens (só some a ligação com a conversa).

## Riscos que continuam
- **Apple 4.2 (app que só abre um site)**: risco nº 1. Defesas: avisos nativos, câmera com recorte,
  localização, compartilhar/abrir PDF, tela sem internet. Mais capturas reais ajudam.
- **Links que abrem o app** (e-mail → app): o arquivo do iPhone já tem o Team ID; falta testar no
  aparelho. A nota ao revisor não cita esse recurso, de propósito.
