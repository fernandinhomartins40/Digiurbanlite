'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Loader2, ScanFace, ShieldCheck } from 'lucide-react';
import FaceCameraCapture, {
  type FaceCaptureSessionMetadata,
  type FaceChallengeDirection,
} from '@/components/common/FaceCameraCapture';
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
  purposeLabel?: string;
  requireFaceApi?: boolean;
  startLabel: string;
  retryLabel: string;
  cancelLabel: string;
  disabled?: boolean;
  successMessage?: string;
  /** Pede ao servidor o desafio da prova de vida */
  getChallenge: () => Promise<{ challengeId: string; direction: FaceChallengeDirection }>;
  /**
   * Termo de consentimento (LGPD). Quando informado, a câmera só abre depois
   * do aceite e o aceite vai junto no envio.
   */
  consent?: { title: string; body: ReactNode; checkboxLabel: string };
  /** Campos extras exigidos antes de abrir a câmera (ex.: responsável do aluno) */
  readyToCapture?: boolean;
  onEnroll: (payload: {
    frames: string[];
    challengeId: string;
    metadata: FaceCaptureSessionMetadata;
    consentAccepted: boolean;
  }) => Promise<{ message?: string } | void>;
  onSuccess?: (response: { message?: string } | void) => void;
  className?: string;
}

export function FaceBiometryEnrollmentPanel({
  title,
  description,
  helperText = 'Abra a câmera, mantenha apenas uma pessoa no quadro e aguarde o envio automático.',
  purposeLabel = 'Cadastro facial ao vivo',
  requireFaceApi = true,
  startLabel,
  retryLabel,
  cancelLabel,
  disabled = false,
  successMessage = 'Biometria facial enviada com sucesso.',
  getChallenge,
  consent,
  readyToCapture = true,
  onEnroll,
  onSuccess,
  className = '',
}: FaceBiometryEnrollmentPanelProps) {
  const lastSubmittedSessionRef = useRef<string | null>(null);
  const [capturedImage, setCapturedImage] = useState('');
  const [captureMetadata, setCaptureMetadata] = useState<FaceCaptureSessionMetadata | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<PanelMessage>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const blockedByConsent = Boolean(consent) && !consentAccepted;

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
          frames: captureMetadata.frames,
          challengeId: captureMetadata.challengeId,
          metadata: captureMetadata,
          consentAccepted,
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
        const readableMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          'Não foi possível concluir o cadastro biométrico.';
        setMessage({
          type: 'error',
          text: readableMessage,
        });
      } finally {
        setSubmitting(false);
      }
    };

    void submit();
  }, [capturedImage, captureMetadata, consentAccepted, disabled, onEnroll, onSuccess, submitting, successMessage]);

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
            {purposeLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          {helperText}
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">1. Abrir câmera</p>
            <p className="mt-1">Inicie a sessão ao vivo no dispositivo atual.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">2. Seguir as instruções</p>
            <p className="mt-1">De frente, vire o rosto para o lado pedido e volte de frente.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">3. Conferência no servidor</p>
            <p className="mt-1">O sistema confere se é uma pessoa ao vivo e cadastra.</p>
          </div>
        </div>

        {consent && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{consent.title}</p>
            <div className="mt-2 space-y-2 leading-6">{consent.body}</div>
            <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={consentAccepted}
                onChange={(event) => setConsentAccepted(event.target.checked)}
                disabled={submitting}
              />
              <span className="font-medium text-slate-900">{consent.checkboxLabel}</span>
            </label>
          </div>
        )}

        <FaceCameraCapture
          getChallenge={getChallenge}
          value={capturedImage}
          onChange={(value) => {
            setCapturedImage(value);
            setMessage(null);
          }}
          onMetadataChange={setCaptureMetadata}
          disabled={disabled || submitting || blockedByConsent || !readyToCapture}
          purposeLabel={purposeLabel}
          startLabel={blockedByConsent ? 'Aceite o termo para continuar' : startLabel}
          retryLabel={retryLabel}
          cancelLabel={cancelLabel}
          showDetailedStatus={false}
          requireFaceApi={requireFaceApi}
        />

        {submitting && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Conferindo a prova de vida e cadastrando...
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
