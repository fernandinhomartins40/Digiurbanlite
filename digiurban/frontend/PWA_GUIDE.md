# 📱 Guia Completo do PWA - DigiUrban

## ✅ Implementação Concluída

O DigiUrban agora é um **Progressive Web App (PWA)** completo, permitindo que os cidadãos instalem o aplicativo diretamente em seus dispositivos móveis (iOS e Android) sem precisar de lojas de aplicativos.

---

## 🎯 Recursos Implementados

### 1. **Instalação do App**
- ✅ Botão de instalação automático (Android)
- ✅ Banner com instruções para iOS
- ✅ Ícone personalizado na tela inicial
- ✅ Modo standalone (sem barra do navegador)

### 2. **Funcionalidade Offline**
- ✅ Cache inteligente de páginas e assets
- ✅ Página offline customizada
- ✅ Estratégias de cache otimizadas:
  - **API**: Network First (prioriza dados atualizados)
  - **Imagens**: Cache First (carrega rápido)
  - **CSS/JS**: Stale While Revalidate (atualiza em background)

### 3. **Otimizações Mobile**
- ✅ Meta tags iOS completas
- ✅ Theme color configurado
- ✅ Ícones em todos os tamanhos necessários
- ✅ Manifest.json completo
- ✅ Service Worker automático

---

## 📋 Arquivos Criados/Modificados

### Novos Arquivos

1. **`/public/icon.svg`** - Ícone principal do app (gradiente azul + letra D)
2. **`/public/manifest.json`** - Configuração PWA
3. **`/public/offline.html`** - Página offline fallback
4. **`/public/apple-touch-icon.png`** - Ícone iOS (gerado automaticamente)
5. **`/components/citizen/InstallPWABanner.tsx`** - Banner de instalação
6. **`/app/offline/page.tsx`** - Página offline em React

### Arquivos Modificados

1. **`next.config.js`** - Configuração do plugin PWA
2. **`app/layout.tsx`** - Meta tags PWA e viewport
3. **`app/cidadao/login/page.tsx`** - Banner de instalação
4. **`app/cidadao/page.tsx`** - Banner de instalação
5. **`.gitignore`** - Ignora arquivos gerados pelo PWA
6. **`package.json`** - Dependência @ducanh2912/next-pwa

---

## 🚀 Como Testar o PWA

### **Local (Desenvolvimento)**

1. **Iniciar o servidor**:
   ```bash
   cd digiurban/frontend
   npm run dev
   ```

2. **Acessar via HTTPS**:
   - PWA requer HTTPS (exceto localhost)
   - Use ngrok ou similar para testar em devices reais:
     ```bash
     npx ngrok http 3000
     ```

3. **Testar instalação**:
   - **Android Chrome**: Ícone de instalação aparecerá na barra de URL
   - **iOS Safari**: Menu Compartilhar > "Adicionar à Tela de Início"

### **Produção**

1. **Build da aplicação**:
   ```bash
   npm run build
   ```

2. **Verificar arquivos gerados**:
   - `/public/sw.js` - Service Worker
   - `/public/workbox-*.js` - Biblioteca de cache
   - Ícones PNG em vários tamanhos

3. **Deploy**:
   - Fazer deploy normalmente (Vercel, Netlify, VPS)
   - Garantir que está servindo via HTTPS

---

## 📱 Como Instalar (Para Usuários)

### **Android (Chrome, Edge, Samsung Internet)**

1. Acesse o site pelo navegador
2. Clique no banner "Instalar App" que aparecer
3. **OU** toque no menu ⋮ > "Adicionar à tela inicial"
4. Confirme a instalação
5. O ícone do DigiUrban aparecerá na tela inicial

### **iPhone/iPad (Safari)**

1. Acesse o site pelo Safari
2. Toque no botão **Compartilhar** (ícone de seta para cima)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Personalize o nome se quiser
5. Toque em **"Adicionar"**
6. O ícone do DigiUrban aparecerá na tela inicial

### **Desktop (Chrome, Edge)**

1. Acesse o site
2. Clique no ícone de instalação na barra de URL (+)
3. Confirme a instalação
4. O app abrirá em janela própria

---

## 🔧 Configurações do PWA

### **Service Worker (next.config.js)**

```javascript
workboxOptions: {
  // Cache de API (5 minutos)
  - Estratégia: Network First
  - Timeout: 10 segundos
  - Max entries: 50

  // Cache de Imagens (30 dias)
  - Estratégia: Cache First
  - Max entries: 100

  // Cache de JS/CSS (7 dias)
  - Estratégia: Stale While Revalidate
  - Max entries: 100
}
```

### **Manifest (manifest.json)**

```json
{
  "name": "DigiUrban - Portal do Cidadão",
  "short_name": "DigiUrban",
  "start_url": "/cidadao",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#0f6fbe",
  "background_color": "#ffffff"
}
```

---

## 🎨 Personalização

### **Trocar Ícone do App**

1. Edite o arquivo `/public/icon.svg`
2. Modifique as cores no gradiente:
   ```svg
   <stop offset="0%" style="stop-color:#0f6fbe" />  <!-- Cor 1 -->
   <stop offset="100%" style="stop-color:#0fffbf" /> <!-- Cor 2 -->
   ```
3. Rebuilde o projeto: `npm run build`

### **Trocar Cor do Tema**

1. Edite `/public/manifest.json`:
   ```json
   "theme_color": "#SUA_COR_AQUI"
   ```

2. Edite `/app/layout.tsx`:
   ```typescript
   themeColor: '#SUA_COR_AQUI'
   ```

### **Modificar Estratégias de Cache**

Edite o `/next.config.js` na seção `workboxOptions.runtimeCaching`.

---

## 🐛 Troubleshooting

### **O banner de instalação não aparece**

- **Causa**: Pode estar em desenvolvimento (PWA desabilitado)
- **Solução**: Faça build (`npm run build`) e teste em produção

### **Service Worker não atualiza**

- **Solução**:
  1. Abra DevTools > Application > Service Workers
  2. Clique em "Unregister"
  3. Recarregue a página (Ctrl/Cmd + Shift + R)

### **Ícones não aparecem**

- **Causa**: Build ainda não gerou os PNGs
- **Solução**:
  ```bash
  npm run build
  # Os ícones serão gerados automaticamente
  ```

### **PWA não funciona offline**

- **Verificar**:
  1. Service Worker está registrado? (DevTools > Application)
  2. Cache está populado? (DevTools > Application > Cache Storage)
  3. Acesse a página online primeiro para cachear

### **iOS não mostra em fullscreen**

- **Verificar**: Meta tag `apple-mobile-web-app-capable` está presente
- **Já implementado** em `/app/layout.tsx`

---

## 📊 Métricas de Sucesso

### **Lighthouse Score Esperado**

- ✅ **PWA**: 90+ pontos
- ✅ **Performance**: 85+ pontos
- ✅ **Accessibility**: 90+ pontos
- ✅ **Best Practices**: 90+ pontos
- ✅ **SEO**: 90+ pontos

### **Verificar Score**

1. Abra Chrome DevTools (F12)
2. Vá em "Lighthouse"
3. Selecione "Progressive Web App"
4. Clique em "Analyze page load"

---

## 🔒 Segurança

### **Requisitos Mínimos**

- ✅ **HTTPS obrigatório** (exceto localhost)
- ✅ **Service Worker** só funciona em HTTPS
- ✅ **Manifest** deve ser servido via HTTPS

### **Boas Práticas Implementadas**

- ✅ Cache apenas recursos confiáveis
- ✅ Timeout em requisições de rede (10s)
- ✅ Validação de respostas (status 200)
- ✅ Scope definido para evitar vazamentos

---

## 📈 Próximos Passos (Fase 2)

### **Push Notifications** 🔔
- Notificar sobre atualizações de protocolos
- Avisos importantes do município
- Lembretes de agendamentos

### **Background Sync** 🔄
- Sincronizar dados quando voltar online
- Fila de ações offline
- Upload automático de documentos

### **Share API** 📤
- Compartilhar protocolos
- Compartilhar comprovantes
- Enviar documentos

### **Geolocation API** 📍
- Localizar unidades de atendimento próximas
- Sugerir serviços baseados na localização
- Mapa de departamentos

---

## 📞 Suporte

### **Problemas Conhecidos**

1. **iOS limpa cache após 7 dias sem uso**
   - Normal, faz parte das restrições do iOS
   - Usuário pode reinstalar facilmente

2. **iOS não tem push notifications completas**
   - Limitação do Safari/iOS
   - Implementar em Fase 2 com workarounds

3. **Storage limitado a 50MB no iOS**
   - Implementado cache conservador
   - Prioriza apenas assets essenciais

### **Compatibilidade**

| Platform | Browser | Versão Mínima | Status |
|----------|---------|---------------|--------|
| Android | Chrome | 80+ | ✅ Full |
| Android | Edge | 80+ | ✅ Full |
| Android | Samsung | 12+ | ✅ Full |
| iOS | Safari | 12.2+ | ✅ Parcial* |
| Desktop | Chrome | 80+ | ✅ Full |
| Desktop | Edge | 80+ | ✅ Full |

*iOS tem limitações em push notifications e background sync

---

## 🎉 Conclusão

O PWA do DigiUrban está **100% funcional** e pronto para uso em produção!

**Benefícios imediatos**:
- 📱 App nativo sem custos de desenvolvimento iOS/Android
- ⚡ Carregamento instantâneo (cache)
- 💾 Funciona parcialmente offline
- 🚀 Instalação em 3 cliques
- 📈 Melhor engajamento (+40% em média)

**Próximo passo**: Fazer deploy em produção e monitorar instalações! 🚀
