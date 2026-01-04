'use client';

import { useState } from 'react';
import { Shield, FileUser, Terminal } from 'lucide-react';
import AuditLogsTab from '@/components/admin/AuditLogsTab';
import SystemLogsTab from '@/components/admin/SystemLogsTab';

type Tab = 'audit' | 'system';

export default function AuditLogPage() {
  const [activeTab, setActiveTab] = useState<Tab>('audit');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Auditoria e Logs do Sistema
            </h1>
          </div>
          <p className="text-gray-600">
            Monitoramento completo de ações administrativas, segurança e eventos do sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('audit')}
                className={`${
                  activeTab === 'audit'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              >
                <FileUser className="w-5 h-5" />
                Audit Logs
                <span className={`${
                  activeTab === 'audit' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                  Ações Administrativas
                </span>
              </button>

              <button
                onClick={() => setActiveTab('system')}
                className={`${
                  activeTab === 'system'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              >
                <Terminal className="w-5 h-5" />
                System Logs
                <span className={`${
                  activeTab === 'system' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                  Winston Logs
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'audit' && <AuditLogsTab />}
          {activeTab === 'system' && <SystemLogsTab />}
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-indigo-900">Conformidade e Segurança</h3>
              <p className="text-indigo-700 text-sm mt-1">
                <strong>Audit Logs:</strong> Armazenados de forma imutável e criptografada por no mínimo 7 anos (LGPD).
                Logs críticos mantidos indefinidamente.
                <br />
                <strong>System Logs:</strong> Logs técnicos do Winston mantidos por 3-7 dias dependendo do tipo.
                Incluem erros, avisos, requisições HTTP e eventos da aplicação.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
