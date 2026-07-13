'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCitizenAuth } from '@/contexts/CitizenAuthContext'
import { useTenant } from '@/components/providers/TenantProvider'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  LogIn, UserPlus, AlertCircle, CheckCircle, MapPin, Eye, EyeOff, Lock, Mail,
  Phone, User, IdCard, ShieldCheck, Clock, MessageSquare, FileText, ArrowRight,
} from 'lucide-react'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator'
import { InstallPWABanner } from '@/components/citizen/InstallPWABanner'
import Link from 'next/link'

export default function CitizenLoginPage() {
  const router = useRouter()
  const { login, register, isLoading } = useCitizenAuth()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

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

  // ============================================================================
  // Multi-tenant / branding do município
  // ----------------------------------------------------------------------------
  // O visual desta página segue a IDENTIDADE VISUAL do município (cores + logo)
  // resolvidas pelo host via TenantProvider. As cores são configuráveis no painel
  // super-admin e refletem aqui em runtime — nada é hardcoded ao DigiUrban.
  // - Host identifica um município (ex.: cidade.digiurban.com.br) → sem seletor.
  // - Domínio raiz (slug 'default') → cidadão escolhe o município num seletor.
  // ============================================================================
  const { config: tenantConfig } = useTenant()
  const hostResolvedTenant = tenantConfig.slug !== 'default'

  const primary = tenantConfig.branding?.corPrimaria || '#2563eb'
  const secondary = tenantConfig.branding?.corSecundaria || '#f59e0b'
  const logo = tenantConfig.branding?.logoUrl || null
  const municipioNome = tenantConfig.nomeMunicipio || tenantConfig.nome

  type Municipio = { slug: string; nomeMunicipio: string; ufMunicipio: string; codigoIbge: string | null }
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [loadingMunicipios, setLoadingMunicipios] = useState(!hostResolvedTenant)

  // Buscar lista de municípios (apenas quando o host NÃO define um específico)
  useEffect(() => {
    if (hostResolvedTenant) return
    ;(async () => {
      setLoadingMunicipios(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
        const res = await fetch(`${apiUrl}/public/municipios`)
        const data = await res.json()
        if (data.success) {
          setMunicipios(data.municipios)
          // restaurar seleção anterior do cookie
          const cookieSlug = document.cookie
            .split('; ')
            .find((c) => c.startsWith('digiurban_tenant_slug='))
            ?.split('=')[1]
          if (cookieSlug && data.municipios.some((m: Municipio) => m.slug === cookieSlug)) {
            setSelectedSlug(cookieSlug)
          }
        }
      } catch {
        // silencioso: sem lista, o cidadão vê estado vazio
      } finally {
        setLoadingMunicipios(false)
      }
    })()
  }, [hostResolvedTenant])

  // Município efetivo: o do host (se específico) ou o selecionado
  const selectedMunicipio = municipios.find((m) => m.slug === selectedSlug)
  const municipioConfig = hostResolvedTenant
    ? {
        nomeMunicipio: tenantConfig.nomeMunicipio,
        ufMunicipio: tenantConfig.ufMunicipio,
        codigoIbge: tenantConfig.codigoIbge ?? null,
      }
    : selectedMunicipio
    ? {
        nomeMunicipio: selectedMunicipio.nomeMunicipio,
        ufMunicipio: selectedMunicipio.ufMunicipio,
        codigoIbge: selectedMunicipio.codigoIbge,
      }
    : null
  const loadingMunicipioConfig = loadingMunicipios

  // Grava a seleção em cookie (o backend lê digiurban_tenant_slug ou X-Tenant-Slug)
  const handleSelectMunicipio = (slug: string) => {
    setSelectedSlug(slug)
    // cookie de sessão, escopo raiz; enviado automaticamente e via header no auth
    document.cookie = `digiurban_tenant_slug=${slug}; path=/; SameSite=Lax`
  }

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

    // No domínio raiz é obrigatório escolher o município antes de entrar
    if (!hostResolvedTenant && !selectedSlug) {
      setError('Selecione o seu município para continuar')
      return
    }

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

  // Estilos derivados do branding do município (usados em vários pontos)
  const inputFocus = { '--tw-ring-color': primary } as React.CSSProperties
  const primaryBtn: React.CSSProperties = { background: `linear-gradient(135deg, ${primary}, ${secondary})` }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
      >
        <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-8">
          <div className="text-center space-y-4">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ background: `${primary}14`, color: primary }}
            >
              <CheckCircle className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Cadastro realizado!</h2>
            <p className="text-gray-600">
              Seu cadastro foi criado com sucesso. Você será redirecionado para o portal.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Seletor/indicador de município reutilizado nas abas de login e registro
  const municipioSelector = (
    <div className="space-y-2">
      <Label className="text-gray-700 font-medium">Município</Label>
      {loadingMunicipioConfig ? (
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div
            className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full"
            style={{ borderColor: primary, borderTopColor: 'transparent' }}
          />
          <span className="text-sm text-gray-600">Carregando municípios...</span>
        </div>
      ) : hostResolvedTenant && municipioConfig ? (
        <div
          className="flex items-center gap-3 p-3 rounded-xl border"
          style={{ background: `${primary}0f`, borderColor: `${primary}33` }}
        >
          <MapPin className="h-5 w-5 flex-shrink-0" style={{ color: primary }} />
          <div className="text-sm">
            <span className="font-semibold text-gray-900">
              {municipioConfig.nomeMunicipio} - {municipioConfig.ufMunicipio}
            </span>
            <p className="text-xs text-gray-600 mt-0.5">Sistema exclusivo para cidadãos deste município</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" style={{ color: primary }} />
            <select
              value={selectedSlug}
              onChange={(e) => handleSelectMunicipio(e.target.value)}
              className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2"
              style={inputFocus}
            >
              <option value="">Selecione o seu município...</option>
              {municipios.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.nomeMunicipio} - {m.ufMunicipio}
                </option>
              ))}
            </select>
          </div>
          {municipios.length === 0 && (
            <p className="text-xs text-red-600">Nenhum município disponível no momento.</p>
          )}
        </div>
      )}
    </div>
  )

  const destaques = [
    { icon: FileText, title: 'Solicite serviços', desc: 'Abra pedidos e protocolos sem sair de casa.' },
    { icon: Clock, title: 'Acompanhe em tempo real', desc: 'Veja o status de cada solicitação.' },
    { icon: MessageSquare, title: 'Atendimento digital', desc: 'Fale com a prefeitura pelo chat e assistente.' },
    { icon: ShieldCheck, title: 'Seguro e privado', desc: 'Seus dados protegidos conforme a LGPD.' },
  ]

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-gray-50">
      {/* ===================================================================== */}
      {/* PAINEL ESQUERDO — identidade visual do município (oculto no mobile) */}
      {/* ===================================================================== */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${primary}, ${secondary})` }}
      >
        {/* elementos decorativos */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-black/20 blur-3xl" />
        </div>

        {/* topo: logo + nome */}
        <div className="relative z-10 flex items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={tenantConfig.nome} className="h-12 w-auto rounded-lg bg-white/90 p-1.5" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold">
              {municipioNome.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold leading-tight">{tenantConfig.nome}</div>
            <div className="text-xs text-white/70">
              {tenantConfig.nomeMunicipio}{tenantConfig.ufMunicipio ? `/${tenantConfig.ufMunicipio}` : ''}
            </div>
          </div>
        </div>

        {/* meio: título + destaques */}
        <div className="relative z-10 max-w-md">
          <span className="inline-block rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium mb-5">
            Portal do Cidadão
          </span>
          <h2 className="text-4xl font-bold leading-tight">
            Bem-vindo ao portal digital de {municipioNome}
          </h2>
          <p className="mt-4 text-white/80 text-lg">
            Resolva sua vida com a prefeitura sem filas — tudo online, seguro e disponível 24h.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4">
            {destaques.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.title} className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{d.title}</div>
                    <div className="text-sm text-white/70">{d.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* rodapé do painel */}
        <div className="relative z-10 text-xs text-white/60">
          {tenantConfig.nome} — Governo Digital
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* PAINEL DIREITO — formulário                                          */}
      {/* ===================================================================== */}
      <main className="flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* cabeçalho compacto (visível principalmente no mobile) */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-3 lg:hidden mb-4">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={tenantConfig.nome} className="h-11 w-auto" />
              ) : (
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: primary }}
                >
                  {municipioNome.charAt(0)}
                </div>
              )}
              <div className="text-left">
                <div className="font-bold text-gray-900 leading-tight">{tenantConfig.nome}</div>
                <div className="text-xs text-gray-500">
                  {tenantConfig.nomeMunicipio}{tenantConfig.ufMunicipio ? `/${tenantConfig.ufMunicipio}` : ''}
                </div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Acesse sua conta</h1>
            <p className="text-gray-500 mt-1.5">
              Entre ou cadastre-se para usar os serviços de {municipioNome}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl h-auto">
              <TabsTrigger
                value="login"
                className="rounded-lg py-2.5 transition-colors data-[state=active]:shadow-sm"
                style={activeTab === 'login' ? { background: primary, color: '#fff' } : undefined}
              >
                <span className="flex items-center justify-center gap-2 w-full">
                  <LogIn className="h-4 w-4" /> Entrar
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg py-2.5 transition-colors data-[state=active]:shadow-sm"
                style={activeTab === 'register' ? { background: primary, color: '#fff' } : undefined}
              >
                <span className="flex items-center justify-center gap-2 w-full">
                  <UserPlus className="h-4 w-4" /> Cadastrar
                </span>
              </TabsTrigger>
            </TabsList>

            {/* ---------------------------------------------------------------- */}
            {/* LOGIN                                                            */}
            {/* ---------------------------------------------------------------- */}
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {municipioSelector}

                <div className="space-y-2">
                  <Label htmlFor="login-cpf" className="text-gray-700 font-medium">CPF</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                    <Input
                      id="login-cpf"
                      placeholder="000.000.000-00"
                      value={loginData.cpf}
                      onChange={(e) => setLoginData({ ...loginData, cpf: formatCPF(e.target.value) })}
                      maxLength={14}
                      required
                      autoFocus
                      className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                      style={inputFocus}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Digite seu CPF cadastrado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-700 font-medium">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                      style={inputFocus}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      style={{ ['--tw-ring-color' as any]: primary }}
                    />
                    <label
                      htmlFor="remember-me"
                      className="text-sm font-medium leading-none cursor-pointer text-gray-700"
                    >
                      Lembrar meu CPF
                    </label>
                  </div>

                  <Link
                    href="/cidadao/forgot-password"
                    className="text-sm font-medium hover:underline"
                    style={{ color: primary }}
                  >
                    Esqueci minha senha
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-white font-semibold text-base shadow-md hover:shadow-lg hover:opacity-95 transition-all"
                  style={primaryBtn}
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : (
                    <span className="flex items-center justify-center gap-2">
                      Entrar <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ---------------------------------------------------------------- */}
            {/* CADASTRO                                                         */}
            {/* ---------------------------------------------------------------- */}
            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div
                  className="rounded-xl p-3 flex items-start gap-2 border"
                  style={{ background: `${primary}0f`, borderColor: `${primary}33` }}
                >
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1 text-gray-900">Selecione seu município</p>
                    <p>
                      Caso seu município ainda não utilize o DigiUrban, ele será cadastrado automaticamente após seu registro.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center text-red-800">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="register-cpf" className="text-gray-700 font-medium">CPF *</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                    <Input
                      id="register-cpf"
                      placeholder="000.000.000-00"
                      value={registerData.cpf}
                      onChange={(e) => setRegisterData({ ...registerData, cpf: formatCPF(e.target.value) })}
                      maxLength={14}
                      required
                      className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                      style={inputFocus}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-gray-700 font-medium">Nome Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                    <Input
                      id="register-name"
                      placeholder="Seu nome completo"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      required
                      className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                      style={inputFocus}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-gray-700 font-medium">E-mail *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                      style={inputFocus}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="text-gray-700 font-medium">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                    <Input
                      id="register-phone"
                      placeholder="(00) 00000-0000"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                      style={inputFocus}
                    />
                  </div>
                </div>

                {municipioSelector}

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-gray-700 font-medium">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                      style={inputFocus}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm" className="text-gray-700 font-medium">Confirmar Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                    <Input
                      id="register-confirm"
                      type={showRegisterConfirmPassword ? 'text' : 'password'}
                      placeholder="Digite a senha novamente"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                      style={inputFocus}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  className="w-full h-12 rounded-xl text-white font-semibold text-base shadow-md hover:shadow-lg hover:opacity-95 transition-all"
                  style={primaryBtn}
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando cadastro...' : 'Criar cadastro'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <Link
              href="/landing"
              className="text-sm font-medium hover:underline transition-colors"
              style={{ color: primary }}
            >
              ← Voltar para página inicial
            </Link>
          </div>
        </div>
      </main>

      {/* Banner PWA */}
      <InstallPWABanner />
    </div>
  )
}
