'use client';

import { ShieldAlert } from 'lucide-react';
import FaceBiometryReadCard from '@/components/common/FaceBiometryReadCard';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext';
import facePlatformService from '@/lib/services/face-platform.service';

export default function AdminCitizenFaceReadPage() {
  const { loading: authLoading } = useAdminAuth();
  const { hasPermission } = useAdminPermissions();
  const canVerify = !authLoading && hasPermission('citizens:verify');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Leitura Biométrica de Cidadãos</h1>
        <p className="text-sm text-slate-600">
          Faça uma leitura facial ao vivo para verificar se a biometria cadastrada está reconhecendo o cidadão correto.
        </p>
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
        disabled={!canVerify}
        onRead={async ({ imageBase64, metadata }) =>
          facePlatformService.readBiometry({
            imageBase64,
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
