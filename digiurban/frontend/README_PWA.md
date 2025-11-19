# 📱 PWA DigiUrban - Quick Start

## ✅ PWA Implementado e Funcional!

O DigiUrban agora pode ser instalado como um app nativo em celulares iOS e Android.

---

## 🚀 Como Usar (Desenvolvimento)

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (PWA desabilitado)
npm run dev

# Build de produção (PWA ativado)
npm run build

# Rodar produção localmente
npm start
```

---

## 📱 Como Instalar no Celular

### Android (Chrome)

1. Acesse o site
2. Clique no banner "Instalar App"
3. Confirme
4. ✅ Pronto! Ícone na tela inicial

### iPhone (Safari)

1. Acesse pelo Safari
2. Toque em **Compartilhar** (seta para cima)
3. Role e toque em **"Adicionar à Tela de Início"**
4. Toque em **"Adicionar"**
5. ✅ Pronto! Ícone na tela inicial

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `/public/manifest.json` | Configuração PWA |
| `/public/icon.svg` | Ícone do app |
| `/next.config.js` | Config do Service Worker |
| `/components/citizen/InstallPWABanner.tsx` | Banner de instalação |
| `/app/offline/page.tsx` | Página offline |

---

## 🔧 Configurações

### Trocar Cor do Tema

**`/public/manifest.json`:**
```json
"theme_color": "#0f6fbe"  // Sua cor aqui
```

**`/app/layout.tsx`:**
```typescript
themeColor: '#0f6fbe'  // Mesma cor
```

### Trocar Ícone

Edite `/public/icon.svg` e faça rebuild.

---

## 🧪 Testar PWA

### Lighthouse (Chrome)

1. F12 > Lighthouse tab
2. Selecione "Progressive Web App"
3. Clique em "Analyze"
4. **Esperado**: 90+ pontos

### Verificar Service Worker

1. F12 > Application tab
2. Service Workers > deve estar "activated"
3. Manifest > deve mostrar ícones e config

---

## 📖 Documentação Completa

- **Guia Completo**: `PWA_GUIDE.md`
- **Implementação**: `/IMPLEMENTACAO_PWA_COMPLETA.md`
- **Proposta Original**: `/PROPOSTA_PWA_DIGIURBAN.md`

---

## ⚠️ Importante

- ✅ **PWA só funciona em produção** (não em `npm run dev`)
- ✅ **Requer HTTPS** para funcionar (exceto localhost)
- ✅ **Arquivos gerados estão no .gitignore** (sw.js, workbox-*, icon-*.png)

---

## 🐛 Problemas?

### Banner não aparece
```bash
# Fazer build de produção
npm run build
npm start
```

### Service Worker não registra
- Verifique se está em HTTPS
- Limpe cache (Ctrl+Shift+Del)
- Verifique console por erros

### Ícones não aparecem
```bash
# Rebuild para gerar ícones
npm run build
```

---

## 🚀 Deploy

O PWA funciona em qualquer hosting com HTTPS:
- ✅ Vercel
- ✅ Netlify
- ✅ AWS
- ✅ VPS com Nginx/Apache + SSL

Basta fazer deploy normal do Next.js!

---

**Status**: ✅ Production Ready
**Build**: ✅ Testado e funcionando
**Docs**: ✅ Completas

Pronto para usar! 🎉
