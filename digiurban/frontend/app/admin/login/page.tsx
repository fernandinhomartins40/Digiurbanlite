'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useTenant } from '@/components/providers/TenantProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Loader2, Building2, Lock, Eye, EyeOff, Mail, Shield, ArrowRight,
  LayoutDashboard, Users, ClipboardList, BarChart3,
} from 'lucide-react'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, loading, error } = useAdminAuth()

  // Branding do município (mesmo padrão do login do cidadão e da landing).
  // As cores/logotipo vêm do tenant resolvido pelo host, configuráveis no painel
  // super-admin — nada hardcoded ao DigiUrban.
  const { config: tenantConfig } = useTenant()
  const primary = tenantConfig.branding?.corPrimaria || '#2563eb'
  const secondary = tenantConfig.branding?.corSecundaria || '#f59e0b'
  const logo = tenantConfig.branding?.logoUrl || null
  const municipioNome = tenantConfig.nomeMunicipio || tenantConfig.nome

  const inputFocus = { '--tw-ring-color': primary } as React.CSSProperties
  const primaryBtn: React.CSSProperties = { background: `linear-gradient(135deg, ${primary}, ${secondary})` }

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

  const destaques = [
    { icon: LayoutDashboard, title: 'Painel de gestão', desc: 'Acompanhe indicadores e o dia a dia da secretaria.' },
    { icon: ClipboardList, title: 'Protocolos', desc: 'Atenda e movimente solicitações dos cidadãos.' },
    { icon: Users, title: 'Equipe e setores', desc: 'Organize servidores, cargos e departamentos.' },
    { icon: BarChart3, title: 'Relatórios', desc: 'Analytics e indicadores de desempenho.' },
  ]

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-gray-50">
      {/* ===================================================================== */}
      {/* PAINEL ESQUERDO — identidade visual do município (oculto no mobile)  */}
      {/* ===================================================================== */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${primary}, ${secondary})` }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-black/20 blur-3xl" />
        </div>

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

        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium mb-5">
            <Shield className="h-3.5 w-3.5" /> Área dos servidores
          </span>
          <h2 className="text-4xl font-bold leading-tight">
            Sistema de gestão de {municipioNome}
          </h2>
          <p className="mt-4 text-white/80 text-lg">
            A administração municipal em um só lugar — protocolos, equipes e indicadores.
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

        <div className="relative z-10 text-xs text-white/60">
          {tenantConfig.nome} — Governo Digital
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* PAINEL DIREITO — formulário                                          */}
      {/* ===================================================================== */}
      <main className="flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
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
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-4"
              style={primaryBtn}
            >
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Portal Administrativo</h1>
            <p className="text-gray-500 mt-1.5">Acesse o sistema de gestão de {municipioNome}</p>
          </div>

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50" variant="destructive">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@prefeitura.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                  style={inputFocus}
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4" style={{ color: primary }} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl border-gray-200 focus-visible:ring-2"
                  style={inputFocus}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-admin"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={loading}
                />
                <label
                  htmlFor="remember-admin"
                  className="text-sm font-medium leading-none cursor-pointer text-gray-700"
                >
                  Lembrar meu email
                </label>
              </div>

              <Link
                href="/admin/forgot-password"
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
              disabled={loading || !email || !password}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Entrando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Entrar <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div
            className="mt-6 p-4 rounded-xl border"
            style={{ background: `${primary}0a`, borderColor: `${primary}26` }}
          >
            <p className="text-xs font-semibold mb-2 flex items-center text-gray-900">
              <Shield className="h-3 w-3 mr-1" style={{ color: primary }} />
              Níveis de Acesso:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
              <div><span className="font-medium text-gray-900">Funcionário:</span> Protocolos do setor</div>
              <div><span className="font-medium text-gray-900">Coordenador:</span> Supervisão de equipe</div>
              <div><span className="font-medium text-gray-900">Secretário:</span> Gestão setorial</div>
              <div><span className="font-medium text-gray-900">Prefeito:</span> Visão municipal</div>
            </div>
          </div>

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
    </div>
  )
}
