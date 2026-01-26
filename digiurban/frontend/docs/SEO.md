# Documentação de SEO - DigiUrban

## Visão Geral

Esta documentação descreve a implementação de SEO (Search Engine Optimization) na plataforma DigiUrban, seguindo as melhores práticas de 2026 para otimização em mecanismos de busca e crawlers de IA.

## Arquivos de Configuração

### 1. robots.ts
**Localização:** `app/robots.ts`

Arquivo dinâmico que gera o `robots.txt` com regras de crawling para bots de busca.

**Configurações:**
- ✅ **Páginas públicas permitidas:** `/`, `/landing`, `/validar-documento`
- ❌ **Páginas bloqueadas:** `/api/`, `/cidadao/`, `/admin/`, `/super-admin/`, `/offline`
- 🔍 **Googlebot específico:** Configurações otimizadas para Google
- 📸 **Googlebot-Image:** Permite indexação de ícones e logos públicos

**URL gerada:** `https://digiurban.com.br/robots.txt`

### 2. sitemap.ts
**Localização:** `app/sitemap.ts`

Arquivo dinâmico que gera o `sitemap.xml` com todas as URLs públicas indexáveis.

**Páginas incluídas:**
- Landing page (prioridade: 1.0)
- Validar documento (prioridade: 0.8)
- Páginas de login públicas (prioridade: 0.7)

**Propriedades:**
- `lastModified`: Atualizado dinamicamente
- `changeFrequency`: Varia por tipo de página
- `priority`: Indica importância relativa das páginas

**URL gerada:** `https://digiurban.com.br/sitemap.xml`

## Metadados por Página

### Root Layout (app/layout.tsx)
Metadados globais aplicados a toda a aplicação.

**Principais configurações:**
```typescript
{
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL),
  title: {
    default: 'DigiUrban - Sistema de Gestão Municipal Digital',
    template: '%s | DigiUrban'
  },
  description: 'Plataforma completa para gestão municipal...',
  keywords: [/* 15+ palavras-chave relevantes */],
  openGraph: { /* Configurações para redes sociais */ },
  twitter: { /* Twitter Cards */ },
  robots: {
    index: true,
    follow: true,
    googleBot: { /* Configurações específicas */ }
  }
}
```

### Landing Page (app/landing/layout.tsx)
Metadados otimizados para a página de marketing principal.

**Destaques:**
- Descrição expandida com call-to-action
- 15+ palavras-chave focadas em serviços públicos
- Open Graph otimizado para compartilhamento social
- Twitter Card: `summary_large_image`

### Validar Documento (app/validar-documento/layout.tsx)
Metadados para a página pública de validação de documentos.

**Foco:**
- Palavras-chave relacionadas a validação e autenticidade
- SEO para buscas de verificação de documentos
- Canonical URL configurada

### Páginas Protegidas
**Localizações:**
- `app/admin/layout.tsx`
- `app/cidadao/layout.tsx`
- `app/super-admin/layout.tsx`

**Configuração:**
```typescript
robots: {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true
}
```

Essas páginas **NÃO** são indexadas por mecanismos de busca para proteger conteúdo privado.

## Dados Estruturados (Schema.org)

### Localização
`src/components/seo/StructuredData.tsx`

### Componentes Disponíveis

#### 1. OrganizationStructuredData
Schema para identificar a organização governamental.
```typescript
{
  "@type": "GovernmentOrganization",
  name: "DigiUrban",
  url: "https://digiurban.com.br",
  logo: "https://digiurban.com.br/icon-512x512.png"
}
```

#### 2. WebsiteStructuredData
Schema para o website e busca interna.
```typescript
{
  "@type": "WebSite",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://digiurban.com.br/cidadao/servicos?q={search_term_string}"
  }
}
```

#### 3. GovernmentServiceStructuredData
Schemas para cada categoria de serviço público:
- Saúde Pública
- Educação Municipal
- Assistência Social

#### 4. FAQStructuredData
Perguntas frequentes estruturadas para Rich Snippets.

**Benefícios:**
- Aparição em resultados de busca enriquecidos (Rich Snippets)
- Melhor compreensão por crawlers de IA (ChatGPT, Google AI Overview)
- Maior taxa de clique (CTR) nos resultados de busca

### Uso na Landing Page
```tsx
import {
  OrganizationStructuredData,
  WebsiteStructuredData,
  GovernmentServiceStructuredData,
  FAQStructuredData,
} from '@/components/seo/StructuredData'

export default function LandingPage() {
  return (
    <main>
      <OrganizationStructuredData />
      <WebsiteStructuredData />
      <GovernmentServiceStructuredData />
      <FAQStructuredData />
      {/* resto do conteúdo */}
    </main>
  )
}
```

## Página 404 Customizada

**Localização:** `app/not-found.tsx`

**Características:**
- Design consistente com a identidade visual
- Links úteis para recuperação do usuário
- Metadata com `index: false` para não indexar páginas de erro
- Chamadas para ação para páginas principais

## Variáveis de Ambiente

### NEXT_PUBLIC_BASE_URL
**Obrigatório para produção**

Define a URL base da aplicação para geração correta de:
- Canonical URLs
- Open Graph URLs
- Sitemap
- Robots.txt

**Exemplo:**
```env
NEXT_PUBLIC_BASE_URL=https://digiurban.com.br
```

### NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
**Opcional - Para Google Search Console**

Código de verificação do Google para validar propriedade do site.

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=abc123xyz
```

## Checklist de SEO

### ✅ Implementado
- [x] robots.txt dinâmico
- [x] sitemap.xml dinâmico
- [x] Metadados globais otimizados
- [x] Metadados específicos por página (landing, validar-documento)
- [x] Schema.org JSON-LD (Organization, Website, GovernmentService, FAQ)
- [x] Open Graph tags (Facebook, LinkedIn)
- [x] Twitter Cards
- [x] Canonical URLs
- [x] Página 404 customizada
- [x] noindex em páginas protegidas
- [x] Keywords otimizadas
- [x] Descrições SEO-friendly

### 📋 Boas Práticas Seguidas

#### 1. Estrutura de Títulos
- Título global com template pattern
- Títulos específicos por página
- Máximo 60 caracteres para títulos

#### 2. Descrições
- Descrições entre 150-160 caracteres
- Call-to-action incluída
- Palavras-chave naturalmente integradas

#### 3. URLs Amigáveis
- URLs descritivas e semânticas
- Sem parâmetros desnecessários em páginas públicas
- Canonical URLs para evitar conteúdo duplicado

#### 4. Imagens
- Alt text em todas as imagens importantes
- Formato PNG/WebP otimizado
- Múltiplos tamanhos (192x192, 512x512)
- Open Graph images configuradas

#### 5. Mobile-First
- Viewport configurado
- Design responsivo
- PWA implementado

#### 6. Performance
- Core Web Vitals otimizados via PWA
- Caching estratégico (Workbox)
- Lazy loading de imagens

## Monitoramento e Ferramentas

### Ferramentas Recomendadas

1. **Google Search Console**
   - Monitorar indexação
   - Verificar erros de crawling
   - Analisar performance de busca

2. **Google Analytics 4**
   - Tráfego orgânico
   - Comportamento do usuário
   - Conversões

3. **Schema Markup Validator**
   - URL: https://validator.schema.org/
   - Validar JSON-LD implementado

4. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Testar Rich Snippets

5. **PageSpeed Insights**
   - URL: https://pagespeed.web.dev/
   - Medir Core Web Vitals

### Comandos Úteis

```bash
# Testar robots.txt localmente
curl http://localhost:3000/robots.txt

# Testar sitemap.xml localmente
curl http://localhost:3000/sitemap.xml

# Build de produção
npm run build

# Testar build localmente
npm start
```

## Otimizações Futuras

### Curto Prazo
- [ ] Adicionar breadcrumbs com schema markup em páginas internas
- [ ] Implementar imagens Open Graph customizadas por página
- [ ] Adicionar hreflang para suporte multi-idioma (se necessário)

### Médio Prazo
- [ ] Implementar AMP (Accelerated Mobile Pages) para landing page
- [ ] Adicionar vídeos com schema markup VideoObject
- [ ] Implementar FAQ schema em páginas de serviços específicos

### Longo Prazo
- [ ] Implementar Event schema para eventos municipais
- [ ] Adicionar LocalBusiness schema para secretarias
- [ ] Criar blog com Article schema markup

## Referências

### Documentação Oficial
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js Robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Schema.org](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)

### Guias de Boas Práticas 2026
- [Technical SEO Checklist 2026](https://customdigitalsolutions.co/technical-seo-checklist/)
- [Next.js SEO Best Practices](https://medium.com/@alokkumar41558/next-js-seo-best-practices-guide-027325bf9339)
- [Complete Next.js SEO Guide](https://www.adeelhere.com/blog/2025-12-09-complete-nextjs-seo-guide-from-zero-to-hero)

---

**Última atualização:** Janeiro 2026
**Responsável:** Equipe de Desenvolvimento DigiUrban
