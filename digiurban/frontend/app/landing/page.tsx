'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [showDemoForm, setShowDemoForm] = useState(false);
  const [showTrialForm, setShowTrialForm] = useState(false);
  const [showNewsletterForm, setShowNewsletterForm] = useState(false);
  const [showTrialPassword, setShowTrialPassword] = useState(false);

  const handleDemoSubmit = async (formData: FormData) => {
    try {
      const response = await fetch('/api/leads/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          company: formData.get('company'),
          position: formData.get('position'),
          message: formData.get('message')
        })
      });

      if (response.ok) {
        alert('Demo solicitada com sucesso! Nossa equipe entrará em contato.');
        setShowDemoForm(false);
      }
    } catch (error) {
      alert('Erro ao enviar solicitação. Tente novamente.');
    }
  };

  const handleTrialSubmit = async (formData: FormData) => {
    try {
      const response = await fetch('/api/leads/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          position: formData.get('position'),
          companyName: formData.get('companyName'),
          cnpj: formData.get('cnpj'),
          population: parseInt(formData.get('population') as string) || null,
          domain: formData.get('domain'),
          adminPassword: formData.get('adminPassword')
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Trial criado com sucesso! Acesse: ${result.accessInfo.loginUrl}`);
        setShowTrialForm(false);
      }
    } catch (error) {
      alert('Erro ao criar trial. Tente novamente.');
    }
  };

  const handleNewsletterSubmit = async (formData: FormData) => {
    try {
      const response = await fetch('/api/leads/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          name: formData.get('name')
        })
      });

      if (response.ok) {
        alert('Inscrição realizada com sucesso!');
        setShowNewsletterForm(false);
      }
    } catch (error) {
      alert('Erro ao se inscrever. Tente novamente.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                DigiUrban
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Recursos</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Planos</a>
              <a href="#portals" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Portais</a>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDemoForm(true)}
                className="hidden sm:block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Demo Gratuita
              </button>
              <button
                onClick={() => setShowTrialForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2.5 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Teste 30 Dias
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 lg:px-8 pt-32 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                🚀 Plataforma SaaS Nº1 para Gestão Pública
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Transforme a Gestão
              </span>
              <br />
              <span className="text-gray-900">do seu Município</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Sistema completo com <strong className="text-blue-600">174 páginas especializadas</strong> para 12 secretarias municipais.
              Protocolo inteligente, 3 portais integrados e muito mais.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => setShowTrialForm(true)}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-xl text-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                🚀 Começar Agora - Grátis 30 Dias
                <span className="block text-sm font-normal opacity-90">Sem cartão de crédito</span>
              </button>
              <button
                onClick={() => setShowDemoForm(true)}
                className="bg-white text-gray-900 border-2 border-gray-200 px-10 py-5 rounded-xl text-lg font-bold hover:border-blue-600 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
              >
                📹 Ver Demonstração
                <span className="block text-sm font-normal text-gray-600">15 minutos guiados</span>
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sem compromisso</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Setup em 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Suporte especializado</span>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Confiado por municípios em todo o Brasil</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    500+
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Municípios Atendidos</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
                    50k+
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Protocolos Processados</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                    98%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Satisfação</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Suporte Técnico</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Portals Section */}
      <section id="portals" className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Três Portais, Uma Plataforma Integrada
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Acesse o portal ideal para o seu perfil e comece a transformar a gestão pública
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Portal do Cidadão */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 transform">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Portal do Cidadão</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Acesse todos os serviços municipais, acompanhe protocolos e receba notificações em tempo real.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Solicitação online de serviços</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Acompanhamento de protocolos</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Notificações automáticas</span>
                </div>
              </div>
              <Link
                href="/cidadao/login"
                className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-4 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Acessar Portal do Cidadão →
              </Link>
            </div>

            {/* Portal Administrativo */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 transform border-4 border-yellow-400 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  ⭐ MAIS COMPLETO
                </span>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Portal Administrativo</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                174 páginas especializadas organizadas em 12 secretarias. Dashboards, relatórios e gestão completa.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span>12 secretarias integradas</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span>Dashboards personalizados</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span>Relatórios automáticos</span>
                </div>
              </div>
              <Link
                href="/admin/login"
                className="block w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center py-4 rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Acessar Portal Admin →
              </Link>
            </div>

            {/* Super Admin */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all hover:scale-105 transform">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-3xl">⚙️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Super Admin</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Central de controle multi-tenant. Analytics em tempo real, billing e gestão da plataforma SaaS.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Analytics em tempo real</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Gestão multi-municípios</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Billing automático</span>
                </div>
              </div>
              <Link
                href="/super-admin/login"
                className="block w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white text-center py-4 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                Acessar Super Admin →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Por que escolher o DigiUrban?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A plataforma mais completa para modernizar completamente sua administração municipal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl border border-blue-100 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-3xl">🏛️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Sistema Completo</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                174 páginas especializadas cobrindo todas as 12 secretarias municipais integradas em uma única plataforma.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  12 Secretarias Integradas
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  174 Páginas Especializadas
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Motor de Protocolos Unificado
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl border border-green-100 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Implementação Rápida</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Comece a usar em 24 horas! Setup completo, treinamento e migração de dados inclusos.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Setup em 24h
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Treinamento Incluído
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Migração de Dados
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl border border-purple-100 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Segurança Total</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Infraestrutura de nível empresarial com backup automático, criptografia e conformidade LGPD.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Conformidade LGPD
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Backup Automático
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  SSL/TLS Certificado
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Planos que se adaptam ao seu município
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Escolha o plano ideal. Todos incluem suporte técnico completo e trial gratuito de 30 dias.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">STARTER</h3>
                <p className="text-gray-600 mb-6">Ideal para municípios pequenos</p>
                <div className="flex items-end justify-center gap-2 mb-2">
                  <span className="text-gray-500 line-through text-xl">R$ 1.500</span>
                  <span className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    R$ 1.200
                  </span>
                </div>
                <div className="text-sm text-gray-500">/mês</div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Até 10 usuários</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">1.000 protocolos/mês</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">5 departamentos</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">1GB armazenamento</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Suporte por email</span>
                </li>
              </ul>
              <button
                onClick={() => setShowTrialForm(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Começar Trial Gratuito
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all border-4 border-yellow-400 transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ MAIS POPULAR
                </span>
              </div>
              <div className="text-center mb-8 mt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">PROFESSIONAL</h3>
                <p className="text-gray-600 mb-6">Para municípios em crescimento</p>
                <div className="flex items-end justify-center gap-2 mb-2">
                  <span className="text-gray-500 line-through text-xl">R$ 5.500</span>
                  <span className="text-5xl font-extrabold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                    R$ 4.500
                  </span>
                </div>
                <div className="text-sm text-gray-500">/mês</div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 font-medium">Até 50 usuários</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 font-medium">10.000 protocolos/mês</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 font-medium">15 departamentos</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 font-medium">10GB armazenamento</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 font-medium">Suporte prioritário</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 font-medium">API personalizada</span>
                </li>
              </ul>
              <button
                onClick={() => setShowTrialForm(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
              >
                Começar Trial Gratuito
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">ENTERPRISE</h3>
                <p className="text-gray-600 mb-6">Para grandes municípios</p>
                <div className="flex items-end justify-center gap-2 mb-2">
                  <span className="text-gray-500 line-through text-xl">R$ 15.000</span>
                  <span className="text-5xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    R$ 12.500
                  </span>
                </div>
                <div className="text-sm text-gray-500">/mês</div>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Usuários <strong>ilimitados</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Protocolos <strong>ilimitados</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Departamentos <strong>ilimitados</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Armazenamento <strong>ilimitado</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Suporte 24/7</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Gerente dedicado</span>
                </li>
              </ul>
              <button
                onClick={() => setShowDemoForm(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
              >
                Solicitar Proposta
              </button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4 text-lg">
              💡 Todos os planos incluem trial gratuito de 30 dias • Sem cartão de crédito
            </p>
          </div>
        </div>
      </section>

      {/* 12 Secretarias */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              12 Secretarias Integradas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              174 páginas especializadas organizadas por secretaria, todas conectadas ao motor de protocolos
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[
              { name: 'Saúde', icon: '🏥', color: 'from-red-500 to-pink-500' },
              { name: 'Educação', icon: '📚', color: 'from-blue-500 to-indigo-500' },
              { name: 'Assistência Social', icon: '🤝', color: 'from-green-500 to-emerald-500' },
              { name: 'Cultura', icon: '🎭', color: 'from-purple-500 to-pink-500' },
              { name: 'Segurança', icon: '👮', color: 'from-yellow-500 to-orange-500' },
              { name: 'Planejamento', icon: '🏗️', color: 'from-cyan-500 to-blue-500' },
              { name: 'Agricultura', icon: '🌾', color: 'from-green-600 to-lime-500' },
              { name: 'Esportes', icon: '⚽', color: 'from-orange-500 to-red-500' },
              { name: 'Turismo', icon: '✈️', color: 'from-blue-400 to-cyan-400' },
              { name: 'Habitação', icon: '🏠', color: 'from-indigo-500 to-purple-500' },
              { name: 'Meio Ambiente', icon: '🌳', color: 'from-green-500 to-teal-500' },
              { name: 'Obras Públicas', icon: '🚧', color: 'from-gray-600 to-gray-800' }
            ].map((sec) => (
              <div
                key={sec.name}
                className="group bg-white p-6 rounded-2xl border-2 border-gray-100 hover:border-transparent hover:shadow-xl transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${sec.color} rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{sec.icon}</span>
                </div>
                <p className="font-bold text-gray-900 text-center">{sec.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 leading-tight">
            Pronto para modernizar<br />seu município?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Junte-se a centenas de municípios que já transformaram sua gestão com o DigiUrban.<br />
            <strong className="text-white">Comece seu trial gratuito de 30 dias hoje mesmo!</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <button
              onClick={() => setShowTrialForm(true)}
              className="bg-white text-blue-600 px-12 py-5 rounded-xl text-xl font-bold hover:bg-blue-50 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 transform"
            >
              🚀 Começar Trial Gratuito
            </button>
            <button
              onClick={() => setShowDemoForm(true)}
              className="bg-gradient-to-r from-green-400 to-emerald-400 text-gray-900 px-12 py-5 rounded-xl text-xl font-bold hover:from-green-300 hover:to-emerald-300 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 transform"
            >
              📞 Falar com Especialista
            </button>
          </div>

          <p className="text-blue-100 text-sm">
            ✅ Sem cartão de crédito • ✅ Setup em 24h • ✅ Suporte completo
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <span className="text-2xl font-bold text-white">DigiUrban</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Sistema completo de gestão municipal com foco em protocolos inteligentes e eficiência.
              </p>
              <button
                onClick={() => setShowNewsletterForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
              >
                📧 Newsletter
              </button>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Produto</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="#portals" className="hover:text-white transition-colors">Portais</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Empresa</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Suporte</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Treinamentos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status do Sistema</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 DigiUrban. Todos os direitos reservados. Transformando a gestão pública brasileira. 🇧🇷
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Forms */}
      {showDemoForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Solicitar Demonstração
            </h3>
            <p className="text-gray-600 mb-6">Preencha os dados para agendar uma demo personalizada</p>
            <form action={handleDemoSubmit}>
              <div className="space-y-4">
                <input
                  name="name"
                  placeholder="Nome completo"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email corporativo"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  required
                />
                <input
                  name="phone"
                  placeholder="Telefone com DDD"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
                <input
                  name="company"
                  placeholder="Nome da Prefeitura"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  required
                />
                <input
                  name="position"
                  placeholder="Cargo"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
                <textarea
                  name="message"
                  placeholder="Mensagem (opcional)"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors h-24"
                />
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold transition-all shadow-lg"
                  >
                    Solicitar Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDemoForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl hover:bg-gray-200 font-bold transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTrialForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              Iniciar Trial Gratuito
            </h3>
            <p className="text-gray-600 mb-6">30 dias de acesso completo • Sem cartão de crédito</p>
            <form action={handleTrialSubmit}>
              <div className="space-y-4">
                <input
                  name="name"
                  placeholder="Nome completo"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email corporativo"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  required
                />
                <input
                  name="phone"
                  placeholder="Telefone com DDD"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                />
                <input
                  name="position"
                  placeholder="Cargo"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                />
                <input
                  name="companyName"
                  placeholder="Nome da Prefeitura"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  required
                />
                <input
                  name="cnpj"
                  placeholder="CNPJ"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  required
                />
                <input
                  name="population"
                  type="number"
                  placeholder="População estimada (opcional)"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                />
                <input
                  name="domain"
                  placeholder="Subdomínio desejado (ex: minhacidate)"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                />
                <div className="relative">
                  <input
                    name="adminPassword"
                    type={showTrialPassword ? "text" : "password"}
                    placeholder="Senha inicial (deixe vazio para automática)"
                    className="w-full p-4 pr-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTrialPassword(!showTrialPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showTrialPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 font-bold transition-all shadow-lg"
                  >
                    Criar Trial Agora
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTrialForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl hover:bg-gray-200 font-bold transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewsletterForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Newsletter DigiUrban
            </h3>
            <p className="text-gray-600 mb-6">Receba novidades, dicas e ofertas exclusivas</p>
            <form action={handleNewsletterSubmit}>
              <div className="space-y-4">
                <input
                  name="name"
                  placeholder="Nome (opcional)"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Seu melhor email"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  required
                />
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 font-bold transition-all shadow-lg"
                  >
                    Inscrever-se
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewsletterForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl hover:bg-gray-200 font-bold transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
