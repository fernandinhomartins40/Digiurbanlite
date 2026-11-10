# Apps nativos DigiUrban (Android + iOS) — plano (2026-11-10)

## Decisão
- **Um projeto Capacitor** em `digiurban/mobile/` gera os dois apps (Android e iOS).
- O app **abre o próprio PWA** de produção (`server.url = https://digiurban.com.br/cidadao`): mesma
  interface, mesma identidade visual, todas as funções. Nenhuma tela nativa própria além da
  abertura (splash) e da tela "sem internet" (cópia do `public/offline.html`).
- **Um app só para todos os municípios** (o login já escolhe o município). Um app por prefeitura
  seria recusado pela Apple (4.3 spam / 4.2.6 apps de modelo) — não fazer.
- O PWA percebe que está dentro do app por `window.Capacitor?.isNativePlatform()` e usa os plugins
  por `window.Capacitor.Plugins.*` (sem dependência nova no frontend). Helper único:
  `frontend/lib/native-app.ts`.

## Vários municípios e várias pessoas (um app só)
- O app abre o domínio raiz; o município vem da escolha no login (cookie `digiurban_tenant_slug`,
  lido pelo `tenant-context.ts`) e, se o cookie sumir, do município gravado na própria sessão.
  Sessão é cookie httpOnly do host atual — o app NUNCA navega para `{slug}.digiurban.com.br`.
- Login do cidadão: seletor obrigatório (já existia). Login do servidor: seletor no domínio raiz
  (opcional para não travar as contas do tenant `default`).
- Trocar de município (`MunicipioSwitcher`): no domínio raiz fica no domínio raiz.
- Celular compartilhado: o token de push pertence a quem está logado agora (troca de dono no
  registro; apagado ao sair, trocar de município ou excluir conta); envio filtra município + dono.
- Links universais só para `digiurban.com.br` — links de e-mail com subdomínio abrem no navegador.

## Frentes
| # | Frente | Onde mexe |
|---|--------|-----------|
| A | Políticas das lojas (pesquisa) + roteiro de publicação + textos das fichas | `docs/apps-nativos/` |
| B | Projeto nativo Capacitor (Android/iOS, permissões, push, links, downloads, ícones) | `digiurban/mobile/`, `frontend/public/.well-known/` |
| C | Ajustes no PWA/backend para as lojas (push nativo FCM, privacidade/termos, exclusão de conta, links externos, compras) | `frontend/` (exceto `public/.well-known`), `backend/` |

## Exigências que guiam tudo (detalhe em POLITICAS-LOJAS.md)
- Apple 4.2 (funcionalidade mínima): o app não pode ser "só um site" → push nativo, câmera,
  localização, compartilhar, abrir arquivos, links universais.
- Política de privacidade pública (URL nas duas lojas e dentro do app).
- Excluir a conta dentro do app (Apple 5.1.1(v)) e por link na web (Google Play).
- App ligado a governo: aviso claro de que o DigiUrban é a plataforma contratada pelas prefeituras,
  não um órgão de governo; publicação com documento de autorização das prefeituras (Google).
- Sem compra de bens digitais dentro do app fora do sistema da loja (créditos de IA: esconder no app).
- Android: alvo da API exigida pelo Google Play na data; iOS: `PrivacyInfo.xcprivacy`.
- Conta de teste para a revisão (Apple e Google).

## O que só o dono faz (não dá por código)
Criar projeto Firebase (push), gerar chave APNs, assinar os builds (keystore / certificado Apple),
compilar o iOS num Mac (ou serviço de build na nuvem), preencher as fichas das lojas.
Roteiro passo a passo: `docs/apps-nativos/PUBLICAR.md`.
