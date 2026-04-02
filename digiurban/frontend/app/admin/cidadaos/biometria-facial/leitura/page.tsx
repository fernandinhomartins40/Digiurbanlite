'use client';

import Link from 'next/link';
import { ShieldAlert, ScanFace } from 'lucide-react';
import FaceBiometryReadCard from '@/components/common/FaceBiometryReadCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import facePlatformService from '@/lib/services/face-platform.service';

export default function AdminCitizenFaceReadPage() {
  const { loading: authLoading } = useAdminAuth();
  const { hasPermission } = useAdminPermissions();
  const canVerify = !authLoading && hasPermission('citizens:verify');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            <ScanFace className="h-3.5 w-3.5" />
            Leitura biométrica
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Leitura biométrica de cidadãos</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Faça uma leitura facial ao vivo para verificar se a biometria cadastrada está reconhecendo o cidadão
            correto.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/admin/atendimento-presencial/biometria-facial">
            Voltar ao cadastro presencial
          </Link>
        </Button>
      </div>

      {!authLoading && !canVerify && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-amber-800">
            <ShieldAlert className="h-5 w-5" />
            Seu usuário não possui permissão para executar leituras biométricas de cidadãos.
          </CardContent>
        </Card>
      )}

      <FaceBiometryReadCard
        title="Leitura biométrica ao vivo"
        description="A captura é enviada automaticamente ao serviço facial e retorna o cidadão reconhecido, junto com o grau de confiança da correspondência."
        purposeLabel="Leitura presencial"
        disabled={!canVerify}
      onRead={async ({ imageBase64, metadata, embedding, modelName, modelVersion }) =>
        facePlatformService.readBiometry({
          imageBase64,
          embedding,
          modelName,
          modelVersion,
          sourceType: 'ADMIN_LIVE_READ',
          sourceLabel: 'Leitura biométrica ao vivo pelo painel administrativo',
          qualityScore: metadata.qualityScore,
            livenessScore: metadata.livenessScore,
            metadata,
          })
        }
      />
    </div>
  );
}
