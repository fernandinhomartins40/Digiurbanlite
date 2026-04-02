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
import FaceCameraCapture, { type FaceCaptureSessionMetadata } from '@/components/common/FaceCameraCapture';
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
  onRead: (payload: {
    imageBase64: string;
    metadata: FaceCaptureSessionMetadata;
    embedding?: number[] | null;
    modelName?: string;
    modelVersion?: string;
    detectedFacesCount?: number;
  }) => Promise<FaceReadResult>;
  disabled?: boolean;
  expectedOwnerLabel?: string;
}

function maskCpf(value?: string | null) {
  if (!value) {
    return 'CPF não disponível';
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) {
    return value;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function getOwner(result: FaceReadResult) {
  return result.identity?.citizen || result.identity?.person || null;
}

export function FaceBiometryReadCard({
  title,
  description,
  purposeLabel = 'Leitura biométrica ao vivo',
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
          imageBase64: capturedImage,
          metadata: captureMetadata,
          embedding: captureMetadata.embedding || null,
          modelName: captureMetadata.modelProvider,
          modelVersion: captureMetadata.modelVersion,
          detectedFacesCount: captureMetadata.detectedFacesCount,
        });
        setResult(response);
      } catch (readError: any) {
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

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
          <UserRoundSearch className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <p className="text-sm text-slate-600">{description}</p>
        <Badge className="w-fit border-sky-200 bg-sky-100 text-sky-700">
          {purposeLabel}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <FaceCameraCapture
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
          showDetailedStatus={false}
        />

        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          A leitura é enviada automaticamente assim que a sessão ao vivo termina.
          {expectedOwnerLabel ? ` Comparação esperada: ${expectedOwnerLabel}.` : ''}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">1. Abrir câmera</p>
            <p className="mt-1">Inicie a leitura no dispositivo atual.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">2. Centralizar rosto</p>
            <p className="mt-1">Deixe apenas um rosto na moldura oval.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">3. Ver resultado</p>
            <p className="mt-1">O sistema mostra quem foi reconhecido.</p>
          </div>
        </div>

        {reading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando a leitura biométrica e comparando com a base cadastrada...
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
              {captureMetadata && (
                <Badge className="border-slate-200 bg-white text-slate-700">
                  Presença {Math.round(captureMetadata.livenessScore * 100)}%
                </Badge>
              )}
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {owner ? (
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
                      <p className="font-semibold text-slate-900">{owner.name}</p>
                      <p>CPF: {maskCpf(owner.cpf)}</p>
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

              {captureMetadata && (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Resumo da sessão ao vivo</span>
                  </div>
                  <p className="mt-1 text-slate-600">
                    Qualidade {Math.round(captureMetadata.qualityScore * 100)}%, presença{' '}
                    {Math.round(captureMetadata.livenessScore * 100)}% e desafio concluído em vídeo ao vivo com{' '}
                    {captureMetadata.modelProvider}. Rostos detectados: {captureMetadata.detectedFacesCount}.
                  </p>
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
