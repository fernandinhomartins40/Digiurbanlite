# Como publicar o app DigiUrban (roteiro para o dono)

Ordem recomendada. Itens marcados **(espera)** levam dias — comece por eles.
Regras de cada loja: `POLITICAS-LOJAS.md`. Textos prontos: `FICHAS-LOJAS.md`.

Dados fixos do app (definidos em `digiurban/mobile/capacitor.config.json`):
- Nome: **DigiUrban**
- Identificador (pacote Android e Bundle ID iOS): **`br.com.digiurban.app`**
- Endereço que o app abre: `https://digiurban.com.br/cidadao`

---

## Etapa 0 — Antes de tudo (espera)

1. **Número D-U-N-S da empresa** (grátis): https://developer.apple.com/enroll/duns-lookup/
   (a Apple tem uma busca/pedido gratuito). Use **exatamente** a razão social e o endereço do
   CNPJ. Pode levar de alguns dias a 2 semanas. Não pague sites que cobram por isso.
2. **Cartas de autorização das prefeituras** (para o Google — e úteis se a Apple perguntar).
   Peça a cada prefeitura cliente uma carta em papel timbrado, assinada pelo prefeito ou
   secretário, enviada de um **e-mail .gov.br**. Modelo:

   > A Prefeitura Municipal de **[Município/UF]**, CNPJ **[...]**, autoriza a empresa
   > **[razão social]**, CNPJ **[...]**, contratada pelo **[contrato/processo nº ...]**, a
   > disponibilizar o aplicativo **"DigiUrban"** (pacote `br.com.digiurban.app`) nas lojas
   > Google Play e App Store como canal de acesso dos cidadãos aos serviços digitais deste
   > município (pedidos, acompanhamento, documentos e avisos).
   > Contato para confirmação: **[nome, cargo, e-mail .gov.br, telefone]**.
   > [Local, data, assinatura]

   Para os municípios novos, incluir essa carta no pacote de assinatura do contrato.
3. **Município de demonstração** para os revisores: no Super-admin, criar um município de
   teste (ex.: "Município Demonstração") e, nele, um cidadão de teste com CPF válido de teste,
   senha forte, alguns pedidos em andamento/concluídos, um documento assinado e uma conversa
   no chat. Esse cidadão **não pode** estar com pedido em andamento que bloqueie a exclusão se
   o revisor for testar "Excluir conta" — deixe um segundo cidadão de teste só para isso.

## Etapa 1 — Contas de desenvolvedor

**Google Play Console** — https://play.google.com/console/signup
- Escolha **Organização** (não pessoal). Taxa única de US$ 25.
- Com conta de organização você **não** precisa do teste com 12 testadores por 14 dias
  (essa regra vale para contas pessoais).
- Informe o D-U-N-S; nome e endereço iguais aos do D-U-N-S. Confirme e-mails e telefones.

**Apple Developer Program** — https://developer.apple.com/programs/enroll/
- Escolha **Organização** (com o D-U-N-S). US$ 99 por ano.
- Precisa de um ID Apple com autenticação de dois fatores e de alguém com poder de assinar
  pela empresa (a Apple pode ligar para confirmar).
- Anote o **Team ID** (Membership › Team ID, 10 letras/números).

## Etapa 2 — Avisos no celular (push)

### Android: Firebase
1. https://console.firebase.google.com → **Adicionar projeto** → nome "DigiUrban" (pode
   desligar o Google Analytics — não usamos).
2. No projeto: **Adicionar app › Android**, pacote `br.com.digiurban.app`. Baixe o
   **`google-services.json`**. O conteúdo dele vira o segredo
   `ANDROID_GOOGLE_SERVICES_JSON` no GitHub (ver `COMPILAR-SEM-MAC.md`). Não vai para o Git.
3. **Configurações do projeto › Contas de serviço › Gerar nova chave privada** → baixa um
   arquivo `.json`. Esse arquivo é **segredo**: não mande por WhatsApp/e-mail, cole direto
   no painel (passo 5).

### iOS: chave APNs (.p8)
4. https://developer.apple.com/account/resources/authkeys/list → **+** → marque **Apple Push
   Notifications service (APNs)** → baixe o arquivo **`AuthKey_XXXXXXXXXX.p8`** (só dá para
   baixar **uma vez** — guarde em lugar seguro). Anote o **Key ID** (os 10 caracteres do nome).
   - Também no Firebase: **Configurações do projeto › Cloud Messaging › Configuração do app
     Apple › Enviar chave de autenticação APNs** (mesmo .p8, Key ID e Team ID) — só se a
     equipe técnica disser que o iPhone também recebe pelo Firebase.

### Colar no painel
5. **Super-admin › Apps nativos** (tela que a equipe técnica está fazendo): cole o `.json`
   da conta de serviço do Firebase, o `.p8`, o Key ID, o Team ID e o Bundle ID
   `br.com.digiurban.app`. Ligue os avisos e use o botão de teste.

## Etapa 3 — Gerar o app Android (AAB)

O app é compilado **sempre no GitHub Actions** (botão *Run workflow*). Nada é compilado no seu
computador. Passo a passo e lista de segredos: **`COMPILAR-SEM-MAC.md`**, parte "Android".

1. **Chave de envio (keystore)** — uma vez só, guarde para sempre (sem ela não dá para
   atualizar o app). Se ainda não existir na pasta de chaves:
   ```
   keytool -genkeypair -v -keystore digiurban-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias digiurban-upload
   ```
   O nome da chave (alias) é sempre **`digiurban-upload`**. Guarde o arquivo `.jks` e as senhas
   em dois lugares seguros (ex.: cofre de senhas + pendrive). Eles **não** vão para o Git.
2. Cadastre os segredos do Android no GitHub (lista em `COMPILAR-SEM-MAC.md`).
3. GitHub › Actions › **Apps nativos** › *Run workflow* › `android`. O AAB assinado fica para
   baixar em *Artifacts*.
4. No Play Console o Google guarda a **chave de assinatura do app** ("Assinatura de apps do
   Google Play", ligada por padrão). A sua `.jks` é só a chave de **envio**.

## Etapa 4 — Gerar o app iOS

Também é no GitHub Actions, sem Mac: a máquina do GitHub compila, assina e envia para o
**TestFlight**. Passo a passo (tudo pelo navegador) e lista de segredos: **`COMPILAR-SEM-MAC.md`**,
parte "iOS".

Depois de cadastrar os segredos: GitHub › Actions › **Apps nativos** › *Run workflow* › `ios`.

## Etapa 5 — Links que abrem o app (domínio e `.well-known`)

Ao tocar num link `https://digiurban.com.br/cidadao/...` (e-mail, aviso), o celular abre o
app em vez do navegador. Precisa de dois arquivos públicos no site (a equipe técnica cria
em `digiurban/frontend/public/.well-known/`, você só fornece os números):

1. **Android — `assetlinks.json`**: precisa do **SHA-256 do certificado de assinatura do
   app** que o **Google** usa. Pegue em Play Console › seu app › **Teste e lançamento › Integridade
   do app › Assinatura de apps** → "Certificado da chave de assinatura do app" → **Impressão
   digital SHA-256**. Mande também o SHA-256 da chave de envio (mesma tela) para testes.
   Esse número só existe **depois** do primeiro envio do AAB ao Play Console.
2. **iOS — `apple-app-site-association`**: precisa do **Team ID** + `br.com.digiurban.app`.
3. Confira depois de publicar o site:
   - https://digiurban.com.br/.well-known/assetlinks.json
   - https://digiurban.com.br/.well-known/apple-app-site-association
   (os dois devem abrir sem login e sem redirecionar).
4. Municípios com **domínio próprio** não abrem o app pelos links (só `digiurban.com.br` e
   subdomínios configurados). É esperado.

## Etapa 6 — Google Play Console

1. **Criar app**: nome "DigiUrban", idioma português (Brasil), **App**, **Gratuito**.
2. **Ficha da loja** (*Expandir › Presença na loja › Ficha principal*): textos de
   FICHAS-LOJAS.md; ícone 512×512; imagem de destaque 1024×500; **no mínimo 2 capturas de
   tela** do celular (login, lista de pedidos, novo pedido com câmera, chat, avisos). Não use
   brasão nem nome de prefeitura nas imagens (use o município de demonstração).
3. **Política e programas › Conteúdo do app** — preencher tudo:
   - Política de privacidade: `https://digiurban.com.br/privacidade`
   - **Acesso ao app**: "Tudo ou parte do app é restrito" → município de demonstração, CPF e
     senha do cidadão de teste, e instrução "escolha o município Demonstração na tela de login".
   - Anúncios: **não**.
   - **Classificação de conteúdo** (questionário IARC): categoria "Utilitário/Produtividade/
     Comunicação/Outros"; sem violência, sexo, drogas, apostas; **sim** para "usuários podem
     interagir/trocar mensagens" e "compartilha localização" (com a prefeitura).
   - **Público-alvo**: **18+** (ver POLITICAS-LOJAS.md, item G11).
   - **Segurança dos dados**: respostas em FICHAS-LOJAS.md; link de exclusão
     `https://digiurban.com.br/excluir-conta`.
   - **Apps governamentais**: "O app facilita serviços do governo, mas não é publicado por
     órgão de governo" → anexar as cartas da Etapa 0.
   - **Recursos financeiros**: nenhum. **Apps de saúde**: ver item G12. **Apps de notícias**: não.
4. **Teste interno** primeiro (até 100 pessoas, sai em minutos): envie o AAB, instale e teste
   login, câmera, biometria, localização, avisos, baixar PDF e excluir conta.
5. Conta de organização → pode ir direto para **Produção** (país: Brasil). Conta pessoal →
   **teste fechado** com 12 pessoas por 14 dias antes.
6. Revisão do Google: de horas a ~7 dias no primeiro envio.

## Etapa 7 — App Store Connect

https://appstoreconnect.apple.com
1. **Meus apps › + › Novo app**: iOS, nome "DigiUrban" (se estiver em uso, "DigiUrban
   Cidadão"), idioma português (Brasil), Bundle ID `br.com.digiurban.app`, SKU `digiurban-app`.
2. **Informações do app**: categoria (FICHAS-LOJAS.md), URL de privacidade, classificação
   etária (questionário + as declarações novas "Localização compartilhada" = não, "Namoro"
   = não — obrigatórias até 12/01/2027).
3. **Privacidade do app**: respostas prontas em FICHAS-LOJAS.md.
4. **Preços e disponibilidade**: grátis; país **Brasil**.
5. **Versão 1.0**: textos, palavras-chave, URL de suporte, capturas de iPhone 6,9" (e iPad se
   o app rodar em iPad). A partir de abril/2027 apps novos também precisam de capturas do
   iPhone Duo.
6. **Informações para a revisão**: marque "Login necessário", informe CPF e senha do cidadão
   de teste e cole as **notas para o revisor** de FICHAS-LOJAS.md. Anexe uma carta de
   prefeitura (PDF) se quiser se adiantar.
7. Escolha o build enviado pelo GitHub Actions (aparece após ~15 min de processamento),
   responda "usa criptografia?" → só a padrão (HTTPS) / isenta, e **Enviar para revisão**.
8. Revisão da Apple: em geral 1–3 dias. Se recusarem por **4.2** (funcionalidade mínima),
   responda pela Central de Resolução listando os recursos nativos (push, câmera com
   recorte de documento, biometria, localização, PDF, links que abrem o app).

## Etapa 8 — Depois de publicado

- Atualizar o app nas lojas pelo menos 1 vez por ano (Google exige API nova todo agosto;
  Apple exige Xcode novo todo abril).
- Mudança grande no portal = descrever no "O que há de novo" da próxima versão (Apple 2.5.19).
- Responder denúncias de respostas do assistente em prazo razoável.
- Prefeitura nova: pedir a carta de autorização junto com o contrato.
