'use client';

/**
 * Cadastro da biometria facial em passo a passo:
 *   1. Autorização (termo, quando houver)  2. Preparar  3. Câmera  4. Pronto
 * Uma coisa por tela. A câmera abre em tela cheia (FaceCameraCapture) e o envio
 * ao servidor é automático quando a captura termina.
 */

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CircleAlert, Loader2, ScanFace, Sun, UserRound } from 'lucide-react';
import FaceCameraCapture, {
  type FaceCaptureSessionMetadata,
  type FaceChallengeDirection,
} from '@/components/common/FaceCameraCapture';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

const TIPS = [
  { icon: Sun, title: 'Lugar iluminado', text: 'De preferência com a luz batendo no rosto.' },
  { icon: ScanFace, title: 'Rosto à mostra', text: 'Sem óculos escuros, boné ou máscara.' },
  { icon: UserRound, title: 'Só uma pessoa', text: 'Apenas quem vai cadastrar aparece na câmera.' },
];

export function FaceBiometryEnrollmentPanel({
  title,
  description,
  helperText,
  purposeLabel = 'Cadastro facial',
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
  const [consentConfirmed, setConsentConfirmed] = useState(false);

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
        // volta para o botão da câmera, pronto para tentar de novo
        setCapturedImage('');
        setCaptureMetadata(null);
      } finally {
        setSubmitting(false);
      }
    };

    void submit();
  }, [capturedImage, captureMetadata, consentAccepted, disabled, onEnroll, onSuccess, submitting, successMessage]);

  const stepLabels = consent ? ['Autorização', 'Preparar', 'Câmera', 'Pronto'] : ['Preparar', 'Câmera', 'Pronto'];
  const offset = consent ? 1 : 0;
  const done = message?.type === 'success' && !submitting;
  const onConsentStep = Boolean(consent) && !consentConfirmed && !done && !submitting;
  const currentStep = done ? offset + 2 : submitting ? offset + 1 : onConsentStep ? 0 : offset;

  return (
    <Card className={cn('border-slate-200', className)}>
      <CardContent className="space-y-6 p-5 sm:p-7">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>

        {/* passos */}
        <ol className="flex items-center gap-2" aria-label={purposeLabel}>
          {stepLabels.map((label, index) => {
            const isDone = index < currentStep || done;
            const isCurrent = index === currentStep && !done;
            return (
              <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className={cn('h-1.5 rounded-full', isDone ? 'bg-emerald-500' : isCurrent ? 'bg-blue-600' : 'bg-slate-200')} />
                <span
                  className={cn(
                    'truncate text-xs font-medium',
                    isDone ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-400'
                  )}
                >
                  {index + 1}. {label}
                </span>
              </li>
            );
          })}
        </ol>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-9 w-9" strokeWidth={3} />
            </div>
            <p className="text-lg font-semibold text-slate-900">Tudo certo!</p>
            <p className="max-w-md text-sm leading-6 text-slate-600">{message?.text}</p>
          </div>
        ) : submitting ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-lg font-semibold text-slate-900">Conferindo...</p>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Estamos confirmando que é uma pessoa de verdade na câmera e fazendo o cadastro. Leva alguns segundos.
            </p>
          </div>
        ) : onConsentStep && consent ? (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-slate-900">{consent.title}</p>
              <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                {consent.body}
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0"
                checked={consentAccepted}
                onChange={(event) => setConsentAccepted(event.target.checked)}
                disabled={disabled}
              />
              <span className="font-medium text-slate-900">{consent.checkboxLabel}</span>
            </label>
            {!readyToCapture && (
              <p className="text-sm text-amber-700">Preencha os dados pedidos acima para continuar.</p>
            )}
            <Button
              type="button"
              size="lg"
              className="h-12 w-full text-base"
              disabled={disabled || !consentAccepted || !readyToCapture}
              onClick={() => setConsentConfirmed(true)}
            >
              Continuar
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {message?.type === 'error' && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Não deu certo desta vez</p>
                  <p className="mt-0.5">{message.text}</p>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              {TIPS.map(({ icon: Icon, title: tipTitle, text }) => (
                <div key={tipTitle} className="flex items-start gap-3 sm:flex-col sm:gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tipTitle}</p>
                    <p className="text-sm leading-5 text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm leading-6 text-slate-600">
              {helperText || 'A câmera vai abrir em tela cheia. Olhe de frente, vire o rosto para o lado pedido e volte. Leva poucos segundos.'}
            </p>

            <FaceCameraCapture
              getChallenge={getChallenge}
              value={capturedImage}
              onChange={(value) => {
                setCapturedImage(value);
                if (value) setMessage(null);
              }}
              onMetadataChange={setCaptureMetadata}
              disabled={disabled || !readyToCapture}
              purposeLabel={purposeLabel}
              startLabel={message?.type === 'error' ? 'Tentar de novo' : startLabel}
              retryLabel={retryLabel}
              cancelLabel={cancelLabel}
              requireFaceApi={requireFaceApi}
            />

            {consent && (
              <button
                type="button"
                onClick={() => setConsentConfirmed(false)}
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao termo
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FaceBiometryEnrollmentPanel;
