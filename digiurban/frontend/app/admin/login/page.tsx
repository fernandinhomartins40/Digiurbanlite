'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Building2, Lock, Eye, EyeOff, Mail, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, loading, error } = useAdminAuth()

  // Carregar credenciais salvas ao montar componente
  useEffect(() => {
    const savedEmail = localStorage.getItem('digiurban_admin_email')
    const savedRememberMe = localStorage.getItem('digiurban_admin_remember') === 'true'

    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail)
      setRememberMe(true)
    }

    // Limpar apenas o token ao carregar página de login
    localStorage.removeItem('digiurban_admin_token')
    localStorage.removeItem('digiurban_dev_tenant_id')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      return
    }

    try {
      await login(email, password)

      // Salvar ou remover credenciais baseado no checkbox
      if (rememberMe) {
        localStorage.setItem('digiurban_admin_email', email)
        localStorage.setItem('digiurban_admin_remember', 'true')
      } else {
        localStorage.removeItem('digiurban_admin_email')
        localStorage.removeItem('digiurban_admin_remember')
      }

      // O tenant ID será automaticamente armazenado pelo AdminAuthContext
    } catch (err) {
      // Erro já está sendo tratado no contexto
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f6fbe] via-[#0f6fbe] to-[#193642] p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#0fffbf] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#a7dbc9] rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl relative z-10 backdrop-blur-sm bg-white/95">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f6fbe] to-[#193642] flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-[#193642]">Portal Administrativo</CardTitle>
            <CardDescription className="text-base text-gray-600 mt-2">
              Acesse o sistema de gestão municipal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50" variant="destructive">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#193642]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@prefeitura.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#193642]">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0f6fbe]"
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
                id="remember-admin"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={loading}
                className="border-[#0f6fbe] data-[state=checked]:bg-[#0f6fbe]"
              />
              <label
                htmlFor="remember-admin"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-700"
              >
                Lembrar meu email
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0f6fbe] hover:bg-[#0d5fa0] text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-[#a7dbc9]/10 rounded-lg border border-[#a7dbc9]/30">
            <p className="text-xs text-[#193642] font-semibold mb-2 flex items-center">
              <Shield className="h-3 w-3 mr-1 text-[#0f6fbe]" />
              Níveis de Acesso:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
              <div>
                <span className="font-medium text-[#193642]">Funcionário:</span> Protocolos do setor
              </div>
              <div>
                <span className="font-medium text-[#193642]">Coordenador:</span> Supervisão de equipe
              </div>
              <div>
                <span className="font-medium text-[#193642]">Secretário:</span> Gestão setorial
              </div>
              <div>
                <span className="font-medium text-[#193642]">Prefeito:</span> Visão municipal
              </div>
            </div>
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
