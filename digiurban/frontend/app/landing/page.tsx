'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Shield,
  Smartphone,
  FileText,
  Users,
  TrendingUp,
  ChevronRight,
  Building2,
  Heart,
  GraduationCap,
  HandHeart,
  Hammer,
  Palette,
  Trees,
  Play,
  Lock,
  Bell,
  BarChart3
} from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="container mx-auto px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0f6fbe] to-[#193642] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold text-[#193642]">DigiUrban</div>
                <div className="text-xs text-gray-500">Plataforma Municipal Digital</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#servicos" className="text-sm font-medium text-gray-600 hover:text-[#0f6fbe] transition-colors">Serviços</a>
              <a href="#como-funciona" className="text-sm font-medium text-gray-600 hover:text-[#0f6fbe] transition-colors">Como Funciona</a>
              <a href="#seguranca" className="text-sm font-medium text-gray-600 hover:text-[#0f6fbe] transition-colors">Segurança</a>
            </div>

            <div className="flex gap-3">
              <Link
                href="/cidadao/login"
                className="bg-[#0fffbf] hover:bg-[#0de6a9] text-[#193642] px-6 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
              >
                Acessar Portal
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8 bg-gradient-to-br from-[#0f6fbe] via-[#0f6fbe] to-[#193642] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#0fffbf] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#a7dbc9] rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
                <div className="w-2 h-2 bg-[#0fffbf] rounded-full animate-pulse"></div>
                <span className="text-sm text-white font-medium">Plataforma Digital de Serviços Municipais</span>
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
                Serviços públicos{' '}
                <span className="text-[#0fffbf]">modernos e acessíveis</span>
                {' '}para todos
              </h1>

              <p className="text-lg text-white/80 mb-10 leading-relaxed max-w-xl">
                Solicite serviços, acompanhe protocolos e gerencie documentos de forma 100% digital.
                Acesso seguro, rápido e disponível 24 horas por dia.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/cidadao/login"
                  className="inline-flex items-center justify-center gap-2 bg-[#0fffbf] hover:bg-[#0de6a9] text-[#193642] px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Acessar Plataforma
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/cidadao/register"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold backdrop-blur-sm transition-all"
                >
                  Criar Conta
                </Link>
              </div>

              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle2 className="w-5 h-5 text-[#0fffbf]" />
                  <span>Grátis para cidadãos</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle2 className="w-5 h-5 text-[#0fffbf]" />
                  <span>Acesso 24/7</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CheckCircle2 className="w-5 h-5 text-[#0fffbf]" />
                  <span>100% Seguro</span>
                </div>
              </div>
            </div>

            {/* Demo Preview */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0fffbf] to-[#a7dbc9] rounded-2xl blur-2xl opacity-30"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f6fbe] to-[#0fffbf] flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#193642]">Portal do Cidadão</h3>
                      <p className="text-sm text-gray-500">Acesse seus serviços</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#a7dbc9]/20 to-transparent border border-[#a7dbc9]/30">
                      <div className="w-10 h-10 rounded-lg bg-[#0f6fbe]/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#0f6fbe]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[#193642]">Meus Protocolos</div>
                        <div className="text-xs text-gray-500">Acompanhe em tempo real</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-[#0fffbf]/10 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-[#0fffbf]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[#193642]">Saúde</div>
                        <div className="text-xs text-gray-500">Agendamentos e consultas</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-[#0f6fbe]/10 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-[#0f6fbe]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-[#193642]">Educação</div>
                        <div className="text-xs text-gray-500">Matrículas e documentos</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Última atualização: Agora</span>
                      <div className="flex items-center gap-1 text-[#0fffbf]">
                        <div className="w-1.5 h-1.5 bg-[#0fffbf] rounded-full animate-pulse"></div>
                        <span>Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0f6fbe] mb-2">12.543</div>
              <div className="text-sm text-gray-600">Protocolos processados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0f6fbe] mb-2">98%</div>
              <div className="text-sm text-gray-600">Satisfação dos usuários</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0f6fbe] mb-2">24/7</div>
              <div className="text-sm text-gray-600">Disponibilidade</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#0f6fbe] mb-2">15+</div>
              <div className="text-sm text-gray-600">Secretarias integradas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-[#193642] mb-4">
                Como funciona a plataforma
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Acesse serviços municipais de forma simples e segura em três etapas
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#0fffbf] to-transparent hidden md:block"></div>
                <div className="relative bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f6fbe] to-[#0fffbf] flex items-center justify-center mb-6">
                    <span className="text-xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#193642] mb-3">Cadastre-se gratuitamente</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Crie sua conta com CPF, e-mail e telefone. Processo rápido e seguro, leva menos de 2 minutos.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-[#0fffbf]" />
                      <span>Dados criptografados</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-[#0fffbf]" />
                      <span>Conformidade LGPD</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#0fffbf] to-transparent hidden md:block"></div>
                <div className="relative bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f6fbe] to-[#0fffbf] flex items-center justify-center mb-6">
                    <span className="text-xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#193642] mb-3">Solicite serviços</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Navegue pelas categorias, preencha formulários e anexe documentos de forma digital.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-[#0fffbf]" />
                      <span>Interface intuitiva</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-[#0fffbf]" />
                      <span>Upload de documentos</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="relative">
                <div className="relative bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f6fbe] to-[#0fffbf] flex items-center justify-center mb-6">
                    <span className="text-xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#193642] mb-3">Acompanhe em tempo real</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Receba notificações e acompanhe o status do seu protocolo pelo painel ou e-mail.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-[#0fffbf]" />
                      <span>Notificações automáticas</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-[#0fffbf]" />
                      <span>Histórico completo</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-24 px-6 lg:px-8 bg-white">
        <div className="container mx-auto">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-[#193642] mb-4">
                Serviços disponíveis na plataforma
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Acesse serviços de diversas secretarias municipais em um único lugar
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Heart, title: 'Saúde', items: ['Agendamento de consultas', 'Marcação de exames', 'Carteira de vacinação'], color: '#0f6fbe' },
                { icon: GraduationCap, title: 'Educação', items: ['Matrícula escolar', 'Transferências', 'Declarações'], color: '#0f6fbe' },
                { icon: HandHeart, title: 'Assistência Social', items: ['Programas sociais', 'Benefícios', 'Cadastro único'], color: '#0fffbf' },
                { icon: Hammer, title: 'Obras e Urbanismo', items: ['Solicitação de reparos', 'Denúncias', 'Alvarás'], color: '#0f6fbe' },
                { icon: Palette, title: 'Cultura e Lazer', items: ['Inscrição em eventos', 'Cursos e oficinas', 'Reserva de espaços'], color: '#0fffbf' },
                { icon: Trees, title: 'Meio Ambiente', items: ['Coleta seletiva', 'Denúncia ambiental', 'Poda de árvores'], color: '#0fffbf' },
              ].map((service, index) => (
                <div key={index} className="group bg-white rounded-xl p-6 border border-gray-100 hover:border-[#0fffbf]/30 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0f6fbe]/10 to-[#0fffbf]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <service.icon className="w-6 h-6" style={{ color: service.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-[#193642] mb-3">{service.title}</h3>
                  <ul className="space-y-2">
                    {service.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-1 h-1 rounded-full bg-[#0fffbf] mt-1.5"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/cidadao/servicos"
                className="inline-flex items-center gap-2 text-[#0f6fbe] hover:text-[#0fffbf] font-medium transition-colors"
              >
                Ver todos os serviços disponíveis
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-[#0f6fbe]/10 flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-[#0f6fbe]" />
                </div>
                <h3 className="text-xl font-semibold text-[#193642] mb-3">Economia de tempo</h3>
                <p className="text-gray-600 leading-relaxed">
                  Resolva tudo online, sem filas ou deslocamento. Disponível 24 horas por dia, 7 dias por semana.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-[#0fffbf]/10 flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6 text-[#0fffbf]" />
                </div>
                <h3 className="text-xl font-semibold text-[#193642] mb-3">Acesso multiplataforma</h3>
                <p className="text-gray-600 leading-relaxed">
                  Use em qualquer dispositivo: computador, tablet ou smartphone. Interface responsiva e intuitiva.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-[#0f6fbe]/10 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-[#0f6fbe]" />
                </div>
                <h3 className="text-xl font-semibold text-[#193642] mb-3">Segurança garantida</h3>
                <p className="text-gray-600 leading-relaxed">
                  Proteção de dados com criptografia, autenticação segura e conformidade total com a LGPD.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Segurança */}
      <section id="seguranca" className="py-24 px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-[#193642] mb-6">
                  Segurança e privacidade em primeiro lugar
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Seus dados pessoais e documentos estão protegidos com os mais altos padrões de segurança digital.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0fffbf]/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-[#0fffbf]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#193642] mb-1">Criptografia de ponta a ponta</h4>
                      <p className="text-sm text-gray-600">Todos os dados são transmitidos e armazenados com criptografia avançada.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0fffbf]/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-[#0fffbf]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#193642] mb-1">Conformidade LGPD</h4>
                      <p className="text-sm text-gray-600">Total adequação à Lei Geral de Proteção de Dados Pessoais.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0fffbf]/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-[#0fffbf]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#193642] mb-1">Controle total</h4>
                      <p className="text-sm text-gray-600">Você tem acesso e controle completo sobre seus dados pessoais.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0fffbf]/20 to-[#a7dbc9]/20 rounded-2xl blur-2xl"></div>
                <div className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-[#193642]">Proteção de Dados</h4>
                    <div className="flex items-center gap-2 text-xs text-[#0fffbf]">
                      <div className="w-2 h-2 bg-[#0fffbf] rounded-full animate-pulse"></div>
                      <span>Ativo</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Criptografia SSL/TLS', value: 100 },
                      { label: 'Firewall de Aplicação', value: 100 },
                      { label: 'Autenticação Segura', value: 100 },
                      { label: 'Backup Automático', value: 100 },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="text-[#193642] font-semibold">{item.value}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#0f6fbe] to-[#0fffbf] rounded-full"
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-[#0f6fbe] via-[#0f6fbe] to-[#193642] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#0fffbf] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#a7dbc9] rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
              Pronto para começar?
            </h2>
            <p className="text-lg lg:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Acesse agora a plataforma e experimente a praticidade dos serviços municipais digitais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cidadao/login"
                className="inline-flex items-center justify-center gap-2 bg-[#0fffbf] hover:bg-[#0de6a9] text-[#193642] px-10 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Acessar Portal do Cidadão
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                href="/cidadao/register"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-10 py-4 rounded-xl font-semibold text-lg backdrop-blur-sm transition-all"
              >
                Criar Conta Gratuita
              </Link>
            </div>
            <p className="text-white/60 text-sm mt-8">
              Grátis • Seguro • Disponível 24/7
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#193642] text-white py-16 px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0f6fbe] to-[#0fffbf] flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold">DigiUrban</div>
                  <div className="text-xs text-white/60">Plataforma Municipal</div>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Plataforma digital para facilitar o acesso aos serviços municipais de forma moderna e eficiente.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Serviços</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#servicos" className="text-white/60 hover:text-[#0fffbf] transition-colors">Saúde</a></li>
                <li><a href="#servicos" className="text-white/60 hover:text-[#0fffbf] transition-colors">Educação</a></li>
                <li><a href="#servicos" className="text-white/60 hover:text-[#0fffbf] transition-colors">Assistência Social</a></li>
                <li><a href="#servicos" className="text-white/60 hover:text-[#0fffbf] transition-colors">Obras e Urbanismo</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Ajuda</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#como-funciona" className="text-white/60 hover:text-[#0fffbf] transition-colors">Como Funciona</a></li>
                <li><a href="#" className="text-white/60 hover:text-[#0fffbf] transition-colors">Perguntas Frequentes</a></li>
                <li><a href="#" className="text-white/60 hover:text-[#0fffbf] transition-colors">Suporte</a></li>
                <li><a href="#seguranca" className="text-white/60 hover:text-[#0fffbf] transition-colors">Segurança</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Acesso</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/cidadao/login" className="text-white/60 hover:text-[#0fffbf] transition-colors">Portal do Cidadão</Link></li>
                <li><Link href="/admin/login" className="text-white/60 hover:text-[#0fffbf] transition-colors">Portal Administrativo</Link></li>
                <li><a href="#" className="text-white/60 hover:text-[#0fffbf] transition-colors">Privacidade</a></li>
                <li><a href="#" className="text-white/60 hover:text-[#0fffbf] transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/40">
                © 2024 DigiUrban. Todos os direitos reservados.
              </p>
              <Link
                href="/super-admin/login"
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Administração
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
