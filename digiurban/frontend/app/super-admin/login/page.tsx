'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useSuperAdminAuth } from '@/contexts/SuperAdminAuthContext'
import Link from 'next/link'

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, loading, error: contextError } = useSuperAdminAuth()
  const [error, setError] = useState('')
  const router = useRouter()

  // Carregar credenciais salvas ao montar componente
  useEffect(() => {
    const savedEmail = localStorage.getItem('digiurban_superadmin_email')
    const savedRememberMe = localStorage.getItem('digiurban_superadmin_remember') === 'true'

    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      return
    }

    try {
      // Usar a função de login do contexto
      await login(email, password)

      // Salvar ou remover credenciais baseado no checkbox
      if (rememberMe) {
        localStorage.setItem('digiurban_superadmin_email', email)
        localStorage.setItem('digiurban_superadmin_remember', 'true')
      } else {
        localStorage.removeItem('digiurban_superadmin_email')
        localStorage.removeItem('digiurban_superadmin_remember')
      }

      // O contexto já redireciona automaticamente para /super-admin
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#193642] via-[#193642] to-[#0f6fbe] p-4 relative overflow-hidden">
      {/* Decorative elements with darker theme */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#0fffbf] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#a7dbc9] rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl relative z-10 backdrop-blur-sm bg-white/95">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#193642] to-[#0f6fbe] flex items-center justify-center shadow-lg relative">
              <Shield className="h-8 w-8 text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#0fffbf]/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#193642] to-[#0f6fbe] bg-clip-text text-transparent">
              Super Admin
            </CardTitle>
            <CardDescription className="text-base text-gray-600 mt-2">
              Acesso exclusivo à gestão SaaS da plataforma
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {(error || contextError) && (
            <Alert className="mb-4 border-red-200 bg-red-50" variant="destructive">
              <AlertDescription className="text-red-800">{error || contextError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#193642]">
                Email do Super Admin
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#193642]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="superadmin@digiurban.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-[#193642] focus:ring-[#193642]"
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#193642]">
                Senha Mestra
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#193642]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha mestra"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-gray-200 focus:border-[#193642] focus:ring-[#193642]"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#193642]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-superadmin"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={loading}
                className="border-[#193642] data-[state=checked]:bg-[#193642]"
              />
              <label
                htmlFor="remember-superadmin"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-700"
              >
                Lembrar meu email
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#193642] to-[#0f6fbe] hover:from-[#0f2832] hover:to-[#0d5fa0] text-white font-bold py-6 text-base shadow-lg hover:shadow-xl transition-all"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Acessar Painel Super Admin
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-[#193642]/5 rounded-lg border border-[#193642]/20">
            <p className="text-xs text-[#193642] font-semibold mb-2 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Acesso de Alto Privilégio
            </p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li className="flex items-start gap-1">
                <span className="text-[#0fffbf] mt-1">•</span>
                <span>Gerenciamento de todos os tenants (municípios)</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-[#0fffbf] mt-1">•</span>
                <span>Configuração global da plataforma SaaS</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-[#0fffbf] mt-1">•</span>
                <span>Monitoramento de infraestrutura e performance</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-[#0fffbf] mt-1">•</span>
                <span>Controle de billing e assinaturas</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-[#0fffbf] mt-1">•</span>
                <span>Analytics consolidados multi-tenant</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <Link
              href="/landing"
              className="text-sm text-[#0f6fbe] hover:text-[#0fffbf] font-medium hover:underline transition-colors"
            >
              ← Voltar para página inicial
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
