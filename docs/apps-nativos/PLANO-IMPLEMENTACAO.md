# Apps nativos — plano de implementação (11/11/2026)

Origem: `RELATORIO-AUDITORIA-2026-11-11.md` (os códigos W, C e D vêm de lá).
Como dividir entre agentes: `INSTRUCOES-AGENTES.md`.

Regras do plano:
- **Compilar sempre no GitHub Actions.** Nenhuma tarefa compila o app na máquina local.
- Trabalhar na `main`. Mudança só em `digiurban/mobile/**`, `docs/**` ou no workflow dos apps
  **não** reimplanta a produção. Mudança em `digiurban/frontend/**` **reimplanta** (tarefa F4).
- Nada de dependência nova. Nada de tela nova. Só o que está listado.
- Sem valor de segredo em arquivo, log ou conversa.

## Fase 1 — Correções de código (agentes, em paralelo)

### F1. Workflow (`.github/workflows/apps-nativos.yml`)
1. **Conferência automática** (W1): gatilho `push` na `main` com `paths: digiurban/mobile/**` e o
   próprio workflow. Nesse gatilho: compila os dois **sem assinatura** e **nunca** lê segredo nem
   envia nada. Assinar e enviar só em `workflow_dispatch`.
2. **APK de teste** (W2): no job Android, `assembleDebug` e artefato `digiurban-android-debug-apk`.
3. `npm test` antes de compilar, nos dois jobs (W6).
4. Atualizar as ações para as versões atuais (W4) e prender `setup-xcode` (e qualquer ação de
   terceiro) pelo SHA do commit (W5).
5. Nome do artefato diz se está assinado: `...-SEM-ASSINATURA` quando falta o keystore (W8).
6. Comentário no topo: não renomear nem recriar o arquivo, porque o número do envio vem do número
   da execução (W7). Entrada opcional `numero_base` (padrão 0) somada ao número, para o caso de
   precisar.
7. **Envio à Play, faixa de teste interno** (W3): entrada `enviar_play` (padrão desligado) +
   segredo `PLAY_SERVICE_ACCOUNT_JSON`. Sem o segredo, só avisa. Usar a ação
   `r0adkll/upload-google-play` presa por SHA. Funciona só depois do 1º envio manual.

Pronto quando: execução por `push` verde nos dois jobs; execução pelo botão sem segredos verde,
com os artefatos AAB (sem assinatura) e APK de teste.

### F2. iOS (`digiurban/mobile/ios/App/App/`)
1. `Info.plist`: `NSMicrophoneUsageDescription` — "O microfone só é usado se você escolher gravar
   um vídeo para anexar a um pedido." (C2)
2. `PrivacyInfo.xcprivacy`: acrescentar os tipos que faltam para bater com a ficha (C3):
   `OtherFinancialInfo`, `CoarseLocation`, `EmailsOrTextMessages`, `CustomerSupport`,
   `SearchHistory`, `OtherDataTypes` — todos ligados à pessoa, sem rastreamento, finalidade
   funcionalidade do app. Conferir os nomes exatos na documentação da Apple.

Pronto quando: `plutil`/leitura XML sem erro e o job iOS verde.

### F3. Android (`digiurban/mobile/android/`)
1. Ícone de aviso (C4): `res/drawable/ic_stat_digiurban.xml` (vetor branco do "D", tirado de
   `frontend/public/icon.svg`) + `meta-data`
   `com.google.firebase.messaging.default_notification_icon` e `..._color` (`#0f6fbe`) no manifesto.
2. Ícone de uma cor (`<monochrome>`) em `mipmap-anydpi-v26/ic_launcher*.xml`, usando o mesmo vetor.
   Atenção: `npm run assets` regrava esses XML — anotar isso no README.
3. Apagar os testes de exemplo `com.getcapacitor.myapp` (C6).

Pronto quando: job Android verde e o manifesto final sem permissão nova.

### F4. Site (`digiurban/frontend/`) — **reimplanta a produção**
1. `InstallPWABanner.tsx`: não mostrar quando `isNativeApp()` (C1). Uma linha.
2. `components/legal/LegalPage.tsx` + `/privacidade` + `/suporte`: identificar a empresa
   responsável (razão social, CNPJ, endereço) e o e-mail de suporte (C5). **Depende do D7.** Sem
   os dados do dono, fazer só o item 1 e deixar este pendente — não inventar dados.

Pronto quando: `npm run type-check` do frontend sem erro novo e, depois do deploy, o banner não
aparece com `window.Capacitor` presente.

### F5. Documentos (`docs/apps-nativos/`, `digiurban/mobile/README.md`)
1. Um alias só para a chave do Android: **`digiurban-upload`**, nos três documentos.
2. Tirar de `PUBLICAR.md` e do README as instruções de compilar com Android Studio, Codemagic,
   Mac e `npm run android:aab`. Etapas 3 e 4 passam a apontar para `COMPILAR-SEM-MAC.md`.
3. `FICHAS-LOJAS.md`: `/suporte` existe; acrescentar a tabela de imagens e tamanhos (relatório,
   item 6); nota ao revisor sem "universal links" enquanto o D4 não estiver feito.
4. `COMPILAR-SEM-MAC.md`: novos gatilhos, APK de teste, segredo `PLAY_SERVICE_ACCOUNT_JSON`, aviso
   de não renomear o workflow.
5. `CLAUDE.md` (seção "Apps nativos"): 2 linhas com o que mudou.

## Fase 2 — Conferir no GitHub (orquestrador)

1. Commit e push da Fase 1.
2. Esperar a execução automática e rodar uma pelo botão (`ambos`). Corrigir até ficar verde.
3. Conferir o deploy do site (F4) e a página de login no ar.

## Fase 3 — O que só o dono faz (pode correr junto com a Fase 1)

Roteiro: `PUBLICAR.md` e `COMPILAR-SEM-MAC.md`.

| # | Tarefa | Libera |
|---|---|---|
| D1 | D-U-N-S, conta Play (organização), conta Apple (organização) | tudo |
| D7 | Informar razão social, CNPJ, endereço e e-mail de suporte que recebe mensagens | F4.2 |
| D2 | Cadastrar os segredos no GitHub (Android 5, iOS 7) | Fase 4 |
| D3 | Firebase + chave APNs, colar em Super-admin › Apps nativos | avisos |
| D5 | Município de demonstração + 2 cidadãos de teste (pedidos, documento assinado, conversa) | revisão e capturas |
| D6 | Cartas de autorização das prefeituras | Google |

D5 mexe na produção: se for feito por agente, só com o seu "pode" explícito e pelo painel.

## Fase 4 — Build assinado e teste em aparelho (depende de D1, D2, D3)

1. Rodar o workflow (`ambos`). Android: AAB assinado. iOS: aparece no TestFlight.
2. 1º envio do AAB à Play **manual**, faixa de teste interno.
3. **D4**: pegar o SHA-256 em Play Console › Integridade do app e o Team ID; trocar os textos
   provisórios em `frontend/public/.well-known/`; push; conferir os dois endereços no ar.
   Depois disso, devolver "universal links" à nota ao revisor.
4. Testar no celular (Android pela faixa interna, iPhone pelo TestFlight): entrar, pedido com
   foto, localização, aviso chegando e abrindo a tela certa, baixar PDF, anexar arquivo escolhendo
   "gravar vídeo" (C2), excluir conta com a 2ª conta de teste, tela sem internet, link de e-mail
   abrindo o app.
5. Conferir no IPA que `aps-environment` saiu `production` (o TestFlight avisa se não).

## Fase 5 — Imagens das lojas (depende das fases 1 a 4 e do D5)

Agente das imagens (`INSTRUCOES-AGENTES.md`, agente 6):
1. Capturas reais: Android no emulador, com o APK de teste baixado do GitHub; iPhone com WebKit no
   tamanho 6,9". Conta de demonstração. Guardar em `digiurban/mobile/store-assets/capturas/`.
2. **Encerrar emulador, adb e navegadores de automação** e conferir que não sobrou processo.
3. Entregar o **prompt para o Codex**: gerar ícone da Play (512), banner (1024×500), ícone de
   aviso e as imagens de apoio, e **montar** cada captura real sobre a imagem de apoio por código
   (a captura não é redesenhada).

## Fase 6 — Publicar (dono)

`PUBLICAR.md`, etapas 6 e 7: fichas, declarações, imagens, conta de teste, enviar para revisão.

## Fora do plano (de propósito)

- Telas nativas próprias, modo sem internet completo, app separado para servidor.
- Capturas no simulador da Apple (exigiria teste automatizado no Mac do GitHub; fazer só se a
  Apple reclamar das capturas).
- Idade mínima do dependente com acesso próprio: decisão do dono, ainda aberta.
