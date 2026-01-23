'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PDFViewer } from './PDFViewer';
import { CertificateSelector } from './CertificateSelector';
import { SignaturesList } from './SignaturesList';
import { useCertificates, DigitalCertificate } from '@/hooks/useCertificates';
import { retrievePrivateKey, storePrivateKey, hasStoredKey } from '@/services/secure-key-manager';
import {
  X,
  FileText,
  Shield,
  Key,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
} from 'lucide-react';
import { toast } from 'sonner';

interface Signature {
  id: string;
  signedAt: string;
  certificate: {
    commonName: string;
    email: string;
    type: 'ADMIN' | 'CITIZEN';
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  };
}

interface DocumentSigningModalProps {
  document: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    signatures?: Signature[];
  };
  userType: 'admin' | 'citizen';
  onClose: () => void;
  onSuccess?: (signature: any) => void;
}

type SigningStep = 'select-cert' | 'enter-pin' | 'signing' | 'success';

export function DocumentSigningModal({
  document,
  userType,
  onClose,
  onSuccess,
}: DocumentSigningModalProps) {
  const { activeCertificates, loading: loadingCerts } = useCertificates({ userType });
  const [selectedCertificate, setSelectedCertificate] = useState<DigitalCertificate | null>(null);
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<SigningStep>('select-cert');
  const [signing, setSigning] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>(document.signatures || []);

  useEffect(() => {
    // Se já tiver um certificado selecionado e uma chave armazenada, pular para o PIN
    if (selectedCertificate && hasStoredKey(selectedCertificate.id)) {
      setStep('enter-pin');
    }
  }, [selectedCertificate]);

  const handleCertificateSelect = (cert: DigitalCertificate) => {
    setSelectedCertificate(cert);
    setStep('enter-pin');
  };

  const handleSign = async () => {
    if (!selectedCertificate || !pin) {
      toast.error('Selecione um certificado e insira o PIN');
      return;
    }

    setSigning(true);
    setStep('signing');

    try {
      // Tentar recuperar a chave privada com o PIN
      let privateKey: string | null = null;

      try {
        privateKey = retrievePrivateKey(selectedCertificate.id, pin);
      } catch (error: any) {
        // Se falhar, a chave não está armazenada - precisamos que o usuário forneça
        toast.error('PIN incorreto ou chave privada não encontrada');
        setSigning(false);
        setStep('enter-pin');
        return;
      }

      if (!privateKey) {
        toast.error('Chave privada não encontrada. Faça login com seu certificado primeiro.');
        setSigning(false);
        setStep('enter-pin');
        return;
      }

      // Enviar requisição de assinatura para o backend
      const response = await fetch('/api/documents/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: document.id,
          certificateId: selectedCertificate.id,
          privateKey,
          pin,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao assinar documento');
      }

      // Sucesso!
      setStep('success');
      toast.success('Documento assinado com sucesso!');

      // Atualizar lista de assinaturas
      if (result.signature) {
        setSignatures(prev => [...prev, result.signature]);
      }

      // Chamar callback de sucesso
      if (onSuccess) {
        onSuccess(result.signature);
      }

      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao assinar documento:', error);
      toast.error(error.message || 'Erro ao assinar documento');
      setSigning(false);
      setStep('enter-pin');
    }
  };

  const canSign = selectedCertificate && pin.length >= 4;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Assinar Documento Digitalmente
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={signing}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 h-full">
            {/* PDF Viewer - 60% */}
            <div className="lg:col-span-3 border-r overflow-hidden">
              <PDFViewer
                file={document.fileUrl}
                fileName={document.fileName}
                showControls={true}
                className="h-full"
              />
            </div>

            {/* Signing Panel - 40% */}
            <div className="lg:col-span-2 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Document Info */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Informações do Documento
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome:</span>
                      <span className="font-medium text-gray-900 truncate ml-2">
                        {document.fileName}
                      </span>
                    </div>
                    {document.fileSize && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tamanho:</span>
                        <span className="font-medium text-gray-900">
                          {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={step === 'select-cert' ? 'default' : 'outline'}>
                    1. Certificado
                  </Badge>
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <Badge variant={step === 'enter-pin' ? 'default' : 'outline'}>
                    2. PIN
                  </Badge>
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <Badge variant={step === 'signing' || step === 'success' ? 'default' : 'outline'}>
                    3. Assinar
                  </Badge>
                </div>

                {/* Certificate Selection */}
                {(step === 'select-cert' || step === 'enter-pin') && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Certificado Digital
                    </h3>
                    <CertificateSelector
                      certificates={activeCertificates}
                      selectedCertificate={selectedCertificate}
                      onSelect={handleCertificateSelect}
                      loading={loadingCerts}
                    />
                  </div>
                )}

                {/* PIN Input */}
                {step === 'enter-pin' && selectedCertificate && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      PIN do Certificado
                    </h3>
                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder="Digite o PIN do certificado"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && canSign) {
                            handleSign();
                          }
                        }}
                        className="font-mono"
                        autoFocus
                      />
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-yellow-900">
                            <p className="font-medium">Assinatura Digital Oficial</p>
                            <p className="mt-1">
                              Ao assinar este documento, você declara ciência do conteúdo e
                              assume responsabilidade legal pela assinatura.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signing in Progress */}
                {step === 'signing' && (
                  <div className="py-8 text-center">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="font-medium text-gray-900">Assinando documento...</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Por favor, aguarde. Não feche esta janela.
                    </p>
                  </div>
                )}

                {/* Success */}
                {step === 'success' && (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="font-medium text-gray-900">Documento assinado com sucesso!</p>
                    <p className="text-sm text-gray-600 mt-1">
                      A assinatura foi registrada e validada.
                    </p>
                  </div>
                )}

                {/* Existing Signatures */}
                {signatures.length > 0 && (
                  <SignaturesList signatures={signatures} />
                )}

                {/* Actions */}
                {step !== 'signing' && step !== 'success' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSign}
                      disabled={!canSign || signing}
                      className="flex-1"
                    >
                      {signing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Assinando...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Assinar Documento
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
