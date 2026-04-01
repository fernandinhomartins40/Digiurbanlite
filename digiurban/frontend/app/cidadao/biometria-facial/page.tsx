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
            <Badge className="border-sky-200 bg-sky-100 text-sky-700">Cadastro biométrico</Badge>
            <h1 className="text-2xl font-bold text-slate-900">Biometria facial ao vivo</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Cadastre ou atualize sua biometria facial com a câmera do dispositivo. O envio é automático e a validação
              do nível Ouro acontece logo após a sessão terminar.
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
                  <p className="text-sm font-semibold text-slate-900">Fluxo dedicado ao cidadão</p>
                  <p className="text-sm text-slate-600">Cadastro ao vivo com envio e validação automáticos.</p>
                </div>
              </div>

              <div className="space-y-3 text-sm leading-6 text-slate-700">
                <p>
                  Se você já possui biometria confirmada, esta página permite atualizar a captura sem depender do
                  atendimento presencial.
                </p>
                <p>
                  Se ainda não possui cadastro facial, siga apenas a moldura oval na câmera e aguarde a confirmação
                  automática.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {citizen?.name ? `Usuário autenticado: ${citizen.name}.` : 'Cadastro biométrico para cidadão autenticado.'}
              </div>
            </CardContent>
          </Card>

          <FaceBiometryEnrollmentPanel
            title="Cadastro facial ao vivo"
            description="A câmera do dispositivo captura o rosto em vídeo ao vivo, e o sistema envia e valida a biometria automaticamente."
            helperText="Centralize o rosto na moldura oval, mantenha o enquadramento estável e aguarde a captura automática."
            startLabel="Abrir câmera para cadastro"
            retryLabel="Refazer cadastro facial"
            cancelLabel="Fechar câmera"
            onEnroll={async ({ imageBase64, metadata }) => {
              const response = await apiRequest('/citizen/auth/face-biometry', {
                method: 'POST',
                body: JSON.stringify({
                  imageBase64,
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
