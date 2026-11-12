# Compilar e enviar os apps sem Mac (GitHub Actions)

O repositório é **público**, então as máquinas do GitHub (inclusive as Mac, `macos-26` com Xcode 26)
são **grátis e sem limite de minutos**. O workflow é `.github/workflows/apps-nativos.yml`
(GitHub › Actions › **Apps nativos** › *Run workflow*). O app é compilado **sempre** ali, nunca no seu computador.

Ele roda de dois jeitos:

- **Sozinho**, a cada mudança enviada à `main` que mexe em `digiurban/mobile/**` ou no próprio workflow.
  Serve só para conferir que o app continua compilando. Compila **sem assinatura**, **não lê nenhum segredo**
  e **não envia nada** para as lojas.
- **Pelo botão** (*Run workflow*). Só assim ele assina e envia:
  - Sem os segredos, compila **sem assinatura**, só para conferir.
  - Com os segredos do iOS, gera o app assinado e **envia direto para o App Store Connect** (TestFlight).
  - Com os segredos do Android, gera o **AAB assinado**, para baixar em *Artifacts* e enviar à Play.

Opções do botão:

| Opção | Para que serve | Padrão |
|---|---|---|
| `plataforma` | qual app compilar: `ambos`, `android` ou `ios` | `ambos` |
| `versao` | versão que aparece na loja | `1.0.0` |
| `numero_base` | número somado ao número do envio. Só mexa se a loja recusar o envio por "número menor que o anterior" | `0` |
| `enviar_play` | manda o AAB assinado para a faixa de **teste interno** da Play (ver "Android") | desligado |

O que fica para baixar em *Artifacts* (Android):

- **`digiurban-android-debug-apk`**: APK de teste. Serve para instalar no emulador ou no celular e tirar as
  capturas de tela. **Não** vai para a loja.
- O **AAB** (o arquivo da Play). Se o nome terminar em **`-SEM-ASSINATURA`**, faltou a chave: é só teste,
  **não envie à Play** (ela recusa).

> **Não renomeie nem recrie o arquivo do workflow.** O número do envio vem do número da execução.
> Se o arquivo for renomeado ou recriado, a contagem volta para 1 e as lojas recusam número menor que o
> anterior. Se acontecer, use `numero_base` para passar do último número enviado.

Os arquivos de chave ficam em `C:\Users\fusea\Documents\DigiUrban-chaves-apps\`. **Faça cópia dessa pasta**
(pendrive ou cofre de senhas) e nunca coloque no git.

## iOS: passo a passo, só pelo navegador

1. **Team ID**: developer.apple.com › Account › Membership details › *Team ID* (10 letras/números).
2. **App ID**: Certificates, IDs & Profiles › Identifiers › **+** › App IDs › App.
   Bundle ID *Explicit* = `br.com.digiurban.app`, descrição "DigiUrban". Marque **Push Notifications** e
   **Associated Domains**.
3. **Certificado de distribuição**: Certificates › **+** › *Apple Distribution*. Envie o arquivo
   `ios-distribuicao.certSigningRequest` (já gerado na pasta de chaves) e baixe o `.cer`.
   O `.p12` (certificado + chave) é montado aqui a partir do `.cer` e do `ios-distribuicao.key`.
4. **Perfil**: Profiles › **+** › *App Store Connect* › App ID `br.com.digiurban.app` › o certificado do
   passo 3 › nome "DigiUrban App Store" › baixe o `.mobileprovision`.
5. **Chave da API**: appstoreconnect.apple.com › Users and Access › Integrations › App Store Connect API ›
   *Team Keys* › **+**, papel **App Manager**. Anote o *Issuer ID* e o *Key ID* e baixe o `.p8`. Ele só pode
   ser baixado **uma vez**.
6. **Registro do app**: App Store Connect › Apps › **+** › New App. Plataforma iOS, nome "DigiUrban",
   idioma Português (Brasil), Bundle ID `br.com.digiurban.app`, SKU `digiurban-ios`.
7. **Segredos no GitHub** (Settings › Secrets and variables › Actions):

| Segredo | Valor |
|---|---|
| `APPLE_TEAM_ID` | Team ID |
| `IOS_DIST_CERT_P12_BASE64` | o `.p12` em base64 |
| `IOS_DIST_CERT_PASSWORD` | senha do `.p12` |
| `IOS_PROFILE_BASE64` | o `.mobileprovision` em base64 |
| `ASC_API_KEY_P8` | conteúdo do `.p8` (texto) |
| `ASC_API_KEY_ID` | Key ID |
| `ASC_API_ISSUER_ID` | Issuer ID |

Depois: Actions › Apps nativos › Run workflow › `ios`. Em cerca de 10 a 20 minutos o build aparece no
TestFlight, já "Processando".

**Por que assinatura manual?** A assinatura automática na nuvem cria um certificado novo a cada execução,
porque a máquina do GitHub começa vazia, até estourar o limite da conta. Com o `.p12` guardado, usa sempre o mesmo.
O certificado vale 1 ano: renove e troque o segredo.

## Android

| Segredo | Valor |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `digiurban-upload.jks` em base64 |
| `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_PASSWORD` | senha da chave |
| `ANDROID_KEY_ALIAS` | `digiurban-upload` |
| `ANDROID_GOOGLE_SERVICES_JSON` | conteúdo do `google-services.json` do Firebase (sem ele, sem push) |

Na Play Console, ative a **Assinatura de apps do Google Play** (padrão): o Google guarda a chave final e esta
é só a "chave de envio" (dá para trocar pelo suporte se perder). O SHA-256 que vai no `assetlinks.json` é o
da chave do **Google** (Play Console › Integridade do app), não o desta.

**Enviar à Play sozinho (opcional).** O **1º envio** do AAB à Play é sempre **manual** (regra do Google):
baixe o AAB em *Artifacts* e envie na faixa de teste interno. Depois disso, dá para o workflow enviar:

1. Cadastre o segredo `PLAY_SERVICE_ACCOUNT_JSON` (conteúdo do `.json` de uma conta de serviço do Google
   com acesso ao app na Play Console).
2. No botão, ligue `enviar_play`.

O AAB vai para a faixa de **teste interno**. Sem o segredo, o workflow só avisa e não envia.

## Ferramentas de IA da Apple (MCP), pesquisado em 2026-11
- **Xcode MCP** (`xcrun mcpbridge`, desde o Xcode 26.3) e **XcodeBuildMCP**: deixam um agente de IA compilar,
  abrir o simulador e testar o app. **Os dois rodam num Mac com Xcode**, então não servem sem Mac. Valeriam
  num Mac alugado na nuvem.
- **App Store Connect**: a Apple **não tem MCP oficial**, só servidores feitos por terceiros sobre a API
  oficial. Não precisamos deles: o envio vai pelo `xcodebuild` do workflow com a chave da API.
- Teste em aparelho sem Mac: **TestFlight** (instala o build enviado no seu iPhone) e as fotos de tela
  tiradas no próprio iPhone.
