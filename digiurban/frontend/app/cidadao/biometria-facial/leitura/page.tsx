'use client';

import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import FaceBiometryReadCard from '@/components/common/FaceBiometryReadCard';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';

export default function CitizenFaceReadPage() {
  const { apiRequest, citizen } = useCitizenAuth();

  return (
    <CitizenLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Leitura da Biometria Facial</h1>
          <p className="text-sm text-slate-600">
            Faça uma leitura ao vivo para verificar se a biometria cadastrada está reconhecendo corretamente.
          </p>
        </div>

        <FaceBiometryReadCard
          title="Teste de reconhecimento ao vivo"
          description="A sessão compara sua leitura atual com a biometria facial cadastrada na base do Digiurban e exibe a quem ela pertence."
          expectedOwnerLabel={citizen?.name || 'Cidadão autenticado'}
          onRead={async ({ imageBase64, metadata }) => {
            const response = await apiRequest('/citizen/auth/face-biometry/read', {
              method: 'POST',
              body: JSON.stringify({
                imageBase64,
                qualityScore: metadata.qualityScore,
                livenessScore: metadata.livenessScore,
                metadata,
              }),
            });

            return response.data;
          }}
        />
      </div>
    </CitizenLayout>
  );
}
