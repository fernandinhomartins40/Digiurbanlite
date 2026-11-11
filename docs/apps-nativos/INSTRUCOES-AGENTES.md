# Apps nativos — instruções para lançar os agentes

Para a sessão que orquestra (Opus 5.5). Ler antes: `RELATORIO-AUDITORIA-2026-11-11.md` e
`PLANO-IMPLEMENTACAO.md` (mesma pasta). Os códigos F, W, C e D vêm deles.

## Papel do orquestrador

1. Lançar os agentes 1 a 5 **juntos** (arquivos separados, não há conflito).
2. Quando voltarem: ler o `git diff`, commit único, push na `main`.
3. Fase 2 do plano: acompanhar o workflow com `gh run watch` e corrigir até ficar verde.
4. Parar e entregar ao dono a lista do que depende dele (Fase 3). **Não** lançar o agente 6 antes
   de o dono confirmar que as fases 1 a 4 e o município de demonstração estão prontos.

## Regras para todos os agentes (colar no início de cada prompt)

```
Projeto: c:\FuseDev\Digiurbanlite (monorepo DigiUrban). Leia o CLAUDE.md da raiz, seção
"Apps nativos Android/iOS", e docs/apps-nativos/RELATORIO-AUDITORIA-2026-11-11.md.
- Mexa SÓ nos arquivos da sua tarefa. Outros agentes trabalham ao mesmo tempo na mesma pasta.
- NÃO rode git add/commit/push/stash/checkout. Quem faz commit é o orquestrador.
- NÃO compile o app na máquina (nada de gradlew, xcodebuild, npx cap sync). A compilação é no
  GitHub Actions.
- Sem dependência nova. Sem tela nova. Sem refatorar o que não foi pedido.
- Nunca escreva valor de segredo, senha ou chave em arquivo ou na resposta.
- Textos para o usuário em português simples (o público é leigo).
- Achou algo fora da tarefa? Não conserte: relate.
Resposta final: arquivos alterados, o que conferiu e como, o que NÃO conferiu, pendências.
```

## Agente 1 — Workflow

- **Arquivo:** `.github/workflows/apps-nativos.yml` (só ele).
- **Tarefa:** F1 do plano, itens 1 a 7.
- **Cuidados:**
  - No gatilho `push`, nenhum passo pode ler `secrets.*`; assinar e enviar só com
    `github.event_name == 'workflow_dispatch'`.
  - Em `push`, `inputs.*` vem vazio: versão padrão `1.0.0`, plataforma `ambos`.
  - Ação de terceiro presa por SHA completo, com a versão em comentário. Buscar o SHA com
    `gh api repos/<dono>/<ação>/git/ref/tags/<versão>`.
  - Manter a assinatura manual do iOS como está (o motivo está no comentário do arquivo).
- **Conferir:** `gh workflow view` não acusa erro de sintaxe depois do push (o orquestrador roda).
  Se houver `actionlint` instalado, usar. Não instalar nada.
- **Relatar:** lista de entradas e segredos novos, para o agente 5 documentar.

## Agente 2 — iOS

- **Arquivos:** `digiurban/mobile/ios/App/App/Info.plist` e `PrivacyInfo.xcprivacy`.
- **Tarefa:** F2 do plano.
- **Cuidados:** conferir os nomes exatos dos tipos `NSPrivacyCollectedDataType...` na
  documentação da Apple (pesquisar; não confiar na memória). Manter a indentação do arquivo.
  Não tocar em `project.pbxproj`.
- **Conferir:** os dois arquivos são XML válido (ler com um analisador de XML do Node ou Python).

## Agente 3 — Android

- **Arquivos:** só dentro de `digiurban/mobile/android/app/src/`.
- **Tarefa:** F3 do plano.
- **Cuidados:** o vetor do "D" sai do `path class="st0"` de `digiurban/frontend/public/icon.svg`
  (ver como `digiurban/mobile/scripts/make-icons.js` o extrai). Ícone de aviso: branco puro,
  fundo transparente, 24dp. Nenhuma permissão nova no manifesto.
- **Conferir:** XML válido; `grep` de `uses-permission` igual ao de antes.
- **Relatar:** que `npm run assets` regrava `ic_launcher*.xml` (o agente 5 anota no README).

## Agente 4 — Site

- **Arquivos:** `digiurban/frontend/components/citizen/InstallPWABanner.tsx`; e, **só se o dono
  já tiver informado razão social, CNPJ, endereço e e-mail de suporte**,
  `components/legal/LegalPage.tsx`, `app/privacidade/page.tsx`, `app/suporte/page.tsx`.
- **Tarefa:** F4 do plano.
- **Cuidados:** usar `isNativeApp()` de `@/lib/native-app` (já existe). Sem os dados da empresa,
  fazer só o banner e relatar o resto como pendente — **não inventar dados nem deixar marcador
  provisório em página pública**.
- **Conferir:** `npm run type-check` em `digiurban/frontend` sem erro novo nos arquivos tocados.

## Agente 5 — Documentos

- **Arquivos:** `docs/apps-nativos/PUBLICAR.md`, `FICHAS-LOJAS.md`, `COMPILAR-SEM-MAC.md`,
  `digiurban/mobile/README.md`, e a seção "Apps nativos" do `CLAUDE.md` da raiz.
- **Tarefa:** F5 do plano.
- **Cuidados:** não reescrever os documentos; só corrigir o que o plano lista. Leitor = dono,
  leigo: frases curtas, sem jargão. O que os agentes 1 e 3 relatarem entra aqui (o orquestrador
  repassa; se ainda não houver, deixar conforme o plano F1).

## Agente 6 — Imagens das lojas (rodar por último, sozinho)

Pré-condições (o orquestrador confirma com o dono antes de lançar): fases 1 a 4 concluídas;
município de demonstração e cidadão de teste prontos; CPF e senha de teste passados pelo dono
**na conversa** (o agente usa em variável de ambiente e não grava em arquivo).

```
Tarefa: tirar as capturas de tela reais do app DigiUrban e preparar o pedido de imagens ao Codex.

A. Preparar
1. Confira na página oficial de cada loja os tamanhos atuais de capturas, ícone e banner
   (Play Console "Adicionar recursos de pré-visualização"; Apple "Screenshot specifications").
   Referência do relatório: iPhone 6,9" = 1320x2868; Play: banner 1024x500 sem transparência,
   ícone 512x512, capturas com lado maior no máximo 2x o menor (alvo da montagem: 1080x1920).
2. Pasta de saída: digiurban/mobile/store-assets/{capturas/android,capturas/ios,final}.

B. Capturas Android (app de verdade, no emulador)
1. Baixe o APK de teste do GitHub: gh run download <última execução verde de "Apps nativos">
   -n digiurban-android-debug-apk. NÃO compile na máquina.
2. Suba UM emulador já existente (emulator -list-avds; prefira o de Android 16), sem som:
   emulator -avd <nome> -no-audio -no-boot-anim. Espere o boot (adb wait-for-device +
   getprop sys.boot_completed).
3. adb install do APK. Abra o app. Para navegar e preencher o login use a depuração do WebView
   (o APK de teste permite): adb forward para o soquete webview_devtools_remote_<pid> e
   chromium.connectOverCDP do Playwright que já está no projeto. Se não der, adb shell input.
4. Modo demonstração da barra do sistema (hora 9:41, bateria cheia, sem avisos):
   adb shell settings put global sysui_demo_allowed 1 + os comandos "am broadcast
   com.android.systemui.demo".
5. Em cada tela: adb exec-out screencap -p > capturas/android/NN-nome.png.

C. Capturas iPhone
O simulador da Apple não roda no Windows. Use o Playwright com WebKit (mesmo motor do iPhone):
viewport 440x956, deviceScaleFactor 3 (= 1320x2868), isMobile, userAgent de iPhone, pt-BR,
abrindo https://digiurban.com.br/cidadao. Antes de carregar, injete um window.Capacitor mínimo
(isNativePlatform: () => true, getPlatform: () => 'ios', Plugins: {}) para a página se comportar
como dentro do app. Salve em capturas/ios/NN-nome.png. Diga no relatório final, com todas as
letras, que estas NÃO vieram do simulador da Apple.

D. Telas (as mesmas nas duas plataformas, 6 a 8)
login com escolha do município; início; serviços; novo pedido com mapa; câmera/scanner de
documento (tela de enquadramento); lista de pedidos; conversa com o assistente; documento
assinado. Só a conta de demonstração. Nenhum brasão, nome de prefeitura real, CPF ou nome de
pessoa real. Nenhum banner de "instalar app". Se aparecer algo assim, pare e relate.
Não exclua a conta, não crie pedido que avise pessoa real.

E. Encerrar tudo — OBRIGATÓRIO, mesmo se algo falhar no meio
Os emuladores e navegadores de automação bloqueiam o login do dono no Claude. Ao terminar:
1. Feche o navegador do Playwright no finally do script.
2. adb emu kill ; adb kill-server
3. PowerShell:
   Get-Process qemu-system-*, emulator*, adb, crashpad_handler -ErrorAction SilentlyContinue | Stop-Process -Force
   Get-Process | Where-Object { $_.Path -like '*ms-playwright*' } | Stop-Process -Force
4. NUNCA encerre chrome.exe, msedge.exe ou Code.exe do usuário — só processos cujo caminho está
   em ms-playwright ou no Android SDK.
5. Rode de novo a listagem e cole no relatório a prova de que não sobrou nenhum (qemu, emulator,
   adb, ms-playwright, node de script seu).
Não deixe nada em segundo plano. Não use run_in_background sem encerrar depois.

F. Entregar
1. Lista dos arquivos em capturas/ com o tamanho em pixels de cada um.
2. O PROMPT PARA O CODEX, pronto para colar, preenchido a partir do modelo abaixo com os nomes
   reais dos arquivos, os tamanhos conferidos no passo A e uma frase de destaque por tela.
3. NÃO gere você mesmo ícone, banner nem montagem. NÃO faça commit.
```

### Modelo do prompt para o Codex (o agente 6 preenche e devolve ao dono)

```
Repositório: c:\FuseDev\Digiurbanlite. Você vai criar as imagens das lojas do app DigiUrban
(Google Play e App Store). Marca: azul #0f6fbe, letra "D" branca de
digiurban/frontend/public/icon.svg, visual limpo, fonte Inter.

Entrada (capturas reais, NÃO alterar): digiurban/mobile/store-assets/capturas/android/*.png e
capturas/ios/*.png  → [LISTA DE ARQUIVOS E TAMANHOS]
Saída: digiurban/mobile/store-assets/final/

1. Ícone da Play: play-icon-512.png, 512x512, quadrado cheio (sem cantos redondos, a loja
   recorta), a partir do mesmo desenho de digiurban/mobile/assets/icon-only.png.
2. Banner da Play: play-feature-1024x500.png, 1024x500, sem transparência. Fundo da marca, o "D"
   e a frase "Os serviços da sua cidade no celular". Conteúdo importante longe das bordas.
3. Ícone de aviso Android: conferir/gerar o vetor branco de fundo transparente (se pedido).
4. Imagens de apoio: para cada captura, um fundo no tamanho final
   (Play: [1080x1920]; iPhone 6,9": [1320x2868]) com a frase de destaque no topo:
   [NN-nome → "frase"] ...
5. Montagem POR CÓDIGO (script Node com sharp, que já está em digiurban/mobile; guardar o script
   em digiurban/mobile/scripts/make-store-images.js): reduzir a captura real só por
   redimensionamento, cantos arredondados e sombra, e colar sobre a imagem de apoio.
   A captura NÃO pode ser redesenhada, recriada por IA, retocada nem ter texto trocado.
   Saída: final/play-NN-nome.png e final/ios-NN-nome.png, PNG ou JPEG sem transparência.
6. Regras das lojas: sem brasão, bandeira ou "Prefeitura de ..."; sem "grátis", "nº 1",
   "melhor", preço ou selo de loja; sem moldura de iPhone nas imagens da Play nem de Android nas
   da Apple; sem prometer função que o app não tem; texto em português do Brasil.
7. No fim: conferir e listar largura x altura de cada arquivo, confirmar que nenhum tem
   transparência e que as da Play respeitam "lado maior ≤ 2x o menor". Não fazer commit.
```
