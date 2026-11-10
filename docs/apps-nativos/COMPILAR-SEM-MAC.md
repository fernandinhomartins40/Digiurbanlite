# Compilar e enviar os apps sem Mac (GitHub Actions)

O repositório é **público**, então as máquinas do GitHub (inclusive as Mac, `macos-26` com Xcode 26)
são **grátis e sem limite de minutos**. O workflow é `.github/workflows/apps-nativos.yml`
(GitHub › Actions › **Apps nativos** › *Run workflow*). Ele só roda quando alguém aperta o botão.

- Sem os segredos, ele compila **sem assinatura**, só para conferir que o projeto está certo.
- Com os segredos do iOS, ele gera o app assinado e **envia direto para o App Store Connect** (TestFlight).
- Com os segredos do Android, ele gera o **AAB assinado**, para baixar em *Artifacts* e enviar à Play.

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

## Ferramentas de IA da Apple (MCP), pesquisado em 2026-11
- **Xcode MCP** (`xcrun mcpbridge`, desde o Xcode 26.3) e **XcodeBuildMCP**: deixam um agente de IA compilar,
  abrir o simulador e testar o app. **Os dois rodam num Mac com Xcode**, então não servem sem Mac. Valeriam
  num Mac alugado na nuvem.
- **App Store Connect**: a Apple **não tem MCP oficial**, só servidores feitos por terceiros sobre a API
  oficial. Não precisamos deles: o envio vai pelo `xcodebuild` do workflow com a chave da API.
- Teste em aparelho sem Mac: **TestFlight** (instala o build enviado no seu iPhone) e as fotos de tela
  tiradas no próprio iPhone.
