'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import FaceBiometryReadCard from '@/components/common/FaceBiometryReadCard';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function CitizenFaceReadPage() {
  const { apiRequest, citizen } = useCitizenAuth();

  return (
    <CitizenLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge className="border-sky-200 bg-sky-100 text-sky-700">Teste de reconhecimento</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Leitura da biometria facial</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Faça uma leitura ao vivo para verificar se a biometria cadastrada está reconhecendo corretamente.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href="/cidadao/biometria-facial">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao cadastro facial
            </Link>
          </Button>
        </div>

        <FaceBiometryReadCard
          title="Teste de reconhecimento ao vivo"
          description="A sessão compara sua leitura atual com a biometria facial cadastrada na base do Digiurban e exibe a quem ela pertence."
          purposeLabel="Leitura facial do cidadão"
          expectedOwnerLabel={citizen?.name || 'Cidadão autenticado'}
          onRead={async ({ imageBase64, metadata, embedding, modelName, modelVersion }) => {
            const response = await apiRequest('/citizen/auth/face-biometry/read', {
              method: 'POST',
              body: JSON.stringify({
                imageBase64,
                embedding,
                modelName,
                modelVersion,
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
