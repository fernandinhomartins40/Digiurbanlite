'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ScanFace, ShieldCheck } from 'lucide-react';
import FaceCameraCapture, { type FaceCaptureSessionMetadata } from '@/components/common/FaceCameraCapture';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PanelMessage = {
  type: 'success' | 'error' | 'info';
  text: string;
} | null;

interface FaceBiometryEnrollmentPanelProps {
  title: string;
  description: string;
  helperText?: string;
  startLabel: string;
  retryLabel: string;
  cancelLabel: string;
  disabled?: boolean;
  successMessage?: string;
  onEnroll: (payload: {
    imageBase64: string;
    metadata: FaceCaptureSessionMetadata;
  }) => Promise<{ message?: string } | void>;
  onSuccess?: (response: { message?: string } | void) => void;
  className?: string;
}

export function FaceBiometryEnrollmentPanel({
  title,
  description,
  helperText = 'A captura é enviada automaticamente assim que o vídeo ao vivo é concluído.',
  startLabel,
  retryLabel,
  cancelLabel,
  disabled = false,
  successMessage = 'Biometria facial enviada com sucesso.',
  onEnroll,
  onSuccess,
  className = '',
}: FaceBiometryEnrollmentPanelProps) {
  const lastSubmittedSessionRef = useRef<string | null>(null);
  const [capturedImage, setCapturedImage] = useState('');
  const [captureMetadata, setCaptureMetadata] = useState<FaceCaptureSessionMetadata | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<PanelMessage>(null);

  useEffect(() => {
    const sessionId = captureMetadata?.sessionId;

    if (!sessionId || !capturedImage || disabled || submitting) {
      return;
    }

    if (lastSubmittedSessionRef.current === sessionId) {
      return;
    }

    lastSubmittedSessionRef.current = sessionId;

    const submit = async () => {
      try {
        setSubmitting(true);
        setMessage(null);

        const response = await onEnroll({
          imageBase64: capturedImage,
          metadata: captureMetadata,
        });

        setMessage({
          type: 'success',
          text: response?.message || successMessage,
        });
        setCapturedImage('');
        setCaptureMetadata(null);
        onSuccess?.(response);
      } catch (error: any) {
        lastSubmittedSessionRef.current = null;
        setMessage({
          type: 'error',
          text: error?.message || 'Não foi possível concluir o cadastro biométrico.',
        });
      } finally {
        setSubmitting(false);
      }
    };

    void submit();
  }, [capturedImage, captureMetadata, disabled, onEnroll, onSuccess, submitting, successMessage]);

  return (
    <Card className={`border-blue-100 ${className}`.trim()}>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanFace className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <Badge className="border-sky-200 bg-sky-100 text-sky-700">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            Envio automático
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          {helperText}
        </p>

        <FaceCameraCapture
          value={capturedImage}
          onChange={(value) => {
            setCapturedImage(value);
            setMessage(null);
          }}
          onMetadataChange={setCaptureMetadata}
          disabled={disabled || submitting}
          startLabel={startLabel}
          retryLabel={retryLabel}
          cancelLabel={cancelLabel}
          showDetailedStatus={false}
        />

        {captureMetadata && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Sessão concluída com qualidade de {Math.round(captureMetadata.qualityScore * 100)}% e prova de presença de{' '}
            {Math.round(captureMetadata.livenessScore * 100)}%.
          </div>
        )}

        {submitting && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando a biometria automaticamente...
            </span>
          </div>
        )}

        {message && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : message.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FaceBiometryEnrollmentPanel;
