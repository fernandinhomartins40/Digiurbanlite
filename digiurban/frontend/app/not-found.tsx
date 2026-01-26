import type { Metadata } from 'next'
import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Página não encontrada - DigiUrban',
  description: 'A página que você está procurando não foi encontrada. Retorne à página inicial ou use a busca para encontrar o que precisa.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f6fbe] via-[#0f6fbe] to-[#193642] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl sm:text-[12rem] font-bold text-white/20 leading-none select-none">
            404
          </h1>
          <div className="relative -mt-16 sm:-mt-20">
            <div className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/20">
              <Search className="w-12 h-12 sm:w-16 sm:h-16 text-white/60" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Página não encontrada
          </h2>
          <p className="text-lg sm:text-xl text-white/80 max-w-lg mx-auto leading-relaxed">
            Ops! Parece que a página que você está procurando não existe ou foi movida.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/landing"
            className="inline-flex items-center justify-center gap-2 bg-[#0fffbf] hover:bg-[#0de6a9] text-[#193642] px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto"
          >
            <Home className="w-5 h-5" />
            Voltar à Página Inicial
          </Link>
          <Link
            href="/cidadao/login"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold backdrop-blur-sm transition-all w-full sm:w-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Portal do Cidadão
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-white/60 text-sm mb-4">Você também pode tentar:</p>
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/validar-documento" className="text-white/80 hover:text-white transition-colors">
              Validar Documento
            </Link>
            <span className="text-white/40">•</span>
            <Link href="/cidadao/servicos" className="text-white/80 hover:text-white transition-colors">
              Serviços Disponíveis
            </Link>
            <span className="text-white/40">•</span>
            <Link href="/cidadao/protocolos" className="text-white/80 hover:text-white transition-colors">
              Acompanhar Protocolos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
