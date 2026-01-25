'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PDFSignaturePlacer } from './PDFSignaturePlacer';
import { CertificateSelector } from './CertificateSelector';
import { SignaturesList } from './SignaturesList';
import { useCertificates, type DigitalCertificate } from '@/hooks/useCertificates';
import { retrievePrivateKey, hasStoredKey } from '@/services/secure-key-manager';
import {
  X,
  FileText,
  Shield,
  Key,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  MousePointer2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Signature {
  id: string;
  signedAt: string;
  verificationStatus?: 'VALID' | 'INVALID' | 'EXPIRED';
  certificate: {
    commonName: string;
    email: string;
    type: 'ADMIN' | 'CITIZEN' | 'SERVER' | 'SYSTEM';
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  };
}

interface SignaturePosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DocumentSigningModalWithPositionProps {
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

type SigningStep = 'position' | 'select-cert' | 'enter-pin' | 'signing' | 'success';

export function DocumentSigningModalWithPosition({
  document,
  userType,
  onClose,
  onSuccess,
}: DocumentSigningModalWithPositionProps) {
  const { activeCertificates, loading: loadingCerts } = useCertificates({ userType });
  const [selectedCertificate, setSelectedCertificate] = useState<DigitalCertificate | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<SigningStep>('position');
  const [signing, setSigning] = useState(false);
  const [signatures, setSignatures] = useState<Signature[]>(document.signatures || []);

  const handlePositionSelected = (position: SignaturePosition) => {
    setSignaturePosition(position);
  };

  const handleContinueToSelectCert = () => {
    if (!signaturePosition) {
      toast.error('Por favor, defina a posição da assinatura no documento');
      return;
    }
    setStep('select-cert');
  };

  const handleCertificateSelect = (cert: DigitalCertificate) => {
    setSelectedCertificate(cert);
    if (hasStoredKey(cert.id)) {
      setStep('enter-pin');
    }
  };

  const handleSign = async () => {
    if (!selectedCertificate || !pin || !signaturePosition) {
      toast.error('Dados incompletos para assinatura');
      return;
    }

    setSigning(true);
    setStep('signing');

    try {
      let privateKey: string | null = null;

      try {
        privateKey = retrievePrivateKey(selectedCertificate.id, pin);
      } catch (error: any) {
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

      const response = await fetch('/api/documents/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          externalDocumentId: document.id,
          certificateId: selectedCertificate.id,
          privateKey,
          pin,
          position: signaturePosition,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erro ao assinar documento');
      }

      setStep('success');
      toast.success('Documento assinado com sucesso!');

      if (result.signature) {
        setSignatures((prev) => [...prev, result.signature]);
      }

      if (onSuccess) {
        onSuccess(result.signature);
      }

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

  const canContinue = signaturePosition !== null;
  const canSign = selectedCertificate && pin.length >= 4;

  const getStepNumber = (currentStep: SigningStep): number => {
    const steps = { position: 1, 'select-cert': 2, 'enter-pin': 3, signing: 4, success: 4 };
    return steps[currentStep] || 1;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl h-[95vh] flex flex-col">
        <CardHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Assinar Documento Digitalmente - {document.fileName}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={signing}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <Badge variant={step === 'position' ? 'default' : getStepNumber(step) > 1 ? 'default' : 'outline'}>
              1. Posição
            </Badge>
            <div className="flex-1 h-px bg-gray-300"></div>
            <Badge variant={step === 'select-cert' ? 'default' : getStepNumber(step) > 2 ? 'default' : 'outline'}>
              2. Certificado
            </Badge>
            <div className="flex-1 h-px bg-gray-300"></div>
            <Badge variant={step === 'enter-pin' ? 'default' : getStepNumber(step) > 3 ? 'default' : 'outline'}>
              3. PIN
            </Badge>
            <div className="flex-1 h-px bg-gray-300"></div>
            <Badge variant={step === 'signing' || step === 'success' ? 'default' : 'outline'}>
              4. Assinar
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
            {/* Área principal - PDF ou Status */}
            <div className="lg:col-span-2 border-r overflow-hidden">
              {step === 'position' && (
                <PDFSignaturePlacer
                  fileUrl={document.fileUrl}
                  fileName={document.fileName}
                  onPositionSelected={handlePositionSelected}
                  selectedPosition={signaturePosition}
                />
              )}

              {(step === 'select-cert' || step === 'enter-pin') && signaturePosition && (
                <div className="h-full flex items-center justify-center bg-gray-50 p-8">
                  <div className="text-center max-w-md">
                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Posição da Assinatura Definida
                    </h3>
                    <p className="text-gray-600 mb-4">
                      A assinatura será aplicada na página {signaturePosition.page} do documento.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">Página:</span> {signaturePosition.page}
                      </p>
                      <p className="text-sm text-blue-900 mt-1">
                        <span className="font-medium">Dimensões:</span>{' '}
                        {Math.round(signaturePosition.width * 100)}% x {Math.round(signaturePosition.height * 100)}%
                      </p>
                    </div>
                    {step === 'select-cert' && (
                      <Button
                        variant="outline"
                        onClick={() => setStep('position')}
                        className="mt-4"
                      >
                        <MousePointer2 className="w-4 h-4 mr-2" />
                        Redefinir Posição
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {step === 'signing' && (
                <div className="h-full flex items-center justify-center bg-gray-50 p-8">
                  <div className="text-center">
                    <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Assinando documento...
                    </h3>
                    <p className="text-gray-600">
                      Por favor, aguarde. Não feche esta janela.
                    </p>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="h-full flex items-center justify-center bg-gray-50 p-8">
                  <div className="text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Documento assinado com sucesso!
                    </h3>
                    <p className="text-gray-600">
                      A assinatura foi registrada e validada.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Painel lateral - Controles */}
            <div className="lg:col-span-1 p-6 overflow-y-auto bg-gray-50">
              <div className="space-y-6">
                {/* Informações do Documento */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Informações do Documento
                  </h3>
                  <div className="space-y-2 text-sm bg-white p-4 rounded-lg border">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome:</span>
                      <span className="font-medium text-gray-900 truncate ml-2 max-w-[200px]" title={document.fileName}>
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

                {/* Step: Position */}
                {step === 'position' && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                      <MousePointer2 className="w-4 h-4" />
                      Passo 1: Definir Posição
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        Clique e arraste no documento para definir onde a assinatura será colocada.
                      </p>
                    </div>
                    {signaturePosition && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-900">
                              Posição definida!
                            </p>
                            <p className="text-xs text-green-800 mt-1">
                              Página {signaturePosition.page}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step: Select Certificate */}
                {(step === 'select-cert' || step === 'enter-pin') && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Passo 2: Selecionar Certificado
                    </h3>
                    <CertificateSelector
                      certificates={activeCertificates}
                      selectedCertificate={selectedCertificate}
                      onSelect={handleCertificateSelect}
                      loading={loadingCerts}
                    />
                  </div>
                )}

                {/* Step: Enter PIN */}
                {step === 'enter-pin' && selectedCertificate && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Passo 3: Inserir PIN
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

                {/* Assinaturas Existentes */}
                {signatures.length > 0 && (
                  <SignaturesList signatures={signatures} />
                )}

                {/* Botões de Ação */}
                {step !== 'signing' && step !== 'success' && (
                  <div className="flex gap-3 pt-4 border-t">
                    {step === 'position' && (
                      <>
                        <Button variant="outline" onClick={onClose} className="flex-1">
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleContinueToSelectCert}
                          disabled={!canContinue}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Continuar
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </>
                    )}

                    {step === 'select-cert' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setStep('position')}
                          className="flex-1"
                        >
                          Voltar
                        </Button>
                        <Button
                          onClick={() => selectedCertificate && setStep('enter-pin')}
                          disabled={!selectedCertificate}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Continuar
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </>
                    )}

                    {step === 'enter-pin' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setStep('select-cert')}
                          className="flex-1"
                          disabled={signing}
                        >
                          Voltar
                        </Button>
                        <Button
                          onClick={handleSign}
                          disabled={!canSign || signing}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          {signing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Assinando...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Assinar
                            </>
                          )}
                        </Button>
                      </>
                    )}
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
