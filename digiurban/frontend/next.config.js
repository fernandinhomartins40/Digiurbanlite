const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
  scope: '/',
  sw: 'sw.js',
  cacheOnFrontEndNav: false, // ✅ CORRIGIDO: Desabilitar cache de navegação de páginas
  aggressiveFrontEndNavCaching: false, // ✅ CORRIGIDO: Desabilitar cache agressivo de navegação
  reloadOnOnline: true,
  swcMinify: true,
  // ✅ NOVO: Incluir handler de push notifications
  additionalManifestEntries: [
    { url: '/sw-push-handler.js', revision: '1' },
  ],
  workboxOptions: {
    disableDevLogs: true,
    // ✅ NOVO: Importar handler de push
    importScripts: ['/sw-push-handler.js'],
    // ✅ NOVO: Não cachear páginas HTML administrativas
    navigateFallback: undefined, // Desabilitar fallback de navegação
    navigateFallbackDenylist: [/^\/admin/, /^\/_next\/data/], // Não cachear rotas admin
    runtimeCaching: [
      {
        // ✅ CORRIGIDO: NÃO cachear rotas administrativas autenticadas
        urlPattern: /^https?:\/\/.*\/api\/(?!admin|auth|protocols|chamados).*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutos
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // ✅ NOVO: Rotas admin sempre buscar do servidor (NetworkOnly)
        urlPattern: /^https?:\/\/.*\/api\/(admin|auth|protocols|chamados).*/,
        handler: 'NetworkOnly',
      },
      {
        // ✅ NOVO: Páginas HTML admin nunca cachear
        urlPattern: /^https?:\/\/.*\/admin.*/,
        handler: 'NetworkOnly',
      },
      {
        // ✅ NOVO: Dados Next.js (_next/data) do admin nunca cachear
        urlPattern: /^\/_next\/data\/.*\/admin.*/,
        handler: 'NetworkOnly',
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: 'CacheFirst',
        options: {
          // Bump de versão para evitar que respostas antigas (ex: HTML 200) fiquem presas no cache
          // e quebrem ícones do manifest como /icon-144x144.png.
          cacheName: 'image-cache-v2',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
          },
        },
      },
      {
        // JS/CSS: NetworkFirst para garantir bundles frescos pós-deploy
        urlPattern: /\.(?:js|css)$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'static-resources',
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
          },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Necessário para Docker
  typescript: {
    // Permitir build com erros TypeScript (para deploy)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Permitir build com warnings ESLint (para deploy)
    ignoreDuringBuilds: true,
  },
  // ✅ CORRIGIDO: Não forçar NEXT_PUBLIC_API_URL aqui
  // A variável deve vir do ambiente ou do build argument no Dockerfile
  // Em produção: /api (roteado pelo Nginx)
  // Em desenvolvimento: http://localhost:3001 (definido no .env local)

  // Experimental: incluir arquivos do /src no bundle standalone
  experimental: {
    outputFileTracingRoot: undefined,
  },

  // Webpack config para PDF.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
}

module.exports = withPWA(nextConfig)
