# Apps Android e iOS do cidadão — relatório de auditoria (11/11/2026)

Nada foi alterado no código. Este relatório diz o que está pronto, o que falta e o que pode causar
recusa nas lojas. O que fazer está em `PLANO-IMPLEMENTACAO.md`; como dividir entre agentes, em
`INSTRUCOES-AGENTES.md`.

## Resumo

- **O projeto está bem montado e compila.** O que impede a publicação hoje é quase todo de
  **cadastro e chaves** (contas das lojas, segredos de assinatura, Firebase), mais **6 correções
  pequenas de código** e as **imagens das lojas**, que não existem.
- **Compilação no GitHub Actions: funciona, mas só foi testada sem assinatura.** O caminho que
  assina e envia para as lojas nunca rodou, porque os segredos não foram cadastrados.
- **Políticas das lojas: não achei violação.** Achei 3 pontos de risco de recusa que são baratos
  de fechar (itens C1, C2 e C5) e o risco de sempre de app que abre um site (Apple 4.2).

Como li as regras: usei `POLITICAS-LOJAS.md`, pesquisado ontem (10/11/2026). **Não refiz a
pesquisa nos sites da Apple e do Google hoje.** Os tamanhos de imagem citados aqui devem ser
conferidos na página oficial pelo agente das imagens antes de gerar.

## 1. Compilação no GitHub Actions

Conferido direto no GitHub (`gh`):

| Item | Situação |
|---|---|
| Repositório público (`fernandinhomartins40/Digiurbanlite`) | ✅ máquinas grátis, inclusive Mac |
| Workflow `Apps nativos` (`.github/workflows/apps-nativos.yml`) | ✅ existe, só roda pelo botão |
| Android sem assinatura | ✅ compilou (execução de 10/11, 2 min 44 s) |
| iOS sem assinatura em `macos-26` | ✅ compilou (execução de 10/11) |
| Android **assinado** | ❌ nunca rodou |
| iOS **assinado + envio ao TestFlight** | ❌ nunca rodou |
| Segredos cadastrados | ❌ só existem `GIT_TOKEN` e `VPS_PASSWORD`; faltam os 12 dos apps |
| Push na `main` com mudança só em `digiurban/mobile/**` ou `docs/**` não reimplanta a produção | ✅ (`build-images.yml`, `paths-ignore`) |

Falhas do workflow (nenhuma impede compilar hoje):

- **W1.** Só roda pelo botão. Uma mudança que quebre o app só aparece no dia de publicar. Falta
  uma conferência automática (sem assinatura) quando `digiurban/mobile/**` muda.
- **W2.** Não gera **APK de teste**. Sem ele não dá para instalar no emulador e tirar as capturas
  sem compilar na sua máquina (que tem Java 17; o projeto pede Java 21).
- **W3.** O AAB assinado fica só para baixar; o envio à Play é manual. Dá para automatizar para a
  faixa de teste interno, mas **só depois do 1º envio manual** (regra do Google).
- **W4.** `actions/setup-java@v4` está descontinuada e as ações `@v4` rodam em Node 20
  descontinuado (aviso do próprio GitHub na execução). Vai parar de funcionar em algum momento.
- **W5.** `maxim-lobanov/setup-xcode@v1` é ação de terceiro, presa só por etiqueta, no mesmo job
  que recebe o certificado da Apple. Prender pelo código do commit (SHA).
- **W6.** Não roda `npm test` (o teste da tela "sem internet").
- **W7.** O número do envio é o número da execução do workflow. Funciona, mas **renomear ou
  recriar o arquivo do workflow zera a contagem** e as lojas recusam número menor. Falta aviso.
- **W8.** Sem keystore, o artefato sai com o mesmo nome do assinado. Fácil enviar o errado.

## 2. Defeitos de código encontrados

| # | Problema | Onde | Por que importa |
|---|---|---|---|
| **C1** | O aviso **"Instalar App… toque em Compartilhar no Safari"** aparece **dentro do app do iPhone**, 3 s depois de abrir o login. O componente não sabe que está no app. | `frontend/components/citizen/InstallPWABanner.tsx` (usado em `app/cidadao/login/page.tsx:826`) | É a primeira tela que o revisor da Apple vê, e ela diz que o app é um site. Reforça a recusa por 4.2. No Android não aparece. |
| **C2** | Falta o texto de motivo do **microfone** no iPhone. Campos de arquivo **sem lista de tipos** (`ProtocolDocumentsTab`, `ProtocolStageHistorySection`, `ProtocolSendGeneratedDocumentTab`, `admin/(analises)/ia`, TFD nova solicitação; conferir `src/components/bot/DocumentUploadCard`) oferecem "Tirar foto **ou gravar vídeo**". Gravar vídeo usa o microfone. | `mobile/ios/App/App/Info.plist` | Sem o texto, o iPhone **fecha o app** na hora. App que fecha = recusa (2.1). **Não testei em aparelho**: confirmar no TestFlight. |
| **C3** | O **manifesto de privacidade não bate com a ficha**. Faltam: renda (`OtherFinancialInfo`), localização aproximada (`CoarseLocation`), mensagens (`EmailsOrTextMessages`), atendimento (`CustomerSupport`), buscas (`SearchHistory`) e outros dados (`OtherDataTypes`). | `mobile/ios/App/App/PrivacyInfo.xcprivacy` × `FICHAS-LOJAS.md` | A Apple compara os dois. |
| **C4** | **Ícone dos avisos no Android** não foi definido. O aviso sai com um quadrado branco/cinza. Também falta o ícone de uma cor só (tema do Android 13+), que é opcional. | `mobile/android/app/src/main/AndroidManifest.xml`, `res/` | Qualidade; não é recusa. |
| **C5** | A política de privacidade **não diz quem é a empresa** (razão social, CNPJ, endereço). O único contato é `contato@digiurban.com.br`. | `frontend/components/legal/LegalPage.tsx`, `app/privacidade`, `app/suporte` | As duas lojas querem o responsável identificado e um contato **que funcione**. O DigiUrban não tem caixa de entrada própria: **não conferi se esse e-mail recebe mensagens**. |
| **C6** | Sobras do modelo do Capacitor: testes de exemplo no pacote `com.getcapacitor.myapp`. | `mobile/android/app/src/test` e `androidTest` | Só limpeza. |

## 3. Documentos que se contradizem

- **Nome da chave do Android (alias) aparece de 3 jeitos**: `digiurban` (README), `upload`
  (PUBLICAR.md) e `digiurban-upload` (COMPILAR-SEM-MAC.md). Alias errado = assinatura falha.
- `PUBLICAR.md` manda rodar `npm run android:aab`, **que não existe**, e manda compilar com Android
  Studio, Codemagic ou Mac. O README diz "iOS precisa de Mac". Tudo isso contraria a decisão de
  compilar **sempre** no GitHub Actions.
- `FICHAS-LOJAS.md` diz que `/suporte` "ainda não existe". Existe e está no ar.

## 4. Políticas das lojas — o que já está certo (conferido no código ou no ar)

| Exigência | Situação |
|---|---|
| Android mira a API 36; iOS compila com Xcode 26 | ✅ |
| Páginas `/privacidade`, `/termos`, `/excluir-conta`, `/suporte`, `/legal` | ✅ no ar (resposta 200) |
| Links de privacidade/termos no login, no perfil e no menu "Mais" | ✅ |
| Excluir a conta dentro do app, mesmo com pedido em andamento (cancela os pedidos) | ✅ |
| Página pública de exclusão, sem precisar do app | ✅ |
| Consentimento antes de usar IA de terceiros + botão "Denunciar" na resposta | ✅ |
| Compra de créditos de IA escondida no app (Apple 3.1.1) | ✅ `/admin/ia-creditos`; `/super-admin` abre fora do app |
| Um app para todos os municípios (Apple 4.3 / 4.2.6) | ✅ |
| Aviso "não é órgão de governo" | ✅ nas páginas legais e no texto da ficha |
| Permissões Android: só internet, câmera, localização com o app aberto e avisos | ✅ sem galeria, sem localização em segundo plano |
| Textos de motivo de câmera, localização e fotos no iPhone | ✅ (falta microfone — C2) |
| Sem cópia da sessão na nuvem, sem http, criptografia declarada isenta | ✅ |
| Sem anúncios, sem rastreamento, sem ferramenta de análise | ✅ |
| Sem bibliotecas nativas próprias (regra de páginas de 16 KB do Android) | ✅ conferir no relatório da Play Console no 1º envio |

**Riscos que continuam, mesmo com tudo feito**

- **Apple 4.2 (app que só abre um site)** é o risco nº 1. As defesas existem (avisos nativos,
  câmera com recorte, localização, compartilhar/abrir PDF, tela sem internet). Mas a nota ao
  revisor cita **"links universais"**, e eles **não funcionam hoje** (item 5). Ou consertar ou
  tirar da nota — prometer recurso que não funciona piora.
- **Google, apps de governo**: precisa das cartas das prefeituras (só você consegue).
- O painel do servidor (`/admin`) também abre dentro do app. Não viola regra, mas o revisor só
  recebe conta de cidadão. Manter a nota ao revisor falando só do cidadão.
- Pendente de decisão sua (já estava em `POLITICAS-LOJAS.md`, A24): idade mínima para o
  dependente ter acesso próprio. **Não conferi como está no código.**

## 5. O que falta e só você pode fazer

| # | Falta | Situação |
|---|---|---|
| D1 | Número D-U-N-S, conta Google Play (organização) e Apple Developer (organização) | não conferido (não tenho acesso) |
| D2 | **12 segredos no GitHub** (5 Android, 7 iOS — lista em `COMPILAR-SEM-MAC.md`) | ❌ nenhum cadastrado |
| D3 | Projeto Firebase (`google-services.json`) e chave APNs, colados em Super-admin › Apps nativos | não conferido |
| D4 | `apple-app-site-association` com o **Team ID** e `assetlinks.json` com o **SHA-256 da Play** | ❌ no ar com os textos provisórios `TEAMID` e `COLE_AQUI_O_SHA256_DO_PLAY_CONSOLE` |
| D5 | Município de demonstração + 2 cidadãos de teste, com pedidos, documento e conversa | não conferido |
| D6 | Cartas de autorização das prefeituras | não conferido |
| D7 | Razão social, CNPJ, endereço e e-mail de suporte que funcione (para C5) | falta você informar |
| D8 | Preencher as fichas (textos prontos em `FICHAS-LOJAS.md`) | depende de D1 |

## 6. Imagens para as lojas

Conferi os arquivos em `digiurban/mobile/assets` e nas pastas dos projetos.

| Imagem | Exigência | Situação |
|---|---|---|
| Ícone do app iOS (dentro do app) | 1024×1024, sem transparência | ✅ existe e está sem transparência |
| Ícones do app Android (todos os tamanhos, adaptativo) | — | ✅ gerados |
| Tela de abertura (claro/escuro) | — | ✅ |
| **Ícone da ficha da Play** | 512×512 PNG | ❌ não existe no formato da loja (o `icon-512x512.png` do site tem cantos redondos; a Play quer quadrado cheio) |
| **Banner da Play (imagem de destaque)** | 1024×500, sem transparência | ❌ não existe |
| **Capturas de tela Android** | mínimo 2 (ideal 4 a 8); o lado maior não pode passar de 2× o menor — **captura crua de celular atual (1080×2400) é recusada**, precisa ser montada, ex.: 1080×1920 | ❌ não existem |
| **Capturas de tela iPhone 6,9"** | 1320×2868 (ou 1290×2796) | ❌ não existem |
| Capturas de iPad | só se o app fosse feito para iPad; o projeto é só iPhone | ✅ não precisa |
| Ícone de aviso Android (branco, fundo transparente) | — | ❌ (C4) |

**Limite importante:** o simulador do iPhone só roda em Mac. Nesta máquina (Windows) dá para
emular **Android de verdade** (o SDK e 4 aparelhos virtuais já estão instalados). As telas do
iPhone serão tiradas com o **WebKit** (o mesmo motor do iPhone) no tamanho exato de 6,9" —
é a mesma página que o app mostra, mas não é o simulador da Apple.

As capturas só devem ser tiradas **depois** de todas as correções e com o município de
demonstração pronto (D5), para não aparecer dado de pessoa real nem brasão de prefeitura.

## 7. O que não verifiquei

- Nenhum teste em aparelho ou emulador (câmera, localização, avisos, baixar PDF).
- O caminho assinado do workflow (falta de segredos).
- Se as chaves de push estão no painel e se o envio de avisos funciona.
- Se o município de demonstração e as contas de teste existem.
- As regras das lojas nos sites oficiais hoje (usei a pesquisa de ontem).
- Se o e-mail `contato@digiurban.com.br` recebe mensagens.
