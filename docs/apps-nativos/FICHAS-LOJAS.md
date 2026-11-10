# Textos prontos para as lojas (DigiUrban)

Limites: Apple — nome 30, subtítulo 30, palavras-chave 100 caracteres. Google — título 30,
descrição curta 80, descrição completa 4.000.

## Aviso obrigatório (usar na descrição das duas lojas e no app, em "Sobre")

> O DigiUrban é a plataforma usada pelas prefeituras para atender o cidadão pela internet.
> O DigiUrban não é um órgão de governo: os pedidos são recebidos e decididos pela prefeitura
> do seu município, que contratou a plataforma. Veja se o seu município usa o DigiUrban na
> tela de entrada do app.

## Nome e textos curtos

| Campo | Texto | Tamanho |
|-------|-------|---------|
| Nome (Apple e Google) | **DigiUrban** (se o nome estiver ocupado na Apple: **DigiUrban Cidadão**) | 9 / 17 |
| Subtítulo (Apple) | **Pedidos e serviços da cidade** | 28 |
| Descrição curta (Google) | **Faça pedidos à prefeitura, envie documentos e acompanhe tudo pelo celular.** | 75 |
| Palavras-chave (Apple) | `prefeitura,cidadão,protocolo,serviços,município,pedido,documentos,ouvidoria,saúde,escola,matrícula` | 98 |

Não usar no nome, ícone ou imagens: brasão, bandeira, "Governo", "Prefeitura de ..." (regras
Google de representação enganosa e Apple 4.3/5.2).

## Descrição completa (Google e Apple)

```
O DigiUrban leva os serviços da prefeitura para o seu celular. Escolha o seu município,
entre com CPF e senha e resolva sem fila:

• Faça pedidos à prefeitura: tapa-buraco, poda de árvore, iluminação, matrícula escolar,
  consultas e remédios, benefícios sociais, licenças e muito mais (os serviços dependem
  do seu município).
• Acompanhe cada pedido pelo número do protocolo e receba aviso no celular quando houver
  novidade ou quando a prefeitura pedir alguma informação.
• Envie documentos pela câmera: o app ajuda a enquadrar, recorta e deixa a foto legível.
• Marque no mapa o local do problema com a localização do celular ou tocando no mapa.
• Converse com o assistente virtual e, quando precisar, com um atendente da prefeitura.
• Cuide da família: cadastre seus dependentes e faça pedidos por eles.
• Receba e assine documentos com a sua senha, com código de conferência pública.
• Confirme a sua identidade com a biometria facial (opcional, com o seu consentimento),
  para liberar serviços que exigem mais segurança.
• Seus dados, suas regras: baixe uma cópia dos seus dados ou exclua a sua conta pelo
  próprio app.

O DigiUrban é a plataforma usada pelas prefeituras para atender o cidadão pela internet.
O DigiUrban não é um órgão de governo: os pedidos são recebidos e decididos pela prefeitura
do seu município, que contratou a plataforma. Veja se o seu município usa o DigiUrban na
tela de entrada do app.

Privacidade: https://digiurban.com.br/privacidade
Termos de uso: https://digiurban.com.br/termos
Excluir conta: https://digiurban.com.br/excluir-conta
```

## Categoria e endereços

| Campo | Apple | Google |
|-------|-------|--------|
| Categoria principal | **Utilidades** | **Estilo de vida** (alternativa: Produtividade) |
| Categoria secundária | Estilo de vida | — |
| Política de privacidade | https://digiurban.com.br/privacidade | igual |
| Termos de uso | https://digiurban.com.br/termos (no campo "EULA" ou na descrição) | na descrição |
| Exclusão de conta | (dentro do app: Perfil › Excluir conta) | https://digiurban.com.br/excluir-conta (Segurança dos dados) |
| Suporte | https://digiurban.com.br/suporte — ❓ página ainda não existe; até lá use https://digiurban.com.br e um e-mail de suporte (ex.: suporte@digiurban.com.br) | e-mail de contato obrigatório + site |
| Site de marketing | https://digiurban.com.br | https://digiurban.com.br |

Não escolher "Saúde e fitness"/"Medicina" (evita a declaração de dispositivo médico da
Apple e a análise de app de saúde do Google).

---

## Dados que o app coleta (conferido no código)

Fonte: `digiurban/backend/prisma/schema.prisma` (model `Citizen` e ligados) e
`backend/src/services/citizen-privacy.service.ts`.

| Dado | Onde fica | Obrigatório? |
|------|-----------|--------------|
| Nome, CPF, e-mail, senha (cifrada), telefone(s) | `Citizen` | sim (e-mail pode faltar em dependente) |
| Data de nascimento, RG, nome da mãe, estado civil, profissão | `Citizen` | não (exigido para nível Prata/Ouro) |
| Renda familiar | `Citizen.familyIncome` | não |
| Endereço e ponto da casa no mapa | `Citizen.address`, `homeLatitude/Longitude` | endereço: sim em vários serviços; ponto: não |
| Localização do pedido (GPS ou alfinete) | pedidos | não |
| Fotos e PDFs de documentos (RG, comprovante...) | `CitizenDocument`, documentos do protocolo | conforme o serviço |
| Leitura automática do documento (só o resultado) | `document_readings` | automático |
| Biometria facial (fotos cifradas + vetor no face-server) | face-server (`FaceConsent`, identidade) | não, com consentimento |
| Dados de saúde (pedido de consulta/remédio, alergias, comorbidades) | apps de saúde | só em serviços de saúde |
| Mensagens do chat (assistente e atendente) e anexos | `Conversation/Message`, `uploads/bot` | ao usar o chat |
| Pedidos, respostas a pendências, avaliações (nota e comentário) | `ProtocolSimplified`, `ProtocolEvaluationSimplified` | ao usar |
| Família/dependentes (nome, parentesco, nascimento, CPF) | `FamilyComposition`, `Citizen` do dependente | não |
| Assinaturas eletrônicas (certificado da pessoa, código) | `DigitalCertificate`, `Signature` | ao assinar |
| Identificador de aviso do aparelho (push) | `PushSubscription` (e o token nativo) | não |
| Preferências de aviso, etiquetas dadas pela prefeitura | `NotificationPreference`, etiquetas | automático |

Não coleta: contatos do celular, agenda, histórico do navegador, lista de apps, ID de
publicidade. **Sem anúncios, sem rastreamento, sem SDK de análise** (conferido: o frontend não
tem Google Analytics, Sentry, Firebase Analytics etc. — manter o Firebase só para push e com
o Analytics desligado).

Quem mais recebe dados (todos como **prestadores de serviço** do DigiUrban, não "compartilhamento"):
provedores de IA do assistente (texto com dados pessoais **mascarados**), VeloMail (e-mail),
Google/OpenStreetMap (procurar endereço no mapa), Firebase/Apple (entregar avisos),
hospedagem. A **prefeitura** recebe os pedidos porque o próprio cidadão os envia a ela (ela é a
controladora dos dados, LGPD; o DigiUrban é operador).

## Google Play — Segurança dos dados (respostas sugeridas)

Perguntas gerais:
- O app coleta ou compartilha dados do usuário? **Sim**.
- Todos os dados são criptografados em trânsito? **Sim** (HTTPS).
- O usuário pode pedir a exclusão dos dados? **Sim** → https://digiurban.com.br/excluir-conta
- Dados compartilhados com terceiros: **Nenhum** (prestadores de serviço e envio iniciado
  pelo usuário não contam como compartilhamento, pela regra do Google).

Dados coletados (todos: **Coletado = sim, Compartilhado = não, Processado em tempo real = não**;
finalidade **Funcionalidade do app** + **Gerenciamento da conta**; algumas com **Prevenção
contra fraudes, segurança e conformidade**):

| Categoria Google | Tipo | Obrigatório/opcional | Finalidades |
|------------------|------|----------------------|-------------|
| Local | Local aproximado, Local exato | Opcional | Funcionalidade |
| Informações pessoais | Nome | Obrigatório | Funcionalidade, Conta |
| Informações pessoais | Endereço de e-mail | Obrigatório | Funcionalidade, Conta |
| Informações pessoais | IDs do usuário (CPF, ID da conta) | Obrigatório | Conta, Fraude/segurança |
| Informações pessoais | Endereço | Opcional | Funcionalidade |
| Informações pessoais | Número de telefone | Opcional | Funcionalidade, Conta |
| Informações pessoais | Outras informações (nascimento, RG, nome da mãe, estado civil, profissão, resultado da biometria) | Opcional | Funcionalidade, Fraude/segurança |
| Informações financeiras | Outras informações financeiras (renda familiar) | Opcional | Funcionalidade |
| Saúde e fitness | Informações de saúde | Opcional | Funcionalidade |
| Mensagens | Outras mensagens no app (chat) | Opcional | Funcionalidade |
| Fotos e vídeos | Fotos (documentos e rosto da biometria) | Opcional | Funcionalidade, Fraude/segurança |
| Arquivos e documentos | Arquivos e documentos (PDFs enviados) | Opcional | Funcionalidade |
| Atividade no app | Outros conteúdos gerados pelo usuário (pedidos, avaliações) | Opcional | Funcionalidade |
| Atividade no app | Interações com o app / Pesquisa no app (perguntas ao assistente) | Opcional | Funcionalidade |
| IDs do dispositivo ou outros | Identificador de aviso (push) | Opcional | Funcionalidade |

## Apple — Privacidade do app (respostas sugeridas)

- "Você ou seus parceiros coletam dados deste app?" **Sim**.
- **Rastreamento: não** em todos os tipos (sem ATT, sem anúncios).
- Para todos os tipos abaixo: **Vinculado à identidade do usuário = sim**; finalidade
  **Funcionalidade do app** (biometria e identificadores também: funcionalidade inclui
  "prevenir fraudes e segurança").

| Categoria Apple | Tipo |
|-----------------|------|
| Informações de contato | Nome, E-mail, Telefone, Endereço físico |
| Saúde e fitness | Saúde |
| Informações financeiras | Outras informações financeiras (renda) |
| Localização | Localização precisa, Localização aproximada |
| **Informações sensíveis** | **(dados biométricos — biometria facial)** |
| Conteúdo do usuário | E-mails ou mensagens de texto (chat); Fotos ou vídeos; Suporte ao cliente (conversa com atendente); Outro conteúdo do usuário (pedidos, avaliações, documentos) |
| Histórico de pesquisa | (perguntas/buscas de serviços no app) |
| Identificadores | ID do usuário (conta/CPF); ID do dispositivo (token de aviso) |
| Outros dados | Data de nascimento, RG, nome da mãe, estado civil, profissão, dados dos dependentes |

Não marcar: Contatos, Histórico de navegação, Compras, Dados de uso para publicidade,
Diagnóstico (só marcar se a equipe técnica ligar relatório de falhas).

## Apple — Classificação etária (respostas sugeridas)

- Violência, sexo, drogas, apostas, terror, palavrões: **nenhum**.
- Temas médicos: **infrequente** (pedidos de consulta/remédio; o app não dá orientação médica).
- Acesso irrestrito à internet: **não** (o app só abre o portal DigiUrban; links de fora abrem no navegador).
- Conteúdo gerado por usuário: **não** (nada é publicado para outros usuários).
- Mensagens e chat: **sim** (chat com atendente da prefeitura e assistente).
- Rede social: **não**. Anúncios: **não**. Controles parentais: **não**. Verificação de idade: **não**.
- Localização compartilhada (nova, a partir de 16/11/2026): **não** — a localização vai só para a prefeitura, nunca para outros usuários.
- Namoro e relacionamentos: **não**.
- Resultado esperado: **4+** ou **9+** (temas médicos infrequentes podem subir para 13+ — aceite o que o questionário der).

## Apple — Notas para o revisor (colar em "Informações para a revisão")

```
DigiUrban is a citizen services platform used by Brazilian city halls (prefeituras). The
company that publishes this app is the private technology provider contracted by these
municipalities. It is NOT a government agency, and the app says so in the store listing
and inside the app ("Sobre"). One single app serves all client municipalities: the
citizen chooses their municipality on the login screen (aggregated "picker" model,
guideline 4.2.6). We do not publish separate apps per city.

Demo account:
- Municipality: "Município Demonstração" (choose it on the login screen)
- CPF: [CPF DE TESTE]
- Password: [SENHA]
A second demo account for testing account deletion:
- CPF: [CPF 2] / Password: [SENHA 2]

What to try:
1. Log in, open "Serviços", create a request (e.g. street light repair), take a photo
   with the camera and mark the location on the map (location permission is optional;
   the address can be typed instead).
2. Open "Protocolos" to follow requests; you will get a push notification when the
   status changes.
3. "Mensagens": chat with the virtual assistant or a human attendant of the city hall.
   AI answers can be reported with "Denunciar". Before first use the app asks consent
   because the assistant uses third-party AI providers (personal data is masked first).
4. "Meus documentos": scan ID documents (front/back) with the guided camera; download
   and share signed PDF documents.
5. Optional facial biometrics (with explicit consent) is used only to verify identity
   for higher-security services, never for login, advertising or marketing.
6. Account deletion: Perfil > Excluir minha conta (asks the password). By Brazilian law
   (LGPD art. 16) the city hall keeps only name, CPF and past requests; this is
   explained on the screen.

Native features: push notifications (APNs), camera document scanner, location, share
sheet, file download/open, universal links from e-mails and notifications, offline screen.
No in-app purchases. No ads. No tracking.

Authorization letters from client municipalities are available on request
[ou: attached].
Contact: [nome, telefone, e-mail]
```

(Em inglês porque a equipe de revisão é internacional; a Apple aceita português, mas inglês
evita atraso.)

## Google Play — Instruções de acesso (campo "Acesso ao app")

```
Na tela de entrada, escolha o município "Município Demonstração".
CPF: [CPF DE TESTE]  Senha: [SENHA]
Para testar a exclusão de conta use: CPF [CPF 2]  Senha [SENHA 2]
(Perfil › Excluir minha conta).
```
