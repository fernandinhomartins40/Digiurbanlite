'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import FaceBiometryReadCard from '@/components/common/FaceBiometryReadCard';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';

export default function CitizenFaceReadPage() {
  const { apiRequest, citizen } = useCitizenAuth();

  return (
    <CitizenLayout>
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="space-y-2">
          <Link href="/cidadao/biometria-facial" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Voltar à biometria
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Testar o reconhecimento</h1>
        </div>

        <FaceBiometryReadCard
          title="O sistema reconhece você?"
          description="Uma leitura rápida confere se o seu rosto bate com a biometria cadastrada."
          purposeLabel="Leitura facial do cidadão"
          expectedOwnerLabel={citizen?.name || 'Cidadão autenticado'}
          getChallenge={async () => {
            const response = await apiRequest('/citizen/auth/face-biometry/challenge', {
              method: 'POST',
              body: JSON.stringify({ mode: 'read' }),
            });
            return response.data;
          }}
          onRead={async ({ frames, challengeId }) => {
            const response = await apiRequest('/citizen/auth/face-biometry/read', {
              method: 'POST',
              body: JSON.stringify({ frames, challengeId }),
            });

            return response.data;
          }}
        />
      </div>
    </CitizenLayout>
  );
}
