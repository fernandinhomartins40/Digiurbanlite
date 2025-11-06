'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, User, Lock, Eye, EyeOff } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Portal Administrativo</CardTitle>
          <CardDescription className="text-center">
            Acesse o sistema de gestão municipal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@prefeitura.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
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
                id="remember-admin"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={loading}
              />
              <label
                htmlFor="remember-admin"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Lembrar meu email
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Níveis de Acesso:</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div className="text-left">
                <span className="font-medium">Funcionário:</span> Protocolos do setor
              </div>
              <div className="text-left">
                <span className="font-medium">Coordenador:</span> Supervisão de equipe
              </div>
              <div className="text-left">
                <span className="font-medium">Secretário:</span> Gestão setorial
              </div>
              <div className="text-left">
                <span className="font-medium">Prefeito:</span> Visão municipal
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}