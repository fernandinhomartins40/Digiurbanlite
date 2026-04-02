'use client';

import Link from 'next/link';
import { useCitizenAuth } from '@/contexts/CitizenAuthContext';
import { CitizenLayout } from '@/components/citizen/CitizenLayout';
import { FaceBiometryEnrollmentPanel } from '@/components/common/FaceBiometryEnrollmentPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScanFace, ShieldCheck, UserRoundSearch } from 'lucide-react';

export default function CitizenFaceBiometryPage() {
  const { citizen, apiRequest, refreshCitizenData } = useCitizenAuth();

  return (
    <CitizenLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <Badge className="border-sky-200 bg-sky-100 text-sky-700">Biometria ao vivo</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Cadastro facial do cidadão</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Use a câmera do dispositivo para cadastrar ou atualizar sua biometria facial. O envio é automático e o
              resumo da sessão fica disponível logo ao final.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/cidadao/perfil">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Voltar ao perfil
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/cidadao/biometria-facial/leitura">
                <UserRoundSearch className="mr-2 h-4 w-4" />
                Testar leitura
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <Card className="border-sky-100 bg-white/90">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <ScanFace className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Fluxo do cidadão</p>
                  <p className="text-sm text-slate-600">Cadastro ao vivo, com envio automático e leitura opcional.</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">Antes de começar</p>
                  <p className="mt-1">Mantenha apenas o rosto no quadro e fique parado por alguns segundos.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-medium text-slate-900">Depois do envio</p>
                  <p className="mt-1">Você verá o resumo da sessão e poderá testar a leitura quando quiser.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {citizen?.name ? `Usuário autenticado: ${citizen.name}.` : 'Cadastro biométrico para cidadão autenticado.'}
              </div>
            </CardContent>
          </Card>

          <FaceBiometryEnrollmentPanel
            title="Cadastro facial ao vivo"
            description="A câmera do dispositivo captura o rosto em vídeo ao vivo e envia a biometria automaticamente."
            helperText="Abra a câmera, mantenha apenas uma pessoa no quadro e aguarde o envio automático."
            purposeLabel="Cadastro facial do cidadão"
            startLabel="Abrir câmera"
            retryLabel="Refazer biometria"
            cancelLabel="Fechar câmera"
            onEnroll={async ({ imageBase64, metadata, embedding, modelName, modelVersion }) => {
              const response = await apiRequest('/citizen/auth/face-biometry', {
                method: 'POST',
                body: JSON.stringify({
                  imageBase64,
                  embedding,
                  modelName,
                  modelVersion,
                  sourceLabel: 'Biometria facial por vídeo ao vivo no painel do cidadão',
                  qualityScore: metadata.qualityScore,
                  livenessScore: metadata.livenessScore,
                  metadata,
                }),
              });

              await refreshCitizenData();
              return response.data;
            }}
          />
        </div>
      </div>
    </CitizenLayout>
  );
}
