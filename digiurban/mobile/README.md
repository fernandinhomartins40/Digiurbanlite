# Apps DigiUrban (Android e iOS)

Projeto Capacitor 8 que gera os apps das lojas. **O app abre o portal de produção**
(`https://digiurban.com.br/cidadao`) — mesmas telas do site, nenhuma tela própria. Só existem
no aparelho: a abertura (splash) e a tela "sem internet" (cópia de `frontend/public/offline.html`,
gerada por `npm run web`; tenta de novo sozinha quando a internet volta e a cada 20 s).

Plano geral: `docs/apps-nativos/PLANO.md`. Este projeto NÃO entra no Dockerfile nem no deploy.

## Comandos

```bash
cd digiurban/mobile
npm install
npm test             # confere a tela "sem internet"
npm run sync         # gera www/ e copia configuração/plugins para android/ e ios/
npm run assets       # (só se o ícone mudar) refaz ícones e abertura a partir de assets/icon-master.png (identidade nova)
```

Precisa de **Node 22+** (só para esses comandos).

⚠️ `npm run assets` regrava `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher*.xml` e **apaga o
`<monochrome>`** (ícone de uma cor, Android 13+). Depois de rodar, recoloque a linha `<monochrome>` nos
dois arquivos (confira com `git diff`).

## Compilar: sempre no GitHub Actions

O app **não é compilado na máquina** (nem Android, nem iOS). Quem compila, assina e envia é o workflow
`.github/workflows/apps-nativos.yml`. Passo a passo e segredos: `docs/apps-nativos/COMPILAR-SEM-MAC.md`.

### Android

**Chave de assinatura (chave de envio)** — nunca vai para o git:

1. Criar uma vez: `keytool -genkeypair -v -keystore digiurban-upload.jks -alias digiurban-upload -keyalg RSA -keysize 2048 -validity 10000`
   O alias é sempre **`digiurban-upload`**.
2. Guardar o `.jks` e as senhas em local seguro (sem eles não dá para atualizar o app) e cadastrar os
   segredos no GitHub. O `android/app/build.gradle` lê `DIGIURBAN_KEYSTORE_FILE`,
   `DIGIURBAN_KEYSTORE_PASSWORD`, `DIGIURBAN_KEY_ALIAS` e `DIGIURBAN_KEY_PASSWORD`, que o workflow preenche.
   Sem a chave sai um AAB **sem assinatura** (a Play recusa).

**Versão:** o workflow manda `APP_VERSION` (campo `versao`) e `APP_BUILD_NUMBER` (número do envio);
o `build.gradle` lê os dois. Não mexer à mão.

**Push (Firebase):** o `google-services.json` do projeto Firebase (app Android
`br.com.digiurban.app`) entra pelo segredo `ANDROID_GOOGLE_SERVICES_JSON` (fica fora do git).
Sem ele o app compila e funciona, só não recebe avisos. O token que o site recebe no
Android é um token **FCM**.

**App Links:** depois do 1º envio, copie no Play Console › Integridade do app › Assinatura de
apps a **impressão digital SHA-256** da chave de assinatura do app e cole em
`frontend/public/.well-known/assetlinks.json` no lugar de `COLE_AQUI_O_SHA256_DO_PLAY_CONSOLE`
(pode deixar também a da upload key, separadas por vírgula). Publicar o site. Conferir:
`https://digiurban.com.br/.well-known/assetlinks.json`.

### iOS

Compila no GitHub Actions (`macos-26`, Xcode 26), com assinatura manual pelos segredos, e vai direto
para o TestFlight. O projeto usa **Swift Package Manager** (sem CocoaPods). O bundle id é
`br.com.digiurban.app`. **Push Notifications**, **Background Modes › Remote notifications** e
**Associated Domains** (`applinks:digiurban.com.br`) já estão no `App/App.entitlements`.

**Team ID:** em `frontend/public/.well-known/apple-app-site-association` trocar `TEAMID` pelo
Team ID (10 letras/números, em developer.apple.com › Membership). Publicar o site. Conferir:
`https://digiurban.com.br/.well-known/apple-app-site-association`.

**Push no iOS:** criar a chave APNs (.p8) em developer.apple.com › Keys. O app entrega ao site o
token **APNs cru** (sem Firebase no iOS); o servidor envia direto para a Apple com a chave .p8.

**Versão:** o workflow preenche `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION`.

## O que está configurado

| Item | Onde |
|---|---|
| Endereço, domínios permitidos, sem http, tela de erro | `capacitor.config.json` (`server.*`) |
| Voltar do Android: anda no histórico; na 1ª página sai | `android/.../MainActivity.java` (o do plugin App está desligado: `disableBackButtonHandler`, por isso o evento `backButton` NÃO chega ao JS) |
| Download que escapar do site → navegador do sistema | `MainActivity.java` (`setDownloadListener`). O normal é o site baixar com Filesystem + Share |
| `/super-admin` abre no navegador do sistema (não é do app) | `ExternalLinksPlugin.java` / `ios/App/App/MainViewController.swift` |
| Câmera / arquivo com `capture` / localização no WebView | já tratados pelo Capacitor (pede a permissão na hora) |
| Permissões Android | INTERNET, CAMERA, localização só com o app aberto, POST_NOTIFICATIONS (+ as do Firebase: rede, WAKE_LOCK, receber push). Sem READ_MEDIA_*, sem localização em segundo plano |
| Sem backup na nuvem da sessão | `allowBackup=false` + `res/xml/data_extraction_rules.xml` |
| Links do site abrem no app | Android: intent-filter `autoVerify` (`/cidadao`, `/validar-documento`); iOS: Associated Domains |
| Textos de permissão, pt-BR, só retrato no iPhone, criptografia isenta | `ios/App/App/Info.plist` |
| Manifesto de privacidade da Apple | `ios/App/App/PrivacyInfo.xcprivacy` (sem rastreamento; UserDefaults CA92.1, data de arquivo C617.1; dados coletados = os do portal, só para o serviço). Precisa bater com a ficha "Privacidade do app" do App Store Connect |
| Barra de status azul `#0f6fbe`, texto claro | plugin StatusBar / SystemBars (`insetsHandling: css`) |

O app **não pede permissão de notificação ao abrir**: quem pede é o site (Frente C), quando a
pessoa liga os avisos (`PushNotifications.requestPermissions()` + `register()`).

### Contrato com o site (`frontend/lib/native-app.ts`, Frente C)

`window.Capacitor.isNativePlatform()` e `window.Capacitor.Plugins.*`:
`PushNotifications` (token FCM no Android, APNs no iOS), `Filesystem` + `Share` (baixar e abrir
PDFs), `Browser` (links externos), `App` (`appUrlOpen` para os links do site que abrem o app),
`StatusBar`, `Keyboard`, `SplashScreen`.
