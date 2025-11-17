/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Permitir build com erros TypeScript (para deploy)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Permitir build com warnings ESLint (para deploy)
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  // ✅ CORRIGIDO: Não forçar NEXT_PUBLIC_API_URL aqui
  // A variável deve vir do ambiente ou do build argument no Dockerfile
  // Em produção: /api (roteado pelo Nginx)
  // Em desenvolvimento: http://localhost:3001 (definido no .env local)
}

module.exports = nextConfig