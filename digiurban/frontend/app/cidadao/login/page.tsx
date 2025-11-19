'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCitizenAuth } from '@/contexts/CitizenAuthContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { LogIn, UserPlus, AlertCircle, Users, CheckCircle, MapPin, Eye, EyeOff, Building2, Lock, Mail, Phone, User, IdCard } from 'lucide-react'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator'
import { InstallPWABanner } from '@/components/citizen/InstallPWABanner'
import Link from 'next/link'

interface Municipio {
  codigo_ibge?: string
  nome: string
  uf: string
  regiao?: string
  populacao?: number
  id?: string
  name?: string
  domain?: string
  hasTenant?: boolean
}

export default function CitizenLoginPage() {
  const router = useRouter()
  const { login, register, isLoading } = useCitizenAuth()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)

  const [loginData, setLoginData] = useState({
    cpf: '',
    password: '',
  })

  const [rememberMe, setRememberMe] = useState(false)

  const [registerData, setRegisterData] = useState({
    cpf: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    municipio: '',
  })

  // Estado para o município configurado (Single Tenant)
  const [municipioConfig, setMunicipioConfig] = useState<{
    nomeMunicipio: string
    ufMunicipio: string
    codigoIbge: string | null
  } | null>(null)
  const [loadingMunicipioConfig, setLoadingMunicipioConfig] = useState(true)

  // Buscar configuração do município (Single Tenant)
  useEffect(() => {
    const fetchMunicipioConfig = async () => {
      setLoadingMunicipioConfig(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const url = `${apiUrl}/public/municipio-config`

        console.log('🔍 Buscando configuração do município:', url)

        const response = await fetch(url)
        const data = await response.json()

        console.log('📊 Configuração do município:', data)

        if (data.success && data.config) {
          setMunicipioConfig({
            nomeMunicipio: data.config.nomeMunicipio,
            ufMunicipio: data.config.ufMunicipio,
            codigoIbge: data.config.codigoIbge || null
          })
          console.log('✅ Município configurado:', data.config.nomeMunicipio)
        } else {
          console.error('❌ Erro na resposta:', data)
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível carregar a configuração do município',
          })
        }
      } catch (error) {
        console.error('❌ Erro ao buscar configuração do município:', error)
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível conectar ao servidor',
        })
      } finally {
        setLoadingMunicipioConfig(false)
      }
    }

    fetchMunicipioConfig()
  }, [])

  // Carregar credenciais salvas ao montar componente
  useEffect(() => {
    const savedCpf = localStorage.getItem('digiurban_citizen_cpf')
    const savedRememberMe = localStorage.getItem('digiurban_citizen_remember') === 'true'

    if (savedCpf && savedRememberMe) {
      setLoginData({ ...loginData, cpf: formatCPF(savedCpf) })
      setRememberMe(true)
    }
  }, [])

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return value
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cpfNumbers = loginData.cpf.replace(/\D/g, '')
    if (cpfNumbers.length !== 11) {
      setError('CPF inválido')
      return
    }

    if (!loginData.password) {
      setError('Digite sua senha')
      return
    }

    try {
      const loginSuccess = await login(cpfNumbers, loginData.password)

      if (loginSuccess) {
        // Salvar ou remover credenciais baseado no checkbox
        if (rememberMe) {
          localStorage.setItem('digiurban_citizen_cpf', cpfNumbers)
          localStorage.setItem('digiurban_citizen_remember', 'true')
        } else {
          localStorage.removeItem('digiurban_citizen_cpf')
          localStorage.removeItem('digiurban_citizen_remember')
        }

        toast({
          title: 'Login realizado com sucesso!',
          description: 'Redirecionando para o portal...',
        })
        router.push('/cidadao')
      } else {
        const errorMsg = 'CPF ou senha incorretos'
        setError(errorMsg)
        toast({
          variant: 'destructive',
          title: 'Erro no login',
          description: errorMsg,
        })
      }
    } catch (err) {
      const errorMsg = 'Erro ao fazer login. Tente novamente.'
      setError(errorMsg)
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: errorMsg,
      })
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    const cpfNumbers = registerData.cpf.replace(/\D/g, '')
    if (cpfNumbers.length !== 11) {
      setError('CPF inválido')
      return
    }

    if (!registerData.name || !registerData.email) {
      setError('Preencha todos os campos obrigatórios')
      return
    }

    if (!municipioConfig) {
      setError('Configuração do município não disponível. Tente novamente.')
      return
    }

    // Validação de senha forte
    const passwordRequirements = [
      registerData.password.length >= 8,
      /[A-Z]/.test(registerData.password),
      /[a-z]/.test(registerData.password),
      /\d/.test(registerData.password),
      /[!@#$%^&*(),.?":{}|<>]/.test(registerData.password),
    ]

    if (!passwordRequirements.every(req => req)) {
      setError('A senha não atende aos requisitos de segurança')
      return
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('As senhas não conferem')
      return
    }

    try {
      const payload: any = {
        cpf: cpfNumbers,
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
        // Dados do município configurado (Single Tenant)
        nomeMunicipio: municipioConfig.nomeMunicipio,
        ufMunicipio: municipioConfig.ufMunicipio,
      }

      // Adicionar código IBGE se disponível
      if (municipioConfig.codigoIbge) {
        payload.codigoIbge = municipioConfig.codigoIbge
      }

      const registerSuccess = await register(payload)

      if (registerSuccess) {
        setSuccess(true)
        toast({
          title: 'Cadastro criado com sucesso!',
          description: 'Bem-vindo ao Portal do Cidadão. Redirecionando...',
        })
        setTimeout(() => {
          router.push('/cidadao')
        }, 2000)
      } else {
        const errorMsg = 'Erro ao criar cadastro. Verifique se o CPF já não está cadastrado.'
        setError(errorMsg)
        toast({
          variant: 'destructive',
          title: 'Erro no cadastro',
          description: errorMsg,
        })
      }
    } catch (err) {
      const errorMsg = 'Erro ao criar cadastro. Tente novamente.'
      setError(errorMsg)
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: errorMsg,
      })
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f6fbe] via-[#0f6fbe] to-[#193642] p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#0fffbf] to-[#a7dbc9] flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-[#193642]" />
              </div>
              <h2 className="text-2xl font-bold text-[#193642]">Cadastro Realizado!</h2>
              <p className="text-gray-600">
                Seu cadastro foi criado com sucesso. Você será redirecionado para o portal.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f6fbe] via-[#0f6fbe] to-[#193642] p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#0fffbf] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#a7dbc9] rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md border-0 shadow-2xl relative z-10 backdrop-blur-sm bg-white/95">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f6fbe] to-[#0fffbf] flex items-center justify-center shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-[#193642]">Portal do Cidadão</CardTitle>
            <CardDescription className="text-base text-gray-600 mt-2">
              Acesse ou crie sua conta para utilizar os serviços municipais
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-[#0f6fbe] data-[state=active]:text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="data-[state=active]:bg-[#0f6fbe] data-[state=active]:text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-cpf" className="text-[#193642] font-medium">CPF</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                    <Input
                      id="login-cpf"
                      placeholder="000.000.000-00"
                      value={loginData.cpf}
                      onChange={(e) => setLoginData({ ...loginData, cpf: formatCPF(e.target.value) })}
                      maxLength={14}
                      required
                      autoFocus
                      className="pl-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Digite seu CPF cadastrado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[#193642] font-medium">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="pl-10 pr-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0f6fbe]"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-[#0f6fbe] data-[state=checked]:bg-[#0f6fbe]"
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-700"
                  >
                    Lembrar meu CPF
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#0fffbf] hover:bg-[#0de6a9] text-[#193642] font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="bg-[#a7dbc9]/20 border border-[#a7dbc9] rounded-lg p-3 flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-[#0f6fbe] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#193642]">
                    <p className="font-medium mb-1">Selecione seu município</p>
                    <p className="text-gray-700">
                      Caso seu município ainda não utilize o DigiUrban, ele será cadastrado automaticamente após seu registro.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="register-cpf" className="text-[#193642] font-medium">CPF *</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                    <Input
                      id="register-cpf"
                      placeholder="000.000.000-00"
                      value={registerData.cpf}
                      onChange={(e) => setRegisterData({ ...registerData, cpf: formatCPF(e.target.value) })}
                      maxLength={14}
                      required
                      className="pl-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-[#193642] font-medium">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                    <Input
                      id="register-name"
                      placeholder="Seu nome completo"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="pl-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-[#193642] font-medium">E-mail *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="pl-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="text-[#193642] font-medium">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                    <Input
                      id="register-phone"
                      placeholder="(00) 00000-0000"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="pl-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-municipio" className="text-[#193642] font-medium">Município</Label>
                  {loadingMunicipioConfig ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="animate-spin h-4 w-4 border-2 border-[#0f6fbe] border-t-transparent rounded-full" />
                      <span className="text-sm text-gray-600">Carregando município...</span>
                    </div>
                  ) : municipioConfig ? (
                    <div className="flex items-center gap-3 p-3 bg-[#a7dbc9]/20 border border-[#a7dbc9] rounded-lg">
                      <MapPin className="h-5 w-5 text-[#0f6fbe] flex-shrink-0" />
                      <div className="text-sm">
                        <span className="font-semibold text-[#193642]">
                          {municipioConfig.nomeMunicipio} - {municipioConfig.ufMunicipio}
                        </span>
                        <p className="text-xs text-gray-700 mt-0.5">
                          Sistema exclusivo para cidadãos deste município
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-sm text-red-700">
                        Não foi possível carregar o município
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-[#193642] font-medium">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      className="pl-10 pr-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0f6fbe]"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm" className="text-[#193642] font-medium">Confirmar Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[#0f6fbe]" />
                    <Input
                      id="register-confirm"
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      className="pl-10 pr-10 border-gray-200 focus:border-[#0f6fbe] focus:ring-[#0f6fbe]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0f6fbe]"
                    >
                      {showRegisterConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Indicador de força de senha */}
                {registerData.password && (
                  <PasswordStrengthIndicator
                    password={registerData.password}
                    confirmPassword={registerData.confirmPassword}
                    showConfirmation={true}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#0fffbf] hover:bg-[#0de6a9] text-[#193642] font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando cadastro...' : 'Criar Cadastro'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

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

      {/* Banner PWA */}
      <InstallPWABanner />
    </div>
  )
}
