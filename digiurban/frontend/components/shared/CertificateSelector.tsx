'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DigitalCertificate } from '@/hooks/useCertificates';

interface CertificateSelectorProps {
  certificates: DigitalCertificate[];
  selectedCertificate: DigitalCertificate | null;
  onSelect: (cert: DigitalCertificate) => void;
  loading?: boolean;
}

export function CertificateSelector({
  certificates,
  selectedCertificate,
  onSelect,
  loading = false,
}: CertificateSelectorProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Selecione seu Certificado Digital</label>
        <div className="animate-pulse space-y-2">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Selecione seu Certificado Digital</label>
        <div className="p-6 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Shield className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Nenhum certificado disponível</p>
          <p className="text-xs text-gray-500 mt-1">
            Você precisa ter um certificado digital ativo para assinar documentos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        Selecione seu Certificado Digital
      </label>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {certificates.map(cert => {
          const isSelected = selectedCertificate?.id === cert.id;
          const daysUntilExpiry = Math.ceil(
            (new Date(cert.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          return (
            <Card
              key={cert.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'border-2 border-blue-600 bg-blue-50'
                  : 'border border-gray-200 hover:border-blue-400'
              }`}
              onClick={() => onSelect(cert)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Shield className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {cert.commonName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{cert.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs text-gray-500">
                          Válido até {format(new Date(cert.expiresAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        {daysUntilExpiry <= 30 && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                            Expira em {daysUntilExpiry} dias
                          </Badge>
                        )}
                      </div>
                      {cert._count && cert._count.signatures > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {cert._count.signatures} assinatura{cert._count.signatures > 1 ? 's' : ''} realizadas
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    className={
                      cert.type === 'CITIZEN'
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-600 text-white'
                    }
                  >
                    {cert.type === 'CITIZEN' ? 'Cidadão' : 'Servidor'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
