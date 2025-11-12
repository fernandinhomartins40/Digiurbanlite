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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md border-2 border-purple-200 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-full p-4 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-extrabold">
            Super Admin
          </CardTitle>
          <CardDescription className="text-center text-base">
            Acesso exclusivo à gestão SaaS da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(error || contextError) && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error || contextError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email do Super Admin
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="superadmin@digiurban.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha Mestra
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha mestra"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
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

          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-900 font-semibold mb-2 flex items-center">
              <Shield className="h-3 w-3 mr-1" />
              Acesso de Alto Privilégio
            </p>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• Gerenciamento de todos os tenants (municípios)</li>
              <li>• Configuração global da plataforma SaaS</li>
              <li>• Monitoramento de infraestrutura e performance</li>
              <li>• Controle de billing e assinaturas</li>
              <li>• Analytics consolidados multi-tenant</li>
            </ul>
          </div>

          <div className="mt-4 text-center">
            <a
              href="/landing"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium hover:underline"
            >
              ← Voltar para página inicial
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
