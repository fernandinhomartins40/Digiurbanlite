'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Eye, EyeOff, Mail, Server, Lock, Shield, AlertCircle } from 'lucide-react';

interface CredentialsModalProps {
  open: boolean;
  onClose: () => void;
  credentials: {
    email: string;
    password: string;
    server?: string;
    port?: number;
    security?: string;
  } | null;
}

export function CredentialsModal({ open, onClose, credentials }: CredentialsModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!credentials) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            Credenciais SMTP Criadas
          </DialogTitle>
          <DialogDescription className="text-sm">
            Guarde estas informações com segurança. A senha não será exibida novamente!
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-xs sm:text-sm">
            <strong>ATENÇÃO:</strong> Esta é a única vez que a senha será exibida. Copie e guarde em local seguro!
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {/* Email */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(credentials.email, 'email')}
                className="h-8"
              >
                {copied === 'email' ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <code className="text-sm font-mono bg-white px-3 py-2 rounded border block">
              {credentials.email}
            </code>
          </div>

          {/* Senha */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="w-4 h-4" />
                Senha
              </label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-8"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(credentials.password, 'password')}
                  className="h-8"
                >
                  {copied === 'password' ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
            <code className="text-sm font-mono bg-white px-3 py-2 rounded border block">
              {showPassword ? credentials.password : '••••••••••••••••'}
            </code>
          </div>

          {/* Configurações SMTP */}
          {credentials.server && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-900 mb-3">
                <Server className="w-4 h-4" />
                Configurações do Servidor SMTP
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-blue-700 font-medium mb-1 text-xs sm:text-sm">Servidor SMTP</p>
                  <code className="bg-white px-2 py-1 rounded border text-xs block break-all">
                    {credentials.server}
                  </code>
                </div>

                <div>
                  <p className="text-blue-700 font-medium mb-1 text-xs sm:text-sm">Porta</p>
                  <code className="bg-white px-2 py-1 rounded border text-xs block">
                    {credentials.port || 587}
                  </code>
                </div>

                <div>
                  <p className="text-blue-700 font-medium mb-1 text-xs sm:text-sm">Segurança</p>
                  <code className="bg-white px-2 py-1 rounded border text-xs block">
                    {credentials.security || 'STARTTLS'}
                  </code>
                </div>

                <div>
                  <p className="text-blue-700 font-medium mb-1 text-xs sm:text-sm">Autenticação</p>
                  <code className="bg-white px-2 py-1 rounded border text-xs block">
                    Obrigatória
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Instruções */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Como usar:</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold min-w-[1.5rem]">1.</span>
                <span>Configure seu cliente de email (Thunderbird, Outlook, Gmail App)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold min-w-[1.5rem]">2.</span>
                <span>Use as credenciais acima para autenticação SMTP</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold min-w-[1.5rem]">3.</span>
                <span>Certifique-se de usar STARTTLS na porta 587</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Entendi, Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
