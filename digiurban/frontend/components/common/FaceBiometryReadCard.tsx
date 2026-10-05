'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  UserRoundSearch,
} from 'lucide-react';
import FaceCameraCapture, {
  type FaceCaptureSessionMetadata,
  type FaceChallengeDirection,
} from '@/components/common/FaceCameraCapture';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FaceReadIdentityOwner {
  id: string;
  name: string;
  cpf?: string | null;
}

interface FaceReadResult {
  recognized: boolean;
  matchStatus: 'MATCHED' | 'REVIEW_REQUIRED' | 'UNMATCHED';
  confidence: number;
  reviewReason?: string | null;
  belongsToExpectedCitizen?: boolean | null;
  provider?: string | null;
  modelName?: string | null;
  modelVersion?: string | null;
  livenessScore?: number | null;
  liveness?: { passed: boolean; score: number; reasons?: string[] } | null;
  identity?: {
    id: string;
    citizenId?: string | null;
    citizen?: FaceReadIdentityOwner | null;
    person?: FaceReadIdentityOwner | null;
  } | null;
}

interface FaceBiometryReadCardProps {
  title: string;
  description: string;
  purposeLabel?: string;
  getChallenge: () => Promise<{ challengeId: string; direction: FaceChallengeDirection }>;
  onRead: (payload: {
    frames: string[];
    challengeId: string;
    metadata: FaceCaptureSessionMetadata;
  }) => Promise<FaceReadResult>;
  disabled?: boolean;
  expectedOwnerLabel?: string;
}

function maskCpf(value?: string | null) {
  // o servidor já devolve o CPF mascarado
  return value || 'CPF não disponível';
}

function getOwner(result: FaceReadResult) {
  return result.identity?.citizen || result.identity?.person || null;
}

export function FaceBiometryReadCard({
  title,
  description,
  purposeLabel = 'Leitura biométrica ao vivo',
  getChallenge,
  onRead,
  disabled = false,
  expectedOwnerLabel,
}: FaceBiometryReadCardProps) {
  const lastProcessedSessionRef = useRef<string | null>(null);
  const [capturedImage, setCapturedImage] = useState('');
  const [captureMetadata, setCaptureMetadata] = useState<FaceCaptureSessionMetadata | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FaceReadResult | null>(null);

  useEffect(() => {
    if (!captureMetadata?.sessionId || !capturedImage || disabled || reading) {
      return;
    }

    if (lastProcessedSessionRef.current === captureMetadata.sessionId) {
      return;
    }

    lastProcessedSessionRef.current = captureMetadata.sessionId;

    const executeRead = async () => {
      try {
        setReading(true);
        setError(null);
        const response = await onRead({
          frames: captureMetadata.frames,
          challengeId: captureMetadata.challengeId,
          metadata: captureMetadata,
        });
        setResult(response);
      } catch (readError: any) {
        lastProcessedSessionRef.current = null;
        const readableMessage =
          readError?.response?.data?.message ||
          readError?.response?.data?.error ||
          readError?.message ||
          'Não foi possível concluir a leitura biométrica ao vivo.';

        console.error('Erro ao executar leitura biométrica:', readableMessage, readError?.response?.data || readError);
        setError(readableMessage);
      } finally {
        setReading(false);
      }
    };

    void executeRead();
  }, [capturedImage, captureMetadata, disabled, onRead, reading]);

  const owner = result ? getOwner(result) : null;
  const isMatched = result?.matchStatus === 'MATCHED';
  const isReview = result?.matchStatus === 'REVIEW_REQUIRED';
  const matchesExpectedOwner = result?.belongsToExpectedCitizen !== false;
  const canShowOwner = Boolean(owner && matchesExpectedOwner);
  const displayedOwner = canShowOwner ? owner : null;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
          <UserRoundSearch className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <p className="text-sm text-slate-600">{description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <FaceCameraCapture
          getChallenge={getChallenge}
          value={capturedImage}
          onChange={(value) => {
            setCapturedImage(value);
            setResult(null);
            setError(null);
          }}
          onMetadataChange={(metadata) => {
            setCaptureMetadata(metadata);
            if (!metadata) {
              lastProcessedSessionRef.current = null;
            }
          }}
          disabled={disabled || reading}
          purposeLabel={purposeLabel}
          startLabel={result || error ? 'Ler de novo' : 'Abrir câmera'}
          retryLabel="Ler de novo"
          requireFaceApi
        />

        {!result && !reading && !error && (
          <p className="text-sm leading-6 text-slate-600">
            A câmera abre em tela cheia. Olhe de frente, vire o rosto para o lado pedido e volte — o resultado aparece aqui.
            {expectedOwnerLabel ? ` Esperado: ${expectedOwnerLabel}.` : ''}
          </p>
        )}

        {reading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Conferindo o rosto...
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {result && !reading && (
          <div
            className={`rounded-3xl border px-5 py-5 ${
              isMatched
                ? 'border-emerald-200 bg-emerald-50'
                : isReview
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-rose-200 bg-rose-50'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={
                  isMatched
                    ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                    : isReview
                      ? 'border-amber-200 bg-amber-100 text-amber-800'
                      : 'border-rose-200 bg-rose-100 text-rose-800'
                }
              >
                {isMatched ? 'Reconhecimento confirmado' : isReview ? 'Possível correspondência' : 'Sem correspondência'}
              </Badge>
              <Badge className="border-slate-200 bg-white text-slate-700">
                Confiança {Math.round((result.confidence || 0) * 100)}%
              </Badge>
              {result.liveness && (
                <Badge className="border-slate-200 bg-white text-slate-700">
                  {result.liveness.passed ? 'Prova de vida confirmada' : 'Prova de vida não confirmada'}
                </Badge>
              )}
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {displayedOwner ? (
                <>
                  <div className="flex items-start gap-3">
                    {isMatched ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                    ) : isReview ? (
                      <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
                    ) : (
                      <ShieldAlert className="mt-0.5 h-5 w-5 text-rose-600" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{displayedOwner.name}</p>
                      <p>CPF: {maskCpf(displayedOwner.cpf)}</p>
                    </div>
                  </div>

                  {typeof result.belongsToExpectedCitizen === 'boolean' && (
                    <div
                      className={`rounded-2xl border px-4 py-3 ${
                        result.belongsToExpectedCitizen
                          ? 'border-emerald-200 bg-white text-emerald-700'
                          : 'border-rose-200 bg-white text-rose-700'
                      }`}
                    >
                      {result.belongsToExpectedCitizen
                        ? 'A biometria reconhecida pertence ao usuário esperado.'
                        : 'A biometria reconhecida não pertence ao usuário esperado.'}
                    </div>
                  )}
                </>
              ) : result?.belongsToExpectedCitizen === false ? (
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-rose-600" />
                  <p>A biometria lida não pertence ao cidadão em atendimento.</p>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-rose-600" />
                  <p>Nenhuma biometria cadastrada foi reconhecida nesta leitura ao vivo.</p>
                </div>
              )}

              {result.reviewReason && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600">
                  {result.reviewReason}
                </div>
              )}

              {result.liveness && !result.liveness.passed && (result.liveness.reasons || []).length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Como acertar na próxima tentativa</span>
                  </div>
                  <ul className="mt-1 list-disc pl-5 text-slate-600">
                    {(result.liveness.reasons || []).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FaceBiometryReadCard;
