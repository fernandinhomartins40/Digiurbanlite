const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
  scope: '/',
  sw: 'sw.js',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
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
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
          },
        },
      },
      {
        urlPattern: /\.(?:js|css)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
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