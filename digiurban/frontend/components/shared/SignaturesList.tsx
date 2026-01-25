'use client';

import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Signature {
  id: string;
  signedAt: string;
  certificate: {
    commonName: string;
    email: string;
    type: 'ADMIN' | 'CITIZEN' | 'SERVER' | 'SYSTEM';
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  };
}

interface SignaturesListProps {
  signatures: Signature[];
  loading?: boolean;
}

export function SignaturesList({ signatures, loading = false }: SignaturesListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-gray-700">Assinaturas deste Documento</h3>
        <div className="animate-pulse space-y-2">
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-gray-700">
        Assinaturas deste Documento ({signatures.length})
      </h3>
      {signatures.length === 0 ? (
        <div className="p-4 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Nenhuma assinatura ainda</p>
          <p className="text-xs text-gray-500 mt-1">
            Seja o primeiro a assinar este documento
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {signatures.map(sig => {
            const isValid = sig.certificate.status === 'ACTIVE';
            const isRevoked = sig.certificate.status === 'REVOKED';

            return (
              <div
                key={sig.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isValid
                    ? 'bg-green-50 border-green-200'
                    : isRevoked
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {isValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {sig.certificate.commonName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{sig.certificate.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(sig.signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    className={
                      isValid
                        ? 'bg-green-600 text-white'
                        : isRevoked
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-600 text-white'
                    }
                  >
                    {isValid ? 'Válida' : isRevoked ? 'Revogada' : 'Expirada'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      sig.certificate.type === 'CITIZEN'
                        ? 'text-purple-700 border-purple-300'
                        : sig.certificate.type === 'ADMIN'
                        ? 'text-blue-700 border-blue-300'
                        : sig.certificate.type === 'SERVER'
                        ? 'text-orange-700 border-orange-300'
                        : 'text-gray-700 border-gray-300'
                    }
                  >
                    {sig.certificate.type === 'CITIZEN'
                      ? 'Cidadão'
                      : sig.certificate.type === 'ADMIN'
                      ? 'Servidor'
                      : sig.certificate.type === 'SERVER'
                      ? 'Sistema'
                      : 'Sistema'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
